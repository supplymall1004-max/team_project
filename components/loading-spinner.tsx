/**
 * @file loading-spinner.tsx
 * @description 전역에서 재사용 가능한 로딩 스피너 컴포넌트.
 *
 * 주요 기능:
 * 1. 초기에 데이터를 불러오는 페이지 공통 UI 제공
 * 2. 크기/문구를 설정하여 다양한 화면에서 활용
 *
 * @dependencies
 * - tailwindcss: 애니메이션과 색상 유틸리티
 */

interface LoadingSpinnerProps {
  label?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap: Record<LoadingSpinnerProps["size"], string> = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

export function LoadingSpinner({
  label = "로딩 중입니다...",
  size = "md",
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      <div
        className={`animate-spin rounded-full border-4 border-primary/30 border-t-primary ${sizeMap[size]}`}
        role="status"
        aria-live="polite"
      />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

