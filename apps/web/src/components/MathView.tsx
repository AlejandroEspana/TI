import { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathViewProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export function MathView({ latex, displayMode = false, className = '' }: MathViewProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(latex, containerRef.current, {
          displayMode,
          throwOnError: false,
        });
      } catch {
        if (containerRef.current) {
          containerRef.current.innerText = latex;
        }
      }
    }
  }, [latex, displayMode]);

  return <span ref={containerRef} className={`inline-block select-none ${className}`} />;
}
