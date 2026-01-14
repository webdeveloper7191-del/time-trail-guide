import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { SkillWeight } from '@/types/advancedRoster';

interface StaffSkillProfile {
  staffId: string;
  staffName: string;
  role: string;
  qualifications: string[];
  skills: {
    skillName: string;
    proficiencyLevel: number;
    yearsExperience: number;
    lastAssessed: string;
    certifications?: string[];
  }[];
  overallScore: number;
  matchScore?: number;
}

interface ShiftRequirement {
  id: string;
  shiftName: string;
  roomId: string;
  roomName: string;
  date: string;
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

// Extended skill weight with UI properties
interface ExtendedSkillWeight extends SkillWeight {
  isMandatory?: boolean;
  minimumLevel?: number;
}

// Mock skill weights
const mockSkillWeights: ExtendedSkillWeight[] = [
  { skillId: 'skill-1', skillName: 'First Aid', weight: 75, isRequired: true, expiryCheck: true, isMandatory: true, minimumLevel: 3 },
  { skillId: 'skill-2', skillName: 'Child Development', weight: 60, isRequired: false, expiryCheck: false, isMandatory: false, minimumLevel: 2 },
  { skillId: 'skill-3', skillName: 'Special Needs Support', weight: 70, isRequired: false, expiryCheck: true, isMandatory: false, minimumLevel: 2 },
  { skillId: 'skill-4', skillName: 'Behaviour Management', weight: 65, isRequired: false, expiryCheck: false, isMandatory: false, minimumLevel: 2 },
  { skillId: 'skill-5', skillName: 'Curriculum Planning', weight: 55, isRequired: false, expiryCheck: false, isMandatory: false, minimumLevel: 1 },
  { skillId: 'skill-6', skillName: 'Parent Communication', weight: 50, isRequired: false, expiryCheck: false, isMandatory: false, minimumLevel: 1 },
];

// Mock staff skill profiles
const mockStaffProfiles: StaffSkillProfile[] = [
  {
    staffId: 'staff-1',
    staffName: 'Sarah Johnson',
    role: 'Lead Educator',
    qualifications: ['Diploma in Early Childhood', 'First Aid Certificate', 'Working with Children Check'],
    skills: [
      { skillName: 'First Aid', proficiencyLevel: 5, yearsExperience: 8, lastAssessed: '2024-01-01' },
      { skillName: 'Child Development', proficiencyLevel: 4, yearsExperience: 8, lastAssessed: '2024-01-01' },
      { skillName: 'Special Needs Support', proficiencyLevel: 4, yearsExperience: 5, lastAssessed: '2023-11-15' },
      { skillName: 'Behaviour Management', proficiencyLevel: 5, yearsExperience: 8, lastAssessed: '2024-01-01' },
      { skillName: 'Curriculum Planning', proficiencyLevel: 4, yearsExperience: 6, lastAssessed: '2023-12-01' },
    ],
    overallScore: 92,
  },
  {
    staffId: 'staff-2',
    staffName: 'Mike Chen',
    role: 'Educator',
    qualifications: ['Certificate III in Early Childhood', 'First Aid Certificate'],
    skills: [
      { skillName: 'First Aid', proficiencyLevel: 4, yearsExperience: 3, lastAssessed: '2024-01-05' },
      { skillName: 'Child Development', proficiencyLevel: 3, yearsExperience: 3, lastAssessed: '2024-01-05' },
      { skillName: 'Behaviour Management', proficiencyLevel: 3, yearsExperience: 3, lastAssessed: '2023-12-20' },
      { skillName: 'Parent Communication', proficiencyLevel: 4, yearsExperience: 3, lastAssessed: '2024-01-05' },
    ],
    overallScore: 74,
  },
  {
    staffId: 'staff-3',
    staffName: 'Emma Wilson',
    role: 'Assistant Educator',
    qualifications: ['Certificate III in Early Childhood'],
    skills: [
      { skillName: 'First Aid', proficiencyLevel: 3, yearsExperience: 2, lastAssessed: '2023-12-15' },
      { skillName: 'Child Development', proficiencyLevel: 3, yearsExperience: 2, lastAssessed: '2023-12-15' },
      { skillName: 'Special Needs Support', proficiencyLevel: 2, yearsExperience: 1, lastAssessed: '2023-12-15' },
    ],
    overallScore: 58,
  },
  {
    staffId: 'staff-4',
    staffName: 'James Brown',
    role: 'Educator',
    qualifications: ['Diploma in Early Childhood', 'First Aid Certificate', 'Special Needs Training'],
    skills: [
      { skillName: 'First Aid', proficiencyLevel: 4, yearsExperience: 5, lastAssessed: '2024-01-10' },
      { skillName: 'Child Development', proficiencyLevel: 4, yearsExperience: 5, lastAssessed: '2024-01-10' },
      { skillName: 'Special Needs Support', proficiencyLevel: 5, yearsExperience: 5, lastAssessed: '2024-01-10' },
      { skillName: 'Behaviour Management', proficiencyLevel: 4, yearsExperience: 5, lastAssessed: '2024-01-10' },
    ],
    overallScore: 85,
  },
];

// Mock shift requirements
const mockShiftRequirements: ShiftRequirement[] = [
  {
    id: 'shift-req-1',
    shiftName: 'Morning Shift - Babies Room',
    roomId: 'room-1',
    roomName: 'Babies Room',
    date: '2024-01-15',
    requiredSkills: [
      { skillName: 'First Aid', minimumProficiency: 3, weight: 1.5, required: true },
      { skillName: 'Child Development', minimumProficiency: 2, weight: 1.2, required: false },
    ],
    preferredQualifications: ['Diploma in Early Childhood'],
    matchedStaff: [
      { staffId: 'staff-1', staffName: 'Sarah Johnson', matchScore: 98, meetsMandatory: true },
      { staffId: 'staff-4', staffName: 'James Brown', matchScore: 89, meetsMandatory: true },
      { staffId: 'staff-2', staffName: 'Mike Chen', matchScore: 76, meetsMandatory: true },
    ],
  },
  {
    id: 'shift-req-2',
    shiftName: 'Afternoon Shift - Toddlers Room',
    roomId: 'room-2',
    roomName: 'Toddlers Room',
    date: '2024-01-15',
    requiredSkills: [
      { skillName: 'First Aid', minimumProficiency: 3, weight: 1.5, required: true },
      { skillName: 'Behaviour Management', minimumProficiency: 3, weight: 1.3, required: true },
      { skillName: 'Special Needs Support', minimumProficiency: 2, weight: 1.4, required: false },
    ],
    preferredQualifications: ['Special Needs Training'],
    matchedStaff: [
      { staffId: 'staff-4', staffName: 'James Brown', matchScore: 95, meetsMandatory: true },
      { staffId: 'staff-1', staffName: 'Sarah Johnson', matchScore: 92, meetsMandatory: true },
    ],
  },
];

interface SkillMatrixPanelProps {
  centreId?: string;
  onAssignStaff?: (staffId: string, shiftId: string) => void;
  onClose?: () => void;
}

export function SkillMatrixPanel({ centreId, onAssignStaff, onClose }: SkillMatrixPanelProps) {
  const [skillWeights, setSkillWeights] = useState<ExtendedSkillWeight[]>(mockSkillWeights);
  const [staffProfiles, setStaffProfiles] = useState<StaffSkillProfile[]>(mockStaffProfiles);
  const [shiftRequirements, setShiftRequirements] = useState<ShiftRequirement[]>(mockShiftRequirements);
  const [selectedShiftReq, setSelectedShiftReq] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByMandatory, setFilterByMandatory] = useState(false);
  const [showWeightEditor, setShowWeightEditor] = useState(false);

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

