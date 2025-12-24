/**
 * @file app/(dashboard)/health/family/[memberId]/character/character-page-client.tsx
 * @description 캐릭터창 페이지 클라이언트 컴포넌트
 *
 * framer-motion을 사용하는 클라이언트 컴포넌트입니다.
 * 서버 컴포넌트인 CharacterContent에서 데이터를 받아 애니메이션과 함께 표시합니다.
 */

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Section } from "@/components/section";
import {
  pageEnterVariants,
  panelContainerVariants,
  panelStaggerVariants,
} from "@/lib/animations/character-animations";
import { CharacterAvatar } from "@/components/health/character/character-avatar";
import { BasicInfoPanel } from "@/components/health/character/basic-info-panel";
import { ImportantInfoPanel } from "@/components/health/character/important-info-panel";
import { MedicationPanel } from "@/components/health/character/medication-panel";
import { CheckupPanel } from "@/components/health/character/checkup-panel";
import { VaccinationPanel } from "@/components/health/character/vaccination-panel";
import { DewormingPanel } from "@/components/health/character/deworming-panel";
import { LifecycleNotificationsPanel } from "@/components/health/character/lifecycle-notifications-panel";
import { RemindersPanel } from "@/components/health/character/reminders-panel";
import { HealthTrendsPanel } from "@/components/health/character/health-trends-panel";
import type { CharacterData } from "@/types/character";

interface CharacterPageClientProps {
  characterData: CharacterData;
  memberId: string;
}

/**
 * 캐릭터창 페이지 클라이언트 컴포넌트
 */
export function CharacterPageClient({
  characterData,
  memberId,
}: CharacterPageClientProps) {
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white"
      variants={pageEnterVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Section className="py-8">
        {/* 헤더 */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Link href="/health/dashboard">
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              뒤로가기
            </Button>
          </Link>
        </motion.div>

        {/* 캐릭터 아바타 섹션 */}
        <motion.div
          className="mb-8 flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
        >
          <motion.div
            className="text-center mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <h1 className="text-3xl font-bold text-white mb-2">
              {characterData.member.name}의 캐릭터창
            </h1>
            <p className="text-gray-400">건강 관리 대시보드</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5, type: "spring", stiffness: 200 }}
          >
            <CharacterAvatar
              member={characterData.member}
              healthStatus={characterData.importantInfo.health_status}
              healthScore={characterData.importantInfo.health_score}
              size="xl"
              showBadge={true}
            />
          </motion.div>
        </motion.div>

        {/* 패널 컨테이너 (스태거 애니메이션) */}
        <motion.div
          variants={panelContainerVariants}
          initial="initial"
          animate="animate"
        >
          {/* 기본 정보 패널 */}
          <motion.div className="mb-6" variants={panelStaggerVariants}>
            <BasicInfoPanel data={characterData.basicInfo} />
          </motion.div>

          {/* 중요 정보 패널 */}
          <motion.div className="mb-6" variants={panelStaggerVariants}>
            <ImportantInfoPanel data={characterData.importantInfo} />
          </motion.div>

          {/* 약물 복용 패널 */}
          <motion.div className="mb-6" variants={panelStaggerVariants}>
            <MedicationPanel
              data={characterData.medications}
              memberId={memberId}
            />
          </motion.div>

          {/* 건강검진 패널 */}
          <motion.div className="mb-6" variants={panelStaggerVariants}>
            <CheckupPanel data={characterData.checkups} />
          </motion.div>

          {/* 백신 패널 */}
          <motion.div className="mb-6" variants={panelStaggerVariants}>
            <VaccinationPanel data={characterData.vaccinations} />
          </motion.div>

          {/* 구충제 패널 */}
          <motion.div className="mb-6" variants={panelStaggerVariants}>
            <DewormingPanel data={characterData.deworming} />
          </motion.div>

          {/* 생애주기별 알림 패널 */}
          <motion.div className="mb-6" variants={panelStaggerVariants}>
            <LifecycleNotificationsPanel
              data={characterData.lifecycleNotifications}
            />
          </motion.div>

          {/* 리마인드 및 일정 패널 */}
          <motion.div className="mb-6" variants={panelStaggerVariants}>
            <RemindersPanel data={characterData.reminders} memberId={memberId} />
          </motion.div>

          {/* 건강 트렌드 요약 패널 */}
          <motion.div className="mb-6" variants={panelStaggerVariants}>
            <HealthTrendsPanel data={characterData.healthTrends} />
          </motion.div>
        </motion.div>
      </Section>
    </motion.div>
  );
}

