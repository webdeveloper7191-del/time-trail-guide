import React, { useEffect, useState } from 'react';
import { PrimaryOffCanvas, FormSection, FormField } from '@/components/ui/off-canvas';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import type { Goal } from '@/types/performance';
import { performanceSelfService } from '@/lib/performanceSelfServiceStore';

interface UpdateGoalProgressDrawerProps {
  goal: Goal | null;
  open: boolean;
  onClose: () => void;
}

export function UpdateGoalProgressDrawer({ goal, open, onClose }: UpdateGoalProgressDrawerProps) {
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (goal && open) {
      setProgress(goal.progress);
      setCompleted(goal.milestones.filter(m => m.completed).map(m => m.id));
      setNote('');
    }
  }, [goal, open]);

  if (!goal) return null;

  const toggleMilestone = (id: string) => {
    const next = completed.includes(id) ? completed.filter(m => m !== id) : [...completed, id];
    setCompleted(next);
    if (goal.milestones.length > 0) {
      // Keep the slider in step with milestone completion as a helpful default.
      setProgress(Math.round((next.length / goal.milestones.length) * 100));
    }
  };

  const handleSave = () => {
    performanceSelfService.saveGoalProgress(goal.id, {
      progress,
      completedMilestoneIds: completed,
      note: note.trim() || undefined,
    });
    toast.success(progress >= 100 ? 'Goal marked complete' : `Progress updated to ${progress}%`);
    onClose();
  };

  return (
    <PrimaryOffCanvas
      title="Update progress"
      description={goal.title}
      icon={Target}
      size="lg"
      open={open}
      onClose={onClose}
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outlined' },
        { label: 'Save progress', onClick: handleSave, variant: 'primary' },
      ]}
    >
      <div className="space-y-6">
        <FormSection title="Goal">
          <p className="text-sm text-muted-foreground">{goal.description}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{goal.category}</Badge>
            <span>Due {format(parseISO(goal.targetDate), 'd MMM yyyy')}</span>
          </div>
        </FormSection>

        <FormSection title="Completion" tooltip="Set how far along you are with this goal.">
          <FormField label={`Progress — ${progress}%`}>
            <div className="space-y-3 pt-1">
              <Slider
                value={[progress]}
                onValueChange={v => setProgress(v[0])}
                max={100}
                step={5}
              />
              <Progress value={progress} className="h-2" />
            </div>
          </FormField>
        </FormSection>

        {goal.milestones.length > 0 && (
          <FormSection
            title="Milestones"
            tooltip="Tick the steps you have finished. Progress updates automatically."
          >
            <div className="space-y-2">
              {goal.milestones.map(m => (
                <label
                  key={m.id}
                  className="flex items-start gap-3 rounded-md border border-border p-3 cursor-pointer hover:bg-muted/40"
                >
                  <Checkbox
                    checked={completed.includes(m.id)}
                    onCheckedChange={() => toggleMilestone(m.id)}
                    className="mt-0.5"
                  />
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{m.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      Target {format(parseISO(m.targetDate), 'd MMM yyyy')}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </FormSection>
        )}

        <FormSection title="Update note" tooltip="Optional context for your manager.">
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="What did you work on, and is anything blocking you?"
            rows={4}
          />
        </FormSection>
      </div>
    </PrimaryOffCanvas>
  );
}
