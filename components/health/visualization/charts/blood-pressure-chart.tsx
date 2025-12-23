/**
 * @file blood-pressure-chart.tsx
 * @description 혈압 차트 컴포넌트
 *
 * 수축기/이완기 혈압과 혈당을 시각화합니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { VitalSigns } from '@/types/health-visualization';
import { Heart } from 'lucide-react';

interface BloodPressureChartProps {
  vitalSigns: VitalSigns[];
  className?: string;
}

export function BloodPressureChart({ vitalSigns, className }: BloodPressureChartProps) {
  const [isClient, setIsClient] = useState(false);
  const [Recharts, setRecharts] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    import('recharts').then((mod) => {
      setRecharts(mod);
    });
  }, []);

  if (!isClient || !Recharts) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            혈압/혈당
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">차트를 준비하는 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart } = Recharts;

  // 최근 10개 데이터만 사용
  const chartData = vitalSigns
    .slice(0, 10)
    .map((vital) => ({
      date: new Date(vital.measured_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      systolic: vital.systolic_bp,
      diastolic: vital.diastolic_bp,
      fastingGlucose: vital.fasting_glucose,
      postprandialGlucose: vital.postprandial_glucose,
      heartRate: vital.heart_rate,
    }))
    .filter(d => d.systolic || d.diastolic || d.fastingGlucose || d.postprandialGlucose);

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            혈압/혈당
          </CardTitle>
          <CardDescription>혈압/혈당 기록이 없습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            혈압/혈당 기록을 추가하면 차트를 확인할 수 있습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  // 혈압 차트 (수축기/이완기)
  const hasBloodPressure = chartData.some(d => d.systolic && d.diastolic);
  // 혈당 차트 (공복/식후)
  const hasGlucose = chartData.some(d => d.fastingGlucose || d.postprandialGlucose);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          혈압/혈당
        </CardTitle>
        <CardDescription>최근 측정 기록</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 혈압 차트 */}
          {hasBloodPressure && (
            <div>
              <h4 className="text-sm font-medium mb-4">혈압 (mmHg)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="systolicGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="diastolicGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[60, 180]} label={{ value: 'mmHg', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={120} stroke="#ef4444" strokeDasharray="3 3" label="정상 상한" />
                  <ReferenceLine y={80} stroke="#3b82f6" strokeDasharray="3 3" label="정상 상한" />
                  <Area 
                    type="monotone" 
                    dataKey="systolic" 
                    stroke="#ef4444" 
                    fill="url(#systolicGradient)"
                    name="수축기 혈압"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="diastolic" 
                    stroke="#3b82f6" 
                    fill="url(#diastolicGradient)"
                    name="이완기 혈압"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 혈당 차트 */}
          {hasGlucose && (
            <div>
              <h4 className="text-sm font-medium mb-4">혈당 (mg/dL)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[70, 200]} label={{ value: 'mg/dL', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" label="정상 상한" />
                  <Line 
                    type="monotone" 
                    dataKey="fastingGlucose" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="공복 혈당"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="postprandialGlucose" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    name="식후 혈당"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 심박수 차트 (있는 경우만) */}
          {chartData.some(d => d.heartRate) && (
            <div>
              <h4 className="text-sm font-medium mb-4">심박수 (bpm)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[50, 120]} label={{ value: 'bpm', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="heartRate" 
                    stroke="#ec4899" 
                    strokeWidth={2}
                    name="심박수"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
