import { useMemo, useState, useSyncExternalStore } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Download,
  FileSignature,
  FileText,
  MoreHorizontal,
  Send,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ContractSignaturePanel } from './ContractSignaturePanel';
import {
  contractDocumentStore,
  contractDocumentTypeLabels,
  contractStatusLabels,
  type ContractDocumentStatus,
} from '@/lib/contractDocumentStore';

const statusStyles: Record<ContractDocumentStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200',
  viewed: 'bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-200',
  signed: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200',
  uploaded: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200',
  declined: 'bg-destructive/10 text-destructive',
  expired: 'bg-muted text-muted-foreground',
};

interface StaffContractsSectionProps {
  staff: { id: string; firstName: string; lastName: string; email?: string };
}

export function StaffContractsSection({ staff }: StaffContractsSectionProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [mode, setMode] = useState<'send' | 'upload'>('send');

  const docs = useSyncExternalStore(
    contractDocumentStore.subscribe,
    contractDocumentStore.all,
    contractDocumentStore.all,
  );

  const staffName = `${staff.firstName} ${staff.lastName}`;
  const rows = useMemo(
    () => docs.filter(d => d.staffId === staff.id || d.staffName === staffName),
    [docs, staff.id, staffName],
  );

  const openPanel = (m: 'send' | 'upload') => {
    setMode(m);
    setPanelOpen(true);
  };

  return (
    <div className="card-material-elevated p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="section-header">Contracts &amp; Documents</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Send contracts for e-signature or record a copy signed offline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => openPanel('upload')}>
            <Upload className="h-4 w-4 mr-2" />
            Upload signed
          </Button>
          <Button size="sm" onClick={() => openPanel('send')}>
            <Send className="h-4 w-4 mr-2" />
            Send for signature
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <FileSignature className="h-6 w-6 mx-auto text-muted-foreground" />
          <p className="text-sm font-medium mt-2">No contracts yet</p>
          <p className="text-xs text-muted-foreground">
            Send a contract for signature or upload one that was signed offline.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent / signed</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.source === 'upload' ? doc.fileName : `${doc.signatories.length} signatory(s)`}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{contractDocumentTypeLabels[doc.type]}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusStyles[doc.status]}>
                      {contractStatusLabels[doc.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {doc.completedAt
                      ? `Signed ${format(new Date(doc.completedAt), 'd MMM yyyy')}`
                      : doc.sentAt
                        ? `Sent ${format(new Date(doc.sentAt), 'd MMM yyyy')}`
                        : '—'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info('Opening document preview…')}>
                          <FileText className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        {(doc.status === 'sent' || doc.status === 'viewed') && (
                          <DropdownMenuItem
                            onClick={() => {
                              contractDocumentStore.resend(doc.id);
                              toast.success('Reminder sent');
                            }}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send reminder
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => toast.success('Download started')}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            contractDocumentStore.remove(doc.id);
                            toast.success('Document removed');
                          }}
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ContractSignaturePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        staffId={staff.id}
        staffName={staffName}
        staffEmail={staff.email}
        defaultMode={mode}
      />
    </div>
  );
}

export default StaffContractsSection;
