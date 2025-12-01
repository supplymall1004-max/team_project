import { Suspense } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function SuccessContent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-xl p-12">
          {/* 성공 아이콘 */}
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          </div>

          {/* 메시지 */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            결제가 완료되었습니다!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            맛의 아카이브 프리미엄에 오신 것을 환영합니다.
            <br />
            14일 무료 체험이 시작되었습니다.
          </p>

          {/* 혜택 안내 */}
          <div className="bg-orange-50 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-bold text-gray-900 mb-4">프리미엄 혜택</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                광고 없는 HD 영상 시청
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                가족 맞춤 AI 식단 추천
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                무제한 레시피 북마크
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                전체 식단 히스토리
              </li>
            </ul>
          </div>

          {/* CTA 버튼 */}
          <div className="space-y-3">
            <Link
              href="/diet"
              className="block w-full py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              AI 맞춤 식단 보러가기 <ArrowRight className="inline w-4 h-4 ml-1" />
            </Link>
            <Link
              href="/account/subscription"
              className="block w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              구독 관리
            </Link>
          </div>

          {/* 알림 */}
          <p className="text-sm text-gray-500 mt-6">
            영수증이 이메일로 발송되었습니다.
            <br />
            14일 무료 체험 기간 동안 언제든 취소할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <SuccessContent />
    </Suspense>
  );
}




















