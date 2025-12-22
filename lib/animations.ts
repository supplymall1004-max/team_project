/**
 * @file animations.ts
 * @description Framer Motion 애니메이션 프리셋 및 유틸리티
 * 
 * 재사용 가능한 애니메이션 variants와 transition 설정을 제공합니다.
 */

import { Variants, Transition } from 'framer-motion';

/**
 * 페이드 인 애니메이션
 */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * 슬라이드 업 애니메이션
 */
export const slideUp: Variants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -50 },
};

/**
 * 스케일 인 애니메이션
 */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

/**
 * 슬라이드 인 (왼쪽에서)
 */
export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

/**
 * 슬라이드 인 (오른쪽에서)
 */
export const slideInRight: Variants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 },
};

/**
 * 회전 효과
 */
export const rotateIn: Variants = {
  initial: { opacity: 0, rotate: -10 },
  animate: { opacity: 1, rotate: 0 },
  exit: { opacity: 0, rotate: 10 },
};

/**
 * 스프링 전환 효과 (기본)
 */
export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

/**
 * 느린 스프링 전환 효과 (더 부드럽고 천천히)
 */
export const slowSpringTransition: Transition = {
  type: "spring",
  stiffness: 150,
  damping: 25,
  mass: 1.2,
};

/**
 * 부드러운 전환 효과
 */
export const smoothTransition: Transition = {
  duration: 0.3,
  ease: "easeInOut",
};

/**
 * 빠른 전환 효과
 */
export const quickTransition: Transition = {
  duration: 0.2,
  ease: "easeOut",
};

/**
 * 느린 전환 효과
 */
export const slowTransition: Transition = {
  duration: 0.6,
  ease: "easeInOut",
};

/**
 * 스태거 애니메이션 (순차적으로 나타남)
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.8,
    },
  },
};

/**
 * 스태거 아이템
 */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

/**
 * 위에서 아래로 진입 (스케일 + 이동)
 */
export const slideDownScale: Variants = {
  initial: { opacity: 0, y: -100, scale: 0.8 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 25,
      mass: 1.2,
      duration: 1.0,
    },
  },
  exit: { opacity: 0, y: -50, scale: 0.9 },
};

/**
 * 아래에서 위로 진입 (스케일 + 이동)
 */
export const slideUpScale: Variants = {
  initial: { opacity: 0, y: 100, scale: 0.8 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 25,
      mass: 1.2,
      duration: 1.0,
    },
  },
  exit: { opacity: 0, y: 50, scale: 0.9 },
};

/**
 * 왼쪽에서 오른쪽으로 진입 (스케일 + 이동)
 */
export const slideRightScale: Variants = {
  initial: { opacity: 0, x: -100, scale: 0.8 },
  animate: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 25,
      mass: 1.2,
      duration: 1.0,
    },
  },
  exit: { opacity: 0, x: -50, scale: 0.9 },
};

/**
 * 오른쪽에서 왼쪽으로 진입 (스케일 + 이동)
 */
export const slideLeftScale: Variants = {
  initial: { opacity: 0, x: 100, scale: 0.8 },
  animate: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 25,
      mass: 1.2,
      duration: 1.0,
    },
  },
  exit: { opacity: 0, x: 50, scale: 0.9 },
};

/**
 * 중앙에서 확대 (스케일 중심)
 */
export const scaleFromCenter: Variants = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 25,
      mass: 1.2,
      duration: 1.0,
    },
  },
  exit: { opacity: 0, scale: 0.8 },
};

/**
 * 회전하면서 진입
 */
export const rotateInScale: Variants = {
  initial: { opacity: 0, rotate: -180, scale: 0.5 },
  animate: { 
    opacity: 1, 
    rotate: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: { opacity: 0, rotate: 180, scale: 0.5 },
};
