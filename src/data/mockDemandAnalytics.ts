import { DemandAnalyticsData, StaffAbsence } from '@/types/demandAnalytics';
import { format, addDays, startOfWeek, differenceInDays } from 'date-fns';

// Use actual room IDs from mockCentres
const mockCentreRooms = [
  { centreId: 'centre-1', roomId: 'room-1a', capacity: 12, ratioReq: 4 },
  { centreId: 'centre-1', roomId: 'room-1b', capacity: 15, ratioReq: 5 },
  { centreId: 'centre-1', roomId: 'room-1c', capacity: 22, ratioReq: 10 },
  { centreId: 'centre-1', roomId: 'room-1d', capacity: 22, ratioReq: 11 },
  { centreId: 'centre-2', roomId: 'room-2a', capacity: 10, ratioReq: 4 },
  { centreId: 'centre-2', roomId: 'room-2b', capacity: 12, ratioReq: 5 },
  { centreId: 'centre-2', roomId: 'room-2c', capacity: 20, ratioReq: 10 },
  { centreId: 'centre-3', roomId: 'room-3a', capacity: 8, ratioReq: 4 },
  { centreId: 'centre-3', roomId: 'room-3b', capacity: 15, ratioReq: 5 },
  { centreId: 'centre-3', roomId: 'room-3c', capacity: 22, ratioReq: 10 },
  { centreId: 'centre-3', roomId: 'room-3d', capacity: 24, ratioReq: 11 },
];

// Generate staff absences relative to a given week start
export const generateMockStaffAbsences = (baseDate: Date): StaffAbsence[] => {
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  return [
    { staffId: 'staff-1', staffName: 'Sarah Johnson', type: 'sick', date: format(addDays(weekStart, 1), 'yyyy-MM-dd'), centreId: 'centre-1', roomId: 'room-1a' },
    { staffId: 'staff-3', staffName: 'Emma Wilson', type: 'annual', date: format(addDays(weekStart, 2), 'yyyy-MM-dd'), centreId: 'centre-1', roomId: 'room-1b' },
    { staffId: 'staff-5', staffName: 'James Taylor', type: 'personal', date: format(addDays(weekStart, 3), 'yyyy-MM-dd'), centreId: 'centre-2', roomId: 'room-2a' },
    { staffId: 'staff-2', staffName: 'Michael Chen', type: 'sick', date: format(addDays(weekStart, 0), 'yyyy-MM-dd'), centreId: 'centre-1', roomId: 'room-1c' },
  ];
};

// Default absences for backward compatibility
export const mockStaffAbsences: StaffAbsence[] = generateMockStaffAbsences(new Date());

// Seeded random for consistent data per date
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const generateMockDemandAnalytics = (dates?: Date[]): DemandAnalyticsData[] => {
  const data: DemandAnalyticsData[] = [];
  const timeSlots = ['06:00-09:00', '09:00-12:00', '12:00-15:00', '15:00-18:00'];
  
  // If dates provided, use them; otherwise generate for current week
  const datesToGenerate = dates || Array.from({ length: 7 }, (_, i) => 
    addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i)
  );
  
  // Generate absences based on the first date in the range
  const absences = generateMockStaffAbsences(datesToGenerate[0]);
  
  datesToGenerate.forEach((dateObj, dayIndex) => {
    const date = format(dateObj, 'yyyy-MM-dd');
    // Use day of week (0-6) for consistent patterns regardless of actual date
    const dayOfWeek = dateObj.getDay();
    // Skip weekends (Saturday = 6, Sunday = 0)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    mockCentreRooms.forEach(({ centreId, roomId, capacity, ratioReq }, roomIndex) => {
      timeSlots.forEach((timeSlot, slotIndex) => {
        // Create a deterministic seed based on day of week, room, and slot
        const seed = (dayOfWeek * 1000) + (roomIndex * 100) + slotIndex;
        
        if (isWeekend) {
          // Weekends have no data or reduced staffing
          data.push({
            date,
            centreId,
            roomId,
            timeSlot,
            bookedChildren: 0,
            confirmedBookings: 0,
            casualBookings: 0,
            historicalAttendance: 0,
            attendanceRate: 0,
            capacity,
            utilisationPercent: 0,
            requiredStaff: 0,
            scheduledStaff: 0,
            staffRatioCompliant: true,
            staffAbsences: [],
            childAbsences: 0,
          });
          return;
        }
        
        // Simulate realistic patterns with seeded randomness
        const baseOccupancy = slotIndex === 0 || slotIndex === 3 ? 0.65 : 0.85;
        const variance = (seededRandom(seed) - 0.5) * 0.2;
        const bookedChildren = Math.min(capacity, Math.max(0, Math.floor(capacity * (baseOccupancy + variance))));
        
        const confirmedBookings = Math.floor(bookedChildren * 0.8);
        const casualBookings = bookedChildren - confirmedBookings;
        
        // Historical attendance is typically 85-95% of bookings
        const attendanceRate = 0.85 + seededRandom(seed + 1) * 0.1;
        const historicalAttendance = Math.floor(bookedChildren * attendanceRate);
        
        // Child absences
        const childAbsences = bookedChildren - historicalAttendance;
        
        // Staff requirements based on ratio
        const requiredStaff = Math.ceil(bookedChildren / ratioReq);
        const staffVariance = seededRandom(seed + 2);
        const scheduledStaff = requiredStaff + (staffVariance > 0.8 ? -1 : staffVariance > 0.7 ? 1 : 0);
        
        // Staff absences for this day/room
        const staffAbsencesForSlot = absences.filter(a => 
          a.date === date && a.centreId === centreId && (!a.roomId || a.roomId === roomId)
        );
        
        data.push({
          date,
          centreId,
          roomId,
          timeSlot,
          bookedChildren,
          confirmedBookings,
          casualBookings,
          historicalAttendance,
          attendanceRate: Math.round(attendanceRate * 100),
          capacity,
          utilisationPercent: Math.round((bookedChildren / capacity) * 100),
          requiredStaff: Math.max(1, requiredStaff),
          scheduledStaff: Math.max(0, scheduledStaff),
          staffRatioCompliant: scheduledStaff >= requiredStaff,
          staffAbsences: staffAbsencesForSlot,
          childAbsences,
        });
      });
    });
  });
  
  return data;
};

export const getDayAnalytics = (data: DemandAnalyticsData[], date: string, roomId: string): DemandAnalyticsData[] => {
  return data.filter(d => d.date === date && d.roomId === roomId);
};

export const getDayAbsences = (date: string, centreId: string): StaffAbsence[] => {
  return mockStaffAbsences.filter(a => a.date === date && a.centreId === centreId);
};
