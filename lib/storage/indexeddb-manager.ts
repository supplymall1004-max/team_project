/**
 * @file lib/storage/indexeddb-manager.ts
 * @description IndexedDB 관리자
 *
 * 주요 기능:
 * 1. IndexedDB 초기화 및 Object Store 생성
 * 2. CRUD 기본 메서드 (save, get, getAll, delete, clear)
 * 3. 데이터 내보내기/가져오기 기능
 * 4. 트랜잭션 관리
 */

const DB_NAME = "health_family_app";
const DB_VERSION = 1;

// Object Store 이름 정의
export const STORES = {
  DIET_PLANS: "diet_plans",
  WEEKLY_DIET_PLANS: "weekly_diet_plans",
  GAME_RECORDS: "game_records",
  HEALTH_RECORDS: "health_records",
  ACTIVITY_LOGS: "activity_logs",
  SLEEP_RECORDS: "sleep_records",
  QUEST_RECORDS: "quest_records",
  CHARACTER_DATA: "character_data",
  SYNC_METADATA: "sync_metadata",
  MEAL_PHOTOS: "meal_photos", // 식사 사진 저장소
  ACTUAL_DIET_RECORDS: "actual_diet_records", // 실제 섭취 식단 기록
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

interface IndexedDBManager {
  init(): Promise<void>;
  save<T>(store: StoreName, data: T & { id?: string }): Promise<string>;
  get<T>(store: StoreName, id: string): Promise<T | null>;
  getAll<T>(store: StoreName): Promise<T[]>;
  delete(store: StoreName, id: string): Promise<void>;
  clear(store: StoreName): Promise<void>;
  export(): Promise<Blob>;
  import(blob: Blob): Promise<void>;
}

class IndexedDBManagerImpl implements IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * IndexedDB 초기화
   */
  async init(): Promise<void> {
    if (this.db) {
      return; // 이미 초기화됨
    }

    if (this.initPromise) {
      return this.initPromise; // 초기화 중이면 대기
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.indexedDB) {
        reject(new Error("IndexedDB is not supported in this environment"));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("[IndexedDB] 초기화 실패:", request.error);
        reject(request.error);
        this.initPromise = null;
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("[IndexedDB] 초기화 완료");
        resolve();
        this.initPromise = null;
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log("[IndexedDB] 스키마 업그레이드 시작");

        // Object Store 생성
        if (!db.objectStoreNames.contains(STORES.DIET_PLANS)) {
          const dietPlansStore = db.createObjectStore(STORES.DIET_PLANS, {
            keyPath: "id",
            autoIncrement: false,
          });
          dietPlansStore.createIndex("userId", "userId", { unique: false });
          dietPlansStore.createIndex("planDate", "planDate", { unique: false });
          dietPlansStore.createIndex("syncStatus", "syncStatus", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.WEEKLY_DIET_PLANS)) {
          const weeklyStore = db.createObjectStore(STORES.WEEKLY_DIET_PLANS, {
            keyPath: "id",
            autoIncrement: false,
          });
          weeklyStore.createIndex("userId", "userId", { unique: false });
          weeklyStore.createIndex("weekStartDate", "weekStartDate", { unique: false });
          weeklyStore.createIndex("syncStatus", "syncStatus", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.GAME_RECORDS)) {
          const gameStore = db.createObjectStore(STORES.GAME_RECORDS, {
            keyPath: "id",
            autoIncrement: false,
          });
          gameStore.createIndex("userId", "userId", { unique: false });
          gameStore.createIndex("gameType", "gameType", { unique: false });
          gameStore.createIndex("playedAt", "playedAt", { unique: false });
          gameStore.createIndex("syncStatus", "syncStatus", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.HEALTH_RECORDS)) {
          const healthStore = db.createObjectStore(STORES.HEALTH_RECORDS, {
            keyPath: "id",
            autoIncrement: false,
          });
          healthStore.createIndex("userId", "userId", { unique: false });
          healthStore.createIndex("recordType", "recordType", { unique: false });
          healthStore.createIndex("createdAt", "createdAt", { unique: false });
          healthStore.createIndex("syncStatus", "syncStatus", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.ACTIVITY_LOGS)) {
          const activityStore = db.createObjectStore(STORES.ACTIVITY_LOGS, {
            keyPath: "id",
            autoIncrement: false,
          });
          activityStore.createIndex("userId", "userId", { unique: false });
          activityStore.createIndex("date", "date", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SLEEP_RECORDS)) {
          const sleepStore = db.createObjectStore(STORES.SLEEP_RECORDS, {
            keyPath: "id",
            autoIncrement: false,
          });
          sleepStore.createIndex("userId", "userId", { unique: false });
          sleepStore.createIndex("date", "date", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.QUEST_RECORDS)) {
          const questStore = db.createObjectStore(STORES.QUEST_RECORDS, {
            keyPath: "id",
            autoIncrement: false,
          });
          questStore.createIndex("userId", "userId", { unique: false });
          questStore.createIndex("questDate", "questDate", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.CHARACTER_DATA)) {
          const characterStore = db.createObjectStore(STORES.CHARACTER_DATA, {
            keyPath: "id",
            autoIncrement: false,
          });
          characterStore.createIndex("userId", "userId", { unique: false });
          characterStore.createIndex("memberId", "memberId", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SYNC_METADATA)) {
          const syncStore = db.createObjectStore(STORES.SYNC_METADATA, {
            keyPath: "id",
            autoIncrement: false,
          });
          syncStore.createIndex("userId", "userId", { unique: true });
        }

        if (!db.objectStoreNames.contains(STORES.MEAL_PHOTOS)) {
          const mealPhotosStore = db.createObjectStore(STORES.MEAL_PHOTOS, {
            keyPath: "id",
            autoIncrement: false,
          });
          mealPhotosStore.createIndex("userId", "userId", { unique: false });
          mealPhotosStore.createIndex("date", "date", { unique: false });
          mealPhotosStore.createIndex("mealType", "mealType", { unique: false });
          mealPhotosStore.createIndex("date_mealType", ["date", "mealType"], { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.ACTUAL_DIET_RECORDS)) {
          const actualDietStore = db.createObjectStore(STORES.ACTUAL_DIET_RECORDS, {
            keyPath: "id",
            autoIncrement: false,
          });
          actualDietStore.createIndex("userId", "userId", { unique: false });
          actualDietStore.createIndex("date", "date", { unique: false });
          actualDietStore.createIndex("mealType", "mealType", { unique: false });
          actualDietStore.createIndex("syncStatus", "syncStatus", { unique: false });
        }

        console.log("[IndexedDB] 스키마 업그레이드 완료");
      };
    });

    return this.initPromise;
  }

  /**
   * 데이터 저장
   */
  async save<T>(store: StoreName, data: T & { id?: string }): Promise<string> {
    await this.init();

    if (!this.db) {
      throw new Error("IndexedDB가 초기화되지 않았습니다");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], "readwrite");
      const objectStore = transaction.objectStore(store);

      // ID가 없으면 UUID 생성
      const id = data.id || crypto.randomUUID();
      const dataWithId = { ...data, id };

      const request = objectStore.put(dataWithId);

      request.onsuccess = () => {
        console.log(`[IndexedDB] 저장 완료: ${store}/${id}`);
        resolve(id);
      };

      request.onerror = () => {
        console.error(`[IndexedDB] 저장 실패: ${store}/${id}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 데이터 조회
   */
  async get<T>(store: StoreName, id: string): Promise<T | null> {
    await this.init();

    if (!this.db) {
      throw new Error("IndexedDB가 초기화되지 않았습니다");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], "readonly");
      const objectStore = transaction.objectStore(store);
      const request = objectStore.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error(`[IndexedDB] 조회 실패: ${store}/${id}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 전체 데이터 조회
   */
  async getAll<T>(store: StoreName): Promise<T[]> {
    await this.init();

    if (!this.db) {
      throw new Error("IndexedDB가 초기화되지 않았습니다");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], "readonly");
      const objectStore = transaction.objectStore(store);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error(`[IndexedDB] 전체 조회 실패: ${store}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 데이터 삭제
   */
  async delete(store: StoreName, id: string): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error("IndexedDB가 초기화되지 않았습니다");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], "readwrite");
      const objectStore = transaction.objectStore(store);
      const request = objectStore.delete(id);

      request.onsuccess = () => {
        console.log(`[IndexedDB] 삭제 완료: ${store}/${id}`);
        resolve();
      };

      request.onerror = () => {
        console.error(`[IndexedDB] 삭제 실패: ${store}/${id}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 전체 데이터 삭제
   */
  async clear(store: StoreName): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error("IndexedDB가 초기화되지 않았습니다");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([store], "readwrite");
      const objectStore = transaction.objectStore(store);
      const request = objectStore.clear();

      request.onsuccess = () => {
        console.log(`[IndexedDB] 전체 삭제 완료: ${store}`);
        resolve();
      };

      request.onerror = () => {
        console.error(`[IndexedDB] 전체 삭제 실패: ${store}`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * 데이터 내보내기 (JSON 형식)
   */
  async export(): Promise<Blob> {
    await this.init();

    if (!this.db) {
      throw new Error("IndexedDB가 초기화되지 않았습니다");
    }

    const exportData: Record<string, any[]> = {};

    // 모든 Object Store의 데이터 수집
    for (const storeName of Object.values(STORES)) {
      try {
        const data = await this.getAll(storeName);
        exportData[storeName] = data;
      } catch (error) {
        console.warn(`[IndexedDB] 내보내기 실패: ${storeName}`, error);
        exportData[storeName] = [];
      }
    }

    // 메타데이터 추가
    const metadata = {
      version: DB_VERSION,
      exportedAt: new Date().toISOString(),
      storeCount: Object.keys(exportData).length,
    };

    const fullExport = {
      metadata,
      data: exportData,
    };

    // JSON을 Blob으로 변환
    const jsonString = JSON.stringify(fullExport, null, 2);
    return new Blob([jsonString], { type: "application/json" });
  }

  /**
   * 데이터 가져오기
   */
  async import(blob: Blob): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error("IndexedDB가 초기화되지 않았습니다");
    }

    const text = await blob.text();
    const importData = JSON.parse(text);

    if (!importData.data || typeof importData.data !== "object") {
      throw new Error("잘못된 데이터 형식입니다");
    }

    // 각 Object Store에 데이터 가져오기
    for (const [storeName, data] of Object.entries(importData.data)) {
      if (!Object.values(STORES).includes(storeName as StoreName)) {
        console.warn(`[IndexedDB] 알 수 없는 Object Store: ${storeName}`);
        continue;
      }

      if (!Array.isArray(data)) {
        console.warn(`[IndexedDB] 잘못된 데이터 형식: ${storeName}`);
        continue;
      }

      // 트랜잭션으로 배치 저장
      const transaction = this.db.transaction([storeName as StoreName], "readwrite");
      const objectStore = transaction.objectStore(storeName as StoreName);

      for (const item of data) {
        if (item && typeof item === "object" && item.id) {
          objectStore.put(item);
        }
      }

      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => {
          console.log(`[IndexedDB] 가져오기 완료: ${storeName} (${data.length}개)`);
          resolve();
        };
        transaction.onerror = () => {
          console.error(`[IndexedDB] 가져오기 실패: ${storeName}`, transaction.error);
          reject(transaction.error);
        };
      });
    }

    console.log("[IndexedDB] 데이터 가져오기 완료");
  }
}

// 싱글톤 인스턴스
let managerInstance: IndexedDBManagerImpl | null = null;

/**
 * IndexedDB 관리자 인스턴스 가져오기
 */
export function getIndexedDBManager(): IndexedDBManager {
  if (!managerInstance) {
    managerInstance = new IndexedDBManagerImpl();
  }
  return managerInstance;
}

