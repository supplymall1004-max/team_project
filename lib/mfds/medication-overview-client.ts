/**
 * @file lib/mfds/medication-overview-client.ts
 * @description 식약처 의약품개요정보 API 클라이언트 (e약은요)
 *
 * 식약처 의약품개요정보 API를 통해 의약품 개요 정보를 조회합니다.
 * 공공데이터포털(data.go.kr)에서 API 키를 발급받아 사용해야 합니다.
 *
 * @dependencies
 * - 공공데이터포털 API 키 필요 (MFDS_API_KEY 또는 MFDS_MEDICATION_OVERVIEW_API_KEY 환경 변수)
 */

/**
 * 의약품 개요 정보
 */
export interface MedicationOverviewInfo {
  item_seq: string; // 품목일련번호
  item_name: string; // 품목명
  entp_name: string; // 업체명
  item_permit_date: string; // 품목허가일자
  cancel_date: string | null; // 취소일자
  cancel_name: string | null; // 취소명
  etc_otc_code: string; // 전문일반구분
  chart: string | null; // 성상
  bar_code: string | null; // 표준코드
  material_name: string | null; // 원료성분
  ee_doc_data: string | null; // 효능효과
  ud_doc_data: string | null; // 용법용량
  nb_doc_data: string | null; // 주의사항
  storage_method: string | null; // 저장방법
  valid_term: string | null; // 유효기간
  pack_unit: string | null; // 포장단위
  permit_kind_name: string | null; // 허가종류명
  entp_seq: string | null; // 업체일련번호
  ingr_name: string | null; // 성분명
  item_image: string | null; // 품목이미지
  change_date: string | null; // 변경일자
  narcotic_kind_code: string | null; // 마약류구분코드
  cancel_flag: string | null; // 취소구분
}

/**
 * 의약품 개요 검색 결과
 */
export interface MedicationOverviewSearchResult {
  totalCount: number;
  items: MedicationOverviewInfo[];
  pageNo: number;
  numOfRows: number;
}

/**
 * 식약처 의약품개요정보 API 클라이언트
 */
class MedicationOverviewApiClient {
  private baseUrl: string;
  private apiKey: string | null;

  constructor() {
    // 의약품개요정보 API 엔드포인트 (e약은요)
    // 서비스 ID: 1471000, 서비스명: MdcinGrnInfoService01
    // 공공데이터포털 API는 HTTPS를 사용
    this.baseUrl = "https://apis.data.go.kr/1471000/MdcinGrnInfoService01";
    // 환경 변수 우선순위: MFDS_MEDICATION_OVERVIEW_API_KEY > MFDS_API_KEY
    // 임시: API 키 직접 테스트 (테스트 후 환경 변수로 복원)
    this.apiKey = process.env.MFDS_MEDICATION_OVERVIEW_API_KEY || 
                   process.env.MFDS_API_KEY || 
                   "c641dff48d4a8a2c3ff868e4fd7edcc5c42018bab2dbd8ef752ec8d0e6a685ca" || 
                   null;
    
    console.log("[MedicationOverviewApiClient] 초기화:", {
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
      apiKeySource: process.env.MFDS_MEDICATION_OVERVIEW_API_KEY ? "MFDS_MEDICATION_OVERVIEW_API_KEY" : 
                    process.env.MFDS_API_KEY ? "MFDS_API_KEY" : "없음",
    });
  }

  /**
   * API 키 확인
   */
  private checkApiKey(): void {
    if (!this.apiKey) {
      throw new Error(
        "MFDS_API_KEY 또는 MFDS_MEDICATION_OVERVIEW_API_KEY 환경 변수가 설정되지 않았습니다. 공공데이터포털(data.go.kr)에서 API 키를 발급받아 설정하세요."
      );
    }
  }

