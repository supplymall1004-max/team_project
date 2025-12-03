/**
 * @file lib/admin/copy-reader.ts
 * @description 홈페이지 콘텐츠 조회 유틸리티
 *
 * 주요 기능:
 * 1. admin_copy_blocks 테이블에서 콘텐츠 조회
 * 2. 기본값(fallback) 지원 - TEXT_SLOTS에서 가져오기
 * 3. 서버 컴포넌트에서 사용
 *
 * @dependencies
 * - lib/supabase/public-server: 공개 데이터 조회용 Supabase 클라이언트
 * - actions/admin/copy/slots: TEXT_SLOTS 기본값 정의
 */

import { createPublicSupabaseServerClient } from "@/lib/supabase/public-server";
import { getSlotBySlug, type TextSlot } from "@/actions/admin/copy/slots";
import { unstable_cache } from "next/cache";

/**
 * 콘텐츠 조회 결과 타입
 */
export interface CopyContentResult<T = Record<string, any>> {
  content: T;
  source: "database" | "default";
  slug: string;
}

/**
 * 데이터베이스에서 콘텐츠 조회 (캐싱 포함)
 */
async function fetchCopyContentFromDB(
  slug: string,
  locale: string = "ko"
): Promise<Record<string, any> | null> {
  try {
    console.groupCollapsed("[CopyReader] 데이터베이스 조회");
    console.log("slug", slug);
    console.log("locale", locale);

    const supabase = createPublicSupabaseServerClient();

    const { data, error } = await supabase
      .from("admin_copy_blocks")
      .select("content")
      .eq("slug", slug)
      .eq("locale", locale)
      .single<{ content: Record<string, any> }>();

    if (error) {
      // 데이터가 없으면 null 반환 (기본값 사용)
      if (error.code === "PGRST116") {
        console.log("not_found", "데이터베이스에 없음, 기본값 사용");
        console.groupEnd();
        return null;
      }
      console.error("database_error", error);
      console.groupEnd();
      return null;
    }

    console.log("found", "데이터베이스에서 조회 성공");
    console.groupEnd();
    return data ? data.content : null;
  } catch (error) {
    console.error("[CopyReader] 예상치 못한 오류:", error);
    return null;
  }
}

/**
 * 캐시된 콘텐츠 조회 함수
 * 캐시 키: copy-{slug}-{locale}
 * 캐시 시간: 60초
 */
const getCachedCopyContent = unstable_cache(
  async (slug: string, locale: string) => {
    return fetchCopyContentFromDB(slug, locale);
  },
  ["copy-content"],
  {
    revalidate: 60, // 60초마다 재검증
    tags: ["admin-copy-blocks"], // revalidateTag로 무효화 가능
  }
);

/**
 * 콘텐츠 조회 함수
 *
 * @param slug - 콘텐츠 슬롯 식별자
 * @param locale - 언어 코드 (기본값: 'ko')
 * @returns 콘텐츠 객체와 출처 정보
 *
 * @example
 * ```tsx
 * // Server Component
 * const { content } = await getCopyContent('hero-title');
 * const title = content.title;
 * ```
 */
export async function getCopyContent<T = Record<string, any>>(
  slug: string,
  locale: string = "ko"
): Promise<CopyContentResult<T>> {
  // 1. 데이터베이스에서 조회 (캐싱 포함)
  const dbContent = await getCachedCopyContent(slug, locale);

  if (dbContent) {
    return {
      content: dbContent as T,
      source: "database",
      slug,
    };
  }

  // 2. 기본값 사용 (TEXT_SLOTS에서 가져오기)
  const slot = getSlotBySlug(slug);
  if (slot && slot.defaultContent) {
    console.log("[CopyReader] 기본값 사용:", slug);
    return {
      content: slot.defaultContent as T,
      source: "default",
      slug,
    };
  }

  // 3. 기본값도 없으면 빈 객체 반환
  console.warn("[CopyReader] 기본값 없음:", slug);
  return {
    content: {} as T,
    source: "default",
    slug,
  };
}

/**
 * 여러 슬롯을 한 번에 조회 (병렬 처리)
 *
 * @param slugs - 조회할 슬롯 식별자 배열
 * @param locale - 언어 코드 (기본값: 'ko')
 * @returns 슬롯별 콘텐츠 맵
 *
 * @example
 * ```tsx
 * const contents = await getMultipleCopyContent([
 *   'hero-title',
 *   'hero-description',
 *   'hero-badge'
 * ]);
 * const title = contents['hero-title'].content.title;
 * ```
 */
export async function getMultipleCopyContent(
  slugs: string[],
  locale: string = "ko"
): Promise<Record<string, CopyContentResult>> {
  const results = await Promise.all(
    slugs.map(async (slug) => {
      const result = await getCopyContent(slug, locale);
      return [slug, result] as const;
    })
  );

  return Object.fromEntries(results);
}



