/**
 * @file components/health/family-member-health-sync-button.tsx
 * @description 가족 구성원별 건강 정보 동기화 버튼 컴포넌트
 * 
 * 가족 구성원의 건강 정보를 동기화하는 버튼입니다.
 * 해당 구성원의 신원확인이 완료되어야 동기화가 가능합니다.
 */

'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2, Database, User } from 'lucide-react';
import type { FamilyMember } from '@/types/family';

interface FamilyMemberHealthSyncButtonProps {
  member: FamilyMember;
  onSyncComplete?: () => void;
}

export function FamilyMemberHealthSyncButton({
  member,
  onSyncComplete,
}: FamilyMemberHealthSyncButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  // 해당 가족 구성원의 신원확인 상태 조회
  const { data: verifications, isLoading: isVerificationsLoading } = useQuery({
    queryKey: ['identity-verifications', member.id],
    queryFn: async () => {
      const res = await fetch('/api/identity/verifications');
      if (!res.ok) {
        throw new Error('신원확인 조회 실패');
      }
      const allVerifications = await res.json();
      return allVerifications.filter((v: any) => v.family_member_id === member.id);
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const hasVerifiedIdentity = Array.isArray(verifications) && 
    verifications.some((v: any) => v.status === 'verified');

  // 동기화 실행
  const handleSync = async () => {
    console.log('[FamilyMemberHealthSyncButton] handleSync 함수 시작:', {
      memberId: member.id,
      memberName: member.name,
      hasVerifiedIdentity,
    });

    if (!hasVerifiedIdentity) {
      console.log('[FamilyMemberHealthSyncButton] 신원확인 실패로 함수 종료');
      toast({
        title: '신원확인 필요',
        description: `${member.name}님의 건강정보 동기화를 위해서는 먼저 신원확인이 완료되어야 합니다.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);

    try {
      console.log('[FamilyMemberHealthSyncButton] 동기화 요청 시작:', {
        memberId: member.id,
        dataSources: ['mydata', 'health_highway'],
      });

      const response = await fetch('/api/health/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataSources: ['mydata', 'health_highway'],
          forceSync: false,
          familyMemberId: member.id, // 가족 구성원 ID 전달
        }),
      });

      console.log('[FamilyMemberHealthSyncButton] 동기화 응답:', {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[FamilyMemberHealthSyncButton] 동기화 실패:', errorData);
        
        toast({
          title: '동기화 실패',
          description: errorData.error || errorData.message || '건강 정보 동기화에 실패했습니다.',
          variant: 'destructive',
        });
        return;
      }

      const result = await response.json();
      console.log('[FamilyMemberHealthSyncButton] 동기화 성공:', result);

      toast({
        title: '동기화 완료',
        description: `${member.name}님의 건강 정보가 성공적으로 동기화되었습니다.`,
      });

      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['health-data'] });
      queryClient.invalidateQueries({ queryKey: ['health-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['health-profile'] });

      onSyncComplete?.();
    } catch (error) {
      console.error('[FamilyMemberHealthSyncButton] 동기화 중 예외 발생:', error);
      toast({
        title: '오류 발생',
        description: '건강 정보 동기화 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isVerificationsLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium">{member.name}님 건강 정보</div>
              <div className="text-sm text-muted-foreground">
                {hasVerifiedIdentity ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    신원확인 완료
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="h-3 w-3" />
                    신원확인 필요
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            onClick={handleSync}
            disabled={!hasVerifiedIdentity || isSyncing}
            size="sm"
            variant={hasVerifiedIdentity ? 'default' : 'outline'}
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                동기화 중...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                동기화
              </>
            )}
          </Button>
        </div>
        {!hasVerifiedIdentity && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              건강 정보를 동기화하려면 먼저 신원확인이 완료되어야 합니다.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

