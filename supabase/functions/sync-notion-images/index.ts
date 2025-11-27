/**
 * @file sync-notion-images/index.ts
 * @description 음식 이미지 Notion 자동 동기화 Edge Function
 *
 * 성공한 음식 이미지 중 상위 품질의 이미지를 선별하여 Notion 데이터베이스에 기록합니다.
 * 일일 1회 실행을 권장하며, Notion API rate limit을 준수합니다.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client } from "https://esm.sh/@notionhq/client@2";

interface SyncNotionImagesRequest {
  qualityThreshold?: number; // 품질 점수 임계치 (기본값: 75)
  maxImages?: number; // 최대 동기화 이미지 수 (기본값: 10)
  forceSync?: boolean; // 강제 동기화 (이미 동기화된 것도 다시)
}

interface SyncNotionImagesResponse {
  success: boolean;
  syncedImages: number;
  skippedImages: number;
  errors: string[];
  executionTimeMs: number;
}

// 환경 변수 검증
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const NOTION_API_KEY = Deno.env.get("NOTION_API_KEY");
const NOTION_DATABASE_ID = Deno.env.get("NOTION_DATABASE_ID");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Supabase environment variables are required");
}
if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
  throw new Error("Notion environment variables are required");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const notion = new Client({ auth: NOTION_API_KEY });

Deno.serve(async (req: Request): Promise<Response> => {
  const startTime = Date.now();

  console.log("🗂️ sync-notion-images 시작:", new Date().toISOString());

  try {
    const params: SyncNotionImagesRequest = req.method === "POST"
      ? await req.json().catch(() => ({}))
      : {};

    const result = await syncNotionImages(params);
    const executionTime = Date.now() - startTime;

    console.log(`✅ 동기화 완료: ${executionTime}ms`);

    return new Response(
      JSON.stringify({ ...result, executionTimeMs: executionTime }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ 동기화 실패:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        syncedImages: 0,
        skippedImages: 0,
        errors: [error.message],
        executionTimeMs: Date.now() - startTime
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

/**
 * Notion 동기화 메인 로직
 */
