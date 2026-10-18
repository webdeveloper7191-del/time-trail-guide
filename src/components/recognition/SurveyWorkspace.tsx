import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus, Trash2, ArrowUp, ArrowDown, Download, Play, Square } from 'lucide-react';
import { Survey, SurveyQuestion, SurveyResponse, questionTypeLabels } from '@/types/recognition';
import { SurveysPanel } from './SurveysPanel';
import { validateSurveyAnswers } from '@/lib/recognitionStore';
import { toast } from 'sonner';

interface Props {
  surveys: Survey[]; responses: SurveyResponse[]; currentUserId: string;
  save: (survey: Survey) => void; submit: (survey: Survey, answers: SurveyResponse['answers']) => void;
  hasSubmitted: (id: string) => boolean;
}
const question = (): SurveyQuestion => ({ id: crypto.randomUUID(), text: '', type: 'rating', required: true });
function blank(user: string): Survey {
  const today = new Date().toISOString().slice(0,10);
  return { id: crypto.randomUUID(), title: '', description: '', status: 'draft', anonymous: true, questions: [question()], startDate: today, endDate: new Date(Date.now()+14*86400000).toISOString().slice(0,10), targetAudience: 'all', responseCount: 0, createdBy: user, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}
export function SurveyWorkspace({ surveys, responses, currentUserId, save, submit, hasSubmitted }: Props) {
  const [selected, setSelected] = useState<Survey | null>(null);
  const [mode, setMode] = useState<'edit'|'view'|'take'>('view');
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [error, setError] = useState('');
  const open = (s: Survey, m: typeof mode) => { setSelected(structuredClone(s)); setMode(m); setAnswers({}); setError(''); };
  const rows = responses.filter(r => r.surveyId === selected?.id);
  const update = (patch: Partial<Survey>) => { if (selected) setSelected({ ...selected, ...patch }); };
  const act = (fn: () => void) => { try { fn(); setError(''); } catch(e) { setError(e instanceof Error ? e.message : 'Unable to save.'); } };
  const saveDraft = () => {
    if (!selected) return;
    if (!selected.title.trim() || !selected.questions.length || selected.questions.some(q => !q.text.trim() || (q.type === 'multiple_choice' && (q.options?.length ?? 0) < 2))) throw new Error('Enter a title, every question and at least two options for choice questions.');
    if (selected.endDate < selected.startDate) throw new Error('End date must be on or after start date.');
    if (selected.targetAudience !== 'all' && !selected.targetValue?.trim()) throw new Error('Select an audience.');
    save({ ...selected, title: selected.title.trim(), updatedAt: new Date().toISOString() }); setSelected(null); toast.success('Survey saved');
  };
  const download = () => {
    if (!selected) return;
    const csv = [['Submitted', ...selected.questions.map(q => q.text)], ...rows.map(r => [r.submittedAt, ...selected.questions.map(q => r.answers.find(a => a.questionId === q.id)?.value ?? '')])].map(row => row.map(v => `"${String(v).replace(/"/g,'""').replace(/^[=+@-]/, "'$&")}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href=url; a.download='survey-results.csv'; a.click(); URL.revokeObjectURL(url);
  };
  return <>
    <SurveysPanel surveys={surveys} onCreateSurvey={() => open(blank(currentUserId),'edit')} onViewSurvey={s => open(s,'view')} onTakeSurvey={s => open(s,'take')} />
    <Sheet open={!!selected} onOpenChange={v => { if (!v) setSelected(null); }}><SheetContent className="w-full sm:max-w-2xl overflow-y-auto"><SheetHeader><SheetTitle>{mode === 'edit' ? 'Survey editor' : selected?.title}</SheetTitle></SheetHeader>
      {selected && <div className="space-y-5 mt-6">
        {error && <p role="alert" className="text-destructive">{error}</p>}
        {mode === 'edit' ? <>
          <Label htmlFor="survey-title">Title</Label><Input id="survey-title" value={selected.title} onChange={e => update({title:e.target.value})}/>
          <Label htmlFor="survey-description">Description</Label><Textarea id="survey-description" value={selected.description} onChange={e => update({description:e.target.value})}/>
          <div className="grid grid-cols-2 gap-4">{(['startDate','endDate'] as const).map(k => <div key={k}><Label htmlFor={k}>{k === 'startDate' ? 'Start date' : 'End date'}</Label><Input id={k} type="date" value={selected[k]} onChange={e => update({[k]:e.target.value})}/></div>)}</div>
          <div className="flex justify-between items-center"><Label>Anonymous answers</Label><Switch checked={selected.anonymous} onCheckedChange={v => update({anonymous:v})}/></div>
          {selected.questions.map((q,i) => <div key={q.id} className="border-b border-border pb-4 space-y-3">
            <div className="flex items-center gap-2"><Label className="flex-1">Question {i+1}</Label><Button size="icon" variant="ghost" aria-label="Move question up" disabled={i===0} onClick={() => { const qs=[...selected.questions]; [qs[i-1],qs[i]]=[qs[i],qs[i-1]]; update({questions:qs}); }}><ArrowUp className="h-4 w-4"/></Button><Button size="icon" variant="ghost" aria-label="Move question down" disabled={i===selected.questions.length-1} onClick={() => { const qs=[...selected.questions]; [qs[i+1],qs[i]]=[qs[i],qs[i+1]]; update({questions:qs}); }}><ArrowDown className="h-4 w-4"/></Button><Button size="icon" variant="ghost" aria-label="Delete question" disabled={selected.questions.length===1} onClick={() => update({questions:selected.questions.filter(x => x.id!==q.id)})}><Trash2 className="h-4 w-4"/></Button></div>
            <Input aria-label={`Question ${i+1}`} value={q.text} onChange={e => update({questions:selected.questions.map(x => x.id===q.id ? {...x,text:e.target.value}:x)})}/>
            <Select value={q.type} onValueChange={v => update({questions:selected.questions.map(x => x.id===q.id ? {...x,type:v as SurveyQuestion['type']}:x)})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Object.entries(questionTypeLabels).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select>
            {q.type==='multiple_choice' && <Textarea aria-label="Answer options, one per line" placeholder="Options, one per line" value={q.options?.join('\n') ?? ''} onChange={e => update({questions:selected.questions.map(x => x.id===q.id ? {...x,options:e.target.value.split('\n')}:x)})}/>}
            <div className="flex items-center justify-between"><Label>Required</Label><Switch checked={q.required} onCheckedChange={v => update({questions:selected.questions.map(x => x.id===q.id ? {...x,required:v}:x)})}/></div>
          </div>)}
          <Button variant="outline" onClick={() => update({questions:[...selected.questions,question()]})}><Plus className="h-4 w-4 mr-2"/>Add question</Button><Button className="ml-2" onClick={() => act(saveDraft)}>Save survey</Button>
        </> : mode==='take' ? <>
          <p className="text-muted-foreground">{selected.description}</p>
          {hasSubmitted(selected.id) ? <p>Response already submitted.</p> : <>
            {selected.questions.map(q => <div key={q.id} className="space-y-2"><Label>{q.text}{q.required ? ' *' : ''}</Label>{q.type==='text' ? <Textarea aria-label={q.text} value={answers[q.id]??''} onChange={e => setAnswers({...answers,[q.id]:e.target.value})}/> : <Select value={answers[q.id]===undefined?'':String(answers[q.id])} onValueChange={v => setAnswers({...answers,[q.id]:q.type==='rating'||q.type==='enps'?Number(v):v})}><SelectTrigger aria-label={q.text}><SelectValue placeholder="Choose answer"/></SelectTrigger><SelectContent>{(q.type==='yes_no'?['Yes','No']:q.type==='multiple_choice'?(q.options??[]):Array.from({length:q.type==='enps'?11:5},(_,i)=>String(i+(q.type==='enps'?0:1)))).filter(Boolean).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>}</div>)}
            <Button onClick={() => act(() => { const values=Object.entries(answers).map(([questionId,value]) => ({questionId,value})); validateSurveyAnswers(selected,values); submit(selected,values); setSelected(null); toast.success('Response saved'); })}>Submit response</Button>
          </>}
        </> : <>
          <p className="text-muted-foreground">{selected.description}</p><p>{selected.status} · {rows.length} responses</p>
          <div className="flex gap-2 flex-wrap"><Button variant="outline" onClick={() => setMode('edit')}>Edit survey</Button><Button onClick={() => act(() => { const next={...selected,status:(selected.status==='active'?'closed':'active') as Survey['status']}; if(next.status==='active' && (!next.title.trim() || next.questions.some(q=>!q.text.trim()))) throw new Error('Complete the survey first.'); save(next); setSelected(next); })}>{selected.status==='active'?<Square className="h-4 w-4 mr-2"/>:<Play className="h-4 w-4 mr-2"/>}{selected.status==='active'?'Close survey':'Publish survey'}</Button><Button variant="outline" onClick={download}><Download className="h-4 w-4 mr-2"/>Export answers</Button>{selected.status==='active' && <Button variant="outline" onClick={()=>setMode('take')}>Take survey</Button>}</div>
          {selected.questions.map(q => { const vals=rows.flatMap(r=>r.answers.filter(a=>a.questionId===q.id).map(a=>a.value)); const nums=vals.filter((v):v is number=>typeof v==='number'); return <section key={q.id} className="border-t border-border pt-4"><h3 className="font-medium">{q.text}</h3><p className="text-sm text-muted-foreground">{vals.length} answers{nums.length ? ` · Average ${(nums.reduce((s,v)=>s+v,0)/nums.length).toFixed(1)}`:''}</p>{q.type==='enps' && nums.length>0 && <p>eNPS {Math.round(100*(nums.filter(n=>n>=9).length-nums.filter(n=>n<=6).length)/nums.length)}</p>}{q.type==='text'?vals.map((v,i)=><p className="text-sm mt-2" key={i}>{v}</p>):[...new Set(vals)].map(v=><p className="text-sm" key={v}>{v}: {vals.filter(x=>x===v).length}</p>)}</section>; })}
        </>}
      </div>}
    </SheetContent></Sheet>
  </>;
}