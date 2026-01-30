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
  Chip,
  IconButton,
} from '@mui/material';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/mui/Button';
import { Crown, Plus, X } from 'lucide-react';
import { StaffMember } from '@/types/staff';
import { KeyRole } from '@/types/compensation';
import { toast } from 'sonner';

interface AddKeyRoleDrawerProps {
  open: boolean;
  onClose: () => void;
  staff: StaffMember[];
  onSave: (role: Omit<KeyRole, 'id'>) => void;
}

export function AddKeyRoleDrawer({ open, onClose, staff, onSave }: AddKeyRoleDrawerProps) {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [criticality, setCriticality] = useState<'essential' | 'important' | 'standard'>('important');
  const [vacancyRisk, setVacancyRisk] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [currentHolderId, setCurrentHolderId] = useState('');
  const [impactOfVacancy, setImpactOfVacancy] = useState('');
  const [competencyInput, setCompetencyInput] = useState('');
  const [competencies, setCompetencies] = useState<string[]>([]);

  const handleAddCompetency = () => {
    if (competencyInput.trim() && !competencies.includes(competencyInput.trim())) {
      setCompetencies([...competencies, competencyInput.trim()]);
      setCompetencyInput('');
    }
  };

  const handleRemoveCompetency = (comp: string) => {
    setCompetencies(competencies.filter(c => c !== comp));
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Role title is required');
      return;
    }
    if (!department.trim()) {
      toast.error('Department is required');
      return;
    }
    if (competencies.length === 0) {
      toast.error('At least one competency is required');
      return;
    }

    onSave({
      title: title.trim(),
      department: department.trim(),
      criticality,
      currentHolderId: currentHolderId || undefined,
      vacancyRisk,
      impactOfVacancy: impactOfVacancy.trim() || 'Significant operational impact',
      requiredCompetencies: competencies,
      successorCount: 0,
      lastReviewedAt: new Date().toISOString(),
    });

    // Reset form
    setTitle('');
    setDepartment('');
    setCriticality('important');
    setVacancyRisk('medium');
    setCurrentHolderId('');
    setImpactOfVacancy('');
    setCompetencies([]);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Crown size={20} className="text-primary" />
            Add Key Role
          </SheetTitle>
          <SheetDescription>
            Define a critical role for succession planning
          </SheetDescription>
        </SheetHeader>

        <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="Role Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            placeholder="e.g., Chief Technology Officer"
          />

          <TextField
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            fullWidth
            required
            placeholder="e.g., Technology"
          />

          <FormControl fullWidth>
            <InputLabel>Criticality</InputLabel>
            <Select
              value={criticality}
              label="Criticality"
              onChange={(e) => setCriticality(e.target.value as any)}
            >
              <MenuItem value="essential">Essential - Core to operations</MenuItem>
              <MenuItem value="important">Important - Key strategic role</MenuItem>
              <MenuItem value="standard">Standard - Important role</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Vacancy Risk</InputLabel>
            <Select
              value={vacancyRisk}
              label="Vacancy Risk"
              onChange={(e) => setVacancyRisk(e.target.value as any)}
            >
              <MenuItem value="low">Low - No immediate risk</MenuItem>
              <MenuItem value="medium">Medium - Monitor closely</MenuItem>
              <MenuItem value="high">High - Action needed</MenuItem>
              <MenuItem value="critical">Critical - Urgent action required</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Current Holder</InputLabel>
            <Select
              value={currentHolderId}
              label="Current Holder"
              onChange={(e) => setCurrentHolderId(e.target.value)}
            >
              <MenuItem value="">No current holder</MenuItem>
              {staff.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} - {s.position}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Impact of Vacancy"
            value={impactOfVacancy}
            onChange={(e) => setImpactOfVacancy(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder="Describe the impact if this role becomes vacant..."
          />

          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Required Competencies *
            </Typography>
            <Stack direction="row" spacing={1} mb={1}>
              <TextField
                size="small"
                value={competencyInput}
                onChange={(e) => setCompetencyInput(e.target.value)}
                placeholder="Add competency"
                fullWidth
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCompetency())}
              />
              <Button variant="outline" size="small" onClick={handleAddCompetency}>
                <Plus size={16} />
              </Button>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
              {competencies.map((comp) => (
                <Chip
                  key={comp}
                  label={comp}
                  size="small"
                  onDelete={() => handleRemoveCompetency(comp)}
                  deleteIcon={<X size={14} />}
                />
              ))}
            </Stack>
            {competencies.length === 0 && (
              <Typography variant="caption" color="text.secondary">
                Add competencies required for this role
              </Typography>
            )}
          </Box>
        </Box>

        <SheetFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="default" onClick={handleSave}>Create Role</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default AddKeyRoleDrawer;