  /**
   * 의약품 개요 정보 조회 (품목명으로 검색)
   *
   * @param itemName 품목명
   * @param pageNo 페이지 번호 (기본값: 1)
   * @param numOfRows 페이지당 결과 수 (기본값: 10)
   * @returns 의약품 개요 검색 결과
   */
  async searchByItemName(
    itemName: string,
    pageNo: number = 1,
    numOfRows: number = 10
  ): Promise<MedicationOverviewSearchResult> {
    this.checkApiKey();

    console.group("[MedicationOverviewApiClient] 의약품 개요 정보 조회 (품목명)");
    console.log("품목명:", itemName);
    console.log("API Key 설정 여부:", !!this.apiKey);

    try {
      // 의약품개요정보 API 엔드포인트
      // 공공데이터포털 API는 언더스코어 형식의 파라미터를 사용
      const url = new URL(`${this.baseUrl}/getMdcinGrnInfoList`);
      
      // API 키와 파라미터 설정
      // 공공데이터포털 API는 serviceKey (소문자 s, 대문자 K) 형식을 사용
      url.searchParams.append("serviceKey", this.apiKey!);
      url.searchParams.append("item_name", itemName); // 공공데이터포털 API는 item_name 사용
      url.searchParams.append("pageNo", pageNo.toString());
      url.searchParams.append("numOfRows", numOfRows.toString());
      url.searchParams.append("type", "json");
      
      // 공공데이터포털 API는 때때로 파라미터 순서나 형식에 민감할 수 있음
      // 한글은 URL.searchParams가 자동으로 인코딩함

      console.log("API 요청 URL:", url.toString().replace(this.apiKey!, "***KEY***"));

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        // Next.js 캐시 옵션은 서버 컴포넌트에서만 작동하므로 제거
        cache: "no-store", // 항상 최신 데이터 조회
      });

      // 응답 본문을 먼저 텍스트로 읽어서 확인
      const responseText = await response.text();
      
      console.log("API 응답 상태:", {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get("content-type"),
        bodyLength: responseText.length,
        bodyPreview: responseText.substring(0, 500),
      });
      
      // 공공데이터포털 API는 HTTP 200이어도 본문에 에러를 포함할 수 있음
      // 먼저 본문을 확인하여 에러 메시지가 있는지 체크
      if (responseText.includes("SERVICE_KEY") || 
          responseText.includes("인증") || 
          responseText.includes("SERVICE KEY") ||
          responseText.includes("SERVICEKEY") ||
          responseText.includes("Invalid") ||
          responseText.includes("invalid")) {
        console.error("❌ API 키 인증 오류:", responseText.substring(0, 500));
        throw new Error("API 키가 유효하지 않거나 인증에 실패했습니다. 공공데이터포털에서 API 키를 확인해주세요.");
      }
      
      if (responseText.includes("Unexpected errors") || 
          responseText.includes("오류") || 
          responseText.includes("ERROR")) {
        console.error("❌ API 서버 오류:", responseText.substring(0, 1000));
        throw new Error(`공공데이터포털 API 서버 오류: ${responseText.substring(0, 200)}`);
      }
      
