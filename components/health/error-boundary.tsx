'use client';

/**
 * @file components/health/error-boundary.tsx
 * @description 건강 시각화 컴포넌트용 에러 바운더리
 *
 * 건강 시각화 컴포넌트에서 발생하는 오류를 우아하게 처리합니다.
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class HealthVisualizationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[HealthVisualizationErrorBoundary] 에러 발생:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // 에러 콜백 호출
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback UI가 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>건강 정보 표시 오류</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              건강 시각화 정보를 표시하는 중에 문제가 발생했습니다.
              이 오류는 일시적일 수 있으며, 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">
                  개발자용 상세 정보
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-2 mt-3">
              <Button
                onClick={this.handleRetry}
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                다시 시도
              </Button>
              <Button
                onClick={() => window.location.reload()}
                size="sm"
                variant="outline"
              >
                페이지 새로고침
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// 간단한 HOC 버전
export function withHealthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <HealthVisualizationErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </HealthVisualizationErrorBoundary>
  );

  WrappedComponent.displayName = `withHealthErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
