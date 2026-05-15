import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';
import { LocationSchedulingSettings, DEFAULT_SCHEDULING_SETTINGS } from './LocationSchedulingTab';

interface Row {
  label: string;
  tenantValue: string;
  locationValue: string;
  isOverride: boolean;
  onReset?: () => void;
}

interface Props {
  settings: LocationSchedulingSettings;
  onChange: (s: LocationSchedulingSettings) => void;
  isEditing: boolean;
}

const fmt = (v: string) => v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const TENANT_DEFAULTS: Record<string, string> = {
  weekStartDay: 'Monday',
  shiftLockPolicy: 'On publish',
  coworkerVisibility: 'Same location',
};

const InheritanceSummaryTab: React.FC<Props> = ({ settings, onChange, isEditing }) => {
  const rows: Row[] = [
    {
      label: 'Week start day',
      tenantValue: TENANT_DEFAULTS.weekStartDay,
      locationValue: settings.weekStartDay === 'inherit' ? TENANT_DEFAULTS.weekStartDay : fmt(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][parseInt(settings.weekStartDay)]),
      isOverride: settings.weekStartDay !== 'inherit',
      onReset: () => onChange({ ...settings, weekStartDay: 'inherit' }),
    },
    {
      label: 'Shift lock policy',
      tenantValue: TENANT_DEFAULTS.shiftLockPolicy,
      locationValue: settings.shiftLockPolicy === 'inherit' ? TENANT_DEFAULTS.shiftLockPolicy : fmt(settings.shiftLockPolicy),
      isOverride: settings.shiftLockPolicy !== 'inherit',
      onReset: () => onChange({ ...settings, shiftLockPolicy: 'inherit' }),
    },
    {
      label: 'Auto-release unconfirmed shifts',
      tenantValue: '24h before',
      locationValue: settings.autoReleaseUnconfirmed === 'disabled' ? 'Disabled' : `${settings.autoReleaseUnconfirmed} before`,
      isOverride: settings.autoReleaseUnconfirmed !== DEFAULT_SCHEDULING_SETTINGS.autoReleaseUnconfirmed,
      onReset: () => onChange({ ...settings, autoReleaseUnconfirmed: DEFAULT_SCHEDULING_SETTINGS.autoReleaseUnconfirmed }),
    },
    {
      label: 'Suggestion preset',
      tenantValue: 'Best Fit',
      locationValue: fmt(settings.suggestionPreset),
      isOverride: settings.suggestionPreset !== 'best_fit',
      onReset: () => onChange({ ...settings, suggestionPreset: 'best_fit' }),
    },
    {
      label: 'Co-worker visibility',
      tenantValue: TENANT_DEFAULTS.coworkerVisibility,
      locationValue: settings.coworkerVisibility === 'inherit' ? TENANT_DEFAULTS.coworkerVisibility : fmt(settings.coworkerVisibility),
      isOverride: settings.coworkerVisibility !== 'inherit',
      onReset: () => onChange({ ...settings, coworkerVisibility: 'inherit' }),
    },
    {
      label: 'Allow shift swaps & offers',
      tenantValue: 'On',
      locationValue: settings.allowSwaps ? 'On' : 'Off',
      isOverride: settings.allowSwaps !== true,
      onReset: () => onChange({ ...settings, allowSwaps: true }),
    },
    {
      label: 'Offer expiry',
      tenantValue: '24h',
      locationValue: settings.offerExpiry === 'until_start' ? 'Until shift start' : settings.offerExpiry,
      isOverride: settings.offerExpiry !== '24h',
      onReset: () => onChange({ ...settings, offerExpiry: '24h' }),
    },
    {
      label: 'Show location/area in SMS',
      tenantValue: 'On',
      locationValue: settings.showLocationInSms ? 'On' : 'Off',
      isOverride: settings.showLocationInSms !== true,
      onReset: () => onChange({ ...settings, showLocationInSms: true }),
    },
  ];

  const overrides = rows.filter(r => r.isOverride).length;

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Settings inheritance</h3>
          <p className="text-xs text-muted-foreground">{overrides} override{overrides === 1 ? '' : 's'} from tenant defaults</p>
        </div>
        <Badge variant={overrides ? 'default' : 'outline'}>{overrides ? `${overrides} overridden` : 'All inherited'}</Badge>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Setting</th>
              <th className="text-left px-4 py-2 font-medium">Tenant default</th>
              <th className="text-left px-4 py-2 font-medium">This location</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-border">
                <td className="px-4 py-2.5 font-medium">{r.label}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.tenantValue}</td>
                <td className="px-4 py-2.5">{r.locationValue}</td>
                <td className="px-4 py-2.5">
                  {r.isOverride ? (
                    <Badge variant="default" className="text-[10px]">Overridden</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">Inherited</Badge>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {r.isOverride && isEditing && r.onReset && (
                    <Button variant="ghost" size="sm" onClick={r.onReset} className="h-7 text-xs">
                      <RotateCcw className="h-3 w-3 mr-1" /> Reset
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InheritanceSummaryTab;
