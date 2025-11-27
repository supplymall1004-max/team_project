/**
 * @file recipes/new/page.tsx
 * @description 레시피 업로드 페이지
 *
 * 주요 기능:
 * 1. 레시피 기본 정보 입력 (제목, 설명, 난이도, 조리 시간)
 * 2. 재료 입력 (구조화된 데이터)
 * 3. 단계별 조리 과정 입력 (이미지/영상 링크 포함)
 * 4. 이미지 링크 입력 (외부 URL)
 */

import { Suspense } from "react";
import { Section } from "@/components/section";
import { RecipeUploadForm } from "@/components/recipes/recipe-upload-form";
import { LoadingSpinner } from "@/components/loading-spinner";

export const metadata = {
  title: "레시피 업로드 | 맛의 아카이브",
  description: "나만의 레시피를 공유해보세요",
};

export default function RecipeUploadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">레시피 업로드</h1>
          <p className="text-muted-foreground">
            나만의 레시피를 공유하고 다른 사람들과 함께 나눠보세요
          </p>
        </div>

        <Suspense fallback={<LoadingSpinner label="폼을 불러오는 중..." />}>
          <RecipeUploadForm />
        </Suspense>
      </Section>
    </div>
  );
}

