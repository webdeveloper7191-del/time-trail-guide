import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { ViewMode, Centre } from '@/types/roster';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Send,
  Menu,
  Download,
  FileText,
  FileSpreadsheet,
  Printer,
  Layers,
  Settings,
  BarChart3,
  Users,
  Bell,
  DollarSign,
  TrendingUp,
  Undo2,
  Redo2,
  Eye,
  EyeOff,
  UserPlus,
  Zap,
  Copy,
  Shield,
  Mail,
  Moon,
  Sun,
  History,
  Flag,
  CalendarCheck,
  CalendarDays,
  UserCog,
  Clock,
  Plug,
  BarChart2,
  MoveHorizontal,
  LayoutDashboard,
  Target,
  Sparkles,
  Briefcase,
  Home,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface MobileRosterToolbarProps {
  currentDate: Date;
  dates: Date[];
  viewMode: ViewMode;
  costSummary: { totalCost: number; totalHours: number };
  weeklyBudget: number;
  openShiftCount: number;
  alertCount: number;
  conflictCount: number;
  canUndo: boolean;
  canRedo: boolean;
  showDemandOverlay: boolean;
  emptyShiftsCount: number;
  isDarkMode: boolean;
  // Selectors
  centres: { id: string; name: string }[];
  selectedCentreId: string;
  roleOptions: { value: string; label: string }[];
  selectedRole: string;
  onCentreChange: (centreId: string) => void;
  onRoleChange: (role: string) => void;
  // Navigation
  onNavigateDate: (direction: 'prev' | 'next') => void;
  onToday: () => void;
  onDateSelect: (date: Date) => void;
  onViewModeChange: (mode: ViewMode) => void;
  // Primary actions
  onPublish: () => void;
  onAddOpenShift: () => void;
  onBulkAssign: () => void;
  onAutoAssign: () => void;
  onAddEmptyShift: () => void;
  onCopyWeek: () => void;
  // Export
  onExportPDF: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
  // Views/Panels
  onShowSummary: () => void;
  onShowOptimize: () => void;
  onShowAlerts: () => void;
  onShowConflicts: () => void;
  onShowNotifications: () => void;
  onShowBudgetSettings: () => void;
  onShowHistory: () => void;
  // Templates & Settings
  onSaveTemplate: () => void;
  onApplyTemplate: () => void;
  onManageShiftTemplates: () => void;
  onIndustrySettings: () => void;
  onDemandSettings: () => void;
  onDemandDataEntry: () => void;
  onIntegrationManager: () => void;
  // Schedule
  onShowHolidays: () => void;
  onShowAvailability: () => void;
  onShowLeaveRequests: () => void;
  onShowStaffPreferences: () => void;
  // Toggles
  onUndo: () => void;
  onRedo: () => void;
  onToggleDemand: () => void;
  onToggleTheme: () => void;
  onToggleStaffPanel: () => void;
}

