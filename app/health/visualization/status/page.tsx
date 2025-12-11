/**
 * @file app/health/visualization/status/page.tsx
 * @description 현재 건강 상태 상세보기 페이지
 * 
 * 주요 기능:
 * 1. 건강 점수 상세 분석 및 구성 요소별 기여도
 * 2. 신체 지표 상세 (BMI, 체지방률, 근육량, 기초대사율)
 * 3. 질병 위험도 분석 (5가지 질병)
 * 4. 일일 활동량 분석
 * 5. 건강 트렌드 그래프
 * 6. 개선 권장사항
 */

import { Metadata } from 'next';
import { HealthStatusDetail } from '@/components/health/visualization/detail/health-status-detail';

export const metadata: Metadata = {
  title: '현재 건강 상태 상세보기 | 건강 시각화',
  description: '건강 점수, BMI, 체지방률, 질병 위험도 등 상세 건강 상태를 확인하세요',
};

export default function HealthStatusDetailPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <HealthStatusDetail />
      </div>
    </div>
  );
}

