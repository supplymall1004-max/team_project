/**
 * @file components/health/lifecycle-notification-card.tsx
 * @description 생애주기별 네온 알림 카드 컴포넌트
 * 
 * 게임 HUD 스타일의 네온 효과가 있는 알림 카드입니다.
 * 우선순위에 따라 색상이 다릅니다:
 * - High/Urgent: 빨간색 네온
 * - Medium/Normal: 노란색 네온
 * - Low: 파란색 네온
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, X, Calendar, Clock, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useState } from 'react';
import { LifecycleNotificationSharing } from './lifecycle-notification-sharing';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LifecycleNotificationCardProps {
  notification: {
    id: string;
    title: string;
    message: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    category: string;
    scheduled_at?: string | null;
    context_data?: Record<string, any>;
    status: string;
  };
  onComplete?: (id: string) => void;
  onDismiss?: (id: string) => void;
  className?: string;
}

export function LifecycleNotificationCard({
  notification,
  onComplete,
  onDismiss,
  className,
}: LifecycleNotificationCardProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const priority = notification.priority;
  const isHigh = priority === 'high' || priority === 'urgent';
  const isMedium = priority === 'normal';
  const isLow = priority === 'low';

  // D-Day 계산
  const daysUntil = notification.context_data?.days_until;
  const scheduledDate = notification.scheduled_at
    ? new Date(notification.scheduled_at)
    : null;

  // 네온 효과 클래스
  const neonClass = cn(
    "relative overflow-hidden rounded-lg border-2 transition-all duration-300",
    "hover:scale-105 hover:shadow-2xl",
    isHigh && "border-red-500 bg-red-950/50 shadow-[0_0_20px_rgba(239,68,68,0.5)]",
    isMedium && "border-yellow-500 bg-yellow-950/50 shadow-[0_0_20px_rgba(234,179,8,0.5)]",
    isLow && "border-blue-500 bg-blue-950/50 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
  );

  // 텍스트 네온 효과
  const textNeonClass = cn(
    "font-bold",
    isHigh && "text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]",
    isMedium && "text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]",
    isLow && "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
  );

  return (
    <Card className={cn(neonClass, className)}>
      <CardContent className="p-4">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className={cn("text-lg mb-1", textNeonClass)}>
              {notification.title}
            </h3>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                isHigh && "border-red-500 text-red-400",
                isMedium && "border-yellow-500 text-yellow-400",
                isLow && "border-blue-500 text-blue-400"
              )}
            >
              {priority === 'urgent' ? '긴급' : priority === 'high' ? '높음' : priority === 'normal' ? '보통' : '낮음'}
            </Badge>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(notification.id)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* 메시지 */}
        <p className="text-sm text-muted-foreground mb-3">
          {notification.message}
        </p>

        {/* 날짜 정보 */}
        {scheduledDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Calendar className="w-3 h-3" />
            <span>{format(scheduledDate, 'yyyy년 MM월 dd일', { locale: ko })}</span>
            {daysUntil !== undefined && daysUntil !== null && (
              <>
                <Clock className="w-3 h-3 ml-2" />
                <span className={cn(
                  daysUntil <= 7 && "font-bold",
                  isHigh && "text-red-400",
                  isMedium && "text-yellow-400",
                  isLow && "text-blue-400"
                )}>
                  {daysUntil === 0
                    ? '오늘'
                    : daysUntil === 1
                    ? '내일'
                    : daysUntil < 0
                    ? `지난 지 ${Math.abs(daysUntil)}일`
                    : `D-${daysUntil}`}
                </span>
              </>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          {onComplete && notification.status === 'pending' && (
            <Button
              size="sm"
              onClick={() => onComplete(notification.id)}
              className={cn(
                "flex-1",
                isHigh && "bg-red-600 hover:bg-red-700",
                isMedium && "bg-yellow-600 hover:bg-yellow-700",
                isLow && "bg-blue-600 hover:bg-blue-700"
              )}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              완료하기
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsShareDialogOpen(true)}
            className="flex-shrink-0"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        {notification.status === 'confirmed' && (
          <div className="flex items-center justify-center gap-2 text-xs text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>완료됨</span>
          </div>
        )}
      </CardContent>

      {/* 공유 다이얼로그 */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>알림 공유</DialogTitle>
            <DialogDescription>
              가족 구성원과 이 알림을 공유하세요
            </DialogDescription>
          </DialogHeader>
          <LifecycleNotificationSharing notificationId={notification.id} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

