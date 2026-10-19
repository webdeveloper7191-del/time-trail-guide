import { useState, useSyncExternalStore } from 'react';
import type { Goal, PerformanceReview, Feedback } from '@/types/performance';
import { usePerformanceRules } from '@/hooks/usePerformanceTaxonomy';
import { performanceTaxonomyStore } from '@/lib/performanceTaxonomyStore';
import { useBrowserState } from '@/lib/browserState';
import { benchmarkObservations, validBenchmark, type BenchmarkObservation } from '@/lib/performanceBenchmarkStore';
import { BenchmarkingSettingsDrawer, type BenchmarkingSettings } from './BenchmarkingSettingsDrawer';
import { completionRate, inPeriod, periodForDays } from '@/lib/performanceDashboardMetrics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus, Settings, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
const metricNames:Record<string,string>={'goal-completion':'Goal completion (%)','review-completion':'Review completion (%)','feedback-count':'Feedback count'};
export function BenchmarkingDashboard({goals,reviews,feedback}:{embedded?:boolean;goals:Goal[];reviews:PerformanceReview[];feedback:Feedback[]}) {
  const rules=usePerformanceRules();const bench=rules.benchmarking;
  const rows=useSyncExternalStore(benchmarkObservations.subscribe,benchmarkObservations.get,benchmarkObservations.get);
  const [customMetrics,setCustomMetrics]=useBrowserState<BenchmarkingSettings['customMetrics']>('rostered.performance.benchmark-custom.v1',[]);
  const [settingsOpen,setSettingsOpen]=useState(false),[open,setOpen]=useState(false);
  const [draft,setDraft]=useState<BenchmarkObservation>(()=>({id:'',metricId:'goal-completion',value:0,source:bench.benchmarkSources[0]??'',...periodForDays(rules.analytics.defaultRangeDays),sampleSize:0,industry:bench.primaryIndustry,region:bench.region,companySize:bench.companySize}));
  const currentSettings:BenchmarkingSettings={...bench,companyName:'',customMetrics};
  const matches=rows.filter(r=>validBenchmark(r)&&r.industry===bench.primaryIndustry&&r.region===bench.region&&r.companySize===bench.companySize&&bench.benchmarkSources.includes(r.source));
  function yourValue(row:BenchmarkObservation) { const g=goals.filter(g=>g.status!=='cancelled'&&inPeriod(g.targetDate,row)); const r=reviews.filter(r=>r.status!=='cancelled'&&inPeriod(r.periodEnd,row));return row.metricId==='goal-completion'?completionRate(g.filter(g=>g.status==='completed').length,g.length):row.metricId==='review-completion'?completionRate(r.filter(r=>r.status==='completed').length,r.length):row.metricId==='feedback-count'?feedback.filter(f=>inPeriod(f.createdAt,row)).length:null; }
  function saveSettings(next:BenchmarkingSettings) { try {setCustomMetrics(next.customMetrics);const {companyName,customMetrics:unused,...rest}=next;performanceTaxonomyStore.updateRules('benchmarking',rest);}catch {toast.error('Settings could not be saved');throw new Error('Settings could not be saved');} }
  return <div className="space-y-4"><div className="flex flex-wrap items-center gap-2"><h2 className="mr-auto text-base font-semibold">Benchmark evidence</h2><Button variant="outline" onClick={()=>setSettingsOpen(true)}><Settings className="mr-2 h-4 w-4"/>Settings</Button><Button onClick={()=>{setDraft(d=>({...d,id:crypto.randomUUID(),industry:bench.primaryIndustry,region:bench.region,companySize:bench.companySize}));setOpen(true);}}><Plus className="mr-2 h-4 w-4"/>Add observation</Button></div>
  <p className="text-xs text-muted-foreground">{bench.primaryIndustry} · {bench.region} · {bench.companySize} · No external benchmark feed connected. Manually supplied figures are not independently verified.</p>
  {!matches.length&&<p className="border-y border-border py-8 text-sm text-muted-foreground">No dated observations match this peer group and enabled sources. Comparison unavailable.</p>}
  <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-border"><th className="p-3">Metric / source</th><th>Period / sample</th><th>Your result</th><th>Benchmark</th><th>Difference</th><th/></tr></thead><tbody>{matches.map(row=>{const value=yourValue(row);return <tr key={row.id} className="border-b border-border"><td className="p-3">{metricNames[row.metricId]??customMetrics.find(m=>m.id===row.metricId)?.name??row.metricId}<p className="mt-1 text-muted-foreground">{row.source} · Manually supplied</p></td><td>{row.start} — {row.end}<p>n={row.sampleSize}</p></td><td>{value===null?'Unavailable':value.toFixed(1)}</td><td>{row.value}{bench.showConfidenceIntervals&&row.lower!==undefined&&row.upper!==undefined&&<p>Reported interval {row.lower}–{row.upper}</p>}</td><td>{value===null?'—':(value-row.value).toFixed(1)}</td><td><Button size="icon" variant="ghost" aria-label="Delete benchmark observation" onClick={()=>benchmarkObservations.set(s=>s.filter(r=>r.id!==row.id))}><Trash2 className="h-4 w-4"/></Button></td></tr>;})}</tbody></table></div>
  {bench.showConfidenceIntervals&&<p className="text-xs text-muted-foreground">Intervals appear only when supplied by the source; no confidence interval is invented.</p>}
  <BenchmarkingSettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} currentSettings={currentSettings} onSave={saveSettings}/>
  <Sheet open={open} onOpenChange={setOpen}><SheetContent className="overflow-y-auto"><SheetHeader><SheetTitle>Add benchmark observation</SheetTitle></SheetHeader><div className="mt-5 space-y-4"><label className="block text-sm">Metric<Select value={draft.metricId} onValueChange={v=>setDraft(d=>({...d,metricId:v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Object.entries(metricNames).map(([id,name])=><SelectItem key={id} value={id}>{name}</SelectItem>)}{customMetrics.map(m=><SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></label>
  {(['source','start','end','value','sampleSize','lower','upper'] as const).map(key=><label key={key} className="block text-sm">{({source:'Source (enable this in Settings)',start:'Period start',end:'Period end',value:'Benchmark value',sampleSize:'Source sample size',lower:'Interval lower (optional)',upper:'Interval upper (optional)'})[key]}<Input aria-label={`Benchmark ${key}`} type={key==='source'?'text':key==='start'||key==='end'?'date':'number'} value={draft[key]??''} onChange={e=>setDraft(d=>({...d,[key]:['value','sampleSize','lower','upper'].includes(key)?e.target.value===''?undefined:Number(e.target.value):e.target.value}))}/></label>)}
  <Button onClick={()=>{if(!validBenchmark(draft)){toast.error('Provide a source, valid period, value and sample size');return;}try {benchmarkObservations.set(rows=>[draft,...rows]);setOpen(false);toast.success('Observation saved');}catch{toast.error('Observation could not be saved');}}}>Save observation</Button></div></SheetContent></Sheet>
  </div>;
}
export default BenchmarkingDashboard;
