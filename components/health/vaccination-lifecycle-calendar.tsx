/**
 * @file components/health/vaccination-lifecycle-calendar.tsx
 * @description 생애주기별 예방주사 달력 컴포넌트
 *
 * 가족 구성원별 예방주사 일정을 달력 형태로 표시
 */

"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Syringe, Calendar as CalendarIcon, Clock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VaccinationSchedule {
  id: string;
  vaccine_name: string;
  recommended_date: string;
  priority: "required" | "recommended" | "optional";
  status: "pending" | "completed" | "skipped";
  dose_number: number;
  total_doses: number;
  family_member_name: string;
}

interface VaccinationLifecycleCalendarProps {
  userId: string;
  familyMembers: Array<{ id: string; name: string }>;
}

export function VaccinationLifecycleCalendar({
  userId,
  familyMembers,
}: VaccinationLifecycleCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [schedules, setSchedules] = useState<VaccinationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<VaccinationSchedule | null>(null);
  const { toast } = useToast();

  // 예방주사 일정 조회
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedMember !== "all") {
        params.append("family_member_id", selectedMember);
      }

      const response = await fetch(`/api/health/kcdc-premium/vaccinations/schedules?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setSchedules(data.data || []);
      } else {
        console.error("예방주사 일정 조회 실패:", data.message);
      }
    } catch (error) {
      console.error("예방주사 일정 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [selectedMember]);

  // 날짜별 예방주사 일정 필터링
  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(schedule => schedule.recommended_date === dateStr);
  };

  // 달력에 표시할 날짜 스타일링
  const getDateClassName = (date: Date) => {
    const schedulesForDate = getSchedulesForDate(date);
    if (schedulesForDate.length === 0) return "";

    const hasRequired = schedulesForDate.some(s => s.priority === "required");
    const hasRecommended = schedulesForDate.some(s => s.priority === "recommended");

    let className = "font-semibold ";

    if (hasRequired) {
      className += "bg-red-100 text-red-800 hover:bg-red-200";
    } else if (hasRecommended) {
      className += "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    } else {
      className += "bg-blue-100 text-blue-800 hover:bg-blue-200";
    }

    return className;
  };

  // 우선순위별 배지 색상
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "required":
        return "bg-red-100 text-red-800 border-red-200";
      case "recommended":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "optional":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // 상태별 아이콘
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "✅";
      case "skipped":
        return "⏭️";
      default:
        return "⏰";
    }
  };

  // 일정 완료 처리
  const handleCompleteSchedule = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/health/kcdc-premium/vaccinations/schedules/${scheduleId}/complete`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "접종 완료",
          description: "예방주사 접종이 완료로 표시되었습니다.",
        });
        fetchSchedules(); // 일정 새로고침
        setSelectedSchedule(null);
      } else {
        throw new Error("접종 완료 처리 실패");
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "접종 완료 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">예방주사 일정 달력</h2>
          <p className="text-gray-600">가족 구성원별 예방주사 일정을 확인하세요</p>
        </div>

        <div className="flex gap-2">
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="구성원 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 구성원</SelectItem>
              {familyMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 달력 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                예방주사 일정
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  hasVaccinations: (date) => getSchedulesForDate(date).length > 0,
                }}
                classNames={{
                  day: (date: Date) => {
                    const schedulesForDate = getSchedulesForDate(date);
                    if (schedulesForDate.length === 0) return "";
                    return getDateClassName(date);
                  },
                } as any}
              />

              {/* 범례 */}
              <div className="flex flex-wrap gap-2 mt-4">
                <div className="flex items-center gap-1 text-sm">
                  <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                  <span>필수 접종</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
                  <span>권장 접종</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                  <span>선택 접종</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 선택된 날짜의 일정 목록 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {selectedDate ? selectedDate.toLocaleDateString('ko-KR') : '선택된 날짜'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <div className="space-y-3">
                  {getSchedulesForDate(selectedDate).map((schedule) => (
                    <Dialog key={schedule.id}>
                      <DialogTrigger asChild>
                        <div
                          className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setSelectedSchedule(schedule)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Syringe className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-sm">{schedule.vaccine_name}</span>
                                <Badge className={`text-xs ${getPriorityColor(schedule.priority)}`}>
                                  {schedule.priority === "required" ? "필수" :
                                   schedule.priority === "recommended" ? "권장" : "선택"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <User className="w-3 h-3" />
                                <span>{schedule.family_member_name}</span>
                                <span>•</span>
                                <span>{schedule.dose_number}차 / {schedule.total_doses}차</span>
                              </div>
                            </div>
                            <span className="text-sm">{getStatusIcon(schedule.status)}</span>
                          </div>
                        </div>
                      </DialogTrigger>

                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Syringe className="w-5 h-5" />
                            {schedule.vaccine_name} 예방접종
                          </DialogTitle>
                        </DialogHeader>

                        {selectedSchedule && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-700">대상자</label>
                                <p className="text-sm text-gray-900">{schedule.family_member_name}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">접종 일정</label>
                                <p className="text-sm text-gray-900">
                                  {schedule.dose_number}차 / {schedule.total_doses}차
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">우선순위</label>
                                <Badge className={getPriorityColor(schedule.priority)}>
                                  {schedule.priority === "required" ? "필수" :
                                   schedule.priority === "recommended" ? "권장" : "선택"}
                                </Badge>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700">상태</label>
                                <p className="text-sm text-gray-900">
                                  {schedule.status === "pending" ? "예정" :
                                   schedule.status === "completed" ? "완료" : "건너뜀"}
                                </p>
                              </div>
                            </div>

                            {schedule.status === "pending" && (
                              <div className="flex gap-2 pt-4 border-t">
                                <Button
                                  onClick={() => handleCompleteSchedule(schedule.id)}
                                  className="flex-1"
                                >
                                  접종 완료
                                </Button>
                                <Button variant="outline" className="flex-1">
                                  일정 변경
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  ))}

                  {getSchedulesForDate(selectedDate).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>선택된 날짜에 예방주사 일정이 없습니다.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>달력에서 날짜를 선택하세요.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 생애주기별 예방주사 일정 생성 버튼 */}
      <Card>
        <CardHeader>
          <CardTitle>생애주기별 예방주사 일정 생성</CardTitle>
          <p className="text-sm text-gray-600">
            가족 구성원의 나이에 맞는 예방주사 일정을 자동으로 생성합니다.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                try {
                  const response = await fetch("/api/health/lifecycle-vaccinations/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      family_member_id: selectedMember !== "all" ? selectedMember : familyMembers[0]?.id,
                      initialize_master_data: true,
                    }),
                  });

                  if (response.ok) {
                    toast({
                      title: "일정 생성 완료",
                      description: "생애주기별 예방주사 일정이 생성되었습니다.",
                    });
                    fetchSchedules();
                  } else {
                    throw new Error("일정 생성 실패");
                  }
                } catch (error) {
                  toast({
                    title: "오류",
                    description: "일정 생성 중 오류가 발생했습니다.",
                    variant: "destructive",
                  });
                }
              }}
              disabled={selectedMember === "all" && familyMembers.length === 0}
            >
              생애주기별 일정 생성
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

