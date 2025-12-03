'use client';

import Link from 'next/link';
import { Siren, ChevronRight } from 'lucide-react';

export function EmergencyQuickAccess() {
    return (
        <div className="px-4 py-2 pt-16">
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
        </div>
    );
}
