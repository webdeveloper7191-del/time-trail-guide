import { useState, useMemo } from 'react';
import { format, addDays, startOfWeek, subWeeks } from 'date-fns';
import { ViewMode, Shift, StaffMember, OpenShift, roleLabels, ShiftTemplate, defaultShiftTemplates, TimeOff } from '@/types/roster';
import { mockCentres, mockStaff, generateMockShifts, mockOpenShifts, generateMockDemandData, generateMockComplianceFlags, mockAgencyStaff } from '@/data/mockRosterData';
import { UnscheduledStaffPanel } from '@/components/roster/UnscheduledStaffPanel';
import { StaffTimelineGrid } from '@/components/roster/StaffTimelineGrid';
import { ShiftDetailPanel } from '@/components/roster/ShiftDetailPanel';
import { RosterSummaryBar } from '@/components/roster/RosterSummaryBar';
import { LeaveRequestModal } from '@/components/roster/LeaveRequestModal';
import { ShiftSwapModal } from '@/components/roster/ShiftSwapModal';
import { BudgetTrackerBar } from '@/components/roster/BudgetTrackerBar';
import { AddOpenShiftModal } from '@/components/roster/AddOpenShiftModal';
import { AvailabilityCalendarModal } from '@/components/roster/AvailabilityCalendarModal';
import { exportToPDF, exportToExcel } from '@/lib/rosterExport';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
  Users,
  Clock,
  Copy,
  CalendarDays,
  Plus,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronUp,
  CalendarCheck
} from 'lucide-react';

// Budget configuration per centre
const centreBudgets: Record<string, number> = {
  'centre-1': 8000,
  'centre-2': 6500,
  'centre-3': 7500,
};

