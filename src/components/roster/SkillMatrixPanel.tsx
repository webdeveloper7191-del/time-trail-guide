import { useState, useMemo, useEffect } from 'react';
import {
  Chip,
} from '@mui/material';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { 
  GraduationCap, 
  Star, 
  Users, 
  Target, 
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Search,
  Zap,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { SkillWeight } from '@/types/advancedRoster';
import { StaffMember, Shift, OpenShift, Centre } from '@/types/roster';
import { 
  rankStaffForShift, 
  getStaffSkillLevels, 
  ShiftSkillRequirement,
  SkillMatchResult,
  autoMatchAllShifts 
} from '@/lib/skillMatcher';

// Extended skill weight with UI properties
interface ExtendedSkillWeight extends SkillWeight {
  isMandatory?: boolean;
  minimumLevel?: number;
}

// Default skill weights for matching
const defaultSkillWeights: ExtendedSkillWeight[] = [
  { skillId: 'skill-1', skillName: 'First Aid', weight: 75, isRequired: true, expiryCheck: true, isMandatory: true, minimumLevel: 3 },
  { skillId: 'skill-2', skillName: 'Child Development', weight: 60, isRequired: false, expiryCheck: false, isMandatory: false, minimumLevel: 2 },
  { skillId: 'skill-3', skillName: 'Special Needs Support', weight: 70, isRequired: false, expiryCheck: true, isMandatory: false, minimumLevel: 2 },
  { skillId: 'skill-4', skillName: 'Behaviour Management', weight: 65, isRequired: false, expiryCheck: false, isMandatory: false, minimumLevel: 2 },
  { skillId: 'skill-5', skillName: 'Curriculum Planning', weight: 55, isRequired: false, expiryCheck: false, isMandatory: false, minimumLevel: 1 },
  { skillId: 'skill-6', skillName: 'Parent Communication', weight: 50, isRequired: false, expiryCheck: false, isMandatory: false, minimumLevel: 1 },
  { skillId: 'skill-7', skillName: 'Leadership', weight: 65, isRequired: false, expiryCheck: false, isMandatory: false, minimumLevel: 2 },
  { skillId: 'skill-8', skillName: 'Food Safety', weight: 45, isRequired: false, expiryCheck: true, isMandatory: false, minimumLevel: 3 },
];

interface StaffSkillProfile {
  staffId: string;
  staffName: string;
  role: string;
  qualifications: string[];
  skills: {
    skillName: string;
    proficiencyLevel: number;
  }[];
  overallScore: number;
}

interface ShiftRequirement {
  id: string;
  shiftName: string;
  roomId: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  requiredSkills: {
    skillName: string;
    minimumProficiency: number;
    weight: number;
    required: boolean;
  }[];
  preferredQualifications: string[];
  matchedStaff: {
    staffId: string;
    staffName: string;
    matchScore: number;
    meetsMandatory: boolean;
  }[];
}

interface SkillMatrixPanelProps {
  centreId?: string;
  centre?: Centre;
  staff?: StaffMember[];
  shifts?: Shift[];
  openShifts?: OpenShift[];
  onAssignStaff?: (staffId: string, shiftId: string) => void;
  onClose?: () => void;
}

export function SkillMatrixPanel({ 
  centreId, 
  centre,
  staff = [], 
  shifts = [],
  openShifts = [],
  onAssignStaff, 
  onClose 
}: SkillMatrixPanelProps) {
  // Helper to get room name from centre
  const getRoomName = (roomId: string) => centre?.rooms.find(r => r.id === roomId)?.name || roomId;
  const [skillWeights, setSkillWeights] = useState<ExtendedSkillWeight[]>(defaultSkillWeights);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWeightEditor, setShowWeightEditor] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<Record<string, SkillMatchResult[]>>({});

  // Build staff skill profiles from real staff data
  const staffProfiles = useMemo<StaffSkillProfile[]>(() => {
    return staff.map(member => {
      const skillLevels = getStaffSkillLevels(member);
      const skills = Object.entries(skillLevels).map(([skillName, level]) => ({
        skillName,
        proficiencyLevel: level,
      }));
      
      // Calculate overall score based on skill levels
      const totalScore = skills.reduce((acc, s) => acc + s.proficiencyLevel, 0);
      const maxPossible = skills.length * 5;
      const overallScore = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 50;
      
      return {
        staffId: member.id,
        staffName: member.name,
        role: member.role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        qualifications: member.qualifications?.map(q => q.name) || [],
        skills,
        overallScore,
      };
    });
  }, [staff]);

  // Build shift requirements from open shifts
  const shiftRequirements = useMemo<ShiftRequirement[]>(() => {
    // Use open shifts as requirements that need staff assignment
    return openShifts.map(os => {
      const roomName = getRoomName(os.roomId);
      const requirement: ShiftSkillRequirement = {
        shiftId: os.id,
        roomId: os.roomId,
        roomName: roomName,
        date: os.date,
        startTime: os.startTime,
        endTime: os.endTime,
        requiredQualifications: os.requiredQualifications || [],
        preferredSkills: skillWeights.filter(sw => sw.isRequired || sw.weight > 60).map(sw => ({
          skillName: sw.skillName,
          minimumLevel: sw.minimumLevel || 2,
          weight: sw.weight,
          isMandatory: sw.isMandatory || false,
        })),
      };
      
      // Get real match results for this shift
      const ranked = matchResults[os.id] || rankStaffForShift(staff, requirement, skillWeights, shifts);
      
      return {
        id: os.id,
        shiftName: `${os.startTime} - ${os.endTime}`,
        roomId: os.roomId,
        roomName: roomName,
        date: os.date,
        startTime: os.startTime,
        endTime: os.endTime,
        requiredSkills: requirement.preferredSkills.map(ps => ({
          skillName: ps.skillName,
          minimumProficiency: ps.minimumLevel,
          weight: ps.weight,
          required: ps.isMandatory,
        })),
        preferredQualifications: os.requiredQualifications?.map(q => q.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())) || [],
        matchedStaff: ranked.slice(0, 5).map(r => ({
          staffId: r.staffId,
          staffName: r.staffName,
          matchScore: r.matchScore,
          meetsMandatory: r.meetsMandatory,
        })),
      };
    });
  }, [openShifts, staff, shifts, skillWeights, matchResults]);

  const filteredStaff = useMemo(() => {
    let filtered = [...staffProfiles];
    
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => b.overallScore - a.overallScore);
  }, [staffProfiles, searchQuery]);

  const handleWeightChange = (skillId: string, newWeight: number) => {
    setSkillWeights(prev => prev.map(sw => 
      sw.skillId === skillId ? { ...sw, weight: newWeight } : sw
    ));
  };

  const handleAutoMatch = async () => {
    if (staff.length === 0) {
      toast.error('No staff available for matching');
      return;
    }
    
    if (openShifts.length === 0) {
      toast.info('No open shifts require matching');
      return;
    }
    
    setIsMatching(true);
    toast.info('Running skill-based matching algorithm...');
    
    // Simulate processing time for UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Build requirements from open shifts
    const requirements: ShiftSkillRequirement[] = openShifts.map(os => ({
      shiftId: os.id,
      roomId: os.roomId,
      roomName: getRoomName(os.roomId),
      date: os.date,
      startTime: os.startTime,
      endTime: os.endTime,
      requiredQualifications: os.requiredQualifications || [],
      preferredSkills: skillWeights.filter(sw => sw.isRequired || sw.weight > 60).map(sw => ({
        skillName: sw.skillName,
        minimumLevel: sw.minimumLevel || 2,
        weight: sw.weight,
        isMandatory: sw.isMandatory || false,
      })),
    }));
    
    // Calculate match results for each requirement
    const newResults: Record<string, SkillMatchResult[]> = {};
    requirements.forEach(req => {
      newResults[req.shiftId] = rankStaffForShift(staff, req, skillWeights, shifts);
    });
    
    setMatchResults(newResults);
    setIsMatching(false);
    
    const matchedCount = Object.values(newResults).filter(r => r.some(m => m.meetsMandatory && m.matchScore >= 50)).length;
    toast.success(`Matching complete - ${matchedCount} of ${requirements.length} shifts have qualified matches`);
  };

  const handleAssignTopMatch = (shiftReqId: string) => {
    const req = shiftRequirements.find(r => r.id === shiftReqId);
    if (req && req.matchedStaff.length > 0) {
      const topMatch = req.matchedStaff[0];
      if (!topMatch.meetsMandatory) {
        toast.warning(`${topMatch.staffName} does not meet all mandatory requirements`);
      }
      onAssignStaff?.(topMatch.staffId, shiftReqId);
      toast.success(`Assigned ${topMatch.staffName} to ${req.roomName} shift`);
    }
  };

  const getProficiencyLabel = (level: number) => {
    switch (level) {
      case 1: return 'Beginner';
      case 2: return 'Basic';
      case 3: return 'Intermediate';
      case 4: return 'Advanced';
      case 5: return 'Expert';
      default: return 'Unknown';
    }
  };

  const getProficiencyColor = (level: number) => {
    if (level >= 4) return 'text-green-600';
    if (level >= 3) return 'text-yellow-600';
    return 'text-orange-600';
  };

  // Track unique skills from staff
  const uniqueSkills = useMemo(() => {
    const allSkills = new Set<string>();
    staffProfiles.forEach(sp => {
      sp.skills.forEach(s => allSkills.add(s.skillName));
    });
    return allSkills.size;
  }, [staffProfiles]);

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Staff Assessed</p>
                <p className="text-lg font-semibold">{staffProfiles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Skills Tracked</p>
                <p className="text-lg font-semibold">{uniqueSkills}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Open Shifts</p>
                <p className="text-lg font-semibold">{shiftRequirements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">Avg Skill Score</p>
                <p className="text-lg font-semibold">
                  {staffProfiles.length > 0 
                    ? Math.round(staffProfiles.reduce((acc, s) => acc + s.overallScore, 0) / staffProfiles.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Match Action */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Skill-Based Assignment</CardTitle>
              <CardDescription>Match staff to shifts using weighted skill matrix</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowWeightEditor(!showWeightEditor)}>
                <Settings className="h-4 w-4 mr-1" />
                Weights
              </Button>
              <Button onClick={handleAutoMatch} size="sm" disabled={isMatching}>
                {isMatching ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-1" />
                )}
                Auto-Match All
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Skill Weights Editor */}
      {showWeightEditor && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Skill Weight Configuration</CardTitle>
            <CardDescription>Adjust importance of each skill in matching algorithm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {skillWeights.map(sw => (
                <div key={sw.skillId} className="flex items-center gap-4">
                  <div className="w-40">
                    <p className="text-sm font-medium">{sw.skillName}</p>
                    {sw.isMandatory && (
                      <Badge variant="destructive" className="text-[10px]">Required</Badge>
                    )}
                  </div>
                  <div className="flex-1">
                    <Slider
                      value={[sw.weight]}
                      min={0}
                      max={100}
                      step={5}
                      onValueChange={([val]) => handleWeightChange(sw.skillId, val)}
                    />
                  </div>
                  <span className="w-12 text-sm text-right">{sw.weight}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shift Requirements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Open Shift Requirements & Matches</CardTitle>
          <CardDescription>
            {shiftRequirements.length > 0 
              ? 'View skill requirements and best-matched staff for each shift'
              : 'No open shifts requiring assignment'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shiftRequirements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No open shifts available</p>
              <p className="text-sm">Create open shifts to see skill-based matching</p>
            </div>
          ) : (
            <ScrollArea className="h-[280px]">
              <div className="space-y-4">
                {shiftRequirements.map(req => (
                  <div key={req.id} className="p-4 rounded-lg border bg-background">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium">{req.roomName}</p>
                        <p className="text-xs text-muted-foreground">{req.shiftName} • {req.date}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleAssignTopMatch(req.id)}
                        disabled={req.matchedStaff.length === 0}
                      >
                        Assign Top Match
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {req.requiredSkills.map(skill => (
                        <Badge 
                          key={skill.skillName} 
                          variant={skill.required ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {skill.skillName} ≥{skill.minimumProficiency}
                          {skill.required && ' *'}
                        </Badge>
                      ))}
                    </div>
                    
                    <Separator className="my-2" />
                    
                    <div className="space-y-2">
                      {req.matchedStaff.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">Click "Auto-Match All" to find suitable staff</p>
                      ) : (
                        req.matchedStaff.slice(0, 3).map((match, idx) => (
                          <div 
                            key={match.staffId} 
                            className={`flex items-center justify-between p-2 rounded ${
                              idx === 0 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {idx === 0 && <Star className="h-4 w-4 text-yellow-500" />}
                              <span className="text-sm font-medium">{match.staffName}</span>
                              {match.meetsMandatory ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 text-yellow-600" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={match.matchScore} className="w-16 h-2" />
                              <span className={`text-sm font-medium ${
                                match.matchScore >= 90 ? 'text-green-600' : 
                                match.matchScore >= 75 ? 'text-yellow-600' : 'text-orange-600'
                              }`}>
                                {match.matchScore}%
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Staff Skill Profiles */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Staff Skill Profiles</CardTitle>
              <CardDescription>Individual skill assessments from qualifications</CardDescription>
            </div>
            <div className="relative w-48">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No staff data available</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {filteredStaff.map(profile => (
                  <div key={profile.staffId} className="p-4 rounded-lg border bg-background">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{profile.staffName}</p>
                        <p className="text-xs text-muted-foreground">{profile.role}</p>
                      </div>
                      <Badge 
                        variant={profile.overallScore >= 75 ? 'default' : profile.overallScore >= 50 ? 'secondary' : 'outline'}
                      >
                        {profile.overallScore}% Overall
                      </Badge>
                    </div>
                    
                    {profile.qualifications.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {profile.qualifications.slice(0, 3).map(qual => (
                          <Chip key={qual} label={qual} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        ))}
                        {profile.qualifications.length > 3 && (
                          <Chip label={`+${profile.qualifications.length - 3}`} size="small" />
                        )}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {profile.skills.slice(0, 6).map(skill => (
                        <div key={skill.skillName} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground truncate mr-2">{skill.skillName}</span>
                          <span className={`font-medium ${getProficiencyColor(skill.proficiencyLevel)}`}>
                            {getProficiencyLabel(skill.proficiencyLevel)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
