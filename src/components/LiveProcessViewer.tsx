import React, { useState } from 'react';
import {
  Brain,
  Wrench,
  ChevronDown,
  ChevronRight,
  Gauge,
  CheckCircle2,
  Clock,
  Terminal,
} from 'lucide-react';
import {
  AIProcessingStage,
  ThoughtStep,
  ToolCallEvent,
  LiveStreamMetrics,
} from '../types/llm';

interface LiveProcessViewerProps {
  currentStage: AIProcessingStage;
  stageMessage: string;
  thoughts: ThoughtStep[];
  toolCalls: ToolCallEvent[];
  metrics: LiveStreamMetrics | null;
  wsLatencyMs?: number | null;
}

export const LiveProcessViewer: React.FC<LiveProcessViewerProps> = React.memo(
  ({ currentStage, stageMessage, thoughts, toolCalls, metrics, wsLatencyMs }) => {
    const [isThoughtOpen, setIsThoughtOpen] = useState(true);
    const [isToolsOpen, setIsToolsOpen] = useState(true);

    const getStageBadge = (stage: AIProcessingStage) => {
      switch (stage) {
        case 'idle':
          return (
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              대기 중
            </span>
          );
        case 'planning':
        case 'reasoning':
          return (
            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/60 animate-pulse">
              <Brain className="h-3 w-3" />
              추론 및 사고 중
            </span>
          );
        case 'tool_calling':
          return (
            <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60 animate-pulse">
              <Wrench className="h-3 w-3" />
              도구 실행 중
            </span>
          );
        case 'generating':
          return (
            <span className="inline-flex items-center gap-1 rounded bg-lotte-gold-light px-2 py-0.5 text-xs font-semibold text-lotte-gold-dark border border-lotte-gold-border">
              <Terminal className="h-3 w-3" />
              토큰 생성 중
            </span>
          );
        case 'completed':
          return (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3 w-3" />
              생성 완료
            </span>
          );
        case 'error':
          return (
            <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              오류 발생
            </span>
          );
      }
    };

    return (
      <aside className="flex flex-col h-full rounded-lg border border-lotte-border bg-lotte-surface shadow-xs overflow-hidden">
        {/* 상단 콘솔 헤더 */}
        <div className="flex items-center justify-between border-b border-lotte-border bg-lotte-background/60 px-4 py-3">
          <div className="flex items-center space-x-2">
            <Terminal className="h-4 w-4 text-lotte-dark" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-lotte-dark">
              AI Live Processing
            </h2>
          </div>
          {getStageBadge(currentStage)}
        </div>

        {/* 상태 메시지 배너 */}
        {stageMessage && (
          <div
            className={`border-b px-4 py-2 text-xs font-medium flex items-center space-x-1.5 ${
              currentStage === 'error'
                ? 'border-red-200 bg-red-50 text-lotte-red'
                : 'border-lotte-border/60 bg-lotte-gold-light/40 text-lotte-gold-dark'
            }`}
          >
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">{stageMessage}</span>
          </div>
        )}

        {/* 메인 스트림 로그 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
          {/* 1. 사고 과정 (Reasoning Steps) */}
          <div className="rounded-md border border-lotte-border bg-lotte-background/40">
            <button
              type="button"
              onClick={() => setIsThoughtOpen((prev) => !prev)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold text-lotte-dark hover:bg-lotte-background focus-visible:outline-none"
            >
              <div className="flex items-center space-x-2">
                <Brain className="h-3.5 w-3.5 text-amber-600" />
                <span>내부 사고 과정 ({thoughts.length})</span>
              </div>
              {isThoughtOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-lotte-muted" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-lotte-muted" />
              )}
            </button>

            {isThoughtOpen && (
              <div className="border-t border-lotte-border/60 p-3 text-gray-700 bg-white/70 space-y-2 max-h-48 overflow-y-auto">
                {thoughts.length === 0 ? (
                  <p className="text-lotte-muted italic text-[11px]">
                    사고 과정 스트림 대기 중...
                  </p>
                ) : (
                  thoughts.map((item, idx) => (
                    <div
                      key={idx}
                      className="whitespace-pre-wrap leading-relaxed border-l-2 border-lotte-gold pl-2 py-0.5 text-[11px]"
                    >
                      {item.content}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 2. 도구 호출 로그 (Tool Calls) */}
          <div className="rounded-md border border-lotte-border bg-lotte-background/40">
            <button
              type="button"
              onClick={() => setIsToolsOpen((prev) => !prev)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold text-lotte-dark hover:bg-lotte-background focus-visible:outline-none"
            >
              <div className="flex items-center space-x-2">
                <Wrench className="h-3.5 w-3.5 text-blue-600" />
                <span>도구 호출 내역 ({toolCalls.length})</span>
              </div>
              {isToolsOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-lotte-muted" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-lotte-muted" />
              )}
            </button>

            {isToolsOpen && (
              <div className="border-t border-lotte-border/60 p-3 bg-white/70 space-y-2 max-h-48 overflow-y-auto">
                {toolCalls.length === 0 ? (
                  <p className="text-lotte-muted italic text-[11px]">
                    호출된 도구 없음
                  </p>
                ) : (
                  toolCalls.map((tool) => (
                    <div
                      key={tool.toolId}
                      className={`rounded border p-2 text-[11px] ${
                        tool.status === 'failure'
                          ? 'border-red-200 bg-red-50/70'
                          : 'border-blue-100 bg-blue-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-blue-900 mb-1">
                        <span className="truncate">{tool.toolName}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {tool.executionMs !== undefined && (
                            <span className="text-[10px] font-normal text-gray-500">
                              {tool.executionMs}ms
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] ${
                              tool.status === 'success'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tool.status === 'failure'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {tool.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-gray-600 truncate mb-1">
                        Args: {JSON.stringify(tool.arguments)}
                      </div>
                      {tool.result && (
                        <div className="text-emerald-800 border-t border-blue-100/60 pt-1">
                          결과: {tool.result}
                        </div>
                      )}
                      {tool.error && (
                        <div className="text-red-700 border-t border-red-200/60 pt-1">
                          오류: {tool.error}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* 하단 메트릭 요약 바 (진짜 정직한 메트릭스 표시) */}
        <div className="border-t border-lotte-border bg-lotte-background/80 px-4 py-2.5">
          <div className="flex items-center justify-between text-[11px] text-lotte-muted">
            <div className="flex items-center space-x-1.5">
              <Gauge className="h-3.5 w-3.5 text-lotte-dark" />
              <span className="font-medium text-lotte-dark">Live Metrics:</span>
            </div>
            {metrics ? (
              <div className="flex items-center space-x-2.5 font-mono">
                <span>{metrics.totalTokens} tok</span>
                <span>{metrics.tokensPerSec} tok/s</span>
                <span>{metrics.elapsedMs} ms</span>
                {wsLatencyMs !== null && wsLatencyMs !== undefined && (
                  <span className="text-emerald-700">RTT {wsLatencyMs}ms</span>
                )}
              </div>
            ) : (
              <span className="font-mono">
                {wsLatencyMs !== null && wsLatencyMs !== undefined
                  ? `대기 중 (RTT ${wsLatencyMs}ms)`
                  : '대기 중'}
              </span>
            )}
          </div>
        </div>
      </aside>
    );
  }
);

LiveProcessViewer.displayName = 'LiveProcessViewer';
