/**
 * @file components/health/pets/pet-important-info-banner.tsx
 * @description 반려동물 사육 시 알아야 할 중요 정보 배너
 * 
 * 주요 기능:
 * 1. 사육 금지 동물 안내
 * 2. 맹견 사육 허가제 안내
 * 3. 법적 의무사항 안내
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Scale, XCircle } from 'lucide-react';

export function PetImportantInfoBanner() {
  return (
    <div className="space-y-4 mb-6">
      <Alert variant="destructive" className="border-2">
        <XCircle className="h-5 w-5" />
        <AlertTitle className="text-lg font-bold">⚠️ 사육 금지 동물</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p className="font-medium">다음 동물들은 법적으로 사육이 금지되거나 제한됩니다:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>야생동물:</strong> 너구리, 오소리, 여우 등 야생에서 포획한 개체</li>
            <li><strong>맹수류:</strong> 사자, 호랑이, 곰 등 (법적으로 개인 사육 불가)</li>
            <li><strong>생태계 교란종:</strong> 붉은귀거북, 뉴트리아, 파랑볼우럭 등 (방생 및 사육 엄격 제한)</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Alert className="border-2 border-orange-500 bg-orange-50">
        <Shield className="h-5 w-5 text-orange-600" />
        <AlertTitle className="text-lg font-bold text-orange-900">🛡️ 맹견 사육 허가제</AlertTitle>
        <AlertDescription className="mt-2 space-y-2 text-orange-900">
          <p className="font-medium">다음 5종은 맹견으로 분류되어 사육 허가제가 필요합니다:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="border-orange-600 text-orange-900">도사견</Badge>
            <Badge variant="outline" className="border-orange-600 text-orange-900">아메리칸 핏불 테리어</Badge>
            <Badge variant="outline" className="border-orange-600 text-orange-900">아메리칸 스태퍼드셔 테리어</Badge>
            <Badge variant="outline" className="border-orange-600 text-orange-900">스태퍼드셔 불 테리어</Badge>
            <Badge variant="outline" className="border-orange-600 text-orange-900">로트와일러</Badge>
          </div>
          <p className="text-sm mt-2">
            <strong>필수 사항:</strong> 관할 지자체 허가 신청 + 책임보험 가입
            <br />
            <span className="text-red-600 font-semibold">허가 없이 사육 시 100만원 이하 과태료</span>
          </p>
        </AlertDescription>
      </Alert>

      <Alert className="border-2 border-blue-500 bg-blue-50">
        <Scale className="h-5 w-5 text-blue-600" />
        <AlertTitle className="text-lg font-bold text-blue-900">📋 법적 의무사항</AlertTitle>
        <AlertDescription className="mt-2 space-y-2 text-blue-900">
          <div className="space-y-2">
            <div>
              <p className="font-medium">개 등록 필수:</p>
              <p className="text-sm ml-2">동물보호법에 따라 개는 마이크로칩 등록이 법적으로 필수입니다.</p>
            </div>
            <div>
              <p className="font-medium">산책 시 준수사항:</p>
              <ul className="list-disc list-inside space-y-1 text-sm ml-2 mt-1">
                <li>리드줄 착용 (2m 이내) - <span className="text-red-600 font-semibold">미착용 시 10만원 이하 과태료</span></li>
                <li>배변 처리 필수 - <span className="text-red-600 font-semibold">미처리 시 10만원 이하 과태료</span></li>
                <li>인식표 착용 (이름, 전화번호 포함)</li>
              </ul>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

