import React, { useMemo } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(
  ({ content, className = '' }) => {
    // 텍스트를 블록 단위로 파싱 (코드 블록, 일반 단락)
    const blocks = useMemo(() => {
      const result: Array<{ type: 'code' | 'text'; lang?: string; content: string }> = [];
      const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = codeBlockRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          result.push({
            type: 'text',
            content: content.slice(lastIndex, match.index),
          });
        }
        result.push({
          type: 'code',
          lang: match[1] || 'text',
          content: match[2],
        });
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < content.length) {
        result.push({
          type: 'text',
          content: content.slice(lastIndex),
        });
      }

      return result;
    }, [content]);

    return (
      <div className={`space-y-2 leading-relaxed text-sm ${className}`}>
        {blocks.map((block, idx) => {
          if (block.type === 'code') {
            return <CodeBlock key={idx} code={block.content} lang={block.lang} />;
          }
          return <TextBlock key={idx} text={block.content} />;
        })}
      </div>
    );
  }
);

MarkdownRenderer.displayName = 'MarkdownRenderer';

// 1. 코드 블록 렌더러
const CodeBlock: React.FC<{ code: string; lang?: string }> = ({ code, lang }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative my-3 rounded-lg border border-lotte-charcoal bg-lotte-charcoal overflow-hidden font-mono text-xs text-gray-200">
      <div className="flex items-center justify-between border-b border-gray-700/60 bg-black/40 px-3.5 py-1.5 text-[11px] text-gray-400">
        <span>{lang || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span>복사됨</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>복사</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// 2. 텍스트 단락 렌더러 (볼드, 인라인 코드, 리스트, 헤딩 파싱)
const TextBlock: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  return (
    <div className="space-y-1">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();

        // 빈 줄인 경우 여백 처리
        if (!trimmed) {
          return <div key={lineIdx} className="h-2" />;
        }

        // 헤딩 처리 (#, ##, ###)
        if (line.startsWith('### ')) {
          return (
            <h4 key={lineIdx} className="font-bold text-sm text-lotte-dark mt-2.5 mb-1">
              <InlineParser text={line.slice(4)} />
            </h4>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={lineIdx} className="font-bold text-base text-lotte-dark mt-3 mb-1">
              <InlineParser text={line.slice(3)} />
            </h3>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h2 key={lineIdx} className="font-bold text-lg text-lotte-dark mt-3 mb-1.5">
              <InlineParser text={line.slice(2)} />
            </h2>
          );
        }

        // 숫자 리스트 (1. , 2. )
        const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={lineIdx} className="flex items-start space-x-2 pl-1 py-0.5">
              <span className="font-mono text-xs font-semibold text-lotte-gold-dark shrink-0 mt-0.5">
                {numMatch[1]}.
              </span>
              <span className="flex-1">
                <InlineParser text={numMatch[2]} />
              </span>
            </div>
          );
        }

        // 불릿 리스트 (- , * )
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={lineIdx} className="flex items-start space-x-2 pl-1 py-0.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-lotte-gold shrink-0 mt-2" />
              <span className="flex-1">
                <InlineParser text={line.slice(2)} />
              </span>
            </div>
          );
        }

        // 일반 텍스트 라인
        return (
          <p key={lineIdx} className="leading-relaxed">
            <InlineParser text={line} />
          </p>
        );
      })}
    </div>
  );
};

// 3. 인라인 파서 (**볼드**, `인라인 코드` 처리)
const InlineParser: React.FC<{ text: string }> = ({ text }) => {
  // 인라인 토큰 정규식: **볼드** 및 `인라인코드`
  const parts = useMemo(() => {
    const tokens: Array<{ type: 'bold' | 'code' | 'text'; value: string }> = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({
          type: 'text',
          value: text.slice(lastIndex, match.index),
        });
      }

      const matchText = match[0];
      if (matchText.startsWith('**') && matchText.endsWith('**')) {
        tokens.push({
          type: 'bold',
          value: matchText.slice(2, -2),
        });
      } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
        tokens.push({
          type: 'code',
          value: matchText.slice(1, -1),
        });
      }

      lastIndex = match.index + matchText.length;
    }

    if (lastIndex < text.length) {
      const remaining = text.slice(lastIndex);
      // 스트리밍 중 아직 닫히지 않은 볼드 토큰 처리 (예: "**롯데백화점...")
      if (remaining.startsWith('**')) {
        tokens.push({
          type: 'bold',
          value: remaining.slice(2),
        });
      } else {
        tokens.push({
          type: 'text',
          value: remaining,
        });
      }
    }

    return tokens;
  }, [text]);

  return (
    <>
      {parts.map((part, idx) => {
        if (part.type === 'bold') {
          return (
            <strong key={idx} className="font-bold text-lotte-dark">
              {part.value}
            </strong>
          );
        }
        if (part.type === 'code') {
          return (
            <code
              key={idx}
              className="rounded bg-lotte-background px-1.5 py-0.5 font-mono text-[11px] text-lotte-dark border border-lotte-border"
            >
              {part.value}
            </code>
          );
        }
        return <span key={idx}>{part.value}</span>;
      })}
    </>
  );
};
