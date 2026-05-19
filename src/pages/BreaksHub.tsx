import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, Coffee, Building2, CalendarClock, Info, Plus, Trash2 } from 'lucide-react';
import {
  australianJurisdictions,
  type AwardType,
} from '@/lib/australianJurisdiction';
import { defaultShiftTemplates, type ShiftTemplateBreakRule } from '@/types/roster';
import { mockLocations } from '@/data/mockLocationData';
import { toast } from 'sonner';

interface LocationBreakOverride {
  locationId: string;
  ruleId: string;
  name: string;
  breakDurationMinutes: number;
  minWorkHoursRequired: number;
  type: 'paid' | 'unpaid';
  isMandatory: boolean;
  enabled: boolean;
}

interface ShiftBreakOverrideState {
  templateId: string;
  rules: ShiftTemplateBreakRule[];
}

const awardOptions: { value: AwardType; label: string }[] = [
  { value: 'children_services', label: "Children's Services Award" },
  { value: 'healthcare', label: 'Health Professionals Award' },
  { value: 'hospitality', label: 'Hospitality Award' },
  { value: 'retail', label: 'Retail Award' },
  { value: 'general', label: 'General (NES baseline)' },
];

/**
 * Reusable breaks hub body — used both at /settings/breaks
 * and as the "Breaks" tab inside Awards Configuration.
 */
