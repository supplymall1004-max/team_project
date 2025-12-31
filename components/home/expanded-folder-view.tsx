/**
 * @file expanded-folder-view.tsx
 * @description 확장된 폴더 뷰 컴포넌트 (폴더 내부 아이콘 표시)
 *
 * 주요 기능:
 * 1. 폴더 내부 아이콘 그리드 표시
 * 2. 아이콘 제거 기능
 * 3. 닫기 버튼
 * 4. 애니메이션 (확장/축소)
 *
 * @dependencies
 * - framer-motion: 애니메이션
 * - next/image: 이미지 표시
 * - next/link: 링크 네비게이션
 * - lucide-react: 아이콘
 * - types/icon-groups.ts: 타입 정의
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { QuickStartCard } from "./hero-section";
import type { IconGroup } from "@/types/icon-groups";
import type { DragData } from "@/types/icon-groups";

interface ExpandedFolderViewProps {
  /** 폴더 정보 */
  group: IconGroup;
  /** 폴더 내부 아이콘 데이터 */
  iconCards: QuickStartCard[];
  /** 닫기 이벤트 */
  onClose: () => void;
  /** 아이콘 제거 이벤트 */
  onRemoveIcon?: (iconTitle: string) => void;
  /** 아이콘 클릭 이벤트 */
  onIconClick?: (href: string) => void;
  /** 드래그 시작 이벤트 */
  onDragStart?: (data: DragData) => void;
  /** 드래그 종료 이벤트 */
  onDragEnd?: () => void;
  /** 폴더 이름 변경 이벤트 */
  onRename?: (newName: string) => void;
}

