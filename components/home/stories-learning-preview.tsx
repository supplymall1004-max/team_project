/**
 * @file stories-learning-preview.tsx
 * @description 스토리 & 학습 미리보기 컴포넌트
 *
 * 주요 기능:
 * 1. 마카의 음식 동화, 음식 스토리 미리보기
 * 2. 각 카테고리별 대표 스토리 2-3개 표시
 * 3. 전체보기 링크 제공
 */

import Link from 'next/link';
import { Section } from '@/components/section';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Book, Film } from 'lucide-react';

export async function StoriesLearningPreview() {
  return (
    <Section
      id="stories-learning"
      className="bg-blue-50/50"
      title="📖 스토리 & 학습"
      description="전통 음식의 탄생과 역사를 동화처럼 들려드립니다"
    >
      <div className="space-y-6">
        {/* 마카의 음식 동화 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Book className="h-5 w-5 text-blue-600" />
              📖 마카의 음식 동화
            </h3>
            <Button asChild variant="ghost" size="sm">
              <Link href="/stories?tab=storybook">
                더보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <div className="aspect-video bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">스토리 이미지</span>
                  </div>
                  <CardTitle className="text-base">음식 동화 제목 {i}</CardTitle>
                  <CardDescription>전통 음식의 탄생 이야기</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full group-hover:bg-blue-50">
                    <Link href="/storybook">보기</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 음식 스토리 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Film className="h-5 w-5 text-blue-600" />
              🎬 음식 스토리
            </h3>
            <Button asChild variant="ghost" size="sm">
              <Link href="/stories?tab=food-stories">
                더보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <div className="aspect-video bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">동영상 썸네일</span>
                  </div>
                  <CardTitle className="text-base">음식 스토리 제목 {i}</CardTitle>
                  <CardDescription>음식 관련 동영상 콘텐츠</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full group-hover:bg-blue-50">
                    <Link href="/food-stories">재생</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 전체보기 버튼 */}
        <div className="flex justify-center pt-4">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/stories">
              스토리 & 학습 전체보기 <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}

