/**
 * @file today-header.tsx
 * @description 맞춤 인사말 헤더 - 시간대별 인사, 연속 방문 일수 표시
 * 
 * 주요 기능:
 * 1. 시간대별 인사말 (아침/오후/저녁)
 * 2. 연속 방문 일수 (스트릭) 표시
 * 3. 오늘 날짜 표시
 * 4. 애니메이션 효과
 */

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Flame, Calendar, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";

interface UserStats {
  name: string;
  streakCount: number;
  totalVisits: number;
}

export function TodayHeader() {
  const { isSignedIn } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [greeting, setGreeting] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 시간대별 인사말
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("좋은 아침입니다");
    else if (hour < 18) setGreeting("좋은 오후입니다");
    else setGreeting("좋은 저녁입니다");

    // 로그인 상태일 때만 사용자 통계 조회
    if (isSignedIn) {
      fetchUserStats();
    } else {
      setLoading(false);
    }
  }, [isSignedIn]);

  const fetchUserStats = async () => {
    try {
      const response = await fetch("/api/user/stats");
      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error("사용자 통계 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 오늘 날짜 포맷
  const todayFormatted = new Date().toLocaleDateString('ko-KR', { 
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white border-0 shadow-lg overflow-hidden relative">
        {/* 배경 패턴 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }} />
        </div>

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
                  {greeting}
                  {!loading && (
                    <span className="inline-block animate-wave">👋</span>
                  )}
                </h2>
                {isSignedIn && userStats && (
                  <p className="text-lg opacity-90">
                    {userStats.name}님, 오늘도 건강한 하루 되세요!
                  </p>
                )}
                {!isSignedIn && (
                  <p className="text-lg opacity-90">
                    오늘도 건강한 하루 되세요!
                  </p>
                )}
              </motion.div>

              {/* 날짜 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-4 flex items-center gap-2 text-sm opacity-90"
              >
                <Calendar className="w-4 h-4" />
                <span>{todayFormatted}</span>
              </motion.div>
            </div>

            {/* 연속 방문 일수 (로그인 시) */}
            {isSignedIn && userStats && userStats.streakCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="text-center bg-white/20 backdrop-blur-sm rounded-2xl p-4 min-w-[100px] shadow-lg"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Flame className="w-6 h-6 text-orange-300 animate-pulse" />
                  <span className="text-3xl font-bold">{userStats.streakCount}</span>
                </div>
                <p className="text-xs opacity-90 font-medium">연속 방문</p>
                {userStats.streakCount >= 7 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-2"
                  >
                    <Sparkles className="w-4 h-4 mx-auto text-yellow-300" />
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </Card>

      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          10%, 30% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
        }

        .animate-wave {
          animation: wave 2s ease-in-out infinite;
          transform-origin: 70% 70%;
          display: inline-block;
        }
      `}</style>
    </motion.div>
  );
}

