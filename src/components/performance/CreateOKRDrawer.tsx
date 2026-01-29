import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  Chip,
  IconButton,
} from '@mui/material';
import { Button } from '@/components/mui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, 
  Plus, 
  Trash2,
  Building2,
  Users,
  User,
  Link2,
} from 'lucide-react';
import { 
  okrLevelLabels,
} from '@/types/okr';
import type { 
  Objective, 
  KeyResult,
  OKRLevel,
} from '@/types/okr';
import { mockObjectives, mockOKRCycles, mockTeams } from '@/data/mockOKRData';
import { mockStaff } from '@/data/mockStaffData';

interface CreateOKRDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (objective: Partial<Objective>) => void;
  parentObjectiveId?: string;
}

const getLevelIcon = (level: OKRLevel) => {
  switch (level) {
    case 'company': return <Building2 size={16} />;
    case 'team': return <Users size={16} />;
    case 'individual': return <User size={16} />;
  }
};

const getLevelStyle = (level: OKRLevel) => {
  const styles: Record<OKRLevel, { bg: string; color: string }> = {
    company: { bg: 'rgba(139, 92, 246, 0.12)', color: 'rgb(124, 58, 237)' },
    team: { bg: 'rgba(59, 130, 246, 0.12)', color: 'rgb(37, 99, 235)' },
    individual: { bg: 'rgba(34, 197, 94, 0.12)', color: 'rgb(22, 163, 74)' },
  };
  return styles[level];
};

interface KeyResultInput {
  id: string;
  title: string;
  targetValue: number;
  unit: string;
  startValue: number;
}

