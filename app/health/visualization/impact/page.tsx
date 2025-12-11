/**
 * @file app/health/visualization/impact/page.tsx
 * @description 식단 효과 예측 상세보기 페이지
 */

import { Metadata } from 'next';
import { DietImpactDetail } from '@/components/health/visualization/detail/diet-impact-detail';

export const metadata: Metadata = {
  title: '식단 효과 예측 상세보기 | 건강 시각화',
  description: '목표 달성률, 개선 포인트, 식단 효과 시뮬레이션',
};

export default function DietImpactDetailPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <DietImpactDetail />
      </div>
    </div>
  );
}

