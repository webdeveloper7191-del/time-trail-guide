import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { FileSignature, Paperclip, Upload, X } from 'lucide-react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  contractDocumentStore,
  contractDocumentTypeLabels,
  type ContractDocumentType,
} from '@/lib/contractDocumentStore';

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const today = () => format(new Date(), 'yyyy-MM-dd');

interface ContractSignaturePanelProps {
  open: boolean;
  onClose: () => void;
  staffId: string;
  staffName: string;
  staffEmail?: string;
  /** Which tab to land on. */
  defaultMode?: 'send' | 'upload';
  defaultTitle?: string;
  defaultType?: ContractDocumentType;
}

export function ContractSignaturePanel({
  open,
  onClose,
  staffId,
  staffName,
  staffEmail = '',
  defaultMode = 'send',
  defaultTitle = '',
  defaultType = 'employment_contract',
}: ContractSignaturePanelProps) {
  const [mode, setMode] = useState<'send' | 'upload'>(defaultMode);
  const [title, setTitle] = useState(defaultTitle);
  const [docType, setDocType] = useState<ContractDocumentType>(defaultType);
  const [email, setEmail] = useState(staffEmail);
  const [countersign, setCountersign] = useState('');
  const [message, setMessage] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [signedDate, setSignedDate] = useState(today());
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setMode(defaultMode);
    setTitle(defaultTitle);
    setDocType(defaultType);
    setEmail(staffEmail);
    setCountersign('');
    setMessage('');
    setDueDate('');
    setEffectiveDate('');
    setSignedDate(today());
    setFile(null);
  }, [open, defaultMode, defaultTitle, defaultType, staffEmail]);

  const pickFile = (picked: File | undefined) => {
    if (!picked) return;
    if (picked.size > MAX_FILE_BYTES) {
      toast.error('File is too large', { description: 'Maximum size is 20MB.' });
      return;
    }
    setFile(picked);
    if (!title) setTitle(picked.name.replace(/\.[^.]+$/, ''));
  };

  const handleSend = () => {
    if (!title.trim()) return toast.error('Add a document title');
    if (!email.trim()) return toast.error('Add the recipient email address');
    contractDocumentStore.sendForSignature({
      staffId,
      staffName,
      title: title.trim(),
      type: docType,
      message: message.trim() || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      effectiveDate: effectiveDate ? new Date(effectiveDate).toISOString() : undefined,
      signatories: [
        { name: staffName, email: email.trim(), role: 'employee' },
        ...(countersign.trim()
          ? [{ name: countersign.trim(), email: countersign.trim(), role: 'manager' as const }]
          : []),
      ],
    });
    toast.success('Sent for signature', { description: `${staffName} will receive an email at ${email}.` });
    onClose();
  };

  const handleUpload = () => {
    if (!file) return toast.error('Choose the signed file to upload');
    if (!title.trim()) return toast.error('Add a document title');
    contractDocumentStore.uploadSigned({
      staffId,
      staffName,
      title: title.trim(),
      type: docType,
      fileName: file.name,
      fileSize: file.size,
      signedAt: new Date(signedDate).toISOString(),
      effectiveDate: effectiveDate ? new Date(effectiveDate).toISOString() : undefined,
      note: message.trim() || undefined,
    });
    toast.success('Signed contract uploaded', { description: `Attached to ${staffName}'s record.` });
    onClose();
  };

  return (
    <PrimaryOffCanvas
      title="Contract signature"
      description={`Send for e-signature or upload a signed copy for ${staffName}`}
      icon={FileSignature}
      size="lg"
      open={open}
      onClose={onClose}
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outlined' },
        mode === 'send'
          ? { label: 'Send for signature', onClick: handleSend, variant: 'primary' as const }
          : { label: 'Upload signed contract', onClick: handleUpload, variant: 'primary' as const, disabled: !file },
      ]}
    >
      <div className="space-y-5">
        <Tabs value={mode} onValueChange={v => setMode(v as 'send' | 'upload')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="send">Send for signature</TabsTrigger>
            <TabsTrigger value="upload">Upload signed copy</TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label>Recipient email</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Countersigner (optional)</Label>
              <Input
                type="email"
                value={countersign}
                onChange={e => setCountersign(e.target.value)}
                placeholder="manager@company.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Sign by</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Effective date</Label>
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={e => setEffectiveDate(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 pt-4">
            {!file ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <Upload className="h-5 w-5 mx-auto text-primary" />
                <p className="text-sm font-medium mt-2">Choose signed contract</p>
                <p className="text-xs text-muted-foreground">PDF, PNG or JPG — up to 20MB</p>
              </button>
            ) : (
              <div className="rounded-md border bg-muted/30 p-3 flex items-start gap-2">
                <Paperclip className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFile(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              className="hidden"
              onChange={e => {
                pickFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date signed</Label>
                <Input
                  type="date"
                  value={signedDate}
                  max={today()}
                  onChange={e => setSignedDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Effective date</Label>
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={e => setEffectiveDate(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-1.5">
          <Label>Document title</Label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Employment Contract — Educator"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Document type</Label>
          <Select value={docType} onValueChange={v => setDocType(v as ContractDocumentType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(contractDocumentTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{mode === 'send' ? 'Message to recipient' : 'Internal note'}</Label>
          <Textarea
            rows={3}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={
              mode === 'send'
                ? 'Please review and sign your updated contract.'
                : 'Signed in person during induction.'
            }
          />
        </div>
      </div>
    </PrimaryOffCanvas>
  );
}

export default ContractSignaturePanel;
