/**
 * @file components/admin/copy/admin-copy-editor.tsx
 * @description 관리자 페이지 문구 편집 - 우측 편집기 컴포넌트
 *
 * 주요 기능:
 * 1. JSON 콘텐츠 편집 (코드 에디터)
 * 2. 버전 히스토리 조회 및 비교
 * 3. 미리보기 모달
 * 4. 저장 및 버전 관리
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { Save, History, Eye, Diff, RotateCcw, FileText, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { upsertCopyBlock } from "@/actions/admin/copy/upsert";
import { getCopyBlockHistory, calculateContentDiff } from "@/actions/admin/copy/history";
import type { AdminCopyBlock } from "@/actions/admin/copy/list";
import type { CopyBlockVersion } from "@/actions/admin/copy/history";
import { FieldEditor } from "./json-editor/field-editor";

interface AdminCopyEditorProps {
  selectedBlock?: AdminCopyBlock;
  onBlockUpdated?: (updatedBlock: AdminCopyBlock) => void;
}

export function AdminCopyEditor({ selectedBlock, onBlockUpdated }: AdminCopyEditorProps) {
  // 모든 hooks는 조건문 전에 호출해야 함 (React hooks 규칙)
  const [contentJson, setContentJson] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<CopyBlockVersion[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<Record<string, any> | null>(null);
  const [isValidJson, setIsValidJson] = useState(true);
  const { toast } = useToast();

  // 선택된 블록이 변경되면 에디터 상태 초기화
  useEffect(() => {
    if (selectedBlock) {
      const jsonString = JSON.stringify(selectedBlock.content, null, 2);
      setContentJson(jsonString);
      setIsDirty(false);
      setIsValidJson(true);
      setPreviewContent(selectedBlock.content);
      // 히스토리 초기화
      setHistory([]);
    } else {
      setContentJson("");
      setIsDirty(false);
      setPreviewContent(null);
      setHistory([]);
    }
  }, [selectedBlock]);

  // JSON 유효성 검증
  const validateJson = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      setIsValidJson(true);
      setPreviewContent(parsed);
      return true;
    } catch {
      setIsValidJson(false);
      setPreviewContent(null);
      return false;
    }
  }, []);

  // 콘텐츠 변경 핸들러
  const handleContentChange = useCallback((value: string) => {
    setContentJson(value);
    setIsDirty(true);
    validateJson(value);
  }, [validateJson]);

  // 저장 핸들러
  const handleSave = useCallback(async () => {
    if (!selectedBlock || !isValidJson) return;

    setIsSaving(true);
    try {
      console.group("[AdminConsole][Copy][Editor]");
      console.log("event", "save-block");
      console.log("block_slug", selectedBlock.slug);

      const parsedContent = JSON.parse(contentJson);
      const result = await upsertCopyBlock({
        id: selectedBlock.id,
        slug: selectedBlock.slug,
        locale: selectedBlock.locale,
        content: parsedContent,
      });

      if (result.success) {
        setIsDirty(false);
        onBlockUpdated?.(result.data);

        toast({
          title: "저장 완료",
          description: `문구 블록이 ${result.isNew ? '생성' : '업데이트'}되었습니다.`,
        });

        console.log("save_success", result.data.id);
      } else {
        const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
        toast({
          title: "저장 실패",
          description: errorMessage,
          variant: "destructive",
        });
        console.error("save_error", errorMessage);
      }
    } catch (error) {
      console.error("save_unexpected_error", error);
      toast({
        title: "오류 발생",
        description: "저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      console.groupEnd();
    }
  }, [selectedBlock, contentJson, isValidJson, onBlockUpdated, toast]);

  // 히스토리 로드 핸들러
  const handleLoadHistory = useCallback(async () => {
    if (!selectedBlock) return;

    setIsLoadingHistory(true);
    try {
      console.group("[AdminConsole][Copy][Editor]");
      console.log("event", "load-history");
      console.log("block_slug", selectedBlock.slug);

      const result = await getCopyBlockHistory({
        slug: selectedBlock.slug,
        locale: selectedBlock.locale,
      });

      if (result.success) {
        setHistory(result.data);
        console.log("history_loaded", result.total);
      } else {
        const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
        toast({
          title: "히스토리 로드 실패",
          description: errorMessage,
          variant: "destructive",
        });
        console.error("history_error", errorMessage);
      }
    } catch (error) {
      console.error("history_unexpected_error", error);
      toast({
        title: "오류 발생",
        description: "히스토리 로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
      console.groupEnd();
    }
  }, [selectedBlock, toast]);

  // 버전 복원 핸들러
  const handleRestoreVersion = useCallback((version: CopyBlockVersion) => {
    const jsonString = JSON.stringify(version.content, null, 2);
    setContentJson(jsonString);
    setIsDirty(true);
    validateJson(jsonString);

    toast({
      title: "버전 복원",
      description: `v${version.version} 버전으로 복원되었습니다. 저장하기 전까지 적용되지 않습니다.`,
    });
  }, [validateJson, toast]);

  if (!selectedBlock) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">블록을 선택하세요</h3>
          <p className="mt-1 text-sm text-gray-500">좌측에서 편집할 문구 블록을 선택해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{selectedBlock.slug}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">
                <Globe className="w-3 h-3 mr-1" />
                {selectedBlock.locale}
              </Badge>
              <Badge variant="outline">v{selectedBlock.version}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadHistory}
              disabled={isLoadingHistory}
            >
              <History className="w-4 h-4 mr-2" />
              {isLoadingHistory ? "로딩..." : "히스토리"}
            </Button>

            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!isValidJson}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  미리보기
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>콘텐츠 미리보기 - {selectedBlock.slug}</DialogTitle>
                </DialogHeader>
                <div className="max-h-96 overflow-auto">
                  <pre className="text-sm bg-gray-50 p-4 rounded">
                    {previewContent ? JSON.stringify(previewContent, null, 2) : "유효하지 않은 JSON"}
                  </pre>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={handleSave}
              disabled={!isDirty || !isValidJson || isSaving}
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>

        {/* 상태 표시 */}
        <div className="flex items-center gap-2 mt-2">
          {isDirty && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              변경됨
            </Badge>
          )}
          {!isValidJson && (
            <Badge variant="destructive">
              JSON 오류
            </Badge>
          )}
        </div>
      </div>

      {/* 에디터 영역 */}
      <div className="flex-1 p-4">
        <Tabs defaultValue="visual" className="h-full">
          <TabsList>
            <TabsTrigger value="visual">비주얼 에디터</TabsTrigger>
            <TabsTrigger value="json">JSON 소스</TabsTrigger>
            <TabsTrigger value="history" disabled={history.length === 0}>
              히스토리 ({history.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="h-full mt-4 overflow-auto">
            <Card className="h-full border-none shadow-none bg-transparent">
              <CardContent className="p-0 h-full">
                {isValidJson && previewContent ? (
                  <div className="bg-white rounded-lg border p-6 shadow-sm">
                    <FieldEditor
                      value={previewContent}
                      onChange={(newValue) => {
                        const jsonString = JSON.stringify(newValue, null, 2);
                        setContentJson(jsonString);
                        setIsDirty(true);
                        setPreviewContent(newValue);
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                    <p>유효하지 않은 JSON입니다. JSON 소스 탭에서 수정해주세요.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="json" className="h-full mt-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm">JSON 콘텐츠</CardTitle>
              </CardHeader>
              <CardContent className="h-full pb-4">
                <Textarea
                  value={contentJson}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="JSON 형식으로 콘텐츠를 입력하세요..."
                  className={`h-full font-mono text-sm resize-none ${!isValidJson ? "border-red-300 focus:border-red-500" : ""
                    }`}
                />
                {!isValidJson && (
                  <p className="text-red-600 text-sm mt-2">
                    유효하지 않은 JSON 형식입니다.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="h-full mt-4">
            <div className="space-y-4">
              {history.map((version, index) => {
                const isCurrent = version.version === selectedBlock.version;
                const prevVersion = history[index + 1]; // 다음 항목이 이전 버전

                return (
                  <Card key={version.id} className={isCurrent ? "ring-2 ring-orange-200" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant={isCurrent ? "default" : "secondary"}>
                            v{version.version}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {new Date(version.updated_at).toLocaleString('ko-KR')}
                          </span>
                          {isCurrent && (
                            <Badge variant="outline" className="text-green-600">
                              현재 버전
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {prevVersion && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const changes = calculateContentDiff(prevVersion.content, version.content);
                                console.log("diff_changes", changes);
                                // TODO: diff 모달 구현
                              }}
                            >
                              <Diff className="w-4 h-4 mr-1" />
                              비교
                            </Button>
                          )}
                          {!isCurrent && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestoreVersion(version)}
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              복원
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
