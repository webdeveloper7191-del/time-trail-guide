import { Timesheet } from '@/types/timesheet';
import { mockTimesheets } from '@/data/mockTimesheets';
import { mockApiCall, mockSearchCall, mockPaginatedCall, ApiResponse, PaginatedResponse } from './mockApi';

export const timesheetApi = {
  async fetchTimesheets(filters?: {
    status?: string;
    locationId?: string;
    dateRange?: { start: string; end: string };
  }): Promise<ApiResponse<Timesheet[]>> {
    let timesheets = [...mockTimesheets];
    
    if (filters?.status && filters.status !== 'all') {
      timesheets = timesheets.filter(t => t.status === filters.status);
    }
    if (filters?.locationId) {
      timesheets = timesheets.filter(t => t.location.id === filters.locationId);
    }
    
    return mockApiCall(timesheets);
  },

  async fetchTimesheetsPaginated(
    page: number = 1,
    pageSize: number = 10,
    filters?: { status?: string }
  ): Promise<ApiResponse<PaginatedResponse<Timesheet>>> {
    let timesheets = [...mockTimesheets];
    
    if (filters?.status && filters.status !== 'all') {
      timesheets = timesheets.filter(t => t.status === filters.status);
    }
    
    return mockPaginatedCall(timesheets, page, pageSize);
  },

  async searchTimesheets(query: string): Promise<ApiResponse<Timesheet[]>> {
    // Manual search since Timesheet uses nested employee object
    const lowerQuery = query.toLowerCase();
    const filtered = mockTimesheets.filter(t =>
      t.employee.name.toLowerCase().includes(lowerQuery) ||
      t.employee.id.toLowerCase().includes(lowerQuery)
    );
    return mockApiCall(filtered, { delay: 200 });
  },

  async getTimesheetById(id: string): Promise<ApiResponse<Timesheet | null>> {
    const timesheet = mockTimesheets.find(t => t.id === id);
    return mockApiCall(timesheet ?? null);
  },

  async updateTimesheet(id: string, updates: Partial<Timesheet>): Promise<ApiResponse<Timesheet>> {
    const timesheet = mockTimesheets.find(t => t.id === id);
    if (!timesheet) throw new Error('Timesheet not found');
    
    const updated = { ...timesheet, ...updates };
    return mockApiCall(updated, { delay: 400 });
  },

  async approveTimesheet(id: string, approverId: string): Promise<ApiResponse<Timesheet>> {
    const timesheet = mockTimesheets.find(t => t.id === id);
    if (!timesheet) throw new Error('Timesheet not found');
    
    const approved: Timesheet = {
      ...timesheet,
      status: 'approved',
      reviewedBy: approverId,
      reviewedAt: new Date().toISOString(),
    };
    return mockApiCall(approved, { delay: 500 });
  },

  async rejectTimesheet(id: string, reason: string): Promise<ApiResponse<Timesheet>> {
    const timesheet = mockTimesheets.find(t => t.id === id);
    if (!timesheet) throw new Error('Timesheet not found');
    
    const rejected: Timesheet = {
      ...timesheet,
      status: 'rejected',
      notes: reason,
    };
    return mockApiCall(rejected, { delay: 500 });
  },

  async bulkApprove(ids: string[], approverId: string): Promise<ApiResponse<{ approved: number; failed: number }>> {
    return mockApiCall({ approved: ids.length, failed: 0 }, { delay: 800 });
  },

  async exportTimesheets(format: 'csv' | 'xlsx' | 'pdf', filters?: object): Promise<ApiResponse<{ downloadUrl: string }>> {
    return mockApiCall({ downloadUrl: `/exports/timesheets-${Date.now()}.${format}` }, { delay: 1000 });
  },

  // Mark a timesheet entry as absent for a specific shift date
  async markTimesheetAbsent(
    staffId: string, 
    shiftDate: string, 
    absenceReason: 'leave' | 'sick' | 'no_show' | 'other',
    shiftStart: string,
    shiftEnd: string,
    notes?: string
  ): Promise<ApiResponse<{ updated: boolean; timesheetId?: string; entryDate?: string }>> {
    // Find matching timesheet for this staff where the shift date falls within the week
    const timesheet = mockTimesheets.find(
      t => t.employee.id === staffId && 
           shiftDate >= t.weekStartDate && 
           shiftDate <= t.weekEndDate
    );
    
    if (timesheet) {
      // Find or create an entry for this specific date
      const existingEntry = timesheet.entries.find(e => e.date === shiftDate);
      
      if (existingEntry) {
        // Mark existing entry as absent (zero hours, with note)
        existingEntry.clockIn = shiftStart;
        existingEntry.clockOut = shiftStart; // Same time = 0 hours
        existingEntry.netHours = 0;
        existingEntry.grossHours = 0;
        existingEntry.notes = `[ABSENT - ${absenceReason.toUpperCase()}] ${notes || 'Staff marked absent from roster'}`;
        existingEntry.wasEdited = true;
        existingEntry.editedAt = new Date().toISOString();
      } else {
        // Create a new absent entry for this date
        const absentEntry = {
          id: `entry-absent-${Date.now()}`,
          date: shiftDate,
          clockIn: shiftStart,
          clockOut: shiftStart, // Same time = 0 hours worked
          breaks: [],
          totalBreakMinutes: 0,
          grossHours: 0,
          netHours: 0,
          overtime: 0,
          notes: `[ABSENT - ${absenceReason.toUpperCase()}] ${notes || 'Staff marked absent from roster'}`,
          wasEdited: true,
          editedAt: new Date().toISOString(),
        };
        timesheet.entries.push(absentEntry);
      }
      
      return mockApiCall({ updated: true, timesheetId: timesheet.id, entryDate: shiftDate }, { delay: 300 });
    }
    
    // No existing timesheet found - that's okay, absence is tracked on shift
    return mockApiCall({ updated: false }, { delay: 200 });
  },
};
