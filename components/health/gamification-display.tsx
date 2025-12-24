/**
 * @file components/health/gamification-display.tsx
 * @description 게임화 정보 표시 컴포넌트
 * 
 * 포인트, 연속 완료 일수, 배지를 표시합니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Zap, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GamificationData {
  totalPoints: number;
  streakDays: number;
  badges: string[];
}

interface GamificationDisplayProps {
  className?: string;
}

export function GamificationDisplay({ className }: GamificationDisplayProps) {
  const [data, setData] = useState<GamificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGamificationData();
  }, []);

  const fetchGamificationData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/health/gamification');
      
      if (!response.ok) {
        throw new Error('게임화 데이터를 불러오는데 실패했습니다.');
      }

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error('게임화 데이터 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  const badgeIcons: Record<string, string> = {
    first_complete: '🎯',
    streak_3: '🔥',
    streak_7: '⭐',
    streak_30: '🏆',
    points_100: '💯',
    points_500: '🌟',
    points_1000: '👑',
  };

  const badgeNames: Record<string, string> = {
    first_complete: '첫 걸음',
    streak_3: '3일 연속',
    streak_7: '일주일 마스터',
    streak_30: '한 달 도전자',
    points_100: '백점 클럽',
    points_500: '오백점 마스터',
    points_1000: '천점 레전드',
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          건강 관리 성과
        </CardTitle>
        <CardDescription>알림 완료로 포인트를 모으고 배지를 획득하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 포인트 및 연속 일수 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200">
            <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <div className="text-3xl font-bold text-yellow-600">{data.totalPoints}</div>
            <div className="text-sm text-muted-foreground">포인트</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-red-50 to-pink-50 border border-red-200">
            <Award className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <div className="text-3xl font-bold text-red-600">{data.streakDays}</div>
            <div className="text-sm text-muted-foreground">연속 완료 일수</div>
          </div>
        </div>

        {/* 배지 */}
        {data.badges.length > 0 ? (
          <div>
            <h3 className="text-lg font-semibold mb-3">획득한 배지</h3>
            <div className="flex flex-wrap gap-2">
              {data.badges.map((badgeId) => (
                <Badge
                  key={badgeId}
                  variant="outline"
                  className="text-lg px-3 py-1.5 border-2 border-yellow-500 bg-yellow-50"
                  title={badgeNames[badgeId] || badgeId}
                >
                  <span className="mr-1">{badgeIcons[badgeId] || '🏅'}</span>
                  {badgeNames[badgeId] || badgeId}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>아직 획득한 배지가 없습니다.</p>
            <p className="text-sm mt-1">알림을 완료하여 배지를 획득하세요!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

