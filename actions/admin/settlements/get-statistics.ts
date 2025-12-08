/**
 * @file actions/admin/settlements/get-statistics.ts
 * @description 정산 내역 통계 조회 Server Action
 * 
 * 주요 기능:
 * 1. 일별, 월별, 년별 결제 통계 조회
 * 2. 카드/현금/프로모션 코드별 결제 통계
 * 3. 결제 상태별 통계
 */

import { getServiceRoleClient } from '@/lib/supabase/service-role';

export interface SettlementStatistics {
  totalAmount: number;
  totalTransactions: number;
  cardAmount: number;
  cardTransactions: number;
  cashAmount: number;
  cashTransactions: number;
  promoCodeAmount: number;
  promoCodeTransactions: number;
  completedAmount: number;
  completedTransactions: number;
  pendingAmount: number;
  pendingTransactions: number;
  failedAmount: number;
  failedTransactions: number;
  refundedAmount: number;
  refundedTransactions: number;
}

export interface DailyStatistics extends SettlementStatistics {
  date: string;
}

export interface MonthlyStatistics extends SettlementStatistics {
  year: number;
  month: number;
}

export interface YearlyStatistics extends SettlementStatistics {
  year: number;
}

export interface GetStatisticsResult {
  success: true;
  data: {
    daily: DailyStatistics[];
    monthly: MonthlyStatistics[];
    yearly: YearlyStatistics[];
    overall: SettlementStatistics;
  };
}

export interface GetStatisticsError {
  success: false;
  error: string;
}

export type GetStatisticsResponse = GetStatisticsResult | GetStatisticsError;

/**
 * 정산 통계 조회
 */
