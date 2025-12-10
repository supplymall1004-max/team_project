/**
 * @file recipe-archive-preview.tsx
 * @description 레시피 아카이브 미리보기 컴포넌트
 *
 * 주요 기능:
 * 1. 현대 레시피, 궁중 레시피, 식약처 레시피 미리보기
 * 2. 각 카테고리별 대표 레시피 2-3개 표시
 * 3. 전체보기 링크 제공
 */

import Link from 'next/link';
import { Section } from '@/components/section';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, ChefHat, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export async function RecipeArchivePreview() {
  return (
    <Section
      id="recipe-archive"
      className="bg-orange-50/50"
      title="📚 레시피 아카이브"
      description="현대부터 전통까지, 모든 요리 지식을 한 곳에서"
    >
      <div className="space-y-6">
        {/* 현대 레시피 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-orange-600" />
              📖 현대 레시피
            </h3>
            <Button asChild variant="ghost" size="sm">
              <Link href="/archive/recipes?tab=modern">
                더보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <div className="aspect-video bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">레시피 이미지</span>
                  </div>
                  <CardTitle className="text-base">레시피 제목 {i}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span>⭐⭐⭐⭐</span>
                    <span>난이도: 중</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full group-hover:bg-orange-50">
                    <Link href="/recipes">상세보기</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 궁중 레시피 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-orange-600" />
              👑 궁중 레시피
            </h3>
            <Button asChild variant="ghost" size="sm">
              <Link href="/archive/recipes?tab=royal">
                더보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: '삼국시대', count: 14 },
              { name: '고려시대', count: 16 },
              { name: '조선시대', count: 20 },
            ].map((era) => (
              <Card key={era.name} className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <div className="aspect-video bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">{era.name}</span>
                  </div>
                  <CardTitle className="text-base">{era.name}</CardTitle>
                  <CardDescription>레시피 {era.count}개</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full group-hover:bg-orange-50">
                    <Link href={`/royal-recipes/${era.name.toLowerCase()}`}>더보기</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 식약처 레시피 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-600" />
              🏛️ 식약처 레시피
            </h3>
            <Button asChild variant="ghost" size="sm">
              <Link href="/archive/recipes?tab=mfds">
                더보기 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i} className="hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader>
                  <div className="aspect-video bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">식약처 레시피</span>
                  </div>
                  <CardTitle className="text-base">식약처 레시피 {i}</CardTitle>
                  <CardDescription>칼로리: 250kcal</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full group-hover:bg-orange-50">
                    <Link href="/recipes/mfds">더보기</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 전체보기 버튼 */}
        <div className="flex justify-center pt-4">
          <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700">
            <Link href="/archive/recipes">
              레시피 아카이브 전체보기 <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}

