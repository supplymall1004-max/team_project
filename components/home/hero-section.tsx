/**
 * @file hero-section.tsx
 * @description 히어로 섹션 컴포넌트 (배경 이미지/비디오 포함)
 *
 * 주요 기능:
 * 1. 슬로건 표시
 * 2. 메인 검색창 (통합 검색)
 * 3. 빠른 접근 버튼 4개
 * 4. 배경 이미지/비디오 처리
 * 5. 모바일 반응형 레이아웃
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, springTransition } from "@/lib/animations";

export interface QuickStartCard {
  title: string;
  description: string;
  href: string;
  /**
   * public 경로 기반 아이콘 이미지
   * 예: "/icons/26.png"
   */
  iconSrc: string;
  color: string;
  gradient?: string; // 그라데이션 클래스 (선택적)
}

interface HeroSectionProps {
  backgroundImageUrl?: string | null;
  badgeText?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  searchPlaceholder?: string;
  searchButtonText?: string;
  quickStartCards?: QuickStartCard[];
}

export function HeroSection({
  backgroundImageUrl = null,
  badgeText = "Flavor Archive Beta",
  title = "잊혀진 손맛을 연결하는\n디지털 식탁",
  subtitle,
  description = "궁중 레시피부터 건강 맞춤 식단까지, 세대와 세대를 넘나드는 요리 지식을 한 곳에서 경험하세요.",
  searchPlaceholder = "레시피를 검색해보세요",
  searchButtonText = "검색",
  quickStartCards = [
    {
      title: "레시피",
      description: "최신 레시피 모음",
      href: "/recipes",
      iconSrc: "/icons/26.png",
      color: "bg-blue-500",
      gradient: "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700",
    },
    {
      title: "궁중요리",
      description: "전통 궁중 레시피",
      href: "/royal-recipes",
      iconSrc: "/icons/21.png",
      color: "bg-amber-500",
      gradient: "bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500",
    },
    {
      title: "식단관리",
      description: "맞춤 식단 추천",
      href: "/diet",
      iconSrc: "/icons/22.png",
      color: "bg-green-500",
      gradient: "bg-gradient-to-br from-green-400 via-emerald-500 to-green-600",
    },
    {
      title: "주간식단",
      description: "7일 식단 계획",
      href: "/diet/weekly",
      iconSrc: "/icons/3.png",
      color: "bg-purple-500",
      gradient: "bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600",
    },
    {
      title: "검색",
      description: "레시피 검색",
      href: "/search",
      iconSrc: "/icons/14.png",
      color: "bg-gray-500",
      gradient: "bg-gradient-to-br from-slate-500 via-gray-600 to-slate-700",
    },
    {
      title: "건강관리",
      description: "건강 정보 확인",
      href: "/health",
      iconSrc: "/icons/11.png",
      color: "bg-red-500",
      gradient: "bg-gradient-to-br from-pink-500 via-rose-500 to-red-500",
    },
    {
      title: "식재료",
      description: "신선한 채소 정보",
      href: "/food",
      iconSrc: "/icons/25.png",
      color: "bg-emerald-500",
      gradient: "bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600",
    },
    {
      title: "음식안전",
      description: "안전한 식생활",
      href: "/foodsafety",
      iconSrc: "/icons/12.png",
      color: "bg-orange-500",
      gradient: "bg-gradient-to-br from-orange-400 via-orange-500 to-red-500",
    },
    {
      title: "요리이야기",
      description: "맛있는 이야기들",
      href: "/stories",
      iconSrc: "/icons/14.png",
      color: "bg-indigo-500",
      gradient: "bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700",
    },
  ],
}: HeroSectionProps = {}) {
  const handleQuickStartClick = (href: string) => {
    console.groupCollapsed("[HeroSection] 빠른 카드 클릭");
    console.log("target:", href);
    console.groupEnd();
  };

  // 타이틀을 줄바꿈 기준으로 분리
  const titleLines = title.split("\n");

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* 배경 이미지/비디오 - GDWEB 스타일 그라데이션 */}
      <div className="absolute inset-0 z-0">
        {/* GDWEB 스타일 그라데이션 배경 */}
        <div 
          className="absolute inset-0 gdweb-gradient-hero"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          }}
        />
        {/* 패턴 오버레이 */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)
            `,
            backgroundSize: '100px 100px',
          }}
        />
        {/* 배경 이미지 (기본 이미지 또는 그라데이션) */}
        {backgroundImageUrl && (
          <div className="absolute inset-0 opacity-15">
            <Image
              src={backgroundImageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              priority
              unoptimized
              onError={(e) => {
                // 이미지 로딩 실패 시 숨김 (그라데이션만 표시)
                console.error("[HeroSection] 배경 이미지 로딩 실패:", backgroundImageUrl);
                e.currentTarget.style.display = "none";
              }}
              onLoad={() => {
                console.log("[HeroSection] 배경 이미지 로딩 완료:", backgroundImageUrl);
              }}
            />
          </div>
        )}
        {/* 오버레이 - 더 부드러운 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/20" />
      </div>

      {/* 콘텐츠 - 모바일 앱 아이콘 그리드 */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12 sm:px-6 sm:py-20">
        {/* 타이틀 섹션 - GDWEB 스타일 */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 100,
            damping: 20,
            delay: 0.2,
          }}
        >
          {/* 베타 배지 */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 150,
              damping: 25,
              mass: 1.2,
              delay: 0.4,
            }}
          >
            <div className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white border border-white/30 shadow-lg">
              {badgeText}
            </div>
          </motion.div>

          {/* 메인 타이틀 */}
          {title && (
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {titleLines.map((line, index) => (
                <span key={index} className="block">
                  {line}
                </span>
              ))}
            </motion.h1>
          )}

          {/* 서브타이틀 */}
          {subtitle && (
            <motion.p
              className="text-xl sm:text-2xl text-white/90 mb-4 font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {subtitle}
            </motion.p>
          )}

          {/* 설명 */}
          {description && (
            <motion.p
              className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              {description}
            </motion.p>
          )}
        </motion.div>

        {/* 앱 아이콘 그리드 - GDWEB 카드 스타일 (카드 크기 통일) */}
        <motion.div
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-6 max-w-4xl mx-auto items-stretch"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {quickStartCards.map((card, index) => {
            // 각 카드가 다른 방향에서 진입하도록 설정
            const directions: Array<'up' | 'down' | 'left' | 'right' | 'center'> = 
              ['up', 'down', 'left', 'right', 'center', 'up', 'down', 'left', 'right'];
            const direction = directions[index % directions.length];
            
            // 방향별 초기 위치 설정
            const getInitialPosition = () => {
              switch (direction) {
                case 'up':
                  return { y: 100, x: 0, scale: 0.8 };
                case 'down':
                  return { y: -100, x: 0, scale: 0.8 };
                case 'left':
                  return { y: 0, x: 100, scale: 0.8 };
                case 'right':
                  return { y: 0, x: -100, scale: 0.8 };
                case 'center':
                  return { y: 0, x: 0, scale: 0.5 };
                default:
                  return { y: 50, x: 0, scale: 0.8 };
              }
            };

            const initialPos = getInitialPosition();

            return (
              <motion.div
                key={card.title}
                initial={{ 
                  opacity: 0, 
                  ...initialPos 
                }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  x: 0, 
                  scale: 1 
                }}
                transition={{
                  type: "spring",
                  stiffness: 150,
                  damping: 25,
                  mass: 1.2,
                  delay: index * 0.08 + 1.2,
                  duration: 1.0,
                }}
                whileHover={{ 
                  scale: 1.1, 
                  y: -8,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={card.href}
                  onClick={() => handleQuickStartClick(card.href)}
                  className="group flex flex-col items-center justify-between h-full min-h-[140px] sm:min-h-[160px] p-4 sm:p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-2xl transition-all gdweb-card"
                  style={{
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  }}
                >
                  {/* 아이콘 영역 - 고정 크기 */}
                  <motion.div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-xl group-hover:shadow-2xl transition-all relative flex-shrink-0"
                    style={{
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    {card.gradient ? (
                      <div className={`absolute inset-0 ${card.gradient} opacity-90`} />
                    ) : (
                      <div className={`absolute inset-0 ${card.color} opacity-90`} />
                    )}
                    <Image
                      src={card.iconSrc}
                      alt={card.title}
                      fill
                      className="object-cover relative z-10"
                      sizes="80px"
                      priority={index < 6}
                    />
                  </motion.div>

                  {/* 텍스트 영역 - 고정 높이 */}
                  <div className="text-center w-full flex-1 flex flex-col justify-center min-h-[48px] sm:min-h-[52px]">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors mb-1">
                      {card.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-600 leading-tight line-clamp-2">
                      {card.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

