import { CoursePlayer } from '@/components/performance/CoursePlayer';
import type { Course, Enrollment } from '@/types/lms';
interface Props {
  open: boolean; course: Course | null; enrollment: Enrollment | null; onClose: () => void;
  onProgressUpdate: (id: string, moduleId: string, contentId: string, completed: boolean) => void;
  onModuleComplete: (id: string, moduleId: string) => void;
  onCourseComplete: (id: string) => void;
  onAssessmentSubmit: (id: string, assessmentId: string, answers: Record<string, string | string[]>) => Promise<{score: number; passed: boolean}>;
}
// One assessment/progress flow on every screen size; offline controls are shared too.
export function MobileCoursePlayer(props: Props) { return <CoursePlayer {...props} />; }
