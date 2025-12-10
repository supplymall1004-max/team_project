/**
 * @file lib/notifications/health-notification-service.ts
 * @description 통합 건강 알림 발송 서비스
 *
 * 모든 건강 관련 알림을 통합적으로 관리하고 발송하는 서비스입니다:
 * - 예방주사 알림
 * - 약물 복용 알림
 * - 건강검진 알림
 * - 병원 진료 알림
 * - 가족 구성원별 맞춤 알림
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import {
  NOTIFICATION_TEMPLATES,
  getTemplateById,
  renderTemplateMessage,
  validateTemplate,
  getRecommendedTemplate,
  type NotificationTemplate,
  type NotificationContext
} from "./notification-templates";

export interface HealthNotificationRequest {
  userId: string;
  familyMemberId?: string;
  type: "vaccination" | "medication" | "checkup" | "appointment" | "general";
  templateId?: string;
  context: NotificationContext;
  channels: ("push" | "sms" | "email" | "in_app")[];
  priority?: "low" | "normal" | "high" | "urgent";
  scheduledAt?: Date;
  isTest?: boolean;
}

export interface HealthNotificationResult {
  success: boolean;
  notificationIds: string[];
  errors: string[];
  channels: {
    channel: string;
    success: boolean;
    notificationId?: string;
    error?: string;
  }[];
}

/**
 * 건강 알림 발송 메인 함수
 */
