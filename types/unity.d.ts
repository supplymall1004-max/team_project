/**
 * @file types/unity.d.ts
 * @description Unity WebGL 타입 선언
 */

interface UnityInstance {
  SetFullscreen: (fullscreen: number) => void;
  SendMessage: (gameObject: string, method: string, value?: string) => void;
  Quit: () => Promise<void>;
  Module?: {
    canvas: HTMLCanvasElement;
  };
}

interface UnityConfig {
  dataUrl: string;
  frameworkUrl: string;
  codeUrl: string;
  streamingAssetsUrl?: string;
  companyName?: string;
  productName?: string;
  productVersion?: string;
}

declare global {
  interface Window {
    createUnityInstance?: (canvas: HTMLCanvasElement, config: UnityConfig) => Promise<UnityInstance>;
  }
}

export {};

