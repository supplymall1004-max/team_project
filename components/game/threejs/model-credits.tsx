/**
 * @file components/game/threejs/model-credits.tsx
 * @description 3D 모델 출처 표시 컴포넌트
 *
 * 게임창 아래에 모델 출처를 표시합니다.
 */

"use client";

import Link from "next/link";
import { MODEL_CREDITS } from "./model-credits-data";
import type { ModelCredit } from "./model-credits-data";

interface ModelCreditsProps {
  className?: string;
}

/**
 * 모델 출처 표시 컴포넌트
 */
export function ModelCredits({ className = "" }: ModelCreditsProps) {
  return (
    <div
      className={`bg-black/70 text-white text-[10px] px-4 py-1.5 rounded-t-lg border-t border-white/20 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-white/70">3D 모델 출처:</span>
        {MODEL_CREDITS.map((credit, index) => (
          <span key={index} className="flex items-center gap-1">
            <span className="text-white/90">{credit.name}</span>
            {index < MODEL_CREDITS.length - 1 && <span className="text-white/50">•</span>}
          </span>
        ))}
        <span className="text-white/50 ml-2">
          (CC Attribution 4.0 -{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-300 hover:text-blue-200 underline"
          >
            라이선스
          </a>
          ){" "}
          <Link
            href="/game/models/credits"
            className="text-blue-300 hover:text-blue-200 underline ml-1"
          >
            상세보기
          </Link>
        </span>
      </div>
    </div>
  );
}

