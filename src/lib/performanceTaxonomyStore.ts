/**
 * Tenant-level configuration for every taxonomy and rule the Performance
 * module depends on. Anything that used to be a hardcoded list or magic
 * number in a panel lives here so admins can change it without a release.
 * Persisted to localStorage with a subscribe/notify bridge.
 */

export interface TaxonomyOption {
  id: string;
  label: string;
  description?: string;
  /** Optional semantic token name used for badges, e.g. 'emerald' | 'destructive' */
  tone?: string;
  /** Numeric weight/points/order depending on the list */
  value?: number;
  isActive: boolean;
  isSystem?: boolean;
}

export type TaxonomyKey =
  | 'goalCategories'
  | 'goalPriorities'
  | 'goalStatuses'
  | 'okrTypes'
  | 'skillCategories'
  | 'skillLevels'
  | 'careerLevels'
  | 'feedbackSources'
  | 'recognitionValues'
  | 'pipReasons'
  | 'pipOutcomes'
  | 'conversationTypes'
  | 'developmentBudgetCategories'
  | 'learningCategories'
  | 'surveyCategories';

export interface TaxonomyMeta {
  key: TaxonomyKey;
  label: string;
  description: string;
  group: 'Goals & OKRs' | 'Skills & career' | 'Reviews & feedback' | 'Performance plans' | 'Engagement' | 'Learning';
  /** Show the numeric column and what it means */
  valueLabel?: string;
  toneEnabled?: boolean;
}

export const taxonomyMeta: TaxonomyMeta[] = [
  { key: 'goalCategories', label: 'Goal categories', description: 'Grouping options offered when creating a goal.', group: 'Goals & OKRs' },
  { key: 'goalPriorities', label: 'Goal priorities', description: 'Priority levels and their sort order.', group: 'Goals & OKRs', valueLabel: 'Order', toneEnabled: true },
  { key: 'goalStatuses', label: 'Goal statuses', description: 'Lifecycle states a goal can move through.', group: 'Goals & OKRs', valueLabel: 'Order', toneEnabled: true },
  { key: 'okrTypes', label: 'OKR levels', description: 'Levels an objective can be cascaded to.', group: 'Goals & OKRs', valueLabel: 'Order' },
  { key: 'skillCategories', label: 'Skill categories', description: 'Groupings used in the skills matrix.', group: 'Skills & career' },
  { key: 'skillLevels', label: 'Proficiency levels', description: 'Scale used to assess a skill. Value drives gap size.', group: 'Skills & career', valueLabel: 'Level' },
  { key: 'careerLevels', label: 'Career levels', description: 'Ladder steps used for career pathing.', group: 'Skills & career', valueLabel: 'Step' },
  { key: 'feedbackSources', label: 'Feedback sources', description: 'Who can be asked for 360° feedback.', group: 'Reviews & feedback' },
  { key: 'recognitionValues', label: 'Company values', description: 'Values a praise or recognition post can be tagged with.', group: 'Engagement', toneEnabled: true },
  { key: 'pipReasons', label: 'PIP reasons', description: 'Why a performance improvement plan was opened.', group: 'Performance plans' },
  { key: 'pipOutcomes', label: 'PIP outcomes', description: 'How a plan can be closed out.', group: 'Performance plans', toneEnabled: true },
  { key: 'conversationTypes', label: '1:1 conversation types', description: 'Meeting types available when scheduling a check-in.', group: 'Reviews & feedback' },
  { key: 'developmentBudgetCategories', label: 'Development budget categories', description: 'Spend categories for the development budget tracker.', group: 'Learning' },
  { key: 'learningCategories', label: 'Learning categories', description: 'Course and learning-path categories.', group: 'Learning' },
  { key: 'surveyCategories', label: 'Survey question categories', description: 'Themes pulse survey questions are grouped by.', group: 'Engagement' },
];

export interface NineBoxCell {
  id: string;
  performance: 'low' | 'medium' | 'high';
  potential: 'low' | 'medium' | 'high';
  label: string;
  description: string;
  tone: string;
  recommendations: string[];
}

