/**
 * @file foodsafety-api.ts
 * @description 식약처 레시피 API 통합 서비스 (레거시)
 *
 * ⚠️ 주의: 이 파일은 더 이상 애플리케이션 코드에서 사용되지 않습니다.
 * 모든 식단 생성은 정적 파일(@/lib/mfds/recipe-loader)을 통해 수행됩니다.
 * 
 * 이 파일은 스크립트(scripts/collect-mfds-recipes.ts, scripts/test-mfds-api.ts)에서만 사용됩니다.
 * 
 * 주요 기능 (레거시):
 * 1. 식약처 API 호출 및 데이터 조회
 * 2. API 응답 타입 정의
 * 3. 에러 처리 및 재시도 로직
 */

/**
 * 식약처 API 응답 타입 정의
 * COOKRCP01 API의 전체 필드 구조
 */
export interface FoodSafetyRecipeRow {
  RCP_SEQ: string; // 레시피 순번 (ID)
  RCP_NM: string; // 레시피명
  RCP_WAY2: string; // 조리방법 (볶음, 끓이기 등)
  RCP_PAT2: string; // 요리종류 (밥, 국, 찌개 등)
  INFO_ENG: string; // 칼로리
  INFO_CAR: string; // 탄수화물
  INFO_PRO: string; // 단백질
  INFO_FAT: string; // 지방
  INFO_NA: string; // 나트륨
  INFO_FIBER: string; // 식이섬유
  INFO_K?: string; // 칼륨 (옵셔널)
  INFO_P?: string; // 인 (옵셔널)
  INFO_GI?: string; // GI 지수 (옵셔널)
  RCP_PARTS_DTLS: string; // 재료 정보
  MANUAL01: string | null; // 조리 방법 1
  MANUAL02: string | null;
  MANUAL03: string | null;
  MANUAL04: string | null;
  MANUAL05: string | null;
  MANUAL06: string | null;
  MANUAL07: string | null;
  MANUAL08: string | null;
  MANUAL09: string | null;
  MANUAL10: string | null;
  MANUAL11: string | null;
  MANUAL12: string | null;
  MANUAL13: string | null;
  MANUAL14: string | null;
  MANUAL15: string | null;
  MANUAL16: string | null;
  MANUAL17: string | null;
  MANUAL18: string | null;
  MANUAL19: string | null;
  MANUAL20: string | null;
  MANUAL_IMG01: string | null; // 조리 방법 이미지 1
  MANUAL_IMG02: string | null;
  MANUAL_IMG03: string | null;
  MANUAL_IMG04: string | null;
  MANUAL_IMG05: string | null;
  MANUAL_IMG06: string | null;
  MANUAL_IMG07: string | null;
  MANUAL_IMG08: string | null;
  MANUAL_IMG09: string | null;
  MANUAL_IMG10: string | null;
  MANUAL_IMG11: string | null;
  MANUAL_IMG12: string | null;
  MANUAL_IMG13: string | null;
  MANUAL_IMG14: string | null;
  MANUAL_IMG15: string | null;
  MANUAL_IMG16: string | null;
  MANUAL_IMG17: string | null;
  MANUAL_IMG18: string | null;
  MANUAL_IMG19: string | null;
  MANUAL_IMG20: string | null;
  ATT_FILE_NO_MAIN: string | null; // 대표 이미지 URL
  ATT_FILE_NO_MK: string | null; // 만드는 법 이미지 URL
}

export interface FoodSafetyApiResponse {
  COOKRCP01: {
    total_count: string;
    RESULT: {
      CODE: string;
      MSG: string;
    };
    row: FoodSafetyRecipeRow[];
  };
}

/**
 * 식약처 API 호출 옵션
 */
export interface FoodSafetyApiOptions {
  startIdx?: number; // 시작 인덱스 (기본값: 1)
  endIdx?: number; // 종료 인덱스 (기본값: 1000)
  rcpSeq?: string; // 특정 레시피 순번으로 조회
  maxRetries?: number; // 최대 재시도 횟수 (기본값: 3)
  retryDelay?: number; // 재시도 지연 시간(ms) (기본값: 1000)
}

/**
 * 식약처 API 호출 결과
 */
export interface FoodSafetyApiResult {
  success: boolean;
  data?: FoodSafetyRecipeRow[];
  error?: string;
  totalCount?: number;
}

