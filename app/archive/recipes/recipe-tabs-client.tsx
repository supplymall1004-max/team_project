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
  gruelContent?: ReactNode;
  specialContent?: ReactNode;
  veganContent?: ReactNode;
}

function RecipeTabsContent({ 
  allContent, 
  modernContent, 
  royalContent, 
  mfdsContent,
  babyContent,
  gruelContent,
  specialContent,
  veganContent
}: RecipeTabsClientProps) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';

  return (
    <Tabs defaultValue={initialTab} className="w-full relative">
      <TabsList className="grid w-full grid-cols-2 gap-2 mb-12 relative z-50" style={{ pointerEvents: 'auto' }}>
        <TabsTrigger value="all" className="text-xs sm:text-sm">전체</TabsTrigger>
        <TabsTrigger value="modern" className="text-xs sm:text-sm">현대 레시피</TabsTrigger>
        <TabsTrigger value="royal" className="text-xs sm:text-sm">궁중 레시피</TabsTrigger>
        <TabsTrigger value="mfds" className="text-xs sm:text-sm">식약처 레시피</TabsTrigger>
        <TabsTrigger value="baby" className="text-xs sm:text-sm">이유식 레시피</TabsTrigger>
        <TabsTrigger value="gruel" className="text-xs sm:text-sm">죽 레시피</TabsTrigger>
        <TabsTrigger value="special" className="text-xs sm:text-sm">특수 레시피</TabsTrigger>
        <TabsTrigger value="vegan" className="text-xs sm:text-sm">비건 레시피</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="pt-12 mt-4 relative z-0">
        {allContent}
      </TabsContent>

      <TabsContent value="modern" className="pt-12 mt-4 relative z-0">
        {modernContent}
      </TabsContent>

      <TabsContent value="royal" className="pt-12 mt-4 relative z-0">
        {royalContent}
      </TabsContent>

      <TabsContent value="mfds" className="pt-12 mt-4 relative z-0">
        {mfdsContent}
      </TabsContent>

      {babyContent && (
        <TabsContent value="baby" className="pt-12 mt-4 relative z-0">
          {babyContent}
        </TabsContent>
      )}

      {gruelContent && (
        <TabsContent value="gruel" className="pt-12 mt-4 relative z-0">
          {gruelContent}
        </TabsContent>
      )}

      {specialContent && (
        <TabsContent value="special" className="pt-12 mt-4 relative z-0">
          {specialContent}
        </TabsContent>
      )}

      {veganContent && (
        <TabsContent value="vegan" className="pt-12 mt-4 relative z-0">
          {veganContent}
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
