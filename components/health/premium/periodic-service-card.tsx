/**
 * @file components/health/premium/periodic-service-card.tsx
 * @description 주기적 건강 관리 서비스 카드 컴포넌트 (프리미엄 전용)
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  Bell,
  BellOff,
} from "lucide-react";
import { PremiumGate, PremiumBadge } from "@/components/premium/premium-gate";
import { getCurrentSubscription } from "@/actions/payments/get-subscription";
import { PeriodicServiceDialog } from "./periodic-service-dialog";
import type { PeriodicHealthService, PeriodicServiceType, CycleType } from "@/types/kcdc";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const SERVICE_TYPE_LABELS: Record<PeriodicServiceType, string> = {
  vaccination: "예방접종",
  checkup: "건강검진",
  deworming: "구충제",
  disease_management: "질병관리",
  other: "기타",
};

const CYCLE_TYPE_LABELS: Record<CycleType, string> = {
  daily: "매일",
  weekly: "매주",
  monthly: "매월",
  quarterly: "분기별",
  yearly: "매년",
  custom: "사용자 정의",
};

interface PeriodicServiceCardProps {
  familyMemberId?: string;
  className?: string;
}

export function PeriodicServiceCard({
  familyMemberId,
  className,
}: PeriodicServiceCardProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<PeriodicHealthService[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<PeriodicHealthService | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function checkPremium() {
      try {
        const subscription = await getCurrentSubscription();
        setIsPremium(subscription.isPremium);
      } catch (error) {
        console.error("프리미엄 체크 실패:", error);
      } finally {
        setIsLoading(false);
      }
    }
    checkPremium();
  }, []);

  useEffect(() => {
    if (isPremium) {
      loadServices();
    }
  }, [isPremium, familyMemberId]);

  async function loadServices() {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (familyMemberId) {
        params.append("family_member_id", familyMemberId);
      }
      params.append("is_active", "true");

      const response = await fetch(
        `/api/health/kcdc-premium/periodic-services?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("서비스 목록 조회 실패");
      }

      const result = await response.json();
      setServices(result.data || []);
      setError(null);
    } catch (err) {
      console.error("서비스 목록 조회 오류:", err);
      setError(err instanceof Error ? err.message : "서비스 목록을 불러올 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(serviceId: string) {
    if (!confirm("정말 이 서비스를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/health/kcdc-premium/periodic-services/${serviceId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("서비스 삭제 실패");
      }

      toast({
        title: "삭제 완료",
        description: "서비스가 삭제되었습니다.",
      });

      loadServices();
    } catch (err) {
      console.error("서비스 삭제 오류:", err);
      toast({
        title: "오류",
        description: err instanceof Error ? err.message : "서비스 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  }

  async function handleComplete(serviceId: string) {
    try {
      const response = await fetch(
        `/api/health/kcdc-premium/periodic-services/${serviceId}/complete`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("완료 처리 실패");
      }

      toast({
        title: "완료 처리",
        description: "서비스가 완료 처리되었습니다.",
      });

      loadServices();
    } catch (err) {
      console.error("완료 처리 오류:", err);
      toast({
        title: "오류",
        description: err instanceof Error ? err.message : "완료 처리에 실패했습니다.",
        variant: "destructive",
      });
    }
  }

  function getDaysUntil(date: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  function isOverdue(date: string): boolean {
    return getDaysUntil(date) < 0;
  }

  function isUpcoming(date: string, reminderDays: number): boolean {
    const daysUntil = getDaysUntil(date);
    return daysUntil >= 0 && daysUntil <= reminderDays;
  }

  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            주기적 건강 관리 서비스
            <PremiumBadge />
          </CardTitle>
          <CardDescription>로딩 중...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <PremiumGate isPremium={isPremium}>
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            주기적 건강 관리 서비스
            <PremiumBadge />
          </CardTitle>
          <CardDescription>
            예방접종, 건강검진, 구충제 등 주기적 서비스를 관리하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {services.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              등록된 서비스가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => {
                const daysUntil = getDaysUntil(service.next_service_date);
                const overdue = isOverdue(service.next_service_date);
                const upcoming = isUpcoming(
                  service.next_service_date,
                  service.reminder_days_before
                );

                return (
                  <div
                    key={service.id}
                    className={cn(
                      "rounded-lg border p-4 space-y-2",
                      overdue && "border-red-200 bg-red-50",
                      upcoming && !overdue && "border-yellow-200 bg-yellow-50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-semibold">{service.service_name}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">
                            {SERVICE_TYPE_LABELS[service.service_type]}
                          </Badge>
                          <Badge variant="outline">
                            {CYCLE_TYPE_LABELS[service.cycle_type]}
                            {service.cycle_type === "custom" && service.cycle_days
                              ? ` (${service.cycle_days}일)`
                              : ""}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {service.reminder_enabled ? (
                          <Bell className="w-4 h-4 text-green-600" />
                        ) : (
                          <BellOff className="w-4 h-4 text-gray-400" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingService(service);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(service.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">다음 일정:</span>
                        <span className={cn("font-medium", overdue && "text-red-600")}>
                          {service.next_service_date}
                        </span>
                      </div>
                      {daysUntil >= 0 ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {daysUntil === 0
                              ? "오늘"
                              : overdue
                                ? `${Math.abs(daysUntil)}일 지남`
                                : `${daysUntil}일 남음`}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {service.last_service_date && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>마지막 서비스: {service.last_service_date}</span>
                      </div>
                    )}

                    {service.notes && (
                      <div className="text-sm text-muted-foreground">{service.notes}</div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleComplete(service.id)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        완료 처리
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setEditingService(null);
              setDialogOpen(true);
            }}
          >
            서비스 추가
          </Button>
        </CardContent>
      </Card>

      <PeriodicServiceDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingService(null);
          }
        }}
        service={editingService}
        familyMemberId={familyMemberId}
        onSuccess={() => {
          loadServices();
          setDialogOpen(false);
          setEditingService(null);
        }}
      />
    </PremiumGate>
  );
}

