/**
 * @file page.tsx
 * @description 의료기관 위치 서비스 메인 페이지
 *
 * 병원 카테고리를 기본으로 하는 의료기관 검색 페이지입니다.
 * 지도와 카드 리스트로 주변 의료기관을 표시합니다.
 *
 * 디자인 원칙:
 * - 모바일 퍼스트 반응형 디자인
 * - 심플한 레이아웃: 상단 지도, 하단 목록
 * - Sticky 필터 및 검색 바
 * - 부드러운 애니메이션 및 트랜지션
 */

"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { MapView } from "@/components/health/medical-facilities/map-view";
import { FacilityCardList } from "@/components/health/medical-facilities/facility-card-list";
import { LocationSearch } from "@/components/health/medical-facilities/location-search";
import { LocationPermissionGuide } from "@/components/health/medical-facilities/location-permission-guide";
import { Button } from "@/components/ui/button";
import { MapPin, List, Map } from "lucide-react";
import type {
  MedicalFacility,
  MedicalFacilityCategory,
} from "@/types/medical-facility";
import {
  getUserLocation,
  getDefaultLocation,
  calculateDistance,
} from "@/lib/health/medical-facilities/location-utils";
import { LoadingSpinner } from "@/components/loading-spinner";
import { NaverMoreLinksSection } from "@/components/health/medical-facilities/naver-more-links-section";