export default function RosterScheduler() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedCentreId, setSelectedCentreId] = useState<string>(mockCentres[0].id);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>(generateMockShifts());
  const [openShifts, setOpenShifts] = useState<OpenShift[]>(mockOpenShifts);
  const [showDemandOverlay, setShowDemandOverlay] = useState(true);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shiftTemplates] = useState<ShiftTemplate[]>(defaultShiftTemplates);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [shiftToSwap, setShiftToSwap] = useState<Shift | null>(null);
  const [showAddOpenShiftModal, setShowAddOpenShiftModal] = useState(false);
  const [showBudgetBar, setShowBudgetBar] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  const demandData = useMemo(() => generateMockDemandData(), []);
  const complianceFlags = useMemo(() => generateMockComplianceFlags(), []);
  
  const selectedCentre = mockCentres.find(c => c.id === selectedCentreId)!;
  const allStaff = [...mockStaff, ...mockAgencyStaff];
  const weeklyBudget = centreBudgets[selectedCentreId] || 7000;
  
  const dates = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const dayCount = viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : viewMode === 'fortnight' ? 14 : 28;
    return Array.from({ length: dayCount }, (_, i) => addDays(weekStart, i));
  }, [currentDate, viewMode]);

  const filteredStaff = useMemo(() => {
    if (roleFilter === 'all') return mockStaff;
    return mockStaff.filter(s => s.role === roleFilter);
  }, [roleFilter]);

  const centreFlags = complianceFlags.filter(f => f.centreId === selectedCentreId);
  const criticalFlags = centreFlags.filter(f => f.severity === 'critical');
  const centreOpenShifts = openShifts.filter(os => os.centreId === selectedCentreId);

  const leaveRequests = useMemo(() => {
    const requests: (TimeOff & { staffName: string; requestedDate: string })[] = [];
    allStaff.forEach(staff => {
      staff.timeOff?.forEach(to => {
        requests.push({ ...to, staffName: staff.name, requestedDate: to.startDate });
      });
    });
    return requests;
  }, [allStaff]);

  const costSummary = useMemo(() => {
    const centreShifts = shifts.filter(s => s.centreId === selectedCentreId);
    let regularCost = 0;
    let overtimeCost = 0;
    let totalHours = 0;
    
    const staffHours: Record<string, number> = {};
    centreShifts.forEach(shift => {
      const [startH, startM] = shift.startTime.split(':').map(Number);
      const [endH, endM] = shift.endTime.split(':').map(Number);
      const hours = ((endH * 60 + endM) - (startH * 60 + startM) - shift.breakMinutes) / 60;
      staffHours[shift.staffId] = (staffHours[shift.staffId] || 0) + hours;
      totalHours += hours;
    });

    Object.entries(staffHours).forEach(([staffId, hours]) => {
      const member = allStaff.find(s => s.id === staffId);
      if (member) {
        const regularHours = Math.min(hours, member.maxHoursPerWeek);
        const overtimeHours = Math.max(0, hours - member.maxHoursPerWeek);
        regularCost += regularHours * member.hourlyRate;
        overtimeCost += overtimeHours * member.overtimeRate;
      }
    });
    
    return { 
      regularCost: Math.round(regularCost), 
      overtimeCost: Math.round(overtimeCost), 
      totalCost: Math.round(regularCost + overtimeCost),
      totalHours: Math.round(totalHours * 10) / 10 
    };
  }, [shifts, selectedCentreId, allStaff]);

  const handleDragStart = (e: React.DragEvent, staff: StaffMember) => {
    e.dataTransfer.setData('staffId', staff.id);
    e.dataTransfer.setData('dragType', 'staff');
  };

  const handleDropStaff = (staffId: string, roomId: string, date: string) => {
    const staff = allStaff.find(s => s.id === staffId);
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
    toast.success(`Added shift for ${staff.name}`);
  };

  const handleShiftMove = (shiftId: string, newDate: string, newRoomId: string) => {
    setShifts(prev => prev.map(s => 
      s.id === shiftId 
        ? { ...s, date: newDate, roomId: newRoomId, status: 'draft' as const }
        : s
    ));
    toast.success('Shift moved');
  };

  const handleOpenShiftDrop = (staffId: string, openShift: OpenShift) => {
    const staff = allStaff.find(s => s.id === staffId);
    if (!staff) return;

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

  const handleGenerateAIShifts = async () => {
    setIsGenerating(true);
    toast.info('AI is generating optimized shifts...');
    
    setTimeout(() => {
      const newShifts: Shift[] = [];
      const availableStaff = allStaff.filter(s => 
        s.currentWeeklyHours < s.maxHoursPerWeek &&
        (s.preferredCentres.includes(selectedCentreId) || s.preferredCentres.length === 0)
      );

      centreOpenShifts.forEach((openShift, idx) => {
        const staff = availableStaff[idx % availableStaff.length];
        if (staff) {
          newShifts.push({
            id: `shift-ai-${Date.now()}-${idx}`,
            staffId: staff.id,
            centreId: openShift.centreId,
            roomId: openShift.roomId,
            date: openShift.date,
            startTime: openShift.startTime,
            endTime: openShift.endTime,
            breakMinutes: 30,
            status: 'draft',
            isOpenShift: false,
          });
        }
      });

      setShifts(prev => [...prev, ...newShifts]);
      setOpenShifts(prev => prev.filter(os => os.centreId !== selectedCentreId));
      setIsGenerating(false);
      toast.success(`Generated ${newShifts.length} AI-optimized shifts`);
    }, 2000);
  };

  const handleCopyWeek = () => {
    const previousWeekStart = startOfWeek(subWeeks(currentDate, 1), { weekStartsOn: 1 });
    const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    
    const previousWeekShifts = shifts.filter(s => {
      const shiftDate = new Date(s.date);
      return s.centreId === selectedCentreId && 
        shiftDate >= previousWeekStart && 
        shiftDate < currentWeekStart;
    });

    if (previousWeekShifts.length === 0) {
      toast.info('No shifts found in previous week to copy');
      return;
    }

    const newShifts = previousWeekShifts.map((shift, idx) => {
      const originalDate = new Date(shift.date);
      const dayOfWeek = originalDate.getDay();
      const newDate = addDays(currentWeekStart, dayOfWeek === 0 ? 6 : dayOfWeek - 1);
      
      return {
        ...shift,
        id: `shift-copy-${Date.now()}-${idx}`,
        date: format(newDate, 'yyyy-MM-dd'),
        status: 'draft' as const,
      };
    });

    setShifts(prev => [...prev, ...newShifts]);
    toast.success(`Copied ${newShifts.length} shifts from previous week`);
  };

  const handleExportPDF = () => {
    exportToPDF({ shifts, staff: allStaff, centre: selectedCentre, dates, weeklyBudget });
    toast.success('PDF exported successfully');
  };

  const handleExportExcel = () => {
    exportToExcel({ shifts, staff: allStaff, centre: selectedCentre, dates, weeklyBudget });
    toast.success('Excel exported successfully');
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
    const newShift = { ...shift, id: `shift-${Date.now()}`, status: 'draft' as const };
    setShifts(prev => [...prev, newShift]);
    toast.success('Shift duplicated');
  };

  const handleAddShift = (staffId: string, date: string, roomId: string, template?: ShiftTemplate) => {
    const staff = allStaff.find(s => s.id === staffId);
    if (!staff) return;

    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      staffId,
      centreId: selectedCentreId,
      roomId,
      date,
      startTime: template?.startTime || '09:00',
      endTime: template?.endTime || '17:00',
      breakMinutes: template?.breakMinutes ?? 30,
      status: 'draft',
      isOpenShift: false,
    };

    setShifts(prev => [...prev, newShift]);
    if (!template) {
      setSelectedShift(newShift);
    }
    toast.success(`Created ${template?.name || 'custom'} shift for ${staff.name}`);
  };

  const handleSwapStaff = (shift: Shift) => {
    setShiftToSwap(shift);
    setShowSwapModal(true);
    setSelectedShift(null);
  };

  const handleConfirmSwap = (fromShift: Shift, toStaffId: string) => {
    const newStaff = allStaff.find(s => s.id === toStaffId);
    setShifts(prev => prev.map(s => 
      s.id === fromShift.id 
        ? { ...s, staffId: toStaffId, status: 'draft' as const }
        : s
    ));
    toast.success(`Shift swapped to ${newStaff?.name}`);
    setShiftToSwap(null);
  };

  const handleAddOpenShift = (openShift: Omit<OpenShift, 'id'>) => {
    const newOpenShift: OpenShift = {
      ...openShift,
      id: `open-${Date.now()}`,
    };
    setOpenShifts(prev => [...prev, newOpenShift]);
    toast.success('Open shift added');
  };

  const handleLeaveApprove = (id: string) => {
    toast.success('Leave request approved');
  };

  const handleLeaveReject = (id: string) => {
    toast.success('Leave request rejected');
  };

  const handleCreateLeaveRequest = (request: Omit<TimeOff, 'id'>) => {
    toast.success('Leave request submitted');
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
                  <SelectItem key={centre.id} value={centre.id}>{centre.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <Users className="h-4 w-4 mr-2" />
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

          <div className="flex items-center gap-2">
            {centreOpenShifts.length > 0 && (
              <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                {centreOpenShifts.length} Open
              </Badge>
            )}
            {criticalFlags.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {criticalFlags.length} Critical
              </Badge>
            )}
            
            {/* Cost summary mini */}
            <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">${costSummary.totalCost.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">/ ${weeklyBudget.toLocaleString()}</span>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAddOpenShiftModal(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Open Shift
            </Button>

            <Button variant="outline" size="sm" onClick={handleCopyWeek}>
              <Copy className="h-4 w-4 mr-1" />
              Copy Week
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export to PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export to Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={() => setShowAvailabilityModal(true)}>
              <CalendarCheck className="h-4 w-4 mr-1" />
              Availability
            </Button>

            <Button variant="outline" size="sm" onClick={() => setShowLeaveModal(true)}>
              <CalendarDays className="h-4 w-4 mr-1" />
              Leave
            </Button>

            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button size="sm" onClick={handlePublish}>
              <Send className="h-4 w-4 mr-1" />
              Publish
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
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

      {/* Collapsible Budget Tracker Bar */}
      <Collapsible open={showBudgetBar} onOpenChange={setShowBudgetBar}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-center gap-2 py-1.5 bg-muted/50 border-b border-border hover:bg-muted transition-colors text-xs text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" />
            <span>Budget Tracker</span>
            {showBudgetBar ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <BudgetTrackerBar
            shifts={shifts}
            staff={allStaff}
            centreId={selectedCentreId}
            weeklyBudget={weeklyBudget}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <StaffTimelineGrid
          centre={selectedCentre}
          shifts={shifts.filter(s => s.centreId === selectedCentreId)}
          openShifts={openShifts.filter(os => os.centreId === selectedCentreId)}
          staff={filteredStaff}
          demandData={demandData}
          complianceFlags={complianceFlags}
          dates={dates}
          viewMode={viewMode}
          showDemandOverlay={showDemandOverlay}
          shiftTemplates={shiftTemplates}
          onDropStaff={handleDropStaff}
          onShiftEdit={setSelectedShift}
          onShiftDelete={handleShiftDelete}
          onOpenShiftFill={(os) => toast.info('Drag a staff member to fill this shift')}
          onAddShift={handleAddShift}
          onDragStart={handleDragStart}
          onOpenShiftDrop={handleOpenShiftDrop}
          onShiftMove={handleShiftMove}
        />

        <UnscheduledStaffPanel
          staff={filteredStaff}
          agencyStaff={mockAgencyStaff}
          shifts={shifts}
          selectedCentreId={selectedCentreId}
          onDragStart={handleDragStart}
          onGenerateAI={handleGenerateAIShifts}
          isGenerating={isGenerating}
        />
      </div>

      {/* Summary Bar */}
      <RosterSummaryBar
        shifts={shifts}
        openShifts={openShifts}
        staff={allStaff}
        dates={dates}
        centreId={selectedCentreId}
      />

      {selectedShift && (
        <ShiftDetailPanel
          shift={selectedShift}
          staff={allStaff}
          centre={selectedCentre}
          demandData={demandData}
          complianceFlags={complianceFlags}
          onClose={() => setSelectedShift(null)}
          onSave={handleShiftSave}
          onDelete={handleShiftDelete}
          onDuplicate={handleShiftDuplicate}
          onSwapStaff={handleSwapStaff}
        />
      )}

      <LeaveRequestModal
        open={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        staff={allStaff}
        leaveRequests={leaveRequests}
        onApprove={handleLeaveApprove}
        onReject={handleLeaveReject}
        onCreateRequest={handleCreateLeaveRequest}
      />

      {shiftToSwap && (
        <ShiftSwapModal
          open={showSwapModal}
          onClose={() => { setShowSwapModal(false); setShiftToSwap(null); }}
          shift={shiftToSwap}
          staff={allStaff}
          allShifts={shifts}
          onSwap={handleConfirmSwap}
        />
      )}

      <AddOpenShiftModal
        open={showAddOpenShiftModal}
        onClose={() => setShowAddOpenShiftModal(false)}
        rooms={selectedCentre.rooms}
        centreId={selectedCentreId}
        onAdd={handleAddOpenShift}
      />

      <AvailabilityCalendarModal
        open={showAvailabilityModal}
        onClose={() => setShowAvailabilityModal(false)}
        staff={allStaff}
        currentDate={currentDate}
      />
    </div>
  );
}
