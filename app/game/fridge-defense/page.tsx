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
    <div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-center">냉장고 디펜스</h1>
        <p className="text-center text-sm md:text-base text-gray-600 mb-4 md:mb-8 px-2">
          타워를 배치하여 세균이 냉장고에 도달하는 것을 막아보세요!
        </p>
        <div className="w-full">
          <FridgeDefense />
        </div>
      </div>
    </div>
  );
}

