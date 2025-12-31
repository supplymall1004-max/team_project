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
import type { QuickStartCard } from "./hero-section";
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
  /** 드래그 중인지 여부 */
  isDragging?: boolean;
  /** 드롭 가능한지 여부 */
  canDrop?: boolean;
  /** 클릭 이벤트 */
  onClick?: (href: string) => void;
  /** 애니메이션 인덱스 */
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
  index = 0,
}: DraggableIconCardProps) {
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

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
      const dragImage = document.createElement("div");
      dragImage.style.position = "absolute";
      dragImage.style.top = "-1000px";
      dragImage.innerHTML = card.title;
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
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
    
    // 다른 아이콘 위에 드래그 중인 경우
    const dragDataStr = e.dataTransfer.getData("application/json");
    if (dragDataStr) {
      try {
        const dragData: DragData = JSON.parse(dragDataStr);
        if (dragData.iconTitle !== card.title && dragData.type === "icon") {
          setIsDraggedOver(true);
        }
      } catch {
        // 파싱 실패 시 무시
      }
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

  const handleClick = () => {
    // 터치 드래그 중이면 클릭 무시
    if (isTouchDragging) {
      return;
    }
    if (onClick) {
      onClick(card.href);
    }
  };

  // 모바일 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const deltaTime = Date.now() - touchStartRef.current.time;

    // 일정 거리 이상 이동하면 드래그 시작
    if ((deltaX > 10 || deltaY > 10) && deltaTime > 100) {
      setIsTouchDragging(true);
      const dragData: DragData = {
        iconTitle: card.title,
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

  // 터치 드래그 중 스타일 업데이트
  useEffect(() => {
    if (isTouchDragging && cardRef.current) {
      cardRef.current.style.opacity = "0.5";
      cardRef.current.style.transform = "scale(0.9)";
    } else if (cardRef.current) {
      cardRef.current.style.opacity = "";
      cardRef.current.style.transform = "";
    }
  }, [isTouchDragging]);

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
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
      } as any)}
      data-icon-title={card.title}
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
        className={`group flex flex-col items-center justify-between h-full min-h-[140px] sm:min-h-[160px] p-4 sm:p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-2xl transition-all gdweb-card touch-none ${
          isDraggedOver ? "bg-blue-50 border-blue-300" : ""
        } ${isDragging || isTouchDragging ? "opacity-50" : ""}`}
        style={{
          boxShadow: isDraggedOver 
            ? '0 8px 32px rgba(59, 130, 246, 0.3)' 
            : '0 8px 32px rgba(0, 0, 0, 0.12)',
          pointerEvents: isTouchDragging ? 'none' : 'auto',
        }}
      >
        {/* 아이콘 영역 - 고정 크기 */}
        <motion.div
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-xl group-hover:shadow-2xl transition-all relative flex-shrink-0"
          style={{
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          }}
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
            sizes="80px"
            priority={index < 6}
            draggable={false}
          />
        </motion.div>

        {/* 텍스트 영역 - 고정 높이 */}
        <div className="text-center w-full flex-1 flex flex-col justify-center min-h-[48px] sm:min-h-[52px]">
          <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors mb-1">
            {card.title}
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-600 leading-tight line-clamp-2">
            {card.description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

