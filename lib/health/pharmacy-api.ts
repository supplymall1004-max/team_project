/**
 * @file pharmacy-api.ts
 * @description 국립중앙의료원 전국 약국 정보 조회 API
 * @see https://www.data.go.kr/data/15000500/openapi.do
 */

export interface PharmacyInfo {
  rnum: string; // 순번
  dutyAddr: string; // 주소
  dutyName: string; // 약국명
  dutyTel1: string; // 전화번호
  dutyTime1s: string; // 월요일 진료시작시간
  dutyTime1c: string; // 월요일 진료종료시간
  dutyTime2s: string; // 화요일 진료시작시간
  dutyTime2c: string; // 화요일 진료종료시간
  dutyTime3s: string; // 수요일 진료시작시간
  dutyTime3c: string; // 수요일 진료종료시간
  dutyTime4s: string; // 목요일 진료시작시간
  dutyTime4c: string; // 목요일 진료종료시간
  dutyTime5s: string; // 금요일 진료시작시간
  dutyTime5c: string; // 금요일 진료종료시간
  dutyTime6s: string; // 토요일 진료시작시간
  dutyTime6c: string; // 토요일 진료종료시간
  dutyTime7s: string; // 일요일 진료시작시간
  dutyTime7c: string; // 일요일 진료종료시간
  dutyTime8s: string; // 공휴일 진료시작시간
  dutyTime8c: string; // 공휴일 진료종료시간
  postCdn1: string; // 우편번호1
  postCdn2: string; // 우편번호2
  wgs84Lat: string; // 위도
  wgs84Lon: string; // 경도
}

export interface PharmacySearchParams {
  Q0?: string; // 주소(시도) - 예: 서울특별시
  Q1?: string; // 주소(시군구) - 예: 강남구
  QT?: string; // 진료요일 (1~8: 월~일요일, 공휴일)
  QN?: string; // 기관명
  ORD?: string; // 순서 (NAME, DISTANCE 등)
  pageNo?: number; // 페이지 번호
  numOfRows?: number; // 목록 건수
}

export interface PharmacySearchResponse {
  totalCount: number;
  pharmacies: PharmacyInfo[];
  hasMore: boolean;
}

const API_BASE_URL = 'http://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyListInfoInqire';

/**
 * 국립중앙의료원 약국 정보 조회
 */
