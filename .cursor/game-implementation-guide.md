# Sunrise Village 게임 구현 가이드

> **목표**: Unity WebGL 기반 Sunrise Village 게임을 Next.js 15 + React 19로 구현  
> **참고**: [게임 분석 문서](./game-analysis.md)

---

## 📋 구현 개요

### 기술 스택
- **프론트엔드**: Next.js 15.5.6 + React 19
- **게임 엔진**: Unity WebGL (기존 빌드 활용 또는 재구현)
- **상태 관리**: Zustand 또는 Jotai
- **데이터베이스**: Supabase (게임 진행 상황 저장)
- **인증**: Clerk (기존 프로젝트와 통합)
- **스타일링**: Tailwind CSS v4

---

## 🏗️ 프로젝트 구조

```
team_project/
├── app/
│   └── game/
│       └── page.tsx              # 게임 메인 페이지
├── components/
│   └── game/
│       ├── unity-loader.tsx      # Unity WebGL 로더
│       ├── game-hud.tsx          # 게임 HUD 오버레이
│       ├── loading-screen.tsx    # 로딩 화면
│       └── game-ui-overlay.tsx   # 게임 UI 오버레이
├── lib/
│   └── game/
│       ├── unity-bridge.ts       # Unity-React 브릿지
│       ├── api/
│       │   ├── account.ts        # 계정 API
│       │   ├── village.ts        # 빌리지 API
│       │   ├── socket.ts         # WebSocket 관리
│       │   └── tracking.ts       # 추적 API
│       ├── asset-bundle-loader.ts # Asset Bundle 로더
│       └── game-state.ts         # 게임 상태 관리
├── public/
│   └── game/
│       └── unity-build/          # Unity WebGL 빌드 파일
└── types/
    └── game/
        ├── village.ts            # 빌리지 타입
        ├── resources.ts          # 리소스 타입
        └── api.ts                # API 타입
```

---

## 🔧 Phase 1: 기본 인프라 구축

### 1.1 Unity WebGL 통합

#### Unity 빌드 파일 배치
```bash
# Unity WebGL 빌드를 public/game/unity-build/ 에 배치
public/game/unity-build/
├── Build/
│   ├── *.loader.js
│   ├── *.framework.js
│   ├── *.wasm
│   └── *.data
├── TemplateData/
└── index.html (참고용)
```

#### Unity 로더 컴포넌트
```typescript
// components/game/unity-loader.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

interface UnityInstance {
  SetFullscreen: (fullscreen: number) => void;
  SendMessage: (gameObject: string, method: string, value?: string) => void;
  Quit: () => Promise<void>;
}

export function UnityLoader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const unityInstanceRef = useRef<UnityInstance | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Unity WebGL 로드
    const loadUnity = async () => {
      try {
        // Unity 로더 스크립트 동적 로드
        const script = document.createElement('script');
        script.src = '/game/unity-build/Build/[BUILD_HASH].loader.js';
        script.onload = () => {
          // Unity 인스턴스 생성
          // @ts-ignore
          window.createUnityInstance(canvasRef.current, {
            dataUrl: '/game/unity-build/Build/[DATA_HASH].data',
            frameworkUrl: '/game/unity-build/Build/[FRAMEWORK_HASH].framework.js',
            codeUrl: '/game/unity-build/Build/[CODE_HASH].wasm',
            streamingAssetsUrl: 'StreamingAssets',
            companyName: 'YourCompany',
            productName: 'Sunrise Village',
            productVersion: '1.0.0',
          }, (progress: number) => {
            setProgress(progress);
          }).then((instance: UnityInstance) => {
            unityInstanceRef.current = instance;
            setLoading(false);
          });
        };
        document.body.appendChild(script);
      } catch (error) {
        console.error('Unity 로드 실패:', error);
      }
    };

    loadUnity();

    return () => {
      // 정리
      if (unityInstanceRef.current) {
        unityInstanceRef.current.Quit();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <div className="text-white mb-4">로딩 중... {Math.round(progress * 100)}%</div>
            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
```

### 1.2 Unity-React 브릿지

