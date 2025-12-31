/**
 * @file lib/storage/sync-manager.ts
 * @description 동기화 관리자
 *
 * 변경사항 추적, 동기화 대기열 관리, 자동/수동 동기화 로직
 */

import { getIndexedDBManager, STORES } from "./indexeddb-manager";

export interface SyncChange {
  id: string;
  store: string;
  recordId: string;
  operation: "create" | "update" | "delete";
  data?: any;
  timestamp: string;
  retryCount: number;
}

export interface SyncMetadata {
  id: string;
  userId: string;
  lastSyncAt: string | null;
  pendingChangesCount: number;
  autoSyncEnabled: boolean;
  syncInProgress: boolean;
}

/**
 * 변경사항 추적
 */
export async function trackChange(
  store: string,
  recordId: string,
  operation: "create" | "update" | "delete",
  data?: any
): Promise<void> {
  const manager = getIndexedDBManager();
  await manager.init();

  const change: SyncChange = {
    id: crypto.randomUUID(),
    store,
    recordId,
    operation,
    data,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };

  // sync_metadata에 변경사항 추가 (간단한 구현)
  const metadata = await getSyncMetadata();
  if (metadata) {
    metadata.pendingChangesCount = (metadata.pendingChangesCount || 0) + 1;
    await manager.save(STORES.SYNC_METADATA, metadata);
  }
}

/**
 * 대기 중인 변경사항 조회
 */
export async function getPendingChanges(): Promise<SyncChange[]> {
  // 실제 구현에서는 별도 테이블에 저장하거나, 각 레코드의 syncStatus를 확인
  // 여기서는 간단한 구현만 제공
  return [];
}

/**
 * 동기화 메타데이터 조회
 */
export async function getSyncMetadata(userId?: string): Promise<SyncMetadata | null> {
  const manager = getIndexedDBManager();
  await manager.init();

  const allMetadata = await manager.getAll<SyncMetadata>(STORES.SYNC_METADATA);
  if (userId) {
    return allMetadata.find((m) => m.userId === userId) || null;
  }
  return allMetadata[0] || null;
}

/**
 * 동기화 메타데이터 저장
 */
export async function saveSyncMetadata(metadata: SyncMetadata): Promise<void> {
  const manager = getIndexedDBManager();
  await manager.init();

  await manager.save(STORES.SYNC_METADATA, metadata);
}

