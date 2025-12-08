/**
 * @file settings/billing/payment-history-list.tsx
 * @description 결제 내역 목록 컴포넌트
 *
 * 주요 기능:
 * 1. 사용자의 결제 내역 조회
 * 2. 결제 내역 목록 표시
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Receipt,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

interface PaymentTransaction {
  id: string;
  status: string;
  transactionType: string;
  amount: number;
  paymentMethod: string;
  paidAt: string;
  cardInfo?: {
    issuer?: string;
    last_four?: string;
  };
}

export function PaymentHistoryList() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    console.group('[PaymentHistoryList] 결제 내역 로드');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/history');
      const result = await response.json();

      if (result.success) {
        setTransactions(result.transactions || []);
        console.log('✅ 결제 내역 로드 성공:', result.transactions?.length || 0, '건');
      } else {
        setError(result.error || '결제 내역을 불러올 수 없습니다.');
        console.error('❌ 결제 내역 로드 실패:', result.error);
      }
    } catch (error) {
      console.error('❌ 결제 내역 로드 오류:', error);
      setError('결제 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '완료';
      case 'pending':
        return '대기 중';
      case 'failed':
        return '실패';
      case 'refunded':
        return '환불됨';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>오류</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>결제 내역</CardTitle>
          <CardDescription>과거 결제 내역이 없습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-8">
            아직 결제 내역이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-gray-400" />
            <CardTitle>결제 내역</CardTitle>
          </div>
          <CardDescription>
            총 {transactions.length}건의 결제 내역이 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(transaction.status)}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {transaction.transactionType === 'subscription' 
                          ? '구독 결제' 
                          : transaction.transactionType === 'one_time'
                          ? '일회성 결제'
                          : '환불'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(transaction.paidAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">
                      {transaction.amount.toLocaleString()}원
                    </p>
                    <p className={`text-sm ${
                      transaction.status === 'completed' 
                        ? 'text-green-600' 
                        : transaction.status === 'failed'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}>
                      {getStatusText(transaction.status)}
                    </p>
                  </div>
                </div>
                {transaction.cardInfo && (
                  <div className="text-sm text-gray-600">
                    <p>
                      {transaction.cardInfo.issuer && `${transaction.cardInfo.issuer} `}
                      {transaction.cardInfo.last_four && `****${transaction.cardInfo.last_four}`}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

