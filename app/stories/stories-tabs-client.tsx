/**
 * @file stories-tabs-client.tsx
 * @description 스토리 탭 네비게이션 클라이언트 컴포넌트
 */

"use client";

import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReactNode } from 'react';

interface StoriesTabsClientProps {
  allContent: ReactNode;
  storybookContent: ReactNode;
  folktaleContent: ReactNode;
  reversalContent: ReactNode;
  earthContent: ReactNode;
}

export function StoriesTabsClient({
  allContent,
  storybookContent,
  folktaleContent,
  reversalContent,
  earthContent,
}: StoriesTabsClientProps) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';

  return (
    <Tabs defaultValue={initialTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-6">
        <TabsTrigger value="all">전체</TabsTrigger>
        <TabsTrigger value="storybook">장고의 음식 동화</TabsTrigger>
        <TabsTrigger value="folktale">장고의 전래동화</TabsTrigger>
        <TabsTrigger value="reversal">장고의 반전동화</TabsTrigger>
        <TabsTrigger value="earth">장고의 지구동화</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-8">
        {allContent}
      </TabsContent>

      <TabsContent value="storybook">
        {storybookContent}
      </TabsContent>

      <TabsContent value="folktale">
        {folktaleContent}
      </TabsContent>

      <TabsContent value="reversal">
        {reversalContent}
      </TabsContent>

      <TabsContent value="earth">
        {earthContent}
      </TabsContent>
    </Tabs>
  );
}

