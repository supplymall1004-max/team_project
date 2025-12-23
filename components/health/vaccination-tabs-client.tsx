/**
 * @file vaccination-tabs-client.tsx
 * @description 예방접종 안내 탭 네비게이션 (Client Component)
 */

'use client';

import { Suspense, ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VaccinationTabsClientProps {
  lifecycleContent: ReactNode;
  situationContent: ReactNode;
  travelContent: ReactNode;
  seasonalContent: ReactNode;
  ageSummaryContent: ReactNode;
}

function VaccinationTabsContent({
  lifecycleContent,
  situationContent,
  travelContent,
  seasonalContent,
  ageSummaryContent,
}: VaccinationTabsClientProps) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'lifecycle';

  return (
    <Tabs defaultValue={initialTab} className="w-full relative">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 mb-12 relative z-50" style={{ pointerEvents: 'auto' }}>
        <TabsTrigger value="lifecycle" className="text-xs sm:text-sm">생애주기별</TabsTrigger>
        <TabsTrigger value="situation" className="text-xs sm:text-sm">상황별</TabsTrigger>
        <TabsTrigger value="travel" className="text-xs sm:text-sm">해외여행</TabsTrigger>
        <TabsTrigger value="seasonal" className="text-xs sm:text-sm">계절별</TabsTrigger>
        <TabsTrigger value="ageSummary" className="text-xs sm:text-sm">나이별 요약</TabsTrigger>
      </TabsList>

      <TabsContent value="lifecycle" className="pt-12 mt-4 relative z-0">
        {lifecycleContent}
      </TabsContent>

      <TabsContent value="situation" className="pt-12 mt-4 relative z-0">
        {situationContent}
      </TabsContent>

      <TabsContent value="travel" className="pt-12 mt-4 relative z-0">
        {travelContent}
      </TabsContent>

      <TabsContent value="seasonal" className="pt-12 mt-4 relative z-0">
        {seasonalContent}
      </TabsContent>

      <TabsContent value="ageSummary" className="pt-12 mt-4 relative z-0">
        {ageSummaryContent}
      </TabsContent>
    </Tabs>
  );
}

export function VaccinationTabsClient(props: VaccinationTabsClientProps) {
  return (
    <Suspense fallback={<div className="py-12 text-center">로딩 중...</div>}>
      <VaccinationTabsContent {...props} />
    </Suspense>
  );
}

