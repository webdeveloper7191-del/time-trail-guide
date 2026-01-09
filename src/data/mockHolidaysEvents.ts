// Public holidays and events data

export interface PublicHoliday {
  id: string;
  date: string;
  name: string;
  type: 'public_holiday' | 'school_holiday';
  state?: string; // Australian state if applicable
}

export interface RosterEvent {
  id: string;
  date: string;
  name: string;
  type: 'staff_meeting' | 'training' | 'inspection' | 'celebration' | 'excursion' | 'parent_event' | 'other';
  description?: string;
  affectedRooms?: string[];
}

// Australian public holidays for 2025-2026
export const mockPublicHolidays: PublicHoliday[] = [
  { id: 'ph-1', date: '2025-01-01', name: "New Year's Day", type: 'public_holiday' },
  { id: 'ph-2', date: '2025-01-27', name: 'Australia Day', type: 'public_holiday' },
  { id: 'ph-3', date: '2025-04-18', name: 'Good Friday', type: 'public_holiday' },
  { id: 'ph-4', date: '2025-04-19', name: 'Easter Saturday', type: 'public_holiday' },
  { id: 'ph-5', date: '2025-04-21', name: 'Easter Monday', type: 'public_holiday' },
  { id: 'ph-6', date: '2025-04-25', name: 'Anzac Day', type: 'public_holiday' },
  { id: 'ph-7', date: '2025-06-09', name: "Queen's Birthday", type: 'public_holiday', state: 'VIC' },
  { id: 'ph-8', date: '2025-11-04', name: 'Melbourne Cup Day', type: 'public_holiday', state: 'VIC' },
  { id: 'ph-9', date: '2025-12-25', name: 'Christmas Day', type: 'public_holiday' },
  { id: 'ph-10', date: '2025-12-26', name: 'Boxing Day', type: 'public_holiday' },
  // 2026 holidays
  { id: 'ph-11', date: '2026-01-01', name: "New Year's Day", type: 'public_holiday' },
  { id: 'ph-12', date: '2026-01-26', name: 'Australia Day', type: 'public_holiday' },
  { id: 'ph-13', date: '2026-04-03', name: 'Good Friday', type: 'public_holiday' },
  { id: 'ph-14', date: '2026-04-04', name: 'Easter Saturday', type: 'public_holiday' },
  { id: 'ph-15', date: '2026-04-06', name: 'Easter Monday', type: 'public_holiday' },
  { id: 'ph-16', date: '2026-04-25', name: 'Anzac Day', type: 'public_holiday' },
  { id: 'ph-17', date: '2026-06-08', name: "Queen's Birthday", type: 'public_holiday', state: 'VIC' },
  { id: 'ph-18', date: '2026-12-25', name: 'Christmas Day', type: 'public_holiday' },
  { id: 'ph-19', date: '2026-12-26', name: 'Boxing Day', type: 'public_holiday' },
  // School holidays (example periods - current week Jan 2026)
  { id: 'sh-1', date: '2026-01-05', name: 'School Holidays', type: 'school_holiday' },
  { id: 'sh-2', date: '2026-01-06', name: 'School Holidays', type: 'school_holiday' },
  { id: 'sh-3', date: '2026-01-07', name: 'School Holidays', type: 'school_holiday' },
  { id: 'sh-4', date: '2026-01-08', name: 'School Holidays', type: 'school_holiday' },
  { id: 'sh-5', date: '2026-01-09', name: 'School Holidays', type: 'school_holiday' },
  { id: 'sh-6', date: '2026-01-12', name: 'School Holidays', type: 'school_holiday' },
  { id: 'sh-7', date: '2026-01-13', name: 'School Holidays', type: 'school_holiday' },
  { id: 'sh-8', date: '2026-01-14', name: 'School Holidays', type: 'school_holiday' },
  { id: 'sh-9', date: '2026-01-15', name: 'School Holidays', type: 'school_holiday' },
  { id: 'sh-10', date: '2026-01-16', name: 'School Holidays', type: 'school_holiday' },
];

// Sample centre events - include current week dates
export const mockRosterEvents: RosterEvent[] = [
  // Current week events (Jan 2026)
  { 
    id: 'ev-1', 
    date: '2026-01-06', 
    name: 'Staff Meeting', 
    type: 'staff_meeting',
    description: 'Weekly team meeting - 4pm'
  },
  { 
    id: 'ev-2', 
    date: '2026-01-07', 
    name: 'First Aid Training', 
    type: 'training',
    description: 'First aid refresher course for all staff'
  },
  { 
    id: 'ev-3', 
    date: '2026-01-08', 
    name: 'Parent Info Night', 
    type: 'parent_event',
    description: 'Welcome back parent information session'
  },
  { 
    id: 'ev-4', 
    date: '2026-01-09', 
    name: 'Quality Audit', 
    type: 'inspection',
    description: 'ACECQA quality assessment visit'
  },
  { 
    id: 'ev-5', 
    date: '2026-01-12', 
    name: 'Zoo Excursion', 
    type: 'excursion',
    affectedRooms: ['room-3', 'room-4'],
    description: 'Preschool & Kindy trip to Melbourne Zoo'
  },
  { 
    id: 'ev-6', 
    date: '2026-02-14', 
    name: "Valentine's Party", 
    type: 'celebration',
    affectedRooms: ['room-1', 'room-2']
  },
];

// Helper functions
export function getHolidaysForDate(date: string): PublicHoliday[] {
  return mockPublicHolidays.filter(h => h.date === date);
}

export function getEventsForDate(date: string): RosterEvent[] {
  return mockRosterEvents.filter(e => e.date === date);
}

export function isPublicHoliday(date: string): boolean {
  return mockPublicHolidays.some(h => h.date === date && h.type === 'public_holiday');
}

export function isSchoolHoliday(date: string): boolean {
  return mockPublicHolidays.some(h => h.date === date && h.type === 'school_holiday');
}

export const eventTypeConfig: Record<RosterEvent['type'], { label: string; color: string; icon: string }> = {
  staff_meeting: { label: 'Staff Meeting', color: 'hsl(220, 70%, 50%)', icon: 'users' },
  training: { label: 'Training', color: 'hsl(280, 60%, 50%)', icon: 'graduation-cap' },
  inspection: { label: 'Inspection', color: 'hsl(0, 70%, 50%)', icon: 'clipboard-check' },
  celebration: { label: 'Celebration', color: 'hsl(340, 70%, 50%)', icon: 'party-popper' },
  excursion: { label: 'Excursion', color: 'hsl(150, 60%, 45%)', icon: 'map-pin' },
  parent_event: { label: 'Parent Event', color: 'hsl(30, 70%, 50%)', icon: 'users' },
  other: { label: 'Other', color: 'hsl(0, 0%, 50%)', icon: 'calendar' },
};
