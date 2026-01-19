import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { format, addDays, addMonths, startOfWeek, subWeeks, startOfMonth, endOfMonth, getDaysInMonth, setMonth, setYear, getYear, getMonth } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { ViewMode, Shift, StaffMember, OpenShift, roleLabels, ShiftTemplate, defaultShiftTemplates, TimeOff, SchedulingPreferences } from '@/types/roster';
import { RosterTemplate } from '@/types/rosterTemplates';
import { mockCentres, mockStaff, generateMockShifts, mockOpenShifts, generateMockDemandData, generateMockComplianceFlags, mockAgencyStaff } from '@/data/mockRosterData';
import { generateMockDemandAnalytics, mockStaffAbsences } from '@/data/mockDemandAnalytics';
import { UnscheduledStaffPanel } from '@/components/roster/UnscheduledStaffPanel';
import { StaffTimelineGrid } from '@/components/roster/StaffTimelineGrid';
import { DayTimelineView } from '@/components/roster/DayTimelineView';
import { ShiftDetailPanel } from '@/components/roster/ShiftDetailPanel';
import { RosterSummaryBar } from '@/components/roster/RosterSummaryBar';
import { LeaveRequestModal } from '@/components/roster/LeaveRequestModal';
import { ShiftSwapModal } from '@/components/roster/ShiftSwapModal';
import { ShiftCopyModal } from '@/components/roster/ShiftCopyModal';
import { CopyWeekModal } from '@/components/roster/CopyWeekModal';
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
import { WeeklyOptimizationReport } from '@/components/roster/WeeklyOptimizationReport';
import { SaveRosterTemplateModal } from '@/components/roster/SaveRosterTemplateModal';
import { ApplyTemplateModal } from '@/components/roster/ApplyTemplateModal';
import { BulkShiftAssignmentModal } from '@/components/roster/BulkShiftAssignmentModal';
import { ShiftTemplateManager } from '@/components/roster/ShiftTemplateManager';
import { RosterHistoryPanel } from '@/components/roster/RosterHistoryPanel';
import { AddEmptyShiftModal } from '@/components/roster/AddEmptyShiftModal';
import { AutoAssignStaffModal } from '@/components/roster/AutoAssignStaffModal';
import { IndustryConfigurationModal } from '@/components/settings/IndustryConfigurationModal';
import { DemandMasterSettingsModal } from '@/components/settings/DemandMasterSettingsModal';
import { DemandDataEntryModal } from '@/components/settings/DemandDataEntryModal';
import { detectShiftConflicts } from '@/lib/shiftConflictDetection';
import { exportToPDF, exportToExcel } from '@/lib/rosterExport';
import { useUndoRedo, HistoryEntry } from '@/hooks/useUndoRedo';
import { DemandMasterSettings } from '@/types/industryConfig';
import { useDemand } from '@/contexts/DemandContext';
import { IntegrationManagerModal } from '@/components/settings/IntegrationManagerModal';
import { HolidayEventCalendarView } from '@/components/roster/HolidayEventCalendarView';
import { MobileRosterToolbar } from '@/components/roster/MobileRosterToolbar';
import { MobileStaffPanel } from '@/components/roster/MobileStaffPanel';
import { useIsMobile } from '@/hooks/use-mobile';
import { RecurringPatternsPanel } from '@/components/roster/RecurringPatternsPanel';
import { RecurringShiftManagementPanel } from '@/components/roster/RecurringShiftManagementPanel';
import { FatigueManagementPanel } from '@/components/roster/FatigueManagementPanel';
import { GPSClockInPanel } from '@/components/roster/GPSClockInPanel';
import { WeatherIntegrationPanel } from '@/components/roster/WeatherIntegrationPanel';
import { BreakSchedulingPanel } from '@/components/roster/BreakSchedulingPanel';
import { SkillMatrixPanel } from '@/components/roster/SkillMatrixPanel';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { SendToAgencyModal, BroadcastConfig } from '@/components/roster/SendToAgencyModal';
import { AgencyResponseTracker } from '@/components/roster/AgencyResponseTracker';
import { AgencyNotificationTemplates } from '@/components/roster/AgencyNotificationTemplates';
import { CentreAgencyPreferencesPanel } from '@/components/roster/CentreAgencyPreferencesPanel';
import { PostPlacementRatingModal } from '@/components/roster/PostPlacementRatingModal';
import { AgencyPerformanceDashboard } from '@/components/roster/AgencyPerformanceDashboard';
import { TimefoldConstraintPanel } from '@/components/roster/TimefoldConstraintPanel';
import { 
  TimefoldSolverConfig, 
  defaultSolverConfig, 
  solveWithTimefold,
  ShiftPlanningEntity,
  StaffPlanningEntity,
  TimefoldSolution,
} from '@/lib/timefoldSolver';

// MUI Components
import {
  Button,
  IconButton,
  Box,
  Typography,
  Chip,
  Stack,
  Collapse,
  MenuItem,
} from '@mui/material';
import { Select } from '@/components/mui/Select';
import { Tabs, Tab } from '@/components/mui/Tabs';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from '@/components/mui/DropdownMenu';
import { Tooltip } from '@/components/mui/Tooltip';
import { useThemeMode } from '@/theme/ThemeProvider';

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
  Layers,
  FileStack,
  UserPlus,
  Clock,
  Undo2,
  Redo2,
  History,
  Save,
  Zap,
  TrendingUp,
  Plug,
  Flag,
  Users,
  Repeat,
  Brain,
  MapPin,
  CloudSun,
  Coffee,
  Target,
  Palette,
  Building2,
  Radio,
  Star,
  RefreshCw,
} from 'lucide-react';
import { BarChart2 } from 'lucide-react';

// Default budget configuration per centre
const defaultCentreBudgets: Record<string, number> = {
  'centre-1': 8000,
  'centre-2': 6500,
  'centre-3': 7500,
};

