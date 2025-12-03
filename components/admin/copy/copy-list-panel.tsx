/**
 * @file components/admin/copy/copy-list-panel.tsx
 * @description 관리자 페이지 문구 편집 - 좌측 리스트 패널 컴포넌트
 *
 * 주요 기능:
 * 1. 문구 블록 목록 표시 (카드 형태)
 * 2. 검색/필터링 기능
 * 3. 선택된 블록 하이라이트
 * 4. 새 블록 생성 버튼
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { Search, Plus, FileText, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AdminCopyBlock } from "@/actions/admin/copy/list";

interface CopyListPanelProps {
  blocks: AdminCopyBlock[];
  selectedBlockId?: string;
  onSelectBlock: (block: AdminCopyBlock) => void;
  onCreateBlock: () => void;
  isLoading?: boolean;
}

export function CopyListPanel({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onCreateBlock,
  isLoading = false,
}: CopyListPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // 검색 필터링
  const filteredBlocks = useMemo(() => {
    if (!searchQuery.trim()) return blocks;

    const query = searchQuery.toLowerCase().trim();
    return blocks.filter((block) =>
      block.slug.toLowerCase().includes(query) ||
      JSON.stringify(block.content).toLowerCase().includes(query)
    );
  }, [blocks, searchQuery]);

  // 블록 선택 핸들러
  const handleSelectBlock = useCallback((block: AdminCopyBlock) => {
    console.group("[AdminConsole][Copy][ListPanel]");
    console.log("event", "select-block");
    console.log("block_id", block.id);
    console.log("block_slug", block.slug);
    console.groupEnd();

    onSelectBlock(block);
  }, [onSelectBlock]);

  // 새 블록 생성 핸들러
  const handleCreateBlock = useCallback(() => {
    console.group("[AdminConsole][Copy][ListPanel]");
    console.log("event", "create-new-block");
    console.groupEnd();

    onCreateBlock();
  }, [onCreateBlock]);

  // 검색어 변경 핸들러
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">페이지 문구</h2>
          <Button
            onClick={handleCreateBlock}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            새 블록
          </Button>
        </div>

        {/* 검색 입력 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="블록 검색 (slug, 내용)..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 블록 리스트 */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredBlocks.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchQuery ? "검색 결과가 없습니다" : "등록된 문구 블록이 없습니다"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? "다른 검색어로 시도해보세요" : "새 블록을 생성해보세요"}
            </p>
            {!searchQuery && (
              <div className="mt-6">
                <Button
                  onClick={handleCreateBlock}
                  variant="outline"
                  className="border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  첫 블록 생성하기
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBlocks.map((block) => (
              <CopyBlockCard
                key={block.id}
                block={block}
                isSelected={block.id === selectedBlockId}
                onClick={() => handleSelectBlock(block)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 푸터 정보 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          총 {filteredBlocks.length}개 블록
          {searchQuery && ` (전체 ${blocks.length}개 중)`}
        </div>
      </div>
    </div>
  );
}

/**
 * 개별 문구 블록 카드 컴포넌트
 */
interface CopyBlockCardProps {
  block: AdminCopyBlock;
  isSelected: boolean;
  onClick: () => void;
}

function CopyBlockCard({ block, isSelected, onClick }: CopyBlockCardProps) {
  // 콘텐츠 미리보기 텍스트 생성
  const getPreviewText = (content: Record<string, any>): string => {
    // title이나 text 필드가 있으면 우선 사용
    if (content.title) return content.title;
    if (content.text) return content.text;

    // 첫 번째 string 값 찾기
    for (const [key, value] of Object.entries(content)) {
      if (typeof value === "string" && value.length > 0) {
        return value.length > 50 ? `${value.substring(0, 50)}...` : value;
      }
    }

    // JSON 형태로 표시
    return JSON.stringify(content).substring(0, 50) + "...";
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected
          ? "ring-2 ring-orange-500 bg-orange-50 border-orange-200"
          : "hover:border-gray-300"
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium text-gray-900 truncate">
            {block.slug}
          </CardTitle>
          <div className="flex items-center gap-1 ml-2">
            <Badge variant="secondary" className="text-xs">
              <Globe className="w-3 h-3 mr-1" />
              {block.locale}
            </Badge>
            <Badge variant="outline" className="text-xs">
              v{block.version}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-gray-600 line-clamp-2">
          {getPreviewText(block.content)}
        </p>
        <div className="mt-2 text-xs text-gray-400">
          {new Date(block.updated_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </CardContent>
    </Card>
  );
}
























