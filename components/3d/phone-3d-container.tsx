/**
 * @file phone-3d-container.tsx
 * @description 3D 핸드폰 모델 컨테이너 컴포넌트
 *
 * 이 컴포넌트는 3D 핸드폰 모델과 화면 캡처 기능을 통합합니다.
 * 데스크톱에서만 표시되고, 모바일에서는 일반 화면을 유지합니다.
 *
 * 주요 기능:
 * 1. 반응형 처리 (데스크톱만 3D 표시)
 * 2. 홈페이지 캡처 및 텍스처 변환
 * 3. 3D 모델 렌더링
 * 4. 로딩 상태 처리
 *
 * @dependencies
 * - phone-model.tsx: 3D 핸드폰 모델
 * - phone-screen.tsx: 화면 캡처 Hook
 */

"use client";

import { useState, useEffect } from "react";
import { PhoneModel } from "./phone-model";
import { usePageTexture } from "./phone-screen";
import { LoadingSpinner } from "@/components/loading-spinner";

interface Phone3DContainerProps {
  /**
   * 캡처할 대상 요소의 CSS 선택자
   * 지정하지 않으면 document.body를 캡처합니다.
   */
  captureSelector?: string;
  /**
   * 추가 클래스명
   */
  className?: string;
}

/**
 * 3D 핸드폰 모델 컨테이너 컴포넌트
 */
export function Phone3DContainer({
  captureSelector,
  className = "",
}: Phone3DContainerProps) {
  // 즉시 실행되는 로그 (컴포넌트가 호출되는지 확인)
  console.log("🎬 [Phone3DContainer] 컴포넌트 함수 실행됨", { captureSelector, className });
  
  const [isDesktop, setIsDesktop] = useState(false);
  const { texture, isLoading } = usePageTexture(captureSelector);
  
  console.log("🔄 [Phone3DContainer] 상태 초기화 완료", { isDesktop, isLoading, hasTexture: !!texture });

  // 화면 크기 감지 (데스크톱만 3D 표시)
  useEffect(() => {
    console.log("🖥️ [Phone3DContainer] 컴포넌트 마운트됨");
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const isDesktopSize = width >= 768;
      console.log(`📏 [Phone3DContainer] 화면 크기: ${width}px, 데스크톱: ${isDesktopSize}`);
      setIsDesktop(isDesktopSize);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  // 모바일에서는 null 반환 (일반 화면 유지)
  if (!isDesktop) {
    console.log("📱 [Phone3DContainer] 모바일 화면 - 3D 모델 숨김");
    return null;
  }

  console.log(`🎨 [Phone3DContainer] 렌더링 상태 - isLoading: ${isLoading}, texture: ${texture ? "있음" : "없음"}`);

  // 로딩 중
  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center h-[600px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 ${className}`}
      >
        <div className="text-center text-white">
          <LoadingSpinner />
          <p className="mt-4 text-sm">3D 모델 준비 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-[600px] ${className}`}>
      <PhoneModel screenTexture={texture} />
    </div>
  );
}
