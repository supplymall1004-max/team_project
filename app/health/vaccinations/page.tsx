/**
 * @file app/health/vaccinations/page.tsx
 * @description 예방주사 관리 및 알림 시스템 페이지
 *
 * 이 페이지는 예방주사 일정 관리와 알림 시스템을 제공합니다.
 *
 * 주요 기능:
 * 1. 예방주사 일정 조회 및 관리
 * 2. 알림 설정 및 관리
 * 3. 백신별 권장 일정 표시
 * 4. 접종 기록 관리
 * 5. 가족 구성원별 관리
 *
 * @dependencies
 * - @supabase/supabase-js: Supabase 클라이언트
 * - @tanstack/react-query: 데이터 페칭 및 캐싱
 * - lucide-react: 아이콘
 *
 * @see {@link types/health.ts} - 건강 관련 타입 정의
 * @see {@link lib/health/vaccination-notification-service.ts} - 알림 서비스
 */

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Syringe, Calendar, Bell, BellOff, CheckCircle, Clock, AlertTriangle, Plus, Settings } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { VaccinationSchedule, VaccinationRecord, FamilyMember } from "@/types/health";

export default function VaccinationsPage() {
  console.log("[VaccinationsPage] 페이지 렌더링 시작");

  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string>("all");
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supabase = useClerkSupabaseClient();

  // 가족 구성원 목록 조회
  const { data: familyMembers } = useQuery({
    queryKey: ["family-members"],
    queryFn: async (): Promise<FamilyMember[]> => {
      console.log("[VaccinationsPage] 가족 구성원 목록 조회");

      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[VaccinationsPage] 가족 구성원 조회 에러:", error);
        throw error;
      }

      console.log("[VaccinationsPage] 가족 구성원 조회 성공:", data?.length || 0, "명");
      return data || [];
    },
  });

  // 예방주사 일정 조회
  const {
    data: vaccinationSchedules,
    isLoading: schedulesLoading,
  } = useQuery({
    queryKey: ["vaccination-schedules", selectedFamilyMemberId],
    queryFn: async (): Promise<VaccinationSchedule[]> => {
      console.log("[VaccinationsPage] 예방주사 일정 조회, 가족 구성원:", selectedFamilyMemberId);

      let query = supabase
        .from("user_vaccination_schedules")
        .select(`
          *,
          family_members (
            id,
            name,
            relationship
          )
        `)
        .order("recommended_date", { ascending: true });

      if (selectedFamilyMemberId !== "all") {
        query = query.eq("family_member_id", selectedFamilyMemberId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[VaccinationsPage] 예방주사 일정 조회 에러:", error);
        throw error;
      }

      console.log("[VaccinationsPage] 예방주사 일정 조회 성공:", data?.length || 0, "건");
      return data || [];
    },
  });

  // 예방주사 기록 조회
  const {
    data: vaccinationRecords,
    isLoading: recordsLoading,
  } = useQuery({
    queryKey: ["vaccination-records", selectedFamilyMemberId],
    queryFn: async (): Promise<VaccinationRecord[]> => {
      console.log("[VaccinationsPage] 예방주사 기록 조회, 가족 구성원:", selectedFamilyMemberId);

      let query = supabase
        .from("user_vaccination_records")
        .select(`
          *,
          family_members (
            id,
            name,
            relationship
          )
        `)
        .order("completed_date", { ascending: false });

      if (selectedFamilyMemberId !== "all") {
        query = query.eq("family_member_id", selectedFamilyMemberId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[VaccinationsPage] 예방주사 기록 조회 에러:", error);
        throw error;
      }

      console.log("[VaccinationsPage] 예방주사 기록 조회 성공:", data?.length || 0, "건");
      return data || [];
    },
  });

  // 알림 설정 조회
  const { data: notificationSettings } = useQuery({
    queryKey: ["vaccination-notification-settings"],
    queryFn: async () => {
      console.log("[VaccinationsPage] 알림 설정 조회");

      const { data, error } = await supabase
        .from("user_notification_settings")
        .select("*")
        .maybeSingle();

      if (error) {
        console.error("[VaccinationsPage] 알림 설정 조회 에러:", error);
        throw error;
      }

      console.log("[VaccinationsPage] 알림 설정 조회 성공:", data);
      return data;
    },
  });

  // 알림 토글 뮤테이션
  const toggleNotificationMutation = useMutation({
    mutationFn: async ({ scheduleId, enabled }: { scheduleId: string; enabled: boolean }) => {
      console.log("[VaccinationsPage] 알림 토글:", scheduleId, enabled);

      const { error } = await supabase
        .from("user_vaccination_schedules")
        .update({
          reminder_enabled: enabled,
          updated_at: new Date().toISOString(),
        })
        .eq("id", scheduleId);

      if (error) {
        console.error("[VaccinationsPage] 알림 토글 에러:", error);
        throw error;
      }

      console.log("[VaccinationsPage] 알림 토글 성공:", scheduleId, enabled);
    },
    onSuccess: () => {
      console.log("[VaccinationsPage] 알림 토글 성공 처리");

      queryClient.invalidateQueries({ queryKey: ["vaccination-schedules"] });
    },
    onError: (error) => {
      console.error("[VaccinationsPage] 알림 토글 실패:", error);

      toast({
        title: "설정 변경 실패",
        description: "알림 설정 변경에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 일정 상태 계산
  const getScheduleStatus = (schedule: VaccinationSchedule) => {
    const today = new Date();
    const recommendedDate = new Date(schedule.recommended_date);

    if (schedule.status === "completed") {
      return { status: "completed", label: "완료", variant: "default" as const, icon: CheckCircle };
    }

    if (schedule.status === "skipped") {
      return { status: "skipped", label: "건너뜀", variant: "outline" as const, icon: Clock };
    }

    if (today > recommendedDate) {
      return { status: "overdue", label: "기한 초과", variant: "destructive" as const, icon: AlertTriangle };
    }

    const daysUntilDue = Math.ceil((recommendedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue <= 7) {
      return { status: "upcoming", label: "임박", variant: "secondary" as const, icon: Clock };
    }

    return { status: "pending", label: "예정", variant: "outline" as const, icon: Calendar };
  };

  // 우선순위별 색상
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "required":
        return "text-red-600 bg-red-50 border-red-200";
      case "recommended":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "optional":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // 이번 달 예방주사 일정
  const upcomingSchedules = vaccinationSchedules?.filter(schedule => {
    const status = getScheduleStatus(schedule);
    return status.status === "upcoming" || status.status === "overdue";
  }) || [];

  // 완료된 예방주사
  const completedVaccinations = vaccinationRecords?.filter(record => record.completed_date) || [];

  if (schedulesLoading || recordsLoading) {
    console.log("[VaccinationsPage] 로딩 중");
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  console.log("[VaccinationsPage] 렌더링 완료, 일정 수:", vaccinationSchedules?.length || 0, "기록 수:", vaccinationRecords?.length || 0);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">예방주사 관리</h1>
          <p className="text-muted-foreground mt-2">
            예방주사 일정과 알림을 관리하세요
          </p>
        </div>

        <div className="flex gap-4">
          <Select value={selectedFamilyMemberId} onValueChange={setSelectedFamilyMemberId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="가족 구성원" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {familyMembers?.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name} ({member.relationship})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isNotificationSettingsOpen} onOpenChange={setIsNotificationSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                알림 설정
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>예방주사 알림 설정</DialogTitle>
                <DialogDescription>
                  예방주사 알림을 설정하세요
                </DialogDescription>
              </DialogHeader>

              {notificationSettings && (
                <NotificationSettingsForm
                  settings={notificationSettings}
                  onClose={() => setIsNotificationSettingsOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">임박한 일정</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{upcomingSchedules.length}</div>
            <p className="text-xs text-muted-foreground">7일 이내 접종 예정</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완료된 접종</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedVaccinations.length}</div>
            <p className="text-xs text-muted-foreground">총 접종 완료 수</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">알림 활성화</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {vaccinationSchedules?.filter(s => s.reminder_enabled).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">알림 설정된 일정 수</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="schedules" className="space-y-6">
        <TabsList>
          <TabsTrigger value="schedules">접종 일정</TabsTrigger>
          <TabsTrigger value="records">접종 기록</TabsTrigger>
          <TabsTrigger value="calendar">달력 보기</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-4">
          {vaccinationSchedules?.length === 0 ? (
            <div className="text-center py-12">
              <Syringe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">예방주사 일정이 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                KCDC 권장 일정에 따라 예방주사 일정을 추가해보세요
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                일정 추가하기
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {vaccinationSchedules?.map((schedule) => {
                const status = getScheduleStatus(schedule);
                const StatusIcon = status.icon;
                const isOverdue = status.status === "overdue";
                const daysUntilDue = Math.ceil(
                  (new Date(schedule.recommended_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <Card key={schedule.id} className={isOverdue ? "border-red-200" : ""}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Syringe className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <CardTitle className="text-lg">{schedule.vaccine_name}</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              권장일: {new Date(schedule.recommended_date).toLocaleDateString('ko-KR')}
                              {schedule.family_members && (
                                <>
                                  <span className="mx-2">•</span>
                                  {(schedule.family_members as any).name} ({(schedule.family_members as any).relationship})
                                </>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(schedule.priority)}>
                            {schedule.priority === "required" ? "필수" :
                             schedule.priority === "recommended" ? "권장" : "선택"}
                          </Badge>
                          <Badge variant={status.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">상태</Label>
                          <p className="font-medium">
                            {schedule.status === "pending" ? "예정" :
                             schedule.status === "completed" ? "완료" : "건너뜀"}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">남은 기간</Label>
                          <p className={`font-medium ${isOverdue ? "text-red-600" : daysUntilDue <= 7 ? "text-orange-600" : "text-green-600"}`}>
                            {isOverdue ? `${Math.abs(daysUntilDue)}일 지남` :
                             daysUntilDue === 0 ? "오늘" : `${daysUntilDue}일 남음`}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">알림</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleNotificationMutation.mutate({
                                scheduleId: schedule.id,
                                enabled: !schedule.reminder_enabled
                              })}
                              disabled={toggleNotificationMutation.isPending}
                            >
                              {schedule.reminder_enabled ? (
                                <Bell className="h-4 w-4 mr-1" />
                              ) : (
                                <BellOff className="h-4 w-4 mr-1" />
                              )}
                              {schedule.reminder_enabled ? "켜짐" : "꺼짐"}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {isOverdue && (
                        <Alert className="mt-4">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            접종 기한이 지났습니다. 담당 의사와 상담하여 접종 일정을 조정하세요.
                          </AlertDescription>
                        </Alert>
                      )}

                      {daysUntilDue <= 7 && !isOverdue && (
                        <Alert className="mt-4">
                          <Clock className="h-4 w-4" />
                          <AlertDescription>
                            접종 일정이 얼마 남지 않았습니다. 접종 준비를 시작하세요.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          {vaccinationRecords?.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">예방주사 기록이 없습니다</h3>
              <p className="text-muted-foreground">
                접종을 완료하면 기록이 표시됩니다
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {vaccinationRecords?.map((record) => (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <CardTitle className="text-lg">{record.vaccine_name}</CardTitle>
                        <CardDescription>
                          접종일: {record.completed_date ? new Date(record.completed_date).toLocaleDateString('ko-KR') : "정보 없음"}
                          {record.family_members && (
                            <>
                              <span className="mx-2">•</span>
                              {(record.family_members as any).name} ({(record.family_members as any).relationship})
                            </>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">접종 기관</Label>
                        <p className="font-medium">{record.vaccination_site || "정보 없음"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">접종 차수</Label>
                        <p className="font-medium">
                          {record.dose_number ? `${record.dose_number}차` : "정보 없음"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">총 차수</Label>
                        <p className="font-medium">
                          {record.total_doses ? `${record.total_doses}차` : "정보 없음"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">접종 주소</Label>
                        <p className="font-medium">{record.vaccination_site_address || "정보 없음"}</p>
                      </div>
                    </div>

                    {record.notes && (
                      <div className="mt-4">
                        <Label className="text-muted-foreground">메모</Label>
                        <p className="text-sm mt-1">{record.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">달력 보기 (준비 중)</h3>
            <p className="text-muted-foreground">
              예방주사 일정을 달력 형태로 확인할 수 있는 기능이 곧 제공됩니다
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 알림 설정 폼 컴포넌트
interface NotificationSettingsFormProps {
  settings: any;
  onClose: () => void;
}

function NotificationSettingsForm({ settings, onClose }: NotificationSettingsFormProps) {
  const [formData, setFormData] = useState({
    vaccinationReminders: settings?.vaccination_reminders_enabled ?? true,
    vaccinationChannels: settings?.vaccination_channels ?? ["in_app", "push"],
    vaccinationDaysBefore: settings?.vaccination_days_before ?? [0, 1, 7],
  });

  const handleSave = () => {
    // TODO: 설정 저장 로직 구현
    console.log("[NotificationSettingsForm] 설정 저장:", formData);
    onClose();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">예방주사 알림</Label>
          <p className="text-sm text-muted-foreground">예방주사 접종 알림을 받을지 설정하세요</p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="vaccinationReminders"
            checked={formData.vaccinationReminders}
            onChange={(e) => setFormData(prev => ({ ...prev, vaccinationReminders: e.target.checked }))}
            className="rounded"
          />
          <Label htmlFor="vaccinationReminders">예방주사 알림 받기</Label>
        </div>

        {formData.vaccinationReminders && (
          <div className="space-y-3 pl-6 border-l-2 border-gray-200">
            <div>
              <Label className="text-sm font-medium">알림 채널</Label>
              <div className="flex gap-2 mt-1">
                {["in_app", "push", "sms", "email"].map((channel) => (
                  <label key={channel} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={formData.vaccinationChannels.includes(channel)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            vaccinationChannels: [...prev.vaccinationChannels, channel]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            vaccinationChannels: prev.vaccinationChannels.filter(c => c !== channel)
                          }));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">
                      {channel === "in_app" ? "앱 내" :
                       channel === "push" ? "푸시" : channel}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">알림 시점 (접종일 기준)</Label>
              <div className="flex gap-2 mt-1">
                {[0, 1, 3, 7, 14, 30].map((days) => (
                  <label key={days} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={formData.vaccinationDaysBefore.includes(days)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            vaccinationDaysBefore: [...prev.vaccinationDaysBefore, days]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            vaccinationDaysBefore: prev.vaccinationDaysBefore.filter(d => d !== days)
                          }));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">
                      {days === 0 ? "당일" : `${days}일 전`}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave} className="flex-1">
          저장하기
        </Button>
        <Button variant="outline" onClick={onClose} className="flex-1">
          취소
        </Button>
      </div>
    </div>
  );
}
