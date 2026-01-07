import { useState, useEffect, useCallback } from 'react';
import { StaffMember } from '@/types/staff';
import { staffApi } from '@/lib/api/staffApi';
import { toast } from 'sonner';

interface UseStaffDataReturn {
  staff: StaffMember[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Mutations
  createStaff: (data: Omit<StaffMember, 'id'>) => Promise<StaffMember | null>;
  updateStaff: (id: string, updates: Partial<StaffMember>) => Promise<StaffMember | null>;
  deleteStaff: (id: string) => Promise<boolean>;
  updatePayConditions: (id: string, payConditions: Partial<StaffMember['currentPayCondition']>) => Promise<StaffMember | null>;
  updateAvailability: (id: string, availability: StaffMember['weeklyAvailability']) => Promise<StaffMember | null>;
  // Search
  searchStaff: (query: string) => Promise<StaffMember[]>;
  // Single staff
  getStaffById: (id: string) => Promise<StaffMember | null>;
}

export function useStaffData(): UseStaffDataReturn {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await staffApi.fetchAllStaff();
      setStaff(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch staff';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const createStaff = useCallback(async (data: Omit<StaffMember, 'id'>): Promise<StaffMember | null> => {
    try {
      const response = await staffApi.createStaff(data);
      setStaff(prev => [...prev, response.data]);
      toast.success('Staff member created');
      return response.data;
    } catch (err) {
      toast.error('Failed to create staff member');
      return null;
    }
  }, []);

  const updateStaff = useCallback(async (id: string, updates: Partial<StaffMember>): Promise<StaffMember | null> => {
    try {
      const response = await staffApi.updateStaff(id, updates);
      setStaff(prev => prev.map(s => s.id === id ? response.data : s));
      toast.success('Staff member updated');
      return response.data;
    } catch (err) {
      toast.error('Failed to update staff member');
      return null;
    }
  }, []);

  const deleteStaff = useCallback(async (id: string): Promise<boolean> => {
    try {
      await staffApi.deleteStaff(id);
      setStaff(prev => prev.filter(s => s.id !== id));
      toast.success('Staff member deleted');
      return true;
    } catch (err) {
      toast.error('Failed to delete staff member');
      return false;
    }
  }, []);

  const updatePayConditions = useCallback(async (id: string, payConditions: Partial<StaffMember['currentPayCondition']>): Promise<StaffMember | null> => {
    try {
      const response = await staffApi.updatePayConditions(id, payConditions);
      setStaff(prev => prev.map(s => s.id === id ? response.data : s));
      toast.success('Pay conditions updated');
      return response.data;
    } catch (err) {
      toast.error('Failed to update pay conditions');
      return null;
    }
  }, []);

  const updateAvailability = useCallback(async (id: string, availability: StaffMember['weeklyAvailability']): Promise<StaffMember | null> => {
    try {
      const response = await staffApi.updateAvailability(id, availability);
      setStaff(prev => prev.map(s => s.id === id ? response.data : s));
      toast.success('Availability updated');
      return response.data;
    } catch (err) {
      toast.error('Failed to update availability');
      return null;
    }
  }, []);

  const searchStaff = useCallback(async (query: string): Promise<StaffMember[]> => {
    try {
      const response = await staffApi.searchStaff(query);
      return response.data;
    } catch (err) {
      return [];
    }
  }, []);

  const getStaffById = useCallback(async (id: string): Promise<StaffMember | null> => {
    try {
      const response = await staffApi.getStaffById(id);
      return response.data;
    } catch (err) {
      return null;
    }
  }, []);

  return {
    staff,
    loading,
    error,
    refetch: fetchStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    updatePayConditions,
    updateAvailability,
    searchStaff,
    getStaffById,
  };
}
