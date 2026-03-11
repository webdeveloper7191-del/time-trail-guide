import { useState } from 'react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';
import { Button } from '@/components/mui/Button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Plus, X, Download, Send, 
  DollarSign, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Invoice, InvoiceLineItem } from '@/types/agency';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

interface InvoiceGeneratorProps {
  open: boolean;
  onClose: () => void;
  onSave: (invoice: Partial<Invoice>) => void;
}

const LOADING_TYPES = [
  { type: 'Casual Loading', percentage: 25 },
  { type: 'Weekend Rate', percentage: 50 },
  { type: 'Public Holiday', percentage: 150 },
  { type: 'Overtime (1.5x)', percentage: 50 },
  { type: 'Overtime (2x)', percentage: 100 },
  { type: 'Night Shift', percentage: 15 },
];

const CLIENTS = [
  { id: 'client-1', name: 'Royal North Shore Hospital' },
  { id: 'client-2', name: 'The Langham Sydney' },
  { id: 'client-3', name: 'Little Scholars Early Learning' },
  { id: 'client-4', name: 'Aged Care Plus - Bondi' },
];

const InvoiceGenerator = ({ open, onClose, onSave }: InvoiceGeneratorProps) => {
  const [clientId, setClientId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { id: '1', description: '', hours: 0, rate: 0, subtotal: 0, loadings: [], total: 0 }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  const addLineItem = () => {
    setLineItems(prev => [...prev, { id: `item-${Date.now()}`, description: '', hours: 0, rate: 0, subtotal: 0, loadings: [], total: 0 }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      updated.subtotal = updated.hours * updated.rate;
      const loadingsTotal = updated.loadings.reduce((sum, l) => sum + l.amount, 0);
      updated.total = updated.subtotal + loadingsTotal;
      return updated;
    }));
  };

  const addLoading = (itemId: string, loadingType: string, percentage: number) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const amount = (item.subtotal * percentage) / 100;
      const newLoading = { type: loadingType, percentage, amount };
      const loadings = [...item.loadings, newLoading];
      const loadingsTotal = loadings.reduce((sum, l) => sum + l.amount, 0);
      return { ...item, loadings, total: item.subtotal + loadingsTotal };
    }));
  };

  const removeLoading = (itemId: string, loadingIdx: number) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const loadings = item.loadings.filter((_, idx) => idx !== loadingIdx);
      const loadingsTotal = loadings.reduce((sum, l) => sum + l.amount, 0);
      return { ...item, loadings, total: item.subtotal + loadingsTotal };
    }));
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const gst = subtotal * 0.1;
  const total = subtotal + gst;

  const generatePDF = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const doc = new jsPDF();
    const client = CLIENTS.find(c => c.id === clientId);
    const invoiceNumber = `INV-${format(new Date(), 'yyyy')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    doc.setFontSize(24); doc.text('INVOICE', 20, 30);
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoiceNumber}`, 20, 45);
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 20, 52);
    doc.text(`Due Date: ${dueDate ? format(new Date(dueDate), 'dd/MM/yyyy') : 'N/A'}`, 20, 59);
    doc.setFontSize(12); doc.text('Bill To:', 120, 45);
    doc.setFontSize(10); doc.text(client?.name || 'Client', 120, 52);
    doc.text(`Period: ${periodStart} to ${periodEnd}`, 20, 75);
    let y = 90;
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 20, y); doc.text('Hours', 100, y); doc.text('Rate', 120, y); doc.text('Total', 160, y);
    doc.setFont('helvetica', 'normal'); y += 10;
    lineItems.forEach(item => {
      if (item.description && item.hours > 0) {
        doc.text(item.description.substring(0, 40), 20, y); doc.text(String(item.hours), 100, y);
        doc.text(`$${item.rate.toFixed(2)}`, 120, y); doc.text(`$${item.total.toFixed(2)}`, 160, y); y += 7;
        item.loadings.forEach(loading => { doc.setFontSize(8); doc.text(`  + ${loading.type} (${loading.percentage}%)`, 25, y); doc.text(`$${loading.amount.toFixed(2)}`, 160, y); y += 5; doc.setFontSize(10); });
      }
    });
    y += 10; doc.line(20, y, 190, y); y += 10;
    doc.text('Subtotal:', 130, y); doc.text(`$${subtotal.toFixed(2)}`, 160, y); y += 7;
    doc.text('GST (10%):', 130, y); doc.text(`$${gst.toFixed(2)}`, 160, y); y += 7;
    doc.setFont('helvetica', 'bold'); doc.text('Total:', 130, y); doc.text(`$${total.toFixed(2)}`, 160, y);
    doc.save(`${invoiceNumber}.pdf`);
    setIsGenerating(false);
    toast.success('Invoice PDF generated');
  };

  const handleSave = () => {
    const client = CLIENTS.find(c => c.id === clientId);
    const invoice: Partial<Invoice> = {
      invoiceNumber: `INV-${format(new Date(), 'yyyy')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      clientId, clientName: client?.name || '', periodStart, periodEnd,
      lineItems, subtotal, gst, total, status: 'draft', dueDate, createdAt: new Date().toISOString(),
    };
    onSave(invoice);
    toast.success('Invoice saved as draft');
    onClose();
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Generate Invoice"
      icon={FileText}
      size="xl"
      isBackground
      actions={[
        { label: 'Cancel', variant: 'outlined', onClick: onClose },
        { label: 'Export PDF', variant: 'outlined', onClick: generatePDF, disabled: isGenerating, icon: isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" /> },
        { label: 'Save Invoice', variant: 'primary', onClick: handleSave, icon: <Send className="h-4 w-4" /> },
      ]}
    >
      <FormSection title="Invoice Details">
        <FormRow columns={2}>
          <FormField label="Client" required>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>{CLIENTS.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Due Date">
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </FormField>
        </FormRow>
        <FormRow columns={2}>
          <FormField label="Period Start">
            <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
          </FormField>
          <FormField label="Period End">
            <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
          </FormField>
        </FormRow>
      </FormSection>

      <FormSection title="Line Items">
        <div className="flex justify-end -mt-2 mb-2">
          <Button variant="outlined" size="small" onClick={addLineItem}><Plus className="h-3.5 w-3.5 mr-1" /> Add Item</Button>
        </div>
        <div className="space-y-3">
          {lineItems.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-background p-3 space-y-2">
              <div className="flex gap-2">
                <Input className="flex-1" placeholder="Description (e.g., Registered Nurse - Ward 5B)" value={item.description} onChange={e => updateLineItem(item.id, 'description', e.target.value)} />
                <Input className="w-20" type="number" placeholder="Hours" value={item.hours || ''} onChange={e => updateLineItem(item.id, 'hours', parseFloat(e.target.value) || 0)} />
                <Input className="w-24" type="number" placeholder="Rate" value={item.rate || ''} onChange={e => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)} />
                <div className="w-24 text-right font-medium pt-2 text-sm">${item.total.toFixed(2)}</div>
                {lineItems.length > 1 && <Button variant="ghost" size="small" onClick={() => removeLineItem(item.id)}><X className="h-4 w-4" /></Button>}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-muted-foreground">Loadings:</span>
                {item.loadings.map((loading, lidx) => (
                  <Badge key={lidx} variant="secondary" className="gap-1 text-xs">{loading.type} (+${loading.amount.toFixed(2)})<X className="h-3 w-3 cursor-pointer" onClick={() => removeLoading(item.id, lidx)} /></Badge>
                ))}
                <Select onValueChange={(val) => { const loading = LOADING_TYPES.find(l => l.type === val); if (loading) addLoading(item.id, loading.type, loading.percentage); }}>
                  <SelectTrigger className="w-36 h-7 text-xs"><Plus className="h-3 w-3 mr-1" />Add Loading</SelectTrigger>
                  <SelectContent>{LOADING_TYPES.map(l => <SelectItem key={l.type} value={l.type}>{l.type} (+{l.percentage}%)</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection title="Totals">
        <div className="space-y-2">
          <div className="flex justify-between text-sm"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm"><span>GST (10%):</span><span>${gst.toFixed(2)}</span></div>
          <Separator />
          <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>${total.toFixed(2)}</span></div>
        </div>
      </FormSection>
    </PrimaryOffCanvas>
  );
};

export default InvoiceGenerator;
