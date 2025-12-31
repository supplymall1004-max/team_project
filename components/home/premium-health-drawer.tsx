/**
 * @file premium-health-drawer.tsx
 * @description 프리미엄 건강 드로어 (현대적인 디자인)
 *
 * 프리미엄 상태 배너의 햄버거 버튼 클릭 시 표시되는 사이드 드로어입니다.
 * 현대적인 그라데이션 배경과 세련된 카드 디자인으로 건강 정보를 표시합니다.
 *
 * 주요 기능:
 * 1. 오른쪽에서 슬라이드되는 드로어 패널
 * 2. 현대적인 그라데이션 배경
 * 3. 섹션별 색상 구분 카드
 * 4. 건강 상태, 알림, 일정, 가족 소통 통합 표시
 * 5. 부드러운 애니메이션 효과
 */

"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Bell, Calendar, Users, Megaphone } from "lucide-react";
import { PremiumHealthStatusSection } from "./premium-health-status-section";
import { PremiumHealthNotifications } from "./premium-health-notifications";
import { PremiumHealthSchedule } from "./premium-health-schedule";
import { PremiumFamilyCommunication } from "./premium-family-communication";
import { PremiumSystemAnnouncements } from "./premium-system-announcements";

interface PremiumHealthDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PremiumHealthDrawer({
  isOpen,
  onClose,
}: PremiumHealthDrawerProps) {
  // 섹션별 아이콘과 색상 정의 (시스템 공지를 맨 위로)
  const sections = [
    {
      id: "announcements",
      title: "시스템 공지",
      icon: Megaphone,
      gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
      borderColor: "border-violet-300",
      textColor: "text-violet-700",
    },
    {
      id: "health",
      title: "건강 상태",
      icon: Heart,
      gradient: "from-pink-500 via-rose-500 to-red-500",
      borderColor: "border-pink-300",
      textColor: "text-pink-700",
    },
    {
      id: "notifications",
      title: "중요 알림",
      icon: Bell,
      gradient: "from-amber-500 via-orange-500 to-red-500",
      borderColor: "border-amber-300",
      textColor: "text-amber-700",
    },
    {
      id: "schedule",
      title: "일정",
      icon: Calendar,
      gradient: "from-blue-500 via-indigo-500 to-purple-500",
      borderColor: "border-blue-300",
      textColor: "text-blue-700",
    },
    {
      id: "family",
      title: "가족 소통",
      icon: Users,
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      borderColor: "border-emerald-300",
      textColor: "text-emerald-700",
    },
  ];

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // 드로어가 열릴 때 body 스크롤 방지
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-[99]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* 건강 드로어 */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.4,
            }}
            className="fixed right-0 top-0 bottom-0 w-[90vw] sm:w-[450px] z-[100] flex flex-col overflow-hidden relative"
            style={{
              boxShadow: "-4px 0 20px rgba(0, 0, 0, 0.2)",
            }}
          >
            {/* 배경 그라데이션 제거 - 단색 배경으로 변경 */}
            <div className="absolute inset-0 z-0 bg-white dark:bg-black pointer-events-none" />

            {/* 헤더 */}
            <div className="relative flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-white/20 px-4 py-4 flex items-center justify-between z-20">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
                  style={{
                    boxShadow: '0 0 10px rgba(147, 51, 234, 0.6), 0 0 20px rgba(236, 72, 153, 0.4)',
                  }}
                >
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 
                    className="text-lg font-bold inline-block px-3 py-1 rounded-lg border-2"
                    style={{
                      background: 'linear-gradient(to right, #9333ea, #ec4899)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      animation: 'neon-border-glow 2s ease-in-out infinite',
                      borderColor: 'rgba(147, 51, 234, 0.8)',
                    }}
                  >
                    건강 냉장고
                  </h2>
                  <p className="text-xs text-gray-500">가족 건강 정보</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/80 hover:bg-white transition-all hover:scale-110 active:scale-95 shadow-md backdrop-blur-sm"
                aria-label="닫기"
                title="닫기"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* 스크롤 가능한 콘텐츠 영역 - 네온 효과 추가 */}
            <div 
              className="overflow-y-auto relative flex-1 z-20"
            >
              <div 
                className="relative px-4 py-6 space-y-4 min-h-full"
                style={{
                  boxShadow: 'inset 0 0 30px rgba(147, 51, 234, 0.1)',
                }}
              >
                {/* 섹션별 카드 */}
                {sections.map((section, index) => {
                  const IconComponent = section.icon;
                  return (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group"
                    >
                      <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 p-3">
                        {/* 섹션 헤더 */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <IconComponent className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className={`text-xs font-bold ${section.textColor}`}>
                              {section.title}
                            </h3>
                          </div>
                        </div>

                        {/* 섹션 콘텐츠 */}
                        <div className="relative">
                          {section.id === "health" && <PremiumHealthStatusSection />}
                          {section.id === "notifications" && <PremiumHealthNotifications />}
                          {section.id === "schedule" && <PremiumHealthSchedule />}
                          {section.id === "family" && <PremiumFamilyCommunication />}
                          {section.id === "announcements" && <PremiumSystemAnnouncements />}
                        </div>

                        {/* 호버 시 그라데이션 오버레이 */}
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${section.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* 하단 액션 버튼 - 네온 효과 추가 */}
            <div 
              className="relative flex-shrink-0 bg-white/95 backdrop-blur-md border-t border-white/20 px-4 py-4 z-20"
              style={{
                borderTopColor: 'rgba(147, 51, 234, 0.3)',
              }}
            >
              <motion.button
                onClick={() => {
                  window.location.href = "/health/dashboard";
                  onClose();
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden"
                style={{
                  animation: 'neon-glow-purple 2s ease-in-out infinite',
                  boxShadow: '0 0 20px rgba(147, 51, 234, 0.4), 0 0 40px rgba(236, 72, 153, 0.3), 0 0 60px rgba(249, 115, 22, 0.2)',
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  전체 보기
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

