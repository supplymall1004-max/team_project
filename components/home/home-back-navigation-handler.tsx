/**
 * @file home-back-navigation-handler.tsx
 * @description 홈 페이지 뒤로가기 네비게이션 핸들러
 * 
 * 현재는 window.location.href를 사용하여 홈으로 이동하므로,
 * 이 핸들러는 더 이상 필요하지 않습니다.
 * 
 * 브라우저 뒤로가기는 브라우저의 기본 동작에 맡깁니다.
 */

'use client';

export function HomeBackNavigationHandler() {
  // 현재는 아무 작업도 하지 않음
  // window.location.href를 사용하면 전체 페이지가 새로고침되므로
  // 추가적인 핸들링이 필요 없음
  return null;
}

