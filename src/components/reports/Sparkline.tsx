import { useId } from 'react';
import { cn } from '@/lib/utils';

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  showEndDot?: boolean;
  showDelta?: boolean;
}

/**
 * Compact inline sparkline. Uses semantic tokens — colour reflects trend direction.
 * Up = primary, Down = destructive, Flat = muted-foreground.
 */
export function Sparkline({
  values,
  width = 80,
  height = 22,
  className,
  showEndDot = true,
  showDelta = true,
}: SparklineProps) {
  const gid = useId();

  if (!values || values.length < 2) {
    return <span className="text-[10px] text-muted-foreground">—</span>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const padY = 2;
  const usableH = height - padY * 2;

  const points = values.map((v, i) => {
    const x = i * step;
    const y = padY + (1 - (v - min) / range) * usableH;
    return [x, y] as const;
  });

  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = `${path} L${(points.at(-1)![0]).toFixed(1)},${height} L0,${height} Z`;

  const first = values[0];
  const last = values.at(-1)!;
  const delta = last - first;
  const deltaPct = first !== 0 ? (delta / Math.abs(first)) * 100 : 0;

  const trendClass =
    Math.abs(deltaPct) < 1 ? 'text-muted-foreground' : delta > 0 ? 'text-primary' : 'text-destructive';

  const strokeColor = 'currentColor';
  const fillId = `spark-fill-${gid}`;

  return (
    <div className={cn('inline-flex items-center gap-1.5 align-middle', trendClass, className)}>
      <svg width={width} height={height} className="overflow-visible shrink-0">
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${fillId})`} />
        <path d={path} fill="none" stroke={strokeColor} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        {showEndDot && (
          <circle cx={points.at(-1)![0]} cy={points.at(-1)![1]} r="1.75" fill={strokeColor} />
        )}
      </svg>
      {showDelta && (
        <span className="text-[10px] font-medium tabular-nums leading-none">
          {delta > 0 ? '▲' : delta < 0 ? '▼' : '•'}{Math.abs(deltaPct).toFixed(0)}%
        </span>
      )}
    </div>
  );
}
