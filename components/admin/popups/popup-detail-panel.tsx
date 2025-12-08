/**
 * @file components/admin/popups/popup-detail-panel.tsx
 * @description 관리자 팝업 공지 상세 편집 패널
 *
 * 주요 기능:
 * 1. 선택된 팝업의 상세 정보 표시 및 편집
 * 2. 미리보기 모달 연결
 * 3. 저장/배포/토글 액션
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { Save, Eye, Play, Square, Settings, Calendar, Users, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { savePopup } from "@/actions/admin/popups/save";
import { deployPopup } from "@/actions/admin/popups/deploy";
import { togglePopup } from "@/actions/admin/popups/toggle";
import { PopupPreviewModal } from "./popup-preview-modal";
import { ImageUpload } from "./image-upload";
import type { AdminPopupAnnouncement } from "@/actions/admin/popups/list";

interface PopupDetailPanelProps {
  selectedPopup?: AdminPopupAnnouncement;
  onPopupUpdated?: () => void;
}

export function PopupDetailPanel({ selectedPopup, onPopupUpdated }: PopupDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  // 편집 폼 상태
  const [editForm, setEditForm] = useState({
    title: "",
    body: "",
    active_from: "",
    active_until: "",
    priority: 0,
    target_segments: [] as string[],
    image_url: null as string | null,
    link_url: null as string | null,
    display_type: "modal" as "modal" | "checkpoint",
  });

  const { toast } = useToast();

  // 선택된 팝업이 변경되면 편집 폼 초기화
  useEffect(() => {
    if (selectedPopup) {
      setEditForm({
        title: selectedPopup.title,
        body: selectedPopup.body,
        active_from: selectedPopup.active_from.slice(0, 16), // datetime-local format
        active_until: selectedPopup.active_until ? selectedPopup.active_until.slice(0, 16) : "",
        priority: selectedPopup.priority,
        target_segments: [...selectedPopup.target_segments],
        image_url: selectedPopup.image_url || null,
        link_url: selectedPopup.link_url || null,
        display_type: selectedPopup.display_type || "modal",
      });
      setIsEditing(false);
    }
  }, [selectedPopup]);

  // 폼 변경 핸들러
  const handleFormChange = useCallback((field: string, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // 저장 핸들러
  const handleSave = useCallback(async () => {
    if (!selectedPopup) return;

    setIsSaving(true);
    try {
      console.group("[AdminConsole][Popups][Detail]");
      console.log("event", "save-popup");
      console.log("popup_id", selectedPopup.id);

      const result = await savePopup({
        id: selectedPopup.id,
        title: editForm.title,
        body: editForm.body,
        active_from: new Date(editForm.active_from).toISOString(),
        active_until: editForm.active_until ? new Date(editForm.active_until).toISOString() : null,
        priority: editForm.priority,
        target_segments: editForm.target_segments,
        image_url: editForm.image_url,
        link_url: editForm.link_url,
        display_type: editForm.display_type,
      });

      if (result.success) {
        setIsEditing(false);
        onPopupUpdated?.();
        toast({
          title: "저장 완료",
          description: "팝업 공지가 저장되었습니다.",
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
  }, [selectedPopup, editForm, onPopupUpdated, toast]);

  // 배포 토글 핸들러
  const handleDeployToggle = useCallback(async () => {
    if (!selectedPopup) return;

    const action = selectedPopup.status === "published" ? "unpublish" : "publish";
    setIsDeploying(true);

    try {
      console.group("[AdminConsole][Popups][Detail]");
      console.log("event", "deploy-toggle");
      console.log("popup_id", selectedPopup.id);
      console.log("action", action);

      const result = await deployPopup({ id: selectedPopup.id, action });

      if (result.success) {
        onPopupUpdated?.();
        toast({
          title: action === "publish" ? "배포 완료" : "배포 취소",
          description: `"${selectedPopup.title}"이 ${action === "publish" ? "배포되었습니다" : "배포 취소되었습니다"}.`,
        });
        console.log("deploy_success", result.data.status);
      } else {
        const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
        toast({
          title: "배포 실패",
          description: errorMessage,
          variant: "destructive",
        });
        console.error("deploy_error", errorMessage);
      }
    } catch (error) {
      console.error("deploy_unexpected_error", error);
      toast({
        title: "오류 발생",
        description: "배포 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
      console.groupEnd();
    }
  }, [selectedPopup, onPopupUpdated, toast]);

  // 우선순위 변경 핸들러
  const handlePriorityChange = useCallback(async (newPriority: number) => {
    if (!selectedPopup) return;

    try {
      console.group("[AdminConsole][Popups][Detail]");
      console.log("event", "priority-change");
      console.log("popup_id", selectedPopup.id);
      console.log("new_priority", newPriority);

      const result = await togglePopup({
        id: selectedPopup.id,
        type: "priority",
        value: newPriority,
      });

      if (result.success) {
        onPopupUpdated?.();
        console.log("priority_update_success");
      } else {
        const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
        toast({
          title: "우선순위 변경 실패",
          description: errorMessage,
          variant: "destructive",
        });
        console.error("priority_error", errorMessage);
      }
    } catch (error) {
      console.error("priority_unexpected_error", error);
      toast({
        title: "오류 발생",
        description: "우선순위 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      console.groupEnd();
    }
  }, [selectedPopup, onPopupUpdated, toast]);

  // 세그먼트 토글 핸들러
  const handleSegmentToggle = useCallback(async (segment: string, action: "add" | "remove") => {
    if (!selectedPopup) return;

    try {
      console.group("[AdminConsole][Popups][Detail]");
      console.log("event", "segment-toggle");
      console.log("popup_id", selectedPopup.id);
      console.log("segment", segment);
      console.log("action", action);

      const result = await togglePopup({
        id: selectedPopup.id,
        type: "segment",
        value: segment,
        action,
      });

      if (result.success) {
        onPopupUpdated?.();
        console.log("segment_update_success");
      } else {
        const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
        toast({
          title: "세그먼트 변경 실패",
          description: errorMessage,
          variant: "destructive",
        });
        console.error("segment_error", errorMessage);
      }
    } catch (error) {
      console.error("segment_unexpected_error", error);
      toast({
        title: "오류 발생",
        description: "세그먼트 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      console.groupEnd();
    }
  }, [selectedPopup, onPopupUpdated, toast]);

  if (!selectedPopup) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <Settings className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">팝업을 선택하세요</h3>
          <p className="mt-1 text-sm text-gray-500">좌측에서 편집할 팝업 공지를 선택해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{selectedPopup.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={selectedPopup.status === "published" ? "default" : "secondary"}>
                {selectedPopup.status === "published" ? "배포중" : selectedPopup.status === "draft" ? "초안" : "보관됨"}
              </Badge>
              <Badge variant="outline">우선순위: {selectedPopup.priority}</Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  미리보기
                </Button>
              </DialogTrigger>
              <PopupPreviewModal
                popup={selectedPopup}
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
              />
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDeployToggle}
              disabled={isDeploying}
              className={
                selectedPopup.status === "published"
                  ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                  : "text-green-600 hover:text-green-700 hover:bg-green-50"
              }
            >
              {isDeploying ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              ) : selectedPopup.status === "published" ? (
                <Square className="w-4 h-4 mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {selectedPopup.status === "published" ? "배포 취소" : "배포"}
            </Button>

            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  취소
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "저장 중..." : "저장"}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                편집
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">제목</Label>
                {isEditing ? (
                  <Input
                    id="title"
                    value={editForm.title}
                    onChange={(e) => handleFormChange("title", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{selectedPopup.title}</p>
                )}
              </div>

              <div>
                <Label htmlFor="body">본문</Label>
                {isEditing ? (
                  <Textarea
                    id="body"
                    value={editForm.body}
                    onChange={(e) => handleFormChange("body", e.target.value)}
                    rows={4}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedPopup.body}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 이미지 & 링크 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                이미지 & 링크
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 이미지 업로드 */}
              <div>
                <Label>팝업 이미지</Label>
                {isEditing ? (
                  <div className="mt-2">
                    <ImageUpload
                      value={editForm.image_url}
                      onChange={(url) => handleFormChange("image_url", url)}
                    />
                  </div>
                ) : (
                  <div className="mt-2">
                    {selectedPopup.image_url ? (
                      <div className="relative w-full h-48 bg-gray-100 rounded-md overflow-hidden">
                        <img
                          src={selectedPopup.image_url}
                          alt="팝업 이미지"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">이미지가 없습니다.</p>
                    )}
                  </div>
                )}
              </div>

              {/* 링크 URL */}
              <div>
                <Label htmlFor="link_url" className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  링크 URL (클릭 시 이동)
                </Label>
                {isEditing ? (
                  <Input
                    id="link_url"
                    type="url"
                    value={editForm.link_url || ""}
                    onChange={(e) => handleFormChange("link_url", e.target.value || null)}
                    placeholder="https://example.com"
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1">
                    {selectedPopup.link_url ? (
                      <a
                        href={selectedPopup.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {selectedPopup.link_url}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500">링크가 없습니다.</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 일정 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                표시 기간
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="active_from">시작일</Label>
                {isEditing ? (
                  <Input
                    id="active_from"
                    type="datetime-local"
                    value={editForm.active_from}
                    onChange={(e) => handleFormChange("active_from", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedPopup.active_from).toLocaleString('ko-KR')}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="active_until">종료일 (선택)</Label>
                {isEditing ? (
                  <Input
                    id="active_until"
                    type="datetime-local"
                    value={editForm.active_until}
                    onChange={(e) => handleFormChange("active_until", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedPopup.active_until
                      ? new Date(selectedPopup.active_until).toLocaleString('ko-KR')
                      : "설정되지 않음"
                    }
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 대상 세그먼트 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                대상 세그먼트
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  {["premium", "new_user", "returning", "all"].map((segment) => (
                    <label key={segment} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editForm.target_segments.includes(segment)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          if (checked) {
                            handleFormChange("target_segments", [...editForm.target_segments, segment]);
                          } else {
                            handleFormChange("target_segments", editForm.target_segments.filter(s => s !== segment));
                          }
                        }}
                      />
                      <span className="text-sm">{segment}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedPopup.target_segments.length > 0 ? (
                    selectedPopup.target_segments.map((segment) => (
                      <Badge key={segment} variant="outline">
                        {segment}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="secondary">전체 사용자</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 표시 타입 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">표시 타입</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  <Select
                    value={editForm.display_type}
                    onValueChange={(value) => handleFormChange("display_type", value as "modal" | "checkpoint")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modal">일반 모달 (중앙 팝업)</SelectItem>
                      <SelectItem value="checkpoint">체크포인트 배너 (오른쪽 상단)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    일반 모달: 화면 중앙에 표시되는 팝업 | 체크포인트 배너: 오른쪽 상단에 고정되는 배너
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {selectedPopup.display_type === "modal" ? "일반 모달" : "체크포인트 배너"}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 우선순위 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">우선순위 설정</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Select
                  value={editForm.priority.toString()}
                  onValueChange={(value) => handleFormChange("priority", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">낮음 (0)</SelectItem>
                    <SelectItem value="50">보통 (50)</SelectItem>
                    <SelectItem value="100">높음 (100)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {selectedPopup.priority === 0 ? "낮음" : selectedPopup.priority === 50 ? "보통" : "높음"}
                    ({selectedPopup.priority})
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
