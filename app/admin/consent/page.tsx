/**
 * @file app/admin/consent/page.tsx
 * @description 관리자 동의 내역 페이지
 * 
 * 개인정보 처리 동의 내역을 조회하고 출력할 수 있는 관리자 페이지입니다.
 */

import { Suspense } from 'react';
import { ConsentRecordsPageClient } from './consent-page-client';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/loading-spinner';

export const metadata = {
  title: '동의 내역 관리 | 관리자',
  description: '개인정보 처리 동의 내역 조회 및 출력',
};

export const dynamic = 'force-dynamic';

export default function ConsentRecordsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">동의 내역 관리</h1>
        <p className="text-muted-foreground mt-2">
          개인정보 처리 동의 내역을 조회하고 PDF, Excel, HWP 형식으로 출력할 수 있습니다.
        </p>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="py-8">
              <div className="flex justify-center">
                <LoadingSpinner label="동의 내역을 불러오는 중..." />
              </div>
            </CardContent>
          </Card>
        }
      >
        <ConsentRecordsPageClient />
      </Suspense>
    </div>
  );
}