export interface PerformanceRules {
  goals: {
    defaultDurationDays: number;
    requireManagerApproval: boolean;
    allowSelfCreatedGoals: boolean;
    progressUpdateCadenceDays: number;
    minGoalsPerStaff: number;
    maxGoalsPerStaff: number;
    requireMilestones: boolean;
  };
  reviews: {
    selfReviewRequired: boolean;
    peerReviewRequired: boolean;
    calibrationEnabled: boolean;
    reviewerCanSeeSelfRating: boolean;
    acknowledgementRequired: boolean;
    reminderDaysBefore: number[];
    /** Expected % of staff at each rating point for calibration guidance */
    distributionTargets: { rating: number; percentage: number }[];
  };
  feedback360: {
    minResponders: number;
    maxResponders: number;
    defaultDueDays: number;
    anonymousByDefault: boolean;
    releaseThreshold: number;
    managerApprovesResponders: boolean;
  };
  pip: {
    defaultDurationDays: number;
    checkInCadenceDays: number;
    requireHrApproval: boolean;
    allowExtension: boolean;
    maxExtensionDays: number;
  };
  wellbeing: {
    overtimeHoursThreshold: number;
    consecutiveDaysThreshold: number;
    daysSinceLeaveThreshold: number;
    checkInCadenceDays: number;
    notifyManagerOnHighRisk: boolean;
  };
  surveys: {
    defaultFrequency: 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly';
    anonymousByDefault: boolean;
    minResponsesToPublish: number;
    enpsEnabled: boolean;
    enpsQuestion: string;
  };
  talent: {
    highPerformanceThreshold: number;
    mediumPerformanceThreshold: number;
    highPotentialThreshold: number;
    mediumPotentialThreshold: number;
    successionCoverageTarget: number;
  };
  learning: {
    defaultPassMark: number;
    certificateExpiryMonths: number;
    mandatoryCompletionDays: number;
    allowSelfEnrolment: boolean;
  };
  happiness: {
    enabled: boolean;
    cadenceDays: number;
    scaleMax: number;
    anonymous: boolean;
    lowScoreAlertThreshold: number;
  };
  budget: {
    currency: string;
    defaultAnnualAllowancePerStaff: number;
    approvalRequiredAbove: number;
    carryOverAllowed: boolean;
    carryOverCapPercent: number;
  };
  analytics: {
    defaultRangeDays: number;
    comparePreviousPeriod: boolean;
    minGroupSizeForBreakdown: number;
  };
  sentiment: {
    enableAutoAnalysis: boolean;
    highlightKeywords: boolean;
    positiveThreshold: number;
    negativeThreshold: number;
    positiveKeywords: string[];
    negativeKeywords: string[];
    intensifiers: string[];
    negators: string[];
  };
  plans: {
    defaultDurationDays: number;
    reminderDaysBefore: number[];
    requireAcknowledgement: boolean;
    autoCloseOnCompletion: boolean;
  };
  notifications: {
    digestEnabled: boolean;
    digestDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
    overdueEscalationDays: number;
    notifyManagerOnGoalOverdue: boolean;
    notifyStaffOnNewAssignment: boolean;
  };
}

export interface PerformanceTaxonomyState {
  taxonomies: Record<TaxonomyKey, TaxonomyOption[]>;
  nineBox: NineBoxCell[];
  rules: PerformanceRules;
}

const STORAGE_KEY = 'rostered.performance.taxonomy.v2';

const opt = (id: string, label: string, extra: Partial<TaxonomyOption> = {}): TaxonomyOption => ({
  id,
  label,
  isActive: true,
  isSystem: true,
  ...extra,
});

