/**
 * @file components/home/lifecycle-notifications-preview.tsx
 * @description 홈페이지 생애주기별 알림 미리보기 컴포넌트
 * 
 * 챕터 2 섹션에 표시되는 생애주기별 건강 알림 미리보기입니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NotificationSummary {
  high: number;
  medium: number;
  low: number;
  total: number;
}

export function LifecycleNotificationsPreview({ className }: { className?: string }) {
  const [summary, setSummary] = useState<NotificationSummary>({
    high: 0,
    medium: 0,
    low: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotificationSummary();
    
    // 60초마다 업데이트
    const interval = setInterval(fetchNotificationSummary, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotificationSummary = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/health/lifecycle-notifications?status=pending');
      
      if (!response.ok) {
        throw new Error('알림 요약을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      const grouped = data.grouped || { high: [], medium: [], low: [] };
      
      setSummary({
        high: grouped.high?.length || 0,
        medium: grouped.medium?.length || 0,
        low: grouped.low?.length || 0,
        total: data.count || 0,
      });
    } catch (error) {
      console.error('알림 요약 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">알림을 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (summary.total === 0) {
    return (
      <Card className={cn("border-green-200 bg-green-50/30", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-green-600" />
            🔔 생애주기별 건강 알림
          </CardTitle>
          <CardDescription>현재 알림이 없습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/health/notifications">
              알림 센터 보기 <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-green-200 bg-green-50/30", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-green-600" />
          🔔 생애주기별 건강 알림
        </CardTitle>
        <CardDescription>
          가족 구성원의 생애주기에 맞는 건강 알림을 확인하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 우선순위별 요약 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-3 rounded-lg border-2 border-red-500/50 bg-red-950/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-medium text-red-400">High</span>
            </div>
            <div className="text-2xl font-bold text-red-400">{summary.high}</div>
            <div className="text-xs text-muted-foreground">개</div>
          </div>
          <div className="text-center p-3 rounded-lg border-2 border-yellow-500/50 bg-yellow-950/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-xs font-medium text-yellow-400">Medium</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">{summary.medium}</div>
            <div className="text-xs text-muted-foreground">개</div>
          </div>
          <div className="text-center p-3 rounded-lg border-2 border-blue-500/50 bg-blue-950/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-xs font-medium text-blue-400">Low</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{summary.low}</div>
            <div className="text-xs text-muted-foreground">개</div>
          </div>
        </div>

        {/* 전체보기 버튼 */}
        <Button asChild className="w-full" variant="outline">
          <Link href="/health/notifications">
            알림 센터 전체보기 <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

