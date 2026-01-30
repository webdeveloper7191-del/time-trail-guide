import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  Popper,
  Paper,
  ClickAwayListener,
  Fade,
  Chip,
  Avatar,
  Divider,
} from '@mui/material';
import { Search, Target, ClipboardCheck, Users, MessageSquare, X, ArrowRight } from 'lucide-react';
import { Goal, PerformanceReview, Conversation } from '@/types/performance';
import { StaffMember } from '@/types/staff';
import { format, parseISO } from 'date-fns';

interface GlobalSearchProps {
  goals: Goal[];
  reviews: PerformanceReview[];
  conversations: Conversation[];
  staff: StaffMember[];
  onSelectGoal: (goal: Goal) => void;
  onSelectReview: (review: PerformanceReview) => void;
  onSelectConversation: (conversation: Conversation) => void;
  onSelectStaff: (staff: StaffMember) => void;
  onNavigateToTab?: (tab: string) => void;
}

interface SearchResult {
  type: 'goal' | 'review' | 'conversation' | 'staff';
  id: string;
  title: string;
  subtitle: string;
  item: Goal | PerformanceReview | Conversation | StaffMember;
}

const typeConfig = {
  goal: { icon: Target, color: 'primary', label: 'Goal' },
  review: { icon: ClipboardCheck, color: 'info', label: 'Review' },
  conversation: { icon: MessageSquare, color: 'secondary', label: '1:1' },
  staff: { icon: Users, color: 'success', label: 'Employee' },
};

