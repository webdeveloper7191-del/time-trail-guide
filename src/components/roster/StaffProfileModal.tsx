import { StaffMember, Shift, roleLabels, qualificationLabels } from '@/types/roster';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Chip,
  Avatar,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { 
  Clock, 
  DollarSign, 
  Calendar, 
  Award, 
  TrendingUp,
  Phone,
  Mail,
  Star
} from 'lucide-react';
import CloseIcon from '@mui/icons-material/Close';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { useState } from 'react';

interface StaffProfileModalProps {
  staff: StaffMember | null;
  shifts: Shift[];
  isOpen: boolean;
  onClose: () => void;
}

export function StaffProfileModal({ staff, shifts, isOpen, onClose }: StaffProfileModalProps) {
  const [tabValue, setTabValue] = useState(0);
  
  if (!staff) return null;

  const staffShifts = shifts.filter(s => s.staffId === staff.id);
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  const thisWeekShifts = staffShifts.filter(s => {
    const shiftDate = parseISO(s.date);
    return isWithinInterval(shiftDate, { start: weekStart, end: weekEnd });
  });

  let weeklyHours = 0;
  thisWeekShifts.forEach(shift => {
    const [startH, startM] = shift.startTime.split(':').map(Number);
    const [endH, endM] = shift.endTime.split(':').map(Number);
    weeklyHours += ((endH * 60 + endM) - (startH * 60 + startM) - shift.breakMinutes) / 60;
  });

  const hoursProgress = (weeklyHours / staff.maxHoursPerWeek) * 100;
  const totalEarnings = weeklyHours * staff.hourlyRate;

  const upcomingShifts = staffShifts
    .filter(s => parseISO(s.date) >= now)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: staff.color, fontSize: '1.25rem', fontWeight: 600 }}>
            {staff.name.split(' ').map(n => n[0]).join('')}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">{staff.name}</Typography>
              <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
            </Box>
            <Typography variant="body2" color="text.secondary">{roleLabels[staff.role]}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip size="small" label={staff.agency ? 'Agency' : 'Permanent'} color={staff.agency ? 'error' : 'default'} />
              {staff.employmentType && <Chip size="small" label={staff.employmentType} variant="outlined" sx={{ textTransform: 'capitalize' }} />}
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" color="primary" fontWeight={700}>${staff.hourlyRate}/hr</Typography>
            <Typography variant="caption" color="text.secondary">OT: ${staff.overtimeRate}/hr</Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="fullWidth">
          <Tab label="Overview" />
          <Tab label="Schedule" />
          <Tab label="Qualifications" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {tabValue === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <Card variant="outlined">
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'primary.light' }}><Clock size={20} /></Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">This Week</Typography>
                      <Typography variant="body1" fontWeight={600}>{weeklyHours.toFixed(1)}h / {staff.maxHoursPerWeek}h</Typography>
                    </Box>
                  </CardContent>
                  <LinearProgress variant="determinate" value={Math.min(hoursProgress, 100)} sx={{ height: 4 }} />
                </Card>
                <Card variant="outlined">
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'success.light' }}><DollarSign size={20} /></Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Est. Earnings</Typography>
                      <Typography variant="body1" fontWeight={600}>${totalEarnings.toFixed(2)}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
              <Card variant="outlined">
                <CardHeader title={<Typography variant="body2" fontWeight={500}>Contact</Typography>} sx={{ pb: 0 }} />
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Mail size={16} style={{ opacity: 0.5 }} /><Typography variant="body2">{staff.email || 'Not provided'}</Typography></Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Phone size={16} style={{ opacity: 0.5 }} /><Typography variant="body2">{staff.phone || 'Not provided'}</Typography></Box>
                </CardContent>
              </Card>
            </Box>
          )}

          {tabValue === 1 && (
            <Card variant="outlined">
              <CardHeader title={<Typography variant="body2" fontWeight={500}>Upcoming Shifts</Typography>} />
              <CardContent>
                {upcomingShifts.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>No upcoming shifts</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {upcomingShifts.map(shift => (
                      <Box key={shift.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'primary.light', textAlign: 'center' }}>
                            <Typography variant="caption" color="primary">{format(parseISO(shift.date), 'MMM')}</Typography>
                            <Typography variant="body2" fontWeight={600} color="primary">{format(parseISO(shift.date), 'd')}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>{format(parseISO(shift.date), 'EEEE')}</Typography>
                            <Typography variant="caption" color="text.secondary">{shift.startTime} - {shift.endTime}</Typography>
                          </Box>
                        </Box>
                        <Chip size="small" label={shift.status} color={shift.status === 'published' ? 'primary' : 'default'} sx={{ textTransform: 'capitalize' }} />
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {tabValue === 2 && (
            <Card variant="outlined">
              <CardHeader title={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Award size={16} />Qualifications</Box>} />
              <CardContent>
                {staff.qualifications.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>No qualifications recorded</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {staff.qualifications.map((qual, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: 1, bgcolor: qual.isExpired ? 'error.light' : qual.isExpiringSoon ? 'warning.light' : 'action.hover' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ p: 0.75, borderRadius: '50%', bgcolor: qual.isExpired ? 'error.main' : qual.isExpiringSoon ? 'warning.main' : 'success.main', opacity: 0.2 }}>
                            <Star size={16} />
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>{qualificationLabels[qual.type]}</Typography>
                            {qual.expiryDate && <Typography variant="caption" color="text.secondary">Expires: {qual.expiryDate}</Typography>}
                          </Box>
                        </Box>
                        <Chip size="small" label={qual.isExpired ? 'Expired' : qual.isExpiringSoon ? 'Expiring Soon' : 'Valid'} color={qual.isExpired ? 'error' : qual.isExpiringSoon ? 'warning' : 'success'} />
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
