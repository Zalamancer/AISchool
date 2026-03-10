'use client';

import katex from 'katex';
import 'katex/dist/katex.min.css';

type Segment = {type: 'text'; value: string} | {type: 'math'; value: string; display: boolean};

export function parseLatex(text: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({type: 'text', value: text.slice(lastIndex, match.index)});
    }
    const raw = match[0];
    const isDisplay = raw.startsWith('$$');
    const latex = isDisplay ? raw.slice(2, -2) : raw.slice(1, -1);
    segments.push({type: 'math', value: latex, display: isDisplay});
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({type: 'text', value: text.slice(lastIndex)});
  }
  return segments;
}

function renderMath(value: string, display: boolean, key: string) {
  const html = katex.renderToString(value, {displayMode: display, throwOnError: false});
  return display ? (
    <div key={key} dangerouslySetInnerHTML={{__html: html}} style={{margin: '12px 0', textAlign: 'center', overflowX: 'auto'}} />
  ) : (
    <span key={key} dangerouslySetInnerHTML={{__html: html}} />
  );
}

/** Split text into chunks of bold/non-bold, then render math within each. */
type BoldChunk = {bold: boolean; content: string};

function splitBold(text: string): BoldChunk[] {
  const chunks: BoldChunk[] = [];
  // Match **...** that may span across $ math $ expressions
  const boldRegex = /\*\*([\s\S]+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = boldRegex.exec(text)) !== null) {
    if (m.index > last) chunks.push({bold: false, content: text.slice(last, m.index)});
    chunks.push({bold: true, content: m[1]});
    last = boldRegex.lastIndex;
  }
  if (last < text.length) chunks.push({bold: false, content: text.slice(last)});
  return chunks;
}

function renderSegments(segments: Segment[], keyPrefix: string): React.ReactNode[] {
  return segments.map((seg, i) => {
    if (seg.type === 'math') return renderMath(seg.value, seg.display, `${keyPrefix}-${i}`);
    return <span key={`${keyPrefix}-${i}`}>{seg.value}</span>;
  });
}

export function MathText({text}: {text: string}) {
  const chunks = splitBold(text);
  return (
    <>
      {chunks.map((chunk, ci) => {
        const segments = parseLatex(chunk.content);
        const nodes = renderSegments(segments, `c${ci}`);
        if (chunk.bold) {
          return <strong key={ci}>{nodes}</strong>;
        }
        return <span key={ci}>{nodes}</span>;
      })}
    </>
  );
}
