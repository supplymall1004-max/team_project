/**
 * @file draggable-icon-card.tsx
 * @description 드래그 가능한 아이콘 카드 컴포넌트
 *
 * 주요 기능:
 * 1. HTML5 드래그 앤 드롭 API 사용
 * 2. 드래그 시작/진행/종료 이벤트 처리
 * 3. 드래그 중 시각적 피드백
 * 4. 드롭 가능 영역 감지
 *
 * @dependencies
 * - framer-motion: 애니메이션
 * - next/image: 이미지 표시
 * - next/link: 링크 네비게이션
 * - types/icon-groups.ts: 타입 정의
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import type { QuickStartCard, IconCategory } from "./hero-section";
import type { DragData } from "@/types/icon-groups";

interface DraggableIconCardProps {
  /** 카드 데이터 */
  card: QuickStartCard;
  /** 드래그 시작 이벤트 */
  onDragStart?: (data: DragData) => void;
  /** 드롭 이벤트 (다른 아이콘 위에 드롭) */
  onDrop?: (draggedIconTitle: string, targetIconTitle: string) => void;
  /** 드래그 종료 이벤트 */
  onDragEnd?: () => void;
  isDragging?: boolean;
  canDrop?: boolean;
  onClick?: (href: string) => void;
  /** 롱 프레스 이벤트 (3초 이상 클릭) */
  onLongPress?: (card: QuickStartCard) => void;
  index?: number;
}