```typescript
// lib/game/unity-bridge.ts
export class UnityBridge {
  private unityInstance: any;
  private messageQueue: Array<{ method: string; data: any }> = [];

  constructor(unityInstance: any) {
    this.unityInstance = unityInstance;
    this.setupMessageListener();
  }

  // Unity → React 메시지 수신
  private setupMessageListener() {
    // Unity에서 JavaScript 함수 호출 시 처리
    // @ts-ignore
    window.ReceiveMessageFromUnity = (method: string, data: string) => {
      this.handleUnityMessage(method, JSON.parse(data));
    };
  }

  // React → Unity 메시지 전송
  sendToUnity(gameObject: string, method: string, data?: any) {
    if (!this.unityInstance) {
      this.messageQueue.push({ method, data });
      return;
    }

    const message = data ? JSON.stringify(data) : '';
    this.unityInstance.SendMessage(gameObject, method, message);
  }

  private handleUnityMessage(method: string, data: any) {
    // Unity 메시지 처리 로직
    console.log('Unity 메시지 수신:', method, data);
  }

  // 큐에 쌓인 메시지 전송
  flushMessageQueue() {
    this.messageQueue.forEach(({ method, data }) => {
      this.sendToUnity('GameManager', method, data);
    });
    this.messageQueue = [];
  }
}
```

### 1.3 API 클라이언트 구현

```typescript
// lib/game/api/account.ts
const API_BASE = process.env.NEXT_PUBLIC_GAME_API_BASE || 'https://un0.sunrisevillagegame.com';

export async function startGamePlay() {
  const response = await fetch(`${API_BASE}/core/api/account/play`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('게임 플레이 시작 실패');
  }

  return response.json();
}
```

```typescript
// lib/game/api/gameplay.ts
const VILLAGE_API_BASE = process.env.NEXT_PUBLIC_VILLAGE_API_BASE || 'https://un1.sunrisevillagegame.com';

export interface GameAction {
  type: string;
  zoneId?: string;
  buildingId?: string;
  position?: { x: number; y: number };
  data?: Record<string, any>;
}

export async function executeGameAction(action: GameAction) {
  const response = await fetch(`${VILLAGE_API_BASE}/village/zone/action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(action),
  });

  if (!response.ok) {
    throw new Error('게임 액션 실행 실패');
  }

  return response.json();
}

export async function collectPendingActions() {
  const response = await fetch(`${VILLAGE_API_BASE}/village/pendingActions/collect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('완료된 액션 수집 실패');
  }

  return response.json();
}
```

```typescript
// lib/game/api/shop.ts
const VILLAGE_API_BASE = process.env.NEXT_PUBLIC_VILLAGE_API_BASE || 'https://un1.sunrisevillagegame.com';

export async function getShopOffers() {
  const response = await fetch(`${VILLAGE_API_BASE}/village/shop/getShopOffers`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('상점 오퍼 조회 실패');
  }

  return response.json();
}

export async function getPaymentProducts() {
  const response = await fetch(`${VILLAGE_API_BASE}/core/api/payment/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('결제 상품 조회 실패');
  }

  return response.json();
}
```

```typescript
// lib/game/api/village.ts
const VILLAGE_API_BASE = process.env.NEXT_PUBLIC_VILLAGE_API_BASE || 'https://un1.sunrisevillagegame.com';

export async function getInitialData() {
  const response = await fetch(`${VILLAGE_API_BASE}/village/getInitialData`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('초기 데이터 로드 실패');
  }

  return response.json();
}

export async function getBalancingData() {
  const response = await fetch(`${VILLAGE_API_BASE}/village/gameDesign/getBalancingData`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('밸런싱 데이터 로드 실패');
  }

  return response.json();
}
```

```typescript
// lib/game/api/socket.ts
// STOMP 프로토콜 사용 (WebSocket 기반)
import { Client, IMessage } from '@stomp/stompjs';

export class GameSocket {
  private client: Client | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 먼저 로그인
      this.login().then(() => {
        // STOMP 클라이언트 생성
        this.client = new Client({
          brokerURL: 'wss://un1-chat.sunrisevillagegame.com/ws/stomp',
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          onConnect: () => {
            console.log('STOMP WebSocket 연결 성공');
            this.reconnectAttempts = 0;
            resolve();
          },
          onStompError: (frame) => {
            console.error('STOMP 에러:', frame);
            reject(new Error(frame.headers['message'] || 'STOMP 연결 실패'));
          },
          onWebSocketError: (error) => {
            console.error('WebSocket 에러:', error);
            reject(error);
          },
          onDisconnect: () => {
            console.log('WebSocket 연결 종료');
            this.attemptReconnect();
          },
        });

        this.client.activate();
      }).catch(reject);
    });
  }

  private async login(): Promise<void> {
    const response = await fetch('https://un1.sunrisevillagegame.com/village/socketserver/login', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('소켓 서버 로그인 실패');
    }
  }

  subscribe(destination: string, callback: (message: IMessage) => void) {
    if (this.client?.connected) {
      return this.client.subscribe(destination, callback);
    }
    return null;
  }

  send(destination: string, body: any) {
    if (this.client?.connected) {
      this.client.publish({ destination, body: JSON.stringify(body) });
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect();
      }, 1000 * this.reconnectAttempts);
    }
  }

  disconnect() {
    this.client?.deactivate();
  }
}
```

---

## 🎮 Phase 2: 게임 로딩 시스템

### 2.1 Asset Bundle 로더

```typescript
// lib/game/asset-bundle-loader.ts
export class AssetBundleLoader {
  private cache: Map<string, any> = new Map();
  private cdnBase = 'https://vilun.innogamescdn.com/bundles/WebGL';

