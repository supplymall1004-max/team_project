/**
 * @file app/game/models/credits/page.tsx
 * @description 3D 모델 출처 상세 페이지
 *
 * 게임에서 사용하는 모든 3D 모델의 출처 정보를 상세히 표시합니다.
 */

import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MODEL_CREDITS } from "@/components/game/threejs/model-credits-data";

export const metadata: Metadata = {
  title: "3D 모델 출처 | Flavor Archive",
  description: "게임에서 사용하는 3D 모델의 출처 정보",
};

export default function ModelCreditsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-orange-50/40">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              돌아가기
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            3D 모델 출처
          </h1>
          <p className="mt-2 text-gray-600">
            게임에서 사용하는 모든 3D 모델의 출처 정보입니다.
          </p>
        </div>

        {/* 라이선스 정보 */}
        <div className="mb-8 rounded-lg bg-blue-50 p-6 border border-blue-200">
          <h2 className="mb-2 text-lg font-semibold text-blue-900">
            라이선스 정보
          </h2>
          <p className="text-sm text-blue-800 mb-3">
            모든 모델은{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-900"
            >
              Creative Commons Attribution 4.0 International License (CC BY 4.0)
            </a>
            를 따릅니다.
          </p>
          <p className="text-xs text-blue-700">
            이 라이선스는 모델을 자유롭게 사용, 수정, 배포할 수 있지만, 원작자에게
            적절한 출처 표시가 필요합니다.
          </p>
        </div>

        {/* 모델 목록 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            사용 중인 모델 ({MODEL_CREDITS.length}개)
          </h2>
          {MODEL_CREDITS.map((credit, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {credit.name}
                  </h3>
                  {credit.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {credit.description}
                    </p>
                  )}
                  <div className="mt-3">
                    <a
                      href={credit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 underline"
                    >
                      <span>Sketchfab에서 보기</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 추가 모델 안내 */}
        <div className="mt-8 rounded-lg bg-gray-50 p-6 border border-gray-200">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            새로운 모델 추가 방법
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            새로운 3D 모델을 추가할 때는{" "}
            <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs">
              components/game/threejs/model-credits.tsx
            </code>
            파일의 <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs">MODEL_CREDITS</code> 배열에 모델 정보를 추가하면
            자동으로 이 페이지와 게임 화면 하단에 표시됩니다.
          </p>
          <div className="mt-3 rounded bg-gray-100 p-3">
            <p className="text-xs font-mono text-gray-700 mb-2">예시:</p>
            <pre className="text-xs text-gray-800 overflow-x-auto">
{`{
  name: "새모델",
  url: "https://sketchfab.com/3d-models/...",
  description: "모델 설명 (선택사항)",
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

