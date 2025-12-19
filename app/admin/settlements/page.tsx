/**
 * @file app/admin/settlements/page.tsx
 * @description 정산 내역 상세 페이지
 * 
 * 주요 기능:
 * 1. 일별, 월별, 년별 결제 통계 표시
 * 2. 카드/현금/프로모션 코드별 결제 내역 표시
 * 3. 상세 거래 내역 조회 및 필터링
 */

import { Suspense } from "react";
import { SettlementsPageClient } from "./settlements-page-client";
import { getSettlementStatistics } from "@/actions/admin/settlements/get-statistics";
import { getSettlementTransactions } from "@/actions/admin/settlements/get-transactions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface SettlementsPageProps {
  searchParams: Promise<{
    method?: 'card' | 'cash' | 'promo_code' | 'all';
    period?: 'day' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function SettlementsPage({ searchParams }: SettlementsPageProps) {
  const resolvedSearchParams = await searchParams;
  const params = resolvedSearchParams;
  const paymentMethod = params.method || 'all';
  const period = params.period || 'day';
  
  const startDate = params.startDate ? new Date(params.startDate) : undefined;
  const endDate = params.endDate ? new Date(params.endDate) : undefined;

  // 통계 데이터 로드
  let statisticsResult;
  let statisticsError: string | null = null;
  
  try {
    statisticsResult = await getSettlementStatistics(startDate, endDate);
    if (!statisticsResult.success) {
      statisticsError = statisticsResult.error;
    }
  } catch (error) {
    statisticsError = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    statisticsResult = {
      success: false as const,
      error: statisticsError,
    };
  }

  // 거래 내역 데이터 로드
  let transactionsResult;
  let transactionsError: string | null = null;
  
  try {
    const method = paymentMethod === 'all' ? undefined : paymentMethod;
    transactionsResult = await getSettlementTransactions(startDate, endDate, method);
    if (!transactionsResult.success) {
      transactionsError = transactionsResult.error;
    }
  } catch (error) {
    transactionsError = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    transactionsResult = {
      success: false as const,
      error: transactionsError,
    };
  }

  return (
    <div className="h-full space-y-6">
      {(statisticsError || transactionsError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>데이터 로드 실패</AlertTitle>
          <AlertDescription>
            {statisticsError && <div>통계 데이터: {statisticsError}</div>}
            {transactionsError && <div>거래 내역: {transactionsError}</div>}
          </AlertDescription>
        </Alert>
      )}
      <Suspense fallback={<SettlementsPageSkeleton />}>
        <SettlementsPageClient
          initialStatistics={statisticsResult.success ? statisticsResult.data : null}
          initialTransactions={transactionsResult.success ? transactionsResult.data : null}
          initialPaymentMethod={paymentMethod}
          initialPeriod={period}
          initialStartDate={startDate}
          initialEndDate={endDate}
        />
      </Suspense>
    </div>
  );
}

function SettlementsPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48"></div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded"></div>
        ))}
      </div>
      <div className="h-96 bg-gray-200 rounded"></div>
    </div>
  );
}

