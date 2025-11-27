"use client";

/**
 * @file error-boundary.tsx
 * @description 에러 바운더리 컴포넌트
 */

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] 에러 발생:", error);
    console.error("[ErrorBoundary] 에러 정보:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            섹션을 불러오는 중 오류가 발생했습니다.
          </p>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="mt-4 text-xs text-red-600">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
