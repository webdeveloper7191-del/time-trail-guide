import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Filter, Search, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { buildRtm, summariseRtm, RtmRow } from '@/lib/rtmBuilder';
import { exportRtmToPdf, exportRtmToCsv } from '@/lib/rtmExport';

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
                              <Badge variant={coverageVariant(r.coverage)} className="text-[10px] uppercase">
                                {r.coverage}
                              </Badge>
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
    </div>
  );
};

export default RequirementsTraceabilityMatrix;
