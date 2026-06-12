// Generates a downloadable PDF of the Agency Integration API documentation.
// Layout rules:
//  • Single, predictable column with consistent margins.
//  • Reserved header (top) and footer (bottom) bands; body never overlaps them.
//  • All flow tracked through PdfWriter.y; every block calls ensure() before drawing.
//  • Tables redraw their header on each new page.
//  • Pills flow left→right on a shared row and wrap when they run out of width.
import { jsPDF } from 'jspdf';
import {
  agencyApiSpec,
  agencyApiCommonHeaders,
  agencyApiErrorEnvelope,
  agencyApiWebhookNotes,
  agencyWebhookDeliveryHeaders,
  agencyWebhookRetrySchedule,
  agencyWebhookExpectedResponse,
  type ApiEndpoint,
  type ApiField,
} from '@/data/agencyIntegrationApiSpec';

type Doc = jsPDF;
type RGB = [number, number, number];

// A4 in mm. Reserve 16mm header band + 14mm footer band.
const PAGE = {
  w: 210,
  h: 297,
  marginX: 16,
  marginTop: 22, // body starts below the header rule
  marginBottom: 18, // body ends above the footer rule
};
const CONTENT_W = PAGE.w - PAGE.marginX * 2;

const COLORS = {
  brand: [16, 24, 40] as RGB,
  accent: [37, 99, 235] as RGB,
  muted: [100, 116, 139] as RGB,
  rule: [226, 232, 240] as RGB,
  code: [248, 250, 252] as RGB,
  codeBorder: [226, 232, 240] as RGB,
  tableHead: [241, 245, 249] as RGB,
  text: [15, 23, 42] as RGB,
};

class PdfWriter {
  doc: Doc;
  y = PAGE.marginTop;
  page = 1;
  constructor() {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4' });
    this.drawChrome();
  }

  // Bottom of the body area
  get bodyBottom() {
    return PAGE.h - PAGE.marginBottom;
  }

  ensure(space: number) {
    if (this.y + space > this.bodyBottom) this.newPage();
  }

  newPage() {
    this.doc.addPage();
    this.page += 1;
    this.y = PAGE.marginTop;
    this.drawChrome();
  }

  // Header + footer drawn once per page.
  drawChrome() {
    // Header
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.muted);
    this.doc.text('rostered.ai · Agency Integration API', PAGE.marginX, 12);
    this.doc.setDrawColor(...COLORS.rule);
    this.doc.setLineWidth(0.2);
    this.doc.line(PAGE.marginX, 15, PAGE.w - PAGE.marginX, 15);

