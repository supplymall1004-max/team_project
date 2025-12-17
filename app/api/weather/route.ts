/**
 * @file app/api/weather/route.ts
 * @description 날씨 정보 조회 API (기상청 API 사용)
 * 
 * GET /api/weather?lat={latitude}&lon={longitude}
 * 
 * 기상청 공공데이터포털 API를 사용하여 날씨 정보를 조회합니다.
 * 환경 변수 NEXT_PUBLIC_KMA_WEATHER_API_KEY (기상청 API 키)가 필요합니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { convertToGridCoordinates, getBaseDateTime } from "@/lib/weather/coordinate-converter";

// 동적 렌더링 강제 (API 라우트는 항상 동적)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface WeatherResponse {
  success: boolean;
  data?: {
    location: string;
    temperature: number;
    feelsLike?: number;
    description: string;
    icon: string;
    humidity: number;
    windSpeed: number;
    windDirection?: string;
    pressure?: number;
    visibility?: number;
    precipitation?: number;
  };
  error?: string;
}

/**
 * 기상청 날씨 코드를 설명으로 변환
 */
function getWeatherDescription(category: string, value: string): string {
  const descriptions: Record<string, Record<string, string>> = {
    SKY: {
      "1": "맑음",
      "3": "구름많음",
      "4": "흐림",
    },
    PTY: {
      "0": "없음",
      "1": "비",
      "2": "비/눈",
      "3": "눈",
      "4": "소나기",
    },
  };

  return descriptions[category]?.[value] || "알 수 없음";
}

/**
 * 좌표를 기반으로 지역 이름 반환
 */
function getLocationName(lat: number, lon: number): string {
  // 한국 주요 도시 좌표 범위 (대략적)
  const regions = [
    { name: "서울", latMin: 37.4, latMax: 37.7, lonMin: 126.8, lonMax: 127.2 },
    { name: "인천", latMin: 37.4, latMax: 37.6, lonMin: 126.5, lonMax: 126.8 },
    { name: "경기", latMin: 37.0, latMax: 38.5, lonMin: 126.5, lonMax: 127.8 },
    { name: "강원", latMin: 37.0, latMax: 38.5, lonMin: 127.0, lonMax: 129.5 },
    { name: "충북", latMin: 36.0, latMax: 37.5, lonMin: 127.0, lonMax: 128.5 },
    { name: "충남", latMin: 36.0, latMax: 37.0, lonMin: 126.0, lonMax: 127.5 },
    { name: "대전", latMin: 36.2, latMax: 36.5, lonMin: 127.3, lonMax: 127.6 },
    { name: "세종", latMin: 36.4, latMax: 36.7, lonMin: 127.1, lonMax: 127.4 },
    { name: "전북", latMin: 35.0, latMax: 36.5, lonMin: 126.5, lonMax: 127.8 },
    { name: "전남", latMin: 34.0, latMax: 35.5, lonMin: 125.0, lonMax: 127.5 },
    { name: "광주", latMin: 35.0, latMax: 35.3, lonMin: 126.7, lonMax: 127.0 },
    { name: "경북", latMin: 35.5, latMax: 37.0, lonMin: 128.0, lonMax: 130.0 },
    { name: "대구", latMin: 35.7, latMax: 36.0, lonMin: 128.4, lonMax: 128.7 },
    { name: "경남", latMin: 34.5, latMax: 35.8, lonMin: 127.5, lonMax: 129.5 },
    { name: "부산", latMin: 35.0, latMax: 35.3, lonMin: 129.0, lonMax: 129.3 },
    { name: "울산", latMin: 35.4, latMax: 35.7, lonMin: 129.2, lonMax: 129.5 },
    { name: "제주", latMin: 33.0, latMax: 33.6, lonMin: 126.0, lonMax: 126.9 },
  ];

  // 좌표가 속한 지역 찾기
  for (const region of regions) {
    if (
      lat >= region.latMin &&
      lat <= region.latMax &&
      lon >= region.lonMin &&
      lon <= region.lonMax
    ) {
      return region.name;
    }
  }

  // 매칭되는 지역이 없으면 좌표로 표시
  return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
}

