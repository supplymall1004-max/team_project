/**
 * @file icon-detail-dialog.tsx
 * @description 아이콘 상세 다이얼로그 컴포넌트 (그룹화 옵션 포함)
 *
 * 주요 기능:
 * 1. 아이콘 정보 표시
 * 2. 그룹 선택 옵션 (기존 그룹에 추가)
 * 3. 그룹으로 이동 옵션 (이미 그룹에 속한 경우)
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Folder, ArrowRight, Plus } from "lucide-react";
import type { QuickStartCard } from "./hero-section";
import type { IconGroup } from "@/types/icon-groups";

interface IconDetailDialogProps {
  /** 열림 상태 */
  open: boolean;
  /** 닫기 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 아이콘 카드 데이터 */
  card: QuickStartCard;
  /** 현재 아이콘이 속한 그룹 ID (없으면 null) */
  currentGroupId: string | null;
  /** 현재 그룹 정보 (있으면) */
  currentGroup: IconGroup | null;
  /** 모든 그룹 목록 */
  allGroups: IconGroup[];
  /** 그룹에 아이콘 추가 핸들러 */
  onAddToGroup: (groupId: string) => void;
  /** 그룹으로 이동 핸들러 (폴더 확장) */
  onNavigateToGroup: (groupId: string) => void;
}

export function IconDetailDialog({
  open,
  onOpenChange,
  card,
  currentGroupId,
  currentGroup,
  allGroups,
  onAddToGroup,
  onNavigateToGroup,
}: IconDetailDialogProps) {
  // 현재 아이콘이 속하지 않은 그룹들만 필터링
  const availableGroups = allGroups.filter((group) => group.id !== currentGroupId);

  const handleAddToGroup = (groupId: string) => {
    onAddToGroup(groupId);
    onOpenChange(false);
  };

  const handleNavigateToGroup = (groupId: string) => {
    onNavigateToGroup(groupId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{card.title}</DialogTitle>
          <DialogDescription>{card.description}</DialogDescription>
        </DialogHeader>

        {/* 아이콘 이미지 */}
        <div className="flex justify-center my-4">
          <div className="w-24 h-24 rounded-2xl overflow-hidden relative shadow-lg">
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
              sizes="96px"
            />
          </div>
        </div>

        {/* 현재 그룹 정보 (있으면) */}
        {currentGroup && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">현재 그룹</p>
                  <p className="text-sm text-blue-700">{currentGroup.name}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigateToGroup(currentGroup.id)}
                className="flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                이동
              </Button>
            </div>
          </div>
        )}

        {/* 그룹 선택 옵션 */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">
            {currentGroupId ? "다른 그룹에 추가" : "그룹에 추가"}
          </p>
          
          {availableGroups.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableGroups.map((group) => (
                <Button
                  key={group.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleAddToGroup(group.id)}
                >
                  <Folder className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="flex-1 text-left">{group.name}</span>
                  <Plus className="w-4 h-4 text-gray-400" />
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              {currentGroupId
                ? "다른 그룹이 없습니다"
                : "사용 가능한 그룹이 없습니다"}
            </p>
          )}
        </div>

        {/* 페이지로 이동 버튼 */}
        <div className="pt-4 border-t">
          <Button asChild className="w-full" variant="default">
            <Link href={card.href}>
              <ArrowRight className="w-4 h-4 mr-2" />
              {card.title} 페이지로 이동
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

