import { describe, it, expect, vi } from 'vitest';
import { 
  computeConflicts, 
  computeAlerts, 
  DEFAULT_ROSTER_ISSUE_SETTINGS 
} from './rosterIssueEngine';
import { Shift, StaffMember, TimeOff } from '@/types/roster';
import { addHours, subHours, format, addDays } from 'date-fns';

const mockStaff: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Alice',
    role: 'educator',
    employmentType: 'permanent',
    qualifications: [
      { type: 'first_aid', name: 'First Aid', expiryDate: '2025-12-31' }
    ],
    hourlyRate: 30,
    overtimeRate: 45,
    maxHoursPerWeek: 40,
    currentWeeklyHours: 0,
    preferredCentres: ['centre-1'],
    availability: [
      { dayOfWeek: 1, available: true, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 2, available: true, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 3, available: true, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 4, available: true, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 5, available: true, startTime: '07:00', endTime: '18:00' },
    ],
    color: '#ff0000',
  }
];

describe('Roster Issue Engine', () => {
  describe('Conflicts', () => {
    it('should flag insufficient rest under 10h (C9)', () => {
      const shifts: Shift[] = [
        {
          id: 's1',
          staffId: 'staff-1',
          centreId: 'c1',
          roomId: 'r1',
          date: '2024-05-20',
          startTime: '08:00',
          endTime: '17:00',
          breakMinutes: 60,
          status: 'published',
          isOpenShift: false,
        },
        {
          id: 's2',
          staffId: 'staff-1',
          centreId: 'c1',
          roomId: 'r1',
          date: '2024-05-21',
          startTime: '02:00', // Only 9 hours rest
          endTime: '10:00',
          breakMinutes: 30,
          status: 'published',
          isOpenShift: false,
        }
      ];
      const conflicts = computeConflicts({ shifts, staff: mockStaff, settings: DEFAULT_ROSTER_ISSUE_SETTINGS });
      const restConflict = conflicts.find(c => c.code === 'insufficient_rest');
      expect(restConflict).toBeDefined();
      expect(restConflict?.severity).toBe('blocking');
      expect(restConflict?.reason).toContain('9h rest');
    });

    it('should block overlapping shifts (C1/C2)', () => {
      const shifts: Shift[] = [
        {
          id: 's1',
          staffId: 'staff-1',
          centreId: 'c1',
          roomId: 'r1',
          date: '2024-05-20',
          startTime: '08:00',
          endTime: '12:00',
          breakMinutes: 0,
          status: 'published',
          isOpenShift: false,
        },
        {
          id: 's2',
          staffId: 'staff-1',
          centreId: 'c1',
          roomId: 'r1',
          date: '2024-05-20',
          startTime: '11:00', // Overlaps
          endTime: '15:00',
          breakMinutes: 0,
          status: 'published',
          isOpenShift: false,
        }
      ];
      const conflicts = computeConflicts({ shifts, staff: mockStaff });
      const overlap = conflicts.find(c => c.code === 'overlap_same_location');
      expect(overlap).toBeDefined();
      expect(overlap?.severity).toBe('blocking');
    });

    it('should block shifts during approved leave (C4)', () => {
      const leave: TimeOff[] = [
        {
          id: 'l1',
          staffId: 'staff-1',
          startDate: '2024-05-20',
          endDate: '2024-05-20',
          type: 'annual_leave',
          status: 'approved',
        }
      ];
      const shifts: Shift[] = [
        {
          id: 's1',
          staffId: 'staff-1',
          centreId: 'c1',
          roomId: 'r1',
          date: '2024-05-20',
          startTime: '08:00',
          endTime: '17:00',
          breakMinutes: 60,
          status: 'published',
          isOpenShift: false,
        }
      ];
      const conflicts = computeConflicts({ shifts, staff: mockStaff, leave });
      const leaveConflict = conflicts.find(c => c.code === 'on_approved_leave');
      expect(leaveConflict).toBeDefined();
      expect(leaveConflict?.severity).toBe('blocking');
    });
  });

  describe('Alerts', () => {
    const now = new Date('2024-05-20T10:00:00');

    it('should flag open shifts: amber at 72h and red at 24h (A1)', () => {
      const shifts: Shift[] = [
        {
          id: 'amber-shift',
          staffId: '',
          centreId: 'c1',
          roomId: 'r1',
          date: '2024-05-23', // ~72h away from 5-20 10:00 is 5-23 10:00
          startTime: '09:00', // 71h away
          endTime: '17:00',
          breakMinutes: 60,
          status: 'draft',
          isOpenShift: true,
        },
        {
          id: 'red-shift',
          staffId: '',
          centreId: 'c1',
          roomId: 'r1',
          date: '2024-05-21', // ~24h away
          startTime: '09:00', // 23h away
          endTime: '17:00',
          breakMinutes: 60,
          status: 'draft',
          isOpenShift: true,
        }
      ];
      const alerts = computeAlerts({ shifts, staff: mockStaff, now });
      
      const redAlert = alerts.find(a => a.shiftId === 'red-shift');
      expect(redAlert?.urgency).toBe('red');
      
      const amberAlert = alerts.find(a => a.shiftId === 'amber-shift');
      expect(amberAlert?.urgency).toBe('amber');
    });

    it('should flag unacknowledged shifts: amber at 24h and red at 48h (A13)', () => {
      const shifts: Shift[] = [
        {
          id: 'amber-unacked',
          staffId: 'staff-1',
          centreId: 'c1',
          roomId: 'r1',
          date: '2024-05-25',
          startTime: '09:00',
          endTime: '17:00',
          breakMinutes: 60,
          status: 'published',
          isOpenShift: false,
        },
        {
          id: 'red-unacked',
          staffId: 'staff-1',
          centreId: 'c1',
          roomId: 'r1',
          date: '2024-05-26',
          startTime: '09:00',
          endTime: '17:00',
          breakMinutes: 60,
          status: 'published',
          isOpenShift: false,
        }
      ];
      
      const publishedAt = {
        'amber-unacked': subHours(now, 25).toISOString(),
        'red-unacked': subHours(now, 49).toISOString(),
      };
      
      const alerts = computeAlerts({ shifts, staff: mockStaff, now, publishedAt });
      
      const redAlert = alerts.find(a => a.shiftId === 'red-unacked' && a.code === 'shift_unacknowledged');
      expect(redAlert?.urgency).toBe('red');
      
      const amberAlert = alerts.find(a => a.shiftId === 'amber-unacked' && a.code === 'shift_unacknowledged');
      expect(amberAlert?.urgency).toBe('amber');
    });

    it('should flag qualifications expiring within 30 days (A14)', () => {
      const expiringSoonStaff: StaffMember = {
        ...mockStaff[0],
        id: 'staff-expiring',
        qualifications: [
          { 
            type: 'first_aid', 
            name: 'First Aid', 
            expiryDate: format(addDays(now, 10), 'yyyy-MM-dd') 
          }
        ]
      };
      
      const shifts: Shift[] = [
        {
          id: 's1',
          staffId: 'staff-expiring',
          centreId: 'c1',
          roomId: 'r1',
          date: format(addDays(now, 5), 'yyyy-MM-dd'),
          startTime: '09:00',
          endTime: '17:00',
          breakMinutes: 60,
          status: 'published',
          isOpenShift: false,
        }
      ];
      
      const alerts = computeAlerts({ shifts, staff: [expiringSoonStaff], now });
      const qualAlert = alerts.find(a => a.code === 'qualification_expiring');
      expect(qualAlert).toBeDefined();
      expect(qualAlert?.urgency).toBe('amber'); // 10 days is amber (high is < 7)
    });

    it('should alert approaching weekly hours at 90% (A8/A9)', () => {
      // staff-1 maxHoursPerWeek is 40. 90% is 36.
      const shifts: Shift[] = [
        {
          id: 's1',
          staffId: 'staff-1',
          centreId: 'c1',
          roomId: 'r1',
          date: '2024-05-20', // Monday
          startTime: '08:00',
          endTime: '18:00', // 10h (no break for simplicity in calculation, though I should include it)
          breakMinutes: 0,
          status: 'published',
          isOpenShift: false,
        },
        {
          id: 's2',
          staffId: 'staff-1',
          centreId: 'c1',
          roomId: 'r1',
          date: '2024-05-21', // Tuesday
          startTime: '08:00',
          endTime: '18:00', // 10h
          breakMinutes: 0,
          status: 'published',
          isOpenShift: false,
        },
        {
          id: 's3',
          staffId: 'staff-1',
          centreId: 'c1',
          roomId: 'r1',
          date: '2024-05-22', // Wednesday
          startTime: '08:00',
          endTime: '18:00', // 10h
          breakMinutes: 0,
          status: 'published',
          isOpenShift: false,
        },
        {
          id: 's4',
          staffId: 'staff-1',
          centreId: 'c1',
          roomId: 'r1',
          date: '2024-05-23', // Thursday
          startTime: '08:00',
          endTime: '15:00', // 7h. Total = 37h. 37/40 = 92.5%
          breakMinutes: 0,
          status: 'published',
          isOpenShift: false,
        }
      ];
      
      const alerts = computeAlerts({ shifts, staff: mockStaff, now });
      const hoursAlert = alerts.find(a => a.code === 'approaching_weekly_hours');
      expect(hoursAlert).toBeDefined();
      expect(hoursAlert?.reason).toContain('93%');
    });
  });
});
