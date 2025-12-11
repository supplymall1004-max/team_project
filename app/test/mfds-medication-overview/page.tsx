/**
 * @file app/test/mfds-medication-overview/page.tsx
 * @description 식약처 의약품개요정보 API 테스트 페이지
 * 
 * 이 페이지에서 의약품개요정보 API 연결 상태를 확인할 수 있습니다.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Search } from "lucide-react";

export default function MfdsMedicationOverviewTestPage() {
  const [itemName, setItemName] = useState("타이레놀");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    console.group("🧪 의약품개요정보 API 테스트 시작");
    console.log("검색어:", itemName);

    try {
      const params = new URLSearchParams({ itemName });
      const response = await fetch(`/api/mfds/medication-overview/test?${params.toString()}`);

      if (!response.ok) {
        // 에러 응답도 JSON으로 파싱 시도
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status} ${response.statusText}` };
        }
        
        console.error("❌ API 응답 오류:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        
        throw new Error(errorData.message || errorData.error || `API 테스트 실패 (${response.status})`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || data.error || "API 테스트 실패");
      }

      console.log("✅ API 테스트 성공:", data);
      setResult(data);
      console.groupEnd();
    } catch (err) {
      console.error("❌ API 테스트 실패:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
      console.groupEnd();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔍 식약처 의약품개요정보 API 테스트</h1>
        <p className="text-muted-foreground">
          의약품개요정보 API (e약은요) 연결 상태를 확인합니다.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>API 테스트</CardTitle>
          <CardDescription>
            의약품명을 입력하여 API가 정상적으로 작동하는지 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">의약품명</label>
              <div className="flex gap-2">
                <Input
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="예: 타이레놀, 아스피린"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) {
                      handleTest();
                    }
                  }}
                />
                <Button onClick={handleTest} disabled={loading || !itemName.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      테스트 중...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      테스트
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                <strong>환경 변수 확인:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>MFDS_API_KEY 또는 MFDS_MEDICATION_OVERVIEW_API_KEY가 설정되어 있어야 합니다.</li>
                  <li>.env.local 파일에 API 키를 추가한 후 서버를 재시작하세요.</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>오류 발생:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              테스트 결과
            </CardTitle>
            <CardDescription>
              {result.success ? "API 연결이 성공했습니다!" : "API 연결에 실패했습니다."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-4">
                <div>
                  <strong>검색어:</strong> {result.data?.testItemName}
                </div>
                <div>
                  <strong>전체 결과 수:</strong> {result.data?.totalCount || 0}건
                </div>
                <div>
                  <strong>조회된 항목 수:</strong> {result.data?.itemsCount || 0}건
                </div>

                {result.data?.items && result.data.items.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">조회된 의약품 정보 (샘플)</h3>
                    <div className="space-y-4">
                      {result.data.items.map((item: any, index: number) => (
                        <Card key={index} className="p-4">
                          <div className="space-y-2">
                            <div>
                              <strong>품목명:</strong> {item.item_name || "N/A"}
                            </div>
                            <div>
                              <strong>업체명:</strong> {item.entp_name || "N/A"}
                            </div>
                            <div>
                              <strong>성분명:</strong> {item.ingr_name || "N/A"}
                            </div>
                            {item.ee_doc_data && (
                              <div>
                                <strong>효능효과:</strong>{" "}
                                <span className="text-sm text-muted-foreground">
                                  {item.ee_doc_data.substring(0, 100)}
                                  {item.ee_doc_data.length > 100 ? "..." : ""}
                                </span>
                              </div>
                            )}
                            {item.nb_doc_data && (
                              <div>
                                <strong>주의사항:</strong>{" "}
                                <span className="text-sm text-muted-foreground">
                                  {item.nb_doc_data.substring(0, 100)}
                                  {item.nb_doc_data.length > 100 ? "..." : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>{result.message || "알 수 없는 오류"}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

