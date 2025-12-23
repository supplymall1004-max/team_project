/**
 * @file unified-health-log-form.tsx
 * @description 통합 건강 데이터 입력 폼 컴포넌트
 *
 * 수면, 활동량, 혈압/혈당, 체중 기록을 한 페이지에서 입력할 수 있도록 통합한 컴포넌트입니다.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Moon, 
  Activity, 
  Heart, 
  TrendingUp, 
  Calendar,
  HelpCircle,
  Save,
  Loader2,
  CheckCircle2,
  Bluetooth
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SleepLogForm } from './forms/sleep-log-form';
import { ActivityLogForm } from './forms/activity-log-form';
import { VitalSignsForm } from './forms/vital-signs-form';
import { WeightLogForm } from './forms/weight-log-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BluetoothGuideDialog } from './devices/bluetooth-guide-dialog';

interface UnifiedHealthLogFormProps {
  defaultTab?: 'sleep' | 'activity' | 'vital-signs' | 'weight';
  defaultDate?: string;
}

export function UnifiedHealthLogForm({ 
  defaultTab = 'sleep',
  defaultDate 
}: UnifiedHealthLogFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // URL 파라미터에서 탭 정보 가져오기
  const tabFromUrl = searchParams?.get('tab') as 'sleep' | 'activity' | 'vital-signs' | 'weight' | null;
  const initialTab = tabFromUrl || defaultTab;
  
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // URL 파라미터가 변경되면 탭 업데이트
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);
  const [commonDate, setCommonDate] = useState(
    defaultDate || new Date().toISOString().split('T')[0]
  );
  const [savedTabs, setSavedTabs] = useState<Set<string>>(new Set());

  const handleSuccess = (tab: string) => {
    setSavedTabs(prev => new Set(prev).add(tab));
    setTimeout(() => {
      setSavedTabs(prev => {
        const next = new Set(prev);
        next.delete(tab);
        return next;
      });
    }, 3000);
  };

  const guideContent = {
    sleep: {
      title: '수면 기록 가이드',
      description: '수면 시간과 품질을 기록하여 건강한 수면 패턴을 유지하세요.',
      tips: [
        '권장 수면 시간: 성인 기준 7-9시간',
        '수면 품질 점수는 1-10점으로 평가하세요',
        '수면 단계 정보는 스마트워치나 수면 앱에서 가져올 수 있습니다',
        '매일 기록하면 수면 패턴을 파악하는 데 도움이 됩니다',
      ],
      normalRange: '정상 범위: 7-9시간 (성인 기준)',
    },
    activity: {
      title: '활동량 기록 가이드',
      description: '걸음 수, 운동 시간, 소모 칼로리를 기록하여 활동량을 추적하세요.',
      tips: [
        '권장 걸음 수: 하루 10,000보',
        '운동 시간은 중강도 이상의 활동을 기준으로 합니다',
        '소모 칼로리는 운동 앱이나 피트니스 기기에서 확인할 수 있습니다',
        '매일 기록하면 활동량 목표 달성에 도움이 됩니다',
      ],
      normalRange: '권장량: 걸음 수 10,000보, 운동 시간 30분 이상',
    },
    'vital-signs': {
      title: '혈압/혈당 기록 가이드',
      description: '혈압, 혈당, 심박수를 기록하여 건강 상태를 모니터링하세요.',
      tips: [
        '정상 혈압: 수축기 120mmHg 미만, 이완기 80mmHg 미만',
        '정상 공복 혈당: 100mg/dL 미만',
        '정상 식후 혈당: 140mg/dL 미만',
        '정상 심박수: 60-100bpm (안정 시)',
        '의사와 상의하여 정기적으로 측정하세요',
      ],
      normalRange: '정상 범위: 혈압 120/80 미만, 공복 혈당 100mg/dL 미만',
    },
    weight: {
      title: '체중 기록 가이드',
      description: '체중, 체지방률, 근육량을 기록하여 체성분 변화를 추적하세요.',
      tips: [
        '체중은 매일 같은 시간, 같은 조건에서 측정하세요 (예: 아침 기상 직후)',
        '체지방률과 근육량은 체성분 분석기(InBody 등)로 측정할 수 있습니다',
        '주 2-3회 기록하면 체중 변화 추이를 파악하는 데 도움이 됩니다',
        '급격한 체중 변화가 있다면 의사와 상의하세요',
      ],
      normalRange: 'BMI 정상 범위: 18.5-24.9',
    },
  };

  const currentGuide = guideContent[activeTab as keyof typeof guideContent];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            건강 데이터 입력
          </h1>
          <p className="text-muted-foreground mt-1">
            수면, 활동량, 혈압/혈당, 체중을 한 곳에서 기록하세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 공통 날짜 선택기 */}
          <div className="flex items-center gap-2">
            <Label htmlFor="common-date" className="text-sm whitespace-nowrap">
              날짜:
            </Label>
            <Input
              id="common-date"
              type="date"
              value={commonDate}
              onChange={(e) => setCommonDate(e.target.value)}
              className="w-auto"
            />
          </div>
          {/* 블루투스 가이드 버튼 */}
          <BluetoothGuideDialog 
            trigger={
              <Button variant="outline" size="icon" title="블루투스 연결 가이드">
                <Bluetooth className="h-4 w-4" />
              </Button>
            }
          />
          {/* 도움말 버튼 */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{currentGuide.title}</DialogTitle>
                <DialogDescription>{currentGuide.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">입력 팁</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {currentGuide.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    {currentGuide.normalRange}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 가이드 카드 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">{currentGuide.title}</h3>
              <p className="text-sm text-blue-700 mb-2">{currentGuide.description}</p>
              <p className="text-xs text-blue-600">{currentGuide.normalRange}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sleep" className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            수면
            {savedTabs.has('sleep') && (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            활동량
            {savedTabs.has('activity') && (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
          </TabsTrigger>
          <TabsTrigger value="vital-signs" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            혈압/혈당
            {savedTabs.has('vital-signs') && (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
          </TabsTrigger>
          <TabsTrigger value="weight" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            체중
            {savedTabs.has('weight') && (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
          </TabsTrigger>
        </TabsList>

        {/* 수면 기록 탭 */}
        <TabsContent value="sleep" className="space-y-4">
          <SleepLogForm
            initialData={{ date: commonDate }}
            onSuccess={() => handleSuccess('sleep')}
          />
        </TabsContent>

        {/* 활동량 기록 탭 */}
        <TabsContent value="activity" className="space-y-4">
          <ActivityLogForm
            initialData={{ date: commonDate }}
            onSuccess={() => handleSuccess('activity')}
          />
        </TabsContent>

        {/* 혈압/혈당 기록 탭 */}
        <TabsContent value="vital-signs" className="space-y-4">
          <VitalSignsForm
            initialData={{ measured_at: `${commonDate}T${new Date().toTimeString().slice(0, 5)}` }}
            onSuccess={() => handleSuccess('vital-signs')}
          />
        </TabsContent>

        {/* 체중 기록 탭 */}
        <TabsContent value="weight" className="space-y-4">
          <WeightLogForm
            initialData={{ date: commonDate }}
            onSuccess={() => handleSuccess('weight')}
          />
        </TabsContent>
      </Tabs>

      {/* 하단 안내 */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">💡 입력 팁</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>각 탭에서 독립적으로 저장할 수 있습니다</li>
              <li>저장된 데이터는 건강 대시보드에서 확인할 수 있습니다</li>
              <li>정기적으로 기록하면 건강 트렌드를 파악하는 데 도움이 됩니다</li>
              <li>상단의 날짜를 변경하면 다른 날짜의 데이터를 입력할 수 있습니다</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
