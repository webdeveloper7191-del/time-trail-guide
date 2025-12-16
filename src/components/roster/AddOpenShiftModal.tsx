import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Room, OpenShift, QualificationType, qualificationLabels, ageGroupLabels } from '@/types/roster';
import { Plus, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddOpenShiftModalProps {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  centreId: string;
  selectedDate?: string;
  selectedRoomId?: string;
  onAdd: (openShift: Omit<OpenShift, 'id'>) => void;
}

export function AddOpenShiftModal({ 
  open, 
  onClose, 
  rooms, 
  centreId, 
  selectedDate,
  selectedRoomId,
  onAdd 
}: AddOpenShiftModalProps) {
  const [roomId, setRoomId] = useState(selectedRoomId || '');
  const [date, setDate] = useState(selectedDate || '');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [urgency, setUrgency] = useState<OpenShift['urgency']>('medium');
  const [selectedQualifications, setSelectedQualifications] = useState<QualificationType[]>([]);

  const availableQualifications: QualificationType[] = [
    'diploma_ece', 'certificate_iii', 'first_aid', 'food_safety', 
    'working_with_children', 'bachelor_ece', 'masters_ece'
  ];

  const toggleQualification = (qual: QualificationType) => {
    setSelectedQualifications(prev => 
      prev.includes(qual) 
        ? prev.filter(q => q !== qual)
        : [...prev, qual]
    );
  };

  const handleSubmit = () => {
    if (!roomId || !date || !startTime || !endTime) return;

    onAdd({
      centreId,
      roomId,
      date,
      startTime,
      endTime,
      requiredQualifications: selectedQualifications,
      urgency,
      applicants: [],
    });

    // Reset form
    setRoomId('');
    setDate('');
    setStartTime('09:00');
    setEndTime('17:00');
    setUrgency('medium');
    setSelectedQualifications([]);
    onClose();
  };

  const urgencyColors = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-amber-500/15 text-amber-700 border-amber-500/50',
    high: 'bg-orange-500/15 text-orange-700 border-orange-500/50',
    critical: 'bg-destructive/15 text-destructive border-destructive/50',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Add Open Shift
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Room Selection */}
          <div className="space-y-2">
            <Label>Room / Area</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger>
                <SelectValue placeholder="Select room..." />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    <div className="flex items-center gap-2">
                      <span>{room.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {ageGroupLabels[room.ageGroup]}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input 
                type="time" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input 
                type="time" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)} 
              />
            </div>
          </div>

          {/* Urgency */}
          <div className="space-y-2">
            <Label>Urgency Level</Label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
                <Button
                  key={level}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUrgency(level)}
                  className={cn(
                    "flex-1 capitalize",
                    urgency === level && urgencyColors[level],
                    urgency === level && "ring-1 ring-offset-1"
                  )}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>

          {/* Required Qualifications */}
          <div className="space-y-2">
            <Label>Required Qualifications (Optional)</Label>
            <div className="flex flex-wrap gap-2">
              {availableQualifications.map((qual) => (
                <Badge
                  key={qual}
                  variant={selectedQualifications.includes(qual) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleQualification(qual)}
                >
                  {selectedQualifications.includes(qual) && (
                    <X className="h-3 w-3 mr-1" />
                  )}
                  {qualificationLabels[qual]}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!roomId || !date || !startTime || !endTime}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Open Shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
