import { useState } from 'react';
import { format } from 'date-fns';
import { ViewMode } from '@/types/roster';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileRosterToolbarProps {
  currentDate: Date;
  dates: Date[];
  viewMode: ViewMode;
  costSummary: { totalCost: number; totalHours: number };
  weeklyBudget: number;
  openShiftCount: number;
  alertCount: number;
  canUndo: boolean;
  canRedo: boolean;
  showDemandOverlay: boolean;
  emptyShiftsCount: number;
  onNavigateDate: (direction: 'prev' | 'next') => void;
  onToday: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onPublish: () => void;
  onAddOpenShift: () => void;
  onBulkAssign: () => void;
  onAutoAssign: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
  onShowSummary: () => void;
  onShowOptimize: () => void;
  onShowAlerts: () => void;
  onShowBudgetSettings: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleDemand: () => void;
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
  canUndo,
  canRedo,
  showDemandOverlay,
  emptyShiftsCount,
  onNavigateDate,
  onToday,
  onViewModeChange,
  onPublish,
  onAddOpenShift,
  onBulkAssign,
  onAutoAssign,
  onExportPDF,
  onExportExcel,
  onPrint,
  onShowSummary,
  onShowOptimize,
  onShowAlerts,
  onShowBudgetSettings,
  onUndo,
  onRedo,
  onToggleDemand,
  onToggleStaffPanel,
}: MobileRosterToolbarProps) {
  const [showActionsSheet, setShowActionsSheet] = useState(false);

  const viewModes: { value: ViewMode; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'fortnight', label: '2 Wk' },
    { value: 'month', label: 'Month' },
  ];

  return (
    <div className="md:hidden bg-card border-b border-border">
      {/* Top Row - Date Navigation */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onNavigateDate('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-medium"
            onClick={onToday}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onNavigateDate('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-xs font-medium text-muted-foreground">
          {format(dates[0], 'MMM d')} - {format(dates[dates.length - 1], 'MMM d')}
        </div>

        <div className="flex items-center gap-1">
          {/* Staff Panel Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleStaffPanel}
          >
            <Users className="h-4 w-4" />
          </Button>
          
          {/* Alerts with badge */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 relative"
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
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0">
              <SheetHeader className="p-4 border-b border-border">
                <SheetTitle className="text-sm">Actions</SheetTitle>
              </SheetHeader>
              <div className="p-2 space-y-1 max-h-[calc(100vh-100px)] overflow-y-auto">
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

                {/* Quick Actions */}
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

                {/* View Options */}
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

                {/* Undo/Redo */}
                <div className="flex gap-2 px-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={!canUndo}
                    onClick={() => {
                      onUndo();
                    }}
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    Undo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={!canRedo}
                    onClick={() => {
                      onRedo();
                    }}
                  >
                    <Redo2 className="h-4 w-4 mr-2" />
                    Redo
                  </Button>
                </div>

                <div className="border-t border-border my-2" />

                {/* Export Options */}
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

                {/* Settings */}
                <Button
                  variant="ghost"
                  className="w-full justify-start h-10"
                  onClick={() => {
                    onShowBudgetSettings();
                    setShowActionsSheet(false);
                  }}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Budget Settings
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Second Row - View Mode & Publish */}
      <div className="flex items-center justify-between px-2 py-2 gap-2">
        {/* View Mode Tabs */}
        <div className="flex bg-muted rounded-lg p-0.5 overflow-x-auto">
          {viewModes.map((mode) => (
            <Button
              key={mode.value}
              variant={viewMode === mode.value ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'h-7 px-2.5 text-xs whitespace-nowrap',
                viewMode === mode.value && 'bg-background shadow-sm'
              )}
              onClick={() => onViewModeChange(mode.value)}
            >
              {mode.label}
            </Button>
          ))}
        </div>

        {/* Open Shifts Badge & Publish */}
        <div className="flex items-center gap-2">
          {openShiftCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {openShiftCount} open
            </Badge>
          )}
          <Button size="sm" className="h-8 px-3" onClick={onPublish}>
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
