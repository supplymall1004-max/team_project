/**
 * @file hero-section.tsx
 * @description 히어로 섹션 컴포넌트 (배경 이미지/비디오 포함)
 *
 * 주요 기능:
 * 1. 슬로건 표시
 * 2. 메인 검색창 (통합 검색)
 * 3. 빠른 접근 버튼 4개
 * 4. 배경 이미지/비디오 처리
 * 5. 모바일 반응형 레이아웃
 * 6. 아이콘 그룹화 기능 (드래그 앤 드롭)
 */

"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/animations";
import { useIconGroups } from "@/hooks/use-icon-groups";
import { useHomeCustomization } from "@/hooks/use-home-customization";
import { DraggableIconCard } from "./draggable-icon-card";
import { FolderCard } from "./folder-card";
import { ExpandedFolderView } from "./expanded-folder-view";
import type { DragData } from "@/types/icon-groups";

export interface QuickStartCard {
  title: string;
  description: string;
  href: string;
  /**
   * public 경로 기반 아이콘 이미지
   * 예: "/icons/26.png"
   */
  iconSrc: string;
  color: string;
  gradient?: string; // 그라데이션 클래스 (선택적)
}

interface HeroSectionProps {
  backgroundImageUrl?: string | null;
  badgeText?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  searchPlaceholder?: string;
  searchButtonText?: string;
  quickStartCards?: QuickStartCard[];
}

