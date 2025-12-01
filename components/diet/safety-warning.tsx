/**
 * @file components/diet/safety-warning.tsx
 * @description 식단 안전 경고 컴포넌트
 */

import { AlertTriangle } from "lucide-react";

export function SafetyWarning() {
    return (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 mt-8">
            <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                    <h4 className="font-semibold text-yellow-800 mb-1">
                        알레르기 주의 안내
                    </h4>
                    <p className="text-sm text-yellow-700">
                        섭취하는 음식의 재료 정보가 다를 수 있습니다. 섭취하시기 전에 재료명을
                        확인하여 알레르기를 일으킬 수 있는 음식의 섭취를 예방 하시기 바랍니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
