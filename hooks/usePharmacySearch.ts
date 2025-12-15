/**
 * @file usePharmacySearch.ts
 * @description 국립중앙의료원 약국 정보 조회 훅
 */

import { useState, useCallback, useEffect } from "react";
import { PharmacyInfo, PharmacySearchParams } from "@/lib/health/pharmacy-api";
import { MedicalFacility, MedicalFacilityCategory } from "@/types/medical-facility";
import { calculateDistance } from "@/lib/health/medical-facilities/location-utils";

interface UsePharmacySearchParams {
  coordinates?: { lat: number; lng: number } | null;
  city?: string; // 시도 (예: 서울특별시)
  district?: string; // 시군구 (예: 강남구)
  pharmacyName?: string; // 약국명
  dayOfWeek?: number; // 진료요일 (1~8)
  enabled?: boolean;
}

interface UsePharmacySearchReturn {
  pharmacies: MedicalFacility[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePharmacySearch({
  coordinates,
  city,
  district,
  pharmacyName,
  dayOfWeek,
  enabled = true,
}: UsePharmacySearchParams): UsePharmacySearchReturn {
  const [pharmacies, setPharmacies] = useState<MedicalFacility[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPharmacies = useCallback(async () => {
    if (!enabled) {
      setPharmacies([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 여러 페이지를 가져와서 더 많은 결과 수집
      const allPharmacies: PharmacyInfo[] = [];
      const maxPages = 5; // 최대 5페이지

      for (let page = 1; page <= maxPages; page++) {
        const params: PharmacySearchParams = {
          Q0: city,
          Q1: district,
          QN: pharmacyName,
          QT: dayOfWeek ? String(dayOfWeek) : undefined,
          numOfRows: 500, // 한 페이지당 500개
          pageNo: page,
        };

        if (page === 1) {
          console.log("약국 정보 조회 시작:", params);
        }

        const response = await fetch("/api/health/pharmacy/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        }).catch((fetchError) => {
          // 네트워크 오류인 경우 (서버가 준비되지 않았을 수 있음)
          if (fetchError instanceof TypeError && fetchError.message.includes("Failed to fetch")) {
            console.warn("⚠️ 약국 정보 조회 API 호출 실패 (서버 준비 중일 수 있음):", fetchError.message);
            // 조용히 실패 처리
            return null;
          }
          throw fetchError;
        });

        if (!response) {
          // 네트워크 오류로 인한 null 응답
          if (page === 1) {
            break; // 첫 페이지에서 실패하면 중단
          }
          break;
        }

        if (!response.ok) {
          if (page === 1) {
            const errorData = await response.json().catch(() => ({}));
            const statusText = response.statusText || `HTTP ${response.status}`;
            const errorMessage = errorData.error || `약국 정보 조회에 실패했습니다. (${statusText})`;
            
            // 404 (Not Found)는 정상적인 상황일 수 있음 (약국이 없는 지역 등)
            if (response.status === 404) {
              console.log("ℹ️ 약국 정보가 없습니다 (404). 해당 지역에 약국이 없을 수 있습니다.");
              setError(null); // 에러를 표시하지 않음
              setPharmacies([]); // 빈 배열로 설정
              break;
            }
            
            // 다른 오류는 경고만 표시하고 조용히 처리
            console.warn("⚠️ 약국 정보 조회 API 실패:", {
              status: response.status,
              statusText,
              errorData,
              requestParams: params,
            });
            
            // 에러를 throw하지 않고 조용히 처리
            setError(null); // 에러를 표시하지 않음
            setPharmacies([]); // 빈 배열로 설정
            break;
          }
          break; // 첫 페이지가 아니면 중단
        }

        const data = await response.json();

        if (page === 1) {
          console.log("약국 정보 조회 성공 (페이지 1):", {
            totalCount: data.totalCount,
            pharmaciesCount: data.pharmacies.length,
          });
        }

        if (data.pharmacies && data.pharmacies.length > 0) {
          allPharmacies.push(...data.pharmacies);

          // 더 이상 결과가 없으면 중단
          if (data.pharmacies.length < 500 || !data.hasMore) {
            break;
          }
        } else {
          break;
        }
      }

      console.log("약국 정보 조회 완료 (전체):", {
        totalPharmacies: allPharmacies.length,
      });

      // PharmacyInfo를 MedicalFacility로 변환
      const facilities: MedicalFacility[] = allPharmacies
        .map((pharmacy: PharmacyInfo, index: number) => {
          const lat = parseFloat(pharmacy.wgs84Lat || "0");
          const lng = parseFloat(pharmacy.wgs84Lon || "0");

          if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            return null;
          }

          // 거리 계산 (항상 계산)
          const distance = coordinates
            ? calculateDistance(coordinates.lat, coordinates.lng, lat, lng)
            : undefined;

          // 운영시간 파싱
          const operatingHours: any = {};
          const days = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일", "공휴일"];

          for (let i = 0; i < 8; i++) {
            const startTime = pharmacy[`dutyTime${i + 1}s` as keyof PharmacyInfo] as string;
            const endTime = pharmacy[`dutyTime${i + 1}c` as keyof PharmacyInfo] as string;

            if (startTime && endTime) {
              operatingHours[days[i]] = {
                open: startTime,
                close: endTime,
                isClosed: false,
              };
            } else {
              operatingHours[days[i]] = {
                isClosed: true,
              };
            }
          }

          return {
            id: `pharmacy-${pharmacy.rnum}-${index}`,
            name: pharmacy.dutyName,
            category: "pharmacy" as MedicalFacilityCategory,
            address: pharmacy.dutyAddr,
            roadAddress: pharmacy.dutyAddr, // roadAddress로 동일하게 설정
            phone: pharmacy.dutyTel1,
            latitude: lat,
            longitude: lng,
            distance,
            operatingHours,
            link: "", // 네이버 링크 없음
          };
        })
        .filter((facility: MedicalFacility | null): facility is MedicalFacility => facility !== null);

      // 거리순으로 정렬
      if (coordinates) {
        facilities.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      setPharmacies(facilities);
      console.log("약국 정보 변환 완료:", facilities.length, "개");
    } catch (err) {
      // 네트워크 오류는 조용히 처리 (서버가 준비 중일 수 있음)
      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
        console.warn("⚠️ 약국 정보 조회 네트워크 오류 (무시):", err.message);
        setError(null); // 에러를 표시하지 않음
        setPharmacies([]); // 빈 배열로 설정
      } else {
        const errorMessage =
          err instanceof Error ? err.message : "약국 정보 조회에 실패했습니다.";
        setError(errorMessage);
        setPharmacies([]);
        console.error("약국 정보 조회 오류:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [coordinates, city, district, pharmacyName, dayOfWeek, enabled]);

  useEffect(() => {
    fetchPharmacies();
  }, [fetchPharmacies]);

  return {
    pharmacies,
    loading,
    error,
    refetch: fetchPharmacies,
  };
}