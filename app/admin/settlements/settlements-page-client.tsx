/**
 * @file app/admin/settlements/settlements-page-client.tsx
 * @description 정산 내역 상세 페이지 클라이언트 컴포넌트
 * 
 * 주요 기능:
 * 1. 일별/월별/년별 통계 탭 전환
 * 2. 카드/현금/프로모션 코드 필터링
 * 3. 날짜 범위 선택
 * 4. 상세 거래 내역 테이블 표시
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSettlementStatistics } from "@/actions/admin/settlements/get-statistics";
import { getSettlementTransactions } from "@/actions/admin/settlements/get-transactions";
import type {
  SettlementStatistics,
  DailyStatistics,
  MonthlyStatistics,
  YearlyStatistics,
} from "@/actions/admin/settlements/get-statistics";
import type { TransactionDetail } from "@/actions/admin/settlements/get-transactions";
import {
  DollarSign,
  CreditCard,
  Banknote,
  Ticket,
  Calendar,
  Filter,
  RefreshCw,
  Download,
} from "lucide-react";

interface SettlementsPageClientProps {
  initialStatistics: {
    daily: DailyStatistics[];
    monthly: MonthlyStatistics[];
    yearly: YearlyStatistics[];
    overall: SettlementStatistics;
  } | null;
  initialTransactions: {
    card: TransactionDetail[];
    cash: TransactionDetail[];
    promoCode: TransactionDetail[];
    all: TransactionDetail[];
  } | null;
  initialPaymentMethod: 'card' | 'cash' | 'promo_code' | 'all';
  initialPeriod: 'day' | 'month' | 'year';
  initialStartDate?: Date;
  initialEndDate?: Date;
}

export function SettlementsPageClient({
  initialStatistics,
  initialTransactions,
  initialPaymentMethod,
  initialPeriod,
  initialStartDate,
  initialEndDate,
}: SettlementsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [statistics, setStatistics] = useState(initialStatistics);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod);
  const [period, setPeriod] = useState(initialPeriod);
  const [startDate, setStartDate] = useState(
    initialStartDate ? initialStartDate.toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    initialEndDate ? initialEndDate.toISOString().split('T')[0] : ''
  );
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      const method = paymentMethod === 'all' ? undefined : paymentMethod;

      const [statsResult, transResult] = await Promise.all([
        getSettlementStatistics(start, end),
        getSettlementTransactions(start, end, method),
      ]);

      if (statsResult.success) {
        setStatistics(statsResult.data);
      }
      if (transResult.success) {
        setTransactions(transResult.data);
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, paymentMethod]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (paymentMethod !== 'all') {
      params.set('method', paymentMethod);
    } else {
      params.delete('method');
    }
    params.set('period', period);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    
    router.replace(`/admin/settlements?${params.toString()}`, { scroll: false });
  }, [paymentMethod, period, startDate, endDate, router, searchParams]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'outline',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status === 'completed' ? '완료' : 
         status === 'pending' ? '대기' : 
         status === 'failed' ? '실패' : 
         status === 'refunded' ? '환불' : status}
      </Badge>
    );
  };

  const currentTransactions = transactions
    ? paymentMethod === 'card' ? transactions.card
      : paymentMethod === 'cash' ? transactions.cash
      : paymentMethod === 'promo_code' ? transactions.promoCode
      : transactions.all
    : [];

  const currentStatistics = statistics
    ? period === 'day' ? statistics.daily
      : period === 'month' ? statistics.monthly
      : statistics.yearly
    : [];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">정산 내역</h1>
          <p className="text-sm text-slate-500">결제 통계 및 상세 내역 관리</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
        </div>
      </div>

      {/* 필터 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            필터
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>결제 수단</Label>
              <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="card">카드</SelectItem>
                  <SelectItem value="cash">현금</SelectItem>
                  <SelectItem value="promo_code">프로모션 코드</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>기간 단위</Label>
              <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">일별</SelectItem>
                  <SelectItem value="month">월별</SelectItem>
                  <SelectItem value="year">년별</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>시작일</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>종료일</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 전체 통계 카드 */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase">전체 정산</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(statistics.overall.totalAmount)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">{statistics.overall.totalTransactions.toLocaleString()}건</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase">카드 결제</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(statistics.overall.cardAmount)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">{statistics.overall.cardTransactions.toLocaleString()}건</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase">현금 결제</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(statistics.overall.cashAmount)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">{statistics.overall.cashTransactions.toLocaleString()}건</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase">프로모션 코드</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(statistics.overall.promoCodeAmount)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">{statistics.overall.promoCodeTransactions.toLocaleString()}건</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 통계 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>
            {period === 'day' ? '일별' : period === 'month' ? '월별' : '년별'} 통계
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{period === 'day' ? '날짜' : period === 'month' ? '월' : '년'}</TableHead>
                  <TableHead className="text-right">전체 금액</TableHead>
                  <TableHead className="text-right">전체 건수</TableHead>
                  <TableHead className="text-right">카드 금액</TableHead>
                  <TableHead className="text-right">카드 건수</TableHead>
                  <TableHead className="text-right">현금 금액</TableHead>
                  <TableHead className="text-right">현금 건수</TableHead>
                  <TableHead className="text-right">프로모션 금액</TableHead>
                  <TableHead className="text-right">프로모션 건수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentStatistics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-slate-500">
                      데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentStatistics.map((stat) => (
                    <TableRow key={
                      period === 'day' ? (stat as DailyStatistics).date
                      : period === 'month' ? `${(stat as MonthlyStatistics).year}-${(stat as MonthlyStatistics).month}`
                      : (stat as YearlyStatistics).year.toString()
                    }>
                      <TableCell>
                        {period === 'day' ? formatDate((stat as DailyStatistics).date)
                          : period === 'month' ? `${(stat as MonthlyStatistics).year}년 ${(stat as MonthlyStatistics).month}월`
                          : `${(stat as YearlyStatistics).year}년`}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(stat.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right">{stat.totalTransactions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{formatCurrency(stat.cardAmount)}</TableCell>
                      <TableCell className="text-right">{stat.cardTransactions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{formatCurrency(stat.cashAmount)}</TableCell>
                      <TableCell className="text-right">{stat.cashTransactions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{formatCurrency(stat.promoCodeAmount)}</TableCell>
                      <TableCell className="text-right">{stat.promoCodeTransactions.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 상세 거래 내역 */}
      <Card>
        <CardHeader>
          <CardTitle>상세 거래 내역</CardTitle>
          <CardDescription>
            {paymentMethod === 'all' ? '전체' : 
             paymentMethod === 'card' ? '카드' :
             paymentMethod === 'cash' ? '현금' : '프로모션 코드'} 결제 내역
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>거래일시</TableHead>
                  <TableHead>사용자</TableHead>
                  <TableHead>결제 수단</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>거래 ID</TableHead>
                  <TableHead>프로모션 코드</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-500">
                      거래 내역이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDate(tx.created_at)}</TableCell>
                      <TableCell>{tx.user_name || '알 수 없음'}</TableCell>
                      <TableCell>
                        {tx.payment_method === 'card' ? '카드' :
                         tx.payment_method === 'cash' ? '현금' :
                         tx.payment_method === 'promo_code' ? '프로모션 코드' :
                         tx.pg_provider === 'toss_payments' ? '카드' :
                         tx.pg_provider === 'promo_code' ? '프로모션 코드' : tx.payment_method || '-'}
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(tx.amount)}</TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {tx.pg_transaction_id || '-'}
                      </TableCell>
                      <TableCell>{tx.promo_code || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