export async function searchPharmacies(
  params: PharmacySearchParams
): Promise<PharmacySearchResponse> {
  // 서버 사이드에서만 API 키 사용 (보안)
  const apiKey = process.env.PHARMACY_API_KEY;

  if (!apiKey) {
    console.error('❌ PHARMACY_API_KEY 환경 변수가 설정되지 않았습니다.');
    console.error('💡 해결 방법: .env.local 파일에 PHARMACY_API_KEY를 추가해주세요.');
    throw new Error('약국 정보 API 키가 설정되지 않았습니다. .env.local 파일에 PHARMACY_API_KEY를 추가해주세요.');
  }
  
  console.log('🔑 API 키 확인 완료 (길이:', apiKey.length, '자)');

  const searchParams = new URLSearchParams();
  searchParams.append('serviceKey', apiKey);
  searchParams.append('pageNo', String(params.pageNo || 1));
  // 더 많은 결과를 가져오기 위해 numOfRows 증가
  searchParams.append('numOfRows', String(params.numOfRows || 500));

  if (params.Q0) searchParams.append('Q0', params.Q0);
  if (params.Q1) searchParams.append('Q1', params.Q1);
  if (params.QT) searchParams.append('QT', params.QT);
  if (params.QN) searchParams.append('QN', params.QN);
  if (params.ORD) searchParams.append('ORD', params.ORD);

  const url = `${API_BASE_URL}?${searchParams.toString()}`;

  console.log('약국 정보 API 호출:', {
    url: url.substring(0, 100) + '...',
    params,
  });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => '응답을 읽을 수 없습니다.');
      console.error('❌ 약국 정보 API 호출 실패:', {
        status: response.status,
        statusText: response.statusText,
        responsePreview: responseText.substring(0, 500),
        url: url.substring(0, 200) + '...',
      });
      throw new Error(`약국 정보 API 호출 실패: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    console.log('✅ 약국 정보 API 응답 (XML):', xmlText.substring(0, 500));

    // XML을 JSON으로 변환
    const jsonData = await parseXMLToJSON(xmlText);

    if (jsonData.response?.header?.resultCode !== '00') {
      const errorMsg = jsonData.response?.header?.resultMsg || '알 수 없는 오류';
      const resultCode = jsonData.response?.header?.resultCode || 'UNKNOWN';
      
      console.error('❌ 약국 정보 API 오류 응답:', {
        resultCode,
        resultMsg: errorMsg,
        responseHeader: jsonData.response?.header,
      });
      
      throw new Error(`약국 정보 API 오류 (코드: ${resultCode}): ${errorMsg}`);
    }

    const items = jsonData.response?.body?.items?.item || [];
    const totalCount = parseInt(jsonData.response?.body?.totalCount || '0', 10);

    // 배열이 아닌 경우 배열로 변환
    const pharmacies: PharmacyInfo[] = Array.isArray(items) ? items : (items ? [items] : []);

    console.log('약국 정보 조회 성공:', {
      totalCount,
      pharmaciesCount: pharmacies.length,
    });

    return {
      totalCount,
      pharmacies,
      hasMore: pharmacies.length >= (params.numOfRows || 100),
    };
  } catch (error) {
    console.error('약국 정보 API 오류:', error);
    throw error;
  }
}

/**
 * XML을 JSON으로 변환 (간단한 파서)
 */
async function parseXMLToJSON(xmlText: string): Promise<any> {
  // 브라우저 환경에서는 DOMParser 사용
  if (typeof window !== 'undefined' && window.DOMParser) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    return xmlToJson(xmlDoc);
  }

  // 서버 환경에서는 간단한 정규식 파싱
  const json: any = {};
  const bodyMatch = xmlText.match(/<body>([\s\S]*?)<\/body>/);
  const headerMatch = xmlText.match(/<header>([\s\S]*?)<\/header>/);

  if (headerMatch) {
    json.response = { header: {} };
    const resultCode = headerMatch[1].match(/<resultCode>(.*?)<\/resultCode>/)?.[1];
    const resultMsg = headerMatch[1].match(/<resultMsg>(.*?)<\/resultMsg>/)?.[1];
    json.response.header = { resultCode, resultMsg };
  }

  if (bodyMatch) {
    if (!json.response) json.response = {};
    json.response.body = {};

    const totalCount = bodyMatch[1].match(/<totalCount>(.*?)<\/totalCount>/)?.[1];
    if (totalCount) json.response.body.totalCount = totalCount;

    const itemsMatch = bodyMatch[1].match(/<items>([\s\S]*?)<\/items>/);
    if (itemsMatch) {
      const itemMatches = itemsMatch[1].matchAll(/<item>([\s\S]*?)<\/item>/g);
      const items: any[] = [];

      for (const itemMatch of itemMatches) {
        const item: any = {};
        const fields = [
          'rnum', 'dutyAddr', 'dutyName', 'dutyTel1',
          'dutyTime1s', 'dutyTime1c', 'dutyTime2s', 'dutyTime2c',
          'dutyTime3s', 'dutyTime3c', 'dutyTime4s', 'dutyTime4c',
          'dutyTime5s', 'dutyTime5c', 'dutyTime6s', 'dutyTime6c',
          'dutyTime7s', 'dutyTime7c', 'dutyTime8s', 'dutyTime8c',
          'postCdn1', 'postCdn2', 'wgs84Lat', 'wgs84Lon',
        ];

        for (const field of fields) {
          const regex = new RegExp(`<${field}>(.*?)<\/${field}>`, 's');
          const match = itemMatch[1].match(regex);
          if (match) {
            item[field] = match[1].trim();
          }
        }

        if (Object.keys(item).length > 0) {
          items.push(item);
        }
      }

      json.response.body.items = { item: items.length === 1 ? items[0] : items };
    }
  }

  return json;
}

/**
 * XML을 JSON으로 변환 (DOMParser 사용)
 */
function xmlToJson(xml: Document): any {
  const result: any = {};

  if (xml.nodeType === 1) {
    // Element node
    const element = xml as unknown as Element;
    if (element.attributes && element.attributes.length > 0) {
      result['@attributes'] = {};
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        result['@attributes'][attr.nodeName] = attr.nodeValue;
      }
    }
  } else if (xml.nodeType === 3) {
    // Text node
    return xml.nodeValue;
  }

  if (xml.hasChildNodes()) {
    for (let i = 0; i < xml.childNodes.length; i++) {
      const item = xml.childNodes[i];
      const nodeName = item.nodeName;

      if (typeof result[nodeName] === 'undefined') {
        result[nodeName] = xmlToJson(item as any);
      } else {
        if (typeof result[nodeName].push === 'undefined') {
          result[nodeName] = [result[nodeName]];
        }
        result[nodeName].push(xmlToJson(item as any));
      }
    }
  }

  return result;
}