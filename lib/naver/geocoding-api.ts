/**
 * @file geocoding-api.ts
 * @description 네이버 지오코딩 API 호출 함수
 *
 * 주소를 좌표로 변환하거나 좌표를 주소로 변환합니다.
 * 서버 사이드에서만 호출하여 API 키를 보호합니다.
 *
 * 참고: 네이버 클라우드 플랫폼 Maps API 가이드
 * https://api.ncloud-docs.com/docs/ko/application-maps-overview
 */

/**
 * 주소를 좌표로 변환 (지오코딩)
 *
 * @param address 검색할 주소
 * @returns 좌표 정보
 */
export async function geocodeAddress(address: string): Promise<{
  lat: number;
  lon: number;
  locationName?: string | null;
} | null> {
  console.group("[Naver Geocoding API] 주소 → 좌표 변환");
  console.log(`📍 주소: ${address}`);

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  // 환경변수 확인 및 상세 에러 메시지
  if (!clientId || clientId.trim() === "") {
    console.error("❌ NAVER_CLIENT_ID 환경변수가 설정되지 않았습니다.");
    console.error("💡 .env.local 파일에 다음을 추가해주세요:");
    console.error("   NAVER_CLIENT_ID=your_client_id_here");
    console.groupEnd();
    throw new Error(
      "NAVER_CLIENT_ID 환경변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요."
    );
  }

  if (!clientSecret || clientSecret.trim() === "") {
    console.error("❌ NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다.");
    console.error("💡 .env.local 파일에 다음을 추가해주세요:");
    console.error("   NAVER_CLIENT_SECRET=your_client_secret_here");
    console.groupEnd();
    throw new Error(
      "NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요."
    );
  }

  // 환경변수 값 검증 (공백 제거)
  const trimmedClientId = clientId.trim();
  const trimmedClientSecret = clientSecret.trim();
  
  console.log(`🔍 환경변수 확인:`);
  console.log(`   - NAVER_CLIENT_ID: ${trimmedClientId.substring(0, 5)}... (길이: ${trimmedClientId.length}자)`);
  console.log(`   - NAVER_CLIENT_SECRET: ${trimmedClientSecret.substring(0, 5)}... (길이: ${trimmedClientSecret.length}자)`);
  
  // 공백이나 특수문자 확인
  if (trimmedClientId.includes(" ") || trimmedClientSecret.includes(" ")) {
    console.warn("⚠️ 환경변수에 공백이 포함되어 있습니다. 공백을 제거해주세요.");
  }

  try {
    /**
     * 네이버 지오코딩은 "구/시" 같은 행정구역 단위만 입력하면
     * 결과가 비는 케이스가 있어(특히 자주 사용하는 "미추홀구" 등),
     * 보정 쿼리로 한 번 더 재시도합니다.
     *
     * 예) "인천광역시 미추홀구" → "인천광역시 미추홀구청"
     * 예) "인천광역시 경인로 251번길 36" → 원본 그대로 사용
     */
    const queries = (() => {
      const normalized = address.trim();
      const candidateQueries = [normalized];
      
      // 상세 주소(도로명 주소 포함)인 경우 단계적으로 검색어 생성
      if (normalized.includes("로") || normalized.includes("길") || normalized.includes("번지") || normalized.includes("번길")) {
        console.log("📍 상세 주소로 인식, 단계적 검색어 생성");
        
        // 1. 원본 주소 그대로
        candidateQueries.push(normalized);
        
        // 2. 번지/번길 제거한 버전 (예: "경인로 251번길 36" → "경인로 251번길")
        const withoutBuildingNumber = normalized.replace(/\s+\d+번?지?\s*$/, "").replace(/\s+\d+번길\s+\d+/, "번길");
        if (withoutBuildingNumber !== normalized && withoutBuildingNumber.trim()) {
          candidateQueries.push(withoutBuildingNumber.trim());
          console.log(`   → 건물번호 제거: "${withoutBuildingNumber.trim()}"`);
        }
        
        // 3. 번길까지 제거한 버전 (예: "경인로 251번길" → "경인로")
        const withoutStreetNumber = withoutBuildingNumber.replace(/\s+\d+번길/, "").trim();
        if (withoutStreetNumber !== withoutBuildingNumber && withoutStreetNumber.trim()) {
          candidateQueries.push(withoutStreetNumber.trim());
          console.log(`   → 번길 제거: "${withoutStreetNumber.trim()}"`);
        }
        
        // 4. 시/구 단위만 추출 (예: "인천광역시 경인로" → "인천광역시")
        // "인천광역시" 또는 "인천광역시 미추홀구" 같은 형식만 추출
        const cityGuMatch = normalized.match(/^(.+?시(?:\s+.+?구)?)/);
        if (cityGuMatch && cityGuMatch[1] !== normalized && cityGuMatch[1].trim().length > 2) {
          const cityGu = cityGuMatch[1].trim();
          // "인천광역시 경" 같은 잘못된 추출 방지
          if (!cityGu.endsWith(" 경") && !cityGu.endsWith(" 로") && !cityGu.endsWith(" 길")) {
            candidateQueries.push(cityGu);
            console.log(`   → 시/구 단위: "${cityGu}"`);
          }
        }
        
        // 중복 제거
        const uniqueQueries = Array.from(new Set(candidateQueries));
        console.log(`📍 도로명 주소 검색 쿼리 후보: ${uniqueQueries.join(", ")}`);
        return uniqueQueries;
      }
      
      // "…구/…시/…군"으로 끝나면 "구청/시청/군청"을 붙여 재시도
      if (/[구시군]$/.test(normalized)) {
        const last = normalized.at(-1);
        // 이미 "…구/…시/…군"으로 끝나므로 "청"만 붙여야 "구구청" 같은 중복이 안 생김
        const suffix = last === "구" || last === "시" || last === "군" ? "청" : "";
        if (suffix) {
          candidateQueries.push(`${normalized}${suffix}`);
          console.log(`📍 행정구역 단위 감지, 보정 쿼리 추가: ${normalized}${suffix}`);
        }
      }
      
      // "시청"으로 끝나지 않는 경우에도 "시청" 추가 시도
      if (normalized.includes("시") && !normalized.includes("시청")) {
        const cityMatch = normalized.match(/(.+시)/);
        if (cityMatch) {
          candidateQueries.push(`${cityMatch[1]}청`);
          console.log(`📍 시 단위 감지, 시청 추가: ${cityMatch[1]}청`);
        }
      }
      
      // 중복 제거
      const uniqueQueries = Array.from(new Set(candidateQueries));
      console.log(`📍 검색 쿼리 후보: ${uniqueQueries.join(", ")}`);
      return uniqueQueries;
    })();

    for (const query of queries) {
      // 네이버 클라우드 플랫폼 Maps API 가이드 준수
      // Geocoding: https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode
      // 참고: https://api.ncloud-docs.com/docs/ko/application-maps-overview
      // Classic 및 VPC 환경 모두에서 사용 가능한 도메인 사용
      // maps.apigw.ntruss.com은 VPC 전용이므로 일반 웹 환경에서는 naveropenapi 사용
      const url = new URL("https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode");
      url.searchParams.set("query", query);

      console.log(`🌐 API 호출: ${url.toString()}`);
      console.log(`🔑 사용 중인 Client ID: ${trimmedClientId.substring(0, 5)}...`);
      console.log(`🔑 Client ID 전체 길이: ${trimmedClientId.length}자`);
      console.log(`🔑 Client Secret 길이: ${trimmedClientSecret.length}자`);
      
      const response = await fetch(url.toString(), {
        headers: {
          "X-NCP-APIGW-API-KEY-ID": trimmedClientId,
          "X-NCP-APIGW-API-KEY": trimmedClientSecret,
        },
      });
      
      console.log(`📡 HTTP 응답 상태: ${response.status} ${response.statusText}`);
      console.log(`📡 응답 헤더:`, Object.fromEntries(response.headers.entries()));

      // Content-Type 확인
      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        // 에러 응답 처리: 텍스트로 먼저 읽기
        let errorText = "";
        try {
          errorText = await response.text();
          console.error(
            `❌ API 호출 실패 (${response.status}) [query="${query}"]:`,
            errorText.substring(0, 500),
          );
        } catch (textError) {
          console.error(`❌ 응답 본문 읽기 실패:`, textError);
          errorText = `HTTP ${response.status} ${response.statusText}`;
        }

        // 401 에러에 대한 상세 안내
        if (response.status === 401) {
          console.error("🔐 401 인증 실패 - 가능한 원인:");
          console.error(
            "   1. NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET 값이 잘못되었습니다.",
          );
          console.error("   2. 네이버 클라우드 플랫폼 콘솔에서 API 키가 비활성화되었습니다.");
          console.error("   3. 네이버 클라우드 플랫폼 Maps API 서비스가 활성화되지 않았습니다.");
          console.error("   4. Maps API용 키가 아닌 기존 지도 API 키를 사용하고 있을 수 있습니다.");
          console.error("💡 해결 방법:");
          console.error("   - 네이버 클라우드 플랫폼 콘솔 → Application Service → Maps");
          console.error("   - Maps 상품 활성화 및 새로운 API 키 발급 확인");
          console.error("   - .env.local 파일의 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET이 Maps API용인지 확인");
          console.error(`   - 현재 사용 중인 Client ID: ${clientId.substring(0, 5)}...`);
          console.error("   ⚠️ 중요: 2025년 7월 1일부터 Maps API는 새로운 키가 필요합니다!");
          
          // 401 에러는 모든 쿼리에서 발생할 것이므로 즉시 종료
          console.groupEnd();
          throw new Error(
            "네이버 Maps API 인증에 실패했습니다. Maps API 서비스가 활성화되어 있고 올바른 API 키를 사용하고 있는지 확인해주세요."
          );
        }

        // 400 에러 (잘못된 요청)에 대한 안내
        if (response.status === 400) {
          console.error("⚠️ 400 잘못된 요청 - 가능한 원인:");
          console.error("   1. 검색어 형식이 올바르지 않습니다.");
          console.error("   2. API 엔드포인트 URL이 잘못되었습니다.");
          console.error(`   - 호출 URL: ${url.toString()}`);
        }

        // 다음 후보 query가 있으면 계속 시도
        continue;
      }

      // 성공 응답 처리: JSON 파싱
      let data: {
        status: string;
        addresses: Array<{
          roadAddress: string;
          jibunAddress: string;
          x: string; // 경도
          y: string; // 위도
        }>;
      };

      try {
        if (contentType.includes("application/json")) {
          data = (await response.json()) as typeof data;
        } else {
          // JSON이 아닌 경우 텍스트로 읽고 파싱 시도
          const responseText = await response.text();
          console.warn("⚠️ Content-Type이 JSON이 아닙니다:", contentType);
          console.warn("응답 본문:", responseText.substring(0, 200));

          try {
            data = JSON.parse(responseText) as typeof data;
          } catch (parseError) {
            console.error("❌ JSON 파싱 실패:", parseError);
            continue;
          }
        }
      } catch (parseError) {
        console.error("❌ 응답 파싱 오류:", parseError);
        continue;
      }

      // API 응답 상태 상세 로깅
      console.log(`📊 API 응답 상태: ${data.status}, 주소 개수: ${data.addresses?.length || 0}`);
      
      // 응답에 errorMessage가 있는지 확인
      if ((data as any).errorMessage) {
        console.warn(`⚠️ API 에러 메시지: ${(data as any).errorMessage}`);
      }
      
      if (data.status !== "OK") {
        console.warn(`⚠️ API 응답 상태가 OK가 아닙니다. (status="${data.status}", query="${query}")`);
        // 응답 본문 전체 로깅 (디버깅용)
        console.log("📄 API 응답 본문:", JSON.stringify(data, null, 2));
        continue;
      }
      
      if (!data.addresses || data.addresses.length === 0) {
        console.warn(`⚠️ 주소를 찾을 수 없습니다. (query="${query}")`);
        // 응답 본문 전체 로깅 (디버깅용)
        console.log("📄 API 응답 본문:", JSON.stringify(data, null, 2));
        continue;
      }

      const firstAddress = data.addresses[0];
      const lat = parseFloat(firstAddress.y);
      const lon = parseFloat(firstAddress.x);

      // 지역명 추출 (도로명 주소 또는 지번 주소에서)
      let locationName: string | null = null;
      const roadAddr = firstAddress.roadAddress || "";
      const jibunAddr = firstAddress.jibunAddress || "";

      // 도로명 주소에서 구/시/군 추출
      const roadAddrParts = roadAddr.split(/\s+/);
      for (const part of roadAddrParts) {
        if (part.includes("구") || part.includes("시") || part.includes("군")) {
          locationName = part;
          break;
        }
      }

      // 도로명 주소에서 찾지 못하면 지번 주소에서 추출
      if (!locationName) {
        const jibunAddrParts = jibunAddr.split(/\s+/);
        for (const part of jibunAddrParts) {
          if (part.includes("구") || part.includes("시") || part.includes("군")) {
            locationName = part;
            break;
          }
        }
      }

      // 원본 검색어에서도 추출 시도
      if (!locationName) {
        const searchParts = address.split(/\s+/);
        for (const part of searchParts) {
          if (
            part.includes("구") ||
            part.includes("시") ||
            part.includes("군") ||
            part.includes("동")
          ) {
            locationName = part;
            break;
          }
        }
      }

      console.log(`✅ 좌표 변환 성공: ${lat}, ${lon}`);
      if (locationName) {
        console.log(`📍 추출된 지역명: ${locationName}`);
      }
      console.groupEnd();
      return { lat, lon, locationName: locationName || null };
    }

    console.warn("⚠️ 모든 지오코딩 시도가 실패했습니다.");
    console.warn(`   시도한 검색어: ${queries.join(", ")}`);
    console.warn("💡 가능한 원인:");
    console.warn("   1. 검색어가 너무 모호하거나 잘못되었습니다.");
    console.warn("   2. 네이버 지오코딩 API에서 해당 주소를 찾을 수 없습니다.");
    console.warn("   3. 더 구체적인 주소를 입력해보세요 (예: '서울시청', '인천광역시 미추홀구청').");
    console.groupEnd();
    return null;
  } catch (error) {
    console.error("❌ 네이버 지오코딩 API 오류:", error);
    console.groupEnd();
    return null;
  }
}

