/**
 * @file unified-health-profile.tsx
 * @description 통합 건강 프로필 컴포넌트
 *
 * 건강 프로필 설정과 건강 데이터 입력을 한 페이지에서 관리할 수 있도록 통합한 컴포넌트입니다.
 * - 기본 정보 탭: 건강 프로필 설정 (나이, 성별, 키, 몸무게, 질병, 알레르기 등)
 * - 데이터 입력 탭: 건강 데이터 입력 (수면, 활동량, 혈압/혈당, 체중)
 * - 기기 연동 탭: 스마트 기기 연동 및 동기화 설정
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Calendar, 
  Smartphone,
  HelpCircle
} from 'lucide-react';
import { HealthProfileForm } from './health-profile-form';
import { UnifiedHealthLogForm } from './unified-health-log-form';
import { DeviceConnector } from './devices/device-connector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface UnifiedHealthProfileProps {
  defaultTab?: 'profile' | 'data-entry' | 'devices';
}

export function UnifiedHealthProfile({ 
  defaultTab = 'profile'
}: UnifiedHealthProfileProps) {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams?.get('tab') as 'profile' | 'data-entry' | 'devices' | null;
  const initialTab = tabFromUrl || defaultTab;
  
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // URL 파라미터가 변경되면 탭 업데이트
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-8 w-8 text-blue-600" />
            건강 프로필 관리
          </h1>
          <p className="text-muted-foreground mt-1">
            건강 정보를 설정하고 데이터를 기록하세요
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <HelpCircle className="h-4 w-4" />
              도움말
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>건강 프로필 관리 가이드</DialogTitle>
              <DialogDescription>
                건강 프로필을 설정하고 데이터를 기록하는 방법을 안내합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <h4 className="font-semibold mb-2">기본 정보 탭</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>나이, 성별, 키, 몸무게 등 기본 신체 정보를 입력하세요</li>
                  <li>질병 및 알레르기 정보를 선택하면 맞춤형 식단 추천에 활용됩니다</li>
                  <li>선호/비선호 식재료를 설정할 수 있습니다</li>
                  <li>칼로리 목표는 자동 계산되거나 수동으로 설정할 수 있습니다</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">데이터 입력 탭</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>수면, 활동량, 혈압/혈당, 체중을 한 곳에서 기록할 수 있습니다</li>
                  <li>각 탭에서 독립적으로 저장할 수 있습니다</li>
                  <li>정기적으로 기록하면 건강 트렌드를 파악하는 데 도움이 됩니다</li>
                  <li>필드 옆의 ℹ️ 아이콘을 클릭하면 상세 설명을 볼 수 있습니다</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">기기 연동 탭</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Google Fit, Fitbit 등 스마트 기기와 연동하여 데이터를 자동으로 가져올 수 있습니다</li>
                  <li>연동 후 자동 또는 수동으로 데이터를 동기화할 수 있습니다</li>
                  <li>연결된 기기는 언제든지 해제할 수 있습니다</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            기본 정보
          </TabsTrigger>
          <TabsTrigger value="data-entry" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            데이터 입력
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            기기 연동
          </TabsTrigger>
        </TabsList>

        {/* 기본 정보 탭 */}
        <TabsContent value="profile" className="space-y-4">
          <HealthProfileForm />
        </TabsContent>

        {/* 데이터 입력 탭 */}
        <TabsContent value="data-entry" className="space-y-4">
          <UnifiedHealthLogForm />
        </TabsContent>

        {/* 기기 연동 탭 */}
        <TabsContent value="devices" className="space-y-4">
          <DeviceConnector />
        </TabsContent>
      </Tabs>
    </div>
  );
}
