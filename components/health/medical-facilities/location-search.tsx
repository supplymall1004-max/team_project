/**
 * @file location-search.tsx
 * @description 위치 검색 컴포넌트
 *
 * 주소를 입력하여 위치를 검색하거나, 현재 위치를 사용할 수 있습니다.
 */

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2 } from "lucide-react";
import { getUserLocation, getDefaultLocation } from "@/lib/health/medical-facilities/location-utils";

interface LocationSearchProps {
  onLocationChange: (lat: number, lon: number, locationName?: string) => void;
  onSearch?: (address: string) => Promise<void>;
  onLocationSearch?: () => Promise<void>; // 현재 위치 기반 검색 실행 콜백
  loading?: boolean;
  placeholder?: string;
  autoSearchOnLocation?: boolean; // 현재 위치 설정 시 자동 검색 여부 (deprecated: onLocationSearch 사용 권장)
}

export function LocationSearch({
  onLocationChange,
  onSearch,
  onLocationSearch,
  loading = false,
  placeholder = "주소를 입력하세요 (예: 서울시 강남구)",
  autoSearchOnLocation = false,
}: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleCurrentLocation = async () => {
    console.group("[LocationSearch] 현재 위치 가져오기");
    setIsSearching(true);
    try {
      const location = await getUserLocation();
      if (location) {
        console.log(`✅ 현재 위치: ${location.lat}, ${location.lon}`);
        // 현재 위치는 지역명 없이 전달 (좌표 기반 검색)
        onLocationChange(location.lat, location.lon, undefined);

        // 위치 설정 후 자동 검색 실행 (새로운 콜백 방식 우선)
        if (onLocationSearch) {
          console.log("🔍 위치 설정 후 자동 검색 실행");
          await onLocationSearch();
        } else if (autoSearchOnLocation) {
          console.warn("⚠️ autoSearchOnLocation은 deprecated되었습니다. onLocationSearch를 사용해주세요.");
        }
      } else {
        console.log("⚠️ 위치 정보를 가져올 수 없어 기본 위치를 사용합니다.");
        const defaultLocation = getDefaultLocation();
        // 기본 위치도 지역명 없이 전달
        onLocationChange(defaultLocation.lat, defaultLocation.lon, undefined);

        // 기본 위치 설정 후에도 자동 검색 실행
        if (onLocationSearch) {
          console.log("🔍 기본 위치 설정 후 자동 검색 실행");
          await onLocationSearch();
        }
      }
    } catch (error) {
      console.error("❌ 위치 정보 오류:", error);
      const defaultLocation = getDefaultLocation();
      // 기본 위치도 지역명 없이 전달
      onLocationChange(defaultLocation.lat, defaultLocation.lon, undefined);

      // 에러 시에도 기본 위치로 검색 실행
      if (onLocationSearch) {
        console.log("🔍 에러 시 기본 위치로 자동 검색 실행");
        await onLocationSearch();
      }
    } finally {
      setIsSearching(false);
      console.groupEnd();
    }
  };

  const handleAddressSearch = async () => {
    console.log("[LocationSearch] handleAddressSearch 호출됨", { searchQuery, hasOnSearch: !!onSearch });
    if (!searchQuery.trim()) {
      console.warn("[LocationSearch] 검색어가 비어있어 검색을 건너뜁니다");
      return;
    }

    console.group("[LocationSearch] 주소 검색");
    setIsSearching(true);
    setSearchError(null);
    try {
      if (onSearch) {
        // onSearch가 있으면 부모 컴포넌트에서 처리 (지오코딩 + 검색 포함)
        await onSearch(searchQuery);
      } else {
        // onSearch가 없으면 직접 지오코딩 API 호출 (기본 동작)
        const response = await fetch(
          `/api/health/medical-facilities/geocode?address=${encodeURIComponent(searchQuery)}`
        );
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          let message = data?.error || "";
          
          // 401 인증 실패인 경우 특별한 메시지
          if (response.status === 401 || message.includes("인증") || message.includes("Authentication")) {
            message = "지오코딩 API 인증에 실패했습니다. Maps API 서비스가 활성화되어 있고 올바른 API 키를 사용하고 있는지 확인해주세요.";
          } else if (response.status === 404 || message.includes("찾을 수 없습니다")) {
            // 도로명 주소인 경우 더 구체적인 안내
            if (searchQuery.includes("로") || searchQuery.includes("길") || searchQuery.includes("번길")) {
              message = `도로명 주소 "${searchQuery}"를 찾을 수 없습니다. 주소를 확인하거나 더 간단한 주소로 검색해보세요 (예: "인천광역시 미추홀구", "인천광역시 경인로").`;
            } else {
              message = `주소를 찾을 수 없습니다. "${searchQuery}"에 대한 검색 결과가 없습니다. 더 구체적인 주소를 입력해보세요 (예: "서울시청", "인천광역시 미추홀구청").`;
            }
          } else {
            message = message || `주소 검색 중 오류가 발생했습니다. (상태 코드: ${response.status})`;
          }
          
          console.warn("[LocationSearch] 지오코딩 실패:", {
            status: response.status,
            message,
            query: searchQuery,
            responseData: data,
          });
          setSearchError(message);
          console.groupEnd();
          return;
        }

        if (data.success && data.data) {
          // 지역명 추출 (구/시/군 단위)
          let locationName: string | undefined = undefined;
          if (data.data.address) {
            locationName = data.data.address;
          } else {
            // 클라이언트에서 지역명 추출 시도
            const addressParts = searchQuery.split(/\s+/);
            for (const part of addressParts) {
              if (part.includes("구") || part.includes("시") || part.includes("군") || part.includes("동")) {
                locationName = part;
                break;
              }
            }
            if (!locationName) {
              locationName = searchQuery;
            }
          }
          console.log(`📍 추출된 지역명: ${locationName}`);
          onLocationChange(data.data.lat, data.data.lon, locationName);
        }
      }
    } catch (error) {
      console.error("❌ 주소 검색 오류:", error);
      const errorMessage = error instanceof Error ? error.message : "주소 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      setSearchError(errorMessage);
    } finally {
      setIsSearching(false);
      console.groupEnd();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddressSearch();
              }
            }}
            className="pl-9 transition-all focus:ring-2 focus:ring-primary"
            disabled={loading || isSearching}
          />
        </div>
        <Button
          onClick={handleAddressSearch}
          disabled={loading || isSearching || !searchQuery.trim()}
          className="shrink-0 transition-all"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="hidden sm:inline ml-2">검색</span>
        </Button>
        <Button
          variant="outline"
          onClick={handleCurrentLocation}
          disabled={loading || isSearching}
          className="shrink-0 transition-all hover:bg-primary hover:text-primary-foreground"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
          <span className="hidden sm:inline ml-2">현재 위치</span>
        </Button>
      </div>

      {searchError && (
        <p className="text-xs text-destructive" role="status">
          {searchError}
        </p>
      )}
    </div>
  );
}

