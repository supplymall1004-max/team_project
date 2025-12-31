/**
 * @file icon-groups.ts
 * @description 아이콘 그룹화 기능을 위한 타입 정의
 *
 * 주요 타입:
 * - IconGroup: 폴더 정보
 * - IconGroupState: 전체 그룹 상태
 * - QuickStartCardWithFolder: 폴더 정보를 포함한 확장된 카드 타입
 */

import { QuickStartCard } from "@/components/home/hero-section";

/**
 * 아이콘 그룹 (폴더) 정보
 */
export interface IconGroup {
  /** 그룹 고유 ID */
  id: string;
  /** 폴더 이름 */
  name: string;
  /** 이 그룹에 속한 아이콘의 title 배열 (고유 식별자) */
  iconTitles: string[];
  /** 폴더 색상 (그라데이션 클래스) */
  color?: string;
  /** 생성 시간 */
  createdAt: number;
}

/**
 * 전체 아이콘 그룹 상태
 */
export interface IconGroupState {
  /** 모든 그룹 */
  groups: IconGroup[];
  /** 그룹에 속하지 않은 아이콘들의 title 배열 */
  ungroupedIcons: string[];
}

/**
 * 폴더 정보를 포함한 확장된 QuickStartCard
 */
export interface QuickStartCardWithFolder extends QuickStartCard {
  /** 이 아이콘이 속한 폴더 ID (없으면 null) */
  folderId: string | null;
}

/**
 * 드래그 앤 드롭 데이터 타입
 */
export interface DragData {
  /** 드래그 중인 아이콘의 title */
  iconTitle: string;
  /** 드래그 타입 */
  type: "icon" | "folder";
}

