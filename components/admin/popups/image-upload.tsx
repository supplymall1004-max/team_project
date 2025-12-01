/**
 * @file components/admin/popups/image-upload.tsx
 * @description 팝업 이미지 업로드 컴포넌트
 *
 * 주요 기능:
 * 1. 드래그 앤 드롭 이미지 업로드
 * 2. 파일 선택 버튼
 * 3. 이미지 미리보기
 * 4. 이미지 삭제 기능
 */

"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { uploadPopupImage, deletePopupImage } from "@/lib/supabase/upload-image";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const { user } = useUser();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 업로드 처리
  const handleUpload = useCallback(
    async (file: File) => {
      if (!user) {
        setUploadError("로그인이 필요합니다.");
        return;
      }

      console.group("[ImageUpload]");
      console.log("uploading", file.name);

      setIsUploading(true);
      setUploadError(null);

      const result = await uploadPopupImage(file, user.id);

      if (result.success && result.url) {
        console.log("upload_success", result.url);
        onChange(result.url);
      } else {
        console.error("upload_failed", result.error);
        setUploadError(result.error || "업로드 실패");
      }

      setIsUploading(false);
      console.groupEnd();
    },
    [user, onChange]
  );

  // 파일 선택 처리
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  // 드래그 앤 드롭 처리
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleUpload(file);
      } else {
        setUploadError("이미지 파일만 업로드 가능합니다.");
      }
    },
    [handleUpload]
  );

  // 이미지 삭제
  const handleDelete = useCallback(async () => {
    if (!value) return;

    console.group("[ImageUpload]");
    console.log("deleting", value);

    setIsUploading(true);
    const result = await deletePopupImage(value);

    if (result.success) {
      console.log("delete_success");
      onChange(null);
    } else {
      console.error("delete_failed", result.error);
      setUploadError(result.error || "삭제 실패");
    }

    setIsUploading(false);
    console.groupEnd();
  }, [value, onChange]);

  // 파일 선택 다이얼로그 열기
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      {/* 업로드 영역 */}
      {!value && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8
            transition-colors cursor-pointer
            ${isDragging ? "border-primary bg-primary/5" : "border-gray-300"}
            ${disabled || isUploading ? "opacity-50 cursor-not-allowed" : "hover:border-primary"}
          `}
          onClick={!disabled && !isUploading ? openFileDialog : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled || isUploading}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-4 text-center">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                <p className="text-sm text-muted-foreground">업로드 중...</p>
              </>
            ) : (
              <>
                <div className="rounded-full bg-primary/10 p-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    이미지를 드래그하거나 클릭하여 업로드
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, GIF, WEBP (최대 5MB)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 미리보기 */}
      {value && (
        <div className="relative rounded-lg border overflow-hidden">
          <img
            src={value}
            alt="팝업 이미지"
            className="w-full h-auto max-h-96 object-contain bg-gray-50"
          />
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleDelete}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* 에러 메시지 */}
      {uploadError && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {uploadError}
        </div>
      )}
    </div>
  );
}





















