/**
 * @file app/test/mfds-image-url/page.tsx
 * @description 식약처 API 이미지 URL 직접 로드 테스트 페이지
 * 
 * 이 페이지는 식약처 API에서 받은 이미지 URL로 직접 이미지를 가져올 수 있는지 테스트합니다.
 */

import { Suspense } from "react";
import { MfdsImageUrlTestClient } from "./test-client";

export default function MfdsImageUrlTestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">식약처 이미지 URL 테스트</h1>
      <p className="text-gray-600 mb-8">
        식약처 API에서 받은 이미지 URL로 직접 이미지를 가져올 수 있는지 테스트합니다.
      </p>
      
      <Suspense fallback={<div>로딩 중...</div>}>
        <MfdsImageUrlTestClient />
      </Suspense>
    </div>
  );
}

