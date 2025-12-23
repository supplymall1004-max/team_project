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
  "vegan-3": {
    id: "vegan-3",
    title: "두부 으깨기",
    description: "Plant-Forward 스타일, 달걀 대신 두부를 활용한 아침 식사",
    category: "protein",
    cooking_time_minutes: 15,
    difficulty: "easy",
    situation: "아침 식사로 단백질을 섭취하고 싶을 때, 달걀 대체 레시피가 필요할 때",
    ingredients: [
      { name: "두부", amount: "1팩", note: "부드러운 두부" },
      { name: "올리브유", amount: "2큰술" },
      { name: "양파", amount: "1/4개" },
      { name: "마늘", amount: "2알" },
      { name: "소금", amount: "약간" },
      { name: "후추", amount: "약간" },
      { name: "파슬리", amount: "선택", note: "고명용" },
    ],
    steps: [
      { step: 1, description: "두부는 물기를 제거한 후 으깹니다" },
      { step: 2, description: "팬에 올리브유를 두르고 다진 양파와 마늘을 볶습니다" },
      { step: 3, description: "으깬 두부를 넣고 볶아가며 수분을 제거합니다" },
      { step: 4, description: "소금과 후추로 간을 맞춥니다" },
      { step: 5, description: "접시에 담고 파슬리를 뿌려 마무리합니다" },
    ],
    effects: ["식물성 단백질 공급", "저칼로리", "달걀 대체"],
    tips: [
      "두부는 물기를 충분히 제거해야 고소한 맛이 납니다",
      "양파와 마늘을 충분히 볶으면 더 깊은 맛이 납니다",
    ],
    sustainability: [
      "두부는 콩으로 만들어져 탄소 배출량이 낮습니다",
      "달걀 대체로 동물 복지를 지킬 수 있습니다",
    ],
  },
  "vegan-4": {
    id: "vegan-4",
    title: "병아리콩 샌드위치",
    description: "닭고기 샌드위치와 비슷한 식감을 내지만 환경 파괴가 없는 레시피",
    category: "protein",
    cooking_time_minutes: 20,
    difficulty: "easy",
    hasWarning: true,
    situation: "점심 식사로 든든한 샌드위치를 원할 때, 단백질 보충이 필요할 때",
    ingredients: [
      { name: "병아리콩 통조림", amount: "1캔", note: "또는 삶은 병아리콩" },
      { name: "마요네즈", amount: "2큰술", note: "비건 마요네즈" },
      { name: "셀러리", amount: "1대" },
      { name: "양파", amount: "1/4개" },
      { name: "빵", amount: "2장" },
      { name: "양상추", amount: "적당량" },
      { name: "토마토", amount: "2~3장" },
    ],
    steps: [
      { step: 1, description: "병아리콩은 물기를 제거하고 으깹니다" },
      { step: 2, description: "셀러리와 양파를 잘게 다집니다" },
      { step: 3, description: "으깬 병아리콩, 다진 채소, 마요네즈를 섞어 소스를 만듭니다" },
      { step: 4, description: "빵에 양상추와 토마토를 올립니다" },
      { step: 5, description: "만든 소스를 올리고 빵을 덮어 완성합니다" },
    ],
    effects: ["식물성 단백질 공급", "식이섬유 풍부", "지속가능한 식재료"],
    warnings: [
      {
        title: "신장 질환자 주의",
        description: "콩류에 포함된 풍부한 단백질과 칼륨이 신장에 부담을 줄 수 있습니다.",
        severity: "high",
      },
    ],
    tips: [
      "병아리콩을 충분히 으깨야 샌드위치 소스의 식감이 좋아집니다",
      "셀러리를 넣으면 아삭한 식감이 더해집니다",
    ],
    sustainability: [
      "병아리콩은 닭고기보다 탄소 배출량이 훨씬 낮습니다",
      "식물성 단백질로 동물 복지를 지킬 수 있습니다",
    ],
  },
  "vegan-5": {
    id: "vegan-5",
    title: "느타리버섯 풀드포크",
    description: "느타리버섯을 가늘게 찢어 구우면 결대로 씹히는 고기의 식감",
    category: "protein",
    cooking_time_minutes: 20,
    difficulty: "medium",
    situation: "고기 식감을 원하지만 채식을 하고 싶을 때, 단백질 보충이 필요할 때",
    ingredients: [
      { name: "느타리버섯", amount: "200g" },
      { name: "간장", amount: "2큰술" },
      { name: "올리고당", amount: "1큰술" },
      { name: "마늘", amount: "3알" },
      { name: "생강", amount: "약간" },
      { name: "참기름", amount: "1큰술" },
      { name: "후추", amount: "약간" },
    ],
    steps: [
      { step: 1, description: "느타리버섯은 결대로 가늘게 찢습니다" },
      { step: 2, description: "팬에 기름을 두르고 버섯을 볶아 수분을 제거합니다" },
      { step: 3, description: "간장, 올리고당, 다진 마늘과 생강을 넣고 볶습니다" },
      { step: 4, description: "버섯이 갈색으로 변하고 쫄깃해질 때까지 볶습니다" },
      { step: 5, description: "참기름과 후추를 넣어 마무리합니다" },
    ],
    effects: ["식물성 단백질 공급", "고기 식감", "저칼로리"],
    tips: [
      "버섯을 결대로 찢는 것이 고기 식감을 만드는 핵심입니다",
      "충분히 볶아야 쫄깃한 식감이 나옵니다",
    ],
    sustainability: [
      "버섯은 재배 시 탄소 배출량이 매우 낮습니다",
      "고기 대체로 환경 보호에 기여합니다",
    ],
  },
  "vegan-6": {
    id: "vegan-6",
    title: "두부 감자 짜글이",
    description: "고기 없이 두부의 부드러움과 감자의 포슬포슬한 식감만으로 깊은 맛을 내는 한국식 비건 스튜",
    category: "protein",
    cooking_time_minutes: 25,
    difficulty: "easy",
    situation: "든든한 한식이 필요할 때, 단백질과 탄수화물을 함께 섭취하고 싶을 때",
    ingredients: [
      { name: "두부", amount: "1팩" },
      { name: "감자", amount: "2개" },
      { name: "양파", amount: "1/2개" },
      { name: "대파", amount: "1대" },
      { name: "고춧가루", amount: "1큰술" },
      { name: "간장", amount: "1큰술" },
      { name: "물", amount: "2컵" },
    ],
    steps: [
      { step: 1, description: "두부와 감자는 한입 크기로 썹니다" },
      { step: 2, description: "양파는 채 썰고 대파는 송송 썹니다" },
      { step: 3, description: "냄비에 기름을 두르고 양파를 볶습니다" },
      { step: 4, description: "감자와 두부를 넣고 물을 부어 끓입니다" },
      { step: 5, description: "고춧가루와 간장으로 간을 맞추고 대파를 넣어 마무리합니다" },
    ],
    effects: ["식물성 단백질 공급", "탄수화물 공급", "한국식 맛"],
    tips: [
      "감자가 충분히 익을 때까지 끓여야 부드러운 식감이 납니다",
      "두부는 나중에 넣어 부서지지 않게 합니다",
    ],
    sustainability: [
      "두부와 감자는 모두 탄소 배출량이 낮은 식재료입니다",
      "한국 전통 식재료를 활용한 지속가능한 레시피입니다",
    ],
  },
  "vegan-9": {
    id: "vegan-9",
    title: "컬리플라워 라이스 비빔밥",
    description: "탄수화물 대신 채소 섭취를 극대화하는 레시피",
    category: "digestion",
    cooking_time_minutes: 15,
    difficulty: "easy",
    hasWarning: true,
    situation: "탄수화물 섭취를 줄이고 싶을 때, 저칼로리 식사가 필요할 때",
    ingredients: [
      { name: "컬리플라워", amount: "1/2송이" },
      { name: "당근", amount: "1/2개" },
      { name: "오이", amount: "1/2개" },
      { name: "시금치", amount: "한 줌" },
      { name: "콩나물", amount: "한 줌" },
      { name: "고추장", amount: "1큰술" },
      { name: "참기름", amount: "1큰술" },
    ],
    steps: [
      { step: 1, description: "컬리플라워는 믹서기에 갈아 밥처럼 만듭니다" },
      { step: 2, description: "당근과 오이는 채 썹니다" },
      { step: 3, description: "시금치와 콩나물은 데칩니다" },
      { step: 4, description: "컬리플라워 라이스에 모든 채소를 올립니다" },
      { step: 5, description: "고추장과 참기름을 넣고 비빕니다" },
    ],
    effects: ["저칼로리", "식이섬유 풍부", "탄수화물 대체"],
    warnings: [
      {
        title: "과민성 대장 증후군(IBS) 주의",
        description: "컬리플라워는 FODMAP이 높아 장에서 가스를 유발할 수 있습니다.",
        severity: "medium",
      },
    ],
    tips: [
      "컬리플라워를 너무 곱게 갈지 않아야 밥 같은 식감이 납니다",
      "채소는 신선한 것을 사용하는 것이 좋습니다",
    ],
    sustainability: [
      "컬리플라워는 쌀보다 물 소비량이 적습니다",
      "채소 중심 식단으로 탄소 배출을 줄입니다",
    ],
  },
  "vegan-10": {
    id: "vegan-10",
    title: "브로콜리 줄기 강정",
    description: "보통 버려지는 브로콜리 줄기를 활용한 제로 웨이스트 레시피",
    category: "digestion",
    cooking_time_minutes: 20,
    difficulty: "medium",
    hasWarning: true,
    situation: "음식물 쓰레기를 줄이고 싶을 때, 식이섬유를 섭취하고 싶을 때",
    ingredients: [
      { name: "브로콜리 줄기", amount: "2~3개" },
      { name: "간장", amount: "2큰술" },
      { name: "올리고당", amount: "2큰술" },
      { name: "마늘", amount: "2알" },
      { name: "참기름", amount: "1큰술" },
      { name: "깨", amount: "약간" },
    ],
    steps: [
      { step: 1, description: "브로콜리 줄기는 껍질을 벗기고 한입 크기로 썹니다" },
      { step: 2, description: "끓는 물에 살짝 데칩니다" },
      { step: 3, description: "팬에 간장, 올리고당, 다진 마늘을 넣고 끓입니다" },
      { step: 4, description: "데친 브로콜리 줄기를 넣고 조립니다" },
      { step: 5, description: "참기름과 깨를 넣어 마무리합니다" },
    ],
    effects: ["제로 웨이스트", "식이섬유 풍부", "비타민 C 공급"],
    warnings: [
      {
        title: "과민성 대장 증후군(IBS) 주의",
        description: "브로콜리는 FODMAP이 높아 장에서 가스를 유발할 수 있습니다.",
        severity: "medium",
      },
    ],
    tips: [
      "브로콜리 줄기는 껍질을 벗기면 부드럽게 먹을 수 있습니다",
      "너무 오래 조리면 식감이 나빠지므로 주의하세요",
    ],
    sustainability: [
      "브로콜리 줄기를 활용하여 음식물 쓰레기를 줄입니다",
      "Root-to-Leaf 철학을 실천하는 레시피입니다",
    ],
  },
  "vegan-11": {
    id: "vegan-11",
    title: "오트밀 버섯 리조또",
    description: "우유나 치즈 없이도 오트밀 자체의 전분기를 이용해 크리미한 맛",
    category: "blood-sugar",
    cooking_time_minutes: 20,
    difficulty: "medium",
    hasWarning: true,
    situation: "혈당 관리가 필요할 때, 크리미한 리조또를 원하지만 유제품을 피하고 싶을 때",
    ingredients: [
      { name: "오트밀", amount: "1컵" },
      { name: "버섯", amount: "200g", note: "새송이 또는 양송이" },
      { name: "양파", amount: "1/2개" },
      { name: "마늘", amount: "2알" },
      { name: "야채 육수", amount: "2컵" },
      { name: "올리브유", amount: "2큰술" },
      { name: "파슬리", amount: "선택" },
    ],
    steps: [
      { step: 1, description: "버섯과 양파는 잘게 썹니다" },
      { step: 2, description: "팬에 올리브유를 두르고 양파와 마늘을 볶습니다" },
      { step: 3, description: "버섯을 넣고 볶습니다" },
      { step: 4, description: "오트밀을 넣고 육수를 조금씩 부어가며 끓입니다" },
      { step: 5, description: "오트밀이 부드러워지고 크리미해질 때까지 끓입니다" },
    ],
    effects: ["혈당 관리", "식이섬유 풍부", "유제품 대체"],
    warnings: [
      {
        title: "글루텐 불내증 주의",
        description: "오트밀이 글루텐 프리인지 확인하세요. 일부 오트밀은 글루텐이 포함될 수 있습니다.",
        severity: "medium",
      },
    ],
    tips: [
      "오트밀은 육수를 조금씩 부어가며 끓여야 크리미한 식감이 납니다",
      "버섯을 충분히 볶으면 깊은 맛이 납니다",
    ],
    sustainability: [
      "오트밀은 쌀보다 물 소비량이 적습니다",
      "유제품을 사용하지 않아 탄소 배출을 줄입니다",
    ],
  },
  "vegan-12": {
    id: "vegan-12",
    title: "퀴노아 아보카도 포케볼",
    description: "포케는 조리 과정에서 불 사용을 최소화하여 에너지를 아끼는 지속가능 메뉴",
    category: "blood-sugar",
    cooking_time_minutes: 15,
    difficulty: "easy",
    hasWarning: true,
    situation: "빠른 식사가 필요할 때, 혈당 관리를 하면서 단백질을 섭취하고 싶을 때",
    ingredients: [
      { name: "퀴노아", amount: "1컵" },
      { name: "아보카도", amount: "1개" },
      { name: "오이", amount: "1/2개" },
      { name: "토마토", amount: "1개" },
      { name: "양파", amount: "1/4개" },
      { name: "간장", amount: "1큰술" },
      { name: "레몬즙", amount: "1큰술" },
    ],
    steps: [
      { step: 1, description: "퀴노아는 물에 삶아 식힙니다" },
      { step: 2, description: "아보카도, 오이, 토마토는 한입 크기로 썹니다" },
      { step: 3, description: "양파는 잘게 썹니다" },
      { step: 4, description: "간장과 레몬즙을 섞어 소스를 만듭니다" },
      { step: 5, description: "퀴노아에 모든 재료를 넣고 소스를 뿌려 섞습니다" },
    ],
    effects: ["혈당 관리", "건강한 지방 공급", "식물성 단백질"],
    warnings: [
      {
        title: "과민성 대장 증후군(IBS) 주의",
        description: "퀴노아는 일부 사람에게 소화 불편을 유발할 수 있습니다.",
        severity: "medium",
      },
    ],
    tips: [
      "퀴노아는 충분히 씻어 쓴맛을 제거해야 합니다",
      "아보카도는 너무 익지 않은 것을 사용하는 것이 좋습니다",
    ],
    sustainability: [
      "퀴노아는 물 소비량이 적은 작물입니다",
      "불을 사용하지 않아 에너지를 절약합니다",
    ],
  },
  "vegan-13": {
    id: "vegan-13",
    title: "새송이버섯 관자 스테이크",
    description: "새송이버섯의 기둥 부분을 활용하면 관자와 유사한 식감",
    category: "blood-sugar",
    cooking_time_minutes: 15,
    difficulty: "medium",
    situation: "고급스러운 식사가 필요할 때, 고기 식감을 원하지만 채식을 하고 싶을 때",
    ingredients: [
      { name: "새송이버섯", amount: "200g" },
      { name: "올리브유", amount: "3큰술" },
      { name: "마늘", amount: "3알" },
      { name: "로즈마리", amount: "약간" },
      { name: "소금", amount: "약간" },
      { name: "후추", amount: "약간" },
    ],
    steps: [
      { step: 1, description: "새송이버섯은 기둥 부분을 두툼하게 썹니다" },
      { step: 2, description: "올리브유에 다진 마늘과 로즈마리를 넣어 마리네이드를 만듭니다" },
      { step: 3, description: "버섯을 마리네이드에 10분간 재웁니다" },
      { step: 4, description: "팬에 기름을 두르고 버섯을 굽습니다" },
      { step: 5, description: "양면이 갈색으로 변할 때까지 구워 소금과 후추로 간을 맞춥니다" },
    ],
    effects: ["고기 식감", "저칼로리", "식물성 단백질"],
    tips: [
      "버섯을 두툼하게 썰어야 관자 같은 식감이 납니다",
      "충분히 구워야 쫄깃한 식감이 나옵니다",
    ],
    sustainability: [
      "버섯은 재배 시 탄소 배출량이 매우 낮습니다",
      "고기 대체로 환경 보호에 기여합니다",
    ],
  },
  "vegan-14": {
    id: "vegan-14",
    title: "가지 강정",
    description: "가지는 수분이 많아 고기보다 탄소 배출량이 훨씬 적은 친환경 식재료",
    category: "blood-sugar",
    cooking_time_minutes: 20,
    difficulty: "medium",
    situation: "한식이 필요할 때, 저칼로리 반찬이 필요할 때",
    ingredients: [
      { name: "가지", amount: "2개" },
      { name: "간장", amount: "2큰술" },
      { name: "올리고당", amount: "2큰술" },
      { name: "마늘", amount: "2알" },
      { name: "생강", amount: "약간" },
      { name: "참기름", amount: "1큰술" },
      { name: "깨", amount: "약간" },
    ],
    steps: [
      { step: 1, description: "가지는 한입 크기로 썹니다" },
      { step: 2, description: "소금을 뿌려 10분간 재워 쓴맛을 제거합니다" },
      { step: 3, description: "물기를 제거하고 전분을 묻혀 튀깁니다" },
      { step: 4, description: "팬에 간장, 올리고당, 다진 마늘과 생강을 넣고 끓입니다" },
      { step: 5, description: "튀긴 가지를 넣고 조립니다. 참기름과 깨를 넣어 마무리합니다" },
    ],
    effects: ["저칼로리", "식이섬유 풍부", "친환경 식재료"],
    tips: [
      "가지를 소금에 재우면 쓴맛이 제거되고 수분이 빠집니다",
      "전분을 묻혀 튀기면 바삭한 식감이 납니다",
    ],
    sustainability: [
      "가지는 고기보다 탄소 배출량이 훨씬 낮습니다",
      "친환경 식재료를 활용한 레시피입니다",
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
  "vegan-16": {
    id: "vegan-16",
    title: "단호박 코코넛 커리",
    description: "우유나 생크림 대신 코코넛 밀크를 사용해 탄소 배출을 줄인 레시피",
    category: "dairy-free",
    cooking_time_minutes: 25,
    difficulty: "easy",
    situation: "커리를 좋아하지만 유제품을 피하고 싶을 때, 크리미한 맛을 원할 때",
    ingredients: [
      { name: "단호박", amount: "1/2개" },
      { name: "코코넛 밀크", amount: "1캔" },
      { name: "양파", amount: "1개" },
      { name: "마늘", amount: "3알" },
      { name: "생강", amount: "1알" },
      { name: "커리 파우더", amount: "2큰술" },
      { name: "물", amount: "1컵" },
    ],
    steps: [
      { step: 1, description: "단호박은 껍질을 벗기고 한입 크기로 썹니다" },
      { step: 2, description: "양파, 마늘, 생강을 다집니다" },
      { step: 3, description: "팬에 기름을 두르고 양파를 볶습니다" },
      { step: 4, description: "커리 파우더를 넣고 볶아 향을 냅니다" },
      { step: 5, description: "단호박과 코코넛 밀크, 물을 넣고 끓입니다. 단호박이 부드러워질 때까지 끓입니다" },
    ],
    effects: ["유제품 대체", "비타민 A 풍부", "크리미한 맛"],
    tips: [
      "단호박이 충분히 익을 때까지 끓여야 부드러운 식감이 납니다",
      "코코넛 밀크는 끓이면 분리될 수 있으므로 주의하세요",
    ],
    sustainability: [
      "코코넛 밀크는 우유보다 탄소 배출량이 낮습니다",
      "식물성 재료만 사용하여 환경 보호에 기여합니다",
    ],
  },
  "vegan-17": {
    id: "vegan-17",
    title: "두유 들깨 칼국수",
    description: "우유나 생크림 대신 두유를 사용해 탄소 발자국을 줄인 레시피",
    category: "dairy-free",
    cooking_time_minutes: 20,
    difficulty: "easy",
    situation: "한식 국수가 필요할 때, 유제품 없이 크리미한 국수를 원할 때",
    ingredients: [
      { name: "칼국수 면", amount: "1인분" },
      { name: "두유", amount: "2컵" },
      { name: "들깨가루", amount: "3큰술" },
      { name: "양파", amount: "1/2개" },
      { name: "대파", amount: "1대" },
      { name: "소금", amount: "약간" },
    ],
    steps: [
      { step: 1, description: "양파는 채 썰고 대파는 송송 썹니다" },
      { step: 2, description: "냄비에 두유와 들깨가루를 넣고 끓입니다" },
      { step: 3, description: "양파를 넣고 끓입니다" },
      { step: 4, description: "칼국수 면을 삶아 건져냅니다" },
      { step: 5, description: "면을 그릇에 담고 국물을 부은 후 대파를 올립니다" },
    ],
    effects: ["유제품 대체", "식물성 단백질", "한국식 맛"],
    tips: [
      "들깨가루를 충분히 풀어야 고소한 맛이 납니다",
      "두유는 끓이면 응고될 수 있으므로 주의하세요",
    ],
    sustainability: [
      "두유는 우유보다 탄소 배출량이 낮습니다",
      "한국 전통 식재료를 활용한 레시피입니다",
    ],
  },
  "vegan-18": {
    id: "vegan-18",
    title: "순두부 치즈풍 파스타",
    description: "치즈 대신 순두부의 단백함을 이용해 Plant-based Creamy Sauce를 만드는 방식",
    category: "dairy-free",
    cooking_time_minutes: 20,
    difficulty: "easy",
    situation: "크리미한 파스타를 원하지만 유제품을 피하고 싶을 때, 단백질 보충이 필요할 때",
    ingredients: [
      { name: "파스타 면", amount: "1인분" },
      { name: "순두부", amount: "1팩" },
      { name: "마늘", amount: "3알" },
      { name: "올리브유", amount: "2큰술" },
      { name: "레몬즙", amount: "1큰술" },
      { name: "소금", amount: "약간" },
      { name: "후추", amount: "약간" },
    ],
    steps: [
      { step: 1, description: "파스타 면을 삶습니다" },
      { step: 2, description: "팬에 올리브유를 두르고 다진 마늘을 볶습니다" },
      { step: 3, description: "순두부를 넣고 으깹니다" },
      { step: 4, description: "레몬즙을 넣고 섞습니다" },
      { step: 5, description: "삶은 면을 넣고 소금과 후추로 간을 맞춥니다" },
    ],
    effects: ["유제품 대체", "식물성 단백질", "크리미한 맛"],
    tips: [
      "순두부를 충분히 으깨야 크리미한 소스가 됩니다",
      "레몬즙을 넣으면 신선한 맛이 더해집니다",
    ],
    sustainability: [
      "순두부는 치즈보다 탄소 배출량이 낮습니다",
      "식물성 재료만 사용하여 환경 보호에 기여합니다",
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
