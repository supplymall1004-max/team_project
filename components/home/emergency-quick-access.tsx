'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Siren, ChevronRight, MapPin, Apple, Sparkles, Syringe } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { slideDownScale, slideRightScale, slideLeftScale, slideUpScale, slowSpringTransition } from '@/lib/animations';

/**
 * 모바일 기기 감지 함수
 * 모바일 환경에서 애니메이션 관련 에러를 방지하기 위해 사용
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod|android|mobile/.test(userAgent);
}

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

// 날씨에 맞는 멘트 생성
function getWeatherMessage(weather: WeatherData): string {
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
    return "오늘 날씨에 맞는 맛있는 요리 어떠세요?";
  }
}

export function EmergencyQuickAccess() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 환경 감지 (클라이언트 사이드에서만)
  useEffect(() => {
    try {
      setIsMobile(isMobileDevice());
    } catch (error) {
      console.warn('[EmergencyQuickAccess] 모바일 감지 실패, 안전 모드로 전환:', error);
      setIsMobile(true); // 에러 발생 시 안전하게 모바일로 간주
    }
  }, []);

  useEffect(() => {
    // 날씨 정보 가져오기
    const fetchWeather = async () => {
      try {
        const defaultLat = 37.5665;
        const defaultLon = 126.9780;
        const response = await fetch(`/api/weather?lat=${defaultLat}&lon=${defaultLon}`);
        
        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            if (data.success && data.data) {
              setWeather(data.data);
            }
          }
        }
      } catch (error) {
        // 에러는 조용히 처리
        console.log("[EmergencyQuickAccess] 날씨 정보 로드 실패");
      }
    };

    fetchWeather();
  }, []);

    // 모바일에서는 애니메이션을 단순화하여 성능 문제 및 호환성 문제 방지
    const useSimpleAnimation = isMobile;

    // 각 카드별 애니메이션 variants 정의
    // 모바일에서는 단순한 페이드 인만 사용
    const emergencyVariants: Variants = useSimpleAnimation
        ? {
            initial: { opacity: 0 },
            animate: { 
                opacity: 1,
                transition: { duration: 0.3 },
            },
        }
        : {
            initial: { opacity: 0, y: -100, scale: 0.8 },
            animate: { 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: {
                    ...slowSpringTransition,
                    delay: 0.1,
                },
            },
        };

    const vaccinationVariants: Variants = useSimpleAnimation
        ? {
            initial: { opacity: 0 },
            animate: { 
                opacity: 1,
                transition: { duration: 0.3 },
            },
        }
        : {
            initial: { opacity: 0, x: -100, scale: 0.8 },
            animate: { 
                opacity: 1, 
                x: 0, 
                scale: 1,
                transition: {
                    ...slowSpringTransition,
                    delay: 0.2,
                },
            },
        };

    const medicalFacilitiesVariants: Variants = useSimpleAnimation
        ? {
            initial: { opacity: 0 },
            animate: { 
                opacity: 1,
                transition: { duration: 0.3 },
            },
        }
        : {
            initial: { opacity: 0, x: 100, scale: 0.8 },
            animate: { 
                opacity: 1, 
                x: 0, 
                scale: 1,
                transition: {
                    ...slowSpringTransition,
                    delay: 0.3,
                },
            },
        };

    const dietVariants: Variants = useSimpleAnimation
        ? {
            initial: { opacity: 0 },
            animate: { 
                opacity: 1,
                transition: { duration: 0.3 },
            },
        }
        : {
            initial: { opacity: 0, y: 100, scale: 0.8 },
            animate: { 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: {
                    ...slowSpringTransition,
                    delay: 0.4,
                },
            },
        };

    const recipeGenieVariants: Variants = useSimpleAnimation
        ? {
            initial: { opacity: 0 },
            animate: { 
                opacity: 1,
                transition: { duration: 0.3 },
            },
        }
        : {
            initial: { opacity: 0, x: -100, scale: 0.8 },
            animate: { 
                opacity: 1, 
                x: 0, 
                scale: 1,
                transition: {
                    ...slowSpringTransition,
                    delay: 0.5,
                },
            },
        };

    // 강조 효과 애니메이션 (빛나는 효과) - 모바일에서는 비활성화
    const createGlowVariants = (color: string, delay: number): Variants => {
        if (useSimpleAnimation) {
            return {
                initial: {},
                animate: {},
            };
        }
        return {
            initial: { 
                boxShadow: `0 0 0px ${color}00`,
            },
            animate: { 
                boxShadow: [
                    `0 0 0px ${color}00`,
                    `0 0 20px ${color}99`,
                    `0 0 40px ${color}66`,
                    `0 0 0px ${color}00`,
                ],
                transition: {
                    duration: 1.5,
                    delay: delay,
                    ease: "easeInOut",
                },
            },
        };
    };

    const emergencyGlow = createGlowVariants('rgba(239, 68, 68', 0.9); // red
    const vaccinationGlow = createGlowVariants('rgba(14, 165, 233', 1.0); // sky
    const medicalGlow = createGlowVariants('rgba(59, 130, 246', 1.1); // blue
    const dietGlow = createGlowVariants('rgba(34, 197, 94', 1.2); // green
    const recipeGenieGlow = createGlowVariants('rgba(234, 179, 8', 1.3); // yellow

    // 모바일에서는 일반 div 사용, 데스크톱에서는 motion.div 사용
    // 모바일 환경에서 framer-motion 관련 에러를 방지하기 위함
    const MotionWrapper = useSimpleAnimation 
        ? ({ children, className }: { children: React.ReactNode; className?: string }) => (
            <div className={className}>{children}</div>
        )
        : motion.div;

    return (
        <div className="space-y-2">
            {/* 응급조치 안내 - 위에서 아래로 */}
            <MotionWrapper
                {...(useSimpleAnimation ? {} : {
                    variants: emergencyVariants,
                    initial: "initial",
                    animate: "animate",
                })}
            >
                <MotionWrapper
                    {...(useSimpleAnimation ? {} : {
                        variants: emergencyGlow,
                        initial: "initial",
                        animate: "animate",
                    })}
                    className="rounded-xl"
                >
                    <Link
                        href="/health/emergency"
                        className="flex items-center justify-between py-2.5 px-4 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors">
                                <Siren className="w-5 h-5 text-red-600 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="font-bold text-red-900 text-sm">응급조치 안내</h3>
                                <p className="text-xs text-red-700">알레르기 반응 시 즉시 대처하세요</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />
                    </Link>
                </MotionWrapper>
            </MotionWrapper>

            {/* 예방접종 안내 - 왼쪽에서 중앙으로 */}
            <MotionWrapper
                {...(useSimpleAnimation ? {} : {
                    variants: vaccinationVariants,
                    initial: "initial",
                    animate: "animate",
                })}
            >
                <MotionWrapper
                    {...(useSimpleAnimation ? {} : {
                        variants: vaccinationGlow,
                        initial: "initial",
                        animate: "animate",
                    })}
                    className="rounded-xl"
                >
                    <Link
                        href="/health/vaccinations"
                        className="flex items-center justify-between py-2.5 px-4 bg-sky-50 border-2 border-sky-200 rounded-xl hover:bg-sky-100 hover:border-sky-300 transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-sky-100 rounded-full group-hover:bg-sky-200 transition-colors">
                                <Syringe className="w-5 h-5 text-sky-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sky-900 text-sm">예방접종 안내</h3>
                                <p className="text-xs text-sky-700">나이별 맞춤 예방접종 일정 확인</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-sky-400 group-hover:text-sky-600 transition-colors" />
                    </Link>
                </MotionWrapper>
            </MotionWrapper>

            {/* 주변 의료기관 찾기 - 오른쪽에서 중앙으로 */}
            <MotionWrapper
                {...(useSimpleAnimation ? {} : {
                    variants: medicalFacilitiesVariants,
                    initial: "initial",
                    animate: "animate",
                })}
            >
                <MotionWrapper
                    {...(useSimpleAnimation ? {} : {
                        variants: medicalGlow,
                        initial: "initial",
                        animate: "animate",
                    })}
                    className="rounded-xl"
                >
                    <Link
                        href="/health/emergency/medical-facilities"
                        className="flex items-center justify-between py-2.5 px-4 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                                <MapPin className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-blue-900 text-sm">주변 의료기관 찾기</h3>
                                <p className="text-xs text-blue-700">병원, 약국, 동물병원 위치 확인</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors" />
                    </Link>
                </MotionWrapper>
            </MotionWrapper>

            {/* 건강 맞춤 식단 - 아래에서 중앙으로 */}
            <MotionWrapper
                {...(useSimpleAnimation ? {} : {
                    variants: dietVariants,
                    initial: "initial",
                    animate: "animate",
                })}
            >
                <MotionWrapper
                    {...(useSimpleAnimation ? {} : {
                        variants: dietGlow,
                        initial: "initial",
                        animate: "animate",
                    })}
                    className="rounded-xl"
                >
                    <Link
                        href="/diet"
                        className="flex items-center justify-between py-2.5 px-4 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 hover:border-green-300 transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                                <Apple className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-green-900 text-sm">건강 맞춤 식단</h3>
                                <p className="text-xs text-green-700">개인 맞춤 식단 상세 정보 확인</p>
                                {/* 날씨 맞춤 멘트 - 네온사인 스타일 */}
                                <p 
                                  className="text-xs font-bold mt-1 px-2 py-1 rounded"
                                  style={{
                                    color: '#ffffff',
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    textShadow: `
                                      0 0 3px #ff6b35,
                                      0 0 6px #ff6b35,
                                      0 0 9px #ff6b35,
                                      0 0 12px #ff6b35,
                                      0 0 15px #ff6b35,
                                      1px 1px 2px rgba(0, 0, 0, 0.5)
                                    `,
                                    animation: 'neon-flicker 3s infinite',
                                    border: '1px solid rgba(255, 107, 53, 0.3)',
                                  }}
                                >
                                  {weather ? getWeatherMessage(weather) : "오늘 날씨에 맞는 맛있는 요리 어떠세요?"}
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-green-400 group-hover:text-green-600 transition-colors" />
                    </Link>
                </MotionWrapper>
            </MotionWrapper>

            {/* Recipe Genie - 왼쪽에서 중앙으로 */}
            <MotionWrapper
                {...(useSimpleAnimation ? {} : {
                    variants: recipeGenieVariants,
                    initial: "initial",
                    animate: "animate",
                })}
            >
                <MotionWrapper
                    {...(useSimpleAnimation ? {} : {
                        variants: recipeGenieGlow,
                        initial: "initial",
                        animate: "animate",
                    })}
                    className="rounded-xl"
                >
                    <button
                        onClick={() => {
                            console.groupCollapsed("[RecipeGenieBanner] 배너 클릭");
                            console.log("url:", "https://gemini.google.com/gem-labs/1wffdEjbZ3E9wChM3O5VcoziuDnKihjDk");
                            console.log("timestamp:", Date.now());
                            console.groupEnd();
                            window.open("https://gemini.google.com/gem-labs/1wffdEjbZ3E9wChM3O5VcoziuDnKihjDk", "_blank", "noopener,noreferrer");
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                window.open("https://gemini.google.com/gem-labs/1wffdEjbZ3E9wChM3O5VcoziuDnKihjDk", "_blank", "noopener,noreferrer");
                            }
                        }}
                        className="flex items-center justify-between py-2.5 px-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl hover:bg-yellow-100 hover:border-yellow-300 transition-all group w-full relative overflow-hidden"
                        aria-label="Recipe Genie로 냉장고 재료 확인하고 레시피 추천받기 (새 탭에서 열림)"
                        role="button"
                        tabIndex={0}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full group-hover:bg-yellow-200 transition-colors">
                                <Sparkles className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div className="flex-1 text-left">
                                <h3 className="font-bold text-yellow-900 text-sm">Google Recipe Genie</h3>
                                <p className="text-xs text-yellow-700">냉장고 재료 확인하고 레시피 추천</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-yellow-400 group-hover:text-yellow-600 transition-colors" />
                    </button>
                </MotionWrapper>
            </MotionWrapper>
        </div>
    );
}
