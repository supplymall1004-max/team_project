/**
 * @file intro-video.tsx
 * @description 앱 시작 시 3초 동안 재생되는 인트로 동영상 컴포넌트
 *
 * 주요 기능:
 * 1. 앱 첫 실행 시 동영상 자동 재생
 * 2. 3초 후 또는 동영상 종료 시 자동으로 메인 콘텐츠 표시
 * 3. 동영상 재생 중에는 메인 콘텐츠 숨김
 *
 * 핵심 구현 로직:
 * - useState로 동영상 표시 상태 관리
 * - useEffect로 동영상 재생 및 타이머 설정
 * - 동영상이 끝나거나 3초가 지나면 메인 콘텐츠 표시
 *
 * @dependencies
 * - react: useState, useEffect
 */

"use client";

import { useState, useEffect, useRef } from "react";

export function IntroVideo({ children }: { children: React.ReactNode }) {
  // 초기 상태를 true로 설정하여 서버 사이드에서도 검은 화면 표시
  const [showVideo, setShowVideo] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 클라이언트 마운트 확인
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 로컬 스토리지 체크 및 동영상 표시 여부 결정
  useEffect(() => {
    if (!isMounted) return;

    console.group("🎬 인트로 동영상 초기화");
    console.log("동영상 컴포넌트 마운트됨");

    // 먼저 로컬 스토리지에서 이미 본 경우 체크
    try {
      const hasSeenIntro = typeof window !== "undefined" && localStorage.getItem("hasSeenIntro");
      if (hasSeenIntro === "true") {
        console.log("이미 인트로를 본 사용자, 스킵");
        setShowVideo(false);
        setIsVideoReady(false);
        // body 스크롤 복원
        document.body.style.overflow = "";
        console.groupEnd();
        return;
      }
      
      // 첫 방문 시 동영상 표시 (최대 3초 타임아웃 설정)
      console.log("첫 방문 사용자, 동영상 표시 (최대 3초)");
      setShowVideo(true);
      // body 스크롤 즉시 차단
      document.body.style.overflow = "hidden";
      
      // 안전장치: 최대 3초 후 자동으로 메인 콘텐츠 표시 (무한 로딩 방지)
      const safetyTimeout = setTimeout(() => {
        if (showVideo) {
          console.warn("⚠️ 인트로 동영상 안전장치 타임아웃 (3초) - 메인 콘텐츠 표시");
          setShowVideo(false);
          if (typeof window !== "undefined") {
            localStorage.setItem("hasSeenIntro", "true");
          }
          document.body.style.overflow = "";
        }
      }, 3000);
      
      return () => {
        clearTimeout(safetyTimeout);
      };
    } catch (error) {
      console.error("로컬 스토리지 접근 오류:", error);
      // 오류 발생 시 동영상 표시하지 않음
      setShowVideo(false);
      document.body.style.overflow = "";
      console.groupEnd();
    }
  }, [isMounted, showVideo]);

  // 동영상 표시 시 body 스크롤 및 배경색 제어
  useEffect(() => {
    if (showVideo && isMounted) {
      // 동영상 표시 시 body 스크롤 막기 및 배경색 검은색으로
      document.body.style.overflow = "hidden";
      document.body.style.backgroundColor = "#000000";
      console.log("동영상 표시 중 - body 스크롤 차단 및 배경색 변경");
    } else {
      // 동영상 숨김 시 body 스크롤 및 배경색 복원
      document.body.style.overflow = "";
      document.body.style.backgroundColor = "";
    }

    return () => {
      // 컴포넌트 언마운트 시 body 스크롤 및 배경색 복원
      document.body.style.overflow = "";
      document.body.style.backgroundColor = "";
    };
  }, [showVideo, isMounted]);

  // 동영상이 렌더링된 후 재생 로직 실행
  useEffect(() => {
    if (!showVideo || !isMounted) return;

    console.log("동영상 요소 초기화 시작");
    
    // 동영상 요소가 준비될 때까지 대기
    const checkAndSetup = () => {
      const video = videoRef.current;
      if (!video) {
        return null;
      }

      console.log("✅ 동영상 요소 찾음");

      // 동영상 재생 시작 시점 기록
      let playStartTime: number | null = null;

      // 동영상 로드 완료 시 재생 시작
      const handleCanPlay = () => {
        console.log("동영상 로드 완료, 재생 시작");
        setIsVideoReady(true);
        
        video
          .play()
          .then(() => {
            console.log("✅ 동영상 재생 성공");
            // 재생 시작 시점 기록
            playStartTime = Date.now();
            
            // 재생 시작 시점부터 정확히 3초 후에 숨김
            timerRef.current = setTimeout(() => {
              console.log("3초 재생 완료, 메인 콘텐츠 표시");
              if (video && !video.ended) {
                video.pause();
              }
              setShowVideo(false);
              // 첫 방문 시에만 로컬 스토리지에 저장
              if (typeof window !== "undefined") {
                localStorage.setItem("hasSeenIntro", "true");
              }
            }, 3000);
          })
          .catch((error) => {
            console.error("❌ 동영상 재생 실패:", error);
            // 재생 실패 시 즉시 메인 콘텐츠 표시 (무한 로딩 방지)
            console.log("재생 실패로 인한 즉시 메인 콘텐츠 표시");
            setShowVideo(false);
            if (typeof window !== "undefined") {
              localStorage.setItem("hasSeenIntro", "true");
            }
          });
      };

      // 동영상 로드 에러 처리 (새 기기에서 파일이 없거나 로드 실패 시)
      const handleError = () => {
        console.error("❌ 동영상 로드 에러 발생");
        // 에러 발생 시 즉시 메인 콘텐츠 표시 (무한 로딩 방지)
        setShowVideo(false);
        if (typeof window !== "undefined") {
          localStorage.setItem("hasSeenIntro", "true");
        }
      };

      // 동영상 종료 시 메인 콘텐츠 표시 (동영상이 3초보다 짧은 경우)
      const handleEnded = () => {
        console.log("동영상 재생 완료 (3초 미만), 메인 콘텐츠 표시");
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        setShowVideo(false);
        // 첫 방문 시에만 로컬 스토리지에 저장
        if (typeof window !== "undefined") {
          localStorage.setItem("hasSeenIntro", "true");
        }
      };

      video.addEventListener("canplay", handleCanPlay);
      video.addEventListener("ended", handleEnded);
      video.addEventListener("error", handleError);

      return () => {
        console.log("인트로 동영상 컴포넌트 정리 작업");
        video.removeEventListener("canplay", handleCanPlay);
        video.removeEventListener("ended", handleEnded);
        video.removeEventListener("error", handleError);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        console.groupEnd();
      };
    };

    // 동영상 요소가 준비될 때까지 짧은 간격으로 확인
    let cleanup: (() => void) | null = null;
    let setupAttempts = 0;
    const maxSetupAttempts = 20; // 최대 20회 시도 (1초)
    
    const intervalId = setInterval(() => {
      setupAttempts++;
      const result = checkAndSetup();
      if (result) {
        cleanup = result;
        clearInterval(intervalId);
      } else if (setupAttempts >= maxSetupAttempts) {
        // 최대 시도 횟수 초과 시 타임아웃
        clearInterval(intervalId);
        console.warn("동영상 요소를 찾을 수 없습니다. 타임아웃 - 메인 콘텐츠 표시");
        setShowVideo(false);
        if (typeof window !== "undefined") {
          localStorage.setItem("hasSeenIntro", "true");
        }
      }
    }, 50);

    // 최대 2초 대기 후 타임아웃 (안전장치)
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      if (showVideo) {
        console.warn("동영상 초기화 타임아웃 - 메인 콘텐츠 표시");
        setShowVideo(false);
        if (typeof window !== "undefined") {
          localStorage.setItem("hasSeenIntro", "true");
        }
      }
    }, 2000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (cleanup) {
        cleanup();
      }
    };
  }, [showVideo, isMounted]);

  // 동영상이 표시되는 동안 children을 완전히 숨김
  return (
    <>
      {/* 동영상이 표시되는 동안 children을 완전히 숨김 */}
      {!showVideo && (
        <div>
          {children}
        </div>
      )}
      {/* 동영상 오버레이 - 항상 최상위에 표시 (서버 사이드에서도 표시) */}
      {showVideo && (
        <div
          className="fixed inset-0 z-[99999] bg-black flex items-center justify-center"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 99999,
            backgroundColor: "#000000"
          }}
        >
          {isMounted && (
            <video
              ref={videoRef}
              src="/icons/intro.mp4"
              className="w-full h-full object-contain"
              muted
              playsInline
              preload="auto"
              autoPlay
              onError={(e) => {
                console.error("❌ 동영상 로드 에러 (onError 핸들러):", e);
                // 에러 발생 시 즉시 메인 콘텐츠 표시
                setShowVideo(false);
                if (typeof window !== "undefined") {
                  localStorage.setItem("hasSeenIntro", "true");
                }
              }}
            />
          )}
          {!isVideoReady && isMounted && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-lg">로딩 중...</div>
              {/* 안전장치: 3초 후 자동으로 메인 콘텐츠 표시 */}
              <div className="absolute bottom-4 text-white text-xs opacity-50">
                로딩이 오래 걸리면 페이지를 새로고침해주세요
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
