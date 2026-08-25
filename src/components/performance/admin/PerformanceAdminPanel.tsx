import React, { useState, useSyncExternalStore } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Star, ListChecks, CalendarDays, Plus, Pencil, Trash2, RotateCcw, AlertTriangle, Gift } from 'lucide-react';
import {
  performanceConfigStore,
  RatingScale,
  Competency,
  ReviewCycleConfig,
  reviewCycleStageLabels,
  totalWeight,
} from '@/lib/performanceConfigStore';
import { RatingScaleDrawer } from './RatingScaleDrawer';
import { CompetencyDrawer } from './CompetencyDrawer';
import { ReviewCycleDrawer } from './ReviewCycleDrawer';
import { RewardsAdminPanel } from './RewardsAdminPanel';

import { toast } from 'sonner';

function useConfig() {
  return useSyncExternalStore(
    cb => performanceConfigStore.subscribe(cb),
    () => performanceConfigStore.get(),
    () => performanceConfigStore.get(),
  );
}

const fmt = (d?: string) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

interface PerformanceAdminPanelProps {
  embedded?: boolean;
}

export function PerformanceAdminPanel({ embedded = false }: PerformanceAdminPanelProps) {
  const config = useConfig();
  const [scaleDrawer, setScaleDrawer] = useState<{ open: boolean; scale: RatingScale | null }>({ open: false, scale: null });
  const [compDrawer, setCompDrawer] = useState<{ open: boolean; competency: Competency | null }>({ open: false, competency: null });
  const [cycleDrawer, setCycleDrawer] = useState<{ open: boolean; cycle: ReviewCycleConfig | null }>({ open: false, cycle: null });

  const coreWeight = config.competencies.filter(c => c.isActive).reduce((s, c) => s + c.weight, 0);

  const deleteScale = (id: string) => {
    try {
      performanceConfigStore.deleteRatingScale(id);
      toast.success('Rating scale deleted');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        {!embedded && (
          <div>
          <h2 className="text-lg font-semibold tracking-tight">Performance configuration</h2>
          <p className="text-sm text-muted-foreground">
            Tenant-level setup for how performance is measured: rating scales, the competency library and the review-cycle calendar.
          </p>
        </div>
        )}
        <Button variant="outline" size="sm" onClick={() => { performanceConfigStore.reset(); toast.success('Configuration reset to defaults'); }}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset to defaults
        </Button>
      </div>

      <Tabs defaultValue="scales">
        <TabsList>
          <TabsTrigger value="scales" className="gap-1.5"><Star className="h-3.5 w-3.5" /> Rating scales</TabsTrigger>
          <TabsTrigger value="competencies" className="gap-1.5"><ListChecks className="h-3.5 w-3.5" /> Competency library</TabsTrigger>
          <TabsTrigger value="cycles" className="gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Review cycles</TabsTrigger>
          <TabsTrigger value="rewards" className="gap-1.5"><Gift className="h-3.5 w-3.5" /> Rewards &amp; recognition</TabsTrigger>

        </TabsList>

        {/* Rating scales */}
        <TabsContent value="scales" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setScaleDrawer({ open: true, scale: null })}><Plus className="h-3.5 w-3.5 mr-1.5" /> New scale</Button>
          </div>
          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scale</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Applies to</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.ratingScales.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.description}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.points.length} points · {s.points[0]?.label} → {s.points[s.points.length - 1]?.label}
                    </TableCell>
                    <TableCell className="text-sm capitalize">{s.appliesTo === 'both' ? 'Reviews & goals' : s.appliesTo}</TableCell>
                    <TableCell className="space-x-1">
                      {s.isDefault && <Badge variant="secondary">Default</Badge>}
                      <Badge variant={s.isActive ? 'outline' : 'destructive'}>{s.isActive ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" aria-label="Edit scale" onClick={() => setScaleDrawer({ open: true, scale: s })}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Delete scale" onClick={() => deleteScale(s.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Competencies */}
        <TabsContent value="competencies" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant={coreWeight === 100 ? 'secondary' : 'destructive'} className="gap-1">
              {coreWeight !== 100 && <AlertTriangle className="h-3 w-3" />} Active weight {coreWeight}%
            </Badge>
            <Button size="sm" onClick={() => setCompDrawer({ open: true, competency: null })}><Plus className="h-3.5 w-3.5 mr-1.5" /> New competency</Button>
          </div>
          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competency</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-20">Weight</TableHead>
                  <TableHead>Anchors</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.competencies.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.description}</div>
                    </TableCell>
                    <TableCell className="text-sm">{c.category}</TableCell>
                    <TableCell className="text-sm">{c.weight}%</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.anchors.length ? c.anchors.join(' · ') : '—'}</TableCell>
                    <TableCell><Badge variant={c.isActive ? 'outline' : 'destructive'}>{c.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" aria-label="Edit competency" onClick={() => setCompDrawer({ open: true, competency: c })}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Delete competency" onClick={() => { performanceConfigStore.deleteCompetency(c.id); toast.success('Competency deleted'); }}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Review cycles */}
        <TabsContent value="cycles" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCycleDrawer({ open: true, cycle: null })}><Plus className="h-3.5 w-3.5 mr-1.5" /> New cycle</Button>
          </div>
          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Self due</TableHead>
                  <TableHead>Manager due</TableHead>
                  <TableHead>Scale</TableHead>
                  <TableHead>Competencies</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.reviewCycles.map(c => {
                  const w = totalWeight(config.competencies, c.competencyIds);
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{c.cycle.replace('_', '-')}</div>
                      </TableCell>
                      <TableCell className="text-sm">{fmt(c.periodStart)} – {fmt(c.periodEnd)}</TableCell>
                      <TableCell className="text-sm">{fmt(c.selfReviewDue)}</TableCell>
                      <TableCell className="text-sm">{fmt(c.managerReviewDue)}</TableCell>
                      <TableCell className="text-sm">{config.ratingScales.find(s => s.id === c.ratingScaleId)?.name ?? '—'}</TableCell>
                      <TableCell className="text-sm">
                        {c.competencyIds.length} <span className={w === 100 ? 'text-muted-foreground' : 'text-destructive'}>({w}%)</span>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{reviewCycleStageLabels[c.stage]}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" aria-label="Edit cycle" onClick={() => setCycleDrawer({ open: true, cycle: c })}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" aria-label="Delete cycle" onClick={() => { performanceConfigStore.deleteReviewCycle(c.id); toast.success('Review cycle deleted'); }}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <RatingScaleDrawer open={scaleDrawer.open} scale={scaleDrawer.scale} onClose={() => setScaleDrawer({ open: false, scale: null })} />
      <CompetencyDrawer open={compDrawer.open} competency={compDrawer.competency} onClose={() => setCompDrawer({ open: false, competency: null })} />
      <ReviewCycleDrawer open={cycleDrawer.open} cycle={cycleDrawer.cycle} onClose={() => setCycleDrawer({ open: false, cycle: null })} />
    </div>
  );
}