    // Footer
    this.doc.setDrawColor(...COLORS.rule);
    this.doc.line(PAGE.marginX, PAGE.h - PAGE.marginBottom + 6, PAGE.w - PAGE.marginX, PAGE.h - PAGE.marginBottom + 6);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(...COLORS.muted);
    this.doc.text('© rostered.ai — Confidential integration documentation', PAGE.marginX, PAGE.h - 8);
    this.doc.text(`Page ${this.page}`, PAGE.w - PAGE.marginX, PAGE.h - 8, { align: 'right' });
  }

  // Re-stamp the footer page number after we know totals (optional).
  stampPageNumbers(total: number) {
    for (let i = 1; i <= total; i++) {
      this.doc.setPage(i);
      this.doc.setFillColor(255, 255, 255);
      this.doc.rect(PAGE.w - PAGE.marginX - 30, PAGE.h - 12, 30, 6, 'F');
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(...COLORS.muted);
      this.doc.text(`Page ${i} of ${total}`, PAGE.w - PAGE.marginX, PAGE.h - 8, { align: 'right' });
    }
  }

  text(s: string, opts: { size?: number; bold?: boolean; mono?: boolean; color?: RGB; indent?: number; gapAfter?: number } = {}) {
    const size = opts.size ?? 10;
    this.doc.setFont(opts.mono ? 'courier' : 'helvetica', opts.bold ? 'bold' : 'normal');
    this.doc.setFontSize(size);
    this.doc.setTextColor(...(opts.color ?? COLORS.text));
    const indent = opts.indent ?? 0;
    const x = PAGE.marginX + indent;
    const maxW = CONTENT_W - indent;
    const lines = this.doc.splitTextToSize(s, maxW) as string[];
    // Comfortable line height: pt→mm (1pt ≈ 0.3528mm) × 1.25 leading.
    const lh = size * 0.3528 * 1.25;
    for (const line of lines) {
      this.ensure(lh);
      this.doc.text(line, x, this.y + lh - 1);
      this.y += lh;
    }
    this.y += opts.gapAfter ?? 1.5;
  }

  rule(gapAfter = 3) {
    this.ensure(2);
    this.doc.setDrawColor(...COLORS.rule);
    this.doc.setLineWidth(0.2);
    this.doc.line(PAGE.marginX, this.y, PAGE.w - PAGE.marginX, this.y);
    this.y += gapAfter;
  }

  h1(s: string) {
    this.ensure(16);
    this.text(s, { size: 22, bold: true, color: COLORS.brand, gapAfter: 4 });
  }
  h2(s: string) {
    this.ensure(14);
    this.text(s, { size: 15, bold: true, color: COLORS.brand, gapAfter: 1 });
    this.rule(4);
  }
  h3(s: string) {
    this.ensure(10);
    this.text(s, { size: 12, bold: true, color: COLORS.brand, gapAfter: 2 });
  }
  label(s: string) {
    this.text(s, { size: 9, bold: true, color: COLORS.muted, gapAfter: 1 });
  }

  // Pills flow left→right and wrap when they overflow the content width.
  pillRow(pills: Array<{ label?: string; value: string; color: RGB }>) {
    const pillH = 5.5;
    const padX = 2.5;
    const gap = 2;
    this.ensure(pillH + 2);
    let cx = PAGE.marginX;
    const rowTop = this.y;
    let rowY = rowTop;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    for (const p of pills) {
      const text = p.label ? `${p.label} ${p.value}` : p.value;
      const tw = this.doc.getTextWidth(text);
      const w = tw + padX * 2;
      // wrap?
      if (cx + w > PAGE.w - PAGE.marginX) {
        cx = PAGE.marginX;
        rowY += pillH + 1.5;
        this.ensure(rowY - rowTop + pillH + 2);
      }
      this.doc.setFillColor(...p.color);
      this.doc.roundedRect(cx, rowY, w, pillH, 1.2, 1.2, 'F');
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(text, cx + padX, rowY + pillH - 1.6);
      cx += w + gap;
    }
    this.y = rowY + pillH + 2.5;
  }

  code(s: string) {
    const lh = 3.6;
    const padX = 3;
    const padY = 2.5;
    const innerW = CONTENT_W - padX * 2;
    this.doc.setFont('courier', 'normal');
    this.doc.setFontSize(8);
    // Pre-wrap all lines so we know exact heights, then page-break safely.
    const wrapped: string[] = [];
    for (const raw of s.split('\n')) {
      const parts = this.doc.splitTextToSize(raw.length ? raw : ' ', innerW) as string[];
      wrapped.push(...parts);
    }
    let i = 0;
    while (i < wrapped.length) {
      // How many lines fit on this page?
      const available = this.bodyBottom - this.y - padY * 2 - 1;
      const linesPerPage = Math.max(1, Math.floor(available / lh));
      const chunk = wrapped.slice(i, i + linesPerPage);
      const blockH = chunk.length * lh + padY * 2;
      this.ensure(blockH);
      // Background + subtle border
      this.doc.setFillColor(...COLORS.code);
      this.doc.setDrawColor(...COLORS.codeBorder);
      this.doc.setLineWidth(0.2);
      this.doc.roundedRect(PAGE.marginX, this.y, CONTENT_W, blockH, 1.2, 1.2, 'FD');
      this.doc.setFont('courier', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(...COLORS.text);
      let cy = this.y + padY + lh - 1;
      for (const ln of chunk) {
        this.doc.text(ln, PAGE.marginX + padX, cy);
        cy += lh;
      }
      this.y += blockH + 2;
      i += chunk.length;
      if (i < wrapped.length) this.newPage();
    }
  }

  fieldTable(fields: ApiField[]) {
    if (!fields?.length) return;
    const cols = [
      { label: 'Field', w: 46 },
      { label: 'Type', w: 34 },
      { label: 'Req', w: 12 },
      { label: 'Description', w: CONTENT_W - 46 - 34 - 12 },
    ];
    const headerH = 6;
    const rowPadY = 1.8;
    const lh = 3.4;

    const drawHeader = () => {
      this.ensure(headerH + lh * 2);
      this.doc.setFillColor(...COLORS.tableHead);
      this.doc.rect(PAGE.marginX, this.y, CONTENT_W, headerH, 'F');
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(8);
      this.doc.setTextColor(...COLORS.muted);
      let x = PAGE.marginX + 2;
      for (const c of cols) {
        this.doc.text(c.label, x, this.y + headerH - 2);
        x += c.w;
      }
      this.y += headerH;
    };

    drawHeader();
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);

    for (const f of fields) {
      const descText = (f.description || '') + (f.example !== undefined ? `  e.g. ${String(f.example)}` : '');
      const descLines = this.doc.splitTextToSize(descText, cols[3].w - 2) as string[];
      const nameLines = this.doc.splitTextToSize(f.name, cols[0].w - 2) as string[];
      const typeLines = this.doc.splitTextToSize(f.type, cols[1].w - 2) as string[];
      const rows = Math.max(descLines.length, nameLines.length, typeLines.length);
      const rowH = rows * lh + rowPadY * 2;

      // Page break: redraw header on the new page.
      if (this.y + rowH > this.bodyBottom) {
        this.newPage();
        drawHeader();
      }

      this.doc.setDrawColor(...COLORS.rule);
      this.doc.setLineWidth(0.15);
      this.doc.line(PAGE.marginX, this.y, PAGE.w - PAGE.marginX, this.y);

      let cx = PAGE.marginX + 2;
      const startY = this.y + rowPadY + lh - 1;

      // name (mono)
      this.doc.setFont('courier', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(...COLORS.text);
      nameLines.forEach((ln, i) => this.doc.text(ln, cx, startY + i * lh));
      cx += cols[0].w;

      // type
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...COLORS.muted);
      typeLines.forEach((ln, i) => this.doc.text(ln, cx, startY + i * lh));
      cx += cols[1].w;

      // required
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...(f.required ? ([190, 18, 60] as RGB) : COLORS.muted));
      this.doc.text(f.required ? 'yes' : 'no', cx, startY);
      cx += cols[2].w;

      // description
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...COLORS.text);
      descLines.forEach((ln, i) => this.doc.text(ln, cx, startY + i * lh));

      this.y += rowH;
    }
    // Closing border
    this.doc.setDrawColor(...COLORS.rule);
    this.doc.line(PAGE.marginX, this.y, PAGE.w - PAGE.marginX, this.y);
    this.y += 3;
  }
}

