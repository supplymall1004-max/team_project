'use client';

/**
 * 알레르기 선택 컴포넌트
 * 
 * 8대 주요 알레르기 + 특수 알레르기 + 사용자 정의 입력 지원
 */

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface Allergy {
    code: string;
    name_ko: string;
    name_en: string | null;
    category: string | null;
    severity_level: string;
    description: string | null;
}

interface SelectedAllergy {
    code: string;
    custom_name: string | null;
}

interface AllergySelectorProps {
    selectedAllergies: SelectedAllergy[];
    onChange: (allergies: SelectedAllergy[]) => void;
    showMajor8?: boolean;
    showSpecial?: boolean;
    allowCustomInput?: boolean;
}

export function AllergySelector({
    selectedAllergies,
    onChange,
    showMajor8 = true,
    showSpecial = true,
    allowCustomInput = false,
}: AllergySelectorProps) {
    const [major8Allergies, setMajor8Allergies] = useState<Allergy[]>([]);
    const [specialAllergies, setSpecialAllergies] = useState<Allergy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllergies();
    }, []);

    const fetchAllergies = async () => {
        try {
            const [major8Response, specialResponse] = await Promise.all([
                fetch('/api/health/allergies?category=major_8'),
                fetch('/api/health/allergies?category=special'),
            ]);

            const major8Result = await major8Response.json();
            const specialResult = await specialResponse.json();

            console.log('[AllergySelector] 8대 알레르기 응답:', major8Result);
            console.log('[AllergySelector] 특수 알레르기 응답:', specialResult);
            console.log('[AllergySelector] 8대 알레르기 개수:', major8Result.data?.length || 0);
            console.log('[AllergySelector] 특수 알레르기 개수:', specialResult.data?.length || 0);

            if (major8Result.success) {
                setMajor8Allergies(major8Result.data || []);
            } else {
                console.error('[AllergySelector] 8대 알레르기 API 실패:', major8Result.error);
            }
            if (specialResult.success) {
                setSpecialAllergies(specialResult.data || []);
            } else {
                console.error('[AllergySelector] 특수 알레르기 API 실패:', specialResult.error);
            }
        } catch (error) {
            console.error('알레르기 목록 조회 오류:', error);
        } finally {
            setLoading(false);
        }
    };

    const isSelected = (code: string) => {
        return selectedAllergies.some((a) => a.code === code);
    };

    const toggleAllergy = (allergy: Allergy) => {
        if (isSelected(allergy.code)) {
            onChange(selectedAllergies.filter((a) => a.code !== allergy.code));
        } else {
            onChange([...selectedAllergies, { code: allergy.code, custom_name: null }]);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'text-red-600';
            case 'high':
                return 'text-orange-600';
            case 'moderate':
                return 'text-yellow-600';
            default:
                return 'text-muted-foreground';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // 모든 알레르기를 하나의 리스트로 합치기 (사용자 정의 제외)
    const allAllergies = [...major8Allergies, ...specialAllergies];

    return (
        <div className="space-y-6">
            {/* 경고 메시지 */}
            {selectedAllergies.length > 0 && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <div className="font-semibold text-red-900 text-sm">
                            알레르기 안전 경고
                        </div>
                        <div className="text-red-700 text-xs mt-1">
                            선택한 알레르기 항원과 모든 파생 재료가 식단에서 엄격하게 제외됩니다.
                            생명을 위협할 수 있으므로 정확히 선택해 주세요.
                        </div>
                    </div>
                </div>
            )}

            {/* 체크리스트 형태로 알레르기 목록 표시 */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {/* 데이터베이스 알레르기 목록 */}
                {allAllergies.length === 0 && !loading && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        등록된 알레르기가 없습니다.
                    </div>
                )}
                
                {allAllergies.map((allergy) => {
                    const selected = isSelected(allergy.code);
                    const isCritical = allergy.severity_level === 'critical';
                    return (
                        <label
                            key={allergy.code}
                            htmlFor={`allergy-${allergy.code}`}
                            className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                selected
                                    ? isCritical
                                        ? 'border-red-500 bg-red-50 shadow-sm'
                                        : 'border-orange-500 bg-orange-50 shadow-sm'
                                    : 'border-border hover:border-red-300 hover:bg-muted/30'
                            }`}
                        >
                            <Checkbox
                                id={`allergy-${allergy.code}`}
                                checked={selected}
                                onCheckedChange={() => toggleAllergy(allergy)}
                                className="mt-0.5 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`font-medium text-sm ${
                                        selected && isCritical ? 'text-red-900' : 
                                        selected ? 'text-orange-900' : 
                                        'text-foreground'
                                    }`}>
                                        {allergy.name_ko}
                                    </span>
                                    {isCritical && (
                                        <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${getSeverityColor(allergy.severity_level)}`} />
                                    )}
                                </div>
                                {allergy.description && (
                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {allergy.description}
                                    </div>
                                )}
                            </div>
                        </label>
                    );
                })}

            </div>
        </div>
    );
}