/**
 * 기상청 날씨 코드를 아이콘 코드로 변환
 */
function getWeatherIcon(category: string, value: string): string {
  // 기상청 코드를 OpenWeatherMap 스타일 아이콘으로 매핑
  if (category === "PTY") {
    if (value === "1" || value === "4") return "10d"; // 비
    if (value === "2") return "13d"; // 비/눈
    if (value === "3") return "13d"; // 눈
    return "01d"; // 없음
  }

  if (category === "SKY") {
    if (value === "1") return "01d"; // 맑음
    if (value === "3") return "02d"; // 구름많음
    if (value === "4") return "04d"; // 흐림
  }

  return "01d"; // 기본값
}

export async function GET(request: NextRequest) {
  // 항상 JSON 응답을 보장하기 위한 래퍼
  try {
    console.group("[API] GET /api/weather (기상청 API)");
    console.log("📥 요청 URL:", request.url);

    // 1. API 키 확인
    const apiKey = process.env.NEXT_PUBLIC_KMA_WEATHER_API_KEY;
    if (!apiKey) {
      console.log("⚠️ 기상청 API 키가 설정되지 않았습니다.");
      console.groupEnd();
      return NextResponse.json<WeatherResponse>(
        {
          success: false,
          error: "기상청 API 키가 설정되지 않았습니다. .env 파일에 NEXT_PUBLIC_KMA_WEATHER_API_KEY를 추가해주세요.",
        },
        { status: 500 }
      );
    }

    // 2. 쿼리 파라미터에서 위도, 경도 추출
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      console.log("❌ 위도 또는 경도가 제공되지 않았습니다.");
      console.groupEnd();
      return NextResponse.json<WeatherResponse>(
        {
          success: false,
          error: "위도(lat)와 경도(lon) 파라미터가 필요합니다.",
        },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      console.log("❌ 유효하지 않은 위도/경도 값입니다.");
      console.groupEnd();
      return NextResponse.json<WeatherResponse>(
        {
          success: false,
          error: "유효하지 않은 위도/경도 값입니다.",
        },
        { status: 400 }
      );
    }

    console.log(`📍 위치: ${latitude}, ${longitude}`);

    // 3. 격자 좌표로 변환
    const { nx, ny } = convertToGridCoordinates(latitude, longitude);
    console.log(`🗺️ 격자 좌표: nx=${nx}, ny=${ny}`);

    // 4. base_date와 base_time 계산
    const { baseDate, baseTime } = getBaseDateTime();
    console.log(`📅 기준 시간: ${baseDate} ${baseTime}`);

    // 5. 기상청 초단기실황 API 호출
    const apiUrl = new URL("https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst");
    apiUrl.searchParams.set("serviceKey", apiKey);
    apiUrl.searchParams.set("pageNo", "1");
    apiUrl.searchParams.set("numOfRows", "10");
    apiUrl.searchParams.set("dataType", "JSON");
    apiUrl.searchParams.set("base_date", baseDate);
    apiUrl.searchParams.set("base_time", baseTime);
    apiUrl.searchParams.set("nx", String(nx));
    apiUrl.searchParams.set("ny", String(ny));

    console.log("🌐 기상청 API 호출 중...");
    const weatherResponse = await fetch(apiUrl.toString());

    if (!weatherResponse.ok) {
      console.error("❌ 기상청 API HTTP 오류:", weatherResponse.status);
      const errorText = await weatherResponse.text().catch(() => "응답을 읽을 수 없습니다");
      console.error("❌ 오류 응답 내용:", errorText.substring(0, 500));
      console.groupEnd();
      return NextResponse.json<WeatherResponse>(
        {
          success: false,
          error: `기상청 API 호출 실패 (HTTP ${weatherResponse.status})`,
        },
        { status: weatherResponse.status }
      );
    }

    // 응답이 JSON인지 확인
    const contentType = weatherResponse.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const errorText = await weatherResponse.text().catch(() => "응답을 읽을 수 없습니다");
      console.error("❌ JSON이 아닌 응답 수신:", errorText.substring(0, 500));
      console.groupEnd();
      return NextResponse.json<WeatherResponse>(
        {
          success: false,
          error: "기상청 API가 JSON이 아닌 응답을 반환했습니다.",
        },
        { status: 500 }
      );
    }

    const weatherData = await weatherResponse.json().catch((err) => {
      console.error("❌ JSON 파싱 오류:", err);
      throw new Error("기상청 API 응답을 파싱할 수 없습니다.");
    });
    console.log("✅ 기상청 API 응답 수신");

    // 6. 응답 데이터 파싱
    if (weatherData.response?.header?.resultCode !== "00") {
      const errorMsg = weatherData.response?.header?.resultMsg || "알 수 없는 오류";
      console.error("❌ 기상청 API 오류:", errorMsg);
      console.groupEnd();
      return NextResponse.json<WeatherResponse>(
        {
          success: false,
          error: `기상청 API 오류: ${errorMsg}`,
        },
        { status: 400 }
      );
    }

    const items = weatherData.response?.body?.items?.item || [];
    if (items.length === 0) {
      console.error("❌ 날씨 데이터가 없습니다.");
      console.groupEnd();
      return NextResponse.json<WeatherResponse>(
        {
          success: false,
          error: "날씨 데이터를 찾을 수 없습니다.",
        },
        { status: 404 }
      );
    }

    // 7. 데이터 추출 및 변환
    const dataMap: Record<string, string> = {};
    items.forEach((item: { category: string; obsrValue: string }) => {
      dataMap[item.category] = item.obsrValue;
    });

    console.log("📊 추출된 날씨 데이터:", dataMap);

    // 온도 (T1H: 기온)
    const temperature = Math.round(parseFloat(dataMap.T1H || "0"));
    
    // 습도 (REH: 습도)
    const humidity = Math.round(parseFloat(dataMap.REH || "0"));
    
    // 풍속 (WSD: 풍속, m/s)
    const windSpeed = Math.round(parseFloat(dataMap.WSD || "0") * 3.6); // m/s to km/h
    
    // 풍향 (VEC: 풍향, degree)
    const windDirection = dataMap.VEC ? `${Math.round(parseFloat(dataMap.VEC))}°` : undefined;
    
    // 하늘 상태 (SKY: 하늘상태)
    const skyCode = dataMap.SKY || "1";
    const skyDescription = getWeatherDescription("SKY", skyCode);
    
    // 강수 형태 (PTY: 강수형태)
    const ptyCode = dataMap.PTY || "0";
    const ptyDescription = getWeatherDescription("PTY", ptyCode);
    
    // 날씨 설명 조합
    let description = skyDescription;
    if (ptyCode !== "0") {
      description = ptyDescription;
    }
    
    // 아이콘 결정
    const icon = ptyCode !== "0" 
      ? getWeatherIcon("PTY", ptyCode)
      : getWeatherIcon("SKY", skyCode);

    // 위치 정보 (지역 이름으로 표시)
    const location = getLocationName(latitude, longitude);

    const result: WeatherResponse = {
      success: true,
      data: {
        location,
        temperature,
        description,
        icon,
        humidity,
        windSpeed,
        windDirection,
        precipitation: ptyCode !== "0" ? parseFloat(dataMap.RN1 || "0") : undefined,
      },
    };

    console.log("📊 변환된 날씨 정보:", result.data);
    console.groupEnd();

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ 날씨 API 오류:", error);
    console.error("❌ 에러 스택:", error instanceof Error ? error.stack : "스택 정보 없음");
    console.groupEnd();
    
    // 항상 JSON 응답 반환 보장
    try {
      return NextResponse.json<WeatherResponse>(
        {
          success: false,
          error: error instanceof Error ? error.message : "날씨 정보를 가져오는 중 오류가 발생했습니다.",
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    } catch (jsonError) {
      // JSON 응답 생성 실패 시에도 텍스트로 반환
      console.error("❌ JSON 응답 생성 실패:", jsonError);
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: "서버 오류가 발생했습니다.",
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
  }
}
