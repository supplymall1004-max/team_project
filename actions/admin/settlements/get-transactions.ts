/**
 * @file actions/admin/settlements/get-transactions.ts
 * @description 정산 내역 상세 거래 조회 Server Action
 * 
 * 주요 기능:
 * 1. 카드 결제 내역 조회
 * 2. 현금 결제 내역 조회
 * 3. 프로모션 코드 결제 내역 조회
 * 4. 날짜별 필터링
 */

import { getServiceRoleClient } from '@/lib/supabase/service-role';

export interface TransactionDetail {
  id: string;
  user_id: string;
  user_name: string | null;
  subscription_id: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_type: 'subscription' | 'one_time' | 'refund';
  pg_provider: string;
  pg_transaction_id: string | null;
  amount: number;
  tax_amount: number | null;
  net_amount: number;
  payment_method: string | null;
  card_info: {
    issuer?: string;
    last_four?: string;
    type?: string;
  } | null;
  paid_at: string | null;
  refunded_at: string | null;
  metadata: {
    promo_code_id?: string;
    promo_code?: string;
    free_trial_days?: number;
    order_id?: string;
  } | null;
  is_test_mode: boolean;
  created_at: string;
  promo_code?: string | null;
}

export interface GetTransactionsResult {
  success: true;
  data: {
    card: TransactionDetail[];
    cash: TransactionDetail[];
    promoCode: TransactionDetail[];
    all: TransactionDetail[];
  };
}

export interface GetTransactionsError {
  success: false;
  error: string;
}

export type GetTransactionsResponse = GetTransactionsResult | GetTransactionsError;

/**
 * 정산 내역 상세 거래 조회
 */
export async function getSettlementTransactions(
  startDate?: Date,
  endDate?: Date,
  paymentMethod?: 'card' | 'cash' | 'promo_code' | 'all'
): Promise<GetTransactionsResponse> {
  try {
    console.group('[SettlementTransactions] 거래 내역 조회');
    console.log('시작일:', startDate?.toISOString());
    console.log('종료일:', endDate?.toISOString());
    console.log('결제 수단:', paymentMethod);

    const supabase = getServiceRoleClient();

    // 기본 쿼리 구성
    let query = supabase
      .from('payment_transactions')
      .select(`
        *,
        users:user_id (
          name
        )
      `)
      .order('created_at', { ascending: false });

    // 날짜 필터
    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('거래 내역 조회 실패:', error);
      console.groupEnd();
      return { success: false, error: `거래 내역 조회 실패: ${error.message}` };
    }

    // 사용자 정보 조회
    const userIds = [...new Set(transactions?.map((tx) => tx.user_id) || [])];
    const { data: users } = await supabase
      .from('users')
      .select('id, name')
      .in('id', userIds);

    const userMap = new Map(users?.map((u) => [u.id, u.name]) || []);

    // 프로모션 코드 정보 조회
    const promoCodeIds = transactions
      ?.filter((tx) => tx.metadata?.promo_code_id)
      .map((tx) => tx.metadata?.promo_code_id) || [];
    
    const { data: promoCodes } = await supabase
      .from('promo_codes')
      .select('id, code')
      .in('id', promoCodeIds);

    const promoCodeMap = new Map(promoCodes?.map((pc) => [pc.id, pc.code]) || []);

    // 거래 내역 변환
    const allTransactions: TransactionDetail[] = (transactions || []).map((tx) => ({
      id: tx.id,
      user_id: tx.user_id,
      user_name: userMap.get(tx.user_id) || null,
      subscription_id: tx.subscription_id,
      status: tx.status,
      transaction_type: tx.transaction_type,
      pg_provider: tx.pg_provider,
      pg_transaction_id: tx.pg_transaction_id,
      amount: tx.amount,
      tax_amount: tx.tax_amount,
      net_amount: tx.net_amount,
      payment_method: tx.payment_method,
      card_info: tx.card_info as TransactionDetail['card_info'],
      paid_at: tx.paid_at,
      refunded_at: tx.refunded_at,
      metadata: tx.metadata as TransactionDetail['metadata'],
      is_test_mode: tx.is_test_mode,
      created_at: tx.created_at,
      promo_code: tx.metadata?.promo_code_id 
        ? promoCodeMap.get(tx.metadata.promo_code_id) || null
        : null,
    }));

    // 결제 수단별 분류
    const card = allTransactions.filter((tx) => 
      tx.payment_method === 'card' || 
      tx.pg_provider === 'toss_payments' ||
      (tx.payment_method !== 'promo_code' && tx.payment_method !== 'cash' && !tx.metadata?.promo_code_id)
    );

    const cash = allTransactions.filter((tx) => 
      tx.payment_method === 'cash'
    );

    const promoCode = allTransactions.filter((tx) => 
      tx.payment_method === 'promo_code' || 
      tx.pg_provider === 'promo_code' || 
      !!tx.metadata?.promo_code_id
    );

    console.log('✅ 거래 내역 조회 완료');
    console.log('전체:', allTransactions.length);
    console.log('카드:', card.length);
    console.log('현금:', cash.length);
    console.log('프로모션 코드:', promoCode.length);
    console.groupEnd();

    return {
      success: true,
      data: {
        card,
        cash,
        promoCode,
        all: allTransactions,
      },
    };
  } catch (error) {
    console.error('❌ 거래 내역 조회 오류:', error);
    console.groupEnd();
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

