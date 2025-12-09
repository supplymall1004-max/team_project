/**
 * @file components/health/vaccination-notification-settings.tsx
 * @description 예방주사 알림 설정 컴포넌트
 *
 * 사용자가 예방주사 알림을 어떻게 받고 싶은지 설정
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettings {
  vaccinationReminders: boolean;
  reminderChannels: string[];
  reminderDaysBefore: number[];
}

const AVAILABLE_CHANNELS = [
  { id: "push", label: "푸시 알림", icon: Smartphone },
  { id: "sms", label: "문자 메시지", icon: MessageSquare },
  { id: "email", label: "이메일", icon: Mail },
  { id: "in_app", label: "앱 내 알림", icon: Bell },
];

const AVAILABLE_DAYS = [
  { value: 30, label: "30일 전" },
  { value: 14, label: "2주 전" },
  { value: 7, label: "1주 전" },
  { value: 3, label: "3일 전" },
  { value: 1, label: "1일 전" },
  { value: 0, label: "당일" },
];

export function VaccinationNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    vaccinationReminders: true,
    reminderChannels: ["in_app"],
    reminderDaysBefore: [0, 1, 7],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // 설정 조회
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/health/vaccinations/notifications");
        const data = await response.json();

        if (data.success) {
          setSettings(data.data);
        }
      } catch (error) {
        console.error("알림 설정 조회 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // 설정 저장
  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch("/api/health/vaccinations/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vaccination_reminders: settings.vaccinationReminders,
          reminder_channels: settings.reminderChannels,
          reminder_days_before: settings.reminderDaysBefore,
        }),
      });

      if (response.ok) {
        toast({
          title: "설정 저장 완료",
          description: "예방주사 알림 설정이 저장되었습니다.",
        });
      } else {
        throw new Error("설정 저장 실패");
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "설정 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // 채널 토글
  const toggleChannel = (channelId: string) => {
    setSettings(prev => ({
      ...prev,
      reminderChannels: prev.reminderChannels.includes(channelId)
        ? prev.reminderChannels.filter(id => id !== channelId)
        : [...prev.reminderChannels, channelId],
    }));
  };

  // 일자 토글
  const toggleDay = (dayValue: number) => {
    setSettings(prev => ({
      ...prev,
      reminderDaysBefore: prev.reminderDaysBefore.includes(dayValue)
        ? prev.reminderDaysBefore.filter(d => d !== dayValue)
        : [...prev.reminderDaysBefore, dayValue].sort((a, b) => b - a), // 내림차순 정렬
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          예방주사 알림 설정
        </CardTitle>
        <p className="text-sm text-gray-600">
          예방주사 일정에 대한 알림을 어떻게 받고 싶은지 설정하세요.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 알림 활성화 */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900">
              예방주사 알림
            </label>
            <p className="text-sm text-gray-500">
              예방주사 일정에 대한 알림을 받습니다.
            </p>
          </div>
          <Switch
            checked={settings.vaccinationReminders}
            onCheckedChange={(checked) =>
              setSettings(prev => ({ ...prev, vaccinationReminders: checked }))
            }
          />
        </div>

        {settings.vaccinationReminders && (
          <>
            {/* 알림 채널 */}
            <div>
              <label className="text-sm font-medium text-gray-900 mb-3 block">
                알림 채널
              </label>
              <p className="text-sm text-gray-500 mb-4">
                알림을 받을 방법을 선택하세요. (복수 선택 가능)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AVAILABLE_CHANNELS.map((channel) => {
                  const Icon = channel.icon;
                  const isSelected = settings.reminderChannels.includes(channel.id);

                  return (
                    <div
                      key={channel.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => toggleChannel(channel.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleChannel(channel.id)}
                      />
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">{channel.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 알림 시점 */}
            <div>
              <label className="text-sm font-medium text-gray-900 mb-3 block">
                알림 시점
              </label>
              <p className="text-sm text-gray-500 mb-4">
                접종 예정일 기준으로 몇 일 전에 알림을 받을지 선택하세요.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AVAILABLE_DAYS.map((day) => {
                  const isSelected = settings.reminderDaysBefore.includes(day.value);

                  return (
                    <div
                      key={day.value}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => toggleDay(day.value)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleDay(day.value)}
                      />
                      <span className="text-sm font-medium">{day.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* 설정 저장 버튼 */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "설정 저장"}
          </Button>
        </div>

        {/* 설정 요약 */}
        {settings.vaccinationReminders && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">설정 요약</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">알림 채널:</span>{" "}
                {settings.reminderChannels.map(channelId => {
                  const channel = AVAILABLE_CHANNELS.find(c => c.id === channelId);
                  return channel ? channel.label : channelId;
                }).join(", ")}
              </div>
              <div>
                <span className="font-medium">알림 시점:</span>{" "}
                {settings.reminderDaysBefore
                  .map(days => {
                    const day = AVAILABLE_DAYS.find(d => d.value === days);
                    return day ? day.label : `${days}일 전`;
                  })
                  .join(", ")}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

