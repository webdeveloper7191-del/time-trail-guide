import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Slider,
} from '@mui/material';
import { Button } from '@/components/mui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Battery, Sun, Coffee, Zap, Smile, Meh, Frown } from 'lucide-react';
import type { WellbeingCheckIn } from '@/types/advancedPerformance';
import { toast } from 'sonner';

interface WellbeingCheckInModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (checkIn: Partial<WellbeingCheckIn>) => void;
  staffId: string;
}

const moodOptions = [
  { value: 1, icon: Frown, label: 'Struggling', color: 'rgb(239, 68, 68)' },
  { value: 2, icon: Meh, label: 'Getting By', color: 'rgb(251, 191, 36)' },
  { value: 3, icon: Smile, label: 'Good', color: 'rgb(59, 130, 246)' },
  { value: 4, icon: Smile, label: 'Great', color: 'rgb(34, 197, 94)' },
  { value: 5, icon: Heart, label: 'Thriving', color: 'rgb(139, 92, 246)' },
];

export function WellbeingCheckInModal({ open, onClose, onSubmit, staffId }: WellbeingCheckInModalProps) {
  const [mood, setMood] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [workloadRating, setWorkloadRating] = useState(5);
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    const checkIn: Partial<WellbeingCheckIn> = {
      id: `checkin-${Date.now()}`,
      staffId,
      date: new Date().toISOString(),
      energyLevel,
      stressLevel,
      workLifeBalance: Math.round((10 - stressLevel + (10 - workloadRating)) / 4), // Calculate from 1-5
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    onSubmit(checkIn);
    toast.success('Check-in submitted successfully');
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setMood(3);
    setEnergyLevel(5);
    setStressLevel(5);
    setWorkloadRating(5);
    setNotes('');
  };

  const selectedMood = moodOptions.find(m => m.value === mood);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart size={20} className="text-pink-500" />
            Daily Wellbeing Check-in
          </DialogTitle>
          <DialogDescription>
            Take a moment to reflect on how you're doing today
          </DialogDescription>
        </DialogHeader>

        <Box sx={{ py: 2 }}>
          <Stack spacing={4}>
            {/* Mood Selection */}
            <Box>
              <Label className="mb-2 block">How are you feeling today?</Label>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Select the emoji that best matches your overall mood right now
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center">
                {moodOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = mood === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setMood(option.value)}
                      className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/10 scale-110' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      style={{ 
                        borderColor: isSelected ? option.color : undefined,
                        backgroundColor: isSelected ? `${option.color}15` : undefined,
                      }}
                    >
                      <Icon 
                        size={24} 
                        style={{ color: isSelected ? option.color : 'currentColor' }}
                      />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          mt: 0.5, 
                          fontWeight: isSelected ? 600 : 400,
                          color: isSelected ? option.color : 'text.secondary',
                        }}
                      >
                        {option.label}
                      </Typography>
                    </button>
                  );
                })}
              </Stack>
            </Box>

            {/* Energy Level */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Label className="flex items-center gap-2">
                  <Battery size={16} className="text-yellow-500" />
                  Energy Level
                </Label>
                <Typography variant="body2" fontWeight={600}>{energyLevel}/10</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                How energetic and motivated do you feel physically and mentally?
              </Typography>
              <Slider
                value={energyLevel}
                onChange={(_, val) => setEnergyLevel(val as number)}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: 'Low' },
                  { value: 5, label: '' },
                  { value: 10, label: 'High' },
                ]}
                sx={{ 
                  color: energyLevel < 4 ? 'error.main' : energyLevel < 7 ? 'warning.main' : 'success.main' 
                }}
              />
            </Box>

            {/* Stress Level */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Label className="flex items-center gap-2">
                  <Zap size={16} className="text-orange-500" />
                  Stress Level
                </Label>
                <Typography variant="body2" fontWeight={600}>{stressLevel}/10</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Rate your current stress from work demands, deadlines, or other factors
              </Typography>
              <Slider
                value={stressLevel}
                onChange={(_, val) => setStressLevel(val as number)}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: 'Calm' },
                  { value: 5, label: '' },
                  { value: 10, label: 'Stressed' },
                ]}
                sx={{ 
                  color: stressLevel > 7 ? 'error.main' : stressLevel > 4 ? 'warning.main' : 'success.main' 
                }}
              />
            </Box>

            {/* Workload Rating */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Label className="flex items-center gap-2">
                  <Coffee size={16} className="text-brown-500" />
                  Workload
                </Label>
                <Typography variant="body2" fontWeight={600}>{workloadRating}/10</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Is your current workload manageable? Consider tasks, meetings, and deadlines.
              </Typography>
              <Slider
                value={workloadRating}
                onChange={(_, val) => setWorkloadRating(val as number)}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: 'Light' },
                  { value: 5, label: 'Balanced' },
                  { value: 10, label: 'Heavy' },
                ]}
                sx={{ 
                  color: workloadRating > 8 ? 'error.main' : workloadRating > 6 ? 'warning.main' : 'success.main' 
                }}
              />
            </Box>

            {/* Optional Notes */}
            <Box>
              <Label htmlFor="notes" className="mb-2 block">Anything else you'd like to share? (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share any thoughts, concerns, or wins..."
                rows={3}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                This is private and helps your manager understand how to support you better
              </Typography>
            </Box>
          </Stack>
        </Box>

        <DialogFooter>
          <Button variant="outlined" onClick={onClose}>
            Skip Today
          </Button>
          <Button variant="contained" onClick={handleSubmit}>
            Submit Check-in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