/**
 * 식약처 API 키 가져오기 (하이브리드 방식)
 */
async function getApiKey(): Promise<string> {
  // 하이브리드 방식: 사용자 API 키 우선, 없으면 환경 변수
  const { getHybridApiKey } = await import("@/lib/api-keys/get-user-api-key");
  const apiKey = await getHybridApiKey("food_safety", "FOOD_SAFETY_RECIPE_API_KEY");
  
  if (!apiKey) {
    throw new Error(
      "FOOD_SAFETY_RECIPE_API_KEY가 환경 변수에 설정되지 않았습니다. 설정 페이지에서 API 키를 입력하거나 .env 파일을 확인해주세요."
    );
  }
  return apiKey;
}

/**
 * 식약처 API URL 생성
 */
function buildApiUrl(
  apiKey: string,
  startIdx: number,
  endIdx: number,
  rcpSeq?: string
): string {
  // HTTP와 HTTPS 모두 시도 가능하도록 설정
  // 일부 환경에서는 HTTPS가 더 안정적일 수 있음
  const baseUrl = process.env.MFDS_API_BASE_URL || "http://openapi.foodsafetykorea.go.kr/api";
  
  if (rcpSeq) {
    // 특정 레시피 조회: RCP_SEQ로 필터링
    // 식약처 API는 직접적인 RCP_SEQ 필터를 지원하지 않으므로
    // 전체 조회 후 클라이언트에서 필터링하거나, 범위를 넓게 조회
    return `${baseUrl}/${apiKey}/COOKRCP01/json/${startIdx}/${endIdx}`;
  }
  
  // 전체 레시피 조회
  return `${baseUrl}/${apiKey}/COOKRCP01/json/${startIdx}/${endIdx}`;
}

/**
 * 식약처 API 호출 (재시도 로직 포함)
 */
async function fetchWithRetry(
  url: string,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.groupCollapsed(`[FoodSafetyAPI] API 호출 시도 ${attempt}/${maxRetries}`);
      console.log("URL:", url.replace(process.env.FOOD_SAFETY_RECIPE_API_KEY || "", "***KEY***"));
      
      // 타임아웃 설정 (작은 배치 크기 사용 시 15초면 충분)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15초 (작은 배치용)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      console.log("응답 상태:", response.status);
      console.groupEnd();
      
      if (response.ok) {
        return response;
      }
      
      // 4xx 에러는 재시도하지 않음
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }
      
      lastError = new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      
      // 마지막 시도가 아니면 대기 후 재시도
      if (attempt < maxRetries) {
        console.log(`재시도 대기 중... (${retryDelay}ms)`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        retryDelay *= 2; // 지수 백오프
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // 타임아웃이나 네트워크 에러인 경우 재시도
      const isRetryableError = 
        error instanceof Error && (
          error.name === "TimeoutError" || 
          error.name === "AbortError" ||
          error instanceof TypeError ||
          error.message.includes("fetch failed") ||
          error.message.includes("network")
        );

      if (attempt < maxRetries && isRetryableError) {
        console.log(`재시도 대기 중... (${retryDelay}ms)`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        retryDelay *= 2;
      } else {
        console.groupEnd();
        throw lastError;
      }
    }
  }
  
  throw lastError || new Error("API 호출 실패");
}

/**
 * 식약처 API에서 레시피 목록 조회
 */
