/**
 * @file lib/notifications/notification-templates.ts
 * @description 건강 알림 템플릿 관리 시스템
 *
 * 다양한 건강 알림 유형별로 표준화된 템플릿을 제공합니다.
 * - 예방주사 알림 템플릿
 * - 약물 복용 알림 템플릿
 * - 건강검진 알림 템플릿
 * - 병원 진료 알림 템플릿
 * - 다국어 지원 (한국어 기본)
 */

export interface NotificationTemplate {
  id: string;
  type: "vaccination" | "medication" | "checkup" | "appointment" | "general";
  priority: "low" | "normal" | "high" | "urgent";
  title: string;
  message: string;
  action?: {
    text: string;
    url?: string;
    type?: "view" | "confirm" | "schedule" | "call";
  };
  variables: string[]; // 템플릿에서 사용할 수 있는 변수들
  channels: ("push" | "sms" | "email" | "in_app")[];
  category: string; // UI에서 그룹화하기 위한 카테고리
}

export interface NotificationContext {
  userName?: string;
  familyMemberName?: string;
  vaccineName?: string;
  medicationName?: string;
  hospitalName?: string;
  date?: string;
  time?: string;
  daysUntil?: number;
  dosage?: string;
  frequency?: string;
  checkupType?: string;
  appointmentType?: string;
  customMessage?: string;
}

/**
 * 알림 템플릿 데이터베이스
 */
