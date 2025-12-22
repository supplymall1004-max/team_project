/**
 * @file vegan-recipe-list.tsx
 * @description 비건 레시피 목록 컴포넌트
 *
 * 주요 기능:
 * 1. 분류별 필터 (단백질 보충, 장 건강, 혈당 관리, 유제품 대체)
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
import { Search, Clock, Leaf, Filter, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 비건 레시피 타입 정의
export interface VeganRecipe {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  category: "protein" | "digestion" | "blood-sugar" | "dairy-free";
  cooking_time_minutes?: number;
  difficulty?: "easy" | "medium" | "hard";
  hasWarning?: boolean; // 주의사항이 있는 레시피
}

// 초기 레시피 데이터 (docs/royalrecipe/Vegan Recipes.md 기반)
const initialRecipes: VeganRecipe[] = [
  // 단백질 보충 및 근력 유지군
  {
    id: "vegan-1",
    title: "병아리콩 토마토 파스타",
    description: "Zero-Waste 스타일, 병아리콩은 훌륭한 식물성 단백질원",
    category: "protein",
    cooking_time_minutes: 25,
    difficulty: "easy",
    hasWarning: true,
  },
  {
    id: "vegan-2",
    title: "렌틸콩 채소 스튜",
    description: "One-Pot 조리법, 렌틸콩은 재배 시 물을 아주 적게 사용하는 지속가능 작물",
    category: "protein",
    cooking_time_minutes: 30,
    difficulty: "easy",
    hasWarning: true,
  },
  {
    id: "vegan-3",
    title: "두부 으깨기",
    description: "Plant-Forward 스타일, 달걀 대신 두부를 활용한 아침 식사",
    category: "protein",
    cooking_time_minutes: 15,
    difficulty: "easy",
  },
  {
    id: "vegan-4",
    title: "병아리콩 샌드위치",
    description: "닭고기 샌드위치와 비슷한 식감을 내지만 환경 파괴가 없는 레시피",
    category: "protein",
    cooking_time_minutes: 20,
    difficulty: "easy",
    hasWarning: true,
  },
  {
    id: "vegan-5",
    title: "느타리버섯 풀드포크",
    description: "느타리버섯을 가늘게 찢어 구우면 결대로 씹히는 고기의 식감",
    category: "protein",
    cooking_time_minutes: 20,
    difficulty: "medium",
  },
  {
    id: "vegan-6",
    title: "두부 감자 짜글이",
    description: "고기 없이 두부의 부드러움과 감자의 포슬포슬한 식감만으로 깊은 맛을 내는 한국식 비건 스튜",
    category: "protein",
    cooking_time_minutes: 25,
    difficulty: "easy",
  },
  // 장 건강 및 디톡스군
  {
    id: "vegan-7",
    title: "단호박 조림",
    description: "껍질째 구운 단호박과 견과류 간장 조림, 제로 웨이스트 레시피",
    category: "digestion",
    cooking_time_minutes: 20,
    difficulty: "easy",
    hasWarning: true,
  },
  {
    id: "vegan-8",
    title: "양배추 스테이크",
    description: "양배추를 두툼하게 썰어 스테이크처럼 구우면 채소의 단맛이 극대화",
    category: "digestion",
    cooking_time_minutes: 15,
    difficulty: "easy",
    hasWarning: true,
  },
  {
    id: "vegan-9",
    title: "컬리플라워 라이스 비빔밥",
    description: "탄수화물 대신 채소 섭취를 극대화하는 레시피",
    category: "digestion",
    cooking_time_minutes: 15,
    difficulty: "easy",
    hasWarning: true,
  },
  {
    id: "vegan-10",
    title: "브로콜리 줄기 강정",
    description: "보통 버려지는 브로콜리 줄기를 활용한 제로 웨이스트 레시피",
    category: "digestion",
    cooking_time_minutes: 20,
    difficulty: "medium",
    hasWarning: true,
  },
  // 혈당 관리 및 항염증군
  {
    id: "vegan-11",
    title: "오트밀 버섯 리조또",
    description: "우유나 치즈 없이도 오트밀 자체의 전분기를 이용해 크리미한 맛",
    category: "blood-sugar",
    cooking_time_minutes: 20,
    difficulty: "medium",
    hasWarning: true,
  },
  {
    id: "vegan-12",
    title: "퀴노아 아보카도 포케볼",
    description: "포케는 조리 과정에서 불 사용을 최소화하여 에너지를 아끼는 지속가능 메뉴",
    category: "blood-sugar",
    cooking_time_minutes: 15,
    difficulty: "easy",
    hasWarning: true,
  },
  {
    id: "vegan-13",
    title: "새송이버섯 관자 스테이크",
    description: "새송이버섯의 기둥 부분을 활용하면 관자와 유사한 식감",
    category: "blood-sugar",
    cooking_time_minutes: 15,
    difficulty: "medium",
  },
  {
    id: "vegan-14",
    title: "가지 강정",
    description: "가지는 수분이 많아 고기보다 탄소 배출량이 훨씬 적은 친환경 식재료",
    category: "blood-sugar",
    cooking_time_minutes: 20,
    difficulty: "medium",
  },
  // 유제품 대체 및 심신 안정군
  {
    id: "vegan-15",
    title: "캐슈넛 크림 시금치 파스타",
    description: "우유나 크림 대신 견과류를 사용한 레시피",
    category: "dairy-free",
    cooking_time_minutes: 25,
    difficulty: "medium",
    hasWarning: true,
  },
  {
    id: "vegan-16",
    title: "단호박 코코넛 커리",
    description: "우유나 생크림 대신 코코넛 밀크를 사용해 탄소 배출을 줄인 레시피",
    category: "dairy-free",
    cooking_time_minutes: 25,
    difficulty: "easy",
  },
  {
    id: "vegan-17",
    title: "두유 들깨 칼국수",
    description: "우유나 생크림 대신 두유를 사용해 탄소 발자국을 줄인 레시피",
    category: "dairy-free",
    cooking_time_minutes: 20,
    difficulty: "easy",
  },
  {
    id: "vegan-18",
    title: "순두부 치즈풍 파스타",
    description: "치즈 대신 순두부의 단백함을 이용해 Plant-based Creamy Sauce를 만드는 방식",
    category: "dairy-free",
    cooking_time_minutes: 20,
    difficulty: "easy",
  },
];

// 분류별 라벨
const categoryLabels: Record<VeganRecipe["category"], string> = {
  protein: "단백질 보충 및 근력 유지",
  digestion: "장 건강 및 디톡스",
  "blood-sugar": "혈당 관리 및 항염증",
  "dairy-free": "유제품 대체 및 심신 안정",
};

// 분류별 색상
const categoryColors: Record<VeganRecipe["category"], string> = {
  protein: "bg-blue-100 text-blue-700",
  digestion: "bg-green-100 text-green-700",
  "blood-sugar": "bg-purple-100 text-purple-700",
  "dairy-free": "bg-yellow-100 text-yellow-700",
};

// 난이도 라벨
const difficultyLabels: Record<"easy" | "medium" | "hard", string> = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
};

export function VeganRecipeList() {
  console.log("[VeganRecipeList] 비건 레시피 목록 렌더링");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<VeganRecipe["category"] | "all">("all");

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
              console.log("[VeganRecipeList] 전체 버튼 클릭");
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
                  console.log(`[VeganRecipeList] ${label} 버튼 클릭`);
                  setSelectedCategory(category as VeganRecipe["category"]);
                }}
                className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-8 px-3 ${
                  isSelected 
                    ? `${categoryColors[category as VeganRecipe["category"]]} border-2` 
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
      <Alert className="border-emerald-200 bg-emerald-50 relative z-0">
        <AlertTriangle className="h-4 w-4 text-emerald-600" />
        <AlertDescription className="text-emerald-800">
          <strong>중요:</strong> 비건 식단은 비타민 B12, 철분, 오메가-3 등 특정 영양소 보충이 필요할 수 있습니다. 
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
            <Link key={recipe.id} href={`/archive/recipes/vegan/${recipe.id}`}>
              <Card className="h-full transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{recipe.title}</CardTitle>
                    <Leaf className="h-5 w-5 text-emerald-500 flex-shrink-0" />
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
