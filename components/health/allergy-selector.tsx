'use client';

/**
 * 알레르기 선택 컴포넌트
 * 
 * 8대 주요 알레르기 + 특수 알레르기 + 사용자 정의 입력 지원
 */

import { useState, useEffect } from 'react';
import { Check, Plus, X, AlertTriangle } from 'lucide-react';

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
    allowCustomInput = true,
}: AllergySelectorProps) {
    const [major8Allergies, setMajor8Allergies] = useState<Allergy[]>([]);
    const [specialAllergies, setSpecialAllergies] = useState<Allergy[]>([]);
    const [loading, setLoading] = useState(true);
    const [customInput, setCustomInput] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

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

            if (major8Result.success) {
                setMajor8Allergies(major8Result.data);
            }
            if (specialResult.success) {
                setSpecialAllergies(specialResult.data);
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

    const addCustomAllergy = () => {
        if (!customInput.trim()) return;

        const customCode = `custom_${Date.now()}`;
        onChange([
            ...selectedAllergies,
            { code: customCode, custom_name: customInput.trim() },
        ]);

        setCustomInput('');
        setShowCustomInput(false);
    };

    const removeCustomAllergy = (code: string) => {
        onChange(selectedAllergies.filter((a) => a.code !== code));
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

            {/* 8대 주요 알레르기 */}
            {showMajor8 && major8Allergies.length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">
                        8대 주요 알레르기
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {major8Allergies.map((allergy) => (
                            <button
                                key={allergy.code}
                                type="button"
                                onClick={() => toggleAllergy(allergy)}
                                className={`
                  flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                  ${isSelected(allergy.code)
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-border hover:border-red-300'
                                    }
                `}
                            >
                                <div
                                    className={`
                    flex items-center justify-center w-5 h-5 rounded border-2
                    ${isSelected(allergy.code)
                                            ? 'border-red-500 bg-red-500'
                                            : 'border-muted-foreground'
                                        }
                  `}
                                >
                                    {isSelected(allergy.code) && (
                                        <Check className="w-3 h-3 text-white" />
                                    )}
                                </div>

                                <div className="flex-1 text-left">
                                    <div className="font-medium text-sm">{allergy.name_ko}</div>
                                    {allergy.description && (
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {allergy.description}
                                        </div>
                                    )}
                                </div>

                                {allergy.severity_level === 'critical' && (
                                    <AlertTriangle className={`w-4 h-4 ${getSeverityColor(allergy.severity_level)}`} />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 특수 알레르기 */}
            {showSpecial && specialAllergies.length > 0 && (
                <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">
                        특수 알레르기 및 불내증
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {specialAllergies.map((allergy) => (
                            <button
                                key={allergy.code}
                                type="button"
                                onClick={() => toggleAllergy(allergy)}
                                className={`
                  flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                  ${isSelected(allergy.code)
                                        ? 'border-orange-500 bg-orange-50'
                                        : 'border-border hover:border-orange-300'
                                    }
                `}
                            >
                                <div
                                    className={`
                    flex items-center justify-center w-5 h-5 rounded border-2
                    ${isSelected(allergy.code)
                                            ? 'border-orange-500 bg-orange-500'
                                            : 'border-muted-foreground'
                                        }
                  `}
                                >
                                    {isSelected(allergy.code) && (
                                        <Check className="w-3 h-3 text-white" />
                                    )}
                                </div>

                                <div className="flex-1 text-left">
                                    <div className="font-medium text-sm">{allergy.name_ko}</div>
                                    {allergy.description && (
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {allergy.description}
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 사용자 정의 알레르기 입력 */}
            {allowCustomInput && (
                <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">
                        사용자 정의 알레르기
                    </h4>

                    {/* 선택된 사용자 정의 알레르기 */}
                    {selectedAllergies
                        .filter((a) => a.code.startsWith('custom_'))
                        .map((allergy) => (
                            <div
                                key={allergy.code}
                                className="flex items-center gap-2 p-3 rounded-lg border-2 border-red-500 bg-red-50"
                            >
                                <div className="flex-1 font-medium text-sm">
                                    {allergy.custom_name}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeCustomAllergy(allergy.code)}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                    {/* 추가 버튼 또는 입력 폼 */}
                    {showCustomInput ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customInput}
                                onChange={(e) => setCustomInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addCustomAllergy();
                                    }
                                }}
                                placeholder="알레르기 항원 입력"
                                className="flex-1 px-3 py-2 rounded-lg border-2 border-border focus:border-red-500 outline-none"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={addCustomAllergy}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                추가
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCustomInput(false);
                                    setCustomInput('');
                                }}
                                className="px-4 py-2 border-2 border-border rounded-lg hover:bg-muted"
                            >
                                취소
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowCustomInput(true)}
                            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-border rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm">사용자 정의 알레르기 추가</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
