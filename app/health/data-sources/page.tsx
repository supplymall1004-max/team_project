/**
 * @file app/health/data-sources/page.tsx
 * @description 건강정보 데이터 소스 연결 관리 페이지
 *
 * 이 페이지는 사용자가 건강정보 데이터 소스(마이데이터, 건강정보고속도로 등)를
 * 연결하고 관리할 수 있는 인터페이스를 제공합니다.
 *
 * 주요 기능:
 * 1. 연결된 데이터 소스 목록 표시
 * 2. 새로운 데이터 소스 연결
 * 3. 데이터 소스 연결 상태 모니터링
 * 4. 수동 동기화 트리거
 * 5. 연결 해제 기능
 *
 * @dependencies
 * - @supabase/supabase-js: Supabase 클라이언트
 * - @tanstack/react-query: 데이터 페칭 및 캐싱
 * - react-hook-form: 폼 관리
 * - lucide-react: 아이콘
 *
 * @see {@link types/health-data-integration.ts} - 관련 타입 정의
 * @see {@link lib/health/health-data-sync-service.ts} - 동기화 서비스
 */

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, RefreshCw, Unlink, CheckCircle, XCircle, AlertCircle, Database, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { HealthDataSource, DataSourceType, ConnectionStatus } from "@/types/health-data-integration";

// 데이터 소스 타입별 표시 정보
const DATA_SOURCE_INFO = {
  mydata: {
    name: "마이데이터",
    description: "금융권 데이터 연동 서비스",
    icon: Database,
  },
  health_highway: {
    name: "건강정보고속도로",
    description: "공공 건강정보 연동 서비스",
    icon: Database,
  },
  manual: {
    name: "수동 입력",
    description: "직접 건강정보 입력",
    icon: Database,
  },
} as const;

// 연결 상태별 표시 정보
const STATUS_INFO = {
  pending: {
    label: "연결 대기",
    variant: "secondary" as const,
    icon: AlertCircle,
    color: "text-yellow-600",
  },
  connected: {
    label: "연결됨",
    variant: "default" as const,
    icon: CheckCircle,
    color: "text-green-600",
  },
  disconnected: {
    label: "연결 해제",
    variant: "outline" as const,
    icon: XCircle,
    color: "text-gray-600",
  },
  error: {
    label: "연결 오류",
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-red-600",
  },
};

