/**
 * @file vaccination-api-data.tsx
 * @description 질병청 API 예방접종 데이터 표시 컴포넌트
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading-spinner';
import { AlertCircle } from 'lucide-react';

interface VaccinationApiData {
  name: string;
  targetAgeGroup: string;
  recommendedDate?: string;
  description: string;
  publishedAt: string;
}

interface VaccinationApiStats {
  total: number;
  byLifecycle: {
    infant: number;
    adolescent: number;
    adult: number;
    elderly: number;
  };
  bySituation: {
    std: number;
    travel: number;
    seasonal: number;
  };
}

export function VaccinationApiData() {
  const [data, setData] = useState<VaccinationApiData[]>([]);
  const [stats, setStats] = useState<VaccinationApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/health/vaccinations/analyze');
        
        if (!response.ok) {
          throw new Error('데이터를 가져오는데 실패했습니다.');
        }

        const result = await response.json();
        
        if (result.success) {
          setData(result.data.all || []);
          setStats(result.stats);
        } else {
          throw new Error(result.message || '데이터를 가져오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('예방접종 데이터 로드 실패:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <LoadingSpinner />
        <p className="mt-4 text-sm text-sky-700">질병청 API에서 예방접종 데이터를 가져오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border-2 border-red-200 bg-red-50/50 p-6">
        <div className="flex items-center gap-2 text-red-900 mb-2">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-semibold">데이터 로드 실패</h3>
        </div>
        <p className="text-red-800">{error}</p>
        <p className="text-sm text-red-700 mt-2">
          질병청 API 연결에 문제가 있을 수 있습니다. 잠시 후 다시 시도해주세요.
        </p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
        <p className="text-sky-800">현재 질병청 API에서 제공하는 예방접종 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 통계 정보 */}
      {stats && (
        <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
          <h3 className="text-xl font-bold text-sky-900 mb-4">📊 질병청 API 데이터 통계</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-sky-100">
              <p className="text-sm text-sky-700 mb-1">전체</p>
              <p className="text-2xl font-bold text-sky-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-sky-100">
              <p className="text-sm text-sky-700 mb-1">영유아기</p>
              <p className="text-2xl font-bold text-sky-900">{stats.byLifecycle.infant}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-sky-100">
              <p className="text-sm text-sky-700 mb-1">청소년기</p>
              <p className="text-2xl font-bold text-sky-900">{stats.byLifecycle.adolescent}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-sky-100">
              <p className="text-sm text-sky-700 mb-1">성인기</p>
              <p className="text-2xl font-bold text-sky-900">{stats.byLifecycle.adult}</p>
            </div>
          </div>
        </div>
      )}

      {/* 예방접종 목록 */}
      <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
        <h3 className="text-xl font-bold text-sky-900 mb-4">
          💉 질병청 API 예방접종 데이터 ({data.length}건)
        </h3>
        <div className="space-y-3">
          {data.map((vaccine, index) => (
            <Card key={index} className="border-sky-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg text-sky-900">{vaccine.name}</CardTitle>
                  <Badge variant="outline" className="bg-sky-100 text-sky-800 border-sky-300">
                    {vaccine.targetAgeGroup}
                  </Badge>
                </div>
                {vaccine.recommendedDate && (
                  <CardDescription className="text-sky-700">
                    권장 접종일: {vaccine.recommendedDate}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sky-800 text-sm">{vaccine.description}</p>
                <p className="text-xs text-sky-600 mt-2">
                  발행일: {new Date(vaccine.publishedAt).toLocaleDateString('ko-KR')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

