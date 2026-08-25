/**
 * Performance admin configuration store.
 * Tenant-level config for rating scales, the competency/criteria library and
 * review-cycle calendar. Persisted to localStorage (no backend yet) with a
 * simple subscribe/notify bridge so panels re-render on change.
 */

export interface RatingScalePoint {
  value: number;
  label: string;
  description?: string;
}

export interface RatingScale {
  id: string;
  name: string;
  description?: string;
  points: RatingScalePoint[];
  /** Used by default for new review cycles */
  isDefault: boolean;
  isActive: boolean;
  /** Applies to reviews, goals or both */
  appliesTo: 'reviews' | 'goals' | 'both';
}

export interface Competency {
  id: string;
  name: string;
  description: string;
  category: string;
  weight: number; // percentage weighting inside its review template
  /** Behavioural anchors shown to reviewers */
  anchors: string[];
  isActive: boolean;
}

export type ReviewCycleStage = 'not_started' | 'nominations' | 'self_review' | 'manager_review' | 'calibration' | 'closed';

export interface ReviewCycleConfig {
  id: string;
  name: string;
  cycle: 'annual' | 'semi_annual' | 'quarterly' | 'monthly';
  periodStart: string;
  periodEnd: string;
  selfReviewDue: string;
  managerReviewDue: string;
  calibrationDate?: string;
  ratingScaleId: string;
  competencyIds: string[];
  /** Locations in scope; empty = all locations */
  locationIds: string[];
  stage: ReviewCycleStage;
  autoRemindersDays: number[];
}

export interface PerformanceConfig {
  ratingScales: RatingScale[];
  competencies: Competency[];
  reviewCycles: ReviewCycleConfig[];
}

const STORAGE_KEY = 'rostered.performance.config.v1';

const defaultConfig = (): PerformanceConfig => ({
  ratingScales: [
    {
      id: 'scale-5pt',
      name: '5-point performance scale',
      description: 'Standard five-level scale used for annual reviews.',
      isDefault: true,
      isActive: true,
      appliesTo: 'both',
      points: [
        { value: 1, label: 'Needs improvement', description: 'Consistently below expectations' },
        { value: 2, label: 'Developing', description: 'Approaching expectations, needs support' },
        { value: 3, label: 'Meets expectations', description: 'Reliably delivers the role standard' },
        { value: 4, label: 'Exceeds expectations', description: 'Frequently delivers above the standard' },
        { value: 5, label: 'Outstanding', description: 'Role model performance across the period' },
      ],
    },
    {
      id: 'scale-3pt',
      name: '3-point check-in scale',
      description: 'Lightweight scale for quarterly check-ins.',
      isDefault: false,
      isActive: true,
      appliesTo: 'reviews',
      points: [
        { value: 1, label: 'Off track' },
        { value: 2, label: 'On track' },
        { value: 3, label: 'Ahead' },
      ],
    },
  ],
  competencies: [
    { id: 'comp-quality', name: 'Quality of work', description: 'Accuracy, thoroughness and reliability of output.', category: 'Core', weight: 20, anchors: ['Work is consistently accurate', 'Rework is rare'], isActive: true },
    { id: 'comp-productivity', name: 'Productivity', description: 'Efficiency and volume of work completed.', category: 'Core', weight: 20, anchors: ['Meets agreed workload', 'Prioritises effectively'], isActive: true },
    { id: 'comp-communication', name: 'Communication', description: 'Clarity and professionalism of communication.', category: 'Core', weight: 15, anchors: ['Communicates clearly with the team', 'Escalates issues early'], isActive: true },
    { id: 'comp-teamwork', name: 'Teamwork', description: 'Collaboration and support of colleagues.', category: 'Core', weight: 15, anchors: ['Supports peers under pressure', 'Shares knowledge'], isActive: true },
    { id: 'comp-initiative', name: 'Initiative', description: 'Proactiveness, problem solving and ownership.', category: 'Leadership', weight: 15, anchors: ['Identifies improvements', 'Takes ownership of outcomes'], isActive: true },
    { id: 'comp-growth', name: 'Professional growth', description: 'Learning, development and skill improvement.', category: 'Development', weight: 15, anchors: ['Completes assigned learning', 'Applies feedback'], isActive: true },
  ],
  reviewCycles: [
    {
      id: 'cycle-fy26-annual',
      name: 'FY26 annual review',
      cycle: 'annual',
      periodStart: '2025-07-01',
      periodEnd: '2026-06-30',
      selfReviewDue: '2026-07-10',
      managerReviewDue: '2026-07-24',
      calibrationDate: '2026-07-31',
      ratingScaleId: 'scale-5pt',
      competencyIds: ['comp-quality', 'comp-productivity', 'comp-communication', 'comp-teamwork', 'comp-initiative', 'comp-growth'],
      locationIds: [],
      stage: 'self_review',
      autoRemindersDays: [7, 3, 1],
    },
    {
      id: 'cycle-q1-checkin',
      name: 'Q1 check-in',
      cycle: 'quarterly',
      periodStart: '2026-07-01',
      periodEnd: '2026-09-30',
      selfReviewDue: '2026-10-05',
      managerReviewDue: '2026-10-12',
      ratingScaleId: 'scale-3pt',
      competencyIds: ['comp-quality', 'comp-growth'],
      locationIds: [],
      stage: 'not_started',
      autoRemindersDays: [3, 1],
    },
  ],
});

