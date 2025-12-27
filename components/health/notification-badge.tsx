/**
 * @file components/health/notification-badge.tsx
 * @description 알림 배지 컴포넌트
 * 
 * High 우선순위 알림 개수를 표시하는 배지입니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  className?: string;
  href?: string;
}

export function NotificationBadge({ className, href }: NotificationBadgeProps) {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHighPriorityCount();
    
    // 60초마다 업데이트
    const interval = setInterval(fetchHighPriorityCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchHighPriorityCount = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/health/lifecycle-notifications?status=pending&priority=high');
      
      // 401 (인증 필요) 또는 404 (사용자 없음)는 정상적인 경우이므로 조용히 처리
      if (response.status === 401 || response.status === 404) {
        setCount(null);
        return;
      }
      
      if (!response.ok) {
        throw new Error('알림 개수를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      const highCount = data.grouped?.high?.length || 0;
      setCount(highCount);
    } catch (error) {
      // 네트워크 오류 등은 조용히 처리 (콘솔에만 기록)
      if (process.env.NODE_ENV === 'development') {
        console.debug('알림 개수 조회 실패:', error);
      }
      setCount(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || count === null || count === 0) {
    return null;
  }

  return (
    <Badge
      className={cn(
        "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 flex items-center justify-center",
        "bg-red-500 text-white text-xs font-bold rounded-full",
        "border-2 border-white shadow-lg",
        className
      )}
      variant="destructive"
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
}

