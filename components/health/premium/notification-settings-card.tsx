/**
 * @file components/health/premium/notification-settings-card.tsx
 * @description 알림 설정 카드 컴포넌트 (프리미엄 전용)
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Bell, Save } from "lucide-react";
import { PremiumGate, PremiumBadge } from "@/components/premium/premium-gate";
import { getCurrentSubscription } from "@/actions/payments/get-subscription";
import type { UserNotificationSettings } from "@/types/kcdc";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettingsCardProps {
  className?: string;
}

export function NotificationSettingsCard({ className }: NotificationSettingsCardProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<UserNotificationSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      loadSettings();
    }
  }, [isPremium]);

  async function loadSettings() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/health/kcdc-premium/notification-settings");

      if (!response.ok) {
        throw new Error("알림 설정 조회 실패");
      }

      const result = await response.json();
      setSettings(result.data);
      setError(null);
    } catch (err) {
      console.error("알림 설정 조회 오류:", err);
      setError(err instanceof Error ? err.message : "알림 설정을 불러올 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!settings) return;

    try {
      setIsSaving(true);
      const response = await fetch("/api/health/kcdc-premium/notification-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "알림 설정 저장 실패");
      }

      toast({
        title: "저장 완료",
        description: "알림 설정이 저장되었습니다.",
      });
    } catch (err) {
      console.error("알림 설정 저장 오류:", err);
      toast({
        title: "오류",
        description: err instanceof Error ? err.message : "알림 설정 저장에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function updateSetting<K extends keyof UserNotificationSettings>(
    key: K,
    value: UserNotificationSettings[K]
  ) {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            알림 설정
            <PremiumBadge />
          </CardTitle>
          <CardDescription>로딩 중...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            알림 설정
            <PremiumBadge />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <PremiumGate isPremium={isPremium}>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            알림 설정
            <PremiumBadge />
          </CardTitle>
          <CardDescription>
            건강 관리 서비스 알림을 설정하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="periodic_services_enabled">주기적 서비스 알림</Label>
                <p className="text-sm text-muted-foreground">
                  예방접종, 건강검진 등 주기적 서비스 알림
                </p>
              </div>
              <Switch
                id="periodic_services_enabled"
                checked={settings.periodic_services_enabled}
                onCheckedChange={(checked) =>
                  updateSetting("periodic_services_enabled", checked)
                }
              />
            </div>

            {settings.periodic_services_enabled && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="reminder_days">알림 일수 전</Label>
                <Input
                  id="reminder_days"
                  type="number"
                  min="1"
                  max="30"
                  value={settings.periodic_services_reminder_days}
                  onChange={(e) =>
                    updateSetting("periodic_services_reminder_days", parseInt(e.target.value, 10))
                  }
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="deworming_reminders_enabled">구충제 복용 알림</Label>
                <p className="text-sm text-muted-foreground">
                  구충제 복용 일정 알림
                </p>
              </div>
              <Switch
                id="deworming_reminders_enabled"
                checked={settings.deworming_reminders_enabled}
                onCheckedChange={(checked) =>
                  updateSetting("deworming_reminders_enabled", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="vaccination_reminders_enabled">예방접종 알림</Label>
                <p className="text-sm text-muted-foreground">
                  예방접종 일정 알림
                </p>
              </div>
              <Switch
                id="vaccination_reminders_enabled"
                checked={settings.vaccination_reminders_enabled}
                onCheckedChange={(checked) =>
                  updateSetting("vaccination_reminders_enabled", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="checkup_reminders_enabled">건강검진 알림</Label>
                <p className="text-sm text-muted-foreground">
                  건강검진 일정 알림
                </p>
              </div>
              <Switch
                id="checkup_reminders_enabled"
                checked={settings.checkup_reminders_enabled}
                onCheckedChange={(checked) =>
                  updateSetting("checkup_reminders_enabled", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="infection_risk_alerts_enabled">감염병 위험 알림</Label>
                <p className="text-sm text-muted-foreground">
                  감염병 위험 지수 알림
                </p>
              </div>
              <Switch
                id="infection_risk_alerts_enabled"
                checked={settings.infection_risk_alerts_enabled}
                onCheckedChange={(checked) =>
                  updateSetting("infection_risk_alerts_enabled", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="travel_risk_alerts_enabled">여행 위험도 알림</Label>
                <p className="text-sm text-muted-foreground">
                  여행 위험도 평가 알림
                </p>
              </div>
              <Switch
                id="travel_risk_alerts_enabled"
                checked={settings.travel_risk_alerts_enabled}
                onCheckedChange={(checked) =>
                  updateSetting("travel_risk_alerts_enabled", checked)
                }
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </CardContent>
      </Card>
    </PremiumGate>
  );
}

