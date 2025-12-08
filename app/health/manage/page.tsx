/**
 * @file health/manage/page.tsx
 * @description 건강 정보 관리 페이지
 *
 * 주요 기능:
 * 1. 건강 정보 요약 표시
 * 2. 건강 정보 수정 페이지로 이동
 * 3. 건강 정보 입력 상태 확인
 * 4. 가족 구성원 관리
 * 5. 팝업 및 알림 설정 저장
 */

"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { User, Heart, Bell, Shield, Save } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { Section } from "@/components/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HealthProfileSummary } from "@/components/health/health-profile-summary";
import { FamilyMemberSection } from "./family-member-section";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function HealthManagePage() {
  const { user: clerkUser } = useUser();
  const { toast } = useToast();
  
  // 팝업 설정 상태 관리
  const [kcdcAlertsEnabled, setKcdcAlertsEnabled] = useState(false);
  const [generalNotificationsEnabled, setGeneralNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 초기 설정 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      if (!clerkUser) {
        setIsLoading(false);
        return;
      }

      try {
        console.group("[HealthManagePage] 알림 설정 불러오기");
        console.log("사용자 ID:", clerkUser.id);

        const response = await fetch("/api/users/notification-settings", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          let errorData: { error?: string; message?: string; details?: string } = {};
          try {
            const text = await response.text();
            if (text) {
              try {
                errorData = JSON.parse(text);
              } catch {
                errorData = { error: text || "알 수 없는 오류" };
              }
            }
          } catch (parseError) {
            console.error("❌ 응답 파싱 실패:", parseError);
            errorData = { error: "응답을 파싱할 수 없습니다" };
          }
          
          console.error("❌ API 응답 실패:", response.status);
          console.error("에러 상세:", errorData);
          
          // 사용자에게 에러 메시지 표시
          const errorMessage = errorData.details || errorData.message || errorData.error || "알림 설정을 불러오는 중 오류가 발생했습니다.";
          toast({
            title: "설정 불러오기 실패",
            description: errorMessage,
            variant: "destructive",
          });
          
          setKcdcAlertsEnabled(false);
          setGeneralNotificationsEnabled(false);
          return;
        }

        const result = await response.json();
        console.log("저장된 설정:", result.settings);

        if (result.settings) {
          setKcdcAlertsEnabled(result.settings.kcdcAlerts ?? false);
          setGeneralNotificationsEnabled(result.settings.generalNotifications ?? false);
        } else {
          setKcdcAlertsEnabled(false);
          setGeneralNotificationsEnabled(false);
        }

        console.groupEnd();
      } catch (error) {
        console.error("❌ 설정 불러오기 실패:", error);
        console.groupEnd();
        setKcdcAlertsEnabled(false);
        setGeneralNotificationsEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [clerkUser]);

  // 설정 저장 함수
  const saveSettings = async () => {
    if (!clerkUser) {
      console.warn("[HealthManagePage] 로그인되지 않은 사용자");
      toast({
        title: "로그인 필요",
        description: "설정을 저장하려면 로그인이 필요합니다.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      console.group("[HealthManagePage] 알림 설정 저장 시작");
      console.log("현재 사용자 ID:", clerkUser.id);
      console.log("저장할 설정:", {
        kcdcAlerts: kcdcAlertsEnabled,
        generalNotifications: generalNotificationsEnabled,
      });

      const response = await fetch("/api/users/notification-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kcdcAlerts: kcdcAlertsEnabled,
          generalNotifications: generalNotificationsEnabled,
        }),
      });

      if (!response.ok) {
        let errorData: { error?: string; message?: string; details?: string; code?: string } = {};
        try {
          const text = await response.text();
          console.error("❌ API 응답 실패:", response.status);
          console.error("응답 본문 (raw):", text);
          
          if (text) {
            try {
              errorData = JSON.parse(text);
              console.error("파싱된 에러 데이터:", errorData);
            } catch {
              errorData = { error: text || "알 수 없는 오류" };
            }
          }
        } catch (parseError) {
          console.error("❌ 응답 파싱 실패:", parseError);
          errorData = { error: "응답을 파싱할 수 없습니다" };
        }
        
        let errorMessage = errorData.details || errorData.message || errorData.error || "알 수 없는 오류가 발생했습니다.";
        
        // "No suitable key or wrong key type" 에러에 대한 특별 처리
        if (errorMessage.includes("No suitable key") || errorMessage.includes("wrong key type") || errorMessage.includes("Database configuration")) {
          errorMessage = "데이터베이스 설정에 문제가 있습니다. 잠시 후 다시 시도해주세요.";
        }
        
        console.error("최종 에러 메시지:", errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("✅ 설정 저장 성공");
      console.log("저장된 데이터:", result);
      console.groupEnd();

      toast({
        title: "설정 저장 완료",
        description: "알림 설정이 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      console.error("❌ 설정 저장 실패:", error);
      console.error("에러 상세 정보:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      console.groupEnd();

      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === "string" 
        ? error 
        : "알 수 없는 오류가 발생했습니다.";
      
      toast({
        title: "설정 저장 실패",
        description: `알림 설정 저장 중 오류가 발생했습니다: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">건강 정보 관리 및 설정</h1>
          <p className="text-muted-foreground">
            현재 건강 정보를 확인하고 필요에 따라 수정할 수 있습니다.
            정확한 정보 입력으로 더 좋은 맞춤 식단을 추천받으세요.
          </p>
        </div>

        <div className="space-y-8">
          {/* 팝업 설정 섹션 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">팝업 및 알림 설정</h3>
                <p className="text-sm text-muted-foreground">
                  건강 관련 팝업과 알림 수신 여부를 설정하세요.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">질병청 알림</p>
                    <p className="text-sm text-muted-foreground">코로나19, 감염병 등 공공 보건 알림</p>
                  </div>
                </div>
                <Switch
                  checked={kcdcAlertsEnabled}
                  onCheckedChange={(checked) => {
                    console.log("[HealthManagePage] 질병청 알림 설정 변경:", checked);
                    setKcdcAlertsEnabled(checked);
                  }}
                  disabled={isLoading || isSaving}
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium">일반 알림</p>
                    <p className="text-sm text-muted-foreground">서비스 업데이트, 건강 팁 등 일반 알림</p>
                  </div>
                </div>
                <Switch
                  checked={generalNotificationsEnabled}
                  onCheckedChange={(checked) => {
                    console.log("[HealthManagePage] 일반 알림 설정 변경:", checked);
                    setGeneralNotificationsEnabled(checked);
                  }}
                  disabled={isLoading || isSaving}
                />
              </div>
            </div>

            {/* 저장 버튼 영역 */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    console.log("[HealthManagePage] 저장 버튼 클릭");
                    saveSettings();
                  }}
                  disabled={isLoading || isSaving}
                  className="min-w-[120px]"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      저장
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* 사용자 프로필 관리 섹션 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">내 프로필 관리</h3>
                  <p className="text-sm text-muted-foreground">
                    이름, 프로필 사진 등 개인 정보를 수정하세요.
                  </p>
                </div>
                <Button asChild>
                  <Link href="/profile">
                    <User className="h-4 w-4 mr-2" />
                    프로필 수정
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">건강 정보 관리</h3>
                  <p className="text-sm text-muted-foreground">
                    건강 상태, 식이 제한사항 등을 수정하세요.
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/health/profile">
                    <Heart className="h-4 w-4 mr-2" />
                    건강 정보 수정
                  </Link>
                </Button>
              </div>
            </Card>
          </div>

          {/* 건강 정보 요약 섹션 */}
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <LoadingSpinner label="건강 정보를 불러오는 중..." />
            </div>
          }>
            <HealthProfileSummary />
          </Suspense>

          {/* 가족 구성원 관리 섹션 */}
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <LoadingSpinner label="가족 구성원 정보를 불러오는 중..." />
            </div>
          }>
            <FamilyMemberSection />
          </Suspense>
        </div>
      </Section>
    </div>
  );
}
