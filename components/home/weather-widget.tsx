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
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { slideLeftScale, slowSpringTransition } from "@/lib/animations";

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

      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      // 응답이 JSON인지 먼저 확인
      const contentType = response.headers.get("content-type");
      let data: any = null;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // JSON이 아닌 경우 에러 텍스트 읽기
        const errorText = await response.text().catch(() => "응답 본문을 읽을 수 없습니다");
        console.error("❌ JSON이 아닌 응답 수신 (HTTP 상태:", response.status, ")");
        console.error("❌ Content-Type:", contentType);
        console.error("❌ 응답 내용 (처음 500자):", errorText.substring(0, 500));
        
        // HTML 응답인 경우 API 라우트가 제대로 작동하지 않는 것으로 판단
        if (errorText.includes("<!DOCTYPE html>") || errorText.includes("<html")) {
          console.error("⚠️ API 라우트가 HTML을 반환했습니다. API 라우트가 제대로 작동하지 않을 수 있습니다.");
          console.error("⚠️ 개발 서버를 재시작하거나 API 라우트 파일을 확인해주세요.");
        }
        
        setError(null);
        setWeather(null);
        console.groupEnd();
        return;
      }

      // HTTP 에러 상태 확인 (JSON 응답인 경우)
      if (!response.ok) {
        console.error(`❌ 날씨 API HTTP 오류: ${response.status} ${response.statusText}`);
        console.error("❌ 에러 응답:", data);
        
        // NO_DATA는 정상적인 상황일 수 있음 (해당 시간대에 데이터가 없을 수 있음)
        if (data?.error?.includes("NO_DATA") || data?.error?.includes("데이터가 없습니다")) {
          console.log("ℹ️ 해당 시간대의 날씨 데이터가 없습니다. 기본 위치로 재시도합니다.");
          // 기본 위치(서울)로 재시도
          const defaultLat = 37.5665;
          const defaultLon = 126.9780;
          if (lat !== defaultLat || lon !== defaultLon) {
            fetchWeather(defaultLat, defaultLon);
            return;
          }
        }
        
        // 500 에러인 경우 API 키 문제일 수 있음
        if (response.status === 500) {
          console.error("⚠️ 서버 오류 - 기상청 API 키가 설정되지 않았거나 잘못되었을 수 있습니다.");
          console.error("⚠️ .env 파일에 NEXT_PUBLIC_KMA_WEATHER_API_KEY를 확인해주세요.");
        }
        
        setError(null);
        setWeather(null);
        console.groupEnd();
        return;
      }

      if (!data.success) {
        console.error("❌ 날씨 API 응답 실패:", data);
        
        // API 키 관련 에러인 경우
        if (data.error?.includes("API 키") || data.error?.includes("설정되지 않았습니다")) {
          console.error("⚠️ 기상청 API 키가 설정되지 않았습니다.");
          console.error("⚠️ .env 파일에 NEXT_PUBLIC_KMA_WEATHER_API_KEY를 추가해주세요.");
          console.error("⚠️ 공공데이터포털(data.go.kr)에서 기상청 API 키를 발급받아야 합니다.");
        }
        
        // NO_DATA는 정상적인 상황일 수 있음 (해당 위치에 데이터가 없을 수 있음)
        if (data.error?.includes("NO_DATA") || data.error?.includes("데이터가 없습니다")) {
          console.log("ℹ️ 해당 위치의 날씨 데이터가 없습니다. 기본 위치로 재시도합니다.");
          // 기본 위치(서울)로 재시도
          const defaultLat = 37.5665;
          const defaultLon = 126.9780;
          if (lat !== defaultLat || lon !== defaultLon) {
            fetchWeather(defaultLat, defaultLon);
            return;
          }
        }
        
        // 다른 오류는 경고만 표시하고 조용히 처리
        console.warn("⚠️ 날씨 정보 조회 실패:", data.error || "날씨 정보를 가져올 수 없습니다.");
        setError(null);
        setWeather(null);
        console.groupEnd();
        return;
      }

      console.log("✅ 날씨 정보 수신:", data.data);
      setWeather(data.data);
      console.groupEnd();
    } catch (err) {
      // 네트워크 오류나 기타 예외는 조용히 처리
      console.warn("⚠️ 날씨 정보 조회 중 오류 발생:", err instanceof Error ? err.message : "알 수 없는 오류");
      setError(null); // 에러를 표시하지 않음
      setWeather(null);
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

  // 날씨에 맞는 멘트 생성
  const getWeatherMessage = (weather: WeatherData): string => {
    try {
      const temp = weather.temperature ?? 0;
      const description = (weather.description || '').toLowerCase();
      const precipitation = weather.precipitation || 0;
      
      // 비오는 날 (우선순위 1)
      if (description.includes('rain') || description.includes('비') || precipitation > 0) {
        const messages = [
          "비 오는 날엔 파전에 막걸리 어떠세요?",
          "빗소리 들으며 따뜻한 전골 어떠세요?",
          "비 오는 날엔 따뜻한 수제비 어떠세요?",
        ];
        return messages[Math.floor(Math.random() * messages.length)];
      }
      
      // 눈 오는 날 (우선순위 2)
      if (description.includes('snow') || description.includes('눈')) {
        const messages = [
          "눈 오는 날엔 따뜻한 떡국 어떠세요?",
          "눈 내리는 날엔 따뜻한 부대찌개 어떠세요?",
          "눈 오는 날엔 따뜻한 김치찌개 어떠세요?",
        ];
        return messages[Math.floor(Math.random() * messages.length)];
      }
      
      // 매우 추운 날씨 (영하 5도 이하) - 우선순위 3
      if (temp <= -5) {
        const messages = [
          `${temp}도의 날씨에 따뜻한 갈비탕 어떠세요?`,
          `${temp}도의 날씨에 따뜻한 설렁탕 어떠세요?`,
          `${temp}도의 날씨에 따뜻한 곰탕 어떠세요?`,
        ];
        return messages[Math.floor(Math.random() * messages.length)];
      }
      
      // 추운 날씨 (영하 0도 이상 5도 미만) - 우선순위 4
      if (temp < 0) {
        return `${temp}도의 날씨에 따뜻한 갈비탕 어떠세요?`;
      }
      
      // 쌀쌀한 날씨 (0도 이상 5도 미만) - 우선순위 5
      if (temp < 5) {
        const messages = [
          "쌀쌀한 날씨에 따뜻한 국물 요리 어떠세요?",
          "추운 날씨에 따뜻한 찌개 어떠세요?",
          "쌀쌀한 날씨에 따뜻한 전골 어떠세요?",
        ];
        return messages[Math.floor(Math.random() * messages.length)];
      }
      
      // 더운 날씨 (25도 이상) - 우선순위 6
      if (temp >= 25) {
        const messages = [
          "더운 날씨에 시원한 냉면 어떠세요?",
          "더운 날씨에 시원한 수육 어떠세요?",
          "더운 날씨에 시원한 물냉면 어떠세요?",
        ];
        return messages[Math.floor(Math.random() * messages.length)];
      }
      
      // 맑은 날씨 - 우선순위 7
      if (description.includes('clear') || description.includes('맑음')) {
        return "맑은 날씨에 산뜻한 요리 어떠세요?";
      }
      
      // 흐린 날씨 - 우선순위 8
      if (description.includes('cloud') || description.includes('흐림')) {
        return "흐린 날씨에 따뜻한 요리 어떠세요?";
      }
      
      // 기본 멘트
      return "오늘 날씨에 맞는 맛있는 요리 어떠세요?";
    } catch (error) {
      console.error("[WeatherWidget] 날씨 멘트 생성 오류:", error);
      return "오늘 날씨에 맞는 맛있는 요리 어떠세요?";
    }
  };

  // 날씨 위젯 애니메이션 variants (오른쪽에서 중앙으로)
  const weatherVariants: Variants = {
    initial: { opacity: 0, x: 100, scale: 0.8 },
    animate: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: {
        ...slowSpringTransition,
        delay: 0.6,
      },
    },
  };

  // 강조 효과 애니메이션 (빛나는 효과)
  const glowVariants: Variants = {
    initial: { 
      boxShadow: '0 0 0px rgba(147, 51, 234, 0)',
    },
    animate: { 
      boxShadow: [
        '0 0 0px rgba(147, 51, 234, 0)',
        '0 0 20px rgba(147, 51, 234, 0.6)',
        '0 0 40px rgba(147, 51, 234, 0.4)',
        '0 0 0px rgba(147, 51, 234, 0)',
      ],
      transition: {
        duration: 1.5,
        delay: 1.4,
        ease: "easeInOut",
      },
    },
  };

  // 로딩 상태
  if (loading) {
    return (
      <motion.div
        variants={weatherVariants}
        initial="initial"
        animate="animate"
        className={cn(
          "py-2.5 px-4 bg-purple-50 border-2 border-purple-200 rounded-xl",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
              <RefreshCw className="h-5 w-5 text-purple-600 animate-spin" />
            </div>
            <div>
              <h3 className="font-bold text-purple-900 text-sm">날씨 정보</h3>
              <p className="text-xs text-purple-700">날씨 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // 에러 상태
  if (error || locationError) {
    return (
      <div
        className={cn(
          "py-2.5 px-4 bg-purple-50 border-2 border-purple-200 rounded-xl group",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
              <Cloud className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-purple-900 text-sm">날씨 정보</h3>
              <p className="text-xs text-purple-700">
                {error || locationError || "날씨 정보를 불러올 수 없습니다"}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="rounded-md p-1 hover:bg-purple-200 transition-colors"
            aria-label="새로고침"
          >
            <RefreshCw className="h-4 w-4 text-purple-400 group-hover:text-purple-600 transition-colors" />
          </button>
        </div>
      </div>
    );
  }

  // 날씨 정보가 없을 때 기본 UI 표시
  if (!weather) {
    return (
      <div
        className={cn(
          "py-2.5 px-4 bg-purple-50 border-2 border-purple-200 rounded-xl group",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
              <Cloud className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-purple-900 text-sm">날씨 정보</h3>
              <p className="text-xs text-purple-700">날씨 정보를 불러오는 중...</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="rounded-md p-1 hover:bg-purple-200 transition-colors"
            aria-label="새로고침"
          >
            <RefreshCw className="h-4 w-4 text-purple-400 group-hover:text-purple-600 transition-colors" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={weatherVariants}
      initial="initial"
      animate="animate"
      className={cn("rounded-xl", className)}
    >
      <motion.div
        variants={glowVariants}
        initial="initial"
        animate="animate"
        className="rounded-xl"
      >
        <div
          className={cn(
            "py-2.5 px-4 bg-purple-50 border-2 border-purple-200 rounded-xl hover:bg-purple-100 hover:border-purple-300 transition-all group relative overflow-hidden",
            className
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                {weather.icon ? (
                  <img
                    src={getWeatherIconUrl(weather.icon)}
                    alt={weather.description}
                    className="h-5 w-5"
                  />
                ) : (
                  <Cloud className="h-5 w-5 text-purple-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-purple-900 text-sm">날씨 정보</h3>
                <p className="text-xs text-purple-700">
                  {weather.location} · {weather.temperature}° {weather.feelsLike && `(체감 ${weather.feelsLike}°)`}
                </p>
                <p className="text-xs text-purple-700 capitalize mt-0.5">
                  {weather.description} · 습도 {weather.humidity}% · 풍속 {weather.windSpeed}km/h
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="rounded-md p-1 hover:bg-purple-200 transition-colors"
              aria-label="새로고침"
            >
              <RefreshCw className="h-4 w-4 text-purple-400 group-hover:text-purple-600 transition-colors" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

