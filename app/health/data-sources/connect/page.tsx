/**
 * @file app/health/data-sources/connect/page.tsx
 * @description 데이터 소스 연결 완료 페이지
 *
 * OAuth 인증 완료 후 인증 코드를 받아서 데이터 소스 연결을 완료하는 페이지입니다.
 *
 * 주요 기능:
 * 1. URL 쿼리 파라미터에서 인증 코드와 state 추출
 * 2. 세션 스토리지에서 source_name 가져오기
 * 3. source_type을 state에서 추출
 * 4. /api/health/data-sources/connect API 호출하여 연결 완료
 * 5. 연결 완료 후 데이터 소스 목록 페이지로 리다이렉트
 *
 * @dependencies
 * - @tanstack/react-query: 데이터 페칭 및 캐싱
 * - next/navigation: 리다이렉트
 */

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DataSourceType } from "@/types/health-data-integration";

export default function DataSourceConnectPage() {
  console.log("[DataSourceConnectPage] 페이지 렌더링 시작");

  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const connectDataSource = async () => {
      console.group("[DataSourceConnectPage] 데이터 소스 연결 시작");

      try {
        // 1. 쿼리 파라미터에서 인증 코드와 state 추출
        const code = searchParams.get("code");
        const state = searchParams.get("state");

        console.log("[DataSourceConnectPage] 쿼리 파라미터:", { code: !!code, state });

        if (!code || !state) {
          console.error("[DataSourceConnectPage] 필수 파라미터 누락");
          setStatus("error");
          setErrorMessage("인증 코드 또는 상태 정보가 없습니다.");
          toast({
            title: "연결 실패",
            description: "인증 정보가 올바르지 않습니다.",
            variant: "destructive",
          });
          console.groupEnd();
          return;
        }

        // 2. state에서 사용자 ID와 타임스탬프 추출
        // state 형식: {userId}_{timestamp}
        const stateParts = state.split("_");
        const userId = stateParts[0];
        const timestamp = stateParts[1];

        console.log("[DataSourceConnectPage] State 파싱:", { userId, timestamp });

        // 3. 세션 스토리지에서 source_name과 source_type 찾기
        // mydata 또는 health_highway 중 어떤 것이 연결되었는지 확인
        let sourceType: DataSourceType | null = null;
        let sourceName: string | null = null;

        const mydataName = sessionStorage.getItem("data_source_mydata_name");
        const healthHighwayName = sessionStorage.getItem("data_source_health_highway_name");

        if (mydataName) {
          sourceType = "mydata";
          sourceName = mydataName;
          sessionStorage.removeItem("data_source_mydata_name");
        } else if (healthHighwayName) {
          sourceType = "health_highway";
          sourceName = healthHighwayName;
          sessionStorage.removeItem("data_source_health_highway_name");
        }

        console.log("[DataSourceConnectPage] 데이터 소스 정보:", { sourceType, sourceName });

        if (!sourceType || !sourceName) {
          console.error("[DataSourceConnectPage] 데이터 소스 정보 없음");
          setStatus("error");
          setErrorMessage("데이터 소스 정보를 찾을 수 없습니다. 다시 연결을 시도해주세요.");
          toast({
            title: "연결 실패",
            description: "데이터 소스 정보를 찾을 수 없습니다.",
            variant: "destructive",
          });
          console.groupEnd();
          return;
        }

        // 4. 연결 완료 API 호출
        console.log("[DataSourceConnectPage] 연결 완료 API 호출 시작");
        const redirectUri = `${window.location.origin}/api/health/data-sources/callback`;

        const response = await fetch("/api/health/data-sources/connect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source_type: sourceType,
            source_name: sourceName,
            authorization_code: code,
            redirect_uri: redirectUri,
          }),
        });

        console.log("[DataSourceConnectPage] API 응답 상태:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("[DataSourceConnectPage] 연결 실패:", errorData);
          setStatus("error");
          setErrorMessage(errorData.message || "데이터 소스 연결에 실패했습니다.");
          toast({
            title: "연결 실패",
            description: errorData.message || "데이터 소스 연결에 실패했습니다.",
            variant: "destructive",
          });
          console.groupEnd();
          return;
        }

        const result = await response.json();
        console.log("[DataSourceConnectPage] 연결 성공:", result);

        // 5. 연결 성공 처리
        setStatus("success");
        toast({
          title: "연결 완료",
          description: "데이터 소스가 성공적으로 연결되었습니다.",
        });

        // 데이터 소스 목록 쿼리 무효화
        queryClient.invalidateQueries({ queryKey: ["health-data-sources"] });

        // 3초 후 데이터 소스 목록 페이지로 리다이렉트
        setTimeout(() => {
          console.log("[DataSourceConnectPage] 데이터 소스 목록 페이지로 리다이렉트");
          router.push("/health/data-sources");
        }, 3000);

        console.groupEnd();
      } catch (error) {
        console.error("[DataSourceConnectPage] 예외 발생:", error);
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
        );
        toast({
          title: "연결 실패",
          description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
          variant: "destructive",
        });
        console.groupEnd();
      }
    };

    connectDataSource();
  }, [searchParams, router, queryClient, toast]);

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">데이터 소스 연결</CardTitle>
          <CardDescription>데이터 소스 연결을 처리하고 있습니다...</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">연결 중...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <p className="text-lg font-medium mb-2">연결 완료!</p>
              <p className="text-sm text-muted-foreground">
                데이터 소스가 성공적으로 연결되었습니다.
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                잠시 후 데이터 소스 목록 페이지로 이동합니다...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-8">
              <XCircle className="h-12 w-12 text-red-600 mb-4" />
              <p className="text-lg font-medium mb-2">연결 실패</p>
              <p className="text-sm text-muted-foreground text-center mb-4">{errorMessage}</p>
              <button
                onClick={() => router.push("/health/data-sources")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                데이터 소스 목록으로 돌아가기
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

