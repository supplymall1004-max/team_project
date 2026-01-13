/**
 * @file components/health/lifecycle-notification-grid.tsx
 * @description 생애주기별 네온 알림 그리드 컴포넌트
 * 
 * 우선순위별로 그룹화된 알림 카드 그리드를 표시합니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { LifecycleNotificationCard } from './lifecycle-notification-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  scheduled_at?: string | null;
  context_data?: Record<string, any>;
  status: string;
}

interface LifecycleNotificationGridProps {
  familyMemberId?: string;
  priority?: 'high' | 'medium' | 'low' | 'all';
  status?: 'pending' | 'all';
  className?: string;
}

export function LifecycleNotificationGrid({
  familyMemberId,
  priority,
  status = 'pending',
  className,
}: LifecycleNotificationGridProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pastNotification, setPastNotification] = useState<Notification | null>(null);
  const [upcomingNotification, setUpcomingNotification] = useState<Notification | null>(null);
  const [grouped, setGrouped] = useState<{
    high: Notification[];
    medium: Notification[];
    low: Notification[];
  }>({ high: [], medium: [], low: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [familyMemberId]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (familyMemberId) {
        params.append('family_member_id', familyMemberId);
      }
      if (priority && priority !== 'all') {
        params.append('priority', priority);
      }

      // 지난 알림(completed)과 다가올 알림(pending)을 병렬로 조회
      const [pastResponse, upcomingResponse] = await Promise.all([
        // 지난 알림 1개 조회 (완료된 알림 중 가장 최근)
        fetch(
          `/api/health/lifecycle-notifications?${new URLSearchParams({
            ...Object.fromEntries(params),
            status: 'completed',
            limit: '1',
          }).toString()}`
        ),
        // 다가올 알림 조회 (예정된 알림)
        fetch(
          `/api/health/lifecycle-notifications?${new URLSearchParams({
            ...Object.fromEntries(params),
            status: 'pending',
          }).toString()}`
        ),
      ]);

      if (!pastResponse.ok || !upcomingResponse.ok) {
        throw new Error('알림을 불러오는데 실패했습니다.');
      }

      const pastData = await pastResponse.json();
      const upcomingData = await upcomingResponse.json();

      // 지난 알림 1개 (가장 최근 완료된 알림)
      const pastNotifications = pastData.notifications || [];
      setPastNotification(pastNotifications.length > 0 ? pastNotifications[0] : null);

      // 다가올 알림 1개 (가장 가까운 예정 알림)
      const upcomingNotifications = upcomingData.notifications || [];
      setUpcomingNotification(upcomingNotifications.length > 0 ? upcomingNotifications[0] : null);

      // 기존 로직 유지 (다가올 알림 전체)
      setNotifications(upcomingNotifications);
      setGrouped(upcomingData.grouped || { high: [], medium: [], low: [] });
    } catch (error) {
      console.error('알림 조회 실패:', error);
      toast.error('알림을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const response = await fetch(`/api/health/lifecycle-notifications/${id}/complete`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('알림 완료 처리에 실패했습니다.');
      }

      toast.success('알림이 완료되었습니다.');
      fetchNotifications(); // 목록 새로고침
    } catch (error) {
      console.error('알림 완료 실패:', error);
      toast.error('알림 완료 처리에 실패했습니다.');
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      const response = await fetch(`/api/health/lifecycle-notifications/${id}/dismiss`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('알림 해제에 실패했습니다.');
      }

      toast.success('알림이 해제되었습니다.');
      fetchNotifications(); // 목록 새로고침
    } catch (error) {
      console.error('알림 해제 실패:', error);
      toast.error('알림 해제에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">알림을 불러오는 중...</p>
      </div>
    );
  }

  const totalCount = notifications.length;
  const hasAnyNotification = pastNotification || upcomingNotification || totalCount > 0;

  if (!hasAnyNotification) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">현재 알림이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* 지난 알림 1개와 다가올 알림 1개 표시 */}
      {(pastNotification || upcomingNotification) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 지난 알림 */}
          {pastNotification && (
            <Card className="border-gray-300 bg-gray-50/50 dark:bg-gray-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">📅 지난 알림</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LifecycleNotificationCard
                  notification={pastNotification}
                  onComplete={handleComplete}
                  onDismiss={handleDismiss}
                />
              </CardContent>
            </Card>
          )}

          {/* 다가올 알림 */}
          {upcomingNotification && (
            <Card className="border-blue-300 bg-blue-50/50 dark:bg-blue-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <span className="text-blue-600 dark:text-blue-400">🔔 다가올 알림</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LifecycleNotificationCard
                  notification={upcomingNotification}
                  onComplete={handleComplete}
                  onDismiss={handleDismiss}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {/* High 우선순위 알림 */}
      {grouped.high.length > 0 && (
        <div className="mb-6">
          <Card className="mb-4 border-red-500/50 bg-red-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                🔴 High 우선순위 알림 ({grouped.high.length}개)
              </CardTitle>
              <CardDescription>
                즉시 확인이 필요한 중요한 알림입니다.
              </CardDescription>
            </CardHeader>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grouped.high.map((notification) => (
              <LifecycleNotificationCard
                key={notification.id}
                notification={notification}
                onComplete={handleComplete}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        </div>
      )}

      {/* Medium 우선순위 알림 */}
      {grouped.medium.length > 0 && (
        <div className="mb-6">
          <Card className="mb-4 border-yellow-500/50 bg-yellow-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-400">
                🟡 Medium 우선순위 알림 ({grouped.medium.length}개)
              </CardTitle>
              <CardDescription>
                이번 달 내 확인이 권장되는 알림입니다.
              </CardDescription>
            </CardHeader>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grouped.medium.map((notification) => (
              <LifecycleNotificationCard
                key={notification.id}
                notification={notification}
                onComplete={handleComplete}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        </div>
      )}

      {/* Low 우선순위 알림 */}
      {grouped.low.length > 0 && (
        <div className="mb-6">
          <Card className="mb-4 border-blue-500/50 bg-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400">
                🔵 Low 우선순위 알림 ({grouped.low.length}개)
              </CardTitle>
              <CardDescription>
                참고용 알림입니다.
              </CardDescription>
            </CardHeader>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grouped.low.map((notification) => (
              <LifecycleNotificationCard
                key={notification.id}
                notification={notification}
                onComplete={handleComplete}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