export function DraggableIconCard({
  card,
  onDragStart,
  onDrop,
  onDragEnd,
  isDragging = false,
  canDrop = false,
  onClick,
  onLongPress,
  index = 0,
}: DraggableIconCardProps) {
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [isClicked, setIsClicked] = useState(false); // 클릭 상태 추가
  const [longPressProgress, setLongPressProgress] = useState(0); // 롱프레스 진행률 (0-100)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressProgressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mouseDownTimeRef = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const dragData: DragData = {
      iconTitle: card.title,
      type: "icon",
    };
    
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify(dragData));
    e.dataTransfer.setData("text/plain", card.title); // 호환성을 위한 텍스트 데이터
    
    // 드래그 중 이미지 설정 (선택적)
    if (e.dataTransfer.setDragImage) {
      try {
        const dragImage = document.createElement("div");
        dragImage.style.position = "absolute";
        dragImage.style.top = "-1000px";
        dragImage.innerHTML = card.title;
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 0, 0);
        setTimeout(() => {
          try {
            if (dragImage.parentNode) {
              document.body.removeChild(dragImage);
            }
          } catch (err) {
            // 이미 제거되었거나 없는 경우 무시
          }
        }, 0);
      } catch (err) {
        // 드래그 이미지 설정 실패 시 무시
      }
    }
    
    console.groupCollapsed("[DraggableIconCard] 드래그 시작");
    console.log("아이콘:", card.title);
    console.groupEnd();
    
    onDragStart?.(dragData);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    
    // 드래그 오버 상태는 드래그 중인 아이콘이 다른 아이콘인 경우로 판단
    // isDragging prop이 true이고 현재 카드가 드래그 중인 카드가 아닌 경우
    if (isDragging) {
      setIsDraggedOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggedOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggedOver(false);
    
    const dragDataStr = e.dataTransfer.getData("application/json");
    if (dragDataStr) {
      try {
        const dragData: DragData = JSON.parse(dragDataStr);
        if (dragData.iconTitle !== card.title && dragData.type === "icon") {
          console.group("[DraggableIconCard] 드롭 완료");
          console.log("드래그한 아이콘:", dragData.iconTitle);
          console.log("대상 아이콘:", card.title);
          console.groupEnd();
          
          onDrop?.(dragData.iconTitle, card.title);
        }
      } catch (error) {
        console.error("[DraggableIconCard] 드롭 데이터 파싱 실패:", error);
      }
    }
  };

  const handleDragEnd = () => {
    setIsDraggedOver(false);
    console.groupCollapsed("[DraggableIconCard] 드래그 종료");
    console.log("아이콘:", card.title);
    console.groupEnd();
    
    onDragEnd?.();
  };

  const handleClick = (e?: React.MouseEvent<HTMLAnchorElement>) => {
    // 터치 드래그 중이면 클릭 무시
    if (isTouchDragging) {
      e?.preventDefault();
      return;
    }
    
    // 롱 프레스가 발생했다면 일반 클릭 무시
    if (mouseDownTimeRef.current && Date.now() - mouseDownTimeRef.current >= 3000) {
      mouseDownTimeRef.current = null;
      e?.preventDefault();
      return;
    }
    
    setIsClicked(true); // 클릭 시 네온 효과 활성화
    setTimeout(() => setIsClicked(false), 500); // 0.5초 후 비활성화

    // onClick prop이 있으면 호출하지만, Link의 기본 동작은 막지 않음
    if (onClick) {
      onClick(card.href);
    }
    
    // Link의 기본 동작은 그대로 유지 (이벤트 전파 허용)
  };

  // 마우스 다운 핸들러 (롱 프레스 감지)
  const handleMouseDown = () => {
    mouseDownTimeRef.current = Date.now();
    setLongPressProgress(0);
    
    // 진행률 업데이트 (100ms마다)
    const startTime = Date.now();
    longPressProgressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 3000) * 100, 100);
      setLongPressProgress(progress);
    }, 50);
    
    longPressTimerRef.current = setTimeout(() => {
      if (onLongPress) {
        onLongPress(card);
      }
      setLongPressProgress(0);
      mouseDownTimeRef.current = null;
      if (longPressProgressTimerRef.current) {
        clearInterval(longPressProgressTimerRef.current);
        longPressProgressTimerRef.current = null;
      }
    }, 3000); // 3초
  };

  // 마우스 업 핸들러
  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (longPressProgressTimerRef.current) {
      clearInterval(longPressProgressTimerRef.current);
      longPressProgressTimerRef.current = null;
    }
    setLongPressProgress(0);
    mouseDownTimeRef.current = null;
  };

  // 마우스 리브 핸들러 (마우스가 영역을 벗어나면 타이머 취소)
  const handleMouseLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (longPressProgressTimerRef.current) {
      clearInterval(longPressProgressTimerRef.current);
      longPressProgressTimerRef.current = null;
    }
    setLongPressProgress(0);
    mouseDownTimeRef.current = null;
  };

  // 모바일 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    
    setLongPressProgress(0);
    
    // 진행률 업데이트 (50ms마다)
    const startTime = Date.now();
    longPressProgressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 3000) * 100, 100);
      setLongPressProgress(progress);
    }, 50);
    
    // 롱 프레스 타이머 시작
    longPressTimerRef.current = setTimeout(() => {
      if (onLongPress) {
        onLongPress(card);
      }
      setLongPressProgress(0);
      if (longPressProgressTimerRef.current) {
        clearInterval(longPressProgressTimerRef.current);
        longPressProgressTimerRef.current = null;
      }
    }, 3000); // 3초
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || e.touches.length === 0) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const deltaTime = Date.now() - touchStartRef.current.time;

    // 일정 거리 이상 이동하면 롱 프레스 타이머 취소 및 드래그 시작
    if ((deltaX > 10 || deltaY > 10) && deltaTime > 100) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (longPressProgressTimerRef.current) {
        clearInterval(longPressProgressTimerRef.current);
        longPressProgressTimerRef.current = null;
      }
      setLongPressProgress(0);
      setIsTouchDragging(true);
      const dragData: DragData = {
        iconTitle: card.title,
        type: "icon",
      };
      onDragStart?.(dragData);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    // 롱 프레스 타이머 취소
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (longPressProgressTimerRef.current) {
      clearInterval(longPressProgressTimerRef.current);
      longPressProgressTimerRef.current = null;
    }
    setLongPressProgress(0);

    if (!touchStartRef.current || !isTouchDragging) {
      touchStartRef.current = null;
      return;
    }

    if (e.changedTouches.length === 0) {
      touchStartRef.current = null;
      setIsTouchDragging(false);
      onDragEnd?.();
      return;
    }

    const touch = e.changedTouches[0];
    let elementBelow: Element | null = null;
    try {
      elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    } catch (err) {
      // elementFromPoint 실패 시 무시
    }
    
    // 드롭 대상 찾기
    if (elementBelow) {
      const targetCard = elementBelow.closest('[data-icon-title]') as HTMLElement;
      if (targetCard) {
        const targetTitle = targetCard.dataset.iconTitle;
        if (targetTitle && targetTitle !== card.title) {
          onDrop?.(card.title, targetTitle);
        }
      }
    }

    setIsTouchDragging(false);
    touchStartRef.current = null;
    onDragEnd?.();
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      if (longPressProgressTimerRef.current) {
        clearInterval(longPressProgressTimerRef.current);
      }
    };
  }, []);

  // 터치 드래그 중 스타일 업데이트
  useEffect(() => {
    if (!cardRef.current) return;
    
    if (isTouchDragging) {
      cardRef.current.style.opacity = "0.5";
      cardRef.current.style.transform = "scale(0.9)";
    } else {
      cardRef.current.style.opacity = "";
      cardRef.current.style.transform = "";
    }
  }, [isTouchDragging]);

  // 카테고리별 네온 애니메이션 이름
  const getNeonAnimation = (): string => {
    const animationMap: Record<IconCategory, string> = {
      recipe: 'neon-glow-blue',
      diet: 'neon-glow-green',
      health: 'neon-glow-red',
      game: 'neon-glow-purple',
      utility: 'neon-glow-gray',
      story: 'neon-glow-indigo',
    };
    return animationMap[card.category] || 'neon-glow-blue';
  };

  return (
    <motion.div
      ref={cardRef}
      draggable
      {...({
        onDragStart: handleDragStart,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop,
        onDragEnd: handleDragEnd,
        onMouseDown: handleMouseDown,
        onMouseUp: handleMouseUp,
        onMouseLeave: handleMouseLeave,
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
      } as any)}
      data-icon-title={card.title}
      data-category={card.category}
      initial={{ 
        opacity: 0, 
        y: 50, 
        scale: 0.8 
      }}
      animate={{ 
        opacity: isDragging || isTouchDragging ? 0.5 : 1, 
        y: 0, 
        scale: isDragging || isTouchDragging ? 0.9 : 1,
        zIndex: isDragging || isTouchDragging ? 1000 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 150,
        damping: 25,
        mass: 1.2,
        delay: index * 0.08 + 1.2,
        duration: 1.0,
      }}
      whileHover={{ 
        scale: isDragging || isTouchDragging ? 0.9 : 1.1, 
        y: isDragging || isTouchDragging ? 0 : -8,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.95 }}
      className={`relative ${isDragging || isTouchDragging ? "cursor-grabbing" : "cursor-grab"} ${
        isDraggedOver ? "ring-4 ring-blue-400 ring-offset-2" : ""
      }`}
    >
      <Link
        href={card.href}
        onClick={handleClick}
        className={`group flex flex-col items-center justify-center h-full p-2 rounded-xl transition-all touch-none relative ${
          isDraggedOver ? "bg-blue-50/50" : ""
        } ${isDragging || isTouchDragging ? "opacity-50" : ""}`}
        style={{
          pointerEvents: isTouchDragging ? 'none' : 'auto',
        }}
      >
        {/* 롱프레스 진행 바 */}
        {longPressProgress > 0 && (
          <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-20">
            <div
              className="absolute bottom-0 left-0 right-0 bg-blue-500 opacity-60 transition-all duration-50"
              style={{
                height: `${longPressProgress}%`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-xs font-bold drop-shadow-lg">
                {Math.round(longPressProgress)}%
              </span>
            </div>
          </div>
        )}
        
        {/* 아이콘 영역 - 크기 축소 */}
        <motion.div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden transition-all relative flex-shrink-0 mb-1.5"
        >
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
            sizes="56px"
            priority={index < 6}
            draggable={false}
            onError={(e) => {
              // 이미지 로딩 실패 시 기본 배경색만 표시
              e.currentTarget.style.display = 'none';
            }}
          />
        </motion.div>

        {/* 제목만 표시 */}
        <div className="text-center w-full">
          <h3 className="text-[10px] sm:text-xs font-bold text-gray-900 drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)] leading-tight group-hover:text-gray-800 transition-colors break-words whitespace-pre-line">
            {card.title}
          </h3>
        </div>
      </Link>
    </motion.div>  );
}

