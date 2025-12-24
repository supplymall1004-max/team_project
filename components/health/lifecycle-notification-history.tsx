/**
 * @file components/health/lifecycle-notification-history.tsx
 * @description 생애주기별 알림 히스토리 컴포넌트
 * 
 * 완료된 알림 조회, 패턴 분석, 건강 관리 추이 시각화를 제공합니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, TrendingUp, TrendingDown, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface NotificationHistory {
  id: string;
  title: string;
  message: string;
  priority: string;
  category: string;
  status: string;
  created_at: string;
  confirmed_at?: string | null;
  context_data?: Record<string, any>;
}

interface PatternAnalysis {
  totalCompleted: number;
  totalDismissed: number;
  totalMissed: number;
  byCategory: Record<string, { total: number; completed: number; dismissed: number; missed: number }>;
  byPriority: Record<string, { total: number; completed: number; dismissed: number; missed: number }>;
}

interface LifecycleNotificationHistoryProps {
  familyMemberId?: string;
  className?: string;
}

export function LifecycleNotificationHistory({
  familyMemberId,
  className,
}: LifecycleNotificationHistoryProps) {
  const [notifications, setNotifications] = useState<NotificationHistory[]>([]);
  const [patternAnalysis, setPatternAnalysis] = useState<PatternAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    fetchHistory();
  }, [familyMemberId, period]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (familyMemberId) {
        params.append('family_member_id', familyMemberId);
      }
      
      // 기간 설정
      if (period === 'week') {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        params.append('start_date', startDate.toISOString());
      } else if (period === 'month') {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        params.append('start_date', startDate.toISOString());
      }

      const response = await fetch(`/api/health/lifecycle-notifications/history?${params.toString()}`);

      if (!response.ok) {
        throw new Error('히스토리를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setPatternAnalysis(data.patternAnalysis || null);
    } catch (error) {
      console.error('히스토리 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">히스토리를 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              알림 히스토리
            </CardTitle>
            <CardDescription>
              완료된 알림과 패턴을 확인하세요
            </CardDescription>
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month' | 'all')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">최근 7일</SelectItem>
              <SelectItem value="month">최근 30일</SelectItem>
              <SelectItem value="all">전체</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 패턴 분석 */}
        {patternAnalysis && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{patternAnalysis.totalCompleted}</div>
              <div className="text-sm text-muted-foreground">완료</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <X className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-bold text-yellow-600">{patternAnalysis.totalDismissed}</div>
              <div className="text-sm text-muted-foreground">해제</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold text-red-600">{patternAnalysis.totalMissed}</div>
              <div className="text-sm text-muted-foreground">누락</div>
            </div>
          </div>
        )}

        {/* 카테고리별 패턴 */}
        {patternAnalysis && Object.keys(patternAnalysis.byCategory).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">카테고리별 패턴</h3>
            <div className="space-y-2">
              {Object.entries(patternAnalysis.byCategory).map(([category, stats]) => {
                const completionRate = stats.total > 0
                  ? Math.round((stats.completed / stats.total) * 100)
                  : 0;
                return (
                  <div key={category} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{category}</span>
                      <span className="text-sm text-muted-foreground">
                        {completionRate}% 완료율
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all",
                          completionRate >= 80 ? "bg-green-500" : completionRate >= 50 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>완료: {stats.completed}</span>
                      <span>해제: {stats.dismissed}</span>
                      <span>누락: {stats.missed}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 알림 목록 */}
        <div>
          <h3 className="text-lg font-semibold mb-3">완료된 알림 목록</h3>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>완료된 알림이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 rounded-lg border bg-card flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{notification.title}</h4>
                      <Badge
                        variant="outline"
                        className={cn(
                          notification.status === "confirmed" && "border-green-500 text-green-600",
                          notification.status === "dismissed" && "border-yellow-500 text-yellow-600",
                          notification.status === "missed" && "border-red-500 text-red-600"
                        )}
                      >
                        {notification.status === "confirmed" ? "완료" : notification.status === "dismissed" ? "해제" : "누락"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                    <div className="text-xs text-muted-foreground">
                      {notification.confirmed_at
                        ? `완료: ${format(new Date(notification.confirmed_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}`
                        : `생성: ${format(new Date(notification.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

