/**
 * @file app/health/disease-records/page.tsx
 * @description 질병 진단 기록 관리 페이지
 *
 * 이 페이지는 사용자의 질병 진단 기록을 조회하고 관리할 수 있는
 * 인터페이스를 제공합니다.
 *
 * 주요 기능:
 * 1. 질병 진단 기록 목록 표시
 * 2. 질병 상태별 필터링 및 관리
 * 3. 새로운 진단 기록 수동 추가
 * 4. 기록 수정 및 삭제
 * 5. 치료 계획 및 추적
 *
 * @dependencies
 * - @supabase/supabase-js: Supabase 클라이언트
 * - @tanstack/react-query: 데이터 페칭 및 캐싱
 * - react-hook-form: 폼 관리
 * - lucide-react: 아이콘
 *
 * @see {@link types/health-data-integration.ts} - 관련 타입 정의
 * @see {@link lib/health/disease-records-sync.ts} - 질병 기록 동기화 서비스
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Stethoscope, Calendar, AlertTriangle, CheckCircle, Clock, User, Edit, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { DiseaseRecord, DiseaseStatus, DiseaseSeverity } from "@/types/health-data-integration";
import type { FamilyMember } from "@/types/family";

export default function DiseaseRecordsPage() {
  console.log("[DiseaseRecordsPage] 페이지 렌더링 시작");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DiseaseRecord | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<DiseaseStatus | "all">("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supabase = useClerkSupabaseClient();

  // 가족 구성원 목록 조회
  const { data: familyMembers } = useQuery({
    queryKey: ["family-members"],
    queryFn: async (): Promise<FamilyMember[]> => {
      console.log("[DiseaseRecordsPage] 가족 구성원 목록 조회");

      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[DiseaseRecordsPage] 가족 구성원 조회 에러:", error);
        throw error;
      }

      console.log("[DiseaseRecordsPage] 가족 구성원 조회 성공:", data?.length || 0, "명");
      return data || [];
    },
  });

  // 질병 목록 조회 (diseases 테이블)
  const { data: diseases } = useQuery({
    queryKey: ["diseases"],
    queryFn: async () => {
      console.log("[DiseaseRecordsPage] 질병 목록 조회");

      const { data, error } = await supabase
        .from("diseases")
        .select("code, name_kr")
        .order("name_kr");

      if (error) {
        console.error("[DiseaseRecordsPage] 질병 목록 조회 에러:", error);
        throw error;
      }

      console.log("[DiseaseRecordsPage] 질병 목록 조회 성공:", data?.length || 0, "개");
      return data || [];
    },
  });

  // 질병 진단 기록 목록 조회
  const {
    data: diseaseRecords,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["disease-records", selectedFamilyMemberId, selectedStatus],
    queryFn: async (): Promise<DiseaseRecord[]> => {
      console.log("[DiseaseRecordsPage] 질병 기록 목록 조회, 가족 구성원:", selectedFamilyMemberId, "상태:", selectedStatus);

      let query = supabase
        .from("disease_records")
        .select(`
          *,
          family_members (
            id,
            name,
            relationship
          ),
          diseases (
            code,
            name_kr
          )
        `)
        .order("diagnosis_date", { ascending: false });

      if (selectedFamilyMemberId !== "all") {
        query = query.eq("family_member_id", selectedFamilyMemberId);
      }

      if (selectedStatus !== "all") {
        query = query.eq("status", selectedStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[DiseaseRecordsPage] 질병 기록 조회 에러:", error);
        throw error;
      }

      console.log("[DiseaseRecordsPage] 질병 기록 조회 성공:", data?.length || 0, "건");
      return data || [];
    },
  });

  // 질병 기록 추가 뮤테이션
  const addRecordMutation = useMutation({
    mutationFn: async (recordData: Partial<DiseaseRecord>) => {
      console.log("[DiseaseRecordsPage] 질병 기록 추가:", recordData);

      const { data, error } = await supabase
        .from("disease_records")
        .insert({
          disease_name: recordData.disease_name,
          disease_code: recordData.disease_code,
          diagnosis_date: recordData.diagnosis_date,
          hospital_name: recordData.hospital_name,
          status: recordData.status,
          severity: recordData.severity,
          treatment_plan: recordData.treatment_plan,
          family_member_id: recordData.family_member_id || null,
          is_auto_synced: false,
          notes: recordData.notes,
        })
        .select()
        .single();

      if (error) {
        console.error("[DiseaseRecordsPage] 질병 기록 추가 에러:", error);
        throw error;
      }

      console.log("[DiseaseRecordsPage] 질병 기록 추가 성공:", data);
      return data;
    },
    onSuccess: () => {
      console.log("[DiseaseRecordsPage] 질병 기록 추가 성공 처리");

      toast({
        title: "기록 추가 완료",
        description: "질병 진단 기록이 성공적으로 추가되었습니다.",
      });

      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["disease-records"] });
    },
    onError: (error) => {
      console.error("[DiseaseRecordsPage] 질병 기록 추가 실패:", error);

      toast({
        title: "추가 실패",
        description: "질병 진단 기록 추가에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  // 기록 삭제 핸들러
  const handleDeleteRecord = async (recordId: string) => {
    console.log("[DiseaseRecordsPage] 기록 삭제 요청:", recordId);

    const { error } = await supabase
      .from("disease_records")
      .delete()
      .eq("id", recordId);

    if (error) {
      console.error("[DiseaseRecordsPage] 기록 삭제 에러:", error);
      toast({
        title: "삭제 실패",
        description: "질병 진단 기록 삭제에 실패했습니다.",
        variant: "destructive",
      });
      return;
    }

    console.log("[DiseaseRecordsPage] 기록 삭제 성공:", recordId);
    toast({
      title: "삭제 완료",
      description: "질병 진단 기록이 삭제되었습니다.",
    });

    queryClient.invalidateQueries({ queryKey: ["disease-records"] });
  };

  // 기록 추가 핸들러
  const handleAddRecord = (formData: any) => {
    console.log("[DiseaseRecordsPage] 기록 추가 요청:", formData);

    const recordData: Partial<DiseaseRecord> = {
      disease_name: formData.diseaseName,
      disease_code: formData.diseaseCode || null,
      diagnosis_date: formData.diagnosisDate,
      hospital_name: formData.hospitalName,
      status: formData.status,
      severity: formData.severity || null,
      treatment_plan: formData.treatmentPlan,
      family_member_id: formData.familyMemberId === "none" ? null : formData.familyMemberId,
      notes: formData.notes,
    };

    addRecordMutation.mutate(recordData);
  };

  // 기록 상세 보기 핸들러
  const handleViewRecord = (record: DiseaseRecord) => {
    console.log("[DiseaseRecordsPage] 기록 상세 보기:", record.id);
    setSelectedRecord(record);
    setIsViewDialogOpen(true);
  };

  // 상태별 배지 정보
  const getStatusInfo = (status: DiseaseStatus) => {
    switch (status) {
      case "active":
        return { label: "치료 중", variant: "destructive" as const, icon: AlertTriangle };
      case "cured":
        return { label: "완치", variant: "default" as const, icon: CheckCircle };
      case "chronic":
        return { label: "만성", variant: "secondary" as const, icon: Clock };
      case "monitoring":
        return { label: "관찰 중", variant: "outline" as const, icon: Eye };
      default:
        return { label: status, variant: "outline" as const, icon: Stethoscope };
    }
  };

  // 심각도별 정보
  const getSeverityInfo = (severity: DiseaseSeverity | null) => {
    switch (severity) {
      case "mild":
        return { label: "경증", color: "text-green-600" };
      case "moderate":
        return { label: "중등도", color: "text-yellow-600" };
      case "severe":
        return { label: "중증", color: "text-red-600" };
      default:
        return { label: "정보 없음", color: "text-gray-500" };
    }
  };

  // 상태별 필터링된 기록들
  const activeRecords = diseaseRecords?.filter(record => record.status === "active") || [];
  const chronicRecords = diseaseRecords?.filter(record => record.status === "chronic") || [];
  const monitoringRecords = diseaseRecords?.filter(record => record.status === "monitoring") || [];

  if (isLoading) {
    console.log("[DiseaseRecordsPage] 로딩 중");
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    console.error("[DiseaseRecordsPage] 에러 발생:", error);
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            질병 진단 기록을 불러오는 중 오류가 발생했습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  console.log("[DiseaseRecordsPage] 렌더링 완료, 기록 수:", diseaseRecords?.length || 0);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">질병 진단 기록</h1>
          <p className="text-muted-foreground mt-2">
            질병 진단 기록을 조회하고 관리하세요
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

          <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as DiseaseStatus | "all")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="active">치료 중</SelectItem>
              <SelectItem value="chronic">만성</SelectItem>
              <SelectItem value="monitoring">관찰 중</SelectItem>
              <SelectItem value="cured">완치</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                새 기록 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>질병 진단 기록 추가</DialogTitle>
                <DialogDescription>
                  새로운 질병 진단 기록을 추가하세요
                </DialogDescription>
              </DialogHeader>

              <DiseaseRecordForm
                diseases={diseases || []}
                familyMembers={familyMembers || []}
                onSubmit={handleAddRecord}
                isSubmitting={addRecordMutation.isPending}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">전체 ({diseaseRecords?.length || 0})</TabsTrigger>
          <TabsTrigger value="active">치료 중 ({activeRecords.length})</TabsTrigger>
          <TabsTrigger value="chronic">만성 ({chronicRecords.length})</TabsTrigger>
          <TabsTrigger value="monitoring">관찰 중 ({monitoringRecords.length})</TabsTrigger>
          <TabsTrigger value="cured">완치</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {renderDiseaseRecordsList(diseaseRecords || [])}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {renderDiseaseRecordsList(activeRecords)}
        </TabsContent>

        <TabsContent value="chronic" className="space-y-4">
          {renderDiseaseRecordsList(chronicRecords)}
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          {renderDiseaseRecordsList(monitoringRecords)}
        </TabsContent>

        <TabsContent value="cured" className="space-y-4">
          {renderDiseaseRecordsList(diseaseRecords?.filter(r => r.status === "cured") || [])}
        </TabsContent>
      </Tabs>

      {/* 기록 상세 보기 다이얼로그 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>질병 진단 기록 상세</DialogTitle>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>질병명</Label>
                  <p className="font-medium">{selectedRecord.disease_name}</p>
                </div>
                <div>
                  <Label>진단일</Label>
                  <p className="font-medium">{new Date(selectedRecord.diagnosis_date).toLocaleDateString('ko-KR')}</p>
                </div>
                <div>
                  <Label>병원명</Label>
                  <p className="font-medium">{selectedRecord.hospital_name || "정보 없음"}</p>
                </div>
                <div>
                  <Label>가족 구성원</Label>
                  <p className="font-medium">
                    {selectedRecord.family_member_id
                      ? (familyMembers?.find(m => m.id === selectedRecord.family_member_id)?.name || "가족 구성원") + 
                        (familyMembers?.find(m => m.id === selectedRecord.family_member_id)?.relationship 
                          ? ` (${familyMembers.find(m => m.id === selectedRecord.family_member_id)?.relationship})` 
                          : "")
                      : "본인"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>상태</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getStatusInfo(selectedRecord.status).variant}>
                      {getStatusInfo(selectedRecord.status).label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>심각도</Label>
                  <p className={`font-medium ${getSeverityInfo(selectedRecord.severity).color}`}>
                    {getSeverityInfo(selectedRecord.severity).label}
                  </p>
                </div>
              </div>

              {selectedRecord.treatment_plan && (
                <div>
                  <Label>치료 계획</Label>
                  <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                    {selectedRecord.treatment_plan}
                  </p>
                </div>
              )}

              {selectedRecord.notes && (
                <div>
                  <Label>메모</Label>
                  <p className="mt-1 text-muted-foreground">{selectedRecord.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  닫기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  // 질병 기록 목록 렌더링 함수
  function renderDiseaseRecordsList(records: DiseaseRecord[]) {
    if (records.length === 0) {
      return (
        <div className="text-center py-12">
          <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">해당하는 기록이 없습니다</h3>
          <p className="text-muted-foreground mb-4">
            새로운 질병 진단 기록을 추가해보세요
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            기록 추가하기
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {records.map((record) => {
          const statusInfo = getStatusInfo(record.status);
          const severityInfo = getSeverityInfo(record.severity);
          const StatusIcon = statusInfo.icon;

          return (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Stethoscope className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{record.disease_name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        진단일: {new Date(record.diagnosis_date).toLocaleDateString('ko-KR')}
                        {record.hospital_name && (
                          <>
                            <span className="mx-2">•</span>
                            {record.hospital_name}
                          </>
                        )}
                        {record.family_member_id && (
                          <>
                            <User className="h-4 w-4 ml-2" />
                            {familyMembers?.find(m => m.id === record.family_member_id)?.name || "가족 구성원"}
                            {familyMembers?.find(m => m.id === record.family_member_id)?.relationship 
                              ? ` (${familyMembers.find(m => m.id === record.family_member_id)?.relationship})` 
                              : ""}
                          </>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.is_auto_synced && (
                      <Badge variant="secondary">자동 연동</Badge>
                    )}
                    <Badge variant={statusInfo.variant}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">심각도</Label>
                    <p className={`font-medium ${severityInfo.color}`}>{severityInfo.label}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">치료 계획</Label>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {record.treatment_plan || "정보 없음"}
                    </p>
                  </div>
                </div>

                {record.notes && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-muted-foreground">메모</Label>
                    <p className="text-sm text-muted-foreground mt-1">{record.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewRecord(record)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    상세 보기
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
    );
  }
}

// 질병 기록 추가 폼 컴포넌트
interface DiseaseRecordFormProps {
  diseases: Array<{ code: string; name_kr: string }>;
  familyMembers: FamilyMember[];
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

function DiseaseRecordForm({ diseases, familyMembers, onSubmit, isSubmitting, onCancel }: DiseaseRecordFormProps) {
  const [formData, setFormData] = useState({
    diseaseName: "",
    diseaseCode: "",
    diagnosisDate: "",
    hospitalName: "",
    status: "active" as DiseaseStatus,
    severity: "" as DiseaseSeverity | "",
    treatmentPlan: "",
    familyMemberId: "none",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="diseaseName">질병명 *</Label>
          <Input
            id="diseaseName"
            placeholder="예: 고혈압"
            value={formData.diseaseName}
            onChange={(e) => handleChange("diseaseName", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="diseaseCode">질병 코드</Label>
          <Select value={formData.diseaseCode} onValueChange={(value) => handleChange("diseaseCode", value)}>
            <SelectTrigger>
              <SelectValue placeholder="선택하세요 (선택사항)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">선택 안함</SelectItem>
              {diseases.map((disease) => (
                <SelectItem key={disease.code} value={disease.code}>
                  {disease.name_kr} ({disease.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="diagnosisDate">진단일 *</Label>
          <Input
            id="diagnosisDate"
            type="date"
            value={formData.diagnosisDate}
            onChange={(e) => handleChange("diagnosisDate", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="hospitalName">병원명</Label>
          <Input
            id="hospitalName"
            placeholder="진단받은 병원"
            value={formData.hospitalName}
            onChange={(e) => handleChange("hospitalName", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">상태 *</Label>
          <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
            <SelectTrigger>
              <SelectValue placeholder="선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">치료 중</SelectItem>
              <SelectItem value="chronic">만성</SelectItem>
              <SelectItem value="monitoring">관찰 중</SelectItem>
              <SelectItem value="cured">완치</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="severity">심각도</Label>
          <Select value={formData.severity} onValueChange={(value) => handleChange("severity", value)}>
            <SelectTrigger>
              <SelectValue placeholder="선택하세요 (선택사항)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">선택 안함</SelectItem>
              <SelectItem value="mild">경증</SelectItem>
              <SelectItem value="moderate">중등도</SelectItem>
              <SelectItem value="severe">중증</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="familyMemberId">진단받은 사람</Label>
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
        <Label htmlFor="treatmentPlan">치료 계획</Label>
        <Textarea
          id="treatmentPlan"
          placeholder="치료 방법, 약물, 생활 습관 등"
          value={formData.treatmentPlan}
          onChange={(e) => handleChange("treatmentPlan", e.target.value)}
          rows={3}
        />
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
