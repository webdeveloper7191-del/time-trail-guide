// Generates a downloadable PDF of the Agency Integration API documentation.
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

const PAGE = { w: 210, h: 297, m: 14 };
const COLORS = {
  brand: [16, 24, 40] as [number, number, number],
  accent: [37, 99, 235] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  rule: [226, 232, 240] as [number, number, number],
  code: [241, 245, 249] as [number, number, number],
  text: [15, 23, 42] as [number, number, number],
};

class PdfWriter {
  doc: Doc;
  y = PAGE.m;
  page = 1;
  constructor() {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4' });
  }
  ensure(space: number) {
    if (this.y + space > PAGE.h - PAGE.m - 8) this.newPage();
  }
  newPage() {
    this.footer();
    this.doc.addPage();
    this.page += 1;
    this.y = PAGE.m;
    this.header();
  }
  header() {
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.muted);
    this.doc.text('rostered.ai · Agency Integration API', PAGE.m, 8);
    this.doc.setDrawColor(...COLORS.rule);
    this.doc.line(PAGE.m, 10, PAGE.w - PAGE.m, 10);
    this.y = PAGE.m;
  }
  footer() {
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(...COLORS.muted);
    this.doc.text(`Page ${this.page}`, PAGE.w - PAGE.m, PAGE.h - 6, { align: 'right' });
    this.doc.text('© rostered.ai — Confidential integration documentation', PAGE.m, PAGE.h - 6);
  }
  text(s: string, opts: { size?: number; bold?: boolean; color?: [number, number, number]; indent?: number; gap?: number } = {}) {
    const size = opts.size ?? 10;
    this.doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    this.doc.setFontSize(size);
    this.doc.setTextColor(...(opts.color ?? COLORS.text));
    const x = PAGE.m + (opts.indent ?? 0);
    const maxW = PAGE.w - PAGE.m * 2 - (opts.indent ?? 0);
    const lines = this.doc.splitTextToSize(s, maxW);
    const lh = size * 0.42;
    for (const line of lines) {
      this.ensure(lh + 1);
      this.doc.text(line, x, this.y);
      this.y += lh;
    }
    this.y += opts.gap ?? 1;
  }
  rule(gap = 2) {
    this.ensure(4);
    this.doc.setDrawColor(...COLORS.rule);
    this.doc.line(PAGE.m, this.y, PAGE.w - PAGE.m, this.y);
    this.y += gap;
  }
  h1(s: string) {
    this.ensure(14);
    this.text(s, { size: 20, bold: true, color: COLORS.brand, gap: 2 });
  }
  h2(s: string) {
    this.ensure(12);
    this.text(s, { size: 14, bold: true, color: COLORS.brand, gap: 1 });
    this.rule(3);
  }
  h3(s: string) {
    this.ensure(8);
    this.text(s, { size: 11, bold: true, color: COLORS.brand, gap: 1 });
  }
  pill(label: string, value: string, color: [number, number, number]) {
    const w = this.doc.getTextWidth(`${label} ${value}`) + 6;
    this.ensure(7);
    this.doc.setFillColor(...color);
    this.doc.roundedRect(PAGE.m, this.y - 4, w, 5.5, 1, 1, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(`${label} ${value}`, PAGE.m + 3, this.y);
    this.y += 4;
  }
  code(s: string) {
    const lines = s.split('\n');
    const lh = 3.6;
    const padX = 3, padY = 2;
    const lineCount = lines.length;
    const blockH = lineCount * lh + padY * 2;
    this.ensure(blockH + 2);
    this.doc.setFillColor(...COLORS.code);
    this.doc.roundedRect(PAGE.m, this.y, PAGE.w - PAGE.m * 2, blockH, 1, 1, 'F');
    this.doc.setFont('courier', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(...COLORS.text);
    let cy = this.y + padY + lh - 0.5;
    for (const ln of lines) {
      if (cy > PAGE.h - PAGE.m - 8) {
        this.y = cy;
        this.newPage();
        cy = this.y + lh;
      }
      const wrapped = this.doc.splitTextToSize(ln || ' ', PAGE.w - PAGE.m * 2 - padX * 2);
      for (const w of wrapped) {
        this.doc.text(w, PAGE.m + padX, cy);
        cy += lh;
      }
    }
    this.y = cy + 1;
  }
  fieldTable(fields: ApiField[]) {
    if (!fields?.length) return;
    const cols = [
      { label: 'Field', w: 50 },
      { label: 'Type', w: 38 },
      { label: 'Req', w: 12 },
      { label: 'Description', w: PAGE.w - PAGE.m * 2 - 50 - 38 - 12 },
    ];
    const rowPad = 1.5;
    // header
    this.ensure(8);
    this.doc.setFillColor(248, 250, 252);
    this.doc.rect(PAGE.m, this.y, PAGE.w - PAGE.m * 2, 5.5, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    this.doc.setTextColor(...COLORS.muted);
    let x = PAGE.m + 2;
    for (const c of cols) {
      this.doc.text(c.label, x, this.y + 3.8);
      x += c.w;
    }
    this.y += 5.5;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(...COLORS.text);
    for (const f of fields) {
      const descLines = this.doc.splitTextToSize(
        (f.description || '') + (f.example !== undefined ? `  e.g. ${String(f.example)}` : ''),
        cols[3].w - 2
      );
      const nameLines = this.doc.splitTextToSize(f.name, cols[0].w - 2);
      const typeLines = this.doc.splitTextToSize(f.type, cols[1].w - 2);
      const rows = Math.max(descLines.length, nameLines.length, typeLines.length);
      const rowH = rows * 3.4 + rowPad * 2;
      this.ensure(rowH + 1);
      // separator
      this.doc.setDrawColor(...COLORS.rule);
      this.doc.line(PAGE.m, this.y, PAGE.w - PAGE.m, this.y);
      let cx = PAGE.m + 2;
      const startY = this.y + rowPad + 3;
      // name
      this.doc.setFont('courier', 'normal');
      nameLines.forEach((ln: string, i: number) => this.doc.text(ln, cx, startY + i * 3.4));
      cx += cols[0].w;
      // type
      this.doc.setTextColor(...COLORS.muted);
      typeLines.forEach((ln: string, i: number) => this.doc.text(ln, cx, startY + i * 3.4));
      cx += cols[1].w;
      // required
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...(f.required ? ([190, 18, 60] as [number, number, number]) : COLORS.muted));
      this.doc.text(f.required ? 'yes' : 'no', cx, startY);
      cx += cols[2].w;
      // desc
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...COLORS.text);
      descLines.forEach((ln: string, i: number) => this.doc.text(ln, cx, startY + i * 3.4));
      this.y += rowH;
    }
    this.doc.setDrawColor(...COLORS.rule);
    this.doc.line(PAGE.m, this.y, PAGE.w - PAGE.m, this.y);
    this.y += 2;
  }
}

