import React, { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  LinearProgress,
  Divider,
  AvatarGroup,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  UserPlus,
  Heart,
  Target,
  Sparkles,
  Calendar,
  MessageSquare,
  Check,
  X,
  Link2,
  Star,
} from 'lucide-react';
import { StaffMember } from '@/types/staff';
import {
  MentorProfile,
  MenteeProfile,
  MentorshipMatch,
  mentorshipStatusLabels,
} from '@/types/performanceAdvanced';
import {
  mockMentorProfiles as initialMentors,
  mockMenteeProfiles as initialMentees,
  mockMentorshipMatches as initialMatches,
} from '@/data/mockPerformanceAdvancedData';
import { toast } from 'sonner';

interface MentorshipMatchingProps {
  staff: StaffMember[];
  currentUserId: string;
}

export function MentorshipMatchingPanel({ staff, currentUserId }: MentorshipMatchingProps) {
  const [mentors, setMentors] = useState<MentorProfile[]>(initialMentors);
  const [mentees, setMentees] = useState<MenteeProfile[]>(initialMentees);
  const [matches, setMatches] = useState<MentorshipMatch[]>(initialMatches);
  const [activeView, setActiveView] = useState<'matches' | 'mentors' | 'mentees' | 'find_match'>('matches');
  const [showMentorDrawer, setShowMentorDrawer] = useState(false);
  const [showMenteeDrawer, setShowMenteeDrawer] = useState(false);
  const [showMatchDrawer, setShowMatchDrawer] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MentorshipMatch | null>(null);

  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);
  const getMentorByStaffId = (staffId: string) => mentors.find(m => m.staffId === staffId);
  const getMenteeByStaffId = (staffId: string) => mentees.find(m => m.staffId === staffId);

  // Calculate potential matches for unmatched mentees
  const calculateMatchScore = (mentor: MentorProfile, mentee: MenteeProfile): { score: number; reasons: string[] } => {
    let score = 0;
    const reasons: string[] = [];

    // Skills overlap
    const skillsMatch = mentor.skills.filter(s => mentee.desiredSkills.some(ds => ds.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(ds.toLowerCase())));
    if (skillsMatch.length > 0) {
      score += skillsMatch.length * 15;
      reasons.push(`Skills match: ${skillsMatch.join(', ')}`);
    }

    // Interests overlap
    const interestsMatch = mentor.interests.filter(i => mentee.interests.some(mi => mi.toLowerCase() === i.toLowerCase()));
    if (interestsMatch.length > 0) {
      score += interestsMatch.length * 10;
      reasons.push(`Shared interests: ${interestsMatch.join(', ')}`);
    }

    // Career goals alignment
    const goalsMatch = mentor.careerGoals.some(g => mentee.careerGoals.some(mg => mg.toLowerCase().includes(g.toLowerCase().split(' ')[0])));
    if (goalsMatch) {
      score += 20;
      reasons.push('Career goals aligned');
    }

    // Meeting frequency match
    if (mentor.preferredMeetingFrequency === mentee.preferredMeetingFrequency) {
      score += 10;
      reasons.push('Meeting frequency compatible');
    }

    // Availability bonus
    if (mentor.availability === 'high' && mentor.currentMentees < mentor.maxMentees) {
      score += 15;
      reasons.push('High mentor availability');
    } else if (mentor.availability === 'medium' && mentor.currentMentees < mentor.maxMentees) {
      score += 8;
    }

    return { score: Math.min(score, 100), reasons };
  };

  const potentialMatches = useMemo(() => {
    const unmatchedMentees = mentees.filter(mentee => 
      !matches.some(m => m.menteeId === mentee.id && (m.status === 'active' || m.status === 'pending'))
    );

    const availableMentors = mentors.filter(m => m.isActive && m.currentMentees < m.maxMentees);

    return unmatchedMentees.map(mentee => {
      const matchedMentors = availableMentors.map(mentor => ({
        mentor,
        mentee,
        ...calculateMatchScore(mentor, mentee),
      })).sort((a, b) => b.score - a.score);

      return { mentee, potentialMentors: matchedMentors };
    });
  }, [mentees, mentors, matches]);

  const stats = useMemo(() => ({
    activeMentors: mentors.filter(m => m.isActive).length,
    activeMentees: mentees.filter(m => m.isActive).length,
    activeMatches: matches.filter(m => m.status === 'active').length,
    completedMatches: matches.filter(m => m.status === 'completed').length,
  }), [mentors, mentees, matches]);

  const handleCreateMatch = (mentorId: string, menteeId: string, reasons: string[]) => {
    const newMatch: MentorshipMatch = {
      id: `match-${Date.now()}`,
      mentorId,
      menteeId,
      status: 'pending',
      matchScore: 0,
      matchReasons: reasons,
      goals: [],
      meetingCount: 0,
      createdAt: new Date().toISOString(),
    };
    setMatches([...matches, newMatch]);
    
    // Update mentor's current mentees count
    setMentors(mentors.map(m => 
      m.id === mentorId ? { ...m, currentMentees: m.currentMentees + 1 } : m
    ));
    
    toast.success('Mentorship match created! Awaiting confirmation.');
  };

  const handleActivateMatch = (matchId: string) => {
    setMatches(matches.map(m => 
      m.id === matchId ? { ...m, status: 'active', startDate: new Date().toISOString() } : m
    ));
    toast.success('Mentorship activated!');
  };

  const renderMatchesView = () => (
    <Stack spacing={2}>
      {matches.length === 0 ? (
        <Card>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Link2 size={48} style={{ color: 'var(--muted-foreground)', margin: '0 auto 16px' }} />
            <Typography variant="h6" color="text.secondary" mb={1}>No mentorship matches yet</Typography>
            <Typography variant="body2" color="text.secondary">
              Go to "Find Matches" to pair mentors and mentees.
            </Typography>
          </Box>
        </Card>
      ) : (
        matches.map(match => {
          const mentor = getMentorByStaffId(mentors.find(m => m.id === match.mentorId)?.staffId || '');
          const mentee = getMenteeByStaffId(mentees.find(m => m.id === match.menteeId)?.staffId || '');
          const mentorStaff = mentor ? getStaffMember(mentor.staffId) : null;
          const menteeStaff = mentee ? getStaffMember(mentee.staffId) : null;

          return (
            <Card 
              key={match.id} 
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
              onClick={() => {
                setSelectedMatch(match);
                setShowMatchDrawer(true);
              }}
            >
              <Box sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <AvatarGroup max={2}>
                      <Avatar src={mentorStaff?.avatar}>{mentorStaff?.firstName?.[0]}</Avatar>
                      <Avatar src={menteeStaff?.avatar}>{menteeStaff?.firstName?.[0]}</Avatar>
                    </AvatarGroup>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {mentorStaff?.firstName} → {menteeStaff?.firstName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Match Score: {match.matchScore}%
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip 
                    label={mentorshipStatusLabels[match.status]}
                    size="small"
                    color={match.status === 'active' ? 'success' : match.status === 'completed' ? 'info' : 'warning'}
                  />
                </Stack>

                {/* Match Reasons */}
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} mb={2}>
                  {match.matchReasons.slice(0, 3).map((reason, i) => (
                    <Chip key={i} label={reason} size="small" variant="outlined" />
                  ))}
                </Stack>

                {/* Stats */}
                <Stack direction="row" spacing={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Meetings</Typography>
                    <Typography variant="subtitle2" fontWeight={600}>{match.meetingCount}</Typography>
                  </Box>
                  {match.startDate && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Started</Typography>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {new Date(match.startDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                  {match.goals.length > 0 && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Goals</Typography>
                      <Typography variant="subtitle2" fontWeight={600}>{match.goals.length}</Typography>
                    </Box>
                  )}
                </Stack>

                {match.status === 'pending' && (
                  <Button 
                    variant="default" 
                    size="small" 
                    sx={{ mt: 2 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActivateMatch(match.id);
                    }}
                  >
                    <Check size={14} className="mr-1" /> Activate Match
                  </Button>
                )}
              </Box>
            </Card>
          );
        })
      )}
    </Stack>
  );

  const renderMentorsView = () => (
    <Stack spacing={2}>
      <Button variant="outline" size="small" onClick={() => setShowMentorDrawer(true)} sx={{ alignSelf: 'flex-start' }}>
        <UserPlus size={16} className="mr-1" /> Register as Mentor
      </Button>
      
      {mentors.filter(m => m.isActive).map(mentor => {
        const staffMember = getStaffMember(mentor.staffId);
        
        return (
          <Card key={mentor.id}>
            <Box sx={{ p: 2.5 }}>
              <Stack direction="row" alignItems="flex-start" spacing={2}>
                <Avatar src={staffMember?.avatar} sx={{ width: 56, height: 56 }}>
                  {staffMember?.firstName?.[0]}{staffMember?.lastName?.[0]}
                </Avatar>
                <Box flex={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {staffMember?.firstName} {staffMember?.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">{staffMember?.position}</Typography>
                    </Box>
                    <Chip 
                      label={`${mentor.currentMentees}/${mentor.maxMentees} mentees`}
                      size="small"
                      color={mentor.currentMentees < mentor.maxMentees ? 'success' : 'default'}
                    />
                  </Stack>

                  {mentor.bio && (
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      {mentor.bio}
                    </Typography>
                  )}

                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>SKILLS</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} mt={0.5}>
                      {mentor.skills.map((skill, i) => (
                        <Chip key={i} label={skill} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>

                  <Stack direction="row" spacing={3} mt={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Experience</Typography>
                      <Typography variant="body2" fontWeight={600}>{mentor.yearsExperience} years</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Availability</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>{mentor.availability}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Meeting Frequency</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>{mentor.preferredMeetingFrequency}</Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Card>
        );
      })}
    </Stack>
  );

  const renderMenteesView = () => (
    <Stack spacing={2}>
      <Button variant="outline" size="small" onClick={() => setShowMenteeDrawer(true)} sx={{ alignSelf: 'flex-start' }}>
        <UserPlus size={16} className="mr-1" /> Register as Mentee
      </Button>

      {mentees.filter(m => m.isActive).map(mentee => {
        const staffMember = getStaffMember(mentee.staffId);
        const hasActiveMatch = matches.some(m => m.menteeId === mentee.id && m.status === 'active');
        
        return (
          <Card key={mentee.id}>
            <Box sx={{ p: 2.5 }}>
              <Stack direction="row" alignItems="flex-start" spacing={2}>
                <Avatar src={staffMember?.avatar} sx={{ width: 56, height: 56 }}>
                  {staffMember?.firstName?.[0]}{staffMember?.lastName?.[0]}
                </Avatar>
                <Box flex={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {staffMember?.firstName} {staffMember?.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">{staffMember?.position}</Typography>
                    </Box>
                    {hasActiveMatch ? (
                      <Chip label="Has Mentor" size="small" color="success" />
                    ) : (
                      <Chip label="Seeking Mentor" size="small" color="warning" />
                    )}
                  </Stack>

                  {mentee.bio && (
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      {mentee.bio}
                    </Typography>
                  )}

                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>DESIRED SKILLS</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} mt={0.5}>
                      {mentee.desiredSkills.map((skill, i) => (
                        <Chip key={i} label={skill} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>

                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>CAREER GOALS</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} mt={0.5}>
                      {mentee.careerGoals.map((goal, i) => (
                        <Chip key={i} label={goal} size="small" color="primary" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Card>
        );
      })}
    </Stack>
  );

  const renderFindMatchView = () => (
    <Stack spacing={3}>
      {potentialMatches.length === 0 ? (
        <Card>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Sparkles size={48} style={{ color: 'var(--muted-foreground)', margin: '0 auto 16px' }} />
            <Typography variant="h6" color="text.secondary" mb={1}>All mentees are matched!</Typography>
            <Typography variant="body2" color="text.secondary">
              There are no unmatched mentees at this time.
            </Typography>
          </Box>
        </Card>
      ) : (
        potentialMatches.map(({ mentee, potentialMentors }) => {
          const menteeStaff = getStaffMember(mentee.staffId);

          return (
            <Card key={mentee.id}>
              <Box sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                  <Avatar src={menteeStaff?.avatar} sx={{ width: 48, height: 48 }}>
                    {menteeStaff?.firstName?.[0]}{menteeStaff?.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {menteeStaff?.firstName} {menteeStaff?.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Looking for: {mentee.desiredSkills.slice(0, 2).join(', ')}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1.5} display="block">
                  TOP MENTOR MATCHES
                </Typography>

                <Stack spacing={1.5}>
                  {potentialMentors.slice(0, 3).map(({ mentor, score, reasons }) => {
                    const mentorStaff = getStaffMember(mentor.staffId);

                    return (
                      <Box 
                        key={mentor.id}
                        sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, border: 1, borderColor: 'grey.200' }}
                      >
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar src={mentorStaff?.avatar} sx={{ width: 36, height: 36, fontSize: '0.9rem' }}>
                              {mentorStaff?.firstName?.[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {mentorStaff?.firstName} {mentorStaff?.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {mentor.yearsExperience} years exp • {mentor.availability} availability
                              </Typography>
                            </Box>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="caption" color="text.secondary">Match Score</Typography>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Star size={14} style={{ color: score > 70 ? 'var(--warning)' : 'var(--muted-foreground)' }} />
                                <Typography variant="subtitle2" fontWeight={700} color={score > 70 ? 'warning.main' : 'text.secondary'}>
                                  {score}%
                                </Typography>
                              </Stack>
                            </Box>
                            <Button 
                              variant="outline" 
                              size="small"
                              onClick={() => handleCreateMatch(mentor.id, mentee.id, reasons)}
                            >
                              <Link2 size={14} className="mr-1" /> Match
                            </Button>
                          </Stack>
                        </Stack>
                        <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" gap={0.5}>
                          {reasons.slice(0, 2).map((reason, i) => (
                            <Chip key={i} label={reason} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                          ))}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            </Card>
          );
        })
      )}
    </Stack>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} spacing={2}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'primary.light', display: 'flex' }}>
              <Heart size={20} style={{ color: 'var(--primary)' }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Mentorship Matching
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Connect mentors and mentees based on skills, interests, and goals
          </Typography>
        </Box>
      </Stack>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Users size={20} style={{ color: 'var(--primary)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700}>{stats.activeMentors}</Typography>
                <Typography variant="caption" color="text.secondary">Active Mentors</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Target size={20} style={{ color: 'var(--info)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700}>{stats.activeMentees}</Typography>
                <Typography variant="caption" color="text.secondary">Active Mentees</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Link2 size={20} style={{ color: 'var(--success)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700} color="success.main">{stats.activeMatches}</Typography>
                <Typography variant="caption" color="text.secondary">Active Matches</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Check size={20} style={{ color: 'var(--muted-foreground)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700}>{stats.completedMatches}</Typography>
                <Typography variant="caption" color="text.secondary">Completed</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
      </Box>

      {/* View Tabs */}
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Button variant={activeView === 'matches' ? 'default' : 'outline'} size="small" onClick={() => setActiveView('matches')}>
          Active Matches
        </Button>
        <Button variant={activeView === 'find_match' ? 'default' : 'outline'} size="small" onClick={() => setActiveView('find_match')}>
          <Sparkles size={14} className="mr-1" /> Find Matches
        </Button>
        <Button variant={activeView === 'mentors' ? 'default' : 'outline'} size="small" onClick={() => setActiveView('mentors')}>
          Mentors
        </Button>
        <Button variant={activeView === 'mentees' ? 'default' : 'outline'} size="small" onClick={() => setActiveView('mentees')}>
          Mentees
        </Button>
      </Stack>

      {/* Content */}
      {activeView === 'matches' && renderMatchesView()}
      {activeView === 'mentors' && renderMentorsView()}
      {activeView === 'mentees' && renderMenteesView()}
      {activeView === 'find_match' && renderFindMatchView()}

      {/* Drawers would go here for mentor/mentee registration and match details */}
    </Box>
  );
}

export default MentorshipMatchingPanel;
