/**
 * @file app/test/mfds-image-loading/page.tsx
 * @description 식약처 이미지 URL 로딩 테스트 페이지
 * 
 * 로컬 파일이 없을 때 URL로만 이미지를 로딩하는지 검사합니다.
 */

import { Suspense } from "react";
import { MfdsImageLoadingTestClient } from "./test-client";

export default function MfdsImageLoadingTestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">식약처 이미지 URL 로딩 테스트</h1>
      <p className="text-gray-600 mb-8">
        로컬 파일이 없을 때 식약처 API URL로 이미지를 로딩하는지 검사합니다.
      </p>
      
      <Suspense fallback={<div>로딩 중...</div>}>
        <MfdsImageLoadingTestClient />
      </Suspense>
    </div>
  );
}