export async function getSettlementStatistics(
  startDate?: Date,
  endDate?: Date
): Promise<GetStatisticsResponse> {
  try {
    console.group('[SettlementStatistics] 통계 조회');
    console.log('시작일:', startDate?.toISOString());
    console.log('종료일:', endDate?.toISOString());

    const supabase = getServiceRoleClient();

    // 직접 쿼리로 거래 내역 조회
    let query = supabase
      .from('payment_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    // 날짜 필터 적용
    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: transactions, error: txError } = await query;

    if (txError) {
      console.error('거래 내역 조회 실패:', txError);
      console.groupEnd();
      return { success: false, error: `통계 조회 실패: ${txError.message}` };
    }

    // 클라이언트 측에서 일별 통계 계산
    const dailyMap = new Map<string, DailyStatistics>();

    transactions?.forEach((tx) => {
      const date = new Date(tx.created_at).toISOString().split('T')[0];
      const existing = dailyMap.get(date) || {
        date,
        totalAmount: 0,
        totalTransactions: 0,
        cardAmount: 0,
        cardTransactions: 0,
        cashAmount: 0,
        cashTransactions: 0,
        promoCodeAmount: 0,
        promoCodeTransactions: 0,
        completedAmount: 0,
        completedTransactions: 0,
        pendingAmount: 0,
        pendingTransactions: 0,
        failedAmount: 0,
        failedTransactions: 0,
        refundedAmount: 0,
        refundedTransactions: 0,
      };

      existing.totalAmount += tx.amount || 0;
      existing.totalTransactions += 1;

      if (tx.payment_method === 'card' || tx.pg_provider === 'toss_payments') {
        existing.cardAmount += tx.amount || 0;
        existing.cardTransactions += 1;
      } else if (tx.payment_method === 'cash') {
        existing.cashAmount += tx.amount || 0;
        existing.cashTransactions += 1;
      } else if (tx.payment_method === 'promo_code' || tx.pg_provider === 'promo_code' || tx.metadata?.promo_code_id) {
        existing.promoCodeAmount += tx.amount || 0;
        existing.promoCodeTransactions += 1;
      }

      if (tx.status === 'completed') {
        existing.completedAmount += tx.amount || 0;
        existing.completedTransactions += 1;
      } else if (tx.status === 'pending') {
        existing.pendingAmount += tx.amount || 0;
        existing.pendingTransactions += 1;
      } else if (tx.status === 'failed') {
        existing.failedAmount += tx.amount || 0;
        existing.failedTransactions += 1;
      } else if (tx.status === 'refunded') {
        existing.refundedAmount += tx.amount || 0;
        existing.refundedTransactions += 1;
      }

      dailyMap.set(date, existing);
    });

    const daily = Array.from(dailyMap.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // 월별 통계 계산
    const monthlyMap = new Map<string, MonthlyStatistics>();
    daily.forEach((day) => {
      const date = new Date(day.date);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const existing = monthlyMap.get(key) || {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        totalAmount: 0,
        totalTransactions: 0,
        cardAmount: 0,
        cardTransactions: 0,
        cashAmount: 0,
        cashTransactions: 0,
        promoCodeAmount: 0,
        promoCodeTransactions: 0,
        completedAmount: 0,
        completedTransactions: 0,
        pendingAmount: 0,
        pendingTransactions: 0,
        failedAmount: 0,
        failedTransactions: 0,
        refundedAmount: 0,
        refundedTransactions: 0,
      };

      existing.totalAmount += day.totalAmount;
      existing.totalTransactions += day.totalTransactions;
      existing.cardAmount += day.cardAmount;
      existing.cardTransactions += day.cardTransactions;
      existing.cashAmount += day.cashAmount;
      existing.cashTransactions += day.cashTransactions;
      existing.promoCodeAmount += day.promoCodeAmount;
      existing.promoCodeTransactions += day.promoCodeTransactions;
      existing.completedAmount += day.completedAmount;
      existing.completedTransactions += day.completedTransactions;
      existing.pendingAmount += day.pendingAmount;
      existing.pendingTransactions += day.pendingTransactions;
      existing.failedAmount += day.failedAmount;
      existing.failedTransactions += day.failedTransactions;
      existing.refundedAmount += day.refundedAmount;
      existing.refundedTransactions += day.refundedTransactions;

      monthlyMap.set(key, existing);
    });

    const monthly = Array.from(monthlyMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    // 년별 통계 계산
    const yearlyMap = new Map<number, YearlyStatistics>();
    monthly.forEach((month) => {
        const existing = yearlyMap.get(month.year) || {
          year: month.year,
          totalAmount: 0,
          totalTransactions: 0,
          cardAmount: 0,
          cardTransactions: 0,
          cashAmount: 0,
          cashTransactions: 0,
          promoCodeAmount: 0,
          promoCodeTransactions: 0,
          completedAmount: 0,
          completedTransactions: 0,
          pendingAmount: 0,
          pendingTransactions: 0,
          failedAmount: 0,
          failedTransactions: 0,
          refundedAmount: 0,
          refundedTransactions: 0,
        };

        existing.totalAmount += month.totalAmount;
        existing.totalTransactions += month.totalTransactions;
        existing.cardAmount += month.cardAmount;
        existing.cardTransactions += month.cardTransactions;
        existing.cashAmount += month.cashAmount;
        existing.cashTransactions += month.cashTransactions;
        existing.promoCodeAmount += month.promoCodeAmount;
        existing.promoCodeTransactions += month.promoCodeTransactions;
        existing.completedAmount += month.completedAmount;
        existing.completedTransactions += month.completedTransactions;
        existing.pendingAmount += month.pendingAmount;
        existing.pendingTransactions += month.pendingTransactions;
        existing.failedAmount += month.failedAmount;
        existing.failedTransactions += month.failedTransactions;
        existing.refundedAmount += month.refundedAmount;
        existing.refundedTransactions += month.refundedTransactions;

      yearlyMap.set(month.year, existing);
    });

    const yearly = Array.from(yearlyMap.values()).sort((a, b) => b.year - a.year);

    // 전체 통계 계산
    const overall: SettlementStatistics = {
        totalAmount: daily.reduce((sum, day) => sum + day.totalAmount, 0),
        totalTransactions: daily.reduce((sum, day) => sum + day.totalTransactions, 0),
        cardAmount: daily.reduce((sum, day) => sum + day.cardAmount, 0),
        cardTransactions: daily.reduce((sum, day) => sum + day.cardTransactions, 0),
        cashAmount: daily.reduce((sum, day) => sum + day.cashAmount, 0),
        cashTransactions: daily.reduce((sum, day) => sum + day.cashTransactions, 0),
        promoCodeAmount: daily.reduce((sum, day) => sum + day.promoCodeAmount, 0),
        promoCodeTransactions: daily.reduce((sum, day) => sum + day.promoCodeTransactions, 0),
        completedAmount: daily.reduce((sum, day) => sum + day.completedAmount, 0),
        completedTransactions: daily.reduce((sum, day) => sum + day.completedTransactions, 0),
        pendingAmount: daily.reduce((sum, day) => sum + day.pendingAmount, 0),
        pendingTransactions: daily.reduce((sum, day) => sum + day.pendingTransactions, 0),
        failedAmount: daily.reduce((sum, day) => sum + day.failedAmount, 0),
        failedTransactions: daily.reduce((sum, day) => sum + day.failedTransactions, 0),
        refundedAmount: daily.reduce((sum, day) => sum + day.refundedAmount, 0),
        refundedTransactions: daily.reduce((sum, day) => sum + day.refundedTransactions, 0),
      };

      console.log('✅ 통계 조회 완료');
      console.groupEnd();

    console.log('✅ 통계 조회 완료');
    console.log('일별 통계:', daily.length, '건');
    console.log('월별 통계:', monthly.length, '건');
    console.log('년별 통계:', yearly.length, '건');
    console.groupEnd();

    return {
      success: true,
      data: {
        daily,
        monthly,
        yearly,
        overall,
      },
    };
  } catch (error) {
    console.error('❌ 통계 조회 오류:', error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

