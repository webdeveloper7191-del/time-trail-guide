import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box, Stack, Typography, Popper, Fade, Paper, ClickAwayListener } from '@mui/material';
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

  const handleGroupClick = useCallback((groupLabel: string) => {
    setOpenGroup(prev => {
      const newOpen = prev === groupLabel ? null : groupLabel;
      setFocusedIndex(-1);
      return newOpen;
    });
  }, []);

  const handleItemClick = useCallback((value: string) => {
    onTabChange(value);
    setOpenGroup(null);
    setFocusedIndex(-1);
  }, [onTabChange]);

  const handleClose = useCallback(() => {
    setOpenGroup(null);
    setFocusedIndex(-1);
  }, []);

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
    <Box sx={{ mb: 3 }}>
      <Stack 
        direction="row" 
        sx={{ 
          flexWrap: 'wrap',
          gap: 0.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {tabGroups.map((group) => {
          const isActiveGroup = activeGroup === group.label;
          const isOpen = openGroup === group.label;
          
          return (
            <Box key={group.label} sx={{ position: 'relative' }}>
              <Box
                component="button"
                ref={(el: HTMLButtonElement | null) => { anchorRefs.current[group.label] = el; }}
                onClick={() => handleGroupClick(group.label)}
                onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => handleKeyDown(e, group)}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2.5,
                  py: 1.5,
                  border: 'none',
                  borderBottom: '2px solid',
                  borderBottomColor: isActiveGroup ? 'primary.main' : 'transparent',
                  borderRadius: 0,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                  bgcolor: 'transparent',
                  color: isActiveGroup ? 'primary.main' : 'text.secondary',
                  mb: '-1px',
                  '&:hover': {
                    color: isActiveGroup ? 'primary.main' : 'text.primary',
                    bgcolor: 'action.hover',
                  },
                  '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: -2,
                  },
                }}
              >
                {isActiveGroup && activeTabInfo && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 20,
                      height: 20,
                      borderRadius: 0.75,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                    }}
                  >
                    <activeTabInfo.icon size={12} />
                  </Box>
                )}
                <span>{group.label}</span>
                {isActiveGroup && activeTabInfo && (
                  <Typography 
                    component="span" 
                    sx={{ 
                      fontSize: '0.75rem', 
                      color: 'text.secondary',
                      fontWeight: 400,
                      display: { xs: 'none', sm: 'inline' },
                    }}
                  >
                    · {activeTabInfo.label}
                  </Typography>
                )}
                <ChevronDown 
                  size={14} 
                  className={cn(
                    'transition-transform duration-200',
                    isOpen && 'rotate-180'
                  )} 
                  style={{ color: 'inherit', opacity: 0.6 }}
                />
              </Box>

              <Popper
                open={isOpen}
                anchorEl={anchorRefs.current[group.label]}
                placement="bottom-start"
                transition
                sx={{ zIndex: 1300 }}
              >
                {({ TransitionProps }) => (
                  <Fade {...TransitionProps} timeout={120}>
                    <Paper 
                      ref={menuRef}
                      elevation={0}
                      role="menu"
                      sx={{ 
                        mt: 0.5, 
                        minWidth: 200,
                        py: 0.5,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1.5,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
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
                                  transition: 'all 0.1s ease',
                                  bgcolor: isActive 
                                    ? 'primary.50' 
                                    : isFocused 
                                      ? 'action.hover' 
                                      : 'transparent',
                                  color: isActive ? 'primary.main' : 'text.primary',
                                  '&:hover': {
                                    bgcolor: isActive ? 'primary.100' : 'action.hover',
                                  },
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 24,
                                    height: 24,
                                    borderRadius: 0.75,
                                    bgcolor: isActive ? 'primary.main' : 'grey.100',
                                    color: isActive ? 'primary.contrastText' : 'text.secondary',
                                  }}
                                >
                                  <Icon size={13} />
                                </Box>
                                <Typography 
                                  sx={{ 
                                    flex: 1,
                                    fontSize: '0.875rem',
                                    fontWeight: isActive ? 500 : 400,
                                  }}
                                >
                                  {item.label}
                                </Typography>
                                {isActive && (
                                  <Check size={14} style={{ color: 'inherit' }} />
                                )}
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
