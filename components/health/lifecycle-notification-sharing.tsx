/**
 * @file components/health/lifecycle-notification-sharing.tsx
 * @description 생애주기별 알림 공유 컴포넌트
 * 
 * 가족 구성원 간 알림 공유 및 완료 상태 공유 기능을 제공합니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Share2, Users, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface SharedNotification {
  id: string;
  notification_id: string;
  shared_by_user_id: string;
  shared_with_user_id: string;
  share_completion_status: boolean;
  share_reminders: boolean;
  created_at: string;
  notifications?: {
    id: string;
    title: string;
    message: string;
    status: string;
    confirmed_at?: string | null;
  };
  shared_by?: { id: string; name: string };
  shared_with?: { id: string; name: string };
}

interface LifecycleNotificationSharingProps {
  notificationId?: string;
  className?: string;
}

export function LifecycleNotificationSharing({
  notificationId,
  className,
}: LifecycleNotificationSharingProps) {
  const [receivedShares, setReceivedShares] = useState<SharedNotification[]>([]);
  const [sharedByMe, setSharedByMe] = useState<SharedNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [familyMembers, setFamilyMembers] = useState<Array<{ id: string; name: string; user_id?: string }>>([]);

  useEffect(() => {
    fetchSharedNotifications();
    fetchFamilyMembers();
  }, []);

  const fetchSharedNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/health/lifecycle-notifications/shared');

      if (!response.ok) {
        throw new Error('공유 알림을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setReceivedShares(data.received || []);
      setSharedByMe(data.shared || []);
    } catch (error) {
      console.error('공유 알림 조회 실패:', error);
      toast.error('공유 알림을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const response = await fetch('/api/family/members');
      if (response.ok) {
        const data = await response.json();
        setFamilyMembers((data.members || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          user_id: data.user_id, // 같은 계정 내 가족 구성원이므로 user_id는 동일
        })));
      }
    } catch (error) {
      console.error('가족 구성원 조회 실패:', error);
    }
  };

  const handleShare = async (sharedWithUserId: string, shareCompletionStatus: boolean, shareReminders: boolean) => {
    if (!notificationId) {
      toast.error('알림 ID가 필요합니다.');
      return;
    }

    try {
      const response = await fetch(`/api/health/lifecycle-notifications/${notificationId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shared_with_user_id: sharedWithUserId,
          share_completion_status: shareCompletionStatus,
          share_reminders: shareReminders,
        }),
      });

      if (!response.ok) {
        throw new Error('알림 공유에 실패했습니다.');
      }

      toast.success('알림이 공유되었습니다.');
      fetchSharedNotifications();
    } catch (error) {
      console.error('알림 공유 실패:', error);
      toast.error('알림 공유에 실패했습니다.');
    }
  };

  const handleRevokeShare = async (sharedWithUserId: string) => {
    if (!notificationId) {
      toast.error('알림 ID가 필요합니다.');
      return;
    }

    try {
      const response = await fetch(
        `/api/health/lifecycle-notifications/${notificationId}/share?shared_with_user_id=${sharedWithUserId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('공유 취소에 실패했습니다.');
      }

      toast.success('공유가 취소되었습니다.');
      fetchSharedNotifications();
    } catch (error) {
      console.error('공유 취소 실패:', error);
      toast.error('공유 취소에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          알림 공유
        </CardTitle>
        <CardDescription>
          가족 구성원과 알림을 공유하고 완료 상태를 확인하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 공유받은 알림 */}
        {receivedShares.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              공유받은 알림 ({receivedShares.length}건)
            </h3>
            <div className="space-y-2">
              {receivedShares.map((share) => (
                <div key={share.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {share.shared_by?.name || '알 수 없음'}님이 공유
                        </span>
                        {share.share_completion_status && (
                          <Badge variant="outline" className="text-xs">
                            완료 상태 공유
                          </Badge>
                        )}
                      </div>
                      {share.notifications && (
                        <>
                          <p className="text-sm font-medium mb-1">{share.notifications.title}</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {share.notifications.message}
                          </p>
                          {share.notifications.status === 'confirmed' && share.notifications.confirmed_at && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>
                                {format(new Date(share.notifications.confirmed_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })} 완료
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 공유한 알림 */}
        {sharedByMe.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              공유한 알림 ({sharedByMe.length}건)
            </h3>
            <div className="space-y-2">
              {sharedByMe.map((share) => (
                <div key={share.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {share.shared_with?.name || '알 수 없음'}님과 공유 중
                        </span>
                        {share.share_completion_status && (
                          <Badge variant="outline" className="text-xs">
                            완료 상태 공유
                          </Badge>
                        )}
                      </div>
                      {share.notifications && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {share.notifications.title}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeShare(share.shared_with_user_id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 공유하기 (알림 ID가 있을 때만) */}
        {notificationId && familyMembers.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">알림 공유하기</h3>
            <div className="space-y-4">
              {familyMembers.map((member) => (
                <div key={member.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">{member.name}</span>
                    <Button
                      size="sm"
                      onClick={() => handleShare(member.user_id || '', true, false)}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      공유하기
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {receivedShares.length === 0 && sharedByMe.length === 0 && !notificationId && (
          <div className="text-center py-8 text-muted-foreground">
            <p>공유된 알림이 없습니다.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

