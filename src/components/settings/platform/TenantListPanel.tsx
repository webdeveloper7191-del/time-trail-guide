import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  CheckCircle2,
  ImageOff,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PLANS } from '@/types/plans';
import { formatMoney, priceFor, annualDiscountFor } from '@/lib/billingStore';
import {
  Tenant,
  TenantStatus,
  TENANT_STATUS_LABEL,
  tenantStore,
  tenantRate,
  useTenants,
} from '@/lib/tenantStore';
import { TenantPricingPanel } from './TenantPricingPanel';

type SortKey = 'name' | 'contactName' | 'createdAt' | 'status';

const dateLabel = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const statusStyles: Record<TenantStatus, string> = {
  active: 'text-emerald-700 dark:text-emerald-400',
  inactive: 'text-muted-foreground',
  trial: 'text-amber-700 dark:text-amber-400',
  suspended: 'text-destructive',
};

export function TenantListPanel() {
  const tenants = useTenants();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenantStatus[]>([]);
  const [customOnly, setCustomOnly] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'createdAt',
    dir: 'desc',
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [pricingFor, setPricingFor] = useState<Tenant | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = tenants.filter(t => {
      if (statusFilter.length && !statusFilter.includes(t.status)) return false;
      if (customOnly && !t.customPricing) return false;
      if (!q) return true;
      return [t.name, t.contactName, t.contactPhone, t.contactEmail, t.state ?? '', ...t.tags]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => String(a[sort.key]).localeCompare(String(b[sort.key])) * dir);
  }, [tenants, query, statusFilter, customOnly, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * perPage, current * perPage);
  const allOnPage = rows.length > 0 && rows.every(r => selected.includes(r.id));

  const toggleSort = (key: SortKey) =>
    setSort(s => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  const toggleStatus = (s: TenantStatus) =>
    setStatusFilter(list => (list.includes(s) ? list.filter(x => x !== s) : [...list, s]));

  const addTenant = () => {
    tenantStore.add({
      name: 'New business',
      contactName: 'Primary contact',
      contactPhone: '',
      contactEmail: '',
      createdAt: new Date().toISOString().slice(0, 10),
      locations: null,
      staff: 0,
      tags: [],
      state: null,
      status: 'trial',
      plan: 'free',
      cycle: 'monthly',
      seats: 3,
    });
    setPage(1);
    toast.success('Business created');
  };

  const bulk = (patch: Partial<Tenant>, message: string) => {
    tenantStore.bulkUpdate(selected, patch);
    toast.success(`${message} · ${selected.length} tenants`);
    setSelected([]);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-10 rounded-lg"
            placeholder="Search by keywords"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 gap-1.5">
              <SlidersHorizontal className="h-4 w-4" /> Filter <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-popover">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            {(Object.keys(TENANT_STATUS_LABEL) as TenantStatus[]).map(s => (
              <DropdownMenuCheckboxItem
                key={s}
                checked={statusFilter.includes(s)}
                onCheckedChange={() => toggleStatus(s)}
              >
                {TENANT_STATUS_LABEL[s]}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={customOnly} onCheckedChange={v => setCustomOnly(!!v)}>
              Custom pricing only
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 gap-1.5" disabled={!selected.length}>
              Bulk Actions <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 bg-popover">
            <DropdownMenuItem onClick={() => bulk({ status: 'active' }, 'Activated')}>
              Mark active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => bulk({ status: 'inactive' }, 'Deactivated')}>
              Mark inactive
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => bulk({ status: 'suspended' }, 'Suspended')}>
              Suspend
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                tenantStore.remove(selected);
                toast.success(`${selected.length} tenants removed`);
                setSelected([]);
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto">
          <Button className="h-10 gap-1.5" onClick={addTenant}>
            <Plus className="h-4 w-4" /> Add New Business
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-x-auto bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="border-b border-border text-xs">
              <th className="w-10 px-3 py-3">
                <Checkbox
                  checked={allOnPage}
                  onCheckedChange={v =>
                    setSelected(prev =>
                      v
                        ? Array.from(new Set([...prev, ...rows.map(r => r.id)]))
                        : prev.filter(id => !rows.some(r => r.id === id)),
                    )
                  }
                />
              </th>
              <th className="text-left font-medium px-3 py-3">Logo</th>
              <th className="text-left font-medium px-3 py-3">
                <button className="inline-flex items-center gap-1" onClick={() => toggleSort('name')}>
                  Business Name <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="text-left font-medium px-3 py-3">
                <button
                  className="inline-flex items-center gap-1"
                  onClick={() => toggleSort('contactName')}
                >
                  Contact Person <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="text-left font-medium px-3 py-3">
                <button
                  className="inline-flex items-center gap-1"
                  onClick={() => toggleSort('createdAt')}
                >
                  Created Date <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="text-left font-medium px-3 py-3">Locations</th>
              <th className="text-left font-medium px-3 py-3">Plan &amp; rate</th>
              <th className="text-left font-medium px-3 py-3">Tags</th>
              <th className="text-left font-medium px-3 py-3">State</th>
              <th className="text-left font-medium px-3 py-3">
                <button
                  className="inline-flex items-center gap-1"
                  onClick={() => toggleSort('status')}
                >
                  Status <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="text-right font-medium px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(t => {
              const rate = tenantRate(t, priceFor(t.plan), annualDiscountFor(t.plan));
              const unit =
                t.cycle === 'annual'
                  ? Math.max(0, rate.monthly - rate.annualDiscount)
                  : rate.monthly;
              return (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-3">
                    <Checkbox
                      checked={selected.includes(t.id)}
                      onCheckedChange={v =>
                        setSelected(prev => (v ? [...prev, t.id] : prev.filter(id => id !== t.id)))
                      }
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                        <ImageOff className="h-4 w-4" />
                      </span>
                      No Logo
                    </div>
                  </td>
                  <td className="px-3 py-3 font-medium">{t.name}</td>
                  <td className="px-3 py-3">
                    <div>{t.contactName}</div>
                    <div className="text-xs text-muted-foreground">{t.contactPhone || '–'}</div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{dateLabel(t.createdAt)}</td>
                  <td className="px-3 py-3">{t.locations ?? '–'}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span>{PLANS[t.plan].label}</span>
                      {rate.custom && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Tag className="h-3 w-3" /> Custom
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatMoney(unit)} / user · {t.cycle} · {t.seats} seats
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {t.tags.length ? (
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {t.tags[0]}
                        </Badge>
                        {t.tags.length > 1 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{t.tags.length - 1}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </td>
                  <td className="px-3 py-3">{t.state ?? '–'}</td>
                  <td className="px-3 py-3">
                    <span className={cn('inline-flex items-center gap-1.5', statusStyles[t.status])}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {TENANT_STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 bg-popover">
                        <DropdownMenuItem onClick={() => setPricingFor(t)}>
                          Plan &amp; pricing
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            tenantStore.update(t.id, {
                              status: t.status === 'active' ? 'inactive' : 'active',
                            })
                          }
                        >
                          {t.status === 'active' ? 'Mark inactive' : 'Mark active'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => tenantStore.remove([t.id])}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={11} className="px-3 py-10 text-center text-muted-foreground">
                  No businesses match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          Showing {filtered.length ? (current - 1) * perPage + 1 : 0} – {Math.min(current * perPage, filtered.length)} of{' '}
          {filtered.length} records
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPage(1)} disabled={current === 1}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={current === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 text-xs text-muted-foreground">
            Page {current} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={current === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(totalPages)}
            disabled={current === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
        <Select
          value={String(perPage)}
          onValueChange={v => {
            setPerPage(Number(v));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 25, 50, 100].map(n => (
              <SelectItem key={n} value={String(n)}>
                {n} Per Page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TenantPricingPanel
        tenant={pricingFor}
        open={!!pricingFor}
        onClose={() => setPricingFor(null)}
      />
    </div>
  );
}
