import { Suspense } from 'react';
import { XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function FailContent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-xl p-12">
          {/* 실패 아이콘 */}
          <div className="mb-6">
            <XCircle className="w-20 h-20 text-red-500 mx-auto" />
          </div>

          {/* 메시지 */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            결제에 실패했습니다
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            결제 처리 중 문제가 발생했습니다.
            <br />
            다시 시도해주세요.
          </p>

          {/* 실패 원인 안내 */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-bold text-gray-900 mb-4">주요 실패 원인</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                카드 한도 초과 또는 잔액 부족
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                카드사 승인 거부 (해외 결제 차단 등)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                카드 정보 입력 오류
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                네트워크 연결 문제
              </li>
            </ul>
          </div>

          {/* CTA 버튼 */}
          <div className="space-y-3">
            <Link
              href="/pricing"
              className="block w-full py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              <ArrowLeft className="inline w-4 h-4 mr-1" />
              다시 시도하기
            </Link>
            <Link
              href="/"
              className="block w-full py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              홈으로 돌아가기
            </Link>
          </div>

          {/* 고객 지원 */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-gray-600 mb-2">
              문제가 계속되면 고객 지원팀에 문의해주세요.
            </p>
            <a
              href="mailto:support@flavorarchive.com"
              className="text-orange-600 font-semibold hover:underline"
            >
              support@flavorarchive.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutFailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <FailContent />
    </Suspense>
  );
}
























