/**
 * @file app/api/mfds-recipes/images/[...path]/route.ts
 * @description 식약처 레시피 이미지 제공 API 라우트
 *
 * 로컬 파일이 있으면 로컬 파일을 제공하고,
 * 없으면 식약처 API에서 직접 이미지를 가져옵니다.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { fetchFoodSafetyRecipeBySeq } from "@/lib/recipes/foodsafety-api";

/**
 * 식약처 API에서 이미지 가져오기
 */
async function fetchImageFromApi(imageUrl: string): Promise<Buffer | null> {
  try {
    console.log(`[mfds-recipes/images] 식약처 API에서 이미지 가져오기: ${imageUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "http://www.foodsafetykorea.go.kr/",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[mfds-recipes/images] API 이미지 가져오기 실패: ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`[mfds-recipes/images] API 이미지 가져오기 오류:`, error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    // URL 디코딩 처리 (한글 파일명 지원)
    const decodedSegments = pathSegments.map((segment) =>
      decodeURIComponent(segment)
    );
    const imagePath = decodedSegments.join("/");

    console.log(`[mfds-recipes/images] 요청 경로: ${imagePath}`);

    // 보안: 경로 탐색 공격 방지
    if (imagePath.includes("..")) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    // 전체 경로 구성
    const fullPath = path.join(
      process.cwd(),
      "docs",
      "mfds-recipes",
      "images",
      imagePath
    );

    console.log(`[mfds-recipes/images] 전체 경로: ${fullPath}`);

    let fileBuffer: Buffer | null = null;
    let contentType = "image/jpeg";

    // 1. 로컬 파일이 있으면 사용
    if (fs.existsSync(fullPath)) {
      console.log(`[mfds-recipes/images] 로컬 파일 사용: ${imagePath}`);
      fileBuffer = fs.readFileSync(fullPath);
      const ext = path.extname(fullPath).toLowerCase();
      contentType =
        ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : "image/jpeg";
    } else {
      // 2. 로컬 파일이 없으면 식약처 API에서 가져오기
      console.log(`[mfds-recipes/images] 로컬 파일 없음, 식약처 API에서 가져오기 시도`);
      
      // 파일명에서 RCP_SEQ와 이미지 타입 추출
      // 예: 123_main.jpg -> rcpSeq: 123, imageType: main
      const filename = path.basename(imagePath);
      const match = filename.match(/^(\d+)_(main|mk|manual_\d+)\.jpg$/);
      
      if (match) {
        const [, rcpSeq, imageType] = match;
        
        try {
          // 레시피 데이터를 가져와서 이미지 URL 추출
          const result = await fetchFoodSafetyRecipeBySeq(rcpSeq, {
            startIdx: 1,
            endIdx: 1000,
          });
          
          if (result.success && result.data && result.data.length > 0) {
            const recipe = result.data[0];
            let imageUrl: string | null = null;
            
            if (imageType === "main") {
              imageUrl = recipe.ATT_FILE_NO_MAIN;
            } else if (imageType === "mk") {
              imageUrl = recipe.ATT_FILE_NO_MK;
            } else if (imageType.startsWith("manual_")) {
              const stepNum = imageType.replace("manual_", "");
              const manualImgKey = `MANUAL_IMG${stepNum.padStart(2, "0")}` as keyof typeof recipe;
              imageUrl = (recipe as any)[manualImgKey] as string | null;
            }
            
            if (imageUrl) {
              fileBuffer = await fetchImageFromApi(imageUrl);
              
              // 선택적: 가져온 이미지를 로컬에 캐시 저장 (성능 향상)
              if (fileBuffer) {
                const dir = path.dirname(fullPath);
                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir, { recursive: true });
                }
                try {
                  fs.writeFileSync(fullPath, fileBuffer);
                  console.log(`[mfds-recipes/images] 이미지 캐시 저장: ${imagePath}`);
                } catch (cacheError) {
                  console.warn(`[mfds-recipes/images] 캐시 저장 실패 (무시):`, cacheError);
                }
              }
            } else {
              console.warn(`[mfds-recipes/images] 이미지 URL을 찾을 수 없음: ${rcpSeq} - ${imageType}`);
            }
          } else {
            console.warn(`[mfds-recipes/images] 레시피를 찾을 수 없음: ${rcpSeq}`);
          }
        } catch (error) {
          console.error(`[mfds-recipes/images] 식약처 API 호출 오류:`, error);
        }
      } else {
        console.warn(`[mfds-recipes/images] 파일명 패턴 불일치: ${filename}`);
      }
    }

    if (!fileBuffer) {
      console.warn(`[mfds-recipes/images] 이미지를 찾을 수 없습니다: ${imagePath}`);
      return new NextResponse("Image not found", { status: 404 });
    }

    // 이미지 파일만 허용
    const ext = path.extname(imagePath).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
      return new NextResponse("Invalid file type", { status: 400 });
    }

    console.log(`[mfds-recipes/images] 이미지 제공 성공: ${imagePath}`);

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[mfds-recipes/images] 이미지 제공 실패:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

