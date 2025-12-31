/**
 * @file premium-family-communication.tsx
 * @description 가족 소통 섹션 (서랍)
 *
 * 가족 공지사항, 건강 정보 공유, 가족코드 발급 기능을 제공합니다.
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Users, KeyRound } from "lucide-react";
import Link from "next/link";
import { getPremiumDrawerData } from "@/actions/health/premium-drawer";
import type { FamilyAnnouncement, FamilyHealthSummary } from "@/types/premium-drawer";

export function PremiumFamilyCommunication() {
  const [announcements, setAnnouncements] = useState<FamilyAnnouncement[]>([]);
  const [familySummary, setFamilySummary] = useState<FamilyHealthSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getPremiumDrawerData();
        setAnnouncements(result.familyAnnouncements.slice(0, 1)); // 최대 1개
        setFamilySummary(result.familyHealthSummary);
      } catch (error) {
        console.error("❌ 가족 소통 데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-12 bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* 가족코드 발급/연결 */}
      <Link
        href="/settings/family"
        className="flex items-center justify-between bg-emerald-50/80 border border-emerald-200 rounded-lg p-2 hover:bg-emerald-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-emerald-600" />
          <span className="text-xs text-gray-700">가족코드 발급/연결</span>
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      {/* 가족 공지사항 */}
      {announcements.length > 0 && (
        <div className="flex items-center justify-between bg-orange-50/80 border border-orange-200 rounded-lg p-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MessageSquare className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-gray-800 line-clamp-1">
                {announcements[0].title}
              </div>
              {!announcements[0].isRead && (
                <span className="text-xs text-red-600">새 공지</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 가족 건강 정보 */}
      {familySummary && familySummary.familyMembersCount > 0 && (
        <div className="flex items-center justify-between bg-green-50/80 border border-green-200 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs text-gray-700">가족 건강</span>
          </div>
          <div className="text-xs font-bold text-green-600">
            {familySummary.familyAverageScore}점 ({familySummary.familyMembersCount}명)
          </div>
        </div>
      )}

      {announcements.length === 0 && (!familySummary || familySummary.familyMembersCount === 0) && (
        <div className="text-center text-gray-500 py-2 text-xs">
          가족 소통 정보가 없습니다.
        </div>
      )}
    </div>
  );
}

