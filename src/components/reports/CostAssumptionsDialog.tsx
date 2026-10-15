import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2 } from 'lucide-react';
import { REPORT_RATE_FIELDS, getReportRates, setReportRates, resetReportRates, useReportRates } from '@/lib/reports/reportRates';

export function CostAssumptionsDialog() {
  const [open, setOpen] = useState(false);
  const rates = useReportRates();
  const [draft, setDraft] = useState(() => getReportRates());

  const onOpenChange = (next: boolean) => {
    if (next) setDraft(getReportRates());
    setOpen(next);
  };

  const save = () => {
    setReportRates(draft);
    setOpen(false);
  };

  const reset = () => {
    const defaults = resetReportRates();
    setDraft(defaults);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onOpenChange(true)}>
        <Settings2 className="h-3.5 w-3.5" /> Cost assumptions
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cost assumptions</DialogTitle>
          <DialogDescription>
            These estimated rates are used across reports whenever a staff member's actual rate, award
            penalty or agency rate isn't available. Changing a value here updates every report that uses it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto py-2">
          {REPORT_RATE_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label htmlFor={f.key} className="text-xs">{f.label}</Label>
              <div className="flex items-center gap-1">
                {f.prefix && <span className="text-xs text-muted-foreground">{f.prefix}</span>}
                <Input
                  id={f.key}
                  type="number"
                  value={draft[f.key]}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: Number(e.target.value) }))}
                  className="h-8 text-sm"
                />
                {f.suffix && <span className="text-xs text-muted-foreground">{f.suffix}</span>}
              </div>
              <p className="text-[10px] text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" size="sm" onClick={reset}>Reset to defaults</Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={save}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
