import { describe, it, expect } from 'vitest';
import { calculateAssessmentScore, isCourseLocked, determineEnrollmentStatus } from './lmsLogic';
import { Course, Enrollment } from '@/types/lms';

describe('LMS Logic', () => {
  it('should calculate assessment score correctly', () => {
    const questions = [
      { id: '1', correctAnswer: 'A' },
      { id: '2', correctAnswer: ['B', 'C'] }
    ];
    const answers = { '1': 'A', '2': ['B', 'C'] };
    expect(calculateAssessmentScore(questions, answers)).toBe(100);
    
    const partialAnswers = { '1': 'A', '2': ['B'] };
    expect(calculateAssessmentScore(questions, partialAnswers)).toBe(50);
  });

  it('should lock course if prerequisites are not met', () => {
    const course = { id: 'c2', prerequisites: ['c1'] } as Course;
    const enrollments = [{ courseId: 'c1', status: 'in_progress' }] as Enrollment[];
    const result = isCourseLocked(course, enrollments, ['admin'], 'loc1');
    expect(result.locked).toBe(true);
    expect(result.reason).toBe('Prerequisites not completed');
  });

  it('should unlock course if prerequisites are met', () => {
    const course = { id: 'c2', prerequisites: ['c1'] } as Course;
    const enrollments = [{ courseId: 'c1', status: 'completed' }] as Enrollment[];
    const result = isCourseLocked(course, enrollments, ['admin'], 'loc1');
    expect(result.locked).toBe(false);
  });

  it('should determine status based on pass mark', () => {
    expect(determineEnrollmentStatus(80, 80)).toBe('completed');
    expect(determineEnrollmentStatus(79, 80)).toBe('failed');
  });
});