const methodColor = (m: string): [number, number, number] => {
  switch (m) {
    case 'GET': return [37, 99, 235];
    case 'POST': return [16, 185, 129];
    case 'PUT':
    case 'PATCH': return [217, 119, 6];
    case 'DELETE': return [225, 29, 72];
    default: return [100, 116, 139];
  }
};

const directionPill = (d: ApiEndpoint['direction']): [string, [number, number, number]] => {
  if (d === 'outbound') return ['Platform → Agency', [79, 70, 229]];
  if (d === 'inbound') return ['Agency → Platform', [13, 148, 136]];
  return ['Webhook', [192, 38, 211]];
};

function renderEndpoint(w: PdfWriter, ep: ApiEndpoint) {
  w.ensure(20);
  w.h3(ep.summary);
  // method + path + direction pills row
  w.pill(ep.method, ep.path, methodColor(ep.method));
  const [dirLabel, dirColor] = directionPill(ep.direction);
  w.pill('', dirLabel, dirColor);
  w.text(`Auth: ${ep.auth}`, { size: 8, color: COLORS.muted, gap: 1 });
  if (ep.description) w.text(ep.description, { size: 9, gap: 1 });

  if (ep.pathParams?.length) { w.text('Path parameters', { size: 9, bold: true, gap: 0.5 }); w.fieldTable(ep.pathParams); }
  if (ep.queryParams?.length) { w.text('Query parameters', { size: 9, bold: true, gap: 0.5 }); w.fieldTable(ep.queryParams); }
  if (ep.requestHeaders?.length) { w.text('Request headers', { size: 9, bold: true, gap: 0.5 }); w.fieldTable(ep.requestHeaders); }
  if (ep.requestBody?.length) { w.text('Request body', { size: 9, bold: true, gap: 0.5 }); w.fieldTable(ep.requestBody); }
  if (ep.requestExample) { w.text('Request example', { size: 9, bold: true, gap: 0.5 }); w.code(ep.requestExample); }
  if (ep.responseBody?.length) { w.text('Response body', { size: 9, bold: true, gap: 0.5 }); w.fieldTable(ep.responseBody); }
  if (ep.responseExample) { w.text('Response example', { size: 9, bold: true, gap: 0.5 }); w.code(ep.responseExample); }
  if (ep.errorCodes?.length) {
    w.text('Error codes', { size: 9, bold: true, gap: 0.5 });
    for (const e of ep.errorCodes) w.text(`• ${e.code} — ${e.description}`, { size: 9, indent: 2, gap: 0.5 });
  }
  if (ep.webhook) {
    w.text('Webhook delivery', { size: 9, bold: true, gap: 0.5 });
    w.text(`Event: ${ep.webhook.eventName}`, { size: 9, indent: 2 });
    w.text(`Expected response: ${ep.webhook.expectedResponse}`, { size: 9, indent: 2 });
    w.text(`Dead letter: ${ep.webhook.deadLetter}`, { size: 9, indent: 2, gap: 1 });
    w.text('Retry schedule', { size: 9, bold: true, indent: 2, gap: 0.5 });
    for (const r of ep.webhook.retrySchedule) w.text(`• ${r}`, { size: 9, indent: 4, gap: 0.3 });
  }
  w.y += 3;
  w.rule(4);
}