export async function sendHealthNotification(
  request: HealthNotificationRequest
): Promise<HealthNotificationResult> {
  console.group("[HealthNotificationService] 건강 알림 발송");

  try {
    const supabase = getServiceRoleClient();
    const result: HealthNotificationResult = {
      success: true,
      notificationIds: [],
      errors: [],
      channels: [],
    };

    // 템플릿 선택 (지정되지 않은 경우 자동 추천)
    let template: NotificationTemplate | null = null;

    if (request.templateId) {
      template = getTemplateById(request.templateId) || null;
      if (!template) {
        const error = `템플릿을 찾을 수 없습니다: ${request.templateId}`;
        console.error(error);
        result.errors.push(error);
        result.success = false;
        return result;
      }
    } else {
      template = getRecommendedTemplate(
        request.type,
        request.priority || "normal",
        request.channels[0] || "push"
      );

      if (!template) {
        const error = `적절한 템플릿을 찾을 수 없습니다: ${request.type}`;
        console.error(error);
        result.errors.push(error);
        result.success = false;
        return result;
      }
    }

    console.log(`선택된 템플릿: ${template.id}`);

    // 각 채널별로 알림 발송
    for (const channel of request.channels) {
      try {
        // 템플릿 검증
        const validation = validateTemplate(template.id, request.context, channel);
        if (!validation.isValid) {
          const error = `채널 ${channel}에 대한 템플릿 검증 실패: ${validation.missingVariables.join(', ')}`;
          console.error(error);
          result.channels.push({
            channel,
            success: false,
            error,
          });
          continue;
        }

        // 메시지 렌더링
        const { title, message } = renderTemplateMessage(template, request.context);

        // 채널별 발송 로직
        const channelResult = await sendToChannel({
          channel,
          userId: request.userId,
          familyMemberId: request.familyMemberId,
          title,
          message,
          template,
          context: request.context,
          priority: request.priority || template.priority,
          scheduledAt: request.scheduledAt,
          isTest: request.isTest,
        });

        result.channels.push(channelResult);
        if (channelResult.success && channelResult.notificationId) {
          result.notificationIds.push(channelResult.notificationId);
        } else if (channelResult.error) {
          result.errors.push(channelResult.error);
        }

      } catch (error) {
        const errorMessage = `채널 ${channel} 알림 발송 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
        console.error(errorMessage);
        result.channels.push({
          channel,
          success: false,
          error: errorMessage,
        });
        result.errors.push(errorMessage);
      }
    }

    // 전체 성공 여부 결정
    result.success = result.channels.some(c => c.success) && result.errors.length === 0;

    console.log(`알림 발송 완료: ${result.success ? '성공' : '부분 실패'}`);
    console.groupEnd();

    return result;

  } catch (error) {
    const errorMessage = `건강 알림 발송 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
    console.error(errorMessage);
    console.groupEnd();

    return {
      success: false,
      notificationIds: [],
      errors: [errorMessage],
      channels: request.channels.map(channel => ({
        channel,
        success: false,
        error: errorMessage,
      })),
    };
  }
}

/**
 * 채널별 알림 발송 인터페이스
 */
interface ChannelSendRequest {
  channel: "push" | "sms" | "email" | "in_app";
  userId: string;
  familyMemberId?: string;
  title: string;
  message: string;
  template: NotificationTemplate;
  context: NotificationContext;
  priority: "low" | "normal" | "high" | "urgent";
  scheduledAt?: Date;
  isTest?: boolean;
}

interface ChannelSendResult {
  channel: string;
  success: boolean;
  notificationId?: string;
  error?: string;
}

/**
 * 채널별 알림 발송 구현
 */
async function sendToChannel(request: ChannelSendRequest): Promise<ChannelSendResult> {
  const supabase = getServiceRoleClient();

  try {
    switch (request.channel) {
      case "push":
        return await sendPushNotification(request);

      case "sms":
        return await sendSmsNotification(request);

      case "email":
        return await sendEmailNotification(request);

      case "in_app":
        return await sendInAppNotification(request);

      default:
        return {
          channel: request.channel,
          success: false,
          error: `지원되지 않는 채널: ${request.channel}`,
        };
    }
  } catch (error) {
    return {
      channel: request.channel,
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    };
  }
}

/**
 * 푸시 알림 발송
 */
async function sendPushNotification(request: ChannelSendRequest): Promise<ChannelSendResult> {
  const supabase = getServiceRoleClient();

  try {
    // 사용자 푸시 토큰 조회
    const { data: userTokens, error: tokenError } = await supabase
      .from("user_push_tokens")
      .select("token, device_type")
      .eq("user_id", request.userId)
      .eq("active", true);

    if (tokenError) {
      throw new Error(`푸시 토큰 조회 실패: ${tokenError.message}`);
    }

    if (!userTokens || userTokens.length === 0) {
      return {
        channel: "push",
        success: false,
        error: "등록된 푸시 토큰이 없습니다",
      };
    }

    // 실제 푸시 발송 로직 (FCM, APNs 등 연동 필요)
    // 여기서는 모의 구현
    console.log(`푸시 알림 발송: ${request.title} - ${request.message}`);

    // 알림 로그 저장
    const { data: notification, error: logError } = await supabase
      .from("health_notifications")
      .insert({
        user_id: request.userId,
        family_member_id: request.familyMemberId,
        type: request.template.type,
        channel: "push",
        title: request.title,
        message: request.message,
        priority: request.priority,
        template_id: request.template.id,
        context_data: request.context,
        sent_at: new Date().toISOString(),
        status: "sent",
        is_test: request.isTest || false,
      })
      .select()
      .single();

    if (logError) {
      throw new Error(`알림 로그 저장 실패: ${logError.message}`);
    }

    return {
      channel: "push",
      success: true,
      notificationId: notification.id,
    };

  } catch (error) {
    return {
      channel: "push",
      success: false,
      error: error instanceof Error ? error.message : '푸시 알림 발송 실패',
    };
  }
}

/**
 * SMS 알림 발송
 */
async function sendSmsNotification(request: ChannelSendRequest): Promise<ChannelSendResult> {
  const supabase = getServiceRoleClient();

  try {
    // 사용자 전화번호 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("phone")
      .eq("id", request.userId)
      .single();

    if (userError || !user?.phone) {
      return {
        channel: "sms",
        success: false,
        error: "등록된 전화번호가 없습니다",
      };
    }

    // SMS 발송 로직 (Twilio, Naver Cloud 등 연동 필요)
    // 여기서는 모의 구현
    console.log(`SMS 발송: ${user.phone} - ${request.title}: ${request.message}`);

    // 알림 로그 저장
    const { data: notification, error: logError } = await supabase
      .from("health_notifications")
      .insert({
        user_id: request.userId,
        family_member_id: request.familyMemberId,
        type: request.template.type,
        channel: "sms",
        title: request.title,
        message: request.message,
        priority: request.priority,
        template_id: request.template.id,
        context_data: request.context,
        sent_at: new Date().toISOString(),
        status: "sent",
        recipient: user.phone,
        is_test: request.isTest || false,
      })
      .select()
      .single();

    if (logError) {
      throw new Error(`SMS 알림 로그 저장 실패: ${logError.message}`);
    }

    return {
      channel: "sms",
      success: true,
      notificationId: notification.id,
    };

  } catch (error) {
    return {
      channel: "sms",
      success: false,
      error: error instanceof Error ? error.message : 'SMS 발송 실패',
    };
  }
}

/**
 * 이메일 알림 발송
 */
async function sendEmailNotification(request: ChannelSendRequest): Promise<ChannelSendResult> {
  const supabase = getServiceRoleClient();

  try {
    // 사용자 이메일 조회 (Clerk에서 가져와야 할 수도 있음)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email")
      .eq("id", request.userId)
      .single();

    if (userError || !user?.email) {
      return {
        channel: "email",
        success: false,
        error: "등록된 이메일이 없습니다",
      };
    }

    // 이메일 발송 로직 (SendGrid, AWS SES 등 연동 필요)
    // 여기서는 모의 구현
    console.log(`이메일 발송: ${user.email} - ${request.title}: ${request.message}`);

    // 알림 로그 저장
    const { data: notification, error: logError } = await supabase
      .from("health_notifications")
      .insert({
        user_id: request.userId,
        family_member_id: request.familyMemberId,
        type: request.template.type,
        channel: "email",
        title: request.title,
        message: request.message,
        priority: request.priority,
        template_id: request.template.id,
        context_data: request.context,
        sent_at: new Date().toISOString(),
        status: "sent",
        recipient: user.email,
        is_test: request.isTest || false,
      })
      .select()
      .single();

    if (logError) {
      throw new Error(`이메일 알림 로그 저장 실패: ${logError.message}`);
    }

    return {
      channel: "email",
      success: true,
      notificationId: notification.id,
    };

  } catch (error) {
    return {
      channel: "email",
      success: false,
      error: error instanceof Error ? error.message : '이메일 발송 실패',
    };
  }
}

/**
 * 앱 내 알림 발송
 */
async function sendInAppNotification(request: ChannelSendRequest): Promise<ChannelSendResult> {
  const supabase = getServiceRoleClient();

  try {
    // 앱 내 알림 로그 저장
    const { data: notification, error: logError } = await supabase
      .from("health_notifications")
      .insert({
        user_id: request.userId,
        family_member_id: request.familyMemberId,
        type: request.template.type,
        channel: "in_app",
        title: request.title,
        message: request.message,
        priority: request.priority,
        template_id: request.template.id,
        context_data: request.context,
        sent_at: new Date().toISOString(),
        status: "sent",
        is_read: false,
        is_test: request.isTest || false,
      })
      .select()
      .single();

    if (logError) {
      throw new Error(`앱 내 알림 저장 실패: ${logError.message}`);
    }

    console.log(`앱 내 알림 저장: ${request.title} - ${request.message}`);

    return {
      channel: "in_app",
      success: true,
      notificationId: notification.id,
    };

  } catch (error) {
    return {
      channel: "in_app",
      success: false,
      error: error instanceof Error ? error.message : '앱 내 알림 저장 실패',
    };
  }
}

/**
 * 알림 발송 이력 조회
 */
export async function getNotificationHistory(
  userId: string,
  options: {
    type?: string;
    channel?: string;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const supabase = getServiceRoleClient();

  try {
    let query = supabase
      .from("health_notifications")
      .select(`
        id,
        type,
        channel,
        title,
        message,
        priority,
        template_id,
        context_data,
        sent_at,
        status,
        is_read,
        family_member_id,
        family_members(name, relation)
      `)
      .eq("user_id", userId)
      .order("sent_at", { ascending: false });

    if (options.type) {
      query = query.eq("type", options.type);
    }

    if (options.channel) {
      query = query.eq("channel", options.channel);
    }

    if (options.startDate) {
      query = query.gte("sent_at", options.startDate.toISOString());
    }

    if (options.endDate) {
      query = query.lte("sent_at", options.endDate.toISOString());
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`알림 이력 조회 실패: ${error.message}`);
    }

    return data || [];

  } catch (error) {
    console.error("알림 이력 조회 중 오류:", error);
    throw error;
  }
}

/**
 * 알림 읽음 처리
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  const supabase = getServiceRoleClient();

  try {
    const { error } = await supabase
      .from("health_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`알림 읽음 처리 실패: ${error.message}`);
    }

    return true;

  } catch (error) {
    console.error("알림 읽음 처리 중 오류:", error);
    throw error;
  }
}

/**
 * 일괄 알림 읽음 처리
 */
export async function markNotificationsAsRead(notificationIds: string[], userId: string) {
  const supabase = getServiceRoleClient();

  try {
    const { error } = await supabase
      .from("health_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in("id", notificationIds)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`일괄 알림 읽음 처리 실패: ${error.message}`);
    }

    return true;

  } catch (error) {
    console.error("일괄 알림 읽음 처리 중 오류:", error);
    throw error;
  }
}

/**
 * 알림 통계 조회
 */
export async function getNotificationStats(userId: string, days: number = 30) {
  const supabase = getServiceRoleClient();

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("health_notifications")
      .select("type, channel, status, sent_at")
      .eq("user_id", userId)
      .gte("sent_at", startDate.toISOString());

    if (error) {
      throw new Error(`알림 통계 조회 실패: ${error.message}`);
    }

    // 통계 계산
    const stats = {
      total: data?.length || 0,
      byType: {} as Record<string, number>,
      byChannel: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      successRate: 0,
    };

    if (data) {
      data.forEach(notification => {
        // 타입별 통계
        stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;

        // 채널별 통계
        stats.byChannel[notification.channel] = (stats.byChannel[notification.channel] || 0) + 1;

        // 상태별 통계
        stats.byStatus[notification.status] = (stats.byStatus[notification.status] || 0) + 1;
      });

      // 성공률 계산
      const totalSent = stats.byStatus.sent || 0;
      stats.successRate = stats.total > 0 ? (totalSent / stats.total) * 100 : 0;
    }

    return stats;

  } catch (error) {
    console.error("알림 통계 조회 중 오류:", error);
    throw error;
  }
}

