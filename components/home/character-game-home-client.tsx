/**
 * @file components/home/character-game-home-client.tsx
 * @description 홈화면 게임 스타일 캐릭터창 클라이언트 컴포넌트
 *
 * 게임 화면과 건강 알림을 통합하여 표시합니다.
 * 게임 요소는 제거되고 건강 알림 기능만 유지됩니다.
 * 전체화면 기능 포함.
 *
 * @dependencies
 * - @/components/game/character-game-view: 게임 뷰
 * - @/components/health/health-notification-panel: 건강 알림 패널
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CharacterGameView } from "@/components/game/character-game-view";
import { ApartmentUIOverlay } from "@/components/game/threejs/apartment-ui-overlay";
import { getCharacterData } from "@/actions/health/character";
import type { CharacterData } from "@/types/character";
import { useUser } from "@clerk/nextjs";

interface CharacterGameHomeClientProps {
  cards?: any[];
  defaultMemberId?: string;
}

/**
 * 3D 모델링 뷰어만 표시하는 컴포넌트 (전체화면 기능 포함)
 */
export function CharacterGameHomeClient({
  cards,
  defaultMemberId,
}: CharacterGameHomeClientProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  // characterData 로드
  useEffect(() => {
    const loadCharacterData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getCharacterData(user.id);
        setCharacterData(data);
      } catch (error) {
        console.warn("⚠️ 캐릭터 데이터 로드 실패 (기본 데이터 사용):", error);
        // 에러가 발생해도 기본 데이터를 사용하여 UI는 계속 표시
        setCharacterData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadCharacterData();
  }, [user?.id]);

  // 전체화면 상태 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // 전체화면 진입
  const enterFullscreen = async () => {
    const element = containerRef.current;
    if (!element) return;

    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        // Safari
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        // Firefox
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        // IE/Edge
        await (element as any).msRequestFullscreen();
      }
    } catch (error) {
      console.error("전체화면 진입 실패:", error);
    }
  };

  // 전체화면 종료
  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.error("전체화면 종료 실패:", error);
    }
  };

  // 카메라 리셋 핸들러 (빈 함수 - 향후 구현)
  const handleCameraReset = () => {
    console.log("카메라 리셋");
  };

  // 알림 클릭 핸들러
  const handleNotificationClick = (notificationId: string) => {
    console.log("알림 클릭:", notificationId);
  };

  // 기본 characterData 생성 (데이터가 없을 때)
  const defaultCharacterData: CharacterData | null = characterData || (user?.id ? {
    member: {
      id: user.id,
      user_id: user.id,
      name: user.firstName || user.emailAddresses[0]?.emailAddress?.split("@")[0] || "사용자",
      clerk_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      member_type: "self",
      pet_type: null,
      birth_date: new Date().toISOString().split("T")[0],
      gender: "other",
      relationship: "self",
      height_cm: null,
      weight_kg: null,
      diseases: [],
      allergies: [],
    } as CharacterData["member"],
    basicInfo: {
      name: user.firstName || "사용자",
      age: 0,
      height_cm: null,
      weight_kg: null,
      body_fat_percentage: null,
      muscle_mass_kg: null,
      bmi: null,
    },
    importantInfo: {
      diseases: [],
      allergies: [],
      health_score: 100,
      health_status: "healthy",
    },
    medications: {
      active: [],
      todayChecked: [],
      missed: [],
    },
    checkups: {
      last: null,
      next: null,
      daysUntil: null,
    },
    vaccinations: {
      completed: [],
      scheduled: [],
      next: null,
      daysUntil: null,
    },
    deworming: {
      last: null,
      next: null,
      daysUntil: null,
      cycleDays: null,
    },
    reminders: {
      urgent: [],
      upcoming: [],
      all: [],
    },
    lifecycleNotifications: {
      high: [],
      medium: [],
      low: [],
    },
    healthTrends: {
      weight: [],
      activity: [],
      nutrition: [],
      healthScore: [],
    },
    currentEmotion: "happy",
  } : null);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full min-h-[800px]" 
      style={{ height: '100%', minHeight: '800px' }}
    >
      <CharacterGameView
        userId={user?.id || ""}
        familyMemberId={user?.id || ""}
        characterName={user?.firstName || ""}
        characterData={defaultCharacterData}
        showHUD={false}
      />
      
      {/* UI 오버레이 (알림 패널) - characterData가 있을 때만 표시 (3D 뷰어 위에 표시) */}
      {defaultCharacterData && !isLoading && (
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ 
            zIndex: 1000,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <ApartmentUIOverlay
            characterData={defaultCharacterData}
            familyMembers={[{
              id: defaultCharacterData.member.id,
              name: defaultCharacterData.member.name,
            }]}
            onCameraReset={handleCameraReset}
            onNotificationClick={handleNotificationClick}
          />
        </div>
      )}
      
      {/* 전체화면 버튼 - 오른쪽 아래 (일반 모드에서만 표시) */}
      {!isFullscreen && (
        <div 
          className="absolute bottom-4 right-4 pointer-events-auto" 
          style={{ 
            zIndex: 200,
            position: 'absolute',
          }}
        >
          <Button
            onClick={enterFullscreen}
            className="bg-black/80 hover:bg-black/90 backdrop-blur-md text-white border border-white/30 shadow-xl"
            size="icon"
            title="전체화면"
          >
            <Maximize2 className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* 뒤로가기 버튼 - 전체화면 모드에서만 표시 (오른쪽 끝) */}
      {isFullscreen && (
        <div className="fixed top-4 right-4 z-[9999] pointer-events-auto" style={{ zIndex: 9999 }}>
          <Button
            onClick={exitFullscreen}
            className="bg-black/80 hover:bg-black/90 backdrop-blur-md text-white border border-white/30 shadow-xl"
            size="icon"
            title="전체화면 종료"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      )}
      
      {/* 모델 출처 정보 - 게임창 맨 아래 (일반 모드에서만 표시) */}
      {!isFullscreen && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-50">
          <p className="text-xs text-gray-400/80 text-center px-4">
            <a 
              href="https://skfb.ly/pCV6K" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-300 underline"
            >
              "Modern apartment interior"
            </a>
            {" "}by{" "}
            <a 
              href="https://sketchfab.com/Katydid" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-300 underline"
            >
              Katydid
            </a>
            {" "}is licensed under{" "}
            <a 
              href="http://creativecommons.org/licenses/by/4.0/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-300 underline"
            >
              Creative Commons Attribution
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

