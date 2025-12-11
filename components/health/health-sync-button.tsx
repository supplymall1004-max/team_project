/**
 * @file components/health/health-sync-button.tsx
 * @description 건강정보 동기화 버튼 컴포넌트
 * 
 * 신원확인이 완료된 사용자만 건강정보를 동기화할 수 있습니다.
 */

'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2, Database } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

export function HealthSyncButton() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  // 신원확인 상태 조회
  const { data: verifications, isLoading: isVerificationsLoading, error: verificationsError } = useQuery({
    queryKey: ['identity-verifications'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/identity/verifications');
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'Identity verifications fetch failed');
        }
        return res.json();
      } catch (error) {
        console.error('[HealthSyncButton] 신원확인 조회 오류:', error);
        throw error;
      }
    },
    enabled: isLoaded && !!user?.id,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5분간 캐시
  });

  const hasVerifiedIdentity = Array.isArray(verifications) && 
    verifications.some((v: any) => v.status === 'verified');

  // 동기화 실행
  const handleSync = async () => {
    console.log('[HealthSyncButton] handleSync 함수 시작');
    console.log('[HealthSyncButton] hasVerifiedIdentity:', hasVerifiedIdentity);

    if (!hasVerifiedIdentity) {
      console.log('[HealthSyncButton] 신원확인 실패로 함수 종료');
      toast({
        title: '신원확인 필요',
        description: '건강정보 동기화를 위해서는 먼저 신원확인이 완료되어야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    console.log('[HealthSyncButton] setIsSyncing(true) 호출');
    setIsSyncing(true);

    try {
      console.log('[HealthSyncButton] fetch 요청 준비');
      console.log('[HealthSyncButton] fetch 요청 시작');
      console.log('[HealthSyncButton] 요청 URL:', '/api/health/sync');
      console.log('[HealthSyncButton] 요청 옵션:', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataSources: ['mydata', 'health_highway'],
          forceSync: false,
        }),
      });

      const response = await fetch('/api/health/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataSources: ['mydata', 'health_highway'],
          forceSync: false,
        }),
      });

      console.log('[HealthSyncButton] fetch 요청 완료, response 객체:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        type: response.type,
        url: response.url,
      });

      // HTTP 상태 코드 먼저 확인
      const status = response.status;
      const statusText = response.statusText;
      const isOk = response.ok;
      const contentType = response.headers.get('content-type');
      const allHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        allHeaders[key] = value;
      });

      console.group('[HealthSyncButton] API 응답 분석');
      console.log('HTTP 상태:', {
        status,
        statusText,
        ok: isOk,
      });
      console.log('응답 헤더:', allHeaders);
      console.log('Content-Type:', contentType);

      // 응답 본문 읽기 (한 번만 호출 가능)
      let data: any = {};
      let responseText = '';

      try {
        responseText = await response.text();
        console.log('응답 본문 길이:', responseText.length);
        console.log('응답 본문 (처음 500자):', responseText.substring(0, 500));
        console.log('응답 본문 (전체):', responseText);
        
        if (responseText && responseText.trim()) {
          if (contentType?.includes('application/json')) {
            try {
              data = JSON.parse(responseText);
              console.log('✅ JSON 파싱 성공');
              console.log('파싱된 데이터 타입:', typeof data);
              console.log('파싱된 데이터 키:', Object.keys(data));
              console.log('파싱된 데이터:', JSON.stringify(data, null, 2));
            } catch (parseError) {
              console.error('❌ JSON 파싱 실패:', parseError);
              console.error('파싱 실패한 텍스트:', responseText);
              console.error('파싱 에러 상세:', {
                name: parseError instanceof Error ? parseError.name : typeof parseError,
                message: parseError instanceof Error ? parseError.message : String(parseError),
                stack: parseError instanceof Error ? parseError.stack : undefined,
              });
              toast({
                title: '동기화 실패',
                description: '서버 응답을 파싱하는 중 오류가 발생했습니다.',
                variant: 'destructive',
              });
              console.groupEnd();
              return;
            }
          } else {
            console.warn('⚠️ JSON이 아닌 응답:', responseText);
            data = { error: responseText || '알 수 없는 응답 형식' };
          }
        } else {
          console.warn('⚠️ 응답 본문이 비어있습니다.');
          console.warn('응답 본문 값:', responseText);
          console.warn('응답 본문 타입:', typeof responseText);
          data = { error: '서버로부터 응답이 없습니다.' };
        }
      } catch (readError) {
        console.error('❌ 응답 본문 읽기 실패:', readError);
        console.error('읽기 에러 상세:', {
          name: readError instanceof Error ? readError.name : typeof readError,
          message: readError instanceof Error ? readError.message : String(readError),
          stack: readError instanceof Error ? readError.stack : undefined,
        });
        data = { error: '응답을 읽는 중 오류가 발생했습니다.' };
      }
      console.groupEnd();

      // HTTP 상태 코드 확인
      if (!isOk) {
        console.group('[HealthSyncButton] HTTP 오류 상세');
        console.warn('HTTP 상태:', { status, statusText });
        console.warn('응답 데이터:', data);
        console.warn('응답 텍스트:', responseText);
        console.warn('데이터 타입:', typeof data);
        console.warn('데이터 키:', data ? Object.keys(data) : 'N/A');
        console.warn('데이터 값:', JSON.stringify(data, null, 2));
        console.groupEnd();
        
        const errorMessage = 
          data?.error || 
          data?.message || 
          (typeof responseText === 'string' && responseText.trim() ? responseText : null) ||
          `서버 오류가 발생했습니다. (${status} ${statusText})`;
        
        toast({
          title: '동기화 실패',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      // 응답 데이터 검증
      if (!data || typeof data !== 'object') {
        console.warn('[HealthSyncButton] 유효하지 않은 응답 데이터:', {
          data,
          type: typeof data,
          responseText,
        });
        toast({
          title: '동기화 실패',
          description: data?.error || '서버로부터 유효한 응답을 받지 못했습니다.',
          variant: 'destructive',
        });
        return;
      }

      // 빈 객체인 경우 특별 처리
      if (Object.keys(data).length === 0) {
        console.warn('[HealthSyncButton] 빈 응답 객체:', {
          data,
          responseText,
          status,
          statusText,
        });
        toast({
          title: '동기화 실패',
          description: '서버로부터 빈 응답을 받았습니다. 서버 로그를 확인해주세요.',
          variant: 'destructive',
        });
        return;
      }

      // 동기화 성공 여부 확인
      console.log('[HealthSyncButton] data.success 값 확인:', {
        success: data.success,
        successType: typeof data.success,
        successIsTrue: data.success === true,
        dataKeys: Object.keys(data),
        dataStringified: JSON.stringify(data, null, 2),
      });

      if (data.success === true) {
        console.log('[HealthSyncButton] ✅ 동기화 성공:', data);
        const recordsCount = data.totalRecordsSynced || 0;
        const successCount = data.dataSources?.filter((ds: any) => ds.status === 'success').length || 0;
        const failedCount = data.dataSources?.filter((ds: any) => ds.status === 'failed').length || 0;
        const skippedCount = data.dataSources?.filter((ds: any) => ds.status === 'skipped').length || 0;
        
        let description = '';
        if (recordsCount > 0) {
          description = `${recordsCount}개의 건강정보가 동기화되었습니다.`;
        } else if (successCount > 0) {
          description = '동기화가 완료되었습니다. (동기화된 레코드 없음)';
        } else if (skippedCount > 0 && failedCount === 0) {
          // 모든 소스가 스킵된 경우
          const skippedSources = data.dataSources
            .filter((ds: any) => ds.status === 'skipped')
            .map((ds: any) => ds.source)
            .join(', ');
          description = `데이터 소스(${skippedSources})가 연결되어 있지 않습니다. 데이터 소스 연결 페이지에서 먼저 연결해주세요.`;
        } else if (failedCount > 0) {
          description = '일부 데이터 소스 동기화에 실패했습니다.';
        } else {
          description = '동기화가 완료되었습니다.';
        }

        toast({
          title: '동기화 완료',
          description,
        });
        // 관련 쿼리 무효화
        queryClient.invalidateQueries({ queryKey: ['health-data'] });
        queryClient.invalidateQueries({ queryKey: ['health-data-sources'] });
      } else {
        // success가 false이거나 undefined인 경우
        // 데이터 소스가 연결되지 않은 경우는 정상적인 상황이므로 warn으로 변경
        const allSkipped = data.dataSources?.every((ds: any) => ds.status === 'skipped') ?? false;
        
        if (allSkipped) {
          // 모든 소스가 스킵된 경우 - 정보성 로그
          console.log('[HealthSyncButton] ℹ️ 동기화 결과: 모든 데이터 소스가 연결되지 않음');
          console.log('[HealthSyncButton] dataSources:', data.dataSources);
        } else {
          // 실제 에러인 경우만 error로 로깅
          console.group('[HealthSyncButton] ❌ 동기화 실패 상세 분석');
          console.warn('data 객체:', data);
          console.warn('data 타입:', typeof data);
          console.warn('data 키:', Object.keys(data));
          console.warn('data 값 (JSON):', JSON.stringify(data, null, 2));
          console.warn('data.success:', data.success);
          console.warn('data.success 타입:', typeof data.success);
          console.warn('data.error:', data.error);
          console.warn('data.dataSources:', data.dataSources);
          console.warn('responseText:', responseText);
          console.groupEnd();
        }
        
        // 응답 분석 및 메시지 추출
        let message = '건강정보 동기화 중 오류가 발생했습니다.';
        let title = '동기화 실패';
        let variant: 'default' | 'destructive' = 'destructive';
        
        // 빈 객체인 경우 특별 처리
        if (Object.keys(data).length === 0) {
          message = '서버로부터 빈 응답을 받았습니다. 서버 로그를 확인해주세요.';
          console.warn('[HealthSyncButton] ⚠️ 빈 객체 감지됨 - 이는 정상적이지 않습니다!');
        } else if (data.error) {
          // API에서 명시적인 에러 메시지가 있는 경우
          message = data.error;
        } else if (data.dataSources && Array.isArray(data.dataSources)) {
          const allSkipped = data.dataSources.every((ds: any) => ds.status === 'skipped');
          const hasFailed = data.dataSources.some((ds: any) => ds.status === 'failed');
          const hasSuccess = data.dataSources.some((ds: any) => ds.status === 'success');
          
          if (allSkipped) {
            // 모든 소스가 스킵된 경우 - 에러가 아닌 안내 메시지
            title = '데이터 소스 연결 필요';
            variant = 'default';
            const skippedSources = data.dataSources
              .filter((ds: any) => ds.status === 'skipped')
              .map((ds: any) => ds.source)
              .join(', ');
            message = `데이터 소스(${skippedSources})가 연결되어 있지 않습니다. 데이터 소스 연결 페이지에서 먼저 연결해주세요.`;
            // 정보성 로그로 변경 (에러 아님)
            console.log('[HealthSyncButton] ℹ️ 모든 데이터 소스가 스킵됨 - 연결 필요');
          } else if (hasFailed) {
            // 일부 실패한 경우
            const failedSources = data.dataSources
              .filter((ds: any) => ds.status === 'failed')
              .map((ds: any) => {
                return ds.error || ds.message || `${ds.source} 동기화 실패`;
              })
              .join('\n');
            message = `일부 데이터 소스 동기화에 실패했습니다:\n${failedSources}`;
          } else if (hasSuccess) {
            // 일부 성공한 경우 (이 경우는 위에서 처리되어야 하지만 안전장치)
            title = '동기화 완료';
            variant = 'default';
            message = '일부 데이터 소스가 성공적으로 동기화되었습니다.';
          }
        } else if (data.message) {
          message = data.message;
        }
        
        toast({
          title,
          description: message,
          variant,
        });
      }
    } catch (error) {
      console.error('[HealthSyncButton] 동기화 중 예외:', error);
      toast({
        title: '동기화 실패',
        description: error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isLoaded || isVerificationsLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">로딩 중...</span>
        </div>
      </Card>
    );
  }

  // 에러 발생 시
  if (verificationsError) {
    console.error('[HealthSyncButton] 신원확인 조회 에러:', verificationsError);
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-red-600">오류 발생</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          신원확인 정보를 불러오는 중 오류가 발생했습니다.
        </p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          새로고침
        </Button>
      </Card>
    );
  }

  if (!hasVerifiedIdentity) {
    return (
      <Card className="p-6 border-yellow-200 bg-yellow-50">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <h3 className="text-lg font-semibold">신원확인 필요</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          건강정보 동기화를 위해서는 먼저 신원확인이 완료되어야 합니다.
        </p>
        <Button asChild variant="outline">
          <a href="/health/data-sources">
            신원확인 하기
          </a>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">건강정보 자동 연동</h3>
            <Badge variant="secondary" className="text-xs">
              프리미엄
            </Badge>
            <Badge variant="outline" className="text-xs text-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              신원확인 완료
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            마이데이터, 건강정보고속도로 등 공공 API를 통해 병원 기록, 건강검진 결과, 약물 기록을 자동으로 가져올 수 있습니다.
          </p>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="/health/data-sources">
                <Database className="h-4 w-4 mr-2" />
                데이터 소스 연결
              </a>
            </Button>
          </div>
        </div>
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          variant="default"
          className="ml-4"
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              동기화 중...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              동기화 실행
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

