/**
 * @file components/health/lifecycle-notification-stats.tsx
 * @description 생애주기별 알림 완료율 통계 컴포넌트
 * 
 * 주간/월간 완료율 차트, 가족 구성원별 비교, 우선순위별 통계를 표시합니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationStats {
  period: string;
  summary: {
    total: number;
    completed: number;
    pending: number;
    dismissed: number;
    completionRate: number;
  };
  byPriority: {
    high: { total: number; completed: number };
    medium: { total: number; completed: number };
    low: { total: number; completed: number };
  };
  dailyStats: Array<{
    date: string;
    total: number;
    completed: number;
    rate: number;
  }>;
}

interface LifecycleNotificationStatsProps {
  familyMemberId?: string;
  className?: string;
}

export function LifecycleNotificationStats({
  familyMemberId,
  className,
}: LifecycleNotificationStatsProps) {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [period, familyMemberId]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append('period', period);
      if (familyMemberId) {
        params.append('family_member_id', familyMemberId);
      }

      const response = await fetch(`/api/health/lifecycle-notifications/stats?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('통계를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('통계 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">통계를 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  const { summary, byPriority, dailyStats } = stats;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              알림 완료율 통계
            </CardTitle>
            <CardDescription>
              {period === 'week' ? '최근 7일' : '최근 30일'} 알림 완료율
            </CardDescription>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month')}>
            <TabsList>
              <TabsTrigger value="week">주간</TabsTrigger>
              <TabsTrigger value="month">월간</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 전체 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="text-2xl font-bold text-green-600">{summary.completionRate}%</div>
            <div className="text-sm text-muted-foreground">완료율</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{summary.completed}</div>
            <div className="text-sm text-muted-foreground">완료</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
            <div className="text-sm text-muted-foreground">대기 중</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-gray-50 border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">{summary.total}</div>
            <div className="text-sm text-muted-foreground">전체</div>
          </div>
        </div>

        {/* 우선순위별 통계 */}
        <div>
          <h3 className="text-lg font-semibold mb-3">우선순위별 완료율</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">High</Badge>
                  <span className="text-sm text-muted-foreground">
                    {byPriority.high.completed} / {byPriority.high.total}
                  </span>
                </div>
                <span className="text-sm font-semibold">
                  {byPriority.high.total > 0
                    ? Math.round((byPriority.high.completed / byPriority.high.total) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${byPriority.high.total > 0 ? (byPriority.high.completed / byPriority.high.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                    Medium
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {byPriority.medium.completed} / {byPriority.medium.total}
                  </span>
                </div>
                <span className="text-sm font-semibold">
                  {byPriority.medium.total > 0
                    ? Math.round((byPriority.medium.completed / byPriority.medium.total) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${byPriority.medium.total > 0 ? (byPriority.medium.completed / byPriority.medium.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-blue-500 text-blue-600">
                    Low
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {byPriority.low.completed} / {byPriority.low.total}
                  </span>
                </div>
                <span className="text-sm font-semibold">
                  {byPriority.low.total > 0
                    ? Math.round((byPriority.low.completed / byPriority.low.total) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${byPriority.low.total > 0 ? (byPriority.low.completed / byPriority.low.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 일별 완료율 차트 (간단한 바 차트) */}
        <div>
          <h3 className="text-lg font-semibold mb-3">일별 완료율</h3>
          <div className="flex items-end gap-2 h-32">
            {dailyStats.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end h-24">
                  <div
                    className={cn(
                      "w-full rounded-t transition-all",
                      day.rate >= 80 ? "bg-green-500" : day.rate >= 50 ? "bg-yellow-500" : "bg-red-500"
                    )}
                    style={{ height: `${day.rate}%` }}
                    title={`${day.date}: ${day.rate}%`}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {new Date(day.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

