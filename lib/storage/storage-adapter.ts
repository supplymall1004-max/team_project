/**
 * @file lib/storage/storage-adapter.ts
 * @description 스토리지 어댑터 인터페이스
 *
 * 다양한 스토리지 백엔드를 지원하기 위한 추상화 계층
 */

export interface StorageAdapter {
  save<T>(store: string, data: T & { id?: string }): Promise<string>;
  get<T>(store: string, id: string): Promise<T | null>;
  getAll<T>(store: string): Promise<T[]>;
  delete(store: string, id: string): Promise<void>;
  clear(store: string): Promise<void>;
  export(): Promise<Blob>;
  import(blob: Blob): Promise<void>;
}

/**
 * IndexedDB 구현체
 */
export class IndexedDBAdapter implements StorageAdapter {
  private manager: ReturnType<typeof import("./indexeddb-manager").getIndexedDBManager> | null = null;

  constructor() {
    // 동적 import로 순환 참조 방지
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    this.manager = require("./indexeddb-manager").getIndexedDBManager();
  }

  async save<T>(store: string, data: T & { id?: string }): Promise<string> {
    return this.manager.save(store as any, data);
  }

  async get<T>(store: string, id: string): Promise<T | null> {
    return this.manager.get<T>(store as any, id);
  }

  async getAll<T>(store: string): Promise<T[]> {
    return this.manager.getAll<T>(store as any);
  }

  async delete(store: string, id: string): Promise<void> {
    return this.manager.delete(store as any, id);
  }

  async clear(store: string): Promise<void> {
    return this.manager.clear(store as any);
  }

  async export(): Promise<Blob> {
    return this.manager.export();
  }

  async import(blob: Blob): Promise<void> {
    return this.manager.import(blob);
  }
}

