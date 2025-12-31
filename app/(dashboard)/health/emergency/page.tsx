/**
 * 응급조치 메인 페이지
 * 
 * 알레르기 응급조치 정보 및 영유아 응급처치 가이드
 */

import { Phone, Siren } from 'lucide-react';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { EmergencyTabsClient } from '@/components/health/emergency-tabs-client';
import { EmergencyBackButton } from '@/components/health/emergency-back-button';
import { ErrorBoundary } from '@/components/error-boundary';

// EmergencyProcedure와 Allergy 인터페이스는 사용되지 않으므로 제거

export default async function EmergencyPage() {
    try {
        // 로그아웃 상태에서도 접근 가능하도록 안전하게 처리
        let safeAllergies: Array<{ code: string; name_ko: string; severity_level: string | null }> = [];
        
        try {
            const supabase = await createClerkSupabaseClient();

            // 응급조치 정보 조회 (사용하지 않지만 향후 확장을 위해 유지)
            // 에러가 발생해도 페이지는 정상적으로 작동하도록 조용히 처리
            const { error: proceduresError } = await supabase
                .from('emergency_procedures')
                .select('*')
                .order('allergy_code');

            if (proceduresError && process.env.NODE_ENV === 'development') {
                // 개발 환경에서만 에러 로깅
                try {
                    const errorInfo = {
                        message: proceduresError.message || '알 수 없는 오류',
                        code: proceduresError.code || 'UNKNOWN',
                        details: proceduresError.details || null,
                        hint: proceduresError.hint || null,
                    };
                    console.warn('⚠️ 응급조치 정보 조회 실패 (무시됨):', errorInfo);
                } catch {
                    // 에러 직렬화 실패 시 조용히 넘어감
                }
            }

            // 알레르기 목록 조회
            const { data: allergies, error: allergiesError } = await supabase
                .from('allergies')
                .select('code, name_ko, severity_level')
                .eq('category', 'major_8')
                .order('name_ko');

            if (allergiesError && process.env.NODE_ENV === 'development') {
                // 개발 환경에서만 에러 로깅
                try {
                    const errorInfo = {
                        message: allergiesError.message || '알 수 없는 오류',
                        code: allergiesError.code || 'UNKNOWN',
                        details: allergiesError.details || null,
                        hint: allergiesError.hint || null,
                    };
                    console.warn('⚠️ 알레르기 목록 조회 실패 (빈 배열 사용):', errorInfo);
                } catch {
                    // 에러 직렬화 실패 시 조용히 넘어감
                }
            }

            // allergies가 없을 경우 빈 배열로 설정
            safeAllergies = allergies || [];
        } catch (authError) {
            // 인증 관련 에러 (로그아웃 상태 등)는 조용히 처리
            // 응급조치 정보는 공개 정보이므로 로그아웃 상태에서도 표시 가능
            if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ 인증 없이 응급조치 페이지 접근 (공개 정보만 표시):', authError);
            }
            // safeAllergies는 이미 빈 배열로 초기화되어 있음
        }

    return (
        <ErrorBoundary
            fallback={
                <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                            <h1 className="text-2xl font-bold text-red-900 mb-2">오류가 발생했습니다</h1>
                            <p className="text-red-700">
                                응급조치 페이지를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
                <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                {/* 뒤로가기 버튼 */}
                <EmergencyBackButton />

                {/* 헤더 */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <Siren className="w-12 h-12 text-red-600 animate-pulse" />
                        <h1 className="text-4xl font-bold text-red-900">응급조치 안내</h1>
                    </div>
                    <p className="text-lg text-red-700">
                        응급 상황 발생 시 즉시 대처하세요
                    </p>
                </div>

                {/* 119 긴급 신고 */}
                <div className="bg-red-600 text-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-start gap-4">
                        <Phone className="w-8 h-8 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-2">긴급 상황 시 119 신고</h2>
                            <p className="text-red-100 mb-4">
                                호흡 곤란, 의식 저하, 심한 부종 등의 증상이 나타나면 즉시 119에 신고하세요.
                            </p>
                            <a
                                href="tel:119"
                                className="inline-block px-6 py-3 bg-white text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors"
                            >
                                119 전화하기
                            </a>
                        </div>
                    </div>
                </div>

                {/* 탭으로 알레르기와 영유아 응급처치 구분 */}
                <EmergencyTabsClient allergies={safeAllergies} />

                {/* 하단 안내 */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        💡 이 정보는 응급 상황에서의 기본 대처 방법입니다.
                        정확한 진단과 치료는 반드시 의료 전문가와 상담하세요.
                    </p>
                </div>
            </div>
        </div>
        </ErrorBoundary>
    );
    } catch (error) {
        console.error('응급조치 페이지 오류:', error);
        return (
            <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                        <h1 className="text-2xl font-bold text-red-900 mb-2">오류가 발생했습니다</h1>
                        <p className="text-red-700">
                            응급조치 정보를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
}