export function HeroSection({
  backgroundImageUrl: propBackgroundImageUrl = null,
  badgeText = "Django Care Beta",
  title = "잊혀진 손맛을 연결하는\n디지털 식탁",
  subtitle,
  description = "궁중 레시피부터 건강 맞춤 식단까지, 세대와 세대를 넘나드는 요리 지식을 한 곳에서 경험하세요.",
  searchPlaceholder = "레시피를 검색해보세요",
  searchButtonText = "검색",
  quickStartCards: initialQuickStartCards = [
    {
      title: "레시피",
      description: "최신 레시피 모음",
      href: "/recipes",
      iconSrc: "/icons/26.png",
      color: "bg-blue-500",
      gradient: "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700",
    },
    {
      title: "궁중요리",
      description: "전통 궁중 레시피",
      href: "/royal-recipes",
      iconSrc: "/icons/21.png",
      color: "bg-amber-500",
      gradient: "bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500",
    },
    {
      title: "식단관리",
      description: "맞춤 식단 추천",
      href: "/diet",
      iconSrc: "/icons/22.png",
      color: "bg-green-500",
      gradient: "bg-gradient-to-br from-green-400 via-emerald-500 to-green-600",
    },
    {
      title: "주간식단",
      description: "7일 식단 계획",
      href: "/diet/weekly",
      iconSrc: "/icons/3.png",
      color: "bg-purple-500",
      gradient: "bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600",
    },
    {
      title: "검색",
      description: "레시피 검색",
      href: "/search",
      iconSrc: "/icons/14.png",
      color: "bg-gray-500",
      gradient: "bg-gradient-to-br from-slate-500 via-gray-600 to-slate-700",
    },
    {
      title: "건강관리",
      description: "건강 정보 확인",
      href: "/health",
      iconSrc: "/icons/11.png",
      color: "bg-red-500",
      gradient: "bg-gradient-to-br from-pink-500 via-rose-500 to-red-500",
    },
    {
      title: "식재료",
      description: "신선한 채소 정보",
      href: "/food",
      iconSrc: "/icons/25.png",
      color: "bg-emerald-500",
      gradient: "bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600",
    },
    {
      title: "음식안전",
      description: "안전한 식생활",
      href: "/foodsafety",
      iconSrc: "/icons/12.png",
      color: "bg-orange-500",
      gradient: "bg-gradient-to-br from-orange-400 via-orange-500 to-red-500",
    },
    {
      title: "요리이야기",
      description: "맛있는 이야기들",
      href: "/stories",
      iconSrc: "/icons/14.png",
      color: "bg-indigo-500",
      gradient: "bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700",
    },
  ],
}: HeroSectionProps = {}) {
  // 커스텀 설정 훅
  const { customization, isLoaded: isCustomizationLoaded } = useHomeCustomization();

  // 모든 아이콘의 title 배열
  const allIconTitles = useMemo(
    () => initialQuickStartCards.map((card) => card.title),
    [initialQuickStartCards]
  );

  // 아이콘 그룹화 훅
  const {
    state: groupState,
    isLoaded: isGroupsLoaded,
    createGroup,
    addIconToGroup,
    removeIconFromGroup,
    deleteGroup,
    renameGroup,
    getGroupIdForIcon,
    getGroup,
  } = useIconGroups(allIconTitles);

  // 드래그 상태
  const [draggingIcon, setDraggingIcon] = useState<string | null>(null);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);

  // 타이틀을 줄바꿈 기준으로 분리
  const titleLines = title.split("\n");

  // 아이콘 title로 카드 찾기
  const getCardByTitle = (title: string) => {
    return initialQuickStartCards.find((card) => card.title === title);
  };

  // 그룹화되지 않은 아이콘들
  // Hydration 오류 방지: isGroupsLoaded가 false일 때는 초기 상태 사용
  const ungroupedCards = useMemo(() => {
    // 그룹 데이터가 로드되기 전에는 모든 아이콘을 ungrouped로 표시 (서버와 동일)
    if (!isGroupsLoaded) {
      return initialQuickStartCards;
    }
    return groupState.ungroupedIcons
      .map((title) => getCardByTitle(title))
      .filter((card): card is QuickStartCard => card !== undefined);
  }, [groupState.ungroupedIcons, initialQuickStartCards, isGroupsLoaded]);

  // 드래그 시작 핸들러
  const handleDragStart = (data: DragData) => {
    console.groupCollapsed("[HeroSection] 드래그 시작");
    console.log("아이콘:", data.iconTitle);
    console.groupEnd();
    setDraggingIcon(data.iconTitle);
  };

  // 드롭 핸들러 (아이콘을 다른 아이콘 위에 드롭)
  const handleIconDrop = (draggedIconTitle: string, targetIconTitle: string) => {
    console.group("[HeroSection] 아이콘 드롭");
    console.log("드래그한 아이콘:", draggedIconTitle);
    console.log("대상 아이콘:", targetIconTitle);

    // 두 아이콘이 모두 그룹화되지 않은 상태인지 확인
    if (
      !groupState.ungroupedIcons.includes(draggedIconTitle) ||
      !groupState.ungroupedIcons.includes(targetIconTitle)
    ) {
      console.warn("두 아이콘 모두 그룹화되지 않은 상태여야 합니다.");
      console.groupEnd();
      return;
    }

    // 새 그룹 생성
    const groupId = createGroup(draggedIconTitle, targetIconTitle);
    if (groupId) {
      console.log("그룹 생성 완료:", groupId);
    }
    console.groupEnd();
  };

  // 폴더에 아이콘 드롭 핸들러
  const handleFolderDrop = (iconTitle: string, groupId: string) => {
    console.group("[HeroSection] 폴더에 아이콘 드롭");
    console.log("아이콘:", iconTitle);
    console.log("그룹 ID:", groupId);
    addIconToGroup(iconTitle, groupId);
    console.groupEnd();
  };

  // 드래그 종료 핸들러
  const handleDragEnd = () => {
    setDraggingIcon(null);
  };

  // 폴더에서 나온 아이콘의 드래그 종료 핸들러
  const handleFolderDragEnd = (e?: React.DragEvent) => {
    // 드래그 종료 시 그리드 영역 밖으로 드롭되었는지 확인
    if (e) {
      try {
        const dragDataStr = e.dataTransfer.getData("application/json");
        const fromFolder = e.dataTransfer.getData("from-folder");
        
        if (dragDataStr && fromFolder) {
          const dragData: DragData = JSON.parse(dragDataStr);
          // 드롭이 그리드 영역에서 발생하지 않았다면 폴더에서 제거
          const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
          const gridElement = dropTarget?.closest('[data-icon-grid]');
          
          if (!gridElement) {
            console.group("[HeroSection] 폴더 밖으로 아이콘 드롭 (드래그 종료)");
            console.log("아이콘:", dragData.iconTitle);
            console.log("원래 폴더:", fromFolder);
            console.groupEnd();
            
            removeIconFromGroup(dragData.iconTitle, fromFolder);
          }
        }
      } catch (error) {
        console.error("[HeroSection] 드래그 종료 데이터 파싱 실패:", error);
      }
    }
    
    setDraggingIcon(null);
  };

  // 폴더 토글 핸들러
  const handleFolderToggle = (groupId: string) => {
    setExpandedFolderId((prev) => (prev === groupId ? null : groupId));
  };

  // 폴더 삭제 핸들러
  const handleFolderDelete = (groupId: string) => {
    if (confirm("이 폴더를 삭제하시겠습니까? 폴더 내 아이콘들은 다시 개별 아이콘으로 표시됩니다.")) {
      deleteGroup(groupId);
      if (expandedFolderId === groupId) {
        setExpandedFolderId(null);
      }
    }
  };

  // 폴더 이름 변경 핸들러
  const handleFolderRename = (groupId: string, newName: string) => {
    renameGroup(groupId, newName);
  };

  // 폴더에서 아이콘 제거 핸들러
  const handleRemoveIconFromFolder = (iconTitle: string, groupId: string) => {
    removeIconFromGroup(iconTitle, groupId);
  };

  // 아이콘 클릭 핸들러
  const handleQuickStartClick = (href: string) => {
    console.groupCollapsed("[HeroSection] 빠른 카드 클릭");
    console.log("target:", href);
    console.groupEnd();
  };

  // 그리드에 표시할 아이템들 (그룹화되지 않은 아이콘 + 폴더)
  // Hydration 오류 방지: isGroupsLoaded가 false일 때는 폴더 없이 모든 아이콘만 표시
  const gridItems = useMemo(() => {
    const items: Array<{ type: "icon" | "folder"; data: QuickStartCard | typeof groupState.groups[0] }> = [];

    // 그룹화되지 않은 아이콘들
    ungroupedCards.forEach((card) => {
      items.push({ type: "icon", data: card });
    });

    // 폴더들 (그룹 데이터가 로드된 후에만 표시)
    if (isGroupsLoaded) {
      groupState.groups.forEach((group) => {
        items.push({ type: "folder", data: group });
      });
    }

    return items;
  }, [ungroupedCards, groupState.groups, isGroupsLoaded]);

  // 그룹 데이터가 로드될 때까지 로딩 표시하지 않음 (기본 렌더링 유지)

  // 배경 렌더링 로직
  const renderBackground = () => {
    if (!isCustomizationLoaded) {
      // 로딩 중일 때는 기본 그라데이션
      return (
        <div 
          className="absolute inset-0 gdweb-gradient-hero"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          }}
        />
      );
    }

    const { backgroundType, backgroundImageUrl, backgroundColor, customGradient } = customization.theme;
    const finalBackgroundImageUrl = backgroundImageUrl || propBackgroundImageUrl;

    switch (backgroundType) {
      case 'image':
        if (finalBackgroundImageUrl) {
          return (
            <div className="absolute inset-0">
              <Image
                src={finalBackgroundImageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="100vw"
                priority
                unoptimized
                onError={(e) => {
                  console.error("[HeroSection] 배경 이미지 로딩 실패:", finalBackgroundImageUrl);
                  e.currentTarget.style.display = "none";
                }}
                onLoad={() => {
                  console.log("[HeroSection] 배경 이미지 로딩 완료:", finalBackgroundImageUrl);
                }}
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          );
        }
        // 이미지가 없으면 그라데이션으로 폴백
        return (
          <div 
            className="absolute inset-0 gdweb-gradient-hero"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            }}
          />
        );

      case 'color':
        return (
          <div 
            className="absolute inset-0"
            style={{
              backgroundColor: backgroundColor || '#667eea',
            }}
          />
        );

      case 'gradient':
      default:
        return (
          <div 
            className="absolute inset-0 gdweb-gradient-hero"
            style={{
              background: customGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            }}
          />
        );
    }
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* 배경 이미지/비디오 - 커스텀 설정 적용 */}
      <div className="absolute inset-0 z-0">
        {renderBackground()}
        
        {/* 패턴 오버레이 */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)
            `,
            backgroundSize: '100px 100px',
          }}
        />
        
        {/* 오버레이 - 더 부드러운 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/20" />
      </div>

      {/* 콘텐츠 - 모바일 앱 아이콘 그리드 */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12 sm:px-6 sm:py-20">
        {/* 타이틀 섹션 - GDWEB 스타일 */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 100,
            damping: 20,
            delay: 0.2,
          }}
        >
          {/* 베타 배지 */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 150,
              damping: 25,
              mass: 1.2,
              delay: 0.4,
            }}
          >
            <div className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white border border-white/30 shadow-lg">
              {badgeText}
            </div>
          </motion.div>

          {/* 메인 타이틀 */}
          {title && (
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {titleLines.map((line, index) => (
                <span key={index} className="block">
                  {line}
                </span>
              ))}
            </motion.h1>
          )}

          {/* 서브타이틀 */}
          {subtitle && (
            <motion.p
              className="text-xl sm:text-2xl text-white/90 mb-4 font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {subtitle}
            </motion.p>
          )}

          {/* 설명 */}
          {description && (
            <motion.p
              className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              {description}
            </motion.p>
          )}
        </motion.div>

        {/* 앱 아이콘 그리드 - GDWEB 카드 스타일 (카드 크기 통일) */}
        <motion.div
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-6 max-w-4xl mx-auto items-stretch relative"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          data-icon-grid
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "move";
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const dragDataStr = e.dataTransfer.getData("application/json");
            const fromFolder = e.dataTransfer.getData("from-folder");
            
            if (dragDataStr && fromFolder) {
              try {
                const dragData: DragData = JSON.parse(dragDataStr);
                console.group("[HeroSection] 폴더 밖으로 아이콘 드롭");
                console.log("아이콘:", dragData.iconTitle);
                console.log("원래 폴더:", fromFolder);
                console.groupEnd();
                
                // 폴더에서 아이콘 제거
                removeIconFromGroup(dragData.iconTitle, fromFolder);
              } catch (error) {
                console.error("[HeroSection] 드롭 데이터 파싱 실패:", error);
              }
            }
          }}
        >
          {gridItems.map((item, index) => {
            if (item.type === "icon") {
              const card = item.data as QuickStartCard;
              const isDragging = draggingIcon === card.title;
              const folderId = getGroupIdForIcon(card.title);
              
              // 이미 그룹에 속한 아이콘은 표시하지 않음 (폴더 내부에서만 표시)
              if (folderId) {
                return null;
              }

              return (
                <div key={card.title} className="relative">
                  <DraggableIconCard
                    card={card}
                    onDragStart={handleDragStart}
                    onDrop={handleIconDrop}
                    onDragEnd={handleDragEnd}
                    isDragging={isDragging}
                    onClick={handleQuickStartClick}
                    index={index}
                  />
                </div>
              );
            } else {
              const group = item.data as typeof groupState.groups[0];
              const isExpanded = expandedFolderId === group.id;
              
              // 폴더 내부 아이콘 카드들
              const folderIconCards = group.iconTitles
                .map((title) => getCardByTitle(title))
                .filter((card): card is QuickStartCard => card !== undefined);

              return (
                <div key={group.id} className="relative">
                  <FolderCard
                    group={group}
                    iconCards={folderIconCards}
                    isExpanded={isExpanded}
                    onToggle={() => handleFolderToggle(group.id)}
                    onDrop={(iconTitle) => handleFolderDrop(iconTitle, group.id)}
                    onDelete={() => handleFolderDelete(group.id)}
                    onRename={(newName) => handleFolderRename(group.id, newName)}
                    index={index}
                  />
                  
                  {/* 확장된 폴더 뷰 */}
                  {isExpanded && (
                    <ExpandedFolderView
                      group={group}
                      iconCards={folderIconCards}
                      onClose={() => setExpandedFolderId(null)}
                      onRemoveIcon={(iconTitle) =>
                        handleRemoveIconFromFolder(iconTitle, group.id)
                      }
                      onIconClick={handleQuickStartClick}
                      onDragStart={handleDragStart}
                      onDragEnd={handleFolderDragEnd}
                      onRename={(newName) => handleFolderRename(group.id, newName)}
                    />
                  )}
                </div>
              );
            }
          })}
        </motion.div>
      </div>
    </section>
  );
}

