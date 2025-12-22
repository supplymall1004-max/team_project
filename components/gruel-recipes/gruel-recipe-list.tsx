/**
 * @file gruel-recipe-list.tsx
 * @description 죽 레시피 목록 컴포넌트
 *
 * 주요 기능:
 * 1. 분류별 필터 (기력 회복, 소화 촉진, 해독, 두뇌 활성화, 입맛 돋우기)
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
import { Search, Clock, Soup, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// 죽 레시피 타입 정의
export interface GruelRecipe {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  category: "energy" | "digestion" | "detox" | "brain" | "appetite" | "side";
  cooking_time_minutes?: number;
  difficulty?: "easy" | "medium" | "hard";
}

// 초기 레시피 데이터 (docs/royalrecipe/Gruel.md 기반)
const initialRecipes: GruelRecipe[] = [
  // 기력 회복 및 보양
  {
    id: "gruel-1",
    title: "전복죽",
    description: "내장을 함께 볶아 진한 바다 향과 영양을 잡는 보양죽",
    category: "energy",
    cooking_time_minutes: 60,
    difficulty: "medium",
  },
  {
    id: "gruel-2",
    title: "닭죽",
    description: "운동선수들이 가장 선호하는 보양죽",
    category: "energy",
    cooking_time_minutes: 50,
    difficulty: "medium",
  },
  {
    id: "gruel-9",
    title: "굴죽",
    description: "겨울철 최고의 보양식으로, 부드럽고 풍부한 감칠맛이 특징",
    category: "energy",
    cooking_time_minutes: 40,
    difficulty: "easy",
  },
  {
    id: "gruel-16",
    title: "전복 내장 죽",
    description: "일반 전복죽보다 훨씬 진한 풍미를 자랑하며, 전복의 영양이 응축된 보양식",
    category: "energy",
    cooking_time_minutes: 65,
    difficulty: "hard",
  },
  {
    id: "gruel-19",
    title: "마 대추죽",
    description: "'산속의 장어'라 불리는 마와 마음을 안정시키는 대추를 활용한 보양 죽",
    category: "energy",
    cooking_time_minutes: 45,
    difficulty: "medium",
  },
  // 소화 촉진 및 위장 보호
  {
    id: "gruel-3",
    title: "단호박죽",
    description: "부드러운 식감과 천연의 단맛으로 경기 전 긴장된 위장을 달래기에 좋은 죽",
    category: "digestion",
    cooking_time_minutes: 30,
    difficulty: "easy",
  },
  {
    id: "gruel-6",
    title: "야채채소죽",
    description: "속이 아주 불편하거나 가벼운 식사를 원할 때 추천하는 가장 기본에 충실한 죽",
    category: "digestion",
    cooking_time_minutes: 35,
    difficulty: "easy",
  },
  {
    id: "gruel-12",
    title: "명란 계란죽",
    description: "감칠맛이 뛰어난 명란젓을 활용해 별도의 육수 없이도 깊은 맛을 내는 죽",
    category: "digestion",
    cooking_time_minutes: 25,
    difficulty: "easy",
  },
  {
    id: "gruel-18",
    title: "시금치 된장죽",
    description: "입맛 없는 아침에 구수한 된장 향과 부드러운 시금치가 소화를 돕는 건강 죽",
    category: "digestion",
    cooking_time_minutes: 30,
    difficulty: "easy",
  },
  // 해독 및 붓기 제거
  {
    id: "gruel-7",
    title: "낙지김치죽",
    description: "매콤한 맛과 쫄깃한 식감이 일품인 해장용 및 별미 죽",
    category: "detox",
    cooking_time_minutes: 40,
    difficulty: "medium",
  },
  {
    id: "gruel-15",
    title: "팥죽",
    description: "설탕을 넣어 달콤하게 먹거나, 소금을 넣어 담백하게 즐길 수 있는 전통 보양죽",
    category: "detox",
    cooking_time_minutes: 90,
    difficulty: "medium",
  },
  {
    id: "gruel-20",
    title: "감자 옹심이죽",
    description: "쌀 대신 감자의 전분을 활용해 쫄깃한 식감을 극대화한 별미 죽",
    category: "detox",
    cooking_time_minutes: 50,
    difficulty: "medium",
  },
  // 두뇌 활성화 및 영양
  {
    id: "gruel-8",
    title: "잣죽",
    description: "기력을 보충하고 두뇌 회전에 도움을 주는 영양 만점의 고소한 죽",
    category: "brain",
    cooking_time_minutes: 45,
    difficulty: "medium",
  },
  {
    id: "gruel-11",
    title: "흑임자죽",
    description: "예로부터 고령자나 환자의 보양식으로 인기가 많은, 고소한 향이 일품인 죽",
    category: "brain",
    cooking_time_minutes: 50,
    difficulty: "medium",
  },
  {
    id: "gruel-17",
    title: "흑미 잣죽",
    description: "일반 흰 쌀 대신 흑미를 섞어 안토시아닌이 풍부하고 색감까지 고급스러운 죽",
    category: "brain",
    cooking_time_minutes: 55,
    difficulty: "medium",
  },
  {
    id: "gruel-21",
    title: "땅콩죽",
    description: "잣죽보다 더 진한 고소함을 원할 때 추천하는 영양식",
    category: "brain",
    cooking_time_minutes: 40,
    difficulty: "easy",
  },
  // 어린이 및 입맛 돋우기
  {
    id: "gruel-4",
    title: "소고기버섯죽",
    description: "단백질과 식이섬유가 풍부하여 한 끼 식사로 가장 든든한 죽",
    category: "appetite",
    cooking_time_minutes: 35,
    difficulty: "medium",
  },
  {
    id: "gruel-5",
    title: "새우계란죽",
    description: "재료 준비가 간단하고 소화가 매우 잘 되어 아침 식사로 제격",
    category: "appetite",
    cooking_time_minutes: 20,
    difficulty: "easy",
  },
  {
    id: "gruel-10",
    title: "옥수수 우유죽",
    description: "아이들도 좋아하고 간편하게 에너지를 보충하기 좋은 '스프형' 죽",
    category: "appetite",
    cooking_time_minutes: 15,
    difficulty: "easy",
  },
  {
    id: "gruel-13",
    title: "표고버섯 들깨죽",
    description: "고소한 들깨가루와 쫄깃한 표고버섯이 만나 보약 같은 한 그릇",
    category: "appetite",
    cooking_time_minutes: 40,
    difficulty: "medium",
  },
  {
    id: "gruel-14",
    title: "브로콜리 치즈죽",
    description: "서양식 리조또와 한국식 죽의 중간 느낌으로, 소화가 잘 되면서도 아이들이 정말 좋아합니다",
    category: "appetite",
    cooking_time_minutes: 25,
    difficulty: "easy",
  },
  // 반찬
  {
    id: "gruel-side-1",
    title: "소고기 장조림",
    description: "죽과 곁들였을 때 가장 맛있는 장조림은 너무 짜지 않고 결대로 부드럽게 찢어지는 것이 특징",
    category: "side",
    cooking_time_minutes: 80,
    difficulty: "medium",
  },
  {
    id: "gruel-side-2",
    title: "비트 동치미",
    description: "죽의 텁텁함을 씻어주는 분홍빛의 시원하고 깔끔한 동치미",
    category: "side",
    cooking_time_minutes: 30,
    difficulty: "easy",
  },
];

// 분류별 라벨
const categoryLabels: Record<GruelRecipe["category"], string> = {
  energy: "기력 회복 및 보양",
  digestion: "소화 촉진 및 위장 보호",
  detox: "해독 및 붓기 제거",
  brain: "두뇌 활성화 및 영양",
  appetite: "어린이 및 입맛 돋우기",
  side: "반찬",
};

// 분류별 색상
const categoryColors: Record<GruelRecipe["category"], string> = {
  energy: "bg-red-100 text-red-700",
  digestion: "bg-green-100 text-green-700",
  detox: "bg-blue-100 text-blue-700",
  brain: "bg-purple-100 text-purple-700",
  appetite: "bg-yellow-100 text-yellow-700",
  side: "bg-orange-100 text-orange-700",
};

// 난이도 라벨
const difficultyLabels: Record<"easy" | "medium" | "hard", string> = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
};

export function GruelRecipeList() {
  console.log("[GruelRecipeList] 죽 레시피 목록 렌더링");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<GruelRecipe["category"] | "all">("all");

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
    <div className="space-y-6 pt-8">
      {/* 검색 및 필터 */}
      <div className="space-y-4">
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
        <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">분류:</span>
          </div>
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className={selectedCategory === "all" ? "bg-orange-600 hover:bg-orange-700 text-white" : ""}
          >
            전체
          </Button>
          {Object.entries(categoryLabels).map(([category, label]) => {
            const isSelected = selectedCategory === category;
            return (
              <Button
                key={category}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category as GruelRecipe["category"])}
                className={isSelected ? `${categoryColors[category as GruelRecipe["category"]]} border-2` : ""}
                style={{ 
                  zIndex: isSelected ? 10 : 1,
                  position: 'relative',
                  pointerEvents: 'auto',
                }}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </div>

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
            <Link key={recipe.id} href={`/archive/recipes/gruel/${recipe.id}`}>
              <Card className="h-full transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{recipe.title}</CardTitle>
                    <Soup className="h-5 w-5 text-amber-500 flex-shrink-0" />
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
