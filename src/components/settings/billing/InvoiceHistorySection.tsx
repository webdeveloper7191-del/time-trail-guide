import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { CURRENCY, formatMoney, useBilling } from '@/lib/billingStore';
import { downloadInvoicePdf, downloadInvoicesCsv } from '@/lib/invoiceDownload';

const statusVariant = (status: string) =>
  status === 'paid' ? 'secondary' : status === 'refunded' ? 'outline' : 'default';

/**
 * Past Stripe invoices with per-invoice PDF downloads. Rendered inside the
 * billing / upgrade side panels so history is always one scroll away.
 */
export function InvoiceHistorySection({ limit = 6 }: { limit?: number }) {
  const billing = useBilling();
  const invoices = billing.invoices.slice(0, limit);

  return (
    <section className="rounded-lg border bg-background p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          Invoice history
        </h3>
        {billing.invoices.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => downloadInvoicesCsv(billing.invoices)}
          >
            <Download className="h-3.5 w-3.5" />
            Export all
          </Button>
        )}
      </div>

      {invoices.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No invoices yet. Your first receipt appears here right after checkout.
        </p>
      ) : (
        <div className="rounded-md border divide-y">
          {invoices.map(inv => (
            <div key={inv.id} className="flex items-center gap-3 px-3 py-2">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{inv.description}</p>
                <p className="text-[11px] text-muted-foreground">
                  {format(new Date(inv.date), 'dd MMM yyyy')} · {inv.id}
                </p>
              </div>
              <span className="text-xs font-medium tabular-nums">
                {formatMoney(inv.amount)} <span className="text-[10px]">{CURRENCY}</span>
              </span>
              <Badge variant={statusVariant(inv.status)} className="text-[10px] capitalize">
                {inv.status}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={`Download invoice ${inv.id}`}
                onClick={() => downloadInvoicePdf(inv, billing)}
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {billing.invoices.length > limit && (
        <p className="text-[11px] text-muted-foreground">
          Showing {limit} of {billing.invoices.length} invoices.
        </p>
      )}
    </section>
  );
}
