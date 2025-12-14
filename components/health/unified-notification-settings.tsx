/**
 * @file components/health/unified-notification-settings.tsx
 * @description 통합 건강 알림 설정 컴포넌트
 *
 * 모든 건강 관련 알림을 통합적으로 설정할 수 있는 컴포넌트입니다:
 * - 예방주사 알림 설정
 * - 약물 복용 알림 설정
 * - 건강검진 알림 설정
 * - 병원 진료 알림 설정
 * - 알림 채널 설정 (푸시, SMS, 이메일, 앱 내)
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Calendar,
  Pill,
  Stethoscope,
  Clock,
  Smartphone,
  Mail,
  MessageSquare,
  Save,
  TestTube
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettings {
  // 예방주사 알림
  vaccinationReminders: boolean;
  vaccinationChannels: string[];
  vaccinationDaysBefore: number[];

  // 약물 복용 알림
  medicationReminders: boolean;
  medicationChannels: string[];
  medicationTimes: string[]; // HH:MM 형식

  // 건강검진 알림
  checkupReminders: boolean;
  checkupChannels: string[];
  checkupDaysBefore: number[];

  // 병원 진료 알림
  appointmentReminders: boolean;
  appointmentChannels: string[];
  appointmentDaysBefore: number[];

  // 일반 설정
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
  };
  timezone: string;
}

const AVAILABLE_CHANNELS = [
  { id: "push", label: "푸시 알림", icon: Smartphone, description: "브라우저/앱 푸시 알림" },
  { id: "sms", label: "문자 메시지", icon: MessageSquare, description: "SMS 알림 (유료)" },
  { id: "email", label: "이메일", icon: Mail, description: "이메일 알림" },
  { id: "in_app", label: "앱 내 알림", icon: Bell, description: "앱 내 알림" },
];

const AVAILABLE_DAYS = [
  { value: 30, label: "30일 전" },
  { value: 14, label: "2주 전" },
  { value: 7, label: "1주 전" },
  { value: 3, label: "3일 전" },
  { value: 1, label: "1일 전" },
  { value: 0, label: "당일" },
];

const AVAILABLE_TIMES = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00"
];

export function UnifiedNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    vaccinationReminders: true,
    vaccinationChannels: ["in_app", "push"],
    vaccinationDaysBefore: [0, 1, 7],

    medicationReminders: true,
    medicationChannels: ["in_app", "push"],
    medicationTimes: ["09:00", "21:00"],

    checkupReminders: true,
    checkupChannels: ["in_app", "email"],
    checkupDaysBefore: [7, 30],

    appointmentReminders: true,
    appointmentChannels: ["in_app", "sms"],
    appointmentDaysBefore: [1, 7],

    quietHours: {
      enabled: true,
      start: "22:00",
      end: "08:00",
    },
    timezone: "Asia/Seoul",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("vaccination");
  const { toast } = useToast();

  // 설정 조회
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        // 실제로는 API에서 가져와야 함
        // const response = await fetch("/api/health/notifications/settings");
        // const data = await response.json();

        // 모의 데이터로 설정
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("알림 설정 조회 실패:", error);
        toast({
          title: "설정 조회 실패",
          description: "알림 설정을 불러오는데 실패했습니다.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  // 설정 저장
  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch("/api/health/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "설정 저장 완료",
          description: "건강 알림 설정이 저장되었습니다.",
        });
      } else {
        throw new Error("설정 저장 실패");
      }
    } catch (error) {
      toast({
        title: "설정 저장 실패",
        description: "알림 설정 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // 채널 토글
  const toggleChannel = (category: "vaccination" | "medication" | "checkup" | "appointment", channelId: string) => {
    const categoryKey = `${category}Channels` as keyof NotificationSettings;
    const currentChannels = settings[categoryKey] as string[];

    setSettings(prev => ({
      ...prev,
      [categoryKey]: currentChannels.includes(channelId)
        ? currentChannels.filter(id => id !== channelId)
        : [...currentChannels, channelId],
    }));
  };

  // 일자 토글
  const toggleDay = (category: "vaccination" | "medication" | "checkup" | "appointment", dayValue: number) => {
    const categoryKey = `${category}DaysBefore` as keyof NotificationSettings;
    const currentDays = settings[categoryKey] as number[];

    setSettings(prev => ({
      ...prev,
      [categoryKey]: currentDays.includes(dayValue)
        ? currentDays.filter(d => d !== dayValue)
        : [...currentDays, dayValue].sort((a, b) => b - a),
    }));
  };

  // 시간 토글
  const toggleTime = (timeValue: string) => {
    setSettings(prev => ({
      ...prev,
      medicationTimes: prev.medicationTimes.includes(timeValue)
        ? prev.medicationTimes.filter(t => t !== timeValue)
        : [...prev.medicationTimes, timeValue].sort(),
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-1 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
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
          통합 알림 설정
        </CardTitle>
        <p className="text-sm text-gray-600">
          건강 관리에 필요한 모든 알림을 설정하세요.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vaccination" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              예방주사
            </TabsTrigger>
            <TabsTrigger value="medication" className="flex items-center gap-2">
              <Pill className="w-4 h-4" />
              약물
            </TabsTrigger>
            <TabsTrigger value="checkup" className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              검진
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              일반
            </TabsTrigger>
          </TabsList>

          {/* 예방주사 알림 설정 */}
          <TabsContent value="vaccination" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">
                  예방주사 알림
                </label>
                <p className="text-sm text-gray-500">
                  생애주기별 예방접종 일정을 알려드립니다.
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AVAILABLE_CHANNELS.map((channel) => {
                      const isSelected = settings.vaccinationChannels.includes(channel.id);
                      const Icon = channel.icon;

                      return (
                        <div
                          key={channel.id}
                          className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => toggleChannel("vaccination", channel.id)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleChannel("vaccination", channel.id)}
                          />
                          <Icon className="w-4 h-4 text-gray-500" />
                          <div>
                            <span className="text-sm font-medium">{channel.label}</span>
                            <p className="text-xs text-gray-500">{channel.description}</p>
                          </div>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {AVAILABLE_DAYS.map((day) => {
                      const isSelected = settings.vaccinationDaysBefore.includes(day.value);

                      return (
                        <div
                          key={day.value}
                          className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => toggleDay("vaccination", day.value)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleDay("vaccination", day.value)}
                          />
                          <span className="text-sm font-medium">{day.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* 약물 복용 알림 설정 */}
          <TabsContent value="medication" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">
                  약물 복용 알림
                </label>
                <p className="text-sm text-gray-500">
                  약물 복용 시간과 재처방 알림을 받아보세요.
                </p>
              </div>
              <Switch
                checked={settings.medicationReminders}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, medicationReminders: checked }))
                }
              />
            </div>

            {settings.medicationReminders && (
              <>
                {/* 알림 채널 */}
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-3 block">
                    알림 채널
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AVAILABLE_CHANNELS.map((channel) => {
                      const isSelected = settings.medicationChannels.includes(channel.id);
                      const Icon = channel.icon;

                      return (
                        <div
                          key={channel.id}
                          className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => toggleChannel("medication", channel.id)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleChannel("medication", channel.id)}
                          />
                          <Icon className="w-4 h-4 text-gray-500" />
                          <div>
                            <span className="text-sm font-medium">{channel.label}</span>
                            <p className="text-xs text-gray-500">{channel.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 복용 시간 */}
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-3 block">
                    복용 알림 시간
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {AVAILABLE_TIMES.map((time) => {
                      const isSelected = settings.medicationTimes.includes(time);

                      return (
                        <div
                          key={time}
                          className={`flex items-center space-x-2 p-2 border rounded cursor-pointer transition-colors ${
                            isSelected
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => toggleTime(time)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleTime(time)}
                          />
                          <span className="text-sm font-medium">{time}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* 건강검진 알림 설정 */}
          <TabsContent value="checkup" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">
                  건강검진 알림
                </label>
                <p className="text-sm text-gray-500">
                  정기 건강검진 일정과 결과를 알려드립니다.
                </p>
              </div>
              <Switch
                checked={settings.checkupReminders}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, checkupReminders: checked }))
                }
              />
            </div>

            {settings.checkupReminders && (
              <>
                {/* 알림 채널 */}
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-3 block">
                    알림 채널
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AVAILABLE_CHANNELS.map((channel) => {
                      const isSelected = settings.checkupChannels.includes(channel.id);
                      const Icon = channel.icon;

                      return (
                        <div
                          key={channel.id}
                          className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => toggleChannel("checkup", channel.id)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleChannel("checkup", channel.id)}
                          />
                          <Icon className="w-4 h-4 text-gray-500" />
                          <div>
                            <span className="text-sm font-medium">{channel.label}</span>
                            <p className="text-xs text-gray-500">{channel.description}</p>
                          </div>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {AVAILABLE_DAYS.slice(1).map((day) => { // 당일 제외
                      const isSelected = settings.checkupDaysBefore.includes(day.value);

                      return (
                        <div
                          key={day.value}
                          className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => toggleDay("checkup", day.value)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleDay("checkup", day.value)}
                          />
                          <span className="text-sm font-medium">{day.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* 일반 설정 */}
          <TabsContent value="general" className="space-y-4">
            {/* 조용한 시간대 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    조용한 시간대
                  </label>
                  <p className="text-sm text-gray-500">
                    지정된 시간에는 알림을 보내지 않습니다.
                  </p>
                </div>
                <Switch
                  checked={settings.quietHours.enabled}
                  onCheckedChange={(enabled) =>
                    setSettings(prev => ({
                      ...prev,
                      quietHours: { ...prev.quietHours, enabled }
                    }))
                  }
                />
              </div>

              {settings.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">시작 시간</label>
                    <Select
                      value={settings.quietHours.start}
                      onValueChange={(start) =>
                        setSettings(prev => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, start }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_TIMES.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">종료 시간</label>
                    <Select
                      value={settings.quietHours.end}
                      onValueChange={(end) =>
                        setSettings(prev => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, end }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_TIMES.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* 시간대 설정 */}
            <div>
              <label className="text-sm font-medium text-gray-900 mb-2 block">
                시간대
              </label>
              <Select
                value={settings.timezone}
                onValueChange={(timezone) =>
                  setSettings(prev => ({ ...prev, timezone }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Seoul">대한민국 (KST)</SelectItem>
                  <SelectItem value="America/New_York">미국 동부 (EST)</SelectItem>
                  <SelectItem value="Europe/London">영국 (GMT)</SelectItem>
                  <SelectItem value="Asia/Tokyo">일본 (JST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        {/* 설정 저장 버튼 */}
        <div className="flex justify-end pt-6 border-t">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "저장 중..." : "설정 저장"}
          </Button>
        </div>

        {/* 설정 요약 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">알림 설정 요약</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">예방주사:</span>
              <span className="ml-2">
                {settings.vaccinationReminders ? "활성" : "비활성"}
                {settings.vaccinationReminders && (
                  <span className="text-gray-500">
                    ({settings.vaccinationChannels.length}개 채널, {settings.vaccinationDaysBefore.length}개 시점)
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">약물 복용:</span>
              <span className="ml-2">
                {settings.medicationReminders ? "활성" : "비활성"}
                {settings.medicationReminders && (
                  <span className="text-gray-500">
                    ({settings.medicationChannels.length}개 채널, {settings.medicationTimes.length}개 시간)
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">건강검진:</span>
              <span className="ml-2">
                {settings.checkupReminders ? "활성" : "비활성"}
                {settings.checkupReminders && (
                  <span className="text-gray-500">
                    ({settings.checkupChannels.length}개 채널, {settings.checkupDaysBefore.length}개 시점)
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">조용한 시간:</span>
              <span className="ml-2">
                {settings.quietHours.enabled
                  ? `${settings.quietHours.start} - ${settings.quietHours.end}`
                  : "비활성"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

