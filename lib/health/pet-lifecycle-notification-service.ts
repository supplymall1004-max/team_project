/**
 * @file lib/health/pet-lifecycle-notification-service.ts
 * @description 반려동물 생애주기별 건강 이벤트 알림 발송 서비스
 * 
 * 반려동물의 생애주기별 건강 이벤트를 확인하고 적절한 시점에 알림을 발송합니다.
 * - 중성화 수술 시기 안내 (30일 전 알림)
 * - 치과 검진 리마인더 (14일 전 알림)
 * - 혈액 검사 리마인더 (14일 전 알림)
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { generatePetLifecycleEvents, PetLifecycleEvent } from "./pet-lifecycle-events";
import { calculatePetAge } from "./pet-lifecycle-calculator";
import { PetProfile } from "@/types/pet";

/**
 * 반려동물 건강 이벤트 알림 발송 파라미터
 */
export interface SendPetLifecycleNotificationParams {
  petId: string;
  userId: string;
  event: PetLifecycleEvent;
  eventDate: Date; // 이벤트 예정일
  daysBefore: number; // 이벤트 예정일로부터 며칠 전 알림
  notificationChannel?: "push" | "sms" | "email" | "in_app";
}

/**
 * 알림 발송 결과
 */
export interface PetNotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

/**
 * 반려동물 건강 이벤트 알림 메시지 생성
 */
function createPetLifecycleNotificationMessage(
  pet: PetProfile,
  event: PetLifecycleEvent,
  daysUntilEvent: number
): string {
  const daysText = daysUntilEvent === 0 ? "오늘" : `${daysUntilEvent}일 후`;
  
  if (event.event_type === 'neutering') {
    return `${pet.name}의 ${event.event_name} 권장 시기가 ${daysText}입니다. ${event.description}`;
  } else if (event.event_type === 'dental') {
    return `${pet.name}의 ${event.event_name} 시기가 ${daysText}입니다. ${event.description}`;
  } else if (event.event_type === 'blood_test') {
    return `${pet.name}의 ${event.event_name} 시기가 ${daysText}입니다. ${event.description}`;
  } else {
    return `${pet.name}의 ${event.event_name} 시기가 ${daysText}입니다. ${event.description}`;
  }
}

/**
 * 반려동물 건강 이벤트 알림 발송
 */
