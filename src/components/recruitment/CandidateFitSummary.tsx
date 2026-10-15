import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, Square, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Applicant, JobPosting } from '@/types/recruitment';

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/candidate-fit`;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const stripHtml = (html?: string) => {
  if (!html) return '';
  const d = document.createElement('div');
  d.innerHTML = html.replace(/<\/(p|li|h\d|div)>/g, '\n').replace(/<br\s*\/?>/g, '\n');
  return (d.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
};

export function buildApplicantProfile(a: Applicant): string {
  const parts = [`Name: ${a.firstName} ${a.lastName}`, `Source: ${a.source}`];
  if (a.tags.length) parts.push(`Tags: ${a.tags.join(', ')}`);
  if (a.linkedInUrl) parts.push(`LinkedIn: ${a.linkedInUrl}`);
  if (a.coverLetter) parts.push(`Cover letter:\n${stripHtml(a.coverLetter)}`);
  if (a.screeningAnswers?.length) parts.push(`Screening answers:\n${a.screeningAnswers.map(s => `- ${s.questionText}: ${String(s.answer)}`).join('\n')}`);
  if (a.notes.length) parts.push(`Hiring team notes:\n${a.notes.map(n => `- ${n.content}`).join('\n')}`);
  return parts.join('\n\n');
}

export function buildJobRequirements(j?: JobPosting): string {
  if (!j) return '';
  const parts = [`Title: ${j.title}`, `Location: ${j.location}`];
  if (j.requirements?.length) parts.push(`Requirements:\n${j.requirements.map(r => `- ${r}`).join('\n')}`);
  if (j.responsibilities?.length) parts.push(`Responsibilities:\n${j.responsibilities.map(r => `- ${r}`).join('\n')}`);
  if (j.description) parts.push(`Description:\n${stripHtml(j.description)}`);
  return parts.join('\n\n');
}

export function CandidateFitSummary({ applicant, job }: { applicant: Applicant; job?: JobPosting }) {
  const [profile, setProfile] = useState(() => buildApplicantProfile(applicant));
  const [requirements, setRequirements] = useState(() => buildJobRequirements(job));
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setProfile(buildApplicantProfile(applicant));
    setRequirements(buildJobRequirements(job));
    setOutput(''); setError('');
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicant.id, job?.id]);

  const run = async () => {
    if (!profile.trim() || !requirements.trim()) { setError('Add both the applicant profile and the job requirements.'); return; }
    setError(''); setOutput(''); setRunning(true);
    const ctrl = new AbortController(); abortRef.current = ctrl;
    try {
      const res = await fetch(FN_URL, {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ profile, requirements, jobTitle: job?.title }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'The summary could not be generated. Please try again later.');
        return;
      }
      const reader = res.body.getReader(); const dec = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        setOutput(o => o + dec.decode(value, { stream: true }));
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError('Could not reach the AI service. Check your connection and try again.');
    } finally { setRunning(false); abortRef.current = null; }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        AI-powered summary based only on the text below. Edit or paste a résumé, then generate. Use it to support — not replace — your judgement.
      </p>
      <div className="space-y-1">
        <Label className="text-xs">Applicant profile</Label>
        <Textarea rows={6} value={profile} onChange={e => setProfile(e.target.value)} placeholder="Paste résumé, experience, qualifications…" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Job requirements</Label>
        <Textarea rows={5} value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="Must-have and nice-to-have requirements…" />
      </div>
      <div className="flex gap-2">
        {running ? (
          <Button size="sm" variant="outline" onClick={() => abortRef.current?.abort()}><Square className="h-4 w-4 mr-1" />Stop</Button>
        ) : (
          <Button size="sm" onClick={run}>{output ? <RotateCcw className="h-4 w-4 mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}{output ? 'Regenerate' : 'Generate fit summary'}</Button>
        )}
      </div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {(output || running) && (
        <div className="rounded-lg border bg-muted/30 p-4 prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-table:text-xs">
          {output ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown> : <p className="text-muted-foreground">Analysing…</p>}
        </div>
      )}
    </div>
  );
}
