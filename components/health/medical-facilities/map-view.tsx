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
}

export function MapView({
  facilities,
  center,
  onMarkerClick,
  className,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const naverMapRef = useRef<NaverMap | null>(null);
  const markersRef = useRef<NaverMarker[]>([]);
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

  // center 변경 시 지도 중심 업데이트
  useEffect(() => {
    if (mapInitialized && naverMapRef.current && center) {
      const naverMaps = window.naver?.maps as NaverMaps | undefined;
      if (naverMaps && naverMaps.LatLng) {
        const naverCenter = new naverMaps.LatLng(center.lat, center.lon);
        naverMapRef.current.setCenter(naverCenter);
        console.log("[MapView] 지도 중심 업데이트:", center);
      }
    }
  }, [center, mapInitialized]);

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
      });

      naverMapRef.current = map;
      setMapInitialized(true);
      console.log("✅ 지도 초기화 완료");
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
    console.log(`📍 의료기관 목록:`, facilities.map(f => ({ name: f.name, lat: f.latitude, lon: f.longitude })));

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

        const position = new naverMaps.LatLng(
          facility.latitude,
          facility.longitude
        );

        console.log(`📍 마커 ${index + 1}/${facilities.length} 생성: ${facility.name} (${facility.latitude}, ${facility.longitude})`);

        const marker = new naverMaps.Marker({
          position,
          map: naverMapRef.current!,
          title: facility.name,
        });

        // 마커 클릭 이벤트
        if (naverMaps.Event && naverMaps.InfoWindow) {
          naverMaps.Event.addListener(marker, "click", () => {
            // 기존 정보창 닫기
            if (infoWindowRef.current) {
              infoWindowRef.current.close();
            }

            // 정보창 내용 생성
            const content = `
              <div style="padding: 10px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">${facility.name}</h3>
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${facility.roadAddress || facility.address}</p>
                ${facility.phone ? `<p style="margin: 0; font-size: 12px; color: #666;">${facility.phone}</p>` : ""}
                ${facility.distance !== undefined ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #0066cc;">거리: ${facility.distance.toFixed(2)}km</p>` : ""}
              </div>
            `;

            const infoWindow = new naverMaps.InfoWindow({
              content,
              maxWidth: 250,
            });

            infoWindow.open(naverMapRef.current!, marker);
            infoWindowRef.current = infoWindow;

            // 콜백 호출
            if (onMarkerClick) {
              onMarkerClick(facility);
            }
          });
        }

        markersRef.current.push(marker);
      });

      // 마커가 있는 경우 지도 중심 조정
      if (facilities.length > 0 && naverMaps.LatLngBounds) {
        const bounds = new naverMaps.LatLngBounds();
        facilities.forEach((facility) => {
          bounds.extend(
            new naverMaps.LatLng(facility.latitude, facility.longitude)
          );
        });
        // fitBounds는 네이버 지도 API에서 제공하는 메서드
        const mapWithFitBounds = naverMapRef.current as unknown as { fitBounds: (bounds: unknown) => void };
        if (mapWithFitBounds.fitBounds) {
          mapWithFitBounds.fitBounds(bounds);
        }
      }

      console.log(`✅ 마커 ${markersRef.current.length}개 생성 완료`);
    } catch (error) {
      console.error("❌ 마커 생성 실패:", error);
    } finally {
      console.groupEnd();
    }
  }, [facilities, onMarkerClick, mapInitialized]);

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

