import { useEffect, useMemo, useState } from 'react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';
import { Button } from '@/components/mui/Button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { mockAwardRules } from '@/data/mockStaffData';
import {
  REQUIRED_DOCUMENTS,
  type DocumentUpload,
  type RateCardEntry,
  type CoverageZoneEntry,
} from './AgencyOnboardingWizard';
import {
  AgencyPartnerStore,
  type AgencyPartnerApplication,
} from '@/lib/agencyPartnerApplicationStore';
import { FileText, DollarSign, MapPin, Upload, Plus, X, CheckCircle2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CURRENT_USER = 'admin@rostered.ai';

// ---------------------------------------------------------------------------
// Compliance Documents
// ---------------------------------------------------------------------------

export function AgencyDocumentsPanel({
  app, open, onClose,
}: { app: AgencyPartnerApplication | null; open: boolean; onClose: () => void }) {
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);

  useEffect(() => {
    if (open && app) setDocuments(app.documents ?? []);
  }, [open, app]);

  if (!app) return null;

  const handleUpload = (type: DocumentUpload['type'], files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const newDoc: DocumentUpload = {
      id: `doc-${Date.now()}`,
      type,
      name: REQUIRED_DOCUMENTS.find(d => d.type === type)?.label || type,
      fileName: file.name,
      status: 'uploaded',
    };
    setDocuments(prev => [...prev.filter(d => d.type !== type), newDoc]);
  };

  const removeDoc = (id: string) => setDocuments(prev => prev.filter(d => d.id !== id));

  const handleSave = () => {
    AgencyPartnerStore.updateOnboardingSection(app.id, 'documents', documents, CURRENT_USER);
    toast.success('Compliance documents saved');
    onClose();
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Compliance Documents"
      description={app.agencyName}
      icon={FileText}
      size="xl"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outlined' },
        { label: 'Save', onClick: handleSave, variant: 'primary' },
      ]}
    >
      <FormSection title="Required Documents">
        <div className="space-y-3">
          {REQUIRED_DOCUMENTS.map(doc => {
            const uploaded = documents.find(d => d.type === doc.type);
            return (
              <div key={doc.type} className="flex items-center justify-between border rounded-md p-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{doc.label}</div>
                  {uploaded ? (
                    <div className="text-xs text-muted-foreground truncate">{uploaded.fileName}</div>
                  ) : (
                    <div className="text-xs text-muted-foreground">Not uploaded</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {uploaded ? (
                    <>
                      <Badge className="bg-emerald-600 text-white text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />Uploaded
                      </Badge>
                      <Button variant="ghost" size="small" onClick={() => removeDoc(uploaded.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <label htmlFor={`sec-upload-${doc.type}`}>
                      <input
                        id={`sec-upload-${doc.type}`}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={e => handleUpload(doc.type, e.target.files)}
                      />
                      <Button variant="outlined" size="small" component="span">
                        <Upload className="h-4 w-4 mr-1" />Upload
                      </Button>
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </FormSection>
    </PrimaryOffCanvas>
  );
}

// ---------------------------------------------------------------------------
// Rate Cards
// ---------------------------------------------------------------------------

export function AgencyRateCardsPanel({
  app, open, onClose,
}: { app: AgencyPartnerApplication | null; open: boolean; onClose: () => void }) {
  const [rateCards, setRateCards] = useState<RateCardEntry[]>([]);

  useEffect(() => {
    if (open && app) {
      setRateCards(app.rateCards?.length
        ? app.rateCards
        : [{ id: '1', roleName: '', awardName: '', classificationIds: [], baseRate: 0, casualLoading: 25, weekendRate: 0, publicHolidayRate: 0 }]);
    }
  }, [open, app]);

  const awardNames = useMemo(() => [...new Set(mockAwardRules.map(a => a.awardName))], []);

  if (!app) return null;

  const addRateCard = () => setRateCards(prev => [...prev, {
    id: `rate-${Date.now()}`, roleName: '', awardName: '', classificationIds: [],
    baseRate: 0, casualLoading: 25, weekendRate: 0, publicHolidayRate: 0,
  }]);
  const removeRateCard = (id: string) => setRateCards(prev => prev.filter(r => r.id !== id));
  const updateRateCard = <K extends keyof RateCardEntry>(id: string, field: K, value: RateCardEntry[K]) => {
    setRateCards(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };
  const toggleClassification = (id: string, classificationId: string) => {
    setRateCards(prev => prev.map(r => {
      if (r.id !== id) return r;
      const on = r.classificationIds.includes(classificationId);
      return {
        ...r,
        classificationIds: on
          ? r.classificationIds.filter(c => c !== classificationId)
          : [...r.classificationIds, classificationId],
      };
    }));
  };

  const handleSave = () => {
    const cleaned = rateCards.filter(r => r.roleName && r.baseRate > 0);
    AgencyPartnerStore.updateOnboardingSection(app.id, 'rateCards', cleaned, CURRENT_USER);
    toast.success('Rate cards saved');
    onClose();
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Rate Cards"
      description={app.agencyName}
      icon={DollarSign}
      size="2xl"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outlined' },
        { label: 'Save', onClick: handleSave, variant: 'primary' },
      ]}
    >
      <div className="space-y-4">
        {rateCards.map((rate, idx) => {
          const classificationsForAward = mockAwardRules.filter(a => a.awardName === rate.awardName);
          const selected = classificationsForAward.filter(a => rate.classificationIds.includes(a.id));
          return (
            <FormSection key={rate.id} title={`Rate Card ${idx + 1}`}>
              <div className="flex justify-end -mt-2 mb-2">
                {rateCards.length > 1 && (
                  <Button variant="ghost" size="small" onClick={() => removeRateCard(rate.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <FormField label="Role Name">
                <Input value={rate.roleName} onChange={e => updateRateCard(rate.id, 'roleName', e.target.value)} placeholder="e.g., Registered Nurse" />
              </FormField>
              <FormRow columns={2}>
                <FormField label="Award">
                  <Select
                    value={rate.awardName || undefined}
                    onValueChange={v => {
                      updateRateCard(rate.id, 'awardName', v);
                      updateRateCard(rate.id, 'classificationIds', []);
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select award" /></SelectTrigger>
                    <SelectContent>
                      {awardNames.map(name => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Classifications">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        disabled={!rate.awardName}
                        className={cn(
                          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
                          !rate.awardName && 'opacity-50 cursor-not-allowed',
                        )}
                      >
                        <span className="truncate text-left">
                          {selected.length === 0
                            ? (rate.awardName ? 'Select classifications' : 'Select award first')
                            : `${selected.length} selected`}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[360px] p-0">
                      <ScrollArea className="max-h-64">
                        <ul className="p-1">
                          {classificationsForAward.length === 0 && (
                            <li className="px-3 py-2 text-xs text-muted-foreground">No classifications for this award.</li>
                          )}
                          {classificationsForAward.map(c => {
                            const on = rate.classificationIds.includes(c.id);
                            return (
                              <li key={c.id}>
                                <label className="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer">
                                  <Checkbox checked={on} onCheckedChange={() => toggleClassification(rate.id, c.id)} className="mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{c.classification}</div>
                                    <div className="text-[11px] text-muted-foreground">Code: {c.level} · ${c.baseHourlyRate.toFixed(2)}/hr</div>
                                  </div>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </FormField>
              </FormRow>
              {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 -mt-2">
                  {selected.map(c => (
                    <Badge key={c.id} variant="secondary" className="gap-1.5 pr-1">
                      <span className="font-mono text-[10px] opacity-70">{c.level}</span>
                      <span>{c.classification}</span>
                      <button type="button" onClick={() => toggleClassification(rate.id, c.id)} className="ml-1 rounded-sm hover:bg-background/50 p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <FormRow columns={3}>
                <FormField label="Base Rate ($)">
                  <Input type="number" value={rate.baseRate || ''} onChange={e => updateRateCard(rate.id, 'baseRate', parseFloat(e.target.value) || 0)} placeholder="45.00" />
                </FormField>
                <FormField label="Weekend Rate ($)">
                  <Input type="number" value={rate.weekendRate || ''} onChange={e => updateRateCard(rate.id, 'weekendRate', parseFloat(e.target.value) || 0)} placeholder="56.25" />
                </FormField>
                <FormField label="Public Holiday ($)">
                  <Input type="number" value={rate.publicHolidayRate || ''} onChange={e => updateRateCard(rate.id, 'publicHolidayRate', parseFloat(e.target.value) || 0)} placeholder="90.00" />
                </FormField>
              </FormRow>
            </FormSection>
          );
        })}
        <Button variant="outlined" onClick={addRateCard} className="w-full">
          <Plus className="h-4 w-4 mr-2" />Add Rate Card
        </Button>
      </div>
    </PrimaryOffCanvas>
  );
}

// ---------------------------------------------------------------------------
// Coverage Zones
// ---------------------------------------------------------------------------

export function AgencyCoverageZonesPanel({
  app, open, onClose,
}: { app: AgencyPartnerApplication | null; open: boolean; onClose: () => void }) {
  const [zones, setZones] = useState<CoverageZoneEntry[]>([]);

  useEffect(() => {
    if (open && app) {
      setZones(app.coverageZones?.length
        ? app.coverageZones
        : [{ id: '1', name: '', centrePostcode: '', radiusKm: 25, postcodes: '', slaMinutes: 60 }]);
    }
  }, [open, app]);

  if (!app) return null;

  const add = () => setZones(prev => [...prev, {
    id: `zone-${Date.now()}`, name: '', centrePostcode: '', radiusKm: 25, postcodes: '', slaMinutes: 60,
  }]);
  const remove = (id: string) => setZones(prev => prev.filter(z => z.id !== id));
  const update = <K extends keyof CoverageZoneEntry>(id: string, field: K, value: CoverageZoneEntry[K]) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, [field]: value } : z));
  };

  const handleSave = () => {
    const cleaned = zones.filter(z => z.name && z.centrePostcode && z.radiusKm > 0);
    AgencyPartnerStore.updateOnboardingSection(app.id, 'coverageZones', cleaned, CURRENT_USER);
    toast.success('Coverage zones saved');
    onClose();
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Coverage Zones"
      description={app.agencyName}
      icon={MapPin}
      size="2xl"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outlined' },
        { label: 'Save', onClick: handleSave, variant: 'primary' },
      ]}
    >
      <div className="space-y-4">
        {zones.map((zone, idx) => (
          <FormSection key={zone.id} title={`Coverage Zone ${idx + 1}`}>
            <div className="flex justify-end -mt-2 mb-2">
              {zones.length > 1 && (
                <Button variant="ghost" size="small" onClick={() => remove(zone.id)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <FormField label="Zone Name">
              <Input value={zone.name} onChange={e => update(zone.id, 'name', e.target.value)} placeholder="e.g., Sydney CBD" />
            </FormField>
            <FormRow columns={3}>
              <FormField label="Centre Postcode">
                <Input
                  value={zone.centrePostcode}
                  onChange={e => update(zone.id, 'centrePostcode', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="2000"
                  inputMode="numeric"
                  maxLength={4}
                />
              </FormField>
              <FormField label="Radius (km)">
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={zone.radiusKm || ''}
                  onChange={e => update(zone.id, 'radiusKm', Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="25"
                />
              </FormField>
              <FormField label="Response SLA (minutes)">
                <Input type="number" value={zone.slaMinutes} onChange={e => update(zone.id, 'slaMinutes', parseInt(e.target.value) || 60)} />
              </FormField>
            </FormRow>
            <FormField label="Additional Postcodes (optional)">
              <Input value={zone.postcodes} onChange={e => update(zone.id, 'postcodes', e.target.value)} placeholder="2010, 2011, 2015" />
            </FormField>
          </FormSection>
        ))}
        <Button variant="outlined" onClick={add} className="w-full">
          <Plus className="h-4 w-4 mr-2" />Add Coverage Zone
        </Button>
      </div>
    </PrimaryOffCanvas>
  );
}
