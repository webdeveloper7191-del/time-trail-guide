// Re-export all API modules
export * from './mockApi';
export * from './rosterApi';
export * from './timesheetApi';
export * from './staffApi';

// Unified API object for convenience
import { rosterApi } from './rosterApi';
import { timesheetApi } from './timesheetApi';
import { staffApi } from './staffApi';

export const api = {
  roster: rosterApi,
  timesheet: timesheetApi,
  staff: staffApi,
};
