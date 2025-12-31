/**
 * @file lib/admin/copy-reader.ts
 * @description 홈페이지 콘텐츠 조회 유틸리티
 *
 * 주요 기능:
 * 1. 기본값 우선 사용 - TEXT_SLOTS의 기본값을 먼저 확인
 * 2. 관리자가 수정한 경우에만 데이터베이스 조회
 * 3. 서버 컴포넌트에서 사용
 *
 * 최적화 전략:
 * - 정적 콘텐츠는 데이터베이스 조회 없이 기본값 직접 사용
 * - 관리자가 수정한 경우에만 데이터베이스 조회 (성능 향상)
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
 * 데이터베이스에서 콘텐츠 조회
 * 
 * 주의: 서버 컴포넌트에서만 사용 가능합니다.
 * 클라이언트 컴포넌트에서는 이 함수를 직접 호출하지 마세요.
 */
async function fetchCopyContentFromDB(
  slug: string,
  locale: string = "ko"
): Promise<Record<string, any> | null> {
  // 클라이언트 환경에서는 데이터베이스 조회를 하지 않음
  if (typeof window !== "undefined") {
    // 클라이언트 환경에서는 조용히 null 반환 (기본값 사용)
    // 개발 환경에서만 경고 로그 출력
    if (process.env.NODE_ENV === "development") {
      console.warn("[CopyReader] 클라이언트 환경에서는 데이터베이스 조회를 건너뜁니다. 기본값을 사용합니다.");
    }
    return null;
  }

  try {
    // 개발 환경에서만 상세 로그 출력
    if (process.env.NODE_ENV === "development") {
      console.groupCollapsed("[CopyReader] 데이터베이스 조회");
      console.log("slug", slug);
      console.log("locale", locale);
    }

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
        if (process.env.NODE_ENV === "development") {
          console.log("not_found", "데이터베이스에 없음, 기본값 사용");
          console.groupEnd();
        }
        return null;
      }
      // 실제 에러인 경우에만 로그 출력
      if (process.env.NODE_ENV === "development") {
        console.error("database_error", error);
        console.groupEnd();
      }
      return null;
    }

    if (process.env.NODE_ENV === "development") {
      console.log("found", "데이터베이스에서 조회 성공");
      console.groupEnd();
    }
    return data ? data.content : null;
  } catch (error) {
    // 개발 환경에서만 에러 로그 출력
    if (process.env.NODE_ENV === "development") {
      console.error("[CopyReader] 예상치 못한 오류:", error);
    }
    return null;
  }
}

/**
 * 캐시된 콘텐츠 조회 함수
 * 캐시 키: copy-{slug}-{locale}
 * 캐시 시간: 60초
 * 
 * 주의: unstable_cache는 서버 컴포넌트에서만 사용 가능합니다.
 * 클라이언트 컴포넌트에서는 null을 반환하여 기본값을 사용합니다.
 */
const getCachedCopyContent = typeof window === "undefined"
  ? unstable_cache(
      async (slug: string, locale: string) => {
        return fetchCopyContentFromDB(slug, locale);
      },
      ["copy-content"],
      {
        revalidate: 60, // 60초마다 재검증
        tags: ["admin-copy-blocks"], // revalidateTag로 무효화 가능
      }
    )
  : async (slug: string, locale: string) => {
      // 클라이언트에서는 데이터베이스 조회를 하지 않음 (기본값 사용)
      return null;
    };

/**
 * 콘텐츠 조회 함수
 *
 * 최적화된 조회 전략:
 * 1. 기본값 확인 (TEXT_SLOTS) - 즉시 사용 가능
 * 2. 데이터베이스 조회 (관리자가 수정한 경우만) - 캐싱 포함
 * 3. 기본값 반환 (데이터베이스에 없거나 조회 실패 시)
 *
 * @param slug - 콘텐츠 슬롯 식별자
 * @param locale - 언어 코드 (기본값: 'ko')
 * @param skipDB - 데이터베이스 조회 건너뛰기 (기본값만 사용, 성능 최적화)
 * @returns 콘텐츠 객체와 출처 정보
 *
 * @example
 * ```tsx
 * // Server Component - 기본값 우선 사용
 * const { content } = await getCopyContent('hero-title');
 * const title = content.title;
 *
 * // 정적 콘텐츠는 데이터베이스 조회 건너뛰기 (성능 향상)
 * const { content } = await getCopyContent('hero-title', 'ko', true);
 * ```
 */