const methodColor = (m: string): RGB => {
  switch (m) {
    case 'GET': return [37, 99, 235];
    case 'POST': return [16, 185, 129];
    case 'PUT':
    case 'PATCH': return [217, 119, 6];
    case 'DELETE': return [225, 29, 72];
    default: return [100, 116, 139];
  }
};

const directionLabel = (d: ApiEndpoint['direction']): { value: string; color: RGB } => {
  if (d === 'outbound') return { value: 'Platform → Agency', color: [79, 70, 229] };
  if (d === 'inbound') return { value: 'Agency → Platform', color: [13, 148, 136] };
  return { value: 'Webhook', color: [192, 38, 211] };
};

function renderEndpoint(w: PdfWriter, ep: ApiEndpoint) {
  // Keep the endpoint title + first metadata together where possible.
  w.ensure(28);
  w.h3(ep.summary);
  w.pillRow([
    { label: ep.method, value: ep.path, color: methodColor(ep.method) },
    directionLabel(ep.direction),
  ]);
  w.text(`Auth: ${ep.auth}`, { size: 8.5, color: COLORS.muted, gapAfter: 1.5 });
  if (ep.description) w.text(ep.description, { size: 9.5, gapAfter: 2 });

  if (ep.pathParams?.length) { w.label('Path parameters'); w.fieldTable(ep.pathParams); }
  if (ep.queryParams?.length) { w.label('Query parameters'); w.fieldTable(ep.queryParams); }
  if (ep.requestHeaders?.length) { w.label('Request headers'); w.fieldTable(ep.requestHeaders); }
  if (ep.requestBody?.length) { w.label('Request body'); w.fieldTable(ep.requestBody); }
  if (ep.requestExample) { w.label('Request example'); w.code(ep.requestExample); }
  if (ep.responseBody?.length) { w.label('Response body'); w.fieldTable(ep.responseBody); }
  if (ep.responseExample) { w.label('Response example'); w.code(ep.responseExample); }
  if (ep.errorCodes?.length) {
    w.label('Error codes');
    for (const e of ep.errorCodes) w.text(`•  ${e.code} — ${e.description}`, { size: 9, indent: 3, gapAfter: 0.8 });
  }
  if (ep.webhook) {
    w.label('Webhook delivery');
    w.text(`Event: ${ep.webhook.eventName}`, { size: 9, indent: 3, gapAfter: 0.8 });
    w.text(`Expected response: ${ep.webhook.expectedResponse}`, { size: 9, indent: 3, gapAfter: 0.8 });
    w.text(`Dead letter: ${ep.webhook.deadLetter}`, { size: 9, indent: 3, gapAfter: 1.5 });
    w.text('Retry schedule', { size: 9, bold: true, indent: 3, gapAfter: 0.8 });
    for (const r of ep.webhook.retrySchedule) w.text(`•  ${r}`, { size: 9, indent: 6, gapAfter: 0.4 });
  }
  w.y += 2;
  w.rule(5);
}

