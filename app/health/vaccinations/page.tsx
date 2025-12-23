/**
 * @file app/health/vaccinations/page.tsx
 * @description 예방접종 안내 상세 페이지
 *
 * 생애주기별, 상황별, 계절별 예방접종 정보를 제공합니다.
 * docs/defence.md 내용을 기반으로 구성되었으며, 중복을 제거하고 통합했습니다.
 */

import { Section } from '@/components/section';
import { VaccinationTabsClient } from '@/components/health/vaccination-tabs-client';
import { VaccinationApiData } from '@/components/health/vaccination-api-data';
import { VaccinationFamilyAlert } from '@/components/health/vaccination-family-alert';
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { LoadingSpinner } from '@/components/loading-spinner';

function SectionSkeleton() {
  return (
    <div className="py-12 text-center">
      <LoadingSpinner />
    </div>
  );
}

// 생애주기별 콘텐츠 (상세 일정)
function LifecycleTabContent() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SectionSkeleton />}>
        <div className="space-y-8">
          {/* 영유아기 */}
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-4 flex items-center gap-2">
              👶 영유아기 (출생 ~ 6세)
            </h2>
            <p className="text-sky-800 mb-4">
              가장 많은 주사를 맞는 시기이며, 기초 면역을 형성합니다. 대부분 국가 지원(무료)입니다.
            </p>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">출생 직후</h3>
                <ul className="list-disc list-inside space-y-1 text-sky-800">
                  <li>B형 간염(1차)</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">1개월</h3>
                <ul className="list-disc list-inside space-y-1 text-sky-800">
                  <li>B형 간염(2차)</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">2/4/6개월</h3>
                <ul className="list-disc list-inside space-y-1 text-sky-800">
                  <li>5가 혼합백신(디프테리아, 파상풍, 백일해, 폴리오, 뇌수막염)</li>
                  <li>폐렴구균</li>
                  <li>로타바이러스(먹는 백신) - 수인성 설사 예방</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">12~15개월</h3>
                <ul className="list-disc list-inside space-y-1 text-sky-800">
                  <li>MMR(홍역, 유행성이하선염, 풍진)</li>
                  <li>수두</li>
                  <li>일본뇌염</li>
                  <li>A형 간염</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">4~6세</h3>
                <ul className="list-disc list-inside space-y-1 text-sky-800">
                  <li>MMR(2차)</li>
                  <li>DTap(디프테리아/파상풍/백일해 추가)</li>
                  <li>폴리오</li>
                  <li>일본뇌염 추가</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 청소년기 */}
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-4 flex items-center gap-2">
              👦 청소년기 (11세 ~ 18세)
            </h2>
            <p className="text-sky-800 mb-4">
              기초 면역을 보강하고 성인이 되기 전 성병 등을 예방하는 시기입니다.
            </p>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">HPV(사람유두종바이러스)</h3>
                <p className="text-sky-800 mb-2">
                  <strong>성병 및 자궁경부암 예방</strong>을 위해 남녀 모두 접종 권장 (만 12세 전후 최적). 국가 지원 범위 확인 필요.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">Tdap / Td</h3>
                <p className="text-sky-800">파상풍, 디프테리아, 백일해 (만 11~12세에 1회 추가 접종).</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">일본뇌염</h3>
                <p className="text-sky-800">만 12세 추가 접종.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">수막구균</h3>
                <p className="text-sky-800">유학이나 기숙사 입소 전 권장. 기숙사 생활을 하거나 단체 생활을 시작할 때 권장.</p>
              </div>
            </div>
          </div>

          {/* 성인기 */}
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-4 flex items-center gap-2">
              🧑 성인기 (19세 ~ 64세)
            </h2>
            <p className="text-sky-800 mb-4">
              어릴 때 맞은 백신의 효과가 떨어지는 시기이므로 추가 접종이 중요합니다.
            </p>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">파상풍(Td/Tdap)</h3>
                <p className="text-sky-800">어릴 때 맞았어도 <strong>10년마다</strong> 한 번씩 평생 보충 접종해야 합니다.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">A형/B형 간염</h3>
                <p className="text-sky-800">항체 검사 후 없는 경우 반드시 접종 (특히 20~40대 A형 간염 위험 높음).</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">HPV</h3>
                <p className="text-sky-800">청소년기에 못 맞았다면 만 26세(남성) ~ 45세(여성)까지 접종 권장.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">대상포진</h3>
                <p className="text-sky-800">최근에는 과로가 많은 40~50대부터 미리 맞는 경우도 늘고 있습니다.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">MMR</h3>
                <p className="text-sky-800">홍역 항체가 없는 경우 1회 접종.</p>
              </div>
            </div>
          </div>

          {/* 노년기 */}
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-4 flex items-center gap-2">
              👵 노년기 (65세 이상)
            </h2>
            <p className="text-sky-800 mb-4">
              면역력이 급격히 떨어지는 시기로, 합병증 예방이 목적입니다.
            </p>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">인플루엔자(독감)</h3>
                <p className="text-sky-800">매년 1회 (국가 무료 지원). 매년 가을(10~11월)에 접종.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">폐렴구균</h3>
                <p className="text-sky-800">65세 이상 1회 접종 (국가 무료 지원). 폐렴으로 인한 사망 위험을 크게 줄입니다.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">대상포진</h3>
                <p className="text-sky-800">50세 또는 60세 이후 1회(생백신) 또는 2회(사백신) 접종. (극심한 통증 예방)</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">Tdap</h3>
                <p className="text-sky-800">손주를 돌보는 할머니, 할아버지라면 백일해 예방을 위해 꼭 권장합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