/**
 * 좌표를 주소로 변환 (역지오코딩)
 *
 * @param lat 위도
 * @param lon 경도
 * @returns 주소 정보
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<{
  roadAddress: string;
  jibunAddress: string;
} | null> {
  console.group("[Naver Geocoding API] 좌표 → 주소 변환");
  console.log(`📍 좌표: ${lat}, ${lon}`);

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  // 환경변수 확인 및 상세 에러 메시지
  if (!clientId || clientId.trim() === "") {
    console.error("❌ NAVER_CLIENT_ID 환경변수가 설정되지 않았습니다.");
    console.error("💡 .env.local 파일에 다음을 추가해주세요:");
    console.error("   NAVER_CLIENT_ID=your_client_id_here");
    console.groupEnd();
    throw new Error(
      "NAVER_CLIENT_ID 환경변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요."
    );
  }

  if (!clientSecret || clientSecret.trim() === "") {
    console.error("❌ NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다.");
    console.error("💡 .env.local 파일에 다음을 추가해주세요:");
    console.error("   NAVER_CLIENT_SECRET=your_client_secret_here");
    console.groupEnd();
    throw new Error(
      "NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요."
    );
  }

  // 네이버 클라우드 플랫폼 Maps API 가이드 준수
  // Reverse Geocoding: https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/reversegeocode
  // 참고: https://api.ncloud-docs.com/docs/ko/application-maps-overview
  // Classic 및 VPC 환경 모두에서 사용 가능한 도메인 사용
  const url = new URL("https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/reversegeocode");
  url.searchParams.set("coords", `${lon},${lat}`);
  url.searchParams.set("output", "json");

  try {
    console.log(`🌐 API 호출: ${url.toString()}`);
    const response = await fetch(url.toString(), {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY": clientSecret,
      },
    });

    // Content-Type 확인
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      // 에러 응답 처리: 텍스트로 먼저 읽기
      let errorText = "";
      try {
        errorText = await response.text();
        console.error(`❌ API 호출 실패 (${response.status}):`, errorText.substring(0, 500));
      } catch (textError) {
        console.error(`❌ 응답 본문 읽기 실패:`, textError);
        errorText = `HTTP ${response.status} ${response.statusText}`;
      }
      
      // 401 에러에 대한 상세 안내
      if (response.status === 401) {
        console.error("🔐 401 인증 실패 - 가능한 원인:");
        console.error("   1. NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET 값이 잘못되었습니다.");
        console.error("   2. 네이버 클라우드 플랫폼 콘솔에서 API 키가 비활성화되었습니다.");
        console.error("   3. 네이버 클라우드 플랫폼 지오코딩 API 서비스가 활성화되지 않았습니다.");
        console.error("💡 해결 방법:");
        console.error("   - 네이버 클라우드 플랫폼 콘솔에서 API 키 확인");
        console.error("   - 지오코딩 API 서비스 활성화 확인");
        console.error("   - .env.local 파일의 환경변수 값이 올바른지 확인");
      }
      
      console.groupEnd();
      return null;
    }

    // 성공 응답 처리: JSON 파싱
    let data: {
      status: string;
      results: Array<{
        region: {
          area1: { name: string };
          area2: { name: string };
          area3: { name: string };
        };
        land: {
          name: string;
          number1: string;
          number2: string;
        };
        road: {
          name: string;
          number1: string;
        };
      }>;
    };
    
    try {
      if (contentType.includes("application/json")) {
        data = (await response.json()) as typeof data;
      } else {
        // JSON이 아닌 경우 텍스트로 읽고 파싱 시도
        const responseText = await response.text();
        console.warn("⚠️ Content-Type이 JSON이 아닙니다:", contentType);
        console.warn("응답 본문:", responseText.substring(0, 200));
        
        try {
          data = JSON.parse(responseText) as typeof data;
        } catch (parseError) {
          console.error("❌ JSON 파싱 실패:", parseError);
          console.groupEnd();
          return null;
        }
      }
    } catch (parseError) {
      console.error("❌ 응답 파싱 오류:", parseError);
      console.groupEnd();
      return null;
    }

    if (data.status !== "OK" || data.results.length === 0) {
      console.warn("⚠️ 주소를 찾을 수 없습니다.");
      console.groupEnd();
      return null;
    }

    const firstResult = data.results[0];
    const roadAddress = `${firstResult.region.area1.name} ${firstResult.region.area2.name} ${firstResult.region.area3.name} ${firstResult.road.name} ${firstResult.road.number1}`;
    const jibunAddress = `${firstResult.region.area1.name} ${firstResult.region.area2.name} ${firstResult.region.area3.name} ${firstResult.land.name} ${firstResult.land.number1}-${firstResult.land.number2}`;

    console.log(`✅ 주소 변환 성공: ${roadAddress}`);
    console.groupEnd();
    return { roadAddress, jibunAddress };
  } catch (error) {
    console.error("❌ 네이버 역지오코딩 API 오류:", error);
    console.groupEnd();
    return null;
  }
}

