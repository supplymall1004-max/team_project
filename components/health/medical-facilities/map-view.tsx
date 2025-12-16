/**
 * @file map-view.tsx
 * @description 네이버 지도 표시 컴포넌트
 *
 * 네이버 지도 API를 사용하여 지도를 표시하고 의료기관 마커를 관리합니다.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { getNaverMapScriptUrl, isNaverMapLoaded } from "@/lib/naver/map-client";
import type { MedicalFacility } from "@/types/medical-facility";
import type { NaverMap, NaverMarker, NaverInfoWindow, NaverMaps } from "@/types/naver.d";
import { cn } from "@/lib/utils";

interface MapViewProps {
  facilities: MedicalFacility[];
  center?: { lat: number; lon: number };
  onMarkerClick?: (facility: MedicalFacility) => void;
  className?: string;
  highlightedFacilityId?: string | number; // 강조할 의료기관 ID
  showCurrentLocation?: boolean; // 현재 위치 마커 표시 여부
  showRadiusCircle?: boolean; // 반경 서클 표시 여부
  radius?: number; // 반경 (미터)
  onMapLoad?: (map: any) => void; // 지도 로드 완료 콜백
}

export function MapView({
  facilities,
  center,
  onMarkerClick,
  className,
  highlightedFacilityId,
  showCurrentLocation,
  showRadiusCircle,
  radius,
  onMapLoad,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const naverMapRef = useRef<NaverMap | null>(null);
  const markersRef = useRef<NaverMarker[]>([]);
  const userMarkerRef = useRef<NaverMarker | null>(null); // 현재 위치 마커
  const radiusCircleRef = useRef<any>(null); // 반경 원 ref
  const infoWindowRef = useRef<NaverInfoWindow | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const initializationAttemptedRef = useRef(false); // 초기화 시도 여부 추적

  // 컴포넌트 마운트 시 스크립트가 이미 로드되어 있으면 mapLoaded 설정
  useEffect(() => {
    // 컴포넌트가 마운트될 때마다 상태 리셋
    setMapInitialized(false);
    initializationAttemptedRef.current = false;
    
    // 스크립트가 이미 로드되어 있으면 즉시 mapLoaded 설정
    if (isNaverMapLoaded() && window.naver?.maps) {
      console.log("[MapView] 네이버 지도 API가 이미 로드되어 있습니다. mapLoaded 설정.");
      setMapLoaded(true);
    } else {
      setMapLoaded(false);
    }
  }, []); // 마운트 시 한 번만 실행

  // center 변경 시 지도 중심 업데이트 및 현재 위치 마커 업데이트
  useEffect(() => {
    if (mapInitialized && naverMapRef.current && center) {
      // center 좌표 유효성 확인
      if (typeof center.lat !== 'number' || typeof center.lon !== 'number' || 
          isNaN(center.lat) || isNaN(center.lon) || 
          !isFinite(center.lat) || !isFinite(center.lon)) {
        console.warn("[MapView] 유효하지 않은 중심 좌표:", center);
        return;
      }

      const naverMaps = window.naver?.maps as NaverMaps | undefined;
      if (naverMaps && naverMaps.LatLng) {
        try {
          const naverCenter = new naverMaps.LatLng(center.lat, center.lon);
          naverMapRef.current.setCenter(naverCenter);

          // 현재 위치 마커 업데이트
          if (userMarkerRef.current) {
            try {
              // 마커 위치 업데이트 (네이버 지도 API는 setPosition 메서드 제공)
              const marker = userMarkerRef.current as any;
              if (marker.setPosition) {
                marker.setPosition(naverCenter);
              } else {
                // setPosition이 없으면 마커 재생성
                userMarkerRef.current.setMap(null);
                const newMarker = new naverMaps.Marker({
                  position: naverCenter,
                  map: naverMapRef.current!,
                  title: "내 위치",
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
                    size: new naverMaps.Size(26, 26),
                    anchor: new naverMaps.Point(13, 13),
                  },
                });
                userMarkerRef.current = newMarker;
              }
            } catch (error) {
              console.error("[MapView] 현재 위치 마커 업데이트 실패:", error);
            }
          } else if (naverMapRef.current && showCurrentLocation) {
            // 마커가 없으면 생성
            try {
              const userMarker = new naverMaps.Marker({
                position: naverCenter,
                map: naverMapRef.current!,
                title: "내 위치",
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
                  size: new naverMaps.Size(26, 26),
                  anchor: new naverMaps.Point(13, 13),
                },
              });
              userMarkerRef.current = userMarker;
            } catch (error) {
              console.error("[MapView] 현재 위치 마커 생성 실패:", error);
            }
          }
        } catch (error) {
          console.error("[MapView] 지도 중심 업데이트 실패:", error);
        }
      }
    }
  }, [center, mapInitialized, showCurrentLocation]);

  // 지도 초기화
  useEffect(() => {
    // 이미 초기화되었으면 스킵
    if (mapInitialized || !mapRef.current) {
      return;
    }

    // mapLoaded가 false이면 스크립트 로드 상태 확인
    if (!mapLoaded) {
      // 스크립트가 이미 로드되어 있으면 mapLoaded 설정
      if (isNaverMapLoaded() && window.naver?.maps) {
        console.log("[MapView] 스크립트가 이미 로드되어 있습니다. mapLoaded 설정.");
        setMapLoaded(true);
        // mapLoaded가 설정되면 이 useEffect가 다시 실행됨
        return;
      }
      // 스크립트가 로드되지 않았으면 대기
      console.log("[MapView] 네이버 지도 API 스크립트 로드 대기 중...");
      return;
    }

    // mapLoaded가 true이지만 API가 아직 준비되지 않았으면 대기
    if (!isNaverMapLoaded() || !window.naver) {
      console.log("[MapView] 네이버 지도 API가 아직 로드되지 않았습니다. 대기 중...");
      return;
    }

    // 이미 초기화 시도를 했으면 스킵
    if (initializationAttemptedRef.current) {
      console.log("[MapView] 이미 초기화 시도 중입니다.");
      return;
    }

    // 네이버 지도 API가 완전히 로드되었는지 확인
    const naverMaps = window.naver?.maps as NaverMaps | undefined;
    if (!naverMaps || !naverMaps.LatLng || !naverMaps.Map) {
      console.warn("⚠️ 네이버 지도 API가 아직 완전히 로드되지 않았습니다.");
      return;
    }

    console.group("[MapView] 지도 초기화 시작");
    console.log("지도 컨테이너:", mapRef.current);
    console.log("중심 좌표:", center || { lat: 37.5665, lon: 126.978 });
    initializationAttemptedRef.current = true;

    try {
      const defaultCenter = center || { lat: 37.5665, lon: 126.978 }; // 서울시청
      const naverCenter = new naverMaps.LatLng(
        defaultCenter.lat,
        defaultCenter.lon
      );

      console.log("[MapView] 지도 인스턴스 생성 중...");
      const map = new naverMaps.Map(mapRef.current, {
        center: naverCenter,
        zoom: 15,
        zoomControl: true,
        zoomControlOptions: {
          position: (window.naver?.maps as any)?.Position?.TOP_RIGHT,
        },
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: (window.naver?.maps as any)?.MapTypeControlStyle?.BUTTON,
          position: (window.naver?.maps as any)?.Position?.TOP_RIGHT,
        },
      });

      naverMapRef.current = map;
      setMapInitialized(true);
      console.log("✅ 지도 초기화 완료");

      // 지도 로드 완료 콜백 호출
      if (onMapLoad) {
        onMapLoad(map);
      }

      // 현재 위치 마커 표시
      if (center && showCurrentLocation) {
        console.log("[MapView] 현재 위치 마커 생성:", center);
        try {
          const userMarker = new naverMaps.Marker({
            position: naverCenter,
            map: map,
            title: "내 위치",
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
              size: new naverMaps.Size(26, 26),
              anchor: new naverMaps.Point(13, 13),
            },
          });
          userMarkerRef.current = userMarker;
          console.log("✅ 현재 위치 마커 생성 완료");
        } catch (error) {
          console.error("❌ 현재 위치 마커 생성 실패:", error);
        }
      }

      // 반경 서클 표시
      if (center && showRadiusCircle && radius) {
        console.group("[MapView] 지도 초기화 시 반경 서클 생성");
        console.log("📍 중심:", center);
        console.log("📍 반경:", radius, "m");
        try {
          const circle = new naverMaps.Circle({
            map: map,
            center: naverCenter,
            radius: radius,
            fillColor: 'rgba(66, 133, 244, 0.15)',
            fillOpacity: 0.15,
            strokeColor: '#4285f4',
            strokeOpacity: 0.5,
            strokeWeight: 3,
          });
          radiusCircleRef.current = circle;
          console.log("✅ 반경 서클 생성 완료:", circle);
          console.log("📍 반경 원 속성:", {
            center: circle.getCenter(),
            radius: circle.getRadius(),
            map: circle.getMap(),
          });
          console.groupEnd();
        } catch (error) {
          console.error("❌ 반경 서클 생성 실패:", error);
          console.error("에러 상세:", error instanceof Error ? error.message : String(error));
          console.groupEnd();
        }
      } else {
        console.log("[MapView] 반경 서클 생성 조건 미충족:", {
          center: !!center,
          showRadiusCircle,
          radius,
        });
      }
    } catch (error) {
      console.error("❌ 지도 초기화 실패:", error);
      initializationAttemptedRef.current = false; // 실패 시 재시도 가능하도록
      
      // 인증 실패 에러 처리
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Authentication") || errorMessage.includes("인증")) {
        const currentUrl = typeof window !== "undefined" ? window.location.origin : "알 수 없음";
        console.error("");
        console.error("🔐 네이버 지도 API 인증 실패 - 해결 방법:");
        console.error("");
        console.error("📍 현재 접속 URL:", currentUrl);
        console.error(`📍 등록된 Client ID: ${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || "확인 필요"}`);
        console.error("");
        console.error("📋 문제 분석:");
        console.error("   네이버 지도 API는 HTTP Referer를 확인하여 인증합니다.");
        console.error("   현재 접속한 URL이 등록된 'Web 서비스 URL'과 정확히 일치해야 합니다.");
        console.error("");
        console.error("✅ 확인 사항:");
        console.error("   1. 현재 접속 URL 확인:");
        console.error(`      현재: ${currentUrl}`);
        console.error("");
        console.error("   2. 등록된 Web 서비스 URL 확인:");
        console.error("      네이버 클라우드 플랫폼 콘솔에서 확인:");
        console.error("      - https://team-project-eight-blue.vercel.app/ (프로덕션)");
        console.error("      - http://192.168.0.7:3000 (로컬 네트워크)");
        console.error("");
        console.error("   3. URL 일치 여부 확인:");
        if (currentUrl.includes("localhost")) {
          console.error("      ⚠️ 현재 localhost로 접속 중입니다.");
          console.error("      등록된 URL에는 localhost가 없습니다!");
          console.error("");
          console.error("   💡 해결 방법:");
          console.error("      방법 1: localhost URL 추가 등록 (권장)");
          console.error("         - 네이버 클라우드 플랫폼 콘솔 접속");
          console.error("         - Application Service > Maps > 해당 Client ID 선택");
          console.error("         - '서비스 환경' 탭 > 'Web 서비스 URL'에 추가:");
          console.error("           http://localhost:3000");
          console.error("");
          console.error("      방법 2: 등록된 IP로 접속");
          console.error("         - 브라우저에서 다음 URL로 접속:");
          console.error("           http://192.168.0.7:3000");
          console.error("         - 또는 네트워크 IP로 접속");
        } else if (currentUrl.includes("192.168.0.7")) {
          console.error("      ✅ 등록된 IP로 접속 중입니다.");
          console.error("      다른 원인을 확인해야 합니다.");
        } else {
          console.error("      ⚠️ 등록되지 않은 URL로 접속 중입니다.");
          console.error("      해당 URL을 등록하거나, 등록된 URL로 접속하세요.");
        }
        console.error("");
        console.error("📚 참고 문서:");
        console.error("   - Dynamic Map 가이드: https://api.ncloud-docs.com/docs/application-maps-dynamic");
        console.error("   - Static Map 가이드: https://api.ncloud-docs.com/docs/application-maps-static");
        console.error("   - NAVER Maps JavaScript API v3: https://navermaps.github.io/maps.js.ncp/docs/");
        console.error("");
        console.error("⚠️ 중요:");
        console.error("   - URL은 정확히 일치해야 합니다 (프로토콜, 호스트, 포트 모두)");
        console.error("   - URL 끝의 슬래시(/)도 일치해야 할 수 있습니다");
        console.error("   - 변경사항 적용까지 몇 분 소요될 수 있습니다");
      }
    } finally {
      console.groupEnd();
    }
  }, [center, mapLoaded]); // mapInitialized를 의존성에서 제거하여 무한 루프 방지

  // 반경 원 업데이트 (radius 또는 center 변경 시)
  useEffect(() => {
    if (mapInitialized && naverMapRef.current && center && showRadiusCircle && radius) {
      // center 좌표 유효성 확인
      if (typeof center.lat !== 'number' || typeof center.lon !== 'number' || 
          isNaN(center.lat) || isNaN(center.lon) || 
          !isFinite(center.lat) || !isFinite(center.lon)) {
        console.warn("[MapView] 유효하지 않은 중심 좌표:", center);
        return;
      }

      // radius 유효성 확인
      if (typeof radius !== 'number' || isNaN(radius) || !isFinite(radius) || radius <= 0) {
        console.warn("[MapView] 유효하지 않은 반경 값:", radius);
        return;
      }

      const naverMaps = window.naver?.maps as NaverMaps | undefined;
      if (!naverMaps || !naverMaps.LatLng || !naverMaps.Circle) {
        console.warn("[MapView] 네이버 지도 API가 준비되지 않았습니다.");
        return;
      }

      try {
        const naverCenter = new naverMaps.LatLng(center.lat, center.lon);

        // 기존 반경 원이 있으면 업데이트
        if (radiusCircleRef.current) {
          try {
            radiusCircleRef.current.setCenter(naverCenter);
            radiusCircleRef.current.setRadius(radius);
          } catch (error) {
            console.error("[MapView] 반경 원 업데이트 실패:", error);
            // 업데이트 실패 시 재생성
            try {
              radiusCircleRef.current.setMap(null);
              radiusCircleRef.current = null;
            } catch (e) {
              // 무시
            }
          }
        }

        // 반경 원이 없으면 생성
        if (!radiusCircleRef.current) {
          try {
            const circle = new naverMaps.Circle({
              map: naverMapRef.current,
              center: naverCenter,
              radius: radius,
              fillColor: 'rgba(66, 133, 244, 0.15)',
              fillOpacity: 0.15,
              strokeColor: '#4285f4',
              strokeOpacity: 0.5,
              strokeWeight: 3,
            });
            radiusCircleRef.current = circle;
          } catch (error) {
            console.error("[MapView] 반경 원 생성 실패:", error);
          }
        }
      } catch (error) {
        console.error("[MapView] 반경 원 처리 중 오류:", error);
      }
    }
  }, [mapInitialized, center, showRadiusCircle, radius]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      console.log("[MapView] 컴포넌트 정리 시작");
      
      // 정보창 닫기
      if (infoWindowRef.current) {
        try {
          infoWindowRef.current.close();
        } catch (e) {
          // 무시
        }
        infoWindowRef.current = null;
      }

      // 반경 원 제거
      if (radiusCircleRef.current) {
        try {
          radiusCircleRef.current.setMap(null);
        } catch (e) {
          // 무시
        }
        radiusCircleRef.current = null;
      }

      // 현재 위치 마커 제거
      if (userMarkerRef.current) {
        try {
          userMarkerRef.current.setMap(null);
        } catch (e) {
          // 무시
        }
        userMarkerRef.current = null;
      }

      // 마커 제거
      markersRef.current.forEach((marker) => {
        try {
          marker.setMap(null);
        } catch (e) {
          // 무시
        }
      });
      markersRef.current = [];

      // 지도 인스턴스 정리 (페이지 이동 시 새로 생성)
      if (naverMapRef.current) {
        try {
          naverMapRef.current = null;
        } catch (e) {
          // 무시
        }
      }
      
      // 상태 리셋 (다음 마운트 시 재초기화 가능하도록)
      setMapInitialized(false);
      setMapLoaded(false);
      initializationAttemptedRef.current = false;
      console.log("[MapView] 컴포넌트 정리 완료");
    };
  }, []);

  // 마커 업데이트
  useEffect(() => {
    // 지도가 초기화되지 않았으면 스킵
    if (!mapInitialized || !isNaverMapLoaded() || !window.naver || !naverMapRef.current) {
      return;
    }

    // 네이버 지도 API가 완전히 로드되었는지 확인
    const naverMaps = window.naver?.maps as NaverMaps | undefined;
    if (!naverMaps || !naverMaps.LatLng || !naverMaps.Marker) {
      console.warn("⚠️ 네이버 지도 API가 아직 완전히 로드되지 않았습니다.");
      return;
    }

    console.group("[MapView] 마커 업데이트");
    console.log(`📍 마커 수: ${facilities.length}`);
    console.log(`📍 의료기관 목록:`, facilities
      .filter(f => f && typeof f.latitude === 'number' && typeof f.longitude === 'number')
      .map(f => ({ name: f?.name || '이름 없음', lat: f.latitude, lon: f.longitude })));

    // 기존 마커 제거
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = [];

    if (facilities.length === 0) {
      console.log("⚠️ 표시할 마커가 없습니다.");
      console.groupEnd();
      return;
    }

    try {
      // 새 마커 생성
      facilities.forEach((facility, index) => {
        if (!naverMaps.LatLng || !naverMaps.Marker) {
          console.warn("⚠️ 네이버 지도 API가 아직 준비되지 않았습니다.");
          return;
        }

        // facility 유효성 확인
        if (!facility || typeof facility.latitude !== 'number' || typeof facility.longitude !== 'number' ||
            isNaN(facility.latitude) || isNaN(facility.longitude) ||
            !isFinite(facility.latitude) || !isFinite(facility.longitude)) {
          console.warn(`[MapView] 유효하지 않은 의료기관 데이터 건너뜀:`, facility);
          return;
        }

        try {
          const position = new naverMaps.LatLng(
            facility.latitude,
            facility.longitude
          );

          console.log(`📍 마커 ${index + 1}/${facilities.length} 생성: ${facility.name || '이름 없음'} (${facility.latitude}, ${facility.longitude})`);

        // 강조할 마커인지 확인
        const isHighlighted = highlightedFacilityId !== undefined && 
          (facility.id === highlightedFacilityId || String(facility.id) === String(highlightedFacilityId));

        // 카테고리별 마커 아이콘 설정
        const getMarkerIcon = () => {
          const is24Hours = facility.operatingHours?.is24Hours;
          const isOpen = facility.operatingHours?.todayStatus === "open";
          
          // 카테고리별 색상
          const categoryColors: Record<string, { bg: string; border: string; icon: string }> = {
            hospital: { bg: "#3B82F6", border: "#2563EB", icon: "🏥" },
            pharmacy: { bg: "#10B981", border: "#059669", icon: "💊" },
            animal_hospital: { bg: "#EC4899", border: "#DB2777", icon: "🐾" },
            animal_pharmacy: { bg: "#8B5CF6", border: "#7C3AED", icon: "🐶" },
          };
          
          const colors = categoryColors[facility.category] || categoryColors.hospital;
          
          // 24시간 영업은 금색 테두리
          const borderColor = is24Hours ? "#F59E0B" : colors.border;
          const borderWidth = is24Hours ? "3px" : "2px";
          
          // 강조 표시
          const scale = isHighlighted ? 1.3 : 1;
          const shadow = isHighlighted ? "0 4px 12px rgba(0,0,0,0.4)" : "0 2px 6px rgba(0,0,0,0.3)";
          const animation = isHighlighted ? "animation: pulse 1.5s ease-in-out infinite;" : "";
          
          // 영업 상태에 따른 투명도
          const opacity = isOpen || is24Hours ? "1" : "0.7";
          
          return {
            content: `
              <div style="position: relative; width: 36px; height: 36px; transform: scale(${scale}); transition: all 0.3s ease; ${animation}">
                ${is24Hours ? `<div style="position: absolute; top: -8px; right: -8px; width: 20px; height: 20px; background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%); border: 2px solid white; border-radius: 50%; font-size: 10px; font-weight: bold; color: white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); z-index: 10; line-height: 16px; text-align: center; padding-top: 2px;">24</div>` : ""}
                <div style="width: 36px; height: 36px; background: ${colors.bg}; border: ${borderWidth} solid ${borderColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: ${shadow}; opacity: ${opacity}; cursor: pointer; transition: all 0.3s ease;">${colors.icon}</div>
                <div style="position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${borderColor}; opacity: ${opacity};"></div>
              </div>
              ${isHighlighted ? `<style>@keyframes pulse { 0%, 100% { transform: scale(1.3); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.9; } }</style>` : ""}
            `,
            size: new naverMaps.Size(42, 48),
            anchor: new naverMaps.Point(21, 42),
          };
        };

        const marker = new naverMaps.Marker({
          position,
          map: naverMapRef.current!,
          title: facility.name,
          icon: getMarkerIcon(),
        });

        // 마커 클릭 이벤트
        if (naverMaps.Event && naverMaps.InfoWindow) {
          naverMaps.Event.addListener(marker, "click", () => {
            // 기존 정보창 닫기
            if (infoWindowRef.current) {
              infoWindowRef.current.close();
            }

            // 영업 상태 배지 생성
            let statusBadge = "";
            if (facility.operatingHours?.todayStatus) {
              if (facility.operatingHours.todayStatus === "open") {
                statusBadge = '<span style="display: inline-block; padding: 2px 8px; background: #10b981; color: white; border-radius: 12px; font-size: 11px; font-weight: 500; margin-bottom: 4px;">영업중</span>';
              } else if (facility.operatingHours.todayStatus === "closed") {
                statusBadge = '<span style="display: inline-block; padding: 2px 8px; background: #ef4444; color: white; border-radius: 12px; font-size: 11px; font-weight: 500; margin-bottom: 4px;">영업종료</span>';
              } else if (facility.operatingHours.todayStatus === "closing_soon") {
                statusBadge = '<span style="display: inline-block; padding: 2px 8px; background: #f97316; color: white; border-radius: 12px; font-size: 11px; font-weight: 500; margin-bottom: 4px;">곧 마감</span>';
              }
            }

            // 영업 시간 정보 생성
            let hoursInfo = "";
            if (facility.operatingHours) {
              if (facility.operatingHours.is24Hours) {
                hoursInfo = '<p style="margin: 4px 0 0 0; font-size: 11px; color: #059669; font-weight: 500;">24시간 영업</p>';
              } else if (facility.operatingHours.todayHours) {
                hoursInfo = `<p style="margin: 4px 0 0 0; font-size: 11px; color: #374151;">오늘 ${facility.operatingHours.todayHours}</p>`;
              } else if (facility.operatingHours.hours) {
                hoursInfo = `<p style="margin: 4px 0 0 0; font-size: 11px; color: #374151;">${facility.operatingHours.hours}</p>`;
              }
              
              // 휴무일 정보
              if (facility.operatingHours.closedDays && facility.operatingHours.closedDays.length > 0) {
                hoursInfo += `<p style="margin: 2px 0 0 0; font-size: 10px; color: #9ca3af;">휴무: ${facility.operatingHours.closedDays.join(", ")}</p>`;
              }
            }

            // 정보창 내용 생성
            const content = `
              <div style="padding: 12px; min-width: 220px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <h3 style="margin: 0 0 6px 0; font-weight: 600; font-size: 14px; color: #1f2937;">${facility.name}</h3>
                ${statusBadge}
                <p style="margin: 6px 0 4px 0; font-size: 12px; color: #6b7280; line-height: 1.4;">${facility.roadAddress || facility.address}</p>
                ${facility.phone ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">📞 ${facility.phone}</p>` : ""}
                ${hoursInfo}
                ${facility.distance !== undefined ? `<p style="margin: 6px 0 0 0; font-size: 11px; color: #2563eb; font-weight: 500;">📍 현위치에서 ${facility.distance.toFixed(1)}km</p>` : ""}
              </div>
            `;

            const infoWindow = new naverMaps.InfoWindow({
              content,
              maxWidth: 250,
            });

            infoWindow.open(naverMapRef.current!, marker);
            infoWindowRef.current = infoWindow;

            // 지도 중심을 마커로 이동
            if (naverMapRef.current) {
              naverMapRef.current.setCenter(position);
              // 줌 레벨 조정 (선택사항)
              const mapWithZoom = naverMapRef.current as any;
              if (mapWithZoom.setZoom) {
                mapWithZoom.setZoom(17);
              }
            }

            // 콜백 호출
            if (onMarkerClick) {
              onMarkerClick(facility);
            }
          });
        }

          markersRef.current.push(marker);
        } catch (error) {
          console.error(`[MapView] 마커 생성 실패 (${facility?.name || '이름 없음'}):`, error);
        }
      });

      // 마커가 있는 경우 지도 중심 조정
      if (facilities.length > 0 && naverMaps.LatLngBounds) {
        try {
          const bounds = new naverMaps.LatLngBounds();
          facilities.forEach((facility) => {
            if (facility && typeof facility.latitude === 'number' && typeof facility.longitude === 'number' &&
                !isNaN(facility.latitude) && !isNaN(facility.longitude) &&
                isFinite(facility.latitude) && isFinite(facility.longitude)) {
              try {
                bounds.extend(
                  new naverMaps.LatLng(facility.latitude, facility.longitude)
                );
              } catch (error) {
                console.warn(`[MapView] bounds.extend 실패:`, error, facility);
              }
            }
          });
          // fitBounds는 네이버 지도 API에서 제공하는 메서드
          const mapWithFitBounds = naverMapRef.current as unknown as { fitBounds: (bounds: unknown) => void };
          if (mapWithFitBounds.fitBounds && bounds.getSize && bounds.getSize() > 0) {
            mapWithFitBounds.fitBounds(bounds);
          }
        } catch (error) {
          console.error("[MapView] 지도 중심 조정 실패:", error);
        }
      }

      console.log(`✅ 마커 ${markersRef.current.length}개 생성 완료`);

      // 강조할 의료기관이 있으면 해당 위치로 이동
      if (highlightedFacilityId && facilities.length > 0) {
        const highlightedFacility = facilities.find(
          (f) => f && (f.id === highlightedFacilityId || String(f.id) === String(highlightedFacilityId))
        );
        if (highlightedFacility && naverMapRef.current &&
            typeof highlightedFacility.latitude === 'number' && typeof highlightedFacility.longitude === 'number' &&
            !isNaN(highlightedFacility.latitude) && !isNaN(highlightedFacility.longitude) &&
            isFinite(highlightedFacility.latitude) && isFinite(highlightedFacility.longitude)) {
          try {
            const highlightedPosition = new naverMaps.LatLng(
              highlightedFacility.latitude,
              highlightedFacility.longitude
            );
            naverMapRef.current.setCenter(highlightedPosition);
            const mapWithZoom = naverMapRef.current as any;
            if (mapWithZoom.setZoom) {
              mapWithZoom.setZoom(17);
            }
            console.log("[MapView] 강조된 의료기관으로 지도 이동:", highlightedFacility.name || '이름 없음');
          } catch (error) {
            console.error("[MapView] 강조된 의료기관으로 이동 실패:", error);
          }
        }
      }
    } catch (error) {
      console.error("❌ 마커 생성 실패:", error);
    } finally {
      console.groupEnd();
    }
  }, [facilities, onMarkerClick, mapInitialized, highlightedFacilityId]);

  return (
    <>
      {/* 네이버 지도 스크립트 로드 */}
      <Script
        src={getNaverMapScriptUrl()}
        strategy="afterInteractive"
        onLoad={() => {
          console.group("[MapView] 네이버 지도 스크립트 로드");
          console.log("✅ 네이버 지도 스크립트 로드 완료");
          
          // 스크립트 로드 후 네이버 지도 API가 완전히 초기화될 때까지 대기
          const checkNaverMapReady = () => {
            if (isNaverMapLoaded() && window.naver?.maps) {
              const naverMaps = window.naver.maps as NaverMaps | undefined;
              // API 객체의 필수 메서드들이 모두 준비되었는지 확인
              if (naverMaps && naverMaps.LatLng && naverMaps.Map) {
                console.log("✅ 네이버 지도 API 초기화 완료");
                setMapLoaded(true);
                console.groupEnd();
                return true;
              }
            }
            return false;
          };

          // 즉시 확인
          if (checkNaverMapReady()) {
            return;
          }

          // 재시도 로직
          console.warn("⚠️ 네이버 지도 API 초기화 대기 중...");
          let retryCount = 0;
          const maxRetries = 50; // 5초 (100ms * 50)
          const checkInterval = setInterval(() => {
            retryCount++;
            if (checkNaverMapReady()) {
              clearInterval(checkInterval);
            } else if (retryCount >= maxRetries) {
              console.error("❌ 네이버 지도 API 초기화 실패 (최대 재시도 횟수 초과)");
              clearInterval(checkInterval);
              console.groupEnd();
            }
          }, 100);
        }}
        onError={(e) => {
          console.error("❌ 네이버 지도 스크립트 로드 실패:", e);
          setMapLoaded(false);
        }}
      />
      <div
        ref={mapRef}
        className={cn("w-full rounded-lg", className)}
        style={className ? undefined : { height: "400px", minHeight: "400px" }}
      >
        {!mapInitialized && (
          <div className="flex h-full flex-col items-center justify-center bg-muted text-muted-foreground rounded-lg p-6">
            <div className="mb-2 text-center">지도를 불러오는 중...</div>
            {!mapLoaded && (
              <div className="text-xs text-center px-4">
                네이버 지도 API를 로드하고 있습니다.
              </div>
            )}
            {mapLoaded && !mapInitialized && (
              <div className="text-xs text-center px-4 space-y-3 max-w-md">
                <div className="text-destructive font-semibold text-base">
                  ⚠️ 지도를 표시할 수 없습니다
                </div>
                <div className="text-left space-y-2 bg-white p-4 rounded-md border">
                  <p className="font-medium text-sm text-gray-700">가능한 원인:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                    <li>네이버 지도 API 인증 실패</li>
                    <li>현재 접속 URL이 등록되지 않음</li>
                    <li>네트워크 연결 문제</li>
                  </ul>
                </div>
                <div className="text-left space-y-2 bg-blue-50 p-4 rounded-md border border-blue-200">
                  <p className="font-medium text-sm text-blue-700">💡 임시 해결 방법:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-blue-600">
                    <li>브라우저 개발자 도구(F12) 콘솔에서 상세한 오류 확인</li>
                    <li>페이지 새로고침 시도</li>
                    <li>다른 브라우저에서 접속 시도</li>
                  </ol>
                </div>
                <div className="text-xs text-gray-500 italic">
                  * 지도가 표시되지 않아도 검색 결과는 아래 리스트에서 확인할 수 있습니다.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