  const handleAutoMatch = () => {
    toast.info('Running skill-based matching algorithm...');
    
    setTimeout(() => {
      // Simulate recalculating match scores
      setShiftRequirements(prev => prev.map(req => ({
        ...req,
        matchedStaff: req.matchedStaff.map(ms => ({
          ...ms,
          matchScore: Math.min(100, ms.matchScore + Math.floor(Math.random() * 5)),
        })).sort((a, b) => b.matchScore - a.matchScore),
      })));
      toast.success('Matching complete - staff ranked by skill compatibility');
    }, 1500);
  };

  const handleAssignTopMatch = (shiftReqId: string) => {
    const req = shiftRequirements.find(r => r.id === shiftReqId);
    if (req && req.matchedStaff.length > 0) {
      const topMatch = req.matchedStaff[0];
      onAssignStaff?.(topMatch.staffId, shiftReqId);
      toast.success(`Assigned ${topMatch.staffName} to ${req.shiftName}`);
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

  return (
    <div className="space-y-4 p-4">
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
                <p className="text-lg font-semibold">{skillWeights.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Open Requirements</p>
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
                <p className="text-xs text-muted-foreground">Avg Match Score</p>
                <p className="text-lg font-semibold">
                  {Math.round(staffProfiles.reduce((acc, s) => acc + s.overallScore, 0) / staffProfiles.length)}%
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
              <Button onClick={handleAutoMatch} size="sm">
                <Zap className="h-4 w-4 mr-1" />
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
          <CardTitle className="text-base">Shift Requirements & Matches</CardTitle>
          <CardDescription>View skill requirements and best-matched staff for each shift</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[280px]">
            <div className="space-y-4">
              {shiftRequirements.map(req => (
                <div key={req.id} className="p-4 rounded-lg border bg-background">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium">{req.shiftName}</p>
                      <p className="text-xs text-muted-foreground">{req.roomName} • {req.date}</p>
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
                    {req.matchedStaff.slice(0, 3).map((match, idx) => (
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
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Staff Skill Profiles */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Staff Skill Profiles</CardTitle>
              <CardDescription>Individual skill assessments and proficiency levels</CardDescription>
            </div>
            <div className="relative w-48">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search staff..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {filteredStaff.map(staff => (
                <div key={staff.staffId} className="p-4 rounded-lg border bg-background">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{staff.staffName}</p>
                        <Badge variant="outline">{staff.role}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {staff.qualifications.slice(0, 3).map(qual => (
                          <Chip key={qual} label={qual} size="small" variant="outlined" />
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{staff.overallScore}%</p>
                      <p className="text-xs text-muted-foreground">Overall Score</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {staff.skills.map(skill => (
                      <div key={skill.skillName} className="p-2 rounded bg-muted/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{skill.skillName}</span>
                          <span className={`text-xs font-medium ${getProficiencyColor(skill.proficiencyLevel)}`}>
                            {skill.proficiencyLevel}/5
                          </span>
                        </div>
                        <Progress value={skill.proficiencyLevel * 20} className="h-1.5" />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {getProficiencyLabel(skill.proficiencyLevel)} • {skill.yearsExperience}y exp
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
