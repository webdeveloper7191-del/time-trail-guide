import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Centre, OpenShift } from '@/types/roster';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MapPin, Check } from 'lucide-react';

interface VirtualizedLocationListProps {
  centres: Centre[];
  searchQuery: string;
  isAllLocationsView: boolean;
  activeCentreIds: string[];
  selectedCentreId: string;
  openShifts: OpenShift[];
  onToggleCentre: (centreId: string) => void;
}

export function VirtualizedLocationList({
  centres,
  searchQuery,
  isAllLocationsView,
  activeCentreIds,
  selectedCentreId,
  openShifts,
  onToggleCentre,
}: VirtualizedLocationListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return centres;
    const q = searchQuery.toLowerCase();
    return centres.filter(c => c.name.toLowerCase().includes(q));
  }, [centres, searchQuery]);

  // Pre-compute open shift counts
  const openCountMap = useMemo(() => {
    const map = new Map<string, number>();
    openShifts.forEach(os => {
      map.set(os.centreId, (map.get(os.centreId) || 0) + 1);
    });
    return map;
  }, [openShifts]);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 10,
  });

  if (filtered.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">No locations found</p>
    );
  }

  return (
    <div ref={parentRef} className="max-h-64 overflow-auto">
      <div
        style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => {
          const centre = filtered[virtualRow.index];
          const isActive = isAllLocationsView
            ? activeCentreIds.includes(centre.id)
            : selectedCentreId === centre.id;
          const openCount = openCountMap.get(centre.id) || 0;

          return (
            <div
              key={centre.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="px-1"
            >
              <button
                onClick={() => onToggleCentre(centre.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors',
                  isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                  isActive ? 'bg-primary border-primary' : 'border-border'
                )}>
                  {isActive && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                <MapPin className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                <span className="truncate flex-1 text-left">{centre.name}</span>
                {openCount > 0 && (
                  <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5">
                    {openCount}
                  </Badge>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