// 상황별 콘텐츠 (특수 상황만 - 해외여행과 계절 백신은 별도 탭으로 분리)
function SituationTabContent() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SectionSkeleton />}>
        <div className="space-y-8">
          {/* 성병 및 생식기 질환 예방 */}
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-4 flex items-center gap-2">
              🛡️ 성병 및 생식기 질환 예방
            </h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">HPV 백신 (가다실 등)</h3>
                <p className="text-sky-800 mb-2">
                  자궁경부암, 항문암, 성기 사마귀 등을 예방합니다. 남성이 맞으면 파트너를 보호하고 본인의 생식기 질환도 예방됩니다.
                </p>
                <p className="text-sm text-sky-700">남녀 모두 권장, 성 경험 전 접종 시 효과 극대화</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">B형 간염</h3>
                <p className="text-sky-800">성적 접촉으로 감염될 수 있어 성인기 필수 확인 항목입니다.</p>
              </div>
            </div>
          </div>

          {/* 직업 관련 */}
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-4 flex items-center gap-2">
              💼 직업 관련 예방접종
            </h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">파상풍, B형 간염</h3>
                <p className="text-sky-800">의료진, 군인, 건설 현장 종사자 필수</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">신증후군출혈열(유행성출혈열)</h3>
                <p className="text-sky-800 mb-1"><strong>대상:</strong> 군인이나 농부 등 고위험군 대상 한정 지원.</p>
                <p className="text-sky-800">들쥐의 배설물을 통해 감염되므로 야외 활동 전 접종이 권장됩니다.</p>
              </div>
            </div>
          </div>

          {/* 임신 준비 */}
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-4 flex items-center gap-2">
              🤰 임신 준비
            </h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">풍진(MMR), Tdap</h3>
                <p className="text-sky-800">임신 전 항체 확인 필수 (태아 보호 목적)</p>
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

