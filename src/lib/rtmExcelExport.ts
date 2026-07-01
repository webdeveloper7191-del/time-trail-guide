import * as XLSX from 'xlsx';
import { RtmModule, RtmRow, buildRtm, summariseRtm } from './rtmBuilder';

interface DimensionSpec {
  key: keyof Pick<RtmRow, 'userStories' | 'tables' | 'businessRules' | 'apiEndpoints' | 'workflows'>;
  label: string;
  description: string;
  suggestion: string;
}

const DIMENSIONS: DimensionSpec[] = [
  {
    key: 'userStories',
    label: 'User Stories',
    description: 'Behavioural traces — who does what and when.',
    suggestion: 'Author or link a user story in the SRS with acceptance criteria that reference this requirement.',
  },
  {
    key: 'tables',
    label: 'Data Tables',
    description: 'Persistence layer that stores or reads the data implied by the requirement.',
    suggestion: 'Extend an existing table (or add a new one) whose fields carry the data called out by this requirement.',
  },
  {
    key: 'businessRules',
    label: 'Business Rules',
    description: 'Invariants, validations and derived logic that enforce the requirement at runtime.',
    suggestion: 'Add a business rule entry describing the invariant or validation this requirement demands.',
  },
  {
    key: 'apiEndpoints',
    label: 'API Endpoints',
    description: 'External HTTP contract exposing or consuming the capability.',
    suggestion: 'Document the endpoint (method, path, request/response) that fulfils this requirement.',
  },
  {
    key: 'workflows',
    label: 'Workflows',
    description: 'End-to-end sequences that string services and actors together.',
    suggestion: 'Add or extend a workflow diagram that shows this requirement as a step.',
  },
];

function setColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws['!cols'] = widths.map(w => ({ wch: w }));
}

