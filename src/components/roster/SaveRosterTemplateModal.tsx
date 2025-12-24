import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Shift, Room } from '@/types/roster';
import { RosterTemplate, RosterTemplateShift } from '@/types/rosterTemplates';
import { format } from 'date-fns';
import { Save, FileText, Clock, Users } from 'lucide-react';

interface SaveRosterTemplateModalProps {
  open: boolean;
  onClose: () => void;
  shifts: Shift[];
  rooms: Room[];
  centreId: string;
  dates: Date[];
  onSave: (template: Omit<RosterTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function SaveRosterTemplateModal({
  open,
  onClose,
  shifts,
  rooms,
  centreId,
  dates,
  onSave
}: SaveRosterTemplateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRooms, setSelectedRooms] = useState<string[]>(rooms.map(r => r.id));
  const [includeStaffPreferences, setIncludeStaffPreferences] = useState(false);

  const relevantShifts = shifts.filter(s => 
    s.centreId === centreId && 
    selectedRooms.includes(s.roomId) &&
    dates.some(d => format(d, 'yyyy-MM-dd') === s.date)
  );

  const handleSave = () => {
    if (!name.trim()) return;

    const templateShifts: RosterTemplateShift[] = relevantShifts.map(shift => {
      const shiftDate = new Date(shift.date);
      return {
        id: `ts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        roomId: shift.roomId,
        dayOfWeek: shiftDate.getDay(),
        startTime: shift.startTime,
        endTime: shift.endTime,
        breakMinutes: shift.breakMinutes,
        notes: shift.notes,
      };
    });

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      centreId,
      shifts: templateShifts,
    });

    setName('');
    setDescription('');
    onClose();
  };

  const toggleRoom = (roomId: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  const groupedShifts = rooms.reduce((acc, room) => {
    acc[room.id] = relevantShifts.filter(s => s.roomId === room.id).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" />
            Save as Roster Template
          </DialogTitle>
          <DialogDescription>
            Save the current week's shifts as a reusable template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard Week, Holiday Roster"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-desc">Description (Optional)</Label>
            <Textarea
              id="template-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when to use this template..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Include Rooms</Label>
            <div className="grid grid-cols-2 gap-2">
              {rooms.map(room => (
                <label
                  key={room.id}
                  className="flex items-center gap-2 p-2 rounded-md border border-border hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedRooms.includes(room.id)}
                    onCheckedChange={() => toggleRoom(room.id)}
                  />
                  <span className="text-sm">{room.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {groupedShifts[room.id] || 0} shifts
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Checkbox
              id="include-prefs"
              checked={includeStaffPreferences}
              onCheckedChange={(checked) => setIncludeStaffPreferences(!!checked)}
            />
            <Label htmlFor="include-prefs" className="text-sm cursor-pointer">
              Include staff role preferences
            </Label>
          </div>

          <div className="flex items-center gap-4 p-3 bg-primary/5 rounded-lg text-sm">
            <div className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" />
              <span>{relevantShifts.length} shifts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <span>{dates.length} days</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" />
              <span>{selectedRooms.length} rooms</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || relevantShifts.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
