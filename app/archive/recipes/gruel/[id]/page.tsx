/**
 * @file app/archive/recipes/gruel/[id]/page.tsx
 * @description 죽 레시피 상세 페이지
 *
 * 주요 기능:
 * 1. 레시피 상세 정보 표시
 * 2. 단계별 조리 방법
 * 3. 재료 및 영양 정보
 * 4. 분류별 추천 표시
 * 5. 조리 팁
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Soup, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GruelRecipe } from "@/components/gruel-recipes/gruel-recipe-list";
import { DirectionalEntrance } from "@/components/motion/directional-entrance";
import { MotionWrapper } from "@/components/motion/motion-wrapper";
import { StaggerCard } from "@/components/motion/stagger-card";
import { StaggerItem } from "@/components/motion/stagger-item";
import { AnimatedBadge } from "@/components/motion/animated-badge";

// 임시 레시피 데이터 (실제로는 데이터베이스에서 가져옴)
const gruelRecipes: Record<string, GruelRecipe & { 
  ingredients: Array<{ name: string; amount: string; note?: string }>;
  steps: Array<{ step: number; description: string; timer_minutes?: number }>;
  tips?: string[];
  situation?: string;
}> = {
  "gruel-1": {
    id: "gruel-1",
    title: "전복죽",
    description: "내장을 함께 볶아 진한 바다 향과 영양을 잡는 보양죽",
    category: "energy",
    cooking_time_minutes: 60,
    difficulty: "medium",
    situation: "수술 후 회복기, 큰 경기를 앞둔 선수, 체력이 급격히 떨어졌을 때 기운을 북돋워 줍니다",
    ingredients: [
      { name: "전복", amount: "3~4마리" },
      { name: "쌀", amount: "2컵", note: "미리 30분 불림" },
      { name: "참기름", amount: "3큰술" },
      { name: "물", amount: "1.5L", note: "또는 다시마 육수" },
      { name: "국간장", amount: "1큰술" },
      { name: "소금", amount: "약간" },
      { name: "다진 당근/쪽파", amount: "조금" },
    ],
    steps: [
      { step: 1, description: "전복은 솔로 깨끗이 씻어 살과 내장을 분리합니다. 살은 얇게 슬라이스하고, 내장은 가위로 잘게 다지거나 믹서에 살짝 갑니다" },
      { step: 2, description: "냄비에 참기름 2큰술을 두르고 다진 내장을 먼저 볶아 비린내를 날립니다" },
      { step: 3, description: "불린 쌀을 넣고 쌀알이 투명해질 때까지 충분히 볶습니다. 이때 내장의 색이 쌀에 골고루 입혀져야 합니다" },
      { step: 4, description: "물(혹은 육수)을 붓고 강불에서 끓이다가, 끓어오르면 약불로 줄여 가끔 저어주며 쌀알이 퍼질 때까지 끓입니다" },
      { step: 5, description: "쌀이 거의 다 퍼졌을 때 썰어둔 전복 살과 당근을 넣습니다. 국간장과 소금으로 간을 맞춘 후 참기름 1큰술을 둘러 마무리합니다" },
    ],
    tips: [
      "쌀 불리기: 최소 30분 이상 불려야 쌀알이 겉돌지 않고 부드럽게 퍼집니다",
      "물 조절: 보통 쌀 양의 5~6배의 물을 잡는 것이 적당합니다",
      "마지막 간: 죽은 식으면서 간이 더 세게 느껴질 수 있으므로, 조리 직후에는 살짝 심심하게 맞추는 것이 좋습니다",
    ],
  },
  "gruel-2": {
    id: "gruel-2",
    title: "닭죽",
    description: "운동선수들이 가장 선호하는 보양죽",
    category: "energy",
    cooking_time_minutes: 50,
    difficulty: "medium",
    situation: "수술 후 회복기, 큰 경기를 앞둔 선수, 체력이 급격히 떨어졌을 때 기운을 북돋워 줍니다",
    ingredients: [
      { name: "닭", amount: "한 마리", note: "또는 닭가슴살 400g" },
      { name: "찹쌀", amount: "1.5컵" },
      { name: "마늘", amount: "10알" },
      { name: "대파", amount: "1대" },
      { name: "양파", amount: "1/2개" },
      { name: "통후추", amount: "약간" },
      { name: "부추 혹은 쪽파", amount: "고명용" },
      { name: "깨", amount: "고명용" },
    ],
    steps: [
      { step: 1, description: "냄비에 닭과 육수 재료를 넣고 40분 정도 푹 삶습니다. 삶은 닭은 건져내어 살코기만 결대로 찢어둡니다" },
      { step: 2, description: "육수 내기에 쓴 채소들은 건져내고 맑은 육수만 따로 받아둡니다" },
      { step: 3, description: "육수에 불린 찹쌀을 넣고 중약불에서 뭉근하게 끓입니다" },
      { step: 4, description: "쌀알이 퍼지기 시작하면 찢어둔 닭고기를 넣고 함께 끓입니다" },
      { step: 5, description: "소금과 후추로 기호에 맞게 간을 합니다. 마지막에 부추를 송송 썰어 올리면 향긋함이 배가 됩니다" },
    ],
    tips: [
      "닭가슴살이나 닭다리살을 활용하면 간편합니다",
      "육수는 맑게 거르는 것이 중요합니다",
    ],
  },
  // 추가 레시피들은 간략하게...
  "gruel-3": {
    id: "gruel-3",
    title: "단호박죽",
    description: "부드러운 식감과 천연의 단맛으로 경기 전 긴장된 위장을 달래기에 좋은 죽",
    category: "digestion",
    cooking_time_minutes: 30,
    difficulty: "easy",
    situation: "위염, 장염 등 소화기 질환이 있거나 아침 공복에 속을 편안하게 달래고 싶을 때 좋습니다",
    ingredients: [
      { name: "단호박", amount: "1개", note: "중간 크기" },
      { name: "찹쌀가루", amount: "1/2컵" },
      { name: "설탕", amount: "2~3큰술", note: "취향껏" },
      { name: "소금", amount: "1/2작은술" },
      { name: "물", amount: "800ml" },
      { name: "삶은 팥이나 새알심", amount: "선택" },
    ],
    steps: [
      { step: 1, description: "단호박을 전자레인지에 3~5분 돌려 살짝 익힌 후, 껍질을 벗기고 씨를 제거하여 깍둑썰기합니다" },
      { step: 2, description: "냄비에 단호박과 물을 넣고 호박이 완전히 뭉개질 정도로 푹 삶습니다" },
      { step: 3, description: "핸드 블렌더로 곱게 갈거나 주걱으로 으깹니다" },
      { step: 4, description: "찹쌀가루를 찬물에 풀어 '찹쌀물'을 만든 뒤, 끓는 호박물에 조금씩 부으며 농도를 조절합니다 (계속 저어주어야 눌어붙지 않습니다)" },
      { step: 5, description: "소금과 설탕으로 단맛을 극대화합니다. 미리 삶아둔 팥이나 새알심을 넣으면 식감이 더욱 좋아집니다" },
    ],
    tips: [
      "부드러운 식감과 천연의 단맛으로 경기 전 긴장된 위장을 달래기에 좋습니다",
    ],
  },
  "gruel-side-1": {
    id: "gruel-side-1",
    title: "소고기 장조림",
    description: "죽과 곁들였을 때 가장 맛있는 장조림은 너무 짜지 않고 결대로 부드럽게 찢어지는 것이 특징",
    category: "side",
    cooking_time_minutes: 80,
    difficulty: "medium",
    situation: "죽과 함께 먹으면 감칠맛이 폭발하는 반찬",
    ingredients: [
      { name: "소고기", amount: "300g", note: "홍두깨살 또는 우둔살" },
      { name: "물", amount: "1L", note: "고기 삶기용" },
      { name: "대파", amount: "1대" },
      { name: "마늘", amount: "5알" },
      { name: "생강", amount: "약간" },
      { name: "통후추", amount: "약간" },
      { name: "고기 삶은 육수", amount: "2컵" },
      { name: "간장", amount: "1/2컵" },
      { name: "설탕", amount: "3큰술" },
      { name: "맛술", amount: "2큰술" },
      { name: "올리고당", amount: "1큰술" },
    ],
    steps: [
      { step: 1, description: "고기는 찬물에 30분 정도 담가 핏물을 뺍니다" },
      { step: 2, description: "끓는 물에 고기와 삶기 재료를 넣고 30~40분간 푹 삶습니다. 젓가락으로 찔렀을 때 핏물이 나오지 않아야 합니다" },
      { step: 3, description: "삶아진 고기는 건져서 한김 식힌 후, 결을 따라 얇게 찢어줍니다 (죽 전문점 스타일은 아주 가늘게 찢는 것이 포인트입니다)" },
      { step: 4, description: "냄비에 분량의 조림장 재료와 찢어둔 고기를 넣고 중약불에서 국물이 1/3 정도 남을 때까지 졸입니다" },
      { step: 5, description: "마지막에 올리고당을 넣어 윤기를 내면 완성입니다" },
    ],
    tips: [
      "죽이 너무 심심하다면 장조림 국물을 한 숟가락 섞어 드시면 감칠맛이 폭발합니다",
      "죽 전문점 스타일은 아주 가늘게 찢는 것이 포인트입니다",
    ],
  },
  "gruel-side-2": {
    id: "gruel-side-2",
    title: "비트 동치미",
    description: "죽의 텁텁함을 씻어주는 분홍빛의 시원하고 깔끔한 동치미",
    category: "side",
    cooking_time_minutes: 30,
    difficulty: "easy",
    situation: "죽의 텁텁함을 씻어주는 시원한 반찬",
    ingredients: [
      { name: "무", amount: "1/4개" },
      { name: "비트", amount: "약간", note: "색내기용" },
      { name: "쪽파", amount: "3대" },
      { name: "생수", amount: "1.5L" },
      { name: "천일염", amount: "2큰술" },
      { name: "설탕", amount: "2큰술" },
      { name: "매실액", amount: "2큰술" },
      { name: "다진 마늘", amount: "1큰술", note: "면보에 걸러 사용" },
      { name: "다진 생강", amount: "약간" },
    ],
    steps: [
      { step: 1, description: "무는 한입 크기로 나박썰기한 후 소금 1큰술에 20분 정도 절입니다 (나온 물은 버리지 않고 그대로 사용합니다)" },
      { step: 2, description: "비트를 아주 얇게 슬라이스하여 물에 담가 분홍색 우러나게 합니다. 너무 많이 넣으면 색이 진해지니 주의하세요" },
      { step: 3, description: "생수에 소금, 설탕, 매실액을 넣어 간을 맞춥니다. 마늘과 생강은 다시백이나 면보에 넣어 국물에 흔들어 향만 내고 건져내야 국물이 맑습니다" },
      { step: 4, description: "절인 무와 비트 우린 물, 쪽파를 용기에 담고 만들어둔 국물을 붓습니다" },
      { step: 5, description: "실온에서 반나절 정도 두었다가 기포가 살짝 올라오면 냉장고에 넣어 차갑게 보관합니다" },
    ],
    tips: [
      "죽 한 입 먹고 동치미 무를 아삭하게 씹으면 소화 효소인 '디아스타아제' 성분이 소화를 더욱 도와줍니다",
      "비트는 너무 많이 넣으면 색이 진해지니 주의하세요",
    ],
  },
};

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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GruelRecipeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const recipe = gruelRecipes[id];

  if (!recipe) {
    notFound();
  }

  console.log("[GruelRecipeDetailPage] 죽 레시피 상세 페이지 렌더링:", id);

  return (
    <DirectionalEntrance direction="up" delay={0.3}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          {/* 뒤로가기 버튼 */}
          <MotionWrapper>
            <Link href="/archive/recipes?tab=gruel">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                목록으로 돌아가기
              </Button>
            </Link>

            {/* 레시피 헤더 */}
            <StaggerCard index={0}>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-3xl mb-2">{recipe.title}</CardTitle>
                      <CardDescription className="text-base">{recipe.description}</CardDescription>
                    </div>
                    <Soup className="h-8 w-8 text-amber-500 flex-shrink-0" />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <AnimatedBadge delay={0.4}>
                      <Badge className={categoryColors[recipe.category]}>
                        {categoryLabels[recipe.category]}
                      </Badge>
                    </AnimatedBadge>
                    {recipe.difficulty && (
                      <AnimatedBadge delay={0.5}>
                        <Badge variant="outline">
                          {difficultyLabels[recipe.difficulty]}
                        </Badge>
                      </AnimatedBadge>
                    )}
                    {recipe.cooking_time_minutes && (
                      <AnimatedBadge delay={0.6}>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {recipe.cooking_time_minutes}분
                        </Badge>
                      </AnimatedBadge>
                    )}
                  </div>
                </CardHeader>
              </Card>
            </StaggerCard>

            {/* 추천 상황 */}
            {recipe.situation && (
              <StaggerCard index={1}>
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-900 font-semibold">추천 상황</AlertTitle>
                  <AlertDescription className="text-blue-800 mt-2">
                    {recipe.situation}
                  </AlertDescription>
                </Alert>
              </StaggerCard>
            )}

            {/* 재료 */}
            <StaggerCard index={2}>
              <Card>
                <CardHeader>
                  <CardTitle>재료</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recipe.ingredients.map((ingredient, index) => (
                      <StaggerItem key={index} index={index} delay={0.3}>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium">{ingredient.name}</span>
                            <span className="text-gray-600 ml-2">{ingredient.amount}</span>
                            {ingredient.note && (
                              <span className="text-gray-500 text-sm ml-2">({ingredient.note})</span>
                            )}
                          </div>
                        </li>
                      </StaggerItem>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </StaggerCard>

            {/* 조리 단계 */}
            <StaggerCard index={3}>
              <Card>
                <CardHeader>
                  <CardTitle>조리 방법</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {recipe.steps.map((step) => (
                      <StaggerItem key={step.step} index={step.step - 1} delay={0.4}>
                        <li className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                            {step.step}
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="text-gray-700">{step.description}</p>
                            {step.timer_minutes && (
                              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                <Clock className="h-4 w-4" />
                                <span>{step.timer_minutes}분</span>
                              </div>
                            )}
                          </div>
                        </li>
                      </StaggerItem>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </StaggerCard>

            {/* 조리 팁 */}
            {recipe.tips && recipe.tips.length > 0 && (
              <StaggerCard index={4}>
                <Card>
                  <CardHeader>
                    <CardTitle>조리 팁</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {recipe.tips.map((tip, index) => (
                        <StaggerItem key={index} index={index} delay={0.6}>
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                            <span className="text-gray-700">{tip}</span>
                          </li>
                        </StaggerItem>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </StaggerCard>
            )}
          </MotionWrapper>
        </div>
      </div>
    </DirectionalEntrance>
  );
}
