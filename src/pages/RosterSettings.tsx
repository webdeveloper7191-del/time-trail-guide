import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Building2, Check, ChevronRight, Globe2, History, Info, LockKeyhole, RotateCcw, Save, Search, Settings2 } from 'lucide-react';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { rosterPolicyDefaults, rosterPolicySections, type PolicyField } from '@/components/settings/rosterPolicyCatalog';
import { emptyPolicyDrafts, resolvePolicyDraft, savePolicySection, type PolicyValue, type PolicyValues } from '@/lib/rosterPolicyDrafts';
import { useBrowserState } from '@/lib/browserState';
import { mockLocations } from '@/data/mockLocationData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const allKeys = Object.keys(rosterPolicyDefaults);

export default function RosterSettings() {
  const [params, setParams] = useSearchParams();
  const section = rosterPolicySections.find(item => item.id === params.get('section')) ?? rosterPolicySections[0];
  const [saved, setSaved] = useBrowserState('rostered.roster.policy-drafts.v1', emptyPolicyDrafts);
  const [scope, setScope] = useState('business');
  const resolved = useMemo(() => resolvePolicyDraft(rosterPolicyDefaults, saved, scope), [saved, scope]);
  const [edited, setEdited] = useState<PolicyValues>({});
  const values = { ...resolved, ...edited };
  const [query, setQuery] = useState('');
  const [drawer, setDrawer] = useState<'changes' | 'history' | null>(null);
  const changedKeys = allKeys.filter(key => values[key] !== resolved[key]);
  const isBusiness = scope === 'business';
  const scopeName = isBusiness ? 'Business-wide defaults' : mockLocations.find(location => location.id === scope)?.name ?? 'Location';
  const sections = rosterPolicySections.filter(item => `${item.title} ${item.subtitle} ${item.groups.flatMap(group => group.fields.map(field => field.label)).join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  const overrideCount = Object.keys(saved.locations[scope] ?? {}).length;
  const inherited = (key: string) => !isBusiness && values[key] === (saved.business[key] ?? rosterPolicyDefaults[key]);

  function edit(key: string, value: PolicyValue) { setEdited(old => ({ ...old, [key]: value })); }
  function save() {
    if (!changedKeys.length) return;
    try {
      const next = savePolicySection(saved, scope, allKeys, values, rosterPolicyDefaults);
      setSaved({ ...next, history: [{ id: crypto.randomUUID(), scope: scopeName, section: section.title, date: new Date().toISOString(), changes: changedKeys.length }, ...next.history].slice(0, 100) });
      setEdited({});
      setDrawer(null);
      toast.success('Policy draft saved in this browser. Live roster rules are unchanged.');
    } catch { toast.error('Could not save. Your unsaved changes have been kept.'); }
  }
  function switchScope(next: string) {
    if (changedKeys.length) { toast.error('Save or discard your changes before switching locations.'); return; }
    setEdited({}); setScope(next);
  }
  function restoreSection() {
    const next: PolicyValues = { ...edited };
    section.groups.forEach(group => group.fields.forEach(field => { next[field.key] = isBusiness ? rosterPolicyDefaults[field.key] : saved.business[field.key] ?? rosterPolicyDefaults[field.key]; }));
    setEdited(next);
  }
  function fieldControl(field: PolicyField) {
    const id = `policy-${field.key}`;
    if (field.type === 'switch') return <Switch id={id} checked={Boolean(values[field.key])} onCheckedChange={value => edit(field.key, value)} disabled={field.locked} aria-label={field.label} />;
    if (field.type === 'number') return <div className="flex items-center gap-2"><Input id={id} aria-label={field.label} className="w-24 text-right" type="number" min={field.min} max={field.max} step="any" value={Number(values[field.key])} onChange={event => { const value = Number(event.target.value); if (Number.isFinite(value)) edit(field.key, Math.min(field.max ?? Infinity, Math.max(field.min ?? 0, value))); }} /><span className="text-xs text-muted-foreground w-12">{field.unit}</span></div>;
    return <Select value={String(values[field.key])} onValueChange={value => edit(field.key, value)} disabled={field.locked}><SelectTrigger id={id} {...(field.locked ? { disabled: true } : {})} aria-label={field.label} className="w-full sm:w-72 h-auto min-h-10 text-left [&>span]:whitespace-normal"><SelectValue /></SelectTrigger><SelectContent>{field.options?.map(option => <SelectItem value={option} key={option}>{option}</SelectItem>)}</SelectContent></Select>;
  }

  return <div className="flex h-screen bg-background text-foreground">
    <div className="hidden xl:block shrink-0"><AdminSidebar /></div>
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
      <header className="border-b bg-background px-4 sm:px-8 pt-5 pb-5 shrink-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4"><Link to="/settings" className="hover:text-foreground">Settings</Link><ChevronRight className="h-3 w-3" /><span>Roster & scheduling</span></div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center"><Settings2 className="h-5 w-5" /></div><div><h1 className="text-xl sm:text-2xl font-semibold">Roster & scheduling</h1><div className="flex items-center gap-2 mt-1"><Badge variant="secondary" className="text-[11px] rounded-sm">Policy design</Badge><span className="text-xs text-muted-foreground">Browser-only drafts · not applied to live rosters</span></div></div></div>
          <div className="flex gap-2"><Button variant="outline" size="sm" asChild><Link to="/roster"><ArrowLeft className="h-4 w-4 mr-2" />Roster</Link></Button><Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" aria-label="Draft save history" onClick={() => setDrawer('history')}><History className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Draft save history</TooltipContent></Tooltip><Button size="sm" disabled={!changedKeys.length} onClick={save}><Save className="h-4 w-4 mr-2" />Save draft</Button></div>
        </div>
      </header>

      <div className="border-b bg-muted/30 px-4 sm:px-8 py-4 shrink-0 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">{isBusiness ? <Globe2 className="h-4 w-4 text-primary" /> : <Building2 className="h-4 w-4 text-primary" />}Policy scope</div>
        <Select value={scope} onValueChange={switchScope}><SelectTrigger aria-label="Policy scope" className="w-full sm:w-72 bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="business">Business-wide defaults</SelectItem>{mockLocations.filter(location => location.status === 'active').map(location => <SelectItem value={location.id} key={location.id}>{location.name}</SelectItem>)}</SelectContent></Select>
        <Badge variant="outline" className="font-normal">{isBusiness ? 'Default for all locations' : `${overrideCount} saved overrides`}</Badge>
        {changedKeys.length > 0 && <span className="text-xs font-medium text-muted-foreground sm:ml-auto">{changedKeys.length} unsaved {changedKeys.length === 1 ? 'change' : 'changes'}</span>}
      </div>

      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        <nav aria-label="Scheduling policy sections" className="md:w-64 shrink-0 border-b md:border-b-0 md:border-r bg-muted/20 md:overflow-y-auto">
          <div className="p-4 relative"><Search className="absolute left-7 top-7 h-4 w-4 text-muted-foreground" /><Input aria-label="Search settings" placeholder="Search settings" className="pl-9 bg-background" value={query} onChange={event => setQuery(event.target.value)} /></div>
          <div className="flex md:flex-col overflow-x-auto md:overflow-visible gap-1 px-3 pb-4">
            {sections.map(item => { const Icon = item.icon; const itemChanged = item.groups.some(group => group.fields.some(field => changedKeys.includes(field.key))); return <Button key={item.id} variant="ghost" onClick={() => setParams({ section: item.id })} className={cn('justify-start shrink-0 h-10 rounded-md px-3 gap-3 text-sm font-normal', section.id === item.id && 'bg-primary/10 text-primary font-medium hover:bg-primary/10 hover:text-primary')}><Icon className="h-4 w-4 shrink-0" /><span>{item.title}</span>{itemChanged && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" aria-label="Unsaved changes" />}</Button>; })}
            {!sections.length && <p className="px-3 text-sm text-muted-foreground">No matching settings</p>}
          </div>
          <div className="hidden md:block border-t px-6 py-5 text-xs text-muted-foreground"><div className="flex items-center gap-2 font-medium text-foreground mb-2"><LockKeyhole className="h-3.5 w-3.5" />Mandatory requirements</div>Award, contract and account permissions remain authoritative.</div>
        </nav>

        <div className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-8 py-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-6"><div><h2 className="text-xl font-semibold">{section.title}</h2><p className="text-sm text-muted-foreground mt-1">{section.subtitle}</p></div><Button variant="ghost" size="sm" onClick={restoreSection} className="text-muted-foreground gap-2"><RotateCcw className="h-3.5 w-3.5" />{isBusiness ? 'Reset section' : 'Use business defaults'}</Button></div>
            {!isBusiness && <div className="mb-5 flex items-center gap-2 text-xs text-muted-foreground"><Globe2 className="h-4 w-4" />Inherited from business defaults unless overridden.</div>}
            {section.groups.map(group => <section key={group.title} className="mb-8"><div className="border-b pb-3 flex items-center gap-2"><h3 className="font-semibold text-sm">{group.title}</h3></div><div className="divide-y">{group.fields.map(field => <div key={field.key} className="grid sm:grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:gap-6 py-5"><div className="flex items-center gap-2 flex-wrap"><Label htmlFor={`policy-${field.key}`} className="text-sm leading-relaxed font-normal">{field.label}</Label>{field.locked && <Tooltip><TooltipTrigger><LockKeyhole className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger><TooltipContent>Required publishing policy</TooltipContent></Tooltip>}{!isBusiness && <Badge variant="outline" className={cn('text-[10px] font-normal rounded-sm', !inherited(field.key) && 'text-primary border-primary/30 bg-primary/5')}>{inherited(field.key) ? 'Inherited' : 'Override'}</Badge>}</div><div className="flex items-center gap-2 justify-start sm:justify-end">{fieldControl(field)}{!isBusiness && !inherited(field.key) && <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={`Reset ${field.label} to business default`} onClick={() => edit(field.key, saved.business[field.key] ?? rosterPolicyDefaults[field.key])}><RotateCcw className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>Use business default</TooltipContent></Tooltip>}</div></div>)}</div></section>)}
            {section.id === 'swaps' && <div className="flex items-start gap-3 border-t py-4 text-sm text-muted-foreground"><Info className="h-4 w-4 shrink-0 mt-0.5" /><span>Cost comparisons include projected penalties, overtime and allowances, not only the hourly wage.</span></div>}
            {section.id === 'ado-toil' && <div className="flex items-start gap-3 border-t py-4 text-sm text-muted-foreground"><Info className="h-4 w-4 shrink-0 mt-0.5" /><span>Assignment prevention and accrual prevention are separate proposed policies. Timesheet calculations are unchanged.</span></div>}
            {section.id === 'notifications' && <p className="border-t py-4 text-sm text-muted-foreground">Recipient selections do not grant account access. These drafts do not send notifications or email.</p>}
            {section.link && <div className="border-t pt-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase font-medium text-muted-foreground">Existing configuration</p><p className="text-sm mt-1">{section.link.label}</p></div><Button variant="outline" size="sm" asChild><Link to={section.link.to}>Open settings<ArrowUpRight className="h-4 w-4 ml-2" /></Link></Button></div>}
          </div>
        </div>
      </div>

      <footer className="border-t bg-background px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0"><div className="text-xs text-muted-foreground flex items-center gap-2"><Check className="h-3.5 w-3.5" />{changedKeys.length ? `${changedKeys.length} unsaved changes across policy sections` : 'No unsaved changes'}</div><div className="flex items-center gap-2"><Button size="sm" variant="ghost" disabled={!changedKeys.length} onClick={() => setEdited({})}>Discard changes</Button><Button size="sm" variant="outline" disabled={!changedKeys.length} onClick={() => setDrawer('changes')}>Review changes<ChevronRight className="h-4 w-4 ml-1" /></Button></div></footer>
    </main>

    <PrimaryOffCanvas open={drawer !== null} onClose={() => setDrawer(null)} title={drawer === 'history' ? 'Draft save history' : 'Review policy changes'} description={scopeName} icon={drawer === 'history' ? History : Settings2} size="lg" showFooter={false}>
      {drawer === 'changes' ? <><div className="text-sm text-muted-foreground">These changes save as browser-only policy drafts. They do not change live scheduling behaviour.</div>{rosterPolicySections.map(item => { const fields = item.groups.flatMap(group => group.fields).filter(field => changedKeys.includes(field.key)); if (!fields.length) return null; return <section key={item.id}><h3 className="font-semibold text-sm border-b pb-2">{item.title}</h3>{fields.map(field => <div key={field.key} className="py-3 border-b"><p className="text-sm font-medium mb-1">{field.label}</p><p className="text-xs text-muted-foreground break-words">{String(resolved[field.key])} → <span className="text-foreground">{String(values[field.key])}</span></p></div>)}</section>; })}<Button className="w-full gap-2" onClick={save}><Save className="h-4 w-4" />Save draft</Button></> : saved.history.length ? saved.history.map(entry => <div key={entry.id} className="border-b pb-4"><p className="text-sm font-medium">{entry.scope}</p><p className="text-xs text-muted-foreground mt-1">{entry.changes} policy {entry.changes === 1 ? 'change' : 'changes'} saved</p><p className="text-xs text-muted-foreground mt-2">{new Date(entry.date).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}</p></div>) : <div className="py-12 text-center text-sm text-muted-foreground"><History className="h-7 w-7 mx-auto mb-3" />No saved drafts yet</div>}
    </PrimaryOffCanvas>
  </div>;
}