export function CreateOKRDrawer({ open, onClose, onSave, parentObjectiveId }: CreateOKRDrawerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<OKRLevel>('team');
  const [ownerId, setOwnerId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [selectedParentId, setSelectedParentId] = useState(parentObjectiveId || '');
  const [cycle, setCycle] = useState('Q1 2024');
  const [keyResults, setKeyResults] = useState<KeyResultInput[]>([
    { id: '1', title: '', targetValue: 100, unit: '%', startValue: 0 }
  ]);

  // Filter parent objectives based on level hierarchy
  const availableParents = useMemo(() => {
    if (level === 'company') return [];
    if (level === 'team') return mockObjectives.filter(o => o.level === 'company');
    return mockObjectives.filter(o => o.level === 'company' || o.level === 'team');
  }, [level]);

  const selectedParent = selectedParentId 
    ? mockObjectives.find(o => o.id === selectedParentId) 
    : null;

  const addKeyResult = () => {
    setKeyResults([
      ...keyResults,
      { id: String(keyResults.length + 1), title: '', targetValue: 100, unit: '%', startValue: 0 }
    ]);
  };

  const removeKeyResult = (id: string) => {
    if (keyResults.length > 1) {
      setKeyResults(keyResults.filter(kr => kr.id !== id));
    }
  };

  const updateKeyResult = (id: string, field: keyof KeyResultInput, value: string | number) => {
    setKeyResults(keyResults.map(kr => 
      kr.id === id ? { ...kr, [field]: value } : kr
    ));
  };

  const handleSave = () => {
    const newObjective: Partial<Objective> = {
      title,
      description,
      level,
      ownerId,
      teamId: level !== 'individual' ? teamId : undefined,
      parentObjectiveId: selectedParentId || undefined,
      cycle,
      status: 'draft',
      progress: 0,
      keyResults: keyResults.map((kr, idx) => ({
        id: `kr-new-${idx}`,
        title: kr.title,
        type: kr.unit === '%' ? 'percentage' : kr.unit === '$' ? 'currency' : 'number',
        startValue: kr.startValue,
        targetValue: kr.targetValue,
        currentValue: kr.startValue,
        unit: kr.unit,
        progress: 0,
        updatedAt: new Date().toISOString(),
      } as KeyResult)),
    };
    onSave(newObjective);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLevel('team');
    setOwnerId('');
    setTeamId('');
    setSelectedParentId('');
    setKeyResults([{ id: '1', title: '', targetValue: 100, unit: '%', startValue: 0 }]);
  };

  const isValid = title.trim() && ownerId && keyResults.some(kr => kr.title.trim());

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Target size={20} />
            Create New Objective
          </SheetTitle>
        </SheetHeader>

        <Box sx={{ mt: 3 }}>
          <Stack spacing={3}>
            {/* Level Selection */}
            <Box>
              <Label className="mb-2 block">Objective Level</Label>
              <div className="flex gap-2">
                {(['company', 'team', 'individual'] as OKRLevel[]).map((l) => {
                  const style = getLevelStyle(l);
                  const isSelected = level === l;
                  return (
                    <button
                      key={l}
                      onClick={() => {
                        setLevel(l);
                        setSelectedParentId('');
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {getLevelIcon(l)}
                      <span className="text-sm font-medium">{okrLevelLabels[l]}</span>
                    </button>
                  );
                })}
              </div>
            </Box>

            {/* Parent Alignment */}
            {availableParents.length > 0 && (
              <Box>
                <Label className="mb-2 block">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Link2 size={14} />
                    <span>Align to Parent Objective (Optional)</span>
                  </Stack>
                </Label>
                <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent objective..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No parent alignment</SelectItem>
                    {availableParents.map((obj) => (
                      <SelectItem key={obj.id} value={obj.id}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip 
                            label={okrLevelLabels[obj.level]}
                            size="small"
                            sx={{ 
                              fontSize: 10,
                              height: 18,
                              ...getLevelStyle(obj.level),
                            }}
                          />
                          <span className="truncate">{obj.title}</span>
                        </Stack>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedParent && (
                  <Box 
                    sx={{ 
                      mt: 1.5, 
                      p: 2, 
                      borderRadius: 1, 
                      bgcolor: 'action.hover',
                      borderLeft: '3px solid',
                      borderLeftColor: getLevelStyle(selectedParent.level).color,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Aligning to:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedParent.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Progress: {selectedParent.progress}%
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Title */}
            <Box>
              <Label htmlFor="title" className="mb-2 block">Objective Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you want to achieve?"
              />
            </Box>

            {/* Description */}
            <Box>
              <Label htmlFor="description" className="mb-2 block">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why is this objective important?"
                rows={3}
              />
            </Box>

            {/* Owner */}
            <Box>
              <Label className="mb-2 block">Owner *</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select owner..." />
                </SelectTrigger>
                <SelectContent>
                  {mockStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.firstName} {staff.lastName} - {staff.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Box>

            {/* Team (for company/team level) */}
            {level !== 'individual' && (
              <Box>
                <Label className="mb-2 block">Team</Label>
                <Select value={teamId} onValueChange={setTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Box>
            )}

            {/* Cycle */}
            <Box>
              <Label className="mb-2 block">Cycle</Label>
              <Select value={cycle} onValueChange={setCycle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockOKRCycles.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Box>

            {/* Key Results */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Label>Key Results *</Label>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<Plus size={14} />}
                  onClick={addKeyResult}
                >
                  Add KR
                </Button>
              </Stack>

              <Stack spacing={2}>
                {keyResults.map((kr, index) => (
                  <Box 
                    key={kr.id}
                    sx={{ 
                      p: 2, 
                      borderRadius: 1, 
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="caption" fontWeight={600} color="text.secondary">
                        KR {index + 1}
                      </Typography>
                      {keyResults.length > 1 && (
                        <IconButton 
                          size="small" 
                          onClick={() => removeKeyResult(kr.id)}
                          sx={{ mt: -0.5 }}
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      )}
                    </Stack>
                    <Input
                      value={kr.title}
                      onChange={(e) => updateKeyResult(kr.id, 'title', e.target.value)}
                      placeholder="How will you measure success?"
                      className="mt-2"
                    />
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <Box>
                        <Label className="text-xs">Start</Label>
                        <Input
                          type="number"
                          value={kr.startValue}
                          onChange={(e) => updateKeyResult(kr.id, 'startValue', Number(e.target.value))}
                        />
                      </Box>
                      <Box>
                        <Label className="text-xs">Target</Label>
                        <Input
                          type="number"
                          value={kr.targetValue}
                          onChange={(e) => updateKeyResult(kr.id, 'targetValue', Number(e.target.value))}
                        />
                      </Box>
                      <Box>
                        <Label className="text-xs">Unit</Label>
                        <Select 
                          value={kr.unit} 
                          onValueChange={(v) => updateKeyResult(kr.id, 'unit', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="%">%</SelectItem>
                            <SelectItem value="">Count</SelectItem>
                            <SelectItem value="$">$</SelectItem>
                            <SelectItem value="hrs">Hours</SelectItem>
                            <SelectItem value="pts">Points</SelectItem>
                          </SelectContent>
                        </Select>
                      </Box>
                    </div>
                  </Box>
                ))}
              </Stack>
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
            Create Objective
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
