/**
 * @file page.tsx
 * @description 의료기관 상세 페이지
 *
 * 선택된 카테고리의 의료기관을 지도와 카드 리스트로 표시합니다.
 * 위치 검색, 필터 기능을 제공합니다.
 *
 * 디자인 원칙:
 * - 모바일 퍼스트 반응형 디자인
 * - 데스크톱: 좌측 50% 리스트, 우측 50% 지도 (나란히)
 * - 모바일: 탭으로 리스트/지도 전환
 * - Sticky 필터 및 검색 바
 * - 부드러운 애니메이션 및 트랜지션
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { DirectionalEntrance } from "@/components/motion/directional-entrance";
import { MotionWrapper } from "@/components/motion/motion-wrapper";
import { MapView } from "@/components/health/medical-facilities/map-view";
import { FacilityCardList } from "@/components/health/medical-facilities/facility-card-list";
import { FacilityFilter } from "@/components/health/medical-facilities/facility-filter";
import { LocationSearch } from "@/components/health/medical-facilities/location-search";
import { LocationPermissionGuide } from "@/components/health/medical-facilities/location-permission-guide";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
import type { MedicalFacility, MedicalFacilityCategory } from "@/types/medical-facility";
import { CATEGORY_LABELS } from "@/types/medical-facility";
import { getUserLocation, getDefaultLocation } from "@/lib/health/medical-facilities/location-utils";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function MedicalFacilityCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const category = (params.category as MedicalFacilityCategory) || "hospital";

  const [facilities, setFacilities] = useState<MedicalFacility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false); // 위치 권한 안내 표시 여부
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [highlightedFacilityId, setHighlightedFacilityId] = useState<string | number | undefined>(undefined); // 강조할 의료기관 ID
  const isSearchingRef = useRef(false); // 검색 중인지 추적 (무한 루프 방지)
  const initializedRef = useRef(false); // 초기화 완료 여부 추적

  // 카테고리 검증
  const validCategories: MedicalFacilityCategory[] = [
    "hospital",
    "pharmacy",
    "animal_hospital",
    "animal_pharmacy",
  ];

  // 의료기관 검색
  const searchFacilities = useCallback(
    async (lat?: number, lon?: number) => {
      // 이미 검색 중이면 스킵
      if (isSearchingRef.current) {
        console.log("⚠️ 이미 검색 중입니다. 중복 요청을 무시합니다.");
        return;
      }

      console.group("[MedicalFacilityCategoryPage] 의료기관 검색");
      console.log("🔍 검색 시작:", { category, lat, lon });
      
      isSearchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        // 좌표가 명시적으로 제공되지 않으면 currentLocation 사용
        const searchLat = lat ?? currentLocation?.lat;
        const searchLon = lon ?? currentLocation?.lon;

        if (searchLat === undefined || searchLon === undefined) {
          console.warn("⚠️ 위치 정보가 없습니다. 검색을 건너뜁니다.");
          console.warn("   제공된 좌표:", { lat, lon });
          console.warn("   currentLocation:", currentLocation);
          isSearchingRef.current = false;
          setLoading(false);
          return;
        }

        // 좌표 검증 (유효한 범위인지 확인)
        if (isNaN(searchLat) || isNaN(searchLon) || 
            searchLat < -90 || searchLat > 90 || 
            searchLon < -180 || searchLon > 180) {
          console.error("❌ 유효하지 않은 좌표:", { searchLat, searchLon });
          throw new Error("유효하지 않은 좌표입니다.");
        }

        const queryParams = new URLSearchParams({
          category,
          display: "50", // 검색 결과 수 증가
        });

        // 현재 위치 기반 검색: 좌표가 제공되고 기본 위치(서울)가 아닌 경우
        // 지역명을 검색어에 포함하지 않고 카테고리만 사용하여 좌표 기반 검색
        const defaultLocation = getDefaultLocation();
        const isUserLocation = 
          Math.abs(searchLat - defaultLocation.lat) > 0.001 ||
          Math.abs(searchLon - defaultLocation.lon) > 0.001;

        if (isUserLocation) {
          // 실제 사용자 위치인 경우: 카테고리만 사용 (좌표 기반 검색)
          console.log(`📍 현재 위치 기반 검색: 좌표만 사용 (${searchLat}, ${searchLon})`);
          console.log(`📍 검색어: "${CATEGORY_LABELS[category]}" (지역명 제외)`);
        }

        // 좌표는 항상 전달 (네이버 API가 거리순 정렬)
        queryParams.set("lat", String(searchLat));
        queryParams.set("lon", String(searchLon));
        console.log(`📍 좌표 기반 검색: 위도 ${searchLat}, 경도 ${searchLon}`);
        console.log(`📍 검색 반경: 네이버 API 기본값 사용 (거리순 정렬)`);

        const apiUrl = `/api/health/medical-facilities/search?${queryParams.toString()}`;
        console.log(`🌐 API 호출: ${apiUrl}`);

        const response = await fetch(apiUrl);

        // HTTP 상태 코드 확인
        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          console.error(`❌ HTTP 오류: ${response.status} ${response.statusText}`);
          console.error("응답 본문:", errorText);
          throw new Error(
            `의료기관 검색 실패 (${response.status}): ${errorText || response.statusText}`
          );
        }

        const data = await response.json();
        console.log("📦 API 응답:", data);

        if (!data.success) {
          const errorMsg = data.error || "의료기관 검색에 실패했습니다.";
          console.error("❌ API 검색 실패:", errorMsg);
          
          // 약국 검색 오류인 경우 특별 처리
          if (category === "pharmacy" && errorMsg.includes("약국")) {
            console.error("💡 약국 검색 오류 - 가능한 원인:");
            console.error("   1. PHARMACY_API_KEY 환경변수 누락");
            console.error("   2. 약국 API 서버 오류");
            console.error("   3. 네트워크 연결 문제");
          }
          
          throw new Error(errorMsg);
        }

        const facilities = data.data?.facilities || [];
        console.log(`✅ 검색 완료: ${facilities.length}개 의료기관`);
        
        if (facilities.length === 0) {
          console.warn("⚠️ 검색 결과가 없습니다.");
          setError("검색 결과가 없습니다. 다른 위치에서 검색해보세요.");
        }
        
        setFacilities(facilities);
        console.groupEnd();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "의료기관 검색 중 오류가 발생했습니다.";
        console.error("❌ 검색 오류:", err);
        console.error("오류 상세:", {
          name: err instanceof Error ? err.name : "Unknown",
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        });
        setError(errorMessage);
        setFacilities([]); // 에러 시 빈 배열로 초기화
        console.groupEnd();
      } finally {
        setLoading(false);
        isSearchingRef.current = false; // 검색 완료
      }
    },
    [category] // currentLocation은 useEffect에서 처리
  );

  // 초기 위치 설정 및 검색
  useEffect(() => {
    // 이미 초기화되었고 위치가 있으면 카테고리만 변경된 경우로 간주
    if (initializedRef.current && currentLocation) {
      console.log("[MedicalFacilityCategoryPage] 카테고리 변경 감지. 현재 위치로 재검색.");
      // 카테고리만 변경된 경우 현재 위치로 재검색
      searchFacilities(currentLocation.lat, currentLocation.lon);
      return;
    }

    // 초기화가 필요한 경우
    if (initializedRef.current) {
      console.log("[MedicalFacilityCategoryPage] 이미 초기화되었습니다.");
      return;
    }

    const initializeLocation = async () => {
      console.group("[MedicalFacilityCategoryPage] 위치 초기화");
      setLocationError(null);
      
      // 위치 권한 요청 (더 명확한 옵션)
      const location = await getUserLocation();
      
      if (location) {
        console.log(`✅ 사용자 위치 사용: ${location.lat}, ${location.lon}`);
        console.log(`📍 현재 위치 기반으로 주변 의료기관 검색 시작`);
        setCurrentLocation(location);
        initializedRef.current = true;
        // 명시적으로 좌표 전달
        await searchFacilities(location.lat, location.lon);
      } else {
        const defaultLocation = getDefaultLocation();
        console.log(`⚠️ 기본 위치 사용 (서울시청): ${defaultLocation.lat}, ${defaultLocation.lon}`);
        console.warn(`⚠️ 위치 권한이 없어 서울시청 기준으로 검색합니다.`);
        setLocationError(
          "위치 권한이 거부되어 서울시청 기준으로 검색합니다."
        );
        setShowPermissionGuide(true); // 위치 권한 안내 표시
        setCurrentLocation(defaultLocation);
        initializedRef.current = true;
        // 명시적으로 좌표 전달
        await searchFacilities(defaultLocation.lat, defaultLocation.lon);
      }
      
      console.groupEnd();
    };

    initializeLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]); // category 변경 시에만 재실행

  // currentLocation이 변경되면 자동으로 검색 실행 (위치 마커 표시 시)
  useEffect(() => {
    // 초기화가 완료되고, currentLocation이 설정되었고, 기본 위치(서울)가 아닌 경우에만 실행
    if (initializedRef.current && currentLocation) {
      const defaultLocation = getDefaultLocation();
      const isDefaultLocation = 
        Math.abs(currentLocation.lat - defaultLocation.lat) < 0.001 &&
        Math.abs(currentLocation.lon - defaultLocation.lon) < 0.001;
      
      // 기본 위치가 아니고, 실제 사용자 위치인 경우에만 자동 검색
      if (!isDefaultLocation) {
        console.group("[MedicalFacilityCategoryPage] 위치 변경 감지 - 자동 검색 실행");
        console.log("📍 현재 위치:", currentLocation);
        console.log("🔍 주변 의료기관 검색 시작");
        console.groupEnd();
        // 명시적으로 좌표 전달하여 검색
        searchFacilities(currentLocation.lat, currentLocation.lon);
      } else {
        console.log("[MedicalFacilityCategoryPage] 기본 위치(서울)이므로 자동 검색 건너뜀");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation]); // currentLocation 변경 시 실행

  // 위치 변경 핸들러
  const handleLocationChange = useCallback(
    (lat: number, lon: number) => {
      console.log(`📍 위치 변경: ${lat}, ${lon}`);
      setCurrentLocation({ lat, lon });
      searchFacilities(lat, lon);
    },
    [searchFacilities]
  );

  // 카테고리 변경 핸들러
  const handleCategoryChange = useCallback(
    (newCategory: MedicalFacilityCategory) => {
      router.push(`/health/emergency/medical-facilities/${newCategory}`);
    },
    [router]
  );

  // 마커 클릭 핸들러 (지도에서 마커 클릭 시)
  const handleMarkerClick = useCallback((facility: MedicalFacility) => {
    // 해당 카드로 스크롤
    const element = document.getElementById(`facility-${facility.id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // 지도에서 보기 버튼 클릭 핸들러 (카드에서 지도로 이동)
  const handleMapViewClick = useCallback((facility: MedicalFacility) => {
    console.log("[MedicalFacilityCategoryPage] 지도에서 보기 클릭:", facility.name);
    
    // 강조할 의료기관 ID 설정
    setHighlightedFacilityId(facility.id);
    
    // 지도 섹션으로 스크롤
    const mapSection = document.querySelector('[data-map-section]');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // 일정 시간 후 강조 해제 (선택사항)
    setTimeout(() => {
      setHighlightedFacilityId(undefined);
    }, 5000);
  }, []);

  // 카테고리 검증 (Hook 호출 후에 체크)
  if (!validCategories.includes(category)) {
    return (
      <div className="container mx-auto py-12">
        <div className="mx-auto max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <ArrowLeft className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <h2 className="mb-2 text-xl font-semibold">유효하지 않은 카테고리입니다</h2>
          <p className="mb-6 text-muted-foreground">
            요청하신 의료기관 카테고리를 찾을 수 없습니다.
          </p>
          <Button
            variant="default"
            className="w-full"
            onClick={() => router.push("/health/emergency/medical-facilities")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DirectionalEntrance direction="up" delay={0.3}>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* 헤더 섹션 */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/health/emergency/medical-facilities")}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 space-y-1">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {CATEGORY_LABELS[category]}
              </h1>
              <p className="text-sm text-muted-foreground">
                주변 {CATEGORY_LABELS[category]}을 찾아보세요
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 바 (Sticky) */}
      <div className="sticky top-[73px] z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 space-y-4">
          {/* 위치 검색 */}
          <LocationSearch
            onLocationChange={handleLocationChange}
            loading={loading}
          />

          {/* 카테고리 필터 */}
          <FacilityFilter
            selectedCategory={category}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      </div>

      {/* 위치 권한 안내 */}
      {showPermissionGuide && (
        <div className="container mx-auto px-4 pt-4">
          <LocationPermissionGuide
            onDismiss={() => setShowPermissionGuide(false)}
          />
        </div>
      )}

      {/* 위치 권한 경고 메시지 (간단 버전) */}
      {locationError && !showPermissionGuide && (
        <div className="container mx-auto px-4 pt-4">
          <div className="rounded-lg border border-orange-500 bg-orange-50 p-4 dark:bg-orange-950/20">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 shrink-0 text-orange-500 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  {locationError}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPermissionGuide(true)}
                  className="border-orange-500 text-orange-700 hover:bg-orange-100"
                >
                  위치 권한 설정 방법 보기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="container mx-auto px-4 pt-4">
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/20">
                <MapPin className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-destructive">검색 오류</h3>
                <p className="text-sm text-destructive/90">{error}</p>
                {error.includes("API") && (
                  <div className="mt-3 rounded-md bg-destructive/5 p-3 text-xs">
                    <p className="font-medium mb-1">💡 해결 방법:</p>
                    <ul className="list-disc list-inside space-y-1 text-destructive/80">
                      <li>네이버 로컬 검색 API 키가 설정되어 있는지 확인하세요</li>
                      <li>브라우저 개발자 도구(F12) 콘솔에서 상세한 오류를 확인하세요</li>
                      <li>페이지를 새로고침하거나 다른 위치에서 검색해보세요</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => {
                if (currentLocation) {
                  searchFacilities(currentLocation.lat, currentLocation.lon);
                } else {
                  // 위치가 없으면 다시 초기화
                  const initializeLocation = async () => {
                    const location = await getUserLocation();
                    if (location) {
                      setCurrentLocation(location);
                      await searchFacilities(location.lat, location.lon);
                    } else {
                      const defaultLocation = getDefaultLocation();
                      setCurrentLocation(defaultLocation);
                      await searchFacilities(defaultLocation.lat, defaultLocation.lon);
                    }
                  };
                  initializeLocation();
                }
              }}
            >
              다시 시도
            </Button>
          </div>
        </div>
      )}

      {/* 메인 컨텐츠: 심플한 레이아웃 - 상단 지도, 하단 목록 */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 지도 섹션 */}
        <div className="space-y-2" data-map-section>
          <h2 className="text-lg font-semibold">지도</h2>
          <div className="h-[400px] md:h-[500px] rounded-xl border bg-card shadow-sm overflow-hidden">
            {currentLocation ? (
              <MapView
                facilities={facilities}
                center={currentLocation}
                onMarkerClick={handleMarkerClick}
                highlightedFacilityId={highlightedFacilityId}
                className="h-full"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <LoadingSpinner />
              </div>
            )}
          </div>
        </div>

        {/* 목록 섹션 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              검색 결과
              {facilities.length > 0 && (
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  ({facilities.length}개)
                </span>
              )}
            </h2>
          </div>
          <FacilityCardList
            facilities={facilities}
            loading={loading}
            onMapClick={handleMapViewClick}
          />
        </div>
      </div>
      </div>
    </DirectionalEntrance>
  );
}

