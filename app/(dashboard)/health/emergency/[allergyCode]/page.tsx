/**
 * 알레르기별 응급조치 상세 페이지
 * 
 * 특정 알레르기에 대한 상세 응급조치 정보
 */

import { Phone, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { DirectionalEntrance } from '@/components/motion/directional-entrance';
import { MotionWrapper } from '@/components/motion/motion-wrapper';
import { AnimatedButtonWrapper } from '@/components/motion/animated-button-wrapper';
import { Button } from '@/components/ui/button';

interface PageProps {
    params: Promise<{
        allergyCode: string;
    }>;
}

export default async function AllergyEmergencyPage({ params }: PageProps) {
    const resolvedParams = await params;
    const { allergyCode } = resolvedParams;
    
    try {
        const supabase = await createClerkSupabaseClient();

        // 알레르기 정보 조회
        const { data: allergy, error: allergyError } = await supabase
            .from('allergies')
            .select('*')
            .eq('code', allergyCode)
            .single();

        if (allergyError || !allergy) {
            console.error('알레르기 정보 조회 실패:', allergyError);
            notFound();
        }

        // 응급조치 정보 조회
        const { data: procedures, error: proceduresError } = await supabase
            .from('emergency_procedures')
            .select('*')
            .eq('allergy_code', allergyCode);

        if (proceduresError) {
            console.error('응급조치 정보 조회 실패:', proceduresError);
        }

    return (
        <DirectionalEntrance direction="up" delay={0.3}>
            <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
                <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                    {/* 뒤로 가기 */}
                    <MotionWrapper>
                        <AnimatedButtonWrapper
                            whileHover={{ scale: 1.05, x: -5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Link
                                href="/health/emergency"
                                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>응급조치 메인으로</span>
                            </Link>
                        </AnimatedButtonWrapper>
                    </MotionWrapper>

                {/* 헤더 */}
                <div className="bg-white rounded-xl border-2 border-red-200 p-6">
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-red-900 mb-2">
                                {allergy.name_ko} 알레르기 응급조치
                            </h1>
                            {allergy.description && (
                                <p className="text-red-700">{allergy.description}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 119 긴급 신고 */}
                <div className="bg-red-600 text-white rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <Phone className="w-6 h-6" />
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-1">즉시 119에 신고하세요</h2>
                            <p className="text-red-100 text-sm">
                                심각한 알레르기 반응 발생 시 즉시 응급 서비스에 연락하세요.
                            </p>
                        </div>
                        <AnimatedButtonWrapper
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                            <a
                                href="tel:119"
                                className="inline-block px-6 py-3 bg-white text-red-600 rounded-lg font-bold hover:bg-red-50 shadow-lg"
                            >
                                119
                            </a>
                        </AnimatedButtonWrapper>
                    </div>
                </div>

                {/* 응급조치 절차 */}
                {procedures && procedures.length > 0 && (
                    <div className="space-y-6">
                        {procedures.map((procedure) => (
                            <div
                                key={procedure.id}
                                className="bg-white rounded-xl border-2 border-border p-6 space-y-4"
                            >
                                <h2 className="text-2xl font-bold">{procedure.title_ko}</h2>

                                {/* 단계별 절차 */}
                                {procedure.steps && Array.isArray(procedure.steps) && (
                                    <div className="space-y-3">
                                        <h3 className="font-semibold text-lg">대처 방법:</h3>
                                        {procedure.steps.map((step: { step?: number; title?: string; description: string } | string, index: number) => {
                                            // step이 문자열인 경우와 객체인 경우 모두 처리
                                            const stepData = typeof step === 'string' 
                                                ? { step: index + 1, title: undefined, description: step }
                                                : step;
                                            return (
                                            <div
                                                key={index}
                                                className="flex gap-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200"
                                            >
                                                <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full font-bold flex-shrink-0">
                                                    {stepData.step || index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    {stepData.title && (
                                                        <h4 className="font-bold mb-1">{stepData.title}</h4>
                                                    )}
                                                    <p className="text-gray-700">{stepData.description}</p>
                                                </div>
                                            </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* 위험 신호 */}
                                {procedure.warning_signs && Array.isArray(procedure.warning_signs) && (
                                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-lg text-orange-900 mb-3">
                                            위험 신호:
                                        </h3>
                                        <ul className="space-y-2">
                                            {procedure.warning_signs.map((sign: string, index: number) => (
                                                <li
                                                    key={index}
                                                    className="flex items-center gap-2 text-orange-800"
                                                >
                                                    <AlertTriangle className="w-4 h-4" />
                                                    <span>{sign}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* 119 신고 시기 */}
                                {procedure.when_to_call_911 && (
                                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-lg text-red-900 mb-2">
                                            119 신고 시기:
                                        </h3>
                                        <p className="text-red-800">{procedure.when_to_call_911}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* 추가 안내 */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        💡 알레르기 반응은 개인마다 다를 수 있습니다.
                        평소 주치의와 상담하여 개인별 응급 대처 계획을 수립하세요.
                    </p>
                </div>
            </div>
            </div>
        </DirectionalEntrance>
    );
    } catch (error) {
        console.error('알레르기 응급조치 페이지 오류:', error);
        return (
            <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                        <h1 className="text-2xl font-bold text-red-900 mb-2">오류가 발생했습니다</h1>
                        <p className="text-red-700">
                            응급조치 정보를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
                        </p>
                        <Button
                            asChild
                            variant="destructive"
                            className="mt-4"
                        >
                            <Link href="/health/emergency">
                                응급조치 메인으로 돌아가기
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
}
