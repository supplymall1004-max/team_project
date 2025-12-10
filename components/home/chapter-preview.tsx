/**
 * @file chapter-preview.tsx
 * @description 챕터 미리보기 컴포넌트
 *
 * 주요 기능:
 * 1. 챕터 1, 2의 미리보기 카드 표시
 * 2. 각 챕터의 주요 섹션 요약
 * 3. 전체보기 링크 제공
 */

'use client';

import Link from 'next/link';
import { Section } from '@/components/section';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Heart, ChefHat, Calendar, Book, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChapterPreviewProps {
  chapter: 1 | 2;
  className?: string;
}

export function Chapter1Preview({ className }: { className?: string }) {
  return (
    <Section
      id="chapter-1"
      className={cn('bg-orange-50/50', className)}
      title="📚 챕터 1: 레시피 & 식단 아카이브"
      description="현대 레시피부터 전통 궁중 레시피, 건강 맞춤 식단까지 모든 요리 지식을 한 곳에서"
    >
      <div className="space-y-6">
        {/* 상단 3개 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 현대 레시피 */}
          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-orange-600" />
                📖 현대 레시피
              </CardTitle>
              <CardDescription>별점과 난이도로 정리된 최신 레시피</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">최신 레시피 3개 미리보기</p>
                <Button asChild variant="outline" className="w-full group-hover:bg-orange-50">
                  <Link href="/recipes">
                    더보기 <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 궁중 레시피 */}
          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-orange-600" />
                👑 궁중 레시피
              </CardTitle>
              <CardDescription>삼국시대부터 조선시대까지 전통 궁중 음식</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">시대별 레시피 모음</p>
                <Button asChild variant="outline" className="w-full group-hover:bg-orange-50">
                  <Link href="/royal-recipes">
                    더보기 <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 건강 맞춤 식단 */}
          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-orange-600" />
                🤖 건강 맞춤 식단
              </CardTitle>
              <CardDescription>건강 정보 기반 개인 맞춤 식단 추천</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">AI 추천 식단</p>
                <Button asChild variant="outline" className="w-full group-hover:bg-orange-50">
                  <Link href="/diet">
                    더보기 <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 하단 2개 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 주간 식단 */}
          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                📅 주간 식단
              </CardTitle>
              <CardDescription>7일간의 식단을 한눈에 확인하고 장보기 리스트 관리</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">캘린더 뷰로 주간 식단 확인</p>
                <Button asChild variant="outline" className="w-full group-hover:bg-orange-50">
                  <Link href="/diet/weekly">
                    더보기 <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 마카의 음식 동화 */}
          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5 text-orange-600" />
                📖 마카의 음식 동화
              </CardTitle>
              <CardDescription>전통 음식의 탄생과 역사를 동화처럼 들려주는 이야기</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">음식 스토리 모음</p>
                <Button asChild variant="outline" className="w-full group-hover:bg-orange-50">
                  <Link href="/storybook">
                    더보기 <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 전체보기 버튼 */}
        <div className="flex justify-center pt-4">
          <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700">
            <Link href="/chapters/recipes-diet">
              챕터 1 전체보기 <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}

export function Chapter2Preview({ className }: { className?: string }) {
  return (
    <Section
      id="chapter-2"
      className={cn('bg-green-50/50', className)}
      title="💚 챕터 2: 건강 관리 현황"
      description="가족 건강을 한눈에 확인하고 관리하세요"
    >
      <div className="space-y-6">
        {/* 상단 2개 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 가족 건강 */}
          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-green-600" />
                👨‍👩‍👧‍👦 가족 건강
              </CardTitle>
              <CardDescription>가족 구성원별 건강 상태 확인</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-600">85</span>
                  <span className="text-sm text-muted-foreground">점</span>
                  <span className="text-yellow-500">⭐⭐⭐⭐</span>
                </div>
                <Button asChild variant="outline" className="w-full group-hover:bg-green-50">
                  <Link href="/health/dashboard">
                    상세보기 <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 건강 트렌드 */}
          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                📊 건강 트렌드
              </CardTitle>
              <CardDescription>체중, 활동량, 영양 섭취 추이 확인</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">최근 3개월 건강 데이터 차트</p>
                <Button asChild variant="outline" className="w-full group-hover:bg-green-50">
                  <Link href="/health/dashboard">
                    상세보기 <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 하단 2개 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 건강 알림 */}
          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-green-600" />
                🔔 건강 알림
              </CardTitle>
              <CardDescription>예방접종, 건강검진, 약물 복용 알림</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 예방접종 예정일</li>
                  <li>• 건강검진 권장일</li>
                  <li>• 약물 복용 알림</li>
                </ul>
                <Button asChild variant="outline" className="w-full group-hover:bg-green-50">
                  <Link href="/health/dashboard">
                    더보기 <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 목표 달성 */}
          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                🎯 목표 달성
              </CardTitle>
              <CardDescription>건강 목표 달성률 확인</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-600">75%</span>
                  <span className="text-sm text-muted-foreground">진행 중</span>
                </div>
                <Button asChild variant="outline" className="w-full group-hover:bg-green-50">
                  <Link href="/health/dashboard">
                    상세보기 <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 전체보기 버튼 */}
        <div className="flex justify-center pt-4">
          <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
            <Link href="/chapters/health">
              챕터 2 전체보기 <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}