export function generateAgencyApiPdf(): Blob {
  const w = new PdfWriter();
  w.header();

  // Cover
  w.y = 60;
  w.text('rostered.ai', { size: 26, bold: true, color: COLORS.accent, gap: 2 });
  w.text('Agency Integration API', { size: 22, bold: true, color: COLORS.brand, gap: 3 });
  w.text('Request and response contracts for integrating 3rd-party staffing agency platforms with the rostered.ai workforce platform.', { size: 11, color: COLORS.muted, gap: 4 });
  w.text(`Generated ${new Date().toLocaleString()}`, { size: 9, color: COLORS.muted, gap: 2 });
  w.text('Version 2026-06-01', { size: 9, color: COLORS.muted });

  // Conventions
  w.newPage();
  w.h1('1. Conventions');
  w.h3('Base URL & versioning');
  w.text('Production: https://api.rostered.ai/v1', { size: 10 });
  w.text('Sandbox:    https://api.sandbox.rostered.ai/v1', { size: 10, gap: 1 });
  w.text('Breaking changes are released under a new major version (/v2). Backwards-compatible additions roll out to /v1 without notice.', { size: 9, gap: 2 });

  w.h3('Common request headers');
  w.fieldTable(agencyApiCommonHeaders);

  w.h3('Pagination');
  w.text('List endpoints accept ?cursor= and ?limit= (max 100). Responses include nextCursor when more pages exist.', { size: 9, gap: 2 });

  w.h3('Authentication');
  w.text('OAuth 2.0 client_credentials. Credentials (clientId/clientSecret) are issued manually by the rostered.ai platform admin during onboarding.', { size: 9, gap: 2 });

  // Endpoints grouped
  const groups: Record<string, ApiEndpoint[]> = {};
  for (const ep of agencyApiSpec) (groups[ep.group] ||= []).push(ep);

  w.newPage();
  w.h1('2. Endpoints');
  let idx = 0;
  for (const [group, eps] of Object.entries(groups)) {
    idx += 1;
    w.h2(`2.${idx} ${group}`);
    for (const ep of eps) renderEndpoint(w, ep);
  }

  // Webhooks
  w.newPage();
  w.h1('3. Webhooks');
  w.h3('Delivery headers');
  w.fieldTable(agencyWebhookDeliveryHeaders);
  w.h3('Retry schedule');
  for (const r of agencyWebhookRetrySchedule) w.text(`• ${r}`, { size: 9, indent: 2, gap: 0.4 });
  w.y += 2;
  w.h3('Expected response');
  w.text(agencyWebhookExpectedResponse, { size: 9, gap: 2 });
  w.h3('Implementation notes');
  for (const n of agencyApiWebhookNotes) w.text(`• ${n}`, { size: 9, indent: 2, gap: 0.6 });

  // Errors
  w.newPage();
  w.h1('4. Errors');
  w.h3('Error envelope');
  w.fieldTable(agencyApiErrorEnvelope);

  w.footer();
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
