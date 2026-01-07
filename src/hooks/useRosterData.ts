import { useState, useEffect, useCallback } from 'react';
import { Shift, StaffMember, Room, OpenShift, TimeOff } from '@/types/roster';
import { rosterApi } from '@/lib/api/rosterApi';
import { toast } from 'sonner';

interface UseRosterDataReturn {
  shifts: Shift[];
  staff: StaffMember[];
  rooms: Room[];
  openShifts: OpenShift[];
  timeOffRequests: TimeOff[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Shift mutations
  createShift: (shift: Omit<Shift, 'id'>) => Promise<Shift | null>;
  updateShift: (id: string, updates: Partial<Shift>) => Promise<Shift | null>;
  deleteShift: (id: string) => Promise<boolean>;
  bulkCreateShifts: (shifts: Omit<Shift, 'id'>[]) => Promise<Shift[] | null>;
  // Open shift mutations
  createOpenShift: (shift: Omit<OpenShift, 'id'>) => Promise<OpenShift | null>;
  claimOpenShift: (shiftId: string, staffId: string) => Promise<boolean>;
  // Time off mutations
  createTimeOffRequest: (request: Omit<TimeOff, 'id'>) => Promise<TimeOff | null>;
  approveTimeOff: (id: string) => Promise<boolean>;
  rejectTimeOff: (id: string) => Promise<boolean>;
  // Publish
  publishRoster: (centreId: string, weekStart: string) => Promise<boolean>;
  // Search
  searchStaff: (query: string) => Promise<StaffMember[]>;
}

export function useRosterData(centreId?: string): UseRosterDataReturn {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [openShifts, setOpenShifts] = useState<OpenShift[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [shiftsRes, staffRes, roomsRes, openShiftsRes, timeOffRes] = await Promise.all([
        rosterApi.fetchShifts(centreId),
        rosterApi.fetchStaff(centreId),
        rosterApi.fetchRooms(centreId),
        rosterApi.fetchOpenShifts(centreId),
        rosterApi.fetchTimeOffRequests(),
      ]);

      setShifts(shiftsRes.data);
      setStaff(staffRes.data);
      setRooms(roomsRes.data);
      setOpenShifts(openShiftsRes.data);
      setTimeOffRequests(timeOffRes.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch roster data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [centreId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Shift mutations
  const createShift = useCallback(async (shift: Omit<Shift, 'id'>): Promise<Shift | null> => {
    try {
      const response = await rosterApi.createShift(shift);
      setShifts(prev => [...prev, response.data]);
      toast.success('Shift created successfully');
      return response.data;
    } catch (err) {
      toast.error('Failed to create shift');
      return null;
    }
  }, []);

  const updateShift = useCallback(async (id: string, updates: Partial<Shift>): Promise<Shift | null> => {
    try {
      const response = await rosterApi.updateShift(id, updates);
      setShifts(prev => prev.map(s => s.id === id ? response.data : s));
      toast.success('Shift updated successfully');
      return response.data;
    } catch (err) {
      toast.error('Failed to update shift');
      return null;
    }
  }, []);

  const deleteShift = useCallback(async (id: string): Promise<boolean> => {
    try {
      await rosterApi.deleteShift(id);
      setShifts(prev => prev.filter(s => s.id !== id));
      toast.success('Shift deleted successfully');
      return true;
    } catch (err) {
      toast.error('Failed to delete shift');
      return false;
    }
  }, []);

  const bulkCreateShifts = useCallback(async (newShifts: Omit<Shift, 'id'>[]): Promise<Shift[] | null> => {
    try {
      const response = await rosterApi.bulkCreateShifts(newShifts);
      setShifts(prev => [...prev, ...response.data]);
      toast.success(`${response.data.length} shifts created successfully`);
      return response.data;
    } catch (err) {
      toast.error('Failed to create shifts');
      return null;
    }
  }, []);

  // Open shift mutations
  const createOpenShift = useCallback(async (shift: Omit<OpenShift, 'id'>): Promise<OpenShift | null> => {
    try {
      const response = await rosterApi.createOpenShift(shift);
      setOpenShifts(prev => [...prev, response.data]);
      toast.success('Open shift created');
      return response.data;
    } catch (err) {
      toast.error('Failed to create open shift');
      return null;
    }
  }, []);

  const claimOpenShift = useCallback(async (shiftId: string, staffId: string): Promise<boolean> => {
    try {
      await rosterApi.claimOpenShift(shiftId, staffId);
      setOpenShifts(prev => prev.filter(s => s.id !== shiftId));
      toast.success('Shift claimed successfully');
      return true;
    } catch (err) {
      toast.error('Failed to claim shift');
      return false;
    }
  }, []);

  // Time off mutations
  const createTimeOffRequest = useCallback(async (request: Omit<TimeOff, 'id'>): Promise<TimeOff | null> => {
    try {
      const response = await rosterApi.createTimeOffRequest(request);
      setTimeOffRequests(prev => [...prev, response.data]);
      toast.success('Time off request submitted');
      return response.data;
    } catch (err) {
      toast.error('Failed to submit time off request');
      return null;
    }
  }, []);

  const approveTimeOff = useCallback(async (id: string): Promise<boolean> => {
    try {
      await rosterApi.updateTimeOffRequest(id, 'approved');
      setTimeOffRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' as const } : r));
      toast.success('Time off approved');
      return true;
    } catch (err) {
      toast.error('Failed to approve time off');
      return false;
    }
  }, []);

  const rejectTimeOff = useCallback(async (id: string): Promise<boolean> => {
    try {
      await rosterApi.updateTimeOffRequest(id, 'rejected');
      setTimeOffRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' as const } : r));
      toast.success('Time off rejected');
      return true;
    } catch (err) {
      toast.error('Failed to reject time off');
      return false;
    }
  }, []);

  // Publish
  const publishRoster = useCallback(async (cId: string, weekStart: string): Promise<boolean> => {
    try {
      const response = await rosterApi.publishRoster(cId, weekStart);
      toast.success(`Roster published! ${response.data.notifiedCount} staff notified`);
      return true;
    } catch (err) {
      toast.error('Failed to publish roster');
      return false;
    }
  }, []);

  // Search
  const searchStaff = useCallback(async (query: string): Promise<StaffMember[]> => {
    try {
      const response = await rosterApi.searchStaff(query);
      return response.data;
    } catch (err) {
      return [];
    }
  }, []);

  return {
    shifts,
    staff,
    rooms,
    openShifts,
    timeOffRequests,
    loading,
    error,
    refetch: fetchAllData,
    createShift,
    updateShift,
    deleteShift,
    bulkCreateShifts,
    createOpenShift,
    claimOpenShift,
    createTimeOffRequest,
    approveTimeOff,
    rejectTimeOff,
    publishRoster,
    searchStaff,
  };
}
