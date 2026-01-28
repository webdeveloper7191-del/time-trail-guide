import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Route, 
  Search, 
  Users, 
  CalendarIcon, 
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { LearningPath } from '@/types/lms';
import { StaffMember } from '@/types/staff';
import { mockCourses } from '@/data/mockLmsData';
import { toast } from 'sonner';

interface AssignLearningPathDrawerProps {
  open: boolean;
  onClose: () => void;
  path: LearningPath;
  staff: StaffMember[];
  existingAssignments?: string[]; // Staff IDs already assigned
  onAssign: (pathId: string, staffIds: string[], dueDate?: Date) => void;
}

export function AssignLearningPathDrawer({ 
  open, 
  onClose, 
  path, 
  staff,
  existingAssignments = [],
  onAssign 
}: AssignLearningPathDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [showCalendar, setShowCalendar] = useState(false);

  const availableStaff = staff.filter(s => !existingAssignments.includes(s.id));
  
  const getFullName = (s: StaffMember) => `${s.firstName} ${s.lastName}`;
  
  const filteredStaff = availableStaff.filter(s => {
    const fullName = getFullName(s).toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) ||
      s.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleToggleStaff = (staffId: string) => {
    setSelectedStaff(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStaff.length === filteredStaff.length) {
      setSelectedStaff([]);
    } else {
      setSelectedStaff(filteredStaff.map(s => s.id));
    }
  };

  const handleAssign = () => {
    if (selectedStaff.length === 0) {
      toast.error('Please select at least one staff member');
      return;
    }

    onAssign(path.id, selectedStaff, dueDate);
    toast.success(`Learning path assigned to ${selectedStaff.length} staff member(s)`);
    setSelectedStaff([]);
    setDueDate(undefined);
    onClose();
  };

  const pathCourses = path.courseIds
    .map(id => mockCourses.find(c => c.id === id))
    .filter(Boolean);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Assign Learning Path
          </SheetTitle>
          <SheetDescription>
            Select staff members to assign this learning path
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {/* Path Summary */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Route className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{path.name}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {path.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {path.courseIds.length} courses
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(path.estimatedDuration)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date (Optional)</Label>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : 'Select due date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setShowCalendar(false);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          {/* Staff Selection */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <Label>Select Staff Members</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSelectAll}
                className="h-auto py-1 px-2 text-xs"
              >
                {selectedStaff.length === filteredStaff.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {existingAssignments.length > 0 && (
              <div className="flex items-center gap-2 mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-amber-700 dark:text-amber-400">
                  {existingAssignments.length} staff already assigned
                </span>
              </div>
            )}

            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-4">
                {filteredStaff.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No staff members found</p>
                  </div>
                ) : (
                  filteredStaff.map(member => {
                    const fullName = getFullName(member);
                    return (
                      <div
                        key={member.id}
                        className={cn(
                          "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                          selectedStaff.includes(member.id) 
                            ? "border-primary bg-primary/5" 
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => handleToggleStaff(member.id)}
                      >
                        <Checkbox 
                          checked={selectedStaff.includes(member.id)}
                          onCheckedChange={() => handleToggleStaff(member.id)}
                        />
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{fullName}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {member.position} {member.department && `• ${member.department}`}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedStaff.length} selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleAssign} disabled={selectedStaff.length === 0}>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Path
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
