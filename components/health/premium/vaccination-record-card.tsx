/**
 * @file components/health/premium/vaccination-record-card.tsx
 * @description 예방접종 기록 카드 컴포넌트 (프리미엄 전용)
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Syringe,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { PremiumGate, PremiumBadge } from "@/components/premium/premium-gate";
import { getCurrentSubscription } from "@/actions/payments/get-subscription";
import { VaccinationRecordDialog } from "./vaccination-record-dialog";
import type { VaccinationRecord } from "@/types/kcdc";
import { cn } from "@/lib/utils";

interface VaccinationRecordCardProps {
  familyMemberId?: string;
  className?: string;
}

export function VaccinationRecordCard({
  familyMemberId,
  className,
}: VaccinationRecordCardProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<VaccinationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<VaccinationRecord | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    checkPremiumAndLoad();
  }, [familyMemberId]);

  const checkPremiumAndLoad = async () => {
    try {
      const subscription = await getCurrentSubscription();
      setIsPremium(subscription.isPremium || false);

      if (subscription.isPremium) {
        await loadRecords();
      }
    } catch (err) {
      console.error("프리미엄 체크 실패:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecords = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (familyMemberId) {
        params.append("family_member_id", familyMemberId);
      }

      const response = await fetch(
        `/api/health/kcdc-premium/vaccinations?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("예방접종 기록 조회에 실패했습니다.");
      }

      const data = await response.json();
      setRecords(data.data || []);
    } catch (err) {
      console.error("예방접종 기록 조회 실패:", err);
      setError(err instanceof Error ? err.message : "예방접종 기록을 불러올 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Syringe className="w-5 h-5" />
            예방접종 기록
            <PremiumBadge />
          </CardTitle>
          <CardDescription>백신 접종 이력 관리</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Clock className="w-6 h-6 animate-pulse text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <PremiumGate isPremium={isPremium} variant="card">
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Syringe className="w-5 h-5" />
            예방접종 기록
            <PremiumBadge />
          </CardTitle>
          <CardDescription>백신 접종 이력 관리</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}

          {records.length > 0 ? (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="rounded-lg border p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="font-semibold">{record.vaccine_name}</div>
                      {record.target_age_group && (
                        <Badge variant="outline" className="text-xs">
                          {record.target_age_group}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {record.completed_date ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          완료
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          예정
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingRecord(record);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (
                            confirm("이 예방접종 기록을 삭제하시겠습니까?")
                          ) {
                            try {
                              const response = await fetch(
                                `/api/health/kcdc-premium/vaccinations/${record.id}`,
                                {
                                  method: "DELETE",
                                }
                              );

                              if (!response.ok) {
                                throw new Error("삭제에 실패했습니다.");
                              }

                              await loadRecords();
                            } catch (error) {
                              console.error("삭제 실패:", error);
                              alert("삭제에 실패했습니다.");
                            }
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    {record.completed_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        접종일: {new Date(record.completed_date).toLocaleDateString("ko-KR")}
                      </div>
                    )}
                    {record.scheduled_date && !record.completed_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        예정일: {new Date(record.scheduled_date).toLocaleDateString("ko-KR")}
                      </div>
                    )}
                    {record.vaccination_site && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {record.vaccination_site}
                      </div>
                    )}
                    {record.dose_number && record.total_doses && (
                      <div className="text-xs">
                        {record.dose_number}/{record.total_doses}차 접종
                      </div>
                    )}
                  </div>

                  {record.notes && (
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      {record.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Syringe className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>예방접종 기록이 없습니다.</p>
              <p className="text-sm mt-2">
                예방접종 기록을 추가하여 관리하세요.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setEditingRecord(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              기록 추가
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                setIsSyncing(true);
                try {
                  const response = await fetch(
                    "/api/health/kcdc-premium/vaccinations/schedules/sync",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        family_member_ids: familyMemberId ? [familyMemberId] : undefined,
                      }),
                    }
                  );

                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "일정 동기화에 실패했습니다.");
                  }

                  const data = await response.json();
                  alert(`${data.count}개의 예방접종 일정이 생성되었습니다.`);
                  await loadRecords();
                } catch (error) {
                  console.error("동기화 실패:", error);
                  alert(
                    error instanceof Error
                      ? error.message
                      : "일정 동기화에 실패했습니다."
                  );
                } finally {
                  setIsSyncing(false);
                }
              }}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <VaccinationRecordDialog
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
        }}
      />
    </PremiumGate>
  );
}

