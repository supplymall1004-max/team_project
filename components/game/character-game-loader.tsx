/**
 * @file components/game/character-game-loader.tsx
 * @description Unity WebGL 게임 로더 컴포넌트
 *
 * Unity WebGL 게임을 로드하고 초기화하는 컴포넌트입니다.
 *
 * @dependencies
 * - Unity WebGL 빌드 파일
 * - @/lib/game/character-game-bridge: Unity-React 브릿지
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { getCharacterGameBridge } from "@/lib/game/character-game-bridge";
import type { UnityInstance } from "@/lib/game/character-game-bridge";

interface CharacterGameLoaderProps {
  onLoadComplete?: (instance: UnityInstance) => void;
  onLoadError?: (error: Error) => void;
  buildPath?: string;
  buildName?: string;
}

/**
 * Unity WebGL 게임 로더 컴포넌트
 */
export function CharacterGameLoader({
  onLoadComplete,
  onLoadError,
  buildPath = "/game/unity-build",
  buildName = "CharacterGame",
}: CharacterGameLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const unityInstanceRef = useRef<UnityInstance | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    console.group("[CharacterGameLoader] Unity 게임 로드 시작");
    console.log("buildPath:", buildPath);
    console.log("buildName:", buildName);

    // Unity 로더 스크립트 동적 로드
    const loadUnity = async () => {
      try {
        // 먼저 Unity 빌드 파일 존재 여부 확인
        const loaderUrl = `${buildPath}/Build/${buildName}.loader.js`;
        console.log("Unity 로더 스크립트 URL:", loaderUrl);

        // 파일 존재 여부 확인
        try {
          const response = await fetch(loaderUrl, { method: "HEAD" });
          if (!response.ok) {
            // 파일이 없으면 경고만 표시하고 에러 콜백 호출
            console.warn("⚠️ Unity 빌드 파일을 찾을 수 없습니다:", loaderUrl);
            const err = new Error(
              `Unity 빌드 파일을 찾을 수 없습니다.\n\nUnity 게임이 아직 빌드되지 않았거나 경로가 잘못되었습니다.\n게임 이벤트 시스템은 Unity 없이도 작동합니다.\n\n경로: ${loaderUrl}`
            );
            setError(err.message);
            setLoading(false);
            onLoadError?.(err);
            return;
          }
        } catch (fetchError) {
          // 네트워크 오류 또는 파일 없음 - 경고만 표시하고 에러 콜백 호출
          console.warn("⚠️ Unity 빌드 파일 확인 실패:", fetchError);
          const err = new Error(
            `Unity 빌드 파일을 찾을 수 없습니다.\n\nUnity 게임이 아직 빌드되지 않았거나 경로가 잘못되었습니다.\n게임 이벤트 시스템은 Unity 없이도 작동합니다.\n\n경로: ${loaderUrl}`
          );
          setError(err.message);
          setLoading(false);
          onLoadError?.(err);
          return;
        }

        // Unity 로더 스크립트 동적 로드
        const loaderScript = document.createElement("script");
        loaderScript.src = loaderUrl;
        loaderScript.async = true;

        loaderScript.onload = () => {
          console.log("✅ Unity 로더 스크립트 로드 완료");

          // Unity 인스턴스 생성
          // @ts-ignore
          if (typeof window.createUnityInstance === "function") {
            console.log("Unity 인스턴스 생성 시작...");
            // @ts-ignore
            window
              .createUnityInstance(canvasRef.current, {
                dataUrl: `${buildPath}/Build/${buildName}.data`,
                frameworkUrl: `${buildPath}/Build/${buildName}.framework.js`,
                codeUrl: `${buildPath}/Build/${buildName}.wasm`,
                streamingAssetsUrl: `${buildPath}/StreamingAssets`,
                companyName: "HealthGame",
                productName: "Character Game",
                productVersion: "1.0.0",
              })
              .then((instance: UnityInstance) => {
                console.log("✅ Unity 인스턴스 생성 완료");
                unityInstanceRef.current = instance;

                // 브릿지에 Unity 인스턴스 설정
                const bridge = getCharacterGameBridge();
                bridge.setUnityInstance(instance);

                setLoading(false);
                onLoadComplete?.(instance);
              })
              .catch((err: Error) => {
                console.error("❌ Unity 인스턴스 생성 실패:", err);
                setError(
                  `Unity 게임 로드 실패: ${err.message}\n\n게임 이벤트 시스템은 Unity 없이도 작동합니다.`
                );
                setLoading(false);
                onLoadError?.(err);
              });
          } else {
            throw new Error("Unity 로더 함수를 찾을 수 없습니다.");
          }
        };

        loaderScript.onerror = () => {
          const err = new Error(
            `Unity 로더 스크립트를 로드할 수 없습니다.\n\n경로: ${loaderUrl}\n\nUnity 게임이 아직 빌드되지 않았거나 경로가 잘못되었습니다.\n게임 이벤트 시스템은 Unity 없이도 작동합니다.`
          );
          console.error("❌ Unity 로더 스크립트 로드 실패:", err);
          setError(err.message);
          setLoading(false);
          onLoadError?.(err);
        };

        document.body.appendChild(loaderScript);
      } catch (error) {
        console.error("❌ Unity 로드 실패:", error);
        const err = error instanceof Error ? error : new Error("알 수 없는 오류");
        setError(err.message);
        setLoading(false);
        onLoadError?.(err);
      }
    };

    loadUnity();

    return () => {
      // 정리
      if (unityInstanceRef.current) {
        unityInstanceRef.current.Quit();
      }
      const bridge = getCharacterGameBridge();
      bridge.cleanup();
    };
  }, [buildPath, buildName, onLoadComplete, onLoadError]);

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-900 to-black text-white p-8">
        <div className="text-center max-w-md space-y-4">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-yellow-400 mb-2">Unity 게임 로드 실패</h3>
            <p className="text-sm text-gray-400 whitespace-pre-line">{error}</p>
          </div>
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4 text-left">
            <p className="text-sm text-blue-300 font-semibold mb-2">💡 안내</p>
            <ul className="text-xs text-blue-200 space-y-1 list-disc list-inside">
              <li>게임 이벤트 시스템은 Unity 없이도 정상 작동합니다.</li>
              <li>약물 복용, 분유 시간, 생애주기 이벤트 알림이 계속 작동합니다.</li>
              <li>Unity 게임을 추가하려면 Unity 프로젝트를 빌드하여 배치하세요.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-center text-white">
            <div className="mb-4">게임 로딩 중... {Math.round(progress * 100)}%</div>
            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