  async loadBundle(bundleName: string): Promise<any> {
    // 캐시 확인
    if (this.cache.has(bundleName)) {
      return this.cache.get(bundleName);
    }

    // IndexedDB 캐시 확인
    const cached = await this.getFromIndexedDB(bundleName);
    if (cached) {
      this.cache.set(bundleName, cached);
      return cached;
    }

    // 네트워크에서 로드
    const bundle = await this.loadFromNetwork(bundleName);
    
    // 캐시 저장
    this.cache.set(bundleName, bundle);
    await this.saveToIndexedDB(bundleName, bundle);

    return bundle;
  }

  private async loadFromNetwork(bundleName: string): Promise<any> {
    const url = `${this.cdnBase}/${bundleName}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`번들 로드 실패: ${bundleName}`);
    }

    // Unity Asset Bundle 로드 로직
    // (Unity WebGL API 사용)
    return response;
  }

  private async getFromIndexedDB(key: string): Promise<any> {
    // IndexedDB에서 읽기
    // 구현 필요
    return null;
  }

  private async saveToIndexedDB(key: string, data: any): Promise<void> {
    // IndexedDB에 저장
    // 구현 필요
  }
}
```

### 2.2 로딩 화면 컴포넌트

```typescript
// components/game/loading-screen.tsx
'use client';

interface LoadingScreenProps {
  progress: number;
  hint?: string;
}

export function LoadingScreen({ progress, hint }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-blue-900 to-blue-600 flex items-center justify-center z-50">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-8">Sunrise Village</h1>
        <div className="w-96 h-4 bg-white/20 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-yellow-400 transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="text-lg mb-2">{Math.round(progress * 100)}%</p>
        {hint && (
          <p className="text-sm text-white/80 mt-4">{hint}</p>
        )}
      </div>
    </div>
  );
}
```

---

## 🏘️ Phase 3: 게임 월드 구현

### 3.1 게임 상태 관리

```typescript
// lib/game/game-state.ts
import { create } from 'zustand';

interface VillageState {
  buildings: Building[];
  resources: Resources;
  level: number;
  experience: number;
}

interface GameState {
  village: VillageState | null;
  loading: boolean;
  error: string | null;
  setVillage: (village: VillageState) => void;
  updateResources: (resources: Partial<Resources>) => void;
  addBuilding: (building: Building) => void;
}

export const useGameStore = create<GameState>((set) => ({
  village: null,
  loading: false,
  error: null,
  setVillage: (village) => set({ village }),
  updateResources: (resources) => set((state) => ({
    village: state.village ? {
      ...state.village,
      resources: { ...state.village.resources, ...resources }
    } : null
  })),
  addBuilding: (building) => set((state) => ({
    village: state.village ? {
      ...state.village,
      buildings: [...state.village.buildings, building]
    } : null
  })),
}));
```

### 3.2 게임 HUD 컴포넌트

```typescript
// components/game/game-hud.tsx
'use client';

import { useGameStore } from '@/lib/game/game-state';

export function GameHUD() {
  const { village } = useGameStore();

  if (!village) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-10 pointer-events-none">
      <div className="flex justify-between items-start">
        {/* 리소스 표시 */}
        <div className="bg-black/50 rounded-lg p-4 pointer-events-auto">
          <div className="flex gap-4">
            <ResourceDisplay name="골드" value={village.resources.gold} />
            <ResourceDisplay name="나무" value={village.resources.wood} />
            <ResourceDisplay name="돌" value={village.resources.stone} />
          </div>
        </div>

        {/* 레벨 및 경험치 */}
        <div className="bg-black/50 rounded-lg p-4 pointer-events-auto">
          <div className="text-white">
            <div>레벨 {village.level}</div>
            <div className="w-32 h-2 bg-gray-700 rounded-full mt-2">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${(village.experience / getNextLevelXP(village.level)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceDisplay({ name, value }: { name: string; value: number }) {
  return (
    <div className="text-white">
      <div className="text-sm text-gray-300">{name}</div>
      <div className="text-lg font-bold">{value.toLocaleString()}</div>
    </div>
  );
}

function getNextLevelXP(level: number): number {
  // 레벨업 필요 경험치 계산
  return level * 100;
}
```

---

## 🌐 Phase 4: 고급 기능

### 4.1 다국어 지원

```typescript
// lib/game/i18n.ts
import { useLocale } from '@/hooks/use-locale';

const translations = {
  ko: {
    loading: '로딩 중...',
    gold: '골드',
    wood: '나무',
    stone: '돌',
  },
  en: {
    loading: 'Loading...',
    gold: 'Gold',
    wood: 'Wood',
    stone: 'Stone',
  },
};

export function useGameTranslation() {
  const locale = useLocale();
  const t = (key: string) => {
    return translations[locale as keyof typeof translations]?.[key as keyof typeof translations['ko']] || key;
  };
  return { t };
}
```

### 4.2 에러 추적 (Sentry 통합)

```typescript
// lib/game/error-tracking.ts
import * as Sentry from '@sentry/nextjs';

export function trackGameError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    tags: {
      component: 'game',
    },
    extra: context,
  });
}

export function trackGameEvent(event: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    category: 'game',
    message: event,
    level: 'info',
    data,
  });
}
```

### 4.3 게임 액션 추적 시스템

```typescript
// lib/game/tracking.ts
const VILLAGE_API_BASE = process.env.NEXT_PUBLIC_VILLAGE_API_BASE || 'https://un1.sunrisevillagegame.com';

export interface TrackingEvent {
  event: string;
  data?: Record<string, any>;
  timestamp?: number;
}

export async function trackGameEvent(event: TrackingEvent) {
  try {
    await fetch(`${VILLAGE_API_BASE}/village/tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        ...event,
        timestamp: event.timestamp || Date.now(),
      }),
    });
  } catch (error) {
    console.error('추적 이벤트 전송 실패:', error);
  }
}