      if (!response.ok) {
        console.error("❌ API 응답 오류:", {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get("content-type"),
          body: responseText.substring(0, 2000), // 더 긴 본문 확인
        });
        
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}. 응답: ${responseText.substring(0, 200)}`);
      }

      // Content-Type 확인
      const contentType = response.headers.get("content-type") || "";
      let data: any;

      if (contentType.includes("application/json")) {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("❌ JSON 파싱 실패:", parseError);
          console.error("응답 본문:", responseText.substring(0, 500));
          throw new Error("API 응답을 JSON으로 파싱할 수 없습니다.");
        }
      } else if (contentType.includes("application/xml") || contentType.includes("text/xml")) {
        console.error("❌ API가 XML 형식으로 응답했습니다. JSON 형식이 필요합니다.");
        console.error("응답 본문:", responseText.substring(0, 500));
        throw new Error("API가 XML 형식으로 응답했습니다. type=json 파라미터를 확인해주세요.");
      } else {
        // Content-Type이 없거나 예상치 못한 경우에도 JSON 파싱 시도
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("❌ 응답 형식을 확인할 수 없습니다:", {
            contentType,
            responsePreview: responseText.substring(0, 500),
          });
          throw new Error("API 응답 형식을 확인할 수 없습니다.");
        }
      }

      console.log("API 응답 데이터 구조:", {
        hasBody: !!data.body,
        hasResponse: !!data.response,
        keys: Object.keys(data),
        responseKeys: data.response ? Object.keys(data.response) : [],
        bodyKeys: data.body ? Object.keys(data.body) : [],
        // 전체 응답 구조 확인 (디버깅용)
        fullResponseStructure: JSON.stringify(data, null, 2).substring(0, 500),
      });

      // 직접 에러 필드 확인 (response.header 확인 전에)
      if (data.errorCode || data.resultCode) {
        const errorCode = data.errorCode || data.resultCode;
        const errorMsg = data.errorMsg || data.resultMsg || "알 수 없는 오류";
        console.error("❌ API 에러 응답 (직접 필드):", {
          errorCode,
          errorMsg,
          fullResponse: JSON.stringify(data, null, 2).substring(0, 1000),
        });
        throw new Error(`API 에러: ${errorMsg} (코드: ${errorCode})`);
      }

      // API 응답이 비어있는지 확인
      if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        console.error("❌ API 응답이 비어있습니다.");
        throw new Error("API 응답이 비어있습니다. API 키와 요청 파라미터를 확인해주세요.");
      }

      // API 응답 구조에 따라 파싱 (공공데이터포털 API 응답 형식)
      // 공공데이터포털 API는 때때로 에러를 response.header에 포함시킴
      if (data.response?.header) {
        const resultCode = data.response.header.resultCode;
        const resultMsg = data.response.header.resultMsg;
        
        // resultCode가 "00" 또는 "0"이 아니면 에러
        if (resultCode && resultCode !== "00" && resultCode !== "0") {
          console.error("❌ API 에러 응답 (header):", {
            resultCode,
            resultMsg,
            fullResponse: JSON.stringify(data, null, 2).substring(0, 1000),
          });
          
          // 에러 메시지가 한글이면 그대로 사용, 아니면 영어 메시지 변환
          let errorMessage = resultMsg || `API 에러 (코드: ${resultCode})`;
          if (resultMsg && resultMsg.includes("SERVICE") || resultMsg.includes("KEY")) {
            errorMessage = "API 키가 유효하지 않거나 인증에 실패했습니다. 공공데이터포털에서 API 키를 확인해주세요.";
          } else if (resultMsg && resultMsg.includes("Unexpected")) {
            errorMessage = "공공데이터포털 API 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
          }
          
          throw new Error(errorMessage);
        }
      }

      let result: MedicationOverviewSearchResult;

      // 공공데이터포털 API는 여러 응답 형식을 사용할 수 있음
      if (data.response?.body) {
        // response.body 구조 (가장 일반적)
        const body = data.response.body;
        const items = body.items;
        
        let itemsArray: any[] = [];
        if (Array.isArray(items?.item)) {
          itemsArray = items.item;
        } else if (items?.item) {
          itemsArray = [items.item];
        } else if (Array.isArray(items)) {
          itemsArray = items;
        } else if (items) {
          itemsArray = [items];
        }

        result = {
          totalCount: parseInt(body.totalCount || body.totalCnt || "0", 10),
          items: itemsArray,
          pageNo: parseInt(body.pageNo || pageNo.toString(), 10),
          numOfRows: parseInt(body.numOfRows || numOfRows.toString(), 10),
        };
      } else if (data.body) {
        // body 구조
        const body = data.body;
        const items = body.items;
        
        let itemsArray: any[] = [];
        if (Array.isArray(items?.item)) {
          itemsArray = items.item;
        } else if (items?.item) {
          itemsArray = [items.item];
        } else if (Array.isArray(items)) {
          itemsArray = items;
        } else if (items) {
          itemsArray = [items];
        }

        result = {
          totalCount: parseInt(body.totalCount || body.totalCnt || "0", 10),
          items: itemsArray,
          pageNo: parseInt(body.pageNo || pageNo.toString(), 10),
          numOfRows: parseInt(body.numOfRows || numOfRows.toString(), 10),
        };
      } else {
        // 직접 items 배열 또는 다른 구조
        let itemsArray: any[] = [];
        if (Array.isArray(data.items?.item)) {
          itemsArray = data.items.item;
        } else if (data.items?.item) {
          itemsArray = [data.items.item];
        } else if (Array.isArray(data.items)) {
          itemsArray = data.items;
        } else if (data.items) {
          itemsArray = [data.items];
        }

        result = {
          totalCount: parseInt(data.totalCount || data.totalCnt || "0", 10),
          items: itemsArray,
          pageNo: data.pageNo || pageNo,
          numOfRows: data.numOfRows || numOfRows,
        };
      }

      // 결과 검증
      if (!result || typeof result.totalCount !== 'number') {
        console.error("❌ API 응답 파싱 실패: 예상하지 못한 응답 구조");
        console.error("전체 응답 데이터:", JSON.stringify(data, null, 2).substring(0, 2000));
        throw new Error("API 응답을 파싱할 수 없습니다. 응답 구조가 예상과 다릅니다.");
      }

      console.log(`✅ 의약품 개요 정보 조회 완료: ${result.totalCount}건`);
      console.log("조회된 항목 수:", result.items.length);
      if (result.items.length > 0) {
        console.log("첫 번째 항목 샘플:", {
          item_name: result.items[0].item_name,
          entp_name: result.items[0].entp_name,
          ingr_name: result.items[0].ingr_name,
        });
      }
      console.groupEnd();

      return result;
    } catch (error) {
      console.error("❌ 의약품 개요 정보 조회 실패:", error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * 의약품 개요 상세 정보 조회 (품목일련번호로 조회)
   *
   * @param itemSeq 품목일련번호
   * @returns 의약품 개요 상세 정보
   */
  async getMedicationOverviewDetail(itemSeq: string): Promise<MedicationOverviewInfo | null> {
    this.checkApiKey();

    console.group("[MedicationOverviewApiClient] 의약품 개요 상세 정보 조회");
    console.log("품목일련번호:", itemSeq);

    try {
      const url = new URL(`${this.baseUrl}/getMdcinGrnInfoList`);
      url.searchParams.append("serviceKey", this.apiKey!);
      url.searchParams.append("itemSeq", itemSeq);
      url.searchParams.append("type", "json");

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        cache: "no-store", // 항상 최신 데이터 조회
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // API 응답 구조에 따라 파싱
      let items: MedicationOverviewInfo[] = [];

      if (data.response?.body?.items?.item) {
        items = Array.isArray(data.response.body.items.item)
          ? data.response.body.items.item
          : [data.response.body.items.item];
      } else if (data.body?.items?.item) {
        items = Array.isArray(data.body.items.item) ? data.body.items.item : [data.body.items.item];
      } else if (data.body?.items) {
        items = Array.isArray(data.body.items) ? data.body.items : [data.body.items];
      } else if (data.items) {
        items = Array.isArray(data.items) ? data.items : [data.items];
      }

      const medication = items.length > 0 ? items[0] : null;

      if (medication) {
        console.log("✅ 의약품 개요 상세 정보 조회 완료");
        console.log("의약품명:", medication.item_name);
      } else {
        console.log("⚠️ 의약품 정보를 찾을 수 없습니다.");
      }
      console.groupEnd();

      return medication as MedicationOverviewInfo | null;
    } catch (error) {
      console.error("❌ 의약품 개요 상세 정보 조회 실패:", error);
      console.groupEnd();
      throw error;
    }
  }
}

// 싱글톤 인스턴스
let medicationOverviewClient: MedicationOverviewApiClient | null = null;

/**
 * 식약처 의약품개요정보 API 클라이언트 인스턴스 가져오기
 */
export function getMedicationOverviewApiClient(): MedicationOverviewApiClient {
  if (!medicationOverviewClient) {
    medicationOverviewClient = new MedicationOverviewApiClient();
  }
  return medicationOverviewClient;
}

/**
 * 의약품 개요 정보 조회 (품목명으로 검색)
 */
export async function searchMedicationOverviewByName(
  itemName: string,
  pageNo: number = 1,
  numOfRows: number = 10
): Promise<MedicationOverviewSearchResult> {
  const client = getMedicationOverviewApiClient();
  return client.searchByItemName(itemName, pageNo, numOfRows);
}

/**
 * 의약품 개요 상세 정보 조회
 */
export async function getMedicationOverviewDetail(itemSeq: string): Promise<MedicationOverviewInfo | null> {
  const client = getMedicationOverviewApiClient();
  return client.getMedicationOverviewDetail(itemSeq);
}