let cache: PerformanceConfig | null = null;
const listeners = new Set<() => void>();

function read(): PerformanceConfig {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? { ...defaultConfig(), ...JSON.parse(raw) } : defaultConfig();
  } catch {
    cache = defaultConfig();
  }
  return cache!;
}

function write(next: PerformanceConfig) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — keep in-memory */
  }
  listeners.forEach(l => l());
}

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const performanceConfigStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: read,
  reset() {
    write(defaultConfig());
  },

  // ---- Rating scales ----
  saveRatingScale(scale: Omit<RatingScale, 'id'> & { id?: string }) {
    const cfg = read();
    const id = scale.id ?? uid('scale');
    const next: RatingScale = { ...scale, id } as RatingScale;
    let scales = cfg.ratingScales.some(s => s.id === id)
      ? cfg.ratingScales.map(s => (s.id === id ? next : s))
      : [...cfg.ratingScales, next];
    if (next.isDefault) scales = scales.map(s => (s.id === id ? s : { ...s, isDefault: false }));
    write({ ...cfg, ratingScales: scales });
    return id;
  },
  deleteRatingScale(id: string) {
    const cfg = read();
    if (cfg.reviewCycles.some(c => c.ratingScaleId === id)) {
      throw new Error('This scale is used by a review cycle and cannot be deleted.');
    }
    write({ ...cfg, ratingScales: cfg.ratingScales.filter(s => s.id !== id) });
  },

  // ---- Competencies ----
  saveCompetency(comp: Omit<Competency, 'id'> & { id?: string }) {
    const cfg = read();
    const id = comp.id ?? uid('comp');
    const next: Competency = { ...comp, id } as Competency;
    const competencies = cfg.competencies.some(c => c.id === id)
      ? cfg.competencies.map(c => (c.id === id ? next : c))
      : [...cfg.competencies, next];
    write({ ...cfg, competencies });
    return id;
  },
  deleteCompetency(id: string) {
    const cfg = read();
    write({
      ...cfg,
      competencies: cfg.competencies.filter(c => c.id !== id),
      reviewCycles: cfg.reviewCycles.map(c => ({ ...c, competencyIds: c.competencyIds.filter(x => x !== id) })),
    });
  },

  // ---- Review cycles ----
  saveReviewCycle(cycle: Omit<ReviewCycleConfig, 'id'> & { id?: string }) {
    const cfg = read();
    const id = cycle.id ?? uid('cycle');
    const next: ReviewCycleConfig = { ...cycle, id } as ReviewCycleConfig;
    const reviewCycles = cfg.reviewCycles.some(c => c.id === id)
      ? cfg.reviewCycles.map(c => (c.id === id ? next : c))
      : [...cfg.reviewCycles, next];
    write({ ...cfg, reviewCycles });
    return id;
  },
  deleteReviewCycle(id: string) {
    const cfg = read();
    write({ ...cfg, reviewCycles: cfg.reviewCycles.filter(c => c.id !== id) });
  },
  advanceStage(id: string, stage: ReviewCycleStage) {
    const cfg = read();
    write({ ...cfg, reviewCycles: cfg.reviewCycles.map(c => (c.id === id ? { ...c, stage } : c)) });
  },
};

/** Total weight of the competencies selected on a cycle — should be 100. */
export function totalWeight(competencies: Competency[], ids: string[]): number {
  return competencies.filter(c => ids.includes(c.id)).reduce((sum, c) => sum + c.weight, 0);
}

export const reviewCycleStageLabels: Record<ReviewCycleStage, string> = {
  not_started: 'Not started',
  nominations: 'Nominations open',
  self_review: 'Self review',
  manager_review: 'Manager review',
  calibration: 'Calibration',
  closed: 'Closed',
};
