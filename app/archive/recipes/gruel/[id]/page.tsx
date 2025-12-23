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
  "gruel-4": {
    id: "gruel-4",
    title: "소고기버섯죽",
    description: "단백질과 식이섬유가 풍부하여 한 끼 식사로 가장 든든한 죽",
    category: "appetite",
    cooking_time_minutes: 35,
    difficulty: "medium",
    situation: "든든한 한 끼 식사가 필요할 때, 단백질과 식이섬유를 함께 섭취하고 싶을 때",
    ingredients: [
      { name: "다진 소고기", amount: "100g", note: "우둔살이나 안심" },
      { name: "표고버섯", amount: "2개" },
      { name: "쌀", amount: "1컵" },
      { name: "간장", amount: "1/2큰술" },
      { name: "참기름", amount: "1.5큰술" },
      { name: "다진 마늘", amount: "약간" },
      { name: "후추", amount: "약간" },
      { name: "다시마 육수", amount: "1L" },
      { name: "다진 당근", amount: "약간" },
      { name: "소금", amount: "약간" },
    ],
    steps: [
      { step: 1, description: "다진 소고기는 키친타월로 핏물을 닦고 간장, 참기름 1/2큰술, 다진 마늘, 후추에 10분 정도 재워둡니다" },
      { step: 2, description: "표고버섯과 당근은 잘게 다집니다" },
      { step: 3, description: "냄비에 참기름 1큰술을 두르고 양념한 소고기를 먼저 볶다가 고기가 익으면 버섯과 당근, 불린 쌀을 넣고 쌀알이 투명해질 때까지 함께 볶습니다" },
      { step: 4, description: "육수를 붓고 센 불에서 끓이다가, 물이 끓어오르면 약불로 줄여 20분 이상 뭉근하게 끓입니다" },
      { step: 5, description: "쌀알이 충분히 퍼지면 소금으로 간을 맞추고 통깨를 뿌려 완성합니다" },
    ],
    tips: [
      "소고기를 먼저 볶으면 고소한 맛이 더해집니다",
      "버섯을 충분히 볶으면 깊은 맛이 납니다",
    ],
  },
  "gruel-5": {
    id: "gruel-5",
    title: "새우계란죽",
    description: "재료 준비가 간단하고 소화가 매우 잘 되어 아침 식사로 제격",
    category: "appetite",
    cooking_time_minutes: 20,
    difficulty: "easy",
    situation: "아침 식사로 가볍고 든든한 죽이 필요할 때, 소화가 잘 되는 식사가 필요할 때",
    ingredients: [
      { name: "칵테일 새우", amount: "10~15마리" },
      { name: "계란", amount: "2알" },
      { name: "밥", amount: "1공기", note: "찬밥 활용 가능" },
      { name: "물", amount: "800ml" },
      { name: "멸치액젓", amount: "1큰술", note: "감칠맛의 핵심" },
      { name: "참기름", amount: "약간" },
      { name: "쪽파", amount: "약간" },
    ],
    steps: [
      { step: 1, description: "새우는 씻어서 물기를 제거하고, 큰 것은 적당한 크기로 썹니다" },
      { step: 2, description: "냄비에 물과 밥을 넣고 밥알이 부드러워질 때까지 먼저 끓입니다 (찬밥을 쓰면 시간이 단축됩니다)" },
      { step: 3, description: "밥알이 어느 정도 퍼지면 새우를 넣고 익힙니다" },
      { step: 4, description: "계란을 잘 풀어서 끓고 있는 죽 위에 원을 그리듯 두릅니다. 이때 바로 젓지 말고 계란이 살짝 익을 때까지 기다려야 죽이 지저분해지지 않습니다" },
      { step: 5, description: "멸치액젓으로 간을 하고, 마지막에 참기름과 쪽파를 얹습니다" },
    ],
    tips: [
      "찬밥을 사용하면 시간을 단축할 수 있습니다",
      "계란은 바로 젓지 말고 살짝 익을 때까지 기다려야 합니다",
    ],
  },
  "gruel-6": {
    id: "gruel-6",
    title: "야채채소죽",
    description: "속이 아주 불편하거나 가벼운 식사를 원할 때 추천하는 가장 기본에 충실한 죽",
    category: "digestion",
    cooking_time_minutes: 35,
    difficulty: "easy",
    situation: "속이 아주 불편하거나 가벼운 식사를 원할 때, 소화가 잘 되는 죽이 필요할 때",
    ingredients: [
      { name: "쌀", amount: "1컵" },
      { name: "감자", amount: "1/2개" },
      { name: "애호박", amount: "1/4개" },
      { name: "양파", amount: "1/4개" },
      { name: "채수", amount: "1.2L", note: "채소 육수 또는 물" },
      { name: "국간장", amount: "1/2큰술" },
      { name: "참기름", amount: "약간" },
    ],
    steps: [
      { step: 1, description: "감자, 애호박, 양파를 아주 잘게 다집니다. 감자는 다진 후 물에 살짝 담가 전분기를 빼주면 죽이 더 깔끔합니다" },
      { step: 2, description: "냄비에 참기름을 두르고 단단한 감자부터 양파, 애호박 순으로 볶습니다" },
      { step: 3, description: "불린 쌀을 넣고 함께 볶다가 준비한 물이나 채수를 붓습니다" },
      { step: 4, description: "중간중간 저어가며 원하는 농도가 될 때까지 끓입니다. 채소에서 단맛이 나오기 때문에 간은 소금이나 국간장으로 최소한만 합니다" },
    ],
    tips: [
      "감자를 물에 담가 전분기를 빼면 죽이 더 깔끔합니다",
      "채소에서 단맛이 나오므로 간은 최소한만 합니다",
    ],
  },
  "gruel-7": {
    id: "gruel-7",
    title: "낙지김치죽",
    description: "매콤한 맛과 쫄깃한 식감이 일품인 해장용 및 별미 죽",
    category: "detox",
    cooking_time_minutes: 40,
    difficulty: "medium",
    situation: "해장이 필요할 때, 매콤한 별미 죽이 필요할 때",
    ingredients: [
      { name: "낙지", amount: "1~2마리" },
      { name: "잘 익은 김치", amount: "1/2컵" },
      { name: "쌀", amount: "1컵" },
      { name: "멸치 다시마 육수", amount: "1.2L" },
      { name: "김칫국물", amount: "3큰술" },
      { name: "다진 양파", amount: "약간" },
      { name: "콩나물", amount: "선택" },
      { name: "고춧가루", amount: "1/2큰술" },
      { name: "국간장", amount: "1큰술" },
      { name: "다진 마늘", amount: "1/2큰술" },
      { name: "참기름", amount: "약간" },
    ],
    steps: [
      { step: 1, description: "낙지는 밀가루나 소금으로 주물러 씻은 뒤, 끓는 물에 살짝 데쳐서 1~2cm 크기로 썰어둡니다 (처음부터 넣고 끓이면 낙지가 질겨집니다)" },
      { step: 2, description: "냄비에 참기름을 두르고 잘게 다진 김치와 양파를 달달 볶습니다" },
      { step: 3, description: "불린 쌀을 넣어 함께 볶다가 쌀알이 투명해지면 육수와 김칫국물을 붓습니다" },
      { step: 4, description: "중약불에서 쌀알이 충분히 퍼질 때까지 끓입니다. 이때 아삭한 식감을 원한다면 콩나물을 한 줌 넣어도 좋습니다" },
      { step: 5, description: "쌀이 다 퍼지면 썰어둔 낙지와 다진 마늘, 고춧가루를 넣고 2~3분간 더 끓입니다. 부족한 간은 소금으로 조절합니다" },
    ],
    tips: [
      "낙지는 처음부터 넣지 말고 나중에 넣어야 쫄깃한 식감이 유지됩니다",
      "김치를 충분히 볶으면 깊은 맛이 납니다",
    ],
  },
  "gruel-8": {
    id: "gruel-8",
    title: "잣죽",
    description: "기력을 보충하고 두뇌 회전에 도움을 주는 영양 만점의 고소한 죽",
    category: "brain",
    cooking_time_minutes: 45,
    difficulty: "medium",
    situation: "수험생의 간식, 노약자의 영양 보충, 집중력이 필요한 업무 전에 섭취하면 좋습니다",
    ingredients: [
      { name: "쌀", amount: "1컵" },
      { name: "잣", amount: "1/2컵", note: "깨죽으로 변경 시 볶은 검은깨 1/2컵" },
      { name: "물", amount: "1.2L" },
      { name: "소금", amount: "약간" },
    ],
    steps: [
      { step: 1, description: "쌀은 1시간 이상 충분히 불린 후 물기를 뺍니다" },
      { step: 2, description: "믹서기에 불린 쌀과 물 200ml를 넣고 곱게 갑니다. 잣(또는 깨) 역시 별도로 물을 조금 넣고 곱게 갑니다 (주의: 쌀과 잣을 따로 갈아야 향이 살고 삭지 않습니다)" },
      { step: 3, description: "냄비에 간 쌀과 나머지 물을 붓고 나무 주걱으로 저어가며 끓입니다" },
      { step: 4, description: "쌀물이 걸쭉해지고 투명하게 익으면, 갈아둔 잣물을 조금씩 부으며 섞어줍니다" },
      { step: 5, description: "잣물을 넣은 후에는 너무 오래 끓이지 말고 한소끔만 더 끓여냅니다. 소금은 먹기 직전에 각자 그릇에서 간을 해야 죽이 묽게 삭지 않습니다" },
    ],
    tips: [
      "쌀과 잣을 따로 갈아야 향이 살고 삭지 않습니다",
      "나무 주걱을 사용하면 쌀알이 손상되지 않습니다",
    ],
  },
  "gruel-9": {
    id: "gruel-9",
    title: "굴죽",
    description: "겨울철 최고의 보양식으로, 부드럽고 풍부한 감칠맛이 특징",
    category: "energy",
    cooking_time_minutes: 40,
    difficulty: "easy",
    situation: "수술 후 회복기, 큰 경기를 앞둔 선수, 체력이 급격히 떨어졌을 때 기운을 북돋워 줍니다",
    ingredients: [
      { name: "생굴", amount: "150g" },
      { name: "쌀", amount: "1컵" },
      { name: "부추", amount: "약간" },
      { name: "물", amount: "1L" },
      { name: "참기름", amount: "2큰술" },
      { name: "국간장", amount: "1/2큰술" },
      { name: "다진 마늘", amount: "약간" },
    ],
    steps: [
      { step: 1, description: "굴은 옅은 소금물에 흔들어 씻어 껍질 등을 제거하고 물기를 뺍니다" },
      { step: 2, description: "냄비에 참기름을 두르고 불린 쌀을 충분히 볶아 고소함을 입힙니다" },
      { step: 3, description: "물을 붓고 쌀알이 부드럽게 퍼질 때까지 중불에서 저어가며 끓입니다" },
      { step: 4, description: "쌀알이 다 퍼졌을 때 굴과 다진 마늘을 넣습니다. 굴은 너무 오래 익히면 크기가 줄어들고 단단해지므로 주의합니다" },
      { step: 5, description: "굴이 통통하게 익으면 국간장으로 간을 하고, 송송 썬 부추를 듬뿍 올려 잔열로 익혀 완성합니다" },
    ],
    tips: [
      "굴은 너무 오래 익히면 크기가 줄어들고 단단해지므로 주의하세요",
      "쌀을 충분히 볶으면 고소한 맛이 더해집니다",
    ],
  },
  "gruel-10": {
    id: "gruel-10",
    title: "옥수수 우유죽",
    description: "아이들도 좋아하고 간편하게 에너지를 보충하기 좋은 '스프형' 죽",
    category: "appetite",
    cooking_time_minutes: 15,
    difficulty: "easy",
    situation: "편식하는 아이들, 입맛이 없어 가벼운 별미가 당길 때 고소하고 부드러운 맛으로 식욕을 돋워줍니다",
    ingredients: [
      { name: "캔 옥수수", amount: "1컵", note: "또는 찐 옥수수" },
      { name: "찬밥", amount: "1공기" },
      { name: "우유", amount: "400ml" },
      { name: "물", amount: "200ml" },
      { name: "버터", amount: "1큰술" },
      { name: "소금", amount: "1/2작은술" },
      { name: "설탕", amount: "1큰술" },
    ],
    steps: [
      { step: 1, description: "믹서기에 옥수수와 찬밥, 물 200ml를 넣고 곱게 갑니다. 씹히는 맛을 좋아하신다면 옥수수를 약간 남겨두었다가 나중에 넣으셔도 됩니다" },
      { step: 2, description: "냄비에 버터를 녹인 후 갈아둔 재료를 넣고 중불에서 저어가며 3분 정도 볶습니다" },
      { step: 3, description: "우유를 조금씩 부어가며 농도를 맞춥니다. 우유는 한꺼번에 넣으면 넘칠 수 있으니 2~3번에 나누어 넣어주세요" },
      { step: 4, description: "소금과 설탕으로 기호에 맞게 간을 합니다. 우유가 들어갔기 때문에 너무 오래 끓이지 말고 보글보글 올라오면 바로 불을 끕니다" },
    ],
    tips: [
      "우유는 한꺼번에 넣지 말고 조금씩 부어가며 농도를 맞춥니다",
      "너무 오래 끓이면 우유가 응고될 수 있으므로 주의하세요",
    ],
  },
  "gruel-11": {
    id: "gruel-11",
    title: "흑임자죽",
    description: "예로부터 고령자나 환자의 보양식으로 인기가 많은, 고소한 향이 일품인 죽",
    category: "brain",
    cooking_time_minutes: 50,
    difficulty: "medium",
    situation: "수험생의 간식, 노약자의 영양 보충, 집중력이 필요한 업무 전에 섭취하면 좋습니다",
    ingredients: [
      { name: "불린 쌀", amount: "1컵" },
      { name: "검은깨", amount: "1/2컵", note: "흑임자" },
      { name: "물", amount: "6~7컵" },
      { name: "소금", amount: "약간" },
      { name: "설탕", amount: "선택" },
    ],
    steps: [
      { step: 1, description: "쌀은 1시간 정도 충분히 불려 물기를 빼고, 검은깨는 깨끗이 씻어 물기를 뺍니다" },
      { step: 2, description: "믹서기에 쌀과 물 2컵을 넣고 곱게 갑니다. 검은깨도 물 1컵과 함께 별도로 곱게 갑니다 (함께 갈면 깨의 기름기 때문에 쌀알이 잘 안 퍼질 수 있습니다)" },
      { step: 3, description: "냄비에 간 쌀과 나머지 물을 붓고 나무 주걱으로 저으며 끓입니다" },
      { step: 4, description: "쌀물이 투명해지며 걸쭉해지면, 갈아둔 검은깨를 넣고 고루 섞어줍니다" },
      { step: 5, description: "흑임자를 넣은 후에는 너무 오래 끓이면 고소한 맛이 날아가고 쓴맛이 날 수 있으므로 한소끔만 끓여 마무리합니다" },
    ],
    tips: [
      "쌀과 검은깨를 따로 갈아야 쌀알이 잘 퍼집니다",
      "너무 오래 끓이면 고소한 맛이 날아가므로 주의하세요",
    ],
  },
  "gruel-12": {
    id: "gruel-12",
    title: "명란 계란죽",
    description: "감칠맛이 뛰어난 명란젓을 활용해 별도의 육수 없이도 깊은 맛을 내는 죽",
    category: "digestion",
    cooking_time_minutes: 25,
    difficulty: "easy",
    situation: "위염, 장염 등 소화기 질환이 있거나 아침 공복에 속을 편안하게 달래고 싶을 때 좋습니다",
    ingredients: [
      { name: "명란젓", amount: "1~2덩이" },
      { name: "계란", amount: "1알" },
      { name: "밥", amount: "1공기" },
      { name: "물", amount: "800ml" },
      { name: "참기름", amount: "1큰술" },
      { name: "다진 쪽파", amount: "약간" },
      { name: "김 가루", amount: "약간" },
    ],
    steps: [
      { step: 1, description: "명란젓은 칼등으로 껍질을 긁어 알만 따로 분리해둡니다" },
      { step: 2, description: "냄비에 물과 밥을 넣고 밥알이 뭉근해질 때까지 끓입니다" },
      { step: 3, description: "밥알이 퍼지면 준비한 명란을 넣고 잘 풀어줍니다. 명란 자체가 짜기 때문에 이때 맛을 보고 추가 간을 결정하세요" },
      { step: 4, description: "계란을 풀어 죽 위에 빙 두르고, 계란이 몽글몽글하게 익을 때까지 기다렸다가 살짝 섞어줍니다" },
      { step: 5, description: "참기름을 두르고 쪽파와 김 가루를 고명으로 올립니다" },
    ],
    tips: [
      "명란 자체가 짜기 때문에 맛을 보고 추가 간을 결정하세요",
      "계란은 몽글몽글하게 익을 때까지 기다려야 합니다",
    ],
  },
  "gruel-13": {
    id: "gruel-13",
    title: "표고버섯 들깨죽",
    description: "고소한 들깨가루와 쫄깃한 표고버섯이 만나 보약 같은 한 그릇",
    category: "appetite",
    cooking_time_minutes: 40,
    difficulty: "medium",
    situation: "편식하는 아이들, 입맛이 없어 가벼운 별미가 당길 때 고소하고 부드러운 맛으로 식욕을 돋워줍니다",
    ingredients: [
      { name: "표고버섯", amount: "3~4개" },
      { name: "불린 쌀", amount: "1컵" },
      { name: "들깨가루", amount: "5큰술" },
      { name: "다시마 육수", amount: "1.2L" },
      { name: "국간장", amount: "1큰술" },
      { name: "다진 마늘", amount: "약간" },
      { name: "거피 들깨가루", amount: "선택", note: "입자가 고운 것" },
    ],
    steps: [
      { step: 1, description: "표고버섯은 기둥을 떼어내고 갓 부분을 얇게 슬라이스합니다 (기둥은 육수 낼 때 사용하면 좋습니다)" },
      { step: 2, description: "냄비에 들기름을 두르고 다진 마늘과 표고버섯을 볶다가 향이 올라오면 불린 쌀을 넣고 함께 볶습니다" },
      { step: 3, description: "육수를 붓고 쌀알이 부드럽게 퍼질 때까지 중약불에서 끓입니다" },
      { step: 4, description: "쌀이 거의 다 익었을 때 들깨가루를 물에 살짝 풀어서 넣습니다. 가루째 넣으면 뭉칠 수 있으니 주의하세요" },
      { step: 5, description: "국간장으로 간을 맞추고, 들깨의 고소한 향이 날아가지 않게 한소끔만 더 끓여 마무리합니다" },
    ],
    tips: [
      "들깨가루는 물에 풀어서 넣어야 뭉치지 않습니다",
      "표고버섯을 충분히 볶으면 깊은 맛이 납니다",
    ],
  },
  "gruel-14": {
    id: "gruel-14",
    title: "브로콜리 치즈죽",
    description: "서양식 리조또와 한국식 죽의 중간 느낌으로, 소화가 잘 되면서도 아이들이 정말 좋아합니다",
    category: "appetite",
    cooking_time_minutes: 25,
    difficulty: "easy",
    situation: "편식하는 아이들, 입맛이 없어 가벼운 별미가 당길 때 고소하고 부드러운 맛으로 식욕을 돋워줍니다",
    ingredients: [
      { name: "브로콜리", amount: "1/2송이" },
      { name: "찬밥", amount: "1공기" },
      { name: "체다치즈", amount: "1~2장" },
      { name: "우유", amount: "200ml" },
      { name: "물", amount: "400ml" },
      { name: "양파", amount: "1/4개" },
      { name: "소금", amount: "약간" },
      { name: "후추", amount: "약간" },
    ],
    steps: [
      { step: 1, description: "브로콜리는 끓는 물에 살짝 데친 후, 아주 잘게 다집니다 (꽃 부분 위주로 사용하면 식감이 훨씬 부드럽습니다)" },
      { step: 2, description: "냄비에 버터나 식용유를 두르고 잘게 다진 양파를 투명해질 때까지 볶습니다" },
      { step: 3, description: "찬밥과 물을 넣고 밥알이 푹 퍼지도록 끓입니다" },
      { step: 4, description: "우유와 다진 브로콜리를 넣고 끓어오르면 체다치즈를 넣어 녹입니다" },
      { step: 5, description: "치즈에 짠맛이 있으므로 맛을 본 후 소금과 후추로 마무리 간을 합니다" },
    ],
    tips: [
      "브로콜리는 꽃 부분 위주로 사용하면 식감이 더 부드럽습니다",
      "치즈에 짠맛이 있으므로 맛을 본 후 간을 조절하세요",
    ],
  },
  "gruel-15": {
    id: "gruel-15",
    title: "팥죽",
    description: "설탕을 넣어 달콤하게 먹거나, 소금을 넣어 담백하게 즐길 수 있는 전통 보양죽",
    category: "detox",
    cooking_time_minutes: 90,
    difficulty: "medium",
    situation: "과음 후 해장이 필요하거나 몸이 자주 붓고 무거울 때 노폐물 배출을 도와줍니다",
    ingredients: [
      { name: "붉은 팥", amount: "1.5컵" },
      { name: "쌀", amount: "1/2컵", note: "또는 찹쌀" },
      { name: "물", amount: "2L" },
      { name: "소금", amount: "선택" },
      { name: "설탕", amount: "선택" },
      { name: "새알심", amount: "선택" },
    ],
    steps: [
      { step: 1, description: "팥을 냄비에 넣고 잠길 정도의 물을 부어 한 번 팔팔 끓인 뒤, 그 물은 버립니다 (팥의 사포닌 성분으로 인한 떫은맛과 배앓이를 방지합니다)" },
      { step: 2, description: "다시 물 2L를 붓고 팥이 손가락으로 눌렀을 때 으깨질 정도로 1시간 이상 푹 삶습니다" },
      { step: 3, description: "삶아진 팥을 체에 걸러 껍질은 버리고 팥물과 앙금만 준비하거나, 믹서기에 가볍게 갑니다" },
      { step: 4, description: "팥물에 불린 쌀(또는 찹쌀)을 넣고 밑바닥이 눌어붙지 않게 계속 저어가며 끓입니다" },
      { step: 5, description: "쌀알이 완전히 퍼지면 기호에 따라 소금이나 설탕으로 간을 합니다" },
    ],
    tips: [
      "첫 물은 반드시 버려야 떫은맛과 배앓이를 방지할 수 있습니다",
      "팥은 충분히 삶아야 부드러운 식감이 납니다",
    ],
  },
  "gruel-16": {
    id: "gruel-16",
    title: "전복 내장 죽",
    description: "일반 전복죽보다 훨씬 진한 풍미를 자랑하며, 전복의 영양이 응축된 보양식",
    category: "energy",
    cooking_time_minutes: 65,
    difficulty: "hard",
    situation: "수술 후 회복기, 큰 경기를 앞둔 선수, 체력이 급격히 떨어졌을 때 기운을 북돋워 줍니다",
    ingredients: [
      { name: "전복", amount: "3마리" },
      { name: "불린 쌀", amount: "1.5컵" },
      { name: "전복 내장", amount: "게우", note: "전복에서 분리" },
      { name: "참기름", amount: "3큰술" },
      { name: "물", amount: "1.2L" },
      { name: "국간장", amount: "1큰술" },
      { name: "자숙 문어", amount: "선택" },
    ],
    steps: [
      { step: 1, description: "전복에서 분리한 내장을 가위로 잘게 다지거나 믹서기에 물을 살짝 넣어 곱게 갑니다 (내장이 싱싱해야 비리지 않습니다)" },
      { step: 2, description: "냄비에 참기름을 넉넉히 두르고 갈아둔 내장을 먼저 달달 볶아 비린내를 날리고 고소함을 극대화합니다" },
      { step: 3, description: "불린 쌀을 넣고 쌀알이 내장의 녹색 빛으로 완전히 코팅될 때까지 충분히 볶습니다" },
      { step: 4, description: "물을 붓고 강불에서 끓이다가 끓어오르면 약불로 줄여 뭉근하게 끓입니다" },
      { step: 5, description: "쌀알이 퍼지면 썰어둔 전복 살을 넣고 3분 더 끓인 후, 국간장과 소금으로 간을 맞춥니다" },
    ],
    tips: [
      "내장이 싱싱해야 비리지 않습니다",
      "내장을 충분히 볶아야 고소한 맛이 납니다",
    ],
  },
  "gruel-17": {
    id: "gruel-17",
    title: "흑미 잣죽",
    description: "일반 흰 쌀 대신 흑미를 섞어 안토시아닌이 풍부하고 색감까지 고급스러운 죽",
    category: "brain",
    cooking_time_minutes: 55,
    difficulty: "medium",
    situation: "수험생의 간식, 노약자의 영양 보충, 집중력이 필요한 업무 전에 섭취하면 좋습니다",
    ingredients: [
      { name: "흑미", amount: "1/4컵" },
      { name: "흰 쌀", amount: "3/4컵" },
      { name: "잣", amount: "1/2컵" },
      { name: "물", amount: "1.5L" },
      { name: "소금", amount: "약간" },
      { name: "대추", amount: "고명용" },
    ],
    steps: [
      { step: 1, description: "흑미는 흰 쌀보다 단단하므로 최소 3시간 이상 충분히 불려야 합니다" },
      { step: 2, description: "불린 흑미와 흰 쌀을 믹서기에 물 1컵과 함께 넣고 약간 거칠게 갑니다 (너무 곱게 가는 것보다 입자가 살짝 있는 것이 식감이 좋습니다)" },
      { step: 3, description: "잣은 따로 물 1/2컵과 함께 아주 곱게 갑니다" },
      { step: 4, description: "냄비에 간 쌀과 나머지 물을 넣고 주걱으로 저어가며 끓입니다" },
      { step: 5, description: "쌀이 익어 걸쭉해지면 간 잣물을 넣고 섞어줍니다. 잣을 넣은 후에는 기름 분리가 생길 수 있으므로 한소끔만 끓이고 바로 불을 끕니다" },
    ],
    tips: [
      "흑미는 충분히 불려야 부드럽게 익습니다",
      "잣을 넣은 후에는 너무 오래 끓이지 마세요",
    ],
  },
  "gruel-18": {
    id: "gruel-18",
    title: "시금치 된장죽",
    description: "입맛 없는 아침에 구수한 된장 향과 부드러운 시금치가 소화를 돕는 건강 죽",
    category: "digestion",
    cooking_time_minutes: 30,
    difficulty: "easy",
    situation: "위염, 장염 등 소화기 질환이 있거나 아침 공복에 속을 편안하게 달래고 싶을 때 좋습니다",
    ingredients: [
      { name: "시금치", amount: "1/2단" },
      { name: "밥", amount: "1공기" },
      { name: "다진 소고기", amount: "50g" },
      { name: "멸치 다시마 육수", amount: "1L" },
      { name: "된장", amount: "1.5큰술" },
      { name: "다진 마늘", amount: "0.5큰술" },
    ],
    steps: [
      { step: 1, description: "시금치는 끓는 물에 소금을 넣고 살짝 데친 뒤 찬물에 헹궈 물기를 짜고 잘게 썹니다" },
      { step: 2, description: "냄비에 다진 소고기와 마늘을 넣고 볶다가 고기가 익으면 육수를 붓습니다" },
      { step: 3, description: "육수가 끓으면 된장을 체에 걸러 곱게 풉니다" },
      { step: 4, description: "밥을 넣고 알알이 풀릴 때까지 끓입니다" },
      { step: 5, description: "죽의 농도가 잡히면 데친 시금치를 넣고 가볍게 섞어 마무리합니다. 된장 자체에 간이 있으므로 추가 소금은 필요하지 않은 경우가 많습니다" },
    ],
    tips: [
      "시금치는 데쳐서 사용하면 부드러운 식감이 납니다",
      "된장 자체에 간이 있으므로 맛을 본 후 간을 조절하세요",
    ],
  },
  "gruel-19": {
    id: "gruel-19",
    title: "마 대추죽",
    description: "'산속의 장어'라 불리는 마와 마음을 안정시키는 대추를 활용한 보양 죽",
    category: "energy",
    cooking_time_minutes: 45,
    difficulty: "medium",
    situation: "수술 후 회복기, 큰 경기를 앞둔 선수, 체력이 급격히 떨어졌을 때 기운을 북돋워 줍니다. 환절기 면역력 강화에 탁월합니다",
    ingredients: [
      { name: "생마", amount: "150g" },
      { name: "대추", amount: "10알" },
      { name: "불린 쌀", amount: "1컵" },
      { name: "물", amount: "1.2L" },
      { name: "꿀", amount: "취향껏" },
      { name: "소금", amount: "약간" },
    ],
    steps: [
      { step: 1, description: "대추는 씨를 제거하고 물에 넣어 20분 정도 푹 끓여 대추 단물이 우러나게 합니다. 삶아진 대추 살은 따로 다져둡니다" },
      { step: 2, description: "생마는 껍질을 벗긴 후 강판에 갈거나 아주 잘게 다집니다 (마의 끈적한 '뮤신' 성분이 위벽을 보호합니다)" },
      { step: 3, description: "대추 육수에 불린 쌀을 넣고 쌀알이 충분히 퍼질 때까지 중약불에서 끓입니다" },
      { step: 4, description: "쌀이 익으면 갈아둔 마와 다진 대추 살을 넣습니다. 마는 너무 오래 끓이면 영양소가 파괴되므로 5분 내외로만 더 끓입니다" },
      { step: 5, description: "기호에 따라 꿀이나 소금을 곁들여 드세요" },
    ],
    tips: [
      "마는 너무 오래 끓이면 영양소가 파괴되므로 주의하세요",
      "대추 육수를 사용하면 단맛이 자연스럽게 더해집니다",
    ],
  },
  "gruel-20": {
    id: "gruel-20",
    title: "감자 옹심이죽",
    description: "쌀 대신 감자의 전분을 활용해 쫄깃한 식감을 극대화한 별미 죽",
    category: "detox",
    cooking_time_minutes: 50,
    difficulty: "medium",
    situation: "과음 후 해장이 필요하거나 몸이 자주 붓고 무거울 때 노폐물 배출을 도와줍니다",
    ingredients: [
      { name: "감자", amount: "3~4개" },
      { name: "불린 쌀", amount: "1/2컵" },
      { name: "멸치 다시마 육수", amount: "1L" },
      { name: "애호박", amount: "약간" },
      { name: "국간장", amount: "약간" },
      { name: "들깨가루", amount: "2큰술", note: "선택" },
    ],
    steps: [
      { step: 1, description: "감자 2개를 강판에 갈아 면보에 짭니다. 짠 물을 가만히 두면 바닥에 가라앉는 '녹말 전분'과 감자 건더기를 섞어 새알심 크기로 빚습니다" },
      { step: 2, description: "육수에 불린 쌀과 남은 감자 1개를 잘게 썰어 넣고 푹 끓입니다" },
      { step: 3, description: "쌀알이 퍼지면 준비한 감자 옹심이를 하나씩 넣습니다. 옹심이가 투명하게 위로 떠오르면 다 익은 것입니다" },
      { step: 4, description: "채 썬 애호박을 넣고 국간장으로 간을 합니다" },
      { step: 5, description: "마지막에 들깨가루 2큰술을 넣으면 훨씬 고소한 강원도식 죽이 됩니다" },
    ],
    tips: [
      "옹심이가 투명하게 위로 떠오르면 다 익은 것입니다",
      "들깨가루를 넣으면 고소한 맛이 더해집니다",
    ],
  },
  "gruel-21": {
    id: "gruel-21",
    title: "땅콩죽",
    description: "잣죽보다 더 진한 고소함을 원할 때 추천하는 영양식",
    category: "brain",
    cooking_time_minutes: 40,
    difficulty: "easy",
    situation: "수험생의 간식, 노약자의 영양 보충, 집중력이 필요한 업무 전에 섭취하면 좋습니다",
    ingredients: [
      { name: "볶은 땅콩", amount: "1/2컵" },
      { name: "불린 쌀", amount: "1컵" },
      { name: "물", amount: "1.5L" },
      { name: "소금", amount: "약간" },
    ],
    steps: [
      { step: 1, description: "볶은 땅콩의 붉은 겉껍질을 깨끗이 제거합니다 (껍질째 넣으면 색이 탁해지고 떫은맛이 날 수 있습니다)" },
      { step: 2, description: "믹서기에 땅콩과 물 1컵을 넣고 아주 곱게 갑니다. 쌀도 별도로 물을 넣어 살짝 입자가 있게 갑니다" },
      { step: 3, description: "냄비에 간 쌀과 남은 물을 넣고 눋지 않게 저어가며 끓입니다" },
      { step: 4, description: "쌀이 반 정도 익었을 때 갈아둔 땅콩물을 붓습니다. 땅콩의 지방 성분 때문에 죽이 쉽게 삭을 수 있으니 불 조절에 유의하세요" },
      { step: 5, description: "소금으로 간을 하여 고소한 풍미를 살립니다" },
    ],
    tips: [
      "땅콩의 겉껍질을 제거해야 떫은맛이 나지 않습니다",
      "땅콩의 지방 성분 때문에 불 조절에 주의하세요",
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
