import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Shift } from '@/types/roster';
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Paper,
} from '@mui/material';
import { 
  X, 
  History, 
  Undo2, 
  Plus, 
  Trash2, 
  Edit, 
  MoveHorizontal,
  Clock,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryEntry {
  id: string;
  timestamp: Date;
  actionType: 'add' | 'delete' | 'update' | 'move' | 'resize' | 'bulk' | 'copy' | 'undo' | 'redo' | 'initial';
  description: string;
  shiftsSnapshot: Shift[];
  changedShiftIds?: string[];
}

interface RosterHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  historyEntries: HistoryEntry[];
  currentIndex: number;
  onRevertToIndex: (index: number) => void;
}

export function RosterHistoryPanel({
  open,
  onClose,
  historyEntries,
  currentIndex,
  onRevertToIndex,
}: RosterHistoryPanelProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const getActionIcon = (type: HistoryEntry['actionType']) => {
    switch (type) {
      case 'add':
        return <Plus size={14} className="text-green-600" />;
      case 'delete':
        return <Trash2 size={14} className="text-red-600" />;
      case 'update':
        return <Edit size={14} className="text-blue-600" />;
      case 'move':
        return <MoveHorizontal size={14} className="text-purple-600" />;
      case 'resize':
        return <Clock size={14} className="text-orange-600" />;
      case 'bulk':
        return <Plus size={14} className="text-indigo-600" />;
      case 'copy':
        return <Undo2 size={14} className="text-cyan-600" />;
      case 'undo':
        return <Undo2 size={14} className="text-gray-600" />;
      case 'redo':
        return <Undo2 size={14} className="text-gray-600" style={{ transform: 'scaleX(-1)' }} />;
      case 'initial':
        return <History size={14} className="text-gray-400" />;
      default:
        return <Edit size={14} />;
    }
  };

  const getActionColor = (type: HistoryEntry['actionType']) => {
    switch (type) {
      case 'add':
        return 'success';
      case 'delete':
        return 'error';
      case 'update':
        return 'primary';
      case 'move':
        return 'secondary';
      case 'resize':
        return 'warning';
      case 'bulk':
        return 'info';
      case 'copy':
        return 'default';
      default:
        return 'default';
    }
  };

  if (!open) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        right: 16,
        top: 80,
        width: 320,
        maxHeight: 'calc(100vh - 120px)',
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <History size={20} />
            <Typography variant="subtitle1" fontWeight={600}>
              Change History
            </Typography>
          </Stack>
          <IconButton size="small" onClick={onClose} sx={{ color: 'inherit' }}>
            <X size={18} />
          </IconButton>
        </Stack>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          Click any entry to revert to that state
        </Typography>
      </Box>

      {/* History List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {historyEntries.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <History size={40} className="mx-auto mb-2 opacity-30" />
            <Typography variant="body2" color="text.secondary">
              No changes recorded yet
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Changes will appear here as you modify shifts
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {historyEntries.map((entry, index) => {
              const isCurrent = index === currentIndex;
              const isFuture = index > currentIndex;
              
              return (
                <ListItem
                  key={entry.id}
                  disablePadding
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  sx={{
                    borderLeft: 4,
                    borderColor: isCurrent 
                      ? 'primary.main' 
                      : isFuture 
                        ? 'grey.300' 
                        : 'transparent',
                    opacity: isFuture ? 0.6 : 1,
                  }}
                >
                  <ListItemButton
                    onClick={() => onRevertToIndex(index)}
                    disabled={isCurrent}
                    sx={{
                      py: 1.5,
                      px: 2,
                      bgcolor: isCurrent ? 'action.selected' : 'transparent',
                      '&:hover': {
                        bgcolor: isCurrent ? 'action.selected' : 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {getActionIcon(entry.actionType)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2" fontWeight={isCurrent ? 600 : 400}>
                            {entry.description}
                          </Typography>
                          {isCurrent && (
                            <Chip 
                              label="Current" 
                              size="small" 
                              color="primary" 
                              sx={{ height: 18, fontSize: 10 }} 
                            />
                          )}
                        </Stack>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {format(entry.timestamp, 'h:mm:ss a')}
                        </Typography>
                      }
                    />
                    {hoveredIndex === index && !isCurrent && (
                      <RotateCcw size={14} className="text-primary" />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
          {historyEntries.length} entries • Auto-saved
        </Typography>
      </Box>
    </Paper>
  );
}

export type { HistoryEntry };
