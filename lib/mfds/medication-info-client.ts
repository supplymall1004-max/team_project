/**
 * @file lib/mfds/medication-info-client.ts
 * @description 식약처 의약품 안전나라 API 클라이언트
 *
 * 식약처 의약품 안전나라 API를 통해 의약품 정보를 조회합니다.
 * 공공데이터포털(data.go.kr)에서 API 키를 발급받아 사용해야 합니다.
 *
 * @dependencies
 * - 공공데이터포털 API 키 필요 (MFDS_API_KEY 환경 변수)
 */

/**
 * 의약품 정보
 */
export interface MedicationInfo {
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
  re_exam_target: string | null; // 재심사대상여부
  re_exam_date: string | null; // 재심사기간
  pack_unit: string | null; // 포장단위
  edi_code: string | null; // 전자문서코드
  doc_text: string | null; // 문서내용
  permit_kind_name: string | null; // 허가종류명
  entp_seq: string | null; // 업체일련번호
  make_material_flag: string | null; // 제조원료구분
  newdrug_class_name: string | null; // 신약구분명
  induty_type: string | null; // 업종구분
  main_item_ingr: string | null; // 주성분코드
  ingr_name: string | null; // 성분명
  item_image: string | null; // 품목이미지
  insert_file: string | null; // 첨부파일
  change_date: string | null; // 변경일자
  narcotic_kind_code: string | null; // 마약류구분코드
  poi_item: string | null; // 독성구분
  cancel_flag: string | null; // 취소구분
  gbn_name: string | null; // 구분명
}

/**
 * 의약품 검색 결과
 */
export interface MedicationSearchResult {
  totalCount: number;
  items: MedicationInfo[];
  pageNo: number;
  numOfRows: number;
}

/**
 * 식약처 API 클라이언트
 */
class MFDSApiClient {
  private baseUrl: string;
  private apiKey: string | null;

  constructor() {
    this.baseUrl = "http://apis.data.go.kr/1471000/MdcinGrnIdntfcInfoService01";
    this.apiKey = process.env.MFDS_API_KEY || null;
  }

  /**
   * API 키 확인
   */
  private checkApiKey(): void {
    if (!this.apiKey) {
      throw new Error(
        "MFDS_API_KEY 환경 변수가 설정되지 않았습니다. 공공데이터포털(data.go.kr)에서 API 키를 발급받아 설정하세요."
      );
    }
  }

