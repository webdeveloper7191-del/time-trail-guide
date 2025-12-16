import { useState, useMemo } from 'react';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';
import { ViewMode, Shift, StaffMember, Centre, RosterComplianceFlag } from '@/types/roster';
import { mockCentres, mockStaff, generateMockShifts, mockOpenShifts, generateMockDemandData, generateMockComplianceFlags } from '@/data/mockRosterData';
import { StaffPanel } from '@/components/roster/StaffPanel';
import { TimelineGrid } from '@/components/roster/TimelineGrid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  AlertTriangle,
  DollarSign,
  Eye,
  Settings,
  Building2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function RosterScheduler() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedCentreId, setSelectedCentreId] = useState<string>(mockCentres[0].id);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>(generateMockShifts());
  const [showDemandOverlay, setShowDemandOverlay] = useState(true);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  
  const demandData = useMemo(() => generateMockDemandData(), []);
  const complianceFlags = useMemo(() => generateMockComplianceFlags(), []);
  
  const selectedCentre = mockCentres.find(c => c.id === selectedCentreId)!;
  
  const dates = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const dayCount = viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : viewMode === 'fortnight' ? 14 : 28;
    return Array.from({ length: dayCount }, (_, i) => addDays(weekStart, i));
  }, [currentDate, viewMode]);

  const centreFlags = complianceFlags.filter(f => f.centreId === selectedCentreId);
  const criticalFlags = centreFlags.filter(f => f.severity === 'critical');
  const warningFlags = centreFlags.filter(f => f.severity === 'warning');

  const costSummary = useMemo(() => {
    const centreShifts = shifts.filter(s => s.centreId === selectedCentreId);
    let totalHours = 0;
    let totalCost = 0;
    
    centreShifts.forEach(shift => {
      const staff = mockStaff.find(s => s.id === shift.staffId);
      if (staff) {
        const [startH, startM] = shift.startTime.split(':').map(Number);
        const [endH, endM] = shift.endTime.split(':').map(Number);
        const hours = ((endH * 60 + endM) - (startH * 60 + startM) - shift.breakMinutes) / 60;
        totalHours += hours;
        totalCost += hours * staff.hourlyRate;
      }
    });
    
    return { totalHours: Math.round(totalHours * 10) / 10, totalCost: Math.round(totalCost) };
  }, [shifts, selectedCentreId]);

  const handleDragStart = (e: React.DragEvent, staff: StaffMember) => {
    e.dataTransfer.setData('staffId', staff.id);
  };

  const handleDropStaff = (staffId: string, roomId: string, date: string) => {
    const staff = mockStaff.find(s => s.id === staffId);
    if (!staff) return;

    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      staffId,
      centreId: selectedCentreId,
      roomId,
      date,
      startTime: '09:00',
      endTime: '17:00',
      breakMinutes: 30,
      status: 'draft',
      isOpenShift: false,
    };

    setShifts(prev => [...prev, newShift]);
    toast.success(`Added ${staff.name} to shift`);
  };

  const handlePublish = () => {
    const draftShifts = shifts.filter(s => s.status === 'draft' && s.centreId === selectedCentreId);
    if (draftShifts.length === 0) {
      toast.info('No draft shifts to publish');
      return;
    }
    
    setShifts(prev => prev.map(s => 
      s.status === 'draft' && s.centreId === selectedCentreId 
        ? { ...s, status: 'published' } 
        : s
    ));
    toast.success(`Published ${draftShifts.length} shifts`);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const days = viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : viewMode === 'fortnight' ? 14 : 28;
    setCurrentDate(prev => addDays(prev, direction === 'next' ? days : -days));
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Roster Scheduler
            </h1>
            
            <Select value={selectedCentreId} onValueChange={setSelectedCentreId}>
              <SelectTrigger className="w-[220px]">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockCentres.map(centre => (
                  <SelectItem key={centre.id} value={centre.id}>
                    {centre.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            {criticalFlags.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {criticalFlags.length} Critical
              </Badge>
            )}
            {warningFlags.length > 0 && (
              <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                {warningFlags.length} Warnings
              </Badge>
            )}
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">${costSummary.totalCost.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">({costSummary.totalHours}h)</span>
            </div>

            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            
            <Button size="sm" onClick={handlePublish}>
              <Send className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>

        {/* Navigation & View Controls */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <span className="text-sm font-medium ml-2">
              {format(dates[0], 'MMM d')} - {format(dates[dates.length - 1], 'MMM d, yyyy')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="demand" checked={showDemandOverlay} onCheckedChange={setShowDemandOverlay} />
              <Label htmlFor="demand" className="text-sm flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                Demand Overlay
              </Label>
            </div>

            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="fortnight">Fortnight</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <StaffPanel
          staff={mockStaff}
          selectedCentreId={selectedCentreId}
          onDragStart={handleDragStart}
        />

        <TimelineGrid
          centre={selectedCentre}
          shifts={shifts.filter(s => s.centreId === selectedCentreId)}
          openShifts={mockOpenShifts.filter(os => os.centreId === selectedCentreId)}
          staff={mockStaff}
          demandData={demandData}
          complianceFlags={complianceFlags}
          dates={dates}
          viewMode={viewMode}
          showDemandOverlay={showDemandOverlay}
          onDropStaff={handleDropStaff}
          onShiftEdit={setEditingShift}
          onShiftDelete={(id) => {
            setShifts(prev => prev.filter(s => s.id !== id));
            toast.success('Shift removed');
          }}
          onOpenShiftFill={() => toast.info('Open shift fill dialog coming soon')}
          onAddShift={(roomId, date) => toast.info(`Add shift for ${date}`)}
        />
      </div>

      {/* Edit Shift Dialog */}
      <Dialog open={!!editingShift} onOpenChange={() => setEditingShift(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
          </DialogHeader>
          {editingShift && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input type="time" defaultValue={editingShift.startTime} />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input type="time" defaultValue={editingShift.endTime} />
                </div>
              </div>
              <div>
                <Label>Break (minutes)</Label>
                <Input type="number" defaultValue={editingShift.breakMinutes} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingShift(null)}>Cancel</Button>
            <Button onClick={() => { setEditingShift(null); toast.success('Shift updated'); }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
