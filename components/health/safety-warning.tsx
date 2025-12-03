'use client';

/**
 * 안전 경고 컴포넌트
 * 
 * 알레르기 경고 및 불확실한 재료 정보 안내
 */

import { AlertTriangle, AlertCircle, Phone } from 'lucide-react';
import Link from 'next/link';

interface SafetyWarningProps {
    allergens?: string[];
    derivedIngredients?: string[];
    uncertainIngredients?: string[];
    severity?: 'critical' | 'high' | 'moderate' | 'safe';
    showEmergencyInfo?: boolean;
}

export function SafetyWarning({
    allergens = [],
    derivedIngredients = [],
    uncertainIngredients = [],
    severity = 'safe',
    showEmergencyInfo = false,
}: SafetyWarningProps) {
    const hasAllergens = allergens.length > 0 || derivedIngredients.length > 0;
    const hasUncertainty = uncertainIngredients.length > 0;

    if (!hasAllergens && !hasUncertainty && severity === 'safe') {
        return null;
    }

    const getSeverityStyles = () => {
        switch (severity) {
            case 'critical':
                return {
                    container: 'bg-red-50 border-red-500',
                    icon: 'text-red-600',
                    title: 'text-red-900',
                    text: 'text-red-700',
                };
            case 'high':
                return {
                    container: 'bg-orange-50 border-orange-500',
                    icon: 'text-orange-600',
                    title: 'text-orange-900',
                    text: 'text-orange-700',
                };
            case 'moderate':
                return {
                    container: 'bg-yellow-50 border-yellow-500',
                    icon: 'text-yellow-600',
                    title: 'text-yellow-900',
                    text: 'text-yellow-700',
                };
            default:
                return {
                    container: 'bg-blue-50 border-blue-500',
                    icon: 'text-blue-600',
                    title: 'text-blue-900',
                    text: 'text-blue-700',
                };
        }
    };

    const styles = getSeverityStyles();

    return (
        <div className="space-y-3">
            {/* 알레르기 경고 */}
            {hasAllergens && (
                <div className={`flex items-start gap-3 p-4 border-2 rounded-lg ${styles.container}`}>
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
                    <div className="flex-1 space-y-2">
                        <div className={`font-semibold text-sm ${styles.title}`}>
                            {severity === 'critical' && '🚨 치명적 위험: 절대 섭취 금지'}
                            {severity === 'high' && '⚠️ 높은 위험: 섭취 주의'}
                            {severity === 'moderate' && '⚠️ 주의 필요'}
                        </div>

                        {allergens.length > 0 && (
                            <div className={`text-xs ${styles.text}`}>
                                <span className="font-medium">알레르기 유발 재료 발견:</span>{' '}
                                {allergens.join(', ')}
                            </div>
                        )}

                        {derivedIngredients.length > 0 && (
                            <div className={`text-xs ${styles.text}`}>
                                <span className="font-medium">알레르기 파생 재료 발견:</span>{' '}
                                {derivedIngredients.join(', ')}
                            </div>
                        )}

                        {severity === 'critical' && (
                            <div className={`text-xs font-semibold ${styles.text} mt-2`}>
                                이 음식을 섭취하면 아나필락시스를 유발할 수 있습니다.
                                절대 섭취하지 마세요.
                            </div>
                        )}

                        {severity === 'high' && (
                            <div className={`text-xs ${styles.text} mt-2`}>
                                심각한 알레르기 반응이 발생할 수 있습니다. 섭취를 피하세요.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 불확실한 재료 정보 안내 */}
            {hasUncertainty && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-500 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <div className="font-semibold text-amber-900 text-sm mb-1">
                            재료 정보 확인 필요
                        </div>
                        <div className="text-amber-700 text-xs">
                            섭취하는 음식의 재료 정보가 다를 수 있습니다. 섭취하시기 전에
                            재료명을 확인하여 알레르기를 일으킬 수 있는 음식의 섭취를
                            예방하시기 바랍니다.
                        </div>
                        {uncertainIngredients.length > 0 && (
                            <div className="text-amber-700 text-xs mt-2">
                                <span className="font-medium">불확실한 재료:</span>{' '}
                                {uncertainIngredients.join(', ')}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 응급 정보 */}
            {showEmergencyInfo && hasAllergens && severity === 'critical' && (
                <div className="flex items-start gap-3 p-4 bg-red-100 border-2 border-red-600 rounded-lg">
                    <Phone className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <div className="font-semibold text-red-900 text-sm mb-1">
                            응급 상황 대처
                        </div>
                        <div className="text-red-700 text-xs space-y-1">
                            <p>알레르기 반응 발생 시:</p>
                            <ol className="list-decimal list-inside space-y-0.5 ml-2">
                                <li>즉시 에피네프린 자가주사기 사용</li>
                                <li>119에 신고</li>
                                <li>응급실로 이동</li>
                            </ol>
                            <Link
                                href="/health/emergency"
                                className="inline-block mt-2 text-red-900 font-semibold underline hover:no-underline"
                            >
                                응급조치 상세 정보 보기 →
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
