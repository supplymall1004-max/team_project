/**
 * @file lib/health/emotion-detector.ts
 * @description 건강 데이터 기반 캐릭터 감정 결정 로직
 *
 * 건강 점수, 식사, 수면, 활동량, 약물 복용 상태 등을 분석하여
 * 캐릭터의 현재 감정 상태를 결정합니다.
 *
 * @dependencies
 * - @/types/character: CharacterEmotion, EmotionState
 */

import type { CharacterEmotion, EmotionState } from "@/types/character";

/**
 * 감정 결정을 위한 입력 데이터
 */
export interface EmotionDetectionInput {
  healthScore: number; // 건강 점수 (0-100)
  healthStatus: "excellent" | "good" | "fair" | "needs_attention";
  hasDiseases: boolean; // 질병 유무
  recentMeals: {
    breakfast?: { calories: number; time?: string } | null;
    lunch?: { calories: number; time?: string } | null;
    dinner?: { calories: number; time?: string } | null;
  };
  dailyCalorieGoal?: number | null; // 일일 목표 칼로리
  currentCalories?: number; // 오늘 섭취한 칼로리
  sleepData?: {
    durationMinutes: number | null; // 수면 시간 (분)
    qualityScore: number | null; // 수면 품질 (1-10)
    lastSleepDate: string | null; // 마지막 수면 기록 날짜
  } | null;
  activityData?: {
    steps: number | null; // 걸음 수
    caloriesBurned: number | null; // 소모 칼로리
  } | null;
  medicationStatus: {
    missedCount: number; // 오늘 복용하지 않은 약물 개수
    totalCount: number; // 전체 약물 개수
  };
  urgentReminders: number; // 긴급 리마인드 개수
  recentHealthScoreChange?: number | null; // 최근 건강 점수 변화 (양수면 상승, 음수면 하락)
  hasPositiveNotifications: boolean; // 긍정적 알림 유무
}

/**
 * 현재 시간 기반 식사 시간 체크
 */
function getCurrentMealTime(): "breakfast" | "lunch" | "dinner" | "none" {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return "breakfast";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 17 && hour < 21) return "dinner";
  return "none";
}

/**
 * 식사 시간이 지났는지 확인
 */
function isMealTimePassed(mealTime: "breakfast" | "lunch" | "dinner"): boolean {
  const hour = new Date().getHours();
  switch (mealTime) {
    case "breakfast":
      return hour >= 10;
    case "lunch":
      return hour >= 15;
    case "dinner":
      return hour >= 21;
    default:
      return false;
  }
}

/**
 * 건강 데이터 기반 캐릭터 감정 결정
 */
