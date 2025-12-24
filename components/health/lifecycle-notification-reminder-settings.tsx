/**
 * @file components/health/lifecycle-notification-reminder-settings.tsx
 * @description 생애주기별 알림 리마인더 설정 컴포넌트
 * 
 * 주요 기능:
 * 1. 여러 리마인더 시간 설정 (7일 전, 3일 전, 당일 등)
 * 2. 알림 방법 선택 (브라우저/이메일/SMS)
 * 3. 조용한 시간대 설정 (예: 밤 10시 ~ 오전 7시 알림 금지)
 * 4. 알림별 개별 설정
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Bell, Clock, Moon, Settings, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { LifecycleNotificationReminderSettings } from '@/types/lifecycle-notification';

interface LifecycleNotificationReminderSettingsProps {
  familyMemberId?: string;
  className?: string;
}

const AVAILABLE_CHANNELS = [
  { id: 'in_app', label: '앱 내 알림' },
  { id: 'push', label: '푸시 알림' },
  { id: 'email', label: '이메일' },
  { id: 'sms', label: 'SMS' },
] as const;

const COMMON_REMINDER_DAYS = [0, 1, 3, 7, 14, 30];

export function LifecycleNotificationReminderSettings({
  familyMemberId,
  className,
}: LifecycleNotificationReminderSettingsProps) {
  const [settings, setSettings] = useState<LifecycleNotificationReminderSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [familyMemberId]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (familyMemberId) {
        params.append('family_member_id', familyMemberId);
      }

      const response = await fetch(
        `/api/health/lifecycle-notifications/reminder-settings?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('설정을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('설정 조회 실패:', error);
      toast.error('설정을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);
      const body: any = {
        ...settings,
      };
      if (familyMemberId) {
        body.family_member_id = familyMemberId;
      }

      const response = await fetch(
        '/api/health/lifecycle-notifications/reminder-settings',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error('설정 저장에 실패했습니다.');
      }

      toast.success('리마인더 설정이 저장되었습니다.');
    } catch (error) {
      console.error('설정 저장 실패:', error);
      toast.error('설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleReminderDay = (day: number) => {
    if (!settings) return;

    const currentDays = settings.reminder_days_before || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort((a, b) => b - a); // 내림차순 정렬

    setSettings({
      ...settings,
      reminder_days_before: newDays,
    });
  };

  const toggleChannel = (channel: string) => {
    if (!settings) return;

    const currentChannels = settings.notification_channels || [];
    const newChannels = currentChannels.includes(channel as any)
      ? currentChannels.filter((c) => c !== channel)
      : [...currentChannels, channel as any];

    setSettings({
      ...settings,
      notification_channels: newChannels,
    });
  };

  if (isLoading || !settings) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">설정을 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          리마인더 설정
        </CardTitle>
        <CardDescription>
          생애주기별 알림의 리마인더 시간과 방법을 설정하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 리마인더 활성화 */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="reminder-enabled">리마인더 활성화</Label>
            <p className="text-sm text-muted-foreground">
              생애주기별 알림 리마인더를 받을지 설정합니다
            </p>
          </div>
          <Switch
            id="reminder-enabled"
            checked={settings.reminder_enabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, reminder_enabled: checked })
            }
          />
        </div>

        {/* 리마인더 시간 설정 */}
        {settings.reminder_enabled && (
          <>
            <div>
              <Label className="mb-3 block">리마인더 시간 설정</Label>
              <p className="text-sm text-muted-foreground mb-3">
                알림 예정일로부터 며칠 전에 리마인더를 받을지 선택하세요
              </p>
              <div className="flex flex-wrap gap-2">
                {COMMON_REMINDER_DAYS.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`reminder-day-${day}`}
                      checked={settings.reminder_days_before?.includes(day) || false}
                      onCheckedChange={() => toggleReminderDay(day)}
                    />
                    <Label
                      htmlFor={`reminder-day-${day}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {day === 0 ? '당일' : `${day}일 전`}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* 알림 방법 선택 */}
            <div>
              <Label className="mb-3 block">알림 방법</Label>
              <p className="text-sm text-muted-foreground mb-3">
                알림을 받을 방법을 선택하세요 (여러 개 선택 가능)
              </p>
              <div className="space-y-2">
                {AVAILABLE_CHANNELS.map((channel) => (
                  <div key={channel.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`channel-${channel.id}`}
                      checked={settings.notification_channels?.includes(channel.id as any) || false}
                      onCheckedChange={() => toggleChannel(channel.id)}
                    />
                    <Label
                      htmlFor={`channel-${channel.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {channel.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* 조용한 시간대 설정 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    조용한 시간대
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    이 시간대에는 알림을 받지 않습니다
                  </p>
                </div>
                <Switch
                  checked={settings.quiet_hours_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, quiet_hours_enabled: checked })
                  }
                />
              </div>

              {settings.quiet_hours_enabled && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="quiet-hours-start">시작 시간</Label>
                    <Input
                      id="quiet-hours-start"
                      type="time"
                      value={settings.quiet_hours_start?.substring(0, 5) || '22:00'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          quiet_hours_start: `${e.target.value}:00`,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="quiet-hours-end">종료 시간</Label>
                    <Input
                      id="quiet-hours-end"
                      type="time"
                      value={settings.quiet_hours_end?.substring(0, 5) || '08:00'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          quiet_hours_end: `${e.target.value}:00`,
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* 저장 버튼 */}
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              설정 저장
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

