/**
 * @file components/game/game-state/use-inventory-state.ts
 * @description 인벤토리 상태 관리 Hook
 *
 * Phase 6: 게임 요소
 * - 아이템 수집 및 관리
 * - 인벤토리 관리
 * - 아이템 사용 로직
 *
 * @dependencies
 * - zustand: 상태 관리
 */

import { create } from "zustand";
import { Item, InventorySlot } from "./item-types";

interface InventoryState {
  inventory: InventorySlot[];
  maxSlots: number;

  // Actions
  addItem: (item: Item, quantity?: number) => boolean;
  removeItem: (itemId: string, quantity?: number) => boolean;
  useItem: (itemId: string) => boolean;
  getItemQuantity: (itemId: string) => number;
  hasItem: (itemId: string) => boolean;
  getEmptySlots: () => number;
}

const MAX_INVENTORY_SLOTS = 16;

/**
 * 인벤토리 상태 관리 Store
 */
export const useInventoryState = create<InventoryState>((set, get) => ({
  inventory: Array(MAX_INVENTORY_SLOTS)
    .fill(null)
    .map(() => ({ item: null, quantity: 0 })),
  maxSlots: MAX_INVENTORY_SLOTS,

  addItem: (item, quantity = 1) => {
    const state = get();

    // 기존 아이템이 있고 중첩 가능한 경우
    if (item.stackable) {
      const existingSlotIndex = state.inventory.findIndex(
        (slot) => slot.item?.id === item.id && slot.quantity < (item.maxStack || 99)
      );

      if (existingSlotIndex !== -1) {
        const slot = state.inventory[existingSlotIndex];
        const maxAdd = (item.maxStack || 99) - slot.quantity;
        const addAmount = Math.min(quantity, maxAdd);

        set((state) => ({
          inventory: state.inventory.map((s, i) =>
            i === existingSlotIndex
              ? { ...s, quantity: s.quantity + addAmount }
              : s
          ),
        }));

        // 남은 수량이 있으면 재귀 호출
        if (quantity > addAmount) {
          return get().addItem(item, quantity - addAmount);
        }
        return true;
      }
    }

    // 빈 슬롯 찾기
    const emptySlotIndex = state.inventory.findIndex(
      (slot) => slot.item === null
    );

    if (emptySlotIndex === -1) {
      console.warn("⚠️ 인벤토리가 가득 찼습니다.");
      return false;
    }

    set((state) => ({
      inventory: state.inventory.map((s, i) =>
        i === emptySlotIndex
          ? { item, quantity: Math.min(quantity, item.maxStack || 99) }
          : s
      ),
    }));

    // 남은 수량이 있으면 재귀 호출
    if (quantity > (item.maxStack || 99)) {
      return get().addItem(item, quantity - (item.maxStack || 99));
    }

    return true;
  },

  removeItem: (itemId, quantity = 1) => {
    const state = get();
    const slotIndex = state.inventory.findIndex(
      (slot) => slot.item?.id === itemId
    );

    if (slotIndex === -1) {
      return false;
    }

    const slot = state.inventory[slotIndex];
    if (slot.quantity < quantity) {
      return false;
    }

    set((state) => ({
      inventory: state.inventory.map((s, i) =>
        i === slotIndex
          ? s.quantity === quantity
            ? { item: null, quantity: 0 }
            : { ...s, quantity: s.quantity - quantity }
          : s
      ),
    }));

    return true;
  },

  useItem: (itemId) => {
    const state = get();
    const slot = state.inventory.find((s) => s.item?.id === itemId);

    if (!slot || !slot.item) {
      return false;
    }

    // 아이템 효과 적용 (향후 게임 상태와 연동)
    if (slot.item.effect) {
      console.log("✅ 아이템 사용:", slot.item.name, slot.item.effect);
      // TODO: 게임 상태에 효과 적용
    }

    // 아이템 제거 (소모품인 경우)
    if (slot.item.type === "consumable") {
      return get().removeItem(itemId, 1);
    }

    return true;
  },

  getItemQuantity: (itemId) => {
    const state = get();
    const slot = state.inventory.find((s) => s.item?.id === itemId);
    return slot?.quantity || 0;
  },

  hasItem: (itemId) => {
    return get().getItemQuantity(itemId) > 0;
  },

  getEmptySlots: () => {
    const state = get();
    return state.inventory.filter((s) => s.item === null).length;
  },
}));

