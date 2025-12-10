/**
 * @file components/health/family-notification-settings.tsx
 * @description 가족 구성원별 알림 설정 컴포넌트
 *
 * 가족 각 구성원별로 개별적인 알림 설정을 할 수 있는 컴포넌트입니다.
 * - 가족 구성원 선택
 * - 개별 알림 설정
 * - 가족 전체 알림 설정
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Settings, UserCheck, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  avatar?: string;
  notificationsEnabled: boolean;
  notificationChannels: string[];
}

interface FamilyNotificationSettingsProps {
  className?: string;
}

export function FamilyNotificationSettings({ className }: FamilyNotificationSettingsProps) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // 가족 구성원 목록 조회
  useEffect(() => {
    const fetchFamilyMembers = async () => {
      try {
        setLoading(true);
        // 실제로는 API에서 가져와야 함
        const mockMembers: FamilyMember[] = [
          {
            id: "1",
            name: "김철수",
            relation: "아빠",
            age: 42,
            notificationsEnabled: true,
            notificationChannels: ["push", "email"],
          },
          {
            id: "2",
            name: "김영희",
            relation: "엄마",
            age: 40,
            notificationsEnabled: true,
            notificationChannels: ["push", "sms"],
          },
          {
            id: "3",
            name: "김민준",
            relation: "아들",
            age: 8,
            notificationsEnabled: true,
            notificationChannels: ["push", "email", "sms"],
          },
          {
            id: "4",
            name: "김서영",
            relation: "딸",
            age: 6,
            notificationsEnabled: false,
            notificationChannels: [],
          },
        ];

        setFamilyMembers(mockMembers);
        setSelectedMember(mockMembers[0].id); // 첫 번째 구성원을 기본 선택

        // API 호출 시뮬레이션
        setTimeout(() => setLoading(false), 1000);
      } catch (error) {
        console.error("가족 구성원 조회 실패:", error);
        toast({
          title: "가족 구성원 조회 실패",
          description: "가족 구성원을 불러오는데 실패했습니다.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchFamilyMembers();
  }, [toast]);

  // 가족 구성원 알림 설정 업데이트
  const updateMemberNotifications = (memberId: string, enabled: boolean, channels?: string[]) => {
    setFamilyMembers(prev =>
      prev.map(member =>
        member.id === memberId
          ? {
              ...member,
              notificationsEnabled: enabled,
              notificationChannels: channels || member.notificationChannels
            }
          : member
      )
    );
  };

  // 채널 토글
  const toggleChannel = (memberId: string, channel: string) => {
    setFamilyMembers(prev =>
      prev.map(member =>
        member.id === memberId
          ? {
              ...member,
              notificationChannels: member.notificationChannels.includes(channel)
                ? member.notificationChannels.filter(c => c !== channel)
                : [...member.notificationChannels, channel],
            }
          : member
      )
    );
  };

  // 전체 알림 설정
  const toggleAllNotifications = (enabled: boolean) => {
    setFamilyMembers(prev =>
      prev.map(member => ({
        ...member,
        notificationsEnabled: enabled,
        notificationChannels: enabled ? ["push", "email"] : [],
      }))
    );

    toast({
      title: enabled ? "가족 알림 활성화" : "가족 알림 비활성화",
      description: `모든 가족 구성원의 알림이 ${enabled ? "활성화" : "비활성화"}되었습니다.`,
    });
  };

  const selectedMemberData = familyMembers.find(m => m.id === selectedMember);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          가족별 알림 설정
        </CardTitle>
        <p className="text-sm text-gray-600">
          각 가족 구성원별로 알림을 개별 설정하세요.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 가족 전체 설정 */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div>
            <h4 className="font-medium text-blue-900">가족 전체 알림</h4>
            <p className="text-sm text-blue-700">
              모든 가족 구성원에게 알림을 보냅니다.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toggleAllNotifications(true)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              모두 활성
            </button>
            <button
              onClick={() => toggleAllNotifications(false)}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              모두 비활성
            </button>
          </div>
        </div>

        {/* 가족 구성원 목록 */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">가족 구성원별 설정</h4>

          {familyMembers.map((member) => (
            <div
              key={member.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedMember === member.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
              onClick={() => setSelectedMember(member.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>
                      {member.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.name}</span>
                      <Badge variant="outline">{member.relation}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      만 {member.age}세
                      {member.notificationsEnabled ? (
                        <span className="ml-2 text-green-600">
                          <UserCheck className="w-3 h-3 inline mr-1" />
                          알림 활성
                        </span>
                      ) : (
                        <span className="ml-2 text-gray-400">
                          <UserX className="w-3 h-3 inline mr-1" />
                          알림 비활성
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {member.notificationChannels.length}개 채널
                    </div>
                    <div className="flex gap-1">
                      {member.notificationChannels.slice(0, 2).map((channel) => (
                        <Badge key={channel} variant="secondary" className="text-xs">
                          {channel}
                        </Badge>
                      ))}
                      {member.notificationChannels.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{member.notificationChannels.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Settings className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 선택된 구성원 상세 설정 */}
        {selectedMemberData && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={selectedMemberData.avatar} />
                <AvatarFallback className="text-xs">
                  {selectedMemberData.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {selectedMemberData.name}의 알림 설정
            </h4>

            {/* 알림 활성화 토글 */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900">
                  건강 알림 활성화
                </label>
                <p className="text-sm text-gray-500">
                  {selectedMemberData.name}에게 건강 관련 알림을 보냅니다.
                </p>
              </div>
              <Switch
                checked={selectedMemberData.notificationsEnabled}
                onCheckedChange={(enabled) =>
                  updateMemberNotifications(selectedMemberData.id, enabled)
                }
              />
            </div>

            {selectedMemberData.notificationsEnabled && (
              <>
                {/* 알림 채널 설정 */}
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-3 block">
                    알림 채널
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {["push", "sms", "email", "in_app"].map((channel) => {
                      const isSelected = selectedMemberData.notificationChannels.includes(channel);
                      const channelLabels = {
                        push: "푸시 알림",
                        sms: "문자 메시지",
                        email: "이메일",
                        in_app: "앱 내 알림",
                      };

                      return (
                        <div
                          key={channel}
                          className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => toggleChannel(selectedMemberData.id, channel)}
                        >
                          <Switch
                            checked={isSelected}
                            onCheckedChange={() => toggleChannel(selectedMemberData.id, channel)}
                          />
                          <span className="text-sm font-medium">
                            {channelLabels[channel as keyof typeof channelLabels]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 알림 우선순위 설정 */}
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-3 block">
                    알림 우선순위
                  </label>
                  <Select defaultValue="normal">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">높음 - 모든 알림 받기</SelectItem>
                      <SelectItem value="normal">보통 - 중요 알림만</SelectItem>
                      <SelectItem value="low">낮음 - 긴급 알림만</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        )}

        {/* 가족 알림 통계 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">가족 알림 통계</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">알림 활성:</span>
              <span className="ml-2 text-green-600">
                {familyMembers.filter(m => m.notificationsEnabled).length}명
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">알림 비활성:</span>
              <span className="ml-2 text-red-600">
                {familyMembers.filter(m => !m.notificationsEnabled).length}명
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">총 알림 채널:</span>
              <span className="ml-2">
                {familyMembers.reduce((acc, m) => acc + m.notificationChannels.length, 0)}개
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">평균 채널:</span>
              <span className="ml-2">
                {(familyMembers.reduce((acc, m) => acc + m.notificationChannels.length, 0) / familyMembers.length).toFixed(1)}개
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

