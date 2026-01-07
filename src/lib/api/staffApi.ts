import { StaffMember } from '@/types/staff';
import { mockStaff, departments, locations } from '@/data/mockStaffData';
import { mockApiCall, mockSearchCall, mockPaginatedCall, ApiResponse, PaginatedResponse } from './mockApi';

export const staffApi = {
  async fetchAllStaff(): Promise<ApiResponse<StaffMember[]>> {
    return mockApiCall([...mockStaff]);
  },

  async fetchStaffPaginated(
    page: number = 1,
    pageSize: number = 10,
    filters?: { department?: string; location?: string; status?: string }
  ): Promise<ApiResponse<PaginatedResponse<StaffMember>>> {
    let staff = [...mockStaff];
    
    if (filters?.department) {
      staff = staff.filter(s => s.department === filters.department);
    }
    if (filters?.location) {
      staff = staff.filter(s => s.locations.includes(filters.location));
    }
    if (filters?.status) {
      staff = staff.filter(s => s.status === filters.status);
    }
    
    return mockPaginatedCall(staff, page, pageSize);
  },

  async searchStaff(query: string): Promise<ApiResponse<StaffMember[]>> {
    // Manual search for nested fields
    const lowerQuery = query.toLowerCase();
    const filtered = mockStaff.filter(s =>
      s.firstName.toLowerCase().includes(lowerQuery) ||
      s.lastName.toLowerCase().includes(lowerQuery) ||
      s.email.toLowerCase().includes(lowerQuery) ||
      s.position.toLowerCase().includes(lowerQuery) ||
      (s.department?.toLowerCase().includes(lowerQuery) ?? false)
    );
    return mockApiCall(filtered, { delay: 200 });
  },

  async getStaffById(id: string): Promise<ApiResponse<StaffMember | null>> {
    const staff = mockStaff.find(s => s.id === id);
    return mockApiCall(staff ?? null);
  },

  async createStaff(data: Omit<StaffMember, 'id'>): Promise<ApiResponse<StaffMember>> {
    const newStaff: StaffMember = {
      ...data,
      id: `staff-${Date.now()}`,
    };
    return mockApiCall(newStaff, { delay: 600 });
  },

  async updateStaff(id: string, updates: Partial<StaffMember>): Promise<ApiResponse<StaffMember>> {
    const staff = mockStaff.find(s => s.id === id);
    if (!staff) throw new Error('Staff member not found');
    
    const updated = { ...staff, ...updates };
    return mockApiCall(updated, { delay: 400 });
  },

  async deleteStaff(id: string): Promise<ApiResponse<{ id: string }>> {
    return mockApiCall({ id }, { delay: 400 });
  },

  async updatePayConditions(id: string, payConditions: Partial<StaffMember['currentPayCondition']>): Promise<ApiResponse<StaffMember>> {
    const staff = mockStaff.find(s => s.id === id);
    if (!staff) throw new Error('Staff member not found');
    
    const updated = { 
      ...staff, 
      currentPayCondition: staff.currentPayCondition 
        ? { ...staff.currentPayCondition, ...payConditions }
        : undefined
    };
    return mockApiCall(updated, { delay: 500 });
  },

  async updateAvailability(id: string, availability: StaffMember['weeklyAvailability']): Promise<ApiResponse<StaffMember>> {
    const staff = mockStaff.find(s => s.id === id);
    if (!staff) throw new Error('Staff member not found');
    
    const updated = { ...staff, weeklyAvailability: availability };
    return mockApiCall(updated, { delay: 400 });
  },

  async fetchDepartments(): Promise<ApiResponse<string[]>> {
    return mockApiCall([...departments], { delay: 100 });
  },

  async fetchLocations(): Promise<ApiResponse<string[]>> {
    return mockApiCall([...locations], { delay: 100 });
  },
};
