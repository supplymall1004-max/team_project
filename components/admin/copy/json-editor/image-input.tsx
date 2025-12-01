"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ExternalLink, Image as ImageIcon, X } from "lucide-react";

interface ImageInputProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export function ImageInput({ value, onChange, label }: ImageInputProps) {
    const [previewError, setPreviewError] = useState(false);

    // 값이 변경되면 에러 상태 초기화
    useEffect(() => {
        setPreviewError(false);
    }, [value]);

    return (
        <div className="space-y-2">
            {label && <Label className="text-xs font-medium text-gray-500">{label}</Label>}

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="pl-9"
                        placeholder="https://..."
                    />
                </div>
                {value && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onChange("")}
                        title="지우기"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {value && !previewError && (
                <div className="relative mt-2 rounded-md border border-gray-200 bg-gray-50 p-2">
                    <div className="relative aspect-video w-full overflow-hidden rounded bg-white">
                        {/* Next.js Image 컴포넌트는 외부 도메인 설정이 필요할 수 있으므로 img 태그 사용 고려 */}
                        {/* 여기서는 편의상 img 태그 사용 (Next.js Image는 remotePatterns 설정 필요) */}
                        <img
                            src={value}
                            alt="Preview"
                            className="h-full w-full object-contain"
                            onError={() => setPreviewError(true)}
                        />
                    </div>
                    <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-3 right-3 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                        title="새 탭에서 열기"
                    >
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
            )}

            {value && previewError && (
                <div className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
                    이미지를 불러올 수 없습니다. URL을 확인해주세요.
                </div>
            )}
        </div>
    );
}