export async function sendPetLifecycleNotification(
  params: SendPetLifecycleNotificationParams
): Promise<PetNotificationResult> {
  console.group(`[PetLifecycleNotificationService] 알림 발송: ${params.event.event_name}`);

  try {
    const supabase = getServiceRoleClient();

    // 반려동물 정보 조회
    const { data: pet, error: petError } = await supabase
      .from("family_members")
      .select("*")
      .eq("id", params.petId)
      .eq("user_id", params.userId)
      .eq("member_type", "pet")
      .single();

    if (petError || !pet) {
      console.error("❌ 반려동물 조회 실패:", petError);
      console.groupEnd();
      return {
        success: false,
        error: "반려동물을 찾을 수 없습니다.",
      };
    }

    // 이벤트 예정일로부터 며칠 남았는지 계산
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(params.eventDate);
    eventDate.setHours(0, 0, 0, 0);
    const daysUntilEvent = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // 알림 메시지 생성
    const message = createPetLifecycleNotificationMessage(
      pet as PetProfile,
      params.event,
      daysUntilEvent
    );

    // 카테고리 결정
    let category: string;
    if (params.event.event_type === 'neutering') {
      category = 'pet_healthcare';
    } else if (params.event.event_type === 'dental') {
      category = 'pet_dental';
    } else if (params.event.event_type === 'blood_test') {
      category = 'pet_checkup';
    } else {
      category = 'pet_healthcare';
    }

    // 알림 로그 기록
    const { data: notificationLog, error: logError } = await supabase
      .from("notifications")
      .insert({
        user_id: params.userId,
        family_member_id: params.petId,
        type: "pet_healthcare",
        category: category,
        channel: params.notificationChannel || "in_app",
        title: `${pet.name}의 ${params.event.event_name}`,
        message: message,
        status: "sent",
        priority: params.event.priority === 'high' ? 'high' : params.event.priority === 'medium' ? 'normal' : 'low',
        scheduled_at: params.eventDate.toISOString(),
        sent_at: new Date().toISOString(),
        related_id: params.petId,
        related_type: "pet_lifecycle_event",
        context_data: {
          event_code: params.event.event_code,
          event_type: params.event.event_type,
          days_before: params.daysBefore,
          days_until_event: daysUntilEvent,
          recommended_action: params.event.recommended_action,
        },
      })
      .select()
      .single();

    if (logError) {
      console.error("❌ 알림 로그 기록 실패:", logError);
      console.groupEnd();
      return {
        success: false,
        error: logError.message,
      };
    }

    console.log(`✅ 알림 발송 완료: ${notificationLog.id}`);
    console.groupEnd();

    return {
      success: true,
      notificationId: notificationLog.id,
    };
  } catch (error) {
    console.error("❌ 예상치 못한 오류:", error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : "알림 발송 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 반려동물 건강 이벤트 알림 스케줄러
 * 모든 반려동물의 생애주기별 건강 이벤트를 확인하고 적절한 시점에 알림 발송
 */
export async function schedulePetLifecycleNotifications(): Promise<{
  processed: number;
  notificationsSent: number;
  errors: number;
}> {
  console.group("[PetLifecycleNotificationService] 반려동물 건강 이벤트 알림 스케줄링");

  const result = {
    processed: 0,
    notificationsSent: 0,
    errors: 0,
  };

  try {
    const supabase = getServiceRoleClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 모든 반려동물 조회
    const { data: pets, error: petsError } = await supabase
      .from("family_members")
      .select("*")
      .eq("member_type", "pet")
      .not("birth_date", "is", null)
      .not("pet_type", "is", null);

    if (petsError) {
      console.error("❌ 반려동물 조회 실패:", petsError);
      console.groupEnd();
      return result;
    }

    console.log(`📋 알림 대상 반려동물: ${pets?.length || 0}마리`);

    for (const pet of pets || []) {
      try {
        result.processed++;

        // 생애주기별 건강 이벤트 생성
        const events = generatePetLifecycleEvents(pet as PetProfile);

        if (events.length === 0) {
          console.log(`⏭️ ${pet.name}: 적용 가능한 이벤트 없음`);
          continue;
        }

        console.log(`🐾 ${pet.name}: ${events.length}건의 이벤트 확인`);

        for (const event of events) {
          try {
            // 이벤트 예정일 계산
            const birthDate = new Date(pet.birth_date);
            let eventDate: Date;

            if (event.target_age_months) {
              // 개월 단위 이벤트
              eventDate = new Date(birthDate);
              eventDate.setMonth(eventDate.getMonth() + event.target_age_months);
            } else if (event.target_age_years) {
              // 년 단위 이벤트
              eventDate = new Date(birthDate);
              eventDate.setFullYear(eventDate.getFullYear() + event.target_age_years);
              
              // 반복 이벤트인 경우 (치과 검진, 혈액 검사) 다음 예정일 계산
              const age = calculatePetAge(pet.birth_date);
              if (event.event_type === 'dental' || event.event_type === 'blood_test') {
                // 이미 지난 경우 다음 해/반기 예정일 계산
                if (age.years >= event.target_age_years!) {
                  if (event.event_code.includes('10years') || event.event_code.includes('15years')) {
                    // 반기별 이벤트 (6개월마다)
                    const lastEventDate = new Date(birthDate);
                    lastEventDate.setFullYear(lastEventDate.getFullYear() + event.target_age_years!);
                    
                    // 마지막 이벤트 이후 6개월 단위로 다음 예정일 계산
                    while (lastEventDate <= today) {
                      lastEventDate.setMonth(lastEventDate.getMonth() + 6);
                    }
                    eventDate = lastEventDate;
                  } else {
                    // 매년 이벤트
                    const lastEventDate = new Date(birthDate);
                    lastEventDate.setFullYear(lastEventDate.getFullYear() + event.target_age_years!);
                    
                    // 마지막 이벤트 이후 매년 다음 예정일 계산
                    while (lastEventDate <= today) {
                      lastEventDate.setFullYear(lastEventDate.getFullYear() + 1);
                    }
                    eventDate = lastEventDate;
                  }
                }
              }
            } else {
              continue; // 예정일을 계산할 수 없음
            }

            eventDate.setHours(0, 0, 0, 0);

            // 알림 발송 시점 계산
            const notificationDate = new Date(eventDate);
            const daysBefore = event.notification_timing_days_before || 14;
            notificationDate.setDate(notificationDate.getDate() - daysBefore);

            // 오늘 날짜와 비교
            const daysUntilNotification = Math.floor((notificationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            // 알림 발송 시점이 오늘이거나 오늘 이전인 경우에만 발송
            if (daysUntilNotification <= 0 && daysUntilNotification >= -1) {
              // 이미 발송된 알림인지 확인 (중복 방지)
              const { data: existingNotification } = await supabase
                .from("notifications")
                .select("id")
                .eq("user_id", pet.user_id)
                .eq("family_member_id", pet.id)
                .eq("type", "pet_healthcare")
                .eq("related_type", "pet_lifecycle_event")
                .eq("status", "sent")
                .gte("created_at", new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString()) // 최근 24시간 내
                .single();

              if (existingNotification) {
                console.log(`⏭️ ${pet.name} - ${event.event_name}: 이미 발송된 알림`);
                continue;
              }

              // 알림 발송
              const notificationResult = await sendPetLifecycleNotification({
                petId: pet.id,
                userId: pet.user_id,
                event,
                eventDate,
                daysBefore,
                notificationChannel: "in_app",
              });

              if (notificationResult.success) {
                result.notificationsSent++;
                console.log(`✅ ${pet.name} - ${event.event_name}: 알림 발송 완료`);
              } else {
                result.errors++;
                console.error(`❌ ${pet.name} - ${event.event_name}: 알림 발송 실패 - ${notificationResult.error}`);
              }
            } else {
              console.log(`⏭️ ${pet.name} - ${event.event_name}: 알림 시기가 아님 (${daysUntilNotification}일 후)`);
            }
          } catch (eventError) {
            result.errors++;
            console.error(`❌ ${pet.name} - ${event.event_name}: 이벤트 처리 중 오류`, eventError);
          }
        }
      } catch (petError) {
        result.errors++;
        console.error(`❌ ${pet.name}: 반려동물 처리 중 오류`, petError);
      }
    }

    console.log(`✅ 알림 스케줄링 완료: 처리 ${result.processed}마리, 발송 ${result.notificationsSent}건, 오류 ${result.errors}건`);
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ 예상치 못한 오류:", error);
    console.groupEnd();
    return result;
  }
}