async function syncNotionImages(params: SyncNotionImagesRequest): Promise<SyncNotionImagesResponse> {
  const qualityThreshold = params.qualityThreshold ?? 75;
  const maxImages = params.maxImages ?? 10;

  console.log(`품질 임계치: ${qualityThreshold}, 최대 동기화: ${maxImages}개`);

  try {
    // 동기화할 이미지 선택
    const imagesToSync = await selectImagesForNotionSync(qualityThreshold, maxImages, params.forceSync);

    if (imagesToSync.length === 0) {
      console.log("동기화할 이미지가 없습니다.");
      return { success: true, syncedImages: 0, skippedImages: 0, errors: [] };
    }

    console.log(`${imagesToSync.length}개 이미지 동기화 예정`);

    let syncedImages = 0;
    let skippedImages = 0;
    const errors: string[] = [];

    // 각 이미지별로 Notion에 기록
    for (const image of imagesToSync) {
      try {
        console.log(`📝 Notion 기록: ${image.food_name}`);

        // 이미 Notion에 존재하는지 확인
        const existingPage = await findExistingNotionPage(image.food_id);

        if (existingPage && !params.forceSync) {
          console.log(`⏭️ 이미 존재하므로 건너뜀: ${image.food_name}`);
          skippedImages++;
          continue;
        }

        // Notion 페이지 생성 또는 업데이트
        await createOrUpdateNotionPage(image, existingPage?.id);
        syncedImages++;

        // Rate limit 준수를 위한 대기 (Notion API는 분당 3회 제한)
        await wait(1000); // 1초 대기

      } catch (error) {
        const errorMsg = `${image.food_name} 동기화 실패: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return {
      success: errors.length === 0,
      syncedImages,
      skippedImages,
      errors
    };

  } catch (error) {
    return {
      success: false,
      syncedImages: 0,
      skippedImages: 0,
      errors: [error.message]
    };
  }
}

/**
 * Notion 동기화할 이미지 선택
 */
async function selectImagesForNotionSync(
  qualityThreshold: number,
  maxImages: number,
  forceSync = false
): Promise<any[]> {
  // 최근 7일간 생성된 고품질 이미지 중 상위 N개 선택
  const { data, error } = await supabase
    .rpc('get_top_quality_images_for_notion', {
      quality_threshold: qualityThreshold,
      max_images: maxImages,
      days_back: 7
    });

  if (error) {
    // RPC 함수가 없으면 직접 쿼리
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("food_images")
      .select(`
        id,
        food_id,
        quality_score,
        storage_path_original,
        storage_path_thumbnail,
        created_at,
        foods!inner(name, category)
      `)
      .gte("quality_score", qualityThreshold)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("quality_score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(maxImages);

    if (fallbackError) throw fallbackError;

    return (fallbackData || []).map(item => ({
      id: item.id,
      food_id: item.food_id,
      food_name: item.foods.name,
      category: item.foods.category,
      quality_score: item.quality_score,
      storage_path_original: item.storage_path_original,
      storage_path_thumbnail: item.storage_path_thumbnail,
      created_at: item.created_at
    }));
  }

  return data || [];
}

/**
 * 기존 Notion 페이지 찾기
 */
async function findExistingNotionPage(foodId: string): Promise<any | null> {
  try {
    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter: {
        property: "음식 ID",
        rich_text: {
          equals: foodId
        }
      }
    });

    return response.results[0] || null;
  } catch (error) {
    console.warn("Notion 페이지 검색 실패:", error.message);
    return null;
  }
}

/**
 * Notion 페이지 생성 또는 업데이트
 */
async function createOrUpdateNotionPage(imageData: any, existingPageId?: string): Promise<void> {
  const pageData = buildNotionPageData(imageData);

  if (existingPageId) {
    // 기존 페이지 업데이트
    await notion.pages.update({
      page_id: existingPageId,
      properties: pageData.properties
    });
    console.log(`📝 Notion 페이지 업데이트: ${imageData.food_name}`);
  } else {
    // 새 페이지 생성
    await notion.pages.create({
      parent: { database_id: NOTION_DATABASE_ID },
      properties: pageData.properties,
      children: pageData.children
    });
    console.log(`📝 Notion 페이지 생성: ${imageData.food_name}`);
  }
}

/**
 * Notion 페이지 데이터 구성
 */
function buildNotionPageData(imageData: any) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace('/rest/v1', '');
  const originalUrl = `${supabaseUrl}/storage/v1/object/public/food-images/${imageData.storage_path_original}`;
  const thumbnailUrl = `${supabaseUrl}/storage/v1/object/public/food-images/${imageData.storage_path_thumbnail}`;

  return {
    properties: {
      "이름": {
        title: [{ text: { content: `${imageData.food_name} (${imageData.category})` } }]
      },
      "음식 ID": {
        rich_text: [{ text: { content: imageData.food_id } }]
      },
      "품질 점수": {
        number: imageData.quality_score
      },
      "생성일": {
        date: { start: imageData.created_at.split('T')[0] }
      },
      "카테고리": {
        select: { name: getCategoryDisplayName(imageData.category) }
      },
      "상태": {
        status: { name: "검토 대기" }
      }
    },
    children: [
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ text: { content: "이미지" } }]
        }
      },
      {
        object: "block",
        type: "image",
        image: {
          type: "external",
          external: { url: thumbnailUrl }
        }
      },
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [
            { text: { content: "원본 이미지: " } },
            {
              text: {
                content: "여기에서 보기",
                link: { url: originalUrl }
              },
              annotations: { bold: true }
            }
          ]
        }
      }
    ]
  };
}

/**
 * 카테고리 표시명 변환
 */
function getCategoryDisplayName(category: string): string {
  const categoryNames: Record<string, string> = {
    soup_stew: "국/찌개",
    side_dish: "반찬",
    main: "주요리",
    dessert: "디저트",
    drink: "음료",
    snack: "간식",
    other: "기타"
  };
  return categoryNames[category] || category;
}

/**
 * 대기 함수 (Rate limit 준수용)
 */
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
