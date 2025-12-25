/**
 * @file lib/health/speech-message-generator.ts
 * @description 말풍선 메시지 생성 로직
 *
 * 감정 상태와 건강 데이터를 기반으로 캐릭터가 말할 메시지를 생성합니다.
 *
 * @dependencies
 * - @/types/character: CharacterEmotion, EmotionState
 */

import type { CharacterEmotion, EmotionState } from "@/types/character";

/**
 * 말풍선 메시지 생성 옵션
 */
export interface SpeechMessageOptions {
  emotion: EmotionState;
  memberName: string;
  healthScore?: number;
  timeOfDay?: "morning" | "afternoon" | "evening" | "night";
}

/**
 * 시간대별 인사말
 */
function getTimeGreeting(timeOfDay?: "morning" | "afternoon" | "evening" | "night"): string {
  if (!timeOfDay) {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) timeOfDay = "morning";
    else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    else if (hour >= 17 && hour < 22) timeOfDay = "evening";
    else timeOfDay = "night";
  }

  const greetings: Record<typeof timeOfDay, string[]> = {
    morning: ["좋은 아침이에요!", "아침부터 건강하게!", "오늘도 좋은 하루 되세요!"],
    afternoon: ["점심 맛있게 드셨어요?", "오후도 화이팅!", "오후 건강 관리 잊지 마세요!"],
    evening: ["저녁 식사는 하셨어요?", "저녁 시간이에요!", "하루 수고하셨어요!"],
    night: ["좋은 밤 되세요!", "충분한 휴식이 필요해요!", "밤에는 일찍 주무세요!"],
  };

  const options = greetings[timeOfDay];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * 감정별 상세 메시지 생성
 */
export function generateSpeechMessage(options: SpeechMessageOptions): string {
  const { emotion, memberName, healthScore, timeOfDay } = options;
  const intensity = emotion.intensity;

  // 감정 강도에 따라 메시지 톤 조절
  const isHighIntensity = intensity >= 70;
  const isLowIntensity = intensity <= 30;

  // 감정별 메시지 풀
  const messages: Record<CharacterEmotion, string[]> = {
    happy: [
      isHighIntensity
        ? `건강 점수가 ${healthScore}점이에요! 정말 기뻐요! 🎉`
        : `건강 상태가 좋아요! ${healthScore ? `${healthScore}점` : ""} 유지하고 있어요! 😊`,
      `오늘도 건강하게 지내고 있어요! ✨`,
      `${getTimeGreeting(timeOfDay)} 건강 관리 잘 하고 계시네요!`,
    ],
    sad: [
      isHighIntensity
        ? `건강 점수가 ${healthScore}점으로 낮아서 걱정돼요... 😢`
        : `건강 관리를 더 신경 써야 할 것 같아요.`,
      `건강이 걱정돼요. 병원에 가보시는 게 어떨까요?`,
      `${emotion.reason || "건강 상태가 좋지 않아요."}`,
    ],
    sick: [
      isHighIntensity
        ? `몸이 많이 아파요... 병원에 가봐야 할 것 같아요. 😷`
        : `건강이 우려됩니다. 충분한 휴식을 취하세요.`,
      `증상이 있으시면 병원에 가보시는 게 좋아요.`,
      `${emotion.reason || "건강 관리가 필요해요."}`,
    ],
    tired: [
      isHighIntensity
        ? `너무 피곤해 보여요... 충분한 휴식이 필요해요. 😴`
        : `조금 피곤해 보이네요. 잠을 더 자는 게 좋을 것 같아요.`,
      `수면 시간이 부족한 것 같아요. 일찍 주무세요!`,
      `${emotion.reason || "충분한 휴식이 필요해요."}`,
    ],
    hungry: [
      isHighIntensity
        ? `배가 많이 고파요... 식사 시간이에요! 🍽️`
        : `식사 시간이 다가왔어요. 영양을 섭취해야 해요!`,
      `${emotion.reason || "식사 시간이에요!"}`,
      `건강한 식사를 하시면 기운이 날 거예요!`,
    ],
    full: [
      isHighIntensity
        ? `배가 많이 부르네요! 다음 식사까지 시간이 걸릴 것 같아요. 😋`
        : `충분히 드셨어요. 소화가 될 때까지 기다리세요.`,
      `과식은 건강에 좋지 않아요. 적당히 드시는 게 좋아요.`,
      `${emotion.reason || "배가 부르네요!"}`,
    ],
    excited: [
      isHighIntensity
        ? `건강 점수가 올랐어요! 정말 기뻐요! 🎊`
        : `좋은 소식이에요! 건강이 좋아지고 있어요!`,
      `${emotion.reason || "건강이 좋아지고 있어요!"}`,
      `계속 이렇게 건강하게 지내면 좋겠어요!`,
    ],
    worried: [
      isHighIntensity
        ? `건강이 많이 걱정돼요... 주의가 필요해요. 😰`
        : `건강 관리를 확인해주세요.`,
      `${emotion.reason || "건강이 걱정돼요."}`,
      `건강 검진이나 병원 방문을 고려해보세요.`,
    ],
    angry: [
      isHighIntensity
        ? `약물을 복용하지 않아서 화가 나요! 건강 관리를 소홀히 하면 안 돼요! 😠`
        : `약물 복용을 잊지 마세요. 건강이 중요해요!`,
      `${emotion.reason || "약물 복용을 잊지 마세요!"}`,
      `건강 관리를 제대로 하지 않으면 안 돼요!`,
    ],
    neutral: [
      `건강 상태가 안정적이에요.`,
      `${getTimeGreeting(timeOfDay)} 평온한 하루를 보내고 있어요.`,
      `특별한 변화가 없어요. 계속 건강하게 지내세요!`,
    ],
  };

  const emotionMessages = messages[emotion.emotion];
  const messageIndex = Math.floor(Math.random() * emotionMessages.length);
  let message = emotionMessages[messageIndex];

  // 멤버 이름 치환
  message = message.replace(/\{name\}/g, memberName);

  return message;
}

/**
 * 간단한 말풍선 메시지 (짧은 버전)
 */
export function generateShortSpeechMessage(emotion: EmotionState): string {
  return emotion.message;
}

