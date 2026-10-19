import type { Course } from '@/types/lms';
import type { CourseAuthoringState } from '@/types/lmsAdvanced';
import { lmsStore } from './lmsStore';

export function courseFromAuthoring(data: CourseAuthoringState, existing?: Course): Course {
  const stamp = new Date().toISOString();
  return { ...existing, id: data.courseId, title: data.title, description: data.description, category: data.category,
    difficulty: data.difficulty as Course['difficulty'], thumbnail: data.thumbnail,
    status: data.status === 'published' ? 'published' : 'draft',
    duration: data.modules.reduce((n,m) => n + m.content.reduce((v,c) => v + (c.duration ?? 0), 0), 0),
    modules: data.modules.map(m => ({ ...m, content: m.content.map(c => ({ id:c.id,title:c.title,type:c.type as Course['modules'][number]['content'][number]['type'],order:c.order,duration:c.duration,url:c.url,description:c.description,mandatory:c.mandatory })),
      assessment: m.assessment ? { ...m.assessment, type:m.assessment.type as NonNullable<Course['modules'][number]['assessment']>['type'] } : undefined })),
    instructor:existing?.instructor ?? 'Admin', skills:existing?.skills ?? [], industry:data.industry, tags:data.tags,
    complianceRequired:data.complianceRequired, certificateOnCompletion:data.certificateOnCompletion,
    validityPeriod:data.validityPeriod, passingScore:data.passingScore, maxAttempts:data.maxAttempts,
    prerequisites:data.prerequisites ?? [], availableFrom:data.availableFrom, availableUntil:data.availableUntil,
    assignedRoles:data.assignedRoles, assignedLocations:data.assignedLocations,
    rating:existing?.rating ?? 0,enrollmentCount:existing?.enrollmentCount ?? 0,createdAt:existing?.createdAt ?? stamp,updatedAt:stamp };
}
export function saveAuthoredCourse(data: CourseAuthoringState) {
  const courses = lmsStore.getSnapshot().courses;
  const course = courseFromAuthoring(data, courses.find(c => c.id === data.courseId));
  lmsStore.set('courses', courses.some(c=>c.id===course.id) ? courses.map(c=>c.id===course.id?course:c) : [...courses,course]);
  return course;
}
export function duplicateCourse(course: Course): Course {
  const copy = structuredClone(course);
  return { ...copy, id:crypto.randomUUID(),title:`${course.title} (copy)`,status:'draft',rating:0,enrollmentCount:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString() };
}
export function learningCsv(rows: (string | number)[][]): string {
  return '\uFEFF'+rows.map(row=>row.map(value=>{const s=String(value);return '"'+(/^[=+\-@\t\r]/.test(s)?"'"+s:s).replace(/"/g,'""')+'"';}).join(',')).join('\r\n');
}