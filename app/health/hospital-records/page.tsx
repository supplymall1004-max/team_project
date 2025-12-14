/**
 * @file app/health/hospital-records/page.tsx
 * @description 병원 방문 기록 관리 페이지
 *
 * 이 페이지는 사용자의 병원 방문 기록을 조회하고 관리할 수 있는
 * 인터페이스를 제공합니다.
 *
 * 주요 기능:
 * 1. 병원 방문 기록 목록 표시
 * 2. 기록 상세 정보 조회
 * 3. 새로운 기록 수동 추가
 * 4. 기록 수정 및 삭제
 * 5. 가족 구성원별 필터링
 *
 * @dependencies
 * - @supabase/supabase-js: Supabase 클라이언트
 * - @tanstack/react-query: 데이터 페칭 및 캐싱
 * - react-hook-form: 폼 관리
 * - lucide-react: 아이콘
 *
 * @see {@link types/health-data-integration.ts} - 관련 타입 정의
 * @see {@link lib/health/hospital-records-sync.ts} - 병원 기록 동기화 서비스
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Calendar, Building, FileText, User, Edit, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { HospitalRecord } from "@/types/health-data-integration";
import type { FamilyMember } from "@/types/family";
import type { UserHealthProfile } from "@/types/health";

export default function HospitalRecordsPage() {
  console.log("[HospitalRecordsPage] 페이지 렌더링 시작");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HospitalRecord | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const supabase = useClerkSupabaseClient();

  // 가족 구성원 목록 조회
  const { data: familyMembers } = useQuery({
    queryKey: ["family-members"],
    queryFn: async (): Promise<FamilyMember[]> => {
      console.log("[HospitalRecordsPage] 가족 구성원 목록 조회");

      const { data, error } = await supabase
        .from("family_members")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[HospitalRecordsPage] 가족 구성원 조회 에러:", error);
        throw error;
      }

      console.log("[HospitalRecordsPage] 가족 구성원 조회 성공:", data?.length || 0, "명");
      return data || [];
    },
  });

  // 병원 방문 기록 목록 조회
  const {
    data: hospitalRecords,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["hospital-records", selectedFamilyMemberId],
    queryFn: async (): Promise<HospitalRecord[]> => {
      console.log("[HospitalRecordsPage] 병원 기록 목록 조회, 가족 구성원:", selectedFamilyMemberId);

      let query = supabase
        .from("hospital_records")
        .select(`
          *,
          family_members (
            id,
            name,
            relationship
          )
        `)
        .order("visit_date", { ascending: false });

      if (selectedFamilyMemberId !== "all") {
        query = query.eq("family_member_id", selectedFamilyMemberId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[HospitalRecordsPage] 병원 기록 조회 에러:", error);
        throw error;
      }

      console.log("[HospitalRecordsPage] 병원 기록 조회 성공:", data?.length || 0, "건");
      return data || [];
    },
  });

  // 병원 기록 추가 뮤테이션
  const addRecordMutation = useMutation({
    mutationFn: async (recordData: Partial<HospitalRecord>) => {
      console.log("[HospitalRecordsPage] 병원 기록 추가:", recordData);

      const { data, error } = await supabase
        .from("hospital_records")
        .insert({
          visit_date: recordData.visit_date,
          hospital_name: recordData.hospital_name,
          department: recordData.department,
          diagnosis: recordData.diagnosis || [],
          diagnosis_codes: recordData.diagnosis_codes || [],
          prescribed_medications: recordData.prescribed_medications || [],
          treatment_summary: recordData.treatment_summary,
          family_member_id: recordData.family_member_id || null,
          is_auto_synced: false,
          notes: recordData.notes,
        })
        .select()
        .single();

      if (error) {
        console.error("[HospitalRecordsPage] 병원 기록 추가 에러:", error);
        throw error;
      }

      console.log("[HospitalRecordsPage] 병원 기록 추가 성공:", data);
      return data;
    },
    onSuccess: () => {
      console.log("[HospitalRecordsPage] 병원 기록 추가 성공 처리");

      toast({
        title: "기록 추가 완료",
        description: "병원 방문 기록이 성공적으로 추가되었습니다.",
      });

      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["hospital-records"] });
    },
    onError: (error) => {
      console.error("[HospitalRecordsPage] 병원 기록 추가 실패:", error);

      toast({
        title: "추가 실패",
        description: "병원 방문 기록 추가에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  // 기록 추가 핸들러
  const handleAddRecord = (formData: any) => {
    console.log("[HospitalRecordsPage] 기록 추가 요청:", formData);

    const recordData: Partial<HospitalRecord> = {
      visit_date: formData.visitDate,
      hospital_name: formData.hospitalName,
      department: formData.department,
      diagnosis: formData.diagnosis ? formData.diagnosis.split(',').map((d: string) => d.trim()) : [],
      diagnosis_codes: formData.diagnosisCodes ? formData.diagnosisCodes.split(',').map((d: string) => d.trim()) : [],
      prescribed_medications: formData.prescribedMedications ? JSON.parse(formData.prescribedMedications) : [],
      treatment_summary: formData.treatmentSummary,
      family_member_id: formData.familyMemberId === "none" ? null : formData.familyMemberId,
      notes: formData.notes,
    };

    addRecordMutation.mutate(recordData);
  };

  // 기록 삭제 핸들러
  const handleDeleteRecord = async (recordId: string) => {
    console.log("[HospitalRecordsPage] 기록 삭제 요청:", recordId);

    const { error } = await supabase
      .from("hospital_records")
      .delete()
      .eq("id", recordId);

    if (error) {
      console.error("[HospitalRecordsPage] 기록 삭제 에러:", error);
      toast({
        title: "삭제 실패",
        description: "병원 방문 기록 삭제에 실패했습니다.",
        variant: "destructive",
      });
      return;
    }

    console.log("[HospitalRecordsPage] 기록 삭제 성공:", recordId);
    toast({
      title: "삭제 완료",
      description: "병원 방문 기록이 삭제되었습니다.",
    });

    queryClient.invalidateQueries({ queryKey: ["hospital-records"] });
  };

  // 기록 상세 보기 핸들러
  const handleViewRecord = (record: HospitalRecord) => {
    console.log("[HospitalRecordsPage] 기록 상세 보기:", record.id);
    setSelectedRecord(record);
    setIsViewDialogOpen(true);
  };

  if (isLoading) {
    console.log("[HospitalRecordsPage] 로딩 중");
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    console.error("[HospitalRecordsPage] 에러 발생:", error);
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            병원 방문 기록을 불러오는 중 오류가 발생했습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  console.log("[HospitalRecordsPage] 렌더링 완료, 기록 수:", hospitalRecords?.length || 0);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">병원 방문 기록</h1>
          <p className="text-muted-foreground mt-2">
            병원 방문 기록을 조회하고 관리하세요
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
                새 기록 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>병원 방문 기록 추가</DialogTitle>
                <DialogDescription>
                  새로운 병원 방문 기록을 추가하세요
                </DialogDescription>
              </DialogHeader>

              <HospitalRecordForm
                familyMembers={familyMembers || []}
                onSubmit={handleAddRecord}
                isSubmitting={addRecordMutation.isPending}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {hospitalRecords?.length === 0 ? (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">병원 방문 기록이 없습니다</h3>
          <p className="text-muted-foreground mb-4">
            첫 번째 병원 방문 기록을 추가해보세요
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            기록 추가하기
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {hospitalRecords?.map((record) => (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{record.hospital_name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(record.visit_date).toLocaleDateString('ko-KR')}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewRecord(record)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      상세
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">진료과</Label>
                    <p className="text-sm text-muted-foreground">{record.department || "정보 없음"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">진단명</Label>
                    <p className="text-sm text-muted-foreground">
                      {record.diagnosis.length > 0 ? record.diagnosis.join(", ") : "정보 없음"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">치료 요약</Label>
                    <p className="text-sm text-muted-foreground">
                      {record.treatment_summary || "정보 없음"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 기록 상세 보기 다이얼로그 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>병원 방문 기록 상세</DialogTitle>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>병원명</Label>
                  <p className="font-medium">{selectedRecord.hospital_name}</p>
                </div>
                <div>
                  <Label>방문일</Label>
                  <p className="font-medium">{new Date(selectedRecord.visit_date).toLocaleDateString('ko-KR')}</p>
                </div>
                <div>
                  <Label>진료과</Label>
                  <p className="font-medium">{selectedRecord.department || "정보 없음"}</p>
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

              <div>
                <Label>진단명</Label>
                <div className="mt-1">
                  {selectedRecord.diagnosis.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.diagnosis.map((diagnosis, index) => (
                        <Badge key={index} variant="outline">{diagnosis}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">정보 없음</p>
                  )}
                </div>
              </div>

              <div>
                <Label>처방 약물</Label>
                <div className="mt-1">
                  {selectedRecord.prescribed_medications.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>약물명</TableHead>
                          <TableHead>용법</TableHead>
                          <TableHead>기간</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRecord.prescribed_medications.map((medication: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{medication.name || "정보 없음"}</TableCell>
                            <TableCell>{medication.dosage || "정보 없음"}</TableCell>
                            <TableCell>{medication.duration || "정보 없음"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground">처방 약물 정보 없음</p>
                  )}
                </div>
              </div>

              <div>
                <Label>치료 요약</Label>
                <p className="mt-1 text-muted-foreground">
                  {selectedRecord.treatment_summary || "정보 없음"}
                </p>
              </div>

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
}

// 병원 기록 추가 폼 컴포넌트
interface HospitalRecordFormProps {
  familyMembers: FamilyMember[];
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

function HospitalRecordForm({ familyMembers, onSubmit, isSubmitting, onCancel }: HospitalRecordFormProps) {
  const [formData, setFormData] = useState({
    visitDate: "",
    hospitalName: "",
    department: "",
    diagnosis: "",
    diagnosisCodes: "",
    prescribedMedications: "[]",
    treatmentSummary: "",
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
          <Label htmlFor="visitDate">방문일 *</Label>
          <Input
            id="visitDate"
            type="date"
            value={formData.visitDate}
            onChange={(e) => handleChange("visitDate", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="familyMemberId">가족 구성원</Label>
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hospitalName">병원명 *</Label>
          <Input
            id="hospitalName"
            placeholder="예: 서울대학교병원"
            value={formData.hospitalName}
            onChange={(e) => handleChange("hospitalName", e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="department">진료과</Label>
          <Input
            id="department"
            placeholder="예: 내과"
            value={formData.department}
            onChange={(e) => handleChange("department", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="diagnosis">진단명</Label>
        <Input
          id="diagnosis"
          placeholder="쉼표로 구분하여 입력 (예: 고혈압, 당뇨)"
          value={formData.diagnosis}
          onChange={(e) => handleChange("diagnosis", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="treatmentSummary">치료 요약</Label>
        <Textarea
          id="treatmentSummary"
          placeholder="진료 내용 요약"
          value={formData.treatmentSummary}
          onChange={(e) => handleChange("treatmentSummary", e.target.value)}
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
