import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/mui/Button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { FormSection } from '@/components/ui/off-canvas/FormSection';
import { 
  Users, Clock, Star, Shield, AlertTriangle, 
  CheckCircle2, Zap, UserPlus, Loader2,
  Target
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
  open?: boolean;
}

const ShiftMatchingPanel = ({ shiftRequest, onAssign, onClose, open = true }: ShiftMatchingPanelProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState<CandidateMatch[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [backupCandidates, setBackupCandidates] = useState<Set<string>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);

  const positionsNeeded = shiftRequest.totalPositions - shiftRequest.filledPositions;

  useEffect(() => {
    const loadMatches = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1200));
      const candidateMatches: CandidateMatch[] = mockCandidates
        .filter(c => c.status === 'available')
        .map(candidate => {
          const skillMatch = Math.floor(Math.random() * 30 + 70);
          const proximityMatch = Math.floor(Math.random() * 25 + 75);
          const availabilityMatch = Math.floor(Math.random() * 20 + 80);
          const matchScore = Math.floor((skillMatch * 0.35 + proximityMatch * 0.25 + availabilityMatch * 0.2 + candidate.reliabilityScore * 0.2));
          return {
            candidateId: candidate.id, candidate, matchScore, skillMatch, proximityMatch, availabilityMatch,
            reliabilityScore: candidate.reliabilityScore,
            isEligible: candidate.complianceScore >= 90 && candidate.reliabilityScore >= 80,
            ineligibilityReasons: candidate.complianceScore < 90 ? ['Compliance score below 90%'] : candidate.reliabilityScore < 80 ? ['Reliability score below 80%'] : undefined,
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
      setBackupCandidates(prev => { const next = new Set(prev); if (next.has(candidateId)) { next.delete(candidateId); } else { next.add(candidateId); setSelectedCandidates(s => { const ns = new Set(s); ns.delete(candidateId); return ns; }); } return next; });
    } else {
      setSelectedCandidates(prev => { const next = new Set(prev); if (next.has(candidateId)) { next.delete(candidateId); } else { if (next.size < positionsNeeded) { next.add(candidateId); setBackupCandidates(b => { const nb = new Set(b); nb.delete(candidateId); return nb; }); } else { toast.error(`Maximum ${positionsNeeded} positions available`); } } return next; });
    }
  };

  const handleQuickAssign = () => {
    const topEligible = matches.filter(m => m.isEligible).slice(0, positionsNeeded);
    setSelectedCandidates(new Set(topEligible.map(m => m.candidateId)));
    toast.success(`Auto-selected top ${topEligible.length} candidates`);
  };

  const handleAssign = async () => {
    if (selectedCandidates.size === 0) { toast.error('Please select at least one candidate'); return; }
    setIsAssigning(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const placements: Partial<Placement>[] = [
      ...Array.from(selectedCandidates).map(candidateId => ({ shiftRequestId: shiftRequest.id, candidateId, candidate: mockCandidates.find(c => c.id === candidateId)!, scheduledStart: `${shiftRequest.date}T${shiftRequest.startTime}:00Z`, scheduledEnd: `${shiftRequest.date}T${shiftRequest.endTime}:00Z`, breakMinutes: shiftRequest.breakMinutes, isBackup: false, status: 'pending' as const })),
      ...Array.from(backupCandidates).map((candidateId, idx) => ({ shiftRequestId: shiftRequest.id, candidateId, candidate: mockCandidates.find(c => c.id === candidateId)!, scheduledStart: `${shiftRequest.date}T${shiftRequest.startTime}:00Z`, scheduledEnd: `${shiftRequest.date}T${shiftRequest.endTime}:00Z`, breakMinutes: shiftRequest.breakMinutes, isBackup: true, backupPriority: idx + 1, status: 'pending' as const })),
    ];
    onAssign(placements);
    setIsAssigning(false);
    toast.success(`Assigned ${selectedCandidates.size} candidate(s) + ${backupCandidates.size} backup(s)`);
  };

  const getScoreColor = (score: number) => score >= 90 ? 'text-green-600' : score >= 75 ? 'text-yellow-600' : 'text-orange-600';
  const getScoreBg = (score: number) => score >= 90 ? 'bg-green-100 dark:bg-green-900/30' : score >= 75 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-orange-100 dark:bg-orange-900/30';

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title={`Match Candidates - ${shiftRequest.clientName}`}
      description={`${shiftRequest.locationName} · ${format(parseISO(shiftRequest.date), 'MMM d')} · ${shiftRequest.startTime}-${shiftRequest.endTime}`}
      icon={Zap}
      size="xl"
      isBackground
      actions={[
        { label: 'Cancel', variant: 'outlined', onClick: onClose },
        { label: isAssigning ? 'Assigning...' : `Assign (${selectedCandidates.size})`, variant: 'primary', onClick: handleAssign, disabled: isAssigning || selectedCandidates.size === 0, icon: <UserPlus className="h-4 w-4" /> },
      ]}
    >
      {/* Shift Summary */}
      <FormSection title="Shift Details">
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-muted-foreground" />{format(parseISO(shiftRequest.date), 'MMM d')} • {shiftRequest.startTime} - {shiftRequest.endTime}</span>
          <span className="flex items-center gap-1"><Users className="h-4 w-4 text-muted-foreground" />{positionsNeeded} position{positionsNeeded !== 1 ? 's' : ''} needed</span>
          <Badge variant={shiftRequest.urgency === 'critical' ? 'destructive' : shiftRequest.urgency === 'urgent' ? 'default' : 'secondary'}>{shiftRequest.urgency}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={(shiftRequest.filledPositions / shiftRequest.totalPositions) * 100} className="h-2 flex-1" />
          <span className="text-sm font-medium">{shiftRequest.filledPositions}/{shiftRequest.totalPositions}</span>
        </div>
      </FormSection>

      {/* Quick Actions */}
      <Button variant="outlined" size="small" onClick={handleQuickAssign} disabled={isLoading} className="w-full">
        <Zap className="h-4 w-4 mr-2" />Quick Assign Top {positionsNeeded}
      </Button>

      {/* Selection Summary */}
      {(selectedCandidates.size > 0 || backupCandidates.size > 0) && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-primary" />{selectedCandidates.size} selected</span>
            {backupCandidates.size > 0 && <span className="flex items-center gap-1 text-muted-foreground"><Users className="h-4 w-4" />{backupCandidates.size} backup(s)</span>}
          </div>
        </div>
      )}

      {/* Candidate List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4" /><p>AI matching candidates...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match, idx) => {
            const isSelected = selectedCandidates.has(match.candidateId);
            const isBackup = backupCandidates.has(match.candidateId);
            return (
              <div key={match.candidateId} className={cn('rounded-lg border p-4 transition-all cursor-pointer bg-background', isSelected && 'border-primary bg-primary/5', isBackup && 'border-orange-400 bg-orange-50 dark:bg-orange-950/20', !match.isEligible && 'opacity-60')} onClick={() => match.isEligible && toggleCandidate(match.candidateId)}>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                    <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/10 text-primary text-sm">{match.candidate.firstName[0]}{match.candidate.lastName[0]}</AvatarFallback></Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{match.candidate.firstName} {match.candidate.lastName}</span>
                      {isSelected && <Badge variant="default" className="text-xs">Selected</Badge>}
                      {isBackup && <Badge variant="outline" className="text-xs border-orange-400 text-orange-600">Backup</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{match.candidate.primaryRole} • {match.candidate.yearsExperience}y exp</p>
                    <div className="flex flex-wrap gap-2">
                      <div className={cn('px-2 py-0.5 rounded text-xs font-medium', getScoreBg(match.matchScore), getScoreColor(match.matchScore))}><Target className="h-3 w-3 inline mr-1" />{match.matchScore}% match</div>
                      <div className="px-2 py-0.5 rounded text-xs bg-muted"><Star className="h-3 w-3 inline mr-1" />{match.candidate.averageRating.toFixed(1)}</div>
                      <div className="px-2 py-0.5 rounded text-xs bg-muted"><Shield className="h-3 w-3 inline mr-1" />{match.reliabilityScore}%</div>
                    </div>
                    {!match.isEligible && match.ineligibilityReasons && <div className="mt-2 flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="h-3 w-3" />{match.ineligibilityReasons[0]}</div>}
                  </div>
                  <div className="flex flex-col gap-1">
                    {match.isEligible && (
                      <>
                        <Button variant={isSelected ? 'contained' : 'outlined'} size="small" onClick={(e) => { e.stopPropagation(); toggleCandidate(match.candidateId, false); }} className="text-xs">{isSelected ? <CheckCircle2 className="h-3 w-3" /> : 'Select'}</Button>
                        <Button variant={isBackup ? 'contained' : 'ghost'} size="small" onClick={(e) => { e.stopPropagation(); toggleCandidate(match.candidateId, true); }} className={cn('text-xs', isBackup && 'bg-orange-500 hover:bg-orange-600')}>{isBackup ? 'Backup' : 'As Backup'}</Button>
                      </>
                    )}
                  </div>
                </div>
                {idx < 3 && (
                  <div className="mt-3 pt-3 border-t grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center"><div className={cn('font-bold', getScoreColor(match.skillMatch))}>{match.skillMatch}%</div><div className="text-muted-foreground">Skills</div></div>
                    <div className="text-center"><div className={cn('font-bold', getScoreColor(match.proximityMatch))}>{match.proximityMatch}%</div><div className="text-muted-foreground">Proximity</div></div>
                    <div className="text-center"><div className={cn('font-bold', getScoreColor(match.availabilityMatch))}>{match.availabilityMatch}%</div><div className="text-muted-foreground">Availability</div></div>
                    <div className="text-center"><div className={cn('font-bold', getScoreColor(match.reliabilityScore))}>{match.reliabilityScore}%</div><div className="text-muted-foreground">Reliability</div></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PrimaryOffCanvas>
  );
};

export default ShiftMatchingPanel;
