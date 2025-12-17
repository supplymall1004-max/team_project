/**
 * @file medical-facilities-map.tsx
 * @description 의료기관 지도 컴포넌트
 *
 * 네이버 지도를 사용하여 현재위치를 표시하고 선택된 카테고리의 의료기관을 검색하여 표시합니다.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Navigation, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { getNaverMapScriptUrl, isNaverMapLoaded } from "@/lib/naver/map-client";
import { CATEGORY_KEYWORDS } from "@/types/medical-facility";
import type { MedicalFacilityCategory, MedicalFacility } from "@/types/medical-facility";

interface MedicalFacilitiesMapProps {
  selectedCategory: MedicalFacilityCategory;
}

export function MedicalFacilitiesMap({ selectedCategory }: MedicalFacilitiesMapProps) {
  console.log("[MedicalFacilitiesMap] 컴포넌트 렌더링, 선택 카테고리:", selectedCategory);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const [isContainerReady, setIsContainerReady] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [facilities, setFacilities] = useState<MedicalFacility[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // 네이버 지도 인증 실패 처리 (공식 문서 참고)
  useEffect(() => {
    // 네이버 지도 API 인증 실패 시 호출되는 전역 함수
    (window as any).navermap_authFailure = () => {
      console.error("❌ 네이버 지도 API 인증 실패");
      setError("네이버 지도 API 인증에 실패했습니다. Client ID를 확인해주세요.");
      setIsLoading(false);
    };

    return () => {
      delete (window as any).navermap_authFailure;
    };
  }, []);

  // 네이버 지도 스크립트 로드
  const loadNaverMapScript = useCallback(() => {
    console.log("[MedicalFacilitiesMap] 네이버 지도 스크립트 로드 시작");

    return new Promise<void>((resolve, reject) => {
      if (isNaverMapLoaded()) {
        console.log("[MedicalFacilitiesMap] 네이버 지도 스크립트 이미 로드됨");
        resolve();
        return;
      }

      // 이미 로드 중인 스크립트가 있는지 확인
      const existingScript = document.querySelector('script[src*="oapi.map.naver.com"]');
      if (existingScript) {
        console.log("[MedicalFacilitiesMap] 네이버 지도 스크립트가 이미 로드 중입니다");
        // 기존 스크립트의 로드를 기다림
        let checkCount = 0;
        const checkInterval = setInterval(() => {
          checkCount++;
          if (isNaverMapLoaded()) {
            clearInterval(checkInterval);
            console.log("[MedicalFacilitiesMap] 기존 스크립트 로드 완료");
            resolve();
          } else if (checkCount > 100) { // 10초 타임아웃
            clearInterval(checkInterval);
            console.error("[MedicalFacilitiesMap] 기존 스크립트 로드 타임아웃");
            reject(new Error("지도 API 로드 타임아웃"));
          }
        }, 100);
        return;
      }

      const scriptUrl = getNaverMapScriptUrl();
      console.log("[MedicalFacilitiesMap] 스크립트 URL:", scriptUrl);
      console.log("[MedicalFacilitiesMap] 현재 페이지 URL:", typeof window !== "undefined" ? window.location.origin : "알 수 없음");

      const script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      script.defer = false;

      // 타임아웃 설정 (15초)
      let checkInterval: NodeJS.Timeout | null = null;
      let checkCount = 0;
      const maxChecks = 150; // 15초 (100ms * 150)

      const timeoutId = setTimeout(() => {
        console.error("[MedicalFacilitiesMap] 네이버 지도 스크립트 로드 타임아웃 (15초)");
        cleanup();
        script.remove();
        reject(new Error("네이버 지도 스크립트 로드가 시간 초과되었습니다. 네트워크 연결을 확인해주세요."));
      }, 15000);

      const cleanup = () => {
        clearTimeout(timeoutId);
        if (checkInterval) clearInterval(checkInterval);
      };

      // API 초기화 확인 함수
      const checkApiReady = () => {
        checkCount++;
        if (isNaverMapLoaded()) {
          console.log("[MedicalFacilitiesMap] 네이버 지도 API 초기화 완료");
          cleanup();
          resolve();
        } else if (checkCount >= maxChecks) {
          console.error("[MedicalFacilitiesMap] 네이버 지도 API 초기화 타임아웃");
          cleanup();
          script.remove();
          reject(new Error("네이버 지도 API 초기화가 시간 초과되었습니다. 네트워크 연결을 확인해주세요."));
        }
      };

      script.onload = () => {
        console.log("[MedicalFacilitiesMap] 네이버 지도 스크립트 파일 로드 완료, API 초기화 대기 중...");
        // 스크립트 로드 후 API가 완전히 초기화될 때까지 주기적으로 확인
        checkInterval = setInterval(checkApiReady, 100);
      };

      script.onerror = (error) => {
        cleanup();
        console.error("[MedicalFacilitiesMap] 네이버 지도 스크립트 로드 실패:", error);
        reject(new Error("네이버 지도 스크립트를 로드할 수 없습니다. 인터넷 연결을 확인해주세요."));
      };

      console.log("[MedicalFacilitiesMap] 스크립트 태그를 head에 추가합니다");
      document.head.appendChild(script);
    });
  }, []);

  // 현재위치 가져오기
  const getCurrentLocation = useCallback(() => {
    console.log("[MedicalFacilitiesMap] 현재위치 가져오기 시작");
    setIsGettingLocation(true);

    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      // 브라우저 지원 확인
      if (!navigator.geolocation) {
        console.error("[MedicalFacilitiesMap] Geolocation API가 지원되지 않습니다");
        reject(new Error("이 브라우저는 위치 정보를 지원하지 않습니다."));
        return;
      }

      // HTTPS 확인 (개발 환경에서는 localhost 허용)
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isSecure = window.location.protocol === 'https:' || isLocalhost;

      if (!isSecure) {
        console.warn("[MedicalFacilitiesMap] HTTP 환경에서 위치 정보 요청 (개발 환경 허용)");
        // 개발 환경에서는 HTTP도 허용하지만 경고 표시
      }

      console.log("[MedicalFacilitiesMap] Geolocation API 호출 시작");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("[MedicalFacilitiesMap] 현재위치 가져오기 성공:", { latitude, longitude });
          setIsGettingLocation(false);
          resolve({ lat: latitude, lng: longitude });
        },
        (error) => {
          // 더 자세한 에러 로깅
          console.error("[MedicalFacilitiesMap] 현재위치 가져오기 실패:");
          console.error("  - 에러 객체:", error);
          console.error("  - 에러 타입:", typeof error);
          console.error("  - 에러 프로퍼티:", error ? Object.getOwnPropertyNames(error) : 'null/undefined');

          // 에러 객체의 모든 프로퍼티 확인
          if (error) {
            console.error("  - 에러 상세 정보:");
            for (const key in error) {
              console.error(`    ${key}:`, error[key]);
            }
          }

          // 에러 객체의 안전한 확인
          if (!error || typeof error !== 'object') {
            console.error("[MedicalFacilitiesMap] 에러 객체가 유효하지 않습니다:", error);
            reject(new Error("현재 위치를 가져올 수 없습니다."));
            return;
          }

          let errorMessage = "현재 위치를 가져올 수 없습니다.";

          // GeolocationPositionError의 표준 에러 코드 확인
          if (error && typeof error.code === 'number') {
            switch (error.code) {
              case 1: // PERMISSION_DENIED
                errorMessage = "위치 정보 접근 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.";
                break;
              case 2: // POSITION_UNAVAILABLE
                errorMessage = "위치 정보를 사용할 수 없습니다. GPS 신호를 확인해주세요.";
                break;
              case 3: // TIMEOUT
                errorMessage = "위치 정보 요청이 시간 초과되었습니다. 다시 시도해주세요.";
                break;
              default:
                errorMessage = `위치 정보 오류 (코드: ${error.code})`;
                break;
            }
          } else {
            // 에러 객체가 유효하지 않은 경우
            console.error("[MedicalFacilitiesMap] 유효하지 않은 에러 객체:", error);
            errorMessage = "위치 정보 접근 중 알 수 없는 오류가 발생했습니다.";
          }

          setIsGettingLocation(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5분
        }
      );
    });
  }, []);

  // 지도 초기화
  const initializeMap = useCallback(async (userLatLng: { lat: number; lng: number }) => {
    console.log("[MedicalFacilitiesMap] 지도 초기화 시작");

    // 컨테이너는 이미 준비되었으므로 API만 확인
    let attempts = 0;
    const maxAttempts = 10; // 1초로 줄임

    while (attempts < maxAttempts) {
      if (isNaverMapLoaded()) {
        console.log(`[MedicalFacilitiesMap] 지도 API 준비됨 (시도: ${attempts + 1})`);
        break;
      }

      console.log(`[MedicalFacilitiesMap] API 로드 대기 중... (${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!mapRef.current) {
      console.error("[MedicalFacilitiesMap] 지도 컨테이너가 존재하지 않습니다");
      console.error("DOM 요소가 아직 렌더링되지 않았을 수 있습니다.");
      throw new Error("지도 컨테이너가 준비되지 않았습니다. 페이지를 새로고침해주세요.");
    }

    if (!isNaverMapLoaded()) {
      console.error("[MedicalFacilitiesMap] 네이버 지도 API가 로드되지 않았습니다");
      console.error("현재 window.naver:", (window as any).naver);
      throw new Error("지도 API가 로드되지 않았습니다.");
    }

    try {
      const naver = (window as any).naver;
      if (!naver) {
        console.error("[MedicalFacilitiesMap] window.naver가 존재하지 않습니다");
        throw new Error("네이버 지도 API가 로드되지 않았습니다.");
      }
      if (!naver.maps) {
        console.error("[MedicalFacilitiesMap] window.naver.maps가 존재하지 않습니다");
        throw new Error("네이버 지도 API가 완전히 로드되지 않았습니다.");
      }

      // 지도 옵션
      const mapOptions = {
        center: new naver.maps.LatLng(userLatLng.lat, userLatLng.lng),
        zoom: 15,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: naver.maps.MapTypeControlStyle.BUTTON,
          position: naver.maps.Position.TOP_RIGHT,
        },
      };

      // 지도 생성
      mapInstanceRef.current = new naver.maps.Map(mapRef.current, mapOptions);
      console.log("[MedicalFacilitiesMap] 지도 생성 완료");

      // 사용자 위치 마커 생성
      userMarkerRef.current = new naver.maps.Marker({
        position: new naver.maps.LatLng(userLatLng.lat, userLatLng.lng),
        map: mapInstanceRef.current,
        icon: {
          content: `
            <div style="
              width: 20px;
              height: 20px;
              background: #4285f4;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            "></div>
          `,
          size: new naver.maps.Size(26, 26),
          anchor: new naver.maps.Point(13, 13),
        },
        title: "내 위치",
      });

      // 정보창 생성
      infoWindowRef.current = new naver.maps.InfoWindow({
        content: "",
        borderWidth: 0,
        backgroundColor: "transparent",
      });

      console.log("[MedicalFacilitiesMap] 지도 초기화 완료");
    } catch (error) {
      console.error("[MedicalFacilitiesMap] 지도 초기화 실패:", error);
      throw error;
    }
  }, []);

  // 의료기관 검색 (API 라우트 사용)
  const searchFacilities = useCallback(async (
    category: MedicalFacilityCategory,
    userLocation: { lat: number; lng: number }
  ) => {
    console.group("[MedicalFacilitiesMap] 의료기관 검색 시작");
    console.log("카테고리:", category);
    console.log("사용자 위치:", userLocation);

    try {
      // API 라우트를 통해 검색
      const queryParams = new URLSearchParams({
        category,
        lat: String(userLocation.lat),
        lon: String(userLocation.lng),
        display: "20", // 최대 20개
      });

      console.log(`🌐 API 호출: /api/health/medical-facilities/search?${queryParams.toString()}`);

      const response = await fetch(
        `/api/health/medical-facilities/search?${queryParams.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `의료기관 검색 실패: ${response.status} ${response.statusText}`;
        console.error("❌ API 응답 오류:", errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        const errorMessage = data.error || "의료기관 검색에 실패했습니다.";
        console.error("❌ API 검색 실패:", errorMessage);
        throw new Error(errorMessage);
      }

      const facilities = data.data.facilities || [];
      console.log(`✅ 검색 완료: ${facilities.length}개 의료기관 발견`);
      
      if (facilities.length === 0) {
        console.warn("⚠️ 검색 결과가 없습니다. 카테고리:", category);
      }
      
      console.groupEnd();
      return facilities;
    } catch (error) {
      console.error("❌ 의료기관 검색 실패:", error);
      console.groupEnd();
      throw error;
    }
    // setIsSearching은 useEffect에서 관리하므로 여기서는 제거
  }, []);

  // 두 지점 간 거리 계산 (단순 공식, 실제로는 더 정확한 방법 사용 권장)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // 지구 반경 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 마커 표시
  const displayMarkers = useCallback((facilities: MedicalFacility[]) => {
    console.log("[MedicalFacilitiesMap] 마커 표시 시작, 시설 수:", facilities.length);

    if (!mapInstanceRef.current || !isNaverMapLoaded()) {
      console.error("[MedicalFacilitiesMap] 지도 인스턴스가 준비되지 않음");
      return;
    }

    const { naver } = window;

    // 기존 마커 제거
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // 새 마커 생성
    facilities.forEach((facility, index) => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(facility.latitude, facility.longitude),
        map: mapInstanceRef.current,
        icon: {
          content: `
            <div style="
              width: 30px;
              height: 30px;
              background: #ef4444;
              border: 2px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 12px;
              font-weight: bold;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">${index + 1}</div>
          `,
          size: new naver.maps.Size(32, 32),
          anchor: new naver.maps.Point(16, 16),
        },
        title: facility.name,
      });

      // 마커 클릭 이벤트
      naver.maps.Event.addListener(marker, "click", () => {
        // 의료기관 카테고리에 따른 아이콘
        const categoryIcons = {
          hospital: "🏥",
          pharmacy: "💊",
          animal_hospital: "🐾",
          animal_pharmacy: "💊🐾"
        };

        const icon = categoryIcons[facility.category] || "🏥";

        // 영업 상태 배지 생성
        let statusBadge = "";
        if (facility.operatingHours?.todayStatus) {
          if (facility.operatingHours.todayStatus === "open") {
            statusBadge = '<span style="display: inline-block; padding: 2px 8px; background: #10b981; color: white; border-radius: 12px; font-size: 11px; font-weight: 500; margin-left: 8px;">영업중</span>';
          } else if (facility.operatingHours.todayStatus === "closed") {
            statusBadge = '<span style="display: inline-block; padding: 2px 8px; background: #ef4444; color: white; border-radius: 12px; font-size: 11px; font-weight: 500; margin-left: 8px;">영업종료</span>';
          } else if (facility.operatingHours.todayStatus === "closing_soon") {
            statusBadge = '<span style="display: inline-block; padding: 2px 8px; background: #f97316; color: white; border-radius: 12px; font-size: 11px; font-weight: 500; margin-left: 8px;">곧 마감</span>';
          }
        }

        // 영업 시간 정보 생성
        let hoursInfo = "";
        if (facility.operatingHours) {
          if (facility.operatingHours.is24Hours) {
            hoursInfo = '<p style="margin: 4px 0 0 0; font-size: 11px; color: #059669; font-weight: 500;">⏰ 24시간 영업</p>';
          } else if (facility.operatingHours.todayHours) {
            hoursInfo = `<p style="margin: 4px 0 0 0; font-size: 11px; color: #374151;">⏰ 오늘 ${facility.operatingHours.todayHours}</p>`;
          } else if (facility.operatingHours.hours) {
            hoursInfo = `<p style="margin: 4px 0 0 0; font-size: 11px; color: #374151;">⏰ ${facility.operatingHours.hours}</p>`;
          }
          
          // 휴무일 정보
          if (facility.operatingHours.closedDays && facility.operatingHours.closedDays.length > 0) {
            hoursInfo += `<p style="margin: 2px 0 0 0; font-size: 10px; color: #9ca3af;">🚫 휴무: ${facility.operatingHours.closedDays.join(", ")}</p>`;
          }
        }

        const content = `
          <div style="padding: 12px; max-width: 280px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 18px; margin-right: 8px;">${icon}</span>
              <h4 style="margin: 0; font-weight: 600; color: #1f2937; font-size: 14px; line-height: 1.2;">${facility.name}</h4>
              ${statusBadge}
            </div>

            <div style="margin-bottom: 8px;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; line-height: 1.4;">
                📍 ${facility.roadAddress || facility.address}
              </p>
              ${facility.phone ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">📞 ${facility.phone}</p>` : ""}
              ${hoursInfo}
              ${facility.distance ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #059669; font-weight: 500;">📍 현위치에서 ${facility.distance.toFixed(1)}km</p>` : ""}
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
              ${facility.link ? `<a href="${facility.link}" target="_blank" style="display: inline-flex; align-items: center; font-size: 12px; color: #2563eb; text-decoration: none; font-weight: 500;">
                🗺️ 네이버 지도에서 자세히 보기
                <span style="margin-left: 4px;">→</span>
              </a>` : ""}
            </div>

            <div style="margin-top: 8px; padding: 6px; background: #f3f4f6; border-radius: 4px; font-size: 11px; color: #374151;">
              💡 클릭하여 더 자세한 정보를 확인하세요
            </div>
          </div>
        `;

        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    console.log("[MedicalFacilitiesMap] 마커 표시 완료");
  }, []);

  // 현재위치 새로고침
  const refreshLocation = useCallback(async () => {
    console.log("[MedicalFacilitiesMap] 위치 새로고침 시작");
    setError(null);

    try {
      const location = await getCurrentLocation();
      setUserLocation(location);

      if (mapInstanceRef.current) {
        const { naver } = window;
        const newCenter = new naver.maps.LatLng(location.lat, location.lng);
        mapInstanceRef.current.setCenter(newCenter);

        if (userMarkerRef.current) {
          userMarkerRef.current.setPosition(newCenter);
        }
      }

      console.log("[MedicalFacilitiesMap] 위치 새로고침 완료");
    } catch (error) {
      console.error("[MedicalFacilitiesMap] 위치 새로고침 실패:", error);
      setError(error instanceof Error ? error.message : "위치 새로고침에 실패했습니다.");
    }
  }, [getCurrentLocation]);

  // 컴포넌트 초기화 상태 추적
  const [isInitialized, setIsInitialized] = useState(false);
  const isInitializingRef = useRef(false); // 초기화 중인지 추적 (무한 루프 방지)

  // 컴포넌트 초기화 - 컨테이너가 준비된 후에만 실행
  useEffect(() => {
    // 이미 초기화되었거나 컨테이너가 준비되지 않았거나 초기화 중이면 스킵
    if (isInitialized || !isContainerReady || isInitializingRef.current) {
      console.log("[MedicalFacilitiesMap] 초기화 스킵 - 초기화됨:", isInitialized, "컨테이너 준비됨:", isContainerReady, "초기화 중:", isInitializingRef.current);
      return;
    }

    // 초기화 시작 표시
    isInitializingRef.current = true;

    const initialize = async () => {
      console.group("[MedicalFacilitiesMap] 컴포넌트 초기화 시작");
      console.log("컨테이너 준비됨:", isContainerReady);
      console.log("지도 컨테이너 요소:", mapRef.current);

      try {
        setIsLoading(true);
        setError(null);

        // 네이버 지도 스크립트 로드
        console.log("[MedicalFacilitiesMap] 네이버 지도 스크립트 로드 시작");
        await loadNaverMapScript();
        console.log("[MedicalFacilitiesMap] 네이버 지도 스크립트 로드 완료");

        // 현재위치 가져오기
        try {
          console.log("[MedicalFacilitiesMap] 현재위치 가져오기 시작");
          const location = await getCurrentLocation();
          console.log("[MedicalFacilitiesMap] 현재위치 가져오기 성공:", location);
          setUserLocation(location);

          // 지도 초기화
          console.log("[MedicalFacilitiesMap] 지도 초기화 시작");
          await initializeMap(location);
          console.log("[MedicalFacilitiesMap] 지도 초기화 완료");
        } catch (locationError) {
          console.warn("[MedicalFacilitiesMap] 위치 정보 없음, 기본 위치로 지도 초기화:", locationError);

          // 위치 권한이 없어도 기본 위치(서울 시청)로 지도 표시
          const defaultLocation = { lat: 37.5665, lng: 126.9780 };
          setUserLocation(defaultLocation);

          // 지도 초기화 (기본 위치)
          console.log("[MedicalFacilitiesMap] 기본 위치로 지도 초기화 시작");
          await initializeMap(defaultLocation);
          console.log("[MedicalFacilitiesMap] 기본 위치로 지도 초기화 완료");
        }

        setIsLoading(false);
        setIsInitialized(true);
        isInitializingRef.current = false; // 초기화 완료
        console.log("[MedicalFacilitiesMap] 컴포넌트 초기화 완료");
        console.groupEnd();
      } catch (error) {
        console.error("[MedicalFacilitiesMap] 컴포넌트 초기화 실패:", error);
        console.error("에러 상세:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        setError(error instanceof Error ? error.message : "지도 초기화에 실패했습니다.");
        setIsLoading(false);
        isInitializingRef.current = false; // 초기화 실패 시에도 플래그 리셋
        console.groupEnd();
      }
    };

    initialize();

    // cleanup 함수 - 무한 루프 방지를 위해 isInitialized를 false로 설정하지 않음
    return () => {
      console.log("[MedicalFacilitiesMap] 컴포넌트 정리");
      // cleanup 시에는 ref만 리셋하고 state는 유지
      isInitializingRef.current = false;
    };
  }, [isContainerReady, loadNaverMapScript, getCurrentLocation, initializeMap]); // isInitialized를 의존성에서 제거

  // 카테고리 변경 시 의료기관 검색
  useEffect(() => {
    // 검색이 이미 진행 중이거나 필요한 조건이 충족되지 않으면 검색하지 않음
    if (isSearching || !userLocation || !mapInstanceRef.current || !isNaverMapLoaded() || isLoading) {
      console.log("[MedicalFacilitiesMap] 검색 조건 미충족 - 검색 취소", {
        isSearching,
        hasUserLocation: !!userLocation,
        hasMapInstance: !!mapInstanceRef.current,
        isMapLoaded: isNaverMapLoaded(),
        isLoading,
      });
      return;
    }

    const searchAndDisplay = async () => {
      console.group("[MedicalFacilitiesMap] 카테고리 변경으로 인한 검색 시작");
      console.log("카테고리:", selectedCategory);
      console.log("사용자 위치:", userLocation);

      try {
        setError(null);
        setIsSearching(true);
        
        const searchResults = await searchFacilities(selectedCategory, userLocation);
        
        console.log(`✅ 검색 결과: ${searchResults.length}개 의료기관 발견`);
        
        // 검색 결과 설정
        setFacilities(searchResults);
        
        // 마커 표시
        if (searchResults.length > 0) {
          displayMarkers(searchResults);
        } else {
          // 검색 결과가 없을 때 기존 마커 제거
          markersRef.current.forEach(marker => {
            marker.setMap(null);
          });
          markersRef.current = [];
          console.log("[MedicalFacilitiesMap] 검색 결과가 없어 기존 마커를 제거했습니다");
        }
        
        console.groupEnd();
      } catch (error) {
        console.error("[MedicalFacilitiesMap] 의료기관 검색 실패:", error);
        const errorMessage = error instanceof Error ? error.message : "의료기관 정보를 불러올 수 없습니다.";
        setError(errorMessage);
        
        // 에러 발생 시 기존 마커 제거
        markersRef.current.forEach(marker => {
          marker.setMap(null);
        });
        markersRef.current = [];
        setFacilities([]);
        
        console.groupEnd();
      } finally {
        setIsSearching(false);
      }
    };

    // 약간의 지연을 주어 지도 초기화가 완료되도록 함
    const timeoutId = setTimeout(searchAndDisplay, 100);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [selectedCategory, userLocation, searchFacilities, displayMarkers, isSearching, isLoading]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            주변 의료기관 지도
          </CardTitle>
          <div className="flex items-center gap-2">
            {userLocation && (
              <Badge variant="secondary" className="text-xs">
                <Navigation className="h-3 w-3 mr-1" />
                현재위치 표시됨
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshLocation}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              위치 새로고침
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p>{error}</p>
              {error.includes('권한') && (
                <div className="text-sm space-y-1">
                  <p className="font-medium">해결 방법:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>브라우저 주소 표시줄 왼쪽의 🔒 자물쇠 아이콘을 클릭하세요</li>
                    <li>&apos;위치&apos; 권한을 &apos;허용&apos;으로 변경하세요</li>
                    <li>또는 주소 표시줄에 <code className="bg-gray-100 px-1 rounded">chrome://settings/content/location</code>을 입력하세요</li>
                    <li>페이지를 새로고침한 후 다시 시도하세요</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 개발 환경에서는 localhost에서 HTTP도 허용됩니다.
                  </p>
                </div>
              )}
              {error.includes('HTTPS') && (
                <div className="text-sm">
                  <p className="font-medium">해결 방법:</p>
                  <p>HTTPS 환경에서만 위치 정보를 사용할 수 있습니다.</p>
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  페이지 새로고침
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? '권한 요청 중...' : '권한 다시 요청'}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 relative">
          {/* 지도 컨테이너 - 항상 렌더링 (로딩 상태와 무관) */}
          <div
            ref={(element) => {
              mapRef.current = element;
              if (element && !isContainerReady) {
                console.log("[MedicalFacilitiesMap] 지도 컨테이너가 준비되었습니다");
                setIsContainerReady(true);
              }
            }}
            className="w-full h-[400px] border rounded-lg relative"
            style={{ minHeight: "400px" }}
          >
            {/* 로딩 오버레이 */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-lg">
                <div className="text-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">지도를 불러오는 중...</p>
                </div>
              </div>
            )}
          </div>

          {/* 검색 상태 및 결과 표시 - 로딩이 완료된 후에만 표시 */}
          {!isLoading && !error && (
            <>

            {isSearching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">
                  {CATEGORY_KEYWORDS[selectedCategory][0]}을(를) 검색하는 중...
                </span>
              </div>
            )}

            {!isSearching && facilities.length > 0 && (
              <div className="text-sm text-muted-foreground text-center">
                주변 {facilities.length}개의 {CATEGORY_KEYWORDS[selectedCategory][0]}을(를) 찾았습니다.
              </div>
            )}

            {!isSearching && facilities.length === 0 && (
              <div className="text-sm text-muted-foreground text-center">
                주변에 {CATEGORY_KEYWORDS[selectedCategory][0]}을(를) 찾을 수 없습니다.
              </div>
            )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


