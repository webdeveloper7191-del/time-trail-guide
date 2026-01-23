import { useState, useCallback } from 'react';
import { RecurringShiftPattern, RecurrencePattern } from '@/types/advancedRoster';

// Shared mock patterns data
const initialPatterns: RecurringShiftPattern[] = [
  {
    id: 'pattern-1',
    name: 'Morning Educator Shift',
    description: 'Standard morning shift for qualified educators',
    pattern: 'weekly',
    startDate: '2025-01-06',
    endDate: '2025-06-30',
    daysOfWeek: [1, 2, 3, 4, 5],
    shiftTemplate: {
      startTime: '07:00',
      endTime: '15:00',
      roleId: 'educator',
      roleName: 'Educator',
      centreId: 'centre-1',
      requiredQualifications: ['Cert III', 'First Aid'],
      breakDuration: 30,
    },
    assignedStaffId: 'staff-1',
    assignedStaffName: 'Sarah Johnson',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'admin',
  },
  {
    id: 'pattern-2',
    name: 'Weekend Support Worker',
    description: 'Weekend coverage for support staff',
    pattern: 'weekly',
    startDate: '2025-01-04',
    daysOfWeek: [0, 6],
    shiftTemplate: {
      startTime: '08:00',
      endTime: '16:00',
      roleId: 'support',
      roleName: 'Support Worker',
      centreId: 'centre-1',
      breakDuration: 30,
    },
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'admin',
  },
  {
    id: 'pattern-3',
    name: 'Fortnightly Deep Clean',
    description: 'Deep cleaning shift every second Friday',
    pattern: 'fortnightly',
    startDate: '2025-01-10',
    daysOfWeek: [5],
    weekInterval: 2,
    shiftTemplate: {
      startTime: '17:00',
      endTime: '21:00',
      roleId: 'cleaning',
      roleName: 'Cleaner',
      centreId: 'centre-1',
      breakDuration: 0,
    },
    isActive: false,
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'admin',
  },
];

// Simple module-level state for sharing between components
let sharedPatterns = [...initialPatterns];
let listeners: (() => void)[] = [];

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export function useRecurringPatterns() {
  const [patterns, setPatterns] = useState<RecurringShiftPattern[]>(sharedPatterns);

  // Subscribe to updates
  useState(() => {
    const update = () => setPatterns([...sharedPatterns]);
    listeners.push(update);
    return () => {
      listeners = listeners.filter(l => l !== update);
    };
  });

  const addPattern = useCallback((pattern: RecurringShiftPattern) => {
    sharedPatterns = [...sharedPatterns, pattern];
    setPatterns(sharedPatterns);
    notifyListeners();
  }, []);

  const updatePattern = useCallback((id: string, updates: Partial<RecurringShiftPattern>) => {
    sharedPatterns = sharedPatterns.map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
    setPatterns(sharedPatterns);
    notifyListeners();
  }, []);

  const deletePattern = useCallback((id: string) => {
    sharedPatterns = sharedPatterns.filter(p => p.id !== id);
    setPatterns(sharedPatterns);
    notifyListeners();
  }, []);

  const togglePatternActive = useCallback((id: string) => {
    sharedPatterns = sharedPatterns.map(p =>
      p.id === id ? { ...p, isActive: !p.isActive } : p
    );
    setPatterns(sharedPatterns);
    notifyListeners();
  }, []);

  const activePatterns = patterns.filter(p => p.isActive);

  return {
    patterns,
    activePatterns,
    addPattern,
    updatePattern,
    deletePattern,
    togglePatternActive,
  };
}

// Export for direct access without hook
export function getRecurringPatterns() {
  return sharedPatterns;
}

export function getActiveRecurringPatterns() {
  return sharedPatterns.filter(p => p.isActive);
}