export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  // 예방주사 알림 템플릿
  {
    id: "vaccination_upcoming",
    type: "vaccination",
    priority: "normal",
    title: "💉 예방주사 예정",
    message: "{familyMemberName}님의 {vaccineName} 접종이 {daysUntil}일 남았어요.",
    action: {
      text: "일정 확인하기",
      type: "view",
      url: "/health/vaccinations/schedule",
    },
    variables: ["familyMemberName", "vaccineName", "daysUntil", "date"],
    channels: ["push", "email", "in_app"],
    category: "예방주사",
  },
  {
    id: "vaccination_reminder",
    type: "vaccination",
    priority: "high",
    title: "⏰ 예방주사 리마인더",
    message: "내일은 {familyMemberName}님의 {vaccineName} 접종일입니다.",
    action: {
      text: "접종 확인하기",
      type: "confirm",
      url: "/health/vaccinations/record",
    },
    variables: ["familyMemberName", "vaccineName", "date"],
    channels: ["push", "sms", "email", "in_app"],
    category: "예방주사",
  },
  {
    id: "vaccination_overdue",
    type: "vaccination",
    priority: "urgent",
    title: "⚠️ 예방주사 기간 초과",
    message: "{familyMemberName}님의 {vaccineName} 접종이 {daysUntil}일 지났습니다. 빠른 시일 내 접종을 진행해주세요.",
    action: {
      text: "병원 예약하기",
      type: "schedule",
      url: "/health/appointments/new",
    },
    variables: ["familyMemberName", "vaccineName", "daysUntil", "date"],
    channels: ["push", "sms", "email", "in_app"],
    category: "예방주사",
  },
  {
    id: "vaccination_completed",
    type: "vaccination",
    priority: "low",
    title: "✅ 예방주사 완료",
    message: "{familyMemberName}님의 {vaccineName} 접종이 완료되었습니다.",
    action: {
      text: "기록 확인하기",
      type: "view",
      url: "/health/vaccinations/record",
    },
    variables: ["familyMemberName", "vaccineName", "date"],
    channels: ["push", "in_app"],
    category: "예방주사",
  },

  // 약물 복용 알림 템플릿
  {
    id: "medication_reminder",
    type: "medication",
    priority: "normal",
    title: "💊 약 복용 시간",
    message: "{familyMemberName}님, {medicationName} {dosage} 복용하실 시간입니다.",
    action: {
      text: "복용 확인하기",
      type: "confirm",
      url: "/health/medications",
    },
    variables: ["familyMemberName", "medicationName", "dosage", "time", "frequency"],
    channels: ["push", "sms", "in_app"],
    category: "약물 복용",
  },
  {
    id: "medication_refill",
    type: "medication",
    priority: "high",
    title: "🔄 약 재처방 알림",
    message: "{familyMemberName}님의 {medicationName}이 곧 떨어집니다. ({daysUntil}일 남음)",
    action: {
      text: "처방전 확인하기",
      type: "schedule",
      url: "/health/appointments/new",
    },
    variables: ["familyMemberName", "medicationName", "daysUntil", "hospitalName"],
    channels: ["push", "email", "in_app"],
    category: "약물 복용",
  },
  {
    id: "medication_missed",
    type: "medication",
    priority: "urgent",
    title: "⚠️ 약 복용 누락",
    message: "{familyMemberName}님의 {medicationName} 복용을 잊으셨나요? 규칙적인 복용이 중요합니다.",
    action: {
      text: "복용 기록하기",
      type: "confirm",
      url: "/health/medications",
    },
    variables: ["familyMemberName", "medicationName", "time", "dosage"],
    channels: ["push", "sms", "in_app"],
    category: "약물 복용",
  },
  {
    id: "medication_started",
    type: "medication",
    priority: "low",
    title: "🏥 새로운 약 처방",
    message: "{familyMemberName}님에게 {medicationName}이 새로 처방되었습니다.",
    action: {
      text: "복용 안내 보기",
      type: "view",
      url: "/health/medications",
    },
    variables: ["familyMemberName", "medicationName", "dosage", "frequency", "hospitalName"],
    channels: ["push", "email", "in_app"],
    category: "약물 복용",
  },

  // 건강검진 알림 템플릿
  {
    id: "checkup_upcoming",
    type: "checkup",
    priority: "normal",
    title: "🏥 건강검진 예정",
    message: "{familyMemberName}님의 {checkupType} 검진이 {daysUntil}일 남았습니다.",
    action: {
      text: "검진 준비하기",
      type: "view",
      url: "/health/checkups",
    },
    variables: ["familyMemberName", "checkupType", "daysUntil", "date", "hospitalName"],
    channels: ["push", "email", "in_app"],
    category: "건강검진",
  },
  {
    id: "checkup_reminder",
    type: "checkup",
    priority: "high",
    title: "📅 건강검진 리마인더",
    message: "오늘은 {familyMemberName}님의 {checkupType} 검진일입니다.",
    action: {
      text: "병원 정보 보기",
      type: "view",
      url: "/health/checkups",
    },
    variables: ["familyMemberName", "checkupType", "date", "time", "hospitalName"],
    channels: ["push", "sms", "email", "in_app"],
    category: "건강검진",
  },
  {
    id: "checkup_result",
    type: "checkup",
    priority: "normal",
    title: "📊 건강검진 결과 도착",
    message: "{familyMemberName}님의 {checkupType} 검진 결과가 도착했습니다.",
    action: {
      text: "결과 확인하기",
      type: "view",
      url: "/health/checkups/results",
    },
    variables: ["familyMemberName", "checkupType", "date", "hospitalName"],
    channels: ["push", "email", "in_app"],
    category: "건강검진",
  },
  {
    id: "checkup_overdue",
    type: "checkup",
    priority: "urgent",
    title: "⚠️ 건강검진 기간 초과",
    message: "{familyMemberName}님의 {checkupType} 검진이 {daysUntil}일 지났습니다. 정기 검진을 권장드립니다.",
    action: {
      text: "검진 예약하기",
      type: "schedule",
      url: "/health/appointments/new",
    },
    variables: ["familyMemberName", "checkupType", "daysUntil", "date"],
    channels: ["push", "email", "in_app"],
    category: "건강검진",
  },

  // 병원 진료 알림 템플릿
  {
    id: "appointment_upcoming",
    type: "appointment",
    priority: "normal",
    title: "🏥 진료 예약 알림",
    message: "{familyMemberName}님의 {appointmentType} 진료가 {daysUntil}일 남았습니다. ({hospitalName})",
    action: {
      text: "예약 확인하기",
      type: "view",
      url: "/health/appointments",
    },
    variables: ["familyMemberName", "appointmentType", "daysUntil", "date", "time", "hospitalName"],
    channels: ["push", "email", "in_app"],
    category: "병원 진료",
  },
  {
    id: "appointment_reminder",
    type: "appointment",
    priority: "high",
    title: "🔔 진료 리마인더",
    message: "오늘 {time}에 {familyMemberName}님의 {appointmentType} 진료가 있습니다. ({hospitalName})",
    action: {
      text: "병원 길찾기",
      type: "view",
      url: "/health/appointments",
    },
    variables: ["familyMemberName", "appointmentType", "date", "time", "hospitalName"],
    channels: ["push", "sms", "in_app"],
    category: "병원 진료",
  },
  {
    id: "appointment_cancelled",
    type: "appointment",
    priority: "normal",
    title: "❌ 진료 취소 알림",
    message: "{familyMemberName}님의 {appointmentType} 진료 예약이 취소되었습니다.",
    action: {
      text: "다시 예약하기",
      type: "schedule",
      url: "/health/appointments/new",
    },
    variables: ["familyMemberName", "appointmentType", "date", "time", "hospitalName"],
    channels: ["push", "email", "in_app"],
    category: "병원 진료",
  },
  {
    id: "appointment_completed",
    type: "appointment",
    priority: "low",
    title: "✅ 진료 완료",
    message: "{familyMemberName}님의 {appointmentType} 진료가 완료되었습니다.",
    action: {
      text: "진료 기록 보기",
      type: "view",
      url: "/health/hospital-records",
    },
    variables: ["familyMemberName", "appointmentType", "date", "hospitalName"],
    channels: ["push", "in_app"],
    category: "병원 진료",
  },

  // 일반 알림 템플릿
  {
    id: "general_health_alert",
    type: "general",
    priority: "urgent",
    title: "🚨 건강 알림",
    message: "{customMessage}",
    action: {
      text: "자세히 보기",
      type: "view",
      url: "/health/dashboard",
    },
    variables: ["customMessage", "userName", "familyMemberName"],
    channels: ["push", "sms", "email", "in_app"],
    category: "일반",
  },
  {
    id: "general_health_tip",
    type: "general",
    priority: "low",
    title: "💡 건강 Tip",
    message: "{customMessage}",
    action: {
      text: "더 보기",
      type: "view",
      url: "/health/tips",
    },
    variables: ["customMessage", "userName"],
    channels: ["push", "in_app"],
    category: "일반",
  },
];

