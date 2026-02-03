import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, ChevronDown, ChevronRight, Calendar, DollarSign, Target, Users, FileText, Database, Workflow, BookOpen, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { rosterSRS } from '@/data/srs/rosterSRS';
import { awardsSRS } from '@/data/srs/awardsSRS';
import { performanceSRS } from '@/data/srs/performanceSRS';
import { demandSRS } from '@/data/srs/demandSRS';

const SRSDocumentation = () => {
  const navigate = useNavigate();
  const [expandedStories, setExpandedStories] = useState<string[]>([]);

  const toggleStory = (id: string) => {
    setExpandedStories(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const modules = [
    { id: 'roster', name: 'Roster', icon: <Calendar className="h-4 w-4" />, data: rosterSRS },
    { id: 'demand', name: 'Demand', icon: <TrendingUp className="h-4 w-4" />, data: demandSRS },
    { id: 'awards', name: 'Awards', icon: <DollarSign className="h-4 w-4" />, data: awardsSRS },
    { id: 'performance', name: 'Performance', icon: <Target className="h-4 w-4" />, data: performanceSRS },
  ];

  const renderModule = (srs: typeof rosterSRS) => (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />Overview</CardTitle>
          <CardDescription>Version {srs.version} • Updated {srs.lastUpdated}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{srs.overview}</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Objectives</h4>
              <ul className="text-sm space-y-1">{srs.objectives.map((o, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{o}</li>)}</ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Scope</h4>
              <ul className="text-sm space-y-1">{srs.scope.slice(0, 8).map((s, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{s}</li>)}</ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actors */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Actors</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {srs.actors.map((actor, i) => (
              <div key={i} className="border rounded-lg p-3">
                <h4 className="font-semibold">{actor.name}</h4>
                <p className="text-xs text-muted-foreground mb-2">{actor.description}</p>
                <div className="flex flex-wrap gap-1">{actor.permissions.slice(0, 3).map((p, j) => <Badge key={j} variant="outline" className="text-xs">{p.slice(0, 25)}{p.length > 25 ? '...' : ''}</Badge>)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Stories */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Workflow className="h-5 w-5" />User Stories ({srs.userStories.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {srs.userStories.map((story) => (
            <Collapsible key={story.id} open={expandedStories.includes(story.id)} onOpenChange={() => toggleStory(story.id)}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3 text-left">
                    <Badge variant={story.priority === 'critical' ? 'destructive' : story.priority === 'high' ? 'default' : 'secondary'}>{story.priority}</Badge>
                    <div><span className="font-mono text-xs text-muted-foreground">{story.id}</span><h4 className="font-semibold">{story.title}</h4></div>
                  </div>
                  {expandedStories.includes(story.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-4 border rounded-lg bg-muted/30 space-y-4">
                  <div><h5 className="font-semibold text-sm">Actors</h5><div className="flex gap-2 mt-1">{story.actors.map(a => <Badge key={a} variant="outline">{a}</Badge>)}</div></div>
                  <div><h5 className="font-semibold text-sm">Description</h5><p className="text-sm text-muted-foreground">{story.description}</p></div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><h5 className="font-semibold text-sm">Acceptance Criteria</h5><ul className="text-sm mt-1 space-y-1">{story.acceptanceCriteria.map((c, i) => <li key={i}>✓ {c}</li>)}</ul></div>
                    <div><h5 className="font-semibold text-sm">Business Logic</h5><ul className="text-sm mt-1 space-y-1">{story.businessLogic.map((b, i) => <li key={i}>• {b}</li>)}</ul></div>
                  </div>
                  <div><h5 className="font-semibold text-sm">End-to-End Journey</h5><ol className="text-sm mt-1 space-y-1">{story.endToEndJourney.map((step, i) => <li key={i} className="text-muted-foreground">{step}</li>)}</ol></div>
                  <div className="bg-background p-3 rounded border">
                    <h5 className="font-semibold text-sm">Real-World Example</h5>
                    <p className="text-sm font-medium mt-1">{story.realWorldExample.scenario}</p>
                    <ol className="text-sm mt-2 space-y-1">{story.realWorldExample.steps.map((s, i) => <li key={i}>{i + 1}. {s}</li>)}</ol>
                    <p className="text-sm mt-2 text-primary font-medium">Outcome: {story.realWorldExample.outcome}</p>
                  </div>
                  <div><h5 className="font-semibold text-sm">Related Modules</h5><div className="flex flex-wrap gap-2 mt-1">{story.relatedModules.map((r, i) => <Badge key={i} variant="secondary">{r.module}: {r.relationship}</Badge>)}</div></div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>

      {/* Table Specifications */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Table Specifications ({srs.tableSpecs.length})</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {srs.tableSpecs.map((table, i) => (
            <Collapsible key={i}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="text-left"><span className="font-mono text-xs text-muted-foreground">{table.schema}.</span><span className="font-semibold">{table.name}</span><p className="text-xs text-muted-foreground">{table.description}</p></div>
                  <Badge>{table.fields.length} fields</Badge>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader><TableRow><TableHead>Field</TableHead><TableHead>Type</TableHead><TableHead>Required</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {table.fields.map((f, j) => (
                        <TableRow key={j}>
                          <TableCell className="font-mono text-xs">{f.name}</TableCell>
                          <TableCell className="font-mono text-xs">{f.type}</TableCell>
                          <TableCell>{f.mandatory ? <Badge variant="destructive" className="text-xs">Required</Badge> : <Badge variant="outline" className="text-xs">Optional</Badge>}</TableCell>
                          <TableCell className="text-xs">{f.description}{f.foreignKey && <span className="text-primary ml-1">→ {f.foreignKey}</span>}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>

      {/* Business Rules */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Business Rules ({srs.businessRules.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead className="w-24">ID</TableHead><TableHead>Rule</TableHead><TableHead>Rationale</TableHead></TableRow></TableHeader>
            <TableBody>
              {srs.businessRules.map((rule, i) => (
                <TableRow key={i}><TableCell className="font-mono text-xs">{rule.id}</TableCell><TableCell className="text-sm">{rule.rule}</TableCell><TableCell className="text-sm text-muted-foreground">{rule.rationale}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><FileText className="h-6 w-6 text-primary" /></div>
              <div>
                <h1 className="text-xl font-bold">Software Requirements Specification</h1>
                <p className="text-sm text-muted-foreground">Roster • Demand • Awards • Performance Modules</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="roster" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            {modules.map(m => (
              <TabsTrigger key={m.id} value={m.id} className="flex items-center gap-2">{m.icon}{m.name}</TabsTrigger>
            ))}
          </TabsList>
          {modules.map(m => (
            <TabsContent key={m.id} value={m.id}>
              <ScrollArea className="h-[calc(100vh-180px)]">{renderModule(m.data)}</ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default SRSDocumentation;
