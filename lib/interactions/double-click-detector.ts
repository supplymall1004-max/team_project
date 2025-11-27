/**
 * @file double-click-detector.ts
 * @description 더블 클릭 인식에 필요한 상수와 헬퍼 함수 모음
 */

export const DOUBLE_CLICK_THRESHOLD_MS = 280;

/**
 * 두 클릭 사이의 시간이 지정한 임계값 이하인지 확인합니다.
 */
export function isWithinDoubleClickWindow(
  previousTimestamp: number | null,
  currentTimestamp: number,
  threshold: number = DOUBLE_CLICK_THRESHOLD_MS,
): boolean {
  if (previousTimestamp === null) {
    return false;
  }

  if (currentTimestamp <= previousTimestamp) {
    return false;
  }

  return currentTimestamp - previousTimestamp <= threshold;
}

