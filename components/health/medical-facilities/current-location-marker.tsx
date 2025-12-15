'use client';

import { useEffect, useRef } from 'react';

interface Coordinates {
  lat: number;
  lng: number;
}

interface CurrentLocationMarkerProps {
  map: any;
  position: Coordinates;
}

export const CurrentLocationMarker: React.FC<CurrentLocationMarkerProps> = ({
  map,
  position,
}) => {
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !window.naver?.maps) return;

    // 현재 위치 마커 생성
    const marker = new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(position.lat, position.lng),
      map: map,
      icon: {
        content: `
          <div style="
            width: 20px;
            height: 20px;
            background: #4285f4;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            position: relative;
          ">
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              width: 30px;
              height: 30px;
              border: 2px solid #4285f4;
              border-radius: 50%;
              transform: translate(-50%, -50%);
              animation: pulse 2s infinite;
            "></div>
          </div>
          <style>
            @keyframes pulse {
              0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
              100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
            }
          </style>
        `,
        size: new window.naver.maps.Size(20, 20),
        anchor: new window.naver.maps.Point(10, 10),
      },
    });

    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [map, position]);

  // 위치 업데이트
  useEffect(() => {
    if (markerRef.current && window.naver?.maps) {
      const newPosition = new window.naver.maps.LatLng(position.lat, position.lng);
      markerRef.current.setPosition(newPosition);
    }
  }, [position]);

  return null;
};