/**
 * @file storybook-section.tsx
 * @description 홈페이지에 표시되는 마카의 음식 동화 섹션 컴포넌트
 * 
 * 주요 기능:
 * 1. 홈페이지에 마카의 음식 동화 섹션 표시
 * 2. 카드 형태로 간단한 미리보기 제공
 * 3. 클릭 시 스토리북 페이지로 이동
 */

"use client"

import Link from "next/link"
import { BookOpen } from "lucide-react"

export function StorybookSection() {
  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16 bg-gradient-to-br from-orange-50 via-white to-amber-50" aria-labelledby="storybook-title">
      <div className="max-w-6xl mx-auto">
        {/* 섹션 제목 */}
        <div className="flex items-center justify-between mb-6">
          <h2 id="storybook-title" className="text-2xl sm:text-3xl font-bold text-gray-900">
            📖 마카의 음식 동화
          </h2>
          <Link
            href="/storybook"
            className="text-sm sm:text-base text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            전체보기 →
          </Link>
        </div>

        {/* 설명 */}
        <p className="text-gray-600 mb-8 text-sm sm:text-base">
          전통 음식의 탄생과 역사를 동화처럼 들려주는 이야기입니다. 선물 상자를 클릭하여 다양한 음식 이야기를 들어보세요.
        </p>

        {/* 카드 */}
        <Link
          href="/storybook"
          className="group block rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
        >
          <div className="relative h-48 sm:h-64 bg-gradient-to-br from-[#1a0f0a] via-[#2d1810] to-[#1a0f0a] overflow-hidden">
            {/* 배경 장식 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl sm:text-8xl opacity-20">📺</div>
            </div>
            
            {/* 오버레이 그라데이션 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            
            {/* 콘텐츠 */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold">맛카의 음식 동화</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-200">
                막걸리, 떡, 김치, 비빔밥 등 다양한 음식의 이야기를 만나보세요
              </p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  )
}

