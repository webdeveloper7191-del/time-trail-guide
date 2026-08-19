import { useMemo, useState, useSyncExternalStore } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CheckCircle2, Download, FileSignature, FileText, PenTool } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import {
  contractDocumentStore,
  contractDocumentTypeLabels,
  contractStatusLabels,
  type ContractDocument,
} from '@/lib/contractDocumentStore';

interface EmployeeDocumentsPanelProps {
  employeeName: string;
}

export function EmployeeDocumentsPanel({ employeeName }: EmployeeDocumentsPanelProps) {
  const docs = useSyncExternalStore(
    contractDocumentStore.subscribe,
    contractDocumentStore.all,
    contractDocumentStore.all,
  );

  const [active, setActive] = useState<ContractDocument | null>(null);
  const [typedName, setTypedName] = useState('');
  const [agreed, setAgreed] = useState(false);

  const mine = useMemo(() => docs.filter(d => d.staffName === employeeName), [docs, employeeName]);
  const pending = mine.filter(d => d.status === 'sent' || d.status === 'viewed');
  const completed = mine.filter(d => d.status !== 'sent' && d.status !== 'viewed');

  const openSigning = (doc: ContractDocument) => {
    contractDocumentStore.markViewed(doc.id);
    setActive(doc);
    setTypedName(employeeName);
    setAgreed(false);
  };

  const handleSign = () => {
    if (!active) return;
    if (!agreed) return toast.error('Please confirm you have read the document');
    if (typedName.trim().toLowerCase() !== employeeName.toLowerCase())
      return toast.error('Typed name must match your full name');
    contractDocumentStore.sign(active.id, employeeName);
    toast.success('Document signed', { description: 'A copy has been saved to your records.' });
    setActive(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-primary" />
            Awaiting your signature
            {pending.length > 0 && <Badge variant="destructive">{pending.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing to sign right now.</p>
          ) : (
            pending.map(doc => (
              <div
                key={doc.id}
                className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors"
              >
                <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {contractDocumentTypeLabels[doc.type]}
                    {doc.dueDate && ` · Sign by ${format(new Date(doc.dueDate), 'd MMM yyyy')}`}
                  </p>
                </div>
                <Button size="sm" onClick={() => openSigning(doc)}>
                  <PenTool className="h-4 w-4 mr-2" />
                  Review &amp; sign
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">My documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {completed.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed documents yet.</p>
          ) : (
            completed.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 rounded-lg border p-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {contractStatusLabels[doc.status]}
                    {doc.completedAt && ` · ${format(new Date(doc.completedAt), 'd MMM yyyy')}`}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => toast.success('Download started')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <PrimaryOffCanvas
        title={active?.title ?? 'Review document'}
        description="Read the document, then sign electronically"
        icon={PenTool}
        size="lg"
        open={!!active}
        onClose={() => setActive(null)}
        actions={[
          { label: 'Cancel', onClick: () => setActive(null), variant: 'outlined' },
          {
            label: 'Decline',
            onClick: () => {
              if (active) contractDocumentStore.decline(active.id, 'Declined by employee');
              toast.info('Document declined');
              setActive(null);
            },
            variant: 'destructive',
          },
          { label: 'Sign document', onClick: handleSign, variant: 'primary', disabled: !agreed },
        ]}
      >
        {active && (
          <div className="space-y-5">
            <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
              <p className="font-medium">{active.title}</p>
              <p className="text-muted-foreground">{contractDocumentTypeLabels[active.type]}</p>
              {active.message && <p className="text-muted-foreground">{active.message}</p>}
              {active.effectiveDate && (
                <p className="text-muted-foreground">
                  Effective {format(new Date(active.effectiveDate), 'd MMM yyyy')}
                </p>
              )}
            </div>

            <div className="rounded-lg border p-4 h-56 overflow-auto text-sm text-muted-foreground leading-relaxed">
              This document sets out the terms of your engagement, including position, hours,
              classification, pay rate and applicable award conditions. By signing below you confirm
              that you have read and accept these terms. A signed copy will be stored against your
              employee record and is available to download at any time.
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="agree-doc"
                checked={agreed}
                onCheckedChange={v => setAgreed(v === true)}
              />
              <Label htmlFor="agree-doc" className="text-sm font-normal leading-snug">
                I have read this document and agree to sign it electronically.
              </Label>
            </div>

            <div className="space-y-1.5">
              <Label>Type your full name to sign</Label>
              <Input
                value={typedName}
                onChange={e => setTypedName(e.target.value)}
                placeholder={employeeName}
              />
            </div>
          </div>
        )}
      </PrimaryOffCanvas>
    </div>
  );
}

export default EmployeeDocumentsPanel;