// 해외여행 콘텐츠 (상황별 탭의 해외여행 내용 통합)
function TravelTabContent() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SectionSkeleton />}>
        <div className="space-y-8">
          {/* 대륙별 가이드 */}
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-4">대륙별 주요 예방접종 가이드</h2>
            <p className="text-sky-800 mb-4">
              방문 국가의 풍토병에 따라 출국 2~4주 전에 맞아야 합니다.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg">
                <thead>
                  <tr className="bg-sky-100">
                    <th className="border border-sky-200 px-4 py-3 text-left font-semibold text-sky-900">대륙</th>
                    <th className="border border-sky-200 px-4 py-3 text-left font-semibold text-sky-900">대상 지역</th>
                    <th className="border border-sky-200 px-4 py-3 text-left font-semibold text-sky-900">필수/권장 백신</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800 font-medium">동남아시아</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800">베트남, 태국, 인도네시아, 필리핀</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800"><strong>A형 간염, 장티푸스, 파상풍</strong></td>
                  </tr>
                  <tr className="bg-sky-50/30">
                    <td className="border border-sky-200 px-4 py-3 text-sky-800 font-medium">남아시아</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800">인도, 네팔, 방글라데시</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800"><strong>장티푸스, 콜레라, A형 간염, 일본뇌염</strong></td>
                  </tr>
                  <tr>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800 font-medium">중남미</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800">브라질, 페루, 볼리비아, 멕시코</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800"><strong>황열(필수), A형 간염, 장티푸스</strong></td>
                  </tr>
                  <tr className="bg-sky-50/30">
                    <td className="border border-sky-200 px-4 py-3 text-sky-800 font-medium">아프리카</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800">가나, 에티오피아, 케냐, 탄자니아</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800"><strong>황열(필수), 수막구균, 폴리오, 말라리아(약)</strong></td>
                  </tr>
                  <tr>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800 font-medium">선진국</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800">미국, 유럽, 일본</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800"><strong>독감, 파상풍(Tdap), 홍역(MMR)</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 국가별 상세 주의사항 */}
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-4">국가별 상세 주의사항</h2>
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">① 동남아시아 (태국, 베트남, 필리핀 등)</h3>
                <p className="text-sky-800 mb-2">가장 많이 방문하시는 지역으로, 수인성 전염병(물이나 음식으로 감염) 예방이 핵심입니다.</p>
                <ul className="list-disc list-inside space-y-1 text-sky-800 ml-4">
                  <li><strong>장티푸스 & A형 간염:</strong> 길거리 음식이나 오염된 물을 통해 감염될 확률이 높습니다.</li>
                  <li><strong>공수병 (광견병):</strong> 야생 원숭이나 개에게 물릴 위험이 있는 오지 탐험 시 권장합니다.</li>
                  <li><strong>말라리아/댕기열:</strong> 주사는 없으므로 강력한 기피제를 준비해야 합니다.</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">② 남미 및 아프리카 (브라질, 페루, 가나 등)</h3>
                <p className="text-sky-800 mb-2">이 지역은 <strong>'황열'</strong> 관리가 가장 엄격합니다.</p>
                <ul className="list-disc list-inside space-y-1 text-sky-800 ml-4">
                  <li><strong>황열(Yellow Fever):</strong> 입국 시 <strong>'노란색 국제공인 예방접종 증명서'</strong>를 요구하는 나라가 많습니다. 최소 출국 10일 전에는 맞아야 효력이 발생하며, 평생 1회 접종으로 유지됩니다.</li>
                  <li><strong>수막구균:</strong> 아프리카의 '수막염 벨트'(사하라 이남 지역) 방문 시 필수입니다. 뇌수막염을 일으키는 치명적인 박테리아를 막아줍니다.</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">③ 인도 및 남아시아</h3>
                <p className="text-sky-800 mb-2">위생 환경이 열악한 지역이 많아 소화기 계통 백신이 필수입니다.</p>
                <ul className="list-disc list-inside space-y-1 text-sky-800 ml-4">
                  <li><strong>콜레라:</strong> 경구용(먹는 것) 백신으로, 콜레라가 유행하는 인도나 방글라데시 방문 시 권장합니다.</li>
                  <li><strong>장티푸스:</strong> 필수적으로 권장됩니다.</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">④ 사우디아라비아 (성지순례 시)</h3>
                <p className="text-sky-800"><strong>수막구균:</strong> 메카 성지순례(Hajj) 기간에 방문하려면 수막구균 예방접종 증명서가 <strong>비자 발급 필수 조건</strong>입니다.</p>
              </div>
            </div>
          </div>

          {/* 여행 전 체크리스트 */}
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-4">✈️ 여행 전 체크리스트</h2>
            <div className="bg-white rounded-lg p-4 border border-sky-100">
              <p className="text-sky-800 mb-3">해외 자료를 참고할 때 가장 정확한 기준은 <strong>미국 CDC의 'Traveler's Health'</strong>입니다. 다음 단계에 따라 준비하세요.</p>
              <ol className="list-decimal list-inside space-y-2 text-sky-800 ml-4">
                <li><strong>출국 4~6주 전 상담:</strong> 백신은 맞자마자 효과가 나타나지 않습니다. 항체가 생기는 기간(보통 2주)을 고려해야 합니다.</li>
                <li><strong>영문 예방접종 증명서 발급:</strong> 해외에서 사고가 나거나 입국 시 증명이 필요할 수 있습니다. (정부24 또는 질병관리청에서 무료 발급 가능)</li>
                <li><strong>말라리아 처방:</strong> 말라리아는 백신이 없으므로, 방문 지역에 맞는 예방약(말라론, 라리암 등)을 의사에게 처방받아 여행 전/중/후에 복용해야 합니다.</li>
              </ol>
            </div>
          </div>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