export function generateAgencyApiPdf(): Blob {
  const w = new PdfWriter();

  // ── Cover ────────────────────────────────────────────────────────────
  w.y = 70;
  w.text('rostered.ai', { size: 28, bold: true, color: COLORS.accent, gapAfter: 3 });
  w.text('Agency Integration API', { size: 22, bold: true, color: COLORS.brand, gapAfter: 5 });
  w.text(
    'A strategic view of how third-party staffing agency platforms will be able to integrate with the rostered.ai workforce platform.',
    { size: 11, color: COLORS.muted, gapAfter: 3 },
  );
  w.text(
    'This version is a draft design and implementation is pending, so it is to be used only as a guide to align stakeholders on the operating model before the technical contract is finalised.',
    { size: 10, color: COLORS.muted, gapAfter: 6 },
  );
  w.text(`Generated ${new Date().toLocaleString()}`, { size: 9, color: COLORS.muted, gapAfter: 1 });
  w.text('Draft — Version 2026-06-01', { size: 9, color: COLORS.muted });

  // ── 1. Conventions ───────────────────────────────────────────────────
  w.newPage();
  w.h1('1. Conventions');
  w.h3('Versioning');
  w.text(
    'Breaking changes will be released under a new major version (/v2). Backwards-compatible additions will roll out to /v1 without notice. Base URLs for production and sandbox environments will be provided during onboarding.',
    { size: 9.5, gapAfter: 3 },
  );


  w.h3('Common request headers');
  w.fieldTable(agencyApiCommonHeaders);

  w.h3('Pagination');
  w.text(
    'List endpoints accept ?cursor= and ?limit= (max 100). Responses include nextCursor when more pages exist.',
    { size: 9.5, gapAfter: 3 },
  );

  w.h3('Authentication');
  w.text(
    'OAuth 2.0 client_credentials. Credentials (clientId / clientSecret) are issued manually by the rostered.ai platform admin during onboarding.',
    { size: 9.5, gapAfter: 2 },
  );

  // ── 2. Endpoints ─────────────────────────────────────────────────────
  const groups: Record<string, ApiEndpoint[]> = {};
  for (const ep of agencyApiSpec) (groups[ep.group] ||= []).push(ep);

  w.newPage();
  w.h1('2. Endpoints');
  let idx = 0;
  for (const [group, eps] of Object.entries(groups)) {
    idx += 1;
    w.h2(`2.${idx}  ${group}`);
    for (const ep of eps) renderEndpoint(w, ep);
  }

  // ── 3. Webhooks ──────────────────────────────────────────────────────
  w.newPage();
  w.h1('3. Webhooks');
  w.h3('Delivery headers');
  w.fieldTable(agencyWebhookDeliveryHeaders);
  w.h3('Retry schedule');
  for (const r of agencyWebhookRetrySchedule) w.text(`•  ${r}`, { size: 9.5, indent: 3, gapAfter: 0.6 });
  w.y += 2;
  w.h3('Expected response');
  for (const [k, v] of Object.entries(agencyWebhookExpectedResponse)) {
    w.text(`•  ${k}: ${v}`, { size: 9.5, indent: 3, gapAfter: 0.8 });
  }
  w.y += 1;
  w.h3('Implementation notes');
  for (const n of agencyApiWebhookNotes) w.text(`•  ${n}`, { size: 9.5, indent: 3, gapAfter: 0.8 });

  // ── 4. Errors ────────────────────────────────────────────────────────
  w.newPage();
  w.h1('4. Errors');
  w.h3('Error envelope');
  w.text(agencyApiErrorEnvelope.description, { size: 9.5, gapAfter: 2 });
  w.label('Example');
  w.code(agencyApiErrorEnvelope.example);
  w.label('JSON Schema');
  w.code(JSON.stringify(agencyApiErrorEnvelope.schema, null, 2));

  // Stamp "Page n of total" once the document is complete.
  w.stampPageNumbers(w.page);

  return w.doc.output('blob');
}

export function downloadAgencyApiPdf() {
  const blob = generateAgencyApiPdf();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rostered-ai-agency-api-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
