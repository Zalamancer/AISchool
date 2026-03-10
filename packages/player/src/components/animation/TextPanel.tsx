'use client';

import {useEffect, useRef} from 'react';
import type {PanelItem} from '../../hooks/useAnimationEngine';
import {TextPanelItem} from './TextPanelItem';

interface Props {
  items: PanelItem[];
  currentStage: number;
  stageProgress: number;
}

export function TextPanel({items, currentStage, stageProgress}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Auto-scroll to latest item when new items appear
  useEffect(() => {
    if (items.length > prevCountRef.current) {
      bottomRef.current?.scrollIntoView({behavior: 'smooth', block: 'end'});
    }
    prevCountRef.current = items.length;
  }, [items.length]);

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: '#0D0D1A',
        boxSizing: 'border-box',
      }}
    >
      {items.length === 0 && (
        <div style={{color: '#5A5A9A', fontSize: 14, fontStyle: 'italic', paddingTop: 40, textAlign: 'center'}}>
          Steps will appear here...
        </div>
      )}
      {items.map((item, i) => (
        <TextPanelItem
          key={item.element.id}
          item={item}
          isActive={item.appearedAtStage === currentStage}
          stageProgress={stageProgress}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
