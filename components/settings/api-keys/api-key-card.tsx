/**
 * @file components/settings/api-keys/api-key-card.tsx
 * @description 개별 API 키 카드 컴포넌트
 *
 * 각 API별로 키 입력, 수정, 삭제 기능을 제공합니다.
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { saveApiKey, deleteApiKey } from "@/actions/settings/api-keys";
import { type ApiKey, type ApiType } from "@/types/api-keys";
import { ApiKeyGuide } from "./api-key-guide";
import { Eye, EyeOff, CheckCircle2, XCircle, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface ApiKeyCardProps {
  apiType: {
    id: ApiType;
    name: string;
    description: string;
    icon: string;
  };
  savedKey?: ApiKey;
  onSaved: () => void;
  onDeleted: () => void;
}

export function ApiKeyCard({ apiType, savedKey, onSaved, onDeleted }: ApiKeyCardProps) {
  const [isEditing, setIsEditing] = useState(!savedKey);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState(savedKey?.api_key || "");
  const [clientId, setClientId] = useState(
    savedKey?.metadata?.client_id || ""
  );
  const [clientSecret, setClientSecret] = useState(
    savedKey?.metadata?.client_secret || ""
  );
  const [showGuide, setShowGuide] = useState(false);

  // savedKey가 변경될 때 상태 업데이트
  useEffect(() => {
    if (savedKey) {
      setApiKey(savedKey.api_key || "");
      setClientId(savedKey.metadata?.client_id || "");
      setClientSecret(savedKey.metadata?.client_secret || "");
      setIsEditing(false);
    } else {
      setApiKey("");
      setClientId("");
      setClientSecret("");
      setIsEditing(true);
    }
  }, [savedKey]);

  // Client ID와 Secret이 모두 필요한 API
  const needsClientSecret = ["naver_geocoding", "naver_search"].includes(apiType.id);
  // Client ID만 필요한 API (지도는 API Key 자리에 Client ID 입력)
  const needsClientIdOnly = ["naver_map"].includes(apiType.id);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error("API 키를 입력해주세요");
      return;
    }

    if (needsClientSecret && (!clientId.trim() || !clientSecret.trim())) {
      toast.error("Client ID와 Client Secret을 모두 입력해주세요");
      return;
    }

    if (needsClientIdOnly && !apiKey.trim()) {
      toast.error("Client ID를 입력해주세요");
      return;
    }

    try {
      setIsSubmitting(true);

      const metadata: Record<string, any> = {};
      if (needsClientSecret) {
        metadata.client_id = clientId.trim();
        metadata.client_secret = clientSecret.trim();
      }

      await saveApiKey({
        api_type: apiType.id,
        api_key: apiKey.trim(),
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });

      toast.success("API 키가 저장되었습니다");
      setIsEditing(false);
      onSaved();
    } catch (error) {
      console.error("API 키 저장 실패:", error);
      toast.error(error instanceof Error ? error.message : "API 키 저장에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 이 API 키를 삭제하시겠습니까?")) {
      return;
    }

    try {
      setIsSubmitting(true);
      await deleteApiKey({ api_type: apiType.id });
      toast.success("API 키가 삭제되었습니다");
      setApiKey("");
      setClientId("");
      setClientSecret("");
      setIsEditing(true);
      onDeleted();
    } catch (error) {
      console.error("API 키 삭제 실패:", error);
      toast.error(error instanceof Error ? error.message : "API 키 삭제에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{apiType.icon}</span>
            <div>
              <CardTitle className="flex items-center gap-2">
                {apiType.name}
                {savedKey && (
                  <Badge variant={savedKey.status === "active" ? "default" : "secondary"}>
                    {savedKey.status === "active" ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {savedKey.status === "active" ? "활성" : "비활성"}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{apiType.description}</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGuide(!showGuide)}
          >
            {showGuide ? "가이드 숨기기" : "발급 가이드"}
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardHeader>

      {showGuide && (
        <CardContent className="pb-4">
          <ApiKeyGuide apiType={apiType.id} />
        </CardContent>
      )}

      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor={`api-key-${apiType.id}`}>
                {needsClientIdOnly ? "Client ID" : "API Key"}
                {needsClientSecret && " (또는 Client ID)"}
              </Label>
              <div className="relative">
                <Input
                  id={`api-key-${apiType.id}`}
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="API 키를 입력하세요"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {needsClientSecret && (
              <>
                <div className="space-y-2">
                  <Label htmlFor={`client-id-${apiType.id}`}>Client ID</Label>
                  <Input
                    id={`client-id-${apiType.id}`}
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Client ID를 입력하세요"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`client-secret-${apiType.id}`}>Client Secret</Label>
                  <div className="relative">
                    <Input
                      id={`client-secret-${apiType.id}`}
                      type={showKey ? "text" : "password"}
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="Client Secret을 입력하세요"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {needsClientIdOnly && (
              <Alert>
                <AlertDescription className="text-sm text-muted-foreground">
                  네이버 지도 API는 Client ID만 필요합니다. 위 입력란에 Client ID를 입력하세요.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "저장 중..." : "저장"}
              </Button>
              {savedKey && (
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
                  취소
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label>저장된 API 키</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  value={apiKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  수정
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {needsClientSecret && savedKey?.metadata && (
              <Alert>
                <AlertDescription>
                  <div className="space-y-1 text-sm">
                    <div>
                      <strong>Client ID:</strong> {savedKey.metadata.client_id ? "설정됨" : "미설정"}
                    </div>
                    <div>
                      <strong>Client Secret:</strong> {savedKey.metadata.client_secret ? "설정됨" : "미설정"}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

