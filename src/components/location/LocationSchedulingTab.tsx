import React from 'react';
import { Calendar, Lock, Sparkles, Users, MessageSquare, ExternalLink, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export interface LocationSchedulingSettings {
  weekStartDay: 'inherit' | '0' | '1' | '2' | '3' | '4' | '5' | '6';
  shiftLockPolicy: 'inherit' | 'never' | 'on_publish' | '24h_before' | 'at_start' | 'on_timesheet_approval' | 'end_of_pay_period';
  autoReleaseUnconfirmed: 'disabled' | '1h' | '4h' | '12h' | '24h' | '48h' | '72h';
  suggestionPreset: 'best_fit' | 'lowest_cost' | 'fairest' | 'seniority' | 'skill_match' | 'custom';
  showLocationInSms: boolean;
  coworkerVisibility: 'inherit' | 'never' | 'same_area' | 'same_location' | 'same_department' | 'all_locations';
  allowSwaps: boolean;
  offerExpiry: '1h' | '4h' | '12h' | '24h' | 'until_start';
}

export const DEFAULT_SCHEDULING_SETTINGS: LocationSchedulingSettings = {
  weekStartDay: 'inherit',
  shiftLockPolicy: 'inherit',
  autoReleaseUnconfirmed: '24h',
  suggestionPreset: 'best_fit',
  showLocationInSms: true,
  coworkerVisibility: 'inherit',
  allowSwaps: true,
  offerExpiry: '24h',
};

interface Props {
  settings: LocationSchedulingSettings;
  onChange: (s: LocationSchedulingSettings) => void;
  isEditing: boolean;
}

const Section: React.FC<{ icon: React.ElementType; title: string; description?: string; children: React.ReactNode }> = ({ icon: Icon, title, description, children }) => (
  <div className="bg-card border border-border rounded-lg p-4 space-y-4">
    <div>
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Icon className="h-4 w-4" /> {title}
      </h3>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
    {children}
  </div>
);

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium">{label}</Label>
    {children}
    {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
  </div>
);

const LocationSchedulingTab: React.FC<Props> = ({ settings, onChange, isEditing }) => {
  const set = <K extends keyof LocationSchedulingSettings>(k: K, v: LocationSchedulingSettings[K]) =>
    onChange({ ...settings, [k]: v });

  const ro = !isEditing;

  return (
    <div className="space-y-6">
      {/* Core */}
      <Section icon={Calendar} title="Core" description="Basic location-level scheduling defaults.">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Week start day" hint="Used when displaying rosters at this location.">
            <Select value={settings.weekStartDay} onValueChange={(v) => set('weekStartDay', v as any)} disabled={ro}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="inherit">Inherit from tenant (Monday)</SelectItem>
                <SelectItem value="0">Sunday</SelectItem>
                <SelectItem value="1">Monday</SelectItem>
                <SelectItem value="2">Tuesday</SelectItem>
                <SelectItem value="3">Wednesday</SelectItem>
                <SelectItem value="4">Thursday</SelectItem>
                <SelectItem value="5">Friday</SelectItem>
                <SelectItem value="6">Saturday</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="rounded-md border border-border bg-muted/30 p-3 text-xs flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-foreground">Break duration is managed centrally</p>
            <p className="text-muted-foreground">Tiered break rules live in <span className="font-medium">Settings → Awards → Break Rules</span> as the single source of truth.</p>
          </div>
          <a href="/settings" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
            Manage break rules <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </Section>

      {/* Shift Management */}
      <Section icon={Lock} title="Shift Management" description="Location-specific overrides for shift behaviour.">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Shift lock policy" hint="When changes to published shifts become locked.">
            <Select value={settings.shiftLockPolicy} onValueChange={(v) => set('shiftLockPolicy', v as any)} disabled={ro}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="inherit">Inherit from tenant</SelectItem>
                <SelectItem value="never">Never lock</SelectItem>
                <SelectItem value="on_publish">On publish</SelectItem>
                <SelectItem value="24h_before">24h before start</SelectItem>
                <SelectItem value="at_start">At shift start</SelectItem>
                <SelectItem value="on_timesheet_approval">On timesheet approval</SelectItem>
                <SelectItem value="end_of_pay_period">End of pay period</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Auto-release unconfirmed shifts" hint="Convert unconfirmed shifts to open shifts before start.">
            <Select value={settings.autoReleaseUnconfirmed} onValueChange={(v) => set('autoReleaseUnconfirmed', v as any)} disabled={ro}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="disabled">Disabled</SelectItem>
                <SelectItem value="1h">1 hour before</SelectItem>
                <SelectItem value="4h">4 hours before</SelectItem>
                <SelectItem value="12h">12 hours before</SelectItem>
                <SelectItem value="24h">24 hours before</SelectItem>
                <SelectItem value="48h">48 hours before</SelectItem>
                <SelectItem value="72h">72 hours before</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Scheduling suggestion preset" hint="Drives the auto-scheduler's weights. 'Custom' uses the full Constraints panel.">
          <Select value={settings.suggestionPreset} onValueChange={(v) => set('suggestionPreset', v as any)} disabled={ro}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="best_fit">Best Fit (balanced)</SelectItem>
              <SelectItem value="lowest_cost">Lowest Cost</SelectItem>
              <SelectItem value="fairest">Fairest Distribution</SelectItem>
              <SelectItem value="seniority">Seniority First</SelectItem>
              <SelectItem value="skill_match">Skill Match</SelectItem>
              <SelectItem value="custom">Custom (use Constraints panel)</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <p className="text-sm font-medium flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5" /> Show location/area in SMS</p>
            <p className="text-xs text-muted-foreground">Include this location's name and the area in shift SMS notifications.</p>
          </div>
          <Switch checked={settings.showLocationInSms} onCheckedChange={(v) => set('showLocationInSms', v)} disabled={ro} />
        </div>
      </Section>

      {/* Swap & Offers */}
      <Section icon={Users} title="Swap & Offers" description="Controls staff visibility and shift swap behaviour.">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Co-worker visibility" hint="Who staff can see when offering or swapping shifts.">
            <Select value={settings.coworkerVisibility} onValueChange={(v) => set('coworkerVisibility', v as any)} disabled={ro}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="inherit">Inherit from tenant</SelectItem>
                <SelectItem value="never">Never visible</SelectItem>
                <SelectItem value="same_area">Same area only</SelectItem>
                <SelectItem value="same_location">Same location</SelectItem>
                <SelectItem value="same_department">Same department</SelectItem>
                <SelectItem value="all_locations">All locations</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Offer expiry" hint="How long an offered/swap shift stays open before expiring.">
            <Select value={settings.offerExpiry} onValueChange={(v) => set('offerExpiry', v as any)} disabled={ro}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 hour</SelectItem>
                <SelectItem value="4h">4 hours</SelectItem>
                <SelectItem value="12h">12 hours</SelectItem>
                <SelectItem value="24h">24 hours</SelectItem>
                <SelectItem value="until_start">Until shift start</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <p className="text-sm font-medium flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> Allow shift swaps & offers</p>
            <p className="text-xs text-muted-foreground">Staff at this location can request swaps and accept offered shifts.</p>
          </div>
          <Switch checked={settings.allowSwaps} onCheckedChange={(v) => set('allowSwaps', v)} disabled={ro} />
        </div>
      </Section>

      {/* Costs moved-out callout */}
      <div className="rounded-md border border-border bg-muted/30 p-3 text-xs flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-foreground">Costs are managed in Budget Configuration</p>
          <p className="text-muted-foreground">On-cost percentage and default open/empty shift cost live in Budget Configuration to avoid duplication.</p>
        </div>
        <Badge variant="outline" className="text-[10px]">Moved</Badge>
      </div>
    </div>
  );
};

export default LocationSchedulingTab;
