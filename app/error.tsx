"use client";

/**
 * @file error.tsx
 * @description Next.js 에러 페이지 컴포넌트
 * 
 * 서버 컴포넌트나 레이아웃에서 발생한 에러를 표시합니다.
 */

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러를 콘솔에 기록
    console.error("❌ [Error Boundary] 에러 발생:", error);
    console.error("❌ 에러 메시지:", error.message);
    console.error("❌ 에러 스택:", error.stack);
    if (error.digest) {
      console.error("❌ 에러 다이제스트:", error.digest);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <h1 className="text-2xl font-bold text-red-600">오류가 발생했습니다</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
          <p className="text-sm text-red-800 font-semibold mb-2">에러 메시지:</p>
          <p className="text-sm text-red-700 font-mono break-all">{error.message}</p>
          {process.env.NODE_ENV === "development" && error.stack && (
            <details className="mt-4">
              <summary className="text-xs text-red-600 cursor-pointer">스택 트레이스 보기</summary>
              <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-60 whitespace-pre-wrap">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
        <button
          onClick={reset}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}













