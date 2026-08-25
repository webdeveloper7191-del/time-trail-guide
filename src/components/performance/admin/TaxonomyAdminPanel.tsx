import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { performanceTaxonomyStore, taxonomyMeta, TaxonomyKey } from '@/lib/performanceTaxonomyStore';
import { TaxonomyListEditor } from './TaxonomyListEditor';

function useTaxonomy() {
  return useSyncExternalStore(
    cb => performanceTaxonomyStore.subscribe(cb),
    () => performanceTaxonomyStore.get(),
    () => performanceTaxonomyStore.get(),
  );
}

export function TaxonomyAdminPanel() {
  const state = useTaxonomy();
  const [selected, setSelected] = useState<TaxonomyKey>('goalCategories');

  const groups = useMemo(() => {
    const map = new Map<string, typeof taxonomyMeta>();
    taxonomyMeta.forEach(m => {
      map.set(m.group, [...(map.get(m.group) ?? []), m]);
    });
    return Array.from(map.entries());
  }, []);

  const meta = taxonomyMeta.find(m => m.key === selected)!;

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <Card className="p-2 h-fit">
        <nav className="space-y-3">
          {groups.map(([group, items]) => (
            <div key={group}>
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group}</div>
              <div className="space-y-0.5">
                {items.map(item => {
                  const count = (state.taxonomies[item.key] ?? []).filter(o => o.isActive).length;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setSelected(item.key)}
                      className={cn(
                        'w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-left transition-colors',
                        selected === item.key ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-muted',
                      )}
                    >
                      <span className="truncate">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </Card>

      <TaxonomyListEditor key={selected} meta={meta} options={state.taxonomies[selected] ?? []} />
    </div>
  );
}
