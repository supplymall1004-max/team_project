/**
 * @file components/settings/api-keys/api-keys-manager.tsx
 * @description API 키 관리 컴포넌트
 *
 * 주요 기능:
 * 1. API 키 목록 표시
 * 2. 각 API별 발급 가이드 제공
 * 3. API 키 입력/수정/삭제
 */

"use client";

import { useEffect, useState } from "react";
import { getApiKeys } from "@/actions/settings/api-keys";
import { type ApiKey } from "@/types/api-keys";
import { ApiKeyCard } from "./api-key-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function ApiKeysManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getApiKeys();
      setApiKeys(result.data);
    } catch (err) {
      console.error("API 키 조회 실패:", err);
      setError(err instanceof Error ? err.message : "API 키를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeySaved = () => {
    loadApiKeys();
  };

  const handleKeyDeleted = () => {
    loadApiKeys();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">API 키 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>오류</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // API 타입 정의
  const apiTypes = [
    {
      id: "gemini" as const,
      name: "Gemini API",
      description: "Google Gemini AI를 사용한 식사 사진 분석 기능",
      icon: "🤖",
    },
    {
      id: "naver_map" as const,
      name: "네이버 지도 API",
      description: "네이버 지도 표시 기능",
      icon: "🗺️",
    },
    {
      id: "naver_geocoding" as const,
      name: "네이버 지오코딩 API",
      description: "주소를 좌표로 변환하는 기능",
      icon: "📍",
    },
    {
      id: "naver_search" as const,
      name: "네이버 로컬 검색 API",
      description: "주변 장소 검색 기능",
      icon: "🔍",
    },
    {
      id: "pharmacy" as const,
      name: "약국 정보 API",
      description: "공공데이터포털 약국 정보 조회",
      icon: "💊",
    },
    {
      id: "food_safety" as const,
      name: "식약처 레시피 API",
      description: "식약처에서 제공하는 안전한 레시피 정보",
      icon: "🍽️",
    },
    {
      id: "kcdc" as const,
      name: "질병관리청 API",
      description: "질병관리청 건강 정보 조회",
      icon: "🏥",
    },
    {
      id: "weather" as const,
      name: "기상청 날씨 API",
      description: "날씨 정보 조회 기능",
      icon: "🌤️",
    },
  ];

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>API 키 발급 안내</AlertTitle>
        <AlertDescription>
          각 API는 해당 서비스에서 직접 발급받아야 합니다. 아래 가이드를 참고하여 발급받은 후
          키를 입력해주세요.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {apiTypes.map((apiType) => {
          const savedKey = apiKeys.find((key) => key.api_type === apiType.id);
          return (
            <ApiKeyCard
              key={apiType.id}
              apiType={apiType}
              savedKey={savedKey}
              onSaved={handleKeySaved}
              onDeleted={handleKeyDeleted}
            />
          );
        })}
      </div>
    </div>
  );
}

