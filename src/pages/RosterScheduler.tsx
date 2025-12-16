import { useState, useMemo, useRef } from 'react';
import { format, addDays, startOfWeek, subWeeks, startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns';
import { ViewMode, Shift, StaffMember, OpenShift, roleLabels, ShiftTemplate, defaultShiftTemplates, TimeOff, SchedulingPreferences } from '@/types/roster';
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
import { BudgetSettingsModal } from '@/components/roster/BudgetSettingsModal';
import { AlertNotificationsPanel } from '@/components/roster/AlertNotificationsPanel';
import { RosterPrintView } from '@/components/roster/RosterPrintView';
import { ShiftConflictPanel } from '@/components/roster/ShiftConflictPanel';
import { SchedulingPreferencesModal } from '@/components/roster/SchedulingPreferencesModal';
import { ShiftNotificationsModal } from '@/components/roster/ShiftNotificationsModal';
import { StaffProfileModal } from '@/components/roster/StaffProfileModal';
import { WeeklySummaryDashboard } from '@/components/roster/WeeklySummaryDashboard';
import { detectShiftConflicts } from '@/lib/shiftConflictDetection';
import { exportToPDF, exportToExcel } from '@/lib/rosterExport';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
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
  Copy,
  CalendarDays,
  Plus,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronUp,
  CalendarCheck,
  Bell,
  Printer,
  Shield,
  UserCog,
  Mail,
  Moon,
  Sun,
  BarChart3,
  MoreHorizontal
} from 'lucide-react';

// Default budget configuration per centre
const defaultCentreBudgets: Record<string, number> = {
  'centre-1': 8000,
  'centre-2': 6500,
  'centre-3': 7500,
};

