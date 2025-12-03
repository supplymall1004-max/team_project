'use client';

/**
 * 칼로리 계산기 표시 컴포넌트
 * 
 * 계산 결과, 공식 설명, 조정 내역 표시
 */

import { useState } from 'react';
import { Calculator, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface CalorieResult {
    calories: number;
    bmr: number;
    tdee: number;
    formula: string;
    explanation: string;
    adjustments: {
        disease?: number;
        activity?: number;
    };
}

interface CalorieCalculatorDisplayProps {
    result: CalorieResult | null;
    showFormula: boolean;
    onToggleFormula: () => void;
    loading?: boolean;
}

export function CalorieCalculatorDisplay({
    result,
    showFormula,
    onToggleFormula,
    loading = false,
}: CalorieCalculatorDisplayProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Calculator className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">칼로리를 계산하려면 정보를 입력해주세요</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* 메인 결과 */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border-2 border-primary/20">
                <div className="flex items-center gap-2 mb-4">
                    <Calculator className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">
                        권장 칼로리
                    </span>
                </div>

                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">
                        {result.calories.toLocaleString()}
                    </span>
                    <span className="text-lg text-muted-foreground">kcal/일</span>
                </div>

                <div className="mt-4 text-xs text-muted-foreground">
                    사용 공식: {result.formula}
                </div>
            </div>

            {/* 상세 정보 */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg border-2 border-border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">기초대사량 (BMR)</div>
                    <div className="text-xl font-semibold">
                        {result.bmr.toLocaleString()} <span className="text-sm font-normal">kcal</span>
                    </div>
                </div>

                <div className="p-4 rounded-lg border-2 border-border bg-card">
                    <div className="text-xs text-muted-foreground mb-1">총 소비 칼로리 (TDEE)</div>
                    <div className="text-xl font-semibold">
                        {result.tdee.toLocaleString()} <span className="text-sm font-normal">kcal</span>
                    </div>
                </div>
            </div>

            {/* 조정 내역 */}
            {(result.adjustments.disease || result.adjustments.activity) && (
                <div className="p-4 rounded-lg border-2 border-border bg-card space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Info className="w-4 h-4" />
                        <span>조정 내역</span>
                    </div>

                    {result.adjustments.activity && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">활동량 조정</span>
                            <span className="font-medium text-green-600">
                                +{result.adjustments.activity.toLocaleString()} kcal
                            </span>
                        </div>
                    )}

                    {result.adjustments.disease && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">질병 조정</span>
                            <span className="font-medium text-orange-600">
                                {result.adjustments.disease.toLocaleString()} kcal
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* 공식 설명 토글 */}
            <button
                type="button"
                onClick={onToggleFormula}
                className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors"
            >
                <span className="text-sm font-medium">계산 공식 보기</span>
                {showFormula ? (
                    <ChevronUp className="w-4 h-4" />
                ) : (
                    <ChevronDown className="w-4 h-4" />
                )}
            </button>

            {/* 공식 설명 */}
            {showFormula && (
                <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                    <pre className="text-xs whitespace-pre-wrap font-mono text-foreground">
                        {result.explanation}
                    </pre>
                </div>
            )}
        </div>
    );
}
