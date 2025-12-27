/**
 * @file types/game/character-game-events.ts
 * @description 캐릭터창 게임화 시스템 타입 정의
 *
 * 게임 이벤트, 아기 분유 스케줄, 캐릭터 위치 등 게임 관련 타입을 정의합니다.
 */

/**
 * 게임 이벤트 타입
 */
export type CharacterGameEventType =
  | "medication"
  | "baby_feeding"
  | "health_checkup"
  | "vaccination"
  | "kcdc_alert"
  | "lifecycle_event"
  | "custom";

/**
 * 게임 이벤트 상태
 */
export type CharacterGameEventStatus =
  | "pending"
  | "active"
  | "completed"
  | "missed"
  | "cancelled";

/**
 * 게임 이벤트 우선순위
 */
export type CharacterGameEventPriority = "low" | "normal" | "high" | "urgent";

/**
 * 약물 복용 이벤트 데이터
 */
export interface MedicationEventData {
  medication_record_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  scheduled_time: string; // HH:mm 형식
  dialogue_message: string; // 예: "엄마, 약 먹을 시간이야. 약 줘!"
}

/**
 * 아기 분유 이벤트 데이터
 */
export interface BabyFeedingEventData {
  feeding_schedule_id: string;
  baby_name: string;
  feeding_interval_hours: number;
  last_feeding_time: string | null;
  dialogue_message: string; // 예: "아기가 울고 있어요. 분유를 주세요!"
  crying_intensity?: number; // 0-100 (울음 강도)
}

/**
 * 건강검진 이벤트 데이터
 */
export interface HealthCheckupEventData {
  checkup_type: string;
  recommended_date: string;
  days_until: number;
  dialogue_message: string;
  hospital_name?: string;
}

/**
 * 예방접종 이벤트 데이터
 */
export interface VaccinationEventData {
  vaccine_name: string;
  recommended_date: string;
  days_until: number;
  priority: string;
  dialogue_message: string;
}

/**
 * 질병청 알림 이벤트 데이터
 */
export interface KCDCAlertEventData {
  alert_type: string;
  title: string;
  content: string;
  severity: "info" | "warning" | "critical";
  dialogue_message: string;
}

/**
 * 생애주기 이벤트 데이터
 */
export interface LifecycleEventData {
  notification_id: string;
  event_code: string;
  event_name: string;
  event_type: string;
  category: string;
  days_until: number | null;
  dialogue_message: string;
  has_professional_info?: boolean;
  requires_user_choice?: boolean;
}

/**
 * 커스텀 이벤트 데이터
 */
export interface CustomEventData {
  title: string;
  description: string;
  dialogue_message: string;
  [key: string]: any;
}

/**
 * 게임 이벤트 데이터 (유니온 타입)
 */
export type CharacterGameEventData =
  | MedicationEventData
  | BabyFeedingEventData
  | HealthCheckupEventData
  | VaccinationEventData
  | KCDCAlertEventData
  | LifecycleEventData
  | CustomEventData;

/**
 * 캐릭터 게임 이벤트
 */
export interface CharacterGameEvent {
  id: string;
  user_id: string;
  family_member_id: string | null;
  event_type: CharacterGameEventType;
  event_data: CharacterGameEventData;
  scheduled_time: string; // ISO 8601 형식
  status: CharacterGameEventStatus;
  priority: CharacterGameEventPriority;
  completed_at: string | null;
  points_earned: number;
  experience_earned: number;
  created_at: string;
  updated_at: string;
}

/**
 * 아기 분유 스케줄
 */
export interface BabyFeedingSchedule {
  id: string;
  user_id: string;
  family_member_id: string;
  feeding_interval_hours: number; // 예: 3.0 (3시간마다)
  last_feeding_time: string | null;
  next_feeding_time: string | null;
  is_active: boolean;
  reminder_enabled: boolean;
  reminder_minutes_before: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 캐릭터 위치 (Unity 게임 월드 좌표)
 */
export interface CharacterPosition {
  x: number;
  y: number;
  z: number;
}

/**
 * 캐릭터 활동 유형
 */
export type CharacterActivityType =
  | "idle"
  | "walking"
  | "talking"
  | "working"
  | "eating"
  | "sleeping"
  | "playing";

/**
 * 캐릭터 위치 및 상태
 */
export interface CharacterPositionData {
  id: string;
  user_id: string;
  family_member_id: string;
  current_position: CharacterPosition;
  target_position: CharacterPosition | null;
  activity_type: CharacterActivityType | null;
  last_updated: string;
  created_at: string;
}

/**
 * 게임 상호작용 타입
 */
export type CharacterGameInteractionType =
  | "medication_given"
  | "feeding_given"
  | "checkup_scheduled"
  | "vaccination_scheduled"
  | "dialogue_completed"
  | "event_completed";

/**
 * 캐릭터 게임 상호작용
 */
export interface CharacterGameInteraction {
  id: string;
  user_id: string;
  family_member_id: string | null;
  event_id: string | null;
  interaction_type: CharacterGameInteractionType;
  interaction_data: Record<string, any>;
  points_earned: number;
  experience_earned: number;
  created_at: string;
}

/**
 * 게임 설정
 */
export interface CharacterGameSettings {
  characterGameEnabled: boolean;
  autoWalkEnabled: boolean;
  soundEnabled: boolean;
  notificationEnabled: boolean;
  gameTheme: "default" | "modern" | "classic";
}

/**
 * 게임 이벤트 생성 파라미터
 */
export interface CreateCharacterGameEventParams {
  user_id: string;
  family_member_id?: string | null;
  event_type: CharacterGameEventType;
  event_data: CharacterGameEventData;
  scheduled_time: string;
  priority?: CharacterGameEventPriority;
}

/**
 * 아기 분유 스케줄 생성 파라미터
 */
export interface CreateBabyFeedingScheduleParams {
  user_id: string;
  family_member_id: string;
  feeding_interval_hours: number;
  reminder_enabled?: boolean;
  reminder_minutes_before?: number;
  notes?: string | null;
}

/**
 * 캐릭터 위치 업데이트 파라미터
 */
export interface UpdateCharacterPositionParams {
  user_id: string;
  family_member_id: string;
  current_position?: CharacterPosition;
  target_position?: CharacterPosition | null;
  activity_type?: CharacterActivityType | null;
}

/**
 * 게임 이벤트 완료 파라미터
 */
export interface CompleteCharacterGameEventParams {
  event_id: string;
  user_id: string;
  points_earned?: number;
  experience_earned?: number;
}

/**
 * 대화 메시지
 */
export interface DialogueMessage {
  character_name: string;
  message: string;
  emotion?: string;
  animation?: string;
}

/**
 * 게임 이벤트 응답 (이벤트 완료 시)
 */
export interface CharacterGameEventResponse {
  success: boolean;
  event?: CharacterGameEvent;
  points_earned: number;
  experience_earned: number;
  new_total_points?: number;
  new_total_experience?: number;
  leveled_up?: boolean;
  error?: string;
}