export function detectCharacterEmotion(
  input: EmotionDetectionInput
): EmotionState {
  console.group("[emotion-detector] 감정 결정 시작");
  console.log("입력 데이터:", {
    healthScore: input.healthScore,
    hasDiseases: input.hasDiseases,
    missedMedications: input.medicationStatus.missedCount,
    urgentReminders: input.urgentReminders,
  });

  const emotions: Array<{ emotion: CharacterEmotion; score: number; reason: string }> = [];

  // 1. 화남 (약물 복용 누락 & 건강 점수 급락)
  if (input.medicationStatus.missedCount > 0 && input.recentHealthScoreChange && input.recentHealthScoreChange < -5) {
    const intensity = Math.min(100, 50 + input.medicationStatus.missedCount * 15 + Math.abs(input.recentHealthScoreChange) * 2);
    emotions.push({
      emotion: "angry",
      score: intensity,
      reason: `약물 ${input.medicationStatus.missedCount}개를 복용하지 않아 건강 점수가 ${Math.abs(input.recentHealthScoreChange)}점 하락했습니다.`,
    });
  }

  // 2. 아픔 (질병 있음 & 증상 기록)
  if (input.hasDiseases && input.healthStatus === "needs_attention") {
    const intensity = Math.min(100, 60 + (100 - input.healthScore) * 0.4);
    emotions.push({
      emotion: "sick",
      score: intensity,
      reason: "질병이 있어 몸이 아픕니다.",
    });
  }

  // 3. 걱정 (건강 검진 임박 & 위험 알림)
  if (input.urgentReminders > 0 && input.healthScore < 60) {
    const intensity = Math.min(100, 40 + input.urgentReminders * 10 + (60 - input.healthScore) * 0.5);
    emotions.push({
      emotion: "worried",
      score: intensity,
      reason: `긴급 알림 ${input.urgentReminders}개와 낮은 건강 점수로 걱정됩니다.`,
    });
  }

  // 4. 피곤함 (수면 부족 & 활동량 과다)
  if (input.sleepData) {
    const sleepHours = (input.sleepData.durationMinutes || 0) / 60;
    const isSleepDeprived = sleepHours < 6;
    const isOverActive = input.activityData?.steps && input.activityData.steps > 15000;
    
    if (isSleepDeprived || (isSleepDeprived && isOverActive)) {
      const intensity = Math.min(100, 50 + (6 - sleepHours) * 10 + (isOverActive ? 20 : 0));
      emotions.push({
        emotion: "tired",
        score: intensity,
        reason: `수면 시간이 ${sleepHours.toFixed(1)}시간으로 부족합니다.`,
      });
    }
  }

  // 5. 배고픔 (식사 시간 지남 & 칼로리 부족)
  const currentMealTime = getCurrentMealTime();
  if (currentMealTime !== "none") {
    const meal = input.recentMeals[currentMealTime];
    const mealTimePassed = isMealTimePassed(currentMealTime);
    const isCalorieDeficit = input.dailyCalorieGoal && input.currentCalories 
      ? input.currentCalories < input.dailyCalorieGoal * 0.5 
      : false;
    
    if (mealTimePassed && (!meal || meal.calories < 200)) {
      const intensity = isCalorieDeficit ? 80 : 60;
      emotions.push({
        emotion: "hungry",
        score: intensity,
        reason: `${currentMealTime === "breakfast" ? "아침" : currentMealTime === "lunch" ? "점심" : "저녁"} 식사 시간이 지났습니다.`,
      });
    }
  }

  // 6. 배부름 (식사 직후 & 칼로리 과다)
  if (input.currentCalories && input.dailyCalorieGoal) {
    const calorieRatio = input.currentCalories / input.dailyCalorieGoal;
    if (calorieRatio > 1.2) {
      const intensity = Math.min(100, 50 + (calorieRatio - 1.2) * 100);
      emotions.push({
        emotion: "full",
        score: intensity,
        reason: "목표 칼로리를 초과하여 배가 부릅니다.",
      });
    }
  }

  // 7. 슬픔 (건강 점수 낮음 & 지속적 저하)
  if (input.healthScore < 40 && input.recentHealthScoreChange && input.recentHealthScoreChange < -3) {
    const intensity = Math.min(100, 50 + (40 - input.healthScore) * 0.5 + Math.abs(input.recentHealthScoreChange) * 5);
    emotions.push({
      emotion: "sad",
      score: intensity,
      reason: `건강 점수가 ${input.healthScore}점으로 낮고 계속 하락하고 있습니다.`,
    });
  }

  // 8. 신남 (새로운 긍정적 알림 & 건강 점수 상승)
  if (input.hasPositiveNotifications && input.recentHealthScoreChange && input.recentHealthScoreChange > 3) {
    const intensity = Math.min(100, 60 + input.recentHealthScoreChange * 5);
    emotions.push({
      emotion: "excited",
      score: intensity,
      reason: `건강 점수가 ${input.recentHealthScoreChange}점 상승했습니다!`,
    });
  }

  // 9. 기쁨 (건강 점수 높음 & 긍정적 변화)
  if (input.healthScore >= 80 && (!input.recentHealthScoreChange || input.recentHealthScoreChange >= 0)) {
    const intensity = Math.min(100, 60 + (input.healthScore - 80) * 0.5);
    emotions.push({
      emotion: "happy",
      score: intensity,
      reason: `건강 점수가 ${input.healthScore}점으로 좋습니다!`,
    });
  }

  // 감정 우선순위 결정 (점수가 높은 순서대로)
  emotions.sort((a, b) => b.score - a.score);

  // 가장 높은 점수의 감정 선택
  const selectedEmotion = emotions.length > 0 ? emotions[0] : {
    emotion: "neutral" as CharacterEmotion,
    score: 50,
    reason: "건강 상태가 안정적입니다.",
  };

  console.log("결정된 감정:", selectedEmotion);
  console.groupEnd();

  return {
    emotion: selectedEmotion.emotion,
    intensity: Math.round(selectedEmotion.score),
    message: getEmotionMessage(selectedEmotion.emotion, selectedEmotion.score),
    reason: selectedEmotion.reason,
  };
}

/**
 * 감정별 기본 메시지 생성
 */
function getEmotionMessage(emotion: CharacterEmotion, intensity: number): string {
  const messages: Record<CharacterEmotion, string[]> = {
    happy: [
      "건강 상태가 좋아요! 😊",
      "오늘도 건강하게 지내고 있어요! ✨",
      "기분이 좋아요! 🎉",
    ],
    sad: [
      "건강이 걱정돼요... 😢",
      "조금 힘들어 보여요.",
      "건강 관리를 더 신경 써야 할 것 같아요.",
    ],
    sick: [
      "몸이 아파요... 😷",
      "병원에 가봐야 할 것 같아요.",
      "건강이 우려됩니다.",
    ],
    tired: [
      "너무 피곤해요... 😴",
      "충분한 휴식이 필요해요.",
      "잠을 더 자야 할 것 같아요.",
    ],
    hungry: [
      "배가 고파요... 🍽️",
      "식사 시간이에요!",
      "영양을 섭취해야 해요.",
    ],
    full: [
      "배가 부르네요! 😋",
      "충분히 드셨어요.",
      "다음 식사까지 시간이 걸릴 것 같아요.",
    ],
    excited: [
      "건강이 좋아지고 있어요! 🎊",
      "좋은 소식이에요!",
      "기분이 좋아요!",
    ],
    worried: [
      "건강이 걱정돼요... 😰",
      "주의가 필요해요.",
      "건강 관리를 확인해주세요.",
    ],
    angry: [
      "약물을 복용하지 않아 화가 나요! 😠",
      "건강 관리를 소홀히 하면 안 돼요.",
      "약물 복용을 잊지 마세요!",
    ],
    neutral: [
      "건강 상태가 안정적이에요.",
      "평온한 하루를 보내고 있어요.",
      "특별한 변화가 없어요.",
    ],
  };

  const emotionMessages = messages[emotion];
  const messageIndex = Math.floor(intensity / 34) % emotionMessages.length;
  return emotionMessages[messageIndex];
}

