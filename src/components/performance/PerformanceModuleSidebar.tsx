import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Search, TrendingUp, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  performanceTabGroups,
  findPerformanceGroup,
} from '@/components/performance/performanceNavConfig';

interface PerformanceModuleSidebarProps {
  activeTab: string;
  onChange: (tab: string) => void;
  /** Optional per-tab counters shown as a trailing pill. */
  counts?: Record<string, number>;
}

/**
 * Secondary navigation column for the Performance module.
 * Mirrors the Employee Portal sidebar pattern: grouped, collapsible, searchable.
 */
export function PerformanceModuleSidebar({
  activeTab,
  onChange,
  counts = {},
}: PerformanceModuleSidebarProps) {
  const [query, setQuery] = useState('');
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const g = findPerformanceGroup(activeTab);
    return new Set(g ? [g.id] : ['development']);
  });

  // Keep the group holding the active tab expanded (e.g. after cross-tab navigation).
  useEffect(() => {
    const g = findPerformanceGroup(activeTab);
    if (!g) return;
    setOpenGroups((prev) => (prev.has(g.id) ? prev : new Set([...prev, g.id])));
  }, [activeTab]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return performanceTabGroups;
    return performanceTabGroups
      .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [query]);

  const searching = query.trim().length > 0;

  return (
    <aside className="hidden lg:flex h-screen sticky top-0 w-60 shrink-0 flex-col border-r border-border bg-card">
      {/* Module brand */}
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">Performance</p>
            <p className="-mt-0.5 text-[10px] text-muted-foreground">Grow, review, recognise</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a section"
            className="h-8 pl-8 pr-7 text-[13px]"
          />
          {searching && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {groups.map((g) => {
            const isOpen = searching || openGroups.has(g.id);
            const containsActive = g.items.some((i) => i.value === activeTab);

            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(g.id)}
                  aria-expanded={isOpen}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                    'text-foreground/75 hover:bg-accent hover:text-foreground',
                    containsActive && 'bg-primary/10 text-primary font-medium',
                  )}
                >
                  <g.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{g.label}</span>
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                  )}
                </button>

                {isOpen && (
                  <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-border/60 pl-3">
                    {g.items.map((item) => {
                      const active = activeTab === item.value;
                      const count = counts[item.value];
                      return (
                        <li key={item.value}>
                          <button
                            type="button"
                            onClick={() => onChange(item.value)}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-[13px] transition-colors',
                              active
                                ? 'bg-primary/10 font-medium text-primary'
                                : 'text-foreground/70 hover:bg-accent hover:text-foreground',
                            )}
                          >
                            <item.icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="flex-1 truncate text-left">{item.label}</span>
                            {typeof count === 'number' && count > 0 && (
                              <span
                                className={cn(
                                  'rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums',
                                  active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                                )}
                              >
                                {count}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
          {groups.length === 0 && (
            <li className="px-3 py-6 text-center text-xs text-muted-foreground">
              No sections match “{query}”.
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}
