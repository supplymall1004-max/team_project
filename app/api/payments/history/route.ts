/**
 * @file api/payments/history/route.ts
 * @description 결제 내역 조회 API 라우트
 *
 * 주요 기능:
 * 1. 사용자의 결제 내역 조회
 * 2. 결제 내역 목록 반환
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  console.group('[API][PaymentHistory] 결제 내역 조회');
  
  try {
    // 1. 인증 확인
    const { userId } = await auth();
    if (!userId) {
      console.log('❌ 인증 실패');
      console.groupEnd();
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const supabase = await createClerkSupabaseClient();

    // 2. 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      console.error('❌ 사용자 조회 실패:', userError);
      console.groupEnd();
      return NextResponse.json(
        { success: false, error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 3. 결제 내역 조회
    const { data: transactions, error: txError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('paid_at', { ascending: false })
      .limit(50);

    if (txError) {
      console.error('❌ 결제 내역 조회 실패:', txError);
      console.groupEnd();
      return NextResponse.json(
        { success: false, error: '결제 내역을 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 4. 데이터 변환
    const formattedTransactions = (transactions || []).map((tx) => ({
      id: tx.id,
      status: tx.status,
      transactionType: tx.transaction_type,
      amount: tx.amount,
      paymentMethod: tx.payment_method,
      paidAt: tx.paid_at,
      cardInfo: tx.card_info || null,
    }));

    console.log('✅ 결제 내역 조회 성공:', formattedTransactions.length, '건');
    console.groupEnd();

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
    });
  } catch (error) {
    console.error('❌ 결제 내역 조회 오류:', error);
    console.groupEnd();
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '결제 내역 조회 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

