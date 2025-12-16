/**
 * @file coordinate-converter.ts
 * @description 기상청 API용 좌표 변환 유틸리티
 * 
 * 기상청 API는 위도/경도 대신 격자 좌표(nx, ny)를 사용합니다.
 * 이 파일은 위도/경도를 격자 좌표로 변환하는 함수를 제공합니다.
 */

/**
 * 위도/경도를 기상청 격자 좌표로 변환
 * 
 * @param lat 위도 (latitude)
 * @param lon 경도 (longitude)
 * @returns 격자 좌표 { nx: number, ny: number }
 */
export function convertToGridCoordinates(lat: number, lon: number): {
  nx: number;
  ny: number;
} {
  // 기상청 격자 좌표 변환 공식
  const RE = 6371.00877; // 지구 반경(km)
  const GRID = 5.0; // 격자 간격(km)
  const SLAT1 = 30.0; // 투영 위도1(degree)
  const SLAT2 = 60.0; // 투영 위도2(degree)
  const OLON = 126.0; // 기준점 경도(degree)
  const OLAT = 38.0; // 기준점 위도(degree)
  const XO = 43; // 기준점 X좌표(GRID)
  const YO = 136; // 기준점 Y좌표(GRID)

  const DEGRAD = Math.PI / 180.0;
  const RADDEG = 180.0 / Math.PI;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  return { nx, ny };
}

/**
 * 현재 시간 기준으로 기상청 API에 필요한 base_date와 base_time 계산
 * 
 * 기상청 초단기실황 API는 매 시간 정각에 발표되며,
 * 해당 자료는 발표 시각으로부터 약 40분 후에 제공됩니다.
 * 
 * 예: 현재 시각이 07:58이면 가장 최근 자료는 07:00 발표 자료
 *     현재 시각이 07:30이면 아직 07:00 자료가 제공되지 않으므로 06:00 자료 사용
 * 
 * @returns { base_date: string, base_time: string }
 */
export function getBaseDateTime(): { baseDate: string; baseTime: string } {
  const now = new Date();
  
  // 한국 시간 (UTC+9)
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  
  let hour = kst.getHours();
  let date = new Date(kst);
  const minute = kst.getMinutes();

  // 초단기실황은 발표 시각으로부터 약 40분 후에 제공됨
  // 현재 시간이 정각 + 40분 이전이면 이전 시간 데이터 사용
  if (minute < 40) {
    hour = hour - 1;
    if (hour < 0) {
      hour = 23;
      // 전날로 이동
      date.setDate(date.getDate() - 1);
    }
  }

  // base_time은 HH00 형식 (정각)
  const baseTime = `${String(hour).padStart(2, "0")}00`;

  // base_date는 YYYYMMDD 형식
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const baseDate = `${year}${month}${day}`;

  return { baseDate, baseTime };
}