export default function MedicalFacilitiesPage() {
  // 지도 인스턴스 관리를 위한 ref
  const mapInstanceRef = useRef<any>(null);
  const mapLoadedRef = useRef<boolean>(false);

  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedCategories, setSelectedCategories] = useState<
    MedicalFacilityCategory[]
  >(["pharmacy"]);
  const [selectedRadius, setSelectedRadius] = useState<number>(5000);
  const [sortBy, setSortBy] = useState<"distance" | "name">("distance");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [facilities, setFacilities] = useState<MedicalFacility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false); // 위치 로딩 상태
  const [showPermissionGuide, setShowPermissionGuide] = useState(false); // 위치 권한 안내 표시 여부
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [searchLocationName, setSearchLocationName] = useState<string | null>(
    null,
  ); // 검색한 지역명 저장
  const [highlightedFacilityId, setHighlightedFacilityId] = useState<
    string | number | undefined
  >(undefined); // 강조할 의료기관 ID
  const isSearchingRef = useRef(false); // 검색 중인지 추적 (무한 루프 방지)
  const initializedRef = useRef(false); // 초기화 완료 여부 추적

  // coordinates 객체를 메모이제이션하여 무한 루프 방지
  const coordinates = useMemo(
    () =>
      currentLocation
        ? { lat: currentLocation.lat, lng: currentLocation.lon }
        : null,
    [currentLocation?.lat, currentLocation?.lon, currentLocation],
  );

  // 의료기관 검색 (다중 카테고리 지원)
  const searchFacilities = useCallback(
    async (lat?: number, lon?: number) => {
      // 이미 검색 중이면 스킵
      if (isSearchingRef.current) {
        console.log("⚠️ 이미 검색 중입니다. 중복 요청을 무시합니다.");
        return;
      }

      console.group("[MedicalFacilitiesPage] 의료기관 검색");
      console.log("🔍 검색 시작:", {
        selectedCategories,
        lat,
        lon,
        searchLocationName,
        selectedRadius,
      });

      isSearchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const allFacilities: MedicalFacility[] = [];

        // 각 카테고리별로 검색
        // 반경 내의 결과를 충분히 가져오기 위해 display 값을 늘림 (최대 100개)
        // 네이버 지도처럼 반경 내의 결과만 보여주기 위해 더 많은 결과를 가져온 후 클라이언트에서 필터링
        // 반경이 클수록 더 많은 결과를 가져와서 필터링 정확도를 높임
        const baseDisplay = Math.max(80, Math.ceil(selectedRadius / 50)); // 기본 80개, 반경에 따라 증가
        const displayCount = Math.min(100, Math.max(50, baseDisplay)); // 최소 50개, 최대 100개

        for (const category of selectedCategories) {
          console.log(
            `🔍 ${category} 카테고리 검색 시작 (반경: ${selectedRadius}m, display: ${displayCount})`,
          );

          const queryParams = new URLSearchParams({
            category,
            display: String(displayCount),
          });

          if (lat !== undefined && lon !== undefined) {
            queryParams.set("lat", String(lat));
            queryParams.set("lon", String(lon));
          }

          // 반경 파라미터 추가
          queryParams.set("radius", String(selectedRadius));

          const apiUrl = `/api/health/medical-facilities/search?${queryParams.toString()}`;
          console.log(`🌐 API 호출: ${apiUrl}`);

          const response = await fetch(apiUrl);

          if (!response.ok) {
            const errorText = await response.text().catch(() => "");
            console.error(
              `❌ HTTP 오류 (${category}): ${response.status} ${response.statusText}`,
            );
            console.error("응답 본문:", errorText);
            continue; // 다음 카테고리로 진행
          }

          const data = await response.json();

          if (
            data.success &&
            data.data?.facilities &&
            Array.isArray(data.data.facilities)
          ) {
            // 반경 내의 결과만 필터링
            const facilitiesInRadius = data.data.facilities.filter(
              (facility: MedicalFacility) => {
                // 필수 속성 확인
                if (
                  !facility ||
                  typeof facility.latitude !== "number" ||
                  typeof facility.longitude !== "number"
                ) {
                  console.warn(
                    `[필터링] 유효하지 않은 의료기관 데이터 건너뜀:`,
                    facility,
                  );
                  return false;
                }

                if (lat === undefined || lon === undefined) return true;

                try {
                  // 거리 계산 (km 단위)
                  const distanceKm =
                    facility.distance !== undefined && !isNaN(facility.distance)
                      ? facility.distance
                      : calculateDistance(
                          lat,
                          lon,
                          facility.latitude,
                          facility.longitude,
                        );

                  // 유효한 거리인지 확인
                  if (isNaN(distanceKm) || !isFinite(distanceKm)) {
                    console.warn(`[필터링] 유효하지 않은 거리 계산 결과:`, {
                      facility: facility.name,
                      distanceKm,
                    });
                    return false;
                  }

                  // 미터로 변환하여 비교 (selectedRadius는 미터 단위)
                  const distanceM = distanceKm * 1000;

                  // 반경 내의 결과만 포함 (정확한 반경 제한 + 약간의 여유)
                  const radiusWithMargin = selectedRadius * 1.05; // 5% 여유 (네이버 API의 부정확성 고려)
                  const isInRadius = distanceM <= radiusWithMargin;

                  // 디버깅: 일정 거리 이상 떨어진 경우에만 로그 (너무 많은 로그 방지)
                  if (
                    !isInRadius &&
                    facility.name &&
                    distanceM > selectedRadius * 2
                  ) {
                    console.log(
                      `[필터링] ${facility.name}: ${distanceM.toFixed(0)}m > ${selectedRadius}m (제외)`,
                    );
                  }

                  return isInRadius;
                } catch (error) {
                  console.error(`[필터링] 거리 계산 오류:`, error, facility);
                  return false;
                }
              },
            );

            allFacilities.push(...facilitiesInRadius);
            console.log(
              `✅ ${category} 검색 완료: ${data.data.facilities.length}개 중 ${facilitiesInRadius.length}개가 반경(${selectedRadius}m) 내`,
            );
          }
        }

        // 약국 데이터는 네이버 로컬 검색 API에서 직접 가져옴 (운영 중인 약국만 필터링됨)

        console.log(
          `✅ 전체 검색 완료: ${allFacilities.length}개 의료기관 (반경 ${selectedRadius}m 내)`,
        );

        if (allFacilities.length === 0) {
          console.warn("⚠️ 반경 내 검색 결과가 없습니다.");
          setError(
            `반경 ${selectedRadius >= 1000 ? `${selectedRadius / 1000}km` : `${selectedRadius}m`} 내 검색 결과가 없습니다. 반경을 늘려보세요.`,
          );
        } else {
          console.log(`🗺️ 지도에 ${allFacilities.length}개 마커 표시 예정`);
        }

        setFacilities(allFacilities);
        console.groupEnd();
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "의료기관 검색 중 오류가 발생했습니다.";
        console.error("❌ 검색 오류:", err);
        setError(errorMessage);
        setFacilities([]);
        console.groupEnd();
      } finally {
        setLoading(false);
        isSearchingRef.current = false;
      }
    },
    [selectedCategories, searchLocationName, selectedRadius],
    // 주의: governmentPharmacies를 의존성에서 제거하여 무한 루프 방지
    // governmentPharmacies는 검색 완료 후 별도로 병합됨
  );

  // 초기 위치 설정 및 검색
  useEffect(() => {
    const initializeLocation = async () => {
      if (initializedRef.current) return;

      console.group("[MedicalFacilitiesPage] 위치 초기화");
      setLocationError(null);
      setLocationLoading(true);

      try {
        // 위치 권한 요청
        const location = await getUserLocation();

        if (location) {
          console.log(`✅ 사용자 위치 사용: ${location.lat}, ${location.lon}`);
          console.log(`📍 현재 위치 기반으로 주변 의료기관 검색 시작`);
          setCurrentLocation(location);
          initializedRef.current = true;
          await searchFacilities(location.lat, location.lon);
        } else {
          const defaultLocation = getDefaultLocation();
          console.log(
            `⚠️ 기본 위치 사용 (서울시청): ${defaultLocation.lat}, ${defaultLocation.lon}`,
          );
          setLocationError(
            "위치 권한이 거부되어 서울시청 기준으로 검색합니다.",
          );
          setShowPermissionGuide(true);
          setCurrentLocation(defaultLocation);
          initializedRef.current = true;
          await searchFacilities(defaultLocation.lat, defaultLocation.lon);
        }
      } catch (err) {
        console.error("❌ 위치 초기화 중 오류:", err);
        const defaultLocation = getDefaultLocation();
        setLocationError(
          "위치를 가져오는 중 오류가 발생했습니다. 서울시청 기준으로 검색합니다.",
        );
        setCurrentLocation(defaultLocation);
        initializedRef.current = true;
        await searchFacilities(defaultLocation.lat, defaultLocation.lon);
      } finally {
        setLocationLoading(false);
        console.groupEnd();
      }
    };

    initializeLocation();
  }, []); // 초기화는 한 번만

  // currentLocation이 변경되면 자동으로 검색 실행
  useEffect(() => {
    if (initializedRef.current && currentLocation) {
      const defaultLocation = getDefaultLocation();
      const isDefaultLocation =
        Math.abs(currentLocation.lat - defaultLocation.lat) < 0.001 &&
        Math.abs(currentLocation.lon - defaultLocation.lon) < 0.001;

      if (!isDefaultLocation) {
        console.log("[MedicalFacilitiesPage] 위치 변경 감지 - 자동 검색 실행");
        searchFacilities(currentLocation.lat, currentLocation.lon);
      }
    }
  }, [
    currentLocation?.lat,
    currentLocation?.lon,
    currentLocation,
    searchFacilities,
  ]);

  // 약국 검색은 이제 네이버 로컬 검색 API에서 직접 가져오므로 별도 병합 로직 불필요
  // API에서 이미 운영 중인 약국만 필터링되어 반환됨

  // 검색 및 우선순위 정렬된 장소 목록 메모이제이션
  const filteredFacilities = useMemo(() => {
    let result = [...facilities];

    // 반경 필터링 (현재 위치가 있고 거리가 계산된 경우)
    // 주의: searchFacilities에서 이미 반경 필터링을 수행하므로 여기서는 최소한의 검증만 수행
    if (currentLocation) {
      const beforeCount = result.length;
      result = result.filter((facility) => {
        // 필수 속성 확인
        if (
          !facility ||
          typeof facility.latitude !== "number" ||
          typeof facility.longitude !== "number"
        ) {
          return false;
        }

        try {
          // 거리 계산 (km 단위) - 이미 계산된 값 우선 사용
          const distanceKm =
            facility.distance !== undefined && !isNaN(facility.distance)
              ? facility.distance
              : calculateDistance(
                  currentLocation.lat,
                  currentLocation.lon,
                  facility.latitude,
                  facility.longitude,
                );

          // 미터로 변환하여 비교
          const distanceM = distanceKm * 1000;

          // 이미 API에서 필터링했으므로 여기서는 엄격한 제한 적용
          const isInRadius = distanceM <= selectedRadius;

          return isInRadius;
        } catch (error) {
          console.error(`[필터링] 거리 계산 오류:`, error, facility);
          return false;
        }
      });

      if (beforeCount !== result.length) {
        console.log(
          `[MedicalFacilitiesPage] 추가 반경 필터링: ${beforeCount}개 → ${result.length}개 (반경: ${selectedRadius}m)`,
        );
      }
    }

    // 검색 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (facility) =>
          facility.name.toLowerCase().includes(query) ||
          facility.address.toLowerCase().includes(query) ||
          (facility.roadAddress &&
            facility.roadAddress.toLowerCase().includes(query)),
      );
    }

    // 우선순위 정렬: 24시간 영업 > 현재 영업 중 > 기타
    result.sort((a, b) => {
      // 24시간 영업 여부 확인
      const aIs24Hours = a.operatingHours?.is24Hours ?? false;
      const bIs24Hours = b.operatingHours?.is24Hours ?? false;

      // 현재 영업 중 여부
      const aIsOpen = a.operatingHours?.todayStatus === "open";
      const bIsOpen = b.operatingHours?.todayStatus === "open";

      // 우선순위 점수 계산 (높을수록 우선)
      const getPriority = (is24Hours: boolean, isOpen: boolean) => {
        if (is24Hours) return 3; // 24시간 영업이 최우선
        if (isOpen) return 2; // 현재 영업 중
        return 1; // 기타
      };

      const aPriority = getPriority(aIs24Hours, aIsOpen);
      const bPriority = getPriority(bIs24Hours, bIsOpen);

      // 우선순위가 같으면 거리순 또는 이름순 정렬
      if (aPriority === bPriority) {
        if (sortBy === "distance") {
          return (a.distance || 0) - (b.distance || 0);
        } else if (sortBy === "name") {
          return a.name.localeCompare(b.name, "ko");
        }
        return (a.distance || 0) - (b.distance || 0);
      }

      // 우선순위가 다르면 우선순위 높은 순으로 정렬
      return bPriority - aPriority;
    });

    return result;
  }, [facilities, searchQuery, sortBy, currentLocation, selectedRadius]);

  // "내 위치에서 찾기" 공통 핸들러 (HERO/Sticky 등에서 재사용)
  const handleUseMyLocation = useCallback(async () => {
    console.log("[MedicalFacilitiesPage] 내 위치에서 찾기 클릭");
    setLocationLoading(true);
    setLocationError(null);
    try {
      const location = await getUserLocation();
      if (location) {
        console.log(`✅ 현재 위치 사용: ${location.lat}, ${location.lon}`);
        setCurrentLocation(location);
        await searchFacilities(location.lat, location.lon);
      } else {
        const defaultLocation = getDefaultLocation();
        console.log(
          `⚠️ 기본 위치 사용 (서울시청): ${defaultLocation.lat}, ${defaultLocation.lon}`,
        );
        setLocationError("위치 권한이 거부되어 서울시청 기준으로 검색합니다.");
        setShowPermissionGuide(true);
        setCurrentLocation(defaultLocation);
        await searchFacilities(defaultLocation.lat, defaultLocation.lon);
      }
    } catch (err) {
      console.error("❌ 위치 초기화 중 오류:", err);
      const defaultLocation = getDefaultLocation();
      setLocationError(
        "위치를 가져오는 중 오류가 발생했습니다. 서울시청 기준으로 검색합니다.",
      );
      setCurrentLocation(defaultLocation);
      await searchFacilities(defaultLocation.lat, defaultLocation.lon);
    } finally {
      setLocationLoading(false);
    }
  }, [searchFacilities]);

  // 위치 변경 핸들러
  const handleLocationChange = useCallback(
    async (lat: number, lon: number, locationName?: string) => {
      console.log(`📍 위치 변경: ${lat}, ${lon}`);
      setCurrentLocation({ lat, lon });

      if (locationName) {
        console.log(`📍 지역명: ${locationName}`);
        setSearchLocationName(locationName);
      } else {
        setSearchLocationName(null);
      }

      // 위치 변경 시 자동으로 검색 실행 (아직 실행하지 않음 - 콜백에서 처리)
    },
    [],
  );

  // 현재 위치 기반 검색 핸들러 (LocationSearch 컴포넌트에서 호출)
  const handleLocationSearch = useCallback(async () => {
    if (currentLocation) {
      console.log(
        `🔍 현재 위치 기반 검색 실행: ${currentLocation.lat}, ${currentLocation.lon}`,
      );
      await searchFacilities(currentLocation.lat, currentLocation.lon);
    } else {
      console.warn("⚠️ 현재 위치가 설정되지 않아 검색을 실행할 수 없습니다.");
    }
  }, [currentLocation, searchFacilities]);

  // 카테고리는 "약국"으로 고정 (요구사항: 약국만 API 기반으로 운영중 약국 표시 유지)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _lockCategoryToPharmacy = useCallback(() => {
    setSelectedCategories(["pharmacy"]);
  }, []);

  // 지도 로드 핸들러
  const handleMapLoad = useCallback((map: any) => {
    mapInstanceRef.current = map;
    mapLoadedRef.current = true;
    console.log("지도 인스턴스 설정 완료");
  }, []);

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
    console.log("[MedicalFacilitiesPage] 지도에서 보기 클릭:", facility.name);

    // 강조할 의료기관 ID 설정
    setHighlightedFacilityId(facility.id);

    // 지도 섹션으로 스크롤
    const mapSection = document.querySelector("[data-map-section]");
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // 일정 시간 후 강조 해제 (선택사항)
    setTimeout(() => {
      setHighlightedFacilityId(undefined);
    }, 5000);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* HERO 섹션 */}
      <div className="mb-5 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          내 주변 의료시설 찾기
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          병원, 약국, 동물병원, 동물약국을 쉽게 찾아보세요
        </p>
      </div>

      {/* 필터 섹션 (Sticky) */}
      <div className="sticky top-16 z-40 mb-4">
        {/* 위치 검색 */}
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg border p-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
                약국
              </span>
              <span className="text-xs text-muted-foreground">
                (API로 현재 운영중 약국 우선)
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseMyLocation}
              disabled={locationLoading || loading}
              className="gap-2"
            >
              {locationLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              {locationLoading ? "위치 가져오는 중..." : "내 위치"}
            </Button>
          </div>

          <div className="mt-3">
            <LocationSearch
              onLocationChange={handleLocationChange}
              onLocationSearch={handleLocationSearch}
              loading={loading}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">
                검색 반경
              </span>
              <div className="flex flex-wrap gap-2">
                {[1000, 3000, 5000, 10000].map((radius) => (
                  <button
                    key={radius}
                    type="button"
                    onClick={() => {
                      console.log(
                        `[MedicalFacilitiesPage] 반경 변경: ${selectedRadius}m → ${radius}m`,
                      );
                      setSelectedRadius(radius);
                      if (currentLocation) {
                        setTimeout(() => {
                          searchFacilities(
                            currentLocation.lat,
                            currentLocation.lon,
                          );
                        }, 100);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      selectedRadius === radius
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">정렬</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSortBy("distance")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    sortBy === "distance"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  거리순
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("name")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    sortBy === "name"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  이름순
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 약국 아래: 네이버지도 더 많은 보기 카드 섹션 */}
      <NaverMoreLinksSection currentLocation={currentLocation} />

      {/* 위치 권한 안내 */}
      {showPermissionGuide && (
        <div className="container mx-auto px-4 pt-2">
          <LocationPermissionGuide
            variant="compact"
            secondaryMessage="서울시청 기준으로 검색 중"
            onDismiss={() => setShowPermissionGuide(false)}
          />
        </div>
      )}

      {/* 위치 로딩 상태 */}
      {locationLoading && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-blue-800 dark:text-blue-200">
              현재 위치를 가져오는 중...
            </span>
          </div>
        </div>
      )}

      {/* 위치 에러(서울시청 기준 등)는 위 compact 권한 안내 배너로 통합 */}

      {/* 모바일: 탭 전환 */}
      <div className="lg:hidden mb-4">
        <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/40 ${
              viewMode === "list"
                ? "bg-primary-blue text-white"
                : "text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <List className="w-4 h-4" />
            <span>목록</span>
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/40 ${
              viewMode === "map"
                ? "bg-primary-blue text-white"
                : "text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Map className="w-4 h-4" />
            <span>지도</span>
          </button>
        </div>
      </div>

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
                      <li>
                        네이버 로컬 검색 API 키가 설정되어 있는지 확인하세요
                      </li>
                      <li>
                        브라우저 개발자 도구(F12) 콘솔에서 상세한 오류를
                        확인하세요
                      </li>
                      <li>
                        페이지를 새로고침하거나 다른 위치에서 검색해보세요
                      </li>
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
                      await searchFacilities(
                        defaultLocation.lat,
                        defaultLocation.lon,
                      );
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

      {/* 메인 컨텐츠 */}
      {currentLocation && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 리스트 뷰 (데스크톱: 항상 표시, 모바일: 탭에 따라) */}
          <div
            className={`${viewMode === "list" ? "block" : "hidden"} lg:block`}
          >
            <FacilityCardList
              facilities={filteredFacilities}
              loading={loading}
              onMapClick={handleMapViewClick}
              currentCategory={"pharmacy"}
              currentLocation={currentLocation}
            />
          </div>

          {/* 지도 뷰 (데스크톱: 항상 표시, 모바일: 탭에 따라) */}
          <div
            className={`${viewMode === "map" ? "block" : "hidden"} lg:block`}
          >
            <div className="sticky top-20 h-[600px] lg:h-[800px] rounded-lg border overflow-hidden relative">
              <MapView
                facilities={filteredFacilities}
                center={currentLocation}
                onMarkerClick={handleMarkerClick}
                highlightedFacilityId={highlightedFacilityId}
                className="w-full h-full"
                showCurrentLocation={true}
                showRadiusCircle={true}
                radius={selectedRadius}
                onMapLoad={handleMapLoad}
              />
              {/* 추가 마커들은 MapView에서 처리되므로 여기서는 제거 */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