export function exportRtmToExcel(modules: RtmModule[] = buildRtm()) {
  const wb = XLSX.utils.book_new();

  // 1. Summary sheet
  const summary = summariseRtm(modules);
  const summaryRows = [
    ['Module', 'Total FRs', 'Covered', 'Partial', 'Gap', 'Coverage %', 'Version', 'Last Updated'],
    ...summary.map(s => {
      const m = modules.find(x => x.id === s.moduleId)!;
      return [s.moduleName, s.total, s.covered, s.partial, s.gap, s.coveragePct, m.version, m.lastUpdated];
    }),
  ];
  const tCov = summary.reduce((a, s) => a + s.covered, 0);
  const tPart = summary.reduce((a, s) => a + s.partial, 0);
  const tGap = summary.reduce((a, s) => a + s.gap, 0);
  const tTotal = tCov + tPart + tGap;
  summaryRows.push([
    'TOTAL', tTotal, tCov, tPart, tGap,
    tTotal ? Math.round(((tCov + tPart * 0.5) / tTotal) * 100) : 0,
    '', '',
  ]);
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  setColWidths(wsSummary, [26, 12, 12, 12, 10, 14, 12, 16]);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // 2. Matrix sheet — one row per FR
  const matrixHeader = [
    'Module', 'FR ID', 'Category', 'Requirement', 'Priority', 'Coverage',
    'User Stories', 'Tables', 'Business Rules', 'API Endpoints', 'Workflows',
    '# Stories', '# Tables', '# Rules', '# APIs', '# Workflows', 'Total Links',
  ];
  const matrixRows: (string | number)[][] = [matrixHeader];
  for (const m of modules) {
    for (const r of m.rows) {
      const totalLinks =
        r.userStories.length + r.tables.length + r.businessRules.length +
        r.apiEndpoints.length + r.workflows.length;
      matrixRows.push([
        m.name, r.frId, r.category, r.requirement, r.priority.toUpperCase(), r.coverage.toUpperCase(),
        r.userStories.map(x => x.id).join('\n') || '—',
        r.tables.map(x => x.label).join('\n') || '—',
        r.businessRules.map(x => x.id).join('\n') || '—',
        r.apiEndpoints.map(x => x.label).join('\n') || '—',
        r.workflows.map(x => x.label).join('\n') || '—',
        r.userStories.length, r.tables.length, r.businessRules.length,
        r.apiEndpoints.length, r.workflows.length, totalLinks,
      ]);
    }
  }
  const wsMatrix = XLSX.utils.aoa_to_sheet(matrixRows);
  setColWidths(wsMatrix, [22, 12, 22, 60, 10, 10, 28, 26, 24, 30, 28, 10, 10, 10, 10, 12, 12]);
  wsMatrix['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: matrixHeader.length - 1, r: matrixRows.length - 1 } }) };
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Matrix');

  // 3. Drilldown sheet — one row per FR × dimension (Present / Missing / N/A)
  const drillHeader = [
    'Module', 'FR ID', 'Category', 'Requirement', 'Priority', 'Coverage',
    'Dimension', 'Status', 'Link Count', 'Linked Artefacts', 'Notes / Suggestion',
  ];
  const drillRows: (string | number)[][] = [drillHeader];
  for (const m of modules) {
    const moduleHas: Record<string, boolean> = {};
    for (const d of DIMENSIONS) {
      moduleHas[d.key] = m.rows.some(r => (r[d.key] as any[]).length > 0);
    }
    for (const r of m.rows) {
      for (const d of DIMENSIONS) {
        const links = r[d.key] as { id: string; label: string }[];
        const expected = moduleHas[d.key];
        let status: string;
        let note: string;
        if (links.length > 0) {
          status = 'Present';
          note = d.description;
        } else if (expected) {
          status = 'Missing (expected)';
          note = d.suggestion;
        } else {
          status = 'Not applicable';
          note = `Module has no ${d.label.toLowerCase()} documented in the SRS.`;
        }
        drillRows.push([
          m.name, r.frId, r.category, r.requirement, r.priority.toUpperCase(), r.coverage.toUpperCase(),
          d.label, status, links.length,
          links.length ? links.map(l => `${l.id}${l.label && l.label !== l.id ? ` — ${l.label}` : ''}`).join('\n') : '—',
          note,
        ]);
      }
    }
  }
  const wsDrill = XLSX.utils.aoa_to_sheet(drillRows);
  setColWidths(wsDrill, [22, 12, 22, 55, 10, 10, 18, 20, 12, 40, 55]);
  wsDrill['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: drillHeader.length - 1, r: drillRows.length - 1 } }) };
  XLSX.utils.book_append_sheet(wb, wsDrill, 'Drilldown');

  // 4. Trace Links sheet — one row per individual link (flat, easy pivot)
  const linkHeader = ['Module', 'FR ID', 'Requirement', 'Coverage', 'Dimension', 'Artefact ID', 'Artefact Label'];
  const linkRows: (string | number)[][] = [linkHeader];
  for (const m of modules) {
    for (const r of m.rows) {
      for (const d of DIMENSIONS) {
        for (const l of r[d.key] as { id: string; label: string }[]) {
          linkRows.push([m.name, r.frId, r.requirement, r.coverage.toUpperCase(), d.label, l.id, l.label]);
        }
      }
    }
  }
  const wsLinks = XLSX.utils.aoa_to_sheet(linkRows);
  setColWidths(wsLinks, [22, 12, 55, 10, 18, 30, 40]);
  wsLinks['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: linkHeader.length - 1, r: linkRows.length - 1 } }) };
  XLSX.utils.book_append_sheet(wb, wsLinks, 'Trace Links');

  // 5. Legend
  const legend = [
    ['Requirements Traceability Matrix — rostered.ai'],
    [`Generated ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`],
    [],
    ['Coverage classification'],
    ['Covered', 'FR maps to user stories AND tables/rules, or ≥4 linked artefacts.'],
    ['Partial', 'FR maps to at least one artefact but limited breadth.'],
    ['Gap', 'No linked artefacts detected — needs manual review.'],
    [],
    ['Drilldown status'],
    ['Present', 'Dimension has one or more auto-detected trace links.'],
    ['Missing (expected)', 'Module documents this dimension elsewhere, but this FR has no link — action recommended.'],
    ['Not applicable', 'Module has no artefacts of this dimension in the SRS.'],
    [],
    ['Note', 'Links are derived heuristically via keyword overlap between FR text and artefact descriptors. Treat as a draft for stakeholder review.'],
  ];
  const wsLegend = XLSX.utils.aoa_to_sheet(legend);
  setColWidths(wsLegend, [24, 90]);
  XLSX.utils.book_append_sheet(wb, wsLegend, 'Legend');

  XLSX.writeFile(wb, `rostered-ai-rtm-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
