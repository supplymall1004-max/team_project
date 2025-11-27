/**
 * @file book-detail-page.tsx
 * @description 건강 정보 책 상세 페이지 컴포넌트
 *
 * 책 스타일의 건강 정보 페이지를 표시하는 컴포넌트입니다.
 */

"use client";

import { Heart, Leaf, Target, Code, CheckCircle } from "lucide-react";

export function BookDetailPage() {
  return (
    <div className="min-h-screen bg-amber-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 책 커버 */}
        <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg shadow-2xl p-8 mb-8 border-4 border-amber-300">
          <div className="text-center">
            <div className="text-6xl mb-4">📚</div>
            <h1 className="text-4xl font-bold text-amber-900 mb-2">건강 정보 대백과</h1>
            <p className="text-amber-700 text-lg">개인 맞춤 식단을 위한 건강 가이드</p>
            <div className="mt-6 text-sm text-amber-600">
              <p>✓ 과학적 근거 기반</p>
              <p>✓ 한국인 건강 특성 반영</p>
              <p>✓ 영양사 검증</p>
            </div>
          </div>
        </div>

        {/* 책 내용 */}
        <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-amber-200">
          {/* 인트로 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <Heart className="h-6 w-6" />
              건강 정보의 중요성
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              건강 정보는 개인 맞춤 식단 추천의 핵심입니다. 정확한 건강 정보를 통해
              더 안전하고 효과적인 식단을 추천받을 수 있습니다.
            </p>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="text-amber-800 font-medium">
                💡 건강 정보 입력으로 얻을 수 있는 이점들:
              </p>
              <ul className="mt-2 space-y-1 text-amber-700">
                <li>• 질병에 맞는 안전한 식단 추천</li>
                <li>• 개인 취향과 알레르기 고려</li>
                <li>• 과학적 근거 기반 영양 계산</li>
                <li>• 지속 가능한 건강 관리</li>
              </ul>
            </div>
          </section>

          {/* 현재 지원 질병 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-amber-900 mb-4">현재 지원하는 건강 관리</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="font-semibold text-red-800 mb-2">당뇨병 관리</h3>
                <p className="text-red-700 text-sm">
                  혈당 조절을 위한 저탄수화물 식단과 식후 혈당 관리
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">고혈압 관리</h3>
                <p className="text-blue-700 text-sm">
                  나트륨 제한과 심장 건강에 좋은 영양소 중심 식단
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">신장질환 관리</h3>
                <p className="text-green-700 text-sm">
                  칼륨, 인 제한과 단백질 조절 중심 식단
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-800 mb-2">고지혈증 관리</h3>
                <p className="text-purple-700 text-sm">
                  콜레스테롤과 포화지방 제한 식단
                </p>
              </div>
            </div>
          </section>

          {/* 알레르기 정보 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <Leaf className="h-6 w-6" />
              알레르기 안전 식단
            </h2>
            <p className="text-gray-700 mb-4">
              주요 식품 알레르기를 고려한 식단을 제공합니다:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {["우유", "계란", "땅콩", "견과류", "생선", "갑각류", "밀", "대두"].map((allergy) => (
                <div key={allergy} className="bg-orange-50 px-3 py-2 rounded text-center text-orange-800 text-sm border border-orange-200">
                  {allergy}
                </div>
              ))}
            </div>
          </section>

          {/* 개인 맞춤 기능 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <Target className="h-6 w-6" />
              개인 맞춤 식단 추천
            </h2>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">신체 정보 기반 계산</h3>
                <p className="text-blue-700 text-sm">
                  키, 몸무게, 나이, 성별, 활동량을 고려한 칼로리 계산과 영양소 배분
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">선호도 반영</h3>
                <p className="text-green-700 text-sm">
                  좋아하는 식재료는 더 많이, 싫어하는 식재료는 피해서 추천
                </p>
              </div>
            </div>
          </section>

          {/* 사용 방법 */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <Code className="h-6 w-6" />
              건강 정보 입력 방법
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                <div>
                  <h4 className="font-semibold text-gray-900">기본 정보 입력</h4>
                  <p className="text-gray-600 text-sm">나이, 성별, 키, 몸무게, 활동량을 입력하세요.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                <div>
                  <h4 className="font-semibold text-gray-900">건강 상태 선택</h4>
                  <p className="text-gray-600 text-sm">가지고 있는 질병이나 건강 상태를 선택하세요.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                <div>
                  <h4 className="font-semibold text-gray-900">알레르기 정보</h4>
                  <p className="text-gray-600 text-sm">알레르기가 있는 식품을 선택하세요.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                <div>
                  <h4 className="font-semibold text-gray-900">식재료 선호도</h4>
                  <p className="text-gray-600 text-sm">좋아하는 식재료와 싫어하는 식재료를 입력하세요.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 결론 */}
          <section>
            <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <CheckCircle className="h-6 w-6" />
              건강한 식단 생활 시작하기
            </h2>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-lg border border-amber-200">
              <p className="text-gray-800 mb-4">
                정확한 건강 정보를 입력하면 AI가 당신에게 최적화된 식단을 추천해드립니다.
                건강 관리의 첫 걸음, 지금 바로 시작해보세요!
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">개인 맞춤</span>
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">과학적 근거</span>
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">안전 우선</span>
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">지속 가능</span>
              </div>
            </div>
          </section>

          {/* 책 바닥 장식 */}
          <footer className="text-center mt-12 pt-8 border-t border-amber-300">
            <div className="h-px bg-gradient-to-r from-transparent via-amber-600 to-transparent mb-4"></div>
            <p className="text-amber-700 italic font-serif text-sm md:text-base">건강 정보 대백과 - 끝</p>
          </footer>
        </div>
      </div>
    </div>
  );
}