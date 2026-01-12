/**
 * @file app/api/health/kcdc-premium/periodic-services/schedule/route.ts
 * @description 통합 일정 조회 API
 * 
 * GET /api/health/kcdc-premium/periodic-services/schedule - 향후 1년치 통합 일정 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { checkPremiumAccess } from "@/lib/kcdc/premium-guard";
import { getPeriodicServices } from "@/lib/kcdc/periodic-service-manager";
import { generateServiceSchedule } from "@/lib/kcdc/periodic-service-scheduler";
import { getDewormingRecords } from "@/lib/kcdc/deworming-manager";
import { getVaccinationRecords, getVaccinationSchedules } from "@/lib/kcdc/vaccination-manager";

/**
 * GET /api/health/kcdc-premium/periodic-services/schedule
 * 향후 1년치 통합 일정 조회
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/kcdc-premium/periodic-services/schedule");

    // 1. 프리미엄 체크
    const premiumCheck = await checkPremiumAccess();
    if (!premiumCheck.isPremium || !premiumCheck.userId) {
      console.log("❌ 프리미엄 접근 거부");
      console.groupEnd();
      return NextResponse.json(
        {
          error: "Premium access required",
          message: premiumCheck.error || "이 기능은 프리미엄 전용입니다.",
        },
        { status: 403 }
      );
    }

    // 2. 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const familyMemberId = searchParams.get("family_member_id");

    // 3. 날짜 범위 설정
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const start = startDate ? new Date(startDate) : today;
    start.setHours(0, 0, 0, 0);
    
    const end = endDate 
      ? new Date(endDate) 
      : new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    end.setHours(0, 0, 0, 0);

    console.log("📅 일정 범위:", {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
      familyMemberId: familyMemberId || null,
    });

    // 4. 주기적 서비스 목록 조회
    const services = await getPeriodicServices(
      premiumCheck.userId,
      familyMemberId || null,
      true // 활성화된 서비스만
    );

    // 5. 구충제 복용 기록 조회
    const dewormingRecords = await getDewormingRecords(
      premiumCheck.userId,
      familyMemberId || null
    );

    // 6. 예방접종 기록 및 일정 조회
    const vaccinationRecords = await getVaccinationRecords(
      premiumCheck.userId,
      familyMemberId || undefined
    );
    const vaccinationSchedules = await getVaccinationSchedules(
      premiumCheck.userId,
      familyMemberId || undefined,
      "pending" // 대기 중인 일정만
    );

    console.log("📋 조회된 데이터:", {
      주기적서비스: services.length,
      구충제기록: dewormingRecords.length,
      예방접종기록: vaccinationRecords.length,
      예방접종일정: vaccinationSchedules.length,
    });

    // 7. 통합 일정 생성
    const schedule: Array<{
      date: string;
      serviceName: string;
      serviceType: string;
      serviceId?: string;
      daysUntil: number;
      isOverdue: boolean;
    }> = [];

    // 주기적 서비스 일정 생성
    for (const service of services) {
      const serviceSchedule = generateServiceSchedule(service);
      
      for (const item of serviceSchedule) {
        const itemDate = new Date(item.date);
        itemDate.setHours(0, 0, 0, 0);
        
        // 날짜 범위 내에 있는 일정만 추가
        if (itemDate >= start && itemDate <= end) {
          const daysUntil = Math.ceil(
            (itemDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          schedule.push({
            date: item.date,
            serviceName: item.serviceName,
            serviceType: service.service_type,
            serviceId: service.id,
            daysUntil,
            isOverdue: daysUntil < 0,
          });
        }
      }
    }

    // 구충제 복용 일정 추가
    for (const record of dewormingRecords) {
      if (record.next_due_date) {
        const dueDate = new Date(record.next_due_date);
        dueDate.setHours(0, 0, 0, 0);
        
        // 날짜 범위 내에 있는 일정만 추가
        if (dueDate >= start && dueDate <= end) {
          const daysUntil = Math.ceil(
            (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          schedule.push({
            date: record.next_due_date,
            serviceName: `${record.medication_name} 복용`,
            serviceType: "deworming",
            serviceId: record.id,
            daysUntil,
            isOverdue: daysUntil < 0,
          });
        }
      }
    }

    // 예방접종 일정 추가 (대기 중인 일정)
    for (const scheduleItem of vaccinationSchedules) {
      const scheduledDate = new Date(scheduleItem.recommended_date);
      scheduledDate.setHours(0, 0, 0, 0);
      
      // 날짜 범위 내에 있는 일정만 추가
      if (scheduledDate >= start && scheduledDate <= end) {
        const daysUntil = Math.ceil(
          (scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        schedule.push({
          date: scheduleItem.recommended_date,
          serviceName: `${scheduleItem.vaccine_name} 예방접종`,
          serviceType: "vaccination",
          serviceId: scheduleItem.id,
          daysUntil,
          isOverdue: daysUntil < 0,
        });
      }
    }

    // 예방접종 기록의 다음 접종 예정일 추가
    for (const record of vaccinationRecords) {
      // 완료된 접종이고, 다음 접종이 필요한 경우
      if (record.completed_date && record.dose_number < record.total_doses) {
        // 마지막 접종일 기준으로 다음 접종일 계산 (간단히 1개월 후로 설정, 실제로는 백신별 주기 적용 필요)
        const lastDate = new Date(record.completed_date);
        lastDate.setHours(0, 0, 0, 0);
        const nextDate = new Date(lastDate);
        nextDate.setMonth(nextDate.getMonth() + 1); // 기본 1개월 후
        
        // 날짜 범위 내에 있는 일정만 추가
        if (nextDate >= start && nextDate <= end) {
          const daysUntil = Math.ceil(
            (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          schedule.push({
            date: nextDate.toISOString().split("T")[0],
            serviceName: `${record.vaccine_name} ${record.dose_number + 1}차 접종`,
            serviceType: "vaccination",
            serviceId: record.id,
            daysUntil,
            isOverdue: daysUntil < 0,
          });
        }
      }
      // 예정일이 있는 경우
      else if (record.scheduled_date && !record.completed_date) {
        const scheduledDate = new Date(record.scheduled_date);
        scheduledDate.setHours(0, 0, 0, 0);
        
        // 날짜 범위 내에 있는 일정만 추가
        if (scheduledDate >= start && scheduledDate <= end) {
          const daysUntil = Math.ceil(
            (scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          schedule.push({
            date: record.scheduled_date,
            serviceName: `${record.vaccine_name} ${record.dose_number}차 접종`,
            serviceType: "vaccination",
            serviceId: record.id,
            daysUntil,
            isOverdue: daysUntil < 0,
          });
        }
      }
    }

    // 8. 날짜별로 정렬
    schedule.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

    // 8. 날짜별로 그룹화
    const groupedSchedule: Record<string, typeof schedule> = {};
    for (const item of schedule) {
      if (!groupedSchedule[item.date]) {
        groupedSchedule[item.date] = [];
      }
      groupedSchedule[item.date].push(item);
    }

    console.log("✅ 통합 일정 생성 완료:", {
      총일정수: schedule.length,
      날짜수: Object.keys(groupedSchedule).length,
    });
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: {
        schedule: groupedSchedule,
        flatSchedule: schedule,
        summary: {
          totalItems: schedule.length,
          totalDates: Object.keys(groupedSchedule).length,
          overdueCount: schedule.filter((item) => item.isOverdue).length,
          upcomingCount: schedule.filter((item) => !item.isOverdue && item.daysUntil <= 7).length,
        },
      },
    });
  } catch (error) {
    console.error("❌ API 오류:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error
            ? error.message
            : "통합 일정 조회에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

