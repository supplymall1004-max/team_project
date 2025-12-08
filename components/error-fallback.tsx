"use client";

/**
 * @file error-fallback.tsx
 * @description 에러 바운더리용 Fallback 컴포넌트
 */

export function ErrorFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <h1 className="text-2xl font-bold text-orange-600">Clerk 인증 오류</h1>
        <p className="text-sm text-muted-foreground">
          Clerk 인증 서비스에 연결하는 중 문제가 발생했습니다.
          <br />
          <br />
          해결 방법:
          <br />
          1. 브라우저 쿠키를 삭제하고 다시 시도해주세요.
          <br />
          2. Clerk 대시보드에서 localhost:3000이 허용되었는지 확인해주세요.
          <br />
          3. 잠시 후 다시 시도해주세요.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          페이지 새로고침
        </button>
      </div>
    </div>
  );
}

