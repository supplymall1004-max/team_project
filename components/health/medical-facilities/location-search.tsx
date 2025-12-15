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
import { geocodeAddress } from "@/lib/naver/geocoding-api";

interface LocationSearchProps {
  onLocationChange: (lat: number, lon: number, locationName?: string) => void;
  onSearch?: (address: string) => Promise<void>;
  loading?: boolean;
  placeholder?: string;
}

export function LocationSearch({
  onLocationChange,
  onSearch,
  loading = false,
  placeholder = "주소를 입력하세요 (예: 서울시 강남구)",
}: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleCurrentLocation = async () => {
    console.group("[LocationSearch] 현재 위치 가져오기");
    setIsSearching(true);
    try {
      const location = await getUserLocation();
      if (location) {
        console.log(`✅ 현재 위치: ${location.lat}, ${location.lon}`);
        // 현재 위치는 지역명 없이 전달 (좌표 기반 검색)
        onLocationChange(location.lat, location.lon, undefined);
      } else {
        console.log("⚠️ 위치 정보를 가져올 수 없어 기본 위치를 사용합니다.");
        const defaultLocation = getDefaultLocation();
        // 기본 위치도 지역명 없이 전달
        onLocationChange(defaultLocation.lat, defaultLocation.lon, undefined);
      }
    } catch (error) {
      console.error("❌ 위치 정보 오류:", error);
      const defaultLocation = getDefaultLocation();
      // 기본 위치도 지역명 없이 전달
      onLocationChange(defaultLocation.lat, defaultLocation.lon, undefined);
    } finally {
      setIsSearching(false);
      console.groupEnd();
    }
  };

  const handleAddressSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    console.group("[LocationSearch] 주소 검색");
    setIsSearching(true);
    try {
      if (onSearch) {
        await onSearch(searchQuery);
      } else {
        // 서버 사이드에서 지오코딩 API 호출
        const response = await fetch(
          `/api/health/medical-facilities/geocode?address=${encodeURIComponent(searchQuery)}`
        );
        const data = await response.json();
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
    </div>
  );
}

