'use client';

import { useEffect, useRef } from 'react';
import type { MedicalFacility } from '@/types/medical-facility';
import { CATEGORY_ICONS } from '@/types/medical-facility';

interface Coordinates {
  lat: number;
  lng: number;
}

interface MapMarkerProps {
  map: any;
  facility: MedicalFacility;
  onClick?: (facility: MedicalFacility) => void;
}

export const MapMarker: React.FC<MapMarkerProps> = ({
  map,
  facility,
  onClick,
}) => {
  const markerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);

  // 마커 아이콘 생성
  const createMarkerIcon = (facility: MedicalFacility) => {
    const isOpen24Hours = facility.operatingHours?.is24Hours;
    const isCurrentlyOpen = facility.operatingHours?.todayStatus === 'open';

    // 아이콘 색상 결정
    let iconColor = '#6b7280'; // 기본: 회색
    if (isOpen24Hours) {
      iconColor = '#10b981'; // 24시간: 초록색
    } else if (isCurrentlyOpen) {
      iconColor = '#3b82f6'; // 영업 중: 파란색
    } else {
      iconColor = '#ef4444'; // 영업 종료: 빨간색
    }

    // 카테고리별 아이콘
    const iconName = CATEGORY_ICONS[facility.category];

    return {
      content: `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: white;
          border: 2px solid ${iconColor};
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          <div style="
            font-size: 16px;
            color: ${iconColor};
            font-weight: bold;
          ">
            ${iconName === 'Hospital' ? '🏥' :
              iconName === 'Pill' ? '💊' :
              iconName === 'Heart' ? '🐾' : '🏥'}
          </div>
          ${isOpen24Hours ? `
            <div style="
              position: absolute;
              top: -2px;
              right: -2px;
              width: 12px;
              height: 12px;
              background: #10b981;
              border: 2px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              color: white;
              font-weight: bold;
            ">24</div>
          ` : ''}
        </div>
      `,
      size: new window.naver.maps.Size(36, 36),
      anchor: new window.naver.maps.Point(18, 18),
    };
  };

  // 정보창 내용 생성
  const createInfoWindowContent = (facility: MedicalFacility) => {
    const isOpen24Hours = facility.operatingHours?.is24Hours;
    const isCurrentlyOpen = facility.operatingHours?.todayStatus === 'open';
    const todayHours = facility.operatingHours?.todayHours;

    return `
      <div style="
        padding: 12px;
        max-width: 250px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <h3 style="
          font-size: 16px;
          font-weight: bold;
          margin: 0 0 8px 0;
          color: #1f2937;
        ">${facility.name}</h3>

        <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
          ${facility.address}
        </div>

        ${facility.distance ? `
          <div style="font-size: 14px; color: #3b82f6; margin-bottom: 8px;">
            📍 ${facility.distance.toFixed(1)}km
          </div>
        ` : ''}

        ${isOpen24Hours ? `
          <div style="font-size: 14px; color: #10b981; font-weight: bold;">
            🟢 24시간 영업
          </div>
        ` : isCurrentlyOpen ? `
          <div style="font-size: 14px; color: #10b981;">
            🟢 영업 중 ${todayHours ? `(${todayHours})` : ''}
          </div>
        ` : `
          <div style="font-size: 14px; color: #ef4444;">
            🔴 영업 종료 ${todayHours ? `(${todayHours})` : ''}
          </div>
        `}
      </div>
    `;
  };

  useEffect(() => {
    if (!map || !window.naver?.maps) return;

    // 마커 생성
    const marker = new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(facility.latitude, facility.longitude),
      map: map,
      icon: createMarkerIcon(facility),
    });

    // 정보창 생성
    const infoWindow = new window.naver.maps.InfoWindow({
      content: createInfoWindowContent(facility),
      maxWidth: 280,
    });

    // 마커 클릭 이벤트
    const handleClick = () => {
      if (infoWindow.getMap()) {
        infoWindow.close();
      } else {
        infoWindow.open(map, marker);
      }

      if (onClick) {
        onClick(facility);
      }
    };

    window.naver.maps.Event.addListener(marker, 'click', handleClick);

    markerRef.current = marker;
    infoWindowRef.current = infoWindow;

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, [map, facility, onClick]);

  // 시설 정보 업데이트
  useEffect(() => {
    if (markerRef.current && window.naver?.maps) {
      // 아이콘 업데이트
      markerRef.current.setIcon(createMarkerIcon(facility));

      // 정보창 업데이트
      if (infoWindowRef.current) {
        infoWindowRef.current.setContent(createInfoWindowContent(facility));
      }
    }
  }, [facility]);

  return null;
};