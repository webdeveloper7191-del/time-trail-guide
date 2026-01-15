import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/mui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Plus, X, Download, Send, Calculator, 
  DollarSign, Percent, Loader2
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
    setLineItems(prev => [...prev, {
      id: `item-${Date.now()}`,
      description: '',
      hours: 0,
      rate: 0,
      subtotal: 0,
      loadings: [],
      total: 0,
    }]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, [field]: value };
      
      // Recalculate totals
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
      
      return {
        ...item,
        loadings,
        total: item.subtotal + loadingsTotal,
      };
    }));
  };

  const removeLoading = (itemId: string, loadingIdx: number) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      
      const loadings = item.loadings.filter((_, idx) => idx !== loadingIdx);
      const loadingsTotal = loadings.reduce((sum, l) => sum + l.amount, 0);
      
      return {
        ...item,
        loadings,
        total: item.subtotal + loadingsTotal,
      };
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

    // Header
    doc.setFontSize(24);
    doc.text('INVOICE', 20, 30);
    
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoiceNumber}`, 20, 45);
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 20, 52);
    doc.text(`Due Date: ${dueDate ? format(new Date(dueDate), 'dd/MM/yyyy') : 'N/A'}`, 20, 59);

    // Client
    doc.setFontSize(12);
    doc.text('Bill To:', 120, 45);
    doc.setFontSize(10);
    doc.text(client?.name || 'Client', 120, 52);

    // Period
    doc.text(`Period: ${periodStart} to ${periodEnd}`, 20, 75);

    // Line items table
    let y = 90;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 20, y);
    doc.text('Hours', 100, y);
    doc.text('Rate', 120, y);
    doc.text('Total', 160, y);
    
    doc.setFont('helvetica', 'normal');
    y += 10;

    lineItems.forEach(item => {
      if (item.description && item.hours > 0) {
        doc.text(item.description.substring(0, 40), 20, y);
        doc.text(String(item.hours), 100, y);
        doc.text(`$${item.rate.toFixed(2)}`, 120, y);
        doc.text(`$${item.total.toFixed(2)}`, 160, y);
        y += 7;

        item.loadings.forEach(loading => {
          doc.setFontSize(8);
          doc.text(`  + ${loading.type} (${loading.percentage}%)`, 25, y);
          doc.text(`$${loading.amount.toFixed(2)}`, 160, y);
          y += 5;
          doc.setFontSize(10);
        });
      }
    });

    // Totals
    y += 10;
    doc.line(20, y, 190, y);
    y += 10;
    doc.text('Subtotal:', 130, y);
    doc.text(`$${subtotal.toFixed(2)}`, 160, y);
    y += 7;
    doc.text('GST (10%):', 130, y);
    doc.text(`$${gst.toFixed(2)}`, 160, y);
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 130, y);
    doc.text(`$${total.toFixed(2)}`, 160, y);

    doc.save(`${invoiceNumber}.pdf`);
    setIsGenerating(false);
    toast.success('Invoice PDF generated');
  };

  const handleSave = () => {
    const client = CLIENTS.find(c => c.id === clientId);
    const invoice: Partial<Invoice> = {
      invoiceNumber: `INV-${format(new Date(), 'yyyy')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      clientId,
      clientName: client?.name || '',
      periodStart,
      periodEnd,
      lineItems,
      subtotal,
      gst,
      total,
      status: 'draft',
      dueDate,
      createdAt: new Date().toISOString(),
    };
    onSave(invoice);
    toast.success('Invoice saved as draft');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Invoice
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Details */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {CLIENTS.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Period Start</Label>
              <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Period End</Label>
              <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <Label>Line Items</Label>
              <Button variant="outlined" size="small" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, idx) => (
                <Card key={item.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex gap-3">
                      <Input
                        className="flex-1"
                        placeholder="Description (e.g., Registered Nurse - Ward 5B)"
                        value={item.description}
                        onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                      />
                      <Input
                        className="w-20"
                        type="number"
                        placeholder="Hours"
                        value={item.hours || ''}
                        onChange={e => updateLineItem(item.id, 'hours', parseFloat(e.target.value) || 0)}
                      />
                      <Input
                        className="w-24"
                        type="number"
                        placeholder="Rate"
                        value={item.rate || ''}
                        onChange={e => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      />
                      <div className="w-24 text-right font-medium pt-2">
                        ${item.total.toFixed(2)}
                      </div>
                      {lineItems.length > 1 && (
                        <Button variant="ghost" size="small" onClick={() => removeLineItem(item.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Loadings */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-sm text-muted-foreground">Loadings:</span>
                      {item.loadings.map((loading, lidx) => (
                        <Badge key={lidx} variant="secondary" className="gap-1">
                          {loading.type} (+${loading.amount.toFixed(2)})
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeLoading(item.id, lidx)} />
                        </Badge>
                      ))}
                      <Select onValueChange={(val) => {
                        const loading = LOADING_TYPES.find(l => l.type === val);
                        if (loading) addLoading(item.id, loading.type, loading.percentage);
                      }}>
                        <SelectTrigger className="w-40 h-7 text-xs">
                          <Plus className="h-3 w-3 mr-1" />
                          Add Loading
                        </SelectTrigger>
                        <SelectContent>
                          {LOADING_TYPES.map(l => (
                            <SelectItem key={l.type} value={l.type}>
                              {l.type} (+{l.percentage}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>GST (10%):</span>
                <span>${gst.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
            <div className="flex gap-2">
              <Button variant="outlined" onClick={generatePDF} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                Export PDF
              </Button>
              <Button variant="contained" onClick={handleSave}>
                <Send className="h-4 w-4 mr-2" />
                Save Invoice
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceGenerator;
