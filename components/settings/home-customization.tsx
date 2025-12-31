/**
 * @file home-customization.tsx
 * @description 홈페이지 커스터마이징 설정 컴포넌트
 *
 * 주요 기능:
 * 1. 테마 모드 선택 (light, dark, auto)
 * 2. 배경 타입 선택 (gradient, image, color)
 * 3. 배경 이미지 업로드
 * 4. 섹션 순서 변경
 * 5. 기본값 복원
 */

"use client";

import { useState } from "react";
import { useHomeCustomization } from "@/hooks/use-home-customization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Palette, Image, Sparkles, Circle, RotateCcw, Upload } from "lucide-react";
import { SectionReorderHandler } from "@/components/home/section-reorder-handler";
import type { ThemeMode, BackgroundType } from "@/types/home-customization";
import { SECTION_IDS } from "@/types/home-customization";

/** 그라데이션 프리셋 목록 */
const GRADIENT_PRESETS = [
  {
    id: "default",
    name: "기본 (보라/핑크)",
    value: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
  },
  {
    id: "warm-orange",
    name: "따뜻한 주황",
    value: "linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)",
  },
  {
    id: "ocean-blue",
    name: "바다 파랑",
    value: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  },
  {
    id: "forest-green",
    name: "숲 녹색",
    value: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  },
  {
    id: "sunset-pink",
    name: "일몰 핑크",
    value: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  },
  {
    id: "purple-dream",
    name: "보라 꿈",
    value: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  },
  {
    id: "golden-hour",
    name: "황금 시간",
    value: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  },
  {
    id: "cool-mint",
    name: "시원한 민트",
    value: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
  },
  {
    id: "royal-purple",
    name: "로얄 보라",
    value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    id: "coral-reef",
    name: "산호초",
    value: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  },
  {
    id: "lavender-fields",
    name: "라벤더 들판",
    value: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
  },
  {
    id: "emerald-glow",
    name: "에메랄드 빛",
    value: "linear-gradient(135deg, #0ba360 0%, #3cba92 100%)",
  },
] as const;

