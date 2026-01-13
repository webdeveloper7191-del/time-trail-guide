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
  // 2025 holidays
  { id: 'ph-2025-1', date: '2025-01-01', name: "New Year's Day", type: 'public_holiday' },
  { id: 'ph-2025-2', date: '2025-01-27', name: 'Australia Day', type: 'public_holiday' },
  { id: 'ph-2025-3', date: '2025-04-18', name: 'Good Friday', type: 'public_holiday' },
  { id: 'ph-2025-4', date: '2025-04-19', name: 'Easter Saturday', type: 'public_holiday' },
  { id: 'ph-2025-5', date: '2025-04-21', name: 'Easter Monday', type: 'public_holiday' },
  { id: 'ph-2025-6', date: '2025-04-25', name: 'Anzac Day', type: 'public_holiday' },
  { id: 'ph-2025-7', date: '2025-06-09', name: "Queen's Birthday", type: 'public_holiday', state: 'VIC' },
  { id: 'ph-2025-8', date: '2025-11-04', name: 'Melbourne Cup Day', type: 'public_holiday', state: 'VIC' },
  { id: 'ph-2025-9', date: '2025-12-25', name: 'Christmas Day', type: 'public_holiday' },
  { id: 'ph-2025-10', date: '2025-12-26', name: 'Boxing Day', type: 'public_holiday' },
  
  // 2026 Public Holidays (Australian national + VIC)
  { id: 'ph-2026-1', date: '2026-01-01', name: "New Year's Day", type: 'public_holiday' },
  { id: 'ph-2026-2', date: '2026-01-26', name: 'Australia Day', type: 'public_holiday' },
  { id: 'ph-2026-3', date: '2026-03-09', name: 'Labour Day', type: 'public_holiday', state: 'VIC' },
  { id: 'ph-2026-4', date: '2026-04-03', name: 'Good Friday', type: 'public_holiday' },
  { id: 'ph-2026-5', date: '2026-04-04', name: 'Easter Saturday', type: 'public_holiday' },
  { id: 'ph-2026-6', date: '2026-04-06', name: 'Easter Monday', type: 'public_holiday' },
  { id: 'ph-2026-7', date: '2026-04-25', name: 'Anzac Day', type: 'public_holiday' },
  { id: 'ph-2026-8', date: '2026-06-08', name: "Queen's Birthday", type: 'public_holiday', state: 'VIC' },
  { id: 'ph-2026-9', date: '2026-09-25', name: 'AFL Grand Final Friday', type: 'public_holiday', state: 'VIC' },
  { id: 'ph-2026-10', date: '2026-11-03', name: 'Melbourne Cup Day', type: 'public_holiday', state: 'VIC' },
  { id: 'ph-2026-11', date: '2026-12-25', name: 'Christmas Day', type: 'public_holiday' },
  { id: 'ph-2026-12', date: '2026-12-26', name: 'Boxing Day', type: 'public_holiday' },
  { id: 'ph-2026-13', date: '2026-12-28', name: 'Boxing Day (observed)', type: 'public_holiday' },

  // 2026 Victorian School Holidays
  // Term 1: Jan 28 - Mar 27 (school starts Jan 28, so holidays before that)
  ...generateSchoolHolidayDates('2026-01-01', '2026-01-27', 'Summer Holidays'),
  // Term 1 break: Mar 28 - Apr 12
  ...generateSchoolHolidayDates('2026-03-28', '2026-04-12', 'Autumn Holidays'),
  // Term 2 break: Jun 27 - Jul 12
  ...generateSchoolHolidayDates('2026-06-27', '2026-07-12', 'Winter Holidays'),
  // Term 3 break: Sep 19 - Oct 4
  ...generateSchoolHolidayDates('2026-09-19', '2026-10-04', 'Spring Holidays'),
  // Term 4 ends mid-Dec, summer holidays start
  ...generateSchoolHolidayDates('2026-12-19', '2026-12-31', 'Summer Holidays'),
];

// Helper to generate school holiday entries for a date range
function generateSchoolHolidayDates(startDate: string, endDate: string, name: string): PublicHoliday[] {
  const holidays: PublicHoliday[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  let counter = 1;
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    // Skip weekends for school holiday markers (optional, but keeps it cleaner)
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      const dateStr = d.toISOString().split('T')[0];
      holidays.push({
        id: `sh-${dateStr}`,
        date: dateStr,
        name,
        type: 'school_holiday',
      });
    }
    counter++;
  }
  
  return holidays;
}

