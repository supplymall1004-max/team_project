/**
 * @file app/archive/recipes/special/[id]/page.tsx
 * @description 특수 레시피 상세 페이지
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
import { ArrowLeft, Clock, FlaskConical, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SpecialRecipe } from "@/components/special-recipes/special-recipe-list";
import { DirectionalEntrance } from "@/components/motion/directional-entrance";
import { MotionWrapper } from "@/components/motion/motion-wrapper";
import { StaggerCard } from "@/components/motion/stagger-card";
import { StaggerItem } from "@/components/motion/stagger-item";
import { AnimatedBadge } from "@/components/motion/animated-badge";

// 임시 레시피 데이터 (실제로는 데이터베이스에서 가져옴)
const specialRecipes: Record<string, SpecialRecipe & { 
  ingredients: Array<{ name: string; amount: string; note?: string }>;
  steps: Array<{ step: number; description: string; timer_minutes?: number }>;
  effects?: string[];
  warnings?: Array<{ title: string; description: string; severity: "high" | "medium" | "low" }>;
  situation?: string;
  tips?: string[];
}> = {
  "special-1": {
    id: "special-1",
    title: "해독주스",
    description: "서재걸 박사 레시피 기반, 채소를 삶아서 가는 것이 핵심",
    category: "detox",
    cooking_time_minutes: 20,
    difficulty: "easy",
    hasWarning: true,
    situation: "체중 감량 정체기, 피부 트러블이 심할 때, 가공식품 섭취가 잦아 몸이 무거울 때",
    ingredients: [
      { name: "브로콜리", amount: "1:1:1:1 비율" },
      { name: "양배추", amount: "1:1:1:1 비율" },
      { name: "당근", amount: "1:1:1:1 비율" },
      { name: "토마토", amount: "1:1:1:1 비율" },
      { name: "사과", amount: "적당량" },
      { name: "바나나", amount: "적당량" },
    ],
    steps: [
      { step: 1, description: "브로콜리, 양배추, 당근, 토마토를 적당한 크기로 썰어 냄비에 넣고 잠길 정도만 물을 붓습니다" },
      { step: 2, description: "물이 끓기 시작하면 10분 정도 더 삶습니다" },
      { step: 3, description: "삶은 채소와 삶은 물을 함께 식힙니다" },
      { step: 4, description: "식은 채소와 물, 그리고 신선한 사과와 바나나를 넣어 믹서기에 곱게 갑니다" },
    ],
    effects: ["장내 독소 제거", "피부 개선", "체중 감량 보조"],
    warnings: [
      {
        title: "당뇨병 주의",
        description: "과일 함량이 높은 경우 혈당 스파이크를 일으킬 수 있습니다. 당뇨병 환자는 의사와 상담 후 섭취하세요.",
        severity: "high",
      },
      {
        title: "공복 섭취 주의",
        description: "위가 약하신 분은 식사 후 드시는 것이 안전합니다.",
        severity: "medium",
      },
    ],
    tips: [
      "채소를 삶으면 흡수율이 5%에서 90%까지 높아집니다",
      "아침 공복에 마실 때 흡수율이 가장 좋습니다",
      "최소 2주~한 달 정도 꾸준히 드셔야 신체 변화를 체감할 수 있습니다",
    ],
  },
  "special-2": {
    id: "special-2",
    title: "ABC 주스",
    description: "사과, 비트, 당근의 앞 글자를 딴 주스로 내장지방 배출에 탁월",
    category: "detox",
    cooking_time_minutes: 10,
    difficulty: "easy",
    hasWarning: true,
    situation: "내장지방 감소, 혈관 탄력 강화, 항산화 작용이 필요할 때",
    ingredients: [
      { name: "사과", amount: "1개" },
      { name: "비트", amount: "1/3개" },
      { name: "당근", amount: "1개" },
      { name: "물", amount: "200ml" },
    ],
    steps: [
      { step: 1, description: "비트는 생으로 먹으면 신장에 무리가 갈 수 있으므로, 살짝 찌거나 삶아서 준비하는 것이 좋습니다" },
      { step: 2, description: "모든 재료를 껍질째 깨끗이 씻어 믹서기에 넣고 물과 함께 갑니다" },
    ],
    effects: ["내장지방 감소", "혈관 탄력 강화", "항산화 작용"],
    warnings: [
      {
        title: "신장 질환 금기",
        description: "비트에는 '옥살산' 성분이 많아 신장 결석을 유발하거나, 칼륨 배출이 어려운 신장 질환자에게 심장에 부담을 줄 수 있습니다. 신장 질환이 있는 경우 절대 섭취하지 마세요.",
        severity: "high",
      },
      {
        title: "치아 침식 주의",
        description: "산도가 높은 음료이므로 빨대를 사용하거나 마신 후 물로 입을 헹구는 것이 좋습니다.",
        severity: "medium",
      },
    ],
    tips: [
      "비트는 반드시 삶거나 찌는 것이 중요합니다",
      "껍질째 사용하면 영양소를 더 많이 섭취할 수 있습니다",
    ],
  },
  "special-3": {
    id: "special-3",
    title: "꿀마늘",
    description: "체력이 급격히 떨어졌거나 환절기 면역력이 필요할 때 먹는 '약선' 레시피",
    category: "immune",
    cooking_time_minutes: 15,
    difficulty: "easy",
    hasWarning: true,
    situation: "감기 기운이 있을 때, 수족냉증으로 고생할 때, 환절기 면역력 급하강 시",
    ingredients: [
      { name: "깐 마늘", amount: "500g" },
      { name: "꿀", amount: "300~500ml" },
    ],
    steps: [
      { step: 1, description: "마늘은 깨끗이 씻어 꼭지를 떼고 물기를 완전히 제거합니다" },
      { step: 2, description: "찜기에 마늘을 넣고 10~15분간 쪄서 아린 맛을 뺍니다" },
      { step: 3, description: "소독한 유리병에 마늘을 담고 마늘이 잠길 정도로 꿀을 붓습니다" },
      { step: 4, description: "실온에서 일주일, 냉장고에서 한 달 정도 숙성합니다" },
    ],
    effects: ["만성 피로 회복", "수족냉증 완화", "강력한 면역력 증강"],
    warnings: [
      {
        title: "당뇨병 주의",
        description: "꿀은 천연 감미료지만 혈당을 빠르게 올립니다. 당뇨병 환자는 의사와 상담 후 섭취하세요.",
        severity: "high",
      },
    ],
    tips: [
      "마늘을 쪄서 아린 맛을 빼면 더 부드럽게 먹을 수 있습니다",
      "숙성 기간이 길수록 맛과 효능이 좋아집니다",
    ],
  },
  "special-4": {
    id: "special-4",
    title: "오토파지 주스",
    description: "세포 스스로가 노폐물을 먹어 치우는 '자가포식' 원리를 이용한 해독 레시피",
    category: "detox",
    cooking_time_minutes: 15,
    difficulty: "easy",
    hasWarning: true,
    situation: "세포 노화 방지, 체내 염증 수치 저하, 간 해독 지원이 필요할 때",
    ingredients: [
      { name: "케일", amount: "2~3장" },
      { name: "단호박", amount: "1/4개", note: "또는 연근" },
      { name: "바나나", amount: "1/2개" },
      { name: "무", amount: "50g" },
      { name: "배", amount: "1/4개" },
      { name: "물", amount: "200ml" },
    ],
    steps: [
      { step: 1, description: "단호박이나 연근은 살짝 쪄서 준비합니다" },
      { step: 2, description: "모든 재료를 믹서기에 넣고 물 200ml와 함께 곱게 갑니다" },
    ],
    effects: ["세포 노화 방지", "체내 염증 수치 저하", "간 해독 지원"],
    warnings: [
      {
        title: "신장 질환 금기",
        description: "케일과 무에는 '옥살산' 성분이 많아 신장 결석을 유발할 수 있습니다. 신장 질환이 있는 경우 절대 섭취하지 마세요.",
        severity: "high",
      },
      {
        title: "와파린 복용자 주의",
        description: "녹색 채소에 풍부한 비타민 K는 혈액 응고를 돕기 때문에, 피를 맑게 하는 약(항응고제)의 효능을 방해합니다.",
        severity: "high",
      },
    ],
    tips: [
      "단호박이나 연근은 반드시 쪄서 사용하는 것이 소화에 좋습니다",
    ],
  },
  "special-5": {
    id: "special-5",
    title: "레몬 소금물",
    description: "격렬한 운동 후나 아침 기상 직후 전해질 불균형을 즉각 해소",
    category: "metabolic",
    cooking_time_minutes: 2,
    difficulty: "easy",
    hasWarning: true,
    situation: "격렬한 운동 후, 아침 기상 직후 전해질 보충이 필요할 때",
    ingredients: [
      { name: "따뜻한 물", amount: "500ml" },
      { name: "레몬", amount: "1/2개", note: "즙" },
      { name: "고품질 천일염", amount: "한 꼬집", note: "또는 핑크솔트" },
    ],
    steps: [
      { step: 1, description: "따뜻한 물에 레몬즙을 짭니다" },
      { step: 2, description: "소금 한 꼬집을 넣어 잘 저어줍니다" },
    ],
    effects: ["즉각적인 수분 보충", "pH 밸런스 조절", "아침 에너지 깨우기"],
    warnings: [
      {
        title: "위궤양 주의",
        description: "산도가 높은 레몬은 상처 난 위 점막을 자극해 통증을 악화시킬 수 있습니다. 위궤양이나 위염이 있는 경우 섭취를 피하세요.",
        severity: "high",
      },
      {
        title: "치아 침식 주의",
        description: "레몬의 산은 치아 에나멜을 부식시킬 수 있으므로 빨대를 사용하거나 마신 후 물로 입을 헹구는 것이 좋습니다.",
        severity: "medium",
      },
    ],
    tips: [
      "아침 공복에 마시면 효과가 좋습니다",
      "고품질 천일염이나 핑크솔트를 사용하면 미네랄을 더 많이 섭취할 수 있습니다",
    ],
  },
  "special-6": {
    id: "special-6",
    title: "골든 밀크",
    description: "인도 전통 의학 아유르베다에서 유래된 음료로, 강황의 커큐민 성분으로 체내 염증을 줄임",
    category: "anti-inflammatory",
    cooking_time_minutes: 10,
    difficulty: "easy",
    situation: "관절염, 만성 염증, 운동 후 근육통, 환절기 면역력 저하 시",
    ingredients: [
      { name: "우유", amount: "200ml", note: "또는 두유/아몬드유" },
      { name: "강황 가루", amount: "1/2작은술" },
      { name: "시나몬 가루", amount: "약간" },
      { name: "검은후추", amount: "한 꼬집" },
      { name: "꿀", amount: "1큰술" },
    ],
    steps: [
      { step: 1, description: "냄비에 우유와 강황, 시나몬, 후추를 넣고 약불에서 따뜻하게 데웁니다 (끓이지 않도록 주의)" },
      { step: 2, description: "핵심 비법: 검은후추를 반드시 넣어야 강황의 흡수율이 2,000% 이상 높아집니다" },
      { step: 3, description: "불을 끄고 한김 식힌 뒤 꿀을 섞어 마십니다" },
    ],
    effects: ["체내 염증 감소", "관절 통증 완화", "면역력 증강"],
    tips: [
      "검은후추는 반드시 포함해야 합니다",
      "끓이지 않고 따뜻하게만 데우는 것이 중요합니다",
    ],
  },
  "special-7": {
    id: "special-7",
    title: "방탄커피",
    description: "지방을 에너지원으로 사용하는 상태로 유도하여 아침 집중력을 폭발적으로 높여줌",
    category: "metabolic",
    cooking_time_minutes: 5,
    difficulty: "easy",
    hasWarning: true,
    situation: "중요한 업무/시험 전, 아침 공복 집중력이 필요할 때, 간헐적 단식 중",
    ingredients: [
      { name: "블랙커피", amount: "1잔" },
      { name: "무가염 버터", amount: "1큰술", note: "목초 사육" },
      { name: "MCT 오일", amount: "1큰술", note: "또는 코코넛 오일" },
    ],
    steps: [
      { step: 1, description: "갓 추출한 따뜻한 블랙커피에 버터와 오일을 넣습니다" },
      { step: 2, description: "믹서기나 전동 거품기로 기름과 커피가 완전히 유화(미셀화)되어 미세한 거품이 날 때까지 충분히 섞습니다 (그냥 저어 마시면 효과가 떨어집니다)" },
    ],
    effects: ["인슐린 수치를 자극하지 않고 4~6시간 동안 지속적인 에너지 공급"],
    warnings: [
      {
        title: "위궤양 및 민감성 대장 주의",
        description: "고농도의 지방(방탄커피)은 민감한 장에 설사를 유발할 수 있습니다. 위궤양이나 대장 질환이 있는 경우 섭취를 피하세요.",
        severity: "high",
      },
    ],
    tips: [
      "믹서기로 충분히 섞어야 효과가 있습니다",
      "그냥 저어 마시면 효과가 떨어집니다",
    ],
  },
  "special-8": {
    id: "special-8",
    title: "양배추 사과 당근즙",
    description: "양배추의 비타민 U와 당근의 베타카로틴을 활용해 위장 장애를 해결하는 '천연 소화제'",
    category: "anti-inflammatory",
    cooking_time_minutes: 15,
    difficulty: "easy",
    situation: "만성 위염, 역류성 식도염, 위궤양, 피부 트러블이 심할 때",
    ingredients: [
      { name: "양배추", amount: "1/4통" },
      { name: "사과", amount: "1개" },
      { name: "당근", amount: "1/2개" },
      { name: "요구르트", amount: "선택" },
    ],
    steps: [
      { step: 1, description: "양배추는 식초물에 깨끗이 씻어 비린 맛을 뺍니다" },
      { step: 2, description: "사과와 당근은 껍질째 씻어 준비합니다" },
      { step: 3, description: "원액기나 착즙기로 즙만 짜내어 마시는 것이 위장에 부담이 적습니다" },
    ],
    effects: ["상처 난 위 점막 수복", "장내 유익균 증식"],
    tips: [
      "즙만 짜내어 마시는 것이 위장에 부담이 적습니다",
      "요구르트를 추가하면 유익균 증식에 도움이 됩니다",
    ],
  },
  "special-9": {
    id: "special-9",
    title: "시나몬 물",
    description: "인슐린 저항성을 개선하고 혈액 속 불필요한 당과 노폐물을 배출하는 데 도움",
    category: "metabolic",
    cooking_time_minutes: 30,
    difficulty: "easy",
    hasWarning: true,
    situation: "식사 후 혈당 스파이크 방지, 다이어트 정체기, 혈액 순환 불량",
    ingredients: [
      { name: "생강", amount: "1알" },
      { name: "시나몬 스틱", amount: "1~2개", note: "계피 막대" },
      { name: "물", amount: "1L" },
    ],
    steps: [
      { step: 1, description: "물 1L에 깨끗이 씻은 계피 막대와 편 썬 생강을 넣습니다" },
      { step: 2, description: "약불에서 물의 양이 2/3로 줄어들 때까지 은근하게 달입니다" },
      { step: 3, description: "식힌 후 냉장 보관하며 식후에 종이컵 한 잔 정도씩 마십니다" },
    ],
    effects: ["기초 대사량 증진", "식욕 억제 도움"],
    warnings: [
      {
        title: "저혈압 주의",
        description: "계피는 혈당을 낮추는 효과가 강해 저혈압 환자가 과다 섭취 시 어지럼증을 유발할 수 있습니다. 저혈압이 있는 경우 주의하세요.",
        severity: "high",
      },
      {
        title: "위궤양 주의",
        description: "매운 성분의 생강/계피는 상처 난 위 점막을 자극해 통증을 악화시킬 수 있습니다.",
        severity: "medium",
      },
    ],
    tips: [
      "식후에 마시면 혈당 스파이크를 방지하는 데 도움이 됩니다",
      "냉장 보관하여 하루 종일 마실 수 있습니다",
    ],
  },
  "special-10": {
    id: "special-10",
    title: "숯가루 미음",
    description: "매우 특수한 상황(식중독 초기, 급성 설사, 가스 정체)에서 독소를 흡착하여 배출",
    category: "emergency",
    cooking_time_minutes: 2,
    difficulty: "easy",
    hasWarning: true,
    situation: "심한 복부 팽만감, 식중독 증상, 장내 가스 제거가 필요할 때",
    ingredients: [
      { name: "식용 숯가루", amount: "1작은술", note: "의약외품" },
      { name: "따뜻한 물", amount: "1컵" },
    ],
    steps: [
      { step: 1, description: "반드시 '식용'으로 허가받은 숯가루를 준비합니다" },
      { step: 2, description: "따뜻한 물에 잘 타서 천천히 마십니다" },
    ],
    effects: ["독소 흡착 및 배출", "복부 팽만감 완화"],
    warnings: [
      {
        title: "약물 복용 시 주의",
        description: "숯가루는 영양소와 약물도 함께 흡착하므로, 다른 약을 복용 중일 때는 2~3시간의 간격을 두어야 합니다.",
        severity: "high",
      },
    ],
    tips: [
      "반드시 식용으로 허가받은 숯가루만 사용하세요",
      "약물 복용 시 2~3시간 간격을 두는 것이 중요합니다",
    ],
  },
};

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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SpecialRecipeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const recipe = specialRecipes[id];

  if (!recipe) {
    notFound();
  }

  console.log("[SpecialRecipeDetailPage] 특수 레시피 상세 페이지 렌더링:", id);

  return (
    <DirectionalEntrance direction="up" delay={0.3}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          {/* 뒤로가기 버튼 */}
          <MotionWrapper>
            <Link href="/archive/recipes?tab=special">
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
                    <FlaskConical className="h-8 w-8 text-purple-500 flex-shrink-0" />
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
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
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
                            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                            <span className="text-gray-700">{effect}</span>
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
              <StaggerCard index={6}>
                <Card>
                  <CardHeader>
                    <CardTitle>조리 팁</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {recipe.tips.map((tip, index) => (
                        <StaggerItem key={index} index={index} delay={0.7}>
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
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
