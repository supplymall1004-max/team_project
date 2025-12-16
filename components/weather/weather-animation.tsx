/**
 * @file components/weather/weather-animation.tsx
 * @description 날씨 상태에 따라 비/눈 애니메이션을 렌더링하는 컴포넌트.
 *
 * 주요 기능:
 * 1. 날씨 설명/강수량을 기반으로 비/눈 여부 및 강도를 판별
 * 2. 전체 화면(`fullscreen`)과 위젯 내부(`widget`) 두 가지 모드 지원
 * 3. CSS 기반 파티클 애니메이션으로 성능 부담을 최소화
 *
 * @dependencies
 * - @/lib/utils: cn 유틸리티
 *
 * @see {@link components/home/weather-widget.tsx} - 날씨 데이터 공급자
 */

"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

type WeatherEffect = "rain" | "snow" | null;
type WeatherIntensity = "light" | "medium" | "heavy";

interface WeatherAnimationProps {
  weather: {
    description: string;
    precipitation?: number;
  } | null;
  variant?: "fullscreen" | "widget";
}

interface ParticleStyle {
  left: string;
  animationDelay: string;
  animationDuration: string;
  opacity: number;
  transform?: string;
}

const RAIN_KEY = "rain-fall";
const SNOW_KEY = "snow-fall";

function detectEffect(weather: WeatherAnimationProps["weather"]): {
  effect: WeatherEffect;
  intensity: WeatherIntensity;
} {
  if (!weather) {
    return { effect: null, intensity: "light" };
  }

  const description = weather.description.toLowerCase();
  const precipitation = weather.precipitation ?? 0;

  const isSnow = description.includes("snow") || description.includes("눈");
  const isRain =
    description.includes("rain") ||
    description.includes("비") ||
    description.includes("소나기");

  if (!isSnow && !isRain) {
    return { effect: null, intensity: "light" };
  }

  const intensity: WeatherIntensity =
    precipitation > 5 ? "heavy" : precipitation > 1 ? "medium" : "light";

  if (isSnow) {
    return { effect: "snow", intensity };
  }

  return { effect: "rain", intensity };
}

function useParticles(
  effect: WeatherEffect,
  intensity: WeatherIntensity,
  variant: "fullscreen" | "widget"
) {
  return useMemo(() => {
    if (!effect) return [];

    const baseCount = effect === "rain" ? 60 : 40;
    const scaleFactor =
      intensity === "heavy" ? 1.2 : intensity === "medium" ? 1 : 0.6;
    const variantFactor = variant === "widget" ? 0.4 : 1;
    const count = Math.max(
      8,
      Math.round(baseCount * scaleFactor * variantFactor)
    );

    const particles: ParticleStyle[] = [];

    for (let i = 0; i < count; i += 1) {
      const left = `${Math.random() * 100}%`;
      const delay = `${Math.random() * 1.5}s`;
      const duration =
        effect === "rain"
          ? `${0.9 + Math.random() * 0.8}s`
          : `${4 + Math.random() * 3}s`;
      const opacity = effect === "rain" ? 0.3 + Math.random() * 0.4 : 0.4 + Math.random() * 0.5;
      const transform =
        effect === "snow" ? `scale(${0.7 + Math.random() * 0.8})` : undefined;

      particles.push({
        left,
        animationDelay: delay,
        animationDuration: duration,
        opacity,
        transform,
      });
    }

    return particles;
  }, [effect, intensity, variant]);
}

export function WeatherAnimation({
  weather,
  variant = "fullscreen",
}: WeatherAnimationProps) {
  const { effect, intensity } = detectEffect(weather);
  const particles = useParticles(effect, intensity, variant);

  if (!effect) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none select-none",
        variant === "fullscreen"
          ? "fixed inset-0 z-10"
          : "absolute inset-0 z-0 overflow-hidden rounded-xl"
      )}
    >
      {effect === "rain" &&
        particles.map((style, index) => (
          <span
            key={`rain-${index}`}
            className="absolute top-[-20%] h-12 w-px bg-sky-400/70"
            style={{
              left: style.left,
              animationDelay: style.animationDelay,
              animationDuration: style.animationDuration,
              opacity: style.opacity,
              animationName: RAIN_KEY,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              transform: "translate3d(0,0,0)",
            }}
          />
        ))}

      {effect === "snow" &&
        particles.map((style, index) => (
          <span
            key={`snow-${index}`}
            className="absolute top-[-10%] h-3 w-3 rounded-full bg-white"
            style={{
              left: style.left,
              animationDelay: style.animationDelay,
              animationDuration: style.animationDuration,
              opacity: style.opacity,
              animationName: SNOW_KEY,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              transform: style.transform,
            }}
          />
        ))}

      <style jsx global>{`
        @keyframes ${RAIN_KEY} {
          0% {
            transform: translate3d(0, -20%, 0);
          }
          100% {
            transform: translate3d(0, 120vh, 0);
          }
        }

        @keyframes ${SNOW_KEY} {
          0% {
            transform: translate3d(0, -10%, 0);
          }
          50% {
            transform: translate3d(8px, 50vh, 0);
          }
          100% {
            transform: translate3d(-6px, 110vh, 0);
          }
        }
      `}</style>
    </div>
  );
}
