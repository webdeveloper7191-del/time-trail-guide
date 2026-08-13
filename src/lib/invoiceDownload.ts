import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { BillingState, CURRENCY, Invoice, formatMoney } from '@/lib/billingStore';

/** Builds a Stripe-style invoice PDF for a past charge and downloads it. */
export function downloadInvoicePdf(invoice: Invoice, billing: BillingState) {
  const doc = new jsPDF();
  const left = 16;
  let y = 22;

  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('rostered.ai', left, y);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Tax invoice', 194, y, { align: 'right' });

  y += 12;
  doc.setFontSize(9);
  doc.text(`Invoice ${invoice.id}`, left, y);
  doc.text(format(new Date(invoice.date), 'dd MMM yyyy'), 194, y, { align: 'right' });

  y += 6;
  doc.text(`Billed to: ${billing.companyName || billing.billingEmail || '—'}`, left, y);
  doc.text(invoice.status.toUpperCase(), 194, y, { align: 'right' });

  y += 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(left, y, 194, y);

  y += 9;
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.description, left, y);
  doc.text(`${formatMoney(invoice.amount)} ${CURRENCY}`, 194, y, { align: 'right' });

  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(left, y, 194, y);

  y += 9;
  doc.setFontSize(11);
  doc.text('Total', left, y);
  doc.text(`${formatMoney(invoice.amount)} ${CURRENCY}`, 194, y, { align: 'right' });

  y += 14;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Amounts include applicable tax. Demo environment — no card was charged.',
    left,
    y,
  );

  doc.save(`invoice_${invoice.id}_${format(new Date(invoice.date), 'yyyy-MM-dd')}.pdf`);
}

/** Downloads the full invoice history as CSV. */
export function downloadInvoicesCsv(invoices: Invoice[]) {
  const rows = [
    ['Invoice', 'Date', 'Description', `Amount (${CURRENCY})`, 'Status'],
    ...invoices.map(i => [
      i.id,
      format(new Date(i.date), 'yyyy-MM-dd'),
      `"${i.description.replace(/"/g, '""')}"`,
      i.amount.toFixed(2),
      i.status,
    ]),
  ];
  const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoices_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