export default function RosterScheduler() {
  const { theme, setTheme } = useTheme();
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
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStaffProfile, setShowStaffProfile] = useState(false);
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);
  const [selectedStaffForProfile, setSelectedStaffForProfile] = useState<StaffMember | null>(null);
  const [selectedStaffForPrefs, setSelectedStaffForPrefs] = useState<StaffMember | null>(null);
  const [centreBudgets, setCentreBudgets] = useState<Record<string, number>>(defaultCentreBudgets);
  const [staffList, setStaffList] = useState<StaffMember[]>([...mockStaff, ...mockAgencyStaff]);
  
  const printRef = useRef<HTMLDivElement>(null);
  
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  const demandData = useMemo(() => generateMockDemandData(), []);
  const complianceFlags = useMemo(() => generateMockComplianceFlags(), []);
  
  const selectedCentre = mockCentres.find(c => c.id === selectedCentreId)!;
  const allStaff = staffList;
  const weeklyBudget = centreBudgets[selectedCentreId] || 7000;
  
  const dates = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const daysInMonth = getDaysInMonth(currentDate);
      return Array.from({ length: daysInMonth }, (_, i) => addDays(monthStart, i));
    }
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const dayCount = viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 14;
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

  const handleSaveBudgetSettings = (settings: { weeklyBudget: number }) => {
    setCentreBudgets(prev => ({
      ...prev,
      [selectedCentreId]: settings.weeklyBudget
    }));
    toast.success('Budget settings saved');
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to use print view');
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedCentre.name} - Weekly Roster</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            @media print { @page { size: landscape; margin: 1cm; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    toast.success('Print view opened');
  };

  const alertCount = useMemo(() => {
    let count = 0;
    const budgetPercent = (costSummary.totalCost / weeklyBudget) * 100;
    if (budgetPercent >= 90) count++;
    count += criticalFlags.length;
    return count;
  }, [costSummary, weeklyBudget, criticalFlags]);

  // Count shift conflicts
  const conflictCount = useMemo(() => {
    const centreShifts = shifts.filter(s => s.centreId === selectedCentreId);
    let totalConflicts = 0;
    centreShifts.forEach(shift => {
      const conflicts = detectShiftConflicts(shift, centreShifts, allStaff, selectedCentre.rooms);
      totalConflicts += conflicts.filter(c => c.severity === 'error').length;
    });
    return totalConflicts;
  }, [shifts, selectedCentreId, allStaff, selectedCentre.rooms]);

  const handleSavePreferences = (staffId: string, preferences: SchedulingPreferences) => {
    setStaffList(prev => prev.map(s => 
      s.id === staffId ? { ...s, schedulingPreferences: preferences } : s
    ));
    toast.success('Scheduling preferences saved');
  };

  const openPreferencesForStaff = (staff: StaffMember) => {
    setSelectedStaffForPrefs(staff);
    setShowPreferences(true);
  };

  const openStaffProfile = (staff: StaffMember) => {
    setSelectedStaffForProfile(staff);
    setShowStaffProfile(true);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header - Material Style */}
      <header className="bg-card border-b border-border shrink-0 shadow-sm">
        {/* Top Bar - Navigation & Primary Actions */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo/Brand */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-semibold text-foreground">Rosters</span>
            </div>

            {/* Centre Selector - Clean dropdown */}
            <Select value={selectedCentreId} onValueChange={setSelectedCentreId}>
              <SelectTrigger className="w-[200px] bg-background border-border h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {mockCentres.map(centre => (
                  <SelectItem key={centre.id} value={centre.id}>{centre.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[140px] bg-background border-border h-9">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Roles</SelectItem>
                {Object.entries(roleLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Badges & Primary Actions */}
          <div className="flex items-center gap-3">
            {/* Status indicators */}
            <div className="flex items-center gap-2 mr-2">
              {centreOpenShifts.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {centreOpenShifts.length} Open
                </div>
              )}
              {criticalFlags.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  {criticalFlags.length} Critical
                </div>
              )}
            </div>

            {/* Summary Dashboard */}
            <Button variant="outline" size="sm" onClick={() => setShowWeeklySummary(true)} className="h-9">
              <BarChart3 className="h-4 w-4 mr-2" />
              Summary
            </Button>

            {/* Budget indicator */}
            <button 
              onClick={() => setShowBudgetBar(prev => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors"
            >
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">${costSummary.totalCost.toLocaleString()}</span>
              <span className="text-muted-foreground">/ ${weeklyBudget.toLocaleString()}</span>
            </button>

            {/* Publish Button - Primary */}
            <Button onClick={handlePublish} className="h-9 px-4">
              <Send className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>

        {/* Toolbar Row - Compact */}
        <div className="px-4 py-2 bg-muted/30 border-t border-border/50 flex items-center justify-between">
          {/* Left: Date Navigation */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-background rounded-lg border border-border overflow-hidden">
              <button 
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-muted transition-colors border-r border-border"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Today
              </button>
              <button 
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-muted transition-colors border-l border-border"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            <span className="text-sm font-medium text-foreground">
              {format(dates[0], 'MMM d')} - {format(dates[dates.length - 1], 'MMM d, yyyy')}
            </span>

            {/* View Mode Tabs */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList className="h-8 bg-background border border-border">
                <TabsTrigger value="day" className="text-xs px-3 h-6">Day</TabsTrigger>
                <TabsTrigger value="week" className="text-xs px-3 h-6">Week</TabsTrigger>
                <TabsTrigger value="fortnight" className="text-xs px-3 h-6">Fortnight</TabsTrigger>
                <TabsTrigger value="month" className="text-xs px-3 h-6">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Demand Toggle */}
            <button 
              onClick={() => setShowDemandOverlay(prev => !prev)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                showDemandOverlay 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {showDemandOverlay ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              Demand
            </button>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Quick Actions */}
            <Button variant="ghost" size="sm" onClick={() => setShowAddOpenShiftModal(true)} className="h-8 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Open Shift
            </Button>

            <Button variant="ghost" size="sm" onClick={handleCopyWeek} className="h-8 text-xs">
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copy Week
            </Button>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Export Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover">
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export to PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export to Excel
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* More Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  <CalendarDays className="h-3.5 w-3.5 mr-1" />
                  Schedule
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-popover">
                <DropdownMenuItem onClick={() => setShowAvailabilityModal(true)}>
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  Staff Availability
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowLeaveModal(true)}>
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Leave Requests
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  if (allStaff.length > 0) openPreferencesForStaff(allStaff[0]);
                }}>
                  <UserCog className="h-4 w-4 mr-2" />
                  Staff Preferences
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-5 bg-border mx-1" />

            {/* Icon Buttons - Compact */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowConflicts(true)}
              className="h-8 w-8 relative"
            >
              <Shield className="h-4 w-4" />
              {conflictCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-medium">
                  {conflictCount}
                </span>
              )}
            </Button>

            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowAlerts(true)}
              className="h-8 w-8 relative"
            >
              <Bell className="h-4 w-4" />
              {alertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-medium">
                  {alertCount}
                </span>
              )}
            </Button>

            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowNotifications(true)}
              className="h-8 w-8"
            >
              <Mail className="h-4 w-4" />
            </Button>

            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-8 w-8"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={() => setShowBudgetSettings(true)}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Budget Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          onStaffClick={openStaffProfile}
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

      <BudgetSettingsModal
        open={showBudgetSettings}
        onClose={() => setShowBudgetSettings(false)}
        centre={selectedCentre}
        currentBudget={weeklyBudget}
        onSave={handleSaveBudgetSettings}
      />

      <AlertNotificationsPanel
        open={showAlerts}
        onClose={() => setShowAlerts(false)}
        shifts={shifts.filter(s => s.centreId === selectedCentreId)}
        staff={allStaff}
        complianceFlags={complianceFlags}
        weeklyBudget={weeklyBudget}
        totalCost={costSummary.totalCost}
        centreId={selectedCentreId}
      />

      <ShiftConflictPanel
        open={showConflicts}
        onClose={() => setShowConflicts(false)}
        shifts={shifts.filter(s => s.centreId === selectedCentreId)}
        staff={allStaff}
        rooms={selectedCentre.rooms}
      />

      {selectedStaffForPrefs && (
        <SchedulingPreferencesModal
          open={showPreferences}
          onClose={() => { setShowPreferences(false); setSelectedStaffForPrefs(null); }}
          staff={selectedStaffForPrefs}
          allRooms={selectedCentre.rooms}
          onSave={handleSavePreferences}
        />
      )}

      <ShiftNotificationsModal
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        shifts={shifts}
        staff={allStaff}
        centreId={selectedCentreId}
      />

      <StaffProfileModal
        staff={selectedStaffForProfile}
        shifts={shifts}
        isOpen={showStaffProfile}
        onClose={() => { setShowStaffProfile(false); setSelectedStaffForProfile(null); }}
      />

      <WeeklySummaryDashboard
        shifts={shifts}
        staff={allStaff}
        centre={selectedCentre}
        dates={dates}
        weeklyBudget={weeklyBudget}
        isOpen={showWeeklySummary}
        onClose={() => setShowWeeklySummary(false)}
      />

      {/* Hidden Print View */}
      <div className="hidden">
        <RosterPrintView
          ref={printRef}
          shifts={shifts.filter(s => s.centreId === selectedCentreId)}
          openShifts={openShifts.filter(os => os.centreId === selectedCentreId)}
          staff={allStaff}
          centre={selectedCentre}
          dates={dates}
          weeklyBudget={weeklyBudget}
          costSummary={costSummary}
        />
      </div>
    </div>
  );
}
