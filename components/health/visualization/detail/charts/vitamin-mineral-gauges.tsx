/**
 * @file vitamin-mineral-gauges.tsx
 * @description 비타민/미네랄 게이지 차트 컴포넌트
 */

'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { VitaminLevels, MineralLevels } from '@/types/health-visualization';

interface VitaminMineralGaugesProps {
  type: 'vitamin' | 'mineral';
  levels: VitaminLevels | MineralLevels;
}

const vitaminLabels: Record<keyof VitaminLevels, string> = {
  vitaminA: '비타민 A',
  vitaminB: '비타민 B',
  vitaminC: '비타민 C',
  vitaminD: '비타민 D',
  vitaminE: '비타민 E',
};

const mineralLabels: Record<keyof MineralLevels, string> = {
  calcium: '칼슘',
  iron: '철',
  magnesium: '마그네슘',
  potassium: '칼륨',
  zinc: '아연',
};

export function VitaminMineralGauges({ type, levels }: VitaminMineralGaugesProps) {
  const labels = type === 'vitamin' ? vitaminLabels : mineralLabels;
  const items = Object.entries(levels) as Array<[string, number]>;

  const getStatus = (value: number) => {
    if (value >= 80) return { label: '충분', color: 'bg-green-500', badge: 'bg-green-100 text-green-800' };
    if (value >= 50) return { label: '보통', color: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800' };
    if (value >= 30) return { label: '부족', color: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800' };
    return { label: '심각', color: 'bg-red-500', badge: 'bg-red-100 text-red-800' };
  };

  return (
    <div className="space-y-4">
      {items.map(([key, value]) => {
        const status = getStatus(value);
        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                {labels[key as keyof typeof labels]}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">{value.toFixed(0)}</span>
                <span className="text-xs text-muted-foreground">%</span>
                <Badge className={status.badge} variant="outline">
                  {status.label}
                </Badge>
              </div>
            </div>
            <Progress value={value} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

