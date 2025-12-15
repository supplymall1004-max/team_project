'use client';

import { useEffect, useRef } from 'react';

interface Coordinates {
  lat: number;
  lng: number;
}

interface RadiusCircleProps {
  map: any;
  center: Coordinates;
  radius: number; // 미터 단위
}

export const RadiusCircle: React.FC<RadiusCircleProps> = ({
  map,
  center,
  radius,
}) => {
  const circleRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !window.naver?.maps) return;

    // 반경 원 생성
    const circle = new window.naver.maps.Circle({
      map: map,
      center: new window.naver.maps.LatLng(center.lat, center.lng),
      radius: radius,
      fillColor: 'rgba(66, 133, 244, 0.1)',
      fillOpacity: 0.1,
      strokeColor: '#4285f4',
      strokeOpacity: 0.3,
      strokeWeight: 2,
      strokeStyle: 'solid',
    });

    circleRef.current = circle;

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
      }
    };
  }, [map, center, radius]);

  // 중심점 또는 반경 업데이트
  useEffect(() => {
    if (circleRef.current && window.naver?.maps) {
      const newCenter = new window.naver.maps.LatLng(center.lat, center.lng);
      circleRef.current.setCenter(newCenter);
      circleRef.current.setRadius(radius);
    }
  }, [center, radius]);

  return null;
};