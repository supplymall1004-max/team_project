/**
 * @file naver.d.ts
 * @description 네이버 지도 API 전역 타입 선언
 *
 * 네이버 지도 API의 Window 인터페이스 확장을 통합 관리합니다.
 * 모든 컴포넌트에서 동일한 타입 선언을 사용하도록 합니다.
 */

// 네이버 지도 API 타입 정의 (export하여 다른 파일에서 사용 가능)
export interface NaverMap {
  setCenter: (center: unknown) => void;
  setZoom: (zoom: number) => void;
  fitBounds?: (bounds: unknown) => void;
}

export interface NaverMarker {
  setMap: (map: unknown) => void;
}

export interface NaverInfoWindow {
  open: (map: unknown, marker: unknown) => void;
  close: () => void;
}

export interface NaverMaps {
  Map: new (element: HTMLElement, options: {
    center: unknown;
    zoom: number;
  }) => NaverMap;
  LatLng: new (lat: number, lng: number) => unknown;
  Marker: new (options: {
    position: unknown;
    map: unknown;
    title?: string;
    icon?: {
      content?: string;
      anchor?: unknown;
      size?: unknown;
      scaledSize?: unknown;
    };
  }) => NaverMarker;
  InfoWindow: new (options: {
    content: string;
    maxWidth?: number;
  }) => NaverInfoWindow;
  Event: {
    addListener: (target: unknown, event: string, handler: () => void) => void;
  };
  LatLngBounds: new () => {
    extend: (latlng: unknown) => void;
  };
  Point: new (x: number, y: number) => unknown;
  Size: new (width: number, height: number) => unknown;
  PointingIcon?: any;
  Position?: any;
}

// 전역 Window 인터페이스 확장
declare global {
  interface Window {
    naver?: {
      maps: NaverMaps;
    };
  }
}

export {};