  /**
   * 의약품 정보 조회 (품목명으로 검색)
   *
   * @param itemName 품목명
   * @param pageNo 페이지 번호 (기본값: 1)
   * @param numOfRows 페이지당 결과 수 (기본값: 10)
   * @returns 의약품 검색 결과
   */
  async searchByItemName(
    itemName: string,
    pageNo: number = 1,
    numOfRows: number = 10
  ): Promise<MedicationSearchResult> {
    this.checkApiKey();

    console.group("[MFDSApiClient] 의약품 정보 조회 (품목명)");
    console.log("품목명:", itemName);

    try {
      const url = new URL(`${this.baseUrl}/getMdcinGrnIdntfcInfoList01`);
      url.searchParams.append("serviceKey", this.apiKey!);
      url.searchParams.append("item_name", itemName);
      url.searchParams.append("pageNo", pageNo.toString());
      url.searchParams.append("numOfRows", numOfRows.toString());
      url.searchParams.append("type", "json");

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // API 응답 구조 확인 필요 (실제 API 문서에 따라 수정)
      const result: MedicationSearchResult = {
        totalCount: data.body?.totalCount || 0,
        items: data.body?.items || [],
        pageNo: data.body?.pageNo || pageNo,
        numOfRows: data.body?.numOfRows || numOfRows,
      };

      console.log(`✅ 의약품 정보 조회 완료: ${result.totalCount}건`);
      console.groupEnd();

      return result;
    } catch (error) {
      console.error("❌ 의약품 정보 조회 실패:", error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * 의약품 상세 정보 조회 (품목일련번호로 조회)
   *
   * @param itemSeq 품목일련번호
   * @returns 의약품 상세 정보
   */
  async getMedicationDetail(itemSeq: string): Promise<MedicationInfo | null> {
    this.checkApiKey();

    console.group("[MFDSApiClient] 의약품 상세 정보 조회");
    console.log("품목일련번호:", itemSeq);

    try {
      const url = new URL(`${this.baseUrl}/getMdcinGrnIdntfcInfoList01`);
      url.searchParams.append("serviceKey", this.apiKey!);
      url.searchParams.append("item_seq", itemSeq);
      url.searchParams.append("type", "json");

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // API 응답 구조 확인 필요 (실제 API 문서에 따라 수정)
      const items = data.body?.items || [];
      const medication = items.length > 0 ? items[0] : null;

      if (medication) {
        console.log("✅ 의약품 상세 정보 조회 완료");
      } else {
        console.log("⚠️ 의약품 정보를 찾을 수 없습니다.");
      }
      console.groupEnd();

      return medication as MedicationInfo | null;
    } catch (error) {
      console.error("❌ 의약품 상세 정보 조회 실패:", error);
      console.groupEnd();
      throw error;
    }
  }

  /**
   * 의약품 성분명으로 검색
   *
   * @param ingrName 성분명
   * @param pageNo 페이지 번호 (기본값: 1)
   * @param numOfRows 페이지당 결과 수 (기본값: 10)
   * @returns 의약품 검색 결과
   */
  async searchByIngredientName(
    ingrName: string,
    pageNo: number = 1,
    numOfRows: number = 10
  ): Promise<MedicationSearchResult> {
    this.checkApiKey();

    console.group("[MFDSApiClient] 의약품 정보 조회 (성분명)");
    console.log("성분명:", ingrName);

    try {
      const url = new URL(`${this.baseUrl}/getMdcinGrnIdntfcInfoList01`);
      url.searchParams.append("serviceKey", this.apiKey!);
      url.searchParams.append("ingr_name", ingrName);
      url.searchParams.append("pageNo", pageNo.toString());
      url.searchParams.append("numOfRows", numOfRows.toString());
      url.searchParams.append("type", "json");

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // API 응답 구조 확인 필요 (실제 API 문서에 따라 수정)
      const result: MedicationSearchResult = {
        totalCount: data.body?.totalCount || 0,
        items: data.body?.items || [],
        pageNo: data.body?.pageNo || pageNo,
        numOfRows: data.body?.numOfRows || numOfRows,
      };

      console.log(`✅ 의약품 정보 조회 완료: ${result.totalCount}건`);
      console.groupEnd();

      return result;
    } catch (error) {
      console.error("❌ 의약품 정보 조회 실패:", error);
      console.groupEnd();
      throw error;
    }
  }
}

// 싱글톤 인스턴스
let mfdsClient: MFDSApiClient | null = null;

/**
 * 식약처 API 클라이언트 인스턴스 가져오기
 */
export function getMFDSApiClient(): MFDSApiClient {
  if (!mfdsClient) {
    mfdsClient = new MFDSApiClient();
  }
  return mfdsClient;
}

/**
 * 의약품 정보 조회 (품목명으로 검색)
 */
export async function searchMedicationByName(
  itemName: string,
  pageNo: number = 1,
  numOfRows: number = 10
): Promise<MedicationSearchResult> {
  const client = getMFDSApiClient();
  return client.searchByItemName(itemName, pageNo, numOfRows);
}

/**
 * 의약품 상세 정보 조회
 */
export async function getMedicationDetail(itemSeq: string): Promise<MedicationInfo | null> {
  const client = getMFDSApiClient();
  return client.getMedicationDetail(itemSeq);
}

/**
 * 의약품 정보 조회 (성분명으로 검색)
 */
export async function searchMedicationByIngredient(
  ingrName: string,
  pageNo: number = 1,
  numOfRows: number = 10
): Promise<MedicationSearchResult> {
  const client = getMFDSApiClient();
  return client.searchByIngredientName(ingrName, pageNo, numOfRows);
}

