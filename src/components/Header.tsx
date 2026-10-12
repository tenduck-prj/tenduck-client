import React from 'react';
import { Activity, Wifi, WifiOff, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
  isConnecting: boolean;
  mockMode: boolean;
  isSidebarOpen: boolean;
  isConsoleOpen: boolean;
  onToggleSidebar: () => void;
  onToggleConsole: () => void;
  onToggleMockMode: () => void;
  onReconnect: () => void;
}

export const Header: React.FC<HeaderProps> = React.memo(
  ({
    isConnected,
    isConnecting,
    mockMode,
    isSidebarOpen,
    isConsoleOpen,
    onToggleSidebar,
    onToggleConsole,
    onToggleMockMode,
    onReconnect,
  }) => {
    return (
      <header className="sticky top-0 z-30 border-b border-lotte-border bg-lotte-surface/95 backdrop-blur-sm">
        <div className="flex w-full items-center justify-between px-4 py-2.5 sm:px-6">
          {/* 브랜드 로고 및 타이틀 영역 */}
          <div className="flex items-center space-x-3">
            {/* 사이드바 토글 버튼 */}
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-1.5 rounded-md border border-lotte-border bg-lotte-surface text-lotte-dark hover:bg-lotte-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lotte-gold"
              title={isSidebarOpen ? '대화 목록 닫기' : '대화 목록 열기'}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="h-4 w-4 text-lotte-gold-dark" />
              ) : (
                <PanelLeftOpen className="h-4 w-4 text-lotte-gold-dark" />
              )}
            </button>

            {/* LOTTE Department Store Champagne Gold 코어 뱃지 + 레드 액센트 닷 */}
            <div className="relative flex h-8 w-8 items-center justify-center rounded-sm bg-lotte-gold shadow-sm">
              <span className="font-sans text-xs font-black tracking-widest text-white">
                LT
              </span>
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-lotte-red ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-sans text-sm font-bold tracking-tight text-lotte-dark">
                  TENDUCK
                </h1>
              </div>
            </div>
          </div>

          {/* 우측 상태 및 제어 영역 */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* AI 콘솔 토글 버튼 */}
            <button
              type="button"
              onClick={onToggleConsole}
              className={`rounded border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lotte-gold ${
                isConsoleOpen
                  ? 'border-lotte-gold/60 bg-lotte-gold-light text-lotte-gold-dark font-semibold'
                  : 'border-lotte-border bg-lotte-background text-lotte-muted hover:text-lotte-dark'
              }`}
              title={isConsoleOpen ? 'AI 처리 콘솔 닫기' : 'AI 처리 콘솔 열기'}
            >
              AI 콘솔 {isConsoleOpen ? 'ON' : 'OFF'}
            </button>

            {/* Mock / Live 모드 토글 */}
            <button
              type="button"
              onClick={onToggleMockMode}
              className={`rounded border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lotte-gold ${
                mockMode
                  ? 'border-lotte-gold/60 bg-lotte-gold-light text-lotte-gold-dark font-semibold'
                  : 'border-lotte-border bg-lotte-background text-lotte-dark hover:bg-lotte-surface'
              }`}
            >
              {mockMode ? 'Mock 모드' : 'Live WS 모드'}
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
