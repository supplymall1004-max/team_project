/**
 * @file types/promo-code.ts
 * @description 프로모션 코드 관련 타입 정의
 */

export type DiscountType = 'percentage' | 'fixed_amount' | 'free_trial';
export type PlanType = 'monthly' | 'yearly';

export interface PromoCode {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string;
  applicable_plans: PlanType[] | null;
  new_users_only: boolean;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface PromoCodeListItem extends PromoCode {
  status: 'active' | 'expired' | 'used_up';
}

export interface PromoCodeFormValues {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  max_uses: number | null;
  valid_from: string;
  valid_until: string;
  applicable_plans: PlanType[] | null;
  new_users_only: boolean;
  description: string;
}

export interface PromoCodeStats {
  total: number;
  active: number;
  expired: number;
  usedUp: number;
}

