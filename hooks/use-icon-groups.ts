/**
 * @file use-icon-groups.ts
 * @description 아이콘 그룹화 상태를 관리하는 훅
 *
 * 주요 기능:
 * 1. localStorage에서 그룹 정보 로드/저장
 * 2. 그룹 생성/수정/삭제
 * 3. 아이콘을 그룹에 추가/제거
 * 4. SSR 안전성 보장
 *
 * @dependencies
 * - React (useEffect, useMemo, useState, useCallback)
 * - types/icon-groups.ts
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { IconGroup, IconGroupState } from "@/types/icon-groups";

const ICON_GROUPS_STORAGE_KEY = "app.icon-groups.v1";

/**
 * localStorage에서 그룹 정보를 안전하게 읽기
 */
function safeReadGroupsFromLocalStorage(): IconGroupState | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(ICON_GROUPS_STORAGE_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as IconGroupState;
    // 기본값 검증
    if (!parsed.groups || !Array.isArray(parsed.groups)) return null;
    if (!parsed.ungroupedIcons || !Array.isArray(parsed.ungroupedIcons)) return null;
    return parsed;
  } catch (error) {
    console.error("[useIconGroups] localStorage read failed:", error);
    return null;
  }
}

/**
 * localStorage에 그룹 정보를 안전하게 저장
 */
function safeWriteGroupsToLocalStorage(state: IconGroupState): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ICON_GROUPS_STORAGE_KEY, JSON.stringify(state));
    console.groupCollapsed("[useIconGroups] 그룹 상태 저장");
    console.log("저장된 그룹 수:", state.groups.length);
    console.log("그룹화되지 않은 아이콘 수:", state.ungroupedIcons.length);
    console.groupEnd();
  } catch (error) {
    console.error("[useIconGroups] localStorage write failed:", error);
  }
}

/**
 * 초기 상태 생성
 */
function createInitialState(allIconTitles: string[]): IconGroupState {
  return {
    groups: [],
    ungroupedIcons: [...allIconTitles],
  };
}

interface UseIconGroupsResult {
  /** 현재 그룹 상태 */
  state: IconGroupState;
  /** 로드 완료 여부 */
  isLoaded: boolean;
  /** 새 그룹 생성 (두 아이콘을 묶어서) */
  createGroup: (iconTitle1: string, iconTitle2: string, name?: string) => string | null;
  /** 그룹에 아이콘 추가 */
  addIconToGroup: (iconTitle: string, groupId: string) => boolean;
  /** 그룹에서 아이콘 제거 */
  removeIconFromGroup: (iconTitle: string, groupId: string) => boolean;
  /** 그룹 삭제 */
  deleteGroup: (groupId: string) => boolean;
  /** 그룹 이름 변경 */
  renameGroup: (groupId: string, newName: string) => boolean;
  /** 아이콘이 속한 그룹 ID 반환 */
  getGroupIdForIcon: (iconTitle: string) => string | null;
  /** 그룹 정보 가져오기 */
  getGroup: (groupId: string) => IconGroup | null;
  /** 모든 그룹 초기화 */
  resetAllGroups: () => void;
}

/**
 * 아이콘 그룹화 상태 관리 훅
 * @param allIconTitles 모든 아이콘의 title 배열 (초기 ungroupedIcons 설정용)
 */
