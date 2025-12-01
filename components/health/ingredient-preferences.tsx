'use client';

/**
 * 식재료 선호도 입력 컴포넌트
 * 
 * 선호 식재료 및 비선호 식재료 입력
 */

import { useState } from 'react';
import { Plus, X, ThumbsUp, ThumbsDown } from 'lucide-react';

interface IngredientPreferencesProps {
    preferredIngredients: string[];
    excludedIngredients: string[];
    onPreferredChange: (ingredients: string[]) => void;
    onExcludedChange: (ingredients: string[]) => void;
}

export function IngredientPreferences({
    preferredIngredients,
    excludedIngredients,
    onPreferredChange,
    onExcludedChange,
}: IngredientPreferencesProps) {
    const [preferredInput, setPreferredInput] = useState('');
    const [excludedInput, setExcludedInput] = useState('');
    const [showPreferredInput, setShowPreferredInput] = useState(false);
    const [showExcludedInput, setShowExcludedInput] = useState(false);

    const addPreferred = () => {
        const trimmed = preferredInput.trim();
        if (!trimmed) return;

        // 중복 체크
        if (preferredIngredients.includes(trimmed)) {
            alert('이미 추가된 식재료입니다.');
            return;
        }

        // 비선호 목록에 있는지 체크
        if (excludedIngredients.includes(trimmed)) {
            alert('비선호 식재료 목록에 있는 식재료입니다. 먼저 제거해주세요.');
            return;
        }

        onPreferredChange([...preferredIngredients, trimmed]);
        setPreferredInput('');
        setShowPreferredInput(false);
    };

    const removePreferred = (ingredient: string) => {
        onPreferredChange(preferredIngredients.filter((i) => i !== ingredient));
    };

    const addExcluded = () => {
        const trimmed = excludedInput.trim();
        if (!trimmed) return;

        // 중복 체크
        if (excludedIngredients.includes(trimmed)) {
            alert('이미 추가된 식재료입니다.');
            return;
        }

        // 선호 목록에 있는지 체크
        if (preferredIngredients.includes(trimmed)) {
            alert('선호 식재료 목록에 있는 식재료입니다. 먼저 제거해주세요.');
            return;
        }

        onExcludedChange([...excludedIngredients, trimmed]);
        setExcludedInput('');
        setShowExcludedInput(false);
    };

    const removeExcluded = (ingredient: string) => {
        onExcludedChange(excludedIngredients.filter((i) => i !== ingredient));
    };

    return (
        <div className="space-y-6">
            {/* 선호 식재료 */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-green-600" />
                    <h4 className="font-medium text-sm text-muted-foreground">
                        선호 식재료
                    </h4>
                </div>

                <div className="text-xs text-muted-foreground">
                    자주 먹고 싶은 식재료를 추가하면 해당 식재료가 포함된 식단을 우선적으로 추천합니다.
                </div>

                {/* 선호 식재료 목록 */}
                {preferredIngredients.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {preferredIngredients.map((ingredient) => (
                            <div
                                key={ingredient}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border-2 border-green-200 rounded-full"
                            >
                                <span className="text-sm font-medium text-green-900">
                                    {ingredient}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removePreferred(ingredient)}
                                    className="text-green-600 hover:text-green-800"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* 추가 입력 */}
                {showPreferredInput ? (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={preferredInput}
                            onChange={(e) => setPreferredInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addPreferred();
                                }
                            }}
                            placeholder="예: 닭가슴살, 브로콜리, 현미"
                            className="flex-1 px-3 py-2 rounded-lg border-2 border-border focus:border-green-500 outline-none"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={addPreferred}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            추가
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowPreferredInput(false);
                                setPreferredInput('');
                            }}
                            className="px-4 py-2 border-2 border-border rounded-lg hover:bg-muted"
                        >
                            취소
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setShowPreferredInput(true)}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-border rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">선호 식재료 추가</span>
                    </button>
                )}
            </div>

            {/* 비선호 식재료 */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4 text-red-600" />
                    <h4 className="font-medium text-sm text-muted-foreground">
                        비선호 식재료
                    </h4>
                </div>

                <div className="text-xs text-muted-foreground">
                    먹고 싶지 않은 식재료를 추가하면 해당 식재료가 포함된 식단을 제외합니다.
                </div>

                {/* 비선호 식재료 목록 */}
                {excludedIngredients.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {excludedIngredients.map((ingredient) => (
                            <div
                                key={ingredient}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border-2 border-red-200 rounded-full"
                            >
                                <span className="text-sm font-medium text-red-900">
                                    {ingredient}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeExcluded(ingredient)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* 추가 입력 */}
                {showExcludedInput ? (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={excludedInput}
                            onChange={(e) => setExcludedInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addExcluded();
                                }
                            }}
                            placeholder="예: 돼지고기, 버섯, 파"
                            className="flex-1 px-3 py-2 rounded-lg border-2 border-border focus:border-red-500 outline-none"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={addExcluded}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            추가
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowExcludedInput(false);
                                setExcludedInput('');
                            }}
                            className="px-4 py-2 border-2 border-border rounded-lg hover:bg-muted"
                        >
                            취소
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setShowExcludedInput(true)}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-border rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">비선호 식재료 추가</span>
                    </button>
                )}
            </div>

            {/* 안내 메시지 */}
            {(preferredIngredients.length > 0 || excludedIngredients.length > 0) && (
                <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <div className="text-xs text-blue-700">
                        💡 선호도 정보는 식단 추천 시 참고용으로 사용되며, 알레르기나 질병
                        제한보다 우선순위가 낮습니다.
                    </div>
                </div>
            )}
        </div>
    );
}
