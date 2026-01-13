/**
 * @file icon-group-modal.tsx
 * @description 아이콘 그룹화 모달 컴포넌트
 *
 * 주요 기능:
 * 1. 그룹화 폴더 생성
 * 2. 그룹화 폴더로 이동
 * 3. 아이콘의 자리 변경
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { X, FolderPlus, FolderOpen, Move, GripVertical } from "lucide-react";
import type { QuickStartCard } from "./hero-section";
import type { IconGroup } from "@/types/icon-groups";

interface IconGroupModalProps {
  /** 모달이 열려있는지 여부 */
  isOpen: boolean;
  /** 모달 닫기 핸들러 */
  onClose: () => void;
  /** 현재 선택된 아이콘 */
  selectedIcon: QuickStartCard | null;
  /** 모든 아이콘 목록 */
  allIcons: QuickStartCard[];
  /** 모든 그룹 목록 */
  allGroups: IconGroup[];
  /** 그룹 생성 핸들러 */
  onCreateGroup: (iconTitle: string, groupName: string) => void;
  /** 그룹에 아이콘 추가 핸들러 */
  onAddToGroup: (iconTitle: string, groupId: string) => void;
  /** 아이콘이 속한 그룹 ID 가져오기 */
  getGroupIdForIcon: (iconTitle: string) => string | null;
  /** 아이콘 순서 변경 핸들러 */
  onReorderIcons?: (newOrder: string[]) => void;
  /** 현재 아이콘 순서 */
  currentIconOrder?: string[];
}