export function MobileRosterToolbar({
  currentDate,
  dates,
  viewMode,
  costSummary,
  weeklyBudget,
  openShiftCount,
  alertCount,
  conflictCount,
  canUndo,
  canRedo,
  showDemandOverlay,
  emptyShiftsCount,
  isDarkMode,
  centres,
  selectedCentreId,
  roleOptions,
  selectedRole,
  onCentreChange,
  onRoleChange,
  onNavigateDate,
  onToday,
  onDateSelect,
  onViewModeChange,
  onPublish,
  onAddOpenShift,
  onBulkAssign,
  onAutoAssign,
  onAddEmptyShift,
  onCopyWeek,
  onExportPDF,
  onExportExcel,
  onPrint,
  onShowSummary,
  onShowOptimize,
  onShowAlerts,
  onShowConflicts,
  onShowNotifications,
  onShowBudgetSettings,
  onShowHistory,
  onSaveTemplate,
  onApplyTemplate,
  onManageShiftTemplates,
  onIndustrySettings,
  onDemandSettings,
  onDemandDataEntry,
  onIntegrationManager,
  onShowHolidays,
  onShowAvailability,
  onShowLeaveRequests,
  onShowStaffPreferences,
  onUndo,
  onRedo,
  onToggleDemand,
  onToggleTheme,
  onToggleStaffPanel,
}: MobileRosterToolbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Navigation items for app-level navigation
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
    { icon: Clock, label: 'Timesheet Admin', to: '/timesheet-admin' },
    { icon: Calendar, label: 'Roster', to: '/roster' },
    { icon: Users, label: 'Workforce', to: '/workforce' },
    { icon: Target, label: 'Performance', to: '/performance' },
    { icon: Sparkles, label: 'Recognition', to: '/recognition' },
    { icon: Briefcase, label: 'Recruitment', to: '/recruitment' },
    { icon: Settings, label: 'Settings', to: '/settings' },
  ];
  const viewModes: { value: ViewMode; label: string; tabletLabel: string }[] = [
    { value: 'day', label: 'Day', tabletLabel: 'Day' },
    { value: 'workweek', label: 'M-F', tabletLabel: 'Work Week' },
    { value: 'week', label: 'Week', tabletLabel: 'Week' },
    { value: 'fortnight', label: '2 Wk', tabletLabel: 'Fortnight' },
    { value: 'month', label: 'Month', tabletLabel: 'Month' },
  ];

  return (
    <div className="lg:hidden bg-card border-b border-border w-full overflow-x-hidden">
      {/* Top Row - Centre & Role Selectors - More spacious on tablet */}
      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 border-b border-border w-full">
        <Select value={selectedCentreId} onValueChange={onCentreChange}>
          <SelectTrigger className="h-8 md:h-9 flex-1 min-w-0 text-xs md:text-sm">
            <SelectValue placeholder="Select centre" />
          </SelectTrigger>
          <SelectContent>
            {centres.map((centre) => (
              <SelectItem key={centre.id} value={centre.id} className="text-xs md:text-sm">
                {centre.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedRole} onValueChange={onRoleChange}>
          <SelectTrigger className="h-8 md:h-9 w-[100px] md:w-[130px] shrink-0 text-xs md:text-sm">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs md:text-sm">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Tablet-only: Show budget info inline */}
        <div className="hidden md:flex items-center gap-2 text-sm font-medium ml-auto">
          <DollarSign className="h-4 w-4 text-primary" />
          <span>${costSummary.totalCost.toLocaleString()}</span>
          <span className="text-muted-foreground">/ ${weeklyBudget.toLocaleString()}</span>
        </div>
      </div>

      {/* Second Row - Date Navigation */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-border w-full">
        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-9 md:w-9"
            onClick={() => onNavigateDate('prev')}
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 md:h-9 px-2 md:px-3 text-xs md:text-sm font-medium"
            onClick={onToday}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-9 md:w-9"
            onClick={() => onNavigateDate('next')}
          >
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>

        {/* Date range with picker - clickable to change date */}
        <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-8 md:h-9 px-2 md:px-3 gap-1.5 md:gap-2",
                "text-xs md:text-sm font-medium",
                "hover:bg-accent/50 border border-transparent hover:border-border"
              )}
            >
              <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
              <span className="md:hidden">{format(dates[0], 'MMM d')} - {format(dates[dates.length - 1], 'MMM d')}</span>
              <span className="hidden md:inline">{format(dates[0], 'MMMM d')} - {format(dates[dates.length - 1], 'MMMM d, yyyy')}</span>
              <MoveHorizontal className="h-3 w-3 text-muted-foreground/60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <CalendarComponent
              mode="single"
              selected={currentDate}
              onSelect={(date) => {
                if (date) {
                  onDateSelect(date);
                  setShowDatePicker(false);
                }
              }}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-1 md:gap-2">
          {/* Staff Panel Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-9 md:w-9"
            onClick={onToggleStaffPanel}
          >
            <Users className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          
          {/* Tablet: Quick action buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-9 w-9"
            onClick={onToggleDemand}
          >
            {showDemandOverlay ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </Button>
          
          {/* Tablet: Undo/Redo */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-9 w-9"
            disabled={!canUndo}
            onClick={onUndo}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-9 w-9"
            disabled={!canRedo}
            onClick={onRedo}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          
          {/* Conflicts with badge (hide on small mobile screens to keep the hamburger visible) */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex h-8 w-8 md:h-9 md:w-9 relative"
            onClick={onShowConflicts}
          >
            <Shield className="h-4 w-4 md:h-5 md:w-5" />
            {conflictCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
              >
                {conflictCount}
              </Badge>
            )}
          </Button>

          {/* Alerts with badge (moved into the Actions sheet for mobile) */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden"
            onClick={onShowAlerts}
          >
            <Bell className="h-4 w-4" />
            {alertCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
              >
                {alertCount}
              </Badge>
            )}
          </Button>

          {/* More Actions */}
          <Sheet open={showActionsSheet} onOpenChange={setShowActionsSheet}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9">
                <Menu className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              style={{ width: 420, maxWidth: '95vw' }}
              className="w-full !p-0 overflow-x-hidden"
            >
              <SheetHeader className="px-4 py-4 border-b border-border">
                <SheetTitle className="text-sm">Actions & Settings</SheetTitle>
              </SheetHeader>
              <div className="px-4 py-2 space-y-1 max-h-[calc(100vh-100px)] overflow-y-auto overflow-x-hidden">
                {/* Section: Navigation */}
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Navigation
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.to;
                    return (
                      <Button
                        key={item.to}
                        variant={isActive ? 'secondary' : 'ghost'}
                        className="h-16 flex-col gap-1 p-2"
                        onClick={() => {
                          navigate(item.to);
                          setShowActionsSheet(false);
                        }}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="text-[10px] leading-tight text-center">{item.label}</span>
                      </Button>
                    );
                  })}
                </div>

                <div className="border-t border-border my-2" />

                {/* Budget Info */}
                <div className="p-3 bg-muted/50 rounded-lg mb-3">
                  <div className="flex items-center gap-2 text-sm font-medium mb-1">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Budget
                  </div>
                  <div className="text-lg font-bold">
                    ${costSummary.totalCost.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">
                      {' '}/ ${weeklyBudget.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {costSummary.totalHours}h scheduled
                  </div>
                </div>

                {/* Section: Quick Actions */}
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick Actions
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onAddOpenShift();
                    setShowActionsSheet(false);
                  }}
                >
                  <Plus className="h-4 w-4 mr-3" />
                  Add Open Shift
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onBulkAssign();
                    setShowActionsSheet(false);
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-3" />
                  Bulk Assign
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onAddEmptyShift();
                    setShowActionsSheet(false);
                  }}
                >
                  <Layers className="h-4 w-4 mr-3" />
                  Create Empty Shifts
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onCopyWeek();
                    setShowActionsSheet(false);
                  }}
                >
                  <Copy className="h-4 w-4 mr-3" />
                  Copy Week
                </Button>

                {emptyShiftsCount > 0 && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-10 text-primary"
                    onClick={() => {
                      onAutoAssign();
                      setShowActionsSheet(false);
                    }}
                  >
                    <Zap className="h-4 w-4 mr-3" />
                    Auto-Assign ({emptyShiftsCount})
                  </Button>
                )}

                <div className="border-t border-border my-2" />

                {/* Section: View Options */}
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  View Options
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onToggleDemand();
                    setShowActionsSheet(false);
                  }}
                >
                  {showDemandOverlay ? (
                    <Eye className="h-4 w-4 mr-3" />
                  ) : (
                    <EyeOff className="h-4 w-4 mr-3" />
                  )}
                  {showDemandOverlay ? 'Hide Demand' : 'Show Demand'}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onShowSummary();
                    setShowActionsSheet(false);
                  }}
                >
                  <BarChart3 className="h-4 w-4 mr-3" />
                  Weekly Summary
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onShowOptimize();
                    setShowActionsSheet(false);
                  }}
                >
                  <TrendingUp className="h-4 w-4 mr-3" />
                  Optimization Report
                </Button>

                <div className="border-t border-border my-2" />

                {/* Section: Undo/Redo */}
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  History
                </div>
                <div className="flex gap-2 px-2 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={!canUndo}
                    onClick={onUndo}
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    Undo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={!canRedo}
                    onClick={onRedo}
                  >
                    <Redo2 className="h-4 w-4 mr-2" />
                    Redo
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onShowHistory();
                    setShowActionsSheet(false);
                  }}
                >
                  <History className="h-4 w-4 mr-3" />
                  View History
                </Button>

                <div className="border-t border-border my-2" />

                {/* Section: Schedule */}
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Schedule
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onShowHolidays();
                    setShowActionsSheet(false);
                  }}
                >
                  <Flag className="h-4 w-4 mr-3" />
                  Holidays & Events
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onShowAvailability();
                    setShowActionsSheet(false);
                  }}
                >
                  <CalendarCheck className="h-4 w-4 mr-3" />
                  Staff Availability
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onShowLeaveRequests();
                    setShowActionsSheet(false);
                  }}
                >
                  <CalendarDays className="h-4 w-4 mr-3" />
                  Leave Requests
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onShowStaffPreferences();
                    setShowActionsSheet(false);
                  }}
                >
                  <UserCog className="h-4 w-4 mr-3" />
                  Staff Preferences
                </Button>

                <div className="border-t border-border my-2" />

                {/* Section: Templates & Settings */}
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Templates & Settings
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onSaveTemplate();
                    setShowActionsSheet(false);
                  }}
                >
                  <Layers className="h-4 w-4 mr-3" />
                  Save as Template
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onApplyTemplate();
                    setShowActionsSheet(false);
                  }}
                >
                  <Layers className="h-4 w-4 mr-3" />
                  Apply Template
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onManageShiftTemplates();
                    setShowActionsSheet(false);
                  }}
                >
                  <Clock className="h-4 w-4 mr-3" />
                  Manage Shift Templates
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onIndustrySettings();
                    setShowActionsSheet(false);
                  }}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Industry Settings
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onDemandSettings();
                    setShowActionsSheet(false);
                  }}
                >
                  <BarChart2 className="h-4 w-4 mr-3" />
                  Demand Settings
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onDemandDataEntry();
                    setShowActionsSheet(false);
                  }}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-3" />
                  Enter Demand Data
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onIntegrationManager();
                    setShowActionsSheet(false);
                  }}
                >
                  <Plug className="h-4 w-4 mr-3" />
                  Integration Manager
                </Button>

                <div className="border-t border-border my-2" />

                {/* Section: Export Options */}
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Export
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onExportPDF();
                    setShowActionsSheet(false);
                  }}
                >
                  <FileText className="h-4 w-4 mr-3" />
                  Export PDF
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onExportExcel();
                    setShowActionsSheet(false);
                  }}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-3" />
                  Export Excel
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onPrint();
                    setShowActionsSheet(false);
                  }}
                >
                  <Printer className="h-4 w-4 mr-3" />
                  Print View
                </Button>

                <div className="border-t border-border my-2" />

                {/* Section: Notifications & Settings */}
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Notifications & Settings
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onShowNotifications();
                    setShowActionsSheet(false);
                  }}
                >
                  <Mail className="h-4 w-4 mr-3" />
                  Notifications
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onShowBudgetSettings();
                    setShowActionsSheet(false);
                  }}
                >
                  <DollarSign className="h-4 w-4 mr-3" />
                  Budget Settings
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onToggleTheme();
                    setShowActionsSheet(false);
                  }}
                >
                  {isDarkMode ? (
                    <Sun className="h-4 w-4 mr-3" />
                  ) : (
                    <Moon className="h-4 w-4 mr-3" />
                  )}
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Third Row - View Mode & Publish */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 gap-2 w-full">
        {/* View Mode Tabs - Show full labels on tablet */}
        <div className="flex bg-muted rounded-lg p-0.5 shrink-0">
          {viewModes.map((mode) => (
            <Button
              key={mode.value}
              variant={viewMode === mode.value ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm whitespace-nowrap',
                viewMode === mode.value && 'bg-background shadow-sm'
              )}
              onClick={() => onViewModeChange(mode.value)}
            >
              <span className="md:hidden">{mode.label}</span>
              <span className="hidden md:inline">{mode.tabletLabel}</span>
            </Button>
          ))}
        </div>

        {/* Status badges and actions - more on tablet */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {openShiftCount > 0 && (
            <Badge variant="secondary" className="text-xs md:text-sm">
              {openShiftCount} open
            </Badge>
          )}
          {/* Show critical alerts count on tablet */}
          {alertCount > 0 && (
            <Badge variant="destructive" className="hidden md:flex text-xs">
              {alertCount} alert{alertCount > 1 ? 's' : ''}
            </Badge>
          )}
          <Button size="sm" className="h-8 md:h-9 px-3 md:px-4" onClick={onPublish}>
            <Send className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden md:inline">Publish Roster</span>
            <span className="md:hidden">Publish</span>
          </Button>
        </div>
      </div>
    </div>
  );
}