/**
 * 템플릿 ID로 템플릿 찾기
 */
export function getTemplateById(templateId: string): NotificationTemplate | undefined {
  return NOTIFICATION_TEMPLATES.find(template => template.id === templateId);
}

/**
 * 템플릿 타입으로 템플릿 목록 가져오기
 */
export function getTemplatesByType(type: NotificationTemplate["type"]): NotificationTemplate[] {
  return NOTIFICATION_TEMPLATES.filter(template => template.type === type);
}

/**
 * 템플릿 카테고리로 템플릿 목록 가져오기
 */
export function getTemplatesByCategory(category: string): NotificationTemplate[] {
  return NOTIFICATION_TEMPLATES.filter(template => template.category === category);
}

/**
 * 템플릿 메시지 렌더링
 */
export function renderTemplateMessage(
  template: NotificationTemplate,
  context: NotificationContext
): { title: string; message: string } {
  let title = template.title;
  let message = template.message;

  // 변수 치환
  Object.entries(context).forEach(([key, value]) => {
    if (value !== undefined) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      title = title.replace(regex, String(value));
      message = message.replace(regex, String(value));
    }
  });

  // 남은 변수는 빈 문자열로 치환
  title = title.replace(/\{[^}]+\}/g, '');
  message = message.replace(/\{[^}]+\}/g, '');

  return { title, message };
}

/**
 * 채널별로 적절한 템플릿 필터링
 */
export function getTemplatesForChannel(
  channel: "push" | "sms" | "email" | "in_app"
): NotificationTemplate[] {
  return NOTIFICATION_TEMPLATES.filter(template =>
    template.channels.includes(channel)
  );
}

/**
 * 우선순위별 템플릿 필터링
 */
export function getTemplatesByPriority(
  priority: NotificationTemplate["priority"]
): NotificationTemplate[] {
  return NOTIFICATION_TEMPLATES.filter(template =>
    template.priority === priority
  );
}

/**
 * 모든 카테고리 목록 가져오기
 */
export function getCategories(): string[] {
  const categories = new Set(NOTIFICATION_TEMPLATES.map(template => template.category));
  return Array.from(categories);
}

/**
 * 템플릿 검증
 */
export function validateTemplate(
  templateId: string,
  context: NotificationContext,
  channel: "push" | "sms" | "email" | "in_app"
): { isValid: boolean; missingVariables: string[]; unsupportedChannel: boolean } {
  const template = getTemplateById(templateId);

  if (!template) {
    return { isValid: false, missingVariables: [], unsupportedChannel: false };
  }

  // 채널 지원 여부 확인
  const channelSupported = template.channels.includes(channel);

  // 필수 변수 확인 ({}로 감싸진 변수들)
  const requiredVariables = template.variables;
  const missingVariables = requiredVariables.filter(variable => {
    const value = context[variable as keyof NotificationContext];
    return value === undefined || value === null || value === '';
  });

  return {
    isValid: channelSupported && missingVariables.length === 0,
    missingVariables,
    unsupportedChannel: !channelSupported,
  };
}

/**
 * 기본 템플릿 추천
 */
export function getRecommendedTemplate(
  type: NotificationTemplate["type"],
  priority: NotificationTemplate["priority"] = "normal",
  channel: "push" | "sms" | "email" | "in_app" = "push"
): NotificationTemplate | null {
  const candidates = NOTIFICATION_TEMPLATES.filter(template =>
    template.type === type &&
    template.priority === priority &&
    template.channels.includes(channel)
  );

  // 가장 일반적인 템플릿을 우선 추천
  return candidates.find(template =>
    template.id.includes("upcoming") ||
    template.id.includes("reminder") ||
    template.id.includes("completed")
  ) || candidates[0] || null;
}

