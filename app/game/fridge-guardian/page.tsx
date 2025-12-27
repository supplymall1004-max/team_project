/**
 * @file app/game/fridge-guardian/page.tsx
 * @description 냉장고 파수꾼 게임 페이지
 * 
 * 게임을 플레이할 수 있는 전용 페이지입니다.
 */

import { Metadata } from 'next';
import FridgeGuardian from '@/components/games/fridge-guardian';
import { FridgeGuardianTopRanking } from '@/components/games/fridge-guardian-top-ranking';

export const metadata: Metadata = {
  title: '냉장고 파수꾼 | Flavor Archive',
  description: '세균과 곰팡이를 처치하여 가족의 신선한 식탁을 지켜주세요!',
};

export default function FridgeGuardianPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-sky-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            냉장고 파수꾼
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 font-medium">
            세균과 곰팡이를 처치하여 가족의 신선한 식탁을 지켜주세요! 🛡️
          </p>
        </div>
        
        <FridgeGuardian />
        
        <div className="mt-8 bg-white/90 backdrop-blur-lg rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(102,126,234,0.15)] border-2 border-white/50">
          <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent mb-6">
            게임 방법
          </h2>
          
          {/* 처치해야 할 아이템 */}
          <div className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-200">
            <h3 className="text-lg sm:text-xl font-black text-green-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">✅</span> 처치해야 할 아이템
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🦠</span>
                <div>
                  <strong className="text-gray-800">일반 세균</strong> - 클릭하여 처치하세요! <span className="text-green-600">(+100점)</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🐛</span>
                <div>
                  <strong className="text-gray-800">기생충</strong> - 처치하면 점수를 얻습니다! <span className="text-green-600">(+150점)</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🍄</span>
                <div>
                  <strong className="text-gray-800">곰팡이</strong> - 처치하면 좋은 점수를 얻습니다! <span className="text-green-600">(+200점)</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">👾</span>
                <div>
                  <strong className="text-gray-800">대장균 (보스)</strong> - 높은 점수를 줍니다! <span className="text-green-600">(+300점)</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🦠</span>
                <div>
                  <strong className="text-gray-800">바이러스</strong> - 매우 높은 점수를 줍니다! <span className="text-green-600 font-bold">(+500점)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 피해야 할 아이템 */}
          <div className="mb-6 bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-5 border-2 border-red-200">
            <h3 className="text-lg sm:text-xl font-black text-red-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">❌</span> 피해야 할 아이템
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🥜</span>
                <div>
                  <strong className="text-red-600">알레르기 주의</strong> - 클릭하지 마세요! <span className="text-red-600">(-200점, 생명력 -1)</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🤢</span>
                <div>
                  <strong className="text-red-600">상한 식품</strong> - 위험합니다! 클릭하지 마세요! <span className="text-red-600">(-300점, 생명력 -1)</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🍓</span>
                <div>
                  <strong className="text-red-600">신선식품</strong> - 우리 가족의 소중한 식재료입니다! 클릭하지 마세요! <span className="text-red-600">(-500점, 생명력 -1)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 특수 아이템 (파워업) */}
          <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-200">
            <h3 className="text-lg sm:text-xl font-black text-blue-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">⚡</span> 특수 아이템 (파워업)
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💚</span>
                <div>
                  <strong className="text-blue-600">생명력 회복</strong> - 생명력을 1 회복합니다!
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <strong className="text-blue-600">시간 보너스</strong> - 게임 시간을 5초 추가합니다!
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">⭐</span>
                <div>
                  <strong className="text-blue-600">점수 배율</strong> - 10초간 획득하는 모든 점수가 2배가 됩니다!
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🐌</span>
                <div>
                  <strong className="text-blue-600">시간 감속</strong> - 10초간 아이템 생성 속도가 느려집니다!
                </div>
              </div>
            </div>
          </div>

          {/* 게임 시스템 */}
          <div className="mb-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-200">
            <h3 className="text-lg sm:text-xl font-black text-purple-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">🎮</span> 게임 시스템
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <span className="text-xl">📊</span>
                <div>
                  <strong className="text-gray-800">레벨 시스템</strong> - 점수를 획득하면 레벨이 올라갑니다. 레벨이 높을수록 더 어려운 아이템이 등장합니다!
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🔥</span>
                <div>
                  <strong className="text-gray-800">콤보 시스템</strong> - 연속으로 처치하면 콤보가 쌓이고, 보너스 점수를 받을 수 있습니다!
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🎯</span>
                <div>
                  <strong className="text-gray-800">난이도 선택</strong> - 쉬움, 보통, 어려움, 전문가 중에서 선택할 수 있습니다. 난이도가 높을수록 더 많은 점수를 얻을 수 있습니다!
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">👨‍👩‍👧‍👦</span>
                <div>
                  <strong className="text-gray-800">가족 프로필 연동</strong> - 가족 프로필에 등록된 알레르기 정보가 게임에 반영됩니다. 알레르기 유발 아이템이 더 자주 등장할 수 있습니다!
                </div>
              </div>
            </div>
          </div>

          {/* 팁 */}
          <div className="mt-6 pt-6 border-t-2 border-gray-300">
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border-2 border-amber-200">
              <h3 className="text-lg sm:text-xl font-black text-amber-700 mb-4 flex items-center gap-2">
                <span className="text-2xl">💡</span> 게임 팁
              </h3>
            <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
              <li>연속으로 처치하면 콤보 보너스를 받을 수 있습니다!</li>
              <li>파워업 아이템을 적극 활용하면 더 높은 점수를 얻을 수 있습니다!</li>
              <li>레벨이 올라갈수록 더 어려워지지만, 더 많은 점수를 얻을 수 있습니다!</li>
              <li>생명력이 0이 되면 게임이 종료되니, 파워업으로 생명력을 관리하세요!</li>
              <li>시간 보너스와 시간 감속을 활용하여 더 오래 플레이할 수 있습니다!</li>
            </ul>
            </div>
          </div>
        </div>

        {/* 상위 랭킹 */}
        <FridgeGuardianTopRanking />
      </div>
    </div>
  );
}