export async function fetchFoodSafetyRecipes(
  options: FoodSafetyApiOptions = {}
): Promise<FoodSafetyApiResult> {
  const {
    startIdx = 1,
    endIdx = 1000,
    rcpSeq,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  console.group("[FoodSafetyAPI] 레시피 목록 조회");
  console.log("options", { startIdx, endIdx, rcpSeq });

  try {
    const apiKey = await getApiKey();
    const url = buildApiUrl(apiKey, startIdx, endIdx, rcpSeq);
    
    const response = await fetchWithRetry(url, maxRetries, retryDelay);
    const data: FoodSafetyApiResponse = await response.json();
    
    // 응답 검증
    if (!data.COOKRCP01) {
      throw new Error("예상치 못한 API 응답 형식");
    }
    
    // 에러 코드 확인
    if (data.COOKRCP01.RESULT?.CODE !== "INFO-000") {
      const errorCode = data.COOKRCP01.RESULT?.CODE || "UNKNOWN";
      const errorMsg = data.COOKRCP01.RESULT?.MSG || "알 수 없는 오류";
      throw new Error(`식약처 API 오류: ${errorCode} - ${errorMsg}`);
    }
    
    let recipes = data.COOKRCP01.row || [];
    
    // 특정 레시피 순번으로 필터링
    if (rcpSeq) {
      recipes = recipes.filter((recipe) => recipe.RCP_SEQ === rcpSeq);
      
      if (recipes.length === 0) {
        console.warn(`레시피 순번 ${rcpSeq}를 찾을 수 없습니다.`);
        console.groupEnd();
        return {
          success: false,
          error: `레시피 순번 ${rcpSeq}를 찾을 수 없습니다.`,
        };
      }
    }
    
    const totalCount = parseInt(data.COOKRCP01.total_count || "0", 10);
    
    console.log(`✅ ${recipes.length}개의 레시피 조회 성공`);
    console.groupEnd();
    
    return {
      success: true,
      data: recipes,
      totalCount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ 식약처 API 호출 실패:", errorMessage);
    
    // 타임아웃 에러인 경우 더 명확한 메시지
    if (error instanceof Error && (error.name === "AbortError" || error.message.includes("aborted"))) {
      console.error("⚠️ API 호출 타임아웃: 식약처 API 서버가 응답하지 않습니다.");
      console.error("   가능한 원인:");
      console.error("   1. 네트워크 연결 문제");
      console.error("   2. 식약처 API 서버 장애");
      console.error("   3. API 키가 유효하지 않음");
      console.error("   4. 방화벽/프록시 차단");
    }
    
    console.groupEnd();
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * 식약처 API에서 특정 레시피 조회 (RCP_SEQ 기반)
 */
export async function fetchFoodSafetyRecipeBySeq(
  rcpSeq: string,
  options: Omit<FoodSafetyApiOptions, "rcpSeq"> = {}
): Promise<FoodSafetyApiResult> {
  console.group("[FoodSafetyAPI] 특정 레시피 조회");
  console.log("rcpSeq", rcpSeq);
  
  // RCP_SEQ로 직접 조회할 수 없으므로, 넓은 범위로 조회 후 필터링
  // 식약처 API는 최대 1000개씩 조회 가능하므로, 여러 번 호출이 필요할 수 있음
  // 우선 첫 1000개에서 찾고, 없으면 다음 범위 조회
  
  const result = await fetchFoodSafetyRecipes({
    ...options,
    startIdx: 1,
    endIdx: 1000,
    rcpSeq,
  });
  
  if (result.success && result.data && result.data.length > 0) {
    console.log("✅ 레시피 조회 성공");
    console.groupEnd();
    return result;
  }
  
  // 첫 1000개에서 못 찾았으면 다음 범위 조회 시도
  // (실제로는 전체 데이터를 순회해야 하지만, 성능을 위해 제한)
  console.warn("첫 1000개에서 레시피를 찾지 못했습니다. 추가 범위 조회는 구현되지 않았습니다.");
  console.groupEnd();
  
  return {
    success: false,
    error: `레시피 순번 ${rcpSeq}를 찾을 수 없습니다.`,
  };
}

/**
 * 식약처 API에서 레시피명으로 검색
 */
export async function searchFoodSafetyRecipesByName(
  recipeName: string,
  options: Omit<FoodSafetyApiOptions, "rcpSeq"> = {}
): Promise<FoodSafetyApiResult> {
  console.group("[FoodSafetyAPI] 레시피명으로 검색");
  console.log("recipeName", recipeName);
  
  // 식약처 API는 검색 기능을 직접 지원하지 않으므로
  // 전체 조회 후 클라이언트에서 필터링
  const result = await fetchFoodSafetyRecipes({
    ...options,
    startIdx: 1,
    endIdx: 1000,
  });
  
  if (!result.success || !result.data) {
    console.groupEnd();
    return result;
  }
  
  // 레시피명에 검색어가 포함된 레시피 필터링
  const filtered = result.data.filter((recipe) =>
    recipe.RCP_NM.includes(recipeName)
  );
  
  console.log(`✅ ${filtered.length}개의 레시피 검색 성공`);
  console.groupEnd();
  
  return {
    success: true,
    data: filtered,
    totalCount: filtered.length,
  };
}

