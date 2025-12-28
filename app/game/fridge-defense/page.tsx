/**
 * @file app/game/fridge-defense/page.tsx
 * @description 냉장고 디펜스 게임 페이지
 * 
 * 타워 디펜스 방식의 냉장고 디펜스 게임을 플레이할 수 있는 페이지입니다.
 */

import { Metadata } from 'next';
import FridgeDefense from '@/components/games/fridge-defense';

export const metadata: Metadata = {
  title: '냉장고 디펜스 | Flavor Archive',
  description: '타워를 배치하여 세균을 막아내는 타워 디펜스 게임',
};

export default function FridgeDefensePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-sky-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            냉장고 디펜스
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 font-medium">
            타워를 배치하여 세균이 냉장고에 도달하는 것을 막아보세요! 🛡️
          </p>
        </div>
        
        <div className="w-full mb-8">
          <FridgeDefense />
        </div>
        
        <div className="mt-8 bg-white/90 backdrop-blur-lg rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(102,126,234,0.15)] border-2 border-white/50">
          <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-sky-600 to-purple-600 bg-clip-text text-transparent mb-6">
            게임 방법
          </h2>
          
          {/* 게임 목표 */}
          <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-200">
            <h3 className="text-lg sm:text-xl font-black text-blue-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">🎯</span> 게임 목표
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>세균들이 경로를 따라 냉장고에 도달하기 전에 타워를 배치하여 막아내세요!</p>
              <p>최대한 많은 웨이브를 버티며 높은 점수를 달성하세요!</p>
            </div>
          </div>

          {/* 타워 종류 */}
          <div className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-200">
            <h3 className="text-lg sm:text-xl font-black text-green-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">🏰</span> 타워 종류
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3 bg-white/50 rounded-lg p-3">
                <span className="text-3xl">🍗</span>
                <div className="flex-1">
                  <strong className="text-gray-800 text-base">닭다리 (PROTEIN 타워)</strong>
                  <p className="text-xs text-gray-500 mt-1">비용: 180G</p>
                  <p className="mt-1">근접 공격 타워로, 1명에게 강력한 데미지를 입힙니다. 높은 방어력을 가지고 있어 적의 공격을 잘 버틸 수 있습니다.</p>
                  <p className="mt-1 text-xs text-gray-500">⚔️ 근접 공격 | 높은 데미지 | 높은 방어력</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/50 rounded-lg p-3">
                <span className="text-3xl">🥦</span>
                <div className="flex-1">
                  <strong className="text-gray-800 text-base">브로콜리 (VITAMIN 타워)</strong>
                  <p className="text-xs text-gray-500 mt-1">비용: 150G</p>
                  <p className="mt-1">범위 공격 타워로, 최대 2명의 적에게 동시에 공격합니다. 빠른 공격 속도가 특징입니다.</p>
                  <p className="mt-1 text-xs text-gray-500">💥 범위 공격 (2명) | 빠른 공격 속도</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/50 rounded-lg p-3">
                <span className="text-3xl">🥑</span>
                <div className="flex-1">
                  <strong className="text-gray-800 text-base">아보카도 (SUGAR 타워)</strong>
                  <p className="text-xs text-gray-500 mt-1">비용: 240G</p>
                  <p className="mt-1">원거리 공격 타워로, 씨를 던져 멀리 있는 적을 공격합니다. 긴 사거리와 강력한 데미지가 특징입니다.</p>
                  <p className="mt-1 text-xs text-gray-500">🎯 원거리 공격 | 긴 사거리 | 강력한 데미지</p>
                </div>
              </div>
            </div>
          </div>

          {/* 적 종류 */}
          <div className="mb-6 bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-5 border-2 border-red-200">
            <h3 className="text-lg sm:text-xl font-black text-red-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">🦠</span> 적(세균) 종류
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3 bg-white/50 rounded-lg p-3">
                <span className="text-3xl">🦠</span>
                <div className="flex-1">
                  <strong className="text-gray-800 text-base">일반 세균 (GERM)</strong>
                  <p className="mt-1">기본 적으로, 체력 120, 속도 보통입니다. 처치 시 35G를 획득합니다.</p>
                  <p className="mt-1 text-xs text-gray-500">체력: 120 | 속도: 보통 | 골드: 35G</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/50 rounded-lg p-3">
                <span className="text-3xl">🍭</span>
                <div className="flex-1">
                  <strong className="text-gray-800 text-base">설탕 스파이크 (SUGAR_SPIKE)</strong>
                  <p className="mt-1">빠른 적으로, 체력 70, 속도 빠름입니다. 처치 시 50G를 획득합니다.</p>
                  <p className="mt-1 text-xs text-gray-500">체력: 70 | 속도: 빠름 | 골드: 50G</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/50 rounded-lg p-3">
                <span className="text-3xl">🍟</span>
                <div className="flex-1">
                  <strong className="text-gray-800 text-base">지방 폭탄 (FATTY_BOMB)</strong>
                  <p className="mt-1">강한 적으로, 체력 450, 속도 느림입니다. 처치 시 120G를 획득합니다.</p>
                  <p className="mt-1 text-xs text-gray-500">체력: 450 | 속도: 느림 | 골드: 120G</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white/50 rounded-lg p-3">
                <span className="text-3xl">👹</span>
                <div className="flex-1">
                  <strong className="text-gray-800 text-base">메가 세균 (MEGA_GERM) - 보스</strong>
                  <p className="mt-1">보스 적으로, 체력 800, 속도 보통입니다. 처치 시 250G를 획득합니다. 웨이브 5 이상에서 등장합니다.</p>
                  <p className="mt-1 text-xs text-gray-500">체력: 800 | 속도: 보통 | 골드: 250G | 보스</p>
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
                  <strong className="text-gray-800">웨이브 시스템</strong> - 적을 모두 처치하면 다음 웨이브로 진행됩니다. 웨이브가 올라갈수록 적의 체력과 속도가 증가하고, 경로 수도 증가합니다!
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🛣️</span>
                <div>
                  <strong className="text-gray-800">경로 시스템</strong> - 초반에는 1개 경로, 중반에는 2개 경로, 후반에는 3개 경로로 증가합니다. 경로 위에는 타워를 배치할 수 없습니다!
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">⬆️</span>
                <div>
                  <strong className="text-gray-800">타워 업그레이드</strong> - 타워를 클릭하면 업그레이드 메뉴가 나타납니다. 업그레이드하면 데미지, 범위, 공격 속도가 향상됩니다! (최대 레벨 5)
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">⚡</span>
                <div>
                  <strong className="text-gray-800">특수 스킬 - 비타민 충격파</strong> - 모든 적에게 150 데미지를 입히는 특수 스킬입니다. 쿨타임 30초입니다!
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">💰</span>
                <div>
                  <strong className="text-gray-800">골드 시스템</strong> - 적을 처치하면 골드를 획득합니다. 골드로 타워를 배치하거나 업그레이드할 수 있습니다!
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">❤️</span>
                <div>
                  <strong className="text-gray-800">생명력 시스템</strong> - 적이 냉장고에 도달하면 생명력이 1 감소합니다. 생명력이 0이 되면 게임이 종료됩니다! (최대 5개)
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🏗️</span>
                <div>
                  <strong className="text-gray-800">타워 배치 제한</strong> - 최대 15개의 타워만 배치할 수 있습니다. 효율적인 배치가 중요합니다!
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🍽️</span>
                <div>
                  <strong className="text-gray-800">식단 연동 버프</strong> - 오늘의 식단에 포함된 타워는 공격 속도가 30% 증가합니다!
                </div>
              </div>
            </div>
          </div>

          {/* 게임 정보 */}
          <div className="mb-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border-2 border-amber-200">
            <h3 className="text-lg sm:text-xl font-black text-amber-700 mb-4 flex items-center gap-2">
              <span className="text-2xl">ℹ️</span> 게임 정보
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <span className="text-xl">🎮</span>
                <div>
                  <strong className="text-gray-800">게임 시작</strong> - 왼쪽 사이드바 하단의 "게임 시작" 버튼을 클릭하여 게임을 시작하세요!
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🖱️</span>
                <div>
                  <strong className="text-gray-800">타워 배치</strong> - 왼쪽 사이드바에서 타워를 선택한 후, 게임 보드에서 원하는 위치를 클릭하여 배치하세요!
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🔄</span>
                <div>
                  <strong className="text-gray-800">타워 업그레이드</strong> - 배치된 타워를 클릭하면 업그레이드 메뉴가 나타납니다. 골드가 충분하면 업그레이드할 수 있습니다!
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">⏸️</span>
                <div>
                  <strong className="text-gray-800">일시정지</strong> - 게임 중 상단의 일시정지 버튼을 클릭하여 게임을 일시정지할 수 있습니다!
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🔍</span>
                <div>
                  <strong className="text-gray-800">전체화면 모드</strong> - 게임 보드 오른쪽 아래의 전체화면 버튼을 클릭하여 전체화면으로 플레이할 수 있습니다!
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
                <li>경로 근처에 타워를 배치하면 더 많은 적을 공격할 수 있습니다!</li>
                <li>타워를 업그레이드하면 데미지와 범위가 증가하므로, 효율적인 전략입니다!</li>
                <li>웨이브가 올라갈수록 경로 수가 증가하므로, 여러 경로를 커버할 수 있도록 타워를 배치하세요!</li>
                <li>특수 스킬 "비타민 충격파"는 위기 상황에서 사용하면 효과적입니다!</li>
                <li>적이 타워를 공격할 수 있으므로, 타워의 체력을 관리하세요!</li>
                <li>최대 타워 개수는 15개이므로, 효율적인 배치가 중요합니다!</li>
                <li>오늘의 식단에 포함된 타워는 공격 속도가 30% 증가하므로, 이를 활용하세요!</li>
                <li>5의 배수 웨이브(5, 10, 15, 20)는 위기 웨이브로, 더 강력한 적들이 등장합니다!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

