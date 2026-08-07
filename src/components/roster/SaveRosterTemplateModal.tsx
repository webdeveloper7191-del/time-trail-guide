import { useState, useMemo, useEffect } from 'react';
import { Shift, Room, Centre, StaffMember, roleLabels } from '@/types/roster';
import { Checkbox } from '@/components/ui/checkbox';
import { RosterTemplate, RosterTemplateShift } from '@/types/rosterTemplates';
import { format } from 'date-fns';
import { Save, FileText, CalendarDays, LayoutGrid, AlertCircle } from 'lucide-react';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField } from '@/components/ui/off-canvas/FormSection';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { StyledSwitch } from '@/components/ui/StyledSwitch';
import { CentreSelector } from './CentreSelector';
import { cn } from '@/lib/utils';

interface SaveRosterTemplateModalProps {
  open: boolean;
  onClose: () => void;
  shifts: Shift[];
  rooms: Room[];
  centreId: string;
  centres?: Centre[];
  staff?: StaffMember[];
  existingTemplates?: RosterTemplate[];
  dates: Date[];
  /** When `updateTemplateId` is provided the caller should overwrite that template instead of creating a new one. */
  onSave: (
    template: Omit<RosterTemplate, 'id' | 'createdAt' | 'updatedAt'>,
    updateTemplateId?: string,
  ) => void;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function SaveRosterTemplateModal({
  open,
  onClose,
  shifts,
  rooms: defaultRooms,
  centreId,
  centres,
  staff = [],
  existingTemplates = [],
  dates,
  onSave,
}: SaveRosterTemplateModalProps) {
  const [activeCentreId, setActiveCentreId] = useState(centreId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [includeStaffPreferences, setIncludeStaffPreferences] = useState(false);

  const areas = useMemo(() => {
    if (centres) {
      return centres.find(c => c.id === activeCentreId)?.rooms || [];
    }
    return defaultRooms;
  }, [centres, activeCentreId, defaultRooms]);

  // Shifts in the visible period for the active location, before area filtering.
  const periodShifts = useMemo(() => {
    const dateKeys = new Set(dates.map(d => format(d, 'yyyy-MM-dd')));
    return shifts.filter(s => s.centreId === activeCentreId && dateKeys.has(s.date));
  }, [shifts, activeCentreId, dates]);

  const shiftCountByArea = useMemo(() => {
    const counts: Record<string, number> = {};
    periodShifts.forEach(s => {
      counts[s.roomId] = (counts[s.roomId] || 0) + 1;
    });
    return counts;
  }, [periodShifts]);

  // Reset form state each time the panel opens, and keep the selection in sync
  // with whichever location is active (auto-select areas that actually have shifts).
  useEffect(() => {
    if (!open) return;
    setActiveCentreId(centreId);
    setName('');
    setDescription('');
    setIncludeStaffPreferences(false);
  }, [open, centreId]);

  useEffect(() => {
    if (!open) return;
    const withShifts = areas.filter(a => (shiftCountByArea[a.id] || 0) > 0).map(a => a.id);
    setSelectedAreas(withShifts.length > 0 ? withShifts : areas.map(a => a.id));
  }, [open, activeCentreId, areas, shiftCountByArea]);

  const relevantShifts = useMemo(
    () => periodShifts.filter(s => selectedAreas.includes(s.roomId)),
    [periodShifts, selectedAreas],
  );

  const staffById = useMemo(() => new Map(staff.map(s => [s.id, s])), [staff]);

  const coveredDays = useMemo(
    () => new Set(relevantShifts.map(s => new Date(`${s.date}T00:00:00`).getDay())),
    [relevantShifts],
  );

  const areasWithShifts = useMemo(
    () => selectedAreas.filter(id => (shiftCountByArea[id] || 0) > 0).length,
    [selectedAreas, shiftCountByArea],
  );

  const trimmedName = name.trim();
  const duplicate = existingTemplates.find(
    t => t.name.trim().toLowerCase() === trimmedName.toLowerCase() && t.centreId === activeCentreId,
  );

  const validationMessage = !trimmedName
    ? 'Enter a template name to continue.'
    : relevantShifts.length === 0
      ? 'No shifts match the selected location, areas and dates — nothing to save.'
      : duplicate
        ? `A template named "${duplicate.name}" already exists for this location. Saving will overwrite it.`
        : undefined;

  const canSave = !!trimmedName && relevantShifts.length > 0;

  const handleSave = () => {
    if (!canSave) return;

    const templateShifts: RosterTemplateShift[] = relevantShifts.map((shift, idx) => {
      const assigned = includeStaffPreferences ? staffById.get(shift.staffId) : undefined;
      return {
        id: `ts-${Date.now()}-${idx}`,
        roomId: shift.roomId,
        dayOfWeek: new Date(`${shift.date}T00:00:00`).getDay(),
        startTime: shift.startTime,
        endTime: shift.endTime,
        breakMinutes: shift.breakMinutes,
        staffRole: assigned ? roleLabels[assigned.role] : undefined,
        requiredQualifications: assigned?.qualifications?.length
          ? assigned.qualifications.map(q => String(q))
          : undefined,
        notes: shift.notes,
      };
    });

    onSave(
      {
        name: trimmedName,
        description: description.trim() || undefined,
        centreId: activeCentreId,
        shifts: templateShifts,
      },
      duplicate?.id,
    );

    onClose();
  };

  const toggleArea = (areaId: string) => {
    setSelectedAreas(prev =>
      prev.includes(areaId) ? prev.filter(id => id !== areaId) : [...prev, areaId],
    );
  };

  const allSelected = areas.length > 0 && selectedAreas.length === areas.length;

  const actions: OffCanvasAction[] = [
    { label: 'Cancel', onClick: onClose, variant: 'outlined' },
    {
      label: duplicate ? 'Update Template' : 'Save Template',
      onClick: handleSave,
      variant: 'primary',
      disabled: !canSave,
      icon: <Save size={16} />,
    },
  ];

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Save as Roster Template"
      description="Save the current period's shifts as a reusable template"
      icon={Save}
      size="lg"
      actions={actions}
    >
      <div className="space-y-5">
        {/* Template Details */}
        <FormSection title="Template Details">
          <FormField
            label="Template Name"
            required
            error={!trimmedName ? undefined : duplicate ? 'Name already in use — saving will overwrite it' : undefined}
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard Week, Holiday Roster"
              className="bg-background"
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when to use this template..."
              rows={2}
              className="bg-background resize-none"
            />
          </FormField>
        </FormSection>

        {/* Areas */}
        <FormSection title="Include Areas" tooltip="Select which areas to include in this template">
          {centres && centres.length > 0 && (
            <div className="mb-3">
              <CentreSelector
                centres={centres}
                selectedCentreId={activeCentreId}
                onCentreChange={setActiveCentreId}
                label="Location"
              />
            </div>
          )}

          {areas.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              This location has no areas configured yet.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  {selectedAreas.length} of {areas.length} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedAreas(allSelected ? [] : areas.map(a => a.id))}
                >
                  {allSelected ? 'Clear all' : 'Select all'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {areas.map(area => {
                  const isSelected = selectedAreas.includes(area.id);
                  const count = shiftCountByArea[area.id] || 0;
                  const isEmpty = count === 0;
                  return (
                    <button
                      type="button"
                      key={area.id}
                      onClick={() => toggleArea(area.id)}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-lg border text-left transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-background hover:border-primary/50',
                        isEmpty && 'opacity-60',
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        tabIndex={-1}
                        aria-hidden
                        className="pointer-events-none border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                      <span
                        className={cn(
                          'text-sm truncate',
                          isSelected ? 'font-semibold text-primary' : 'text-foreground',
                        )}
                      >
                        {area.name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">
                        {count} {count === 1 ? 'shift' : 'shifts'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </FormSection>

        {/* Staff */}
        <FormSection
          title="Staff on this template"
          tooltip="Choose whether the template remembers who was rostered, and for which staff types"
        >
          <div className="bg-background rounded-lg border p-4 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'unassign_all', label: 'Without staff', hint: 'Open shifts only' },
                { value: 'keep_all', label: 'With all staff', hint: 'Remember everyone' },
                { value: 'by_type', label: 'By staff type', hint: 'Choose cohorts' },
              ] as { value: RetentionMode; label: string; hint: string }[]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRetentionMode(opt.value)}
                  disabled={staff.length === 0}
                  className={cn(
                    'rounded-lg border p-3 text-left transition-all disabled:opacity-50',
                    retentionMode === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  <div className={cn('text-sm font-medium', retentionMode === opt.value && 'text-primary')}>
                    {opt.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{opt.hint}</div>
                </button>
              ))}
            </div>

            {retentionMode === 'by_type' && (
              <div className="space-y-2 pt-1">
                {(Object.keys(staffCohortLabels) as StaffCohort[]).map(cohort => (
                  <div key={cohort} className="flex items-center justify-between">
                    <span className="text-sm">{staffCohortLabels[cohort]}</span>
                    <StyledSwitch
                      size="small"
                      checked={retainCohorts[cohort]}
                      onChange={(v) => setRetainCohorts(prev => ({ ...prev, [cohort]: v }))}
                    />
                  </div>
                ))}
              </div>
            )}

            {retentionMode !== 'unassign_all' && (
              <p className="text-xs text-muted-foreground">
                {retainedStaffCount} of {relevantShifts.length} shifts will keep their assigned staff member;
                the rest are saved as open shifts.
              </p>
            )}

            <div className="border-t pt-3">
              <StyledSwitch
                checked={includeStaffPreferences}
                onChange={setIncludeStaffPreferences}
                label="Include staff role preferences"
                disabled={staff.length === 0}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {staff.length === 0
                  ? 'Staff details are unavailable for this period.'
                  : 'Stores the role and qualifications of the assigned staff member on each template shift, so re-applying suggests similar people.'}
              </p>
            </div>
          </div>
        </FormSection>


        {/* Summary + preview */}
        <FormSection title="Summary">
          <div className="flex items-center gap-4 p-4 bg-background border rounded-lg">
            <div className="flex items-center gap-1.5">
              <FileText size={16} className="text-primary" />
              <span className="text-sm font-medium">{relevantShifts.length} shifts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CalendarDays size={16} className="text-primary" />
              <span className="text-sm font-medium">{coveredDays.size} days</span>
            </div>
            <div className="flex items-center gap-1.5">
              <LayoutGrid size={16} className="text-primary" />
              <span className="text-sm font-medium">{areasWithShifts} areas</span>
            </div>
          </div>

          {relevantShifts.length > 0 && (
            <div className="rounded-lg border bg-background overflow-hidden">
              <div className="grid grid-cols-7 border-b bg-muted/40">
                {DAY_LABELS.map(d => (
                  <div key={d} className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground text-center">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {DAY_LABELS.map((d, dow) => {
                  const count = relevantShifts.filter(
                    s => new Date(`${s.date}T00:00:00`).getDay() === dow,
                  ).length;
                  return (
                    <div
                      key={d}
                      className={cn(
                        'px-2 py-2 text-center text-sm',
                        count > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {count || '—'}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {validationMessage && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
              <span>{validationMessage}</span>
            </div>
          )}
        </FormSection>
      </div>
    </PrimaryOffCanvas>
  );
}
