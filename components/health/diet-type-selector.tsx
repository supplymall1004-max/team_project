'use client';

/**
 * 프리미엄 식단 타입 선택 컴포넌트
 * 
 * 도시락, 헬스인, 다이어트, 비건 등 프리미엄 식단 타입 선택
 */

import { useState } from 'react';
import { Check, Crown, UtensilsCrossed, Dumbbell, TrendingDown, Leaf } from 'lucide-react';

interface DietaryPreference {
    code: string;
    name: string;
    description: string;
    icon: React.ReactNode;
}

interface DietTypeSelectorProps {
    selectedTypes: string[];
    onChange: (types: string[]) => void;
    isPremium?: boolean;
}

const DIET_TYPES: DietaryPreference[] = [
    {
        code: 'bento',
        name: '도시락 (반찬 위주)',
        description: '보관이 용이한 반찬 중심 식단',
        icon: <UtensilsCrossed className="w-5 h-5" />,
    },
    {
        code: 'fitness',
        name: '헬스인 (고단백)',
        description: '고단백 저지방, 닭가슴살 중심',
        icon: <Dumbbell className="w-5 h-5" />,
    },
    {
        code: 'low_carb',
        name: '다이어트 (저탄수)',
        description: '탄수화물 제한 식단',
        icon: <TrendingDown className="w-5 h-5" />,
    },
    {
        code: 'vegan',
        name: '비건',
        description: '모든 동물성 식품 제외',
        icon: <Leaf className="w-5 h-5" />,
    },
    {
        code: 'vegetarian',
        name: '베지테리언',
        description: '육류, 생선 제외',
        icon: <Leaf className="w-5 h-5" />,
    },
];

export function DietTypeSelector({
    selectedTypes,
    onChange,
    isPremium = false,
}: DietTypeSelectorProps) {
    const isSelected = (code: string) => selectedTypes.includes(code);

    const toggleType = (code: string) => {
        if (!isPremium) return;

        if (isSelected(code)) {
            onChange(selectedTypes.filter((t) => t !== code));
        } else {
            onChange([...selectedTypes, code]);
        }
    };

    return (
        <div className="space-y-4">
            {/* 프리미엄 안내 */}
            {!isPremium && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                    <Crown className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <div className="font-semibold text-amber-900 text-sm mb-1">
                            프리미엄 전용 기능
                        </div>
                        <div className="text-amber-700 text-xs">
                            특수 식단 타입 선택은 프리미엄 회원만 이용 가능합니다.
                            프리미엄으로 업그레이드하여 맞춤형 식단을 받아보세요.
                        </div>
                    </div>
                </div>
            )}

            {/* 식단 타입 선택 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DIET_TYPES.map((type) => (
                    <button
                        key={type.code}
                        type="button"
                        onClick={() => toggleType(type.code)}
                        disabled={!isPremium}
                        className={`
              relative flex items-start gap-3 p-4 rounded-lg border-2 transition-all
              ${isSelected(type.code)
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }
              ${!isPremium ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
                    >
                        {/* 프리미엄 배지 */}
                        {!isPremium && (
                            <div className="absolute top-2 right-2">
                                <Crown className="w-4 h-4 text-amber-500" />
                            </div>
                        )}

                        {/* 아이콘 */}
                        <div
                            className={`
                flex items-center justify-center w-10 h-10 rounded-lg
                ${isSelected(type.code)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                }
              `}
                        >
                            {type.icon}
                        </div>

                        {/* 내용 */}
                        <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{type.name}</span>
                                {isSelected(type.code) && isPremium && (
                                    <Check className="w-4 h-4 text-primary" />
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {type.description}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* 선택된 타입 요약 */}
            {isPremium && selectedTypes.length > 0 && (
                <div className="p-3 bg-primary/5 border-2 border-primary/20 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">
                        선택된 식단 타입
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectedTypes.map((code) => {
                            const type = DIET_TYPES.find((t) => t.code === code);
                            return (
                                <span
                                    key={code}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-medium"
                                >
                                    {type?.name}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
