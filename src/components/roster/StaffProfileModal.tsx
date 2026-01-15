import { StaffMember, Shift, roleLabels, qualificationLabels } from '@/types/roster';
import {
  Tabs,
  Tab,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Avatar,
  Box,
  Typography,
  Divider,
  Stack,
} from '@mui/material';
import { 
  Clock, 
  DollarSign, 
  Calendar, 
  Award, 
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  User,
  X,
} from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

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
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="!p-0 flex flex-col h-full overflow-hidden w-[500px] max-w-[95vw] [&>button]:hidden"
      >
        {/* Close button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-3 right-3 z-10 text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <ScrollArea className="flex-1 w-full">
          {/* Header with Gradient Background */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, hsl(199, 89%, 48%) 0%, hsl(199, 89%, 38%) 100%)',
              color: 'white',
              p: 2,
            }}
          >
        <Stack direction="row" spacing={2.5} alignItems="center">
          <Avatar 
            sx={{ 
              width: 64, 
              height: 64, 
              bgcolor: 'rgba(255,255,255,0.2)',
              fontSize: '1.25rem', 
              fontWeight: 700,
              border: '3px solid rgba(255,255,255,0.3)'
            }}
          >
            {staff.name.split(' ').map(n => n[0]).join('')}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
              {staff.name}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
              {roleLabels[staff.role]}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip 
                size="small" 
                label={staff.agency ? 'Agency' : 'Permanent'} 
                sx={{ 
                  bgcolor: staff.agency ? 'error.light' : 'rgba(255,255,255,0.2)',
                  color: staff.agency ? 'error.contrastText' : 'white',
                  fontWeight: 500,
                  fontSize: '0.7rem'
                }} 
              />
            </Stack>
          </Box>
          
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" fontWeight={800}>
              ${staff.hourlyRate}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              /hour
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Stats Bar */}
      <Stack 
        direction="row" 
        divider={<Divider orientation="vertical" flexItem />}
        sx={{ 
          bgcolor: 'grey.50', 
          borderBottom: 1, 
          borderColor: 'divider',
        }}
      >
        <Box sx={{ flex: 1, p: 1.5, textAlign: 'center' }}>
          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center" sx={{ mb: 0.25 }}>
            <Clock size={12} style={{ opacity: 0.6 }} />
            <Typography variant="caption" color="text.secondary">This Week</Typography>
          </Stack>
          <Typography variant="body1" fontWeight={700} color="primary.main">
            {weeklyHours.toFixed(1)}h
          </Typography>
        </Box>
        <Box sx={{ flex: 1, p: 1.5, textAlign: 'center' }}>
          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center" sx={{ mb: 0.25 }}>
            <DollarSign size={12} style={{ opacity: 0.6 }} />
            <Typography variant="caption" color="text.secondary">Earnings</Typography>
          </Stack>
          <Typography variant="body1" fontWeight={700} color="success.main">
            ${totalEarnings.toFixed(0)}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, p: 1.5, textAlign: 'center' }}>
          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center" sx={{ mb: 0.25 }}>
            <Calendar size={12} style={{ opacity: 0.6 }} />
            <Typography variant="caption" color="text.secondary">Shifts</Typography>
          </Stack>
          <Typography variant="body1" fontWeight={700}>
            {thisWeekShifts.length}
          </Typography>
        </Box>
      </Stack>

      {/* Hours Progress */}
      <Box sx={{ py: 2, px: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            Weekly Hours Progress
          </Typography>
          <Typography variant="caption" fontWeight={600} color={hoursProgress > 100 ? 'error.main' : 'primary.main'}>
            {hoursProgress.toFixed(0)}%
          </Typography>
        </Stack>
        <LinearProgress 
          variant="determinate" 
          value={Math.min(hoursProgress, 100)} 
          sx={{ 
            height: 6, 
            borderRadius: 3,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              bgcolor: hoursProgress > 100 ? 'error.main' : 'primary.main',
            }
          }} 
        />
      </Box>

      <Divider />

      {/* Tabs */}
      <Tabs 
        value={tabValue} 
        onChange={(_, v) => setTabValue(v)} 
        variant="fullWidth"
        sx={{
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 500,
            minHeight: 44,
            fontSize: '0.8rem',
          }
        }}
      >
        <Tab label="Contact" icon={<Mail size={14} />} iconPosition="start" />
        <Tab label="Schedule" icon={<Calendar size={14} />} iconPosition="start" />
        <Tab label="Quals" icon={<Award size={14} />} iconPosition="start" />
      </Tabs>

      <Box sx={{ pt: 2, px: 2, pb: 3 }}>
        {/* Contact Tab */}
        {tabValue === 0 && (
          <Stack spacing={2}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ py: 2 }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ 
                      p: 1, 
                      borderRadius: 2, 
                      bgcolor: 'primary.50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Mail size={16} style={{ color: 'hsl(199, 89%, 48%)' }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Email</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {staff.email || 'Not provided'}
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Divider />
                  
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ 
                      p: 1, 
                      borderRadius: 2, 
                      bgcolor: 'success.50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Phone size={16} style={{ color: 'hsl(142, 71%, 45%)' }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Phone</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {staff.phone || 'Not provided'}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
            
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ mb: 1.5, display: 'block' }}>
                  Pay Information
                </Typography>
                <Stack direction="row" spacing={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Standard</Typography>
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      ${staff.hourlyRate}/hr
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Overtime</Typography>
                    <Typography variant="body2" fontWeight={600} color="warning.main">
                      ${staff.overtimeRate}/hr
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Max Hours</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {staff.maxHoursPerWeek}h
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        )}

        {/* Schedule Tab */}
        {tabValue === 1 && (
          <Stack spacing={1.5}>
            {upcomingShifts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Calendar size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
                <Typography variant="body2" color="text.secondary">
                  No upcoming shifts scheduled
                </Typography>
              </Box>
            ) : (
              upcomingShifts.map(shift => (
                <Card 
                  key={shift.id} 
                  variant="outlined" 
                  sx={{ 
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'primary.50',
                    }
                  }}
                >
                  <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box 
                        sx={{ 
                          minWidth: 44,
                          textAlign: 'center',
                          p: 0.75, 
                          borderRadius: 2, 
                          bgcolor: 'primary.50',
                        }}
                      >
                        <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ fontSize: '0.6rem' }}>
                          {format(parseISO(shift.date), 'MMM')}
                        </Typography>
                        <Typography variant="body1" fontWeight={700} color="primary.main" sx={{ lineHeight: 1 }}>
                          {format(parseISO(shift.date), 'd')}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {format(parseISO(shift.date), 'EEEE')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {shift.startTime} - {shift.endTime}
                        </Typography>
                      </Box>
                      
                      <Chip 
                        size="small" 
                        label={shift.status} 
                        color={shift.status === 'published' ? 'primary' : 'default'} 
                        sx={{ textTransform: 'capitalize', fontWeight: 500, fontSize: '0.65rem' }} 
                      />
                    </Stack>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        )}

        {/* Qualifications Tab */}
        {tabValue === 2 && (
          <Stack spacing={1.5}>
            {staff.qualifications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Award size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
                <Typography variant="body2" color="text.secondary">
                  No qualifications recorded
                </Typography>
              </Box>
            ) : (
              staff.qualifications.map((qual, idx) => (
                <Card 
                  key={idx} 
                  variant="outlined"
                  sx={{ 
                    borderRadius: 2,
                    borderColor: qual.isExpired ? 'error.main' : qual.isExpiringSoon ? 'warning.main' : 'divider',
                    bgcolor: qual.isExpired ? 'error.50' : qual.isExpiringSoon ? 'warning.50' : 'transparent',
                  }}
                >
                  <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box 
                        sx={{ 
                          p: 0.75, 
                          borderRadius: 2, 
                          bgcolor: qual.isExpired ? 'error.100' : qual.isExpiringSoon ? 'warning.100' : 'success.50',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {qual.isExpired ? (
                          <AlertCircle size={18} style={{ color: 'hsl(0, 84%, 60%)' }} />
                        ) : qual.isExpiringSoon ? (
                          <AlertCircle size={18} style={{ color: 'hsl(38, 92%, 50%)' }} />
                        ) : (
                          <CheckCircle2 size={18} style={{ color: 'hsl(142, 71%, 45%)' }} />
                        )}
                      </Box>
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {qualificationLabels[qual.type]}
                        </Typography>
                        {qual.expiryDate && (
                          <Typography variant="caption" color="text.secondary">
                            Expires: {qual.expiryDate}
                          </Typography>
                        )}
                      </Box>
                      
                      <Chip 
                        size="small" 
                        label={qual.isExpired ? 'Expired' : qual.isExpiringSoon ? 'Expiring' : 'Valid'} 
                        color={qual.isExpired ? 'error' : qual.isExpiringSoon ? 'warning' : 'success'}
                        sx={{ fontWeight: 500, fontSize: '0.65rem' }}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        )}
      </Box>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
