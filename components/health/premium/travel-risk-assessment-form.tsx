/**
 * @file components/health/premium/travel-risk-assessment-form.tsx
 * @description 여행 위험도 평가 폼 컴포넌트 (프리미엄 전용)
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TravelRiskResult } from "./travel-risk-result";
import type { TravelRiskAssessment } from "@/types/kcdc";
import { Plane, Search } from "lucide-react";

const travelRiskAssessmentSchema = z.object({
  destination_country: z.string().min(1, "목적지 국가를 입력해주세요"),
  destination_region: z.string().optional(),
  travel_start_date: z.string().min(1, "여행 시작일을 선택해주세요"),
  travel_end_date: z.string().min(1, "여행 종료일을 선택해주세요"),
});

type TravelRiskAssessmentFormValues = z.infer<
  typeof travelRiskAssessmentSchema
>;

export function TravelRiskAssessmentForm() {
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessment, setAssessment] = useState<TravelRiskAssessment | null>(
    null
  );
  const { toast } = useToast();

  const form = useForm<TravelRiskAssessmentFormValues>({
    resolver: zodResolver(travelRiskAssessmentSchema),
    defaultValues: {
      destination_country: "",
      destination_region: "",
      travel_start_date: "",
      travel_end_date: "",
    },
  });

  const onSubmit = async (data: TravelRiskAssessmentFormValues) => {
    console.group("[TravelRiskAssessmentForm] 평가 시작");
    console.log("데이터:", data);

    setIsAssessing(true);
    setAssessment(null);

    try {
      const response = await fetch(
        "/api/health/kcdc-premium/travel-risk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            destination_country: data.destination_country,
            destination_region: data.destination_region || null,
            travel_start_date: data.travel_start_date,
            travel_end_date: data.travel_end_date,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "여행 위험도 평가에 실패했습니다.");
      }

      const result = await response.json();
      setAssessment(result.data);

      console.log("✅ 평가 완료:", result.data);
      console.groupEnd();

      toast({
        title: "평가 완료",
        description: "여행 위험도 평가가 완료되었습니다.",
      });
    } catch (error) {
      console.error("❌ 평가 실패:", error);
      console.groupEnd();

      toast({
        title: "오류",
        description:
          error instanceof Error
            ? error.message
            : "여행 위험도 평가에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsAssessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5" />
            여행 정보 입력
          </CardTitle>
          <CardDescription>
            여행 목적지와 일정을 입력하여 위험도를 평가하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="destination_country">
                  목적지 국가 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="destination_country"
                  {...form.register("destination_country")}
                  placeholder="예: 일본, 태국, 미국 등"
                />
                {form.formState.errors.destination_country && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.destination_country.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination_region">목적지 지역</Label>
                <Input
                  id="destination_region"
                  {...form.register("destination_region")}
                  placeholder="예: 도쿄, 방콕 등 (선택사항)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="travel_start_date">
                  여행 시작일 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="travel_start_date"
                  type="date"
                  {...form.register("travel_start_date")}
                />
                {form.formState.errors.travel_start_date && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.travel_start_date.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="travel_end_date">
                  여행 종료일 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="travel_end_date"
                  type="date"
                  {...form.register("travel_end_date")}
                />
                {form.formState.errors.travel_end_date && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.travel_end_date.message}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isAssessing} className="w-full">
              {isAssessing ? (
                <>
                  <Search className="w-4 h-4 mr-2 animate-spin" />
                  평가 중...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  위험도 평가하기
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 평가 결과 */}
      {assessment && <TravelRiskResult assessment={assessment} />}
    </div>
  );
}

