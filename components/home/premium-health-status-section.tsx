/**
 * @file premium-health-status-section.tsx
 * @description 건강 상태 섹션 (상단 선반)
 *
 * 건강 점수, 복용 중인 약물 수, 다가오는 예방접종 수, 최근 건강검진 날짜를 표시합니다.
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Pill, Syringe, Stethoscope } from "lucide-react";
import Link from "next/link";
import { getPremiumDrawerData } from "@/actions/health/premium-drawer";
import type { HealthStatusSummary } from "@/types/premium-drawer";

export function PremiumHealthStatusSection() {
  const [data, setData] = useState<HealthStatusSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      console.log("📊 [PremiumHealthStatusSection] 데이터 로드 시작");
      try {
        const result = await getPremiumDrawerData();
        console.log("✅ [PremiumHealthStatusSection] 데이터 로드 완료:", result.healthStatus);
        setData(result.healthStatus);
      } catch (error) {
        console.error("❌ [PremiumHealthStatusSection] 건강 상태 데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-20 bg-gray-200/80 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-gray-500 py-4 text-sm">
        데이터를 불러올 수 없습니다.
      </div>
    );
  }

  // 건강 점수 색상 결정
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getHealthStatusText = (score: number) => {
    if (score >= 80) return "좋음";
    if (score >= 60) return "보통";
    return "주의";
  };

  const healthScoreColor = getHealthScoreColor(data.healthScore);
  const healthStatusText = getHealthStatusText(data.healthScore);

  // 원형 프로그레스 계산
  const circumference = 2 * Math.PI * 40; // 반지름 40
  const offset = circumference - (data.healthScore / 100) * circumference;

  return (
    <div className="flex flex-col gap-2">
      {/* 건강 점수 */}
      <div className="flex items-center justify-between bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${healthScoreColor.split(" ")[1]} flex items-center justify-center`}>
            <span className={`text-sm font-bold ${healthScoreColor.split(" ")[0]}`}>
              {data.healthScore}
            </span>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-700">건강 점수</div>
            <div className={`text-xs ${healthScoreColor.split(" ")[0]}`}>{healthStatusText}</div>
          </div>
        </div>
        {data.bmi && (
          <div className="text-xs text-gray-500">BMI {data.bmi}</div>
        )}
      </div>

      {/* 복용 중인 약물 */}
      <Link
        href="/health/medications"
        className="flex items-center justify-between bg-blue-50/80 border border-blue-200 rounded-lg p-2 hover:bg-blue-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Pill className="w-4 h-4 text-blue-600" />
          <span className="text-xs text-gray-700">복용 중인 약물</span>
        </div>
        <span className="text-xs font-bold text-blue-600">{data.activeMedications}개</span>
      </Link>

      {/* 다가오는 예방접종 */}
      <Link
        href="/health/vaccinations"
        className="flex items-center justify-between bg-yellow-50/80 border border-yellow-200 rounded-lg p-2 hover:bg-yellow-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Syringe className="w-4 h-4 text-yellow-600" />
          <span className="text-xs text-gray-700">다가오는 접종</span>
        </div>
        <span className="text-xs font-bold text-yellow-600">{data.upcomingVaccinations}개</span>
      </Link>

      {/* 최근 건강검진 */}
      {data.lastCheckupDate && (
        <Link
          href="/health/dashboard"
          className="flex items-center justify-between bg-purple-50/80 border border-purple-200 rounded-lg p-2 hover:bg-purple-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-gray-700">최근 건강검진</span>
          </div>
          <span className="text-xs text-gray-600">
            {new Date(data.lastCheckupDate).toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </Link>
      )}
    </div>
  );
}

