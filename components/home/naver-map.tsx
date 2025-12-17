/**
 * @file naver-map.tsx
 * @description 네이버 지도 컴포넌트 - 현재 위치 표시
 *
 * 이 컴포넌트는 네이버 지도 JavaScript API를 사용하여
 * 사용자의 현재 위치를 지도에 표시합니다.
 *
 * 주요 기능:
 * - 네이버 지도 API 동적 로드
 * - 브라우저 Geolocation API를 통한 현재 위치 획득
 * - 현재 위치에 마커 표시
 * - 반응형 디자인 지원
 *
 * @dependencies
 * - 네이버 지도 JavaScript API v3
 * - 브라우저 Geolocation API
 *
 * @see {@link /lib/naver/map-client.ts} - 네이버 지도 클라이언트 설정
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getNaverMapScriptUrl, isNaverMapLoaded } from '@/lib/naver/map-client';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LocationPermissionToggle } from '@/components/location/LocationPermissionToggle';
import { useLocationPreference } from '@/hooks/use-location-preference';

interface LocationState {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface ErrorState {
  message: string;
  code?: number;
}

export function NaverMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);

  const { isLocationEnabled } = useLocationPreference();

  const [isLoading, setIsLoading] = useState(true);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationState | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // 네이버 지도 API 로드
  useEffect(() => {
    console.group('🗺️ 네이버 지도 컴포넌트 초기화');
    console.log('컴포넌트 마운트 시간:', new Date().toISOString());
    
    const loadNaverMap = async () => {
      try {
        // 환경 변수 확인
        const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
        console.log('🔑 Client ID 확인:', clientId ? '설정됨' : '❌ 설정되지 않음');
        
        if (!clientId || clientId.trim() === '') {
          const errorMsg = 'NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 환경변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.';
          console.error('❌', errorMsg);
          setError({
            message: errorMsg,
            code: -4
          });
          setIsLoading(false);
          console.groupEnd();
          return;
        }

        // 이미 로드되어 있는지 확인
        if (isNaverMapLoaded()) {
          console.log('✅ 네이버 지도 API가 이미 로드되어 있습니다');
          console.log('API 객체 확인:', {
            hasNaver: !!(window as any).naver,
            hasMaps: !!(window as any).naver?.maps,
            hasMap: !!(window as any).naver?.maps?.Map,
            hasLatLng: !!(window as any).naver?.maps?.LatLng,
          });
          setIsMapLoaded(true);
          console.groupEnd();
          return;
        }

        // 이미 로드 중인 스크립트가 있는지 확인 (콜백 파라미터 포함)
        const existingScript = document.querySelector(
          'script[src*="oapi.map.naver.com"]'
        ) as HTMLScriptElement;

        if (existingScript) {
          console.log('📦 네이버 지도 API 스크립트가 이미 로드 중입니다');
          console.log('스크립트 URL:', existingScript.src);

          // 기존 스크립트의 로드를 기다림
          let checkCount = 0;
          const maxChecks = 100; // 10초
          const checkInterval = setInterval(() => {
            checkCount++;
            if (isNaverMapLoaded()) {
              console.log('✅ 네이버 지도 API 로드 완료 (기존 스크립트)');
              clearInterval(checkInterval);
              setIsMapLoaded(true);
              console.groupEnd();
            } else if (checkCount >= maxChecks) {
              clearInterval(checkInterval);
              console.error('❌ 네이버 지도 API 로드 타임아웃 (기존 스크립트)');
              setError({
                message: '지도 API 로드가 시간 초과되었습니다. 페이지를 새로고침해주세요.',
                code: -1
              });
              setIsLoading(false);
              console.groupEnd();
            } else {
              console.log(`⏳ API 초기화 대기 중... (${checkCount}/${maxChecks})`);
            }
          }, 100);

          return;
        }

        // 스크립트 URL 생성
        let scriptUrl: string;
        try {
          scriptUrl = getNaverMapScriptUrl();
          console.log('📦 네이버 지도 API 스크립트 로드 시작');
          console.log('스크립트 URL:', scriptUrl);
        } catch (urlError) {
          console.error('❌ 스크립트 URL 생성 실패:', urlError);
          setError({
            message: urlError instanceof Error ? urlError.message : '지도 API 설정에 문제가 있습니다.',
            code: -4
          });
          setIsLoading(false);
          console.groupEnd();
          return;
        }

        // 콜백 함수를 전역에 등록 (NAVER 지도 API에서 호출)
        const callbackName = `naverMapCallback_${Date.now()}`;
        (window as any)[callbackName] = () => {
          console.log('✅ 네이버 지도 API 콜백 호출됨');
          delete (window as any)[callbackName];
          setIsMapLoaded(true);
          console.groupEnd();
        };

        // 콜백 파라미터를 포함한 URL 생성
        const callbackUrl = `${scriptUrl}&callback=${callbackName}`;

        const script = document.createElement('script');
        script.src = callbackUrl;
        script.async = true;
        script.defer = false;
        script.type = 'text/javascript';

        // 타임아웃 설정 (15초)
        const timeoutId = setTimeout(() => {
          console.error('❌ 네이버 지도 API 로드 타임아웃 (15초)');
          script.remove();
          delete (window as any)[callbackName];
          const currentUrl = typeof window !== 'undefined' ? window.location.origin : '알 수 없음';
          setError({
            message: `지도 API 로드가 시간 초과되었습니다. 다음을 확인해주세요:\n1. 네이버 클라우드 플랫폼에서 현재 URL(${currentUrl})이 등록되어 있는지\n2. 네트워크 연결 상태\n3. 브라우저 콘솔의 에러 메시지`,
            code: -1
          });
          setIsLoading(false);
          console.groupEnd();
        }, 15000);

        script.onload = () => {
          console.log('✅ 네이버 지도 스크립트 파일 로드 완료');
          // 콜백 방식에서는 onload만으로는 충분하지 않음 (실제 API 초기화는 콜백에서)
        };

        script.onerror = (error) => {
          clearTimeout(timeoutId);
          console.error('❌ 네이버 지도 API 스크립트 로드 실패');
          console.error('에러 객체:', error);
          delete (window as any)[callbackName];

          const currentUrl = typeof window !== 'undefined' ? window.location.origin : '알 수 없음';
          setError({
            message: `지도 API를 로드할 수 없습니다.\n\n가능한 원인:\n1. 네이버 클라우드 플랫폼에서 현재 URL(${currentUrl})이 등록되지 않았습니다\n2. Client ID가 잘못되었습니다\n3. 네트워크 연결 문제`,
            code: -1
          });
          setIsLoading(false);
          console.groupEnd();
        };

        document.head.appendChild(script);
        console.log('📝 스크립트 태그를 head에 추가했습니다');
      } catch (err) {
        console.error('❌ 네이버 지도 API 설정 오류:', err);
        setError({
          message: err instanceof Error ? err.message : '지도 설정에 문제가 있습니다.',
          code: -2
        });
        setIsLoading(false);
        console.groupEnd();
      }
    };

    loadNaverMap();
  }, []);

  // 지도 초기화 함수 (위치 정보를 기다리지 않고 먼저 지도 표시)
  const initializeMap = useCallback(() => {
    if (!mapRef.current) {
      console.log('⚠️ 지도 컨테이너가 준비되지 않음');
      return;
    }

    if (!isNaverMapLoaded()) {
      console.log('⚠️ 네이버 지도 API가 아직 로드되지 않음');
      return;
    }

    // 기존 지도 인스턴스가 있으면 제거
    if (mapInstanceRef.current) {
      console.log('🗑️ 기존 지도 인스턴스 제거');
      mapInstanceRef.current = null;
    }

    try {
      const { naver } = window as any;

      // 네이버 지도 API 객체가 완전히 준비되었는지 확인
      if (!naver || !naver.maps || !naver.maps.Map || !naver.maps.LatLng) {
        console.error('❌ 네이버 지도 API 객체가 완전히 초기화되지 않았습니다');
        setError({
          message: '지도 API가 완전히 로드되지 않았습니다. 잠시 후 다시 시도해주세요.',
          code: -3
        });
        setIsLoading(false);
        return;
      }

      // 기본 위치 설정 (서울 시청)
      const defaultLat = 37.5665;
      const defaultLng = 126.9780;

      const center = currentLocation
        ? new naver.maps.LatLng(currentLocation.latitude, currentLocation.longitude)
        : new naver.maps.LatLng(defaultLat, defaultLng);

      console.log('📍 지도 중심 좌표:', center);

      // 지도 옵션 (공식 문서 참고)
      const mapOptions = {
        center,
        zoom: currentLocation ? 15 : 10, // 현재 위치가 있으면 더 확대
        zoomControl: true,
        zoomControlOptions: {
          position: naver.maps.Position.TOP_RIGHT
        },
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: naver.maps.MapTypeControlStyle.BUTTON,
          position: naver.maps.Position.TOP_RIGHT
        }
      };

      // 지도 생성 (공식 문서: new naver.maps.Map(container, options))
      const map = new naver.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;
      
      console.log('✅ 지도 인스턴스 생성 완료');

      // 기존 마커 제거
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }

      // 현재 위치가 있으면 마커 표시
      if (currentLocation) {
        console.log('📍 현재 위치 마커 표시');
        try {
          const marker = new naver.maps.Marker({
            position: center,
            map,
            title: '현재 위치',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" fill="white"/>
                </svg>
              `),
              size: new naver.maps.Size(24, 24),
              anchor: new naver.maps.Point(12, 12)
            }
          });
          markerRef.current = marker;

          // 정보 창 추가
          const infoWindow = new naver.maps.InfoWindow({
            content: `
              <div style="padding: 8px; font-size: 12px; color: #333;">
                <strong>현재 위치</strong><br/>
                위도: ${currentLocation.latitude.toFixed(6)}<br/>
                경도: ${currentLocation.longitude.toFixed(6)}
                ${currentLocation.accuracy ? `<br/>정확도: ±${Math.round(currentLocation.accuracy)}m` : ''}
              </div>
            `,
            borderWidth: 0,
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          });
          infoWindowRef.current = infoWindow;

          naver.maps.Event.addListener(marker, 'click', () => {
            if (infoWindow.getMap()) {
              infoWindow.close();
            } else {
              infoWindow.open(map, marker);
            }
          });
          
          console.log('✅ 마커 및 정보창 생성 완료');
        } catch (markerError) {
          console.error('❌ 마커 생성 오류:', markerError);
          // 마커 생성 실패해도 지도는 표시
        }
      } else {
        console.log('📍 현재 위치 정보가 없어 기본 위치(서울 시청)로 지도 표시');
      }

      console.log('✅ 지도 초기화 완료');
      setIsLoading(false);
      setDebugInfo('지도가 성공적으로 로드되었습니다.');

    } catch (err) {
      console.error('❌ 지도 초기화 오류:', err);
      console.error('에러 상세:', {
        error: err,
        message: err instanceof Error ? err.message : '알 수 없는 오류',
        stack: err instanceof Error ? err.stack : undefined,
      });
      setError({
        message: `지도를 표시할 수 없습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
        code: -3
      });
      setIsLoading(false);
      setDebugInfo(`오류 발생: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
  }, []);

  // 지도 초기화 및 현재 위치 표시
  useEffect(() => {
    if (!isMapLoaded) {
      console.log('⏳ 지도 API 로드 대기 중...');
      return;
    }

    if (!mapRef.current) {
      console.log('⏳ 지도 컨테이너 DOM 대기 중...');
      // DOM이 준비될 때까지 잠시 대기
      const checkDom = setInterval(() => {
        if (mapRef.current) {
          clearInterval(checkDom);
          console.log('✅ 지도 컨테이너 DOM 준비 완료');
          initializeMap();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkDom);
        if (!mapRef.current) {
          console.error('❌ 지도 컨테이너 DOM 준비 타임아웃');
          setError({
            message: '지도 컨테이너를 찾을 수 없습니다.',
            code: -5
          });
          setIsLoading(false);
        }
      }, 5000);
      return;
    }

    console.group('🗺️ 네이버 지도 초기화 시작');
    console.log('지도 API 로드 상태:', isMapLoaded);
    console.log('지도 컨테이너:', mapRef.current);
    console.log('현재 위치:', currentLocation);
    initializeMap();
    console.groupEnd();
  }, [isMapLoaded, currentLocation, initializeMap]);

  // 현재 위치 가져오기
  const getCurrentLocation = useCallback(() => {
    console.log('📍 현재 위치 요청 시작');
    setIsGettingLocation(true);
    setError(null);

    if (!isLocationEnabled) {
      console.warn('⚠️ 위치 사용 토글이 OFF 상태입니다. 위치 요청을 중단합니다.');
      setError({
        message: '현재 위치를 사용하려면 먼저 "위치 사용"을 켜주세요.',
        code: 10
      });
      setIsGettingLocation(false);
      return;
    }

    if (!navigator.geolocation) {
      console.error('❌ 브라우저가 위치 정보를 지원하지 않습니다');
      setError({
        message: '이 브라우저는 위치 정보를 지원하지 않습니다.',
        code: 1
      });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ 위치 정보 획득 성공:', position.coords);
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        setCurrentLocation(location);
        setIsGettingLocation(false);
      },
      (err) => {
        console.error('❌ 위치 정보 획득 실패:', err);
        let message = '위치 정보를 가져올 수 없습니다.';

        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = '위치 정보 접근 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
            break;
          case err.POSITION_UNAVAILABLE:
            message = '위치 정보를 사용할 수 없습니다. GPS 신호를 확인해주세요.';
            break;
          case err.TIMEOUT:
            message = '위치 정보 요청이 시간 초과되었습니다. 다시 시도해주세요.';
            break;
        }

        setError({
          message,
          code: err.code
        });
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5분간 캐시된 위치 정보 사용
      }
    );
  }, [isLocationEnabled]);

  return (
    <div className="w-full space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">현재 위치</h3>
        </div>

        <Button
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          {isGettingLocation ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isGettingLocation ? '위치 찾는 중...' : '위치 새로고침'}
        </Button>
      </div>

      {/* 위치 사용 토글 (홈) */}
      <LocationPermissionToggle
        onEnableRequest={async () => {
          console.group('📍 [home] 위치 사용 ON → 권한 요청 트리거');
          console.log('time:', new Date().toISOString());
          console.groupEnd();
          getCurrentLocation();
        }}
      />

      {/* 지도 컨테이너 */}
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden"
          style={{ minHeight: '256px' }}
        />

        {/* 로딩 오버레이 */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>지도를 불러오는 중...</span>
            </div>
          </div>
        )}

        {/* 위치 정보 표시 */}
        {currentLocation && !isLoading && (
          <div className="absolute top-2 left-2 bg-white px-3 py-2 rounded-md shadow-md text-sm">
            <div className="flex items-center gap-1 text-green-600 font-medium">
              <MapPin className="w-4 h-4" />
              위치 확인됨
            </div>
            <div className="text-gray-600 mt-1">
              {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
            </div>
          </div>
        )}
      </div>

      {/* 오류 메시지 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* 도움말 */}
      <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md">
        💡 <strong>팁:</strong> 정확한 위치 정보를 위해 GPS를 켜주세요.
        위치 권한이 거부되었을 경우 브라우저 설정에서 허용할 수 있습니다.
      </div>

      {/* 디버그 정보 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
          <strong>디버그:</strong> {debugInfo}
        </div>
      )}
    </div>
  );
}