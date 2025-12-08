'use client';

/**
 * 질병 선택 컴포넌트
 * 
 * 카테고리별 질병 선택 (다중 선택) + 사용자 정의 입력 지원
 */

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

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
    allowCustomInput = false,
}: DiseaseSelectorProps) {
    const [diseases, setDiseases] = useState<Disease[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDiseases();
    }, []);

    const fetchDiseases = async () => {
        try {
            const response = await fetch('/api/health/diseases');
            const result = await response.json();

            console.log('[DiseaseSelector] API 응답:', result);
            console.log('[DiseaseSelector] 질병 개수:', result.data?.length || 0);

            if (result.success) {
                setDiseases(result.data || []);
            } else {
                console.error('[DiseaseSelector] API 실패:', result.error);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }


    return (
        <div className="space-y-6">
            {/* 체크리스트 형태로 질병 목록 표시 */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {/* 데이터베이스 질병 목록 */}
                {diseases.length === 0 && !loading && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        등록된 질병이 없습니다.
                    </div>
                )}
                
                {diseases.map((disease) => {
                    const selected = isSelected(disease.code);
                    return (
                        <label
                            key={disease.code}
                            htmlFor={`disease-${disease.code}`}
                            className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                selected
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                            }`}
                        >
                            <Checkbox
                                id={`disease-${disease.code}`}
                                checked={selected}
                                onCheckedChange={() => toggleDisease(disease)}
                                className="mt-0.5 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <div className={`font-medium text-sm ${selected ? 'text-primary' : 'text-foreground'}`}>
                                    {disease.name_ko}
                                </div>
                                {disease.description && (
                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {disease.description}
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
