/**
 * @file reversal-section-server.tsx
 * @description 서버 컴포넌트로 반전동화 섹션을 렌더링
 * 
 * 클라이언트 컴포넌트에서 사용하기 위한 서버 컴포넌트 래퍼
 * StorybookSection과 동일한 스타일의 간단한 카드 형태로 표시
 */

import { ReversalSection } from "./reversal-section";

export function ReversalSectionServer() {
  return <ReversalSection />;
}

