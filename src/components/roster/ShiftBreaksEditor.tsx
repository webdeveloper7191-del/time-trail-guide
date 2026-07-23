/**
 * Shared paid/unpaid break entry editor for Shift, Open Shift, and Shift Template UIs.
 * Mirrors the breaks grid in AddTimesheetPanel so the experience is consistent
 * between rostering (planned breaks) and timesheets (actual breaks).
 */
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Coffee } from 'lucide-react';
import type { ShiftBreak } from '@/types/roster';

let breakIdCounter = 0;
const nextBreakId = () => `sbrk-${Date.now()}-${++breakIdCounter}`;

interface ShiftBreaksEditorProps {
  breaks: ShiftBreak[];
  onChange: (breaks: ShiftBreak[]) => void;
  /** Shift start/end used to seed a sensible default window for a new break. */
  startTime?: string;
  endTime?: string;
  /** Optional label above the editor. Defaults to "Breaks". */
  label?: string;
  /** When true, hides the small helper text under the actions. */
  compact?: boolean;
}

function midpointWindow(start: string, end: string, durationMin: number, offsetMin = 0): { start: string; end: string } {
  if (!start || !end) return { start: '', end: '' };
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let s = sh * 60 + sm;
  let e = eh * 60 + em;
  if (e < s) e += 24 * 60;
  const mid = Math.floor((s + e) / 2) + offsetMin;
  const bStart = Math.max(s, Math.min(e - durationMin, mid - Math.floor(durationMin / 2)));
  const bEnd = bStart + durationMin;
  const fmt = (m: number) => {
    const mm = ((m % (24 * 60)) + 24 * 60) % (24 * 60);
    return `${String(Math.floor(mm / 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`;
  };
  return { start: fmt(bStart), end: fmt(bEnd) };
}

function durationMinutes(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return mins;
}

/**
 * Sum all unpaid break durations in minutes. This is the value that should be
 * stored in `Shift.breakMinutes` / `ShiftTemplate.breakMinutes` for downstream
 * cost/hours calculations that already deduct unpaid time.
 */
export function unpaidBreakTotal(breaks: ShiftBreak[] | undefined): number {
  if (!breaks || breaks.length === 0) return 0;
  return breaks.filter(b => !b.paid).reduce((sum, b) => sum + durationMinutes(b.start, b.end), 0);
}

/** Sum of paid break durations (in minutes). Paid breaks are NOT deducted from worked hours. */
export function paidBreakTotal(breaks: ShiftBreak[] | undefined): number {
  if (!breaks || breaks.length === 0) return 0;
  return breaks.filter(b => b.paid).reduce((sum, b) => sum + durationMinutes(b.start, b.end), 0);
}

/**
 * Worked minutes for a single split-shift segment.
 * Only unpaid breaks are deducted; paid breaks are counted as worked time.
 */
export function computeSplitSegmentWorkedMinutes(
  startISO: string,
  endISO: string,
  unpaidBreakMinutes: number,
  _paidBreakMinutes: number = 0,
): number {
  if (!startISO || !endISO) return 0;
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  const gross = (end - start) / 60000;
  return Math.max(0, Math.round(gross - (unpaidBreakMinutes || 0)));
}

export function ShiftBreaksEditor({
  breaks,
  onChange,
  startTime,
  endTime,
  label = 'Breaks',
  compact = false,
}: ShiftBreaksEditorProps) {
  const totals = useMemo(() => {
    const unpaid = breaks.filter(b => !b.paid).reduce((s, b) => s + durationMinutes(b.start, b.end), 0);
    const paid = breaks.filter(b => b.paid).reduce((s, b) => s + durationMinutes(b.start, b.end), 0);
    return { unpaid, paid };
  }, [breaks]);

  const addBreak = (paid: boolean) => {
    const dur = paid ? 15 : 30;
    const offset = paid ? -60 : 0;
    const win = startTime && endTime ? midpointWindow(startTime, endTime, dur, offset) : { start: '', end: '' };
    onChange([
      ...breaks,
      {
        id: nextBreakId(),
        start: win.start,
        end: win.end,
        paid,
        label: paid ? 'Rest Break' : 'Meal Break',
      },
    ]);
  };

  const patch = (id: string, updates: Partial<ShiftBreak>) =>
    onChange(breaks.map(b => (b.id === id ? { ...b, ...updates } : b)));

  const remove = (id: string) => onChange(breaks.filter(b => b.id !== id));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Coffee className="h-3.5 w-3.5" />
          {label}
        </Label>
        <div className="flex items-center gap-1">
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => addBreak(false)}>
            <Plus className="h-3 w-3 mr-1" /> Unpaid
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => addBreak(true)}>
            <Plus className="h-3 w-3 mr-1" /> Paid
          </Button>
        </div>
      </div>

      {breaks.length === 0 ? (
        <p className="text-xs text-muted-foreground italic px-1">
          No breaks configured. Add a paid or unpaid break to schedule it on this shift.
        </p>
      ) : (
        <div className="space-y-1.5">
          {breaks.map(b => (
            <div
              key={b.id}
              className={`grid grid-cols-1 gap-2 rounded border p-2 md:grid-cols-[minmax(9rem,1fr)_minmax(7rem,1fr)_minmax(7rem,1fr)_5.5rem_2.25rem] md:items-end ${
                b.paid ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-muted/20'
              }`}
            >
              <div className="min-w-0 space-y-1">
                <Label className="text-[10px] text-muted-foreground">Break</Label>
                <Input
                  className="h-8 min-w-0 text-xs"
                  placeholder={b.paid ? 'Rest Break' : 'Meal Break'}
                  value={b.label ?? ''}
                  onChange={e => patch(b.id, { label: e.target.value })}
                />
              </div>
              <div className="min-w-0 space-y-1">
                <Label className="text-[10px] text-muted-foreground">Start</Label>
                <Input
                  type="time"
                  className="h-8 min-w-0 text-xs"
                  value={b.start}
                  onChange={e => patch(b.id, { start: e.target.value })}
                />
              </div>
              <div className="min-w-0 space-y-1">
                <Label className="text-[10px] text-muted-foreground">End</Label>
                <Input
                  type="time"
                  className="h-8 min-w-0 text-xs"
                  value={b.end}
                  onChange={e => patch(b.id, { end: e.target.value })}
                />
              </div>
              <button
                type="button"
                className={`h-8 rounded border px-2 text-[10px] whitespace-nowrap ${
                  b.paid
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
                onClick={() => patch(b.id, { paid: !b.paid })}
                title={b.paid ? 'Paid — not deducted from worked hours' : 'Unpaid — deducted from worked hours'}
              >
                {b.paid ? 'Paid' : 'Unpaid'}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => remove(b.id)}
                aria-label="Remove break"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {!compact && breaks.length > 0 && (
        <p className="text-[11px] text-muted-foreground px-1">
          Unpaid total <span className="font-medium text-foreground">{totals.unpaid} min</span> (deducted from paid
          hours) · Paid total <span className="font-medium text-foreground">{totals.paid} min</span>
        </p>
      )}
    </div>
  );
}
