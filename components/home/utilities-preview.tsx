/**
 * @file utilities-preview.tsx
 * @description 유틸리티 미리보기 컴포넌트
 *
 * 주요 기능:
 * 1. 응급조치, 자주 구매하는 식자재, 빠른 검색 미리보기
 * 2. 각 기능별 요약 정보 표시
 * 3. 전체보기 링크 제공
 */

import Link from 'next/link';
import { Section } from '@/components/section';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertTriangle, ShoppingCart, Search } from 'lucide-react';

export async function UtilitiesPreview() {
  return (
    <Section
      id="utilities"
      className="bg-gray-50/50"
      title="🛠️ 유틸리티"
      description="편리한 기능들로 요리와 건강 관리를 더 쉽게"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 응급조치 */}
        <Card className="hover:shadow-lg transition-all cursor-pointer group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              🚨 응급조치
            </CardTitle>
            <CardDescription>알레르기 응급 대응 가이드</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              알레르기 반응 시 즉시 대응할 수 있는 가이드를 제공합니다
            </p>
            <Button asChild variant="outline" className="w-full group-hover:bg-red-50">
              <Link href="/health/emergency">
                더보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* 자주 구매하는 식자재 */}
        <Card className="hover:shadow-lg transition-all cursor-pointer group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-gray-600" />
              🛒 자주 구매하는 식자재
            </CardTitle>
            <CardDescription>장보기 편의 기능</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              자주 구매하는 식자재를 빠르게 확인하고 장보기 리스트에 추가하세요
            </p>
            <Button asChild variant="outline" className="w-full group-hover:bg-gray-100">
              <Link href="/shopping/frequent">
                더보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* 빠른 검색 */}
        <Card className="hover:shadow-lg transition-all cursor-pointer group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-600" />
              🔍 빠른 검색
            </CardTitle>
            <CardDescription>통합 검색 기능</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              레시피, 식단, 건강 정보를 한 번에 검색하세요
            </p>
            <Button asChild variant="outline" className="w-full group-hover:bg-gray-100">
              <Link href="/search">
                검색하기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}

