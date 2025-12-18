"use client";

/**
 * @file error-fallback.tsx
 * @description 에러 바운더리용 Fallback 컴포넌트
 * 
 * 주의: 클라이언트에서 환경변수를 직접 확인할 수 없습니다.
 * Next.js는 NEXT_PUBLIC_* 환경변수를 빌드 타임에 번들에 주입하므로,
 * 클라이언트에서는 process.env.NEXT_PUBLIC_*로 접근할 수 있지만,
 * window.__NEXT_DATA__.env에는 포함되지 않을 수 있습니다.
 * 
 * 환경변수 문제는 서버 사이드에서만 확인 가능하며,
 * 클라이언트에서는 일반적인 에러 메시지만 표시합니다.
 */

import { useEffect, useState } from "react";

export function ErrorFallback() {
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  useEffect(() => {
    // 콘솔에 에러 정보가 있는지 확인하도록 안내
    console.error("🚨 [ErrorFallback] 애플리케이션 오류가 발생했습니다.");
    console.error("🚨 [ErrorFallback] 위의 콘솔 로그를 확인하여 정확한 에러 원인을 파악하세요.");
    console.error("🚨 [ErrorFallback] 일반적인 원인:");
    console.error("   1. 환경변수 누락 (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_URL 등)");
    console.error("   2. Clerk 인증 초기화 실패");
    console.error("   3. Supabase 클라이언트 초기화 실패");
    console.error("   4. 네트워크 연결 문제");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full space-y-4 text-center bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-orange-600">애플리케이션 오류</h1>
        
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            애플리케이션을 로드하는 중 문제가 발생했습니다.
          </p>
          
          <div className="text-left text-xs text-muted-foreground space-y-1 bg-blue-50 p-3 rounded border border-blue-200">
            <p className="font-semibold text-blue-800">⚠️ 중요: 에러 원인 확인 방법</p>
            <p className="text-blue-700">
              1. 키보드에서 <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">F12</kbd> 키를 누르세요
            </p>
            <p className="text-blue-700">
              2. "Console" 탭을 클릭하세요
            </p>
            <p className="text-blue-700">
              3. 빨간색 에러 메시지를 확인하세요
            </p>
            <p className="text-blue-700 mt-2">
              에러 메시지를 복사하여 관리자에게 전달해주시면 빠르게 해결할 수 있습니다.
            </p>
          </div>

          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            {showDebugInfo ? "디버깅 정보 숨기기" : "디버깅 정보 보기"}
          </button>

          {showDebugInfo && (
            <div className="text-left text-xs text-muted-foreground space-y-1 bg-gray-50 p-3 rounded border">
              <p className="font-semibold">가능한 원인 및 해결 방법:</p>
              <div className="space-y-2 mt-2">
                <div>
                  <p className="font-semibold text-red-600">1. 환경변수 누락</p>
                  <p className="pl-2">→ Vercel Dashboard → Settings → Environment Variables 확인</p>
                  <p className="pl-2">→ 필수 변수: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_URL 등</p>
                </div>
                <div>
                  <p className="font-semibold text-red-600">2. 재배포 필요</p>
                  <p className="pl-2">→ 환경변수 변경 후 반드시 재배포 필요</p>
                  <p className="pl-2">→ Vercel Dashboard → Deployments → Redeploy</p>
                </div>
                <div>
                  <p className="font-semibold text-red-600">3. 브라우저 캐시 문제</p>
                  <p className="pl-2">→ 하드 리프레시: Ctrl+Shift+R (Windows) 또는 Cmd+Shift+R (Mac)</p>
                  <p className="pl-2">→ 또는 브라우저 쿠키 삭제</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-left text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">빠른 해결 시도:</p>
            <p>1. 브라우저 쿠키를 삭제하고 다시 시도해주세요.</p>
            <p>2. 잠시 후 다시 시도해주세요.</p>
            <p>3. 문제가 계속되면 관리자에게 문의해주세요.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            페이지 새로고침
          </button>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.open("https://vercel.com/dashboard", "_blank");
              }
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs"
          >
            Vercel 설정
          </button>
        </div>
      </div>
    </div>
  );
}

