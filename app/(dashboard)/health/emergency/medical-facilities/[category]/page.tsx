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
import { MapView } from "@/components/health/medical-facilities/map-view";
import { FacilityCardList } from "@/components/health/medical-facilities/facility-card-list";
import { FacilityFilter } from "@/components/health/medical-facilities/facility-filter";
import { LocationSearch } from "@/components/health/medical-facilities/location-search";
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
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
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
          isSearchingRef.current = false;
          setLoading(false);
          return;
        }

        const queryParams = new URLSearchParams({
          category,
          display: "20",
        });

        if (searchLat !== undefined && searchLon !== undefined) {
          queryParams.set("lat", String(searchLat));
          queryParams.set("lon", String(searchLon));
        }

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
    [category] // currentLocation을 의존성에서 제거하여 무한 루프 방지
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
          "위치 권한이 거부되어 서울시청 기준으로 검색합니다. " +
          "정확한 검색을 위해 브라우저 설정에서 위치 권한을 허용해주세요."
        );
        setCurrentLocation(defaultLocation);
        initializedRef.current = true;
        // 명시적으로 좌표 전달
        await searchFacilities(defaultLocation.lat, defaultLocation.lon);
      }
      
      console.groupEnd();
    };

    initializeLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]); // category 변경 시에만 재실행 (searchFacilities는 category에 의존하므로 자동으로 업데이트됨)

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

  // 마커 클릭 핸들러
  const handleMarkerClick = useCallback((facility: MedicalFacility) => {
    // 해당 카드로 스크롤
    const element = document.getElementById(`facility-${facility.id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
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

      {/* 위치 권한 경고 메시지 */}
      {locationError && (
        <div className="container mx-auto px-4 pt-4">
          <div className="rounded-lg border border-orange-500 bg-orange-50 p-4 dark:bg-orange-950/20">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 shrink-0 text-orange-500 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  {locationError}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  💡 브라우저 주소창 왼쪽의 자물쇠 아이콘을 클릭하여 위치 권한을 허용할 수 있습니다.
                </p>
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
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">지도</h2>
          <div className="h-[400px] md:h-[500px] rounded-xl border bg-card shadow-sm overflow-hidden">
            {currentLocation ? (
              <MapView
                facilities={facilities}
                center={currentLocation}
                onMarkerClick={handleMarkerClick}
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
            onMapClick={handleMarkerClick}
          />
        </div>
      </div>
    </div>
  );
}

