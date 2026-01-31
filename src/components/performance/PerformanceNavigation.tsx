import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box, Stack, Typography, Popper, Fade, Paper, ClickAwayListener, alpha } from '@mui/material';
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
    <Box 
      sx={{ 
        mb: 4,
        py: 1,
      }}
    >
      <Stack 
        direction="row" 
        sx={{ 
          flexWrap: 'wrap',
          gap: 1,
          p: 1,
          bgcolor: 'grey.50',
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: 'grey.100',
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
                  px: 2,
                  py: 1.25,
                  border: 'none',
                  borderRadius: 2,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.875rem',
                  fontWeight: isActiveGroup ? 600 : 500,
                  letterSpacing: '-0.01em',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  bgcolor: isActiveGroup ? 'white' : 'transparent',
                  color: isActiveGroup ? 'grey.900' : 'grey.600',
                  boxShadow: isActiveGroup ? '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  '&:hover': {
                    bgcolor: isActiveGroup ? 'white' : 'grey.100',
                    color: 'grey.900',
                  },
                  '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: 2,
                  },
                }}
              >
                {isActiveGroup && activeTabInfo && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 22,
                      height: 22,
                      borderRadius: 1,
                      bgcolor: 'primary.50',
                      color: 'primary.600',
                    }}
                  >
                    <activeTabInfo.icon size={13} />
                  </Box>
                )}
                <span>{group.label}</span>
                {isActiveGroup && (
                  <Typography 
                    component="span" 
                    sx={{ 
                      fontSize: '0.75rem', 
                      color: 'grey.500',
                      fontWeight: 400,
                      display: { xs: 'none', sm: 'inline' },
                    }}
                  >
                    · {activeTabInfo?.label}
                  </Typography>
                )}
                <ChevronDown 
                  size={14} 
                  className={cn(
                    'transition-transform duration-200 ml-0.5',
                    isOpen && 'rotate-180'
                  )} 
                  style={{ color: 'inherit', opacity: 0.5 }}
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
                  <Fade {...TransitionProps} timeout={150}>
                    <Paper 
                      ref={menuRef}
                      elevation={0}
                      role="menu"
                      sx={{ 
                        mt: 1, 
                        minWidth: 220,
                        py: 1,
                        bgcolor: 'white',
                        border: '1px solid',
                        borderColor: 'grey.200',
                        borderRadius: 2.5,
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.05)',
                        overflow: 'hidden',
                      }}
                    >
                      <ClickAwayListener onClickAway={handleClose}>
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              px: 2,
                              py: 1,
                              color: 'grey.400',
                              fontWeight: 600,
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                              fontSize: '0.65rem',
                            }}
                          >
                            {group.label}
                          </Typography>
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
                                  mx: 1,
                                  borderRadius: 1.5,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  bgcolor: isActive 
                                    ? 'primary.50' 
                                    : isFocused 
                                      ? 'grey.50' 
                                      : 'transparent',
                                  color: isActive ? 'primary.700' : 'grey.700',
                                  '&:hover': {
                                    bgcolor: isActive ? 'primary.100' : 'grey.50',
                                  },
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 28,
                                    height: 28,
                                    borderRadius: 1.5,
                                    bgcolor: isActive ? 'primary.100' : 'grey.100',
                                    color: isActive ? 'primary.600' : 'grey.500',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <Icon size={14} />
                                </Box>
                                <Typography 
                                  sx={{ 
                                    flex: 1,
                                    fontSize: '0.875rem',
                                    fontWeight: isActive ? 600 : 400,
                                  }}
                                >
                                  {item.label}
                                </Typography>
                                {isActive && (
                                  <Box
                                    sx={{
                                      width: 18,
                                      height: 18,
                                      borderRadius: '50%',
                                      bgcolor: 'primary.500',
                                      color: 'white',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <Check size={11} strokeWidth={3} />
                                  </Box>
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
