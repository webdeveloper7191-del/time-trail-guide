import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Slider,
  Avatar,
} from '@mui/material';
import { Button } from '@/components/mui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, AlertTriangle } from 'lucide-react';
import type { TalentAssessment, PerformanceLevel, PotentialLevel } from '@/types/advancedPerformance';
import { mockStaff } from '@/data/mockStaffData';

interface TalentAssessmentDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (assessment: Partial<TalentAssessment>) => void;
  assessment?: TalentAssessment | null;
  staffId?: string;
}

const performanceLevelLabels: Record<PerformanceLevel, string> = {
  low: 'Low Performance',
  medium: 'Meets Expectations',
  high: 'Exceeds Expectations',
};

const potentialLevelLabels: Record<PotentialLevel, string> = {
  low: 'Limited Potential',
  medium: 'Moderate Potential',
  high: 'High Potential',
};

export function TalentAssessmentDrawer({ 
  open, 
  onClose, 
  onSave, 
  assessment, 
  staffId 
}: TalentAssessmentDrawerProps) {
  const [selectedStaffId, setSelectedStaffId] = useState(staffId || '');
  const [performanceScore, setPerformanceScore] = useState(5);
  const [potentialScore, setPotentialScore] = useState(5);
  const [performanceLevel, setPerformanceLevel] = useState<PerformanceLevel>('medium');
  const [potentialLevel, setPotentialLevel] = useState<PotentialLevel>('medium');
  const [flightRisk, setFlightRisk] = useState<'low' | 'medium' | 'high'>('low');
  const [readiness, setReadiness] = useState<'ready_now' | 'ready_1_year' | 'ready_2_years' | 'not_ready'>('not_ready');
  const [notes, setNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');

  useEffect(() => {
    if (assessment) {
      setSelectedStaffId(assessment.staffId);
      setPerformanceScore(assessment.performanceScore);
      setPotentialScore(assessment.potentialScore);
      setPerformanceLevel(assessment.performanceLevel);
      setPotentialLevel(assessment.potentialLevel);
      setFlightRisk(assessment.flightRisk);
      setReadiness(assessment.readiness);
      setNotes(assessment.notes || '');
      setRecommendations(assessment.developmentRecommendations?.join('\n') || '');
    } else {
      resetForm();
    }
  }, [assessment]);

  useEffect(() => {
    // Auto-calculate levels based on scores
    if (performanceScore <= 3) setPerformanceLevel('low');
    else if (performanceScore <= 6) setPerformanceLevel('medium');
    else setPerformanceLevel('high');

    if (potentialScore <= 3) setPotentialLevel('low');
    else if (potentialScore <= 6) setPotentialLevel('medium');
    else setPotentialLevel('high');
  }, [performanceScore, potentialScore]);

  const resetForm = () => {
    setSelectedStaffId(staffId || '');
    setPerformanceScore(5);
    setPotentialScore(5);
    setPerformanceLevel('medium');
    setPotentialLevel('medium');
    setFlightRisk('low');
    setReadiness('not_ready');
    setNotes('');
    setRecommendations('');
  };

  const handleSave = () => {
    const newAssessment: Partial<TalentAssessment> = {
      id: assessment?.id || `ta-new-${Date.now()}`,
      staffId: selectedStaffId,
      performanceScore,
      potentialScore,
      performanceLevel,
      potentialLevel,
      flightRisk,
      readiness,
      notes,
      developmentRecommendations: recommendations.split('\n').filter(r => r.trim()),
      assessmentDate: new Date().toISOString(),
      assessorId: 'current-user',
    };
    onSave(newAssessment);
    onClose();
    resetForm();
  };

  const staff = mockStaff.find(s => s.id === selectedStaffId);
  const isValid = selectedStaffId.trim();

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Target size={20} />
            {assessment ? 'Edit Assessment' : 'New Talent Assessment'}
          </SheetTitle>
        </SheetHeader>

        <Box sx={{ mt: 3 }}>
          <Stack spacing={3}>
            {/* Staff Selection */}
            <Box>
              <Label className="mb-2 block">Employee *</Label>
              <Select 
                value={selectedStaffId} 
                onValueChange={setSelectedStaffId}
                disabled={!!assessment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent>
                  {mockStaff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} - {s.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Choose the employee you want to assess for the 9-Box talent grid
              </Typography>
            </Box>

            {staff && (
              <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Avatar sx={{ width: 48, height: 48 }}>
                  {staff.firstName.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {staff.firstName} {staff.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {staff.position}
                  </Typography>
                </Box>
              </Stack>
            )}

            {/* Performance Score */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Label>Performance Score</Label>
                <Typography variant="body2" fontWeight={600} color="primary.main">
                  {performanceScore}/10
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Rate based on goal achievement, quality of work, and productivity over the past period
              </Typography>
              <Slider
                value={performanceScore}
                onChange={(_, val) => setPerformanceScore(val as number)}
                min={1}
                max={10}
                step={0.5}
                marks={[
                  { value: 1, label: '1' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                ]}
                sx={{ mt: 2 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Auto-assigned: {performanceLevelLabels[performanceLevel]}
              </Typography>
            </Box>

            {/* Potential Score */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Label>Potential Score</Label>
                <Typography variant="body2" fontWeight={600} color="secondary.main">
                  {potentialScore}/10
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Estimate growth capacity based on learning agility, leadership qualities, and career aspirations
              </Typography>
              <Slider
                value={potentialScore}
                onChange={(_, val) => setPotentialScore(val as number)}
                min={1}
                max={10}
                step={0.5}
                marks={[
                  { value: 1, label: '1' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                ]}
                color="secondary"
                sx={{ mt: 2 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Auto-assigned: {potentialLevelLabels[potentialLevel]}
              </Typography>
            </Box>

            {/* Flight Risk */}
            <Box>
              <Label className="mb-2 block flex items-center gap-2">
                <AlertTriangle size={14} />
                Flight Risk
              </Label>
              <Select value={flightRisk} onValueChange={(v) => setFlightRisk(v as 'low' | 'medium' | 'high')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Consider factors like job satisfaction, market demand for their skills, and recent life changes
              </Typography>
            </Box>

            {/* Succession Readiness */}
            <Box>
              <Label className="mb-2 block">Succession Readiness</Label>
              <Select value={readiness} onValueChange={(v) => setReadiness(v as 'ready_now' | 'ready_1_year' | 'ready_2_years' | 'not_ready')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_ready">Not Ready</SelectItem>
                  <SelectItem value="ready_2_years">Ready in 2 Years</SelectItem>
                  <SelectItem value="ready_1_year">Ready in 1 Year</SelectItem>
                  <SelectItem value="ready_now">Ready Now</SelectItem>
                </SelectContent>
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                How soon could this person step into a higher-level role?
              </Typography>
            </Box>

            {/* Notes */}
            <Box>
              <Label htmlFor="notes" className="mb-2 block">Assessment Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this assessment..."
                rows={3}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Document specific examples, achievements, or concerns that support your assessment
              </Typography>
            </Box>

            {/* Development Recommendations */}
            <Box>
              <Label htmlFor="recommendations" className="mb-2 block">Development Recommendations</Label>
              <Textarea
                id="recommendations"
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Enter recommendations (one per line)..."
                rows={3}
              />
              <Typography variant="caption" color="text.secondary">
                Enter each recommendation on a new line
              </Typography>
            </Box>
          </Stack>
        </Box>

        <SheetFooter className="mt-6">
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={!isValid}
          >
            {assessment ? 'Update Assessment' : 'Create Assessment'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
