import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
} from '@mui/material';
import { Button } from '@/components/mui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/mui/Card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  ArrowUp,
  ArrowDown,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import { CareerPath, CareerLevel, SkillLevel, skillLevelLabels } from '@/types/advancedPerformance';
import { toast } from 'sonner';

interface CareerPathSetupDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  careerPath?: CareerPath | null;
  onSave: (path: CareerPath) => void;
  availableSkills: { id: string; name: string }[];
}

interface LevelFormData {
  id: string;
  title: string;
  level: number;
  requiredSkills: { skillId: string; minLevel: SkillLevel }[];
  requiredExperienceYears: number;
  typicalSalaryRange?: { min: number; max: number };
}

const skillLevelOptions: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

export function CareerPathSetupDrawer({
  open,
  onOpenChange,
  careerPath,
  onSave,
  availableSkills,
}: CareerPathSetupDrawerProps) {
  const isEditing = !!careerPath;

  const [name, setName] = useState(careerPath?.name || '');
  const [description, setDescription] = useState(careerPath?.description || '');
  const [levels, setLevels] = useState<LevelFormData[]>(
    careerPath?.levels.map((l, idx) => ({
      ...l,
      level: idx + 1,
    })) || [
      {
        id: `level-${Date.now()}`,
        title: '',
        level: 1,
        requiredSkills: [],
        requiredExperienceYears: 0,
      },
    ]
  );

  const handleAddLevel = () => {
    setLevels([
      ...levels,
      {
        id: `level-${Date.now()}`,
        title: '',
        level: levels.length + 1,
        requiredSkills: [],
        requiredExperienceYears: 0,
      },
    ]);
  };

  const handleRemoveLevel = (index: number) => {
    if (levels.length <= 1) {
      toast.error('Career path must have at least one level');
      return;
    }
    const newLevels = levels.filter((_, i) => i !== index);
    // Re-number levels
    setLevels(newLevels.map((l, i) => ({ ...l, level: i + 1 })));
  };

  const handleMoveLevel = (index: number, direction: 'up' | 'down') => {
    const newLevels = [...levels];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= levels.length) return;

    [newLevels[index], newLevels[targetIndex]] = [newLevels[targetIndex], newLevels[index]];
    // Re-number levels
    setLevels(newLevels.map((l, i) => ({ ...l, level: i + 1 })));
  };

  const handleLevelChange = (index: number, field: keyof LevelFormData, value: any) => {
    const newLevels = [...levels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setLevels(newLevels);
  };

  const handleAddSkillRequirement = (levelIndex: number) => {
    const newLevels = [...levels];
    newLevels[levelIndex].requiredSkills.push({
      skillId: availableSkills[0]?.id || '',
      minLevel: 'intermediate',
    });
    setLevels(newLevels);
  };

  const handleRemoveSkillRequirement = (levelIndex: number, skillIndex: number) => {
    const newLevels = [...levels];
    newLevels[levelIndex].requiredSkills = newLevels[levelIndex].requiredSkills.filter(
      (_, i) => i !== skillIndex
    );
    setLevels(newLevels);
  };

  const handleSkillChange = (
    levelIndex: number,
    skillIndex: number,
    field: 'skillId' | 'minLevel',
    value: string
  ) => {
    const newLevels = [...levels];
    newLevels[levelIndex].requiredSkills[skillIndex] = {
      ...newLevels[levelIndex].requiredSkills[skillIndex],
      [field]: value,
    };
    setLevels(newLevels);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Please enter a career path name');
      return;
    }

    if (levels.some((l) => !l.title.trim())) {
      toast.error('All levels must have a title');
      return;
    }

    const newPath: CareerPath = {
      id: careerPath?.id || `path-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      levels: levels.map((l) => ({
        id: l.id,
        title: l.title,
        level: l.level,
        requiredSkills: l.requiredSkills.filter((s) => s.skillId),
        requiredExperienceYears: l.requiredExperienceYears,
        typicalSalaryRange: l.typicalSalaryRange,
      })),
    };

    onSave(newPath);
    toast.success(isEditing ? 'Career path updated' : 'Career path created');
    onOpenChange(false);
  };

  const getSkillName = (skillId: string) => {
    return availableSkills.find((s) => s.id === skillId)?.name || skillId;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            {isEditing ? 'Edit Career Path' : 'Create Career Path'}
          </SheetTitle>
          <SheetDescription>
            Define progression levels with skill requirements and experience thresholds
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <Typography variant="subtitle2" fontWeight={600} className="text-muted-foreground uppercase tracking-wide text-xs">
                Path Details
              </Typography>
              <TextField
                label="Path Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                size="small"
                placeholder="e.g., Engineering Track"
                helperText="A descriptive name for this career progression path"
              />
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                size="small"
                multiline
                rows={2}
                placeholder="Describe the typical journey and outcomes for this path"
              />
            </div>

            <Divider />

            {/* Levels */}
            <div className="space-y-4">
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" fontWeight={600} className="text-muted-foreground uppercase tracking-wide text-xs">
                  Progression Levels ({levels.length})
                </Typography>
                <Button size="small" variant="outlined" onClick={handleAddLevel}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Level
                </Button>
              </Stack>

              <div className="space-y-3">
                {levels.map((level, levelIndex) => (
                  <Card key={level.id} className="p-4 border">
                    <Stack spacing={3}>
                      {/* Level Header */}
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="font-mono">
                          Level {level.level}
                        </Badge>
                        <Box flex={1} />
                        <IconButton
                          size="small"
                          onClick={() => handleMoveLevel(levelIndex, 'up')}
                          disabled={levelIndex === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleMoveLevel(levelIndex, 'down')}
                          disabled={levelIndex === levels.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveLevel(levelIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </Stack>

                      {/* Level Details */}
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                          label="Title"
                          value={level.title}
                          onChange={(e) => handleLevelChange(levelIndex, 'title', e.target.value)}
                          size="small"
                          placeholder="e.g., Senior Engineer"
                          sx={{ flex: 2 }}
                        />
                        <TextField
                          label="Min. Experience (years)"
                          type="number"
                          value={level.requiredExperienceYears}
                          onChange={(e) =>
                            handleLevelChange(levelIndex, 'requiredExperienceYears', parseInt(e.target.value) || 0)
                          }
                          size="small"
                          sx={{ flex: 1 }}
                          inputProps={{ min: 0 }}
                        />
                      </Stack>

                      {/* Salary Range (Optional) */}
                      <Stack direction="row" spacing={2}>
                        <TextField
                          label="Min Salary (optional)"
                          type="number"
                          value={level.typicalSalaryRange?.min || ''}
                          onChange={(e) =>
                            handleLevelChange(levelIndex, 'typicalSalaryRange', {
                              ...level.typicalSalaryRange,
                              min: parseInt(e.target.value) || 0,
                            })
                          }
                          size="small"
                          sx={{ flex: 1 }}
                          inputProps={{ min: 0 }}
                        />
                        <TextField
                          label="Max Salary (optional)"
                          type="number"
                          value={level.typicalSalaryRange?.max || ''}
                          onChange={(e) =>
                            handleLevelChange(levelIndex, 'typicalSalaryRange', {
                              ...level.typicalSalaryRange,
                              max: parseInt(e.target.value) || 0,
                            })
                          }
                          size="small"
                          sx={{ flex: 1 }}
                          inputProps={{ min: 0 }}
                        />
                      </Stack>

                      {/* Required Skills */}
                      <div className="space-y-2">
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color="text.secondary" className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            Required Skills ({level.requiredSkills.length})
                          </Typography>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleAddSkillRequirement(levelIndex)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Skill
                          </Button>
                        </Stack>

                        {level.requiredSkills.length > 0 ? (
                          <div className="space-y-2">
                            {level.requiredSkills.map((skill, skillIndex) => (
                              <Stack
                                key={skillIndex}
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                className="bg-muted/50 rounded p-2"
                              >
                                <FormControl size="small" sx={{ flex: 2 }}>
                                  <InputLabel>Skill</InputLabel>
                                  <MuiSelect
                                    value={skill.skillId}
                                    label="Skill"
                                    onChange={(e) =>
                                      handleSkillChange(levelIndex, skillIndex, 'skillId', e.target.value)
                                    }
                                  >
                                    {availableSkills.map((s) => (
                                      <MenuItem key={s.id} value={s.id}>
                                        {s.name}
                                      </MenuItem>
                                    ))}
                                  </MuiSelect>
                                </FormControl>
                                <FormControl size="small" sx={{ flex: 1 }}>
                                  <InputLabel>Min Level</InputLabel>
                                  <MuiSelect
                                    value={skill.minLevel}
                                    label="Min Level"
                                    onChange={(e) =>
                                      handleSkillChange(levelIndex, skillIndex, 'minLevel', e.target.value)
                                    }
                                  >
                                    {skillLevelOptions.map((level) => (
                                      <MenuItem key={level} value={level}>
                                        {skillLevelLabels[level]}
                                      </MenuItem>
                                    ))}
                                  </MuiSelect>
                                </FormControl>
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveSkillRequirement(levelIndex, skillIndex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </IconButton>
                              </Stack>
                            ))}
                          </div>
                        ) : (
                          <Typography variant="caption" color="text.secondary" className="italic">
                            No skills required yet
                          </Typography>
                        )}
                      </div>
                    </Stack>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t">
          <Stack direction="row" spacing={2} justifyContent="flex-end" width="100%">
            <Button variant="outlined" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Update Path' : 'Create Path'}
            </Button>
          </Stack>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
