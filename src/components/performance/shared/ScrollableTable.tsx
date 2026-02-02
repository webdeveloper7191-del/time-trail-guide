import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';

interface ScrollableTableProps {
  children: React.ReactNode;
  minWidth?: number | string;
  className?: string;
}

/**
 * Wrapper component that adds horizontal scrolling to tables on mobile devices.
 * Provides a consistent scrollable container for data-heavy tables.
 */
export function ScrollableTable({
  children,
  minWidth = 600,
  className,
}: ScrollableTableProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <Box
      className={className}
      sx={{
        width: '100%',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        // Subtle scroll indicator
        '&::-webkit-scrollbar': {
          height: 6,
        },
        '&::-webkit-scrollbar-track': {
          bgcolor: 'grey.100',
          borderRadius: 3,
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'grey.300',
          borderRadius: 3,
          '&:hover': {
            bgcolor: 'grey.400',
          },
        },
      }}
    >
      <Box sx={{ minWidth }}>
        {children}
      </Box>
    </Box>
  );
}

export default ScrollableTable;
