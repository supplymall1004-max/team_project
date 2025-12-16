/**
 * @file recipe-tabs-client.tsx
 * @description 레시피 아카이브 탭 네비게이션 (Client Component)
 * Server Component의 children을 받아서 표시
 */

'use client';

import { Suspense, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RecipeTabsClientProps {
  allContent: ReactNode;
  modernContent: ReactNode;
  royalContent: ReactNode;
  mfdsContent: ReactNode;
  babyContent?: ReactNode;
}

function RecipeTabsContent({ 
  allContent, 
  modernContent, 
  royalContent, 
  mfdsContent,
  babyContent
}: RecipeTabsClientProps) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';

  return (
    <Tabs defaultValue={initialTab} className="w-full">
      <TabsList className="flex w-full justify-center gap-1 mb-6">
        <TabsTrigger value="all">전체</TabsTrigger>
        <TabsTrigger value="modern">현대 레시피</TabsTrigger>
        <TabsTrigger value="royal">궁중 레시피</TabsTrigger>
        <TabsTrigger value="mfds">식약처 레시피</TabsTrigger>
        <TabsTrigger value="baby">이유식 레시피</TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        {allContent}
      </TabsContent>

      <TabsContent value="modern">
        {modernContent}
      </TabsContent>

      <TabsContent value="royal">
        {royalContent}
      </TabsContent>

      <TabsContent value="mfds">
        {mfdsContent}
      </TabsContent>

      {babyContent && (
        <TabsContent value="baby">
          {babyContent}
        </TabsContent>
      )}
    </Tabs>
  );
}

export function RecipeTabsClient(props: RecipeTabsClientProps) {
  return (
    <Suspense fallback={<div className="py-12 text-center">로딩 중...</div>}>
      <RecipeTabsContent {...props} />
    </Suspense>
  );
}
