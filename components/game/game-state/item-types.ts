/**
 * @file components/game/game-state/item-types.ts
 * @description 아이템 타입 정의
 *
 * Phase 6: 게임 요소
 * - 아이템 데이터 구조
 * - 아이템 타입 정의
 */

export type ItemType = "consumable" | "equipment" | "quest" | "misc";

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  icon?: string; // 아이템 아이콘 URL
  stackable: boolean; // 중첩 가능 여부
  maxStack?: number; // 최대 중첩 수
  effect?: {
    type: "health" | "energy" | "experience";
    amount: number;
  };
}

export interface InventorySlot {
  item: Item | null;
  quantity: number;
}

