/**
 * @file use-scroll-animation.ts
 * @description 스크롤 기반 애니메이션을 위한 커스텀 훅
 */

import { useScroll, useTransform, MotionValue } from 'framer-motion';

/**
 * 스크롤 진행도에 따른 값 변환 훅
 * 
 * @param inputRange - 스크롤 진행도 입력 범위 [시작, 끝]
 * @param outputRange - 출력 값 범위 [시작, 끝]
 * @returns 변환된 MotionValue
 * 
 * @example
 * ```tsx
 * const opacity = useScrollAnimation([0, 0.5], [1, 0]);
 * const y = useScrollAnimation([0, 1], [0, -100]);
 * ```
 */
export function useScrollAnimation(
  inputRange: [number, number],
  outputRange: [number, number]
): MotionValue<number> {
  const { scrollYProgress } = useScroll();
  return useTransform(scrollYProgress, inputRange, outputRange);
}

/**
 * 특정 요소의 스크롤 진행도에 따른 값 변환 훅
 * 
 * @param ref - 대상 요소의 ref
 * @param inputRange - 스크롤 진행도 입력 범위 [시작, 끝]
 * @param outputRange - 출력 값 범위 [시작, 끝]
 * @returns 변환된 MotionValue
 */
export function useElementScrollAnimation(
  ref: React.RefObject<HTMLElement>,
  inputRange: [number, number],
  outputRange: [number, number]
): MotionValue<number> {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  return useTransform(scrollYProgress, inputRange, outputRange);
}
