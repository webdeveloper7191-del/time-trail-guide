import { useState } from 'react';
import { Qualification } from './StaffQualificationsSection';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Award, CalendarIcon, Upload, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface AddQualificationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (qualification: Qualification) => void;
}

const qualificationTypes = [
  { value: 'certification', label: 'Certification' },
  { value: 'license', label: 'License' },
  { value: 'training', label: 'Training' },
  { value: 'degree', label: 'Degree' },
  { value: 'other', label: 'Other' },
];

const commonQualifications = [
  'Working with Children Check',
  'First Aid Certificate',
  'CPR Certificate',
  'Certificate III in Early Childhood Education and Care',
  'Diploma of Early Childhood Education and Care',
  'Bachelor of Education (Early Childhood)',
  'Food Safety Certificate',
  'Anaphylaxis Management Training',
  'Asthma Management Training',
  'Child Protection Training',
  'Police Check / National Criminal History Check',
];

export function AddQualificationSheet({ open, onOpenChange, onAdd }: AddQualificationSheetProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<Qualification['type']>('certification');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState<Date | undefined>();
  const [expiryDate, setExpiryDate] = useState<Date | undefined>();
  const [hasExpiry, setHasExpiry] = useState(true);
  const [isRequired, setIsRequired] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!name || !issuer || !issueDate) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const newQualification: Qualification = {
      id: `qual-${Date.now()}`,
      name,
      type,
      issuer,
      issueDate: issueDate.toISOString().split('T')[0],
      expiryDate: hasExpiry && expiryDate ? expiryDate.toISOString().split('T')[0] : undefined,
      status: 'active',
      isRequired,
      notes: notes || undefined,
    };

    onAdd(newQualification);
    toast({ title: 'Qualification added successfully' });
    
    // Reset form
    setName('');
    setType('certification');
    setIssuer('');
    setIssueDate(undefined);
    setExpiryDate(undefined);
    setHasExpiry(true);
    setIsRequired(false);
    setNotes('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Add Qualification
          </SheetTitle>
          <SheetDescription>
            Add a new qualification, certification, or license
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Quick Select */}
          <div className="space-y-2">
            <Label>Quick Select (Common Qualifications)</Label>
            <Select onValueChange={(v) => setName(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select or type below" />
              </SelectTrigger>
              <SelectContent>
                {commonQualifications.map((q) => (
                  <SelectItem key={q} value={q}>{q}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label>Qualification Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. First Aid Certificate"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type *</Label>
            <Select value={type} onValueChange={(v) => setType(v as Qualification['type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {qualificationTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Issuer */}
          <div className="space-y-2">
            <Label>Issuing Organisation *</Label>
            <Input
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="e.g. St John Ambulance"
            />
          </div>

          {/* Issue Date */}
          <div className="space-y-2">
            <Label>Issue Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !issueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {issueDate ? format(issueDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={issueDate}
                  onSelect={setIssueDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Has Expiry */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasExpiry"
              checked={hasExpiry}
              onCheckedChange={(checked) => setHasExpiry(checked as boolean)}
            />
            <Label htmlFor="hasExpiry" className="font-normal">
              This qualification has an expiry date
            </Label>
          </div>

          {/* Expiry Date */}
          {hasExpiry && (
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Is Required */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isRequired"
              checked={isRequired}
              onCheckedChange={(checked) => setIsRequired(checked as boolean)}
            />
            <Label htmlFor="isRequired" className="font-normal">
              This is a required qualification for this role
            </Label>
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <Label>Upload Document</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, PNG, JPG up to 10MB
              </p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Add Qualification
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
