/**
 * @file app/health/medication-records/page.tsx
 * @description 약물 복용 기록 관리 페이지
 *
 * 이 페이지는 사용자의 약물 복용 기록을 조회하고 관리할 수 있는
 * 인터페이스를 제공합니다.
 *
 * 주요 기능:
 * 1. 약물 복용 기록 목록 표시
 * 2. 복용 알림 설정 및 관리
 * 3. 새로운 약물 기록 수동 추가
 * 4. 기록 수정 및 삭제
 * 5. 복용 현황 대시보드
 *
 * @dependencies
 * - @supabase/supabase-js: Supabase 클라이언트
 * - @tanstack/react-query: 데이터 페칭 및 캐싱
 * - react-hook-form: 폼 관리
 * - lucide-react: 아이콘
 *
 * @see {@link types/health-data-integration.ts} - 관련 타입 정의
 * @see {@link lib/health/medication-records-sync.ts} - 약물 기록 동기화 서비스
 */

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Pill, Clock, Calendar, Bell, BellOff, Edit, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { MedicationRecord, FamilyMember } from "@/types/health-data-integration";

export default function MedicationRecordsPage() {
  console.log("[MedicationRecordsPage] 페이지 렌더링 시작");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supabase = useClerkSupabaseClient();

  // 가족 구성원 목록 조회
  const { data: familyMembers } = useQuery({
    queryKey: ["family-members"],
    queryFn: async (): Promise<FamilyMember[]> => {
      console.log("[MedicationRecordsPage] 가족 구성원 목록 조회");

      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[MedicationRecordsPage] 가족 구성원 조회 에러:", error);
        throw error;
      }

      console.log("[MedicationRecordsPage] 가족 구성원 조회 성공:", data?.length || 0, "명");
      return data || [];
    },
  });

  // 약물 복용 기록 목록 조회
  const {
    data: medicationRecords,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["medication-records", selectedFamilyMemberId],
    queryFn: async (): Promise<MedicationRecord[]> => {
      console.log("[MedicationRecordsPage] 약물 기록 목록 조회, 가족 구성원:", selectedFamilyMemberId);

      let query = supabase
        .from("medication_records")
        .select(`
          *,
          family_members (
            id,
            name,
            relationship
          )
        `)
        .order("start_date", { ascending: false });

      if (selectedFamilyMemberId !== "all") {
        query = query.eq("family_member_id", selectedFamilyMemberId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[MedicationRecordsPage] 약물 기록 조회 에러:", error);
        throw error;
      }

      console.log("[MedicationRecordsPage] 약물 기록 조회 성공:", data?.length || 0, "건");
      return data || [];
    },
  });

  // 약물 기록 추가 뮤테이션
  const addRecordMutation = useMutation({
    mutationFn: async (recordData: Partial<MedicationRecord>) => {
      console.log("[MedicationRecordsPage] 약물 기록 추가:", recordData);

      const { data, error } = await supabase
        .from("medication_records")
        .insert({
          medication_name: recordData.medication_name,
          medication_code: recordData.medication_code,
          active_ingredient: recordData.active_ingredient,
          dosage: recordData.dosage,
          frequency: recordData.frequency,
          start_date: recordData.start_date,
          end_date: recordData.end_date,
          reminder_times: recordData.reminder_times || [],
          reminder_enabled: recordData.reminder_enabled || true,
          family_member_id: recordData.family_member_id || null,
          is_auto_synced: false,
          notes: recordData.notes,
        })
        .select()
        .single();

      if (error) {
        console.error("[MedicationRecordsPage] 약물 기록 추가 에러:", error);
        throw error;
      }

      console.log("[MedicationRecordsPage] 약물 기록 추가 성공:", data);
      return data;
    },
    onSuccess: () => {
      console.log("[MedicationRecordsPage] 약물 기록 추가 성공 처리");

      toast({
        title: "기록 추가 완료",
        description: "약물 복용 기록이 성공적으로 추가되었습니다.",
      });

      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["medication-records"] });
    },
    onError: (error) => {
      console.error("[MedicationRecordsPage] 약물 기록 추가 실패:", error);

      toast({
        title: "추가 실패",
        description: "약물 복용 기록 추가에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  // 알림 설정 토글 뮤테이션
  const toggleReminderMutation = useMutation({
    mutationFn: async ({ recordId, enabled }: { recordId: string; enabled: boolean }) => {
      console.log("[MedicationRecordsPage] 알림 설정 토글:", recordId, enabled);

      const { error } = await supabase
        .from("medication_records")
        .update({ reminder_enabled: enabled })
        .eq("id", recordId);

      if (error) {
        console.error("[MedicationRecordsPage] 알림 설정 토글 에러:", error);
        throw error;
      }

      console.log("[MedicationRecordsPage] 알림 설정 토글 성공:", recordId, enabled);
    },
    onSuccess: () => {
      console.log("[MedicationRecordsPage] 알림 설정 토글 성공 처리");

      queryClient.invalidateQueries({ queryKey: ["medication-records"] });
    },
    onError: (error) => {
      console.error("[MedicationRecordsPage] 알림 설정 토글 실패:", error);

      toast({
        title: "설정 변경 실패",
        description: "알림 설정 변경에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 기록 삭제 핸들러
  const handleDeleteRecord = async (recordId: string) => {
    console.log("[MedicationRecordsPage] 기록 삭제 요청:", recordId);

    const { error } = await supabase
      .from("medication_records")
      .delete()
      .eq("id", recordId);

    if (error) {
      console.error("[MedicationRecordsPage] 기록 삭제 에러:", error);
      toast({
        title: "삭제 실패",
        description: "약물 복용 기록 삭제에 실패했습니다.",
        variant: "destructive",
      });
      return;
    }

    console.log("[MedicationRecordsPage] 기록 삭제 성공:", recordId);
    toast({
      title: "삭제 완료",
      description: "약물 복용 기록이 삭제되었습니다.",
    });

    queryClient.invalidateQueries({ queryKey: ["medication-records"] });
  };

  // 기록 추가 핸들러
  const handleAddRecord = (formData: any) => {
    console.log("[MedicationRecordsPage] 기록 추가 요청:", formData);

    const recordData: Partial<MedicationRecord> = {
      medication_name: formData.medicationName,
      medication_code: formData.medicationCode,
      active_ingredient: formData.activeIngredient,
      dosage: formData.dosage,
      frequency: formData.frequency,
      start_date: formData.startDate,
      end_date: formData.endDate || null,
      reminder_times: formData.reminderTimes ? formData.reminderTimes.split(',').map((t: string) => t.trim()) : [],
      reminder_enabled: formData.reminderEnabled,
      family_member_id: formData.familyMemberId === "none" ? null : formData.familyMemberId,
      notes: formData.notes,
    };

    addRecordMutation.mutate(recordData);
  };

  // 알림 토글 핸들러
  const handleToggleReminder = (recordId: string, enabled: boolean) => {
    console.log("[MedicationRecordsPage] 알림 토글 요청:", recordId, enabled);
    toggleReminderMutation.mutate({ recordId, enabled });
  };

  // 복용 진행률 계산
  const getProgressPercentage = (record: MedicationRecord) => {
    const today = new Date();
    const startDate = new Date(record.start_date);
    const endDate = record.end_date ? new Date(record.end_date) : null;

    if (endDate && today > endDate) return 100;
    if (today < startDate) return 0;

    if (!endDate) return 50; // 종료일이 없으면 50%로 표시

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);
  };

  // 복용 상태 계산
  const getMedicationStatus = (record: MedicationRecord) => {
    const today = new Date();
    const startDate = new Date(record.start_date);
    const endDate = record.end_date ? new Date(record.end_date) : null;

    if (today < startDate) return { status: "scheduled", label: "예정", variant: "secondary" as const };
    if (!endDate) return { status: "ongoing", label: "복용 중", variant: "default" as const };
    if (today <= endDate) return { status: "ongoing", label: "복용 중", variant: "default" as const };
    return { status: "completed", label: "완료", variant: "outline" as const };
  };

  // 현재 복용 중인 약물 필터링
  const activeMedications = medicationRecords?.filter(record => {
    const status = getMedicationStatus(record);
    return status.status === "ongoing";
  }) || [];

  if (isLoading) {
    console.log("[MedicationRecordsPage] 로딩 중");
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    console.error("[MedicationRecordsPage] 에러 발생:", error);
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            약물 복용 기록을 불러오는 중 오류가 발생했습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  console.log("[MedicationRecordsPage] 렌더링 완료, 기록 수:", medicationRecords?.length || 0);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">약물 복용 관리</h1>
          <p className="text-muted-foreground mt-2">
            약물 복용 기록과 알림을 관리하세요
          </p>
        </div>

        <div className="flex gap-4">
          <Select value={selectedFamilyMemberId} onValueChange={setSelectedFamilyMemberId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="가족 구성원 선택" />
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

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                새 약물 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>약물 복용 기록 추가</DialogTitle>
                <DialogDescription>
                  새로운 약물 복용 기록을 추가하세요
                </DialogDescription>
              </DialogHeader>

              <MedicationRecordForm
                familyMembers={familyMembers || []}
                onSubmit={handleAddRecord}
                isSubmitting={addRecordMutation.isPending}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">
            복용 중 ({activeMedications.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            전체 기록 ({medicationRecords?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeMedications.length === 0 ? (
            <div className="text-center py-12">
              <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">현재 복용 중인 약물이 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                복용 중인 약물을 추가하여 알림을 설정해보세요
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                약물 추가하기
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeMedications.map((record) => {
                const progress = getProgressPercentage(record);
                const status = getMedicationStatus(record);
                const isNearEnd = record.end_date && progress > 80;

                return (
                  <Card key={record.id} className={isNearEnd ? "border-orange-200" : ""}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Pill className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <CardTitle className="text-lg">{record.medication_name}</CardTitle>
                            <CardDescription>
                              {record.active_ingredient && `${record.active_ingredient} • `}
                              {record.dosage}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-muted-foreground">복용 시작일</Label>
                          <p className="font-medium">{new Date(record.start_date).toLocaleDateString('ko-KR')}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">복용 종료일</Label>
                          <p className="font-medium">
                            {record.end_date ? new Date(record.end_date).toLocaleDateString('ko-KR') : "지속"}
                          </p>
                        </div>
                      </div>

                      {record.end_date && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>복용 진행률</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      )}

                      <div>
                        <Label className="text-muted-foreground">복용 빈도</Label>
                        <p className="font-medium">{record.frequency}</p>
                      </div>

                      {record.reminder_times.length > 0 && (
                        <div>
                          <Label className="text-muted-foreground">알림 시간</Label>
                          <div className="flex items-center gap-2 mt-1">
                            {record.reminder_enabled ? (
                              <Bell className="h-4 w-4 text-green-600" />
                            ) : (
                              <BellOff className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm">
                              {record.reminder_times.join(", ")}
                            </span>
                          </div>
                        </div>
                      )}

                      {record.family_members && (
                        <div>
                          <Label className="text-muted-foreground">복용자</Label>
                          <p className="font-medium">
                            {(record.family_members as any).name} ({(record.family_members as any).relationship})
                          </p>
                        </div>
                      )}

                      {isNearEnd && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            약물 복용이 곧 종료됩니다. 담당 의사와 상담하세요.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleReminder(record.id, !record.reminder_enabled)}
                          disabled={toggleReminderMutation.isPending}
                        >
                          {record.reminder_enabled ? (
                            <BellOff className="h-4 w-4 mr-1" />
                          ) : (
                            <Bell className="h-4 w-4 mr-1" />
                          )}
                          {record.reminder_enabled ? "알림 끄기" : "알림 켜기"}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRecord(record.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          삭제
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {medicationRecords?.length === 0 ? (
            <div className="text-center py-12">
              <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">약물 복용 기록이 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                첫 번째 약물 복용 기록을 추가해보세요
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                기록 추가하기
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {medicationRecords?.map((record) => {
                const progress = getProgressPercentage(record);
                const status = getMedicationStatus(record);

                return (
                  <Card key={record.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Pill className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <CardTitle className="text-lg">{record.medication_name}</CardTitle>
                            <CardDescription>
                              {record.active_ingredient && `${record.active_ingredient} • `}
                              {record.dosage} • {record.frequency}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {record.is_auto_synced && (
                            <Badge variant="secondary">자동 연동</Badge>
                          )}
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <Label className="text-muted-foreground">시작일</Label>
                          <p className="font-medium">{new Date(record.start_date).toLocaleDateString('ko-KR')}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">종료일</Label>
                          <p className="font-medium">
                            {record.end_date ? new Date(record.end_date).toLocaleDateString('ko-KR') : "지속"}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">알림</Label>
                          <div className="flex items-center gap-1">
                            {record.reminder_enabled ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <BellOff className="h-4 w-4 text-gray-400" />
                            )}
                            <span>{record.reminder_enabled ? "켜짐" : "꺼짐"}</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">복용자</Label>
                          <p className="font-medium">
                            {record.family_members
                              ? `${(record.family_members as any).name}`
                              : "본인"}
                          </p>
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
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 약물 기록 추가 폼 컴포넌트
interface MedicationRecordFormProps {
  familyMembers: FamilyMember[];
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

function MedicationRecordForm({ familyMembers, onSubmit, isSubmitting, onCancel }: MedicationRecordFormProps) {
  const [formData, setFormData] = useState({
    medicationName: "",
    medicationCode: "",
    activeIngredient: "",
    dosage: "",
    frequency: "",
    startDate: "",
    endDate: "",
    reminderTimes: "",
    reminderEnabled: true,
    familyMemberId: "none",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="medicationName">약물명 *</Label>
          <Input
            id="medicationName"
            placeholder="예: 타이레놀"
            value={formData.medicationName}
            onChange={(e) => handleChange("medicationName", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="activeIngredient">주성분</Label>
          <Input
            id="activeIngredient"
            placeholder="예: 아세트아미노펜"
            value={formData.activeIngredient}
            onChange={(e) => handleChange("activeIngredient", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dosage">용법 *</Label>
          <Input
            id="dosage"
            placeholder="예: 1정씩"
            value={formData.dosage}
            onChange={(e) => handleChange("dosage", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="frequency">복용 빈도 *</Label>
          <Input
            id="frequency"
            placeholder="예: 1일 3회"
            value={formData.frequency}
            onChange={(e) => handleChange("frequency", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">복용 시작일 *</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleChange("startDate", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="endDate">복용 종료일</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => handleChange("endDate", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="reminderTimes">알림 시간</Label>
        <Input
          id="reminderTimes"
          placeholder="쉼표로 구분 (예: 09:00, 15:00, 21:00)"
          value={formData.reminderTimes}
          onChange={(e) => handleChange("reminderTimes", e.target.value)}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="reminderEnabled"
          checked={formData.reminderEnabled}
          onCheckedChange={(checked) => handleChange("reminderEnabled", checked)}
        />
        <Label htmlFor="reminderEnabled">알림 활성화</Label>
      </div>

      <div>
        <Label htmlFor="familyMemberId">복용자</Label>
        <Select value={formData.familyMemberId} onValueChange={(value) => handleChange("familyMemberId", value)}>
          <SelectTrigger>
            <SelectValue placeholder="선택하세요" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">본인</SelectItem>
            {familyMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name} ({member.relationship})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">메모</Label>
        <Textarea
          id="notes"
          placeholder="추가 메모"
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          추가하기
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          취소
        </Button>
      </div>
    </form>
  );
}