const defaultState = (): PerformanceTaxonomyState => ({
  taxonomies: {
    goalCategories: [
      opt('cat-performance', 'Performance'),
      opt('cat-development', 'Skill development'),
      opt('cat-compliance', 'Compliance'),
      opt('cat-leadership', 'Leadership'),
      opt('cat-customer', 'Customer service'),
      opt('cat-team', 'Team contribution'),
    ],
    goalPriorities: [
      opt('low', 'Low', { value: 1, tone: 'muted' }),
      opt('medium', 'Medium', { value: 2, tone: 'secondary' }),
      opt('high', 'High', { value: 3, tone: 'amber' }),
      opt('critical', 'Critical', { value: 4, tone: 'destructive' }),
    ],
    goalStatuses: [
      opt('gs-not-started', 'Not started', { value: 1, tone: 'muted' }),
      opt('gs-in-progress', 'In progress', { value: 2, tone: 'secondary' }),
      opt('gs-at-risk', 'At risk', { value: 3, tone: 'amber' }),
      opt('gs-completed', 'Completed', { value: 4, tone: 'emerald' }),
      opt('gs-cancelled', 'Cancelled', { value: 5, tone: 'destructive' }),
    ],
    okrTypes: [
      opt('company', 'Company', { value: 1 }),
      opt('team', 'Team', { value: 2 }),
      opt('individual', 'Individual', { value: 3 }),
    ],
    skillCategories: [
      opt('sk-technical', 'Technical'),
      opt('sk-compliance', 'Compliance & safety'),
      opt('sk-leadership', 'Leadership'),
      opt('sk-interpersonal', 'Interpersonal'),
    ],
    skillLevels: [
      opt('lvl-none', 'None', { value: 0 }),
      opt('lvl-beginner', 'Beginner', { value: 1 }),
      opt('lvl-intermediate', 'Intermediate', { value: 2 }),
      opt('lvl-advanced', 'Advanced', { value: 3 }),
      opt('lvl-expert', 'Expert', { value: 4 }),
    ],
    careerLevels: [
      opt('cl-1', 'Entry', { value: 1 }),
      opt('cl-2', 'Experienced', { value: 2 }),
      opt('cl-3', 'Senior', { value: 3 }),
      opt('cl-4', 'Lead', { value: 4 }),
      opt('cl-5', 'Manager', { value: 5 }),
    ],
    feedbackSources: [
      opt('fs-self', 'Self assessment'),
      opt('fs-manager', 'Manager'),
      opt('fs-peer', 'Peer'),
      opt('fs-report', 'Direct report'),
      opt('fs-cross', 'Cross-functional'),
      opt('fs-external', 'External stakeholder'),
    ],
    recognitionValues: [
      opt('val-care', 'Care', { tone: 'emerald' }),
      opt('val-teamwork', 'Teamwork', { tone: 'secondary' }),
      opt('val-integrity', 'Integrity', { tone: 'violet' }),
      opt('val-excellence', 'Excellence', { tone: 'amber' }),
      opt('val-safety', 'Safety first', { tone: 'destructive' }),
    ],
    pipReasons: [
      opt('pip-quality', 'Quality of work'),
      opt('pip-attendance', 'Attendance & punctuality'),
      opt('pip-conduct', 'Conduct'),
      opt('pip-productivity', 'Productivity'),
      opt('pip-compliance', 'Policy or compliance breach'),
    ],
    pipOutcomes: [
      opt('out-success', 'Successfully completed', { tone: 'emerald' }),
      opt('out-extended', 'Extended', { tone: 'amber' }),
      opt('out-role-change', 'Role change', { tone: 'secondary' }),
      opt('out-exit', 'Exit', { tone: 'destructive' }),
    ],
    conversationTypes: [
      opt('one_on_one', 'Weekly 1:1'),
      opt('check_in', 'Check-in'),
      opt('coaching', 'Coaching'),
      opt('feedback', 'Feedback conversation'),
      opt('career', 'Career conversation'),
    ],
    developmentBudgetCategories: [
      opt('db-training', 'Training & courses'),
      opt('db-conference', 'Conferences'),
      opt('db-certification', 'Certifications'),
      opt('db-coaching', 'Coaching & mentoring'),
      opt('db-materials', 'Books & materials'),
    ],
    learningCategories: [
      opt('lc-induction', 'Induction'),
      opt('lc-compliance', 'Compliance'),
      opt('lc-technical', 'Technical skills'),
      opt('lc-leadership', 'Leadership'),
      opt('lc-wellbeing', 'Wellbeing'),
    ],
    surveyCategories: [
      opt('sc-engagement', 'Engagement'),
      opt('sc-satisfaction', 'Satisfaction'),
      opt('sc-culture', 'Culture'),
      opt('sc-leadership', 'Leadership'),
      opt('sc-workload', 'Workload'),
      opt('sc-growth', 'Growth'),
    ],
  },
  nineBox: [
    { id: 'nb-lh', performance: 'low', potential: 'high', label: 'Enigma', description: 'High potential but underperforming', tone: 'amber', recommendations: ['Coaching', 'Role clarification', 'Skill development'] },
    { id: 'nb-mh', performance: 'medium', potential: 'high', label: 'Growth employee', description: 'Good performer with high potential', tone: 'lime', recommendations: ['Stretch assignments', 'Mentoring'] },
    { id: 'nb-hh', performance: 'high', potential: 'high', label: 'Star', description: 'Top performer with high potential', tone: 'emerald', recommendations: ['Succession planning', 'Retention focus'] },
    { id: 'nb-lm', performance: 'low', potential: 'medium', label: 'Dilemma', description: 'Inconsistent performance', tone: 'orange', recommendations: ['Performance plan', 'Role fit evaluation'] },
    { id: 'nb-mm', performance: 'medium', potential: 'medium', label: 'Core player', description: 'Solid contributor', tone: 'blue', recommendations: ['Recognition', 'Incremental development'] },
    { id: 'nb-hm', performance: 'high', potential: 'medium', label: 'High performer', description: 'Strong performer, steady potential', tone: 'cyan', recommendations: ['Expertise roles', 'Knowledge transfer'] },
    { id: 'nb-ll', performance: 'low', potential: 'low', label: 'Underperformer', description: 'Not meeting expectations', tone: 'red', recommendations: ['Improvement plan', 'Clear expectations'] },
    { id: 'nb-ml', performance: 'medium', potential: 'low', label: 'Effective', description: 'Adequate performance', tone: 'slate', recommendations: ['Maintain engagement', 'Technical training'] },
    { id: 'nb-hl', performance: 'high', potential: 'low', label: 'Trusted professional', description: 'Reliable expert in role', tone: 'violet', recommendations: ['Subject matter expert role', 'Mentoring others'] },
  ],
  rules: {
    goals: {
      defaultDurationDays: 90,
      requireManagerApproval: true,
      allowSelfCreatedGoals: true,
      progressUpdateCadenceDays: 14,
      minGoalsPerStaff: 2,
      maxGoalsPerStaff: 8,
      requireMilestones: false,
    },
    reviews: {
      selfReviewRequired: true,
      peerReviewRequired: false,
      calibrationEnabled: true,
      reviewerCanSeeSelfRating: true,
      acknowledgementRequired: true,
      reminderDaysBefore: [7, 3, 1],
      distributionTargets: [
        { rating: 1, percentage: 5 },
        { rating: 2, percentage: 15 },
        { rating: 3, percentage: 50 },
        { rating: 4, percentage: 20 },
        { rating: 5, percentage: 10 },
      ],
    },
    feedback360: {
      minResponders: 3,
      maxResponders: 10,
      defaultDueDays: 14,
      anonymousByDefault: true,
      releaseThreshold: 3,
      managerApprovesResponders: true,
    },
    pip: {
      defaultDurationDays: 60,
      checkInCadenceDays: 14,
      requireHrApproval: true,
      allowExtension: true,
      maxExtensionDays: 30,
    },
    wellbeing: {
      overtimeHoursThreshold: 10,
      consecutiveDaysThreshold: 7,
      daysSinceLeaveThreshold: 120,
      checkInCadenceDays: 30,
      notifyManagerOnHighRisk: true,
    },
    surveys: {
      defaultFrequency: 'monthly',
      anonymousByDefault: true,
      minResponsesToPublish: 5,
      enpsEnabled: true,
      enpsQuestion: 'How likely are you to recommend working here to a friend?',
    },
    talent: {
      highPerformanceThreshold: 4,
      mediumPerformanceThreshold: 3,
      highPotentialThreshold: 4,
      mediumPotentialThreshold: 3,
      successionCoverageTarget: 2,
    },
    learning: {
      defaultPassMark: 80,
      certificateExpiryMonths: 12,
      mandatoryCompletionDays: 30,
      allowSelfEnrolment: true,
    },
    happiness: {
      enabled: true,
      cadenceDays: 7,
      scaleMax: 5,
      anonymous: true,
      lowScoreAlertThreshold: 2,
    },
    budget: {
      currency: 'AUD',
      defaultAnnualAllowancePerStaff: 1500,
      approvalRequiredAbove: 500,
      carryOverAllowed: false,
      carryOverCapPercent: 25,
    },
    analytics: {
      defaultRangeDays: 90,
      comparePreviousPeriod: true,
      minGroupSizeForBreakdown: 5,
    },
    sentiment: {
      enableAutoAnalysis: true,
      highlightKeywords: true,
      positiveThreshold: 20,
      negativeThreshold: -20,
      positiveKeywords: ['great', 'excellent', 'outstanding', 'supportive', 'reliable', 'proactive', 'helpful', 'improved', 'strong', 'positive'],
      negativeKeywords: ['poor', 'late', 'unreliable', 'missed', 'concern', 'issue', 'struggling', 'negative', 'disengaged', 'conflict'],
      intensifiers: ['very', 'extremely', 'really', 'highly', 'consistently'],
      negators: ['not', 'never', 'no', "isn't", "wasn't", 'rarely'],
    },
    plans: {
      defaultDurationDays: 90,
      reminderDaysBefore: [14, 7, 1],
      requireAcknowledgement: true,
      autoCloseOnCompletion: true,
    },
    notifications: {
      digestEnabled: true,
      digestDay: 'monday',
      overdueEscalationDays: 3,
      notifyManagerOnGoalOverdue: true,
      notifyStaffOnNewAssignment: true,
    },
  },
});

