import React, { useState, useRef } from 'react';
import { Box, Stack, Typography, Popper, Fade, Paper, ClickAwayListener } from '@mui/material';
import { Button } from '@/components/mui/Button';
import { 
  Target, ClipboardCheck, MessageSquareHeart, MessageSquare, 
  BarChart3, Users, FileText, ListTodo, GraduationCap, Users2, 
  Grid3X3, Compass, HeartPulse, Scale, Activity, Crosshair, 
  Sparkles, Smile, TrendingUp, ChevronDown, Check,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabItem {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface TabGroup {
  label: string;
  items: TabItem[];
}

const tabGroups: TabGroup[] = [
  {
    label: 'Development',
    items: [
      { value: 'plans', label: 'Plans', icon: FileText },
      { value: 'goals', label: 'Goals', icon: Target },
      { value: 'okr', label: 'OKRs', icon: Crosshair },
      { value: 'lms', label: 'Learning', icon: GraduationCap },
    ],
  },
  {
    label: 'Reviews & Feedback',
    items: [
      { value: 'reviews', label: 'Reviews', icon: ClipboardCheck },
      { value: 'feedback', label: 'Feedback', icon: MessageSquareHeart },
      { value: '360feedback', label: '360° Feedback', icon: Users2 },
      { value: 'calibration', label: 'Calibration', icon: Scale },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { value: 'recognition', label: 'Recognition', icon: Sparkles },
      { value: 'happiness', label: 'Happiness', icon: Smile },
      { value: 'pulse', label: 'Pulse Surveys', icon: Activity },
      { value: 'wellbeing', label: 'Wellbeing', icon: HeartPulse },
    ],
  },
  {
    label: 'Talent',
    items: [
      { value: 'talent', label: '9-Box Grid', icon: Grid3X3 },
      { value: 'skills', label: 'Skills & Careers', icon: Compass },
      { value: 'team', label: 'Team Overview', icon: Users },
    ],
  },
  {
    label: 'Activities',
    items: [
      { value: 'tasks', label: 'Tasks', icon: ListTodo },
      { value: 'conversations', label: '1:1 Conversations', icon: MessageSquare },
    ],
  },
  {
    label: 'Insights',
    items: [
      { value: 'summary', label: 'Executive Summary', icon: TrendingUp },
      { value: 'analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
];

// Get all items flattened for finding active tab info
const allItems = tabGroups.flatMap(g => g.items);

interface PerformanceNavigationProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function PerformanceNavigation({ activeTab, onTabChange }: PerformanceNavigationProps) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const anchorRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleGroupClick = (groupLabel: string) => {
    setOpenGroup(prev => prev === groupLabel ? null : groupLabel);
  };

  const handleItemClick = (value: string) => {
    onTabChange(value);
    setOpenGroup(null);
  };

  const handleClose = () => {
    setOpenGroup(null);
  };

  const getActiveGroupForTab = (tabValue: string): string | undefined => {
    const group = tabGroups.find(g => g.items.some(item => item.value === tabValue));
    return group?.label;
  };

  const getActiveTabInfo = (tabValue: string): TabItem | undefined => {
    return allItems.find(item => item.value === tabValue);
  };

  const activeGroup = getActiveGroupForTab(activeTab);
  const activeTabInfo = getActiveTabInfo(activeTab);

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Stack 
        direction="row" 
        spacing={0.5} 
        sx={{ 
          flexWrap: 'wrap',
          gap: 0.5,
          py: 1,
        }}
      >
        {tabGroups.map((group) => {
          const isActiveGroup = activeGroup === group.label;
          const isOpen = openGroup === group.label;
          
          return (
            <Box key={group.label} sx={{ position: 'relative' }}>
              <Button
                ref={(el) => { anchorRefs.current[group.label] = el; }}
                variant={isActiveGroup ? 'contained' : 'text'}
                size="small"
                onClick={() => handleGroupClick(group.label)}
                endIcon={<ChevronDown size={14} className={cn('transition-transform', isOpen && 'rotate-180')} />}
                sx={{
                  textTransform: 'none',
                  fontWeight: isActiveGroup ? 600 : 400,
                  px: 1.5,
                  py: 0.75,
                  minHeight: 36,
                  borderRadius: 1,
                  color: isActiveGroup ? 'primary.contrastText' : 'text.secondary',
                  '&:hover': {
                    bgcolor: isActiveGroup ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  {isActiveGroup && activeTabInfo && (
                    <activeTabInfo.icon size={14} />
                  )}
                  <span>{group.label}</span>
                  {isActiveGroup && (
                    <Typography 
                      component="span" 
                      sx={{ 
                        fontSize: '0.7rem', 
                        opacity: 0.85,
                        fontWeight: 400,
                        display: { xs: 'none', sm: 'inline' },
                      }}
                    >
                      ({activeTabInfo?.label})
                    </Typography>
                  )}
                </Stack>
              </Button>

              <Popper
                open={isOpen}
                anchorEl={anchorRefs.current[group.label]}
                placement="bottom-start"
                transition
                sx={{ zIndex: 1300 }}
              >
                {({ TransitionProps }) => (
                  <Fade {...TransitionProps} timeout={150}>
                    <Paper 
                      elevation={8}
                      sx={{ 
                        mt: 0.5, 
                        minWidth: 200,
                        py: 0.5,
                        bgcolor: 'background.paper',
                        border: 1,
                        borderColor: 'divider',
                      }}
                    >
                      <ClickAwayListener onClickAway={handleClose}>
                        <Box>
                          {group.items.map((item) => {
                            const isActive = activeTab === item.value;
                            const Icon = item.icon;
                            
                            return (
                              <Box
                                key={item.value}
                                onClick={() => handleItemClick(item.value)}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                  px: 2,
                                  py: 1.25,
                                  cursor: 'pointer',
                                  bgcolor: isActive ? 'primary.main' : 'transparent',
                                  color: isActive ? 'primary.contrastText' : 'text.primary',
                                  '&:hover': {
                                    bgcolor: isActive ? 'primary.dark' : 'action.hover',
                                  },
                                }}
                              >
                                <Icon size={16} />
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    flex: 1,
                                    fontWeight: isActive ? 600 : 400,
                                  }}
                                >
                                  {item.label}
                                </Typography>
                                {isActive && <Check size={14} />}
                              </Box>
                            );
                          })}
                        </Box>
                      </ClickAwayListener>
                    </Paper>
                  </Fade>
                )}
              </Popper>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

export { tabGroups, allItems };
export type { TabItem, TabGroup };
