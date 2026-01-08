/**
 * @file phone-screen.tsx
 * @description 홈페이지 화면을 텍스처로 변환하는 컴포넌트
 *
 * 이 컴포넌트는 현재 홈페이지를 html2canvas로 캡처하여 Three.js 텍스처로 변환합니다.
 *
 * 주요 기능:
 * 1. html2canvas를 사용하여 홈페이지 캡처
 * 2. 캡처된 이미지를 Three.js 텍스처로 변환
 * 3. 텍스처 업데이트 처리
 *
 * @dependencies
 * - html2canvas: 화면 캡처
 * - three: 텍스처 생성
 */

"use client";

import { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import html2canvas from "html2canvas";

/**
 * 현재 페이지를 직접 캡처하여 텍스처로 변환하는 Hook
 */
export function usePageTexture(targetSelector?: string) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const captureAttemptedRef = useRef(false);

  useEffect(() => {
    console.log("🚀 [PhoneScreen] usePageTexture 훅 실행됨", {
      targetSelector,
    });

    // 중복 캡처 방지
    if (captureAttemptedRef.current) {
      console.log("⏭️ [PhoneScreen] 이미 캡처 시도됨, 건너뜀");
      return;
    }
    captureAttemptedRef.current = true;
    console.log("✅ [PhoneScreen] 캡처 시도 시작");

    // 폴백 텍스처 생성 함수
    const createFallbackTexture = () => {
      console.log("🔄 [PhoneScreen] 폴백 텍스처 생성 중...");
      const canvas = document.createElement("canvas");
      canvas.width = 440;
      canvas.height = 960;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // 그라데이션 배경
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(1, "#f3f4f6");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 로고/텍스트
        ctx.fillStyle = "#1f2937";
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("장고", canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = "16px sans-serif";
        ctx.fillText(
          "Flavor Archive",
          canvas.width / 2,
          canvas.height / 2 + 20,
        );

        const newTexture = new THREE.Texture(canvas);
        newTexture.needsUpdate = true;
        newTexture.minFilter = THREE.LinearFilter;
        newTexture.magFilter = THREE.LinearFilter;
        setTexture(newTexture);
        console.log("✅ [PhoneScreen] 폴백 텍스처 생성 완료");
      }
      setIsLoading(false);
    };

    const capturePage = async () => {
      try {
        console.group("📸 [PhoneScreen] 페이지 캡처 시작");
        console.log(`🎯 선택자: ${targetSelector || "document.body"}`);
        setIsLoading(true);

        // 캡처할 대상 요소 선택
        let targetElement: HTMLElement | null = null;

        if (targetSelector) {
          targetElement = document.querySelector(targetSelector) as HTMLElement;
          console.log(
            `🔍 선택자 "${targetSelector}" 검색 결과:`,
            targetElement ? "✅ 찾음" : "❌ 없음",
          );

          if (!targetElement) {
            // 대체 선택자 시도
            console.log(
              "⚠️ [PhoneScreen] 지정된 선택자를 찾을 수 없습니다. document.body로 대체합니다.",
            );
            targetElement = document.body;
          }
        } else {
          targetElement = document.body;
          console.log("📄 document.body 사용");
        }

        if (!targetElement) {
          console.error(
            "❌ [PhoneScreen] 캡처 대상 요소를 찾을 수 없습니다. 폴백 텍스처를 생성합니다.",
          );
          console.groupEnd();
          createFallbackTexture();
          return;
        }

        console.log(
          `📐 요소 크기: ${targetElement.offsetWidth}x${targetElement.offsetHeight}`,
        );

        // html2canvas로 캡처 (성능 최적화 옵션 적용)
        console.log("🎨 html2canvas 캡처 시작...");
        const canvas = await html2canvas(targetElement, {
          width: 440, // 핸드폰 화면 너비
          height: 960, // 핸드폰 화면 높이
          scale: 1,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
          removeContainer: true, // 성능 최적화
          imageTimeout: 0, // 이미지 타임아웃 비활성화
        });

        console.log("✅ [PhoneScreen] 페이지 캡처 완료");
        console.log(`📊 캔버스 크기: ${canvas.width}x${canvas.height}`);

        // Three.js 텍스처 생성
        const newTexture = new THREE.Texture(canvas);
        newTexture.needsUpdate = true;
        newTexture.minFilter = THREE.LinearFilter;
        newTexture.magFilter = THREE.LinearFilter;
        newTexture.format = THREE.RGBAFormat;

        setTexture(newTexture);
        setIsLoading(false);
        console.log("✅ [PhoneScreen] 텍스처 생성 완료");
        console.groupEnd();
      } catch (error) {
        console.error("❌ [PhoneScreen] 페이지 캡처 실패:", error);
        console.error(
          "❌ [PhoneScreen] 에러 상세:",
          error instanceof Error ? error.message : String(error),
        );
        console.groupEnd();
        createFallbackTexture();
      }
    };

    // 페이지 로드 완료 후 캡처 (약간의 지연을 두어 렌더링 완료 대기)
    // 요소가 렌더링될 때까지 대기하기 위해 여러 번 시도
    let attemptCount = 0;
    const maxAttempts = 5; // 최대 5번 시도 (약 7.5초)
    let timeoutId: NodeJS.Timeout | null = null;

    const tryCapture = () => {
      attemptCount++;
      console.log(`🔄 [PhoneScreen] 캡처 시도 ${attemptCount}/${maxAttempts}`);

      if (targetSelector) {
        const element = document.querySelector(targetSelector);
        if (element) {
          console.log(`✅ [PhoneScreen] 요소 찾음, 캡처 시작`);
          capturePage();
        } else if (attemptCount >= maxAttempts) {
          console.warn(
            `⚠️ [PhoneScreen] 최대 시도 횟수 도달 (${maxAttempts}회). 요소를 찾지 못했습니다. 폴백 텍스처를 생성합니다.`,
          );
          createFallbackTexture();
        } else {
          // 요소가 아직 없으면 1.5초 후 다시 시도
          console.log(
            `⏳ [PhoneScreen] 요소를 찾지 못했습니다. 1.5초 후 재시도...`,
          );
          timeoutId = setTimeout(tryCapture, 1500);
        }
      } else {
        // 선택자가 없으면 바로 캡처
        console.log(`📄 [PhoneScreen] 선택자 없음, 바로 캡처 시작`);
        capturePage();
      }
    };

    // 첫 시도는 약간의 지연 후
    const timer = setTimeout(tryCapture, 500);

    return () => {
      clearTimeout(timer);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [targetSelector]);

  return { texture, isLoading };
}
