/**
 * @file components/health/notification-settings-client.tsx
 * @description 알림 설정 클라이언트 컴포넌트
 *
 * 알림 설정을 관리하는 인터랙티브 컴포넌트
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, BellOff, Clock, Save, RefreshCw } from "lucide-react";

interface NotificationSettings {
  popup_enabled: boolean;
  browser_enabled: boolean;
  notification_time: string;
  last_notification_date: string | null;
  last_dismissed_date: string | null;
}

interface NotificationSettingsClientProps {
  initialSettings: NotificationSettings;
  userName: string;
}

export function NotificationSettingsClient({
  initialSettings,
  userName,
}: NotificationSettingsClientProps) {
  const [settings, setSettings] = useState<NotificationSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 설정 저장
  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/diet/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          popup_enabled: settings.popup_enabled,
          browser_enabled: settings.browser_enabled,
          notification_time: settings.notification_time,
        }),
      });

      if (!response.ok) {
        throw new Error("설정 저장에 실패했습니다");
      }

      const result = await response.json();
      setSettings(result.settings);
      setMessage({ type: 'success', text: '설정이 저장되었습니다.' });

      console.log("✅ 알림 설정 저장 성공");

    } catch (error) {
      console.error("❌ 설정 저장 실패:", error);
      setMessage({ type: 'error', text: '설정 저장에 실패했습니다. 다시 시도해주세요.' });
    } finally {
      setSaving(false);
    }
  };

  // 브라우저 알림 권한 요청
  const requestBrowserNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('이 브라우저는 알림을 지원하지 않습니다.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('✅ 브라우저 알림 권한 허용됨');
        // 설정도 자동으로 활성화
        setSettings(prev => ({ ...prev, browser_enabled: true }));
      } else {
        console.log('❌ 브라우저 알림 권한 거부됨');
        setSettings(prev => ({ ...prev, browser_enabled: false }));
      }
    } catch (error) {
      console.error('브라우저 알림 권한 요청 실패:', error);
    }
  };

  // 설정 변경 시 메시지 초기화
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="space-y-6">
      {/* 메시지 표시 */}
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* 팝업 알림 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            웹사이트 팝업 알림
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="popup-enabled" className="text-base font-medium">
                팝업 알림 활성화
              </Label>
              <p className="text-sm text-gray-600">
                사이트 방문 시 오늘의 추천 식단을 팝업으로 보여줍니다.
              </p>
            </div>
            <Switch
              id="popup-enabled"
              checked={settings.popup_enabled}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, popup_enabled: checked }))
              }
            />
          </div>

          {settings.popup_enabled && (
            <div className="pl-4 border-l-2 border-orange-200 space-y-2">
              <p className="text-sm text-gray-700">
                💡 <strong>팝업 표시 조건:</strong>
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• 오전 5시 이후 사이트 방문 시</li>
                <li>• 오늘 식단이 생성되어 있는 경우</li>
                <li>• 오늘 아직 팝업을 보지 않은 경우</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 브라우저 알림 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5 text-blue-500" />
            브라우저 알림
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="browser-enabled" className="text-base font-medium">
                브라우저 알림 활성화
              </Label>
              <p className="text-sm text-gray-600">
                브라우저에서 시스템 알림을 받아볼 수 있습니다.
              </p>
            </div>
            <Switch
              id="browser-enabled"
              checked={settings.browser_enabled}
              onCheckedChange={(checked) => {
                setSettings(prev => ({ ...prev, browser_enabled: checked }));
                if (checked) {
                  requestBrowserNotificationPermission();
                }
              }}
            />
          </div>

          {settings.browser_enabled && (
            <div className="pl-4 border-l-2 border-blue-200 space-y-2">
              <p className="text-sm text-gray-700">
                🔧 <strong>브라우저 권한 상태:</strong> {
                  typeof window !== 'undefined' && 'Notification' in window
                    ? Notification.permission === 'granted'
                      ? '✅ 허용됨'
                      : Notification.permission === 'denied'
                      ? '❌ 거부됨'
                      : '⏳ 권한 요청 필요'
                    : '브라우저 미지원'
                }
              </p>
              {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
                <Button
                  onClick={requestBrowserNotificationPermission}
                  variant="outline"
                  size="sm"
                >
                  권한 요청하기
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 알림 시간 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            알림 시간 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notification-time" className="text-base font-medium">
              팝업 알림 시작 시간
            </Label>
            <p className="text-sm text-gray-600">
              이 시간 이후에 사이트를 방문하면 식단 팝업이 표시됩니다. (KST 기준)
            </p>
            <Input
              id="notification-time"
              type="time"
              value={settings.notification_time}
              onChange={(e) =>
                setSettings(prev => ({ ...prev, notification_time: e.target.value }))
              }
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* 알림 기록 */}
      {(settings.last_notification_date || settings.last_dismissed_date) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              최근 알림 기록
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            {settings.last_notification_date && (
              <p>
                📅 마지막 팝업 표시: {new Date(settings.last_notification_date).toLocaleDateString('ko-KR')}
              </p>
            )}
            {settings.last_dismissed_date && (
              <p>
                🙅 마지막 닫기: {new Date(settings.last_dismissed_date).toLocaleDateString('ko-KR')}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              설정 저장
            </>
          )}
        </Button>
      </div>

      {/* 도움말 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm text-blue-800">
            <p className="font-medium">💡 알림 설정 팁:</p>
            <ul className="space-y-1 ml-4">
              <li>• 팝업 알림은 사이트 방문 시에만 표시됩니다.</li>
              <li>• 브라우저 알림은 시스템 레벨에서 작동합니다.</li>
              <li>• 매일 오전 5시에 새로운 식단이 자동 생성됩니다.</li>
              <li>• 알림을 원하지 않으시면 모두 비활성화해주세요.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
