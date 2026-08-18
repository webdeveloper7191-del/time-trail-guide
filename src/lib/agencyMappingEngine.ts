/**
 * Agency ↔ Tenant mapping engine.
 *
 * Agencies speak their own dialect: role labels ("RN Div 1"), qualification
 * names ("CPR Cert HLTAID009") and rate-card lines. The tenant has its own
 * master data (Positions, Skills) which every tenant can customise.
 *
 * This module is the single translation layer:
 *   outbound  – tenant shift  → agency dialect (what we POST on dispatch)
 *   inbound   – agency candidate/placement → tenant canonical ids
 *
 * Nothing is auto-committed: we only *suggest* matches with a confidence
 * score, a human confirms them in the Integration → Mapping tab, and dispatch
 * is blocked while mandatory rows remain unresolved.
 */
import type { PositionMaster } from './masterData/positionsStore';
import type { SkillMaster } from './masterData/skillsStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QualificationMapping {
  id: string;
  /** Free-text qualification / certification label the agency sends. */
  agencyQualificationLabel: string;
  /** Tenant canonical skill id (Master data → Skills). */
  skillId?: string;
  skillLabel?: string;
  /** Treat as blocking: candidate is rejected when the evidence is missing/expired. */
  mandatory: boolean;
  /** Require the agency to attach a document reference for this qualification. */
  evidenceRequired: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
  /** 'ignored' rows are accepted but never used for matching. */
  ignored?: boolean;
}

export type ChargeBasis = 'hourly' | 'daily' | 'shift';

export interface RateCardMapping {
  id: string;
  /** Rate-card line id on the agency application (when it came from onboarding). */
  agencyRateCardId?: string;
  agencyRoleLabel: string;
  /** Tenant canonical position this line is billed against. */
  positionId?: string;
  positionLabel?: string;
  chargeBasis: ChargeBasis;
  /** Agency charge rate (ex GST) for a base weekday hour. */
  agencyBaseRate: number;
  /** Tenant internal benchmark (award-resolved cost of an own employee). */
  tenantBenchmarkRate?: number;
  /** Hard ceiling — dispatch to this agency is blocked above it. */
  maxApprovedRate?: number;
  /** Multipliers agreed with the agency; used to price non-ordinary hours. */
  weekendMultiplier?: number;
  publicHolidayMultiplier?: number;
  overtimeMultiplier?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  confirmedAt?: string;
  confirmedBy?: string;
}

export interface MappingSuggestion<T> {
  target: T;
  /** 0-100 */
  confidence: number;
  reason: string;
}

// ---------------------------------------------------------------------------
// Fuzzy matching
// ---------------------------------------------------------------------------

/** Common agency abbreviations → canonical words. Extend as tenants onboard. */
const ALIASES: Record<string, string> = {
  rn: 'registered nurse',
  en: 'enrolled nurse',
  ain: 'assistant in nursing',
  pca: 'personal care assistant',
  ect: 'early childhood teacher',
  dt: 'diploma educator',
  cert3: 'certificate iii educator',
  'cert iii': 'certificate iii educator',
  cpr: 'cpr',
  hltaid009: 'cpr',
  hltaid011: 'first aid',
  fa: 'first aid',
  wwcc: 'working with children check',
  'police check': 'national police check',
  ndis: 'ndis worker screening',
  mh: 'manual handling',
  fs: 'food safety',
};

const STOP = new Set(['the', 'a', 'of', 'and', 'cert', 'certificate', 'certification', 'level', 'check', 'current', 'v', 'vic', 'nsw', 'qld']);

export function normalizeLabel(raw: string): string {
  const lower = raw.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return ALIASES[lower] ?? lower;
}

function tokens(raw: string): string[] {
  return normalizeLabel(raw)
    .split(' ')
    .map(t => ALIASES[t] ?? t)
    .flatMap(t => t.split(' '))
    .filter(t => t.length > 1 && !STOP.has(t));
}

/** Token overlap (Dice coefficient) plus exact/substring bonuses → 0-100. */
export function similarity(a: string, b: string): number {
  const na = normalizeLabel(a);
  const nb = normalizeLabel(b);
  if (!na || !nb) return 0;
  if (na === nb) return 100;
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.length === 0 || tb.length === 0) return 0;
  const setB = new Set(tb);
  const hits = ta.filter(t => setB.has(t)).length;
  let score = Math.round((2 * hits * 100) / (ta.length + tb.length));
  if (na.includes(nb) || nb.includes(na)) score = Math.max(score, 80);
  return Math.min(100, score);
}

