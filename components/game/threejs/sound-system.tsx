/**
 * @file components/game/threejs/sound-system.tsx
 * @description 사운드 시스템
 *
 * 배경음악 및 효과음을 관리합니다.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

interface SoundSystemProps {
  enabled?: boolean;
  volume?: number;
}

/**
 * 사운드 시스템 컴포넌트
 */
export function SoundSystem({ enabled = true, volume = 0.5 }: SoundSystemProps) {
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const soundEffectsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // 사운드 로드
  useEffect(() => {
    if (!enabled) return;

    // 배경음악 (선택적 - 실제 파일이 있을 때만)
    // backgroundMusicRef.current = new Audio('/sounds/background-music.mp3');
    // backgroundMusicRef.current.loop = true;
    // backgroundMusicRef.current.volume = volume;

    // 효과음들
    const soundFiles: Record<string, string> = {
      click: "/sounds/click.mp3",
      success: "/sounds/success.mp3",
      notification: "/sounds/notification.mp3",
      levelup: "/sounds/levelup.mp3",
    };

    Object.entries(soundFiles).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.volume = volume;
      soundEffectsRef.current.set(key, audio);
    });

    setSoundsLoaded(true);

    return () => {
      // 정리
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current = null;
      }
      soundEffectsRef.current.forEach((audio) => {
        audio.pause();
      });
      soundEffectsRef.current.clear();
    };
  }, [enabled, volume]);

  // 배경음악 재생
  useEffect(() => {
    if (enabled && backgroundMusicRef.current && soundsLoaded) {
      backgroundMusicRef.current.play().catch((error) => {
        console.log("배경음악 재생 실패 (파일이 없을 수 있음):", error);
      });
    }
  }, [enabled, soundsLoaded]);

  // 효과음 재생 함수 (전역으로 사용 가능하도록)
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).playGameSound = (soundName: string) => {
        const audio = soundEffectsRef.current.get(soundName);
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch((error) => {
            console.log(`효과음 재생 실패 (${soundName}):`, error);
          });
        }
      };
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).playGameSound;
      }
    };
  }, [soundsLoaded]);

  return null; // 시각적 요소 없음
}

/**
 * 효과음 재생 헬퍼 함수
 */
export function playSound(soundName: string) {
  if (typeof window !== "undefined" && (window as any).playGameSound) {
    (window as any).playGameSound(soundName);
  }
}