export async function getCopyContent<T = Record<string, any>>(
  slug: string,
  locale: string = "ko",
  skipDB: boolean = false
): Promise<CopyContentResult<T>> {
  try {
    // 1. 기본값 확인 (항상 먼저 확인)
    const slot = getSlotBySlug(slug);
    const defaultContent = slot?.defaultContent;

    // 2. 데이터베이스 조회 (skipDB가 false이고 서버 환경에서만)
    // 관리자가 수정한 경우에만 데이터베이스에 데이터가 있음
    // 클라이언트 환경에서는 데이터베이스 조회를 건너뛰고 기본값 사용
    if (!skipDB && typeof window === "undefined") {
      try {
        const dbContent = await getCachedCopyContent(slug, locale);
        
        if (dbContent) {
          // 데이터베이스에 관리자가 수정한 콘텐츠가 있으면 사용
          return {
            content: dbContent as T,
            source: "database",
            slug,
          };
        }
      } catch (dbError) {
        // 데이터베이스 조회 실패 시 기본값 사용 (개발 환경에서만 에러 로그 출력)
        if (process.env.NODE_ENV === "development") {
          console.error(`[CopyReader] 데이터베이스 조회 실패 (${slug}):`, dbError);
        }
        // 기본값으로 계속 진행
      }
    }

    // 3. 기본값 사용 (TEXT_SLOTS에서 가져오기)
    if (defaultContent) {
      if (!skipDB) {
        console.log("[CopyReader] 기본값 사용 (DB에 없음):", slug);
      }
      return {
        content: defaultContent as T,
        source: "default",
        slug,
      };
    }

    // 4. 기본값도 없으면 빈 객체 반환
    if (process.env.NODE_ENV === "development") {
      console.warn("[CopyReader] 기본값 없음:", slug);
    }
    return {
      content: {} as T,
      source: "default",
      slug,
    };
  } catch (error) {
    // 예상치 못한 에러 발생 시 기본값 반환 (개발 환경에서만 로그 출력)
    if (process.env.NODE_ENV === "development") {
      console.error(`[CopyReader] getCopyContent 예외 발생 (${slug}):`, error);
    }
    const slot = getSlotBySlug(slug);
    const defaultContent = slot?.defaultContent || {};
    return {
      content: defaultContent as T,
      source: "default",
      slug,
    };
  }
}

/**
 * 여러 슬롯을 한 번에 조회 (병렬 처리)
 *
 * @param slugs - 조회할 슬롯 식별자 배열
 * @param locale - 언어 코드 (기본값: 'ko')
 * @param skipDB - 데이터베이스 조회 건너뛰기 (기본값만 사용, 성능 최적화)
 * @returns 슬롯별 콘텐츠 맵
 *
 * @example
 * ```tsx
 * // 정적 콘텐츠는 데이터베이스 조회 건너뛰기 (성능 향상)
 * const contents = await getMultipleCopyContent([
 *   'hero-title',
 *   'hero-description',
 *   'hero-badge'
 * ], 'ko', true);
 * const title = contents['hero-title'].content.title;
 * ```
 */
export async function getMultipleCopyContent(
  slugs: string[],
  locale: string = "ko",
  skipDB: boolean = false
): Promise<Record<string, CopyContentResult>> {
  try {
    const results = await Promise.allSettled(
      slugs.map(async (slug) => {
        try {
          const result = await getCopyContent(slug, locale, skipDB);
          return [slug, result] as const;
        } catch (error) {
          // 개별 슬롯 조회 실패 시 기본값 사용 (개발 환경에서만 로그 출력)
          if (process.env.NODE_ENV === "development") {
            console.error(`[CopyReader] 슬롯 조회 실패 (${slug}):`, error);
          }
          const slot = getSlotBySlug(slug);
          const defaultContent = slot?.defaultContent || {};
          return [
            slug,
            {
              content: defaultContent,
              source: "default" as const,
              slug,
            },
          ] as const;
        }
      })
    );

    // Promise.allSettled 결과를 처리
    const entries = results.map((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        // 실패한 경우 기본값 반환 (개발 환경에서만 로그 출력)
        if (process.env.NODE_ENV === "development") {
          console.error("[CopyReader] 슬롯 조회 중 예외 발생:", result.reason);
        }
        const index = results.indexOf(result);
        const slug = slugs[index] || "unknown";
        const slot = getSlotBySlug(slug);
        const defaultContent = slot?.defaultContent || {};
        return [
          slug,
          {
            content: defaultContent,
            source: "default" as const,
            slug,
          },
        ] as const;
      }
    });

    return Object.fromEntries(entries);
  } catch (error) {
    // 전체 조회 실패 시 모든 슬롯에 기본값 사용 (개발 환경에서만 로그 출력)
    if (process.env.NODE_ENV === "development") {
      console.error("[CopyReader] getMultipleCopyContent 전체 실패:", error);
    }
    const fallbackResults: Record<string, CopyContentResult> = {};
    for (const slug of slugs) {
      const slot = getSlotBySlug(slug);
      const defaultContent = slot?.defaultContent || {};
      fallbackResults[slug] = {
        content: defaultContent,
        source: "default",
        slug,
      };
    }
    return fallbackResults;
  }
}



