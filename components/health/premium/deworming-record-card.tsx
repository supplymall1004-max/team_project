/**
 * @file components/health/premium/deworming-record-card.tsx
 * @description 구충제 복용 기록 카드 컴포넌트 (프리미엄 전용)
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Pencil, Trash2, Plus } from "lucide-react";
import { PremiumGate, PremiumBadge } from "@/components/premium/premium-gate";
import { getCurrentSubscription } from "@/actions/payments/get-subscription";
import { DewormingRecordDialog } from "./deworming-record-dialog";
import type { DewormingRecord } from "@/types/kcdc";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface DewormingRecordCardProps {
  familyMemberId?: string;
  className?: string;
}

export function DewormingRecordCard({
  familyMemberId,
  className,
}: DewormingRecordCardProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<DewormingRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DewormingRecord | null>(null);
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
      loadRecords();
    }
  }, [isPremium, familyMemberId]);

  async function loadRecords() {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (familyMemberId) {
        params.append("family_member_id", familyMemberId);
      }

      const response = await fetch(
        `/api/health/kcdc-premium/deworming/records?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("복용 기록 조회 실패");
      }

      const result = await response.json();
      setRecords(result.data || []);
      setError(null);
    } catch (err) {
      console.error("복용 기록 조회 오류:", err);
      setError(err instanceof Error ? err.message : "복용 기록을 불러올 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(recordId: string) {
    if (!confirm("정말 이 기록을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/health/kcdc-premium/deworming/records/${recordId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("기록 삭제 실패");
      }

      toast({
        title: "삭제 완료",
        description: "기록이 삭제되었습니다.",
      });

      loadRecords();
    } catch (err) {
      console.error("기록 삭제 오류:", err);
      toast({
        title: "오류",
        description: err instanceof Error ? err.message : "기록 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  }

  function getDaysUntil(date: string | null | undefined): number | null {
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            구충제 복용 기록
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
            구충제 복용 기록
            <PremiumBadge />
          </CardTitle>
          <CardDescription>구충제 복용 기록을 관리하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {records.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              등록된 기록이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => {
                const daysUntil = getDaysUntil(record.next_due_date);
                const overdue = daysUntil !== null && daysUntil < 0;

                return (
                  <div
                    key={record.id}
                    className={cn(
                      "rounded-lg border p-4 space-y-2",
                      overdue && "border-red-200 bg-red-50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-semibold">{record.medication_name}</div>
                        <div className="text-sm text-muted-foreground">
                          복용량: {record.dosage}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingRecord(record);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(record.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">복용일:</span>
                        <span className="font-medium">{record.taken_date}</span>
                      </div>
                      {record.next_due_date && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">다음 복용일:</span>
                          <span className={cn("font-medium", overdue && "text-red-600")}>
                            {record.next_due_date}
                          </span>
                          {daysUntil !== null && (
                            <Badge variant={overdue ? "destructive" : "outline"}>
                              {daysUntil === 0
                                ? "오늘"
                                : overdue
                                  ? `${Math.abs(daysUntil)}일 지남`
                                  : `${daysUntil}일 남음`}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {record.prescribed_by && (
                      <div className="text-sm text-muted-foreground">
                        처방: {record.prescribed_by}
                      </div>
                    )}

                    {record.notes && (
                      <div className="text-sm text-muted-foreground">{record.notes}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setEditingRecord(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            기록 추가
          </Button>
        </CardContent>
      </Card>

      <DewormingRecordDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingRecord(null);
          }
        }}
        record={editingRecord}
        familyMemberId={familyMemberId}
        onSuccess={() => {
          loadRecords();
          setDialogOpen(false);
          setEditingRecord(null);
        }}
      />
    </PremiumGate>
  );
}

