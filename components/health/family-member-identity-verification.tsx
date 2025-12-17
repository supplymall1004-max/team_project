/**
 * @file components/health/family-member-identity-verification.tsx
 * @description 가족 구성원별 신원확인 컴포넌트
 * 
 * 가족 구성원의 건강 정보를 불러오기 위해 필요한 신원확인을 처리합니다.
 */

'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, AlertCircle, Loader2, User } from 'lucide-react';
import type { FamilyMember } from '@/types/family';

interface FamilyMemberIdentityVerificationProps {
  member: FamilyMember;
  onVerified?: () => void;
}

export function FamilyMemberIdentityVerification({
  member,
  onVerified,
}: FamilyMemberIdentityVerificationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 해당 가족 구성원의 신원확인 상태 조회
  const { data: verifications, isLoading } = useQuery({
    queryKey: ['identity-verifications', member.id],
    queryFn: async () => {
      const res = await fetch('/api/identity/verifications');
      if (!res.ok) {
        throw new Error('신원확인 조회 실패');
      }
      const allVerifications = await res.json();
      // 해당 가족 구성원의 신원확인만 필터링
      return allVerifications.filter((v: any) => v.family_member_id === member.id);
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const hasVerifiedIdentity = Array.isArray(verifications) && 
    verifications.some((v: any) => v.status === 'verified');

  // 이미 신원확인이 완료된 경우 상태 업데이트
  if (hasVerifiedIdentity && !isSubmitted) {
    setIsSubmitted(true);
  }

  const handleSubmit = async () => {
    if (!name.trim() || !nationalId.trim() || !consent) {
      toast({
        title: '입력 오류',
        description: '모두 입력하고 동의해 주세요.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('[FamilyMemberIdentityVerification] 신원확인 제출 시작:', {
        memberId: member.id,
        memberName: member.name,
        name: name.trim(),
        hasNationalId: !!nationalId.trim(),
        consent,
      });

      const resp = await fetch('/api/identity/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          nationalId: nationalId.trim(),
          consent,
          familyMemberId: member.id,
        }),
      });

      console.log('[FamilyMemberIdentityVerification] API 응답 상태:', resp.status);

      if (resp.ok) {
        const data = await resp.json();
        console.log('[FamilyMemberIdentityVerification] 제출 성공:', data);
        setIsSubmitted(true);
        toast({
          title: '제출 완료',
          description: `${member.name}님의 신원확인 요청이 접수되었습니다.`,
        });
        queryClient.invalidateQueries({ queryKey: ['identity-verifications'] });
        onVerified?.();
      } else {
        let errorMessage = '오류가 발생했습니다.';
        try {
          const errorData = await resp.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error('[FamilyMemberIdentityVerification] 제출 실패:', errorData);
        } catch {
          const text = await resp.text();
          errorMessage = text || errorMessage;
        }
        toast({
          title: '제출 실패',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[FamilyMemberIdentityVerification] 제출 중 예외 발생:', error);
      toast({
        title: '오류 발생',
        description: '신원확인 제출 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {member.name}님 신원확인
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasVerifiedIdentity || isSubmitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            {member.name}님 신원확인 완료
          </CardTitle>
          <CardDescription className="text-green-600">
            건강 정보 동기화가 가능합니다.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {member.name}님 신원확인
        </CardTitle>
        <CardDescription>
          {member.name}님의 건강 정보를 불러오기 위해 신원확인이 필요합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 가족 구성원 정보 안내 */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            확인: {member.name}님의 정보를 입력해주세요
          </p>
          <p className="text-xs text-blue-700 mt-1">
            생년월일: {member.birth_date} (주민등록번호 앞 6자리와 일치해야 합니다)
          </p>
        </div>
        <div className="space-y-2">
          <Label>이름</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={member.name}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            가족 구성원 이름과 정확히 일치해야 합니다: &quot;{member.name}&quot;
          </p>
        </div>
        <div className="space-y-2">
          <Label>주민등록번호</Label>
          <Input
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            placeholder="YYYYMMDD-XXXXXXX"
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            생년월일 {member.birth_date}와 일치하는 주민등록번호를 입력해주세요
          </p>
        </div>
        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id={`consent-${member.id}`}
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            disabled={isSubmitting}
            className="mt-1"
          />
          <label
            htmlFor={`consent-${member.id}`}
            className="text-sm leading-relaxed cursor-pointer"
          >
            {member.name}님의 개인정보(이름, 주민등록번호) 수집 및 이용에 동의합니다.
            <br />
            <span className="text-xs text-muted-foreground">
              (신원확인 및 건강 정보 조회 목적)
            </span>
          </label>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !name.trim() || !nationalId.trim() || !consent}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              제출 중...
            </>
          ) : (
            '신원확인 제출'
          )}
        </Button>
        {verifications && verifications.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>이미 신원확인 요청이 있습니다. 검토 중입니다.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

