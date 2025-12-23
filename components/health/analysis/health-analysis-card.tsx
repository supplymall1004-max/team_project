/**
 * @file health-analysis-card.tsx
 * @description 건강 데이터 분석 결과 표시 컴포넌트
 *
 * 블루투스에서 받아온 데이터를 분석하여 건강 상태, 정상 범위, 권장사항을 시각적으로 표시합니다.
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  XCircle,
  Info
} from 'lucide-react';
import type { HealthAnalysisResult } from '@/lib/health/analysis/health-data-analyzer';

interface HealthAnalysisCardProps {
  analysis: HealthAnalysisResult;
  title: string;
  unit?: string;
  className?: string;
}

const STATUS_CONFIG = {
  normal: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    badgeVariant: 'default' as const,
    badgeColor: 'bg-green-600',
  },
  attention: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badgeVariant: 'secondary' as const,
    badgeColor: 'bg-blue-600',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    badgeVariant: 'outline' as const,
    badgeColor: 'bg-yellow-600',
  },
  danger: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    badgeVariant: 'destructive' as const,
    badgeColor: 'bg-red-600',
  },
};

export function HealthAnalysisCard({ 
  analysis, 
  title, 
  unit = '',
  className 
}: HealthAnalysisCardProps) {
  const config = STATUS_CONFIG[analysis.status];
  const StatusIcon = config.icon;

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-2 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${config.color}`} />
            {title}
          </CardTitle>
          <Badge 
            variant={config.badgeVariant}
            className={config.badgeColor}
          >
            {analysis.statusLabel}
          </Badge>
        </div>
        <CardDescription>
          측정값: <strong>{analysis.value}{unit}</strong> (정상 범위: {analysis.normalRange})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 건강 상태 설명 */}
        <Alert className={config.bgColor}>
          <StatusIcon className={`h-4 w-4 ${config.color}`} />
          <AlertDescription className="text-sm">
            {analysis.description}
          </AlertDescription>
        </Alert>

        {/* 권장사항 */}
        {analysis.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4" />
              권장사항
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {analysis.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 정상 범위 정보 */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>참고:</strong> 이 분석은 일반적인 기준을 바탕으로 합니다. 
            개인차가 있을 수 있으므로 지속적인 이상 증상이 있으면 의사와 상담하시기 바랍니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
