import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/mui/Button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, MapPin, Clock, Star, Shield, AlertTriangle, 
  CheckCircle2, Zap, UserPlus, ChevronRight, Loader2,
  TrendingUp, Target, Navigation
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShiftRequest, CandidateMatch, Placement } from '@/types/agency';
import { mockCandidates } from '@/data/mockAgencyData';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface ShiftMatchingPanelProps {
  shiftRequest: ShiftRequest;
  onAssign: (placements: Partial<Placement>[]) => void;
  onClose: () => void;
}

const ShiftMatchingPanel = ({ shiftRequest, onAssign, onClose }: ShiftMatchingPanelProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<CandidateMatch[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [backupCandidates, setBackupCandidates] = useState<Set<string>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);

  const positionsNeeded = shiftRequest.totalPositions - shiftRequest.filledPositions;

  useEffect(() => {
    // Simulate AI matching
    const loadMatches = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1200));

      const candidateMatches: CandidateMatch[] = mockCandidates
        .filter(c => c.status === 'available')
        .map(candidate => {
          // Simulate matching scores
          const skillMatch = Math.floor(Math.random() * 30 + 70);
          const proximityMatch = Math.floor(Math.random() * 25 + 75);
          const availabilityMatch = Math.floor(Math.random() * 20 + 80);
          const matchScore = Math.floor(
            (skillMatch * 0.35 + proximityMatch * 0.25 + availabilityMatch * 0.2 + candidate.reliabilityScore * 0.2)
          );

          return {
            candidateId: candidate.id,
            candidate,
            matchScore,
            skillMatch,
            proximityMatch,
            availabilityMatch,
            reliabilityScore: candidate.reliabilityScore,
            isEligible: candidate.complianceScore >= 90 && candidate.reliabilityScore >= 80,
            ineligibilityReasons: candidate.complianceScore < 90 
              ? ['Compliance score below 90%'] 
              : candidate.reliabilityScore < 80 
                ? ['Reliability score below 80%'] 
                : undefined,
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore);

      setMatches(candidateMatches);
      setIsLoading(false);
    };

    loadMatches();
  }, [shiftRequest.id]);

  const toggleCandidate = (candidateId: string, isBackup: boolean = false) => {
    if (isBackup) {
      setBackupCandidates(prev => {
        const next = new Set(prev);
        if (next.has(candidateId)) {
          next.delete(candidateId);
        } else {
          next.add(candidateId);
          // Remove from primary if adding to backup
          setSelectedCandidates(s => {
            const ns = new Set(s);
            ns.delete(candidateId);
            return ns;
          });
        }
        return next;
      });
    } else {
      setSelectedCandidates(prev => {
        const next = new Set(prev);
        if (next.has(candidateId)) {
          next.delete(candidateId);
        } else {
          if (next.size < positionsNeeded) {
            next.add(candidateId);
            // Remove from backup if adding to primary
            setBackupCandidates(b => {
              const nb = new Set(b);
              nb.delete(candidateId);
              return nb;
            });
          } else {
            toast.error(`Maximum ${positionsNeeded} positions available`);
          }
        }
        return next;
      });
    }
  };

  const handleQuickAssign = () => {
    // Auto-select top candidates
    const topEligible = matches
      .filter(m => m.isEligible)
      .slice(0, positionsNeeded);
    
    setSelectedCandidates(new Set(topEligible.map(m => m.candidateId)));
    toast.success(`Auto-selected top ${topEligible.length} candidates`);
  };

  const handleAssign = async () => {
    if (selectedCandidates.size === 0) {
      toast.error('Please select at least one candidate');
      return;
    }

    setIsAssigning(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const placements: Partial<Placement>[] = [
      ...Array.from(selectedCandidates).map(candidateId => ({
        shiftRequestId: shiftRequest.id,
        candidateId,
        candidate: mockCandidates.find(c => c.id === candidateId)!,
        scheduledStart: `${shiftRequest.date}T${shiftRequest.startTime}:00Z`,
        scheduledEnd: `${shiftRequest.date}T${shiftRequest.endTime}:00Z`,
        breakMinutes: shiftRequest.breakMinutes,
        isBackup: false,
        status: 'pending' as const,
      })),
      ...Array.from(backupCandidates).map((candidateId, idx) => ({
        shiftRequestId: shiftRequest.id,
        candidateId,
        candidate: mockCandidates.find(c => c.id === candidateId)!,
        scheduledStart: `${shiftRequest.date}T${shiftRequest.startTime}:00Z`,
        scheduledEnd: `${shiftRequest.date}T${shiftRequest.endTime}:00Z`,
        breakMinutes: shiftRequest.breakMinutes,
        isBackup: true,
        backupPriority: idx + 1,
        status: 'pending' as const,
      })),
    ];

    onAssign(placements);
    setIsAssigning(false);
    toast.success(`Assigned ${selectedCandidates.size} candidate(s) + ${backupCandidates.size} backup(s)`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 75) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-orange-100 dark:bg-orange-900/30';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Shift Summary */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{shiftRequest.clientName}</CardTitle>
              <CardDescription>{shiftRequest.locationName}</CardDescription>
            </div>
            <Badge variant={shiftRequest.urgency === 'critical' ? 'destructive' : shiftRequest.urgency === 'urgent' ? 'default' : 'secondary'}>
              {shiftRequest.urgency}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {format(parseISO(shiftRequest.date), 'MMM d')} • {shiftRequest.startTime} - {shiftRequest.endTime}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              {positionsNeeded} position{positionsNeeded !== 1 ? 's' : ''} needed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={(shiftRequest.filledPositions / shiftRequest.totalPositions) * 100} className="h-2 flex-1" />
            <span className="text-sm font-medium">{shiftRequest.filledPositions}/{shiftRequest.totalPositions}</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleQuickAssign}
          disabled={isLoading}
          className="flex-1"
        >
          <Zap className="h-4 w-4 mr-2" />
          Quick Assign Top {positionsNeeded}
        </Button>
      </div>

      {/* Selection Summary */}
      {(selectedCandidates.size > 0 || backupCandidates.size > 0) && (
        <Card className="mb-4 bg-primary/5 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {selectedCandidates.size} selected
                </span>
                {backupCandidates.size > 0 && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {backupCandidates.size} backup(s)
                  </span>
                )}
              </div>
              <Button
                variant="contained"
                size="small"
                onClick={handleAssign}
                disabled={isAssigning || selectedCandidates.size === 0}
              >
                {isAssigning ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Assign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Candidate List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>AI matching candidates...</p>
          </div>
        ) : (
          <div className="space-y-3 pr-4">
            {matches.map((match, idx) => {
              const isSelected = selectedCandidates.has(match.candidateId);
              const isBackup = backupCandidates.has(match.candidateId);
              
              return (
                <Card 
                  key={match.candidateId}
                  className={cn(
                    "transition-all cursor-pointer",
                    isSelected && "border-primary bg-primary/5",
                    isBackup && "border-orange-400 bg-orange-50 dark:bg-orange-950/20",
                    !match.isEligible && "opacity-60"
                  )}
                  onClick={() => match.isEligible && toggleCandidate(match.candidateId)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Rank & Avatar */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {match.candidate.firstName[0]}{match.candidate.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">
                            {match.candidate.firstName} {match.candidate.lastName}
                          </span>
                          {isSelected && <Badge variant="default" className="text-xs">Selected</Badge>}
                          {isBackup && <Badge variant="outline" className="text-xs border-orange-400 text-orange-600">Backup</Badge>}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {match.candidate.primaryRole} • {match.candidate.yearsExperience}y exp
                        </p>

                        {/* Score Breakdown */}
                        <div className="flex flex-wrap gap-2">
                          <div className={cn("px-2 py-0.5 rounded text-xs font-medium", getScoreBg(match.matchScore), getScoreColor(match.matchScore))}>
                            <Target className="h-3 w-3 inline mr-1" />
                            {match.matchScore}% match
                          </div>
                          <div className="px-2 py-0.5 rounded text-xs bg-muted">
                            <Star className="h-3 w-3 inline mr-1" />
                            {match.candidate.averageRating.toFixed(1)}
                          </div>
                          <div className="px-2 py-0.5 rounded text-xs bg-muted">
                            <Shield className="h-3 w-3 inline mr-1" />
                            {match.reliabilityScore}%
                          </div>
                        </div>

                        {/* Ineligibility Warning */}
                        {!match.isEligible && match.ineligibilityReasons && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-destructive">
                            <AlertTriangle className="h-3 w-3" />
                            {match.ineligibilityReasons[0]}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        {match.isEligible && (
                          <>
                            <Button
                              variant={isSelected ? 'contained' : 'outlined'}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCandidate(match.candidateId, false);
                              }}
                              className="text-xs"
                            >
                              {isSelected ? <CheckCircle2 className="h-3 w-3" /> : 'Select'}
                            </Button>
                            <Button
                              variant={isBackup ? 'contained' : 'ghost'}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCandidate(match.candidateId, true);
                              }}
                              className={cn("text-xs", isBackup && "bg-orange-500 hover:bg-orange-600")}
                            >
                              {isBackup ? 'Backup' : 'As Backup'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Expanded Score Details (for top matches) */}
                    {idx < 3 && (
                      <div className="mt-3 pt-3 border-t grid grid-cols-4 gap-2 text-xs">
                        <div className="text-center">
                          <div className={cn("font-bold", getScoreColor(match.skillMatch))}>
                            {match.skillMatch}%
                          </div>
                          <div className="text-muted-foreground">Skills</div>
                        </div>
                        <div className="text-center">
                          <div className={cn("font-bold", getScoreColor(match.proximityMatch))}>
                            {match.proximityMatch}%
                          </div>
                          <div className="text-muted-foreground">Proximity</div>
                        </div>
                        <div className="text-center">
                          <div className={cn("font-bold", getScoreColor(match.availabilityMatch))}>
                            {match.availabilityMatch}%
                          </div>
                          <div className="text-muted-foreground">Availability</div>
                        </div>
                        <div className="text-center">
                          <div className={cn("font-bold", getScoreColor(match.reliabilityScore))}>
                            {match.reliabilityScore}%
                          </div>
                          <div className="text-muted-foreground">Reliability</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ShiftMatchingPanel;
