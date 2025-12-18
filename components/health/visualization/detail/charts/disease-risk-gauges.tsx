/**
 * @file disease-risk-gauges.tsx
 * @description 질병 위험도 게이지 차트 컴포넌트
 */

'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Heart, Droplet, Activity, TrendingUp } from 'lucide-react';
import type { DiseaseRiskScores } from '@/types/health-visualization';

interface DiseaseRiskGaugesProps {
  diseaseRiskScores: DiseaseRiskScores;
}

const diseaseInfo = {
  cardiovascular: {
    name: '심혈관 질환',
    icon: Heart,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  diabetes: {
    name: '당뇨',
    icon: Droplet,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  kidney: {
    name: '신장 질환',
    icon: Activity,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  obesity: {
    name: '비만',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  hypertension: {
    name: '고혈압',
    icon: AlertTriangle,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
  },
};

export function DiseaseRiskGauges({ diseaseRiskScores }: DiseaseRiskGaugesProps) {
  const getRiskLevel = (risk: number) => {
    if (risk < 20) return { label: '낮음', color: 'bg-green-500', badge: 'bg-green-100 text-green-800' };
    if (risk < 40) return { label: '보통', color: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800' };
    if (risk < 60) return { label: '높음', color: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800' };
    return { label: '매우 높음', color: 'bg-red-500', badge: 'bg-red-100 text-red-800' };
  };

  // diseaseRiskScores가 없거나 객체가 아니면 빈 배열 반환
  if (!diseaseRiskScores || typeof diseaseRiskScores !== 'object') {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(diseaseRiskScores || {}).map(([key, risk]) => {
        const info = diseaseInfo[key as keyof typeof diseaseInfo];
        const riskLevel = getRiskLevel(risk);
        const Icon = info.icon;

        return (
          <div
            key={key}
            className={`p-4 rounded-lg border ${info.borderColor} ${info.bgColor}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`h-5 w-5 ${info.color}`} />
              <h4 className="font-semibold text-gray-900">{info.name}</h4>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">위험도</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">{risk.toFixed(0)}</span>
                  <Badge className={riskLevel.badge} variant="outline">
                    {riskLevel.label}
                  </Badge>
                </div>
              </div>
              
              <Progress value={risk} className="h-3" />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>안전</span>
                <span>위험</span>
              </div>
            </div>

            {risk >= 40 && (
              <div className="mt-3 p-2 bg-white/50 rounded text-xs text-gray-700">
                <strong>주의:</strong> 정기적인 건강검진을 받으시기 바랍니다.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

