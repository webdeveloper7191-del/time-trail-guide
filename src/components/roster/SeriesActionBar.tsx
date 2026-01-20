import { Box, Stack, Typography, IconButton, Chip } from '@mui/material';
import { Button } from '@/components/ui/button';
import { X, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { Shift, StaffMember } from '@/types/roster';
import { useMemo } from 'react';

interface SeriesActionBarProps {
  highlightedRecurrenceGroupId: string;
  shifts: Shift[];
  staff: StaffMember[];
  onExit: () => void;
  onBulkEdit: () => void;
  onBulkDelete: () => void;
}

export function SeriesActionBar({
  highlightedRecurrenceGroupId,
  shifts,
  staff,
  onExit,
  onBulkEdit,
  onBulkDelete,
}: SeriesActionBarProps) {
  const seriesShifts = useMemo(() => {
    return shifts.filter(
      s => s.recurring?.recurrenceGroupId === highlightedRecurrenceGroupId
    );
  }, [shifts, highlightedRecurrenceGroupId]);

  const seriesInfo = useMemo(() => {
    if (seriesShifts.length === 0) return null;
    
    const firstShift = seriesShifts[0];
    const staffMember = staff.find(s => s.id === firstShift.staffId);
    const pattern = firstShift.recurring?.pattern || 'weekly';
    
    // Get date range
    const dates = seriesShifts.map(s => s.date).sort();
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    
    return {
      staffName: staffMember?.name || 'Unknown',
      shiftCount: seriesShifts.length,
      pattern,
      startDate,
      endDate,
      startTime: firstShift.startTime,
      endTime: firstShift.endTime,
    };
  }, [seriesShifts, staff]);

  if (!seriesInfo) return null;

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        px: 2,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        boxShadow: 2,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Stack direction="row" spacing={1} alignItems="center">
          <RefreshCw size={18} />
          <Typography variant="subtitle2" fontWeight={600}>
            Viewing Series
          </Typography>
        </Stack>
        
        <Chip
          size="small"
          label={`${seriesInfo.shiftCount} shifts`}
          sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)', 
            color: 'inherit',
            fontWeight: 500,
          }}
        />
        
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          {seriesInfo.staffName} • {seriesInfo.pattern} • {seriesInfo.startTime}-{seriesInfo.endTime}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          variant="secondary"
          size="sm"
          onClick={onBulkEdit}
          className="bg-white/20 hover:bg-white/30 text-white border-0"
        >
          <Pencil size={14} className="mr-1.5" />
          Edit All
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={onBulkDelete}
          className="bg-red-500/80 hover:bg-red-600 text-white border-0"
        >
          <Trash2 size={14} className="mr-1.5" />
          Delete Series
        </Button>
        
        <IconButton
          size="small"
          onClick={onExit}
          sx={{ 
            color: 'inherit',
            ml: 1,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <X size={18} />
        </IconButton>
      </Stack>
    </Box>
  );
}
