/**
 * Type-aware filter operator engine for ReportDataTable.
 * Supports text, number, date, and enum columns with standard operators.
 */
export type ColumnType = 'text' | 'number' | 'date' | 'enum';

export type Operator =
  // Text
  | 'contains' | 'notContains' | 'equals' | 'notEquals' | 'startsWith' | 'endsWith' | 'isEmpty' | 'isNotEmpty'
  // Number / Date
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'notBetween'
  // Enum
  | 'in' | 'notIn'
  // Date specific
  | 'before' | 'after' | 'onOrBefore' | 'onOrAfter' | 'dateBetween' | 'isToday' | 'isYesterday' | 'last7Days' | 'last30Days' | 'thisMonth' | 'lastMonth';

export interface FilterRule {
  id: string;
  columnKey: string;
  operator: Operator;
  value?: string | number;
  value2?: string | number; // for between
  values?: string[]; // for in/notIn
}

export const TEXT_OPERATORS: { value: Operator; label: string; needsValue?: boolean }[] = [
  { value: 'contains', label: 'Contains', needsValue: true },
  { value: 'notContains', label: 'Does not contain', needsValue: true },
  { value: 'equals', label: 'Equals', needsValue: true },
  { value: 'notEquals', label: 'Not equal to', needsValue: true },
  { value: 'startsWith', label: 'Starts with', needsValue: true },
  { value: 'endsWith', label: 'Ends with', needsValue: true },
  { value: 'isEmpty', label: 'Is empty' },
  { value: 'isNotEmpty', label: 'Is not empty' },
];

export const NUMBER_OPERATORS: { value: Operator; label: string; needsValue?: boolean; needsValue2?: boolean }[] = [
  { value: 'eq', label: '=', needsValue: true },
  { value: 'neq', label: '≠', needsValue: true },
  { value: 'gt', label: '>', needsValue: true },
  { value: 'gte', label: '≥', needsValue: true },
  { value: 'lt', label: '<', needsValue: true },
  { value: 'lte', label: '≤', needsValue: true },
  { value: 'between', label: 'Between', needsValue: true, needsValue2: true },
  { value: 'notBetween', label: 'Not between', needsValue: true, needsValue2: true },
  { value: 'isEmpty', label: 'Is empty' },
  { value: 'isNotEmpty', label: 'Is not empty' },
];

export const DATE_OPERATORS: { value: Operator; label: string; needsValue?: boolean; needsValue2?: boolean }[] = [
  { value: 'equals', label: 'On date', needsValue: true },
  { value: 'before', label: 'Before', needsValue: true },
  { value: 'after', label: 'After', needsValue: true },
  { value: 'onOrBefore', label: 'On or before', needsValue: true },
  { value: 'onOrAfter', label: 'On or after', needsValue: true },
  { value: 'dateBetween', label: 'Between', needsValue: true, needsValue2: true },
  { value: 'isToday', label: 'Is today' },
  { value: 'isYesterday', label: 'Is yesterday' },
  { value: 'last7Days', label: 'Last 7 days' },
  { value: 'last30Days', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'isEmpty', label: 'Is empty' },
  { value: 'isNotEmpty', label: 'Is not empty' },
];

export const ENUM_OPERATORS: { value: Operator; label: string; needsValues?: boolean }[] = [
  { value: 'in', label: 'Is one of', needsValues: true },
  { value: 'notIn', label: 'Is not one of', needsValues: true },
  { value: 'isEmpty', label: 'Is empty' },
  { value: 'isNotEmpty', label: 'Is not empty' },
];

export function getOperatorsForType(type: ColumnType) {
  switch (type) {
    case 'number': return NUMBER_OPERATORS;
    case 'date': return DATE_OPERATORS;
    case 'enum': return ENUM_OPERATORS;
    default: return TEXT_OPERATORS;
  }
}

export function getDefaultOperator(type: ColumnType): Operator {
  switch (type) {
    case 'number': return 'gte';
    case 'date': return 'after';
    case 'enum': return 'in';
    default: return 'contains';
  }
}

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function endOfDay(d: Date) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }

export function evaluateRule(rawValue: string, numericValue: number | null, rule: FilterRule, type: ColumnType): boolean {
  const op = rule.operator;
  const isEmpty = rawValue === '' || rawValue === null || rawValue === undefined;

  if (op === 'isEmpty') return isEmpty;
  if (op === 'isNotEmpty') return !isEmpty;

  if (type === 'text') {
    const v = (rule.value ?? '').toString().toLowerCase();
    const r = rawValue.toLowerCase();
    switch (op) {
      case 'contains': return r.includes(v);
      case 'notContains': return !r.includes(v);
      case 'equals': return r === v;
      case 'notEquals': return r !== v;
      case 'startsWith': return r.startsWith(v);
      case 'endsWith': return r.endsWith(v);
      default: return true;
    }
  }

  if (type === 'number') {
    if (numericValue === null || isNaN(numericValue)) return false;
    const v = Number(rule.value);
    const v2 = Number(rule.value2);
    switch (op) {
      case 'eq': return numericValue === v;
      case 'neq': return numericValue !== v;
      case 'gt': return numericValue > v;
      case 'gte': return numericValue >= v;
      case 'lt': return numericValue < v;
      case 'lte': return numericValue <= v;
      case 'between': return numericValue >= Math.min(v, v2) && numericValue <= Math.max(v, v2);
      case 'notBetween': return numericValue < Math.min(v, v2) || numericValue > Math.max(v, v2);
      default: return true;
    }
  }

  if (type === 'date') {
    const d = parseDate(rawValue);
    if (!d) return false;
    const now = new Date();
    const today = startOfDay(now);
    switch (op) {
      case 'equals': { const t = parseDate(rule.value); return !!t && startOfDay(d).getTime() === startOfDay(t).getTime(); }
      case 'before': { const t = parseDate(rule.value); return !!t && d < startOfDay(t); }
      case 'after': { const t = parseDate(rule.value); return !!t && d > endOfDay(t); }
      case 'onOrBefore': { const t = parseDate(rule.value); return !!t && d <= endOfDay(t); }
      case 'onOrAfter': { const t = parseDate(rule.value); return !!t && d >= startOfDay(t); }
      case 'dateBetween': {
        const a = parseDate(rule.value); const b = parseDate(rule.value2);
        if (!a || !b) return true;
        return d >= startOfDay(a) && d <= endOfDay(b);
      }
      case 'isToday': return startOfDay(d).getTime() === today.getTime();
      case 'isYesterday': { const y = new Date(today); y.setDate(y.getDate() - 1); return startOfDay(d).getTime() === y.getTime(); }
      case 'last7Days': { const c = new Date(today); c.setDate(c.getDate() - 7); return d >= c && d <= endOfDay(now); }
      case 'last30Days': { const c = new Date(today); c.setDate(c.getDate() - 30); return d >= c && d <= endOfDay(now); }
      case 'thisMonth': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      case 'lastMonth': {
        const m = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return d.getMonth() === m && d.getFullYear() === y;
      }
      default: return true;
    }
  }

  if (type === 'enum') {
    const list = rule.values || [];
    switch (op) {
      case 'in': return list.length === 0 || list.includes(rawValue);
      case 'notIn': return list.length === 0 || !list.includes(rawValue);
      default: return true;
    }
  }
  return true;
}

export function operatorLabel(op: Operator): string {
  const all = [...TEXT_OPERATORS, ...NUMBER_OPERATORS, ...DATE_OPERATORS, ...ENUM_OPERATORS];
  return all.find(o => o.value === op)?.label || op;
}

export function describeRule(rule: FilterRule, columnHeader: string): string {
  const opLabel = operatorLabel(rule.operator);
  if (['isEmpty', 'isNotEmpty', 'isToday', 'isYesterday', 'last7Days', 'last30Days', 'thisMonth', 'lastMonth'].includes(rule.operator)) {
    return `${columnHeader} ${opLabel.toLowerCase()}`;
  }
  if (rule.operator === 'between' || rule.operator === 'notBetween' || rule.operator === 'dateBetween') {
    return `${columnHeader} ${opLabel.toLowerCase()} ${rule.value ?? '?'} – ${rule.value2 ?? '?'}`;
  }
  if (rule.operator === 'in' || rule.operator === 'notIn') {
    return `${columnHeader} ${opLabel.toLowerCase()} ${(rule.values || []).join(', ') || '?'}`;
  }
  return `${columnHeader} ${opLabel.toLowerCase()} ${rule.value ?? '?'}`;
}