export function HomeCustomizationSettings() {
  // ⚠️ React Hook 규칙: 모든 Hook은 조건부 return 이전에 호출해야 함
  const {
    customization,
    isLoaded,
    updateThemeMode,
    updateBackgroundType,
    updateBackgroundImage,
    updateBackgroundColor,
    updateCustomGradient,
    updateSectionOrder,
    resetToDefault,
  } = useHomeCustomization();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // 조건부 return은 모든 Hook 호출 이후에
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">설정을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const handleReset = async () => {
    if (!confirm("모든 커스터마이징 설정을 기본값으로 되돌리시겠습니까?")) {
      return;
    }

    setIsResetting(true);
    try {
      await resetToDefault();
      toast({
        title: "기본값으로 복원됨",
        description: "모든 커스터마이징 설정이 기본값으로 되돌아갔습니다.",
      });
    } catch (error) {
      // 개발 환경에서만 에러 로그 출력
      if (process.env.NODE_ENV === "development") {
        console.error("[HomeCustomization] 기본값 복원 실패:", error);
      }
      toast({
        title: "복원 실패",
        description: "기본값으로 복원하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setIsResetting(false), 1000);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "파일 크기 초과",
        description: "이미지 파일은 5MB 이하여야 합니다.",
        variant: "destructive",
      });
      return;
    }

    // 파일 타입 검증
    if (!file.type.startsWith("image/")) {
      toast({
        title: "잘못된 파일 형식",
        description: "이미지 파일만 업로드할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // FormData 생성
      const formData = new FormData();
      formData.append("file", file);

      // API 호출
      const response = await fetch("/api/upload/home-background", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "업로드 실패");
      }

      const result = await response.json();

      if (result.success && result.url) {
        updateBackgroundImage(result.url);
        updateBackgroundType("image");
        toast({
          title: "배경 이미지 업로드됨",
          description: "배경 이미지가 성공적으로 업로드되었습니다.",
        });
      } else {
        throw new Error("업로드 응답 오류");
      }
    } catch (error) {
      // 개발 환경에서만 에러 로그 출력
      if (process.env.NODE_ENV === "development") {
        console.error("[HomeCustomization] 이미지 업로드 실패:", error);
      }
      toast({
        title: "업로드 실패",
        description:
          error instanceof Error
            ? error.message
            : "배경 이미지 업로드에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // input 초기화 (같은 파일 다시 선택 가능하도록)
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* 테마 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            테마 설정
          </CardTitle>
          <CardDescription>홈페이지의 테마 모드를 선택하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme-mode">테마 모드</Label>
            <Select
              value={customization.theme.mode}
              onValueChange={(value) => updateThemeMode(value as ThemeMode)}
            >
              <SelectTrigger id="theme-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">밝은 테마</SelectItem>
                <SelectItem value="dark">어두운 테마</SelectItem>
                <SelectItem value="auto">시스템 설정 따름</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 배경 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            배경 설정
          </CardTitle>
          <CardDescription>홈페이지 배경을 커스터마이징하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="background-type">배경 타입</Label>
            <Select
              value={customization.theme.backgroundType}
              onValueChange={(value) => updateBackgroundType(value as BackgroundType)}
            >
              <SelectTrigger id="background-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gradient">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    그라데이션
                  </div>
                </SelectItem>
                <SelectItem value="image">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    이미지
                  </div>
                </SelectItem>
                <SelectItem value="color">
                  <div className="flex items-center gap-2">
                    <Circle className="w-4 h-4" />
                    단색
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 이미지 업로드 */}
          {customization.theme.backgroundType === "image" && (
            <div className="space-y-2">
              <Label htmlFor="background-image">배경 이미지</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="background-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  disabled={isUploading}
                  asChild
                >
                  <label htmlFor="background-image" className="cursor-pointer">
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </label>
                </Button>
              </div>
              {isUploading && (
                <p className="text-sm text-muted-foreground">
                  이미지를 업로드하는 중...
                </p>
              )}
              {customization.theme.backgroundImageUrl && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-2">현재 배경 이미지:</p>
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                    <img
                      src={customization.theme.backgroundImageUrl}
                      alt="배경 이미지"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      updateBackgroundImage(undefined);
                      toast({
                        title: "배경 이미지 제거됨",
                        description: "배경 이미지가 제거되었습니다.",
                      });
                    }}
                  >
                    이미지 제거
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 단색 배경 */}
          {customization.theme.backgroundType === "color" && (
            <div className="space-y-2">
              <Label htmlFor="background-color">배경 색상</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="background-color"
                  type="color"
                  value={customization.theme.backgroundColor || "#667eea"}
                  onChange={(e) => updateBackgroundColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={customization.theme.backgroundColor || "#667eea"}
                  onChange={(e) => updateBackgroundColor(e.target.value)}
                  placeholder="#667eea"
                  className="flex-1"
                />
              </div>
            </div>
          )}

          {/* 커스텀 그라데이션 */}
          {customization.theme.backgroundType === "gradient" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>그라데이션 프리셋</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {GRADIENT_PRESETS.map((preset) => {
                    const isSelected =
                      customization.theme.customGradient === preset.value;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => updateCustomGradient(preset.value)}
                        className={`relative h-20 rounded-lg border-2 transition-all hover:scale-105 ${
                          isSelected
                            ? "border-primary shadow-md ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        }`}
                        style={{ background: preset.value }}
                        title={preset.name}
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 rounded-lg" />
                        <div className="absolute bottom-1 left-1 right-1">
                          <p className="text-xs font-medium text-white drop-shadow-md text-left">
                            {preset.name}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 right-1">
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-gradient">커스텀 그라데이션 (고급)</Label>
                <Input
                  id="custom-gradient"
                  type="text"
                  value={customization.theme.customGradient || ""}
                  onChange={(e) => updateCustomGradient(e.target.value || undefined)}
                  placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)"
                />
                <p className="text-xs text-muted-foreground">
                  CSS gradient 문법을 사용하여 직접 그라데이션을 설정할 수 있습니다.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 섹션 순서 변경 */}
      <Card>
        <CardHeader>
          <CardTitle>섹션 순서</CardTitle>
          <CardDescription>
            드래그 앤 드롭으로 홈페이지 섹션의 표시 순서를 변경하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectionReorderHandler
            sectionNames={{
              [SECTION_IDS.emergency]: "응급조치 안내",
              [SECTION_IDS.weather]: "날씨 위젯",
              [SECTION_IDS.hero]: "히어로 섹션",
              [SECTION_IDS.characterGame]: "캐릭터 게임",
              [SECTION_IDS.community]: "커뮤니티 미리보기",
            }}
          />
        </CardContent>
      </Card>

      {/* 기본값 복원 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            기본값 복원
          </CardTitle>
          <CardDescription>
            모든 커스터마이징 설정을 초기 상태로 되돌립니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={isResetting}
          >
            {isResetting ? "복원 중..." : "기본값으로 복원"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

