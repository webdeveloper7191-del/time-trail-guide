import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box, Stack, Typography, Popper, Fade, Paper, ClickAwayListener } from '@mui/material';
import { Button } from '@/components/mui/Button';
import { 
  Target, ClipboardCheck, MessageSquareHeart, MessageSquare, 
  BarChart3, Users, FileText, ListTodo, GraduationCap, Users2, 
  Grid3X3, Compass, HeartPulse, Scale, Activity, Crosshair, 
  Sparkles, Smile, TrendingUp, ChevronDown, Check, Heart, Wallet,
  UserPlus, Calendar, Lightbulb, Brain, GitCompareArrows, Route,
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
      { value: 'goal-recommendations', label: 'Goal Suggestions', icon: Lightbulb },
      { value: 'okr', label: 'OKRs', icon: Crosshair },
      { value: 'lms', label: 'Learning', icon: GraduationCap },
      { value: 'pip', label: 'PIPs', icon: Activity },
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
      { value: 'nominations', label: 'Peer Nominations', icon: UserPlus },
      { value: 'mentorship', label: 'Mentorship', icon: Heart },
      { value: 'budget', label: 'Dev Budget', icon: Wallet },
    ],
  },
  {
    label: 'Talent',
    items: [
      { value: 'talent', label: '9-Box Grid', icon: Grid3X3 },
      { value: 'skills', label: 'Skills & Careers', icon: Compass },
      { value: 'career-pathing', label: 'Career Paths', icon: Route },
      { value: 'succession', label: 'Succession', icon: Users },
      { value: 'team', label: 'Team Overview', icon: Users2 },
    ],
  },
  {
    label: 'Activities',
    items: [
      { value: 'tasks', label: 'Tasks', icon: ListTodo },
      { value: 'conversations', label: '1:1 Conversations', icon: MessageSquare },
      { value: 'calendar', label: 'Calendar Sync', icon: Calendar },
    ],
  },
  {
    label: 'Insights',
    items: [
      { value: 'summary', label: 'Executive Summary', icon: TrendingUp },
      { value: 'analytics', label: 'Analytics', icon: BarChart3 },
      { value: 'sentiment', label: 'Sentiment Analysis', icon: Brain },
      { value: 'benchmarking', label: 'Benchmarking', icon: GitCompareArrows },
      { value: 'compensation', label: 'Compensation', icon: TrendingUp },
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
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const anchorRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const menuRef = useRef<HTMLDivElement>(null);

  // Toggle dropdown on click - DO NOT auto-select first item
  const handleGroupClick = useCallback((groupLabel: string) => {
    setOpenGroup(prev => {
      const newOpen = prev === groupLabel ? null : groupLabel;
      setFocusedIndex(-1); // Reset focus when opening/closing
      return newOpen;
    });
  }, []);

  // Select item and close dropdown
  const handleItemClick = useCallback((value: string) => {
    onTabChange(value);
    setOpenGroup(null);
    setFocusedIndex(-1);
  }, [onTabChange]);

  const handleClose = useCallback(() => {
    setOpenGroup(null);
    setFocusedIndex(-1);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, group: TabGroup) => {
    const items = group.items;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (openGroup !== group.label) {
          setOpenGroup(group.label);
          setFocusedIndex(0);
        } else {
          setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (focusedIndex > 0) {
          setFocusedIndex(prev => prev - 1);
        } else if (focusedIndex === 0) {
          setOpenGroup(null);
          setFocusedIndex(-1);
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (openGroup === group.label && focusedIndex >= 0) {
          handleItemClick(items[focusedIndex].value);
        } else {
          setOpenGroup(prev => prev === group.label ? null : group.label);
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
      case 'Tab':
        handleClose();
        break;
    }
  }, [openGroup, focusedIndex, handleItemClick, handleClose]);

  // Close on outside click or escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleClose]);

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
                onKeyDown={(e) => handleKeyDown(e, group)}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                endIcon={
                  <ChevronDown 
                    size={14} 
                    className={cn(
                      'transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )} 
                  />
                }
                sx={{
                  textTransform: 'none',
                  fontWeight: isActiveGroup ? 600 : 400,
                  px: 1.5,
                  py: 0.75,
                  minHeight: 36,
                  borderRadius: 1,
                  color: isActiveGroup ? 'primary.contrastText' : 'text.secondary',
                  transition: 'all 0.15s ease-in-out',
                  '&:hover': {
                    bgcolor: isActiveGroup ? 'primary.dark' : 'action.hover',
                    transform: 'translateY(-1px)',
                  },
                  '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: 2,
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
                      ref={menuRef}
                      elevation={8}
                      role="menu"
                      sx={{ 
                        mt: 0.5, 
                        minWidth: 220,
                        py: 0.5,
                        bgcolor: 'background.paper',
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1.5,
                        overflow: 'hidden',
                      }}
                    >
                      <ClickAwayListener onClickAway={handleClose}>
                        <Box>
                          {group.items.map((item, itemIndex) => {
                            const isActive = activeTab === item.value;
                            const isFocused = focusedIndex === itemIndex && isOpen;
                            const Icon = item.icon;
                            
                            return (
                              <Box
                                key={item.value}
                                role="menuitem"
                                tabIndex={-1}
                                onClick={() => handleItemClick(item.value)}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                  px: 2,
                                  py: 1.25,
                                  cursor: 'pointer',
                                  bgcolor: isActive 
                                    ? 'primary.main' 
                                    : isFocused 
                                      ? 'action.hover' 
                                      : 'transparent',
                                  color: isActive ? 'primary.contrastText' : 'text.primary',
                                  transition: 'all 0.1s ease-in-out',
                                  '&:hover': {
                                    bgcolor: isActive ? 'primary.dark' : 'action.hover',
                                  },
                                  // Focus ring for keyboard navigation
                                  ...(isFocused && !isActive && {
                                    outline: '2px solid',
                                    outlineColor: 'primary.light',
                                    outlineOffset: -2,
                                  }),
                                }}
                              >
                                <Box
                                  sx={{
                                    p: 0.75,
                                    borderRadius: 1,
                                    bgcolor: isActive 
                                      ? 'rgba(255,255,255,0.2)' 
                                      : 'action.hover',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Icon size={14} />
                                </Box>
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
