/**
 * @file app/archive/recipes/vegan/[id]/page.tsx
 * @description 비건 레시피 상세 페이지
 *
 * 주요 기능:
 * 1. 레시피 상세 정보 표시
 * 2. 단계별 조리 방법
 * 3. 재료 및 효능 정보
 * 4. 분류별 추천 표시
 * 5. 각 레시피별 주의사항 강조 표시
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Leaf, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { VeganRecipe } from "@/components/vegan-recipes/vegan-recipe-list";
import { DirectionalEntrance } from "@/components/motion/directional-entrance";
import { MotionWrapper } from "@/components/motion/motion-wrapper";
import { StaggerCard } from "@/components/motion/stagger-card";
import { StaggerItem } from "@/components/motion/stagger-item";
import { AnimatedBadge } from "@/components/motion/animated-badge";

// 임시 레시피 데이터 (실제로는 데이터베이스에서 가져옴)
const veganRecipes: Record<string, VeganRecipe & { 
  ingredients: Array<{ name: string; amount: string; note?: string }>;
  steps: Array<{ step: number; description: string; timer_minutes?: number }>;
  effects?: string[];
  warnings?: Array<{ title: string; description: string; severity: "high" | "medium" | "low" }>;
  situation?: string;
  tips?: string[];
  sustainability?: string[];
}> = {
  "vegan-1": {
    id: "vegan-1",
    title: "병아리콩 토마토 파스타",
    description: "Zero-Waste 스타일, 병아리콩은 훌륭한 식물성 단백질원",
    category: "protein",
    cooking_time_minutes: 25,
    difficulty: "easy",
    hasWarning: true,
    situation: "운동 후 근육 회복이 필요할 때, 기력이 떨어지고 쉽게 피로를 느낄 때",
    ingredients: [
      { name: "파스타 면", amount: "1인분", note: "통곡물 면 추천" },
      { name: "병아리콩 통조림", amount: "1/2캔", note: "또는 삶은 병아리콩" },
      { name: "토마토 소스", amount: "1컵" },
      { name: "마늘", amount: "3알" },
      { name: "양파", amount: "1/4개" },
      { name: "시들기 직전의 시금치나 파슬리", amount: "선택", note: "지속가능 팁" },
    ],
    steps: [
      { step: 1, description: "끓는 물에 소금을 한 꼬집 넣고 파스타 면을 삶습니다. 면수는 종이컵 반 컵 정도 남겨두세요" },
      { step: 2, description: "팬에 올리브유를 두르고 물기를 제거한 병아리콩을 먼저 볶습니다. 겉면이 약간 갈색으로 변할 때까지 구우면 고소한 식감이 살아납니다" },
      { step: 3, description: "콩이 구워지면 다진 마늘과 채 썬 양파를 넣고 투명해질 때까지 볶습니다" },
      { step: 4, description: "토마토 소스와 남겨둔 면수를 넣고 보글보글 끓입니다" },
      { step: 5, description: "삶아진 면을 소스에 넣고 1~2분간 잘 버무려줍니다. (취향에 따라 후추와 올리브유를 한 번 더 뿌려주세요)" },
    ],
    effects: ["식물성 단백질 공급", "식이섬유 풍부", "지속가능한 식재료 활용"],
    warnings: [
      {
        title: "신장 질환자 주의",
        description: "콩류에 포함된 풍부한 단백질과 칼륨이 신장에 부담을 줄 수 있습니다. 전문의와 상담이 필요합니다.",
        severity: "high",
      },
      {
        title: "통풍 환자 주의",
        description: "병아리콩에는 푸린(Purine) 성분이 들어 있어 통풍 수치를 높일 수 있으니 섭취량을 조절해야 합니다.",
        severity: "medium",
      },
      {
        title: "복부 팽만감 주의",
        description: "콩의 식이섬유가 장에서 가스를 유발할 수 있으므로, 처음에는 적은 양부터 시작하고 충분히 익혀서 섭취하세요.",
        severity: "medium",
      },
    ],
    tips: [
      "시들기 직전의 시금치나 파슬리가 있다면 마지막에 추가하면 제로 웨이스트에 도움이 됩니다",
      "병아리콩을 충분히 구워야 고소한 맛이 살아납니다",
    ],
    sustainability: [
      "파스타는 물 소비량이 적은 밀 기반 식단",
      "병아리콩은 훌륭한 식물성 단백질원",
    ],
  },
  "vegan-2": {
    id: "vegan-2",
    title: "렌틸콩 채소 스튜",
    description: "One-Pot 조리법, 렌틸콩은 재배 시 물을 아주 적게 사용하는 지속가능 작물",
    category: "protein",
    cooking_time_minutes: 30,
    difficulty: "easy",
    hasWarning: true,
    situation: "운동 후 근육 회복이 필요할 때, 기력이 떨어지고 쉽게 피로를 느낄 때",
    ingredients: [
      { name: "말린 렌틸콩", amount: "1/2컵", note: "깨끗이 씻어서 준비" },
      { name: "감자", amount: "1개" },
      { name: "당근", amount: "1/2개" },
      { name: "셀러리", amount: "1대", note: "선택사항" },
      { name: "야채 육수", amount: "3컵", note: "또는 물" },
      { name: "카레 가루", amount: "1큰술", note: "또는 소금/후추" },
    ],
    steps: [
      { step: 1, description: "감자, 당근, 셀러리를 1cm 정도의 작은 주사위 모양으로 썹니다" },
      { step: 2, description: "냄비에 기름을 살짝 두르고 딱딱한 채소(감자, 당근)부터 넣고 3분 정도 볶습니다" },
      { step: 3, description: "씻어둔 렌틸콩과 육수(물)를 넣습니다" },
      { step: 4, description: "불을 중약불로 줄이고 뚜껑을 살짝 덮은 뒤 렌틸콩이 부드러워질 때까지 약 20~25분간 푹 끓입니다" },
      { step: 5, description: "카레 가루나 소금으로 간을 합니다. 국물이 자작해지면 걸쭉하고 든든한 스튜가 완성됩니다" },
    ],
    effects: ["식물성 단백질 공급", "식이섬유 풍부", "지속가능한 식재료"],
    warnings: [
      {
        title: "신장 질환자 주의",
        description: "렌틸콩에 포함된 풍부한 단백질과 칼륨이 신장에 부담을 줄 수 있습니다. 전문의와 상담이 필요합니다.",
        severity: "high",
      },
      {
        title: "통풍 환자 주의",
        description: "렌틸콩에는 푸린(Purine) 성분이 들어 있어 통풍 수치를 높일 수 있으니 섭취량을 조절해야 합니다.",
        severity: "high",
      },
    ],
    tips: [
      "감자와 당근은 껍질째 깨끗이 씻어 사용하면 음식물 쓰레기가 줄고 비타민 섭취가 늘어납니다",
      "냄비 하나로 조리해 설거지물을 아낄 수 있습니다",
    ],
    sustainability: [
      "렌틸콩은 재배 시 물을 아주 적게 사용하는 대표적인 지속가능 작물",
      "One-Pot 조리법으로 설거지물 절약",
    ],
  },
  "vegan-7": {
    id: "vegan-7",
    title: "단호박 조림",
    description: "껍질째 구운 단호박과 견과류 간장 조림, 제로 웨이스트 레시피",
    category: "digestion",
    cooking_time_minutes: 20,
    difficulty: "easy",
    hasWarning: true,
    situation: "변비로 고생하거나 아랫배가 묵직할 때, 체중 감량 중이라 칼로리 섭취를 줄여야 할 때",
    ingredients: [
      { name: "단호박", amount: "1/4개", note: "껍질째 사용" },
      { name: "견과류", amount: "한 줌", note: "호두나 아몬드" },
      { name: "물", amount: "1/2컵" },
      { name: "간장", amount: "2큰술" },
      { name: "올리고당", amount: "2큰술" },
      { name: "참기름", amount: "1큰술" },
    ],
    steps: [
      { step: 1, description: "단호박을 베이킹소다나 소금으로 깨끗이 씻은 뒤, 껍질을 벗기지 말고 2cm 두께의 한입 크기로 썹니다" },
      { step: 2, description: "썬 단호박을 그릇에 담아 랩을 씌우고 전자레인지에서 3분간 먼저 익힙니다 (가스 불 사용 시간을 절반 이상 줄여 에너지를 아낍니다)" },
      { step: 3, description: "팬에 물 1/2컵, 간장, 올리고당을 넣고 끓입니다. 소스가 보글보글 끓으면 단호박과 견과류를 넣습니다" },
      { step: 4, description: "중불에서 소스가 거의 없어질 때까지 단호박을 굴려 가며 3~5분간 졸입니다" },
      { step: 5, description: "소스가 끈적하게 배어들면 불을 끄고 참기름을 둘러 마무리합니다" },
    ],
    effects: ["식이섬유 풍부", "저칼로리", "배변 원활"],
    warnings: [
      {
        title: "과민성 대장 증후군(IBS) 주의",
        description: "단호박은 FODMAP이 높은 채소로, 장에서 가스를 많이 만들어 복통이나 설사를 유발할 수 있습니다.",
        severity: "medium",
      },
    ],
    tips: [
      "단호박 씨는 깨끗이 씻어 말린 뒤 팬에 볶으면 훌륭한 비건 간식이 됩니다",
      "껍질에 영양소가 더 많으므로 껍질째 사용하는 것이 좋습니다",
    ],
    sustainability: [
      "껍질째 요리하여 음식물 쓰레기를 줄임",
      "전자레인지 활용으로 에너지 절약",
    ],
  },
  "vegan-8": {
    id: "vegan-8",
    title: "양배추 스테이크",
    description: "양배추를 두툼하게 썰어 스테이크처럼 구우면 채소의 단맛이 극대화",
    category: "digestion",
    cooking_time_minutes: 15,
    difficulty: "easy",
    hasWarning: true,
    situation: "변비로 고생하거나 아랫배가 묵직할 때, 체중 감량 중이라 칼로리 섭취를 줄여야 할 때",
    ingredients: [
      { name: "양배추", amount: "1/4통", note: "심지 부분이 붙어 있게 2cm 두께로 큼직하게 썹니다" },
      { name: "들깨가루", amount: "2큰술" },
      { name: "간장", amount: "1큰술" },
      { name: "물", amount: "2큰술" },
      { name: "올리고당", amount: "1큰술" },
      { name: "올리브유", amount: "적당량", note: "또는 식용유" },
    ],
    steps: [
      { step: 1, description: "양배추 잎이 흩어지지 않도록 심지 부분을 살려서 부채꼴 모양으로 썰어줍니다" },
      { step: 2, description: "팬에 기름을 두르고 양배추를 올립니다. 약불에서 뚜껑을 덮고 한쪽 면당 4~5분씩 천천히 굽습니다. 뚜껑을 덮으면 수분이 갇혀 속까지 부드럽게 익습니다" },
      { step: 3, description: "작은 볼에 들깨가루, 간장, 물, 올리고당을 섞어 소스를 만듭니다" },
      { step: 4, description: "양배추 양면이 갈색으로 잘 익으면 만들어둔 소스를 양배추 위에 골고루 바릅니다. 소스가 보글보글 끓으며 양배추에 스며들도록 1분만 더 익힙니다" },
      { step: 5, description: "들깨의 고소함이 고기 없이도 아주 깊은 감칠맛을 냅니다. 젓가락보다는 칼로 썰어 먹으면 더 기분이 납니다" },
    ],
    effects: ["식이섬유 풍부", "저칼로리", "배변 원활"],
    warnings: [
      {
        title: "과민성 대장 증후군(IBS) 주의",
        description: "양배추는 '포드맵(FODMAP)'이 높은 채소로, 장에서 가스를 많이 만들어 복통이나 설사를 유발할 수 있습니다.",
        severity: "high",
      },
      {
        title: "갑상선 기능 저하증 주의",
        description: "양배추는 십자화과 채소로, 생으로 과다 섭취할 경우 갑상선 호르몬 생성을 방해할 수 있으므로 반드시 익혀 드셔야 합니다.",
        severity: "medium",
      },
    ],
    tips: [
      "양배추는 가성비가 좋고 탄소 발자국이 매우 낮은 채소입니다",
      "들깨의 고소함이 고기 없이도 깊은 감칠맛을 냅니다",
    ],
    sustainability: [
      "양배추는 탄소 발자국이 매우 낮은 채소",
      "Root-to-Leaf 철학을 반영한 레시피",
    ],
  },
  "vegan-15": {
    id: "vegan-15",
    title: "캐슈넛 크림 시금치 파스타",
    description: "우유나 크림 대신 견과류를 사용한 레시피",
    category: "dairy-free",
    cooking_time_minutes: 25,
    difficulty: "medium",
    hasWarning: true,
    situation: "유당불내증이 있어 우유를 못 마시지만 크리미한 맛을 원할 때, 채식을 처음 시작해 '치즈나 크림'의 풍미가 그리울 때",
    ingredients: [
      { name: "파스타 면", amount: "1인분", note: "푸실리 또는 펜네 면" },
      { name: "생캐슈넛", amount: "1/2컵", note: "미리 물에 2시간 불려두기" },
      { name: "물", amount: "1/2컵" },
      { name: "영양효모", amount: "1큰술", note: "치즈 맛을 내는 비건 식재료" },
      { name: "시금치", amount: "한 줌" },
      { name: "마늘", amount: "3알" },
    ],
    steps: [
      { step: 1, description: "불린 캐슈넛과 물, 영양효모, 소금 한 꼬집을 믹서기에 넣고 아주 부드럽게 갈아줍니다 (이것이 우유 생크림을 완벽히 대체합니다)" },
      { step: 2, description: "파스타 면을 포장지 시간보다 1분 적게 삶습니다" },
      { step: 3, description: "팬에 올리브유를 두르고 편으로 썬 마늘을 볶아 향을 냅니다" },
      { step: 4, description: "마늘 향이 올라오면 만들어둔 캐슈넛 크림을 붓고 약불에서 끓입니다. 소스가 너무 되직하면 면수를 한 국자 넣으세요" },
      { step: 5, description: "소스가 끓기 시작하면 삶은 면과 생시금치를 넣습니다. 시금치가 숨이 죽을 때까지만(약 30초) 가볍게 볶아 완성합니다" },
    ],
    effects: ["유제품 대체", "비타민 B12 보충 (영양효모)", "건강한 지방 공급"],
    warnings: [
      {
        title: "견과류 알레르기 금기",
        description: "캐슈넛 등 견과류 알레르기가 있는 분은 절대 섭취하면 안 됩니다. (이 경우 씨앗류나 두유로 대체 가능합니다.)",
        severity: "high",
      },
      {
        title: "담석증 환자 주의",
        description: "견과류는 지방 함량이 높아 담낭에 무리를 줄 수 있으므로 소량만 섭취해야 합니다.",
        severity: "medium",
      },
    ],
    tips: [
      "영양효모는 비타민 B12가 풍부해 비건에게 부족할 수 있는 영양을 채워줍니다",
      "캐슈넛 크림은 우유 생크림을 완벽히 대체합니다",
    ],
    sustainability: [
      "축산물(유제품) 소비를 줄이는 것은 지구 온난화 방지에 매우 효과적",
      "견과류는 지속가능한 식물성 지방 공급원",
    ],
  },
};

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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VeganRecipeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const recipe = veganRecipes[id];

  if (!recipe) {
    notFound();
  }

  console.log("[VeganRecipeDetailPage] 비건 레시피 상세 페이지 렌더링:", id);

  return (
    <DirectionalEntrance direction="up" delay={0.3}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          {/* 뒤로가기 버튼 */}
          <MotionWrapper>
            <Link href="/archive/recipes?tab=vegan">
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
                    <Leaf className="h-8 w-8 text-emerald-500 flex-shrink-0" />
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
                    {recipe.hasWarning && (
                      <AnimatedBadge delay={0.7}>
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          주의 필요
                        </Badge>
                      </AnimatedBadge>
                    )}
                  </div>
                </CardHeader>
              </Card>
            </StaggerCard>

            {/* 주의사항 강조 (각 레시피별) */}
            {recipe.warnings && recipe.warnings.length > 0 && (
              <StaggerCard index={1}>
                <div className="space-y-3">
                  <h2 className="text-xl font-bold text-red-900 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    주의사항
                  </h2>
                  {recipe.warnings.map((warning, index) => (
                    <StaggerItem key={index} index={index} delay={0.3}>
                      <Alert
                        variant={warning.severity === "high" ? "destructive" : "default"}
                        className={
                          warning.severity === "high"
                            ? "border-red-300 bg-red-50"
                            : "border-amber-200 bg-amber-50"
                        }
                      >
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="font-semibold">{warning.title}</AlertTitle>
                        <AlertDescription className="mt-2">{warning.description}</AlertDescription>
                      </Alert>
                    </StaggerItem>
                  ))}
                </div>
              </StaggerCard>
            )}

            {/* 추천 상황 */}
            {recipe.situation && (
              <StaggerCard index={2}>
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-900 font-semibold">추천 상황</AlertTitle>
                  <AlertDescription className="text-blue-800 mt-2">
                    {recipe.situation}
                  </AlertDescription>
                </Alert>
              </StaggerCard>
            )}

            {/* 재료 */}
            <StaggerCard index={3}>
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
            <StaggerCard index={4}>
              <Card>
                <CardHeader>
                  <CardTitle>조리 방법</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {recipe.steps.map((step) => (
                      <StaggerItem key={step.step} index={step.step - 1} delay={0.4}>
                        <li className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
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

            {/* 효능 */}
            {recipe.effects && recipe.effects.length > 0 && (
              <StaggerCard index={5}>
                <Card>
                  <CardHeader>
                    <CardTitle>효능</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {recipe.effects.map((effect, index) => (
                        <StaggerItem key={index} index={index} delay={0.6}>
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                            <span className="text-gray-700">{effect}</span>
                          </li>
                        </StaggerItem>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </StaggerCard>
            )}

            {/* 지속가능성 팁 */}
            {recipe.sustainability && recipe.sustainability.length > 0 && (
              <StaggerCard index={6}>
                <Card>
                  <CardHeader>
                    <CardTitle>지속가능성 팁</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {recipe.sustainability.map((tip, index) => (
                        <StaggerItem key={index} index={index} delay={0.7}>
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                            <span className="text-gray-700">{tip}</span>
                          </li>
                        </StaggerItem>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </StaggerCard>
            )}

            {/* 조리 팁 */}
            {recipe.tips && recipe.tips.length > 0 && (
              <StaggerCard index={7}>
                <Card>
                  <CardHeader>
                    <CardTitle>조리 팁</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {recipe.tips.map((tip, index) => (
                        <StaggerItem key={index} index={index} delay={0.8}>
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
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
