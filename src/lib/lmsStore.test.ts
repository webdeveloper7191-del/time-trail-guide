import { describe, it, expect } from 'vitest';
import { issueMissingCertificates } from './lmsStore';
import type { LmsState } from './lmsStore';

describe('certificates', () => {
  it('issues one certificate per completed enrolment without one', () => {
    const s = { courses: [{id:'c1',title:'Safety',certificateOnCompletion:true}], certificates: [], learningPaths: [], pathEnrollments: null,
      enrollments: [{ id: 'e1', staffId: 's1', courseId: 'c1', status: 'completed' }, { id: 'e2', staffId: 's1', courseId: 'c1', status: 'in_progress' }],
    } as unknown as LmsState;
    const out = issueMissingCertificates(s);
    expect(out).toHaveLength(1);
    expect(out[0].enrollmentId).toBe('e1');
    expect(issueMissingCertificates({ ...s, certificates: out })).toHaveLength(0);
  });
});
