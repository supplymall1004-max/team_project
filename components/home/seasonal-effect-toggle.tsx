/**
 * @file seasonal-effect-toggle.tsx
 * @description 계절 효과 온/오프 토글 버튼 컴포넌트
 * 
 * 햄버거 메뉴의 설정 아래에 위치하며, 네온 효과를 가진 버튼으로
 * 계절별 파티클 효과를 켜고 끌 수 있습니다.
 */

"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentSeason } from "@/lib/utils/season";
import { seasonThemes } from "@/data/seasons";
import { Label } from "@/components/ui/label";
import type { Season } from "@/data/seasons";

const STORAGE_KEY = "seasonal-effect-enabled";
const SEASON_STORAGE_KEY = "selected-season";

interface SeasonalEffectToggleProps {
  /** 햄버거 메뉴 내부 스타일 사용 여부 */
  inMenu?: boolean;
  /** 설정 페이지 내부 스타일 사용 여부 */
  inSettings?: boolean;
}

export function SeasonalEffectToggle({ inMenu = false, inSettings = false }: SeasonalEffectToggleProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<Season>("spring");

  useEffect(() => {
    // 로컬 스토리지에서 설정 불러오기
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      setIsEnabled(saved === "true");
    }

    // 로컬 스토리지에서 선택된 계절 불러오기
    const savedSeason = localStorage.getItem(SEASON_STORAGE_KEY);
    if (savedSeason && ["spring", "summer", "autumn", "winter"].includes(savedSeason)) {
      setSelectedSeason(savedSeason as Season);
    } else {
      // 저장된 계절이 없으면 현재 계절 사용
      const currentSeason = getCurrentSeason();
      setSelectedSeason(currentSeason);
    }
  }, []);

  const handleToggle = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    localStorage.setItem(STORAGE_KEY, String(newValue));
    
    // 전역 이벤트 발생 (다른 컴포넌트에서 사용 가능)
    window.dispatchEvent(new CustomEvent("seasonal-effect-toggle", { 
      detail: { enabled: newValue } 
    }));
  };

  const handleSeasonChange = (season: Season) => {
    setSelectedSeason(season);
    localStorage.setItem(SEASON_STORAGE_KEY, season);
    
    // 전역 이벤트 발생
    window.dispatchEvent(new CustomEvent("season-change", { 
      detail: { season } 
    }));
  };

  // 설정 페이지 내부 스타일
  if (inSettings) {
    return (
      <div className="space-y-4">
        {/* 온/오프 토글 버튼 */}
        <div className="space-y-2">
          <Label htmlFor="seasonal-effect-toggle">계절 효과</Label>
          <button
            id="seasonal-effect-toggle"
            onClick={handleToggle}
            className={cn(
              "group relative flex items-center justify-between gap-3 py-3 px-4 rounded-lg transition-all duration-300 overflow-hidden w-full",
              "border-2",
              isEnabled
                ? "bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300 text-orange-900"
                : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-900"
            )}
            style={{
              boxShadow: isEnabled
                ? "0 0 15px rgba(249, 115, 22, 0.3), 0 0 30px rgba(249, 115, 22, 0.15), inset 0 0 15px rgba(249, 115, 22, 0.1)"
                : undefined,
            }}
            aria-label={isEnabled ? "계절 효과 끄기" : "계절 효과 켜기"}
          >
            {/* 네온 효과 (켜져 있을 때만) */}
            {isEnabled && (
              <>
                <div className="absolute inset-0 bg-orange-400/20 rounded-lg blur-lg animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-300/30 to-transparent rounded-lg animate-shimmer" />
              </>
            )}
            
            <div className="flex items-center gap-3 flex-1 relative z-10">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
                isEnabled
                  ? "bg-orange-100 group-hover:bg-orange-200"
                  : "bg-gray-100 group-hover:bg-gray-200"
              )}>
                <Sparkles 
                  className={cn(
                    "h-5 w-5 transition-all duration-300",
                    isEnabled ? "text-orange-600 animate-pulse" : "text-gray-500"
                  )} 
                />
              </div>
              <div className="flex-1">
                <span className={cn(
                  "font-bold text-sm block",
                  isEnabled ? "text-orange-900" : "text-gray-900"
                )}>
                  계절 효과 {isEnabled ? "ON" : "OFF"}
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* 계절 선택 버튼들 */}
        {isEnabled && (
          <div className="space-y-2">
            <Label>계절 선택</Label>
            <div className="grid grid-cols-4 gap-2">
              {(["spring", "summer", "autumn", "winter"] as Season[]).map((season) => {
                const theme = seasonThemes[season];
                const isSelected = selectedSeason === season;
                
                return (
                  <button
                    key={season}
                    onClick={() => handleSeasonChange(season)}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg transition-all duration-300",
                      "border-2",
                      isSelected
                        ? "bg-orange-50 border-orange-300 shadow-md shadow-orange-500/20 scale-105"
                        : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:scale-105"
                    )}
                    style={{
                      boxShadow: isSelected
                        ? "0 0 10px rgba(249, 115, 22, 0.3), 0 0 20px rgba(249, 115, 22, 0.15)"
                        : undefined,
                    }}
                    aria-label={`${theme.nameKo} 선택`}
                  >
                    {/* 네온 효과 (선택된 계절만) */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-orange-400/10 rounded-lg blur-sm animate-pulse" />
                    )}
                    <span className="text-xl relative z-10">{theme.icon}</span>
                    <span className={cn(
                      "text-xs font-medium relative z-10",
                      isSelected ? "text-orange-700" : "text-gray-600"
                    )}>
                      {theme.nameKo}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        <style jsx>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          .animate-shimmer {
            animation: shimmer 3s infinite;
          }
        `}</style>
      </div>
    );
  }

  // 햄버거 메뉴 내부 스타일
  if (inMenu) {
    return (
      <div className="space-y-1.5">
        {/* 온/오프 토글 버튼 */}
        <button
          onClick={handleToggle}
          className={cn(
            "group relative flex items-center justify-between gap-3 py-2.5 px-4 rounded-xl transition-all duration-300 overflow-hidden w-full",
            "border-2",
            isEnabled
              ? "bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300 text-orange-900"
              : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-900"
          )}
          style={{
            boxShadow: isEnabled
              ? "0 0 15px rgba(249, 115, 22, 0.3), 0 0 30px rgba(249, 115, 22, 0.15), inset 0 0 15px rgba(249, 115, 22, 0.1)"
              : undefined,
          }}
          aria-label={isEnabled ? "계절 효과 끄기" : "계절 효과 켜기"}
        >
          {/* 네온 효과 (켜져 있을 때만) */}
          {isEnabled && (
            <>
              <div className="absolute inset-0 bg-orange-400/20 rounded-xl blur-lg animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-300/30 to-transparent rounded-xl animate-shimmer" />
            </>
          )}
          
          <div className="flex items-center gap-3 flex-1 relative z-10">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
              isEnabled
                ? "bg-orange-100 group-hover:bg-orange-200"
                : "bg-gray-100 group-hover:bg-gray-200"
            )}>
              <Sparkles 
                className={cn(
                  "h-5 w-5 transition-all duration-300",
                  isEnabled ? "text-orange-600 animate-pulse" : "text-gray-500"
                )} 
              />
            </div>
            <div className="flex-1">
              <span className={cn(
                "font-bold text-sm block",
                isEnabled ? "text-orange-900" : "text-gray-900"
              )}>
                계절 효과 {isEnabled ? "ON" : "OFF"}
              </span>
            </div>
          </div>
        </button>

        {/* 계절 선택 버튼들 */}
        {isEnabled && (
          <div className="px-4 py-2 space-y-2">
            <div className="text-xs font-medium text-gray-600 mb-2">계절 선택</div>
            <div className="grid grid-cols-4 gap-2">
              {(["spring", "summer", "autumn", "winter"] as Season[]).map((season) => {
                const theme = seasonThemes[season];
                const isSelected = selectedSeason === season;
                
                return (
                  <button
                    key={season}
                    onClick={() => handleSeasonChange(season)}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg transition-all duration-300",
                      "border-2",
                      isSelected
                        ? "bg-orange-50 border-orange-300 shadow-md shadow-orange-500/20 scale-105"
                        : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                    )}
                    style={{
                      boxShadow: isSelected
                        ? "0 0 10px rgba(249, 115, 22, 0.3), 0 0 20px rgba(249, 115, 22, 0.15)"
                        : undefined,
                    }}
                    aria-label={`${theme.nameKo} 선택`}
                  >
                    {/* 네온 효과 (선택된 계절만) */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-orange-400/10 rounded-lg blur-sm animate-pulse" />
                    )}
                    <span className="text-xl relative z-10">{theme.icon}</span>
                    <span className={cn(
                      "text-xs font-medium relative z-10",
                      isSelected ? "text-orange-700" : "text-gray-600"
                    )}>
                      {theme.nameKo}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        <style jsx>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          .animate-shimmer {
            animation: shimmer 3s infinite;
          }
        `}</style>
      </div>
    );
  }

  // 기본 스타일 (프리미엄 배너 아래용)
  return (
    <div className="relative w-full bg-gradient-to-r from-orange-500/10 via-orange-400/10 to-orange-500/10 border-b border-orange-200/30">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center">
        <button
          onClick={handleToggle}
          className={cn(
            "relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300",
            "border-2 backdrop-blur-sm",
            isEnabled
              ? "bg-orange-500/20 border-orange-400/50 text-orange-700 shadow-lg shadow-orange-500/30"
              : "bg-gray-100/50 border-gray-300/50 text-gray-600 shadow-sm",
            "hover:scale-105 active:scale-95"
          )}
          style={{
            boxShadow: isEnabled
              ? "0 0 20px rgba(249, 115, 22, 0.4), 0 0 40px rgba(249, 115, 22, 0.2), inset 0 0 20px rgba(249, 115, 22, 0.1)"
              : undefined,
          }}
          aria-label={isEnabled ? "계절 효과 끄기" : "계절 효과 켜기"}
        >
          {/* 네온 효과 (켜져 있을 때만) */}
          {isEnabled && (
            <>
              <div className="absolute inset-0 bg-orange-400/20 rounded-lg blur-xl animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-300/30 to-transparent rounded-lg animate-shimmer" />
            </>
          )}
          
          <Sparkles 
            className={cn(
              "w-4 h-4 transition-all duration-300 relative z-10",
              isEnabled ? "text-orange-600 animate-pulse" : "text-gray-500"
            )} 
          />
          <span className={cn(
            "text-sm font-medium relative z-10 whitespace-nowrap",
            isEnabled ? "text-orange-700" : "text-gray-600"
          )}>
            {isEnabled ? "계절 효과 ON" : "계절 효과 OFF"}
          </span>
        </button>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
}

