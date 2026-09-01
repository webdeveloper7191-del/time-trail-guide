import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AccountingConnection,
  AccountingPlatform,
  PayRun,
  PayRunLine,
  StpYtdRow,
} from '@/types/payroll';

/**
 * Accounting exports.
 *
 * Every platform receives the same underlying pay run, shaped into the
 * import layout each product expects:
 *  - Xero      -> manual journal CSV (Narration/Date/Description/AccountCode/Debit/Credit)
 *  - MYOB      -> general journal CSV (AccountNumber/Debit/Credit/Memo)
 *  - QuickBooks-> journal entry CSV (JournalNo/Account/Debits/Credits/Name)
 * Plus an employee-level detail CSV, an ABA payment file and an STP YTD summary.
 */

const money = (n: number) => n.toFixed(2);

export function downloadFile(content: string, fileName: string, mime = 'text/csv') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function csv(rows: (string | number)[][]) {
  return rows
    .map((r) =>
      r
        .map((v) => {
          const s = String(v ?? '');
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(','),
    )
    .join('\n');
}

export interface JournalLine {
  accountCode: string;
  description: string;
  debit: number;
  credit: number;
  taxCode?: string;
  tracking?: string;
}

/** Aggregate a pay run into a balanced double-entry journal. */
export function buildJournal(run: PayRun, conn: AccountingConnection): JournalLine[] {
  const active = run.lines.filter((l) => !l.excluded);
  const mapOf = (key: string) => conn.mappings.find((m) => m.key === key);

  const buckets = new Map<string, number>();
  active.forEach((line) => {
    line.components.forEach((c) => {
      if (c.kind === 'deduction') return;
      buckets.set(c.kind, (buckets.get(c.kind) ?? 0) + c.amount);
    });
  });

  const lines: JournalLine[] = [];

  buckets.forEach((amount, kind) => {
    if (Math.abs(amount) < 0.005) return;
    const m = mapOf(kind);
    lines.push({
      accountCode: m?.accountCode ?? '',
      description: m?.label ?? kind,
      debit: Number(money(amount)),
      credit: 0,
      taxCode: m?.taxCode,
      tracking: m?.trackingCategory,
    });
  });

  const superTotal = run.totals.superGuarantee;
  if (superTotal > 0) {
    const m = mapOf('super');
    lines.push({ accountCode: m?.accountCode ?? '', description: m?.label ?? 'Superannuation', debit: Number(money(superTotal)), credit: 0, taxCode: m?.taxCode });
    lines.push({ accountCode: m?.accountCode ?? '', description: 'Super payable', debit: 0, credit: Number(money(superTotal)), taxCode: m?.taxCode });
  }

  const lumpSumTax = run.lines.filter((l) => !l.excluded).reduce((s, l) => s + (l.lumpSumTax ?? 0), 0);
  const withheld = run.totals.paygTax + lumpSumTax;
  if (withheld > 0) {
    const m = mapOf('payg');
    lines.push({ accountCode: m?.accountCode ?? '', description: m?.label ?? 'PAYG withholding', debit: 0, credit: Number(money(withheld)), taxCode: m?.taxCode });
  }

  if (run.totals.deductions > 0) {
    const m = mapOf('deduction');
    lines.push({ accountCode: m?.accountCode ?? '', description: m?.label ?? 'Deductions', debit: 0, credit: Number(money(run.totals.deductions)), taxCode: m?.taxCode });
  }

  const net = mapOf('net');
  lines.push({ accountCode: net?.accountCode ?? '', description: net?.label ?? 'Net wages payable', debit: 0, credit: Number(money(run.totals.netPay)), taxCode: net?.taxCode });

  return lines;
}

export function journalBalance(lines: JournalLine[]) {
  const debit = lines.reduce((s, l) => s + l.debit, 0);
  const credit = lines.reduce((s, l) => s + l.credit, 0);
  return { debit: Number(money(debit)), credit: Number(money(credit)), balanced: Math.abs(debit - credit) < 0.05 };
}

export function buildPlatformCsv(run: PayRun, conn: AccountingConnection): { fileName: string; content: string; rowCount: number } {
  const journal = buildJournal(run, conn);
  const dateStr = format(new Date(run.paymentDate), 'dd/MM/yyyy');
  const narration = `${run.name} (${run.periodStart} to ${run.periodEnd})`;
  let rows: (string | number)[][] = [];
  let fileName = '';

  if (conn.platform === 'xero') {
    rows = [['Narration', 'Date', 'Description', 'AccountCode', 'TaxRate', 'Amount', 'TrackingName1', 'TrackingOption1']];
    journal.forEach((l) => {
      rows.push([
        narration,
        dateStr,
        l.description,
        l.accountCode,
        l.taxCode ?? 'BAS Excluded',
        money(l.debit > 0 ? l.debit : -l.credit),
        l.tracking ? 'Location' : '',
        l.tracking ?? '',
      ]);
    });
    fileName = `xero-journal-${run.id}.csv`;
  } else if (conn.platform === 'myob') {
    rows = [['Journal Number', 'Date', 'Memo', 'Account Number', 'Debit Ex-Tax', 'Credit Ex-Tax', 'Job', 'Tax Code']];
    journal.forEach((l) => {
      rows.push([run.id, dateStr, l.description, l.accountCode, money(l.debit), money(l.credit), l.tracking ?? '', l.taxCode ?? 'N-T']);
    });
    fileName = `myob-journal-${run.id}.txt`;
  } else {
    rows = [['JournalNo', 'JournalDate', 'Currency', 'Account', 'Debits', 'Credits', 'Description', 'Name', 'Location']];
    journal.forEach((l) => {
      rows.push([run.id, dateStr, 'AUD', l.accountCode, money(l.debit), money(l.credit), l.description, '', l.tracking ?? '']);
    });
    fileName = `quickbooks-journal-${run.id}.csv`;
  }

  return { fileName, content: csv(rows), rowCount: journal.length };
}

/** Employee-level detail CSV — useful for any platform's timesheet import or for audit. */
export function buildDetailCsv(run: PayRun): { fileName: string; content: string; rowCount: number } {
  const rows: (string | number)[][] = [[
    'Pay run', 'Period start', 'Period end', 'Payment date', 'Employee', 'Employee ID', 'Payroll ID',
    'Location', 'Pay item', 'Type', 'Units', 'Rate', 'Amount', 'Taxable', 'Superable',
  ]];
  run.lines.filter((l) => !l.excluded).forEach((line) => {
    line.components.forEach((c) => {
      rows.push([
        run.name, run.periodStart, run.periodEnd, run.paymentDate,
        line.staffName, line.employeeNumber ?? '', line.payrollId ?? '',
        line.locationName ?? '', c.label, c.kind, c.units, money(c.rate), money(c.amount),
        c.taxable ? 'Y' : 'N', c.superable ? 'Y' : 'N',
      ]);
    });
  });
  return { fileName: `pay-run-detail-${run.id}.csv`, content: csv(rows), rowCount: rows.length - 1 };
}

/**
 * ABA (Cemtex / APCA direct entry) payment file.
 *
 * Fixed-width 120-character records: one type-0 descriptive record, a type-1
 * detail record per payable employee, and a type-7 file total. Employees with
 * no bank details on file are skipped and reported back to the caller.
 */
export interface AbaOptions {
  /** 3-letter APCA financial institution abbreviation, e.g. ANZ / WBC / CBA. */
  bankCode?: string;
  /** Name of the paying (clearing) account. */
  accountName?: string;
  /** APCA user identification number (6 digits). */
  userNumber?: string;
  /** Withdrawal account BSB, e.g. 083-004. */
  bsb?: string;
  /** Withdrawal account number. */
  accountNumber?: string;
  /** Text shown on the employee's statement. */
  lodgementReference?: string;
}

const pad = (v: string | undefined, len: number) => (v ?? '').padEnd(len).slice(0, len);
const num = (v: number, len: number) => String(Math.round(v)).padStart(len, '0').slice(-len);
const cleanBsb = (bsb?: string) => {
  const digits = (bsb ?? '').replace(/\D/g, '').slice(0, 6);
  return digits.length === 6 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : '';
};
const cleanAccount = (acct?: string) => (acct ?? '').replace(/[^\d-]/g, '').slice(0, 9);

export function buildAbaFile(
  run: PayRun,
  options: AbaOptions | string = {},
  legacyAccountName?: string,
): { fileName: string; content: string; rowCount: number; skipped: string[] } {
  const opts: AbaOptions =
    typeof options === 'string' ? { bankCode: options, accountName: legacyAccountName } : options;
  const bankCode = (opts.bankCode || 'ANZ').toUpperCase();
  const accountName = opts.accountName || 'Payroll Clearing';
  const userNumber = (opts.userNumber || '').replace(/\D/g, '').padStart(6, '0').slice(-6);
  const selfBsb = cleanBsb(opts.bsb);
  const selfAccount = cleanAccount(opts.accountNumber);
  const reference = opts.lodgementReference || 'PAYROLL';

  const payable = run.lines.filter((l) => !l.excluded && l.netPay > 0);
  const skipped = payable
    .filter((l) => !cleanBsb(l.bankBsb) || !cleanAccount(l.bankAccountNumber))
    .map((l) => l.staffName);
  const active = payable.filter((l) => cleanBsb(l.bankBsb) && cleanAccount(l.bankAccountNumber));

  const dateStr = format(new Date(run.paymentDate), 'ddMMyy');

  // Type 0 — descriptive record (120 chars)
  const header =
    '0' +
    ' '.repeat(17) +
    '01' +
    pad(bankCode, 3) +
    ' '.repeat(7) +
    pad(accountName, 26) +
    userNumber +
    pad(reference, 12) +
    dateStr +
    ' '.repeat(40);

  // Type 1 — detail records
  const details = active.map((l) => {
    const amountCents = Math.round(l.netPay * 100);
    return (
      '1' +
      pad(cleanBsb(l.bankBsb), 7) +
      cleanAccount(l.bankAccountNumber).padStart(9) +
      ' ' + // withholding tax indicator
      '50' + // credit — pay
      num(amountCents, 10) +
      pad(l.bankAccountName || l.staffName, 32) +
      pad(reference, 18) +
      pad(selfBsb, 7) +
      selfAccount.padStart(9) +
      pad(accountName, 16) +
      num(0, 8) // withholding tax amount
    );
  });

  // Type 7 — file total record
  const totalCents = active.reduce((s, l) => s + Math.round(l.netPay * 100), 0);
  const trailer =
    '7' +
    '999-999' +
    ' '.repeat(12) +
    num(totalCents, 10) + // net total
    num(totalCents, 10) + // credit total
    num(0, 10) + // debit total
    ' '.repeat(24) +
    num(active.length, 6) +
    ' '.repeat(40);

  const lines = [header, ...details, trailer].map((l) => l.padEnd(120).slice(0, 120));
  return {
    fileName: `payment-${run.id}.aba`,
    content: lines.join('\r\n'),
    rowCount: active.length,
    skipped,
  };
}


/** STP-style YTD accumulation across posted (or all) pay runs. */
export function buildStpYtd(runs: PayRun[], financialYearStart: string): StpYtdRow[] {
  const map = new Map<string, StpYtdRow>();
  runs
    .filter((r) => r.paymentDate >= financialYearStart)
    .forEach((run) => {
      run.lines.filter((l) => !l.excluded).forEach((line) => {
        const row = map.get(line.staffId) ?? {
          staffId: line.staffId,
          staffName: line.staffName,
          payrollId: line.payrollId,
          grossPay: 0, paygTax: 0, superGuarantee: 0, allowances: 0, overtime: 0, netPay: 0, payRunCount: 0,
        };
        row.grossPay += line.grossPay;
        row.paygTax += line.paygTax;
        row.superGuarantee += line.superGuarantee;
        row.netPay += line.netPay;
        row.allowances += line.components.filter((c) => c.kind === 'allowance').reduce((s, c) => s + c.amount, 0);
        row.overtime += line.components.filter((c) => c.kind === 'overtime').reduce((s, c) => s + c.amount, 0);
        row.payRunCount += 1;
        map.set(line.staffId, row);
      });
    });
  return Array.from(map.values())
    .map((r) => ({
      ...r,
      grossPay: Number(money(r.grossPay)),
      paygTax: Number(money(r.paygTax)),
      superGuarantee: Number(money(r.superGuarantee)),
      allowances: Number(money(r.allowances)),
      overtime: Number(money(r.overtime)),
      netPay: Number(money(r.netPay)),
    }))
    .sort((a, b) => a.staffName.localeCompare(b.staffName));
}

export function buildStpCsv(rows: StpYtdRow[], fyStart: string): { fileName: string; content: string; rowCount: number } {
  const data: (string | number)[][] = [[
    'Payee name', 'Payroll ID', 'Gross YTD', 'PAYG withheld YTD', 'Super guarantee YTD',
    'Allowances YTD', 'Overtime YTD', 'Net YTD', 'Pay runs',
  ]];
  rows.forEach((r) => data.push([
    r.staffName, r.payrollId ?? r.staffId, money(r.grossPay), money(r.paygTax), money(r.superGuarantee),
    money(r.allowances), money(r.overtime), money(r.netPay), r.payRunCount,
  ]));
  return { fileName: `stp-ytd-${fyStart}.csv`, content: csv(data), rowCount: rows.length };
}

/** Payslip PDF for a single employee line. */
export function exportPayslipPdf(run: PayRun, line: PayRunLine) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Payslip', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${line.staffName}${line.locationName ? ` — ${line.locationName}` : ''}`, 14, 26);
  doc.text(`Pay period: ${run.periodStart} to ${run.periodEnd}`, 14, 32);
  doc.text(`Payment date: ${run.paymentDate}   |   Pay run: ${run.name}`, 14, 38);

  autoTable(doc, {
    startY: 46,
    head: [['Pay item', 'Units', 'Rate', 'Amount']],
    body: line.components.map((c) => [c.label, String(c.units), `$${money(c.rate)}`, `$${money(c.amount)}`]),
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59] },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const y = (doc as any).lastAutoTable.finalY + 10;
  autoTable(doc, {
    startY: y,
    body: [
      ['Gross pay', `$${money(line.grossPay)}`],
      ['PAYG withholding', `-$${money(line.paygTax)}`],
      ['Deductions', `-$${money(line.deductions)}`],
      ['Net pay', `$${money(line.netPay)}`],
      ['Superannuation guarantee', `$${money(line.superGuarantee)}`],
    ],
    theme: 'plain',
    columnStyles: { 0: { fontStyle: 'bold' } },
  });

  doc.save(`payslip-${line.staffName.replace(/\s+/g, '-').toLowerCase()}-${run.id}.pdf`);
}

export const platformLabel: Record<AccountingPlatform, string> = {
  xero: 'Xero',
  myob: 'MYOB',
  quickbooks: 'QuickBooks Online',
};
