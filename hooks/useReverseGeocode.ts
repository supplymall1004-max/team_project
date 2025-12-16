/**
 * @file useReverseGeocode.ts
 * @description 좌표를 주소로 변환하는 훅 (역지오코딩)
 */

import { useState, useEffect, useCallback, useRef } from "react";

interface ReverseGeocodeResult {
  sido: string; // 시도
  sigungu: string; // 시군구
  dong?: string; // 동
  fullAddress?: string; // 전체 주소
}

interface UseReverseGeocodeReturn {
  address: ReverseGeocodeResult | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useReverseGeocode(
  coordinates: { lat: number; lng: number } | null,
  enabled: boolean = true
): UseReverseGeocodeReturn {
  const [address, setAddress] = useState<ReverseGeocodeResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 이전 좌표를 저장하여 불필요한 호출 방지
  const prevCoordinatesRef = useRef<{ lat: number; lng: number } | null>(null);

  const fetchAddress = useCallback(async () => {
    if (!coordinates || !enabled) {
      setAddress(null);
      prevCoordinatesRef.current = null;
      return;
    }

    // 이전 좌표와 비교하여 실제로 변경되었는지 확인
    const prevCoordinates = prevCoordinatesRef.current;
    if (prevCoordinates &&
        Math.abs(prevCoordinates.lat - coordinates.lat) < 0.0001 &&
        Math.abs(prevCoordinates.lng - coordinates.lng) < 0.0001) {
      console.log("⚠️ 역지오코딩 좌표가 변경되지 않아 호출을 건너뜁니다.");
      return;
    }

    prevCoordinatesRef.current = { lat: coordinates.lat, lng: coordinates.lng };

    setLoading(true);
    setError(null);

    try {
      // 서버 API를 통해 역지오코딩
      const response = await fetch("/api/health/geocode/reverse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ coordinates }),
      }).catch((fetchError) => {
        // 네트워크 오류인 경우 (서버가 준비되지 않았을 수 있음)
        if (fetchError instanceof TypeError && fetchError.message.includes("Failed to fetch")) {
          console.warn("⚠️ 역지오코딩 API 호출 실패 (서버 준비 중일 수 있음):", fetchError.message);
          // 조용히 실패 처리 (에러를 표시하지 않음)
          return null;
        }
        throw fetchError;
      });

      if (!response) {
        // 네트워크 오류로 인한 null 응답
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "역지오코딩에 실패했습니다.");
      }

      const data = await response.json();
      setAddress(data);
    } catch (err) {
      // 네트워크 오류는 조용히 처리 (서버가 준비 중일 수 있음)
      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
        console.warn("⚠️ 역지오코딩 네트워크 오류 (무시):", err.message);
        setError(null); // 에러를 표시하지 않음
      } else {
        const errorMessage =
          err instanceof Error ? err.message : "역지오코딩에 실패했습니다.";
        setError(errorMessage);
      }
      setAddress(null);
    } finally {
      setLoading(false);
    }
  }, [coordinates, enabled]);

  useEffect(() => {
    // enabled가 false이면 초기화
    if (!enabled) {
      prevCoordinatesRef.current = null;
    }
    fetchAddress();
  }, [fetchAddress, enabled]);

  return {
    address,
    loading,
    error,
    refetch: fetchAddress,
  };
}