import { Course, Enrollment, Assessment, AssessmentAttempt, EnrollmentStatus } from '@/types/lms';
import { parseISO, isBefore, isAfter } from 'date-fns';

export function calculateAssessmentScore(questions: any[], answers: Record<string, string | string[]>): number {
  if (!questions || questions.length === 0) return 0;
  let correct = 0;
  questions.forEach(q => {
    const userAnswer = answers[q.id];
    const isCorrect = Array.isArray(q.correctAnswer) 
      ? Array.isArray(userAnswer) && q.correctAnswer.length === userAnswer.length && q.correctAnswer.every((val: string) => userAnswer.includes(val))
      : userAnswer === q.correctAnswer;
    
    if (isCorrect) {
      correct++;
    }
  });
  return Math.round((correct / questions.length) * 100);
}

export function canAttemptAssessment(assessment: Assessment, attempts: AssessmentAttempt[]): boolean {
  const retakeLimit = assessment.retakeLimit ?? assessment.maxAttempts ?? Infinity;
  return attempts.length < retakeLimit;
}

export function isCourseLocked(course: Course, enrollments: Enrollment[], staffRoles: string[], staffLocation: string): { locked: boolean; reason?: string } {
  if (course.status !== 'published') return { locked:true,reason:'This course is not published' };
  const now = new Date();
  
  if (course.availableFrom && isBefore(now, parseISO(course.availableFrom))) {
    return { locked: true, reason: `Available from ${course.availableFrom}` };
  }
  if (course.availableUntil && isAfter(now, parseISO(course.availableUntil))) {
    return { locked: true, reason: `Course ended on ${course.availableUntil}` };
  }

  if (course.assignedRoles && course.assignedRoles.length > 0 && !course.assignedRoles.includes(staffRoles[0])) {
    return { locked: true, reason: 'Not assigned to your role' };
  }
  if (course.assignedLocations && course.assignedLocations.length > 0 && !course.assignedLocations.includes(staffLocation)) {
    return { locked: true, reason: 'Not assigned to your location' };
  }

  if (course.prerequisites && course.prerequisites.length > 0) {
    for (const prereqId of course.prerequisites) {
      const prereqEnrollment = enrollments.find(e => e.courseId === prereqId);
      if (prereqEnrollment?.status !== 'completed') {
        return { locked: true, reason: 'Prerequisites not completed' };
      }
    }
  }

  return { locked: false };
}

export function determineEnrollmentStatus(score: number, passingScore: number): EnrollmentStatus {
  return score >= passingScore ? 'completed' : 'failed';
}
