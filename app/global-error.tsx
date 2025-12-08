"use client";

/**
 * @file global-error.tsx
 * @description Next.js 전역 에러 페이지 컴포넌트
 * 
 * 루트 레이아웃에서 발생한 에러를 처리합니다.
 */

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러를 콘솔에 기록
    console.error("❌ [Global Error Boundary] 심각한 에러 발생:", error);
    console.error("❌ 에러 메시지:", error.message);
    console.error("❌ 에러 스택:", error.stack);
    if (error.digest) {
      console.error("❌ 에러 다이제스트:", error.digest);
    }
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full space-y-4 text-center">
            <h1 className="text-3xl font-bold text-red-600">심각한 오류가 발생했습니다</h1>
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 text-left">
              <p className="text-sm text-red-800 font-semibold mb-2">에러 메시지:</p>
              <p className="text-sm text-red-700 font-mono break-all mb-4">{error.message}</p>
              {process.env.NODE_ENV === "development" && error.stack && (
                <details className="mt-4">
                  <summary className="text-xs text-red-600 cursor-pointer font-semibold">
                    스택 트레이스 보기
                  </summary>
                  <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-60 whitespace-pre-wrap bg-white p-2 rounded border">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                다시 시도
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                홈으로
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}













