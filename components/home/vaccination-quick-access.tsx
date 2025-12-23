/**
 * @file vaccination-quick-access.tsx
 * @description 예방접종 안내 빠른 접근 컴포넌트
 *
 * 메인 화면에서 예방접종 정보에 빠르게 접근할 수 있는 카드 섹션입니다.
 * 응급조치안내와 동일한 형식으로 하늘색 계통 색상을 사용합니다.
 */

'use client';

import Link from 'next/link';
import { Syringe, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerItem } from '@/lib/animations';

export function VaccinationQuickAccess() {
  return (
    <motion.div
      variants={staggerItem}
      initial="initial"
      animate="animate"
    >
      <Link
        href="/health/vaccinations"
        className="flex items-center justify-between py-2.5 px-4 bg-sky-50 border-2 border-sky-200 rounded-xl hover:bg-sky-100 hover:border-sky-300 transition-all group"
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
    </motion.div>
  );
}

