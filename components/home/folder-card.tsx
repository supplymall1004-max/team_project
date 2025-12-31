/**
 * @file folder-card.tsx
 * @description 폴더 카드 컴포넌트 (확장/축소 기능 포함)
 *
 * 주요 기능:
 * 1. 폴더 아이콘 표시 (내부 아이콘 미리보기)
 * 2. 확장/축소 애니메이션
 * 3. 폴더 이름 표시
 * 4. 드래그 앤 드롭 지원 (폴더에 아이콘 추가)
 *
 * @dependencies
 * - framer-motion: 애니메이션
 * - types/icon-groups.ts: 타입 정의
 * - lucide-react: 아이콘
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Folder, X, Edit2 } from "lucide-react";
import type { IconGroup } from "@/types/icon-groups";
import type { QuickStartCard } from "./hero-section";
import type { DragData } from "@/types/icon-groups";

interface FolderCardProps {
  /** 폴더 정보 */
  group: IconGroup;
  /** 폴더 내부 아이콘 데이터 */
  iconCards: QuickStartCard[];
  /** 확장 여부 */
  isExpanded: boolean;
  /** 확장/축소 토글 */
  onToggle: () => void;
  /** 드롭 이벤트 (아이콘을 폴더에 드롭) */
  onDrop?: (iconTitle: string) => void;
  /** 폴더 삭제 */
  onDelete?: () => void;
  /** 폴더 이름 편집 */
  onRename?: (newName: string) => void;
  /** 애니메이션 인덱스 */
  index?: number;
}

export function FolderCard({
  group,
  iconCards,
  isExpanded,
  onToggle,
  onDrop,
  onDelete,
  onRename,
  index = 0,
}: FolderCardProps) {
  const [isDraggedOver, setIsDraggedOver] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(group.name);

  // group.name이 변경되면 editedName도 동기화
  useEffect(() => {
    setEditedName(group.name);
  }, [group.name]);

  // 폴더 내부 아이콘 미리보기 (최대 4개)
  const previewIcons = iconCards.slice(0, 4);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    
    const dragDataStr = e.dataTransfer.getData("application/json");
    if (dragDataStr) {
      try {
        const dragData: DragData = JSON.parse(dragDataStr);
        if (dragData.type === "icon" && !group.iconTitles.includes(dragData.iconTitle)) {
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
        if (dragData.type === "icon" && !group.iconTitles.includes(dragData.iconTitle)) {
          console.group("[FolderCard] 폴더에 아이콘 드롭");
          console.log("아이콘:", dragData.iconTitle);
          console.log("폴더:", group.name);
          console.groupEnd();
          
          onDrop?.(dragData.iconTitle);
        }
      } catch (error) {
        console.error("[FolderCard] 드롭 데이터 파싱 실패:", error);
      }
    }
  };

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

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: 50, 
        scale: 0.8 
      }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1 
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
        scale: 1.05, 
        y: -4,
        transition: { duration: 0.2 }
      }}
      className="relative"
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(e) => {
          // 편집 모드일 때는 카드 클릭으로 확장/축소되지 않도록 방지
          if (!isEditingName) {
            onToggle();
          }
        }}
        data-folder-id={group.id}
        className={`group flex flex-col items-center justify-between h-full min-h-[140px] sm:min-h-[160px] p-4 sm:p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-2xl transition-all gdweb-card ${isEditingName ? "cursor-default" : "cursor-pointer"} touch-none ${
          isDraggedOver ? "bg-blue-50 border-blue-300 ring-4 ring-blue-400 ring-offset-2" : ""
        } ${isExpanded ? "bg-gradient-to-br from-blue-50 to-purple-50" : ""}`}
        style={{
          boxShadow: isDraggedOver 
            ? '0 8px 32px rgba(59, 130, 246, 0.3)' 
            : '0 8px 32px rgba(0, 0, 0, 0.12)',
        }}
      >
        {/* 폴더 아이콘 영역 */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-xl group-hover:shadow-2xl transition-all relative flex-shrink-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
          <Folder className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          
          {/* 내부 아이콘 미리보기 (작은 아이콘들) */}
          {previewIcons.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center gap-0.5 p-1">
              {previewIcons.map((icon, idx) => (
                <div
                  key={idx}
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-white/80 flex-shrink-0"
                  style={{
                    backgroundImage: `url(${icon.iconSrc})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              ))}
              {iconCards.length > 4 && (
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-white/80 flex items-center justify-center text-[6px] sm:text-[8px] font-bold text-gray-600">
                  +{iconCards.length - 4}
                </div>
              )}
            </div>
          )}
          
          {/* 편집/삭제 버튼 (아이콘 위쪽에 배치) */}
          <div className="absolute -top-1 -right-1 flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity z-10">
            {onRename && !isEditingName && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingName(true);
                }}
                className="p-1 rounded-full hover:bg-blue-100 transition-colors bg-white/90 backdrop-blur-sm shadow-md"
                title="이름 편집"
              >
                <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" />
              </button>
            )}
            {onDelete && !isEditingName && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 rounded-full hover:bg-red-100 transition-colors bg-white/90 backdrop-blur-sm shadow-md"
                title="폴더 삭제"
              >
                <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-600" />
              </button>
            )}
          </div>
        </div>

        {/* 폴더 이름 영역 */}
        <div className="w-full flex-1 flex items-center justify-center min-h-[48px] sm:min-h-[52px] relative px-2">
          {isEditingName ? (
            <div className="w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleNameEdit}
                onKeyDown={handleNameKeyDown}
                className="text-xs sm:text-sm font-bold text-gray-900 bg-white border-2 border-blue-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 text-center w-full max-w-[200px]"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
                Enter로 저장, Esc로 취소
              </p>
            </div>
          ) : (
            <h3 
              className="text-xs sm:text-sm font-bold text-gray-900 leading-normal group-hover:text-primary transition-colors cursor-pointer text-center w-full line-clamp-3"
              onClick={(e) => {
                e.stopPropagation();
                if (onRename) {
                  setIsEditingName(true);
                }
              }}
              title={onRename ? `${group.name} - 클릭하여 이름 편집` : group.name}
            >
              {group.name}
            </h3>
          )}
        </div>
      </div>
    </motion.div>
  );
}

