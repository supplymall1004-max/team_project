/**
 * @file image-monitoring-dashboard.tsx
 * @description 이미지 모니터링 대시보드 컴포넌트
 *
 * 주요 기능:
 * 1. 이미지 로딩 성능 메트릭 표시
 * 2. 에러 패턴 분석 차트
 * 3. 캐시 효율성 분석
 * 4. 캐시 정리 수동 실행
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  BarChart3,
  PieChart
} from "lucide-react";
import {
  getImagePerformanceMetrics,
  getErrorPatterns,
  getCacheEfficiency,
  executeCacheCleanup,
  type ImagePerformanceMetrics
} from "@/lib/image-monitoring";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";

interface DashboardMetrics {
  metrics: ImagePerformanceMetrics[];
  errorPatterns: Array<{
    errorCode: string;
    count: number;
    percentage: number;
    avgLoadTime: number;
  }>;
  cacheEfficiency: {
    cacheHitRate: number;
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
  };
}

export function ImageMonitoringDashboard() {
  const supabase = useClerkSupabaseClient();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<{
    success: boolean;
    deletedCount: number;
    error?: string;
  } | null>(null);

  // 데이터 로드
  const loadMetrics = async () => {
    try {
      setRefreshing(true);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // 최근 30일

      const [metricsData, errorPatterns, cacheEfficiency] = await Promise.all([
        getImagePerformanceMetrics(supabase, startDate, endDate),
        getErrorPatterns(supabase, 7), // 최근 7일 에러 패턴
        getCacheEfficiency(supabase, 7) // 최근 7일 캐시 효율성
      ]);

      setMetrics({
        metrics: metricsData,
        errorPatterns,
        cacheEfficiency
      });
    } catch (error) {
      console.error('[Dashboard] 메트릭 로드 실패:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 캐시 정리 실행
  const handleCacheCleanup = async () => {
    try {
      setCleanupLoading(true);
      const result = await executeCacheCleanup(supabase, 'manual', 'admin');
      setLastCleanup(result);
    } catch (error) {
      console.error('[Dashboard] 캐시 정리 실패:', error);
      setLastCleanup({
        success: false,
        deletedCount: 0,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setCleanupLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          메트릭 데이터를 불러올 수 없습니다.
        </AlertDescription>
      </Alert>
    );
  }

  // 최신 메트릭 계산
  const latestMetric = metrics.metrics[0];
  const previousMetric = metrics.metrics[1];

  // 트렌드 계산
  const successRateTrend = latestMetric && previousMetric
    ? latestMetric.successRate - previousMetric.successRate
    : 0;

  const avgLoadTimeTrend = latestMetric && previousMetric
    ? latestMetric.avgLoadTimeMs - previousMetric.avgLoadTimeMs
    : 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">이미지 모니터링 대시보드</h2>
          <p className="text-muted-foreground">
            이미지 로딩 성능 및 캐시 효율성 분석
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadMetrics}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button
            onClick={handleCacheCleanup}
            disabled={cleanupLoading}
            variant="destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            캐시 정리
          </Button>
        </div>
      </div>

      {/* 캐시 정리 결과 알림 */}
      {lastCleanup && (
        <Alert className={lastCleanup.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {lastCleanup.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={lastCleanup.success ? "text-green-800" : "text-red-800"}>
            {lastCleanup.success
              ? `캐시 정리 완료: ${lastCleanup.deletedCount}개 레코드 삭제`
              : `캐시 정리 실패: ${lastCleanup.error}`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* 주요 메트릭 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 성공률 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">성공률</CardTitle>
            {successRateTrend > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : successRateTrend < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-600" />
            ) : (
              <div className="h-4 w-4" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestMetric ? `${latestMetric.successRate.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {successRateTrend !== 0 && `${successRateTrend > 0 ? '+' : ''}${successRateTrend.toFixed(1)}% 전일 대비`}
            </p>
          </CardContent>
        </Card>

        {/* 평균 로딩 시간 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 로딩 시간</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestMetric ? `${latestMetric.avgLoadTimeMs.toFixed(0)}ms` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {avgLoadTimeTrend !== 0 && `${avgLoadTimeTrend > 0 ? '+' : ''}${avgLoadTimeTrend.toFixed(0)}ms 전일 대비`}
            </p>
          </CardContent>
        </Card>

        {/* 캐시 히트율 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">캐시 히트율</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestMetric ? `${latestMetric.cacheHitRate.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.cacheEfficiency.totalRequests}개 요청 중 {metrics.cacheEfficiency.cacheHits}개 히트
            </p>
          </CardContent>
        </Card>

        {/* 총 요청 수 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 요청 수</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestMetric ? latestMetric.totalRequests.toLocaleString() : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              최근 24시간
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 상세 분석 탭 */}
      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="errors">에러 패턴</TabsTrigger>
          <TabsTrigger value="performance">성능 추이</TabsTrigger>
          <TabsTrigger value="cache">캐시 분석</TabsTrigger>
        </TabsList>

        {/* 에러 패턴 탭 */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>에러 패턴 분석 (최근 7일)</CardTitle>
              <CardDescription>
                이미지 로딩 실패의 주요 원인 및 빈도 분석
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.errorPatterns.length > 0 ? (
                <div className="space-y-4">
                  {metrics.errorPatterns.map((pattern) => (
                    <div key={pattern.errorCode} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="destructive">{pattern.errorCode}</Badge>
                        <div>
                          <p className="font-medium">{pattern.count}회 발생</p>
                          <p className="text-sm text-muted-foreground">
                            {pattern.percentage.toFixed(1)}% • 평균 {pattern.avgLoadTime.toFixed(0)}ms
                          </p>
                        </div>
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${pattern.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  최근 7일간 에러가 발생하지 않았습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 성능 추이 탭 */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>성능 추이 (최근 30일)</CardTitle>
              <CardDescription>
                일별 이미지 로딩 성능 변화 추이
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.metrics.length > 0 ? (
                <div className="space-y-4">
                  {/* 간단한 차트 시뮬레이션 */}
                  <div className="h-64 flex items-end justify-between gap-1">
                    {metrics.metrics.slice(0, 14).reverse().map((metric, index) => (
                      <div key={metric.date} className="flex flex-col items-center gap-2">
                        <div
                          className="w-8 bg-blue-500 rounded-t"
                          style={{
                            height: `${Math.max((metric.successRate / 100) * 200, 20)}px`,
                            minHeight: '20px'
                          }}
                        ></div>
                        <span className="text-xs text-muted-foreground rotate-45 origin-top-left">
                          {new Date(metric.date).getDate()}일
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    일별 성공률 추이 (높을수록 좋음)
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  성능 데이터가 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 캐시 분석 탭 */}
        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>캐시 효율성 분석 (최근 7일)</CardTitle>
              <CardDescription>
                캐시 히트율 및 캐시 사용 패턴 분석
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {metrics.cacheEfficiency.cacheHitRate.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">캐시 히트율</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                      style={{ width: `${metrics.cacheEfficiency.cacheHitRate}%` }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">총 요청 수</span>
                    <span className="font-medium">{metrics.cacheEfficiency.totalRequests.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">캐시 히트</span>
                    <span className="font-medium text-green-600">{metrics.cacheEfficiency.cacheHits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">캐시 미스</span>
                    <span className="font-medium text-orange-600">{metrics.cacheEfficiency.cacheMisses.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
