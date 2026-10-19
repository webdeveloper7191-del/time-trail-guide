import { useBrowserState } from '@/lib/browserState';
import { mockSkills, mockStaffSkills, mockCareerPaths, mockCareerProgress } from '@/data/mockAdvancedPerformanceData';
import { mockPerformanceTasks, mockPerformancePipelines } from '@/data/mockPerformanceTaskData';
import type { Skill, StaffSkill, CareerPath, StaffCareerProgress } from '@/types/advancedPerformance';
import type { PerformanceTask, PerformanceTaskPipeline, CustomTaskType } from '@/types/performanceTasks';

export function usePerformanceTasks() {
  return useBrowserState<PerformanceTask[]>('rostered.performance.tasks.v1', mockPerformanceTasks);
}
export function usePerformancePipelines() {
  return useBrowserState<PerformanceTaskPipeline[]>('rostered.performance.task-pipelines.v1', mockPerformancePipelines);
}
export function usePerformanceTaskTypes() {
  return useBrowserState<CustomTaskType[]>('rostered.performance.task-types.v1', []);
}
export function usePerformanceSkills() {
  return useBrowserState<Skill[]>('rostered.performance.skills.v1', mockSkills);
}
export function usePerformanceStaffSkills() {
  return useBrowserState<Record<string, StaffSkill[]>>('rostered.performance.staff-skills.v1', mockStaffSkills);
}
export function usePerformanceCareerPaths() {
  return useBrowserState<CareerPath[]>('rostered.performance.career-paths.v1', mockCareerPaths);
}
export function usePerformanceCareerProgress() {
  return useBrowserState<StaffCareerProgress[]>('rostered.performance.career-progress.v1', mockCareerProgress);
}