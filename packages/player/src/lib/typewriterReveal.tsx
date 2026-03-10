'use client';

import React from 'react';
import katex from 'katex';
import {parseLatex} from './mathText';

/**
 * Render text (possibly containing $LaTeX$) with typewriter reveal.
 * @param text   - raw text, may contain $..$ or $$..$$
 * @param progress - 0 (hidden) to 1 (fully revealed)
 * @param isTypewriter - if false, renders everything immediately
 * @param cursorColor - color for the blinking cursor
 */
export function renderTypewriter(
  text: string,
  progress: number,
  isTypewriter: boolean,
  cursorColor?: string,
): React.ReactNode[] {
  const segments = parseLatex(text);

  let totalChars = 0;
  for (const seg of segments) {
    totalChars += seg.value.length;
  }
  totalChars = Math.max(totalChars, 1);

  const charsToShow = isTypewriter ? Math.floor(progress * totalChars * 1.2) : totalChars;

  const result: React.ReactNode[] = [];
  let charsSoFar = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const segLen = seg.value.length;

    if (charsSoFar >= charsToShow) break;

    if (seg.type === 'text') {
      const visibleCount = Math.min(segLen, charsToShow - charsSoFar);
      result.push(<span key={`t${i}`}>{seg.value.slice(0, visibleCount)}</span>);
    } else {
      const segProgress = Math.min(1, (charsToShow - charsSoFar) / segLen);
      const html = katex.renderToString(seg.value, {
        displayMode: seg.display,
        throwOnError: false,
        trust: true,
      });
      const clipPct = (1 - segProgress) * 100;
      result.push(
        <span
          key={`m${i}`}
          dangerouslySetInnerHTML={{__html: html}}
          style={{
            display: 'inline-block',
            clipPath: isTypewriter ? `inset(0 ${clipPct}% 0 0)` : undefined,
          }}
        />,
      );
    }
    charsSoFar += segLen;
  }

  // Blinking cursor
  if (isTypewriter && progress < 0.85) {
    result.push(
      <span
        key="cursor"
        style={{
          display: 'inline-block',
          width: 2,
          height: '1em',
          background: cursorColor ?? '#E8E8F0',
          marginLeft: 2,
          verticalAlign: 'text-bottom',
          animation: 'cursorBlink 0.8s step-end infinite',
        }}
      />,
    );
  }

  return result;
}

/**
 * Render a KaTeX equation with clip-path typewriter reveal.
 * @param tex - LaTeX string
 * @param progress - 0 (hidden) to 1 (fully revealed)
 */
export function renderKatexTypewriter(
  tex: string,
  progress: number,
): React.ReactNode {
  const html = katex.renderToString(tex, {displayMode: true, throwOnError: false, trust: true});
  const clipPct = (1 - progress) * 100;
  return (
    <div
      dangerouslySetInnerHTML={{__html: html}}
      style={{
        clipPath: progress < 1 ? `inset(0 ${clipPct}% 0 0)` : undefined,
        transition: 'none',
      }}
    />
  );
}

/**
 * Compute which step of an equation sequence is active and its sub-progress.
 */
export function computeSequenceReveal(
  stepCount: number,
  weights: number[],
  progress: number,
): {activeIndex: number; stepProgress: number} {
  if (stepCount === 0) return {activeIndex: 0, stepProgress: 0};
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let accumulated = 0;
  for (let i = 0; i < stepCount; i++) {
    const fraction = weights[i] / totalWeight;
    if (progress < accumulated + fraction) {
      return {activeIndex: i, stepProgress: (progress - accumulated) / fraction};
    }
    accumulated += fraction;
  }
  return {activeIndex: stepCount - 1, stepProgress: 1};
}

/** CSS keyframe for cursor blink — include once per render tree. */
export const CURSOR_BLINK_STYLE = `@keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }`;
