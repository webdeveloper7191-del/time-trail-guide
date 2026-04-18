import { useEffect, useMemo, useState, ReactNode } from 'react';
import { LineChart } from 'lucide-react';
import { StatCard } from './ReportWidgets';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STORAGE_NS = 'reports.v1';

/** A single KPI tile config that is rendered as a StatCard. */
export interface KpiTileConfig {
  /** Stable id used for picker persistence + matching to a trend source. */
  key: string;
  label: string;
  value: string | number;
  icon?: React.ElementType;
  subtitle?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  /**
   * Optional trend array for THIS tile. When provided, this tile is
   * available in the trend picker and will render its sparkline when chosen.
   */
  trend?: number[];
  trendLabel?: string;
}

interface KpiSparklineRowProps {
  /** Persistence key — usually the report id. */
  reportId: string;
  tiles: KpiTileConfig[];
  /** Tailwind grid override (default: 6 cols on lg). */
  className?: string;
  /** Optional title shown next to the picker. */
  title?: string;
  rightSlot?: ReactNode;
}

function loadPickedKey(reportId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`${STORAGE_NS}.${reportId}.kpiSparkline`);
}

function savePickedKey(reportId: string, key: string | null) {
  if (typeof window === 'undefined') return;
  if (key === null) localStorage.removeItem(`${STORAGE_NS}.${reportId}.kpiSparkline`);
  else localStorage.setItem(`${STORAGE_NS}.${reportId}.kpiSparkline`, key);
}

/**
 * Renders a row of compact StatCards. The tiles that include a `trend` array
 * become "chooseable" in the small Trend picker; the user's choice persists
 * per report and drives the sparkline shown on that tile.
 */
export function KpiSparklineRow({ reportId, tiles, className, title, rightSlot }: KpiSparklineRowProps) {
  const trendableTiles = useMemo(
    () => tiles.filter(t => t.trend && t.trend.length > 0),
    [tiles]
  );

  const [pickedKey, setPickedKey] = useState<string | null>(() => {
    const stored = loadPickedKey(reportId);
    if (stored && trendableTiles.some(t => t.key === stored)) return stored;
    return trendableTiles[0]?.key ?? null;
  });

  useEffect(() => {
    savePickedKey(reportId, pickedKey);
  }, [pickedKey, reportId]);

  return (
    <div className="space-y-2">
      {(title || trendableTiles.length > 0 || rightSlot) && (
        <div className="flex items-center justify-between gap-2 px-0.5">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {title ?? 'Key metrics'}
          </div>
          <div className="flex items-center gap-2">
            {trendableTiles.length > 0 && (
              <SparklinePicker
                tiles={trendableTiles}
                pickedKey={pickedKey}
                onChange={setPickedKey}
              />
            )}
            {rightSlot}
          </div>
        </div>
      )}
      <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3', className)}>
        {tiles.map(tile => {
          const isPicked = tile.key === pickedKey && tile.trend && tile.trend.length > 0;
          return (
            <StatCard
              key={tile.key}
              label={tile.label}
              value={tile.value}
              icon={tile.icon}
              subtitle={tile.subtitle}
              variant={tile.variant}
              size="sm"
              sparklineData={isPicked ? tile.trend : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

function SparklinePicker({
  tiles, pickedKey, onChange,
}: {
  tiles: KpiTileConfig[];
  pickedKey: string | null;
  onChange: (key: string | null) => void;
}) {
  const picked = tiles.find(t => t.key === pickedKey);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[11px] px-2">
          <LineChart className="h-3 w-3" />
          Trend
          {picked && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-normal">
              {picked.label}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="end">
        <div className="px-3 py-2 border-b border-border/60">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Sparkline metric
          </span>
        </div>
        <div className="p-1">
          <button
            className={cn(
              'w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent flex items-center justify-between',
              pickedKey === null && 'bg-accent'
            )}
            onClick={() => onChange(null)}
          >
            <span className="text-muted-foreground">None</span>
            {pickedKey === null && <span className="text-[10px] text-primary">✓</span>}
          </button>
          {tiles.map(t => {
            const active = t.key === pickedKey;
            return (
              <button
                key={t.key}
                className={cn(
                  'w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent flex items-center justify-between gap-2',
                  active && 'bg-accent'
                )}
                onClick={() => onChange(t.key)}
              >
                <span className="truncate">{t.label}</span>
                {active && <span className="text-[10px] text-primary shrink-0">✓</span>}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
