/**
 * @file stories-learning-preview.tsx
 * @description 스토리 & 학습 미리보기 컴포넌트
 *
 * 주요 기능:
 * 1. 마카의 음식 동화, 음식 스토리 미리보기
 * 2. 상세 페이지와 동일한 컴포넌트 사용
 * 3. 전체보기 링크 제공
 */

import Link from 'next/link';
import { Section } from '@/components/section';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { StorybookSection } from '@/components/storybook/storybook-section';

export async function StoriesLearningPreview() {
  console.log("[StoriesLearningPreview] 메인 페이지 스토리 & 학습 미리보기 시작");

  return (
    <div className="space-y-8 bg-blue-50/50 py-12">
      <Section
        id="stories-learning"
        title="📖 스토리 & 학습"
        description="전통 음식의 탄생과 역사를 동화처럼 들려드립니다"
      >
        <div className="flex justify-center pt-4">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/stories">
              스토리 & 학습 전체보기 <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* 마카의 음식 동화 */}
      <StorybookSection />
    </div>
  );
}