// 계절별 콘텐츠 (상황별 탭의 계절 백신 내용 통합)
function SeasonalTabContent() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SectionSkeleton />}>
        <div className="space-y-8">
          {/* 가을~겨울 */}
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-4 flex items-center gap-2">
              🍂 가을~겨울 (10월 ~ 2월): 호흡기 질환 집중 관리
            </h2>
            <p className="text-sky-800 mb-4">
              이 시기는 날씨가 건조하고 추워지면서 바이러스가 생존하기 좋은 환경이 됩니다.
            </p>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">독감 (인플루엔자)</h3>
                <p className="text-sky-800 mb-1"><strong>접종 시기:</strong> 매년 10월~11월 권장.</p>
                <p className="text-sky-800">바이러스가 매년 변이되므로 매년 접종. 접종 후 항체가 생기기까지 약 2주가 걸리고, 면역 효과가 약 6개월간 지속되므로 독감이 유행하기 직전에 맞는 것이 가장 좋습니다.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">코로나19</h3>
                <p className="text-sky-800 mb-1"><strong>접종 시기:</strong> 독감 백신과 비슷한 시기에 동시 접종 가능.</p>
                <p className="text-sky-800">유행 변이에 따라 고위험군에게 정기 접종 권고. 겨울철 대유행을 대비하여 그해 유행하는 변이에 맞춘 백신을 접종합니다.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">폐렴구균</h3>
                <p className="text-sky-800 mb-1"><strong>대상:</strong> 65세 이상 어르신 또는 만성 질환자.</p>
                <p className="text-sky-800">독감의 가장 흔한 합병증이 폐렴이기 때문에, 찬 바람이 불기 시작할 때 함께 체크하는 것이 좋습니다.</p>
              </div>
            </div>
          </div>

          {/* 봄 */}
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-4 flex items-center gap-2">
              🌸 봄 (3월 ~ 5월): 단체 생활 및 야외 활동 대비
            </h2>
            <p className="text-sky-800 mb-4">
              개학 시즌과 나들이가 많아지는 시기로, 전염력이 강한 질환을 주의해야 합니다.
            </p>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">MMR (홍역, 유행성이하선염, 풍진)</h3>
                <p className="text-sky-800">봄철에 환자 발생이 많아지는 경향이 있습니다. 특히 단체 생활을 시작하는 아이들은 필수입니다.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">수두</h3>
                <p className="text-sky-800">봄철(4~6월)에 유행 시기가 찾아오므로 항체 여부를 확인해야 합니다.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">유행성 출혈열 (신증후군출혈열)</h3>
                <p className="text-sky-800 mb-1"><strong>대상:</strong> 농사일을 하거나 야외 활동이 잦은 성인, 군인 등.</p>
                <p className="text-sky-800">들쥐의 배설물을 통해 감염되므로 야외 활동 전 접종이 권장됩니다.</p>
              </div>
            </div>
          </div>

          {/* 여름 */}
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-4 flex items-center gap-2">
              ☀️ 여름 (6월 ~ 8월): 수인성 전염병 및 해충 매개 질환
            </h2>
            <p className="text-sky-800 mb-4">
              기온이 높고 습하며, 해외여행이나 물놀이가 많아지는 시기입니다.
            </p>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">일본뇌염</h3>
                <p className="text-sky-800 mb-1"><strong>접종 시기:</strong> 모기가 활동하기 시작하는 초여름 이전.</p>
                <p className="text-sky-800">일본뇌염 바이러스를 가진 모기에 물려 발생하므로, 아이들의 경우 표준 접종 일정에 맞춰 반드시 완료해야 합니다.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">A형 간염</h3>
                <p className="text-sky-800">오염된 물이나 음식을 통해 전염됩니다. 여름철 위생 상태가 취약해질 수 있고 여행이 잦아지므로 항체가 없다면 접종해야 합니다.</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">장티푸스</h3>
                <p className="text-sky-800">여름철 동남아 등 해외 여행지를 방문할 계획이라면 최소 출국 2주 전 접종이 필요합니다.</p>
              </div>
            </div>
          </div>

          {/* 계절별 요약표 */}
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-4">📅 계절별 요약표</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg">
                <thead>
                  <tr className="bg-sky-100">
                    <th className="border border-sky-200 px-4 py-3 text-left font-semibold text-sky-900">계절</th>
                    <th className="border border-sky-200 px-4 py-3 text-left font-semibold text-sky-900">핵심 키워드</th>
                    <th className="border border-sky-200 px-4 py-3 text-left font-semibold text-sky-900">주요 백신</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800 font-medium">봄</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800">단체 생활, 나들이</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800">MMR, 수두, 유행성 출혈열</td>
                  </tr>
                  <tr className="bg-sky-50/30">
                    <td className="border border-sky-200 px-4 py-3 text-sky-800 font-medium">여름</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800">모기, 수인성 질환</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800">일본뇌염, A형 간염, 장티푸스</td>
                  </tr>
                  <tr>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800 font-medium">가을</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800">면역력, 유행 대비</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800"><strong>독감(필수)</strong>, 코로나19, 파상풍(Tdap)</td>
                  </tr>
                  <tr className="bg-sky-50/30">
                    <td className="border border-sky-200 px-4 py-3 text-sky-800 font-medium">겨울</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800">호흡기 합병증</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800">폐렴구균, 대상포진</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 추가 조언 */}
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-4">💡 추가 조언</h2>
            <div className="bg-white rounded-lg p-4 border border-sky-100">
              <ul className="list-disc list-inside space-y-2 text-sky-800 ml-4">
                <li><strong>대상포진</strong>이나 <strong>파상풍(Td/Tdap)</strong> 같은 백신은 계절과 상관없이 맞을 수 있지만, 대기 시간이 길지 않은 <strong>여름철이나 비수기</strong>에 미리 맞아두면 가을철 독감 접종 시기에 겹치지 않아 훨씬 여유롭게 관리하실 수 있습니다.</li>
                <li><strong>비개발자 초보를 위한 팁:</strong> 매년 10월을 '내 몸 업데이트의 달'로 정해두고 독감 백신을 맞으면서, 의사 선생님께 "올해 제가 추가로 맞아야 할 주사가 또 있을까요?"라고 물어보시는 것이 가장 확실한 방법입니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

