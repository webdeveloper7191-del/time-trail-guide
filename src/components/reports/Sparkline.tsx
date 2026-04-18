import { useId, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  showEndDot?: boolean;
  showDelta?: boolean;
  /**
   * Label generator for each point on hover.
   * Default produces "Wk -N" for the past N periods (last point = "Now").
   * Provide e.g. (i, len) => format dates for custom periods.
   */
  pointLabel?: (index: number, length: number) => string;
  /** Optional unit appended to the value in the tooltip (e.g. "h", "%"). */
  unit?: string;
  /** Number of decimals shown in the tooltip value. Defaults to 1. */
  decimals?: number;
}

const defaultPointLabel = (i: number, len: number) => {
  const offset = len - 1 - i;
  if (offset === 0) return 'Now';
  return `Wk -${offset}`;
};

/**
 * Compact inline sparkline. Uses semantic tokens — colour reflects trend direction.
 * Up = primary, Down = destructive, Flat = muted-foreground.
 * Hover any point to see exact value + period label.
 */
export function Sparkline({
  values,
  width = 80,
  height = 22,
  className,
  showEndDot = true,
  showDelta = true,
  pointLabel = defaultPointLabel,
  unit = '',
  decimals = 1,
}: SparklineProps) {
  const gid = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ idx: number; x: number; y: number } | null>(null);

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

  const lastPoint = points[points.length - 1];
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = `${path} L${lastPoint[0].toFixed(1)},${height} L0,${height} Z`;

  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;
  const deltaPct = first !== 0 ? (delta / Math.abs(first)) * 100 : 0;

  const trendClass =
    Math.abs(deltaPct) < 1 ? 'text-muted-foreground' : delta > 0 ? 'text-primary' : 'text-destructive';

  const strokeColor = 'currentColor';
  const fillId = `spark-fill-${gid}`;

  // Find nearest point index for a given x position relative to the SVG.
  const nearestIdx = (relX: number) => {
    const i = Math.round(relX / step);
    return Math.max(0, Math.min(values.length - 1, i));
  };

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const idx = nearestIdx(relX);
    setHover({ idx, x: points[idx][0], y: points[idx][1] });
  };

  const tooltipValue = hover !== null ? values[hover.idx] : null;
  const tooltipLabel = hover !== null ? pointLabel(hover.idx, values.length) : '';
  const tooltipText =
    tooltipValue !== null
      ? `${tooltipLabel}: ${tooltipValue.toFixed(decimals)}${unit}`
      : '';

  return (
    <div
      ref={wrapRef}
      className={cn('inline-flex items-center gap-1.5 align-middle relative', trendClass, className)}
    >
      <svg
        width={width}
        height={height}
        className="overflow-visible shrink-0 cursor-crosshair"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${fillId})`} />
        <path d={path} fill="none" stroke={strokeColor} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        {showEndDot && !hover && (
          <circle cx={lastPoint[0]} cy={lastPoint[1]} r="1.75" fill={strokeColor} />
        )}
        {hover && (
          <>
            <line
              x1={hover.x}
              y1={0}
              x2={hover.x}
              y2={height}
              stroke={strokeColor}
              strokeOpacity="0.35"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle cx={hover.x} cy={hover.y} r="2.5" fill={strokeColor} stroke="hsl(var(--background))" strokeWidth="1.25" />
          </>
        )}
      </svg>
      {hover && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-full rounded-md border border-border/60 bg-popover px-2 py-1 text-[10px] font-medium text-popover-foreground shadow-md whitespace-nowrap"
          style={{ left: hover.x, top: -4 }}
        >
          {tooltipText}
        </div>
      )}
      {showDelta && (
        <span className="text-[10px] font-medium tabular-nums leading-none">
          {delta > 0 ? '▲' : delta < 0 ? '▼' : '•'}{Math.abs(deltaPct).toFixed(0)}%
        </span>
      )}
    </div>
  );
}
