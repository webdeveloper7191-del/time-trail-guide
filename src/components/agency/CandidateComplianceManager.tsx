import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/mui/Button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Shield, AlertTriangle, CheckCircle2, Upload, FileText, Search, Bell, Download, Eye, Clock, XCircle,
} from 'lucide-react';
import { mockCandidates } from '@/data/mockAgencyData';
import {
  generateMockCandidateComplianceDocs,
  computeCandidateComplianceSummary,
  formatExpiryRelative,
  uploadComplianceDocument,
  getExpiringDocuments,
  DEFAULT_REQUIRED_DOCS_BY_ROLE,
} from '@/lib/candidateComplianceService';
import {
  CandidateComplianceDocument,
  CandidateDocumentType,
  candidateDocumentTypeLabels,
} from '@/types/agencyCompliance';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    valid: 'border-emerald-200 text-emerald-700 bg-emerald-50',
    expiring_soon: 'border-amber-200 text-amber-700 bg-amber-50',
    expired: 'border-red-200 text-red-700 bg-red-50',
    missing: 'border-slate-200 text-slate-700 bg-slate-50',
  };
  return cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border', map[status] ?? map.missing);
};

export function CandidateComplianceManager() {
  const [docs, setDocs] = useState<CandidateComplianceDocument[]>(() => generateMockCandidateComplianceDocs());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'compliant' | 'at_risk' | 'non_compliant'>('all');
  const [uploadDialog, setUploadDialog] = useState<{ candidateId: string; candidateName: string } | null>(null);
  const [uploadForm, setUploadForm] = useState<{ type: CandidateDocumentType; name: string; documentNumber: string; jurisdiction: string; issueDate: string; expiryDate: string; file: File | null }>({
    type: 'wwcc', name: '', documentNumber: '', jurisdiction: '', issueDate: new Date().toISOString().slice(0, 10), expiryDate: '', file: null,
  });
  const [uploading, setUploading] = useState(false);

  const requiredByRole = (role: string) =>
    DEFAULT_REQUIRED_DOCS_BY_ROLE.find(p => p.roleName.toLowerCase() === role.toLowerCase())?.required ?? [];

  const summaries = useMemo(
    () =>
      mockCandidates.map(c => ({
        candidate: c,
        summary: computeCandidateComplianceSummary(c.id, docs, requiredByRole(c.primaryRole)),
      })),
    [docs],
  );

  const expiring = useMemo(() => getExpiringDocuments(docs), [docs]);

  const filtered = useMemo(() => {
    return summaries
      .filter(({ candidate }) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return `${candidate.firstName} ${candidate.lastName}`.toLowerCase().includes(q)
          || candidate.primaryRole.toLowerCase().includes(q);
      })
      .filter(({ summary }) => {
        if (filter === 'all') return true;
        if (filter === 'compliant') return summary.isFullyCompliant && summary.expiringSoonCount === 0;
        if (filter === 'at_risk') return summary.expiringSoonCount > 0 && summary.expiredCount === 0 && summary.missingRequired.length === 0;
        return summary.expiredCount > 0 || summary.missingRequired.length > 0;
      });
  }, [summaries, search, filter]);

  const kpis = useMemo(() => ({
    total: summaries.length,
    compliant: summaries.filter(s => s.summary.isFullyCompliant).length,
    expiringSoon: docs.filter(d => d.status === 'expiring_soon').length,
    expired: docs.filter(d => d.status === 'expired').length,
  }), [summaries, docs]);

  const handleUpload = async () => {
    if (!uploadDialog || !uploadForm.file) return;
    setUploading(true);
    try {
      const newDoc = await uploadComplianceDocument(uploadDialog.candidateId, uploadForm.file, {
        type: uploadForm.type,
        name: uploadForm.name || candidateDocumentTypeLabels[uploadForm.type],
        documentNumber: uploadForm.documentNumber || undefined,
        jurisdiction: uploadForm.jurisdiction || undefined,
        issueDate: new Date(uploadForm.issueDate).toISOString(),
        expiryDate: uploadForm.expiryDate ? new Date(uploadForm.expiryDate).toISOString() : undefined,
      });
      setDocs(prev => [...prev, newDoc]);
      setUploadDialog(null);
      setUploadForm({ type: 'wwcc', name: '', documentNumber: '', jurisdiction: '', issueDate: new Date().toISOString().slice(0, 10), expiryDate: '', file: null });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KPI title="Candidates Tracked" value={kpis.total} icon={Shield} tone="blue" />
        <KPI title="Fully Compliant" value={kpis.compliant} icon={CheckCircle2} tone="emerald" />
        <KPI title="Expiring Soon" value={kpis.expiringSoon} icon={Clock} tone="amber" />
        <KPI title="Expired Documents" value={kpis.expired} icon={AlertTriangle} tone="red" />
      </div>

      {/* Expiry alerts banner */}
      {expiring.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
              <Bell className="h-4 w-4" /> {expiring.length} document{expiring.length === 1 ? '' : 's'} need attention
            </CardTitle>
            <CardDescription className="text-xs">Expiring or expired across your candidate pool</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {expiring.slice(0, 6).map(d => {
                const cand = mockCandidates.find(c => c.id === d.candidateId);
                return (
                  <Badge key={d.id} variant="outline" className="bg-background text-[11px]">
                    {cand ? `${cand.firstName} ${cand.lastName}` : d.candidateId} · {candidateDocumentTypeLabels[d.type]} · {formatExpiryRelative(d.expiryDate)}
                  </Badge>
                );
              })}
              {expiring.length > 6 && <Badge variant="outline" className="text-[11px]">+{expiring.length - 6} more</Badge>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidates" className="pl-8 h-9 text-sm" />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-44 h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="compliant">Fully compliant</SelectItem>
            <SelectItem value="at_risk">At risk (expiring)</SelectItem>
            <SelectItem value="non_compliant">Non-compliant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-background border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-[11px] font-semibold">Candidate</TableHead>
              <TableHead className="text-[11px] font-semibold">Role</TableHead>
              <TableHead className="text-[11px] font-semibold">Compliance</TableHead>
              <TableHead className="text-[11px] font-semibold">Documents</TableHead>
              <TableHead className="text-[11px] font-semibold">Next Expiry</TableHead>
              <TableHead className="text-[11px] font-semibold">Missing</TableHead>
              <TableHead className="text-[11px] font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(({ candidate, summary }) => (
              <TableRow key={candidate.id} className="hover:bg-muted/20 align-top">
                <TableCell className="text-[13px] font-medium">{candidate.firstName} {candidate.lastName}</TableCell>
                <TableCell className="text-[12px] text-muted-foreground">{candidate.primaryRole}</TableCell>
                <TableCell className="w-[160px]">
                  <div className="flex items-center gap-2">
                    <Progress value={summary.complianceScore} className="h-1.5 w-24" />
                    <span className={cn('text-[12px] font-semibold', summary.complianceScore >= 90 ? 'text-emerald-600' : summary.complianceScore >= 70 ? 'text-amber-600' : 'text-red-600')}>
                      {summary.complianceScore}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-[12px]">
                  <div className="flex gap-1 flex-wrap">
                    <span className={statusBadge('valid')}>{summary.validCount} valid</span>
                    {summary.expiringSoonCount > 0 && <span className={statusBadge('expiring_soon')}>{summary.expiringSoonCount} expiring</span>}
                    {summary.expiredCount > 0 && <span className={statusBadge('expired')}>{summary.expiredCount} expired</span>}
                  </div>
                </TableCell>
                <TableCell className="text-[12px] text-muted-foreground">
                  {summary.nextExpiryDate ? (
                    <>
                      <div className="text-foreground">{summary.nextExpiryType ? candidateDocumentTypeLabels[summary.nextExpiryType] : ''}</div>
                      <div>{formatExpiryRelative(summary.nextExpiryDate)}</div>
                    </>
                  ) : '—'}
                </TableCell>
                <TableCell className="text-[12px]">
                  {summary.missingRequired.length === 0 ? <span className="text-emerald-600">None</span> : (
                    <div className="flex gap-1 flex-wrap max-w-[200px]">
                      {summary.missingRequired.map(t => (
                        <Badge key={t} variant="outline" className="text-[10px] border-red-200 text-red-700 bg-red-50">
                          {candidateDocumentTypeLabels[t]}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="small" variant="outlined" onClick={() => setUploadDialog({ candidateId: candidate.id, candidateName: `${candidate.firstName} ${candidate.lastName}` })} className="h-7 text-xs">
                    <Upload className="h-3 w-3 mr-1" /> Upload
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Per-candidate document list - expand inline by listing all candidate docs below */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> All Documents</CardTitle>
          <CardDescription className="text-xs">Per-candidate compliance records ({docs.length} total)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-[11px]">Candidate</TableHead>
                <TableHead className="text-[11px]">Type</TableHead>
                <TableHead className="text-[11px]">Document #</TableHead>
                <TableHead className="text-[11px]">Issued</TableHead>
                <TableHead className="text-[11px]">Expiry</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
                <TableHead className="text-[11px]">Verified</TableHead>
                <TableHead className="text-[11px] text-right">File</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.slice(0, 30).map(d => {
                const cand = mockCandidates.find(c => c.id === d.candidateId);
                return (
                  <TableRow key={d.id} className="hover:bg-muted/20">
                    <TableCell className="text-[12px]">{cand ? `${cand.firstName} ${cand.lastName}` : d.candidateId}</TableCell>
                    <TableCell className="text-[12px]">{candidateDocumentTypeLabels[d.type]}</TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">{d.documentNumber ?? '—'}{d.jurisdiction ? ` (${d.jurisdiction})` : ''}</TableCell>
                    <TableCell className="text-[12px]">{format(new Date(d.issueDate), 'd MMM yyyy')}</TableCell>
                    <TableCell className="text-[12px]">{d.expiryDate ? format(new Date(d.expiryDate), 'd MMM yyyy') : 'No expiry'}</TableCell>
                    <TableCell><span className={statusBadge(d.status)}>{d.status.replace('_', ' ')}</span></TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">{d.verifiedBy ?? <span className="text-amber-600">Unverified</span>}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <button className="p-1 rounded hover:bg-muted text-muted-foreground" title="Preview"><Eye className="h-3.5 w-3.5" /></button>
                        <button className="p-1 rounded hover:bg-muted text-muted-foreground" title="Download"><Download className="h-3.5 w-3.5" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upload dialog */}
      <Dialog open={!!uploadDialog} onOpenChange={(o) => !o && setUploadDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Compliance Document</DialogTitle>
            <DialogDescription>{uploadDialog?.candidateName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Document Type</Label>
              <Select value={uploadForm.type} onValueChange={(v) => setUploadForm(f => ({ ...f, type: v as CandidateDocumentType }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(candidateDocumentTypeLabels).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Document Number</Label>
                <Input value={uploadForm.documentNumber} onChange={e => setUploadForm(f => ({ ...f, documentNumber: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Jurisdiction</Label>
                <Input value={uploadForm.jurisdiction} onChange={e => setUploadForm(f => ({ ...f, jurisdiction: e.target.value }))} placeholder="e.g. NSW" className="h-9 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Issue Date</Label>
                <Input type="date" value={uploadForm.issueDate} onChange={e => setUploadForm(f => ({ ...f, issueDate: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Expiry Date</Label>
                <Input type="date" value={uploadForm.expiryDate} onChange={e => setUploadForm(f => ({ ...f, expiryDate: e.target.value }))} className="h-9 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">File</Label>
              <Input type="file" accept="application/pdf,image/*" onChange={e => setUploadForm(f => ({ ...f, file: e.target.files?.[0] ?? null }))} className="h-9 text-sm" />
              <p className="text-[11px] text-muted-foreground mt-1">PDF or image, up to 10MB</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outlined" onClick={() => setUploadDialog(null)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!uploadForm.file || uploading}>
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPI({ title, value, icon: Icon, tone }: { title: string; value: number | string; icon: typeof Shield; tone: 'blue' | 'emerald' | 'amber' | 'red' }) {
  const toneClass = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
  }[tone];
  return (
    <div className="bg-background border border-border rounded-xl p-4 flex items-start justify-between">
      <div>
        <p className="text-[13px] text-muted-foreground font-medium">{title}</p>
        <p className="text-[22px] font-bold tracking-tight mt-1">{value}</p>
      </div>
      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', toneClass)}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}
