import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('tenduck_threads_v1');
      localStorage.removeItem('tenduck_active_thread_id_v1');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-lotte-background p-6 text-center font-sans">
          <div className="max-w-md rounded-xl border border-lotte-border bg-lotte-surface p-6 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-lotte-red mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold text-lotte-dark">
              일시적인 렌더링 오류가 발생했습니다
            </h2>
            <p className="mt-2 text-xs text-lotte-muted leading-relaxed">
              대화 상태를 복구하거나 브라우저를 새로고침하여 정상 화면으로 복원할 수 있습니다.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 rounded-lg border border-lotte-border bg-lotte-background px-4 py-2 text-xs font-semibold text-lotte-dark hover:bg-lotte-surface"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                새로고침
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center gap-1.5 rounded-lg bg-lotte-gold px-4 py-2 text-xs font-semibold text-white hover:bg-lotte-gold-hover shadow-2xs"
              >
                세션 초기화 후 복구
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