let cache: PerformanceTaxonomyState | null = null;
const listeners = new Set<() => void>();

function read(): PerformanceTaxonomyState {
  if (cache) return cache;
  const base = defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PerformanceTaxonomyState>;
      cache = {
        taxonomies: { ...base.taxonomies, ...(parsed.taxonomies ?? {}) },
        nineBox: parsed.nineBox?.length ? parsed.nineBox : base.nineBox,
        rules: mergeRules(base.rules, parsed.rules),
      };
    } else {
      cache = base;
    }
  } catch {
    cache = base;
  }
  return cache!;
}

function mergeRules(base: PerformanceRules, next?: Partial<PerformanceRules>): PerformanceRules {
  if (!next) return base;
  const out = { ...base } as PerformanceRules;
  (Object.keys(base) as (keyof PerformanceRules)[]).forEach(k => {
    out[k] = { ...(base[k] as object), ...((next[k] ?? {}) as object) } as never;
  });
  return out;
}

function write(next: PerformanceTaxonomyState) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — keep in memory */
  }
  listeners.forEach(l => l());
}

const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const performanceTaxonomyStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: read,
  reset() {
    write(defaultState());
  },

  list(key: TaxonomyKey): TaxonomyOption[] {
    return read().taxonomies[key] ?? [];
  },
  activeList(key: TaxonomyKey): TaxonomyOption[] {
    return this.list(key).filter(o => o.isActive);
  },
  saveOption(key: TaxonomyKey, option: Omit<TaxonomyOption, 'id'> & { id?: string }) {
    const state = read();
    const id = option.id ?? uid(key.slice(0, 3));
    const next: TaxonomyOption = { ...option, id } as TaxonomyOption;
    const existing = state.taxonomies[key] ?? [];
    const list = existing.some(o => o.id === id) ? existing.map(o => (o.id === id ? next : o)) : [...existing, next];
    write({ ...state, taxonomies: { ...state.taxonomies, [key]: list } });
    return id;
  },
  deleteOption(key: TaxonomyKey, id: string) {
    const state = read();
    const target = (state.taxonomies[key] ?? []).find(o => o.id === id);
    if (target?.isSystem) throw new Error('System options can be renamed or deactivated, but not deleted.');
    write({ ...state, taxonomies: { ...state.taxonomies, [key]: (state.taxonomies[key] ?? []).filter(o => o.id !== id) } });
  },
  toggleOption(key: TaxonomyKey, id: string) {
    const state = read();
    write({
      ...state,
      taxonomies: {
        ...state.taxonomies,
        [key]: (state.taxonomies[key] ?? []).map(o => (o.id === id ? { ...o, isActive: !o.isActive } : o)),
      },
    });
  },
  reorderOption(key: TaxonomyKey, id: string, direction: -1 | 1) {
    const state = read();
    const list = [...(state.taxonomies[key] ?? [])];
    const i = list.findIndex(o => o.id === id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    write({ ...state, taxonomies: { ...state.taxonomies, [key]: list } });
  },

  saveNineBoxCell(cell: NineBoxCell) {
    const state = read();
    write({ ...state, nineBox: state.nineBox.map(c => (c.id === cell.id ? cell : c)) });
  },

  updateRules<K extends keyof PerformanceRules>(section: K, patch: Partial<PerformanceRules[K]>) {
    const state = read();
    write({ ...state, rules: { ...state.rules, [section]: { ...state.rules[section], ...patch } } });
  },
};

/** Total of the calibration distribution targets — should be 100. */
export function distributionTotal(targets: { percentage: number }[]): number {
  return targets.reduce((s, t) => s + t.percentage, 0);
}
