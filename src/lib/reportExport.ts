import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export interface ExportColumn {
  header: string;
  accessor: string | ((row: any) => string | number);
}

export function exportToCSV(title: string, columns: ExportColumn[], data: any[], filename?: string) {
  const headers = columns.map(c => c.header);
  const rows = data.map(row => 
    columns.map(col => {
      const val = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];
      const str = String(val ?? '');
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    })
  );
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || title.replace(/\s+/g, '_').toLowerCase()}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF(title: string, columns: ExportColumn[], data: any[], filename?: string) {
  const doc = new jsPDF({ orientation: 'landscape' });
  
  // Header
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(title, 14, 20);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated ${format(new Date(), 'dd MMM yyyy, h:mm a')}`, 14, 27);
  
  const headers = columns.map(c => c.header);
  const rows = data.map(row => 
    columns.map(col => {
      const val = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor];
      return String(val ?? '');
    })
  );

  autoTable(doc, {
    startY: 34,
    head: [headers],
    body: rows,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [14, 165, 233], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${filename || title.replace(/\s+/g, '_').toLowerCase()}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
