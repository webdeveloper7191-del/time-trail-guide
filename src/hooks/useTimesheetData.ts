import { useState, useEffect, useCallback } from 'react';
import { Timesheet } from '@/types/timesheet';
import { timesheetApi } from '@/lib/api/timesheetApi';
import { toast } from 'sonner';

interface UseTimesheetDataReturn {
  timesheets: Timesheet[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Mutations
  approveTimesheet: (id: string) => Promise<boolean>;
  rejectTimesheet: (id: string, reason: string) => Promise<boolean>;
  bulkApprove: (ids: string[]) => Promise<boolean>;
  updateTimesheet: (id: string, updates: Partial<Timesheet>) => Promise<Timesheet | null>;
  // Search & filter
  searchTimesheets: (query: string) => Promise<Timesheet[]>;
  filterByStatus: (status: string) => void;
  // Export
  exportTimesheets: (format: 'csv' | 'xlsx' | 'pdf') => Promise<string | null>;
}

export function useTimesheetData(initialFilters?: { status?: string }): UseTimesheetDataReturn {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters || {});

  const fetchTimesheets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await timesheetApi.fetchTimesheets(filters);
      setTimesheets(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch timesheets';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  const approveTimesheet = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await timesheetApi.approveTimesheet(id, 'admin-1');
      setTimesheets(prev => prev.map(t => t.id === id ? response.data : t));
      toast.success('Timesheet approved');
      return true;
    } catch (err) {
      toast.error('Failed to approve timesheet');
      return false;
    }
  }, []);

  const rejectTimesheet = useCallback(async (id: string, reason: string): Promise<boolean> => {
    try {
      const response = await timesheetApi.rejectTimesheet(id, reason);
      setTimesheets(prev => prev.map(t => t.id === id ? response.data : t));
      toast.success('Timesheet rejected');
      return true;
    } catch (err) {
      toast.error('Failed to reject timesheet');
      return false;
    }
  }, []);

  const bulkApprove = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      const response = await timesheetApi.bulkApprove(ids, 'admin-1');
      setTimesheets(prev => prev.map(t => 
        ids.includes(t.id) ? { ...t, status: 'approved' as const } : t
      ));
      toast.success(`${response.data.approved} timesheets approved`);
      return true;
    } catch (err) {
      toast.error('Failed to approve timesheets');
      return false;
    }
  }, []);

  const updateTimesheet = useCallback(async (id: string, updates: Partial<Timesheet>): Promise<Timesheet | null> => {
    try {
      const response = await timesheetApi.updateTimesheet(id, updates);
      setTimesheets(prev => prev.map(t => t.id === id ? response.data : t));
      toast.success('Timesheet updated');
      return response.data;
    } catch (err) {
      toast.error('Failed to update timesheet');
      return null;
    }
  }, []);

  const searchTimesheets = useCallback(async (query: string): Promise<Timesheet[]> => {
    try {
      const response = await timesheetApi.searchTimesheets(query);
      return response.data;
    } catch (err) {
      return [];
    }
  }, []);

  const filterByStatus = useCallback((status: string) => {
    setFilters(prev => ({ ...prev, status }));
  }, []);

  const exportTimesheets = useCallback(async (format: 'csv' | 'xlsx' | 'pdf'): Promise<string | null> => {
    try {
      toast.loading('Preparing export...');
      const response = await timesheetApi.exportTimesheets(format, filters);
      toast.dismiss();
      toast.success('Export ready for download');
      return response.data.downloadUrl;
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to export timesheets');
      return null;
    }
  }, [filters]);

  return {
    timesheets,
    loading,
    error,
    refetch: fetchTimesheets,
    approveTimesheet,
    rejectTimesheet,
    bulkApprove,
    updateTimesheet,
    searchTimesheets,
    filterByStatus,
    exportTimesheets,
  };
}
