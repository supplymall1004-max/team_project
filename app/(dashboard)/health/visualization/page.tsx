/**
 * @file app/(dashboard)/health/visualization/page.tsx
 * @description 통합 건강 시각화 대시보드 페이지
 *
 * 모든 건강 시각화 자료를 통합하여 표시하는 페이지입니다.
 * - 요약 카드 (건강점수, BMI, 활동량, 수면)
 * - 주요 건강 지표
 * - 생활 패턴 (활동량, 수면)
 * - 건강 모니터링 (혈압/혈당, 체중 추이)
 * - 건강 트렌드
 * - 건강 인사이트
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { IntegratedHealthDashboard } from '@/components/health/visualization/IntegratedHealthDashboard';
import { LoadingSpinner } from '@/components/loading-spinner';

export const metadata: Metadata = {
  title: '건강 시각화 대시보드 | 건강 관리',
  description: '종합 건강 상태를 한눈에 확인하고 관리하세요',
};

export const dynamic = 'force-dynamic';

export default function HealthVisualizationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Suspense fallback={<LoadingSpinner />}>
          <IntegratedHealthDashboard />
        </Suspense>
      </div>
    </div>
  );
}