export function GlobalSearch({
  goals,
  reviews,
  conversations,
  staff,
  onSelectGoal,
  onSelectReview,
  onSelectConversation,
  onSelectStaff,
  onNavigateToTab,
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getStaffName = (staffId: string) => {
    const member = staff.find(s => s.id === staffId);
    return member ? `${member.firstName} ${member.lastName}` : 'Unknown';
  };

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim() || query.length < 2) return [];

    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search goals
    goals
      .filter(g => 
        g.title.toLowerCase().includes(q) || 
        g.description.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach(goal => {
        results.push({
          type: 'goal',
          id: goal.id,
          title: goal.title,
          subtitle: `${goal.category} • ${goal.progress}% complete`,
          item: goal,
        });
      });

    // Search reviews
    reviews
      .filter(r => {
        const staffName = getStaffName(r.staffId).toLowerCase();
        return staffName.includes(q) || r.reviewCycle.toLowerCase().includes(q);
      })
      .slice(0, 5)
      .forEach(review => {
        results.push({
          type: 'review',
          id: review.id,
          title: `${getStaffName(review.staffId)} - ${review.reviewCycle} Review`,
          subtitle: format(parseISO(review.periodEnd), 'MMM yyyy'),
          item: review,
        });
      });

    // Search conversations
    conversations
      .filter(c => 
        c.title.toLowerCase().includes(q) || 
        getStaffName(c.staffId).toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach(conv => {
        results.push({
          type: 'conversation',
          id: conv.id,
          title: conv.title,
          subtitle: `with ${getStaffName(conv.staffId)} • ${format(parseISO(conv.scheduledDate), 'MMM d')}`,
          item: conv,
        });
      });

    // Search staff
    staff
      .filter(s => 
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.position?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach(member => {
        results.push({
          type: 'staff',
          id: member.id,
          title: `${member.firstName} ${member.lastName}`,
          subtitle: member.position || member.department || '',
          item: member,
        });
      });

    return results;
  }, [query, goals, reviews, conversations, staff]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach(result => {
      if (!groups[result.type]) groups[result.type] = [];
      groups[result.type].push(result);
    });
    return groups;
  }, [results]);

  const handleSelect = (result: SearchResult) => {
    switch (result.type) {
      case 'goal':
        onSelectGoal(result.item as Goal);
        break;
      case 'review':
        onSelectReview(result.item as PerformanceReview);
        break;
      case 'conversation':
        onSelectConversation(result.item as Conversation);
        break;
      case 'staff':
        onSelectStaff(result.item as StaffMember);
        break;
    }
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Keyboard shortcut to focus search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <Box ref={anchorRef} sx={{ position: 'relative', width: { xs: '100%', md: 320 } }}>
      <TextField
        inputRef={inputRef}
        placeholder="Search goals, reviews, employees... (⌘K)"
        size="small"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={18} style={{ color: 'var(--muted-foreground)' }} />
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              <Box
                component="button"
                onClick={() => {
                  setQuery('');
                  setIsOpen(false);
                }}
                sx={{
                  border: 'none',
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  p: 0.5,
                  display: 'flex',
                  '&:hover': { color: 'text.primary' },
                }}
              >
                <X size={16} />
              </Box>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: 'background.paper',
          },
        }}
      />

      <Popper
        open={isOpen && results.length > 0}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
        sx={{ zIndex: 1400, width: anchorRef.current?.offsetWidth || 320 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={150}>
            <Paper
              elevation={8}
              sx={{
                mt: 0.5,
                maxHeight: 400,
                overflow: 'auto',
                border: 1,
                borderColor: 'divider',
              }}
            >
              <ClickAwayListener onClickAway={() => setIsOpen(false)}>
                <Box>
                  {Object.entries(groupedResults).map(([type, items], groupIndex) => {
                    const config = typeConfig[type as keyof typeof typeConfig];
                    const Icon = config.icon;

                    return (
                      <Box key={type}>
                        {groupIndex > 0 && <Divider />}
                        <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover' }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Icon size={14} />
                            <Typography variant="caption" fontWeight={600} textTransform="uppercase">
                              {config.label}s ({items.length})
                            </Typography>
                          </Stack>
                        </Box>
                        {items.map((result, idx) => {
                          const flatIndex = results.findIndex(r => r.id === result.id && r.type === result.type);
                          const isSelected = flatIndex === selectedIndex;

                          return (
                            <Box
                              key={`${result.type}-${result.id}`}
                              onClick={() => handleSelect(result)}
                              sx={{
                                px: 2,
                                py: 1.5,
                                cursor: 'pointer',
                                bgcolor: isSelected ? 'action.selected' : 'transparent',
                                '&:hover': { bgcolor: 'action.hover' },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                              }}
                            >
                              {result.type === 'staff' ? (
                                <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                                  {(result.item as StaffMember).firstName?.[0]}
                                  {(result.item as StaffMember).lastName?.[0]}
                                </Avatar>
                              ) : (
                                <Box
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 1,
                                    bgcolor: `${config.color}.light`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Icon size={16} />
                                </Box>
                              )}
                              <Box flex={1} minWidth={0}>
                                <Typography variant="body2" fontWeight={500} noWrap>
                                  {result.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {result.subtitle}
                                </Typography>
                              </Box>
                              <ArrowRight size={14} style={{ color: 'var(--muted-foreground)', opacity: isSelected ? 1 : 0 }} />
                            </Box>
                          );
                        })}
                      </Box>
                    );
                  })}

                  {/* Quick navigate hint */}
                  <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">
                      Press <kbd style={{ padding: '2px 4px', background: '#e5e5e5', borderRadius: 2 }}>↵</kbd> to select, 
                      <kbd style={{ padding: '2px 4px', background: '#e5e5e5', borderRadius: 2, marginLeft: 4 }}>↑↓</kbd> to navigate
                    </Typography>
                  </Box>
                </Box>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>

      {/* No results state */}
      <Popper
        open={isOpen && query.length >= 2 && results.length === 0}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
        sx={{ zIndex: 1400, width: anchorRef.current?.offsetWidth || 320 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={150}>
            <Paper
              elevation={8}
              sx={{
                mt: 0.5,
                p: 3,
                textAlign: 'center',
                border: 1,
                borderColor: 'divider',
              }}
            >
              <ClickAwayListener onClickAway={() => setIsOpen(false)}>
                <Box>
                  <Search size={32} style={{ color: 'var(--muted-foreground)', marginBottom: 8 }} />
                  <Typography variant="body2" color="text.secondary">
                    No results found for "{query}"
                  </Typography>
                </Box>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </Box>
  );
}

export default GlobalSearch;
