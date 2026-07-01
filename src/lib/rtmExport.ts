import { jsPDF } from 'jspdf';
import { RtmModule, buildRtm, summariseRtm } from './rtmBuilder';

// -------- CSV --------

function csvEscape(v: string): string {
  if (v == null) return '';
  const s = String(v).replace(/\r?\n/g, ' ').trim();
  if (/[",]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportRtmToCsv(modules: RtmModule[] = buildRtm()) {
  const header = [
    'Module', 'FR ID', 'Category', 'Requirement', 'Priority', 'Coverage',
    'User Stories', 'Tables', 'Business Rules', 'API Endpoints', 'Workflows',
  ];
  const lines = [header.map(csvEscape).join(',')];
  for (const m of modules) {
    for (const r of m.rows) {
      lines.push([
        m.name, r.frId, r.category, r.requirement, r.priority, r.coverage,
        r.userStories.map(x => x.id).join(' | '),
        r.tables.map(x => x.label).join(' | '),
        r.businessRules.map(x => x.id).join(' | '),
        r.apiEndpoints.map(x => x.label).join(' | '),
        r.workflows.map(x => x.label).join(' | '),
      ].map(csvEscape).join(','));
    }
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rostered-ai-rtm-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -------- PDF (landscape) --------

const COLORS = {
  primary: [30, 64, 175] as [number, number, number],
  primaryLight: [219, 234, 254] as [number, number, number],
  dark: [15, 23, 42] as [number, number, number],
  text: [51, 65, 85] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  border: [203, 213, 225] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  covered: [22, 163, 74] as [number, number, number],
  partial: [202, 138, 4] as [number, number, number],
  gap: [220, 38, 38] as [number, number, number],
  critical: [220, 38, 38] as [number, number, number],
  high: [234, 88, 12] as [number, number, number],
  medium: [202, 138, 4] as [number, number, number],
  low: [22, 163, 74] as [number, number, number],
};

const PAGE_W = 297;
const PAGE_H = 210;
const MARGIN = 12;
const CONTENT_W = PAGE_W - MARGIN * 2;
const HEADER_H = 14;
const FOOTER_H = 10;

// Column widths (sum = CONTENT_W ≈ 273)
const COLS = [
  { key: 'frId', title: 'FR ID', w: 18 },
  { key: 'category', title: 'Category', w: 26 },
  { key: 'requirement', title: 'Requirement', w: 70 },
  { key: 'priority', title: 'Priority', w: 16 },
  { key: 'coverage', title: 'Cov.', w: 14 },
  { key: 'userStories', title: 'User Stories', w: 34 },
  { key: 'tables', title: 'Tables', w: 32 },
  { key: 'businessRules', title: 'Business Rules', w: 32 },
  { key: 'apiWorkflows', title: 'APIs / Workflows', w: 31 },
];

function priorityColor(p: string): [number, number, number] {
  switch (p) {
    case 'critical': case 'must': return COLORS.critical;
    case 'high': case 'should': return COLORS.high;
    case 'medium': return COLORS.medium;
    case 'low': case 'could': return COLORS.low;
    default: return COLORS.muted;
  }
}

function coverageColor(c: string): [number, number, number] {
  if (c === 'covered') return COLORS.covered;
  if (c === 'partial') return COLORS.partial;
  return COLORS.gap;
}

class RtmPdfBuilder {
  doc: jsPDF;
  y = MARGIN + HEADER_H;
  currentModule = '';

  constructor() {
    this.doc = new jsPDF('l', 'mm', 'a4');
  }

  private drawHeader() {
    this.doc.setFillColor(...COLORS.primary);
    this.doc.rect(0, 0, PAGE_W, 2.5, 'F');
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...COLORS.muted);
    this.doc.text('Requirements Traceability Matrix  |  rostered.ai', MARGIN, 9);
    if (this.currentModule) {
      this.doc.text(this.currentModule, PAGE_W - MARGIN, 9, { align: 'right' });
    }
    this.doc.setDrawColor(...COLORS.border);
    this.doc.setLineWidth(0.2);
    this.doc.line(MARGIN, 11, PAGE_W - MARGIN, 11);
  }

  private drawFooters() {
    const total = this.doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      this.doc.setPage(i);
      this.doc.setFillColor(...COLORS.primary);
      this.doc.rect(0, PAGE_H - 3, PAGE_W, 3, 'F');
      this.doc.setFontSize(7.5);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...COLORS.muted);
      this.doc.text('Draft — for stakeholder alignment', MARGIN, PAGE_H - 5);
      this.doc.text(`Page ${i} of ${total}`, PAGE_W - MARGIN, PAGE_H - 5, { align: 'right' });
    }
  }

  private newPage() {
    this.doc.addPage();
    this.y = MARGIN + HEADER_H;
    this.drawHeader();
  }

  private ensure(h: number) {
    if (this.y + h > PAGE_H - FOOTER_H) this.newPage();
  }

  drawCover(modules: RtmModule[]) {
    this.doc.setFillColor(...COLORS.primary);
    this.doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

    this.doc.setFillColor(...COLORS.white);
    this.doc.roundedRect(24, 30, PAGE_W - 48, PAGE_H - 60, 5, 5, 'F');

    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...COLORS.dark);
    this.doc.text('Requirements Traceability Matrix', PAGE_W / 2, 60, { align: 'center' });

    this.doc.setFontSize(13);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...COLORS.primary);
    this.doc.text('rostered.ai Workforce Platform', PAGE_W / 2, 72, { align: 'center' });

    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.muted);
    this.doc.text(
      `Generated ${new Date().toLocaleDateString()}  •  Draft for stakeholder alignment`,
      PAGE_W / 2, 82, { align: 'center' }
    );

    // Summary stats
    const summary = summariseRtm(modules);
    const startY = 100;
    const rowH = 10;
    const cols = ['Module', 'FRs', 'Covered', 'Partial', 'Gap', 'Coverage'];
    const colW = [70, 20, 25, 25, 20, 30];
    const startX = (PAGE_W - colW.reduce((a, b) => a + b, 0)) / 2;

    this.doc.setFillColor(...COLORS.primaryLight);
    this.doc.rect(startX, startY, colW.reduce((a, b) => a + b, 0), rowH, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.dark);
    let x = startX;
    cols.forEach((c, i) => { this.doc.text(c, x + 2, startY + 6.5); x += colW[i]; });

    this.doc.setFont('helvetica', 'normal');
    let ry = startY + rowH;
    let tTotal = 0, tCov = 0, tPart = 0, tGap = 0;
    for (const s of summary) {
      this.doc.setDrawColor(...COLORS.border);
      this.doc.line(startX, ry, startX + colW.reduce((a, b) => a + b, 0), ry);
      x = startX;
      const cells = [s.moduleName, String(s.total), String(s.covered), String(s.partial), String(s.gap), `${s.coveragePct}%`];
      cells.forEach((c, i) => {
        this.doc.setTextColor(...COLORS.text);
        this.doc.text(c, x + 2, ry + 6.5);
        x += colW[i];
      });
      ry += rowH;
      tTotal += s.total; tCov += s.covered; tPart += s.partial; tGap += s.gap;
    }
    // Totals row
    this.doc.setFillColor(240, 245, 250);
    this.doc.rect(startX, ry, colW.reduce((a, b) => a + b, 0), rowH, 'F');
    this.doc.setFont('helvetica', 'bold');
    x = startX;
    const totalCells = [
      'Total', String(tTotal), String(tCov), String(tPart), String(tGap),
      `${tTotal ? Math.round(((tCov + tPart * 0.5) / tTotal) * 100) : 0}%`,
    ];
    totalCells.forEach((c, i) => { this.doc.text(c, x + 2, ry + 6.5); x += colW[i]; });

    // Legend
    const legY = PAGE_H - 55;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.dark);
    this.doc.text('Coverage classification', MARGIN + 20, legY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    const items: [string, [number, number, number], string][] = [
      ['Covered', COLORS.covered, 'FR maps to user stories AND tables/rules, or ≥4 linked artefacts.'],
      ['Partial', COLORS.partial, 'FR maps to at least one artefact but limited breadth.'],
      ['Gap', COLORS.gap, 'No linked artefacts detected — needs manual review.'],
    ];
    let ly = legY + 6;
    for (const [label, color, desc] of items) {
      this.doc.setFillColor(...color);
      this.doc.circle(MARGIN + 22, ly - 1, 1.6, 'F');
      this.doc.setTextColor(...COLORS.dark);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label, MARGIN + 26, ly);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...COLORS.text);
      this.doc.text(desc, MARGIN + 46, ly);
      ly += 6;
    }
  }

  drawModuleTitle(m: RtmModule) {
    this.currentModule = m.name;
    this.newPage();
    this.ensure(20);
    this.doc.setFillColor(...COLORS.primaryLight);
    this.doc.roundedRect(MARGIN, this.y, CONTENT_W, 12, 2, 2, 'F');
    this.doc.setFillColor(...COLORS.primary);
    this.doc.rect(MARGIN, this.y, 3, 12, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(13);
    this.doc.setTextColor(...COLORS.primary);
    this.doc.text(m.name, MARGIN + 7, this.y + 8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.muted);
    this.doc.text(
      `v${m.version} • Updated ${m.lastUpdated} • ${m.rows.length} functional requirements`,
      PAGE_W - MARGIN - 2, this.y + 8, { align: 'right' }
    );
    this.y += 16;
  }

  drawTableHeader() {
    this.ensure(9);
    let x = MARGIN;
    this.doc.setFillColor(...COLORS.primary);
    this.doc.rect(MARGIN, this.y, CONTENT_W, 7, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    this.doc.setTextColor(...COLORS.white);
    for (const c of COLS) {
      this.doc.text(c.title, x + 1.5, this.y + 5);
      x += c.w;
    }
    this.y += 7;
  }

  private splitToLines(text: string, width: number): string[] {
    if (!text) return [''];
    return this.doc.splitTextToSize(text, width - 2);
  }

  drawRow(row: RtmModule['rows'][number]) {
    const links = (arr: { id: string; label: string }[]) =>
      arr.length ? arr.map(l => l.id || l.label).join(', ') : '—';

    const cellTexts: Record<string, string> = {
      frId: row.frId,
      category: row.category,
      requirement: row.requirement,
      priority: row.priority.toUpperCase(),
      coverage: row.coverage.toUpperCase(),
      userStories: links(row.userStories),
      tables: links(row.tables),
      businessRules: row.businessRules.length
        ? row.businessRules.map(b => b.id).join(', ')
        : '—',
      apiWorkflows: [
        ...row.apiEndpoints.map(a => a.label),
        ...row.workflows.map(w => w.label),
      ].join('\n') || '—',
    };

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7.5);

    // Compute row height
    const heights: number[] = [];
    for (const col of COLS) {
      const lines = this.splitToLines(cellTexts[col.key], col.w);
      heights.push(lines.length * 3.4);
    }
    const rowH = Math.max(...heights, 7) + 2;

    if (this.y + rowH > PAGE_H - FOOTER_H) {
      this.newPage();
      this.drawTableHeader();
    }

    // Zebra
    const pageRowIdx = Math.floor((this.y - (MARGIN + HEADER_H + 20)) / 8);
    if (pageRowIdx % 2 === 0) {
      this.doc.setFillColor(248, 250, 252);
      this.doc.rect(MARGIN, this.y, CONTENT_W, rowH, 'F');
    }

    // Draw cell borders + text
    let x = MARGIN;
    this.doc.setDrawColor(...COLORS.border);
    this.doc.setLineWidth(0.15);
    for (const col of COLS) {
      this.doc.rect(x, this.y, col.w, rowH);
      const text = cellTexts[col.key];

      if (col.key === 'priority') {
        const color = priorityColor(row.priority);
        this.doc.setFillColor(...color);
        const label = row.priority.toUpperCase();
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(6.5);
        const w = this.doc.getTextWidth(label) + 3;
        this.doc.roundedRect(x + 1.5, this.y + 1.5, w, 4, 0.8, 0.8, 'F');
        this.doc.setTextColor(...COLORS.white);
        this.doc.text(label, x + 3, this.y + 4.7);
      } else if (col.key === 'coverage') {
        const color = coverageColor(row.coverage);
        this.doc.setFillColor(...color);
        const label = row.coverage.toUpperCase();
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(6.5);
        const w = this.doc.getTextWidth(label) + 3;
        this.doc.roundedRect(x + 1.5, this.y + 1.5, w, 4, 0.8, 0.8, 'F');
        this.doc.setTextColor(...COLORS.white);
        this.doc.text(label, x + 3, this.y + 4.7);
      } else {
        this.doc.setFont(col.key === 'frId' ? 'courier' : 'helvetica', col.key === 'frId' ? 'bold' : 'normal');
        this.doc.setFontSize(7.5);
        this.doc.setTextColor(...(col.key === 'frId' ? COLORS.primary : COLORS.text));
        const lines = this.splitToLines(text, col.w);
        let ly = this.y + 4;
        for (const line of lines) {
          this.doc.text(line, x + 1.5, ly);
          ly += 3.4;
        }
      }

      x += col.w;
    }

    this.y += rowH;
  }

  finalise() {
    this.drawFooters();
  }
}

export function exportRtmToPdf(modules: RtmModule[] = buildRtm()) {
  const b = new RtmPdfBuilder();
  b.drawCover(modules);
  for (const m of modules) {
    b.drawModuleTitle(m);
    b.drawTableHeader();
    for (const row of m.rows) b.drawRow(row);
  }
  b.finalise();
  b.doc.save(`rostered-ai-rtm-${new Date().toISOString().slice(0, 10)}.pdf`);
}
