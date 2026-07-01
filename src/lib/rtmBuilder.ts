// Requirements Traceability Matrix (RTM) builder.
// Cross-references Functional Requirements against User Stories, Data Tables,
// Business Rules and (for the Agency module) API endpoints & workflows.
//
// Linkage is heuristic — the SRS source data does not encode explicit FR→artefact
// mappings, so we derive them by keyword overlap between the FR text/category and
// each candidate artefact's descriptive fields. This is intentionally conservative
// (>=1 significant-token match) so that reviewers can quickly validate coverage
// and add/remove links manually where needed.

import { rosterSRS } from '@/data/srs/rosterSRS';
import { awardsSRS } from '@/data/srs/awardsSRS';
import { performanceSRS } from '@/data/srs/performanceSRS';
import { demandSRS } from '@/data/srs/demandSRS';
import { agencySRS } from '@/data/srs/agencySRS';

export interface RtmLink {
  id: string;
  label: string;
}

export interface RtmRow {
  moduleId: string;
  moduleName: string;
  frId: string;
  category: string;
  requirement: string;
  priority: string;
  userStories: RtmLink[];
  tables: RtmLink[];
  businessRules: RtmLink[];
  apiEndpoints: RtmLink[];
  workflows: RtmLink[];
  coverage: 'covered' | 'partial' | 'gap';
}

export interface RtmModule {
  id: string;
  name: string;
  version: string;
  lastUpdated: string;
  rows: RtmRow[];
}

const STOPWORDS = new Set([
  'system', 'shall', 'must', 'should', 'could', 'user', 'users', 'when', 'with',
  'from', 'that', 'this', 'their', 'each', 'other', 'every', 'able', 'been',
  'have', 'into', 'onto', 'them', 'they', 'will', 'within', 'across', 'based',
  'using', 'upon', 'over', 'under', 'per', 'and', 'the', 'for', 'are', 'any',
  'all', 'via', 'not', 'can', 'may', 'via', 'via', 'data', 'time', 'times',
  'support', 'supports', 'supported', 'provide', 'provides', 'provided',
  'allow', 'allows', 'allowed', 'display', 'displays', 'displayed',
]);

function tokenize(text: string): Set<string> {
  const out = new Set<string>();
  const words = (text || '').toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) || [];
  for (const w of words) {
    if (STOPWORDS.has(w)) continue;
    out.add(w);
    // Also add singular form of trivial plurals for looser matches
    if (w.endsWith('s') && w.length > 4) out.add(w.slice(0, -1));
  }
  return out;
}

function overlaps(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const t of a) if (b.has(t)) n++;
  return n;
}

interface CandidateArtefact {
  id: string;
  label: string;
  tokens: Set<string>;
}

function buildCandidates<T>(
  items: T[],
  extract: (item: T) => { id: string; label: string; text: string }
): CandidateArtefact[] {
  return items.map(it => {
    const { id, label, text } = extract(it);
    return { id, label, tokens: tokenize(`${label} ${text}`) };
  });
}

function findMatches(
  frTokens: Set<string>,
  candidates: CandidateArtefact[],
  { minOverlap = 1, max = 6 }: { minOverlap?: number; max?: number } = {}
): RtmLink[] {
  const scored = candidates
    .map(c => ({ c, score: overlaps(frTokens, c.tokens) }))
    .filter(x => x.score >= minOverlap)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
  return scored.map(x => ({ id: x.c.id, label: x.c.label }));
}

function classifyCoverage(row: Omit<RtmRow, 'coverage'>): RtmRow['coverage'] {
  const linkCount =
    row.userStories.length +
    row.tables.length +
    row.businessRules.length +
    row.apiEndpoints.length +
    row.workflows.length;
  if (linkCount === 0) return 'gap';
  const dims =
    (row.userStories.length ? 1 : 0) +
    (row.tables.length ? 1 : 0) +
    (row.businessRules.length ? 1 : 0);
  if (dims >= 2 || linkCount >= 4) return 'covered';
  return 'partial';
}

function buildModule(
  id: string,
  name: string,
  srs: any,
): RtmModule {
  const storyCands = buildCandidates(srs.userStories || [], (s: any) => ({
    id: s.id,
    label: s.title,
    text: [
      s.description,
      ...(s.acceptanceCriteria || []),
      ...(s.businessLogic || []),
    ].join(' '),
  }));

  const tableCands = buildCandidates(srs.tableSpecs || [], (t: any) => ({
    id: t.name,
    label: t.name,
    text: [t.description, ...(t.fields || []).map((f: any) => `${f.name} ${f.description || ''}`)].join(' '),
  }));

  const ruleCands = buildCandidates(srs.businessRules || [], (r: any) => ({
    id: r.id,
    label: r.rule.length > 60 ? r.rule.slice(0, 57) + '…' : r.rule,
    text: `${r.rule} ${r.rationale || ''}`,
  }));

  const apiCands = buildCandidates((srs.apiEndpoints as any[]) || [], (e: any) => ({
    id: e.id || `${e.method} ${e.path}`,
    label: `${e.method} ${e.path}`,
    text: `${e.summary || ''} ${e.description || ''} ${e.tag || ''}`,
  }));

  const wfCands = buildCandidates((srs.workflows as any[]) || [], (w: any) => ({
    id: w.id,
    label: w.name || w.title || w.id,
    text: `${w.description || ''} ${(w.steps || []).map((s: any) => s.description || s).join(' ')}`,
  }));

  const rows: RtmRow[] = (srs.functionalRequirements || []).map((fr: any) => {
    const frTokens = tokenize(`${fr.category} ${fr.requirement}`);
    const base: Omit<RtmRow, 'coverage'> = {
      moduleId: id,
      moduleName: name,
      frId: fr.id,
      category: fr.category,
      requirement: fr.requirement,
      priority: String(fr.priority).toLowerCase(),
      userStories: findMatches(frTokens, storyCands, { max: 5 }),
      tables: findMatches(frTokens, tableCands, { max: 5 }),
      businessRules: findMatches(frTokens, ruleCands, { max: 5 }),
      apiEndpoints: findMatches(frTokens, apiCands, { max: 4 }),
      workflows: findMatches(frTokens, wfCands, { max: 3 }),
    };
    return { ...base, coverage: classifyCoverage(base) };
  });

  return {
    id,
    name,
    version: srs.version,
    lastUpdated: srs.lastUpdated,
    rows,
  };
}

export function buildRtm(): RtmModule[] {
  return [
    buildModule('roster', 'Roster & Scheduling', rosterSRS),
    buildModule('demand', 'Demand Management', demandSRS),
    buildModule('awards', 'Awards & Pay', awardsSRS),
    buildModule('performance', 'Performance', performanceSRS),
    buildModule('agency', 'Agency Integration', agencySRS as any),
  ];
}

export interface RtmSummary {
  moduleId: string;
  moduleName: string;
  total: number;
  covered: number;
  partial: number;
  gap: number;
  coveragePct: number;
}

export function summariseRtm(modules: RtmModule[]): RtmSummary[] {
  return modules.map(m => {
    const total = m.rows.length;
    const covered = m.rows.filter(r => r.coverage === 'covered').length;
    const partial = m.rows.filter(r => r.coverage === 'partial').length;
    const gap = m.rows.filter(r => r.coverage === 'gap').length;
    return {
      moduleId: m.id,
      moduleName: m.name,
      total,
      covered,
      partial,
      gap,
      coveragePct: total ? Math.round(((covered + partial * 0.5) / total) * 100) : 0,
    };
  });
}
