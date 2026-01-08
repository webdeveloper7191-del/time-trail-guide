import { DemandAnalyticsData, StaffAbsence } from '@/types/demandAnalytics';
import { format, addDays, startOfWeek } from 'date-fns';

const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

const mockCentreRooms = [
  { centreId: 'centre-1', roomId: 'room-1', capacity: 20, ratioReq: 4 },
  { centreId: 'centre-1', roomId: 'room-2', capacity: 15, ratioReq: 5 },
  { centreId: 'centre-1', roomId: 'room-3', capacity: 24, ratioReq: 11 },
  { centreId: 'centre-2', roomId: 'room-4', capacity: 16, ratioReq: 4 },
  { centreId: 'centre-2', roomId: 'room-5', capacity: 20, ratioReq: 5 },
];

export const mockStaffAbsences: StaffAbsence[] = [
  { staffId: 'staff-1', staffName: 'Sarah Johnson', type: 'sick', date: format(addDays(weekStart, 1), 'yyyy-MM-dd'), centreId: 'centre-1', roomId: 'room-1' },
  { staffId: 'staff-3', staffName: 'Emma Wilson', type: 'annual', date: format(addDays(weekStart, 2), 'yyyy-MM-dd'), centreId: 'centre-1', roomId: 'room-2' },
  { staffId: 'staff-5', staffName: 'James Taylor', type: 'personal', date: format(addDays(weekStart, 3), 'yyyy-MM-dd'), centreId: 'centre-2', roomId: 'room-4' },
  { staffId: 'staff-2', staffName: 'Michael Chen', type: 'sick', date: format(addDays(weekStart, 0), 'yyyy-MM-dd'), centreId: 'centre-1', roomId: 'room-3' },
];

export const generateMockDemandAnalytics = (): DemandAnalyticsData[] => {
  const data: DemandAnalyticsData[] = [];
  const timeSlots = ['06:00-09:00', '09:00-12:00', '12:00-15:00', '15:00-18:00'];
  
  for (let day = 0; day < 5; day++) {
    const date = format(addDays(weekStart, day), 'yyyy-MM-dd');
    
    mockCentreRooms.forEach(({ centreId, roomId, capacity, ratioReq }) => {
      timeSlots.forEach((timeSlot, idx) => {
        // Simulate realistic patterns
        const baseOccupancy = idx === 0 || idx === 3 ? 0.65 : 0.85; // Lower at start/end of day
        const variance = (Math.random() - 0.5) * 0.2;
        const bookedChildren = Math.min(capacity, Math.max(0, Math.floor(capacity * (baseOccupancy + variance))));
        
        const confirmedBookings = Math.floor(bookedChildren * 0.8);
        const casualBookings = bookedChildren - confirmedBookings;
        
        // Historical attendance is typically 85-95% of bookings
        const attendanceRate = 0.85 + Math.random() * 0.1;
        const historicalAttendance = Math.floor(bookedChildren * attendanceRate);
        
        // Child absences (difference between booked and attended)
        const childAbsences = bookedChildren - historicalAttendance;
        
        // Staff requirements based on ratio
        const requiredStaff = Math.ceil(bookedChildren / ratioReq);
        const scheduledStaff = requiredStaff + (Math.random() > 0.8 ? -1 : Math.random() > 0.7 ? 1 : 0);
        
        // Staff absences for this day/room
        const staffAbsences = mockStaffAbsences.filter(a => a.date === date && a.centreId === centreId && (!a.roomId || a.roomId === roomId));
        
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
          staffAbsences,
          childAbsences,
        });
      });
    });
  }
  
  return data;
};

export const getDayAnalytics = (data: DemandAnalyticsData[], date: string, roomId: string): DemandAnalyticsData[] => {
  return data.filter(d => d.date === date && d.roomId === roomId);
};

export const getDayAbsences = (date: string, centreId: string): StaffAbsence[] => {
  return mockStaffAbsences.filter(a => a.date === date && a.centreId === centreId);
};
