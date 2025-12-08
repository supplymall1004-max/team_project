/**
 * @file components/admin/settlements/settlement-cards.tsx
 * @description 정산 내역 카드 섹션 컴포넌트
 * 
 * 주요 기능:
 * 1. 전체 정산 통계 카드 표시
 * 2. 카드/현금/프로모션 코드별 통계 카드
 * 3. Overview 페이지에 표시
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSettlementStatistics } from "@/actions/admin/settlements/get-statistics";
import { DollarSign, CreditCard, Banknote, Ticket, TrendingUp, Loader2 } from "lucide-react";
import type { SettlementStatistics } from "@/actions/admin/settlements/get-statistics";

export function SettlementCards() {
  const [statistics, setStatistics] = useState<SettlementStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatistics() {
      try {
        setIsLoading(true);
        const result = await getSettlementStatistics();
        
        if (result.success) {
          setStatistics(result.data.overall);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    loadStatistics();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border border-orange-100 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-100 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-red-600">정산 통계 로드 실패</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!statistics) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const cards = [
    {
      title: "전체 정산",
      value: formatCurrency(statistics.totalAmount),
      description: `${statistics.totalTransactions.toLocaleString()}건`,
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/admin/settlements",
    },
    {
      title: "카드 결제",
      value: formatCurrency(statistics.cardAmount),
      description: `${statistics.cardTransactions.toLocaleString()}건`,
      icon: CreditCard,
      color: "text-green-600",
      bgColor: "bg-green-50",
      href: "/admin/settlements?method=card",
    },
    {
      title: "현금 결제",
      value: formatCurrency(statistics.cashAmount),
      description: `${statistics.cashTransactions.toLocaleString()}건`,
      icon: Banknote,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      href: "/admin/settlements?method=cash",
    },
    {
      title: "프로모션 코드",
      value: formatCurrency(statistics.promoCodeAmount),
      description: `${statistics.promoCodeTransactions.toLocaleString()}건`,
      icon: Ticket,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      href: "/admin/settlements?method=promo_code",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">정산 내역</h2>
          <p className="text-sm text-slate-500">결제 통계 및 내역 확인</p>
        </div>
        <Link
          href="/admin/settlements"
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          상세 보기 →
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href}>
              <Card className="border border-orange-100 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs uppercase tracking-wide text-slate-500">
                      {card.title}
                    </CardDescription>
                    <div className={`p-2 rounded-lg ${card.bgColor}`}>
                      <Icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                  </div>
                  <CardTitle className="text-2xl text-slate-900 mt-2">
                    {card.value}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

