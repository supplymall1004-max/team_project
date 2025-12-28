/**
 * @file app/game/fridge-memory/page.tsx
 * @description 냉장고 짝맞추기 게임 페이지
 * 
 * 냉장고 속 식재료 카드를 뒤집어 짝을 맞추는 메모리 게임 페이지입니다.
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { FridgeMemoryGame } from '@/components/games/fridge-memory-game';

export const metadata: Metadata = {
  title: '냉장고 짝맞추기 | Flavor Archive',
  description: '냉장고 속 식재료 카드를 뒤집어 짝을 맞추는 메모리 게임입니다!',
};

function GameLoadingFallback() {
  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🧊 냉장고 짝맞추기
        </h2>
        <p className="text-gray-600">게임을 불러오는 중...</p>
      </div>
    </div>
  );
}

export default function FridgeMemoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Suspense fallback={<GameLoadingFallback />}>
          <FridgeMemoryGame />
        </Suspense>
        
        {/* 게임 방법 설명 섹션 */}
        <div className="mt-8 bg-white/90 backdrop-blur-lg rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(102,126,234,0.15)] border-2 border-white/50">
          <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            게임 방법
          </h2>
          
          {/* 게임 목표 */}
          <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-200">
            <h3 className="text-lg sm:text-xl font-black text-blue-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">🎯</span> 게임 목표
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              20개의 스테이지를 모두 클리어하여 냉장고 마스터가 되세요!
              각 스테이지마다 난이도가 자동으로 증가하며, 카드 개수와 제한 시간이 조정됩니다.
              모든 스테이지를 완료하면 특별한 엔딩을 볼 수 있습니다!
            </p>
          </div>

          {/* 게임 방법 */}
          <div className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-200">
            <h3 className="text-lg sm:text-xl font-black text-green-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">🎮</span> 게임 방법
            </h3>
            <ol className="space-y-3 text-sm text-gray-700 list-decimal list-inside">
              <li>
                <strong className="text-gray-800">카드 뒤집기:</strong> 카드를 클릭하여 뒤집습니다.
                카드에는 식재료 이모지가 숨겨져 있습니다.
              </li>
              <li>
                <strong className="text-gray-800">짝 찾기:</strong> 같은 식재료 카드 2장을 찾아 짝을 맞춥니다.
                카드의 위치를 기억하는 것이 중요합니다!
              </li>
              <li>
                <strong className="text-gray-800">매칭 결과:</strong> 짝이 맞으면 카드가 고정되고,
                틀리면 다시 뒤집힙니다. 틀린 카드는 잠시 후 자동으로 뒤집힙니다.
              </li>
              <li>
                <strong className="text-gray-800">게임 완료:</strong> 모든 짝을 맞추면 게임이 완료됩니다!
                이름을 입력하여 랭킹에 기록할 수 있습니다.
              </li>
            </ol>
          </div>

          {/* 스테이지 시스템 */}
          <div className="mb-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border-2 border-purple-200">
            <h3 className="text-lg sm:text-xl font-black text-purple-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">⭐</span> 스테이지 시스템
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p className="mb-3">
                게임은 총 <strong>20개의 스테이지</strong>로 구성되어 있으며, 각 스테이지마다 난이도가 자동으로 증가합니다.
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="text-xl">📈</span>
                  <div>
                    <strong className="text-gray-800">난이도 증가:</strong> 스테이지가 올라갈수록 카드 개수가 늘어나고, 제한 시간이 짧아집니다.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">🎁</span>
                  <div>
                    <strong className="text-gray-800">아이템 보급:</strong> 3스테이지마다 힌트와 냉동 아이템이 1개씩 보충됩니다!
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-xl">🏆</span>
                  <div>
                    <strong className="text-gray-800">최종 목표:</strong> 20스테이지를 모두 클리어하면 특별한 엔딩을 볼 수 있습니다!
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 게임 시스템 */}
          <div className="mb-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border-2 border-amber-200">
            <h3 className="text-lg sm:text-xl font-black text-amber-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">⚡</span> 게임 시스템
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <span className="text-xl">🔥</span>
                <div>
                  <strong className="text-gray-800">콤보 시스템:</strong> 연속으로 짝을 맞추면 콤보가 쌓입니다!
                  콤보가 높을수록 더 재미있게 플레이할 수 있습니다.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">⏱️</span>
                <div>
                  <strong className="text-gray-800">타이머:</strong> 각 스테이지마다 제한 시간이 있습니다.
                  시간이 10초 이하로 남으면 빨간색으로 표시되어 긴박함을 줍니다!
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🔍</span>
                <div>
                  <strong className="text-gray-800">힌트 아이템:</strong> 모든 카드를 1.5초간 보여줍니다.
                  정말 어려울 때만 사용하세요!
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">❄️</span>
                <div>
                  <strong className="text-gray-800">냉동 아이템:</strong> 5초간 시간을 멈춥니다.
                  시간이 부족할 때 전략적으로 사용하세요!
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🎁</span>
                <div>
                  <strong className="text-gray-800">아이템 보급:</strong> 3스테이지마다 모든 아이템이 1개씩 보충됩니다!
                  장기전을 위한 필수 시스템입니다.
                </div>
              </div>
            </div>
          </div>

          {/* 게임 팁 */}
          <div className="mt-6 pt-6 border-t-2 border-gray-300">
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-5 border-2 border-cyan-200">
              <h3 className="text-lg sm:text-xl font-black text-cyan-700 mb-4 flex items-center gap-2">
                <span className="text-2xl">💡</span> 게임 팁
              </h3>
              <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                <li>
                  <strong>카드 위치 기억하기:</strong> 카드를 뒤집을 때 위치를 기억하는 것이 중요합니다.
                  처음 몇 개의 카드를 기억하면 나중에 빠르게 짝을 맞출 수 있습니다!
                </li>
                <li>
                  <strong>콤보 유지하기:</strong> 연속으로 맞추면 콤보가 쌓입니다.
                  콤보를 유지하려면 신중하게 카드를 선택하세요!
                </li>
                <li>
                  <strong>아이템 전략:</strong> 힌트는 정말 어려울 때만 사용하고,
                  냉동은 시간이 부족할 때 전략적으로 사용하세요!
                </li>
                <li>
                  <strong>스테이지별 대응:</strong> 스테이지가 올라갈수록 카드가 많아지고 시간이 짧아집니다.
                  초반에는 천천히, 후반에는 빠르게 플레이하세요!
                </li>
                <li>
                  <strong>아이템 보급 타이밍:</strong> 3스테이지마다 아이템이 보급되므로,
                  그 전까지 아이템을 아껴두는 것도 전략입니다!
                </li>
                <li>
                  <strong>엔딩 목표:</strong> 20스테이지를 모두 클리어하면 특별한 엔딩을 볼 수 있습니다!
                  포기하지 말고 끝까지 도전하세요!
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