function describe(score: number): string {
  if (score >= 95) return 'Exact label match';
  if (score >= 75) return 'Strong match — confirm before use';
  if (score >= 50) return 'Partial match — review carefully';
  return 'Weak match — manual selection recommended';
}

export function suggestPosition(label: string, positions: PositionMaster[]): MappingSuggestion<PositionMaster> | null {
  const scored = positions
    .filter(p => p.status === 'active')
    .map(p => ({ target: p, confidence: Math.max(similarity(label, p.label), p.code ? similarity(label, p.code) : 0) }))
    .sort((x, y) => y.confidence - x.confidence);
  const best = scored[0];
  if (!best || best.confidence < 35) return null;
  return { ...best, reason: describe(best.confidence) };
}

export function suggestSkill(label: string, skills: SkillMaster[]): MappingSuggestion<SkillMaster> | null {
  const scored = skills
    .filter(s => s.status === 'active')
    .map(s => ({ target: s, confidence: Math.max(similarity(label, s.label), s.code ? similarity(label, s.code) : 0) }))
    .sort((x, y) => y.confidence - x.confidence);
  const best = scored[0];
  if (!best || best.confidence < 35) return null;
  return { ...best, reason: describe(best.confidence) };
}

// ---------------------------------------------------------------------------
// Outbound: tenant shift → agency dialect
// ---------------------------------------------------------------------------

export interface OutboundRequirement {
  positionId: string;
  requiredSkillIds: string[];
}

export interface OutboundTranslation {
  /** Label the agency understands, or null when the position is unmapped. */
  agencyRoleLabel: string | null;
  agencyQualificationLabels: string[];
  /** Tenant skills with no agreed agency label. */
  unmappedSkillIds: string[];
  agreedRate?: { baseRate: number; chargeBasis: ChargeBasis; maxApprovedRate?: number };
  blockers: string[];
}

export function translateOutbound(
  req: OutboundRequirement,
  maps: {
    roleMappings: { positionId?: string; agencyRoleLabel: string }[];
    qualificationMappings: QualificationMapping[];
    rateCardMappings: RateCardMapping[];
  },
): OutboundTranslation {
  const role = maps.roleMappings.find(m => m.positionId === req.positionId);
  const quals = req.requiredSkillIds.map(id => ({
    id,
    map: maps.qualificationMappings.find(q => q.skillId === id && !q.ignored),
  }));
  const rate = maps.rateCardMappings.find(r => r.positionId === req.positionId);

  const blockers: string[] = [];
  if (!role) blockers.push('Position is not mapped to an agency role label.');
  const unmappedSkillIds = quals.filter(q => !q.map).map(q => q.id);
  if (unmappedSkillIds.length > 0) blockers.push(`${unmappedSkillIds.length} required qualification(s) have no agreed agency label.`);
  if (!rate) blockers.push('No confirmed rate-card line for this position.');
  else if (rate.maxApprovedRate != null && rate.agencyBaseRate > rate.maxApprovedRate) {
    blockers.push(`Agency rate $${rate.agencyBaseRate.toFixed(2)} exceeds the approved ceiling $${rate.maxApprovedRate.toFixed(2)}.`);
  }

  return {
    agencyRoleLabel: role?.agencyRoleLabel ?? null,
    agencyQualificationLabels: quals.map(q => q.map?.agencyQualificationLabel).filter(Boolean) as string[],
    unmappedSkillIds,
    agreedRate: rate
      ? { baseRate: rate.agencyBaseRate, chargeBasis: rate.chargeBasis, maxApprovedRate: rate.maxApprovedRate }
      : undefined,
    blockers,
  };
}

// ---------------------------------------------------------------------------
// Inbound: agency candidate → tenant canonical
// ---------------------------------------------------------------------------

export interface InboundCandidatePayload {
  role: string;
  qualifications: { label: string; expiresOn?: string; evidenceUrl?: string }[];
}

export interface InboundResolution {
  positionId?: string;
  positionLabel?: string;
  resolvedSkills: { skillId: string; skillLabel: string; agencyLabel: string; expiresOn?: string; evidenceUrl?: string }[];
  unrecognised: string[];
  /** Mapped-mandatory qualifications the candidate is missing, expired, or lacking evidence for. */
  violations: string[];
}

