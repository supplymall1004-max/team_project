/**
 * @file components/health/premium/checkup-record-card.tsx
 * @description 건강검진 기록 카드 컴포넌트 (프리미엄 전용)
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Plus,
  AlertTriangle,
  Pencil,
  Trash2,
} from "lucide-react";
import { PremiumGate, PremiumBadge } from "@/components/premium/premium-gate";
import { getCurrentSubscription } from "@/actions/payments/get-subscription";
import { CheckupRecordDialog } from "./checkup-record-dialog";
import type { HealthCheckupRecord, CheckupType } from "@/types/kcdc";
import { cn } from "@/lib/utils";

interface CheckupRecordCardProps {
  familyMemberId?: string;
  className?: string;
}

const CHECKUP_TYPE_LABELS: Record<CheckupType, string> = {
  national: "국가건강검진",
  cancer: "암검진",
  special: "특수검진",
};

export function CheckupRecordCard({
  familyMemberId,
  className,
}: CheckupRecordCardProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<HealthCheckupRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthCheckupRecord | null>(null);

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
        `/api/health/kcdc-premium/checkups/records?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("건강검진 기록 조회에 실패했습니다.");
      }

      const data = await response.json();
      setRecords(data.data || []);
    } catch (err) {
      console.error("건강검진 기록 조회 실패:", err);
      setError(err instanceof Error ? err.message : "건강검진 기록을 불러올 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const isOverdue = (nextRecommendedDate: string | null): boolean => {
    if (!nextRecommendedDate) return false;
    return new Date(nextRecommendedDate) < new Date();
  };

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            건강검진 기록
            <PremiumBadge />
          </CardTitle>
          <CardDescription>건강검진 이력 관리</CardDescription>
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
            <Stethoscope className="w-5 h-5" />
            건강검진 기록
            <PremiumBadge />
          </CardTitle>
          <CardDescription>건강검진 이력 관리</CardDescription>
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
                      <div className="font-semibold">
                        {CHECKUP_TYPE_LABELS[record.checkup_type]}
                      </div>
                      {record.checkup_site && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {record.checkup_site}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {record.next_recommended_date &&
                        isOverdue(record.next_recommended_date) && (
                          <Badge variant="destructive">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            연체
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
                            confirm("이 건강검진 기록을 삭제하시겠습니까?")
                          ) {
                            try {
                              const response = await fetch(
                                `/api/health/kcdc-premium/checkups/records/${record.id}`,
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
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      검진일: {new Date(record.checkup_date).toLocaleDateString("ko-KR")}
                    </div>
                    {record.next_recommended_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        다음 권장일:{" "}
                        {new Date(record.next_recommended_date).toLocaleDateString("ko-KR")}
                      </div>
                    )}
                  </div>

                  {record.results &&
                    Object.keys(record.results).length > 0 && (
                      <div className="text-xs text-muted-foreground border-t pt-2">
                        <div className="font-semibold mb-1">검진 결과 요약</div>
                        <div className="space-y-1">
                          {Object.entries(record.results).slice(0, 3).map(([key, value]) => (
                            <div key={key}>
                              {key}: {String(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Stethoscope className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>건강검진 기록이 없습니다.</p>
              <p className="text-sm mt-2">
                건강검진 기록을 추가하여 관리하세요.
              </p>
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

      <CheckupRecordDialog
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

