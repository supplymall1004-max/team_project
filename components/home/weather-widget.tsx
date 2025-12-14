/**
 * @file weather-widget.tsx
 * @description 날씨 위젯 컴포넌트
 * 
 * 주요 기능:
 * 1. 사용자의 위치 정보를 가져옴 (Geolocation API)
 * 2. 날씨 API를 호출하여 현재 날씨 정보 표시
 * 3. 온도, 날씨 설명, 습도, 풍속 등 시각화
 * 
 * @dependencies
 * - /api/weather: 날씨 정보 조회 API
 * - lucide-react: 아이콘
 */

"use client";

import { useEffect, useState } from "react";
import { Cloud, Droplets, Wind, Eye, RefreshCw, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeatherData {
  location: string;
  temperature: number;
  feelsLike?: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  windDirection?: string;
  pressure?: number;
  visibility?: number;
  precipitation?: number;
}

interface WeatherWidgetProps {
  className?: string;
}

export function WeatherWidget({ className }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // 날씨 정보 가져오기
  const fetchWeather = async (lat: number, lon: number) => {
    try {
      console.group("[WeatherWidget] 날씨 정보 조회");
      console.log(`📍 위치: ${lat}, ${lon}`);

      setLoading(true);
      setError(null);

      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "날씨 정보를 가져올 수 없습니다.");
      }

      console.log("✅ 날씨 정보 수신:", data.data);
      setWeather(data.data);
      console.groupEnd();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "날씨 정보를 가져오는 중 오류가 발생했습니다.";
      console.error("❌ 날씨 정보 조회 실패:", err);
      setError(errorMessage);
      console.groupEnd();
    } finally {
      setLoading(false);
    }
  };

  // 위치 정보 가져오기
  useEffect(() => {
    // 기본 위치 (서울시청 좌표)
    const defaultLat = 37.5665;
    const defaultLon = 126.9780;

    if (!navigator.geolocation) {
      console.group("[WeatherWidget] 위치 정보 요청");
      console.log("⚠️ 브라우저가 위치 정보를 지원하지 않습니다. 기본 위치(서울)를 사용합니다.");
      console.groupEnd();
      fetchWeather(defaultLat, defaultLon);
      return;
    }

    console.group("[WeatherWidget] 위치 정보 요청");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("✅ 위치 정보 수신:", latitude, longitude);
        console.groupEnd();
        fetchWeather(latitude, longitude);
      },
      (err) => {
        const errorMessage =
          err.code === 1
            ? "위치 정보 접근이 거부되어 기본 위치(서울)를 사용합니다."
            : err.code === 2
            ? "위치 정보를 가져올 수 없어 기본 위치(서울)를 사용합니다."
            : "위치 정보 요청 시간이 초과되어 기본 위치(서울)를 사용합니다.";
        console.warn("⚠️ 위치 정보 오류:", err);
        console.log("📍 기본 위치(서울)로 날씨 정보를 조회합니다.");
        console.groupEnd();
        // 위치 정보를 가져올 수 없어도 기본 위치로 날씨 정보 표시
        setLocationError(null); // 에러를 표시하지 않고 기본 위치 사용
        fetchWeather(defaultLat, defaultLon);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5분 캐시
      }
    );
  }, []);

  // 새로고침
  const handleRefresh = () => {
    // 기본 위치 (서울시청 좌표)
    const defaultLat = 37.5665;
    const defaultLon = 126.9780;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeather(latitude, longitude);
        },
        (err) => {
          console.log("⚠️ 위치 정보를 가져올 수 없어 기본 위치(서울)를 사용합니다.");
          fetchWeather(defaultLat, defaultLon);
        }
      );
    } else {
      fetchWeather(defaultLat, defaultLon);
    }
  };

  // 날씨 아이콘 URL 생성
  const getWeatherIconUrl = (icon: string) => {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  };

  // 로딩 상태
  if (loading) {
    return (
      <div
        className={cn(
          "rounded-lg border bg-card p-4 shadow-sm",
          className
        )}
      >
        <div className="flex items-center justify-center space-x-2 py-8">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">날씨 정보를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || locationError) {
    return (
      <div
        className={cn(
          "rounded-lg border bg-card p-4 shadow-sm",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cloud className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold">날씨 정보</h3>
              <p className="text-xs text-muted-foreground">
                {error || locationError}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="rounded-md p-1.5 hover:bg-muted transition-colors"
            aria-label="새로고침"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  // 날씨 정보 표시
  if (!weather) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20 p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {weather.location}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="rounded-md p-1 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
          aria-label="새로고침"
        >
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* 주요 날씨 정보 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {weather.icon && (
            <img
              src={getWeatherIconUrl(weather.icon)}
              alt={weather.description}
              className="h-16 w-16"
            />
          )}
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold">{weather.temperature}°</span>
              {weather.feelsLike && (
                <span className="text-sm text-muted-foreground">
                  체감 {weather.feelsLike}°
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground capitalize">
              {weather.description}
            </p>
          </div>
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-blue-200/50 dark:border-blue-800/50">
        <div className="flex items-center space-x-2">
          <Droplets className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-xs text-muted-foreground">습도</p>
            <p className="text-sm font-semibold">{weather.humidity}%</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Wind className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-xs text-muted-foreground">풍속</p>
            <p className="text-sm font-semibold">
              {weather.windSpeed} km/h
              {weather.windDirection && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({weather.windDirection})
                </span>
              )}
            </p>
          </div>
        </div>
        {weather.visibility !== undefined && (
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-xs text-muted-foreground">가시거리</p>
              <p className="text-sm font-semibold">{weather.visibility} km</p>
            </div>
          </div>
        )}
        {weather.pressure !== undefined && (
          <div className="flex items-center space-x-2">
            <Cloud className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-xs text-muted-foreground">기압</p>
              <p className="text-sm font-semibold">{weather.pressure} hPa</p>
            </div>
          </div>
        )}
        {weather.precipitation !== undefined && weather.precipitation > 0 && (
          <div className="flex items-center space-x-2">
            <Droplets className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-xs text-muted-foreground">강수량</p>
              <p className="text-sm font-semibold">{weather.precipitation} mm</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

