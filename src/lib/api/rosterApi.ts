import { Shift, StaffMember, Room, OpenShift, TimeOff } from '@/types/roster';
import { mockApiCall, mockSearchCall, ApiResponse } from './mockApi';

// Roster API
export const rosterApi = {
  // Shifts
  async fetchShifts(centreId?: string, dateRange?: { start: string; end: string }): Promise<ApiResponse<Shift[]>> {
    const { generateMockShifts } = await import('@/data/mockRosterData');
    let shifts = [...generateMockShifts()];
    
    if (centreId) {
      shifts = shifts.filter(s => s.centreId === centreId);
    }
    if (dateRange) {
      shifts = shifts.filter(s => s.date >= dateRange.start && s.date <= dateRange.end);
    }
    
    return mockApiCall(shifts);
  },

  async createShift(shift: Omit<Shift, 'id'>): Promise<ApiResponse<Shift>> {
    const newShift: Shift = {
      ...shift,
      id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    return mockApiCall(newShift, { delay: 400 });
  },

  async updateShift(id: string, updates: Partial<Shift>): Promise<ApiResponse<Shift>> {
    const { generateMockShifts } = await import('@/data/mockRosterData');
    const shift = generateMockShifts().find(s => s.id === id);
    if (!shift) throw new Error('Shift not found');
    
    const updatedShift = { ...shift, ...updates };
    return mockApiCall(updatedShift, { delay: 300 });
  },

  async deleteShift(id: string): Promise<ApiResponse<{ id: string }>> {
    return mockApiCall({ id }, { delay: 300 });
  },

  async bulkCreateShifts(shifts: Omit<Shift, 'id'>[]): Promise<ApiResponse<Shift[]>> {
    const newShifts = shifts.map(shift => ({
      ...shift,
      id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));
    return mockApiCall(newShifts, { delay: 600 });
  },

  // Staff
  async fetchStaff(centreId?: string): Promise<ApiResponse<StaffMember[]>> {
    const { mockStaff } = await import('@/data/mockRosterData');
    let staff = [...mockStaff];
    if (centreId) {
      staff = staff.filter(s => s.preferredCentres.includes(centreId));
    }
    return mockApiCall(staff);
  },

  async searchStaff(query: string): Promise<ApiResponse<StaffMember[]>> {
    const { mockStaff } = await import('@/data/mockRosterData');
    return mockSearchCall(mockStaff, query, ['name']);
  },

  async updateStaffMember(id: string, updates: Partial<StaffMember>): Promise<ApiResponse<StaffMember>> {
    const { mockStaff } = await import('@/data/mockRosterData');
    const staff = mockStaff.find(s => s.id === id);
    if (!staff) throw new Error('Staff member not found');
    
    const updated: StaffMember = { ...staff, ...updates };
    return mockApiCall(updated, { delay: 400 });
  },

  // Rooms
  async fetchRooms(centreId?: string): Promise<ApiResponse<Room[]>> {
    const { mockCentres } = await import('@/data/mockRosterData');
    let rooms: Room[] = [];
    for (const centre of mockCentres) {
      if (!centreId || centre.id === centreId) {
        rooms = [...rooms, ...centre.rooms];
      }
    }
    return mockApiCall(rooms);
  },

  // Open Shifts
  async fetchOpenShifts(centreId?: string): Promise<ApiResponse<OpenShift[]>> {
    const { mockOpenShifts } = await import('@/data/mockRosterData');
    let shifts = [...mockOpenShifts];
    if (centreId) {
      shifts = shifts.filter(s => s.centreId === centreId);
    }
    return mockApiCall(shifts);
  },

  async createOpenShift(shift: Omit<OpenShift, 'id'>): Promise<ApiResponse<OpenShift>> {
    const newShift: OpenShift = {
      ...shift,
      id: `open-${Date.now()}`,
    };
    return mockApiCall(newShift, { delay: 400 });
  },

  async claimOpenShift(shiftId: string, staffId: string): Promise<ApiResponse<{ shiftId: string; staffId: string }>> {
    return mockApiCall({ shiftId, staffId }, { delay: 500 });
  },

  // Time Off / Leave
  async fetchTimeOffRequests(staffId?: string): Promise<ApiResponse<TimeOff[]>> {
    const { mockStaff } = await import('@/data/mockRosterData');
    let requests: TimeOff[] = [];
    for (const staff of mockStaff) {
      if (staff.timeOff) {
        if (!staffId || staff.id === staffId) {
          requests = [...requests, ...staff.timeOff];
        }
      }
    }
    return mockApiCall(requests);
  },

  async createTimeOffRequest(request: Omit<TimeOff, 'id'>): Promise<ApiResponse<TimeOff>> {
    const newRequest: TimeOff = {
      ...request,
      id: `timeoff-${Date.now()}`,
    };
    return mockApiCall(newRequest, { delay: 400 });
  },

  async updateTimeOffRequest(id: string, status: 'approved' | 'rejected'): Promise<ApiResponse<{ id: string; status: string }>> {
    return mockApiCall({ id, status }, { delay: 300 });
  },

  // Publish roster
  async publishRoster(centreId: string, weekStart: string): Promise<ApiResponse<{ published: boolean; notifiedCount: number }>> {
    return mockApiCall({ published: true, notifiedCount: 12 }, { delay: 800 });
  },
};
