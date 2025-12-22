/**
 * @file special-recipe-list.tsx
 * @description 특수 레시피 목록 컴포넌트
 *
 * 주요 기능:
 * 1. 분류별 필터 (디톡스, 염증 완화, 대사 활성, 면역 지원, 급성 증상 완화)
 * 2. 레시피 카드 그리드 표시
 * 3. 검색 기능
 *
 * @dependencies
 * - React 19
 * - Tailwind CSS v4
 * - lucide-react (아이콘)
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Clock, FlaskConical, Filter, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 특수 레시피 타입 정의
export interface SpecialRecipe {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  category: "detox" | "anti-inflammatory" | "metabolic" | "immune" | "emergency";
  cooking_time_minutes?: number;
  difficulty?: "easy" | "medium" | "hard";
  hasWarning?: boolean; // 주의사항이 있는 레시피
}

// 초기 레시피 데이터 (docs/royalrecipe/special recipe.md 기반)
const initialRecipes: SpecialRecipe[] = [
  // 디톡스 및 정화
  {
    id: "special-1",
    title: "해독주스",
    description: "서재걸 박사 레시피 기반, 채소를 삶아서 가는 것이 핵심",
    category: "detox",
    cooking_time_minutes: 20,
    difficulty: "easy",
    hasWarning: true,
  },
  {
    id: "special-2",
    title: "ABC 주스",
    description: "사과, 비트, 당근의 앞 글자를 딴 주스로 내장지방 배출에 탁월",
    category: "detox",
    cooking_time_minutes: 10,
    difficulty: "easy",
    hasWarning: true,
  },
  {
    id: "special-4",
    title: "오토파지 주스",
    description: "세포 스스로가 노폐물을 먹어 치우는 '자가포식' 원리를 이용한 해독 레시피",
    category: "detox",
    cooking_time_minutes: 15,
    difficulty: "easy",
    hasWarning: true,
  },
  // 염증 및 통증 완화
  {
    id: "special-6",
    title: "골든 밀크",
    description: "인도 전통 의학 아유르베다에서 유래된 음료로, 강황의 커큐민 성분으로 체내 염증을 줄임",
    category: "anti-inflammatory",
    cooking_time_minutes: 10,
    difficulty: "easy",
  },
  {
    id: "special-8",
    title: "양배추 사과 당근즙",
    description: "양배추의 비타민 U와 당근의 베타카로틴을 활용해 위장 장애를 해결하는 '천연 소화제'",
    category: "anti-inflammatory",
    cooking_time_minutes: 15,
    difficulty: "easy",
  },
  // 대사 및 에너지 활성
  {
    id: "special-7",
    title: "방탄커피",
    description: "지방을 에너지원으로 사용하는 상태로 유도하여 아침 집중력을 폭발적으로 높여줌",
    category: "metabolic",
    cooking_time_minutes: 5,
    difficulty: "easy",
    hasWarning: true,
  },
  {
    id: "special-9",
    title: "시나몬 물",
    description: "인슐린 저항성을 개선하고 혈액 속 불필요한 당과 노폐물을 배출하는 데 도움",
    category: "metabolic",
    cooking_time_minutes: 30,
    difficulty: "easy",
    hasWarning: true,
  },
  {
    id: "special-5",
    title: "레몬 소금물",
    description: "격렬한 운동 후나 아침 기상 직후 전해질 불균형을 즉각 해소",
    category: "metabolic",
    cooking_time_minutes: 2,
    difficulty: "easy",
    hasWarning: true,
  },
  // 면역 및 항균
  {
    id: "special-3",
    title: "꿀마늘",
    description: "체력이 급격히 떨어졌거나 환절기 면역력이 필요할 때 먹는 '약선' 레시피",
    category: "immune",
    cooking_time_minutes: 15,
    difficulty: "easy",
    hasWarning: true,
  },
  // 급성 증상 완화
  {
    id: "special-10",
    title: "숯가루 미음",
    description: "매우 특수한 상황(식중독 초기, 급성 설사, 가스 정체)에서 독소를 흡착하여 배출",
    category: "emergency",
    cooking_time_minutes: 2,
    difficulty: "easy",
    hasWarning: true,
  },
];

// 분류별 라벨
const categoryLabels: Record<SpecialRecipe["category"], string> = {
  detox: "디톡스 및 정화",
  "anti-inflammatory": "염증 및 통증 완화",
  metabolic: "대사 및 에너지 활성",
  immune: "면역 및 항균",
  emergency: "급성 증상 완화",
};

// 분류별 색상
const categoryColors: Record<SpecialRecipe["category"], string> = {
  detox: "bg-green-100 text-green-700",
  "anti-inflammatory": "bg-red-100 text-red-700",
  metabolic: "bg-blue-100 text-blue-700",
  immune: "bg-yellow-100 text-yellow-700",
  emergency: "bg-orange-100 text-orange-700",
};

// 난이도 라벨
const difficultyLabels: Record<"easy" | "medium" | "hard", string> = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
};

export function SpecialRecipeList() {
  console.log("[SpecialRecipeList] 특수 레시피 목록 렌더링");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SpecialRecipe["category"] | "all">("all");

  // 필터링된 레시피
  const filteredRecipes = useMemo(() => {
    return initialRecipes.filter((recipe) => {
      // 검색어 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !recipe.title.toLowerCase().includes(query) &&
          !recipe.description.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // 분류 필터
      if (selectedCategory !== "all" && recipe.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="space-y-6 pt-8 relative" style={{ zIndex: 1 }}>
      {/* 검색 및 필터 - 먼저 배치하여 클릭 우선순위 확보 */}
      <div className="space-y-4 relative" style={{ zIndex: 100, pointerEvents: 'auto' }}>
        {/* 검색바 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="레시피 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 필터 */}
        <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b relative" style={{ zIndex: 100, pointerEvents: 'auto' }}>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">분류:</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("[SpecialRecipeList] 전체 버튼 클릭");
              setSelectedCategory("all");
            }}
            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-8 px-3 ${
              selectedCategory === "all" 
                ? "bg-orange-600 hover:bg-orange-700 text-white" 
                : "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground"
            }`}
            style={{ 
              zIndex: 101,
              position: 'relative',
              pointerEvents: 'auto',
              cursor: 'pointer',
            }}
          >
            전체
          </button>
          {Object.entries(categoryLabels).map(([category, label]) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log(`[SpecialRecipeList] ${label} 버튼 클릭`);
                  setSelectedCategory(category as SpecialRecipe["category"]);
                }}
                className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-8 px-3 ${
                  isSelected 
                    ? `${categoryColors[category as SpecialRecipe["category"]]} border-2` 
                    : "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground"
                }`}
                style={{ 
                  zIndex: 101,
                  position: 'relative',
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 주의사항 안내 - 필터 아래로 이동 */}
      <Alert className="border-amber-200 bg-amber-50 relative z-0">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>중요:</strong> 특수 레시피는 일반 음식과 달리 특정 성분의 농도가 높거나 신체 대사에 직접적인 영향을 미칩니다. 
          각 레시피의 주의사항을 반드시 확인하시고, 특정 질환이 있거나 약물을 복용 중인 경우 의사와 상담 후 섭취하세요.
        </AlertDescription>
      </Alert>

      {/* 결과 개수 */}
      <div className="text-sm text-gray-600">
        총 <strong>{filteredRecipes.length}개</strong>의 레시피를 찾았습니다.
      </div>

      {/* 레시피 그리드 */}
      {filteredRecipes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">검색 결과가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <Link key={recipe.id} href={`/archive/recipes/special/${recipe.id}`}>
              <Card className="h-full transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{recipe.title}</CardTitle>
                    <FlaskConical className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  </div>
                  <CardDescription>{recipe.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={categoryColors[recipe.category]}>
                      {categoryLabels[recipe.category]}
                    </Badge>
                    {recipe.difficulty && (
                      <Badge variant="outline">
                        {difficultyLabels[recipe.difficulty]}
                      </Badge>
                    )}
                    {recipe.hasWarning && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        주의
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {recipe.cooking_time_minutes && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{recipe.cooking_time_minutes}분</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