export function resolveInboundCandidate(
  payload: InboundCandidatePayload,
  maps: {
    roleMappings: { positionId?: string; positionLabel?: string; agencyRoleLabel: string }[];
    qualificationMappings: QualificationMapping[];
  },
  requiredSkillIds: string[] = [],
  now: Date = new Date(),
): InboundResolution {
  const role = maps.roleMappings.find(m => normalizeLabel(m.agencyRoleLabel) === normalizeLabel(payload.role));

  const resolvedSkills: InboundResolution['resolvedSkills'] = [];
  const unrecognised: string[] = [];
  const violations: string[] = [];

  for (const q of payload.qualifications) {
    const map = maps.qualificationMappings.find(
      m => !m.ignored && normalizeLabel(m.agencyQualificationLabel) === normalizeLabel(q.label),
    );
    if (!map?.skillId) {
      if (!map?.ignored) unrecognised.push(q.label);
      continue;
    }
    if (q.expiresOn && new Date(q.expiresOn) < now) {
      violations.push(`${map.skillLabel ?? map.agencyQualificationLabel} expired on ${q.expiresOn}.`);
      continue;
    }
    if (map.evidenceRequired && !q.evidenceUrl) {
      violations.push(`${map.skillLabel ?? map.agencyQualificationLabel} requires supporting evidence.`);
      continue;
    }
    resolvedSkills.push({
      skillId: map.skillId,
      skillLabel: map.skillLabel ?? map.agencyQualificationLabel,
      agencyLabel: q.label,
      expiresOn: q.expiresOn,
      evidenceUrl: q.evidenceUrl,
    });
  }

  const held = new Set(resolvedSkills.map(s => s.skillId));
  for (const id of requiredSkillIds) {
    if (!held.has(id)) {
      const map = maps.qualificationMappings.find(m => m.skillId === id);
      if (map?.mandatory !== false) violations.push(`Missing required qualification: ${map?.skillLabel ?? id}.`);
    }
  }

  return {
    positionId: role?.positionId,
    positionLabel: role?.positionLabel,
    resolvedSkills,
    unrecognised,
    violations,
  };
}

// ---------------------------------------------------------------------------
// Readiness
// ---------------------------------------------------------------------------

export interface MappingHealth {
  rolesTotal: number;
  rolesUnresolved: number;
  qualsTotal: number;
  qualsUnresolved: number;
  ratesTotal: number;
  ratesUnresolved: number;
  ratesOverCeiling: number;
  dispatchBlocked: boolean;
}

export function mappingHealth(cfg: {
  roleMappings: { positionId?: string }[];
  qualificationMappings?: QualificationMapping[];
  rateCardMappings?: RateCardMapping[];
}): MappingHealth {
  const quals = cfg.qualificationMappings ?? [];
  const rates = cfg.rateCardMappings ?? [];
  const rolesUnresolved = cfg.roleMappings.filter(m => !m.positionId).length;
  const qualsUnresolved = quals.filter(q => !q.skillId && !q.ignored).length;
  const ratesUnresolved = rates.filter(r => !r.positionId).length;
  const ratesOverCeiling = rates.filter(r => r.maxApprovedRate != null && r.agencyBaseRate > r.maxApprovedRate).length;
  return {
    rolesTotal: cfg.roleMappings.length,
    rolesUnresolved,
    qualsTotal: quals.length,
    qualsUnresolved,
    ratesTotal: rates.length,
    ratesUnresolved,
    ratesOverCeiling,
    dispatchBlocked: cfg.roleMappings.length === 0 || rolesUnresolved > 0 || qualsUnresolved > 0 || ratesUnresolved > 0 || ratesOverCeiling > 0,
  };
}

/** Variance of the agency charge rate against the tenant's own cost benchmark. */
export function rateVariance(r: RateCardMapping): { deltaPct: number; label: string; tone: 'ok' | 'warn' | 'bad' } | null {
  if (!r.tenantBenchmarkRate || r.tenantBenchmarkRate <= 0) return null;
  const deltaPct = ((r.agencyBaseRate - r.tenantBenchmarkRate) / r.tenantBenchmarkRate) * 100;
  const tone = deltaPct <= 15 ? 'ok' : deltaPct <= 40 ? 'warn' : 'bad';
  return { deltaPct, label: `${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(0)}% vs internal`, tone };
}
