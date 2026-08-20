import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ArrowLeft, Search, Printer, Fingerprint, ShieldCheck, CheckSquare, CalendarClock,
  Coffee, AlertCircle, Scale, Workflow, BookOpen, GitBranch, Lightbulb, Link2, AlertTriangle,
} from 'lucide-react';
import {
  timesheetSettingsLogic,
  policyResolutionNotes,
  lifecycleStages,
  conflictMatrix,
  type SettingLogicItem,
} from '@/data/docs/timesheetSettingsLogic';

const ICONS: Record<string, React.ElementType> = {
  Fingerprint, ShieldCheck, CheckSquare, CalendarClock, Coffee, AlertCircle, Scale, Workflow,
};

function matches(item: SettingLogicItem, q: string) {
  if (!q) return true;
  const hay = [
    item.key, item.label, item.purpose, item.type, item.defaultValue,
    ...(item.options ?? []), ...item.logic,
    ...(item.interactions ?? []), ...(item.edgeCases ?? []), item.example ?? '',
  ].join(' ').toLowerCase();
  return hay.includes(q.toLowerCase());
}

function ItemBlock({ item }: { item: SettingLogicItem }) {
  return (
    <div className="rounded-md border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold tracking-tight">{item.label}</h4>
          <code className="text-[11px] text-muted-foreground">{item.key}</code>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px] font-normal">{item.type}</Badge>
          <Badge variant="outline" className="text-[10px] font-normal">Default: {item.defaultValue}</Badge>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{item.purpose}</p>

      {item.options && (
        <div className="flex flex-wrap gap-1.5">
          {item.options.map((o) => (
            <span key={o} className="rounded border px-1.5 py-0.5 text-[11px] text-muted-foreground">{o}</span>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Business logic</p>
        <ol className="space-y-1.5">
          {item.logic.map((l, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="mt-0.5 text-[11px] font-mono text-muted-foreground shrink-0">{i + 1}.</span>
              <span>{l}</span>
            </li>
          ))}
        </ol>
      </div>

      {item.interactions && item.interactions.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <Link2 className="h-3 w-3" /> Depends on / affects
          </p>
          <ul className="space-y-1">
            {item.interactions.map((x, i) => (
              <li key={i} className="text-sm text-muted-foreground">• {x}</li>
            ))}
          </ul>
        </div>
      )}

      {item.edgeCases && item.edgeCases.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" /> Edge cases & guardrails
          </p>
          <ul className="space-y-1">
            {item.edgeCases.map((x, i) => (
              <li key={i} className="text-sm text-muted-foreground">• {x}</li>
            ))}
          </ul>
        </div>
      )}

      {item.example && (
        <div className="rounded-md bg-muted/60 p-3 text-sm">
          <span className="font-medium">Example: </span>
          <span className="text-muted-foreground">{item.example}</span>
        </div>
      )}
    </div>
  );
}

export default function TimesheetSettingsLogicDocs() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const sections = useMemo(() => {
    if (!query) return timesheetSettingsLogic;
    return timesheetSettingsLogic
      .map((s) => ({
        ...s,
        groups: s.groups
          .map((g) => ({ ...g, items: g.items.filter((i) => matches(i, query)) }))
          .filter((g) => g.items.length > 0),
      }))
      .filter((s) => s.groups.length > 0);
  }, [query]);

  const totalItems = timesheetSettingsLogic.reduce(
    (n, s) => n + s.groups.reduce((m, g) => m + g.items.length, 0), 0,
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
        <div className="max-w-5xl mx-auto px-6 py-3 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/settings')}>
            <ArrowLeft className="h-4 w-4" /> Settings
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold tracking-tight">Timesheet Settings — Business Logic</h1>
            <p className="text-xs text-muted-foreground">{totalItems} configurable rules across {timesheetSettingsLogic.length} sections</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search rules…"
                className="h-8 w-56 pl-8 text-sm"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print / PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Lifecycle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 tracking-tight text-base">
              <GitBranch className="h-4 w-4 text-primary" /> Timesheet lifecycle
            </CardTitle>
            <CardDescription>Where each group of settings is evaluated, from punch to payroll.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            {lifecycleStages.map((s) => (
              <div key={s.stage} className="rounded-md border p-3">
                <p className="text-sm font-medium tracking-tight">{s.stage}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Resolution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 tracking-tight text-base">
              <BookOpen className="h-4 w-4 text-primary" /> {policyResolutionNotes.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {policyResolutionNotes.points.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm"><span className="text-primary">•</span><span>{p}</span></li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Sections */}
        {sections.map((section) => {
          const Icon = ICONS[section.icon] ?? BookOpen;
          return (
            <Card key={section.id} id={section.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 tracking-tight text-base">
                  <Icon className="h-4 w-4 text-primary" /> {section.title}
                </CardTitle>
                <CardDescription>{section.summary}</CardDescription>
                <p className="text-xs text-muted-foreground pt-1">
                  <span className="font-medium text-foreground">When it runs: </span>{section.evaluationPoint}
                </p>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" defaultValue={query ? section.groups.map((g) => g.id) : []}>
                  {section.groups.map((group) => (
                    <AccordionItem key={group.id} value={group.id}>
                      <AccordionTrigger className="text-sm hover:no-underline">
                        <span className="flex items-center gap-2 text-left">
                          {group.title}
                          <Badge variant="secondary" className="text-[10px] font-normal">{group.items.length}</Badge>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p className="text-xs text-muted-foreground">{group.summary}</p>
                        {group.items.map((item) => <ItemBlock key={item.key} item={item} />)}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          );
        })}

        {sections.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">No rules match “{query}”.</p>
        )}

        {/* Conflicts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 tracking-tight text-base">
              <Lightbulb className="h-4 w-4 text-primary" /> Rule interaction & conflict matrix
            </CardTitle>
            <CardDescription>Combinations that commonly surprise people, and how the system resolves them.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[26%]">Rule</TableHead>
                  <TableHead className="w-[26%]">Interacts with</TableHead>
                  <TableHead>Resolution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conflictMatrix.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm font-medium align-top">{c.rule}</TableCell>
                    <TableCell className="text-sm align-top">{c.conflictsWith}</TableCell>
                    <TableCell className="text-sm text-muted-foreground align-top">{c.resolution}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
