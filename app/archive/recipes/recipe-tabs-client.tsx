/**
 * @file recipe-tabs-client.tsx
 * @description 레시피 아카이브 탭 네비게이션 (Client Component)
 * Server Component의 children을 받아서 표시
 */

'use client';

import { Suspense, ReactNode } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
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

// 각 탭에 대한 URL 매핑
const tabUrlMap: Record<string, string> = {
  all: '/archive/recipes',
  modern: '/recipes',
  royal: '/royal-recipes',
  mfds: '/recipes/mfds',
  baby: '/archive/recipes?tab=baby',
  gruel: '/archive/recipes?tab=gruel',
  special: '/archive/recipes?tab=special',
  vegan: '/archive/recipes?tab=vegan',
};

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
  const router = useRouter();
  const pathname = usePathname();
  
  // 현재 경로에 따라 초기 탭 결정
  const getInitialTab = () => {
    // 쿼리 파라미터에서 tab 값이 있으면 우선 사용
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      return tabParam;
    }
    
    // 경로에 따라 탭 결정
    if (pathname === '/royal-recipes') {
      return 'royal';
    }
    if (pathname === '/recipes' || pathname.startsWith('/recipes/')) {
      if (pathname === '/recipes/mfds') {
        return 'mfds';
      }
      return 'modern';
    }
    if (pathname === '/archive/recipes') {
      return 'all';
    }
    
    return 'all';
  };
  
  const initialTab = getInitialTab();

  // 탭 변경 핸들러
  const handleTabChange = (value: string) => {
    const targetUrl = tabUrlMap[value];
    if (targetUrl) {
      // 현재 경로와 다른 경우에만 이동
      if (pathname !== targetUrl.split('?')[0]) {
        router.push(targetUrl);
      } else if (targetUrl.includes('?')) {
        // 같은 경로지만 쿼리 파라미터가 다른 경우
        router.push(targetUrl);
      }
    }
  };

  return (
    <Tabs defaultValue={initialTab} onValueChange={handleTabChange} className="w-full relative">
      <TabsList className="grid w-full grid-cols-2 gap-2 mb-12 relative z-10" style={{ pointerEvents: 'auto' }}>
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
