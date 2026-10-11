import React from 'react';
import { Activity, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
  isConnecting: boolean;
  mockMode: boolean;
  onToggleMockMode: () => void;
  onReconnect: () => void;
}

export const Header: React.FC<HeaderProps> = React.memo(
  ({ isConnected, isConnecting, mockMode, onToggleMockMode, onReconnect }) => {
    return (
      <header className="sticky top-0 z-30 border-b border-lotte-border bg-lotte-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          {/* 브랜드 로고 및 타이틀 영역 */}
          <div className="flex items-center space-x-3">
            {/* LOTTE Red 시그니처 뱃지 */}
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-lotte-red shadow-sm">
              <span className="font-sans text-sm font-black tracking-widest text-white">
                LT
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-sans text-base font-bold tracking-tight text-lotte-dark">
                  TENDUCK
                </h1>
                <span className="rounded bg-lotte-gold-light px-1.5 py-0.5 font-mono text-[11px] font-semibold text-lotte-gold-dark border border-lotte-gold/30">
                  Custom LLM Console
                </span>
              </div>
              <p className="text-xs text-lotte-muted">
                롯데백화점 프리미엄 AI 컨시어지 클라이언트
              </p>
            </div>
          </div>

          {/* 우측 상태 및 제어 영역 */}
          <div className="flex items-center space-x-3">
            {/* Mock / Live 모드 토글 */}
            <button
              type="button"
              onClick={onToggleMockMode}
              className={`rounded border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lotte-red ${
                mockMode
                  ? 'border-lotte-gold/50 bg-lotte-gold-light text-lotte-gold-dark'
                  : 'border-lotte-border bg-lotte-background text-lotte-dark hover:bg-lotte-surface'
              }`}
            >
              {mockMode ? 'Mock 시뮬레이션 모드' : 'Live WebSocket 모드'}
            </button>

            {/* WebSocket 연결 인디케이터 */}
            <div className="flex items-center space-x-1.5 rounded-full border border-lotte-border bg-lotte-surface px-3 py-1 shadow-2xs">
              {isConnecting ? (
                <>
                  <Activity className="h-3.5 w-3.5 animate-spin text-amber-500" />
                  <span className="text-xs font-medium text-amber-600">연결 시도 중</span>
                </>
              ) : isConnected ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700">WS 연결됨</span>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onReconnect}
                  className="flex items-center space-x-1 text-xs font-medium text-lotte-red hover:underline focus-visible:outline-none"
                >
                  <WifiOff className="h-3.5 w-3.5 text-lotte-red" />
                  <span>재연결</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }
);

Header.displayName = 'Header';
