'use client';

/**
 * 질병 선택 컴포넌트
 * 
 * 카테고리별 질병 선택 (다중 선택) + 사용자 정의 입력 지원
 */

import { useState, useEffect } from 'react';
import { Check, Plus, X } from 'lucide-react';

interface Disease {
    code: string;
    name_ko: string;
    name_en: string | null;
    category: string | null;
    description: string | null;
}

interface SelectedDisease {
    code: string;
    custom_name: string | null;
}

interface DiseaseSelectorProps {
    selectedDiseases: SelectedDisease[];
    onChange: (diseases: SelectedDisease[]) => void;
    allowCustomInput?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
    metabolic: '대사 질환',
    cardiovascular: '심혈관 질환',
    kidney: '신장 질환',
    gout: '통풍',
    digestive: '위장 질환',
    maternity: '임신 관련',
};

export function DiseaseSelector({
    selectedDiseases,
    onChange,
    allowCustomInput = true,
}: DiseaseSelectorProps) {
    const [diseases, setDiseases] = useState<Disease[]>([]);
    const [loading, setLoading] = useState(true);
    const [customInput, setCustomInput] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

    useEffect(() => {
        fetchDiseases();
    }, []);

    const fetchDiseases = async () => {
        try {
            const response = await fetch('/api/health/diseases');
            const result = await response.json();

            if (result.success) {
                setDiseases(result.data);
            }
        } catch (error) {
            console.error('질병 목록 조회 오류:', error);
        } finally {
            setLoading(false);
        }
    };

    const groupedDiseases = diseases.reduce((acc, disease) => {
        const category = disease.category || 'other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(disease);
        return acc;
    }, {} as Record<string, Disease[]>);

    const isSelected = (code: string) => {
        return selectedDiseases.some((d) => d.code === code);
    };

    const toggleDisease = (disease: Disease) => {
        if (isSelected(disease.code)) {
            onChange(selectedDiseases.filter((d) => d.code !== disease.code));
        } else {
            onChange([...selectedDiseases, { code: disease.code, custom_name: null }]);
        }
    };

    const addCustomDisease = () => {
        if (!customInput.trim()) return;

        const customCode = `custom_${Date.now()}`;
        onChange([
            ...selectedDiseases,
            { code: customCode, custom_name: customInput.trim() },
        ]);

        setCustomInput('');
        setShowCustomInput(false);
    };

    const removeCustomDisease = (code: string) => {
        onChange(selectedDiseases.filter((d) => d.code !== code));
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
            {/* 카테고리별 질병 선택 */}
            {Object.entries(groupedDiseases).map(([category, categoryDiseases]) => (
                <div key={category} className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">
                        {CATEGORY_LABELS[category] || category}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categoryDiseases.map((disease) => (
                            <button
                                key={disease.code}
                                type="button"
                                onClick={() => toggleDisease(disease)}
                                className={`
                  flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                  ${isSelected(disease.code)
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50'
                                    }
                `}
                            >
                                <div
                                    className={`
                    flex items-center justify-center w-5 h-5 rounded border-2
                    ${isSelected(disease.code)
                                            ? 'border-primary bg-primary'
                                            : 'border-muted-foreground'
                                        }
                  `}
                                >
                                    {isSelected(disease.code) && (
                                        <Check className="w-3 h-3 text-primary-foreground" />
                                    )}
                                </div>

                                <div className="flex-1 text-left">
                                    <div className="font-medium text-sm">{disease.name_ko}</div>
                                    {disease.description && (
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {disease.description}
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            {/* 사용자 정의 질병 입력 */}
            {allowCustomInput && (
                <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">
                        사용자 정의 질병
                    </h4>

                    {/* 선택된 사용자 정의 질병 */}
                    {selectedDiseases
                        .filter((d) => d.code.startsWith('custom_'))
                        .map((disease) => (
                            <div
                                key={disease.code}
                                className="flex items-center gap-2 p-3 rounded-lg border-2 border-primary bg-primary/5"
                            >
                                <div className="flex-1 font-medium text-sm">
                                    {disease.custom_name}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeCustomDisease(disease.code)}
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
                                        addCustomDisease();
                                    }
                                }}
                                placeholder="질병명 입력"
                                className="flex-1 px-3 py-2 rounded-lg border-2 border-border focus:border-primary outline-none"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={addCustomDisease}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
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
                            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm">사용자 정의 질병 추가</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
