/**
 * @file lib/game/character-dialogue.ts
 * @description 캐릭터 대화 메시지 생성
 *
 * 게임 이벤트 타입에 따라 적절한 대화 메시지를 생성합니다.
 *
 * @dependencies
 * - @/types/game/character-game-events: 게임 이벤트 타입
 */

import type {
  DialogueMessage,
  CharacterGameEvent,
  MedicationEventData,
  BabyFeedingEventData,
  HealthCheckupEventData,
  VaccinationEventData,
  KCDCAlertEventData,
  LifecycleEventData,
} from "@/types/game/character-game-events";

/**
 * 게임 이벤트에서 대화 메시지 생성
 */
export function createDialogueFromEvent(
  event: CharacterGameEvent,
  characterName: string
): DialogueMessage {
  const eventData = event.event_data;

  switch (event.event_type) {
    case "medication": {
      const data = eventData as MedicationEventData;
      return {
        character_name: characterName,
        message: data.dialogue_message || `${data.medication_name} 먹을 시간이야. 약 줘!`,
        emotion: "worried",
        animation: "talking",
      };
    }

    case "baby_feeding": {
      const data = eventData as BabyFeedingEventData;
      return {
        character_name: characterName,
        message: data.dialogue_message || `${data.baby_name}가 울고 있어요. 분유를 주세요!`,
        emotion: "sad",
        animation: "crying",
      };
    }

    case "health_checkup": {
      const data = eventData as HealthCheckupEventData;
      return {
        character_name: characterName,
        message: data.dialogue_message || `건강검진 예약일이 ${data.days_until}일 남았어요.`,
        emotion: "neutral",
        animation: "talking",
      };
    }

    case "vaccination": {
      const data = eventData as VaccinationEventData;
      return {
        character_name: characterName,
        message: data.dialogue_message || `${data.vaccine_name} 예방접종일이 ${data.days_until}일 남았어요.`,
        emotion: "neutral",
        animation: "talking",
      };
    }

    case "kcdc_alert": {
      const data = eventData as KCDCAlertEventData;
      return {
        character_name: characterName,
        message: data.dialogue_message || data.title,
        emotion: data.severity === "critical" ? "worried" : "neutral",
        animation: "talking",
      };
    }

    case "lifecycle_event": {
      const data = eventData as LifecycleEventData;
      // 생애주기 이벤트는 이벤트 타입에 따라 감정 결정
      let emotion: "excited" | "neutral" | "worried" = "excited";
      if (data.event_type === "sensitive_health") {
        emotion = "worried";
      } else if (data.event_type === "health_checkup" || data.event_type === "vaccination") {
        emotion = "neutral";
      }
      
      return {
        character_name: characterName,
        message: data.dialogue_message || `${data.event_name} 알림이 있어요!`,
        emotion,
        animation: "talking",
      };
    }

    default:
      return {
        character_name: characterName,
        message: "알림이 있어요!",
        emotion: "neutral",
        animation: "talking",
      };
  }
}

/**
 * 약물 복용 대화 메시지 생성
 */
export function createMedicationDialogue(
  medicationName: string,
  characterName: string,
  relationship?: string
): DialogueMessage {
  const relationshipText = relationship ? `${relationship} ` : "";
  return {
    character_name: characterName,
    message: `${relationshipText}${medicationName} 먹을 시간이야. 약 줘!`,
    emotion: "worried",
    animation: "talking",
  };
}

/**
 * 아기 분유 대화 메시지 생성
 */
export function createBabyFeedingDialogue(
  babyName: string,
  cryingIntensity: number = 80
): DialogueMessage {
  const intensityText = cryingIntensity > 70 ? "심하게" : cryingIntensity > 40 ? "" : "조금";
  return {
    character_name: babyName,
    message: `${babyName}가 ${intensityText} 울고 있어요. 분유를 주세요!`,
    emotion: "sad",
    animation: "crying",
  };
}

