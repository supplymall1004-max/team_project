/**
 * @file components/game/threejs/game-hud.tsx
 * @description 게임 HUD (Head-Up Display) 컴포넌트
 *
 * Phase 5: 게임 UI 및 HUD
 * - 체력/에너지 바
 * - 미니맵
 * - 퀘스트 목록
 * - 인벤토리 UI
 *
 * @dependencies
 * - React: useState, useEffect
 * - Tailwind CSS: 스타일링
 */

"use client";

import { useState } from "react";
import { Heart, Battery, Map, ListChecks, Package } from "lucide-react";
import { useQuestState } from "../game-state/use-quest-state";
import { useInventoryState } from "../game-state/use-inventory-state";

interface GameHUDProps {
  health?: number; // 0-100
  energy?: number; // 0-100
  showMinimap?: boolean;
  showQuests?: boolean;
  showInventory?: boolean;
}

/**
 * 게임 HUD 컴포넌트
 * 게임 플레이 중 화면에 표시되는 UI 요소들
 */
export function GameHUD({
  health = 100,
  energy = 100,
  showMinimap = true,
  showQuests = true,
  showInventory = true,
}: GameHUDProps) {
  const [isMinimapOpen, setIsMinimapOpen] = useState(false);
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  
  // 퀘스트 및 인벤토리 상태
  const activeQuests = useQuestState((state) => state.getActiveQuests());
  const inventory = useInventoryState((state) => state.inventory);

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* 상단 왼쪽: 체력/에너지 바 */}
      <div className="absolute top-4 left-4 pointer-events-auto">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 space-y-2 min-w-[200px]">
          {/* 체력 바 */}
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
              <div
                className="bg-red-500 h-full transition-all duration-300"
                style={{ width: `${health}%` }}
              />
            </div>
            <span className="text-white text-sm font-bold min-w-[35px] text-right">
              {health}%
            </span>
          </div>

          {/* 에너지 바 */}
          <div className="flex items-center gap-2">
            <Battery className="w-5 h-5 text-yellow-500" />
            <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
              <div
                className="bg-yellow-500 h-full transition-all duration-300"
                style={{ width: `${energy}%` }}
              />
            </div>
            <span className="text-white text-sm font-bold min-w-[35px] text-right">
              {energy}%
            </span>
          </div>
        </div>
      </div>

      {/* 상단 오른쪽: 미니맵 버튼 */}
      {showMinimap && (
        <div className="absolute top-4 right-4 pointer-events-auto">
          <button
            onClick={() => setIsMinimapOpen(!isMinimapOpen)}
            className="bg-black/60 backdrop-blur-sm rounded-lg p-3 hover:bg-black/80 transition-colors"
            aria-label="미니맵 토글"
          >
            <Map className="w-6 h-6 text-white" />
          </button>
          {isMinimapOpen && (
            <div className="absolute top-14 right-0 bg-black/80 backdrop-blur-sm rounded-lg p-4 w-64 h-64">
              <div className="text-white text-sm font-bold mb-2">미니맵</div>
              <div className="bg-gray-800 rounded w-full h-full flex items-center justify-center text-gray-500 text-xs">
                미니맵 구현 예정
              </div>
            </div>
          )}
        </div>
      )}

      {/* 하단 왼쪽: 퀘스트 버튼 */}
      {showQuests && (
        <div className="absolute bottom-4 left-4 pointer-events-auto">
          <button
            onClick={() => setIsQuestsOpen(!isQuestsOpen)}
            className="bg-black/60 backdrop-blur-sm rounded-lg p-3 hover:bg-black/80 transition-colors"
            aria-label="퀘스트 목록 토글"
          >
            <ListChecks className="w-6 h-6 text-white" />
          </button>
          {isQuestsOpen && (
            <div className="absolute bottom-14 left-0 bg-black/80 backdrop-blur-sm rounded-lg p-4 w-80 max-h-96 overflow-y-auto">
              <div className="text-white text-lg font-bold mb-3">퀘스트</div>
              <div className="space-y-3 text-white text-sm">
                {activeQuests.length === 0 ? (
                  <div className="text-gray-400">진행 중인 퀘스트가 없습니다.</div>
                ) : (
                  activeQuests.map((quest) => (
                    <div
                      key={quest.id}
                      className="bg-gray-700/50 rounded p-3 border border-gray-600"
                    >
                      <div className="font-semibold mb-2">{quest.title}</div>
                      <div className="text-gray-300 text-xs mb-2">
                        {quest.description}
                      </div>
                      <div className="space-y-1">
                        {quest.objectives.map((obj) => (
                          <div
                            key={obj.id}
                            className={`text-xs flex items-center gap-2 ${
                              obj.completed ? "text-green-400" : "text-gray-400"
                            }`}
                          >
                            <span>{obj.completed ? "✓" : "○"}</span>
                            <span>{obj.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 하단 오른쪽: 인벤토리 버튼 */}
      {showInventory && (
        <div className="absolute bottom-4 right-4 pointer-events-auto">
          <button
            onClick={() => setIsInventoryOpen(!isInventoryOpen)}
            className="bg-black/60 backdrop-blur-sm rounded-lg p-3 hover:bg-black/80 transition-colors"
            aria-label="인벤토리 토글"
          >
            <Package className="w-6 h-6 text-white" />
          </button>
          {isInventoryOpen && (
            <div className="absolute bottom-14 right-0 bg-black/80 backdrop-blur-sm rounded-lg p-4 w-80 max-h-96 overflow-y-auto">
              <div className="text-white text-lg font-bold mb-3">인벤토리</div>
              <div className="grid grid-cols-4 gap-2">
                {inventory.map((slot, index) => (
                  <div
                    key={index}
                    className={`bg-gray-700 rounded border-2 aspect-square flex flex-col items-center justify-center relative ${
                      slot.item ? "border-orange-500" : "border-gray-600"
                    }`}
                    title={slot.item?.name}
                  >
                    {slot.item ? (
                      <>
                        <div className="text-white text-xs font-semibold text-center px-1 truncate w-full">
                          {slot.item.name}
                        </div>
                        {slot.quantity > 1 && (
                          <div className="absolute bottom-0 right-0 bg-orange-500 text-white text-xs px-1 rounded-tl">
                            {slot.quantity}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-500 text-xs">{index + 1}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

