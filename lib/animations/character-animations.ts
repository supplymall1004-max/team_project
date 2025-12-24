/**
 * @file lib/animations/character-animations.ts
 * @description 캐릭터창 전용 애니메이션 프리셋
 *
 * 캐릭터창 인터페이스에 사용되는 애니메이션 variants와 transition 설정
 */

import { Variants, Transition } from "framer-motion";

/**
 * 기본 스프링 전환 설정
 */
export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

/**
 * 빠른 스프링 전환 (인터랙션용)
 */
export const quickSpringTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
  mass: 0.5,
};

/**
 * 페이지 진입 애니메이션
 */
export const pageEnterVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      ...springTransition,
      duration: 0.6,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * 패널 스태거 애니메이션 (순차적으로 나타남)
 */
export const panelStaggerVariants: Variants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...springTransition,
      duration: 0.5,
    },
  },
};

/**
 * 패널 컨테이너 (자식 요소에 스태거 적용)
 */
export const panelContainerVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

/**
 * 카드 호버 애니메이션
 */
export const cardHoverVariants: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.15)",
    transition: quickSpringTransition,
  },
  tap: {
    scale: 0.98,
    y: -2,
    transition: {
      duration: 0.1,
    },
  },
};

/**
 * 네온 효과 애니메이션 (펄스 효과)
 */
export const neonPulseVariants: Variants = {
  initial: {
    opacity: 0.6,
    boxShadow: "0 0 10px currentColor",
  },
  animate: {
    opacity: [0.6, 1, 0.6],
    boxShadow: [
      "0 0 10px currentColor",
      "0 0 20px currentColor, 0 0 30px currentColor",
      "0 0 10px currentColor",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

/**
 * 네온 글로우 효과 (호버 시)
 */
export const neonGlowVariants: Variants = {
  rest: {
    boxShadow: "0 0 10px currentColor",
    filter: "brightness(1)",
  },
  hover: {
    boxShadow: [
      "0 0 10px currentColor",
      "0 0 20px currentColor, 0 0 30px currentColor",
      "0 0 10px currentColor",
    ],
    filter: "brightness(1.2)",
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

/**
 * 페이드 인 + 슬라이드 업
 */
export const fadeInSlideUp: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springTransition,
  },
};

/**
 * 스케일 인 애니메이션
 */
export const scaleIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springTransition,
  },
};

/**
 * 우선순위별 네온 색상 설정
 */
export const neonColors = {
  urgent: {
    border: "border-red-500",
    text: "text-red-400",
    shadow: "shadow-[0_0_20px_rgba(239,68,68,0.6)]",
    glow: "rgba(239, 68, 68, 0.6)",
  },
  high: {
    border: "border-orange-500",
    text: "text-orange-400",
    shadow: "shadow-[0_0_20px_rgba(249,115,22,0.6)]",
    glow: "rgba(249, 115, 22, 0.6)",
  },
  medium: {
    border: "border-yellow-500",
    text: "text-yellow-400",
    shadow: "shadow-[0_0_20px_rgba(234,179,8,0.6)]",
    glow: "rgba(234, 179, 8, 0.6)",
  },
  normal: {
    border: "border-blue-500",
    text: "text-blue-400",
    shadow: "shadow-[0_0_20px_rgba(59,130,246,0.6)]",
    glow: "rgba(59, 130, 246, 0.6)",
  },
  low: {
    border: "border-cyan-500",
    text: "text-cyan-400",
    shadow: "shadow-[0_0_20px_rgba(6,182,212,0.6)]",
    glow: "rgba(6, 182, 212, 0.6)",
  },
  excellent: {
    border: "border-green-500",
    text: "text-green-400",
    shadow: "shadow-[0_0_20px_rgba(34,197,94,0.6)]",
    glow: "rgba(34, 197, 94, 0.6)",
  },
  good: {
    border: "border-blue-500",
    text: "text-blue-400",
    shadow: "shadow-[0_0_20px_rgba(59,130,246,0.6)]",
    glow: "rgba(59, 130, 246, 0.6)",
  },
  fair: {
    border: "border-yellow-500",
    text: "text-yellow-400",
    shadow: "shadow-[0_0_20px_rgba(234,179,8,0.6)]",
    glow: "rgba(234, 179, 8, 0.6)",
  },
  needs_attention: {
    border: "border-red-500",
    text: "text-red-400",
    shadow: "shadow-[0_0_20px_rgba(239,68,68,0.6)]",
    glow: "rgba(239, 68, 68, 0.6)",
  },
} as const;

