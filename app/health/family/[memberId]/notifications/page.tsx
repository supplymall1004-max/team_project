/**
 * @file app/health/family/[memberId]/notifications/page.tsx
 * @description 가족 구성원별 알림 페이지
 * 
 * 특정 가족 구성원의 생애주기별 건강 알림을 표시하는 페이지입니다.
 * 계획서의 레이아웃에 따라 캐릭터 아바타와 함께 우선순위별 알림 그리드를 표시합니다.
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { use } from 'react';
import { Section } from '@/components/section';
import { LifecycleNotificationGrid } from '@/components/health/lifecycle-notification-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorBoundary } from '@/components/error-boundary';
import { ArrowLeft, Bell, User } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

function SectionSkeleton() {
  return (
    <div className="py-12 text-center">
      <LoadingSpinner />
    </div>
  );
}

interface FamilyMemberNotificationsPageProps {
  params: Promise<{ memberId: string }>;
}

function FamilyMemberNotificationsContent({ params }: FamilyMemberNotificationsPageProps) {
  const { memberId } = use(params);
  const { userId, isLoaded } = useAuth();
  const [familyMember, setFamilyMember] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!userId) {
      setIsLoading(false);
      setError('로그인이 필요합니다.');
      return;
    }

    const fetchFamilyMember = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/family/members`);
        
        if (!response.ok) {
          throw new Error('가족 구성원 정보를 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        const member = data.members?.find((m: any) => m.id === memberId);
        
        if (!member) {
          setError('가족 구성원을 찾을 수 없습니다.');
          return;
        }

        setFamilyMember(member);
      } catch (err) {
        console.error('가족 구성원 조회 실패:', err);
        setError(err instanceof Error ? err.message : '가족 구성원 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFamilyMember();
  }, [memberId, userId, isLoaded]);

  // 나이 계산
  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (!isLoaded || isLoading) {
    return (
      <Section>
        <div className="text-center py-12">
          <LoadingSpinner />
        </div>
      </Section>
    );
  }

  if (error || !familyMember) {
    return (
      <Section>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{error || '가족 구성원을 찾을 수 없습니다.'}</p>
          {!userId && (
            <Button asChild className="mt-4">
              <Link href="/sign-in">로그인하기</Link>
            </Button>
          )}
          {userId && (
            <Button asChild className="mt-4" variant="outline">
              <Link href="/health/family">가족 건강으로 돌아가기</Link>
            </Button>
          )}
        </div>
      </Section>
    );
  }

  const age = familyMember.birth_date ? calculateAge(familyMember.birth_date) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        {/* 헤더 */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/health/family">
              <ArrowLeft className="w-4 h-4 mr-2" />
              가족 건강으로 돌아가기
            </Link>
          </Button>
          
          <h1 className="text-4xl font-bold mb-2">🔔 생애주기별 건강 알림</h1>
          <p className="text-muted-foreground">
            {familyMember.name}님의 건강 알림을 확인하세요
          </p>
        </div>

        {/* 가족 구성원 정보 카드 - 게임 스타일 */}
        <Card className="mb-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-4">
              {/* 프로필 사진 - 게임 캐릭터 아바타 스타일 */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-green-400 shadow-lg bg-gradient-to-br from-green-400 to-green-600 overflow-hidden">
                  {familyMember.photo_url ? (
                    <Image
                      src={familyMember.photo_url}
                      alt={familyMember.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                      {familyMember.name?.[0] || <User className="w-10 h-10" />}
                    </div>
                  )}
                </div>
                {/* 게임 스타일 장식 효과 */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                  <span className="text-xs font-bold text-yellow-900">⭐</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-3xl font-bold text-green-900 mb-1">{familyMember.name}</div>
                <div className="text-sm text-green-700 space-x-2">
                  {age !== null && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/70 rounded-md">
                      <span className="font-semibold">{age}세</span>
                    </span>
                  )}
                  {familyMember.relationship && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/70 rounded-md">
                      {familyMember.relationship}
                    </span>
                  )}
                  {familyMember.gender && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/70 rounded-md">
                      {familyMember.gender === 'male' ? '남성' : '여성'}
                    </span>
                  )}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* 생애주기별 건강 알림 */}
        <ErrorBoundary>
          <Suspense fallback={<SectionSkeleton />}>
            <LifecycleNotificationGrid 
              familyMemberId={memberId}
              className="mb-6"
            />
          </Suspense>
        </ErrorBoundary>

        {/* 알림 센터로 이동 */}
        <div className="mt-6 text-center">
          <Button asChild variant="outline">
            <Link href="/health/notifications">
              <Bell className="w-4 h-4 mr-2" />
              전체 알림 센터 보기
            </Link>
          </Button>
        </div>
      </Section>
    </div>
  );
}

export default function FamilyMemberNotificationsPage({ params }: FamilyMemberNotificationsPageProps) {
  return (
    <Suspense fallback={<SectionSkeleton />}>
      <FamilyMemberNotificationsContent params={params} />
    </Suspense>
  );
}

