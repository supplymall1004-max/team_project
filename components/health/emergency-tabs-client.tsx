/**
 * @file emergency-tabs-client.tsx
 * @description 응급조치 페이지 탭 컴포넌트 (Client Component)
 * 
 * 서버 컴포넌트에서 클라이언트 컴포넌트를 안전하게 사용하기 위해 분리
 */

'use client';

import { AlertTriangle, Baby, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BabyEmergencyGuide } from '@/components/health/baby-emergency-guide';
import { ErrorBoundary } from '@/components/error-boundary';

interface EmergencyTabsClientProps {
  allergies: Array<{
    code: string;
    name_ko: string;
    severity_level: string | null;
  }>;
}

export function EmergencyTabsClient({ allergies }: EmergencyTabsClientProps) {
  const safeAllergies = allergies || [];

  return (
    <Tabs defaultValue="baby" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 h-auto p-1">
        <TabsTrigger
          value="baby"
          className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-md"
        >
          <Baby className="w-5 h-5" />
          <span className="font-medium">영유아 응급처치</span>
        </TabsTrigger>
        <TabsTrigger
          value="allergy"
          className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-md"
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">알레르기 응급조치</span>
        </TabsTrigger>
      </TabsList>

      {/* 영유아 응급처치 탭 */}
      <TabsContent value="baby" className="space-y-6">
        <ErrorBoundary
          fallback={
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-yellow-900 mb-2">
                영유아 응급처치 가이드를 불러올 수 없습니다
              </h3>
              <p className="text-yellow-700 text-sm">
                페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
              </p>
            </div>
          }
        >
          <BabyEmergencyGuide />
        </ErrorBoundary>
      </TabsContent>

      {/* 알레르기 응급조치 탭 */}
      <TabsContent value="allergy" className="space-y-8">
        {/* 에피네프린 자가주사기 사용법 */}
        <div className="bg-white rounded-xl border-2 border-red-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold text-red-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            에피네프린 자가주사기 사용법
          </h2>

          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-semibold">
              ⚠️ 아나필락시스 증상이 나타나면 즉시 에피네프린을 투여하세요
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                step: 1,
                title: '안전 캡 제거',
                description: '파란색 안전 캡을 잡고 힘껏 잡아당겨 제거합니다.',
              },
              {
                step: 2,
                title: '투여 부위 확인',
                description: '허벅지 바깥쪽 중앙에 주황색 끝 부분이 향하도록 잡습니다.',
              },
              {
                step: 3,
                title: '주사 및 유지',
                description: '수직(90도)으로 강하게 밀어 넣고 딸깍 소리 확인 후 3-10초 유지합니다.',
              },
              {
                step: 4,
                title: '제거 및 마사지',
                description: '주사기를 제거하고 주사 부위를 10초 정도 마사지합니다.',
              },
            ].map((step) => (
              <div
                key={step.step}
                className="flex gap-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-full font-bold flex-shrink-0">
                  {step.step}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                  <p className="text-gray-700">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-amber-900">주의사항:</p>
            <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
              <li>절대 손가락으로 주황색 끝을 만지지 마세요</li>
              <li>엉덩이에 주사하지 마세요</li>
              <li>옷을 벗길 필요는 없지만 두꺼운 벨트는 피하세요</li>
            </ul>
          </div>
        </div>

        {/* 아나필락시스 증상 */}
        <div className="bg-white rounded-xl border-2 border-orange-200 p-6 space-y-4">
          <h2 className="text-2xl font-bold text-orange-900">
            아나필락시스 위험 신호
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              '호흡 곤란',
              '목이 조이는 느낌',
              '전신 두드러기',
              '심한 구토/설사',
              '어지러움/실신',
              '혈압 저하',
              '빠른 맥박',
              '입술/혀 부종',
            ].map((symptom) => (
              <div
                key={symptom}
                className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200"
              >
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-orange-900 font-medium">{symptom}</span>
              </div>
            ))}
          </div>

          <p className="text-sm text-orange-700 bg-orange-50 p-3 rounded-lg">
            위 증상 중 하나라도 나타나면 즉시 에피네프린을 투여하고 119에 신고하세요.
          </p>
        </div>

        {/* 알레르기별 응급조치 */}
        {safeAllergies && safeAllergies.length > 0 && (
          <div className="bg-white rounded-xl border-2 border-border p-6 space-y-4">
            <h2 className="text-2xl font-bold">알레르기별 상세 응급조치</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {safeAllergies.map((allergy) => (
                <Link
                  key={allergy.code}
                  href={`/health/emergency/${allergy.code}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {allergy.severity_level === 'critical' && (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium">{allergy.name_ko}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">상세 보기 →</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 주변 의료기관 찾기 */}
        <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
          <div className="flex items-start gap-4">
            <MapPin className="w-8 h-8 flex-shrink-0 mt-1 text-blue-600" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-blue-900 mb-2">주변 의료기관 찾기</h2>
              <p className="text-blue-700 mb-4">
                새벽에 아플 때 주변 병원, 약국, 동물병원의 위치를 빠르게 찾아보세요.
              </p>
              <Link
                href="/health/emergency/medical-facilities"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                의료기관 찾기 →
              </Link>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

