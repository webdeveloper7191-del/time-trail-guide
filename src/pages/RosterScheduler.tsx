import { useState, useMemo } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ViewMode, Shift, StaffMember, Centre, RosterComplianceFlag, OpenShift, roleLabels, QualificationType } from '@/types/roster';
import { mockCentres, mockStaff, generateMockShifts, mockOpenShifts, generateMockDemandData, generateMockComplianceFlags } from '@/data/mockRosterData';
import { ScheduledStaffPanel } from '@/components/roster/ScheduledStaffPanel';
import { UnscheduledStaffPanel } from '@/components/roster/UnscheduledStaffPanel';
import { OpenShiftsPool } from '@/components/roster/OpenShiftsPool';
import { TimelineGrid } from '@/components/roster/TimelineGrid';
import { ShiftDetailPanel } from '@/components/roster/ShiftDetailPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  AlertTriangle,
  DollarSign,
  Eye,
  EyeOff,
  Settings,
  Building2,
  Search,
  Filter,
  BarChart3,
  X
} from 'lucide-react';

export default function RosterScheduler() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedCentreId, setSelectedCentreId] = useState<string>(mockCentres[0].id);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>(generateMockShifts());
  const [openShifts, setOpenShifts] = useState<OpenShift[]>(mockOpenShifts);
  const [showDemandOverlay, setShowDemandOverlay] = useState(true);
  const [demandAwareMode, setDemandAwareMode] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  
  // Filters
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const demandData = useMemo(() => generateMockDemandData(), []);
  const complianceFlags = useMemo(() => generateMockComplianceFlags(), []);
  
  const selectedCentre = mockCentres.find(c => c.id === selectedCentreId)!;
  
  const dates = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const dayCount = viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : viewMode === 'fortnight' ? 14 : 28;
    return Array.from({ length: dayCount }, (_, i) => addDays(weekStart, i));
  }, [currentDate, viewMode]);

  // Filter rooms based on area filter
  const filteredRooms = useMemo(() => {
    if (areaFilter === 'all') return selectedCentre.rooms;
    return selectedCentre.rooms.filter(r => r.ageGroup === areaFilter);
  }, [selectedCentre, areaFilter]);

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

  // Low demand days (for demand-aware mode)
  const lowDemandDays = useMemo(() => {
    if (!demandAwareMode) return new Set<string>();
    
    const lowDays = new Set<string>();
    dates.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayDemand = demandData.filter(d => d.date === dateStr && d.centreId === selectedCentreId);
      const avgUtil = dayDemand.length > 0 
        ? dayDemand.reduce((sum, d) => sum + d.utilisationPercent, 0) / dayDemand.length
        : 0;
      if (avgUtil < 50) lowDays.add(dateStr);
    });
    return lowDays;
  }, [demandAwareMode, dates, demandData, selectedCentreId]);

  const handleDragStart = (e: React.DragEvent, staff: StaffMember) => {
    e.dataTransfer.setData('staffId', staff.id);
    e.dataTransfer.setData('dragType', 'staff');
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

  const handleDropStaffOnOpenShift = (staffId: string, openShift: OpenShift) => {
    const staff = mockStaff.find(s => s.id === staffId);
    if (!staff) return;

    // Create new shift from open shift
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      staffId,
      centreId: openShift.centreId,
      roomId: openShift.roomId,
      date: openShift.date,
      startTime: openShift.startTime,
      endTime: openShift.endTime,
      breakMinutes: 30,
      status: 'draft',
      isOpenShift: false,
    };

    setShifts(prev => [...prev, newShift]);
    setOpenShifts(prev => prev.filter(os => os.id !== openShift.id));
    toast.success(`Assigned ${staff.name} to open shift`);
  };

  const handleUnassignStaff = (shiftId: string) => {
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift) return;

    // Convert to open shift
    const newOpenShift: OpenShift = {
      id: `open-${Date.now()}`,
      centreId: shift.centreId,
      roomId: shift.roomId,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      requiredQualifications: [],
      urgency: 'medium',
      applicants: [],
    };

    setShifts(prev => prev.filter(s => s.id !== shiftId));
    setOpenShifts(prev => [...prev, newOpenShift]);
    toast.info('Staff unassigned - shift moved to open shifts');
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

  const handleShiftSave = (updatedShift: Shift) => {
    setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
    toast.success('Shift updated');
  };

  const handleShiftDelete = (shiftId: string) => {
    setShifts(prev => prev.filter(s => s.id !== shiftId));
    setSelectedShift(null);
    toast.success('Shift removed');
  };

  const handleShiftDuplicate = (shift: Shift) => {
    const newShift = {
      ...shift,
      id: `shift-${Date.now()}`,
      status: 'draft' as const,
    };
    setShifts(prev => [...prev, newShift]);
    toast.success('Shift duplicated');
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 bg-card shrink-0">
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

            {/* Area/Room Filter */}
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                <SelectItem value="nursery">Nursery (0-2)</SelectItem>
                <SelectItem value="toddler">Toddler (2-3)</SelectItem>
                <SelectItem value="preschool">Preschool (3-4)</SelectItem>
                <SelectItem value="kindy">Kindy (4-5)</SelectItem>
              </SelectContent>
            </Select>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {Object.entries(roleLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
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
                {showDemandOverlay ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                Demand
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch id="demandAware" checked={demandAwareMode} onCheckedChange={setDemandAwareMode} />
              <Label htmlFor="demandAware" className="text-sm flex items-center gap-1">
                <BarChart3 className="h-3.5 w-3.5" />
                Low-demand Filter
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
        {/* Left Panel - Scheduled Staff */}
        <ScheduledStaffPanel
          staff={mockStaff}
          shifts={shifts}
          selectedCentreId={selectedCentreId}
          onDragStart={handleDragStart}
        />

        {/* Center - Timeline Grid */}
        <TimelineGrid
          centre={{ ...selectedCentre, rooms: filteredRooms }}
          shifts={shifts.filter(s => s.centreId === selectedCentreId)}
          openShifts={openShifts.filter(os => os.centreId === selectedCentreId)}
          staff={mockStaff}
          demandData={demandData}
          complianceFlags={complianceFlags}
          dates={dates}
          viewMode={viewMode}
          showDemandOverlay={showDemandOverlay}
          lowDemandDays={lowDemandDays}
          onDropStaff={handleDropStaff}
          onShiftEdit={setSelectedShift}
          onShiftDelete={handleShiftDelete}
          onOpenShiftFill={(os) => toast.info('Select a staff member to fill this shift')}
          onAddShift={(roomId, date) => toast.info(`Add shift for ${date}`)}
          onUnassignStaff={handleUnassignStaff}
        />

        {/* Right Panel - Available Staff */}
        <UnscheduledStaffPanel
          staff={mockStaff}
          shifts={shifts}
          selectedCentreId={selectedCentreId}
          onDragStart={handleDragStart}
        />

        {/* Far Right - Open Shifts Pool */}
        <OpenShiftsPool
          openShifts={openShifts}
          centres={mockCentres}
          staff={mockStaff}
          onAssign={(os) => toast.info('Drag a staff member onto this shift to assign')}
          onDropStaff={handleDropStaffOnOpenShift}
        />
      </div>

      {/* Shift Detail Panel */}
      {selectedShift && (
        <ShiftDetailPanel
          shift={selectedShift}
          staff={mockStaff}
          centre={selectedCentre}
          demandData={demandData}
          complianceFlags={complianceFlags}
          onClose={() => setSelectedShift(null)}
          onSave={handleShiftSave}
          onDelete={handleShiftDelete}
          onDuplicate={handleShiftDuplicate}
          onSwapStaff={(shift) => toast.info('Staff swap feature coming soon')}
        />
      )}
    </div>
  );
}