// 나이별 요약 콘텐츠 (요약표, 국가 지원 정보, 주의사항만)
function AgeSummaryTabContent() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<SectionSkeleton />}>
        <div className="space-y-8">
          {/* 질병청 API 데이터 */}
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-4">🔗 질병청 API 실시간 데이터</h2>
            <VaccinationApiData />
          </div>

          {/* 나이별 요약표 */}
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-4">📊 나이별 요약표</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg">
                <thead>
                  <tr className="bg-sky-100">
                    <th className="border border-sky-200 px-4 py-3 text-left font-semibold text-sky-900">나이대</th>
                    <th className="border border-sky-200 px-4 py-3 text-left font-semibold text-sky-900">필수(국가지원 중심)</th>
                    <th className="border border-sky-200 px-4 py-3 text-left font-semibold text-sky-900">권장 및 보충</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800 font-medium">0~6세</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800">B형간염, MMR, 수두, 일본뇌염 등</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800">로타바이러스</td>
                  </tr>
                  <tr className="bg-sky-50/30">
                    <td className="border border-sky-200 px-4 py-3 text-sky-800 font-medium">12세 전후</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800">HPV(가다실), Tdap</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800">수막구균</td>
                  </tr>
                  <tr>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800 font-medium">성인(20~50대)</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800">Td/Tdap(10년마다)</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800">간염 항체 보충, HPV</td>
                  </tr>
                  <tr className="bg-sky-50/30">
                    <td className="border border-sky-200 px-4 py-3 text-sky-800 font-medium">60세 이상</td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800"><strong>독감(매년), 폐렴구균</strong></td>
                    <td className="border border-sky-200 px-4 py-3 text-sky-800"><strong>대상포진(강력 권장)</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 국가 지원 예방접종 */}
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-4">🏥 국가 지원 예방접종 (NIP)</h2>
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-3">어린이 및 청소년 (만 12세 이하)</h3>
                <p className="text-sky-800 mb-2">전액 무료로 접종 가능한 항목 (총 18종):</p>
                <ul className="list-disc list-inside space-y-1 text-sky-800 ml-4">
                  <li>BCG (결핵), B형 간염, DTaP (디프테리아/파상풍/백일해)</li>
                  <li>IPV (폴리오), Hib (뇌수막염), PCV (폐렴구균)</li>
                  <li>MMR (홍역/유행성이하선염/풍진), 수두, 일본뇌염</li>
                  <li>A형 간염, Tdap/Td (만 11~12세), 로타바이러스</li>
                  <li>인플루엔자(독감) - 매년</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-3">어르신 (만 65세 이상)</h3>
                <ul className="list-disc list-inside space-y-1 text-sky-800 ml-4">
                  <li><strong>인플루엔자(독감):</strong> 매년 1회 무료 접종 (보통 10월경 시작)</li>
                  <li><strong>폐렴구균(PPSV23):</strong> 만 65세 이상 평생 1회 무료 지원</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-3">특정 대상</h3>
                <ul className="list-disc list-inside space-y-1 text-sky-800 ml-4">
                  <li><strong>HPV:</strong> 만 12세 여성 청소년 및 만 13~17세 미접종 여성 청소년, 만 18~26세 저소득층 여성</li>
                  <li><strong>신증후군출혈열:</strong> 군인이나 농부 등 고위험군 대상 한정 지원</li>
                  <li><strong>장티푸스:</strong> 고위험군 및 보건소 방문자 대상</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 주의사항 및 팁 */}
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-6">
            <h2 className="text-2xl font-bold text-sky-900 mb-4">💡 주의사항 및 팁</h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">예방접종 도우미(질병관리청)</h3>
                <p className="text-sky-800">
                  한국 거주자라면 '질병관리청 예방접종 도우미' 사이트나 앱에서 본인이 지금까지 맞은 주사 기록을 영어와 한국어로 확인할 수 있습니다. 내가 지금까지 어떤 무료 백신을 맞았는지, 다음에 맞아야 할 것은 무엇인지 엑셀 시트처럼 일목요연하게 볼 수 있습니다.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">교차 접종</h3>
                <p className="text-sky-800">
                  여러 주사를 한날에 맞아도 되는 경우가 있고, 간격을 두어야 하는 경우가 있으니 의사와 상담이 필요합니다.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">어디서 맞나요?</h3>
                <ul className="list-disc list-inside space-y-1 text-sky-800 ml-4">
                  <li><strong>일반 백신:</strong> 동네 내과나 보건소에서 가능합니다. 무료 백신은 지정 의료기관에서만 가능하므로 '예방접종 도우미' 사이트에서 '지정 의료기관 찾기'를 통해 집 근처의 참여 병원을 미리 확인하세요.</li>
                  <li><strong>특수 백신(황열, 콜레라):</strong> 국립중앙의료원이나 공항 내 검역소 등 지정된 기관에서만 가능하므로 예약이 필수입니다.</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 border border-sky-100">
                <h3 className="font-semibold text-sky-900 mb-2">보건소 vs 병원</h3>
                <p className="text-sky-800">
                  필수 접종은 보건소나 지정 병원에서 무료이지만, 대상포진이나 HPV(성인) 같은 권장 접종은 병원마다 가격이 다르니 전화 후 방문하시는 게 좋습니다. 지자체별로 자체 예산을 들여 특정 연령대에 무료로 접종해 주는 경우가 있으니 본인 거주지 보건소 공지사항을 확인하는 것이 좋습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

export const metadata = {
  title: "예방접종 안내 | 맛의 아카이브",
  description: "생애주기별, 상황별, 계절별 예방접종 정보를 확인하세요",
};

export default function VaccinationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 가족 구성원 예방접종 안내 팝업 */}
      <VaccinationFamilyAlert />

      <Section className="pt-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-sky-900">💉 예방접종 안내</h1>
          <p className="text-muted-foreground">
            생애주기별, 상황별, 계절별 예방접종 정보를 확인하세요
          </p>
          <p className="text-sm text-sky-700 mt-2">
            이 자료는 세계보건기구(WHO)와 질병관리청(KDCA)의 표준 권고안을 기반으로 작성되었습니다.
          </p>
        </div>

        <VaccinationTabsClient
          lifecycleContent={<LifecycleTabContent />}
          situationContent={<SituationTabContent />}
          travelContent={<TravelTabContent />}
          seasonalContent={<SeasonalTabContent />}
          ageSummaryContent={<AgeSummaryTabContent />}
        />
      </Section>
    </div>
  );
}
