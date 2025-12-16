/**
 * @file baby-recipe-list.tsx
 * @description 이유식 레시피 목록 컴포넌트
 *
 * 주요 기능:
 * 1. 이유식 단계별 필터 (초기/중기/후기/완료기)
 * 2. 월령별 필터 (4-6개월, 7-8개월, 9-11개월, 12개월+)
 * 3. 레시피 카드 그리드 표시
 * 4. 검색 기능
 *
 * @dependencies
 * - React 19
 * - Tailwind CSS v4
 * - lucide-react (아이콘)
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Clock, Baby, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// 이유식 레시피 타입 정의
export interface BabyRecipe {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  stage: "initial" | "middle" | "late" | "complete";
  age_months_min: number;
  age_months_max?: number;
  cooking_time_minutes?: number;
  difficulty?: "easy" | "medium" | "hard";
}

// 초기 레시피 데이터 (docs/baby.md 기반)
const initialRecipes: BabyRecipe[] = [
  // 초기 (4-6개월)
  {
    id: "baby-1",
    title: "쌀 미음",
    description: "이유식의 첫 시작, 부드러운 쌀 미음",
    stage: "initial",
    age_months_min: 4,
    age_months_max: 6,
    cooking_time_minutes: 30,
    difficulty: "easy",
  },
  {
    id: "baby-2",
    title: "소고기 미음",
    description: "초기 필수 레시피, 철분이 풍부한 소고기 미음",
    stage: "initial",
    age_months_min: 4,
    age_months_max: 6,
    cooking_time_minutes: 40,
    difficulty: "medium",
  },
  {
    id: "baby-3",
    title: "애호박 미음",
    description: "부드럽고 소화가 잘 되는 애호박 미음",
    stage: "initial",
    age_months_min: 5,
    age_months_max: 6,
    cooking_time_minutes: 25,
    difficulty: "easy",
  },
  {
    id: "baby-4",
    title: "감자 미음",
    description: "탄수화물과 비타민 C가 풍부한 감자 미음",
    stage: "initial",
    age_months_min: 5,
    age_months_max: 6,
    cooking_time_minutes: 30,
    difficulty: "easy",
  },
  {
    id: "baby-5",
    title: "단호박 미음",
    description: "달콤하고 부드러운 단호박 미음",
    stage: "initial",
    age_months_min: 5,
    age_months_max: 6,
    cooking_time_minutes: 25,
    difficulty: "easy",
  },
  {
    id: "baby-6",
    title: "고구마 미음",
    description: "자연스럽게 달콤한 고구마 미음",
    stage: "initial",
    age_months_min: 5,
    age_months_max: 6,
    cooking_time_minutes: 20,
    difficulty: "easy",
  },
  {
    id: "baby-7",
    title: "닭고기 미음",
    description: "고단백, 저지방의 닭고기 미음",
    stage: "initial",
    age_months_min: 6,
    age_months_max: 6,
    cooking_time_minutes: 35,
    difficulty: "medium",
  },
  // 중기 (7-8개월)
  {
    id: "baby-8",
    title: "소고기 브로콜리 죽",
    description: "철분이 풍부한 소고기와 브로콜리를 넣은 부드러운 죽",
    stage: "middle",
    age_months_min: 7,
    age_months_max: 8,
    cooking_time_minutes: 40,
    difficulty: "medium",
  },
  {
    id: "baby-9",
    title: "소고기 청경채 죽",
    description: "철분이 풍부한 소고기와 청경채를 넣은 부드러운 죽",
    stage: "middle",
    age_months_min: 7,
    age_months_max: 8,
    cooking_time_minutes: 40,
    difficulty: "medium",
  },
  {
    id: "baby-10",
    title: "소고기 시금치 죽",
    description: "철분 흡수를 돕는 시금치가 들어간 소고기 죽",
    stage: "middle",
    age_months_min: 7,
    age_months_max: 8,
    cooking_time_minutes: 40,
    difficulty: "medium",
  },
  {
    id: "baby-11",
    title: "닭고기 브로콜리 죽",
    description: "단백질이 풍부한 닭고기와 브로콜리 죽",
    stage: "middle",
    age_months_min: 7,
    age_months_max: 8,
    cooking_time_minutes: 35,
    difficulty: "medium",
  },
  {
    id: "baby-12",
    title: "닭고기 감자 양파 죽",
    description: "은은한 단맛이 나는 닭고기 감자 양파 죽",
    stage: "middle",
    age_months_min: 7,
    age_months_max: 8,
    cooking_time_minutes: 40,
    difficulty: "medium",
  },
  {
    id: "baby-13",
    title: "노른자 양배추 죽",
    description: "영양가 높은 노른자와 양배추를 넣은 죽",
    stage: "middle",
    age_months_min: 7,
    age_months_max: 8,
    cooking_time_minutes: 35,
    difficulty: "medium",
  },
  {
    id: "baby-14",
    title: "두부 애호박 죽",
    description: "부드러운 두부와 애호박을 넣은 영양 만점 죽",
    stage: "middle",
    age_months_min: 7,
    age_months_max: 8,
    cooking_time_minutes: 30,
    difficulty: "easy",
  },
  // 후기 (9-11개월)
  {
    id: "baby-15",
    title: "닭고기 청경채 진밥",
    description: "닭고기와 청경채를 넣은 무른 진밥",
    stage: "late",
    age_months_min: 9,
    age_months_max: 11,
    cooking_time_minutes: 45,
    difficulty: "medium",
  },
  {
    id: "baby-16",
    title: "대구살 무 진밥",
    description: "부드러운 대구살과 무를 넣은 진밥",
    stage: "late",
    age_months_min: 9,
    age_months_max: 11,
    cooking_time_minutes: 50,
    difficulty: "medium",
  },
  {
    id: "baby-17",
    title: "소고기 버섯 채소 진밥",
    description: "표고버섯과 채소가 들어간 소고기 진밥",
    stage: "late",
    age_months_min: 9,
    age_months_max: 11,
    cooking_time_minutes: 45,
    difficulty: "medium",
  },
  {
    id: "baby-18",
    title: "두부 브로콜리 진밥",
    description: "식물성 단백질 두부와 브로콜리 진밥",
    stage: "late",
    age_months_min: 9,
    age_months_max: 11,
    cooking_time_minutes: 40,
    difficulty: "easy",
  },
  {
    id: "baby-19",
    title: "채소 계란말이/찜",
    description: "데친 당근, 양파, 시금치를 넣은 부드러운 계란 요리",
    stage: "late",
    age_months_min: 9,
    age_months_max: 11,
    cooking_time_minutes: 15,
    difficulty: "medium",
  },
  {
    id: "baby-20",
    title: "생선 감자 무른 밥",
    description: "가시를 제거한 흰살 생선과 으깬 감자를 올린 무른 밥",
    stage: "late",
    age_months_min: 9,
    age_months_max: 11,
    cooking_time_minutes: 45,
    difficulty: "medium",
  },
  // 완료기 (12개월+)
  {
    id: "baby-21",
    title: "아기용 덮밥/국밥",
    description: "다양한 채소와 고기를 넣은 아기용 덮밥 또는 국밥",
    stage: "complete",
    age_months_min: 12,
    cooking_time_minutes: 30,
    difficulty: "medium",
  },
  {
    id: "baby-22",
    title: "아기용 채소 주먹밥",
    description: "손으로 집어 먹을 수 있는 채소 주먹밥",
    stage: "complete",
    age_months_min: 12,
    cooking_time_minutes: 20,
    difficulty: "easy",
  },
  {
    id: "baby-23",
    title: "아기 두부 계란국",
    description: "부드러운 두부와 계란이 들어간 국",
    stage: "complete",
    age_months_min: 12,
    cooking_time_minutes: 15,
    difficulty: "easy",
  },
  {
    id: "baby-24",
    title: "삼치/고등어 살구이",
    description: "뼈를 제거한 흰살 생선 구이",
    stage: "complete",
    age_months_min: 12,
    cooking_time_minutes: 20,
    difficulty: "medium",
  },
  {
    id: "baby-25",
    title: "부드러운 과일",
    description: "잘게 자른 바나나, 익은 배, 수박 등 손가락으로 집을 수 있는 크기",
    stage: "complete",
    age_months_min: 12,
    cooking_time_minutes: 5,
    difficulty: "easy",
  },
];

// 단계별 라벨
const stageLabels: Record<BabyRecipe["stage"], string> = {
  initial: "초기 (4~6개월)",
  middle: "중기 (7~8개월)",
  late: "후기 (9~11개월)",
  complete: "완료기 (12개월+)",
};

// 단계별 색상
const stageColors: Record<BabyRecipe["stage"], string> = {
  initial: "bg-pink-100 text-pink-700",
  middle: "bg-rose-100 text-rose-700",
  late: "bg-purple-100 text-purple-700",
  complete: "bg-indigo-100 text-indigo-700",
};

// 난이도 라벨
const difficultyLabels: Record<"easy" | "medium" | "hard", string> = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
};

export function BabyRecipeList() {
  console.log("[BabyRecipeList] 이유식 레시피 목록 렌더링");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<BabyRecipe["stage"] | "all">("all");
  const [selectedAge, setSelectedAge] = useState<number | "all">("all");

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

      // 단계 필터
      if (selectedStage !== "all" && recipe.stage !== selectedStage) {
        return false;
      }

      // 월령 필터
      if (selectedAge !== "all") {
        if (recipe.age_months_max) {
          // 최대 월령이 있는 경우
          if (selectedAge < recipe.age_months_min || selectedAge > recipe.age_months_max) {
            return false;
          }
        } else {
          // 최대 월령이 없는 경우 (12개월+)
          if (selectedAge < recipe.age_months_min) {
            return false;
          }
        }
      }

      return true;
    });
  }, [searchQuery, selectedStage, selectedAge]);

  return (
    <div className="space-y-6">
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
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">단계:</span>
          </div>
          <Button
            variant={selectedStage === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStage("all")}
          >
            전체
          </Button>
          {Object.entries(stageLabels).map(([stage, label]) => (
            <Button
              key={stage}
              variant={selectedStage === stage ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStage(stage as BabyRecipe["stage"])}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700">월령:</span>
          <Button
            variant={selectedAge === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedAge("all")}
          >
            전체
          </Button>
          <Button
            variant={selectedAge === 4 ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedAge(4)}
          >
            4~6개월
          </Button>
          <Button
            variant={selectedAge === 7 ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedAge(7)}
          >
            7~8개월
          </Button>
          <Button
            variant={selectedAge === 9 ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedAge(9)}
          >
            9~11개월
          </Button>
          <Button
            variant={selectedAge === 12 ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedAge(12)}
          >
            12개월+
          </Button>
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
            <Link key={recipe.id} href={`/archive/recipes/baby/${recipe.id}`}>
              <Card className="h-full transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{recipe.title}</CardTitle>
                    <Baby className="h-5 w-5 text-pink-500 flex-shrink-0" />
                  </div>
                  <CardDescription>{recipe.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={stageColors[recipe.stage]}>
                      {stageLabels[recipe.stage]}
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
                    <div className="flex items-center gap-1">
                      <span>
                        {recipe.age_months_min}개월
                        {recipe.age_months_max ? `~${recipe.age_months_max}개월` : "+"}
                      </span>
                    </div>
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
