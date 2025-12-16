/**
 * @file app/archive/recipes/baby/[id]/page.tsx
 * @description 이유식 레시피 상세 페이지
 *
 * 주요 기능:
 * 1. 레시피 상세 정보 표시
 * 2. 단계별 조리 방법
 * 3. 재료 및 영양 정보
 * 4. 월령별 추천 표시
 * 5. 주의사항 및 알레르기 정보
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Baby, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BabyRecipe } from "@/components/baby-recipes/baby-recipe-list";

// 임시 레시피 데이터 (실제로는 데이터베이스에서 가져옴)
const babyRecipes: Record<string, BabyRecipe & { 
  ingredients: Array<{ name: string; amount: string; note?: string }>;
  steps: Array<{ step: number; description: string; timer_minutes?: number }>;
  nutrition_info?: { calories?: number; protein?: number; carbs?: number; fat?: number };
  allergy_warnings?: string[];
  tips?: string[];
}> = {
  "baby-1": {
    id: "baby-1",
    title: "쌀 미음",
    description: "이유식의 첫 시작, 부드러운 쌀 미음",
    stage: "initial",
    age_months_min: 4,
    age_months_max: 6,
    cooking_time_minutes: 30,
    difficulty: "easy",
    ingredients: [
      { name: "쌀", amount: "20g", note: "약 2숟가락, 1시간 이상 불린 쌀" },
      { name: "물", amount: "200ml", note: "10배 미음 기준" },
    ],
    steps: [
      { step: 1, description: "쌀을 1시간 이상 물에 불린 후 물기를 빼줍니다" },
      { step: 2, description: "불린 쌀과 물을 믹서에 넣고 아주 곱게 갈아줍니다" },
      { step: 3, description: "냄비에 갈린 쌀과 물을 넣고 센 불에서 끓입니다" },
      { step: 4, description: "끓기 시작하면 약불로 줄이고 눌어붙지 않도록 계속 저어가며 10분 정도 끓입니다" },
      { step: 5, description: "고운 체에 걸러 부드러운 상태로 만듭니다 (가장 중요)" },
    ],
    nutrition_info: {
      calories: 50,
      protein: 1,
      carbs: 10,
      fat: 0.2,
    },
    allergy_warnings: [],
    tips: [
      "첫 이유식이므로 아주 묽게 만들어야 합니다",
      "처음에는 1티스푼부터 시작하여 며칠간 양을 조금씩 늘립니다",
      "5~7일 간격으로 새로운 재료를 추가하세요",
      "아기의 반응을 주의 깊게 관찰하세요",
    ],
  },
  "baby-2": {
    id: "baby-2",
    title: "소고기 미음",
    description: "초기 필수 레시피, 철분이 풍부한 소고기 미음",
    stage: "initial",
    age_months_min: 4,
    age_months_max: 6,
    cooking_time_minutes: 40,
    difficulty: "medium",
    ingredients: [
      { name: "쌀 미음", amount: "30g" },
      { name: "소고기", amount: "10g", note: "안심 또는 홍두깨살" },
      { name: "물", amount: "적당량" },
    ],
    steps: [
      { step: 1, description: "소고기를 30분 정도 물에 담가 핏물을 제거합니다" },
      { step: 2, description: "소고기를 냄비에 넣고 푹 삶아 육수를 냅니다 (이 육수는 이유식에 사용)" },
      { step: 3, description: "삶은 소고기를 건져 믹서 또는 칼로 아주 곱게 다지거나 갈아줍니다" },
      { step: 4, description: "쌀 미음과 소고기 육수, 곱게 간 소고기를 넣고 다시 한번 섞어 끓입니다" },
      { step: 5, description: "체에 거릅니다" },
    ],
    nutrition_info: {
      calories: 60,
      protein: 5,
      carbs: 8,
      fat: 1,
    },
    allergy_warnings: ["소고기"],
    tips: [
      "소고기는 철분 공급원이므로 초기 이유식에서 가장 중요한 재료입니다",
      "생후 6개월 이후부터 아기가 엄마로부터 받은 철분이 고갈되기 시작합니다",
      "소고기를 처음 먹일 때는 소량으로 시작하세요",
    ],
  },
  "baby-3": {
    id: "baby-3",
    title: "애호박 미음",
    description: "부드럽고 소화가 잘 되는 애호박 미음",
    stage: "initial",
    age_months_min: 5,
    age_months_max: 6,
    cooking_time_minutes: 25,
    difficulty: "easy",
    ingredients: [
      { name: "쌀 미음", amount: "30g" },
      { name: "애호박", amount: "10g" },
    ],
    steps: [
      { step: 1, description: "애호박 껍질과 씨를 제거합니다" },
      { step: 2, description: "끓는 물에 푹 무르게 삶거나 찝니다" },
      { step: 3, description: "삶은 애호박을 건져내 믹서에 갈거나 곱게 다진 후 체에 거릅니다" },
      { step: 4, description: "쌀 미음에 곱게 간 애호박을 넣고 한 번 더 약불에 살짝 끓여줍니다" },
    ],
    nutrition_info: {
      calories: 35,
      protein: 1,
      carbs: 7,
      fat: 0.1,
    },
    allergy_warnings: [],
    tips: [
      "단호박, 감자 등 다른 채소도 이와 같은 방식으로 5~7일 간격으로 시도합니다",
      "애호박은 수분이 많아 소화에 좋습니다",
    ],
  },
  "baby-4": {
    id: "baby-4",
    title: "감자 미음",
    description: "탄수화물과 비타민 C가 풍부한 감자 미음",
    stage: "initial",
    age_months_min: 5,
    age_months_max: 6,
    cooking_time_minutes: 30,
    difficulty: "easy",
    ingredients: [
      { name: "쌀 미음", amount: "30g" },
      { name: "감자", amount: "10g" },
    ],
    steps: [
      { step: 1, description: "감자를 깨끗이 씻고 껍질을 벗깁니다" },
      { step: 2, description: "감자를 푹 쪄서 체에 곱게 내립니다 (감자 속의 덩어리가 남지 않게 하는 것이 중요)" },
      { step: 3, description: "쌀 미음과 섞어 끓입니다" },
    ],
    nutrition_info: {
      calories: 45,
      protein: 1,
      carbs: 9,
      fat: 0.1,
    },
    allergy_warnings: [],
    tips: [
      "탄수화물과 비타민 C 공급에 좋습니다",
      "감자 속의 덩어리가 남지 않도록 체에 곱게 거르는 것이 중요합니다",
    ],
  },
  "baby-5": {
    id: "baby-5",
    title: "단호박 미음",
    description: "달콤하고 부드러운 단호박 미음",
    stage: "initial",
    age_months_min: 5,
    age_months_max: 6,
    cooking_time_minutes: 25,
    difficulty: "easy",
    ingredients: [
      { name: "쌀 미음", amount: "30g" },
      { name: "단호박", amount: "10g" },
    ],
    steps: [
      { step: 1, description: "단호박을 쪄서 껍질과 씨를 제거합니다" },
      { step: 2, description: "체에 내립니다" },
      { step: 3, description: "쌀 미음에 섞어 끓입니다" },
    ],
    nutrition_info: {
      calories: 30,
      protein: 1,
      carbs: 7,
      fat: 0.1,
    },
    allergy_warnings: [],
    tips: [
      "단호박은 자연스럽게 달콤해서 아기가 좋아합니다",
      "비타민 A가 풍부합니다",
      "첫 시도는 소량으로 시작하세요",
    ],
  },
  "baby-6": {
    id: "baby-6",
    title: "고구마 미음",
    description: "자연스럽게 달콤한 고구마 미음",
    stage: "initial",
    age_months_min: 5,
    age_months_max: 6,
    cooking_time_minutes: 20,
    difficulty: "easy",
    ingredients: [
      { name: "쌀 미음", amount: "30g" },
      { name: "고구마", amount: "10g" },
    ],
    steps: [
      { step: 1, description: "고구마를 깨끗이 씻고 껍질을 벗깁니다" },
      { step: 2, description: "찜기에 넣고 15분간 찝니다" },
      { step: 3, description: "으깨서 체에 곱게 거릅니다" },
      { step: 4, description: "쌀 미음에 섞어 끓입니다" },
    ],
    nutrition_info: {
      calories: 50,
      protein: 1,
      carbs: 11,
      fat: 0.1,
    },
    allergy_warnings: [],
    tips: [
      "고구마는 섬유질이 많아 소화에 도움이 됩니다",
      "너무 많이 주면 변비가 될 수 있으니 주의하세요",
    ],
  },
  "baby-7": {
    id: "baby-7",
    title: "닭고기 미음",
    description: "고단백, 저지방의 닭고기 미음",
    stage: "initial",
    age_months_min: 6,
    age_months_max: 6,
    cooking_time_minutes: 35,
    difficulty: "medium",
    ingredients: [
      { name: "쌀 미음", amount: "30g" },
      { name: "닭고기", amount: "10g", note: "닭 안심 또는 가슴살" },
    ],
    steps: [
      { step: 1, description: "닭고기를 푹 삶아 육수와 고기를 분리합니다" },
      { step: 2, description: "삶은 닭고기를 곱게 갈아줍니다 (소고기 미음과 동일한 방법)" },
      { step: 3, description: "쌀 미음과 닭고기 육수, 곱게 간 닭고기를 합친 후 체에 거릅니다" },
    ],
    nutrition_info: {
      calories: 55,
      protein: 6,
      carbs: 7,
      fat: 0.5,
    },
    allergy_warnings: ["닭고기"],
    tips: [
      "고단백, 저지방으로 알레르기 반응을 확인하며 시도합니다",
      "소고기 미음과 동일한 방법으로 만들 수 있습니다",
    ],
  },
  "baby-8": {
    id: "baby-8",
    title: "소고기 브로콜리 죽",
    description: "철분이 풍부한 소고기와 브로콜리를 넣은 부드러운 죽",
    stage: "middle",
    age_months_min: 7,
    age_months_max: 8,
    cooking_time_minutes: 40,
    difficulty: "medium",
    ingredients: [
      { name: "불린 쌀", amount: "40g" },
      { name: "소고기", amount: "20g" },
      { name: "브로콜리", amount: "15g" },
      { name: "물 또는 육수", amount: "250ml", note: "7배 죽 기준" },
    ],
    steps: [
      { step: 1, description: "소고기는 핏물을 빼고 잘게 다집니다" },
      { step: 2, description: "브로콜리는 끓는 물에 데쳐서 잎 부분만 2~3mm 크기로 다집니다" },
      { step: 3, description: "냄비에 불린 쌀, 소고기, 물(또는 소고기 육수)을 넣고 끓입니다" },
      { step: 4, description: "끓이다가 쌀이 퍼지기 시작하면 다진 브로콜리를 넣고, 주걱으로 쌀알 크기가 2~3mm가 되도록 으깹니다" },
    ],
    nutrition_info: {
      calories: 130,
      protein: 9,
      carbs: 18,
      fat: 2,
    },
    allergy_warnings: ["소고기"],
    tips: [
      "이 단계부터는 체에 거르지 않고 알갱이 형태(요구르트 농도)로 제공하여 혀로 으깨 먹는 연습을 시킵니다",
      "작은 알갱이를 혀로 으깨 먹는 연습이 목표입니다",
    ],
  },
  "baby-9": {
    id: "baby-9",
    title: "소고기 청경채 죽",
    description: "철분이 풍부한 소고기와 청경채를 넣은 부드러운 죽",
    stage: "middle",
    age_months_min: 7,
    age_months_max: 8,
    cooking_time_minutes: 40,
    difficulty: "medium",
    ingredients: [
      { name: "불린 쌀", amount: "40g" },
      { name: "소고기", amount: "20g" },
      { name: "청경채", amount: "15g" },
      { name: "물 또는 육수", amount: "250ml" },
    ],
    steps: [
      { step: 1, description: "소고기는 핏물을 빼고 잘게 다집니다" },
      { step: 2, description: "청경채를 깨끗이 씻고 끓는 물에 데칩니다" },
      { step: 3, description: "데친 청경채를 2~3mm 크기로 다집니다" },
      { step: 4, description: "냄비에 불린 쌀, 소고기, 물(또는 소고기 육수)을 넣고 끓입니다" },
      { step: 5, description: "쌀이 퍼지기 시작하면 다진 청경채를 넣고, 주걱으로 쌀알 크기가 2~3mm가 되도록 으깹니다" },
    ],
    nutrition_info: {
      calories: 120,
      protein: 8,
      carbs: 15,
      fat: 2,
    },
    allergy_warnings: ["소고기"],
    tips: [
      "소고기는 철분이 풍부하여 생후 6개월 이후 필수입니다",
      "요구르트 농도로 만들어 알갱이를 느낄 수 있게 합니다",
    ],
  },
  "baby-10": {
    id: "baby-10",
    title: "소고기 시금치 죽",
    description: "철분 흡수를 돕는 시금치가 들어간 소고기 죽",
    stage: "middle",
    age_months_min: 7,
    age_months_max: 8,
    cooking_time_minutes: 40,
    difficulty: "medium",
    ingredients: [
      { name: "불린 쌀", amount: "40g" },
      { name: "소고기", amount: "20g" },
      { name: "시금치", amount: "15g", note: "잎 부분만" },
      { name: "육수", amount: "250ml" },
    ],
    steps: [
      { step: 1, description: "시금치는 잎 부분만 끓는 물에 데칩니다" },
      { step: 2, description: "데친 시금치를 2~3mm로 다집니다" },
      { step: 3, description: "불린 쌀, 다진 소고기, 다진 시금치를 육수에 넣고 끓입니다" },
      { step: 4, description: "쌀알이 퍼질 때까지 끓여 요구르트 농도로 맞춥니다" },
    ],
    nutrition_info: {
      calories: 125,
      protein: 8,
      carbs: 16,
      fat: 2,
    },
    allergy_warnings: ["소고기"],
    tips: [
      "시금치는 철분 흡수를 돕는 비타민 C가 풍부합니다",
      "소고기와 시금치를 함께 먹으면 철분 흡수율이 높아집니다",
    ],
  },
  "baby-11": {
    id: "baby-11",
    title: "닭고기 브로콜리 죽",
    description: "단백질이 풍부한 닭고기와 브로콜리 죽",
    stage: "middle",
    age_months_min: 7,
    age_months_max: 8,
    cooking_time_minutes: 35,
    difficulty: "medium",
    ingredients: [
      { name: "불린 쌀", amount: "40g" },
      { name: "닭고기", amount: "20g" },
      { name: "브로콜리", amount: "15g" },
      { name: "육수", amount: "250ml" },
    ],
    steps: [
      { step: 1, description: "닭고기를 삶아 잘게 찢거나 다집니다" },
      { step: 2, description: "브로콜리를 끓는 물에 데쳐서 2~3mm 크기로 다집니다" },
      { step: 3, description: "불린 쌀과 닭고기, 육수를 넣고 끓입니다" },
      { step: 4, description: "쌀이 퍼지기 시작하면 다진 브로콜리를 넣고, 주걱으로 쌀알 크기가 2~3mm가 되도록 으깹니다" },
    ],
    nutrition_info: {
      calories: 110,
      protein: 7,
      carbs: 14,
      fat: 1.5,
    },
    allergy_warnings: ["닭고기"],
    tips: [
      "닭고기는 부드러운 부위를 사용하세요",
      "브로콜리는 비타민이 풍부합니다",
      "요구르트 농도로 만들어 알갱이를 느낄 수 있게 합니다",
    ],
  },
  "baby-12": {
    id: "baby-12",
    title: "닭고기 감자 양파 죽",
    description: "은은한 단맛이 나는 닭고기 감자 양파 죽",
    stage: "middle",
    age_months_min: 7,
    age_months_max: 8,
    cooking_time_minutes: 40,
    difficulty: "medium",
    ingredients: [
      { name: "불린 쌀", amount: "40g" },
      { name: "닭고기", amount: "20g" },
      { name: "감자", amount: "15g" },
      { name: "양파", amount: "10g" },
      { name: "육수", amount: "250ml" },
    ],
    steps: [
      { step: 1, description: "모든 재료를 2~3mm 크기로 다집니다" },
      { step: 2, description: "육수에 모든 재료를 넣고 끓입니다" },
      { step: 3, description: "쌀알이 퍼질 때까지 끓여 요구르트 농도로 맞춥니다" },
    ],
    nutrition_info: {
      calories: 115,
      protein: 7,
      carbs: 16,
      fat: 1.5,
    },
    allergy_warnings: ["닭고기"],
    tips: [
      "양파는 단맛을 더해 기호성을 높여주고 소화를 돕습니다",
      "2~3가지 재료를 섞어 다양한 맛을 경험하게 합니다",
    ],
  },
  "baby-13": {
    id: "baby-13",
    title: "노른자 양배추 죽",
    description: "영양가 높은 노른자와 양배추를 넣은 죽",
    stage: "middle",
    age_months_min: 7,
    age_months_max: 8,
    cooking_time_minutes: 35,
    difficulty: "medium",
    ingredients: [
      { name: "불린 쌀", amount: "40g" },
      { name: "양배추", amount: "15g" },
      { name: "달걀 노른자", amount: "1개", note: "완숙 후 노른자만 사용" },
      { name: "육수", amount: "250ml" },
    ],
    steps: [
      { step: 1, description: "양배추를 푹 삶아 부드럽게 다집니다" },
      { step: 2, description: "달걀을 완숙 후 노른자만 사용하여 으깹니다" },
      { step: 3, description: "불린 쌀과 육수를 넣고 끓입니다" },
      { step: 4, description: "쌀이 퍼지기 시작하면 다진 양배추와 으깬 노른자를 넣고 끓입니다" },
    ],
    nutrition_info: {
      calories: 140,
      protein: 8,
      carbs: 16,
      fat: 4,
    },
    allergy_warnings: ["계란"],
    tips: [
      "노른자는 영양가가 높지만, 알레르기 반응이 있을 수 있으니 아주 소량부터 확인하며 시작합니다",
      "흰자는 돌 이후에 시도하는 것을 권장합니다",
    ],
  },
  "baby-14": {
    id: "baby-14",
    title: "두부 애호박 죽",
    description: "부드러운 두부와 애호박을 넣은 영양 만점 죽",
    stage: "middle",
    age_months_min: 7,
    age_months_max: 8,
    cooking_time_minutes: 30,
    difficulty: "easy",
    ingredients: [
      { name: "불린 쌀", amount: "40g" },
      { name: "두부", amount: "20g", note: "부드러운 두부" },
      { name: "애호박", amount: "15g" },
      { name: "육수", amount: "250ml" },
    ],
    steps: [
      { step: 1, description: "애호박을 삶아 2~3mm 크기로 다집니다" },
      { step: 2, description: "두부는 으깨거나 2~3mm 크기로 다집니다" },
      { step: 3, description: "불린 쌀과 육수를 넣고 끓입니다" },
      { step: 4, description: "쌀이 퍼지기 시작하면 두부와 애호박을 넣고, 주걱으로 쌀알 크기가 2~3mm가 되도록 으깹니다" },
    ],
    nutrition_info: {
      calories: 90,
      protein: 5,
      carbs: 12,
      fat: 1,
    },
    allergy_warnings: [],
    tips: [
      "두부는 단백질이 풍부하고 부드러워 아기가 좋아합니다",
      "애호박은 수분이 많아 소화에 좋습니다",
      "식물성 단백질인 두부를 통해 소화에 부담을 덜 수 있습니다",
    ],
  },
  "baby-15": {
    id: "baby-15",
    title: "닭고기 청경채 진밥",
    description: "닭고기와 청경채를 넣은 무른 진밥",
    stage: "late",
    age_months_min: 9,
    age_months_max: 11,
    cooking_time_minutes: 45,
    difficulty: "medium",
    ingredients: [
      { name: "불린 쌀", amount: "50g" },
      { name: "닭고기", amount: "25g", note: "닭 안심 또는 가슴살" },
      { name: "청경채", amount: "20g" },
      { name: "당근", amount: "10g" },
      { name: "육수", amount: "200ml", note: "5배 죽 또는 진밥 기준" },
    ],
    steps: [
      { step: 1, description: "닭고기는 삶아낸 후 5~7mm 크기로 다집니다" },
      { step: 2, description: "청경채와 당근도 5~7mm 크기로 다집니다" },
      { step: 3, description: "냄비에 불린 쌀과 육수를 넣고 끓입니다" },
      { step: 4, description: "쌀이 어느 정도 퍼지면 다진 닭고기와 채소를 넣고 밥알이 무른 진밥 형태로 될 때까지 끓입니다" },
    ],
    nutrition_info: {
      calories: 140,
      protein: 10,
      carbs: 20,
      fat: 2,
    },
    allergy_warnings: ["닭고기"],
    tips: [
      "닭고기는 소고기 다음으로 흔하게 쓰이는 단백질입니다",
      "닭고기 외에도 흰 살 생선(대구 등)을 활용할 수 있습니다",
      "5~7mm 크기로 만들어 잇몸으로 씹는 연습을 시킵니다",
    ],
  },
  "baby-16": {
    id: "baby-16",
    title: "대구살 무 진밥",
    description: "부드러운 대구살과 무를 넣은 진밥",
    stage: "late",
    age_months_min: 9,
    age_months_max: 11,
    cooking_time_minutes: 50,
    difficulty: "medium",
    ingredients: [
      { name: "불린 쌀", amount: "50g" },
      { name: "대구살", amount: "25g", note: "가시 완벽히 제거" },
      { name: "무", amount: "20g" },
      { name: "육수", amount: "200ml" },
    ],
    steps: [
      { step: 1, description: "대구살은 쪄서 가시를 완벽히 제거한 후 5~7mm로 으깹니다" },
      { step: 2, description: "무도 같은 크기로 다집니다" },
      { step: 3, description: "육수에 밥과 재료를 넣고 끓여 진밥 농도로 맞춥니다" },
    ],
    nutrition_info: {
      calories: 135,
      protein: 9,
      carbs: 19,
      fat: 1.5,
    },
    allergy_warnings: ["생선"],
    tips: [
      "대구는 살이 부드럽고 알레르기 위험이 낮아 흰살생선 이유식으로 좋습니다",
      "생선의 가시를 완전히 제거하는 것이 가장 중요합니다",
    ],
  },
  "baby-17": {
    id: "baby-17",
    title: "소고기 버섯 채소 진밥",
    description: "표고버섯과 채소가 들어간 소고기 진밥",
    stage: "late",
    age_months_min: 9,
    age_months_max: 11,
    cooking_time_minutes: 45,
    difficulty: "medium",
    ingredients: [
      { name: "불린 쌀", amount: "50g" },
      { name: "소고기", amount: "25g" },
      { name: "표고버섯", amount: "15g", note: "표고 또는 느타리" },
      { name: "당근", amount: "15g" },
      { name: "육수", amount: "200ml" },
    ],
    steps: [
      { step: 1, description: "버섯을 포함한 모든 재료를 5~7mm로 다집니다" },
      { step: 2, description: "진밥을 끓인 후 모든 재료를 넣고 푹 익힙니다" },
    ],
    nutrition_info: {
      calories: 145,
      protein: 10,
      carbs: 20,
      fat: 2.5,
    },
    allergy_warnings: ["소고기"],
    tips: [
      "버섯은 다양한 향과 쫄깃한 식감을 제공하여 씹는 재미를 느끼게 해줍니다",
      "세 가지 이상 재료를 조합하여 다양한 맛을 경험하게 합니다",
    ],
  },
  "baby-18": {
    id: "baby-18",
    title: "두부 브로콜리 진밥",
    description: "식물성 단백질 두부와 브로콜리 진밥",
    stage: "late",
    age_months_min: 9,
    age_months_max: 11,
    cooking_time_minutes: 40,
    difficulty: "easy",
    ingredients: [
      { name: "불린 쌀", amount: "50g" },
      { name: "두부", amount: "25g" },
      { name: "브로콜리", amount: "20g" },
      { name: "육수", amount: "200ml" },
    ],
    steps: [
      { step: 1, description: "두부는 으깨거나 5~7mm로 깍둑썰고, 브로콜리도 다집니다" },
      { step: 2, description: "불린 쌀과 육수를 넣고 끓입니다" },
      { step: 3, description: "쌀이 퍼지기 시작하면 두부와 브로콜리를 넣고 진밥 농도로 끓입니다" },
    ],
    nutrition_info: {
      calories: 120,
      protein: 7,
      carbs: 18,
      fat: 1.5,
    },
    allergy_warnings: [],
    tips: [
      "식물성 단백질인 두부를 통해 소화에 부담을 덜고 영양 균형을 맞춥니다",
      "두부는 부드러워 아기가 좋아합니다",
    ],
  },
  "baby-19": {
    id: "baby-19",
    title: "채소 계란말이/찜",
    description: "데친 당근, 양파, 시금치를 넣은 부드러운 계란 요리",
    stage: "late",
    age_months_min: 9,
    age_months_max: 11,
    cooking_time_minutes: 15,
    difficulty: "medium",
    ingredients: [
      { name: "계란", amount: "1개", note: "노른자만 사용 가능" },
      { name: "당근", amount: "10g" },
      { name: "양파", amount: "5g" },
      { name: "시금치", amount: "10g" },
    ],
    steps: [
      { step: 1, description: "당근, 양파, 시금치를 깨끗이 씻고 데칩니다" },
      { step: 2, description: "데친 채소를 잘게 다집니다 (5~7mm)" },
      { step: 3, description: "계란 노른자를 풀어 채소와 섞습니다" },
      { step: 4, description: "팬에 기름을 두르고 부칩니다 또는 찜기에 넣고 쪄서 부드럽게 만듭니다" },
    ],
    nutrition_info: {
      calories: 80,
      protein: 6,
      carbs: 3,
      fat: 5,
    },
    allergy_warnings: ["계란"],
    tips: [
      "계란은 알레르기 유발 가능성이 높으니 주의하세요",
      "처음에는 노른자만 사용하는 것이 안전합니다",
      "흰자는 돌 이후에 시도하는 것을 권장합니다",
    ],
  },
  "baby-20": {
    id: "baby-20",
    title: "생선 감자 무른 밥",
    description: "가시를 제거한 흰살 생선과 으깬 감자를 올린 무른 밥",
    stage: "late",
    age_months_min: 9,
    age_months_max: 11,
    cooking_time_minutes: 45,
    difficulty: "medium",
    ingredients: [
      { name: "불린 쌀", amount: "50g" },
      { name: "생선", amount: "30g", note: "대구나 명태 등 흰살 생선, 가시 제거" },
      { name: "감자", amount: "30g" },
      { name: "육수", amount: "200ml" },
    ],
    steps: [
      { step: 1, description: "생선의 가시를 완전히 제거합니다" },
      { step: 2, description: "감자를 깨끗이 씻고 껍질을 벗긴 후 5~7mm로 다집니다" },
      { step: 3, description: "냄비에 불린 쌀과 육수를 넣고 끓입니다" },
      { step: 4, description: "쌀이 퍼지기 시작하면 생선과 감자를 넣고 10분 더 끓입니다" },
      { step: 5, description: "생선과 감자를 으깨어 밥과 섞습니다" },
    ],
    nutrition_info: {
      calories: 130,
      protein: 9,
      carbs: 18,
      fat: 2,
    },
    allergy_warnings: ["생선"],
    tips: [
      "생선의 가시를 완전히 제거하는 것이 가장 중요합니다",
      "흰살 생선이 부드럽고 소화가 잘 됩니다",
      "생선 알레르기가 있을 수 있으니 주의하세요",
    ],
  },
  "baby-21": {
    id: "baby-21",
    title: "아기용 덮밥/국밥",
    description: "다양한 채소와 고기를 넣은 아기용 덮밥 또는 국밥",
    stage: "complete",
    age_months_min: 12,
    cooking_time_minutes: 30,
    difficulty: "medium",
    ingredients: [
      { name: "일반 밥", amount: "적당량" },
      { name: "채소", amount: "다양한 채소", note: "양파, 버섯 등" },
      { name: "고기", amount: "적당량", note: "소고기/돼지고기/생선" },
    ],
    steps: [
      { step: 1, description: "일반 성인 요리와 유사하게 재료를 조리하되, 아주 약하게 간(무염 간장 등)을 하거나 간을 하지 않고 만듭니다" },
      { step: 2, description: "밥에 국물을 자작하게 섞어 진밥처럼 만들어줍니다" },
    ],
    nutrition_info: {
      calories: 150,
      protein: 8,
      carbs: 25,
      fat: 3,
    },
    allergy_warnings: [],
    tips: [
      "다양한 식재료와 어른의 식습관을 공유하며 유아식으로 자연스럽게 넘어가는 시기입니다",
      "만 1세 이후부터 소량의 간을 사용할 수 있습니다",
    ],
  },
  "baby-22": {
    id: "baby-22",
    title: "아기용 채소 주먹밥",
    description: "손으로 집어 먹을 수 있는 채소 주먹밥",
    stage: "complete",
    age_months_min: 12,
    cooking_time_minutes: 20,
    difficulty: "easy",
    ingredients: [
      { name: "일반 밥", amount: "적당량" },
      { name: "소고기/닭고기", amount: "적당량", note: "다진 고기" },
      { name: "당근", amount: "적당량" },
      { name: "시금치", amount: "적당량" },
      { name: "참기름", amount: "아주 소량", note: "생략 가능" },
    ],
    steps: [
      { step: 1, description: "밥에 익혀서 잘게 다진 채소와 고기를 섞습니다" },
      { step: 2, description: "아기가 한 입에 먹을 수 있는 크기(콩알~메추리알)로 동글동글하게 빚어줍니다" },
    ],
    nutrition_info: {
      calories: 120,
      protein: 6,
      carbs: 20,
      fat: 2,
    },
    allergy_warnings: [],
    tips: [
      "손으로 직접 집어 먹는 자기 주도 이유식(BLW) 연습에 좋습니다",
      "스스로 먹는 연습을 통해 자율성과 독립심을 기릅니다",
    ],
  },
  "baby-23": {
    id: "baby-23",
    title: "아기 두부 계란국",
    description: "부드러운 두부와 계란이 들어간 국",
    stage: "complete",
    age_months_min: 12,
    cooking_time_minutes: 15,
    difficulty: "easy",
    ingredients: [
      { name: "육수", amount: "적당량" },
      { name: "두부", amount: "적당량", note: "깍둑 썬 두부" },
      { name: "달걀", amount: "1개", note: "노른자 또는 완자" },
      { name: "양파", amount: "적당량" },
      { name: "당근", amount: "적당량" },
    ],
    steps: [
      { step: 1, description: "육수에 다진 채소를 넣고 끓입니다" },
      { step: 2, description: "깍둑 썬 두부를 넣습니다" },
      { step: 3, description: "마지막에 푼 달걀(노른자 또는 완자)을 넣고 끓입니다 (간 X)" },
    ],
    nutrition_info: {
      calories: 90,
      protein: 7,
      carbs: 5,
      fat: 4,
    },
    allergy_warnings: ["계란"],
    tips: [
      "완료기에는 묽은 국물을 밥에 섞어주면 삼키기 편합니다",
      "돌 이후에는 계란 완자를 사용할 수 있습니다",
    ],
  },
  "baby-24": {
    id: "baby-24",
    title: "삼치/고등어 살구이",
    description: "뼈를 제거한 흰살 생선 구이",
    stage: "complete",
    age_months_min: 12,
    cooking_time_minutes: 20,
    difficulty: "medium",
    ingredients: [
      { name: "흰살 생선", amount: "적당량", note: "삼치, 고등어 등" },
      { name: "레몬즙", amount: "선택", note: "비린내 제거용" },
    ],
    steps: [
      { step: 1, description: "생선은 뼈를 완전히 제거하고 살만 발라냅니다" },
      { step: 2, description: "레몬즙을 살짝 뿌려 비린내를 잡습니다" },
      { step: 3, description: "팬에 굽거나 찜기에 쪄줍니다" },
    ],
    nutrition_info: {
      calories: 100,
      protein: 12,
      carbs: 0,
      fat: 5,
    },
    allergy_warnings: ["생선"],
    tips: [
      "돌 이후에는 생선도 중요한 단백질 공급원입니다",
      "알레르기 주의하며 시도합니다",
      "생선의 뼈를 완전히 제거하는 것이 가장 중요합니다",
    ],
  },
  "baby-25": {
    id: "baby-25",
    title: "부드러운 과일",
    description: "잘게 자른 바나나, 익은 배, 수박 등 손가락으로 집을 수 있는 크기",
    stage: "complete",
    age_months_min: 12,
    cooking_time_minutes: 5,
    difficulty: "easy",
    ingredients: [
      { name: "바나나", amount: "1/2개" },
      { name: "배", amount: "1/4개", note: "익은 배" },
      { name: "수박", amount: "50g", note: "씨 제거" },
    ],
    steps: [
      { step: 1, description: "바나나를 껍질을 벗기고 1cm 크기로 자릅니다" },
      { step: 2, description: "배를 껍질을 벗기고 씨를 제거한 후 1cm 크기로 자릅니다" },
      { step: 3, description: "수박의 씨를 완전히 제거하고 1cm 크기로 자릅니다" },
      { step: 4, description: "아기가 손가락으로 집을 수 있도록 적당한 크기로 준비합니다" },
    ],
    nutrition_info: {
      calories: 60,
      protein: 1,
      carbs: 15,
      fat: 0.2,
    },
    allergy_warnings: [],
    tips: [
      "과일은 자연스럽게 달콤해서 아기가 좋아합니다",
      "손가락으로 집을 수 있는 크기로 자르는 것이 중요합니다",
      "질식 위험이 있으니 너무 크게 자르지 마세요",
      "씨는 반드시 제거하세요",
    ],
  },
};

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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BabyRecipeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const recipe = babyRecipes[id];

  if (!recipe) {
    notFound();
  }

  console.log("[BabyRecipeDetailPage] 이유식 레시피 상세 페이지 렌더링:", id);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* 뒤로가기 버튼 */}
        <Link href="/archive/recipes?tab=baby">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로 돌아가기
          </Button>
        </Link>

        {/* 레시피 헤더 */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{recipe.title}</CardTitle>
                <CardDescription className="text-base">{recipe.description}</CardDescription>
              </div>
              <Baby className="h-8 w-8 text-pink-500 flex-shrink-0" />
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge className={stageColors[recipe.stage]}>
                {stageLabels[recipe.stage]}
              </Badge>
              {recipe.difficulty && (
                <Badge variant="outline">
                  {difficultyLabels[recipe.difficulty]}
                </Badge>
              )}
              {recipe.cooking_time_minutes && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {recipe.cooking_time_minutes}분
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* 알레르기 주의사항 */}
        {recipe.allergy_warnings && recipe.allergy_warnings.length > 0 && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900 font-semibold">알레르기 주의</AlertTitle>
            <AlertDescription className="text-amber-800 mt-2">
              이 레시피에는 다음 알레르기 유발 가능 재료가 포함되어 있습니다:{" "}
              <strong>{recipe.allergy_warnings.join(", ")}</strong>
              <br />
              처음 먹일 때는 소량으로 시작하고 아기의 반응을 주의 깊게 관찰하세요.
            </AlertDescription>
          </Alert>
        )}

        {/* 재료 */}
        <Card>
          <CardHeader>
            <CardTitle>재료</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">{ingredient.name}</span>
                    <span className="text-gray-600 ml-2">{ingredient.amount}</span>
                    {ingredient.note && (
                      <span className="text-gray-500 text-sm ml-2">({ingredient.note})</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 조리 단계 */}
        <Card>
          <CardHeader>
            <CardTitle>조리 방법</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {recipe.steps.map((step) => (
                <li key={step.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold">
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
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* 영양 정보 */}
        {recipe.nutrition_info && (
          <Card>
            <CardHeader>
              <CardTitle>영양 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recipe.nutrition_info.calories && (
                  <div>
                    <div className="text-sm text-gray-600">칼로리</div>
                    <div className="text-2xl font-bold">{recipe.nutrition_info.calories}kcal</div>
                  </div>
                )}
                {recipe.nutrition_info.protein && (
                  <div>
                    <div className="text-sm text-gray-600">단백질</div>
                    <div className="text-2xl font-bold">{recipe.nutrition_info.protein}g</div>
                  </div>
                )}
                {recipe.nutrition_info.carbs && (
                  <div>
                    <div className="text-sm text-gray-600">탄수화물</div>
                    <div className="text-2xl font-bold">{recipe.nutrition_info.carbs}g</div>
                  </div>
                )}
                {recipe.nutrition_info.fat && (
                  <div>
                    <div className="text-sm text-gray-600">지방</div>
                    <div className="text-2xl font-bold">{recipe.nutrition_info.fat}g</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 조리 팁 */}
        {recipe.tips && recipe.tips.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>조리 팁</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recipe.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-pink-500 mt-2 flex-shrink-0" />
                    <span className="text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 월령 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>추천 월령</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              이 레시피는 <strong>{recipe.age_months_min}개월</strong>
              {recipe.age_months_max ? `부터 ${recipe.age_months_max}개월` : " 이상"} 아기에게 적합합니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