export default function RosterScheduler() {
  const { mode, setMode, resolvedMode } = useThemeMode();
  const isMobile = useIsMobile();
  const { 
    config: demandConfig,
    settings: demandContextSettings, 
    updateSettings: updateDemandContextSettings,
    terminology,
    staffingTerminology,
  } = useDemand();
  
  // Mobile staff panel state
  const [showMobileStaffPanel, setShowMobileStaffPanel] = useState(false);
  
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedCentreId, setSelectedCentreId] = useState<string>(mockCentres[0].id);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Use undo/redo for shifts with history tracking
  const { 
    state: shifts, 
    setState: setShifts, 
    undo: undoShifts, 
    redo: redoShifts, 
    canUndo, 
    canRedo,
    historyEntries,
    currentHistoryIndex,
    revertToHistoryIndex,
    lastSaveTime,
  } = useUndoRedo<Shift[]>(generateMockShifts(), 50);
  
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  
  const [openShifts, setOpenShifts] = useState<OpenShift[]>(mockOpenShifts);
  const [showDemandOverlay, setShowDemandOverlay] = useState(true);
  const [showAnalyticsCharts, setShowAnalyticsCharts] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shiftTemplates, setShiftTemplates] = useState<ShiftTemplate[]>([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [shiftToSwap, setShiftToSwap] = useState<Shift | null>(null);
  const [showAddOpenShiftModal, setShowAddOpenShiftModal] = useState(false);
  const [quickAddOpenShiftContext, setQuickAddOpenShiftContext] = useState<{ roomId: string; date: string } | null>(null);
  const [showBudgetBar, setShowBudgetBar] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStaffProfile, setShowStaffProfile] = useState(false);
  const [showWeeklySummary, setShowWeeklySummary] = useState(false);
  const [showOptimizationReport, setShowOptimizationReport] = useState(false);
  const [selectedStaffForProfile, setSelectedStaffForProfile] = useState<StaffMember | null>(null);
  const [selectedStaffForPrefs, setSelectedStaffForPrefs] = useState<StaffMember | null>(null);
  const [centreBudgets, setCentreBudgets] = useState<Record<string, number>>(defaultCentreBudgets);
  const [staffList, setStaffList] = useState<StaffMember[]>([...mockStaff, ...mockAgencyStaff]);

  // Room assignments (no shift created). Stored per-centre.
  const [staffRoomAssignmentsByCentre, setStaffRoomAssignmentsByCentre] = useState<Record<string, Record<string, string>>>({});
  const [rosterTemplates, setRosterTemplates] = useState<RosterTemplate[]>([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showApplyTemplateModal, setShowApplyTemplateModal] = useState(false);
  const [showBulkAssignmentModal, setShowBulkAssignmentModal] = useState(false);
  const [showShiftTemplateManager, setShowShiftTemplateManager] = useState(false);
  const [showIndustryConfig, setShowIndustryConfig] = useState(false);
  const [showCopyWeekModal, setShowCopyWeekModal] = useState(false);
  const [isStaffPanelCollapsed, setIsStaffPanelCollapsed] = useState(false);
  
  // Demand settings modals
  const [showDemandSettings, setShowDemandSettings] = useState(false);
  const [showDemandDataEntry, setShowDemandDataEntry] = useState(false);
  const [showIntegrationManager, setShowIntegrationManager] = useState(false);
  const [showHolidayCalendar, setShowHolidayCalendar] = useState(false);
  const [showAddEmptyShiftModal, setShowAddEmptyShiftModal] = useState(false);
  
  // Advanced Features panels
  const [showRecurringPatterns, setShowRecurringPatterns] = useState(false);
  const [showRecurringManagement, setShowRecurringManagement] = useState(false);
  const [showFatigueManagement, setShowFatigueManagement] = useState(false);
  const [showGPSClockIn, setShowGPSClockIn] = useState(false);
  const [showWeatherIntegration, setShowWeatherIntegration] = useState(false);
  const [showBreakScheduling, setShowBreakScheduling] = useState(false);
  const [showSkillMatrix, setShowSkillMatrix] = useState(false);
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [showSendToAgencyModal, setShowSendToAgencyModal] = useState(false);
  const [shiftForAgency, setShiftForAgency] = useState<OpenShift | Shift | null>(null);
  const [showAgencyTracker, setShowAgencyTracker] = useState(false);
  const [showNotificationTemplates, setShowNotificationTemplates] = useState(false);
  const [showAgencyPreferences, setShowAgencyPreferences] = useState(false);
  const [showAgencyDashboard, setShowAgencyDashboard] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [placementToRate, setPlacementToRate] = useState<{
    id: string;
    agencyId: string;
    agencyName: string;
    workerId: string;
    workerName: string;
    centreId: string;
    centreName: string;
    shiftDate: string;
  } | null>(null);
  const [emptyShifts, setEmptyShifts] = useState<Array<{
    id: string;
    centreId: string;
    roomId: string;
    date: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    template?: ShiftTemplate;
    requiredQualifications?: any[];
    minimumClassification?: string;
    preferredRole?: any;
    recurring?: {
      isRecurring: boolean;
      pattern?: 'daily' | 'weekly' | 'fortnightly' | 'monthly';
      daysOfWeek?: number[];
      endType?: 'never' | 'after_occurrences' | 'on_date';
      endAfterOccurrences?: number;
      endDate?: string;
      recurrenceGroupId?: string;
    };
  }>>([]);
  
  // Timefold Solver state
  const [showTimefoldPanel, setShowTimefoldPanel] = useState(false);
  const [timefoldConfig, setTimefoldConfig] = useState<TimefoldSolverConfig>(defaultSolverConfig);
  const [isSolvingTimefold, setIsSolvingTimefold] = useState(false);
  const [lastTimefoldSolution, setLastTimefoldSolution] = useState<TimefoldSolution | null>(null);
  
  // Shift copy state
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [shiftToCopy, setShiftToCopy] = useState<Shift | null>(null);
  
  const printRef = useRef<HTMLDivElement>(null);
  
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  const demandData = useMemo(() => generateMockDemandData(), []);
  const demandAnalytics = useMemo(() => generateMockDemandAnalytics(), []);
  const complianceFlags = useMemo(() => generateMockComplianceFlags(), []);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl/Cmd + Z (undo) or Ctrl/Cmd + Shift + Z (redo)
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      
      if (modifier && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) {
            redoShifts();
            toast.success('Redo');
          }
        } else {
          if (canUndo) {
            undoShifts();
            toast.success('Undo');
          }
        }
      }
      
      // Also support Ctrl/Cmd + Y for redo (Windows standard)
      if (modifier && e.key.toLowerCase() === 'y' && !isMac) {
        e.preventDefault();
        if (canRedo) {
          redoShifts();
          toast.success('Redo');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undoShifts, redoShifts]);
  
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
    if (roleFilter === 'all') return allStaff;
    return allStaff.filter(s => s.role === roleFilter);
  }, [allStaff, roleFilter]);

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

  const handleAssignStaffToRoom = (staffId: string, roomId: string) => {
    setStaffRoomAssignmentsByCentre(prev => {
      const current = prev[selectedCentreId] || {};
      return {
        ...prev,
        [selectedCentreId]: {
          ...current,
          [staffId]: roomId,
        },
      };
    });

    const staff = allStaff.find(s => s.id === staffId);
    toast.success(`${staff?.name ?? 'Staff'} assigned to room`);
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

    setShifts(prev => [...prev, newShift], `Added shift for ${staff.name}`, 'add');
    toast.success(`Added shift for ${staff.name}`);
  };

  const handleShiftMove = (shiftId: string, newDate: string, newRoomId: string) => {
    setShifts(prev => prev.map(s => 
      s.id === shiftId 
        ? { ...s, date: newDate, roomId: newRoomId, status: 'draft' as const }
        : s
    ), 'Moved shift', 'move');
    toast.success('Shift moved');
  };

  const handleShiftTypeChange = (shiftId: string, shiftType: Shift['shiftType']) => {
    setShifts(prev => prev.map(s => 
      s.id === shiftId ? { ...s, shiftType } : s
    ), `Changed shift type to ${shiftType || 'regular'}`, 'update');
    toast.success(`Shift marked as ${shiftType || 'regular'}`);
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

    setShifts(prev => [...prev, newShift], `Assigned ${staff.name} to open shift`, 'add');
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
    ), `Published ${draftShifts.length} shifts`, 'bulk');
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

      setShifts(prev => [...prev, ...newShifts], `Generated ${newShifts.length} AI shifts`, 'bulk');
      setOpenShifts(prev => prev.filter(os => os.centreId !== selectedCentreId));
      setIsGenerating(false);
      toast.success(`Generated ${newShifts.length} AI-optimized shifts`);
    }, 2000);
  };

  const handleCopyWeek = () => {
    setShowCopyWeekModal(true);
  };

  const handleCopyWeekShifts = (newShifts: Omit<Shift, 'id'>[]) => {
    const shiftsWithIds = newShifts.map((s, idx) => ({
      ...s,
      id: `shift-copy-${Date.now()}-${idx}`,
    }));
    setShifts(prev => [...prev, ...shiftsWithIds], `Copied ${shiftsWithIds.length} shifts`, 'copy');
  };

  const handleExportPDF = (useColors: boolean = false) => {
    const roomColors = selectedCentre.rooms.map((_, idx) => {
      // Get colors from the current palette - default to ocean palette colors
      const paletteColors = [
        'hsl(200, 75%, 50%)',
        'hsl(185, 70%, 45%)',
        'hsl(220, 70%, 55%)',
        'hsl(195, 80%, 40%)',
      ];
      return paletteColors[idx % paletteColors.length];
    });
    exportToPDF({ shifts, staff: allStaff, centre: selectedCentre, dates, weeklyBudget, roomColors }, useColors);
    toast.success(useColors ? 'Color PDF exported successfully' : 'PDF exported successfully');
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
    console.log('[roster] handleShiftSave', { id: updatedShift.id, isAbsent: updatedShift.isAbsent, staffId: updatedShift.staffId });
    setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s), 'Updated shift', 'update');
    setSelectedShift(updatedShift);
    toast.success('Shift updated');
  };

  const handleShiftDelete = (shiftId: string) => {
    setShifts(prev => prev.filter(s => s.id !== shiftId), 'Deleted shift', 'delete');
    setSelectedShift(null);
    toast.success('Shift removed');
  };

  const handleShiftDuplicate = (shift: Shift) => {
    const newShift = { ...shift, id: `shift-${Date.now()}`, status: 'draft' as const };
    setShifts(prev => [...prev, newShift], 'Duplicated shift', 'add');
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

    setShifts(prev => [...prev, newShift], `Created ${template?.name || 'custom'} shift for ${staff.name}`, 'add');
    if (!template) {
      setSelectedShift(newShift);
    }
    toast.success(`Created ${template?.name || 'custom'} shift for ${staff.name}`);
  };

  const handleAddShiftAtTime = (staffId: string, date: string, roomId: string, startTime: string) => {
    const staff = allStaff.find(s => s.id === staffId);
    if (!staff) return;

    // Calculate end time (default 8 hours from start)
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHour = Math.min(hours + 8, 21); // Cap at 9 PM
    const endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      staffId,
      centreId: selectedCentreId,
      roomId,
      date,
      startTime,
      endTime,
      breakMinutes: 30,
      status: 'draft',
      isOpenShift: false,
    };

    setShifts(prev => [...prev, newShift], `Created shift for ${staff.name}`, 'add');
    setSelectedShift(newShift); // Open the edit panel to adjust times
    toast.success(`Created shift for ${staff.name} starting at ${startTime}`);
  };

  const handleShiftResize = (shiftId: string, newStartTime: string, newEndTime: string) => {
    setShifts(prev => prev.map(s => 
      s.id === shiftId 
        ? { ...s, startTime: newStartTime, endTime: newEndTime, status: 'draft' as const }
        : s
    ), `Resized shift to ${newStartTime}-${newEndTime}`, 'resize');
    toast.success(`Shift resized to ${newStartTime} - ${newEndTime}`);
  };

  const handleShiftReassign = (shiftId: string, newStaffId: string, newDate: string, newRoomId: string) => {
    const newStaff = allStaff.find(s => s.id === newStaffId);
    setShifts(prev => prev.map(s => 
      s.id === shiftId 
        ? { ...s, staffId: newStaffId, date: newDate, roomId: newRoomId, status: 'draft' as const }
        : s
    ), `Reassigned shift to ${newStaff?.name}`, 'move');
    toast.success(`Shift reassigned to ${newStaff?.name}`);
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
    ), `Swapped shift to ${newStaff?.name}`, 'update');
    toast.success(`Shift swapped to ${newStaff?.name}`);
    setShiftToSwap(null);
  };

  const handleCopyShift = (shift: Shift) => {
    setShiftToCopy(shift);
    setShowCopyModal(true);
    setSelectedShift(null);
  };

  const handleConfirmCopy = (newShifts: Omit<Shift, 'id'>[]) => {
    const shiftsWithIds = newShifts.map((s, idx) => ({
      ...s,
      id: `shift-copy-${Date.now()}-${idx}`,
    }));
    setShifts(prev => [...prev, ...shiftsWithIds], `Copied ${shiftsWithIds.length} shifts`, 'copy');
    toast.success(`Copied ${shiftsWithIds.length} shift(s)`);
    setShiftToCopy(null);
  };

  const handleAddOpenShift = (openShifts: Omit<OpenShift, 'id'>[]) => {
    const newOpenShifts: OpenShift[] = openShifts.map((openShift, idx) => ({
      ...openShift,
      id: `open-${Date.now()}-${idx}`,
    }));
    setOpenShifts(prev => [...prev, ...newOpenShifts]);
    // Toast is handled by the modal
  };

  const handleDeleteOpenShift = (openShiftId: string) => {
    setOpenShifts(prev => prev.filter(os => os.id !== openShiftId));
    toast.success('Open shift removed');
  };

  const handleRemoveStaffFromRoom = (staffId: string, roomId: string) => {
    // Remove all shifts for this staff in this room for the current date range
    const dateStrings = dates.map(d => format(d, 'yyyy-MM-dd'));
    const removedCount = shifts.filter(s => 
      s.staffId === staffId && 
      s.roomId === roomId && 
      s.centreId === selectedCentreId &&
      dateStrings.includes(s.date)
    ).length;
    
    setShifts(prev => prev.filter(s => 
      !(s.staffId === staffId && 
        s.roomId === roomId && 
        s.centreId === selectedCentreId &&
        dateStrings.includes(s.date))
    ), `Removed staff from room`, 'delete');
    
    // Also remove from room assignments
    setStaffRoomAssignmentsByCentre(prev => {
      const current = prev[selectedCentreId] || {};
      const { [staffId]: _, ...rest } = current;
      return {
        ...prev,
        [selectedCentreId]: rest,
      };
    });
    
    const staff = allStaff.find(s => s.id === staffId);
    toast.success(`${staff?.name ?? 'Staff'} removed from room${removedCount > 0 ? ` (${removedCount} shifts deleted)` : ''}`);
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

  // Template handlers
  const handleSaveRosterTemplate = (template: Omit<RosterTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTemplate: RosterTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRosterTemplates(prev => [...prev, newTemplate]);
    toast.success(`Template "${template.name}" saved`);
  };

  const handleApplyTemplate = (newShifts: Omit<Shift, 'id'>[]) => {
    const shiftsWithIds = newShifts.map((s, idx) => ({
      ...s,
      id: `shift-template-${Date.now()}-${idx}`,
    }));
    setShifts(prev => [...prev, ...shiftsWithIds], `Applied template (${shiftsWithIds.length} shifts)`, 'bulk');
    toast.success(`Applied ${shiftsWithIds.length} shifts from template`);
  };

  const handleBulkAssignment = (newShifts: Omit<Shift, 'id'>[]) => {
    const shiftsWithIds = newShifts.map((s, idx) => ({
      ...s,
      id: `shift-bulk-${Date.now()}-${idx}`,
    }));
    setShifts(prev => [...prev, ...shiftsWithIds], `Bulk assigned ${shiftsWithIds.length} shifts`, 'bulk');
    toast.success(`Created ${shiftsWithIds.length} shifts`);
  };

  const handleSaveShiftTemplates = (templates: ShiftTemplate[]) => {
    setShiftTemplates(templates);
    toast.success('Shift templates saved');
  };

  // Empty shift and auto-assign handlers - with recurring shift generation
  const handleAddEmptyShifts = (newEmptyShifts: typeof emptyShifts) => {
    const allEmptyShiftsToAdd: typeof emptyShifts = [];
    const directShiftsToAdd: Shift[] = [];
    let totalRecurringGenerated = 0;

    newEmptyShifts.forEach(emptyShift => {
      if (emptyShift.recurring?.isRecurring) {
        // Generate all future shifts based on recurring config and add them directly to the roster
        const generatedShifts = generateRecurringEmptyShifts(emptyShift);
        
        // Convert to actual Shift objects for immediate visibility on the grid
        generatedShifts.forEach(es => {
          directShiftsToAdd.push({
            id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            staffId: '', // Unassigned
            centreId: es.centreId,
            roomId: es.roomId,
            date: es.date,
            startTime: es.startTime,
            endTime: es.endTime,
            breakMinutes: es.breakMinutes,
            status: 'draft' as const,
            isOpenShift: true, // Mark as open shift so it appears on the grid
            recurring: es.recurring ? {
              isRecurring: es.recurring.isRecurring,
              pattern: es.recurring.pattern,
              daysOfWeek: es.recurring.daysOfWeek,
              endType: es.recurring.endType,
              endAfterOccurrences: es.recurring.endAfterOccurrences,
              endDate: es.recurring.endDate,
              recurrenceGroupId: es.recurring.recurrenceGroupId,
            } : undefined,
          });
        });
        totalRecurringGenerated += generatedShifts.length;
      } else {
        allEmptyShiftsToAdd.push(emptyShift);
      }
    });

    // Add non-recurring empty shifts to the queue
    if (allEmptyShiftsToAdd.length > 0) {
      setEmptyShifts(prev => [...prev, ...allEmptyShiftsToAdd]);
    }
    
    // Add recurring shifts directly to the roster grid
    if (directShiftsToAdd.length > 0) {
      setShifts(prev => [...prev, ...directShiftsToAdd], `Created ${directShiftsToAdd.length} recurring shifts`, 'bulk');
    }
    
    if (totalRecurringGenerated > 0) {
      toast.success(`Created ${totalRecurringGenerated} recurring shifts on the roster`);
    } else if (allEmptyShiftsToAdd.length > 0) {
      toast.success(`Created ${allEmptyShiftsToAdd.length} empty shift(s) - ready for auto-assignment`);
    }
  };

  // Helper function to generate recurring empty shifts
  const generateRecurringEmptyShifts = (baseShift: typeof emptyShifts[0]): typeof emptyShifts => {
    const config = baseShift.recurring;
    if (!config?.isRecurring) return [baseShift];

    const generatedShifts: typeof emptyShifts = [];
    const startDate = new Date(baseShift.date);
    const recurrenceGroupId = config.recurrenceGroupId || `recurring-${Date.now()}`;
    
    // Calculate end conditions
    let maxOccurrences = 52; // Default max for "never" end type
    let endDate: Date | null = null;
    
    if (config.endType === 'after_occurrences' && config.endAfterOccurrences) {
      maxOccurrences = config.endAfterOccurrences;
    } else if (config.endType === 'on_date' && config.endDate) {
      endDate = new Date(config.endDate);
    }

    let occurrenceCount = 0;
    let currentDate = new Date(startDate);
    
    // Generate shifts based on pattern
    while (occurrenceCount < maxOccurrences) {
      if (endDate && currentDate > endDate) break;
      
      const shouldCreateShift = (): boolean => {
        if (config.pattern === 'daily') return true;
        
        const dayOfWeek = currentDate.getDay();
        if ((config.pattern === 'weekly' || config.pattern === 'fortnightly') && config.daysOfWeek) {
          if (!config.daysOfWeek.includes(dayOfWeek)) return false;
          
          if (config.pattern === 'fortnightly') {
            const weeksDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
            if (weeksDiff % 2 !== 0) return false;
          }
        }
        return true;
      };

      if (shouldCreateShift()) {
        generatedShifts.push({
          ...baseShift,
          id: `empty-${format(currentDate, 'yyyy-MM-dd')}-${baseShift.roomId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          date: format(currentDate, 'yyyy-MM-dd'),
          recurring: {
            ...config,
            recurrenceGroupId,
          },
        });
        occurrenceCount++;
      }

      // Move to next date based on pattern
      if (config.pattern === 'daily') {
        currentDate = addDays(currentDate, 1);
      } else if (config.pattern === 'weekly' || config.pattern === 'fortnightly') {
        currentDate = addDays(currentDate, 1);
      } else if (config.pattern === 'monthly') {
        currentDate = addMonths(currentDate, 1);
      } else {
        currentDate = addDays(currentDate, 1);
      }
      
      // Safety break to prevent infinite loops
      if (currentDate.getTime() - startDate.getTime() > 365 * 24 * 60 * 60 * 1000 * 2) {
        break;
      }
    }

    return generatedShifts;
  };

  const handleAutoAssign = (assignments: { shiftId: string; staffId: string }[]) => {
    // Convert empty shifts to real shifts with assigned staff
    const newShifts: Shift[] = assignments.map(({ shiftId, staffId }) => {
      const emptyShift = emptyShifts.find(s => s.id === shiftId);
      if (!emptyShift) return null;
      return {
        id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        staffId,
        centreId: emptyShift.centreId,
        roomId: emptyShift.roomId,
        date: emptyShift.date,
        startTime: emptyShift.startTime,
        endTime: emptyShift.endTime,
        breakMinutes: emptyShift.breakMinutes,
        status: 'draft' as const,
        isOpenShift: false,
      };
    }).filter(Boolean) as Shift[];

    setShifts(prev => [...prev, ...newShifts], `Auto-assigned ${newShifts.length} shifts`, 'bulk');
    // Remove assigned empty shifts
    const assignedIds = new Set(assignments.map(a => a.shiftId));
    setEmptyShifts(prev => prev.filter(s => !assignedIds.has(s.id)));
    toast.success(`Auto-assigned ${newShifts.length} shift(s)`);
  };

  const allShiftTemplates = [...defaultShiftTemplates, ...shiftTemplates];

  const centreOptions = mockCentres.map(centre => ({
    value: centre.id,
    label: centre.name,
  }));

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    ...Object.entries(roleLabels).map(([key, label]) => ({
      value: key,
      label,
    })),
  ];

  return (
    <Box className="h-screen flex flex-col w-full max-w-full overflow-x-hidden" sx={{ bgcolor: 'background.default' }}>
      {/* Mobile Toolbar */}
      <MobileRosterToolbar
        currentDate={currentDate}
        dates={dates}
        viewMode={viewMode}
        costSummary={costSummary}
        weeklyBudget={weeklyBudget}
        openShiftCount={centreOpenShifts.length}
        alertCount={centreFlags.length}
        conflictCount={conflictCount}
        canUndo={canUndo}
        canRedo={canRedo}
        showDemandOverlay={showDemandOverlay}
        emptyShiftsCount={emptyShifts.filter(s => s.centreId === selectedCentreId).length}
        isDarkMode={resolvedMode === 'dark'}
        centres={mockCentres.map(c => ({ id: c.id, name: c.name }))}
        selectedCentreId={selectedCentreId}
        roleOptions={roleOptions}
        selectedRole={roleFilter}
        onCentreChange={setSelectedCentreId}
        onRoleChange={setRoleFilter}
        onNavigateDate={navigateDate}
        onToday={() => setCurrentDate(new Date())}
        onViewModeChange={setViewMode}
        onPublish={handlePublish}
        onAddOpenShift={() => setShowAddOpenShiftModal(true)}
        onBulkAssign={() => setShowBulkAssignmentModal(true)}
        onAutoAssign={() => setShowAutoAssignModal(true)}
        onAddEmptyShift={() => setShowAddEmptyShiftModal(true)}
        onCopyWeek={handleCopyWeek}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        onPrint={handlePrint}
        onShowSummary={() => setShowWeeklySummary(true)}
        onShowOptimize={() => setShowOptimizationReport(true)}
        onShowAlerts={() => setShowAlerts(true)}
        onShowConflicts={() => setShowConflicts(true)}
        onShowNotifications={() => setShowNotifications(true)}
        onShowBudgetSettings={() => setShowBudgetSettings(true)}
        onShowHistory={() => setShowHistoryPanel(true)}
        onSaveTemplate={() => setShowSaveTemplateModal(true)}
        onApplyTemplate={() => setShowApplyTemplateModal(true)}
        onManageShiftTemplates={() => setShowShiftTemplateManager(true)}
        onIndustrySettings={() => setShowIndustryConfig(true)}
        onDemandSettings={() => setShowDemandSettings(true)}
        onDemandDataEntry={() => setShowDemandDataEntry(true)}
        onIntegrationManager={() => setShowIntegrationManager(true)}
        onShowHolidays={() => setShowHolidayCalendar(true)}
        onShowAvailability={() => setShowAvailabilityModal(true)}
        onShowLeaveRequests={() => setShowLeaveModal(true)}
        onShowStaffPreferences={() => {
          if (allStaff.length > 0) openPreferencesForStaff(allStaff[0]);
        }}
        onUndo={undoShifts}
        onRedo={redoShifts}
        onToggleDemand={() => {
          setShowAnalyticsCharts(prev => !prev);
          setShowDemandOverlay(prev => !prev);
        }}
        onToggleTheme={() => setMode(resolvedMode === 'dark' ? 'light' : 'dark')}
        onToggleStaffPanel={() => setShowMobileStaffPanel(true)}
      />

      {/* Mobile Staff Panel */}
      <MobileStaffPanel
        isOpen={showMobileStaffPanel}
        onClose={() => setShowMobileStaffPanel(false)}
        staff={filteredStaff}
        agencyStaff={mockAgencyStaff}
        shifts={shifts}
        selectedCentreId={selectedCentreId}
        onDragStart={handleDragStart}
        onGenerateAI={handleGenerateAIShifts}
        isGenerating={isGenerating}
      />

      {/* Mobile/Tablet FAB for Staff Panel - Show on screens below lg */}
      <Box
        sx={{ display: { xs: 'block', lg: 'none' } }}
      >
        <Button
          onClick={() => setShowMobileStaffPanel(true)}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            zIndex: 40,
            borderRadius: '50%',
            minWidth: 56,
            width: 56,
            height: 56,
            boxShadow: 3,
          }}
          variant="contained"
          color="primary"
        >
          <Users className="h-6 w-6" />
        </Button>
      </Box>

      {/* Desktop Header - Material Style */}
      <Box component="header" sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', flexShrink: 0, boxShadow: 1, display: { xs: 'none', lg: 'block' } }}>
        {/* Top Bar - Navigation & Primary Actions */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Stack direction="row" spacing={{ xs: 1, lg: 3 }} alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
            {/* Logo/Brand */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ height: 32, width: 32, borderRadius: 2, bgcolor: 'primary.main', opacity: 0.1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Calendar className="h-5 w-5" style={{ position: 'absolute', color: 'var(--mui-palette-primary-main)' }} />
              </Box>
              <Typography variant="h6" fontWeight={600}>Rosters</Typography>
            </Stack>

            {/* Centre Selector */}
            <Select
              value={selectedCentreId}
              onValueChange={setSelectedCentreId}
              options={centreOptions}
              size="small"
              fullWidth={false}
              className="min-w-[160px] lg:min-w-[200px]"
            />

            {/* Role Filter */}
            <Select
              value={roleFilter}
              onValueChange={setRoleFilter}
              options={roleOptions}
              size="small"
              fullWidth={false}
              className="min-w-[100px] lg:min-w-[140px]"
            />
          </Stack>

          {/* Status Badges & Primary Actions */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {/* Status indicators - hide labels on tablet */}
            <Stack direction="row" spacing={0.5} sx={{ mr: { xs: 0, lg: 1 } }}>
              {centreOpenShifts.length > 0 && (
                <Chip 
                  size="small" 
                  label={`${centreOpenShifts.length} Open`}
                  color="warning"
                  variant="outlined"
                  icon={<Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'warning.main', animation: 'pulse 2s infinite' }} />}
                />
              )}
              {criticalFlags.length > 0 && (
                <Chip 
                  size="small" 
                  label={`${criticalFlags.length} Critical`}
                  color="error"
                  variant="outlined"
                  icon={<AlertTriangle size={14} />}
                />
              )}
            </Stack>

            {/* Summary Dashboard - Icon only on tablet */}
            <Tooltip content="Summary Dashboard">
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => setShowWeeklySummary(true)}
                startIcon={<BarChart3 size={16} />}
                sx={{ 
                  minWidth: { md: 'auto', lg: 'unset' },
                  px: { md: 1, lg: 2 },
                  '& .MuiButton-startIcon': { mr: { md: 0, lg: 1 } }
                }}
              >
                <Box component="span" sx={{ display: { md: 'none', lg: 'inline' } }}>Summary</Box>
              </Button>
            </Tooltip>

            {/* Optimization Report - Icon only on tablet */}
            <Tooltip content="Optimization Report">
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => setShowOptimizationReport(true)}
                startIcon={<TrendingUp size={16} />}
                color="success"
                sx={{ 
                  minWidth: { md: 'auto', lg: 'unset' },
                  px: { md: 1, lg: 2 },
                  '& .MuiButton-startIcon': { mr: { md: 0, lg: 1 } }
                }}
              >
                <Box component="span" sx={{ display: { md: 'none', lg: 'inline' } }}>Optimize</Box>
              </Button>
            </Tooltip>

            {/* Budget indicator - Compact on tablet */}
            <Button 
              variant="text" 
              size="small"
              onClick={() => setShowBudgetBar(prev => !prev)}
              sx={{ bgcolor: 'action.hover', px: 1.5 }}
            >
              <DollarSign size={16} />
              <Typography variant="body2" fontWeight={500} sx={{ ml: 0.5 }}>
                ${costSummary.totalCost.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5, display: { md: 'none', lg: 'inline' } }}>
                / ${weeklyBudget.toLocaleString()}
              </Typography>
            </Button>

            {/* Publish Button - Primary */}
            <Tooltip content="Publish Roster">
              <Button 
                variant="contained" 
                onClick={handlePublish}
                startIcon={<Send size={16} />}
                sx={{ 
                  minWidth: { md: 'auto', lg: 'unset' },
                  px: { md: 1.5, lg: 2 },
                  '& .MuiButton-startIcon': { mr: { md: 0, lg: 1 } }
                }}
              >
                <Box component="span" sx={{ display: { md: 'none', lg: 'inline' } }}>Publish</Box>
              </Button>
            </Tooltip>
          </Stack>
        </Box>

        {/* Toolbar Row - Clean & Organized */}
        <Box sx={{ px: 2, py: 1, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, overflow: 'hidden' }}>
          {/* Left: Date Navigation & View Mode */}
          <Stack direction="row" spacing={{ xs: 1, lg: 2 }} alignItems="center" sx={{ flexWrap: 'wrap', minWidth: 0 }}>
            {/* Date Navigation Group */}
            <Stack direction="row" alignItems="center" sx={{ bgcolor: 'grey.100', borderRadius: 1.5, p: 0.5, flexShrink: 0 }}>
              <IconButton size="small" onClick={() => navigateDate('prev')} sx={{ color: 'text.secondary' }}>
                <ChevronLeft size={18} />
              </IconButton>
              <Button 
                size="small" 
                onClick={() => setCurrentDate(new Date())} 
                sx={{ px: { xs: 1, lg: 2 }, minWidth: 'auto', color: 'primary.main', fontWeight: 600 }}
              >
                Today
              </Button>
              <IconButton size="small" onClick={() => navigateDate('next')} sx={{ color: 'text.secondary' }}>
                <ChevronRight size={18} />
              </IconButton>
            </Stack>
            
            {/* Date Range Display with Calendar Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  size="small"
                  variant="outlined"
                  sx={{ 
                    minWidth: { xs: 120, lg: 160 }, 
                    justifyContent: 'flex-start',
                    gap: 1,
                    fontWeight: 600,
                    color: 'text.primary',
                    borderColor: 'divider',
                    px: { xs: 1, lg: 2 },
                    fontSize: { xs: '0.75rem', lg: '0.875rem' },
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderColor: 'primary.main',
                    }
                  }}
                >
                  <Calendar size={16} />
                  <Box component="span" sx={{ display: { xs: 'none', lg: 'inline' } }}>
                    {format(dates[0], 'MMM d')} - {format(dates[dates.length - 1], 'MMM d, yyyy')}
                  </Box>
                  <Box component="span" sx={{ display: { xs: 'inline', lg: 'none' } }}>
                    {format(dates[0], 'MMM d')}
                  </Box>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0 z-50">
                <CalendarComponent
                  mode="single"
                  selected={currentDate}
                  onSelect={(date) => date && setCurrentDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* View Mode Tabs - Compact on tablet */}
            <Stack direction="row" sx={{ bgcolor: 'grey.100', borderRadius: 1.5, p: 0.5, flexShrink: 0 }}>
              {(['day', 'week', 'fortnight', 'month'] as ViewMode[]).map((mode) => (
                <Button
                  key={mode}
                  size="small"
                  onClick={() => setViewMode(mode)}
                  sx={{
                    px: { xs: 1, lg: 2 },
                    py: 0.5,
                    minWidth: 'auto',
                    borderRadius: 1,
                    textTransform: 'capitalize',
                    fontWeight: viewMode === mode ? 600 : 400,
                    fontSize: { xs: '0.7rem', lg: '0.875rem' },
                    bgcolor: viewMode === mode ? 'background.paper' : 'transparent',
                    color: viewMode === mode ? 'primary.main' : 'text.secondary',
                    boxShadow: viewMode === mode ? 1 : 0,
                    '&:hover': {
                      bgcolor: viewMode === mode ? 'background.paper' : 'grey.200',
                    },
                  }}
                >
                  {mode === 'fortnight' ? (
                    <Box component="span">
                      <Box component="span" sx={{ display: { xs: 'none', lg: 'inline' } }}>Fortnight</Box>
                      <Box component="span" sx={{ display: { xs: 'inline', lg: 'none' } }}>2W</Box>
                    </Box>
                  ) : (
                    mode.charAt(0).toUpperCase() + mode.slice(1)
                  )}
                </Button>
              ))}
            </Stack>
          </Stack>

          {/* Right: Action Groups */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {/* Demand Analytics Toggle - Shows demand charts inline with the roster */}
            <Chip
              size="small"
              label="Demand"
              icon={showAnalyticsCharts ? <Eye size={14} /> : <EyeOff size={14} />}
              onClick={() => {
                setShowAnalyticsCharts(prev => !prev);
                setShowDemandOverlay(prev => !prev);
              }}
              color={showAnalyticsCharts ? "primary" : "default"}
              variant={showAnalyticsCharts ? "filled" : "outlined"}
              sx={{ fontWeight: 500 }}
            />

            {/* Undo/Redo Group */}
            <Stack 
              direction="row" 
              spacing={0.5} 
              sx={{ 
                bgcolor: 'grey.100', 
                borderRadius: 1.5, 
                p: 0.5,
                '& .MuiIconButton-root': {
                  borderRadius: 1,
                }
              }}
            >
              <Tooltip content={`Undo (${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Z)`}>
                <span>
                  <IconButton 
                    size="small" 
                    onClick={undoShifts} 
                    disabled={!canUndo}
                    sx={{ color: canUndo ? 'text.secondary' : 'text.disabled' }}
                  >
                    <Undo2 size={18} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip content={`Redo (${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Shift+Z)`}>
                <span>
                  <IconButton 
                    size="small" 
                    onClick={redoShifts} 
                    disabled={!canRedo}
                    sx={{ color: canRedo ? 'text.secondary' : 'text.disabled' }}
                  >
                    <Redo2 size={18} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip content="View History">
                <IconButton 
                  size="small" 
                  onClick={() => setShowHistoryPanel(prev => !prev)}
                  sx={{ 
                    color: showHistoryPanel ? 'primary.main' : 'text.secondary',
                    bgcolor: showHistoryPanel ? 'primary.lighter' : 'transparent',
                  }}
                >
                  <History size={18} />
                </IconButton>
              </Tooltip>
              {lastSaveTime && (
                <Tooltip content={`Auto-saved at ${lastSaveTime.toLocaleTimeString()}`}>
                  <Box sx={{ display: 'flex', alignItems: 'center', px: 0.5 }}>
                    <Save size={12} className="text-green-600" />
                  </Box>
                </Tooltip>
              )}
            </Stack>

            {/* Quick Actions Group - Always shown on desktop (lg+) */}
            <Stack 
              direction="row" 
              spacing={0.5} 
              sx={{ 
                bgcolor: 'grey.100', 
                borderRadius: 1.5, 
                p: 0.5,
                '& .MuiIconButton-root': {
                  borderRadius: 1,
                }
              }}
            >
              <Tooltip content="Add Open Shift">
                <IconButton size="small" onClick={() => setShowAddOpenShiftModal(true)} sx={{ color: 'text.secondary' }}>
                  <Plus size={18} />
                </IconButton>
              </Tooltip>
              <Tooltip content="Bulk Assign">
                <IconButton size="small" onClick={() => setShowBulkAssignmentModal(true)} sx={{ color: 'text.secondary' }}>
                  <UserPlus size={18} />
                </IconButton>
              </Tooltip>
              <Tooltip content="Create Empty Shifts">
                <IconButton size="small" onClick={() => setShowAddEmptyShiftModal(true)} sx={{ color: 'text.secondary' }}>
                  <Layers size={18} />
                </IconButton>
              </Tooltip>
              <Tooltip content="Copy Week">
                <IconButton size="small" onClick={handleCopyWeek} sx={{ color: 'text.secondary' }}>
                  <Copy size={18} />
                </IconButton>
              </Tooltip>
              <Tooltip content="View Agency Broadcasts">
                <IconButton size="small" onClick={() => setShowAgencyTracker(true)} sx={{ color: 'text.secondary' }}>
                  <Building2 size={18} />
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Auto-Assign Button - Shows when empty shifts exist */}
            {emptyShifts.filter(s => s.centreId === selectedCentreId).length > 0 && (
              <Button
                variant="contained"
                color="secondary"
                size="small"
                onClick={() => setShowAutoAssignModal(true)}
                startIcon={<Zap size={16} />}
              >
                Auto-Assign ({emptyShifts.filter(s => s.centreId === selectedCentreId).length})
              </Button>
            )}

            {/* Dropdown Menus Group */}
            <Stack 
              direction="row" 
              spacing={0.5} 
              sx={{ 
                bgcolor: 'grey.100', 
                borderRadius: 1.5, 
                p: 0.5,
              }}
            >

              {/* Export Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton size="small" sx={{ borderRadius: 1, color: 'text.secondary' }}>
                    <Download size={18} />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExportPDF(false)} icon={<FileText size={16} />}>
                    Export to PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportPDF(true)} icon={<Palette size={16} />}>
                    Export Color PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel} icon={<FileSpreadsheet size={16} />}>
                    Export to Excel
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handlePrint} icon={<Printer size={16} />}>
                    Print View
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Templates Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton size="small" sx={{ borderRadius: 1, color: 'text.secondary' }}>
                    <Layers size={18} />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setShowSaveTemplateModal(true)} icon={<FileStack size={16} />}>
                    Save as Template
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowApplyTemplateModal(true)} icon={<Layers size={16} />}>
                    Apply Template
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowShiftTemplateManager(true)} icon={<Clock size={16} />}>
                    Manage Shift Templates
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowIndustryConfig(true)} icon={<Settings size={16} />}>
                    Industry Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDemandSettings(true)} icon={<BarChart2 size={16} />}>
                    Demand Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowDemandDataEntry(true)} icon={<FileSpreadsheet size={16} />}>
                    Enter Demand Data
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowIntegrationManager(true)} icon={<Plug size={16} />}>
                    Integration Manager
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Schedule Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton size="small" sx={{ borderRadius: 1, color: 'text.secondary' }}>
                    <CalendarDays size={18} />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setShowHolidayCalendar(true)} icon={<Flag size={16} />}>
                    Holidays & Events
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowAvailabilityModal(true)} icon={<CalendarCheck size={16} />}>
                    Staff Availability
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowLeaveModal(true)} icon={<CalendarDays size={16} />}>
                    Leave Requests
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    if (allStaff.length > 0) openPreferencesForStaff(allStaff[0]);
                  }} icon={<UserCog size={16} />}>
                    Staff Preferences
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Advanced Features Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton size="small" sx={{ borderRadius: 1, color: 'text.secondary' }}>
                    <Zap size={18} />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setShowRecurringPatterns(true)} icon={<Repeat size={16} />}>
                    Recurring Patterns
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowRecurringManagement(true)} icon={<RefreshCw size={16} />}>
                    Manage Recurring Shifts
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowBreakScheduling(true)} icon={<Coffee size={16} />}>
                    Break Scheduling
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSkillMatrix(true)} icon={<Target size={16} />}>
                    Skill Matrix Matching
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowFatigueManagement(true)} icon={<Brain size={16} />}>
                    Fatigue Management
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowGPSClockIn(true)} icon={<MapPin size={16} />}>
                    GPS Clock-in/out
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowWeatherIntegration(true)} icon={<CloudSun size={16} />}>
                    Weather Integration
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowAgencyTracker(true)} icon={<Radio size={16} />}>
                    View Agency Broadcasts
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowNotificationTemplates(true)} icon={<Mail size={16} />}>
                    Notification Templates
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAgencyPreferences(true)} icon={<Star size={16} />}>
                    Agency Preferences
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAgencyDashboard(true)} icon={<BarChart3 size={16} />}>
                    Agency Performance
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Stack>

            {/* Status Icons Group - Collapse alerts/notifications into single icon on tablet */}
            <Stack 
              direction="row" 
              spacing={0.5} 
              sx={{ 
                bgcolor: 'grey.100', 
                borderRadius: 1.5, 
                p: 0.5,
              }}
            >
              <Tooltip content="View Conflicts">
                <IconButton 
                  size="small"
                  onClick={() => setShowConflicts(true)}
                  sx={{ position: 'relative', borderRadius: 1, color: conflictCount > 0 ? 'error.main' : 'text.secondary' }}
                >
                  <Shield size={18} />
                  {conflictCount > 0 && (
                    <Box 
                      component="span"
                      sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        right: 0, 
                        width: 14, 
                        height: 14, 
                        bgcolor: 'error.main', 
                        color: 'error.contrastText',
                        fontSize: 9, 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontWeight: 700
                      }}
                    >
                      {conflictCount}
                    </Box>
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip content="Alerts">
                <IconButton 
                  size="small"
                  onClick={() => setShowAlerts(true)}
                  sx={{ position: 'relative', borderRadius: 1, color: alertCount > 0 ? 'warning.main' : 'text.secondary' }}
                >
                  <Bell size={18} />
                  {alertCount > 0 && (
                    <Box 
                      component="span"
                      sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        right: 0, 
                        width: 14, 
                        height: 14, 
                        bgcolor: 'warning.main', 
                        color: 'warning.contrastText',
                        fontSize: 9, 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontWeight: 700
                      }}
                    >
                      {alertCount}
                    </Box>
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip content="Notifications">
                <IconButton size="small" onClick={() => setShowNotifications(true)} sx={{ borderRadius: 1, color: 'text.secondary' }}>
                  <Mail size={18} />
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Theme & Settings */}
            <Stack 
              direction="row" 
              spacing={0.5} 
              sx={{ 
                bgcolor: 'grey.100', 
                borderRadius: 1.5, 
                p: 0.5,
              }}
            >
              <Tooltip content={resolvedMode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
                <IconButton 
                  size="small"
                  onClick={() => setMode(resolvedMode === 'dark' ? 'light' : 'dark')}
                  sx={{ borderRadius: 1, color: 'text.secondary' }}
                >
                  {resolvedMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </IconButton>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton size="small" sx={{ borderRadius: 1, color: 'text.secondary' }}>
                    <Settings size={18} />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowBudgetSettings(true)} icon={<DollarSign size={16} />}>
                    Budget Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* Collapsible Budget Tracker Bar */}
      <Box>
        <Button
          fullWidth
          variant="text"
          size="small"
          onClick={() => setShowBudgetBar(!showBudgetBar)}
          sx={{ py: 0.75, bgcolor: 'action.hover', borderBottom: 1, borderColor: 'divider', borderRadius: 0 }}
          startIcon={<DollarSign size={14} />}
          endIcon={showBudgetBar ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        >
          Budget Tracker
        </Button>
        <Collapse in={showBudgetBar}>
          <BudgetTrackerBar
            shifts={shifts}
            staff={allStaff}
            centreId={selectedCentreId}
            weeklyBudget={weeklyBudget}
          />
        </Collapse>
      </Box>

      {/* Main Content */}
      <Box className="flex-1 flex overflow-hidden w-full max-w-full">
        {viewMode === 'day' ? (
          <DayTimelineView
            centre={selectedCentre}
            shifts={shifts.filter(s => s.centreId === selectedCentreId)}
            openShifts={openShifts.filter(os => os.centreId === selectedCentreId)}
            staff={filteredStaff}
            date={currentDate}
            shiftTemplates={shiftTemplates}
            showAnalyticsCharts={showAnalyticsCharts}
            demandAnalytics={demandAnalytics}
            staffAbsences={mockStaffAbsences}
            onShiftEdit={setSelectedShift}
            onShiftDelete={handleShiftDelete}
            onShiftResize={handleShiftResize}
            onAddShift={handleAddShift}
            onAddShiftAtTime={handleAddShiftAtTime}
            onDragStart={handleDragStart}
            onDropStaff={handleDropStaff}
            onStaffClick={openStaffProfile}
            onOpenShiftTemplateManager={() => setShowShiftTemplateManager(true)}
          />
        ) : (
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
            showAnalyticsCharts={showAnalyticsCharts}
            demandAnalytics={demandAnalytics}
            staffAbsences={mockStaffAbsences}
            shiftTemplates={shiftTemplates}
            emptyShifts={emptyShifts.filter(es => es.centreId === selectedCentreId)}
            onDropStaff={handleDropStaff}
            staffRoomAssignments={staffRoomAssignmentsByCentre[selectedCentreId] || {}}
            onAssignStaffToRoom={handleAssignStaffToRoom}
            onRemoveStaffFromRoom={handleRemoveStaffFromRoom}
            onShiftEdit={setSelectedShift}
            onShiftDelete={handleShiftDelete}
            onShiftCopy={handleCopyShift}
            onShiftSwap={handleSwapStaff}
            onShiftTypeChange={handleShiftTypeChange}
            onOpenShiftFill={(os) => toast.info('Drag a staff member to fill this shift')}
            onOpenShiftDelete={handleDeleteOpenShift}
            onAddOpenShift={(roomId, date) => {
              setQuickAddOpenShiftContext({ roomId, date });
              setShowAddOpenShiftModal(true);
            }}
            onAddShift={handleAddShift}
            onDragStart={handleDragStart}
            onOpenShiftDrop={handleOpenShiftDrop}
            onShiftMove={handleShiftMove}
            onShiftReassign={handleShiftReassign}
            onStaffClick={openStaffProfile}
            onOpenShiftTemplateManager={() => setShowShiftTemplateManager(true)}
            onEmptyShiftClick={() => setShowAutoAssignModal(true)}
            onDeleteEmptyShift={(id) => {
              setEmptyShifts(prev => prev.filter(es => es.id !== id));
              toast.success('Empty shift deleted');
            }}
            onSendToAgency={(openShift) => {
              setShiftForAgency(openShift);
              setShowSendToAgencyModal(true);
            }}
          />
        )}

        {/* Desktop Staff Panel - Hidden on mobile and tablet */}
        <div className="hidden lg:block">
          <UnscheduledStaffPanel
            staff={filteredStaff}
            agencyStaff={mockAgencyStaff}
            shifts={shifts}
            selectedCentreId={selectedCentreId}
            centres={mockCentres}
            onDragStart={handleDragStart}
            onGenerateAI={handleGenerateAIShifts}
            isGenerating={isGenerating}
            isCollapsed={isStaffPanelCollapsed}
            onToggleCollapse={() => setIsStaffPanelCollapsed(prev => !prev)}
            onConfigureConstraints={() => setShowTimefoldPanel(true)}
          />
        </div>
      </Box>

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
          existingShifts={shifts}
          onClose={() => setSelectedShift(null)}
          onSave={handleShiftSave}
          onDelete={handleShiftDelete}
          onDuplicate={handleShiftDuplicate}
          onSwapStaff={handleSwapStaff}
          onCopyShift={handleCopyShift}
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

      <ShiftSwapModal
        open={showSwapModal}
        onClose={() => { setShowSwapModal(false); setShiftToSwap(null); }}
        shift={shiftToSwap}
        staff={allStaff}
        allShifts={shifts}
        onSwap={handleConfirmSwap}
      />

      <ShiftCopyModal
        open={showCopyModal}
        onClose={() => { setShowCopyModal(false); setShiftToCopy(null); }}
        shift={shiftToCopy}
        rooms={selectedCentre.rooms}
        staff={allStaff}
        existingShifts={shifts}
        onCopy={handleConfirmCopy}
      />

      <AddOpenShiftModal
        open={showAddOpenShiftModal}
        onClose={() => {
          setShowAddOpenShiftModal(false);
          setQuickAddOpenShiftContext(null);
        }}
        rooms={selectedCentre.rooms}
        centreId={selectedCentreId}
        selectedRoomId={quickAddOpenShiftContext?.roomId}
        selectedDate={quickAddOpenShiftContext?.date}
        onAdd={handleAddOpenShift}
        availableDates={dates}
      />

      <CopyWeekModal
        open={showCopyWeekModal}
        onClose={() => setShowCopyWeekModal(false)}
        shifts={shifts}
        rooms={selectedCentre.rooms}
        staff={allStaff}
        centreId={selectedCentreId}
        currentDate={currentDate}
        onCopy={handleCopyWeekShifts}
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

      <WeeklyOptimizationReport
        shifts={shifts}
        staff={allStaff}
        centre={selectedCentre}
        dates={dates}
        weeklyBudget={weeklyBudget}
        analyticsData={demandAnalytics}
        absences={mockStaffAbsences}
        isOpen={showOptimizationReport}
        onClose={() => setShowOptimizationReport(false)}
      />

      <SaveRosterTemplateModal
        open={showSaveTemplateModal}
        onClose={() => setShowSaveTemplateModal(false)}
        shifts={shifts.filter(s => s.centreId === selectedCentreId)}
        rooms={selectedCentre.rooms}
        centreId={selectedCentreId}
        dates={dates}
        onSave={handleSaveRosterTemplate}
      />

      <ApplyTemplateModal
        open={showApplyTemplateModal}
        onClose={() => setShowApplyTemplateModal(false)}
        rosterTemplates={rosterTemplates}
        shiftTemplates={allShiftTemplates}
        existingShifts={shifts.filter(s => s.centreId === selectedCentreId)}
        rooms={selectedCentre.rooms}
        centreId={selectedCentreId}
        currentDate={currentDate}
        onApply={handleApplyTemplate}
      />

      <BulkShiftAssignmentModal
        open={showBulkAssignmentModal}
        onClose={() => setShowBulkAssignmentModal(false)}
        staff={allStaff}
        rooms={selectedCentre.rooms}
        dates={dates}
        existingShifts={shifts}
        centreId={selectedCentreId}
        shiftTemplates={allShiftTemplates}
        onAssign={handleBulkAssignment}
      />

      <ShiftTemplateManager
        open={showShiftTemplateManager}
        onClose={() => setShowShiftTemplateManager(false)}
        customTemplates={shiftTemplates}
        onSave={handleSaveShiftTemplates}
      />

      {/* History Panel */}
      <RosterHistoryPanel
        open={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
        historyEntries={historyEntries.map(entry => ({
          id: entry.id,
          timestamp: entry.timestamp,
          actionType: entry.actionType,
          description: entry.description,
          shiftsSnapshot: entry.snapshot,
        }))}
        currentIndex={currentHistoryIndex}
        onRevertToIndex={(index) => {
          revertToHistoryIndex(index);
          toast.success(`Reverted to: ${historyEntries[index]?.description}`);
        }}
      />

      {/* Industry Configuration Modal */}
      <IndustryConfigurationModal
        open={showIndustryConfig}
        onClose={() => setShowIndustryConfig(false)}
      />

      {/* Demand Master Settings Modal */}
      <DemandMasterSettingsModal
        open={showDemandSettings}
        onClose={() => setShowDemandSettings(false)}
        settings={demandContextSettings}
        onSave={(newSettings) => {
          updateDemandContextSettings(newSettings);
        }}
      />

      {/* Demand Data Entry Modal */}
      <DemandDataEntryModal
        open={showDemandDataEntry}
        onClose={() => setShowDemandDataEntry(false)}
        centre={selectedCentre}
        currentDate={currentDate}
      />

      {/* Integration Manager Modal */}
      <IntegrationManagerModal
        open={showIntegrationManager}
        onClose={() => setShowIntegrationManager(false)}
      />

      {/* Holiday & Events Calendar Sheet */}
      {showHolidayCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-w-lg w-full mx-4 max-h-[90vh] overflow-auto">
            <HolidayEventCalendarView
              currentDate={currentDate}
              onDateClick={(date) => {
                setCurrentDate(date);
                setShowHolidayCalendar(false);
              }}
              onClose={() => setShowHolidayCalendar(false)}
            />
          </div>
        </div>
      )}

      {/* Add Empty Shift Modal */}
      <AddEmptyShiftModal
        open={showAddEmptyShiftModal}
        onClose={() => setShowAddEmptyShiftModal(false)}
        rooms={selectedCentre.rooms}
        centreId={selectedCentreId}
        availableDates={dates}
        shiftTemplates={allShiftTemplates}
        onAdd={handleAddEmptyShifts}
      />

      {/* Auto-Assign Staff Modal */}
      <AutoAssignStaffModal
        open={showAutoAssignModal}
        onClose={() => setShowAutoAssignModal(false)}
        emptyShifts={emptyShifts.filter(s => s.centreId === selectedCentreId)}
        staff={allStaff}
        rooms={selectedCentre.rooms}
        existingShifts={shifts}
        onAssign={handleAutoAssign}
      />

      {/* Advanced Features Panels - Using PrimaryOffCanvas */}
      <PrimaryOffCanvas
        open={showRecurringPatterns}
        onClose={() => setShowRecurringPatterns(false)}
        title="Recurring Shift Patterns"
        description="Create and manage recurring shift templates"
        icon={Repeat}
        size="3xl"
        showFooter={false}
      >
        <RecurringPatternsPanel 
          centreId={selectedCentreId}
          centre={selectedCentre}
          staff={allStaff}
          existingShifts={shifts}
          onGenerateShifts={(newShifts) => {
            const shiftsWithIds = newShifts.map((s, idx) => ({
              ...s,
              id: `shift-pattern-${Date.now()}-${idx}`,
            }));
            setShifts(prev => [...prev, ...shiftsWithIds], `Generated ${shiftsWithIds.length} recurring shifts`, 'bulk');
          }}
        />
      </PrimaryOffCanvas>

      <PrimaryOffCanvas
        open={showBreakScheduling}
        onClose={() => setShowBreakScheduling(false)}
        title="Break Scheduling"
        description="Manage staff break times and compliance"
        icon={Coffee}
        size="3xl"
        showFooter={false}
      >
        <BreakSchedulingPanel />
      </PrimaryOffCanvas>

      <PrimaryOffCanvas
        open={showSkillMatrix}
        onClose={() => setShowSkillMatrix(false)}
        title="Skill Matrix Matching"
        description="Match staff to shifts based on qualifications"
        icon={Target}
        size="3xl"
        showFooter={false}
      >
        <SkillMatrixPanel 
          centreId={selectedCentreId}
          centre={selectedCentre}
          staff={allStaff}
          shifts={shifts}
          openShifts={openShifts}
          onAssignStaff={(staffId, shiftId) => {
            const openShift = openShifts.find(os => os.id === shiftId);
            if (openShift) {
              const staffMember = allStaff.find(s => s.id === staffId);
              const newShift: Omit<Shift, 'id'> = {
                staffId,
                centreId: openShift.centreId,
                roomId: openShift.roomId,
                date: openShift.date,
                startTime: openShift.startTime,
                endTime: openShift.endTime,
                breakMinutes: openShift.breakMinutes || 30,
                status: 'draft',
                isOpenShift: false,
              };
              setShifts(prev => [...prev, { ...newShift, id: `shift-skill-${Date.now()}` }], 
                `Assigned ${staffMember?.name || 'staff'} via skill matching`, 'add');
            }
            toast.success(`Staff assigned to shift via skill matching`);
          }}
        />
      </PrimaryOffCanvas>

      <PrimaryOffCanvas
        open={showFatigueManagement}
        onClose={() => setShowFatigueManagement(false)}
        title="Fatigue Management"
        description="Monitor staff fatigue levels and compliance"
        icon={Brain}
        size="3xl"
        showFooter={false}
      >
        <FatigueManagementPanel 
          staff={allStaff}
          shifts={shifts}
        />
      </PrimaryOffCanvas>

      <PrimaryOffCanvas
        open={showGPSClockIn}
        onClose={() => setShowGPSClockIn(false)}
        title="GPS Clock-in/out"
        description="Manage geofence zones and attendance validation"
        icon={MapPin}
        size="3xl"
        showFooter={false}
      >
        <GPSClockInPanel />
      </PrimaryOffCanvas>

      <PrimaryOffCanvas
        open={showWeatherIntegration}
        onClose={() => setShowWeatherIntegration(false)}
        title="Weather Integration"
        description="Weather-based demand forecasting"
        icon={CloudSun}
        size="3xl"
        showFooter={false}
      >
        <WeatherIntegrationPanel />
      </PrimaryOffCanvas>

      {/* Send to Agency Modal */}
      <SendToAgencyModal
        open={showSendToAgencyModal}
        onClose={() => {
          setShowSendToAgencyModal(false);
          setShiftForAgency(null);
        }}
        shift={shiftForAgency || undefined}
        centreId={selectedCentreId}
        centreName={selectedCentre.name}
        onSend={(config: BroadcastConfig) => {
          console.log('Agency broadcast config:', config);
          toast.success(`Shift broadcast sent to ${config.agencyRules.length} agencies`);
          setShowAgencyTracker(true);
        }}
      />

      {/* Agency Response Tracker */}
      <AgencyResponseTracker
        open={showAgencyTracker}
        onClose={() => setShowAgencyTracker(false)}
        onPlacementAccepted={(placement) => {
          setPlacementToRate(placement);
          setShowRatingModal(true);
        }}
      />

      {/* Agency Notification Templates */}
      <AgencyNotificationTemplates
        open={showNotificationTemplates}
        onClose={() => setShowNotificationTemplates(false)}
      />

      {/* Centre Agency Preferences */}
      <CentreAgencyPreferencesPanel
        open={showAgencyPreferences}
        onClose={() => setShowAgencyPreferences(false)}
        centreId={selectedCentreId}
        centreName={selectedCentre.name}
      />

      {/* Agency Performance Dashboard */}
      <AgencyPerformanceDashboard
        open={showAgencyDashboard}
        onClose={() => setShowAgencyDashboard(false)}
        centreId={selectedCentreId}
      />

      {/* Post-Placement Rating Modal */}
      {placementToRate && (
        <PostPlacementRatingModal
          open={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setPlacementToRate(null);
          }}
          placement={placementToRate}
          onRatingSubmitted={(rating) => {
            toast.success('Rating submitted successfully');
          }}
        />
      )}

      {/* Recurring Shift Management Panel */}
      <RecurringShiftManagementPanel
        open={showRecurringManagement}
        onClose={() => setShowRecurringManagement(false)}
        shifts={shifts}
        staff={allStaff}
        centres={mockCentres}
        onDeleteSeries={(groupId) => {
          setShifts(prev => prev.filter(s => s.recurring?.recurrenceGroupId !== groupId), 'Deleted recurring series', 'bulk');
        }}
        onEditSeries={(groupId) => {
          toast.info('Edit series functionality - open recurring patterns panel');
          setShowRecurringPatterns(true);
        }}
        onExtendSeries={(groupId, newEndDate) => {
          toast.success(`Series extended to ${newEndDate}`);
        }}
      />

      {/* Timefold Constraint Configuration Panel */}
      <TimefoldConstraintPanel
        open={showTimefoldPanel}
        onClose={() => setShowTimefoldPanel(false)}
        config={timefoldConfig}
        onConfigChange={setTimefoldConfig}
        lastSolution={lastTimefoldSolution}
        onSolve={async () => {
          setIsSolvingTimefold(true);
          toast.info('Running Timefold Solver...');
          try {
            const shiftEntities: ShiftPlanningEntity[] = centreOpenShifts.map(os => ({
              id: os.id,
              shiftId: os.id,
              date: os.date,
              startTime: os.startTime,
              endTime: os.endTime,
              roomId: os.roomId,
              centreId: os.centreId,
              requiredQualifications: os.requiredQualifications || [],
              minimumClassification: os.minimumClassification,
              preferredRole: os.preferredRole,
            }));
            const staffEntities: StaffPlanningEntity[] = allStaff.map(s => ({
              id: s.id,
              name: s.name,
              role: s.role,
              employmentType: s.employmentType,
              isAgency: !!s.agency,
              hourlyRate: s.hourlyRate,
              maxHoursPerWeek: s.maxHoursPerWeek,
              currentHoursAssigned: s.currentWeeklyHours,
              qualifications: s.qualifications.map(q => q.type),
              availability: s.availability,
              preferredCentres: s.preferredCentres,
              defaultCentreId: s.defaultCentreId,
              willingToWorkMultipleLocations: s.willingToWorkMultipleLocations,
              leavesDates: s.timeOff?.filter(t => t.status === 'approved').map(t => t.startDate) || [],
            }));
            const solution = await solveWithTimefold(timefoldConfig, shiftEntities, staffEntities);
            setLastTimefoldSolution(solution);
            
            const aiGeneratedTimestamp = new Date().toISOString();
            const newShifts: Shift[] = solution.assignments.map((a, idx) => {
              const openShift = centreOpenShifts.find(os => os.id === a.shiftId)!;
              return {
                id: `shift-timefold-${Date.now()}-${idx}`,
                staffId: a.staffId,
                centreId: openShift.centreId,
                roomId: openShift.roomId,
                date: openShift.date,
                startTime: openShift.startTime,
                endTime: openShift.endTime,
                breakMinutes: 30,
                status: 'draft',
                isOpenShift: false,
                isAIGenerated: true,
                aiGeneratedAt: aiGeneratedTimestamp,
              };
            });
            setShifts(prev => [...prev, ...newShifts], `Timefold assigned ${newShifts.length} shifts`, 'bulk');
            setOpenShifts(prev => prev.filter(os => !solution.assignments.some(a => a.shiftId === os.id)));
            
            // Show work saved metrics in the toast
            const metrics = solution.workSavedMetrics;
            toast.success(
              `AI assigned ${solution.assignments.length} shifts! Saved ~${metrics.timeSavedMinutes} min of manual work (${metrics.efficiencyPercentage}% faster)`,
              { duration: 5000 }
            );
            
            if (solution.unassignedShifts.length > 0) {
              toast.warning(`${solution.unassignedShifts.length} shifts could not be assigned`);
            }
          } catch (err) {
            toast.error('Solver failed');
          } finally {
            setIsSolvingTimefold(false);
          }
        }}
        isSolving={isSolvingTimefold}
      />

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
    </Box>
  );
}