export function useIconGroups(allIconTitles: string[]): UseIconGroupsResult {
  // Hydration 오류 방지: 초기 상태는 항상 서버와 동일하게 설정
  // localStorage는 useEffect에서만 읽어서 클라이언트에서만 업데이트
  const initial = useMemo<IconGroupState>(() => {
    // 서버와 클라이언트 모두 동일한 초기 상태 반환
    return createInitialState(allIconTitles);
  }, [allIconTitles]);

  const [state, setState] = useState<IconGroupState>(initial);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = safeReadGroupsFromLocalStorage();
    if (stored) {
      // 저장된 데이터와 현재 아이콘 목록 동기화
      const storedUngrouped = stored.ungroupedIcons.filter((title) =>
        allIconTitles.includes(title)
      );
      const storedGrouped = stored.groups.flatMap((group) => group.iconTitles);
      const storedGroupedFiltered = storedGrouped.filter((title) =>
        allIconTitles.includes(title)
      );
      
      const newIcons = allIconTitles.filter(
        (title) => !storedUngrouped.includes(title) && !storedGroupedFiltered.includes(title)
      );
      
      const filteredGroups = stored.groups.map((group) => ({
        ...group,
        iconTitles: group.iconTitles.filter((title) => allIconTitles.includes(title)),
      })).filter((group) => group.iconTitles.length > 0);
      
      setState({
        groups: filteredGroups,
        ungroupedIcons: [...storedUngrouped, ...newIcons],
      });
    } else {
      setState(createInitialState(allIconTitles));
    }
    setIsLoaded(true);
  }, [allIconTitles]);

  // 상태 변경 시 localStorage에 저장
  useEffect(() => {
    if (isLoaded) {
      safeWriteGroupsToLocalStorage(state);
    }
  }, [state, isLoaded]);

  /**
   * 새 그룹 생성
   */
  const createGroup = useCallback(
    (iconTitle1: string, iconTitle2: string, name?: string): string | null => {
      console.group("[useIconGroups] 그룹 생성");
      console.log("아이콘1:", iconTitle1);
      console.log("아이콘2:", iconTitle2);
      
      // 두 아이콘이 모두 ungrouped인지 확인
      if (!state.ungroupedIcons.includes(iconTitle1) || !state.ungroupedIcons.includes(iconTitle2)) {
        console.warn("두 아이콘 모두 그룹화되지 않은 상태여야 합니다.");
        console.groupEnd();
        return null;
      }
      
      const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const groupName = name || `${iconTitle1} 그룹`;
      
      const newGroup: IconGroup = {
        id: groupId,
        name: groupName,
        iconTitles: [iconTitle1, iconTitle2],
        createdAt: Date.now(),
      };
      
      setState((prev) => ({
        groups: [...prev.groups, newGroup],
        ungroupedIcons: prev.ungroupedIcons.filter(
          (title) => title !== iconTitle1 && title !== iconTitle2
        ),
      }));
      
      console.log("생성된 그룹 ID:", groupId);
      console.groupEnd();
      return groupId;
    },
    [state.ungroupedIcons]
  );

  /**
   * 그룹에 아이콘 추가
   */
  const addIconToGroup = useCallback(
    (iconTitle: string, groupId: string): boolean => {
      console.group("[useIconGroups] 그룹에 아이콘 추가");
      console.log("아이콘:", iconTitle);
      console.log("그룹 ID:", groupId);
      
      const group = state.groups.find((g) => g.id === groupId);
      if (!group) {
        console.warn("그룹을 찾을 수 없습니다.");
        console.groupEnd();
        return false;
      }
      
      if (group.iconTitles.includes(iconTitle)) {
        console.warn("이미 그룹에 포함된 아이콘입니다.");
        console.groupEnd();
        return false;
      }
      
      if (!state.ungroupedIcons.includes(iconTitle)) {
        console.warn("아이콘이 다른 그룹에 속해있거나 존재하지 않습니다.");
        console.groupEnd();
        return false;
      }
      
      setState((prev) => ({
        groups: prev.groups.map((g) =>
          g.id === groupId
            ? { ...g, iconTitles: [...g.iconTitles, iconTitle] }
            : g
        ),
        ungroupedIcons: prev.ungroupedIcons.filter((title) => title !== iconTitle),
      }));
      
      console.log("아이콘 추가 완료");
      console.groupEnd();
      return true;
    },
    [state.groups, state.ungroupedIcons]
  );

  /**
   * 그룹에서 아이콘 제거
   */
  const removeIconFromGroup = useCallback(
    (iconTitle: string, groupId: string): boolean => {
      console.group("[useIconGroups] 그룹에서 아이콘 제거");
      console.log("아이콘:", iconTitle);
      console.log("그룹 ID:", groupId);
      
      const group = state.groups.find((g) => g.id === groupId);
      if (!group) {
        console.warn("그룹을 찾을 수 없습니다.");
        console.groupEnd();
        return false;
      }
      
      if (!group.iconTitles.includes(iconTitle)) {
        console.warn("그룹에 포함되지 않은 아이콘입니다.");
        console.groupEnd();
        return false;
      }
      
      const newIconTitles = group.iconTitles.filter((title) => title !== iconTitle);
      
      setState((prev) => {
        // 아이콘이 1개만 남으면 그룹 삭제
        if (newIconTitles.length <= 1) {
          return {
            groups: prev.groups.filter((g) => g.id !== groupId),
            ungroupedIcons: [...prev.ungroupedIcons, ...newIconTitles],
          };
        }
        
        return {
          groups: prev.groups.map((g) =>
            g.id === groupId ? { ...g, iconTitles: newIconTitles } : g
          ),
          ungroupedIcons: [...prev.ungroupedIcons, iconTitle],
        };
      });
      
      console.log("아이콘 제거 완료");
      console.groupEnd();
      return true;
    },
    [state.groups]
  );

  /**
   * 그룹 삭제
   */
  const deleteGroup = useCallback(
    (groupId: string): boolean => {
      console.group("[useIconGroups] 그룹 삭제");
      console.log("그룹 ID:", groupId);
      
      const group = state.groups.find((g) => g.id === groupId);
      if (!group) {
        console.warn("그룹을 찾을 수 없습니다.");
        console.groupEnd();
        return false;
      }
      
      setState((prev) => ({
        groups: prev.groups.filter((g) => g.id !== groupId),
        ungroupedIcons: [...prev.ungroupedIcons, ...group.iconTitles],
      }));
      
      console.log("그룹 삭제 완료");
      console.groupEnd();
      return true;
    },
    [state.groups]
  );

  /**
   * 그룹 이름 변경
   */
  const renameGroup = useCallback(
    (groupId: string, newName: string): boolean => {
      console.group("[useIconGroups] 그룹 이름 변경");
      console.log("그룹 ID:", groupId);
      console.log("새 이름:", newName);
      
      if (!newName.trim()) {
        console.warn("그룹 이름은 비어있을 수 없습니다.");
        console.groupEnd();
        return false;
      }
      
      setState((prev) => ({
        ...prev,
        groups: prev.groups.map((g) =>
          g.id === groupId ? { ...g, name: newName.trim() } : g
        ),
      }));
      
      console.log("그룹 이름 변경 완료");
      console.groupEnd();
      return true;
    },
    []
  );

  /**
   * 아이콘이 속한 그룹 ID 반환
   */
  const getGroupIdForIcon = useCallback(
    (iconTitle: string): string | null => {
      const group = state.groups.find((g) => g.iconTitles.includes(iconTitle));
      return group?.id ?? null;
    },
    [state.groups]
  );

  /**
   * 그룹 정보 가져오기
   */
  const getGroup = useCallback(
    (groupId: string): IconGroup | null => {
      return state.groups.find((g) => g.id === groupId) ?? null;
    },
    [state.groups]
  );

  /**
   * 모든 그룹 초기화
   */
  const resetAllGroups = useCallback(() => {
    console.group("[useIconGroups] 모든 그룹 초기화");
    const allIcons = [
      ...state.ungroupedIcons,
      ...state.groups.flatMap((g) => g.iconTitles),
    ];
    setState({
      groups: [],
      ungroupedIcons: allIcons.filter((title) => allIconTitles.includes(title)),
    });
    console.log("초기화 완료");
    console.groupEnd();
  }, [state, allIconTitles]);

  return {
    state,
    isLoaded,
    createGroup,
    addIconToGroup,
    removeIconFromGroup,
    deleteGroup,
    renameGroup,
    getGroupIdForIcon,
    getGroup,
    resetAllGroups,
  };
}

