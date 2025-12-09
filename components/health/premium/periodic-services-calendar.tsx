/**
 * @file components/health/premium/periodic-services-calendar.tsx
 * @description 주기적 건강 관리 서비스 통합 캘린더 컴포넌트
 * 
 * 월별/주별/일별 뷰를 지원하며, 서비스 타입별 색상 구분을 제공합니다.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { PeriodicServiceType } from "@/types/kcdc";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface ScheduleItem {
  date: string;
  serviceName: string;
  serviceType: string;
  serviceId?: string;
  daysUntil: number;
  isOverdue: boolean;
}

interface PeriodicServicesCalendarProps {
  schedule?: Record<string, ScheduleItem[]>;
  onServiceClick?: (service: ScheduleItem) => void;
  className?: string;
}

const SERVICE_TYPE_COLORS: Record<string, string> = {
  vaccination: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200",
  checkup: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200",
  deworming: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200",
  disease_management: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200",
  other: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900 dark:text-gray-200",
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  vaccination: "예방접종",
  checkup: "건강검진",
  deworming: "구충제",
  disease_management: "질병관리",
  other: "기타",
};

export function PeriodicServicesCalendar({
  schedule: initialSchedule,
  onServiceClick,
  className,
}: PeriodicServicesCalendarProps) {
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<ScheduleItem[]>([]);
  const [schedule, setSchedule] = useState<Record<string, ScheduleItem[]>>(initialSchedule || {});
  const [isLoading, setIsLoading] = useState(false);

  // 일정 데이터 로드
  useEffect(() => {
    async function loadSchedule() {
      try {
        setIsLoading(true);
        console.log("[PeriodicServicesCalendar] 일정 로드 시작");
        const response = await fetch("/api/health/kcdc-premium/periodic-services/schedule");
        if (!response.ok) {
          const errorText = await response.text();
          console.error("[PeriodicServicesCalendar] API 오류:", response.status, errorText);
          throw new Error(`일정 조회 실패: ${response.status}`);
        }
        const result = await response.json();
        console.log("[PeriodicServicesCalendar] API 응답:", result);
        if (result.success && result.data?.schedule) {
          console.log("[PeriodicServicesCalendar] 일정 데이터 설정:", Object.keys(result.data.schedule).length, "개 날짜");
          setSchedule(result.data.schedule);
        } else {
          console.warn("[PeriodicServicesCalendar] 일정 데이터 없음, 빈 객체 설정");
          setSchedule({});
        }
      } catch (error) {
        console.error("[PeriodicServicesCalendar] 일정 로드 실패:", error);
        setSchedule({}); // 오류 시 빈 객체 설정
      } finally {
        setIsLoading(false);
      }
    }

    if (!initialSchedule || Object.keys(initialSchedule).length === 0) {
      loadSchedule();
    } else {
      console.log("[PeriodicServicesCalendar] 초기 일정 사용:", Object.keys(initialSchedule).length, "개 날짜");
      setSchedule(initialSchedule);
      setIsLoading(false);
    }
  }, [initialSchedule]);

  // 선택된 날짜의 서비스 목록
  useEffect(() => {
    if (selectedDate && schedule[selectedDate]) {
      setSelectedServices(schedule[selectedDate]);
    } else {
      setSelectedServices([]);
    }
  }, [selectedDate, schedule]);

  // 월별 뷰: 현재 월의 날짜 배열 생성
  const getMonthDates = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // 주의 시작일 (일요일)

    const dates: Date[] = [];
    const current = new Date(startDate);
    while (current <= lastDay || dates.length < 42) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
      if (dates.length >= 42) break; // 6주치
    }
    return dates;
  };

  // 주별 뷰: 현재 주의 날짜 배열 생성
  const getWeekDates = () => {
    const startDate = new Date(currentDate);
    startDate.setDate(startDate.getDate() - currentDate.getDay()); // 주의 시작일 (일요일)

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return date;
    });
  };

  // 날짜 포맷팅 (로컬 시간대 기준)
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 날짜가 오늘인지 확인
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // 날짜가 현재 월인지 확인
  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date);
    setSelectedDate(dateStr);
  };

  // 이전/다음 이동
  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  // 오늘로 이동
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>주기적 건강 관리 일정</CardTitle>
            <CardDescription>
              예방접종, 건강검진, 구충제 등 주기적 서비스를 한눈에 확인하세요
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            오늘
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="month">월별</TabsTrigger>
            <TabsTrigger value="week">주별</TabsTrigger>
            <TabsTrigger value="day">일별</TabsTrigger>
          </TabsList>

          {/* 월별 뷰 */}
          <TabsContent value="month" className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold">
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
              </h3>
              <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {/* 요일 헤더 */}
              {WEEKDAYS.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}

              {/* 날짜 셀 */}
              {getMonthDates().map((date, idx) => {
                const dateStr = formatDate(date);
                const services = schedule[dateStr] || [];
                const isCurrentMonthDate = isCurrentMonth(date);
                const isTodayDate = isToday(date);

                return (
                  <button
                    key={idx}
                    onClick={() => handleDateClick(date)}
                    className={cn(
                      "min-h-[80px] p-1 text-left border rounded-md transition-colors",
                      !isCurrentMonthDate && "text-muted-foreground opacity-50",
                      isTodayDate && "border-primary bg-primary/5",
                      selectedDate === dateStr && "border-primary ring-2 ring-primary",
                      "hover:bg-muted"
                    )}
                  >
                    <div className="text-sm font-medium mb-1">{date.getDate()}</div>
                    <div className="space-y-1">
                      {services.slice(0, 2).map((service, serviceIdx) => (
                        <Badge
                          key={serviceIdx}
                          variant="outline"
                          className={cn(
                            "text-xs w-full justify-start truncate",
                            SERVICE_TYPE_COLORS[service.serviceType] || SERVICE_TYPE_COLORS.other
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onServiceClick?.(service);
                          }}
                        >
                          {service.isOverdue && (
                            <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
                          )}
                          {SERVICE_TYPE_LABELS[service.serviceType] || "기타"}
                        </Badge>
                      ))}
                      {services.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{services.length - 2}개
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </TabsContent>

          {/* 주별 뷰 */}
          <TabsContent value="week" className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold">
                {getWeekDates()[0].toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                ~{" "}
                {getWeekDates()[6].toLocaleDateString("ko-KR", {
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {getWeekDates().map((date, idx) => {
                const dateStr = formatDate(date);
                const services = schedule[dateStr] || [];
                const isTodayDate = isToday(date);

                return (
                  <div
                    key={idx}
                    className={cn(
                      "min-h-[120px] p-3 border rounded-lg",
                      isTodayDate && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="text-sm font-medium mb-2">
                      {WEEKDAYS[idx]} {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {services.map((service, serviceIdx) => (
                        <Badge
                          key={serviceIdx}
                          variant="outline"
                          className={cn(
                            "text-xs w-full justify-start",
                            SERVICE_TYPE_COLORS[service.serviceType] || SERVICE_TYPE_COLORS.other
                          )}
                          onClick={() => onServiceClick?.(service)}
                        >
                          {service.isOverdue && (
                            <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
                          )}
                          {service.serviceName}
                        </Badge>
                      ))}
                      {services.length === 0 && (
                        <div className="text-xs text-muted-foreground">일정 없음</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* 일별 뷰 */}
          <TabsContent value="day" className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-semibold">
                {currentDate.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
              </h3>
              <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {schedule[formatDate(currentDate)] && schedule[formatDate(currentDate)].length > 0 ? (
                schedule[formatDate(currentDate)].map((service, idx) => (
                  <Card
                    key={idx}
                    className={cn(
                      "cursor-pointer hover:bg-muted",
                      service.isOverdue && "border-red-500"
                    )}
                    onClick={() => onServiceClick?.(service)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                SERVICE_TYPE_COLORS[service.serviceType] || SERVICE_TYPE_COLORS.other
                              )}
                            >
                              {SERVICE_TYPE_LABELS[service.serviceType] || "기타"}
                            </Badge>
                            {service.isOverdue && (
                              <Badge variant="destructive">연체</Badge>
                            )}
                          </div>
                          <h4 className="font-medium">{service.serviceName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {service.daysUntil === 0
                              ? "오늘"
                              : service.daysUntil > 0
                              ? `${service.daysUntil}일 후`
                              : `${Math.abs(service.daysUntil)}일 전`}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  이 날짜에는 일정이 없습니다.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        )}
      </CardContent>

      {/* 선택된 날짜의 서비스 상세 모달 */}
      <Dialog open={selectedDate !== null} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate &&
                (() => {
                  // YYYY-MM-DD 형식의 문자열을 Date 객체로 변환 (로컬 시간대 기준)
                  const [year, month, day] = selectedDate.split("-").map(Number);
                  const date = new Date(year, month - 1, day);
                  return date.toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "long",
                  });
                })()}
            </DialogTitle>
            <DialogDescription>이 날짜의 건강 관리 서비스</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {selectedServices.map((service, idx) => (
              <Card
                key={idx}
                className={cn(
                  "cursor-pointer hover:bg-muted",
                  service.isOverdue && "border-red-500"
                )}
                onClick={() => {
                  onServiceClick?.(service);
                  setSelectedDate(null);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            SERVICE_TYPE_COLORS[service.serviceType] || SERVICE_TYPE_COLORS.other
                          )}
                        >
                          {SERVICE_TYPE_LABELS[service.serviceType] || "기타"}
                        </Badge>
                        {service.isOverdue && (
                          <Badge variant="destructive">연체</Badge>
                        )}
                      </div>
                      <h4 className="font-medium">{service.serviceName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {service.daysUntil === 0
                          ? "오늘"
                          : service.daysUntil > 0
                          ? `${service.daysUntil}일 후`
                          : `${Math.abs(service.daysUntil)}일 전`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {selectedServices.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                이 날짜에는 일정이 없습니다.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