// Sample centre events - childcare specific throughout 2026
export const mockRosterEvents: RosterEvent[] = [
  // January 2026 - Back to care / Summer program
  { 
    id: 'ev-2026-01', 
    date: '2026-01-12', 
    name: 'Welcome Back Day', 
    type: 'celebration',
    description: 'Welcome back celebration for families returning from holidays',
    affectedRooms: ['room-1', 'room-2', 'room-3', 'room-4']
  },
  { 
    id: 'ev-2026-02', 
    date: '2026-01-13', 
    name: 'Staff Planning Day', 
    type: 'staff_meeting',
    description: 'Annual planning meeting for all educators - 4pm'
  },
  { 
    id: 'ev-2026-03', 
    date: '2026-01-14', 
    name: 'Child Protection Training', 
    type: 'training',
    description: 'Mandatory child protection refresher for all staff'
  },
  { 
    id: 'ev-2026-04', 
    date: '2026-01-15', 
    name: 'New Family Orientation', 
    type: 'parent_event',
    description: 'Orientation session for new families enrolling in 2026'
  },
  { 
    id: 'ev-2026-05', 
    date: '2026-01-16', 
    name: 'Beach Excursion', 
    type: 'excursion',
    affectedRooms: ['room-3', 'room-4'],
    description: 'Preschool & Kindy beach safety and play excursion'
  },
  { 
    id: 'ev-2026-06', 
    date: '2026-01-19', 
    name: 'First Aid Update', 
    type: 'training',
    description: 'First aid and CPR refresher training'
  },
  { 
    id: 'ev-2026-07', 
    date: '2026-01-20', 
    name: 'Weekly Staff Huddle', 
    type: 'staff_meeting',
    description: 'Weekly team check-in - 4:30pm'
  },
  
  // February 2026
  { 
    id: 'ev-2026-08', 
    date: '2026-02-14', 
    name: "Valentine's Day Party", 
    type: 'celebration',
    affectedRooms: ['room-1', 'room-2', 'room-3', 'room-4'],
    description: 'Friendship day celebration with heart crafts'
  },
  { 
    id: 'ev-2026-09', 
    date: '2026-02-16', 
    name: 'ACECQA Assessment', 
    type: 'inspection',
    description: 'Quality assessment visit - full day'
  },
  { 
    id: 'ev-2026-10', 
    date: '2026-02-23', 
    name: 'Harmony Day Prep', 
    type: 'staff_meeting',
    description: 'Planning session for Harmony Day activities'
  },
  
  // March 2026
  { 
    id: 'ev-2026-11', 
    date: '2026-03-06', 
    name: 'Clean Up Australia Day', 
    type: 'excursion',
    affectedRooms: ['room-3', 'room-4'],
    description: 'Local park clean up with preschoolers'
  },
  { 
    id: 'ev-2026-12', 
    date: '2026-03-21', 
    name: 'Harmony Day', 
    type: 'celebration',
    affectedRooms: ['room-1', 'room-2', 'room-3', 'room-4'],
    description: 'Multicultural celebration with families'
  },
  { 
    id: 'ev-2026-13', 
    date: '2026-03-27', 
    name: 'End of Term 1 Party', 
    type: 'celebration',
    description: 'Term 1 wrap-up celebration'
  },
  
  // April 2026
  { 
    id: 'ev-2026-14', 
    date: '2026-04-13', 
    name: 'Term 2 Staff PD Day', 
    type: 'training',
    description: 'Professional development - Inclusive practice'
  },
  { 
    id: 'ev-2026-15', 
    date: '2026-04-22', 
    name: 'Earth Day Activities', 
    type: 'celebration',
    affectedRooms: ['room-2', 'room-3', 'room-4'],
    description: 'Sustainability and nature activities'
  },
  
  // May 2026
  { 
    id: 'ev-2026-16', 
    date: '2026-05-08', 
    name: "Mother's Day Morning Tea", 
    type: 'parent_event',
    affectedRooms: ['room-1', 'room-2', 'room-3', 'room-4'],
    description: 'Special morning tea for mothers and grandmothers'
  },
  { 
    id: 'ev-2026-17', 
    date: '2026-05-18', 
    name: 'Fire Safety Drill', 
    type: 'other',
    description: 'Monthly fire evacuation practice'
  },
  { 
    id: 'ev-2026-18', 
    date: '2026-05-25', 
    name: 'Reconciliation Week Start', 
    type: 'celebration',
    description: 'National Reconciliation Week activities begin'
  },
  
  // June 2026
  { 
    id: 'ev-2026-19', 
    date: '2026-06-01', 
    name: 'Reconciliation Week', 
    type: 'celebration',
    description: 'Final day of Reconciliation Week activities'
  },
  { 
    id: 'ev-2026-20', 
    date: '2026-06-26', 
    name: 'End of Term 2 Party', 
    type: 'celebration',
    description: 'Mid-year celebration before winter break'
  },
  
  // July 2026
  { 
    id: 'ev-2026-21', 
    date: '2026-07-13', 
    name: 'Term 3 Orientation', 
    type: 'parent_event',
    description: 'New starters orientation for Term 3'
  },
  { 
    id: 'ev-2026-22', 
    date: '2026-07-24', 
    name: 'Pyjama Day', 
    type: 'celebration',
    affectedRooms: ['room-1', 'room-2', 'room-3', 'room-4'],
    description: 'Fundraiser pyjama day for children in need'
  },
  
  // August 2026
  { 
    id: 'ev-2026-23', 
    date: '2026-08-07', 
    name: 'Book Week Parade', 
    type: 'celebration',
    affectedRooms: ['room-2', 'room-3', 'room-4'],
    description: 'Book character dress-up parade'
  },
  { 
    id: 'ev-2026-24', 
    date: '2026-08-21', 
    name: 'Science Week Activities', 
    type: 'other',
    affectedRooms: ['room-3', 'room-4'],
    description: 'Hands-on science experiments for preschoolers'
  },
  
  // September 2026
  { 
    id: 'ev-2026-25', 
    date: '2026-09-04', 
    name: "Father's Day Breakfast", 
    type: 'parent_event',
    affectedRooms: ['room-1', 'room-2', 'room-3', 'room-4'],
    description: 'Special breakfast for fathers and grandfathers'
  },
  { 
    id: 'ev-2026-26', 
    date: '2026-09-11', 
    name: 'Footy Colours Day', 
    type: 'celebration',
    affectedRooms: ['room-1', 'room-2', 'room-3', 'room-4'],
    description: 'AFL Grand Final week celebration'
  },
  { 
    id: 'ev-2026-27', 
    date: '2026-09-18', 
    name: 'End of Term 3 Party', 
    type: 'celebration',
    description: 'Spring celebration before term break'
  },
  
  // October 2026
  { 
    id: 'ev-2026-28', 
    date: '2026-10-05', 
    name: 'Term 4 Welcome Back', 
    type: 'other',
    description: 'Final term commencement'
  },
  { 
    id: 'ev-2026-29', 
    date: '2026-10-16', 
    name: 'Farm Excursion', 
    type: 'excursion',
    affectedRooms: ['room-2', 'room-3', 'room-4'],
    description: 'Trip to local farm for spring lambs'
  },
  { 
    id: 'ev-2026-30', 
    date: '2026-10-30', 
    name: 'Halloween Party', 
    type: 'celebration',
    affectedRooms: ['room-1', 'room-2', 'room-3', 'room-4'],
    description: 'Spooky dress-up celebration'
  },
  
  // November 2026
  { 
    id: 'ev-2026-31', 
    date: '2026-11-11', 
    name: 'Remembrance Day', 
    type: 'other',
    description: 'Quiet reflection activities'
  },
  { 
    id: 'ev-2026-32', 
    date: '2026-11-20', 
    name: 'Kinder Graduation Practice', 
    type: 'other',
    affectedRooms: ['room-4'],
    description: 'Rehearsal for end of year graduation'
  },
  { 
    id: 'ev-2026-33', 
    date: '2026-11-27', 
    name: 'Kinder Graduation', 
    type: 'celebration',
    affectedRooms: ['room-4'],
    description: 'Graduation ceremony for children starting school'
  },
  
  // December 2026
  { 
    id: 'ev-2026-34', 
    date: '2026-12-04', 
    name: 'Christmas Concert Rehearsal', 
    type: 'other',
    affectedRooms: ['room-1', 'room-2', 'room-3', 'room-4'],
    description: 'Practice for end of year concert'
  },
  { 
    id: 'ev-2026-35', 
    date: '2026-12-11', 
    name: 'Christmas Concert', 
    type: 'parent_event',
    affectedRooms: ['room-1', 'room-2', 'room-3', 'room-4'],
    description: 'Annual Christmas concert for families'
  },
  { 
    id: 'ev-2026-36', 
    date: '2026-12-17', 
    name: 'Christmas Party', 
    type: 'celebration',
    affectedRooms: ['room-1', 'room-2', 'room-3', 'room-4'],
    description: 'End of year Christmas celebration'
  },
  { 
    id: 'ev-2026-37', 
    date: '2026-12-18', 
    name: 'Last Day of Care', 
    type: 'other',
    description: 'Centre closes for Christmas break'
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

export function getHolidaysInRange(startDate: string, endDate: string): PublicHoliday[] {
  return mockPublicHolidays.filter(h => h.date >= startDate && h.date <= endDate);
}

export function getEventsInRange(startDate: string, endDate: string): RosterEvent[] {
  return mockRosterEvents.filter(e => e.date >= startDate && e.date <= endDate);
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
