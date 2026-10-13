import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, BookOpen, Plus, RotateCcw, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { RateTable } from '@/lib/rateCategory';
import { useRateCategories } from '@/lib/rateCategoryStore';
import { NumericSection } from '@/lib/rateTableOverrides';

function EditedMark({ awardValue }: { awardValue: number | undefined }) {
  return (
    <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal" title="Differs from the award's published figure">
      Edited{awardValue !== undefined ? ` · award ${awardValue}%` : ' · not in award'}
    </Badge>
  );
}

type NumMap = Record<string | number, number>;

function PercentTable({
  title, description, rows, keyLabel, onChange, editableKeys, award,
}: {
  title: string; description: string; rows: NumMap; keyLabel: (k: string) => string;
  onChange: (next: NumMap) => void; editableKeys?: boolean; award: NumMap;
}) {
  const entries = Object.entries(rows);
  const [newKey, setNewKey] = useState('');
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <span className="text-sm flex-1 flex items-center gap-2">{keyLabel(k)}{award[k] !== v && <EditedMark awardValue={award[k]} />}</span>
            <Input
              type="number" min={0} max={100} className="h-8 w-20 text-right"
              value={v}
              aria-label={`${keyLabel(k)} percent`}
              onChange={(e) => onChange({ ...rows, [k]: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
            />
            <span className="text-xs text-muted-foreground w-4">%</span>
            {editableKeys && (
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Remove ${k}`}
                onClick={() => { const n = { ...rows }; delete n[k]; onChange(n); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
        {editableKeys && (
          <div className="flex gap-2 pt-1">
            <Input className="h-8" placeholder="Add level, e.g. Level D" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
            <Button size="sm" variant="outline" disabled={!newKey.trim()}
              onClick={() => { onChange({ ...rows, [newKey.trim()]: 100 }); setNewKey(''); }}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RateCategoryTablesPanel() {
  const store = useRateCategories();
  const saved = store.getTable();
  const savedKey = JSON.stringify(saved);
  const published = store.getPublished();
  const award = published.table;
  const overrides = store.getOverrides();
  const stale = store.staleOverrides();
  const overrideCount = Object.keys(overrides.cells).length + (overrides.adultAge ? 1 : 0) + (overrides.adultRateQualifications ? 1 : 0);
  const [draft, setDraft] = useState<RateTable>(saved);
  const [newQual, setNewQual] = useState('');
  const [newAge, setNewAge] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setDraft(JSON.parse(savedKey)); }, [savedKey]);

  const staleLabel = (key: string) => {
    if (key === 'adultAge') return 'Adult rate from age';
    if (key === 'adultRateQualifications') return 'Qualifications that earn the adult rate';
    const [section, ...rest] = key.split('.');
    const k = rest.join('.');
    const names: Record<NumericSection, string> = {
      juniorByAge: `Junior age ${k}`, apprenticeByYear: `Apprentice year ${k}`,
      apprenticeYear12ByYear: `Apprentice (Year 12) year ${k}`, adultApprenticeByYear: `Adult apprentice year ${k}`, traineeByLevel: `Trainee ${k}`,
    };
    const c = overrides.cells[key];
    const now = (award[section as NumericSection] as Record<string, number>)[k];
    return `${names[section as NumericSection]}: your ${c?.value}% (award was ${c?.awardValueAtPin ?? '—'}%, now ${now ?? '—'}%)`;
  };

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const set = <K extends keyof RateTable>(k: K, v: RateTable[K]) => setDraft({ ...draft, [k]: v });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Junior, apprentice & trainee rates</h3>
          <p className="text-sm text-muted-foreground">
            Figures come from the award. Change a cell only where you pay differently (for example under an enterprise agreement) — it's saved as an override.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={overrideCount === 0} onClick={() => { store.resetTable(); toast.success('All award figures restored'); }}>
            <RotateCcw className="h-4 w-4 mr-2" />Use all award figures
          </Button>
          <Button size="sm" disabled={!dirty} onClick={() => { store.setTable('default', draft); toast.success('Rate tables saved'); }}>
            <Save className="h-4 w-4 mr-2" />Save changes
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{published.awardName}</span>
        <span className="text-muted-foreground">{published.version} · effective {new Date(published.effectiveDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })} · {published.clauseRef}</span>
        <Badge variant="secondary" className="ml-auto font-normal">{overrideCount === 0 ? 'Using award figures' : `${overrideCount} override${overrideCount === 1 ? '' : 's'}`}</Badge>
      </div>

      {stale.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-2" role="alert">
          <div className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-destructive" />The award has been updated — check {stale.length} override{stale.length === 1 ? '' : 's'}</div>
          <p className="text-xs text-muted-foreground">These were set against an earlier award version. They still apply until you decide.</p>
          <ul className="space-y-1.5">
            {stale.map(k => (
              <li key={k} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="flex-1 min-w-[220px]">{staleLabel(k)}</span>
                <Button size="sm" variant="outline" onClick={() => { store.useAwardValue(k); toast.success('Award figure applied'); }}>Use award figure</Button>
                <Button size="sm" onClick={() => { store.keepOverride(k); toast.success('Override kept'); }}>Keep override</Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Junior rates by age</CardTitle>
            <CardDescription className="text-xs">Ages at or above the adult age are paid 100%.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm flex-1 flex items-center gap-2">Adult rate from age{draft.adultAge !== award.adultAge && <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">Edited · award {award.adultAge}</Badge>}</span>
              <Input type="number" className="h-8 w-20 text-right" value={draft.adultAge} aria-label="Adult age"
                onChange={(e) => set('adultAge', Number(e.target.value) || 21)} />
              <span className="w-4" />
            </div>
            {Object.entries(draft.juniorByAge).map(([age, pct]) => (
              <div key={age} className="flex items-center gap-2">
                <span className="text-sm flex-1 flex items-center gap-2">Age {age}{award.juniorByAge[Number(age)] !== pct && <EditedMark awardValue={award.juniorByAge[Number(age)]} />}</span>
                <Input type="number" min={0} max={100} className="h-8 w-20 text-right" value={pct} aria-label={`Age ${age} percent`}
                  onChange={(e) => set('juniorByAge', { ...draft.juniorByAge, [age]: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} />
                <span className="text-xs text-muted-foreground w-4">%</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Remove age ${age}`}
                  onClick={() => { const n = { ...draft.juniorByAge }; delete n[Number(age)]; set('juniorByAge', n); }}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Input className="h-8" type="number" placeholder="Add age" value={newAge} onChange={(e) => setNewAge(e.target.value)} />
              <Button size="sm" variant="outline" disabled={!newAge}
                onClick={() => { set('juniorByAge', { ...draft.juniorByAge, [Number(newAge)]: 100 }); setNewAge(''); }}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <PercentTable title="Apprentice rates" description="Standard apprentices by year."
          rows={draft.apprenticeByYear} award={award.apprenticeByYear} keyLabel={(k) => `Year ${k}`} onChange={(n) => set('apprenticeByYear', n)} />
        <PercentTable title="Apprentice rates (completed Year 12)" description="Used when the apprentice finished Year 12."
          rows={draft.apprenticeYear12ByYear} award={award.apprenticeYear12ByYear} keyLabel={(k) => `Year ${k}`} onChange={(n) => set('apprenticeYear12ByYear', n)} />
        <PercentTable title="Adult apprentice rates" description="Apprentices aged 21 or over when they started."
          rows={draft.adultApprenticeByYear} award={award.adultApprenticeByYear} keyLabel={(k) => `Year ${k}`} onChange={(n) => set('adultApprenticeByYear', n)} />
        <PercentTable title="Trainee training wage levels" description="Percentage of the adult rate for each training wage level."
          rows={draft.traineeByLevel} award={award.traineeByLevel} keyLabel={(k) => k} onChange={(n) => set('traineeByLevel', n as Record<string, number>)} editableKeys />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Qualifications that earn the adult rate</CardTitle>
            <CardDescription className="text-xs">A junior holding one of these is flagged for manager approval to move to the adult rate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {draft.adultRateQualifications.map((q) => (
                <Badge key={q} variant="secondary" className="gap-1 font-normal">
                  {q}{!award.adultRateQualifications.includes(q) && <span className="text-muted-foreground">· edited</span>}
                  <button aria-label={`Remove ${q}`} onClick={() => set('adultRateQualifications', draft.adultRateQualifications.filter(x => x !== q))}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {draft.adultRateQualifications.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
            </div>
            <div className="flex gap-2">
              <Input className="h-8" placeholder="e.g. Certificate III in Retail" value={newQual} onChange={(e) => setNewQual(e.target.value)} />
              <Button size="sm" variant="outline" disabled={!newQual.trim()}
                onClick={() => { set('adultRateQualifications', [...draft.adultRateQualifications, newQual.trim()]); setNewQual(''); }}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
