'use client';

/**
 * @file pricing-faq.tsx
 * @description 프리미엄 플랜 FAQ 섹션
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: '무료 체험은 어떻게 진행되나요?',
    answer:
      '신규 가입 시 14일 동안 모든 프리미엄 기능을 무료로 체험할 수 있습니다. 체험 기간 동안 결제 수단을 등록하지만, 14일이 지나기 전에 취소하면 요금이 청구되지 않습니다.',
  },
  {
    question: '언제든지 취소할 수 있나요?',
    answer:
      '네, 언제든지 취소할 수 있습니다. 월간 플랜은 즉시 또는 다음 갱신일에 취소할 수 있으며, 연간 플랜도 환불 정책에 따라 일할 계산 환불이 가능합니다.',
  },
  {
    question: '어떤 결제 수단을 사용할 수 있나요?',
    answer:
      '신용카드, 체크카드, 카카오페이, 네이버페이를 지원합니다. 모든 결제는 안전하게 암호화되어 처리됩니다.',
  },
  {
    question: '연간 플랜이 더 저렴한가요?',
    answer:
      '네, 연간 플랜은 월간 플랜 대비 20% 할인된 가격입니다. 월 7,900원으로 연간 94,800원을 한 번에 결제하시면 됩니다.',
  },
  {
    question: '프리미엄 혜택은 무엇인가요?',
    answer:
      '광고 없는 HD 영상 시청, 가족 구성원별 맞춤 AI 식단 추천, 무제한 레시피 북마크, 전체 식단 히스토리, 주간 식단 PDF 다운로드, 월간 영양 리포트, 우선 고객 지원을 제공합니다.',
  },
  {
    question: '환불은 어떻게 받나요?',
    answer:
      '결제 후 7일 이내 미사용 시 전액 환불이 가능하며, 그 이후는 사용 기간을 제외한 일할 계산 환불이 가능합니다. 환불은 구독 관리 페이지에서 신청하실 수 있습니다.',
  },
  {
    question: '가족 구성원은 몇 명까지 등록할 수 있나요?',
    answer:
      '프리미엄 플랜에서는 가족 구성원을 무제한으로 등록할 수 있으며, 각 구성원별로 맞춤 식단을 생성할 수 있습니다.',
  },
  {
    question: '프로모션 코드는 어디서 받나요?',
    answer:
      '런칭 기념 프로모션 코드 "LAUNCH2025"를 입력하시면 30% 할인을 받으실 수 있습니다. 추가 프로모션은 이메일 뉴스레터와 SNS를 통해 안내됩니다.',
  },
];

export function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          자주 묻는 질문
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-700 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            더 궁금한 점이 있으신가요?
          </p>
          <a
            href="mailto:support@flavorarchive.com"
            className="text-orange-600 font-semibold hover:underline"
          >
            고객 지원팀에 문의하기 →
          </a>
        </div>
      </div>
    </section>
  );
}




















