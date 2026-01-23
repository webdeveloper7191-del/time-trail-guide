import { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  Typography,
  Chip,
  IconButton,
  LinearProgress,
  Collapse,
} from '@mui/material';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { format } from 'date-fns';

interface OfflineSyncStatusBarProps {
  compact?: boolean;
}

export function OfflineSyncStatusBar({ compact = false }: OfflineSyncStatusBarProps) {
  const {
    isOnline,
    pendingCount,
    isSyncing,
    pendingSubmissions,
    retrySync,
    forceSync,
  } = useOfflineSync();

  const [expanded, setExpanded] = useState(false);

  // Don't show if online and no pending items
  if (isOnline && pendingCount === 0 && !compact) {
    return null;
  }

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case 'syncing':
        return <RefreshCw className="h-3 w-3 text-primary animate-spin" />;
      case 'synced':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      default:
        return null;
    }
  };

  if (compact) {
    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-destructive" />
        )}
        {pendingCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {pendingCount} pending
          </Badge>
        )}
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: isOnline ? 'success.lighter' : 'warning.lighter',
        borderBottom: 1,
        borderColor: isOnline ? 'success.light' : 'warning.light',
      }}
    >
      {/* Main status bar */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1 }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          {isOnline ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Wifi className="h-4 w-4 text-green-600" />
              <Typography variant="body2" fontWeight={500} color="success.dark">
                Online
              </Typography>
            </Stack>
          ) : (
            <Stack direction="row" alignItems="center" spacing={1}>
              <WifiOff className="h-4 w-4 text-orange-600" />
              <Typography variant="body2" fontWeight={500} color="warning.dark">
                Offline Mode
              </Typography>
            </Stack>
          )}

          {pendingCount > 0 && (
            <Chip
              icon={<Upload className="h-3 w-3" />}
              label={`${pendingCount} form${pendingCount > 1 ? 's' : ''} pending sync`}
              size="small"
              color={isOnline ? 'success' : 'warning'}
              variant="outlined"
            />
          )}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          {pendingCount > 0 && isOnline && (
            <Button
              variant="ghost"
              size="sm"
              onClick={forceSync}
              disabled={isSyncing}
              className="h-7"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          )}

          {pendingCount > 0 && (
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </IconButton>
          )}
        </Stack>
      </Stack>

      {/* Sync progress */}
      {isSyncing && (
        <LinearProgress color="primary" sx={{ height: 2 }} />
      )}

      {/* Expanded pending list */}
      <Collapse in={expanded && pendingCount > 0}>
        <Box sx={{ px: 2, pb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Pending Submissions
          </Typography>
          <Stack spacing={1}>
            {pendingSubmissions.slice(0, 5).map((submission) => (
              <Box
                key={submission.id}
                sx={{
                  p: 1.5,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {getSyncStatusIcon(submission.syncStatus)}
                    <Typography variant="body2">
                      Form submission
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(submission.savedAt), 'MMM d, h:mm a')}
                    </Typography>
                    {submission.syncStatus === 'failed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={retrySync}
                        className="h-6 text-xs"
                      >
                        Retry
                      </Button>
                    )}
                  </Stack>
                </Stack>
                {submission.errorMessage && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    Error: {submission.errorMessage}
                  </Typography>
                )}
              </Box>
            ))}
            {pendingSubmissions.length > 5 && (
              <Typography variant="caption" color="text.secondary" textAlign="center">
                And {pendingSubmissions.length - 5} more...
              </Typography>
            )}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}