// 주요 게임 이벤트 추적 헬퍼
export const trackGameActions = {
  uiClick: (element: string) => trackGameEvent({ event: 'ui_click', data: { element } }),
  objectInteraction: (objectId: string, action: string) => 
    trackGameEvent({ event: 'object_interaction', data: { objectId, action } }),
  harvest: (resourceType: string) => 
    trackGameEvent({ event: 'harvest', data: { resourceType } }),
  levelUp: (level: number) => 
    trackGameEvent({ event: 'level_up', data: { level } }),
  resourceGained: (resourceType: string, amount: number) => 
    trackGameEvent({ event: 'resource_gained', data: { resourceType, amount } }),
  shopPurchase: (itemId: string, price: number) => 
    trackGameEvent({ event: 'shop_purchase', data: { itemId, price } }),
  panelOpen: (panelType: string) => 
    trackGameEvent({ event: 'panel_open', data: { panelType } }),
  panelClose: (panelType: string) => 
    trackGameEvent({ event: 'panel_close', data: { panelType } }),
};
```

---

## 📊 데이터베이스 스키마 (Supabase)

```sql
-- 게임 진행 상황 저장
CREATE TABLE game_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  village_data JSONB NOT NULL,
  resources JSONB NOT NULL,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 빌딩 정보
CREATE TABLE game_buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  building_type TEXT NOT NULL,
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🚀 배포 고려사항

### 환경 변수
```env
NEXT_PUBLIC_GAME_API_BASE=https://un0.sunrisevillagegame.com
NEXT_PUBLIC_VILLAGE_API_BASE=https://un1.sunrisevillagegame.com
NEXT_PUBLIC_GAME_CDN=https://vilun.innogamescdn.com
```

### 성능 최적화
- Unity 빌드 파일 CDN 배포
- Asset Bundle 지연 로딩
- IndexedDB 캐싱 활용
- 이미지 최적화 (WebP)

### 보안
- API 키 환경 변수 관리
- CORS 설정
- 사용자 인증 통합 (Clerk)

---

## 📝 다음 단계

1. Unity WebGL 빌드 파일 준비
2. 기본 인프라 구현 (Phase 1)
3. 게임 로딩 시스템 구현 (Phase 2)
4. 게임 월드 기본 구현 (Phase 3)
5. 고급 기능 추가 (Phase 4)
6. 테스트 및 최적화

---

**참고**: 실제 구현 시 Unity WebGL API 문서 및 게임 분석 문서를 참고하여 세부 사항을 조정해야 합니다.

