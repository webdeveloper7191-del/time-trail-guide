import { useState } from 'react';
import { CheckCircle2, Download, Link2, Link2Off, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AccountingPlatform, PayRun } from '@/types/payroll';
import { payrollStore, usePayroll } from '@/lib/payroll/payrollStore';
import { buildJournal, buildPlatformCsv, downloadFile, journalBalance, platformLabel } from '@/lib/payroll/accountingExport';
import { checkXeroConnection, postJournalToXero } from '@/lib/payroll/payrollCloud';
import { toast } from 'sonner';

interface Props {
  runs: PayRun[];
}

export function AccountingIntegrationsPanel({ runs }: Props) {
  usePayroll();
  const [platform, setPlatform] = useState<AccountingPlatform>('xero');
  const [runId, setRunId] = useState<string>(runs[0]?.id ?? '');

  const conn = payrollStore.getConnection(platform);
  const run = runs.find((r) => r.id === runId);
  const journal = run ? buildJournal(run, conn) : [];
  const balance = journalBalance(journal);

  const toggleConnect = () => {
    if (conn.connected) {
      payrollStore.updateConnection(platform, { connected: false, organisationName: undefined, lastSyncedAt: undefined });
      toast.success(`${platformLabel[platform]} disconnected.`);
    } else {
      payrollStore.updateConnection(platform, {
        connected: true,
        organisationName: 'Rostered.ai Demo Pty Ltd',
        tenantRef: crypto.randomUUID().slice(0, 8),
        lastSyncedAt: new Date().toISOString(),
      });
      toast.success(`${platformLabel[platform]} connected (file-based export).`);
    }
  };

  const exportRun = () => {
    if (!run) return;
    const f = buildPlatformCsv(run, conn);
    downloadFile(f.content, f.fileName);
    payrollStore.recordExport(run.id, { id: crypto.randomUUID(), platform, exportedAt: new Date().toISOString(), fileName: f.fileName, lineCount: f.rowCount });
    payrollStore.updateConnection(platform, { lastSyncedAt: new Date().toISOString() });
    toast.success(`${platformLabel[platform]} file downloaded — import it under Accounting → Journals.`);
  };

  const testXero = async () => {
    setTestingXero(true);
    try {
      const result = await checkXeroConnection();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      const org = result.tenants?.[0];
      payrollStore.updateConnection('xero', {
        connected: true,
        organisationName: org?.tenantName ?? 'Xero organisation',
        tenantRef: org?.tenantId,
        lastSyncedAt: new Date().toISOString(),
      });
      toast.success(`Live Xero connection verified — ${org?.tenantName ?? 'organisation linked'}.`);
    } finally {
      setTestingXero(false);
    }
  };

  const postXeroJournal = async () => {
    if (!run) return;
    setTestingXero(true);
    try {
      const result = await postJournalToXero(run, journal);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      payrollStore.recordExport(run.id, {
        id: crypto.randomUUID(),
        platform: 'xero',
        exportedAt: new Date().toISOString(),
        fileName: `Xero manual journal ${result.manualJournalId ?? ''}`.trim(),
        lineCount: journal.length,
      });
      payrollStore.updateConnection('xero', { lastSyncedAt: new Date().toISOString() });
      toast.success('Journal posted to Xero.');
    } finally {
      setTestingXero(false);
    }
  };

  const restoreFromCloud = async () => {
    try {
      const count = await payrollStore.hydrateFromCloud();
      toast.success(count ? `${count} pay run(s) restored from the cloud archive.` : 'No archived pay runs found.');
    } catch {
      toast.error('Could not reach the cloud archive.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/30 p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Live Xero posting &amp; audit retention</p>
          <p className="text-xs text-muted-foreground">
            Verify the Xero organisation, post the selected run as a manual journal, or restore posted runs from the cloud archive.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={testXero} disabled={testingXero}>Test Xero connection</Button>
          <Button variant="outline" size="sm" onClick={postXeroJournal} disabled={testingXero || !run}>Post journal to Xero</Button>
          <Button variant="outline" size="sm" onClick={restoreFromCloud}>Restore from cloud</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {payrollStore.getConnections().map((c) => (
          <Card key={c.platform} className={platform === c.platform ? 'border-primary' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{platformLabel[c.platform]}</CardTitle>
                {c.connected
                  ? <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" />Connected</Badge>
                  : <Badge variant="outline">Not connected</Badge>}
              </div>
              <CardDescription>
                {c.connected ? `${c.organisationName} · synced ${c.lastSyncedAt ? new Date(c.lastSyncedAt).toLocaleDateString() : '—'}` : 'Map accounts and export journals.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant={platform === c.platform ? 'default' : 'outline'} size="sm" className="w-full" onClick={() => setPlatform(c.platform)}>
                Configure
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">{platformLabel[platform]} configuration</CardTitle>
              <CardDescription>Account mapping used when a pay run is exported.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { payrollStore.resetMappings(platform); toast.success('Mapping reset to defaults.'); }}>
                <RotateCcw className="h-4 w-4 mr-2" />Reset
              </Button>
              <Button variant={conn.connected ? 'outline' : 'default'} size="sm" onClick={toggleConnect}>
                {conn.connected ? <><Link2Off className="h-4 w-4 mr-2" />Disconnect</> : <><Link2 className="h-4 w-4 mr-2" />Connect</>}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Export mode</Label>
              <Select value={conn.exportMode} onValueChange={(v) => payrollStore.updateConnection(platform, { exportMode: v as 'journal' | 'timesheet' | 'bill' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="journal">Manual journal (summary)</SelectItem>
                  <SelectItem value="timesheet">Timesheet detail</SelectItem>
                  <SelectItem value="bill">Bill / payable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Organisation</Label>
              <Input
                value={conn.organisationName ?? ''}
                placeholder="Connect to set"
                onChange={(e) => payrollStore.updateConnection(platform, { organisationName: e.target.value })}
              />
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pay item</TableHead>
                  <TableHead>Account code</TableHead>
                  <TableHead>Tax code</TableHead>
                  <TableHead>Tracking</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conn.mappings.map((m) => (
                  <TableRow key={m.key}>
                    <TableCell className="font-medium">{m.label}</TableCell>
                    <TableCell>
                      <Input className="h-8" value={m.accountCode} onChange={(e) => payrollStore.updateMapping(platform, m.key, { accountCode: e.target.value })} />
                    </TableCell>
                    <TableCell>
                      <Input className="h-8" value={m.taxCode ?? ''} onChange={(e) => payrollStore.updateMapping(platform, m.key, { taxCode: e.target.value })} />
                    </TableCell>
                    <TableCell>
                      <Input className="h-8" placeholder="Optional" value={m.trackingCategory ?? ''} onChange={(e) => payrollStore.updateMapping(platform, m.key, { trackingCategory: e.target.value })} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export a pay run</CardTitle>
          <CardDescription>Preview the journal before downloading the import file.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2 min-w-[260px]">
              <Label>Pay run</Label>
              <Select value={runId} onValueChange={setRunId}>
                <SelectTrigger><SelectValue placeholder="Select a pay run" /></SelectTrigger>
                <SelectContent>
                  {runs.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name} · {r.periodEnd}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={exportRun} disabled={!run || !balance.balanced}>
              <Download className="h-4 w-4 mr-2" />Export to {platformLabel[platform]}
            </Button>
          </div>

          {run && (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {journal.map((l, i) => (
                      <TableRow key={`${l.accountCode}-${i}`}>
                        <TableCell className="font-mono text-xs">{l.accountCode || '—'}</TableCell>
                        <TableCell>{l.description}</TableCell>
                        <TableCell className="text-right tabular-nums">{l.debit ? l.debit.toFixed(2) : ''}</TableCell>
                        <TableCell className="text-right tabular-nums">{l.credit ? l.credit.toFixed(2) : ''}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className={`text-sm ${balance.balanced ? 'text-muted-foreground' : 'text-destructive'}`}>
                Debits {balance.debit.toFixed(2)} · Credits {balance.credit.toFixed(2)} — {balance.balanced ? 'journal balances' : 'journal does not balance, check mappings'}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
