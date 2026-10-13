/**
 * Award-published rate tables + override layer.
 *
 * The award's published percentages are the source of truth. Settings only store
 * overrides (cell-level), each pinned to the award version it was made against.
 * When the award version changes, overrides are kept but flagged for review.
 */
import { DEFAULT_RATE_TABLE, RateTable } from './rateCategory';

export interface PublishedRateTable {
  awardName: string;
  version: string;
  effectiveDate: string;
  clauseRef: string;
  table: RateTable;
}

/** Published figures for the default award. Replace with real award data when supplied. */
export const PUBLISHED_RATE_TABLE: PublishedRateTable = {
  awardName: 'Default award',
  version: 'FWC 2025-26',
  effectiveDate: '2025-07-01',
  clauseRef: 'Junior, apprentice & trainee rates clause',
  table: DEFAULT_RATE_TABLE,
};

export type NumericSection = 'juniorByAge' | 'apprenticeByYear' | 'apprenticeYear12ByYear' | 'adultApprenticeByYear' | 'traineeByLevel';

export interface CellOverride {
  value: number;
  /** Award version the override was made (or last re-confirmed) against. */
  pinnedVersion: string;
  /** What the award said when the override was pinned. */
  awardValueAtPin: number | null;
}

export interface RateOverrides {
  cells: Record<string, CellOverride>; // key: `${section}.${key}`
  adultAge?: CellOverride;
  adultRateQualifications?: { value: string[]; pinnedVersion: string };
}

export const EMPTY_OVERRIDES: RateOverrides = { cells: {} };

export const cellKey = (section: NumericSection, key: string | number) => `${section}.${key}`;

const SECTIONS: NumericSection[] = ['juniorByAge', 'apprenticeByYear', 'apprenticeYear12ByYear', 'adultApprenticeByYear', 'traineeByLevel'];

/** Effective table = published values with overrides applied on top. */
export function mergeRateTable(published: RateTable, o: RateOverrides): RateTable {
  const t: RateTable = structuredClone(published);
  for (const [k, ov] of Object.entries(o.cells)) {
    const [section, ...rest] = k.split('.');
    const key = rest.join('.');
    if (!SECTIONS.includes(section as NumericSection)) continue;
    (t[section as NumericSection] as Record<string, number>)[key] = ov.value;
  }
  if (o.adultAge) t.adultAge = o.adultAge.value;
  if (o.adultRateQualifications) t.adultRateQualifications = [...o.adultRateQualifications.value];
  return t;
}

/** Overrides made against an older award version need a manager to look again. */
export function staleOverrides(o: RateOverrides, currentVersion: string): string[] {
  const out = Object.entries(o.cells).filter(([, v]) => v.pinnedVersion !== currentVersion).map(([k]) => k);
  if (o.adultAge && o.adultAge.pinnedVersion !== currentVersion) out.push('adultAge');
  if (o.adultRateQualifications && o.adultRateQualifications.pinnedVersion !== currentVersion) out.push('adultRateQualifications');
  return out;
}

/** Diff an edited table against the published one to produce the override set. */
export function overridesFromDraft(published: PublishedRateTable, draft: RateTable, previous: RateOverrides): RateOverrides {
  const cells: Record<string, CellOverride> = {};
  for (const s of SECTIONS) {
    const pub = published.table[s] as Record<string, number>;
    const d = draft[s] as Record<string, number>;
    for (const [k, v] of Object.entries(d)) {
      if (pub[k] === v) continue;
      const key = cellKey(s, k);
      const prev = previous.cells[key];
      cells[key] = prev && prev.value === v ? prev : { value: v, pinnedVersion: published.version, awardValueAtPin: pub[k] ?? null };
    }
  }
  const out: RateOverrides = { cells };
  if (draft.adultAge !== published.table.adultAge) {
    out.adultAge = previous.adultAge?.value === draft.adultAge ? previous.adultAge
      : { value: draft.adultAge, pinnedVersion: published.version, awardValueAtPin: published.table.adultAge };
  }
  const sameQuals = JSON.stringify([...draft.adultRateQualifications].sort()) === JSON.stringify([...published.table.adultRateQualifications].sort());
  if (!sameQuals) {
    const prevQ = previous.adultRateQualifications;
    out.adultRateQualifications = prevQ && JSON.stringify(prevQ.value) === JSON.stringify(draft.adultRateQualifications)
      ? prevQ : { value: [...draft.adultRateQualifications], pinnedVersion: published.version };
  }
  return out;
}

/** Re-confirm a flagged override against the current award version. */
export function confirmOverride(o: RateOverrides, key: string, published: PublishedRateTable): RateOverrides {
  if (key === 'adultAge' && o.adultAge) return { ...o, adultAge: { ...o.adultAge, pinnedVersion: published.version, awardValueAtPin: published.table.adultAge } };
  if (key === 'adultRateQualifications' && o.adultRateQualifications) return { ...o, adultRateQualifications: { ...o.adultRateQualifications, pinnedVersion: published.version } };
  const c = o.cells[key];
  if (!c) return o;
  const [section, ...rest] = key.split('.');
  const awardNow = (published.table[section as NumericSection] as Record<string, number>)[rest.join('.')] ?? null;
  return { ...o, cells: { ...o.cells, [key]: { ...c, pinnedVersion: published.version, awardValueAtPin: awardNow } } };
}

/** Drop an override so the award's figure applies again. */
export function removeOverride(o: RateOverrides, key: string): RateOverrides {
  if (key === 'adultAge') { const { adultAge: _a, ...r } = o; return r; }
  if (key === 'adultRateQualifications') { const { adultRateQualifications: _q, ...r } = o; return r; }
  const cells = { ...o.cells }; delete cells[key];
  return { ...o, cells };
}

/** Is the percentage behind this rate from the award or an override? */
export function percentSource(o: RateOverrides, section: NumericSection, key: string | number): 'award' | 'override' {
  return o.cells[cellKey(section, key)] ? 'override' : 'award';
}
