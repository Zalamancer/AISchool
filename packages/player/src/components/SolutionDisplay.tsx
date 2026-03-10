'use client';

import {MathText} from '../lib/mathText';

interface SolutionStep {
  title: string;
  content: string;
}

export function SolutionDisplay({steps}: {steps: SolutionStep[]}) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
      {steps.map((step, i) => (
        <div
          key={i}
          style={{
            background: '#141428',
            borderRadius: 12,
            padding: '16px 20px',
            borderLeft: '3px solid #FF6B4A',
          }}
        >
          <h3
            style={{
              margin: '0 0 8px 0',
              fontSize: 15,
              fontWeight: 600,
              color: '#FF6B4A',
            }}
          >
            {step.title}
          </h3>
          <div style={{fontSize: 15, lineHeight: 1.7, color: '#E8E8F0'}}>
            <MathText text={step.content} />
          </div>
        </div>
      ))}
    </div>
  );
}
