import { useSyncExternalStore, useCallback } from 'react';
import type { Certificate, Course, Enrollment, LearningPath } from '@/types/lms';
import { mockCertificates, mockCourses, mockEnrollments, mockLearningPaths } from '@/data/mockLmsData';

/** Shared, persisted training records. Every learning screen (admin and staff) reads and writes here. */
export interface LmsState {
  courses: Course[];
  enrollments: Enrollment[];
  certificates: Certificate[];
  learningPaths: LearningPath[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pathEnrollments: any[] | null;
}

const STORAGE_KEY = 'rostered.lms.v1';
const defaults = (): LmsState => ({
  courses: mockCourses,
  enrollments: mockEnrollments,
  certificates: mockCertificates,
  learningPaths: mockLearningPaths,
  pathEnrollments: null,
});

function load(): LmsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaults(), ...JSON.parse(raw) } : defaults();
  } catch { return defaults(); }
}

let state = load();
const listeners = new Set<() => void>();

/** Issue a certificate for any completed enrolment that doesn't have one yet. */
export function issueMissingCertificates(s: LmsState, issuedAt = new Date()): Certificate[] {
  const added: Certificate[] = [];
  for (const e of s.enrollments) {
    if (e.status !== 'completed') continue;
    if (s.certificates.some(c => c.enrollmentId === e.id) || added.some(c => c.enrollmentId === e.id)) continue;
    const course = s.courses.find(c => c.id === e.courseId);
    const prefix = (course?.title ?? 'CRS').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'CRS';
    const number = `${prefix}-${issuedAt.getFullYear()}-${String(s.certificates.length + added.length + 1).padStart(5, '0')}`;
    const expires = new Date(issuedAt); expires.setFullYear(expires.getFullYear() + 1);
    added.push({
      id: `cert-${e.id}`, staffId: e.staffId, courseId: e.courseId, enrollmentId: e.id,
      certificateNumber: number, issuedAt: issuedAt.toISOString(), expiresAt: expires.toISOString(), status: 'active',
    });
  }
  return added;
}

function commit(next: LmsState) {
  const extra = issueMissingCertificates(next);
  state = extra.length ? { ...next, certificates: [...next.certificates, ...extra] } : next;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* memory fallback */ }
  listeners.forEach(l => l());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key === STORAGE_KEY) { state = load(); listeners.forEach(l => l()); }
  });
}

export const lmsStore = {
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
  getSnapshot: () => state,
  set<K extends keyof LmsState>(key: K, value: LmsState[K]) { commit({ ...state, [key]: value }); },
};

type Updater<T> = T | ((prev: T) => T);

/** useState-style access to one shared training list. */
export function useLmsState<K extends keyof LmsState>(key: K): [LmsState[K], (u: Updater<LmsState[K]>) => void] {
  const value = useSyncExternalStore(lmsStore.subscribe, () => lmsStore.getSnapshot()[key], () => lmsStore.getSnapshot()[key]);
  const setter = useCallback((u: Updater<LmsState[K]>) => {
    const prev = lmsStore.getSnapshot()[key];
    lmsStore.set(key, typeof u === 'function' ? (u as (p: LmsState[K]) => LmsState[K])(prev) : u);
  }, [key]);
  return [value, setter];
}
