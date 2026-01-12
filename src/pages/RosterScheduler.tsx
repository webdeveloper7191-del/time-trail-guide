import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { format, addDays, startOfWeek, subWeeks, startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns';
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
import { IndustryConfigurationModal } from '@/components/settings/IndustryConfigurationModal';
import { detectShiftConflicts } from '@/lib/shiftConflictDetection';
import { exportToPDF, exportToExcel } from '@/lib/rosterExport';
import { useUndoRedo, HistoryEntry } from '@/hooks/useUndoRedo';
import { IndustryType, DemandConfig, StaffingConfig, getIndustryTemplate } from '@/types/industryConfig';

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
  TrendingUp
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
  const [isStaffPanelCollapsed, setIsStaffPanelCollapsed] = useState(false);
  
  // Industry configuration state
  const [industryType, setIndustryType] = useState<IndustryType>('childcare');
  const [demandConfig, setDemandConfig] = useState<DemandConfig>(getIndustryTemplate('childcare').demandConfig);
  const [staffingConfig, setStaffingConfig] = useState<StaffingConfig>(getIndustryTemplate('childcare').staffingConfig);
  
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

    setShifts(prev => [...prev, ...newShifts], `Copied ${newShifts.length} shifts from last week`, 'copy');
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
    setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s), 'Updated shift', 'update');
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
    <Box className="h-screen flex flex-col" sx={{ bgcolor: 'background.default' }}>
      {/* Header - Material Style */}
      <Box component="header" sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', flexShrink: 0, boxShadow: 1 }}>
        {/* Top Bar - Navigation & Primary Actions */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={3} alignItems="center">
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
              className="min-w-[200px]"
            />

            {/* Role Filter */}
            <Select
              value={roleFilter}
              onValueChange={setRoleFilter}
              options={roleOptions}
              size="small"
              fullWidth={false}
              className="min-w-[140px]"
            />
          </Stack>

          {/* Status Badges & Primary Actions */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Status indicators */}
            <Stack direction="row" spacing={1} sx={{ mr: 1 }}>
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

            {/* Summary Dashboard */}
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => setShowWeeklySummary(true)}
              startIcon={<BarChart3 size={16} />}
            >
              Summary
            </Button>

            {/* Optimization Report */}
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => setShowOptimizationReport(true)}
              startIcon={<TrendingUp size={16} />}
              color="success"
            >
              Optimize
            </Button>

            {/* Budget indicator */}
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
              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                / ${weeklyBudget.toLocaleString()}
              </Typography>
            </Button>

            {/* Publish Button - Primary */}
            <Button 
              variant="contained" 
              onClick={handlePublish}
              startIcon={<Send size={16} />}
            >
              Publish
            </Button>
          </Stack>
        </Box>

        {/* Toolbar Row - Clean & Organized */}
        <Box sx={{ px: 2, py: 1, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: Date Navigation & View Mode */}
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Date Navigation Group */}
            <Stack direction="row" alignItems="center" sx={{ bgcolor: 'grey.100', borderRadius: 1.5, p: 0.5 }}>
              <IconButton size="small" onClick={() => navigateDate('prev')} sx={{ color: 'text.secondary' }}>
                <ChevronLeft size={18} />
              </IconButton>
              <Button 
                size="small" 
                onClick={() => setCurrentDate(new Date())} 
                sx={{ px: 2, minWidth: 'auto', color: 'primary.main', fontWeight: 600 }}
              >
                Today
              </Button>
              <IconButton size="small" onClick={() => navigateDate('next')} sx={{ color: 'text.secondary' }}>
                <ChevronRight size={18} />
              </IconButton>
            </Stack>
            
            <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ minWidth: 150 }}>
              {format(dates[0], 'MMM d')} - {format(dates[dates.length - 1], 'MMM d, yyyy')}
            </Typography>

            {/* View Mode Tabs - Styled */}
            <Stack direction="row" sx={{ bgcolor: 'grey.100', borderRadius: 1.5, p: 0.5 }}>
              {(['day', 'week', 'fortnight', 'month'] as ViewMode[]).map((mode) => (
                <Button
                  key={mode}
                  size="small"
                  onClick={() => setViewMode(mode)}
                  sx={{
                    px: 2,
                    py: 0.5,
                    minWidth: 'auto',
                    borderRadius: 1,
                    textTransform: 'capitalize',
                    fontWeight: viewMode === mode ? 600 : 400,
                    bgcolor: viewMode === mode ? 'background.paper' : 'transparent',
                    color: viewMode === mode ? 'primary.main' : 'text.secondary',
                    boxShadow: viewMode === mode ? 1 : 0,
                    '&:hover': {
                      bgcolor: viewMode === mode ? 'background.paper' : 'grey.200',
                    },
                  }}
                >
                  {mode === 'fortnight' ? 'Fortnight' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>
              ))}
            </Stack>
          </Stack>

          {/* Right: Action Groups */}
          <Stack direction="row" spacing={1} alignItems="center">
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

            {/* Quick Actions Group */}
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
              <Tooltip content="Copy Week">
                <IconButton size="small" onClick={handleCopyWeek} sx={{ color: 'text.secondary' }}>
                  <Copy size={18} />
                </IconButton>
              </Tooltip>
            </Stack>

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
                  <DropdownMenuItem onClick={handleExportPDF} icon={<FileText size={16} />}>
                    Export to PDF
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
            </Stack>

            {/* Status Icons Group */}
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
      <Box className="flex-1 flex overflow-hidden">
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
            onDropStaff={handleDropStaff}
            staffRoomAssignments={staffRoomAssignmentsByCentre[selectedCentreId] || {}}
            onAssignStaffToRoom={handleAssignStaffToRoom}
            onShiftEdit={setSelectedShift}
            onShiftDelete={handleShiftDelete}
            onShiftCopy={handleCopyShift}
            onShiftSwap={handleSwapStaff}
            onOpenShiftFill={(os) => toast.info('Drag a staff member to fill this shift')}
            onAddShift={handleAddShift}
            onDragStart={handleDragStart}
            onOpenShiftDrop={handleOpenShiftDrop}
            onShiftMove={handleShiftMove}
            onShiftReassign={handleShiftReassign}
            onStaffClick={openStaffProfile}
            onOpenShiftTemplateManager={() => setShowShiftTemplateManager(true)}
          />
        )}

        <UnscheduledStaffPanel
          staff={filteredStaff}
          agencyStaff={mockAgencyStaff}
          shifts={shifts}
          selectedCentreId={selectedCentreId}
          onDragStart={handleDragStart}
          onGenerateAI={handleGenerateAIShifts}
          isGenerating={isGenerating}
          isCollapsed={isStaffPanelCollapsed}
          onToggleCollapse={() => setIsStaffPanelCollapsed(prev => !prev)}
        />
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
        currentIndustry={industryType}
        onSave={(industry, newDemandConfig, newStaffingConfig) => {
          setIndustryType(industry);
          setDemandConfig(newDemandConfig);
          setStaffingConfig(newStaffingConfig);
        }}
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
    </Box>
  );
}
