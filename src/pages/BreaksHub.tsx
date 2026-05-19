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
import { defaultShiftTemplates } from '@/types/roster';
import { mockLocations } from '@/data/mockLocationData';
import { toast } from 'sonner';

interface LocationBreakOverride {
  locationId: string;
  ruleId: string;
  breakDurationMinutes: number;
  minWorkHoursRequired: number;
  type: 'paid' | 'unpaid';
  enabled: boolean;
}

interface ShiftBreakOverride {
  templateId: string;
  totalBreakMinutes: number;
  notes?: string;
}

const awardOptions: { value: AwardType; label: string }[] = [
  { value: 'children_services', label: "Children's Services Award" },
  { value: 'healthcare', label: 'Health Professionals Award' },
  { value: 'hospitality', label: 'Hospitality Award' },
  { value: 'retail', label: 'Retail Award' },
  { value: 'general', label: 'General (NES baseline)' },
];

export default function BreaksHub() {
  const [selectedAward, setSelectedAward] = useState<AwardType>('children_services');
  const jurisdiction = australianJurisdictions[selectedAward];

  const [locationOverrides, setLocationOverrides] = useState<LocationBreakOverride[]>([]);
  const [shiftOverrides, setShiftOverrides] = useState<ShiftBreakOverride[]>(
    defaultShiftTemplates.map(t => ({ templateId: t.id, totalBreakMinutes: t.breakMinutes }))
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
        breakDurationMinutes: firstRule.breakDurationMinutes,
        minWorkHoursRequired: firstRule.minWorkHoursRequired,
        type: firstRule.type,
        enabled: true,
      },
    ]);
  };

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

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Inheritance explainer */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-1">Precedence: Shift override → Location override → Award default</p>
                <p className="text-muted-foreground">
                  The most specific rule wins. If a shift template defines its own break, it overrides the location override, which overrides the award default.
                  The roster compliance engine and timesheet validator both read the resolved rule from this hub.
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
                  Statutory baseline from the selected modern award. Edit in <Link to="/settings" className="text-primary hover:underline">Awards settings</Link>.
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
                <Button size="sm" onClick={addLocationOverride}><Plus className="h-4 w-4 mr-1" />Add override</Button>
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
                        <TableHead>Award rule</TableHead>
                        <TableHead>After (h)</TableHead>
                        <TableHead>Duration (min)</TableHead>
                        <TableHead>Type</TableHead>
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
                            <Select value={ov.ruleId} onValueChange={v => {
                              const next = [...locationOverrides]; next[i] = { ...ov, ruleId: v }; setLocationOverrides(next);
                            }}>
                              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {jurisdiction.breakRules.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
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

          {/* SHIFT OVERRIDES */}
          <TabsContent value="shift" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shift template overrides</CardTitle>
                <CardDescription>
                  Per-template total break minutes. This is the same value edited in Roster → Shift templates → "Break (min)".
                  Set to <code className="text-[11px]">0</code> to inherit the resolved location/award rule.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Total break (min)</TableHead>
                      <TableHead>Effective source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {defaultShiftTemplates.map(t => {
                      const ov = shiftOverrides.find(o => o.templateId === t.id);
                      const minutes = ov?.totalBreakMinutes ?? t.breakMinutes;
                      return (
                        <TableRow key={t.id}>
                          <TableCell>
                            <div className="font-medium">{t.name}</div>
                            <div className="text-xs text-muted-foreground">{t.startTime} – {t.endTime}</div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{t.shiftType}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="h-8 w-24"
                              value={minutes}
                              onChange={e => {
                                const v = +e.target.value;
                                setShiftOverrides(prev => {
                                  const idx = prev.findIndex(o => o.templateId === t.id);
                                  if (idx === -1) return [...prev, { templateId: t.id, totalBreakMinutes: v }];
                                  const next = [...prev]; next[idx] = { ...next[idx], totalBreakMinutes: v }; return next;
                                });
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {minutes > 0
                              ? <Badge variant="default">Shift override</Badge>
                              : <Badge variant="secondary">Inherits award/location</Badge>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
