import { ReactNode } from 'react';

interface AnimatedChartWrapperProps {
  animKey: number;
  children: ReactNode;
  className?: string;
}

export function AnimatedChartWrapper({ animKey, children, className = '' }: AnimatedChartWrapperProps) {
  return (
    <div
      key={animKey}
      className={`animate-fade-in ${className}`}
      style={{ animationDuration: '0.35s' }}
    >
      {children}
    </div>
  );
}
