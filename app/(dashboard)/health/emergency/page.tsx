/**
 * 응급조치 메인 페이지
 * 
 * 알레르기 응급조치 정보 및 에피네프린 사용법
 */

import { Phone, AlertTriangle, Siren } from 'lucide-react';
import Link from 'next/link';
import { createClerkSupabaseClient } from '@/lib/supabase/server';

// EmergencyProcedure와 Allergy 인터페이스는 사용되지 않으므로 제거

export default async function EmergencyPage() {
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
        const safeAllergies = allergies || [];

    return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                {/* 헤더 */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <Siren className="w-12 h-12 text-red-600 animate-pulse" />
                        <h1 className="text-4xl font-bold text-red-900">응급조치 안내</h1>
                    </div>
                    <p className="text-lg text-red-700">
                        알레르기 반응 발생 시 즉시 대처하세요
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

                {/* 하단 안내 */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        💡 이 정보는 응급 상황에서의 기본 대처 방법입니다.
                        정확한 진단과 치료는 반드시 의료 전문가와 상담하세요.
                    </p>
                </div>
            </div>
        </div>
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
