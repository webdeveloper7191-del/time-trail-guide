/**
 * Generic list shell used by every Master Data section.
 * Provides: search, active/archived toggle, add button, and a slot for a
 * caller-supplied edit sheet. Individual masters (Positions, Employment Types)
 * plug their columns + edit form into this shell.
 */
import { ReactNode, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, History } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MasterItem, MasterColumn } from '@/lib/masterData/types';

interface Props<T extends MasterItem> {
  title: string;
  description: string;
  items: T[];
  columns: MasterColumn<T>[];
  onAdd: () => void;
  onRowClick: (item: T) => void;
  onShowAudit: () => void;
  renderActions?: (item: T) => ReactNode;
}

export function MasterListShell<T extends MasterItem>({
  title, description, items, columns, onAdd, onRowClick, onShowAudit, renderActions,
}: Props<T>) {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'active' | 'archived'>('active');

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return items
      .filter(i => (tab === 'active' ? i.status === 'active' : i.status === 'archived'))
      .filter(i => !ql || i.label.toLowerCase().includes(ql) || i.code.toLowerCase().includes(ql));
  }, [items, q, tab]);

  const activeCount = items.filter(i => i.status === 'active').length;
  const archivedCount = items.filter(i => i.status === 'archived').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="tracking-tight">{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onShowAudit}>
            <History className="h-4 w-4 mr-1.5" /> Audit log
          </Button>
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4 mr-1.5" /> Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" className="pl-8" />
          </div>
          <Tabs value={tab} onValueChange={v => setTab(v as 'active' | 'archived')}>
            <TabsList>
              <TabsTrigger value="active">Active <Badge variant="secondary" className="ml-1.5">{activeCount}</Badge></TabsTrigger>
              <TabsTrigger value="archived">Archived <Badge variant="secondary" className="ml-1.5">{archivedCount}</Badge></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(c => (
                  <TableHead key={c.key} className={c.className}>{c.header}</TableHead>
                ))}
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground py-8">
                    No entries.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(item => (
                <TableRow key={item.id} className="cursor-pointer" onClick={() => onRowClick(item)}>
                  {columns.map(c => (
                    <TableCell key={c.key} className={c.className}>{c.render(item)}</TableCell>
                  ))}
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    {renderActions?.(item)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