export default function HealthDataSourcesPage() {
  console.log("[HealthDataSourcesPage] 페이지 렌더링 시작");

  const { user, isLoaded, isSignedIn } = useUser();
  console.log("[HealthDataSourcesPage] Clerk User Status:", { isLoaded, isSignedIn, userId: user?.id });
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [selectedSourceType, setSelectedSourceType] = useState<DataSourceType | "">("");
  const [sourceName, setSourceName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 신원확인 상태 관리 (UI 입력 및 확인 상태)
  const [identityName, setIdentityName] = useState<string>("");
  const [nationalId, setNationalId] = useState<string>("");
  const [consent, setConsent] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 신원확인(Identity Verifications) 조회
  const {
    data: verifications,
    isLoading: isVerificationsLoading,
    error: verificationsError
  } = useQuery({
    queryKey: ["identity-verifications"],
    queryFn: async () => {
      const res = await fetch("/api/identity/verifications");
      if (!res.ok) throw new Error("Identity verifications fetch failed");
      return res.json();
    },
    enabled: isLoaded && !!user?.id,
    onError: (err) => {
      console.error("[IdentityVerifications] fetch error:", err);
    }
  });

  const hasVerifiedIdentity = Array.isArray(verifications) && verifications.some(v => v.status === "verified");

  // 환경 변수 확인 (개발 환경에서만)
  if (process.env.NODE_ENV === "development") {
    console.log("[HealthDataSourcesPage] 환경 변수 확인:", {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseClient: !!supabase,
    });
  }

  // 건강정보 데이터 소스 목록 조회
  const {
    data: dataSources,
    isLoading,
    error,
  } = useQuery({
    enabled: isLoaded && !!user?.id && !!hasVerifiedIdentity,
    onError: (error) => {
      console.error("[HealthDataSourcesPage] 데이터 소스 조회 실패(onError):", error);
    },
    queryKey: ["health-data-sources", user?.id ?? "guest"],
    queryFn: async (): Promise<HealthDataSource[]> => {
      console.log("[HealthDataSourcesPage] 데이터 소스 목록 조회 시작");

      if (!user?.id) {
        console.warn("[HealthDataSourcesPage] 사용자가 로그인하지 않음");
        return [];
      }

      try {
        // 쿼리 실패 시 onError에서도 콘솔 로그를 남길 수 있도록 기본 로깅 추가
        console.log("[HealthDataSourcesPage] Supabase 클라이언트 확인:", {
          hasSupabase: !!supabase,
          userClerkId: user.id,
        });

        // 먼저 사용자 동기화 확인 및 시도
        console.log("[HealthDataSourcesPage] 사용자 동기화 확인 시작");
        const clerkId = String(user.id);
        console.log("[HealthDataSourcesPage] Clerk User ID:", {
          id: clerkId,
          type: typeof clerkId,
          length: clerkId.length,
        });

        // 사용자 동기화 API 호출 (없으면 생성, 있으면 업데이트)
        console.log("[HealthDataSourcesPage] 사용자 동기화 API 호출");
        const syncResponse = await fetch("/api/sync-user", {
          method: "POST",
        });

        if (!syncResponse.ok) {
          const errorData = await syncResponse.json().catch(() => ({}));
          console.error("[HealthDataSourcesPage] 사용자 동기화 실패:", errorData);
          throw new Error(
            errorData.message || "사용자 정보를 동기화할 수 없습니다. 로그인 상태를 확인해주세요."
          );
        }

        const syncResult = await syncResponse.json();
        console.log("[HealthDataSourcesPage] 사용자 동기화 성공:", {
          userId: syncResult.user?.id,
          userName: syncResult.user?.name,
        });

        // API를 통해 Supabase user_id 조회 (RLS 문제 방지)
        console.log("[HealthDataSourcesPage] API를 통해 사용자 ID 조회 시작");
        const userResponse = await fetch("/api/users/current");

        if (!userResponse.ok) {
          const errorData = await userResponse.json().catch(() => ({}));
          console.error("[HealthDataSourcesPage] 사용자 ID 조회 실패:", errorData);
          throw new Error(
            errorData.message || "사용자 정보를 조회할 수 없습니다. 페이지를 새로고침해주세요."
          );
        }

        const userResult = await userResponse.json();
        console.log("[HealthDataSourcesPage] 사용자 ID 조회 성공:", userResult);

        if (!userResult.success || !userResult.userId) {
          console.error("[HealthDataSourcesPage] 사용자 ID가 없음");
          throw new Error(
            "사용자 정보를 찾을 수 없습니다. 페이지를 새로고침해주세요."
          );
        }

        // API를 통해 데이터 소스 목록 조회 (RLS 문제 방지)
        console.log("[HealthDataSourcesPage] API를 통해 데이터 소스 목록 조회 시작");
        const dataSourcesResponse = await fetch("/api/health/data-sources");

        if (!dataSourcesResponse.ok) {
          const errorData = await dataSourcesResponse.json().catch(() => ({}));
          console.error("[HealthDataSourcesPage] 데이터 소스 조회 실패:", errorData);
          throw new Error(
            errorData.message || "데이터 소스 목록을 조회할 수 없습니다."
          );
        }

        const dataSourcesResult = await dataSourcesResponse.json();
        console.log("[HealthDataSourcesPage] 데이터 소스 조회 성공:", {
          count: dataSourcesResult.count || 0,
          dataCount: dataSourcesResult.data?.length || 0,
        });

        return dataSourcesResult.data || [];
      } catch (err) {
        console.error("[HealthDataSourcesPage] 쿼리 실행 중 에러:", {
          error: err,
          errorType: typeof err,
          errorMessage: err instanceof Error ? err.message : String(err),
          errorStack: err instanceof Error ? err.stack : undefined,
        });
        
        // 에러를 명확한 Error 객체로 변환
        if (err instanceof Error) {
          throw err;
        } else {
          throw new Error(
            `예상치 못한 오류가 발생했습니다: ${JSON.stringify(err)}`
          );
        }
      }
    },
    enabled: isLoaded && !!user?.id,
    retry: 1,
    retryDelay: 1000,
    onError: (error) => {
      console.error("[HealthDataSourcesPage] React Query onError:", {
        error,
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
    },
  });

  // 데이터 소스 연결 뮤테이션 (OAuth 인증 URL 생성 및 리다이렉트)
  const connectMutation = useMutation({
    mutationFn: async (params: { sourceType: DataSourceType; sourceName: string }) => {
      console.log("[HealthDataSourcesPage] 데이터 소스 연결 시도:", params);

      if (!user?.id) {
        throw new Error("로그인이 필요합니다.");
      }

      // manual 타입은 OAuth 인증이 필요 없음
      if (params.sourceType === "manual") {
        // API를 통해 수동 입력 데이터 소스 연결
        console.log("[HealthDataSourcesPage] 수동 입력 데이터 소스 연결 API 호출");
        const connectResponse = await fetch("/api/health/data-sources/connect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source_type: params.sourceType,
            source_name: params.sourceName,
            // manual 타입은 authorization_code가 필요 없음
          }),
        });

        if (!connectResponse.ok) {
          const errorData = await connectResponse.json().catch(() => ({}));
          console.error("[HealthDataSourcesPage] 데이터 소스 연결 실패:", errorData);
          throw new Error(errorData.message || "데이터 소스 연결에 실패했습니다.");
        }

        const connectResult = await connectResponse.json();
        console.log("[HealthDataSourcesPage] 데이터 소스 연결 성공:", connectResult);
        return { data: connectResult.data, isManual: true };
      }

      // mydata 또는 health_highway는 OAuth 인증 필요
      console.log("[HealthDataSourcesPage] OAuth 인증 URL 생성 요청");
      
      const redirectUri = `${window.location.origin}/api/health/data-sources/callback`;
      
      const response = await fetch("/api/health/data-sources/auth-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_type: params.sourceType,
          redirect_uri: redirectUri,
          source_name: params.sourceName, // state에 포함시키기 위해 전달
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[HealthDataSourcesPage] 인증 URL 생성 실패:", errorData);
        throw new Error(errorData.message || "인증 URL 생성에 실패했습니다.");
      }

      const { auth_url } = await response.json();
      console.log("[HealthDataSourcesPage] 인증 URL 생성 완료, 리다이렉트:", auth_url);

      // source_name을 세션 스토리지에 저장 (콜백에서 사용)
      sessionStorage.setItem(
        `data_source_${params.sourceType}_name`,
        params.sourceName
      );

      // OAuth 인증 페이지로 리다이렉트
      window.location.href = auth_url;

      // 리다이렉트 후에는 실행되지 않지만, 타입을 맞추기 위해 반환
      return { data: null, isManual: false };
    },
    onSuccess: (result) => {
      console.log("[HealthDataSourcesPage] 데이터 소스 연결 성공 처리:", result);

      // manual 타입만 즉시 처리 (OAuth는 리다이렉트됨)
      if (result?.isManual) {
        toast({
          title: "연결 완료",
          description: "데이터 소스가 성공적으로 연결되었습니다.",
        });

        setIsConnectDialogOpen(false);
        setSelectedSourceType("");
        setSourceName("");
        queryClient.invalidateQueries({ queryKey: ["health-data-sources"] });
      }
      // OAuth 타입은 리다이렉트되므로 여기서는 아무것도 하지 않음
    },
    onError: (error) => {
      console.error("[HealthDataSourcesPage] 데이터 소스 연결 실패:", error);

      toast({
        title: "연결 실패",
        description: error instanceof Error ? error.message : "데이터 소스 연결에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  // 수동 동기화 뮤테이션
  const syncMutation = useMutation({
    mutationFn: async (dataSourceId: string) => {
      console.log("[HealthDataSourcesPage] 수동 동기화 시도:", dataSourceId);

      // TODO: 실제 동기화 서비스 호출
      // const result = await healthDataSyncService.syncDataSource(dataSourceId);

      // 임시로 2초 대기 후 성공 처리
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log("[HealthDataSourcesPage] 수동 동기화 완료:", dataSourceId);
      return { dataSourceId };
    },
    onSuccess: (result) => {
      console.log("[HealthDataSourcesPage] 수동 동기화 성공 처리:", result);

      toast({
        title: "동기화 완료",
        description: "데이터 동기화가 성공적으로 완료되었습니다.",
      });

      queryClient.invalidateQueries({ queryKey: ["health-data-sources"] });
    },
    onError: (error) => {
      console.error("[HealthDataSourcesPage] 수동 동기화 실패:", error);

      toast({
        title: "동기화 실패",
        description: "데이터 동기화에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  // 연결 해제 뮤테이션
  const disconnectMutation = useMutation({
    mutationFn: async (dataSourceId: string) => {
      console.log("[HealthDataSourcesPage] 연결 해제 시도:", dataSourceId);

      const { error } = await supabase
        .from("health_data_sources")
        .update({
          connection_status: "disconnected",
          last_synced_at: null,
        })
        .eq("id", dataSourceId);

      if (error) {
        console.error("[HealthDataSourcesPage] 연결 해제 에러:", error);
        throw error;
      }

      console.log("[HealthDataSourcesPage] 연결 해제 성공:", dataSourceId);
    },
    onSuccess: () => {
      console.log("[HealthDataSourcesPage] 연결 해제 성공 처리");

      toast({
        title: "연결 해제 완료",
        description: "데이터 소스 연결이 해제되었습니다.",
      });

      queryClient.invalidateQueries({ queryKey: ["health-data-sources"] });
    },
    onError: (error) => {
      console.error("[HealthDataSourcesPage] 연결 해제 실패:", error);

      toast({
        title: "연결 해제 실패",
        description: "데이터 소스 연결 해제에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  // 연결 핸들러
  const handleConnect = () => {
    if (!selectedSourceType || !sourceName.trim()) {
      toast({
        title: "입력 오류",
        description: "데이터 소스 유형과 이름을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    console.log("[HealthDataSourcesPage] 연결 요청:", { selectedSourceType, sourceName });
    connectMutation.mutate({
      sourceType: selectedSourceType as DataSourceType,
      sourceName: sourceName.trim(),
    });
  };

  // 수동 동기화 핸들러
  const handleSync = (dataSourceId: string) => {
    console.log("[HealthDataSourcesPage] 수동 동기화 요청:", dataSourceId);
    syncMutation.mutate(dataSourceId);
  };

  // 연결 해제 핸들러
  const handleDisconnect = (dataSourceId: string) => {
    console.log("[HealthDataSourcesPage] 연결 해제 요청:", dataSourceId);
    disconnectMutation.mutate(dataSourceId);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            로그인이 필요합니다. 로그인 후 다시 시도해주세요.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 신원확인 상태에 따른 UI 변화: 아직 인증되지 않았다면 입력 폼 표시
  // verifications 배열이 로드되었고, verified가 하나도 없으면 폼을 보여줌
  if (Array.isArray(verifications) && verifications.length >= 0 && !hasVerifiedIdentity) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="warning">
          <AlertDescription>신원확인이 필요합니다. 아래 정보를 입력해 주세요.</AlertDescription>
        </Alert>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <Label>이름</Label>
            <Input 
              value={identityName} 
              onChange={(e) => setIdentityName(e.target.value)} 
              placeholder="홍길동"
              disabled={isSubmitted}
              className={isSubmitted ? "border-green-500 bg-green-50" : ""}
            />
            {isSubmitted && (
              <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>제출 완료</span>
              </div>
            )}
          </div>
          <div>
            <Label>주민등록번호</Label>
            <Input 
              value={nationalId} 
              onChange={(e) => setNationalId(e.target.value)} 
              placeholder="YYYYMMDD-XXXXXXX"
              disabled={isSubmitted}
              className={isSubmitted ? "border-green-500 bg-green-50" : ""}
            />
            {isSubmitted && (
              <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>제출 완료</span>
              </div>
            )}
          </div>
          <div className="flex items-end">
            <label className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                checked={consent} 
                onChange={(e) => setConsent(e.target.checked)}
                disabled={isSubmitted}
              />
              <span className={isSubmitted ? "text-green-600" : ""}>개인정보 활용 동의</span>
            </label>
          </div>
        </div>
        <div className="mt-4">
          <Button 
            onClick={async () => {
              if (!identityName.trim() || !nationalId.trim() || !consent) {
                toast({ title: "입력 오류", description: "모두 입력하고 동의해 주세요.", variant: "destructive" });
                return;
              }
              
              setIsSubmitting(true);
              try {
                console.log("[HealthDataSourcesPage] 신원확인 제출 시작:", { 
                  name: identityName.trim(), 
                  hasNationalId: !!nationalId.trim(), 
                  consent 
                });
                
                const resp = await fetch("/api/identity/verifications", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: identityName.trim(), nationalId: nationalId.trim(), consent }),
                });
                
                console.log("[HealthDataSourcesPage] API 응답 상태:", resp.status);
                
                if (resp.ok) {
                  const data = await resp.json();
                  console.log("[HealthDataSourcesPage] 제출 성공:", data);
                  setIsSubmitted(true);
                  toast({ title: "제출 완료", description: "신원확인 요청이 접수되었습니다." });
                  // 재조회하여 상태 갱신
                  queryClient.invalidateQueries({ queryKey: ["identity-verifications"] });
                } else {
                  // JSON 응답 시도
                  let errorMessage = "오류가 발생했습니다.";
                  try {
                    const errorData = await resp.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                    console.error("[HealthDataSourcesPage] 제출 실패 (JSON):", errorData);
                  } catch {
                    // JSON 파싱 실패 시 텍스트로 시도
                    try {
                      const text = await resp.text();
                      errorMessage = text || errorMessage;
                      console.error("[HealthDataSourcesPage] 제출 실패 (텍스트):", text);
                    } catch (e) {
                      console.error("[HealthDataSourcesPage] 응답 파싱 실패:", e);
                    }
                  }
                  toast({ 
                    title: "제출 실패", 
                    description: errorMessage, 
                    variant: "destructive" 
                  });
                }
              } catch (error) {
                console.error("[HealthDataSourcesPage] 제출 중 예외 발생:", error);
                toast({ 
                  title: "제출 실패", 
                  description: error instanceof Error ? error.message : "네트워크 오류가 발생했습니다.", 
                  variant: "destructive" 
                });
              } finally {
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting || isSubmitted}
            className={isSubmitted ? "bg-green-600 hover:bg-green-700 text-white" : ""}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                제출 중...
              </>
            ) : isSubmitted ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                제출 완료
              </>
            ) : (
              "제출"
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    console.log("[HealthDataSourcesPage] 로딩 중");
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    console.error("[HealthDataSourcesPage] 에러 발생:", error);
    // 에러 메시지 추출
    let errorMessage = "알 수 없는 오류가 발생했습니다.";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object') {
      // React Query나 Supabase 에러 객체 처리
      if ('message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if ('error' in error && error.error instanceof Error) {
        errorMessage = error.error.message;
      } else {
        // 객체의 모든 속성을 문자열로 변환
        try {
          errorMessage = JSON.stringify(error, null, 2);
        } catch {
          errorMessage = String(error);
        }
      }
    } else {
      errorMessage = String(error);
    }
    
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">데이터 소스 목록을 불러오는 중 오류가 발생했습니다.</p>
              <p className="text-sm text-muted-foreground font-mono break-all">
                {errorMessage}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                브라우저 콘솔에서 더 자세한 오류 정보를 확인할 수 있습니다.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 로그인 상태에 따른 렌더링 제어를 Hook 실행 후에 수행하도록 추가
  if (!isLoaded) {
    return <div className="container mx-auto py-8">로딩 중...</div>;
  }
  if (!user?.id) {
    return <div className="container mx-auto py-8">로그인 필요</div>;
  }

  console.log("[HealthDataSourcesPage] 렌더링 완료, 데이터 소스 수:", dataSources?.length || 0);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">건강정보 데이터 소스</h1>
          <p className="text-muted-foreground mt-2">
            건강정보를 자동으로 연동할 데이터 소스를 관리하세요
          </p>
        </div>

        <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!hasVerifiedIdentity}>
              <Plus className="h-4 w-4 mr-2" />
              새 데이터 소스 연결
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 데이터 소스 연결</DialogTitle>
              <DialogDescription>
                {hasVerifiedIdentity
                  ? "건강정보를 연동할 데이터 소스를 선택하고 연결하세요"
                  : "데이터 소스를 연결하려면 먼저 신원확인이 완료되어야 합니다."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="source-type">데이터 소스 유형</Label>
                <Select value={selectedSourceType} onValueChange={setSelectedSourceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="유형을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DATA_SOURCE_INFO).map(([type, info]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <info.icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{info.name}</div>
                            <div className="text-sm text-muted-foreground">{info.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="source-name">데이터 소스 이름</Label>
                <Input
                  id="source-name"
                  placeholder="예: 국민은행 마이데이터"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                />
              </div>

              {!hasVerifiedIdentity && (
                <Alert variant="warning" className="mt-4">
                  <AlertDescription>
                    데이터 소스를 연결하려면 먼저 신원확인이 완료되어야 합니다. 페이지 상단에서 이름, 주민등록번호를 입력하고 개인정보 동의를 해주세요.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleConnect}
                  disabled={connectMutation.isPending || !hasVerifiedIdentity}
                  className="flex-1"
                >
                  {connectMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  연결하기
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsConnectDialogOpen(false)}
                  className="flex-1"
                >
                  취소
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dataSources?.map((dataSource) => {
          const sourceInfo = DATA_SOURCE_INFO[dataSource.source_type];
          const statusInfo = STATUS_INFO[dataSource.connection_status];
          const StatusIcon = statusInfo.icon;

          return (
            <Card key={dataSource.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <sourceInfo.icon className="h-6 w-6" />
                    <div>
                      <CardTitle className="text-lg">{dataSource.source_name}</CardTitle>
                      <CardDescription>{sourceInfo.name}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={statusInfo.variant}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    생성일: {new Date(dataSource.created_at).toLocaleDateString('ko-KR')}
                  </div>

                  {dataSource.last_synced_at && (
                    <div className="text-sm text-muted-foreground">
                      마지막 동기화: {new Date(dataSource.last_synced_at).toLocaleString('ko-KR')}
                    </div>
                  )}

                  {dataSource.connection_status === 'connected' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(dataSource.id)}
                        disabled={syncMutation.isPending}
                      >
                        {syncMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <RefreshCw className="h-3 w-3 mr-1" />
                        )}
                        동기화
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(dataSource.id)}
                        disabled={disconnectMutation.isPending}
                      >
                        {disconnectMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Unlink className="h-3 w-3 mr-1" />
                        )}
                        연결 해제
                      </Button>
                    </div>
                  )}

                  {dataSource.connection_status === 'error' && dataSource.error_message && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-sm">
                        {dataSource.error_message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {dataSources?.length === 0 && (
        <div className="text-center py-12">
          <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">연결된 데이터 소스가 없습니다</h3>
          <p className="text-muted-foreground mb-4">
            건강정보를 자동으로 연동하려면 데이터 소스를 연결하세요
          </p>
          <Button 
            onClick={() => setIsConnectDialogOpen(true)}
            disabled={!hasVerifiedIdentity}
          >
            <Plus className="h-4 w-4 mr-2" />
            첫 데이터 소스 연결하기
          </Button>
          {!hasVerifiedIdentity && (
            <p className="text-sm text-muted-foreground mt-2">
              데이터 소스를 연결하려면 먼저 신원확인이 완료되어야 합니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
