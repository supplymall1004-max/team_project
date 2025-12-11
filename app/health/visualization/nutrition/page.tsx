/**
 * @file app/health/visualization/nutrition/page.tsx
 * @description 영양 균형 상세보기 페이지
 */

import { Metadata } from 'next';
import { NutritionBalanceDetail } from '@/components/health/visualization/detail/nutrition-balance-detail';

export const metadata: Metadata = {
  title: '영양 균형 상세보기 | 건강 시각화',
  description: '탄수화물, 단백질, 지방 비율 및 미세 영양소 상세 분석',
};

export default function NutritionBalanceDetailPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <NutritionBalanceDetail />
      </div>
    </div>
  );
}

