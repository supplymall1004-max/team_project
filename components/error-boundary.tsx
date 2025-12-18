"use client";

/**
 * @file error-boundary.tsx
 * @description 에러 바운더리 컴포넌트
 */

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.group("🚨 [ErrorBoundary] 애플리케이션 오류 발생");
    console.error("에러 객체:", error);
    console.error("에러 메시지:", error.message);
    console.error("에러 스택:", error.stack);
    console.error("에러 정보:", errorInfo);
    console.error("컴포넌트 스택:", errorInfo.componentStack);
    
    // 일반적인 원인 안내
    console.error("");
    console.error("🔍 가능한 원인:");
    if (error.message.includes("Clerk") || error.message.includes("publishableKey")) {
      console.error("  → Clerk 인증 설정 문제");
      console.error("  → NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY 환경변수 확인 필요");
    }
    if (error.message.includes("Supabase") || error.message.includes("NEXT_PUBLIC_SUPABASE")) {
      console.error("  → Supabase 설정 문제");
      console.error("  → NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수 확인 필요");
    }
    if (error.message.includes("환경 변수") || error.message.includes("environment variable")) {
      console.error("  → 환경변수 누락");
      console.error("  → Vercel Dashboard → Settings → Environment Variables 확인");
      console.error("  → 환경변수 변경 후 재배포 필요");
    }
    
    console.error("");
    console.error("✅ 해결 방법:");
    console.error("  1. 브라우저 콘솔의 위 에러 메시지를 확인");
    console.error("  2. Vercel Dashboard에서 환경변수 확인");
    console.error("  3. 환경변수 변경 후 재배포");
    console.error("  4. 브라우저 캐시 삭제 및 하드 리프레시 (Ctrl+Shift+R)");
    console.groupEnd();
  }

  render() {
    if (this.state.hasError) {
      console.warn("⚠️ [ErrorBoundary] 에러 상태로 인해 fallback UI 렌더링");
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            섹션을 불러오는 중 오류가 발생했습니다.
          </p>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="mt-4 text-xs text-red-600">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
