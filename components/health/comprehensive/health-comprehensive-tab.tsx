/**
 * @file components/health/comprehensive/health-comprehensive-tab.tsx
 * @description 건강 종합 탭(메인 건강관리 페이지용)
 *
 * 목적:
 * - 기존 `/health` 메인 페이지에서 공공 건강정보(마이데이터/건강정보고속도로) + 웨어러블(Fitbit/Google Fit) 관리를 한 곳에서 제공
 * - 향후 확장(가족 비교/리포트/기기 확대)을 고려한 섹션 구조를 유지하되, 현재는 웨어러블 연동을 실제로 동작시키는 데 집중
 *
 * 핵심 구성:
 * 1) 공공 건강정보 동기화: `HealthSyncButton` + `SyncStatusIndicator`
 * 2) 웨어러블/기기 연동: `DeviceConnector` (Fitbit/Google Fit OAuth + 동기화)
 * 3) 확장 모드(준비중): 향후 기능을 위한 자리 표시(사용자 기대치 정렬)
 *
 * @dependencies
 * - components/health/health-sync-button.tsx
 * - components/health/sync-status-indicator.tsx
 * - components/health/devices/device-connector.tsx
 */

'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HealthSyncButton } from '@/components/health/health-sync-button';
import { SyncStatusIndicator } from '@/components/health/sync-status-indicator';
import { DeviceConnector } from '@/components/health/devices/device-connector';
import { ExternalLink, Sparkles, Smartphone, Users, FileText } from 'lucide-react';

interface HealthComprehensiveTabProps {
  className?: string;
}

export function HealthComprehensiveTab({ className }: HealthComprehensiveTabProps) {
  return (
    <div className={`space-y-6 ${className ?? ''}`}>
      <Card className="border-emerald-200 bg-emerald-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-900">
            <Sparkles className="h-5 w-5" />
            종합 건강 관리
            <Badge variant="secondary" className="ml-2">
              확장 모드 포함
            </Badge>
          </CardTitle>
          <CardDescription>
            공공 건강정보(마이데이터/건강정보고속도로)와 웨어러블(Fitbit/Google Fit) 데이터를 한 곳에서 연결하고 동기화하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            데이터 연결이 완료되면 활동량/수면/심박수/체중 등 로그에 자동 반영되어 대시보드·시각화에 활용됩니다.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/health/profile?tab=devices">
                <Smartphone className="h-4 w-4 mr-2" />
                기기 연동 관리
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/health/data-sources">
                <ExternalLink className="h-4 w-4 mr-2" />
                공공 데이터 소스
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/health/sync-status">
                <ExternalLink className="h-4 w-4 mr-2" />
                동기화 상태
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>공공 건강정보 자동 연동</CardTitle>
              <CardDescription>
                마이데이터/건강정보고속도로에서 진료·투약·검진·예방접종 정보를 동기화합니다. (신원확인 및 프리미엄 조건이 적용될 수 있습니다.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <HealthSyncButton />
              <SyncStatusIndicator />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-blue-600" />
                웨어러블/기기 연동 (실사용)
              </CardTitle>
              <CardDescription>
                Fitbit/Google Fit을 연결하고, 동기화된 데이터가 활동·수면·심박수·체중 로그에 저장됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeviceConnector />
              <div className="mt-4 text-xs text-muted-foreground">
                - Fitbit/Google Fit 연동은 환경 변수 설정이 필요할 수 있습니다. 설정이 누락된 경우 연결 시작 시 안내 메시지가 표시됩니다.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            확장 모드 (준비중)
          </CardTitle>
          <CardDescription>
            향후 기능 확장을 고려해 구조를 선반영했습니다. 아래 항목은 순차적으로 활성화될 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base">가족 건강 비교</CardTitle>
                <CardDescription>구성원별 지표 비교/추이/알림</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">준비중</Badge>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base">월간 리포트</CardTitle>
                <CardDescription>PDF 요약, 트렌드, 추천 액션</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">준비중</Badge>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base">인사이트 고도화</CardTitle>
                <CardDescription>지표 기반 목표/식단/운동 추천</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-2">
                <Badge variant="secondary">준비중</Badge>
                <Button asChild size="sm" variant="outline">
                  <Link href="/diet?tab=records">
                    <FileText className="h-4 w-4 mr-2" />
                    식단 기록 보기
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


