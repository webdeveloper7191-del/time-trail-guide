import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Filter, Search, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { buildRtm, summariseRtm, RtmRow, RtmModule } from '@/lib/rtmBuilder';
import { exportRtmToPdf, exportRtmToCsv } from '@/lib/rtmExport';
import { exportRtmToExcel } from '@/lib/rtmExcelExport';

const coverageVariant = (c: RtmRow['coverage']) =>
  c === 'covered' ? 'default' : c === 'partial' ? 'secondary' : 'destructive';

const priorityVariant = (p: string) => {
  const pp = p.toLowerCase();
  if (pp === 'critical' || pp === 'must') return 'destructive';
  if (pp === 'high' || pp === 'should') return 'default';
  return 'secondary';
};

const RequirementsTraceabilityMatrix: React.FC = () => {
  const navigate = useNavigate();
  const modules = useMemo(() => buildRtm(), []);
  const summary = useMemo(() => summariseRtm(modules), [modules]);

  const [activeModule, setActiveModule] = useState(modules[0]?.id ?? 'roster');
  const [search, setSearch] = useState('');
  const [coverageFilter, setCoverageFilter] = useState<'all' | 'covered' | 'partial' | 'gap'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [drilldown, setDrilldown] = useState<{ row: RtmRow; module: RtmModule } | null>(null);

  const current = modules.find(m => m.id === activeModule) ?? modules[0];
  const currentSummary = summary.find(s => s.moduleId === activeModule);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return current.rows.filter(r => {
      if (coverageFilter !== 'all' && r.coverage !== coverageFilter) return false;
      if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;
      if (!q) return true;
      return (
        r.frId.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.requirement.toLowerCase().includes(q)
      );
    });
  }, [current, search, coverageFilter, priorityFilter]);

  const priorityOptions = useMemo(() => {
    const set = new Set<string>();
    current.rows.forEach(r => set.add(r.priority));
    return Array.from(set).sort();
  }, [current]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Requirements Traceability Matrix</h1>
                <p className="text-sm text-muted-foreground">
                  Cross-reference of functional requirements to user stories, tables, rules, APIs and workflows
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportRtmToCsv(modules)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportRtmToExcel(modules)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
            </Button>
            <Button size="sm" onClick={() => exportRtmToPdf(modules)}>
              <Download className="h-4 w-4 mr-2" /> Download PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {summary.map(s => (
            <Card
              key={s.moduleId}
              className={`cursor-pointer transition ${activeModule === s.moduleId ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveModule(s.moduleId)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{s.moduleName}</CardTitle>
                <CardDescription className="text-xs">{s.total} FRs</CardDescription>
              </CardHeader>
              <CardContent className="pb-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Coverage</span>
                  <span className="font-semibold">{s.coveragePct}%</span>
                </div>
                <Progress value={s.coveragePct} className="h-2" />
                <div className="flex gap-2 pt-1 text-[10px]">
                  <span className="text-green-600 font-medium">{s.covered}✓</span>
                  <span className="text-amber-600 font-medium">{s.partial}~</span>
                  <span className="text-red-600 font-medium">{s.gap}✗</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Notice */}
        <Card className="border-dashed">
          <CardContent className="pt-4 text-xs text-muted-foreground">
            <p>
              <strong>How links are derived.</strong> The SRS documents do not carry explicit FR→artefact
              references. This RTM auto-links each requirement to the top matching user stories, tables,
              business rules and (where applicable) API endpoints and workflows using keyword overlap on
              category and requirement text. Treat this as a draft for stakeholder review — refine or add
              explicit trace IDs in the SRS source as needed.
            </p>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by FR ID, category or requirement…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={coverageFilter} onValueChange={(v: any) => setCoverageFilter(v)}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Coverage" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All coverage</SelectItem>
                    <SelectItem value="covered">Covered</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="gap">Gap</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    {priorityOptions.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs text-muted-foreground ml-auto">
                Showing {filteredRows.length} of {current.rows.length}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs / Table */}
        <Tabs value={activeModule} onValueChange={setActiveModule}>
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            {modules.map(m => (
              <TabsTrigger key={m.id} value={m.id}>{m.name.split(' ')[0]}</TabsTrigger>
            ))}
          </TabsList>
          {modules.map(m => (
            <TabsContent key={m.id} value={m.id} className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{m.name}</CardTitle>
                      <CardDescription>v{m.version} · Updated {m.lastUpdated}</CardDescription>
                    </div>
                    {currentSummary && (
                      <div className="text-right">
                        <div className="text-2xl font-bold">{currentSummary.coveragePct}%</div>
                        <div className="text-xs text-muted-foreground">weighted coverage</div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[90px]">FR ID</TableHead>
                          <TableHead className="w-[120px]">Category</TableHead>
                          <TableHead>Requirement</TableHead>
                          <TableHead className="w-[80px]">Priority</TableHead>
                          <TableHead className="w-[80px]">Coverage</TableHead>
                          <TableHead className="w-[180px]">User Stories</TableHead>
                          <TableHead className="w-[180px]">Tables</TableHead>
                          <TableHead className="w-[180px]">Business Rules</TableHead>
                          <TableHead className="w-[180px]">APIs / Workflows</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRows.map(r => (
                          <TableRow key={r.frId}>
                            <TableCell className="font-mono text-xs text-primary">{r.frId}</TableCell>
                            <TableCell className="text-xs">{r.category}</TableCell>
                            <TableCell className="text-xs max-w-[380px]">{r.requirement}</TableCell>
                            <TableCell>
                              <Badge variant={priorityVariant(r.priority)} className="text-[10px] uppercase">
                                {r.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <button
                                type="button"
                                onClick={() => setDrilldown({ row: r, module: m })}
                                className="inline-flex focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
                                title="View trace details"
                              >
                                <Badge
                                  variant={coverageVariant(r.coverage)}
                                  className="text-[10px] uppercase cursor-pointer hover:opacity-80"
                                >
                                  {r.coverage}
                                </Badge>
                              </button>
                            </TableCell>
                            <TableCell className="text-[11px]">
                              {r.userStories.length
                                ? r.userStories.map(s => (
                                    <div key={s.id} className="whitespace-nowrap">
                                      <span className="font-mono text-muted-foreground">{s.id}</span>
                                    </div>
                                  ))
                                : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-[11px]">
                              {r.tables.length
                                ? r.tables.map(t => <div key={t.id} className="whitespace-nowrap font-mono">{t.label}</div>)
                                : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-[11px]">
                              {r.businessRules.length
                                ? r.businessRules.map(b => (
                                    <div key={b.id} className="whitespace-nowrap">
                                      <span className="font-mono text-muted-foreground">{b.id}</span>
                                    </div>
                                  ))
                                : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-[11px]">
                              {(r.apiEndpoints.length + r.workflows.length) === 0 ? (
                                <span className="text-muted-foreground">—</span>
                              ) : (
                                <>
                                  {r.apiEndpoints.map(a => (
                                    <div key={a.id} className="whitespace-nowrap font-mono">{a.label}</div>
                                  ))}
                                  {r.workflows.map(w => (
                                    <div key={w.id} className="whitespace-nowrap text-primary">{w.label}</div>
                                  ))}
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredRows.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                              No requirements match the current filters.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <CoverageDrilldown
        data={drilldown}
        onClose={() => setDrilldown(null)}
      />
    </div>
  );
};

// -------- Coverage Drilldown Panel --------

interface DrilldownProps {
  data: { row: RtmRow; module: RtmModule } | null;
  onClose: () => void;
}

interface Dimension {
  key: string;
  label: string;
  description: string;
  links: { id: string; label: string }[];
  expected: boolean;
  suggestion: string;
}

const CoverageDrilldown: React.FC<DrilldownProps> = ({ data, onClose }) => {
  const dims: Dimension[] = useMemo(() => {
    if (!data) return [];
    const { row, module: mod } = data;
    // A dimension is "expected" for this module if any row in the module has
    // at least one link of that dimension (i.e. the module supports it).
    const moduleHas = (getter: (r: RtmRow) => any[]) =>
      mod.rows.some(r => getter(r).length > 0);

    return [
      {
        key: 'userStories',
        label: 'User Stories',
        description: 'Behavioural traces — who does what and when.',
        links: row.userStories,
        expected: true,
        suggestion: 'Author or link a user story in the SRS with acceptance criteria that reference this requirement.',
      },
      {
        key: 'tables',
        label: 'Data Tables',
        description: 'Persistence layer that stores or reads the data implied by the requirement.',
        links: row.tables,
        expected: true,
        suggestion: 'Extend an existing table (or add a new one) whose fields carry the data called out by this requirement.',
      },
      {
        key: 'businessRules',
        label: 'Business Rules',
        description: 'Invariants, validations and derived logic that enforce the requirement at runtime.',
        links: row.businessRules,
        expected: true,
        suggestion: 'Add a business rule entry describing the invariant or validation this requirement demands.',
      },
      {
        key: 'apiEndpoints',
        label: 'API Endpoints',
        description: 'External HTTP contract exposing or consuming the capability.',
        links: row.apiEndpoints,
        expected: moduleHas(r => r.apiEndpoints),
        suggestion: 'Document the endpoint (method, path, request/response) that fulfils this requirement.',
      },
      {
        key: 'workflows',
        label: 'Workflows',
        description: 'End-to-end sequences that string services and actors together.',
        links: row.workflows,
        expected: moduleHas(r => r.workflows),
        suggestion: 'Add or extend a workflow diagram that shows this requirement as a step.',
      },
    ];
  }, [data]);

  if (!data) return null;
  const { row, module: mod } = data;

  const present = dims.filter(d => d.links.length > 0);
  const missingExpected = dims.filter(d => d.expected && d.links.length === 0);
  const notApplicable = dims.filter(d => !d.expected && d.links.length === 0);

  const coverageMeta = {
    covered: { icon: CheckCircle2, className: 'text-green-600', label: 'Well covered' },
    partial: { icon: AlertTriangle, className: 'text-amber-600', label: 'Partially covered' },
    gap: { icon: XCircle, className: 'text-red-600', label: 'Coverage gap' },
  }[row.coverage];
  const Icon = coverageMeta.icon;

  return (
    <Sheet open={!!data} onOpenChange={o => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>{mod.name}</span>
            <span>·</span>
            <span className="text-primary">{row.frId}</span>
          </div>
          <SheetTitle className="text-base leading-snug">{row.requirement}</SheetTitle>
          <SheetDescription className="flex items-center gap-2 pt-1">
            <Badge variant="outline" className="text-[10px] uppercase">{row.category}</Badge>
            <Badge variant={priorityVariant(row.priority)} className="text-[10px] uppercase">
              {row.priority}
            </Badge>
          </SheetDescription>
          <div className={`flex items-center gap-2 pt-3 text-sm font-medium ${coverageMeta.className}`}>
            <Icon className="h-5 w-5" />
            {coverageMeta.label}
            <span className="text-xs text-muted-foreground font-normal ml-1">
              · {present.length} of {dims.filter(d => d.expected).length} expected dimensions traced
            </span>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-6">
            {/* Missing (call to action) */}
            {missingExpected.length > 0 && (
              <section>
                <h3 className="text-xs uppercase tracking-wide text-red-600 font-semibold mb-2 flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5" /> Missing traces ({missingExpected.length})
                </h3>
                <div className="space-y-2">
                  {missingExpected.map(d => (
                    <div key={d.key} className="border border-red-200 bg-red-50/50 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-red-900">{d.label}</div>
                          <div className="text-xs text-red-800/80 mt-0.5">{d.description}</div>
                        </div>
                        <Badge variant="destructive" className="text-[10px] uppercase">Gap</Badge>
                      </div>
                      <div className="mt-2 text-xs text-red-900 flex items-start gap-1.5">
                        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>{d.suggestion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Present */}
            <section>
              <h3 className="text-xs uppercase tracking-wide text-green-700 font-semibold mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Present traces ({present.length})
              </h3>
              {present.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">
                  No linked artefacts detected for this requirement yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {present.map(d => (
                    <div key={d.key} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-sm font-semibold">{d.label}</div>
                          <div className="text-xs text-muted-foreground">{d.description}</div>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {d.links.length} linked
                        </Badge>
                      </div>
                      <ul className="space-y-1 mt-2">
                        {d.links.map(l => (
                          <li key={l.id} className="flex items-start gap-2 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-mono text-primary">{l.id}</span>
                              {l.label && l.label !== l.id && (
                                <span className="text-muted-foreground"> — {l.label}</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Not applicable */}
            {notApplicable.length > 0 && (
              <section>
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                  Not applicable to this module
                </h3>
                <div className="flex flex-wrap gap-2">
                  {notApplicable.map(d => (
                    <Badge key={d.key} variant="outline" className="text-[10px]">
                      {d.label}
                    </Badge>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  This SRS module does not currently define artefacts of these types, so they are
                  not counted against coverage.
                </p>
              </section>
            )}

            {/* Method note */}
            <section className="border-t pt-4">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                How this was derived
              </h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Links are inferred by keyword overlap between the requirement text/category and each
                candidate artefact's descriptive fields. A dimension is considered a gap only if it is
                expected for this module (i.e. at least one FR in the module links to that dimension)
                but produced zero matches for this requirement. Use this drilldown to validate
                automatic matches and to identify FRs that need explicit trace IDs added to the SRS
                source files.
              </p>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default RequirementsTraceabilityMatrix;
