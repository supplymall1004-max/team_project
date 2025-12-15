'use client';

import Link from 'next/link';
import { Siren, ChevronRight, MapPin, Apple } from 'lucide-react';

export function EmergencyQuickAccess() {
    return (
        <div className="py-2 space-y-2">
            {/* 응급조치 안내 */}
            <Link
                href="/health/emergency"
                className="flex items-center justify-between py-2.5 px-4 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 hover:border-red-300 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full group-hover:bg-red-200 transition-colors">
                        <Siren className="w-5 h-5 text-red-600 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-900 text-sm">응급조치 안내</h3>
                        <p className="text-xs text-red-700">알레르기 반응 시 즉시 대처하세요</p>
                    </div>
                </div>
                <ChevronRight className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />
            </Link>

            {/* 주변 의료기관 찾기 */}
            <Link
                href="/health/emergency/medical-facilities"
                className="flex items-center justify-between py-2.5 px-4 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                        <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-900 text-sm">주변 의료기관 찾기</h3>
                        <p className="text-xs text-blue-700">병원, 약국, 동물병원 위치 확인</p>
                    </div>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors" />
            </Link>

            {/* 건강 맞춤 식단 */}
            <Link
                href="/diet"
                className="flex items-center justify-between py-2.5 px-4 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 hover:border-green-300 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                        <Apple className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-green-900 text-sm">건강 맞춤 식단</h3>
                        <p className="text-xs text-green-700">개인 맞춤 식단 상세 정보 확인</p>
                    </div>
                </div>
                <ChevronRight className="w-4 h-4 text-green-400 group-hover:text-green-600 transition-colors" />
            </Link>
        </div>
    );
}