export function IconGroupModal({
  isOpen,
  onClose,
  selectedIcon,
  allIcons,
  allGroups,
  onCreateGroup,
  onAddToGroup,
  getGroupIdForIcon,
  onReorderIcons,
  currentIconOrder = [],
}: IconGroupModalProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderList, setReorderList] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "move" | "reorder">("create");
  const inputRef = useRef<HTMLInputElement>(null);

  // 모달이 열릴 때 입력 필드에 포커스
  useEffect(() => {
    if (isOpen && activeTab === "create" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, activeTab]);

  // 재정렬 모드 진입 시 현재 순서 초기화
  useEffect(() => {
    if (!isReordering) return;
    
    if (currentIconOrder && currentIconOrder.length > 0) {
      setReorderList([...currentIconOrder]);
    } else if (selectedIcon && allIcons && allIcons.length > 0) {
      // 현재 순서가 없으면 모든 아이콘의 기본 순서 사용
      const allTitles = allIcons.map((icon) => icon.title).filter(Boolean);
      setReorderList(allTitles);
    } else {
      setReorderList([]);
    }
  }, [isReordering, currentIconOrder, allIcons, selectedIcon]);

  if (!isOpen || !selectedIcon) return null;

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      alert("폴더 이름을 입력해주세요.");
      return;
    }
    onCreateGroup(selectedIcon.title, newGroupName.trim());
    setNewGroupName("");
    onClose();
  };

  const handleMoveToGroup = () => {
    if (!selectedGroupId) {
      alert("이동할 폴더를 선택해주세요.");
      return;
    }
    onAddToGroup(selectedIcon.title, selectedGroupId);
    setSelectedGroupId(null);
    onClose();
  };

  const handleStartReorder = () => {
    setIsReordering(true);
    setActiveTab("reorder");
  };

  const handleSaveReorder = () => {
    if (onReorderIcons) {
      onReorderIcons(reorderList);
    }
    setIsReordering(false);
    onClose();
  };

  const handleCancelReorder = () => {
    setIsReordering(false);
    setReorderList([]);
  };

  // 드래그 앤 드롭으로 순서 변경
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData("text/plain");
      if (!data) return;
      
      const sourceIndex = parseInt(data, 10);
      if (isNaN(sourceIndex) || sourceIndex < 0 || sourceIndex >= reorderList.length) return;
      if (sourceIndex === targetIndex) return;

      const newList = [...reorderList];
      const [removed] = newList.splice(sourceIndex, 1);
      if (removed) {
        newList.splice(targetIndex, 0, removed);
        setReorderList(newList);
      }
    } catch (error) {
      // 드롭 데이터 파싱 실패 시 무시
      console.error("[IconGroupModal] 드롭 처리 실패:", error);
    }
  };

  const currentGroupId = getGroupIdForIcon(selectedIcon.title);
  const availableGroups = allGroups.filter((group) => group.id !== currentGroupId);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">아이콘 관리</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {selectedIcon.title} 아이콘 설정
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 선택된 아이콘 정보 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800">
              <img
                src={selectedIcon.iconSrc}
                alt={selectedIcon.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // 이미지 로딩 실패 시 기본 배경색만 표시
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{selectedIcon.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {currentGroupId ? (
                  <span className="inline-flex items-center gap-1">
                    <FolderOpen className="w-3 h-3" />
                    폴더에 속함
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <FolderPlus className="w-3 h-3" />
                    폴더 없음
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${
              activeTab === "create"
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            <FolderPlus className="w-4 h-4 inline-block mr-2" />
            폴더 생성
            {activeTab === "create" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("move")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${
              activeTab === "move"
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            <FolderOpen className="w-4 h-4 inline-block mr-2" />
            폴더로 이동
            {activeTab === "move" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("reorder")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all relative ${
              activeTab === "reorder"
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            <Move className="w-4 h-4 inline-block mr-2" />
            자리 변경
            {activeTab === "reorder" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="p-4 flex-1 overflow-y-auto">
          {/* 폴더 생성 탭 */}
          {activeTab === "create" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">새 폴더 이름</label>
                <input
                  ref={inputRef}
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="예: 레시피 모음"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateGroup();
                    }
                  }}
                />
              </div>
              <button
                onClick={handleCreateGroup}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <FolderPlus className="w-4 h-4 inline-block mr-2" />
                폴더 생성
              </button>
            </div>
          )}

          {/* 폴더로 이동 탭 */}
          {activeTab === "move" && (
            <div className="space-y-4">
              {availableGroups.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  이동할 수 있는 폴더가 없습니다.
                </p>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">폴더 선택</label>
                    <select
                      value={selectedGroupId || ""}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">폴더를 선택하세요</option>
                      {availableGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name} ({group.iconTitles.length}개)
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleMoveToGroup}
                    disabled={!selectedGroupId}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none disabled:shadow-none"
                  >
                    <FolderOpen className="w-4 h-4 inline-block mr-2" />
                    폴더로 이동
                  </button>
                </>
              )}
            </div>
          )}

          {/* 자리 변경 탭 */}
          {activeTab === "reorder" && (
            <div className="space-y-4">
              {!isReordering ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    아이콘의 순서를 변경할 수 있습니다. 드래그 앤 드롭으로 순서를 조정하세요.
                  </p>
                  <button
                    onClick={handleStartReorder}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <GripVertical className="w-4 h-4 inline-block mr-2" />
                    순서 변경 시작
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {reorderList.length === 0 ? (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                        아이콘이 없습니다.
                      </p>
                    ) : (
                      reorderList.map((iconTitle, index) => {
                        if (!iconTitle || !allIcons || allIcons.length === 0) return null;
                        const icon = allIcons.find((i) => i && i.title === iconTitle);
                        if (!icon) return null;
                      return (
                        <div
                          key={iconTitle}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-move hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <GripVertical className="w-5 h-5 text-gray-400" />
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0">
                            <img
                              src={icon.iconSrc}
                              alt={icon.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // 이미지 로딩 실패 시 기본 배경색만 표시
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                          <span className="flex-1 font-medium">{icon.title}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {index + 1}
                          </span>
                        </div>
                      );
                      })
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleCancelReorder}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSaveReorder}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      저장
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

