/**
 * @file tokens.ts
 * @description 디자인 토큰 시스템
 *
 * 주요 기능:
 * 1. 색상 팔레트 정의
 * 2. 타이포그래피 스케일
 * 3. 간격(Spacing) 시스템
 * 4. 그림자 및 테두리
 */

/**
 * 브랜드 색상 팔레트
 */
export const brandColors = {
  orange: {
    50: "oklch(0.98 0.02 50)",
    100: "oklch(0.95 0.04 50)",
    200: "oklch(0.90 0.06 50)",
    300: "oklch(0.85 0.08 50)",
    400: "oklch(0.75 0.12 50)",
    500: "oklch(0.65 0.16 50)",
    600: "oklch(0.55 0.18 50)",
    700: "oklch(0.45 0.20 50)",
    800: "oklch(0.35 0.22 50)",
    900: "oklch(0.25 0.24 50)",
  },
  green: {
    50: "oklch(0.98 0.02 150)",
    100: "oklch(0.95 0.04 150)",
    200: "oklch(0.90 0.06 150)",
    300: "oklch(0.85 0.08 150)",
    400: "oklch(0.75 0.12 150)",
    500: "oklch(0.65 0.16 150)",
    600: "oklch(0.55 0.18 150)",
    700: "oklch(0.45 0.20 150)",
    800: "oklch(0.35 0.22 150)",
    900: "oklch(0.25 0.24 150)",
  },
  gold: {
    50: "oklch(0.98 0.02 85)",
    100: "oklch(0.95 0.04 85)",
    200: "oklch(0.90 0.06 85)",
    300: "oklch(0.85 0.08 85)",
    400: "oklch(0.75 0.12 85)",
    500: "oklch(0.65 0.16 85)",
    600: "oklch(0.55 0.18 85)",
    700: "oklch(0.45 0.20 85)",
    800: "oklch(0.35 0.22 85)",
    900: "oklch(0.25 0.24 85)",
  },
} as const;

/**
 * 타이포그래피 스케일
 */
export const typography = {
  fontFamily: {
    sans: "var(--font-geist-sans), 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
    jalnan: "'YeogiOttaeJalnan', 'Malgun Gothic', sans-serif",
    mono: "var(--font-geist-mono), monospace",
  },
  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
    "6xl": "3.75rem", // 60px
  },
  lineHeight: {
    tight: "1.2",
    snug: "1.3",
    normal: "1.5",
    relaxed: "1.6",
    loose: "2",
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
} as const;

/**
 * 간격(Spacing) 시스템
 */
export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "3rem", // 48px
  "3xl": "4rem", // 64px
} as const;

/**
 * 그림자 시스템
 */
export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  default: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
} as const;

/**
 * 테두리 반경
 */
export const borderRadius = {
  none: "0",
  sm: "0.125rem", // 2px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  full: "9999px",
} as const;

