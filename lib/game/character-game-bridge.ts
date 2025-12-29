/**
 * @file lib/game/character-game-bridge.ts
 * @description Unity-React 브릿지 시스템
 *
 * Unity WebGL 게임과 React 애플리케이션 간의 통신을 관리합니다.
 * Unity에서 발생하는 이벤트를 React로 전달하고,
 * React에서 Unity로 명령을 전송합니다.
 *
 * @dependencies
 * - Unity WebGL 게임 인스턴스
 */

/**
 * Unity 인스턴스 타입 (Unity WebGL)
 */
export interface UnityInstance {
  SetFullscreen: (fullscreen: number) => void;
  SendMessage: (gameObject: string, method: string, value?: string) => void;
  Quit: () => Promise<void>;
}

/**
 * Unity-React 브릿지 클래스
 */
export class CharacterGameBridge {
  private unityInstance: UnityInstance | null = null;
  private messageQueue: Array<{ method: string; data: any }> = [];
  private eventListeners: Map<string, Array<(data: any) => void>> = new Map();

  /**
   * Unity 인스턴스 설정
   */
  setUnityInstance(instance: UnityInstance): void {
    console.group("[CharacterGameBridge] Unity 인스턴스 설정");
    this.unityInstance = instance;
    this.setupMessageListener();
    this.flushMessageQueue();
    console.log("✅ Unity 인스턴스 설정 완료");
    console.groupEnd();
  }

  /**
   * Unity 메시지 리스너 설정
   */
  private setupMessageListener(): void {
    // Unity에서 JavaScript 함수 호출 시 처리
    // @ts-expect-error - Unity에서 동적으로 주입되는 전역 함수
    window.ReceiveMessageFromUnity = (method: string, data: string) => {
      this.handleUnityMessage(method, data ? JSON.parse(data) : null);
    };
  }

  /**
   * Unity 메시지 처리
   */
  private handleUnityMessage(method: string, data: any): void {
    console.group("[CharacterGameBridge] Unity 메시지 수신");
    console.log("method:", method);
    console.log("data:", data);

    const listeners = this.eventListeners.get(method);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`❌ 이벤트 리스너 오류 (${method}):`, error);
        }
      });
    }

    console.groupEnd();
  }

  /**
   * React → Unity 메시지 전송
   */
  sendToUnity(gameObject: string, method: string, data?: any): void {
    if (!this.unityInstance) {
      console.warn("⚠️ Unity 인스턴스가 없습니다. 메시지를 큐에 추가합니다.");
      this.messageQueue.push({ method, data });
      return;
    }

    try {
      const message = data ? JSON.stringify(data) : "";
      this.unityInstance.SendMessage(gameObject, method, message);
      console.log(`[CharacterGameBridge] Unity로 메시지 전송: ${gameObject}.${method}`, data);
    } catch (error) {
      console.error("❌ Unity 메시지 전송 실패:", error);
    }
  }

  /**
   * 큐에 쌓인 메시지 전송
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    console.log(`[CharacterGameBridge] 큐에 쌓인 메시지 ${this.messageQueue.length}개 전송`);
    this.messageQueue.forEach(({ method, data }) => {
      this.sendToUnity("GameManager", method, data);
    });
    this.messageQueue = [];
  }

  /**
   * Unity 이벤트 리스너 등록
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Unity 이벤트 리스너 제거
   */
  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 캐릭터 이동 명령 전송
   */
  moveCharacter(familyMemberId: string, targetPosition: { x: number; y: number; z: number }): void {
    this.sendToUnity("CharacterController", "MoveTo", {
      characterId: familyMemberId,
      targetPosition,
    });
  }

  /**
   * 캐릭터 대화 시작
   */
  startDialogue(familyMemberId: string, message: string): void {
    this.sendToUnity("DialogueSystem", "ShowDialogue", {
      characterId: familyMemberId,
      message,
    });
  }

  /**
   * 게임 이벤트 발생 알림
   */
  triggerGameEvent(eventType: string, eventData: any): void {
    this.sendToUnity("GameEventManager", "TriggerEvent", {
      eventType,
      eventData,
    });
  }

  /**
   * 캐릭터 위치 업데이트
   */
  updateCharacterPosition(familyMemberId: string, position: { x: number; y: number; z: number }): void {
    this.sendToUnity("CharacterController", "UpdatePosition", {
      characterId: familyMemberId,
      position,
    });
  }

  /**
   * 정리
   */
  cleanup(): void {
    this.unityInstance = null;
    this.messageQueue = [];
    this.eventListeners.clear();
    // @ts-expect-error - Unity 인스턴스 정리
    delete window.ReceiveMessageFromUnity;
  }
}

/**
 * 전역 브릿지 인스턴스 (싱글톤)
 */
let bridgeInstance: CharacterGameBridge | null = null;

/**
 * 브릿지 인스턴스 가져오기
 */
export function getCharacterGameBridge(): CharacterGameBridge {
  if (!bridgeInstance) {
    bridgeInstance = new CharacterGameBridge();
  }
  return bridgeInstance;
}

