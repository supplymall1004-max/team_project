/**
 * @file earth-section-server.tsx
 * @description 서버 컴포넌트로 지구동화 섹션을 렌더링
 * 
 * 클라이언트 컴포넌트에서 사용하기 위한 서버 컴포넌트 래퍼
 * StorybookSection과 동일한 스타일의 간단한 카드 형태로 표시
 */

import { EarthSection } from "./earth-section";

export function EarthSectionServer() {
  return <EarthSection />;
}