export function ExpandedFolderView({
  group,
  iconCards,
  onClose,
  onRemoveIcon,
  onIconClick,
  onDragStart,
  onDragEnd,
  onRename,
}: ExpandedFolderViewProps) {
  const [draggingIconTitle, setDraggingIconTitle] = useState<string | null>(null);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(group.name);
  const touchStartRef = useRef<{ x: number; y: number; time: number; iconTitle: string } | null>(null);

  // group.name이 변경되면 editedName도 동기화
  useEffect(() => {
    setEditedName(group.name);
  }, [group.name]);

  // 이름 편집 핸들러
  const handleNameEdit = () => {
    if (isEditingName && editedName.trim() && editedName !== group.name) {
      onRename?.(editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleNameEdit();
    } else if (e.key === "Escape") {
      setEditedName(group.name);
      setIsEditingName(false);
    }
  };

  // 드래그 시작 핸들러
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, card: QuickStartCard) => {
    const dragData: DragData = {
      iconTitle: card.title,
      type: "icon",
    };
    
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify(dragData));
    e.dataTransfer.setData("text/plain", card.title);
    e.dataTransfer.setData("from-folder", group.id); // 폴더에서 나온 것임을 표시
    
    console.groupCollapsed("[ExpandedFolderView] 드래그 시작");
    console.log("아이콘:", card.title);
    console.log("폴더:", group.name);
    console.groupEnd();
    
    setDraggingIconTitle(card.title);
    onDragStart?.(dragData);
  };

  // 드래그 종료 핸들러
  const handleDragEnd = () => {
    setDraggingIconTitle(null);
    setIsTouchDragging(false);
    touchStartRef.current = null;
    onDragEnd?.();
  };

  // 모바일 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, card: QuickStartCard) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      iconTitle: card.title,
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const deltaTime = Date.now() - touchStartRef.current.time;

    if ((deltaX > 10 || deltaY > 10) && deltaTime > 100) {
      setIsTouchDragging(true);
      const dragData: DragData = {
        iconTitle: touchStartRef.current.iconTitle,
        type: "icon",
      };
      onDragStart?.(dragData);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || !isTouchDragging) {
      touchStartRef.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // 그리드 영역 밖으로 드롭되었는지 확인
    const gridElement = elementBelow?.closest('[data-icon-grid]');
    if (!gridElement) {
      // 폴더 밖으로 드롭된 경우
      onRemoveIcon?.(touchStartRef.current.iconTitle);
    }

    handleDragEnd();
  };
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="fixed inset-4 sm:inset-8 md:inset-12 lg:inset-16 z-50 bg-white/98 backdrop-blur-md rounded-2xl border-2 border-blue-300 shadow-2xl p-4 sm:p-6 md:p-8"
        style={{
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 gap-4">
          {isEditingName ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleNameEdit}
                onKeyDown={handleNameKeyDown}
                className="flex-1 text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 bg-white border-2 border-blue-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                autoFocus
              />
              <p className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                Enter로 저장, Esc로 취소
              </p>
            </div>
          ) : (
            <>
              <h3 
                className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 flex-1 cursor-pointer hover:text-blue-600 transition-colors break-words pr-2"
                onClick={() => {
                  if (onRename) {
                    setIsEditingName(true);
                  }
                }}
                title={onRename ? "클릭하여 이름 편집" : undefined}
              >
                {group.name}
              </h3>
              {onRename && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingName(true);
                  }}
                  className="p-2 rounded-full hover:bg-blue-100 transition-colors flex-shrink-0 bg-white/80 backdrop-blur-sm shadow-sm"
                  title="이름 편집"
                >
                  <Edit2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </button>
              )}
            </>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
            title="닫기"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          </button>
        </div>

        {/* 아이콘 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 md:gap-8 max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-14rem)] md:max-h-[calc(100vh-16rem)] overflow-y-auto">
          {iconCards.map((card, index) => {
            const isDragging = draggingIconTitle === card.title;
            
            return (
              <motion.div
                key={card.title}
                draggable
                {...({
                  onDragStart: (e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, card),
                  onDragEnd: handleDragEnd,
                  onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => handleTouchStart(e, card),
                  onTouchMove: handleTouchMove,
                  onTouchEnd: handleTouchEnd,
                } as any)}
                data-icon-title={card.title}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: isDragging || isTouchDragging ? 0.5 : 1, 
                  scale: isDragging || isTouchDragging ? 0.9 : 1 
                }}
                transition={{
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                }}
                whileHover={{ scale: isDragging || isTouchDragging ? 0.9 : 1.05, y: isDragging || isTouchDragging ? 0 : -2 }}
                className={`relative group min-h-[140px] sm:min-h-[160px] md:min-h-[180px] ${isDragging || isTouchDragging ? "cursor-grabbing" : "cursor-grab"}`}
              >
                <Link
                  href={card.href}
                  onClick={() => {
                    if (!isTouchDragging) {
                      onIconClick?.(card.href);
                    }
                  }}
                  className="flex flex-col items-center justify-center h-full min-h-[140px] sm:min-h-[160px] md:min-h-[180px] p-4 sm:p-6 md:p-8 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all touch-none"
                  style={{
                    pointerEvents: isTouchDragging ? 'none' : 'auto',
                  }}
                >
                {/* 아이콘 */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-xl overflow-hidden shadow-md relative mb-4 sm:mb-5 md:mb-6 flex-shrink-0">
                  {card.gradient ? (
                    <div className={`absolute inset-0 ${card.gradient} opacity-90`} />
                  ) : (
                    <div className={`absolute inset-0 ${card.color} opacity-90`} />
                  )}
                  <Image
                    src={card.iconSrc}
                    alt={card.title}
                    fill
                    className="object-cover relative z-10"
                    sizes="128px"
                  />
                </div>

                {/* 제목 */}
                <h4 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 text-center line-clamp-2 leading-tight px-2">
                  {card.title}
                </h4>
              </Link>

              {/* 제거 버튼 */}
              {onRemoveIcon && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onRemoveIcon(card.title);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg z-10"
                  title="아이콘 제거"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </motion.div>
            );
          })}
        </div>

        {/* 빈 상태 */}
        {iconCards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 md:py-24 text-gray-400">
            <p className="text-base sm:text-lg md:text-xl">폴더가 비어있습니다</p>
            <p className="text-sm sm:text-base mt-2">아이콘을 드래그하여 추가하세요</p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