export function BreaksHubBody({ embedded = false }: { embedded?: boolean }) {
  const [selectedAward, setSelectedAward] = useState<AwardType>('children_services');
  const jurisdiction = australianJurisdictions[selectedAward];

  const [locationOverrides, setLocationOverrides] = useState<LocationBreakOverride[]>([]);
  const [shiftOverrides, setShiftOverrides] = useState<ShiftBreakOverrideState[]>(
    defaultShiftTemplates.map(t => ({
      templateId: t.id,
      rules: t.breakRules ?? [],
    }))
  );

  const locations = useMemo(() => mockLocations ?? [], []);

  const addLocationOverride = () => {
    const firstRule = jurisdiction.breakRules[0];
    if (!firstRule || locations.length === 0) return;
    setLocationOverrides(prev => [
      ...prev,
      {
        locationId: locations[0].id,
        ruleId: firstRule.id,
        name: firstRule.name,
        breakDurationMinutes: firstRule.breakDurationMinutes,
        minWorkHoursRequired: firstRule.minWorkHoursRequired,
        type: firstRule.type,
        isMandatory: firstRule.isMandatory,
        enabled: true,
      },
    ]);
  };

  const addShiftRule = (templateId: string) => {
    const newRule: ShiftTemplateBreakRule = {
      id: `br-${Date.now()}`,
      name: 'Break',
      minWorkHoursRequired: 5,
      breakDurationMinutes: 30,
      type: 'unpaid',
      isMandatory: true,
    };
    setShiftOverrides(prev =>
      prev.map(s => (s.templateId === templateId ? { ...s, rules: [...s.rules, newRule] } : s))
    );
  };

  const updateShiftRule = (templateId: string, idx: number, patch: Partial<ShiftTemplateBreakRule>) => {
    setShiftOverrides(prev =>
      prev.map(s => {
        if (s.templateId !== templateId) return s;
        const next = [...s.rules];
        next[idx] = { ...next[idx], ...patch };
        return { ...s, rules: next };
      })
    );
  };

  const removeShiftRule = (templateId: string, idx: number) => {
    setShiftOverrides(prev =>
      prev.map(s =>
        s.templateId === templateId ? { ...s, rules: s.rules.filter((_, i) => i !== idx) } : s
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Inheritance explainer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">Precedence: Shift override → Location override → Award default</p>
              <p className="text-muted-foreground">
                The most specific rule wins. Each layer uses the same granular structure
                (name · trigger hours · duration · paid/unpaid · mandatory) for consistency
                with the shift template editor. The roster compliance engine and timesheet
                validator read the resolved rule from this hub.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="award" className="space-y-4">
        <TabsList>
          <TabsTrigger value="award"><Coffee className="h-4 w-4 mr-2" />Award default</TabsTrigger>
          <TabsTrigger value="location"><Building2 className="h-4 w-4 mr-2" />Location override</TabsTrigger>
          <TabsTrigger value="shift"><CalendarClock className="h-4 w-4 mr-2" />Shift override</TabsTrigger>
        </TabsList>

        {/* AWARD DEFAULTS */}
        <TabsContent value="award" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Award default break rules</CardTitle>
              <CardDescription>
                Statutory baseline from the selected modern award.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-sm">
                <Label className="text-xs text-muted-foreground">Award</Label>
                <Select value={selectedAward} onValueChange={(v) => setSelectedAward(v as AwardType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {awardOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Break name</TableHead>
                    <TableHead>Triggered after</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Mandatory</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jurisdiction.breakRules.map(rule => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>{rule.minWorkHoursRequired}h worked</TableCell>
                      <TableCell>{rule.breakDurationMinutes} min</TableCell>
                      <TableCell>
                        <Badge variant={rule.type === 'paid' ? 'default' : 'secondary'}>{rule.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {rule.isMandatory ? <Badge variant="outline">Required</Badge> : <span className="text-muted-foreground text-sm">Optional</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground">
                Source: <code className="text-[11px]">{jurisdiction.code}</code> — {jurisdiction.name}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOCATION OVERRIDES */}
        <TabsContent value="location" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">Location overrides</CardTitle>
                <CardDescription>
                  Tighten or relax award break rules for a specific location. Leave empty to inherit award defaults.
                </CardDescription>
              </div>
              <Button size="sm" onClick={addLocationOverride}><Plus className="h-4 w-4 mr-1" />Add rule</Button>
            </CardHeader>
            <CardContent>
              {locationOverrides.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground border border-dashed rounded-md">
                  No location overrides. All locations inherit award defaults.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>After (h)</TableHead>
                      <TableHead>Duration (min)</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Mandatory</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locationOverrides.map((ov, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Select value={ov.locationId} onValueChange={v => {
                            const next = [...locationOverrides]; next[i] = { ...ov, locationId: v }; setLocationOverrides(next);
                          }}>
                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input className="h-8 w-32" value={ov.name}
                            onChange={e => { const next = [...locationOverrides]; next[i] = { ...ov, name: e.target.value }; setLocationOverrides(next); }} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" className="h-8 w-20" value={ov.minWorkHoursRequired}
                            onChange={e => { const next = [...locationOverrides]; next[i] = { ...ov, minWorkHoursRequired: +e.target.value }; setLocationOverrides(next); }} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" className="h-8 w-20" value={ov.breakDurationMinutes}
                            onChange={e => { const next = [...locationOverrides]; next[i] = { ...ov, breakDurationMinutes: +e.target.value }; setLocationOverrides(next); }} />
                        </TableCell>
                        <TableCell>
                          <Select value={ov.type} onValueChange={v => {
                            const next = [...locationOverrides]; next[i] = { ...ov, type: v as 'paid' | 'unpaid' }; setLocationOverrides(next);
                          }}>
                            <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="unpaid">Unpaid</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Switch checked={ov.isMandatory} onCheckedChange={c => {
                            const next = [...locationOverrides]; next[i] = { ...ov, isMandatory: c }; setLocationOverrides(next);
                          }} />
                        </TableCell>
                        <TableCell>
                          <Switch checked={ov.enabled} onCheckedChange={c => {
                            const next = [...locationOverrides]; next[i] = { ...ov, enabled: c }; setLocationOverrides(next);
                          }} />
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => setLocationOverrides(locationOverrides.filter((_, idx) => idx !== i))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SHIFT OVERRIDES — granular, matches shift template editor */}
        <TabsContent value="shift" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shift template overrides</CardTitle>
              <CardDescription>
                Per-template granular break rules. Identical structure to the Basic tab in
                Roster → Shift templates. Empty list means the template inherits the location/award rules.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {defaultShiftTemplates.map(t => {
                const state = shiftOverrides.find(s => s.templateId === t.id);
                const rules = state?.rules ?? [];
                return (
                  <div key={t.id} className="rounded-md border bg-card">
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-sm" style={{ background: t.color }} />
                        <div>
                          <div className="text-sm font-medium">{t.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {t.startTime} – {t.endTime} · {t.shiftType ?? 'regular'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {rules.length === 0 ? (
                          <Badge variant="secondary">Inherits award/location</Badge>
                        ) : (
                          <Badge variant="default">{rules.length} override{rules.length > 1 ? 's' : ''}</Badge>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => addShiftRule(t.id)}>
                          <Plus className="h-3.5 w-3.5 mr-1" />Add rule
                        </Button>
                      </div>
                    </div>
                    {rules.length > 0 && (
                      <div className="p-3">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>After (h)</TableHead>
                              <TableHead>Duration (min)</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Mandatory</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rules.map((r, idx) => (
                              <TableRow key={r.id}>
                                <TableCell>
                                  <Input className="h-8 w-36" value={r.name}
                                    onChange={e => updateShiftRule(t.id, idx, { name: e.target.value })} />
                                </TableCell>
                                <TableCell>
                                  <Input type="number" className="h-8 w-20" value={r.minWorkHoursRequired}
                                    onChange={e => updateShiftRule(t.id, idx, { minWorkHoursRequired: parseFloat(e.target.value) || 0 })} />
                                </TableCell>
                                <TableCell>
                                  <Input type="number" className="h-8 w-20" value={r.breakDurationMinutes}
                                    onChange={e => updateShiftRule(t.id, idx, { breakDurationMinutes: parseInt(e.target.value) || 0 })} />
                                </TableCell>
                                <TableCell>
                                  <Select value={r.type} onValueChange={v => updateShiftRule(t.id, idx, { type: v as 'paid' | 'unpaid' })}>
                                    <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="paid">Paid</SelectItem>
                                      <SelectItem value="unpaid">Unpaid</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Switch checked={r.isMandatory}
                                    onCheckedChange={c => updateShiftRule(t.id, idx, { isMandatory: c })} />
                                </TableCell>
                                <TableCell>
                                  <Button size="icon" variant="ghost" onClick={() => removeShiftRule(t.id, idx)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {embedded && (
        <div className="flex justify-end">
          <Button onClick={() => toast.success('Break configuration saved')}>Save break rules</Button>
        </div>
      )}
    </div>
  );
}

/** Standalone page wrapper for /settings/breaks */
export default function BreaksHub() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/settings"><ChevronLeft className="h-4 w-4 mr-1" />Settings</Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Breaks</h1>
              <p className="text-sm text-muted-foreground">
                Single hub for break rules across award, location, and shift template layers
              </p>
            </div>
          </div>
          <Button onClick={() => toast.success('Break configuration saved')}>Save changes</Button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <BreaksHubBody />
      </div>
    </div>
  );
}
