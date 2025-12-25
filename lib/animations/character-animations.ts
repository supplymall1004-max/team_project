/**
 * @file lib/animations/character-animations.ts
 * @description 캐릭터창 전용 애니메이션 프리셋
 *
 * 캐릭터창 인터페이스에 사용되는 애니메이션 variants와 transition 설정
 */

import { Variants, Transition } from "framer-motion";
import type { CharacterEmotion } from "@/types/character";

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

/**
 * 감정별 애니메이션 variants
 * intensity: 0-100 (감정 강도에 따라 애니메이션 강도 조절)
 */
export function getEmotionVariants(emotion: CharacterEmotion, intensity: number = 50): Variants {
  const intensityMultiplier = intensity / 100; // 0-1 범위로 정규화
  const baseScale = 1 + (intensityMultiplier * 0.1); // 최대 10% 확대
  const baseRotation = intensityMultiplier * 5; // 최대 5도 회전

  switch (emotion) {
    case "happy":
      return {
        animate: {
          y: [0, -8 * intensityMultiplier, 0],
          scale: [1, baseScale, 1],
          rotate: [0, -baseRotation, baseRotation, 0],
          transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
      };

    case "sad":
      return {
        animate: {
          y: [0, 5 * intensityMultiplier, 0],
          scale: [1, 0.98, 1],
          opacity: [1, 0.9, 1],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
      };

    case "sick":
      return {
        animate: {
          x: [-3 * intensityMultiplier, 3 * intensityMultiplier, -3 * intensityMultiplier],
          rotate: [-2 * intensityMultiplier, 2 * intensityMultiplier, -2 * intensityMultiplier],
          transition: {
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
      };

    case "tired":
      return {
        animate: {
          scale: [1, 0.99, 1],
          opacity: [1, 0.85, 1],
          y: [0, 2 * intensityMultiplier, 0],
          transition: {
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
      };

    case "hungry":
      return {
        animate: {
          y: [0, -5 * intensityMultiplier, 0, 5 * intensityMultiplier, 0],
          scale: [1, 1.02, 1, 0.98, 1],
          transition: {
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
      };

    case "full":
      return {
        animate: {
          scale: [1, 1.05 * baseScale, 1],
          y: [0, -2 * intensityMultiplier, 0],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
      };

    case "excited":
      return {
        animate: {
          scale: [1, 1.1 * baseScale, 1],
          rotate: [0, 10 * intensityMultiplier, -10 * intensityMultiplier, 0],
          y: [0, -10 * intensityMultiplier, 0],
          transition: {
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
      };

    case "worried":
      return {
        animate: {
          x: [-2 * intensityMultiplier, 2 * intensityMultiplier, -2 * intensityMultiplier],
          scale: [1, 0.99, 1],
          transition: {
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
      };

    case "angry":
      return {
        animate: {
          x: [-5 * intensityMultiplier, 5 * intensityMultiplier, -5 * intensityMultiplier],
          rotate: [-3 * intensityMultiplier, 3 * intensityMultiplier, -3 * intensityMultiplier],
          scale: [1, 1.03, 1],
          transition: {
            duration: 0.4,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
      };

    case "neutral":
    default:
      return {
        animate: {
          scale: [1, 1.01, 1],
          y: [0, -2, 0],
          transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          },
        },
      };
  }
}

/**
 * 감정별 색상 설정
 */
export const emotionColors: Record<CharacterEmotion, { border: string; glow: string; bg: string; text: string }> = {
  happy: {
    border: "border-yellow-400",
    glow: "rgba(250, 204, 21, 0.6)",
    bg: "bg-yellow-50",
    text: "text-yellow-600",
  },
  sad: {
    border: "border-blue-400",
    glow: "rgba(96, 165, 250, 0.4)",
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  sick: {
    border: "border-red-400",
    glow: "rgba(239, 68, 68, 0.6)",
    bg: "bg-red-50",
    text: "text-red-600",
  },
  tired: {
    border: "border-gray-400",
    glow: "rgba(156, 163, 175, 0.4)",
    bg: "bg-gray-50",
    text: "text-gray-600",
  },
  hungry: {
    border: "border-orange-400",
    glow: "rgba(251, 146, 60, 0.6)",
    bg: "bg-orange-50",
    text: "text-orange-600",
  },
  full: {
    border: "border-green-400",
    glow: "rgba(74, 222, 128, 0.6)",
    bg: "bg-green-50",
    text: "text-green-600",
  },
  excited: {
    border: "border-pink-400",
    glow: "rgba(244, 114, 182, 0.6)",
    bg: "bg-pink-50",
    text: "text-pink-600",
  },
  worried: {
    border: "border-amber-400",
    glow: "rgba(251, 191, 36, 0.6)",
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
  angry: {
    border: "border-red-500",
    glow: "rgba(239, 68, 68, 0.8)",
    bg: "bg-red-100",
    text: "text-red-700",
  },
  neutral: {
    border: "border-gray-300",
    glow: "rgba(209, 213, 219, 0.4)",
    bg: "bg-gray-50",
    text: "text-gray-600",
  },
};

