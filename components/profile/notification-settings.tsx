/**
 * @file notification-settings.tsx
 * @description 팝업 및 알림 설정 컴포넌트
 *
 * 주요 기능:
 * 1. 건강 관련 팝업과 알림 수신 여부 설정
 * 2. 질병청 알림 (코로나19, 감염병 등 공공 보건 알림)
 * 3. 일반 알림 (서비스 업데이트, 건강 팁 등 일반 알림)
 * 4. 기본값 off 설정
 */

"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Bell, Shield, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettings {
  healthPopups: boolean;
  kcdcAlerts: boolean; // 질병청 알림
  generalNotifications: boolean; // 일반 알림
}

const DEFAULT_SETTINGS: NotificationSettings = {
  healthPopups: false,
  kcdcAlerts: false,
  generalNotifications: false,
};

export function NotificationSettings() {
  const { user: clerkUser } = useUser();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 설정 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      if (!clerkUser) {
        setIsLoading(false);
        return;
      }

      try {
        console.group("[NotificationSettings] 설정 불러오기");
        console.log("사용자 ID:", clerkUser.id);

        // API를 통해 설정 불러오기 (더 안전하고 일관성 있는 방식)
        const response = await fetch("/api/users/notification-settings");

        if (!response.ok) {
          console.warn("⚠️ 설정 조회 실패:", response.status);
          setSettings(DEFAULT_SETTINGS);
          console.groupEnd();
          return;
        }

        const result = await response.json();
        
        if (result.settings) {
          console.log("저장된 설정:", result.settings);
          setSettings({ ...DEFAULT_SETTINGS, ...result.settings });
        } else {
          console.log("알림 설정 없음, 기본값 사용");
          setSettings(DEFAULT_SETTINGS);
        }

        console.groupEnd();
      } catch (error) {
        console.error("❌ 설정 불러오기 실패:", error);
        console.groupEnd();
        // 에러가 발생해도 기본값으로 설정하여 UI가 정상 작동하도록 함
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [clerkUser]);

  // 설정 저장
  const saveSettings = async () => {
    if (!clerkUser) {
      console.warn("[NotificationSettings] 로그인되지 않은 사용자");
      toast({
        title: "로그인 필요",
        description: "설정을 저장하려면 로그인이 필요합니다.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      console.group("[NotificationSettings] 설정 저장 시작");
      console.log("현재 사용자 ID:", clerkUser.id);
      console.log("저장할 설정:", {
        healthPopups: settings.healthPopups,
        kcdcAlerts: settings.kcdcAlerts,
        generalNotifications: settings.generalNotifications,
      });

      // API를 통해 설정 저장 (더 안전하고 일관성 있는 방식)
      const response = await fetch("/api/users/notification-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kcdcAlerts: settings.kcdcAlerts,
          healthPopups: settings.healthPopups,
          generalNotifications: settings.generalNotifications,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ API 응답 오류:", response.status, errorData);
        
        const errorMessage = errorData.details || errorData.error || "알림 설정 저장에 실패했습니다.";
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("✅ 설정 저장 성공");
      console.log("저장된 데이터:", result);
      console.groupEnd();

      // 저장된 설정으로 상태 업데이트
      if (result.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...result.settings });
      }

      toast({
        title: "설정 저장 완료",
        description: "알림 설정이 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      console.error("❌ 설정 저장 실패:", error);
      console.groupEnd();

      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
      toast({
        title: "설정 저장 실패",
        description: `알림 설정 저장 중 오류가 발생했습니다: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 설정 변경 핸들러
  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    console.log(`[NotificationSettings] ${key} 설정 변경:`, value);
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // 설정 초기화
  const resetSettings = () => {
    console.log("[NotificationSettings] 설정 초기화");
    setSettings(DEFAULT_SETTINGS);
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card text-card-foreground shadow-sm transition-all p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">설정을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card text-card-foreground shadow-sm transition-all p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Bell className="h-6 w-6" />
          팝업 및 알림 설정
        </h2>
        <p className="text-muted-foreground">
          건강 관련 팝업과 알림 수신 여부를 설정하세요.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {/* 질병청 알림 */}
        <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              <Label htmlFor="kcdc-alerts" className="text-base font-semibold cursor-pointer">
                질병청 알림
              </Label>
            </div>
            <p className="text-sm text-muted-foreground ml-7">
              코로나19, 감염병 등 공공 보건 알림
            </p>
          </div>
          <Switch
            id="kcdc-alerts"
            checked={settings.kcdcAlerts}
            onCheckedChange={(checked) => {
              console.log("[NotificationSettings] 질병청 알림 설정 변경:", checked);
              handleSettingChange("kcdcAlerts", checked);
            }}
          />
        </div>

        {/* 일반 알림 */}
        <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-green-600" />
              <Label htmlFor="general-notifications" className="text-base font-semibold cursor-pointer">
                일반 알림
              </Label>
            </div>
            <p className="text-sm text-muted-foreground ml-7">
              서비스 업데이트, 건강 팁 등 일반 알림
            </p>
          </div>
          <Switch
            id="general-notifications"
            checked={settings.generalNotifications}
            onCheckedChange={(checked) => {
              console.log("[NotificationSettings] 일반 알림 설정 변경:", checked);
              handleSettingChange("generalNotifications", checked);
            }}
          />
        </div>
      </div>

      {/* 저장 버튼 영역 */}
      <div className="mt-8 pt-6 border-t border-border/60 w-full">
        <div className="flex justify-end gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              console.log("[NotificationSettings] 설정 초기화 클릭");
              resetSettings();
            }}
            disabled={isSaving}
            size="default"
          >
            초기화
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={() => {
              console.log("[NotificationSettings] 저장 버튼 클릭");
              saveSettings();
            }}
            disabled={isSaving}
            size="default"
            className="min-w-[120px]"
          >
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}
