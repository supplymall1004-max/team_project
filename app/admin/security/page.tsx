/**
 * @file app/admin/security/page.tsx
 * @description 관리자 보안 설정 페이지
 *
 * 주요 기능:
 * 1. 비밀번호 변경 폼
 * 2. 2FA(MFA) 설정 관리
 * 3. 세션 관리 및 강제 로그아웃
 * 4. 보안 감사 로그 뷰어
 */

import { Suspense } from "react";
import { AdminSecurityClient } from "./security-page-client";

export default async function AdminSecurityPage() {
  // 서버 사이드에서 초기 데이터 로드 (필요시)
  // 현재는 클라이언트 컴포넌트에서 처리

  return (
    <div className="h-full">
      <Suspense fallback={<SecurityPageSkeleton />}>
        <AdminSecurityClient />
      </Suspense>
    </div>
  );
}

/**
 * 로딩 스켈레톤 컴포넌트
 */
function SecurityPageSkeleton() {
  return (
    <div className="h-full flex">
      {/* 좌측 메뉴 스켈레톤 */}
      <div className="w-64 border-r border-gray-200 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* 우측 콘텐츠 스켈레톤 */}
      <div className="flex-1 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}
























