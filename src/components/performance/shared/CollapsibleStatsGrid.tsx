import React, { useState } from 'react';
import { Box, Stack, Typography, IconButton, Collapse, useMediaQuery, useTheme } from '@mui/material';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface StatItem {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  gradient?: string;
  color?: string;
}

interface CollapsibleStatsGridProps {
  stats: StatItem[];
  title?: string;
  defaultExpanded?: boolean;
  columns?: { xs?: number; sm?: number; md?: number };
}

export function CollapsibleStatsGrid({
  stats,
  title = 'Overview',
  defaultExpanded = false,
  columns = { xs: 2, sm: 2, md: 4 },
}: CollapsibleStatsGridProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expanded, setExpanded] = useState(defaultExpanded);

  // On desktop, always show stats; on mobile, make collapsible
  if (!isMobile) {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: `repeat(${columns.xs || 2}, 1fr)`,
            sm: `repeat(${columns.sm || 2}, 1fr)`,
            md: `repeat(${columns.md || 4}, 1fr)`,
          },
          gap: 2,
        }}
      >
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      {/* Collapsible Header */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          cursor: 'pointer',
          bgcolor: expanded ? 'grey.50' : 'transparent',
          transition: 'background-color 0.2s',
          '&:hover': { bgcolor: 'grey.50' },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
            {title}
          </Typography>
          {!expanded && (
            <Stack direction="row" spacing={1}>
              {stats.slice(0, 2).map((stat) => (
                <Box
                  key={stat.label}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    bgcolor: 'grey.100',
                  }}
                >
                  <Typography variant="caption" fontWeight={600}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
        <IconButton size="small" sx={{ p: 0.5 }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </IconButton>
      </Box>

      {/* Collapsible Content */}
      <Collapse in={expanded}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns.xs || 2}, 1fr)`,
            gap: 1.5,
            p: 2,
            pt: 0,
          }}
        >
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} compact />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

function StatCard({ stat, compact = false }: { stat: StatItem; compact?: boolean }) {
  return (
    <Box
      sx={{
        position: 'relative',
        p: compact ? 1.5 : 2.5,
        borderRadius: compact ? 1.5 : 2.5,
        bgcolor: 'white',
        border: '1px solid',
        borderColor: 'grey.100',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'grey.200',
          boxShadow: compact ? undefined : '0 4px 12px rgba(0,0,0,0.05)',
          transform: compact ? undefined : 'translateY(-2px)',
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography
            sx={{
              fontSize: compact ? '0.65rem' : '0.75rem',
              fontWeight: 500,
              color: 'grey.500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mb: 0.5,
            }}
          >
            {stat.label}
          </Typography>
          <Typography
            sx={{
              fontSize: compact ? '1.25rem' : { xs: '1.75rem', md: '2rem' },
              fontWeight: 700,
              color: 'grey.900',
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            {stat.value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: compact ? 32 : 40,
            height: compact ? 32 : 40,
            borderRadius: compact ? 1.5 : 2,
            background: stat.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            '& svg': {
              width: compact ? 14 : 18,
              height: compact ? 14 : 18,
            },
          }}
        >
          {stat.icon}
        </Box>
      </Stack>
    </Box>
  );
}

export default CollapsibleStatsGrid;
