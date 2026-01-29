import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Slider,
  Chip,
} from '@mui/material';
import { Button } from '@/components/mui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, GraduationCap, ArrowRight } from 'lucide-react';
import { 
  Skill,
  StaffSkill, 
  SkillLevel, 
  skillLevelLabels,
  skillLevelValues,
} from '@/types/advancedPerformance';
import { mockSkills } from '@/data/mockAdvancedPerformanceData';
import { toast } from 'sonner';

interface SkillAssessmentDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (staffSkill: Partial<StaffSkill>) => void;
  staffId: string;
  existingSkill?: StaffSkill | null;
}

const skillLevelOptions: SkillLevel[] = ['none', 'beginner', 'intermediate', 'advanced', 'expert'];

const getSkillLevelColor = (level: SkillLevel) => {
  const colors: Record<SkillLevel, { bg: string; color: string }> = {
    none: { bg: 'rgba(148, 163, 184, 0.12)', color: 'rgb(100, 116, 139)' },
    beginner: { bg: 'rgba(251, 191, 36, 0.12)', color: 'rgb(161, 98, 7)' },
    intermediate: { bg: 'rgba(59, 130, 246, 0.12)', color: 'rgb(37, 99, 235)' },
    advanced: { bg: 'rgba(139, 92, 246, 0.12)', color: 'rgb(124, 58, 237)' },
    expert: { bg: 'rgba(34, 197, 94, 0.12)', color: 'rgb(22, 163, 74)' },
  };
  return colors[level];
};

export function SkillAssessmentDrawer({ 
  open, 
  onClose, 
  onSave, 
  staffId, 
  existingSkill 
}: SkillAssessmentDrawerProps) {
  const [skillId, setSkillId] = useState(existingSkill?.skillId || '');
  const [currentLevel, setCurrentLevel] = useState<SkillLevel>(existingSkill?.currentLevel || 'beginner');
  const [targetLevel, setTargetLevel] = useState<SkillLevel>(existingSkill?.targetLevel || 'intermediate');
  const [notes, setNotes] = useState(existingSkill?.notes || '');

  const handleSave = () => {
    if (!skillId) return;
    
    const skill = mockSkills.find(s => s.id === skillId);
    const staffSkill: Partial<StaffSkill> = {
      skillId,
      currentLevel,
      targetLevel,
      notes: notes.trim() || undefined,
      lastAssessedAt: new Date().toISOString(),
    };
    onSave(staffSkill);
    toast.success(`Skill assessment saved for ${skill?.name}`);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSkillId('');
    setCurrentLevel('beginner');
    setTargetLevel('intermediate');
    setNotes('');
  };

  const selectedSkill = mockSkills.find(s => s.id === skillId);
  const currentLevelStyle = getSkillLevelColor(currentLevel);
  const targetLevelStyle = getSkillLevelColor(targetLevel);

  const progress = targetLevel !== 'none' 
    ? (skillLevelValues[currentLevel] / skillLevelValues[targetLevel]) * 100 
    : 0;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <GraduationCap size={20} />
            {existingSkill ? 'Update Skill Assessment' : 'Assess Skill'}
          </SheetTitle>
        </SheetHeader>

        <Box sx={{ mt: 3 }}>
          <Stack spacing={3}>
            {/* Skill Selection */}
            <Box>
              <Label className="mb-2 block">Skill *</Label>
              <Select 
                value={skillId} 
                onValueChange={setSkillId}
                disabled={!!existingSkill}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a skill to assess..." />
                </SelectTrigger>
                <SelectContent>
                  {mockSkills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <span>{skill.name}</span>
                        {skill.isCore && (
                          <Chip 
                            label="Core" 
                            size="small" 
                            sx={{ fontSize: 10, height: 16 }} 
                          />
                        )}
                      </Stack>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Box>

            {selectedSkill && (
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {selectedSkill.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedSkill.description}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip label={selectedSkill.category} size="small" variant="outlined" />
                  {selectedSkill.isCore && (
                    <Chip 
                      label="Core Competency" 
                      size="small"
                      sx={{ bgcolor: 'rgba(59, 130, 246, 0.12)', color: 'rgb(37, 99, 235)' }}
                    />
                  )}
                </Stack>
              </Box>
            )}

            {/* Current Level */}
            <Box>
              <Label className="mb-2 block">Current Proficiency Level</Label>
              <div className="flex gap-2 flex-wrap">
                {skillLevelOptions.map((level) => {
                  const style = getSkillLevelColor(level);
                  const isSelected = currentLevel === level;
                  return (
                    <button
                      key={level}
                      onClick={() => setCurrentLevel(level)}
                      className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                        isSelected 
                          ? 'border-primary' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      style={{
                        backgroundColor: isSelected ? style.bg : undefined,
                        color: isSelected ? style.color : undefined,
                      }}
                    >
                      {skillLevelLabels[level]}
                    </button>
                  );
                })}
              </div>
            </Box>

            {/* Target Level */}
            <Box>
              <Label className="mb-2 block">Target Proficiency Level</Label>
              <div className="flex gap-2 flex-wrap">
                {skillLevelOptions.filter(l => skillLevelValues[l] >= skillLevelValues[currentLevel]).map((level) => {
                  const style = getSkillLevelColor(level);
                  const isSelected = targetLevel === level;
                  return (
                    <button
                      key={level}
                      onClick={() => setTargetLevel(level)}
                      className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                        isSelected 
                          ? 'border-secondary' 
                          : 'border-border hover:border-secondary/50'
                      }`}
                      style={{
                        backgroundColor: isSelected ? style.bg : undefined,
                        color: isSelected ? style.color : undefined,
                      }}
                    >
                      {skillLevelLabels[level]}
                    </button>
                  );
                })}
              </div>
            </Box>

            {/* Progress Preview */}
            {skillId && (
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Progress to Target
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {Math.round(progress)}%
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Chip 
                    label={skillLevelLabels[currentLevel]}
                    size="small"
                    sx={{ ...currentLevelStyle }}
                  />
                  <ArrowRight size={16} className="text-muted-foreground" />
                  <Chip 
                    label={skillLevelLabels[targetLevel]}
                    size="small"
                    sx={{ ...targetLevelStyle }}
                  />
                </Stack>
              </Box>
            )}

            {/* Notes */}
            <Box>
              <Label htmlFor="notes" className="mb-2 block">Assessment Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about proficiency, training needs, observations..."
                rows={3}
              />
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
            disabled={!skillId}
          >
            Save Assessment
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
