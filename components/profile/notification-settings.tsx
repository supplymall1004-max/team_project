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
import { Bell, Shield, Info, Syringe, Pill, Stethoscope, Calendar, PawPrint, Brain, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettings {
  // 기본 알림
  healthPopups: boolean;
  kcdcAlerts: boolean; // 질병청 알림
  generalNotifications: boolean; // 일반 알림
  
  // 건강 관리 알림
  vaccinationReminders: boolean; // 예방주사 알림
  medicationReminders: boolean; // 약물 복용 알림
  checkupReminders: boolean; // 건강검진 알림
  appointmentReminders: boolean; // 병원 진료 알림
  
  // 반려동물 알림
  petHealthReminders: boolean; // 반려동물 건강 알림
  petVaccinationReminders: boolean; // 반려동물 백신 알림
  petLifecycleReminders: boolean; // 반려동물 생애주기 이벤트 알림
  
  // 스마트 알림
  smartNotifications: boolean; // 스마트 알림 (놓친 일정 감지)
  smartNotificationSensitivity: 'low' | 'medium' | 'high'; // 스마트 알림 민감도
}

const DEFAULT_SETTINGS: NotificationSettings = {
  healthPopups: false,
  kcdcAlerts: false,
  generalNotifications: false,
  vaccinationReminders: true,
  medicationReminders: true,
  checkupReminders: true,
  appointmentReminders: true,
  petHealthReminders: true,
  petVaccinationReminders: true,
  petLifecycleReminders: true,
  smartNotifications: true,
  smartNotificationSensitivity: 'medium',
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
          console.log("✅ 저장된 설정:", result.settings);
          // 기본값과 병합하여 누락된 필드가 있으면 기본값 사용
          setSettings({ 
            ...DEFAULT_SETTINGS, 
            ...result.settings,
            // 새로 추가된 필드가 없으면 기본값 사용
            vaccinationReminders: result.settings.vaccinationReminders ?? DEFAULT_SETTINGS.vaccinationReminders,
            medicationReminders: result.settings.medicationReminders ?? DEFAULT_SETTINGS.medicationReminders,
            checkupReminders: result.settings.checkupReminders ?? DEFAULT_SETTINGS.checkupReminders,
            appointmentReminders: result.settings.appointmentReminders ?? DEFAULT_SETTINGS.appointmentReminders,
            petHealthReminders: result.settings.petHealthReminders ?? DEFAULT_SETTINGS.petHealthReminders,
            petVaccinationReminders: result.settings.petVaccinationReminders ?? DEFAULT_SETTINGS.petVaccinationReminders,
            petLifecycleReminders: result.settings.petLifecycleReminders ?? DEFAULT_SETTINGS.petLifecycleReminders,
            smartNotifications: result.settings.smartNotifications ?? DEFAULT_SETTINGS.smartNotifications,
            smartNotificationSensitivity: result.settings.smartNotificationSensitivity ?? DEFAULT_SETTINGS.smartNotificationSensitivity,
          });
        } else {
          console.log("⚠️ 알림 설정 없음, 기본값 사용");
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
          vaccinationReminders: settings.vaccinationReminders,
          medicationReminders: settings.medicationReminders,
          checkupReminders: settings.checkupReminders,
          appointmentReminders: settings.appointmentReminders,
          petHealthReminders: settings.petHealthReminders,
          petVaccinationReminders: settings.petVaccinationReminders,
          petLifecycleReminders: settings.petLifecycleReminders,
          smartNotifications: settings.smartNotifications,
          smartNotificationSensitivity: settings.smartNotificationSensitivity,
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
      console.log("저장된 healthPopups:", result.settings?.healthPopups);
      console.log("저장된 kcdcAlerts:", result.settings?.kcdcAlerts);
      console.log("저장된 generalNotifications:", result.settings?.generalNotifications);
      console.groupEnd();

      // 저장된 설정으로 상태 업데이트
      if (result.settings) {
        const updatedSettings = { ...DEFAULT_SETTINGS, ...result.settings };
        console.log("[NotificationSettings] 업데이트된 설정 상태:", updatedSettings);
        setSettings(updatedSettings);
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

      <div className="space-y-6 mb-6">
        {/* 기본 알림 섹션 */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5" />
            기본 알림
          </h3>
          <div className="space-y-3">
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
        </div>

        {/* 건강 관리 알림 섹션 */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            건강 관리 알림
          </h3>
          <div className="space-y-3">
            {/* 예방주사 알림 */}
            <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Syringe className="h-5 w-5 text-blue-600" />
                  <Label htmlFor="vaccination-reminders" className="text-base font-semibold cursor-pointer">
                    예방주사 알림
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  예방주사 예정일 및 리마인더 알림
                </p>
              </div>
              <Switch
                id="vaccination-reminders"
                checked={settings.vaccinationReminders}
                onCheckedChange={(checked) => {
                  handleSettingChange("vaccinationReminders", checked);
                }}
              />
            </div>

            {/* 약물 복용 알림 */}
            <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-purple-600" />
                  <Label htmlFor="medication-reminders" className="text-base font-semibold cursor-pointer">
                    약물 복용 알림
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  약물 복용 시간 및 누락 알림
                </p>
              </div>
              <Switch
                id="medication-reminders"
                checked={settings.medicationReminders}
                onCheckedChange={(checked) => {
                  handleSettingChange("medicationReminders", checked);
                }}
              />
            </div>

            {/* 건강검진 알림 */}
            <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-green-600" />
                  <Label htmlFor="checkup-reminders" className="text-base font-semibold cursor-pointer">
                    건강검진 알림
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  건강검진 예정일 및 리마인더 알림
                </p>
              </div>
              <Switch
                id="checkup-reminders"
                checked={settings.checkupReminders}
                onCheckedChange={(checked) => {
                  handleSettingChange("checkupReminders", checked);
                }}
              />
            </div>

            {/* 병원 진료 알림 */}
            <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <Label htmlFor="appointment-reminders" className="text-base font-semibold cursor-pointer">
                    병원 진료 알림
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  병원 진료 예약 및 리마인더 알림
                </p>
              </div>
              <Switch
                id="appointment-reminders"
                checked={settings.appointmentReminders}
                onCheckedChange={(checked) => {
                  handleSettingChange("appointmentReminders", checked);
                }}
              />
            </div>
          </div>
        </div>

        {/* 반려동물 알림 섹션 */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PawPrint className="h-5 w-5" />
            반려동물 알림
          </h3>
          <div className="space-y-3">
            {/* 반려동물 건강 알림 */}
            <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <PawPrint className="h-5 w-5 text-orange-600" />
                  <Label htmlFor="pet-health-reminders" className="text-base font-semibold cursor-pointer">
                    반려동물 건강 알림
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  반려동물 건강 검진 및 관리 알림
                </p>
              </div>
              <Switch
                id="pet-health-reminders"
                checked={settings.petHealthReminders}
                onCheckedChange={(checked) => {
                  handleSettingChange("petHealthReminders", checked);
                }}
              />
            </div>

            {/* 반려동물 백신 알림 */}
            <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Syringe className="h-5 w-5 text-amber-600" />
                  <Label htmlFor="pet-vaccination-reminders" className="text-base font-semibold cursor-pointer">
                    반려동물 백신 알림
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  반려동물 백신 예정일 및 리마인더 알림
                </p>
              </div>
              <Switch
                id="pet-vaccination-reminders"
                checked={settings.petVaccinationReminders}
                onCheckedChange={(checked) => {
                  handleSettingChange("petVaccinationReminders", checked);
                }}
              />
            </div>

            {/* 반려동물 생애주기 이벤트 알림 */}
            <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-pink-600" />
                  <Label htmlFor="pet-lifecycle-reminders" className="text-base font-semibold cursor-pointer">
                    반려동물 생애주기 이벤트 알림
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  중성화 수술, 치과 검진 등 생애주기별 건강 이벤트 알림
                </p>
              </div>
              <Switch
                id="pet-lifecycle-reminders"
                checked={settings.petLifecycleReminders}
                onCheckedChange={(checked) => {
                  handleSettingChange("petLifecycleReminders", checked);
                }}
              />
            </div>
          </div>
        </div>

        {/* 스마트 알림 섹션 */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-600" />
            스마트 알림
            <Badge variant="outline" className="ml-2 text-xs">
              NEW
            </Badge>
          </h3>
          <div className="space-y-3">
            {/* 스마트 알림 활성화 */}
            <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-indigo-600" />
                  <Label htmlFor="smart-notifications" className="text-base font-semibold cursor-pointer">
                    스마트 알림
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground ml-7">
                  꼭 해야 할 일을 놓쳤을 때 자동으로 알림을 보내드립니다
                </p>
                <div className="ml-7 mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">• 예방주사를 놓쳤을 때</p>
                  <p className="text-xs text-muted-foreground">• 약물 복용을 놓쳤을 때</p>
                  <p className="text-xs text-muted-foreground">• 건강검진을 놓쳤을 때</p>
                  <p className="text-xs text-muted-foreground">• 반려동물 백신을 놓쳤을 때</p>
                </div>
              </div>
              <Switch
                id="smart-notifications"
                checked={settings.smartNotifications}
                onCheckedChange={(checked) => {
                  handleSettingChange("smartNotifications", checked);
                }}
              />
            </div>

            {/* 스마트 알림 민감도 설정 */}
            {settings.smartNotifications && (
              <div className="p-4 border rounded-lg bg-indigo-50/50 border-indigo-200">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-indigo-600" />
                  <Label htmlFor="smart-sensitivity" className="text-sm font-semibold">
                    알림 민감도
                  </Label>
                </div>
                <Select
                  value={settings.smartNotificationSensitivity}
                  onValueChange={(value: 'low' | 'medium' | 'high') => {
                    setSettings(prev => ({ ...prev, smartNotificationSensitivity: value }));
                  }}
                >
                  <SelectTrigger id="smart-sensitivity" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">낮음 - 중요한 일정만 알림</SelectItem>
                    <SelectItem value="medium">보통 - 권장 일정까지 알림</SelectItem>
                    <SelectItem value="high">높음 - 모든 놓친 일정 알림</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  {settings.smartNotificationSensitivity === 'low' && '높은 우선순위 일정만 알림합니다'}
                  {settings.smartNotificationSensitivity === 'medium' && '중요한 일정과 권장 일정을 알림합니다'}
                  {settings.smartNotificationSensitivity === 'high' && '모든 놓친 일정을 알림합니다'}
                </p>
              </div>
            )}
          </div>
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
