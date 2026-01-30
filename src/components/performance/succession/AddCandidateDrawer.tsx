import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
} from '@mui/material';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/mui/Button';
import { UserPlus, Crown } from 'lucide-react';
import { StaffMember } from '@/types/staff';
import { KeyRole, SuccessionCandidate, readinessLabels } from '@/types/compensation';
import { toast } from 'sonner';

interface AddCandidateDrawerProps {
  open: boolean;
  onClose: () => void;
  staff: StaffMember[];
  keyRoles: KeyRole[];
  selectedRoleId?: string;
  existingCandidates: SuccessionCandidate[];
  onSave: (candidate: Omit<SuccessionCandidate, 'id' | 'competencyGaps' | 'developmentActions' | 'overallScore'>) => void;
}

export function AddCandidateDrawer({ 
  open, 
  onClose, 
  staff, 
  keyRoles, 
  selectedRoleId,
  existingCandidates,
  onSave 
}: AddCandidateDrawerProps) {
  const [staffId, setStaffId] = useState('');
  const [keyRoleId, setKeyRoleId] = useState(selectedRoleId || '');
  const [readiness, setReadiness] = useState<SuccessionCandidate['readiness']>('ready_1_2_years');
  const [performanceScore, setPerformanceScore] = useState(75);
  const [potentialScore, setPotentialScore] = useState(75);
  const [experienceScore, setExperienceScore] = useState(70);
  const [mentorId, setMentorId] = useState('');
  const [notes, setNotes] = useState('');

  // Filter out staff who are already candidates for the selected role
  const availableStaff = staff.filter(s => {
    if (!keyRoleId) return true;
    return !existingCandidates.some(c => c.staffId === s.id && c.keyRoleId === keyRoleId);
  });

  const handleSave = () => {
    if (!staffId) {
      toast.error('Please select an employee');
      return;
    }
    if (!keyRoleId) {
      toast.error('Please select a key role');
      return;
    }

    const now = new Date().toISOString();

    onSave({
      staffId,
      keyRoleId,
      readiness,
      performanceScore,
      potentialScore,
      experienceScore,
      mentorId: mentorId || undefined,
      notes: notes.trim() || undefined,
      addedAt: now,
      lastAssessedAt: now,
    });

    // Reset form
    setStaffId('');
    setKeyRoleId(selectedRoleId || '');
    setReadiness('ready_1_2_years');
    setPerformanceScore(75);
    setPotentialScore(75);
    setExperienceScore(70);
    setMentorId('');
    setNotes('');
    onClose();
  };

  const selectedRole = keyRoles.find(r => r.id === keyRoleId);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserPlus size={20} className="text-primary" />
            Add Succession Candidate
          </SheetTitle>
          <SheetDescription>
            Identify potential successors for key roles
          </SheetDescription>
        </SheetHeader>

        <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth required>
            <InputLabel>Key Role</InputLabel>
            <Select
              value={keyRoleId}
              label="Key Role"
              onChange={(e) => setKeyRoleId(e.target.value)}
            >
              {keyRoles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Crown size={14} />
                    <span>{role.title}</span>
                    <Typography variant="caption" color="text.secondary">
                      ({role.department})
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedRole && (
            <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
              <Typography variant="caption" color="primary.main" fontWeight={600}>
                REQUIRED COMPETENCIES
              </Typography>
              <Typography variant="body2" mt={0.5}>
                {selectedRole.requiredCompetencies.join(', ')}
              </Typography>
            </Box>
          )}

          <FormControl fullWidth required>
            <InputLabel>Employee</InputLabel>
            <Select
              value={staffId}
              label="Employee"
              onChange={(e) => setStaffId(e.target.value)}
            >
              {availableStaff.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} - {s.position}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Readiness Level</InputLabel>
            <Select
              value={readiness}
              label="Readiness Level"
              onChange={(e) => setReadiness(e.target.value as any)}
            >
              {Object.entries(readinessLabels).map(([key, label]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>
              Candidate Scores
            </Typography>
            <Stack spacing={3}>
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Performance Score</Typography>
                  <Typography variant="body2" fontWeight={600}>{performanceScore}%</Typography>
                </Stack>
                <Slider
                  value={performanceScore}
                  onChange={(_, v) => setPerformanceScore(v as number)}
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                />
              </Box>
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Potential Score</Typography>
                  <Typography variant="body2" fontWeight={600}>{potentialScore}%</Typography>
                </Stack>
                <Slider
                  value={potentialScore}
                  onChange={(_, v) => setPotentialScore(v as number)}
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                />
              </Box>
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Experience Score</Typography>
                  <Typography variant="body2" fontWeight={600}>{experienceScore}%</Typography>
                </Stack>
                <Slider
                  value={experienceScore}
                  onChange={(_, v) => setExperienceScore(v as number)}
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Stack>
          </Box>

          <FormControl fullWidth>
            <InputLabel>Assigned Mentor</InputLabel>
            <Select
              value={mentorId}
              label="Assigned Mentor"
              onChange={(e) => setMentorId(e.target.value)}
            >
              <MenuItem value="">No mentor assigned</MenuItem>
              {staff.filter(s => s.id !== staffId).map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} - {s.position}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={3}
            fullWidth
            placeholder="Additional observations about this candidate..."
          />
        </Box>

        <SheetFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="default" onClick={handleSave}>Add Candidate</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default AddCandidateDrawer;
