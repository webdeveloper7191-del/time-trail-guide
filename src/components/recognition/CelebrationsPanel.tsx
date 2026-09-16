import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { Cake, Settings2, PartyPopper, Send } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import type { StaffMember } from '@/types/staff';
import { buildCelebrations, useCelebrationSettings, type CelebrationVisibility } from '@/lib/celebrationsStore';

interface Props {
  staff: StaffMember[];
  onCelebrate?: (staffId: string, message: string) => void;
}

const visibilityLabels: Record<CelebrationVisibility, string> = {
  public: 'Everyone',
  team: 'Their team only',
  hidden: 'Hidden',
};

export function CelebrationsPanel({ staff, onCelebrate }: Props) {
  const { settings, update, setVisibility } = useCelebrationSettings();
  const [showSettings, setShowSettings] = useState(false);

  const celebrations = useMemo(() => buildCelebrations(staff, settings), [staff, settings]);
  const today = celebrations.filter((c) => c.daysAway === 0);
  const upcoming = celebrations.filter((c) => c.daysAway > 0);

  const send = (staffId: string, staffName: string, type: string) => {
    const message = type === 'birthday'
      ? `Happy birthday, ${staffName}! 🎂`
      : `Congratulations on your work anniversary, ${staffName}! 🎉`;
    onCelebrate?.(staffId, message);
    toast.success('Celebration posted to the praise wall');
  };

  const initials = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2);

  const row = (c: (typeof celebrations)[number]) => (
    <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9"><AvatarFallback className="text-xs">{initials(c.staffName)}</AvatarFallback></Avatar>
        <div>
          <p className="font-medium text-sm">{c.staffName}</p>
          <p className="text-xs text-muted-foreground">
            {c.type === 'birthday' ? 'Birthday' : `${c.years} year work anniversary`} · {format(parseISO(c.date), 'd MMM')}
            {c.daysAway > 0 && ` · in ${c.daysAway} day${c.daysAway === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline">{visibilityLabels[c.visibility]}</Badge>
        <Button size="sm" variant="outline" onClick={() => send(c.staffId, c.staffName, c.type)}>
          <Send className="h-3.5 w-3.5 mr-1.5" />
          Celebrate
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Cake className="h-5 w-5 text-primary" />
            Birthdays & anniversaries
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Next {settings.lookAheadDays} days · {celebrations.length} celebration{celebrations.length === 1 ? '' : 's'}
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowSettings(true)}>
          <Settings2 className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><PartyPopper className="h-4 w-4" />Today</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {today.length ? today.map(row) : <p className="text-sm text-muted-foreground">Nothing to celebrate today.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Coming up</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {upcoming.length ? upcoming.map(row) : <p className="text-sm text-muted-foreground">No celebrations in this window.</p>}
        </CardContent>
      </Card>

      <PrimaryOffCanvas
        open={showSettings}
        onClose={() => setShowSettings(false)}
        title="Celebration settings"
        description="Control which celebrations appear and who can see them."
        icon={Settings2}
        size="lg"
        actions={[{ label: 'Done', variant: 'primary' as const, onClick: () => setShowSettings(false) }]}
      >
        <div className="space-y-4">
          {[
            { key: 'birthdaysEnabled' as const, title: 'Show birthdays', hint: 'Uses the date of birth on the staff record.' },
            { key: 'anniversariesEnabled' as const, title: 'Show work anniversaries', hint: 'Counted from the employment start date.' },
            { key: 'autoPost' as const, title: 'Post automatically on the day', hint: 'A celebration post is created each morning.' },
          ].map((s) => (
            <div key={s.key} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.hint}</p>
              </div>
              <Switch checked={settings[s.key]} onCheckedChange={(v) => update({ [s.key]: v })} />
            </div>
          ))}

          <div className="space-y-2">
            <Label>Default birthday privacy</Label>
            <Select value={settings.defaultBirthdayVisibility} onValueChange={(v) => update({ defaultBirthdayVisibility: v as CelebrationVisibility })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(visibilityLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Who sees celebrations</Label>
            <Select value={settings.audience} onValueChange={(v) => update({ audience: v as 'company' | 'team' })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="company">Whole company</SelectItem>
                <SelectItem value="team">Their department only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Days to look ahead</Label>
            <Input
              type="number"
              min={1}
              max={365}
              value={settings.lookAheadDays}
              onChange={(e) => update({ lookAheadDays: Math.max(1, parseInt(e.target.value) || 1) })}
            />
          </div>

          <div className="space-y-2">
            <Label>Milestone anniversary years</Label>
            <Input
              placeholder="e.g. 1, 3, 5, 10 — leave blank to celebrate every year"
              defaultValue={settings.milestoneYears.join(', ')}
              onBlur={(e) =>
                update({
                  milestoneYears: e.target.value
                    .split(',')
                    .map((n) => parseInt(n.trim()))
                    .filter((n) => !isNaN(n) && n > 0),
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Per-person privacy</Label>
            <div className="space-y-2 max-h-72 overflow-auto">
              {staff.filter((s) => s.status === 'active').map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border p-2">
                  <span className="text-sm">{s.firstName} {s.lastName}</span>
                  <Select
                    value={settings.overrides[s.id] ?? settings.defaultBirthdayVisibility}
                    onValueChange={(v) => setVisibility(s.id, v as CelebrationVisibility)}
                  >
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(visibilityLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PrimaryOffCanvas>
    </div>
  );
}
