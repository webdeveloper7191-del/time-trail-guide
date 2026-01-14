import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Award,
  Users,
  Calendar,
  Clock,
  Database,
  ArrowRight,
  ArrowDown,
  Zap,
  Shield,
  DollarSign,
  FileText,
  Settings,
  ChevronRight,
  ChevronDown,
  Activity,
  Layers,
  GitBranch,
  Box,
  Link2,
  Eye,
  EyeOff,
  Play,
  Pause,
  RotateCcw,
  Network,
  LayoutDashboard,
  Building2,
  UserCheck,
  ClipboardCheck,
  Wallet,
  BarChart3,
  Bell,
  Lock,
  Upload,
  Download,
  Printer,
  History,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  Target,
  Sparkles,
  Briefcase,
  GraduationCap,
  Home,
  LucideIcon,
} from 'lucide-react';

interface ModuleNode {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  components: string[];
  dataProvides: string[];
  dataConsumes: string[];
  apis: string[];
  businessRules: string[];
  developerNotes: string[];
}

interface DataFlow {
  id: string;
  from: string;
  to: string;
  dataType: string;
  description: string;
  frequency: 'realtime' | 'on-demand' | 'scheduled';
  businessRules?: string[];
  technicalNotes?: string;
}

const MODULES: ModuleNode[] = [
  {
    id: 'awards',
    name: 'Awards Module',
    icon: Award,
    color: 'from-amber-500 to-orange-500',
    description: 'Manages Australian Modern Awards, penalty rates, allowances, and rate updates. Central source of truth for all pay calculations.',
    components: [
      'AwardsMasterTable',
      'PenaltyRatesEditorPanel',
      'AllowanceRatesEditorPanel',
      'CustomRuleBuilderPanel',
      'AwardUpdatesPanel',
      'RateSimulationPanel',
    ],
    dataProvides: ['Penalty Rates', 'Allowance Types', 'Award Classifications', 'Rate Multipliers'],
    dataConsumes: ['External Award Updates'],
    apis: ['getAwardsByIndustry', 'getPenaltyRates', 'getAllowanceTypes', 'installAwardUpdate'],
    businessRules: [
      'Award rates must be updated within 30 days of FWC announcement',
      'Penalty rates cascade to all affected staff automatically',
      'Rate changes require manager approval before activation',
      'Historical rates must be preserved for audit compliance',
    ],
    developerNotes: [
      'Use awardInterpreter.ts for all rate calculations',
      'Cache award data - it changes infrequently',
      'Always validate against australianAwards.ts for industry standards',
      'Rate updates trigger recalculation of all pending timesheets',
    ],
  },
  {
    id: 'staff',
    name: 'Staff Module',
    icon: Users,
    color: 'from-blue-500 to-cyan-500',
    description: 'Manages staff profiles, qualifications, pay conditions, and availability. Links employees to their applicable awards and classifications.',
    components: [
      'StaffPanel',
      'StaffProfileModal',
      'StaffPayConditionsSection',
      'StaffQualificationsSection',
      'StaffAvailabilitySection',
      'StaffAwardRuleSection',
    ],
    dataProvides: ['Staff Members', 'Qualifications', 'Pay Rates', 'Availability', 'Bank Details'],
    dataConsumes: ['Award Classifications', 'Allowance Types'],
    apis: ['fetchAllStaff', 'getStaffById', 'updatePayConditions', 'updateAvailability'],
    businessRules: [
      'All staff must have a valid award classification',
      'Qualifications must be verified before room assignment',
      'Pay rate changes must be scheduled, not immediate',
      'Availability conflicts block shift assignment',
      'Bank details require dual-authorization to update',
    ],
    developerNotes: [
      'Staff data is cached in useStaffData hook',
      'Use validationSchemas.ts for all staff form validation',
      'Qualification expiry dates must be monitored',
      'Pay condition history is immutable - create new records',
    ],
  },
  {
    id: 'roster',
    name: 'Roster Module',
    icon: Calendar,
    color: 'from-emerald-500 to-teal-500',
    description: 'Handles shift scheduling, templates, compliance checking, and cost tracking. Core scheduling interface for managers.',
    components: [
      'TimelineGrid',
      'ShiftCard',
      'ShiftDetailPanel',
      'ShiftTemplateManager',
      'BudgetTracker',
      'CompliancePanel',
      'DemandHistogram',
    ],
    dataProvides: ['Shifts', 'Shift Costs', 'Compliance Flags', 'Open Shifts'],
    dataConsumes: ['Staff Members', 'Penalty Rates', 'Allowance Types', 'Availability'],
    apis: ['fetchShifts', 'createShift', 'updateShift', 'publishRoster', 'bulkCreateShifts'],
    businessRules: [
      'Shifts cannot overlap for the same staff member',
      'Minimum 10-hour break between shifts required',
      'Room ratios must be maintained at all times',
      'Published rosters lock 48 hours before start',
      'Budget warnings trigger at 80% threshold',
      'Open shifts require 24-hour notice period',
    ],
    developerNotes: [
      'Use useRosterData hook for all roster operations',
      'Shift conflicts detected via shiftConflictDetection.ts',
      'Cost calculations are async - show loading states',
      'Undo/redo supported via useUndoRedo hook',
      'Demand data drives staffing recommendations',
    ],
  },
  {
    id: 'timesheet',
    name: 'Timesheet Module',
    icon: Clock,
    color: 'from-purple-500 to-pink-500',
    description: 'Processes timesheet submissions, approvals, compliance validation, and payroll export. Final stage before payroll.',
    components: [
      'TimesheetTable',
      'TimesheetDetailModal',
      'ApprovalWorkflow',
      'ComplianceScorecard',
      'OvertimeBreakdown',
      'AllowancesPanel',
    ],
    dataProvides: ['Approved Hours', 'Pay Calculations', 'Compliance Reports'],
    dataConsumes: ['Shifts', 'Staff Members', 'Penalty Rates', 'Allowance Types'],
    apis: ['fetchTimesheets', 'approveTimesheet', 'rejectTimesheet', 'exportTimesheets'],
    businessRules: [
      'Timesheets must be submitted within 7 days of shift',
      'Approval requires matching against rostered shifts',
      'Variance > 15 minutes requires manager justification',
      'Rejected timesheets must include reason',
      'Export locks timesheet from further edits',
      'Overtime requires pre-approval or post-justification',
    ],
    developerNotes: [
      'Use useTimesheetData hook for all operations',
      'Approval workflow state machine in ApprovalWorkflow.tsx',
      'Compliance checks run on every status change',
      'Export format must match payroll system requirements',
      'Audit trail is append-only - never delete records',
    ],
  },
  {
    id: 'compliance',
    name: 'Compliance Engine',
    icon: Shield,
    color: 'from-red-500 to-rose-500',
    description: 'Validates schedules against regulations, awards, and business rules. Runs continuously to flag violations.',
    components: [
      'ComplianceEngine',
      'ShiftConflictDetection',
      'RatioCompliance',
      'ShiftTypeDetection',
    ],
    dataProvides: ['Compliance Flags', 'Conflict Warnings', 'Ratio Breaches'],
    dataConsumes: ['Shifts', 'Staff Qualifications', 'Room Requirements', 'Award Rules'],
    apis: ['validateShift', 'checkRatioCompliance', 'detectConflicts'],
    businessRules: [
      'Child-to-staff ratios must never be breached',
      'Qualified staff must be present at all times',
      'Maximum weekly hours: 38 ordinary + 12 overtime',
      'Break requirements: 10min per 4hrs, 30min per 6hrs',
      'Consecutive shift warnings after 5 days',
      'Fatigue management: max 10 hours per shift',
    ],
    developerNotes: [
      'complianceEngine.ts is the core validation module',
      'Ratio checks use ratioCompliance.ts',
      'All violations have severity levels: error/warning/info',
      'Compliance runs synchronously on shift changes',
      'Cache room requirements - they rarely change',
    ],
  },
  {
    id: 'calculation',
    name: 'Calculation Engine',
    icon: DollarSign,
    color: 'from-green-500 to-lime-500',
    description: 'Computes shift costs, penalties, overtime, and allowances based on awards. Powers all financial projections.',
    components: [
      'AwardInterpreter',
      'LabourForecasting',
      'ShiftTypeDetection',
    ],
    dataProvides: ['Shift Cost Breakdowns', 'Weekly Cost Summaries', 'Roster Costs'],
    dataConsumes: ['Shifts', 'Staff Pay Rates', 'Penalty Rates', 'Allowance Types'],
    apis: ['calculateShiftCost', 'calculateWeeklyCost', 'calculateRosterCost'],
    businessRules: [
      'Overtime calculated weekly, not daily',
      'Penalty rates compound (weekend + evening)',
      'Public holidays: 250% base rate',
      'Allowances applied per-shift, not per-hour',
      'On-call: activation triggers full shift calculation',
      'Broken shifts include gap compensation',
    ],
    developerNotes: [
      'awardInterpreter.ts handles all rate lookups',
      'labourForecasting.ts for budget projections',
      'shiftTypeDetection.ts classifies shift patterns',
      'All currency in cents internally, display in dollars',
      'Cache calculation results with shift hash key',
    ],
  },
];

const DATA_FLOWS: DataFlow[] = [
  { 
    id: 'f1', 
    from: 'awards', 
    to: 'staff', 
    dataType: 'Award Classifications', 
    description: 'Staff members are assigned award levels and classifications',
    frequency: 'on-demand',
    businessRules: ['Classification changes require HR approval', 'Backpay may apply for upgrades'],
    technicalNotes: 'Use StaffAwardRuleSection.tsx for assignment UI',
  },
  { 
    id: 'f2', 
    from: 'awards', 
    to: 'calculation', 
    dataType: 'Penalty Rates', 
    description: 'Penalty rate multipliers for cost calculations',
    frequency: 'realtime',
    businessRules: ['Rates effective from FWC determination date'],
    technicalNotes: 'getPenaltyRates() returns cached values',
  },
  { 
    id: 'f3', 
    from: 'awards', 
    to: 'calculation', 
    dataType: 'Allowance Types', 
    description: 'Allowance definitions and rates',
    frequency: 'realtime',
    businessRules: ['Some allowances are taxable, others not'],
    technicalNotes: 'Allowance eligibility checked per-shift',
  },
  { 
    id: 'f4', 
    from: 'staff', 
    to: 'roster', 
    dataType: 'Staff Members', 
    description: 'Available staff for shift assignment',
    frequency: 'realtime',
    businessRules: ['Only active staff appear in roster', 'Probationary staff marked separately'],
    technicalNotes: 'fetchAllStaff() filters by status',
  },
  { 
    id: 'f5', 
    from: 'staff', 
    to: 'roster', 
    dataType: 'Availability', 
    description: 'Staff availability constraints',
    frequency: 'realtime',
    businessRules: ['Availability blocks prevent assignment', 'Leave requests override availability'],
    technicalNotes: 'StaffAvailabilitySection.tsx manages patterns',
  },
  { 
    id: 'f6', 
    from: 'staff', 
    to: 'calculation', 
    dataType: 'Pay Rates', 
    description: 'Base hourly rates for cost calculation',
    frequency: 'realtime',
    businessRules: ['Scheduled rate changes apply from effective date', 'Current rate used for projections'],
    technicalNotes: 'StaffPayConditionsSection.tsx shows history',
  },
  { 
    id: 'f7', 
    from: 'staff', 
    to: 'compliance', 
    dataType: 'Qualifications', 
    description: 'Staff qualifications for ratio compliance',
    frequency: 'realtime',
    businessRules: ['Expired qualifications = unqualified', 'Grace period: 30 days for renewal'],
    technicalNotes: 'ratioCompliance.ts checks qual validity',
  },
  { 
    id: 'f8', 
    from: 'roster', 
    to: 'timesheet', 
    dataType: 'Shifts', 
    description: 'Scheduled shifts become timesheet entries',
    frequency: 'scheduled',
    businessRules: ['Shift becomes timesheet at start time', 'Actual times may differ from scheduled'],
    technicalNotes: 'Batch job runs hourly to sync',
  },
  { 
    id: 'f9', 
    from: 'roster', 
    to: 'compliance', 
    dataType: 'Shifts', 
    description: 'Shifts validated against compliance rules',
    frequency: 'realtime',
    businessRules: ['Validation runs on every shift change', 'Errors block publishing'],
    technicalNotes: 'complianceEngine.ts validateShift()',
  },
  { 
    id: 'f10', 
    from: 'roster', 
    to: 'calculation', 
    dataType: 'Shifts', 
    description: 'Shift details for cost calculation',
    frequency: 'realtime',
    businessRules: ['Projected costs update live', 'Published shifts lock calculation'],
    technicalNotes: 'calculateShiftCost() is async',
  },
  { 
    id: 'f11', 
    from: 'calculation', 
    to: 'roster', 
    dataType: 'Shift Costs', 
    description: 'Cost breakdowns displayed in roster',
    frequency: 'realtime',
    businessRules: ['Costs shown in AUD', 'Budget warnings at thresholds'],
    technicalNotes: 'BudgetTracker.tsx displays aggregates',
  },
  { 
    id: 'f12', 
    from: 'calculation', 
    to: 'timesheet', 
    dataType: 'Pay Calculations', 
    description: 'Final pay amounts for timesheets',
    frequency: 'on-demand',
    businessRules: ['Recalculated on approval', 'Locked on export'],
    technicalNotes: 'TimesheetDetailModal.tsx shows breakdown',
  },
  { 
    id: 'f13', 
    from: 'compliance', 
    to: 'roster', 
    dataType: 'Compliance Flags', 
    description: 'Warnings and errors displayed in roster',
    frequency: 'realtime',
    businessRules: ['Errors prevent publish', 'Warnings require acknowledgment'],
    technicalNotes: 'ShiftConflictPanel.tsx displays issues',
  },
  { 
    id: 'f14', 
    from: 'compliance', 
    to: 'timesheet', 
    dataType: 'Compliance Reports', 
    description: 'Compliance status for approval workflow',
    frequency: 'on-demand',
    businessRules: ['Non-compliant timesheets flagged', 'Approver must justify override'],
    technicalNotes: 'ComplianceScorecard.tsx shows summary',
  },
];


// Mind Map Data Structure
interface MindMapNode {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  description?: string;
  businessRules?: string[];
  apis?: string[];
  developerNotes?: string[];
  children?: MindMapNode[];
}

const PRODUCT_MIND_MAP: MindMapNode = {
  id: 'root',
  name: 'Time Trail Guide',
  icon: Home,
  color: 'from-indigo-500 to-purple-500',
  description: 'Comprehensive workforce management system for Australian childcare and healthcare industries',
  businessRules: ['System must comply with Australian Fair Work regulations', 'All data must be auditable for 7 years'],
  developerNotes: ['Main entry point: src/pages/Index.tsx', 'Global state managed via React context'],
  children: [
    {
      id: 'roster',
      name: 'Roster & Scheduling',
      icon: Calendar,
      color: 'from-emerald-500 to-teal-500',
      description: 'Complete shift scheduling and management with compliance checking and cost tracking',
      businessRules: ['Rosters must be published 7 days in advance', 'Shift changes require 24-hour notice'],
      apis: ['fetchShifts', 'createShift', 'updateShift', 'publishRoster'],
      developerNotes: ['Entry: src/pages/RosterScheduler.tsx', 'Uses useRosterData hook for data management'],
      children: [
        {
          id: 'roster-timeline',
          name: 'Timeline Grid',
          icon: LayoutDashboard,
          color: 'from-emerald-400 to-teal-400',
          description: 'Visual timeline for viewing and managing shifts across staff and rooms',
          businessRules: ['Display 24-hour view with configurable zoom levels'],
          apis: ['fetchShifts', 'updateShiftTimes'],
          developerNotes: ['Component: TimelineGrid.tsx', 'Uses CSS Grid for layout'],
          children: [
            { 
              id: 'shift-cards', 
              name: 'Shift Cards', 
              icon: Box, 
              color: 'from-emerald-300 to-teal-300',
              description: 'Individual shift display cards showing staff, time, and status',
              businessRules: ['Color-coded by room/department', 'Show compliance warnings'],
              developerNotes: ['Component: ShiftCard.tsx', 'Draggable for reassignment'],
            },
            { 
              id: 'day-timeline', 
              name: 'Day Timeline', 
              icon: CalendarDays, 
              color: 'from-emerald-300 to-teal-300',
              description: 'Single-day focused view with hour-by-hour breakdown',
              businessRules: ['Highlight peak demand periods', 'Show break times'],
              developerNotes: ['Component: DayTimelineView.tsx'],
            },
            { 
              id: 'staff-timeline', 
              name: 'Staff Timeline Grid', 
              icon: Users, 
              color: 'from-emerald-300 to-teal-300',
              description: 'Staff-centric view showing individual schedules',
              businessRules: ['Show consecutive day warnings', 'Display availability blocks'],
              developerNotes: ['Component: StaffTimelineGrid.tsx'],
            },
          ]
        },
        {
          id: 'roster-management',
          name: 'Shift Management',
          icon: Settings,
          color: 'from-emerald-400 to-teal-400',
          description: 'Tools for creating, editing, and managing individual shifts',
          businessRules: ['All changes logged for audit', 'Conflict detection runs on save'],
          apis: ['createShift', 'updateShift', 'deleteShift', 'bulkCreateShifts'],
          developerNotes: ['Uses shiftConflictDetection.ts for validation'],
          children: [
            { 
              id: 'shift-detail', 
              name: 'Shift Detail Panel', 
              icon: FileText, 
              color: 'from-emerald-300 to-teal-300',
              description: 'Detailed shift view with cost breakdown, allowances, and notes',
              businessRules: ['Show real-time cost calculation', 'Display applicable award rates'],
              apis: ['calculateShiftCost', 'getShiftAllowances'],
              developerNotes: ['Component: ShiftDetailPanel.tsx', 'Integrates with AwardInterpreter'],
            },
            { 
              id: 'shift-templates', 
              name: 'Shift Templates', 
              icon: Layers, 
              color: 'from-emerald-300 to-teal-300',
              description: 'Pre-defined shift patterns for quick roster creation',
              businessRules: ['Templates inherit current award rates', 'Validate on application'],
              developerNotes: ['Component: ShiftTemplateManager.tsx'],
            },
            { 
              id: 'bulk-assign', 
              name: 'Bulk Assignment', 
              icon: Users, 
              color: 'from-emerald-300 to-teal-300',
              description: 'Assign multiple staff to shifts in a single operation',
              businessRules: ['Respect availability constraints', 'Check qualification requirements'],
              developerNotes: ['Component: BulkShiftAssignmentModal.tsx'],
            },
            { 
              id: 'shift-copy', 
              name: 'Shift Copy/Move', 
              icon: Box, 
              color: 'from-emerald-300 to-teal-300',
              description: 'Duplicate or move shifts between days or weeks',
              businessRules: ['Recalculate costs on copy', 'Preserve allowances if applicable'],
              developerNotes: ['Component: ShiftCopyModal.tsx'],
            },
            { 
              id: 'open-shifts', 
              name: 'Open Shifts', 
              icon: AlertTriangle, 
              color: 'from-emerald-300 to-teal-300',
              description: 'Unfilled shifts available for staff to claim',
              businessRules: ['24-hour minimum notice', 'First-come-first-served or manager approval'],
              developerNotes: ['Component: AddOpenShiftModal.tsx'],
            },
          ]
        },
        {
          id: 'roster-analytics',
          name: 'Analytics & Tracking',
          icon: BarChart3,
          color: 'from-emerald-400 to-teal-400',
          description: 'Budget, demand, and staffing analytics for roster optimization',
          businessRules: ['Budget alerts at 80% threshold', 'Track forecast vs actual'],
          apis: ['calculateRosterCost', 'getDemandAnalytics'],
          developerNotes: ['Uses labourForecasting.ts for projections'],
          children: [
            { 
              id: 'budget-tracker', 
              name: 'Budget Tracker', 
              icon: Wallet, 
              color: 'from-emerald-300 to-teal-300',
              description: 'Real-time labor cost tracking against budget',
              businessRules: ['Warning at 80%, alert at 100%', 'Show projected vs actual'],
              developerNotes: ['Components: BudgetTracker.tsx, BudgetTrackerBar.tsx'],
            },
            { 
              id: 'demand-histogram', 
              name: 'Demand Histogram', 
              icon: BarChart3, 
              color: 'from-emerald-300 to-teal-300',
              description: 'Visual representation of staffing demand by time',
              businessRules: ['Historical data informs recommendations', 'Account for events/holidays'],
              developerNotes: ['Component: DemandHistogram.tsx', 'Uses recharts'],
            },
            { 
              id: 'staffing-insights', 
              name: 'Staffing Insights', 
              icon: Target, 
              color: 'from-emerald-300 to-teal-300',
              description: 'AI-powered recommendations for optimal staffing',
              businessRules: ['Consider qualifications and ratios', 'Factor in leave patterns'],
              developerNotes: ['Component: StaffingInsightsBar.tsx'],
            },
            { 
              id: 'room-analytics', 
              name: 'Room Analytics', 
              icon: Building2, 
              color: 'from-emerald-300 to-teal-300',
              description: 'Per-room occupancy and staffing analysis',
              businessRules: ['Maintain required ratios', 'Track room utilization'],
              developerNotes: ['Component: RoomAnalyticsCard.tsx'],
            },
          ]
        },
        {
          id: 'roster-tools',
          name: 'Tools & Export',
          icon: Sparkles,
          color: 'from-emerald-400 to-teal-400',
          description: 'Roster templates, print views, and history tracking',
          apis: ['exportRoster', 'applyTemplate', 'saveTemplate'],
          developerNotes: ['Export uses rosterExport.ts'],
          children: [
            { 
              id: 'apply-template', 
              name: 'Apply Template', 
              icon: Layers, 
              color: 'from-emerald-300 to-teal-300',
              description: 'Apply saved roster templates to selected weeks',
              businessRules: ['Validate template against current staff', 'Preserve existing shifts option'],
              developerNotes: ['Component: ApplyTemplateModal.tsx'],
            },
            { 
              id: 'save-template', 
              name: 'Save Template', 
              icon: Download, 
              color: 'from-emerald-300 to-teal-300',
              description: 'Save current roster as a reusable template',
              businessRules: ['Strip personal data', 'Include shift patterns only'],
              developerNotes: ['Component: SaveRosterTemplateModal.tsx'],
            },
            { 
              id: 'print-view', 
              name: 'Print View', 
              icon: Printer, 
              color: 'from-emerald-300 to-teal-300',
              description: 'Printer-friendly roster layout for posting',
              businessRules: ['Include all required compliance info', 'A4/Letter format support'],
              developerNotes: ['Component: RosterPrintView.tsx'],
            },
            { 
              id: 'history', 
              name: 'Roster History', 
              icon: History, 
              color: 'from-emerald-300 to-teal-300',
              description: 'Version history and change tracking',
              businessRules: ['Audit trail for all changes', 'Rollback capability'],
              developerNotes: ['Component: RosterHistoryPanel.tsx'],
            },
          ]
        },
      ]
    },
    {
      id: 'staff',
      name: 'Staff Management',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      description: 'Complete employee profile management including pay, qualifications, and availability',
      businessRules: ['Personal data protected under Privacy Act', 'Pay changes require dual approval'],
      apis: ['fetchAllStaff', 'getStaffById', 'updateStaff'],
      developerNotes: ['Entry: src/pages/StaffList.tsx', 'Detail: src/pages/StaffDetail.tsx'],
      children: [
        {
          id: 'staff-profiles',
          name: 'Profile Management',
          icon: UserCheck,
          color: 'from-blue-400 to-cyan-400',
          description: 'Personal information, contact details, and employment records',
          businessRules: ['Emergency contact required', 'ID verification mandatory'],
          developerNotes: ['Uses validationSchemas.ts for form validation'],
          children: [
            { 
              id: 'personal-info', 
              name: 'Personal Information', 
              icon: Users, 
              color: 'from-blue-300 to-cyan-300',
              description: 'Name, address, contact details, emergency contacts',
              businessRules: ['Encrypted at rest', 'Access logged'],
              developerNotes: ['Component: StaffPersonalSection.tsx'],
            },
            { 
              id: 'qualifications', 
              name: 'Qualifications', 
              icon: GraduationCap, 
              color: 'from-blue-300 to-cyan-300',
              description: 'Certifications, training records, and expiry tracking',
              businessRules: ['30-day expiry warning', 'Block assignment if expired'],
              apis: ['addQualification', 'updateQualification'],
              developerNotes: ['Components: StaffQualificationsSection.tsx, AddQualificationSheet.tsx'],
            },
            { 
              id: 'availability', 
              name: 'Availability', 
              icon: Calendar, 
              color: 'from-blue-300 to-cyan-300',
              description: 'Regular availability patterns and leave calendar',
              businessRules: ['Minimum 2 weeks notice for changes', 'Block conflicting assignments'],
              developerNotes: ['Component: StaffAvailabilitySection.tsx'],
            },
          ]
        },
        {
          id: 'staff-pay',
          name: 'Pay Configuration',
          icon: DollarSign,
          color: 'from-blue-400 to-cyan-400',
          description: 'Pay rates, award classifications, and banking details',
          businessRules: ['Rate changes must be scheduled', 'Bank details require verification'],
          apis: ['updatePayConditions', 'updateBankDetails'],
          developerNotes: ['Pay history is immutable - create new records'],
          children: [
            { 
              id: 'pay-conditions', 
              name: 'Pay Conditions', 
              icon: FileText, 
              color: 'from-blue-300 to-cyan-300',
              description: 'Base rate, loadings, and pay classification',
              businessRules: ['Effective date required', 'Cannot backdate reductions'],
              developerNotes: ['Components: StaffPayConditionsSection.tsx, EditPayConditionsSheet.tsx'],
            },
            { 
              id: 'bank-details', 
              name: 'Bank Details', 
              icon: Wallet, 
              color: 'from-blue-300 to-cyan-300',
              description: 'Bank account for payroll deposits',
              businessRules: ['BSB and account validation', 'Change notification to employee'],
              developerNotes: ['Components: StaffBankDetailsSection.tsx, EditBankDetailsSheet.tsx'],
            },
            { 
              id: 'award-rules', 
              name: 'Award Rules', 
              icon: Award, 
              color: 'from-blue-300 to-cyan-300',
              description: 'Applicable award and classification level',
              businessRules: ['All staff must have valid classification', 'Drives all pay calculations'],
              developerNotes: ['Component: StaffAwardRuleSection.tsx'],
            },
            { 
              id: 'pay-comparison', 
              name: 'Pay Rate Comparison', 
              icon: BarChart3, 
              color: 'from-blue-300 to-cyan-300',
              description: 'Compare staff rates against award minimums',
              businessRules: ['Flag under-award payments', 'Show market rate comparisons'],
              developerNotes: ['Component: PayRateComparisonSheet.tsx'],
            },
          ]
        },
      ]
    },
    {
      id: 'awards',
      name: 'Awards & Compliance',
      icon: Award,
      color: 'from-amber-500 to-orange-500',
      description: 'Australian Modern Award management with penalty rates, allowances, and compliance rules',
      businessRules: ['Updates within 30 days of FWC announcement', 'Historical rates preserved'],
      apis: ['getAwardsByIndustry', 'getPenaltyRates', 'getAllowanceTypes'],
      developerNotes: ['Core module: awardInterpreter.ts', 'Data: australianAwards.ts'],
      children: [
        {
          id: 'award-management',
          name: 'Award Management',
          icon: Briefcase,
          color: 'from-amber-400 to-orange-400',
          description: 'Award configuration and update management',
          apis: ['installAwardUpdate', 'getAwardHistory'],
          developerNotes: ['Component: AwardsMasterTable.tsx'],
          children: [
            { 
              id: 'awards-master', 
              name: 'Awards Master Table', 
              icon: Database, 
              color: 'from-amber-300 to-orange-300',
              description: 'Central repository of all award configurations',
              businessRules: ['Read-only for standard awards', 'Custom overrides tracked separately'],
              developerNotes: ['Component: AwardsMasterTable.tsx'],
            },
            { 
              id: 'award-detail', 
              name: 'Award Details', 
              icon: FileText, 
              color: 'from-amber-300 to-orange-300',
              description: 'Detailed view of specific award with all rates and rules',
              businessRules: ['Show effective dates', 'Link to official FWC documents'],
              developerNotes: ['Component: AwardDetailModal.tsx'],
            },
            { 
              id: 'award-comparison', 
              name: 'Award Comparison', 
              icon: BarChart3, 
              color: 'from-amber-300 to-orange-300',
              description: 'Side-by-side comparison of awards',
              businessRules: ['Compare penalty structures', 'Highlight key differences'],
              developerNotes: ['Component: AwardComparisonPanel.tsx'],
            },
            { 
              id: 'award-updates', 
              name: 'Award Updates', 
              icon: Bell, 
              color: 'from-amber-300 to-orange-300',
              description: 'Manage and apply Fair Work Commission updates',
              businessRules: ['Approval required before activation', 'Notification to affected staff'],
              developerNotes: ['Component: AwardUpdatesPanel.tsx'],
            },
          ]
        },
        {
          id: 'rates',
          name: 'Rates & Loadings',
          icon: DollarSign,
          color: 'from-amber-400 to-orange-400',
          description: 'Penalty rates, allowances, overtime, and loading configurations',
          developerNotes: ['All rates cached for performance'],
          children: [
            { 
              id: 'penalty-rates', 
              name: 'Penalty Rates', 
              icon: Clock, 
              color: 'from-amber-300 to-orange-300',
              description: 'Weekend, evening, public holiday rate multipliers',
              businessRules: ['Rates compound (weekend + evening)', 'Public holidays: 250% minimum'],
              developerNotes: ['Component: PenaltyRatesEditorPanel.tsx'],
            },
            { 
              id: 'allowance-rates', 
              name: 'Allowance Rates', 
              icon: DollarSign, 
              color: 'from-amber-300 to-orange-300',
              description: 'Meal, uniform, travel, and other allowances',
              businessRules: ['Some taxable, some not', 'Applied per-shift or per-hour'],
              developerNotes: ['Component: AllowanceRatesEditorPanel.tsx'],
            },
            { 
              id: 'overtime-rates', 
              name: 'Overtime Rates', 
              icon: Zap, 
              color: 'from-amber-300 to-orange-300',
              description: 'Overtime calculation rules and rates',
              businessRules: ['Calculated weekly not daily', 'First 2 hours at 150%, then 200%'],
              developerNotes: ['Component: CustomOvertimeRatesPanel.tsx'],
            },
            { 
              id: 'rate-overrides', 
              name: 'Custom Overrides', 
              icon: Settings, 
              color: 'from-amber-300 to-orange-300',
              description: 'Organization-specific rate customizations',
              businessRules: ['Must meet or exceed award minimums', 'Audit trail required'],
              developerNotes: ['Component: CustomRateOverridesPanel.tsx'],
            },
          ]
        },
        {
          id: 'compliance-rules',
          name: 'Compliance Rules',
          icon: Shield,
          color: 'from-amber-400 to-orange-400',
          description: 'Custom rules for award interpretation and compliance',
          developerNotes: ['Engine: complianceEngine.ts'],
          children: [
            { 
              id: 'custom-rules', 
              name: 'Custom Rule Builder', 
              icon: Settings, 
              color: 'from-amber-300 to-orange-300',
              description: 'Create organization-specific compliance rules',
              businessRules: ['Cannot contradict award requirements', 'Test before activation'],
              developerNotes: ['Component: CustomRuleBuilderPanel.tsx'],
            },
            { 
              id: 'leave-loading', 
              name: 'Leave Loading', 
              icon: Calendar, 
              color: 'from-amber-300 to-orange-300',
              description: 'Annual leave loading calculation rules',
              businessRules: ['17.5% standard', 'Pro-rata for part-time'],
              developerNotes: ['Component: CustomLeaveLoadingPanel.tsx'],
            },
            { 
              id: 'shift-differential', 
              name: 'Shift Differential', 
              icon: Clock, 
              color: 'from-amber-300 to-orange-300',
              description: 'Time-of-day based pay differentials',
              businessRules: ['Evening: after 6pm', 'Night: after 12am'],
              developerNotes: ['Component: ShiftDifferentialCalculator.tsx'],
            },
          ]
        },
        {
          id: 'simulation',
          name: 'Simulation & Analysis',
          icon: BarChart3,
          color: 'from-amber-400 to-orange-400',
          description: 'Rate simulation and impact analysis tools',
          apis: ['simulateRateChange', 'getRateHistory'],
          developerNotes: ['Used for budget planning'],
          children: [
            { 
              id: 'rate-simulation', 
              name: 'Rate Simulation', 
              icon: Sparkles, 
              color: 'from-amber-300 to-orange-300',
              description: 'Model impact of rate changes on labor costs',
              businessRules: ['Compare scenarios', 'Export for reporting'],
              developerNotes: ['Component: RateSimulationPanel.tsx'],
            },
            { 
              id: 'rate-history', 
              name: 'Rate Change History', 
              icon: History, 
              color: 'from-amber-300 to-orange-300',
              description: 'Historical record of all rate changes',
              businessRules: ['Immutable audit trail', '7-year retention'],
              developerNotes: ['Component: RateChangeHistoryPanel.tsx'],
            },
            { 
              id: 'bulk-import', 
              name: 'Bulk Import/Export', 
              icon: Upload, 
              color: 'from-amber-300 to-orange-300',
              description: 'Import/export award data in bulk',
              businessRules: ['Validate on import', 'Format: CSV/Excel'],
              developerNotes: ['Component: BulkImportExportPanel.tsx', 'Uses awardExport.ts'],
            },
          ]
        },
      ]
    },
    {
      id: 'timesheet',
      name: 'Timesheet Processing',
      icon: Clock,
      color: 'from-purple-500 to-pink-500',
      description: 'Time tracking, approval workflows, compliance validation, and payroll export',
      businessRules: ['Submit within 7 days', 'Variance over 15 min needs justification'],
      apis: ['fetchTimesheets', 'approveTimesheet', 'exportTimesheets'],
      developerNotes: ['Entry: src/pages/TimesheetAdmin.tsx', 'Uses useTimesheetData hook'],
      children: [
        {
          id: 'timesheet-entry',
          name: 'Time Entry',
          icon: ClipboardCheck,
          color: 'from-purple-400 to-pink-400',
          description: 'Timesheet submission and editing interfaces',
          developerNotes: ['Syncs with roster data'],
          children: [
            { 
              id: 'timesheet-table', 
              name: 'Timesheet Table', 
              icon: FileText, 
              color: 'from-purple-300 to-pink-300',
              description: 'Tabular view of all timesheets with filtering',
              businessRules: ['Sort by status, date, staff', 'Bulk actions for approvers'],
              developerNotes: ['Component: TimesheetTable.tsx'],
            },
            { 
              id: 'timesheet-detail', 
              name: 'Timesheet Detail', 
              icon: FileText, 
              color: 'from-purple-300 to-pink-300',
              description: 'Detailed timesheet view with pay breakdown',
              businessRules: ['Show rostered vs actual', 'Display all allowances'],
              developerNotes: ['Component: TimesheetDetailModal.tsx'],
            },
            { 
              id: 'timesheet-edit', 
              name: 'Timesheet Edit', 
              icon: Settings, 
              color: 'from-purple-300 to-pink-300',
              description: 'Edit timesheet entries with change tracking',
              businessRules: ['All edits logged', 'Reason required for changes'],
              developerNotes: ['Component: TimesheetEditModal.tsx'],
            },
            { 
              id: 'calendar-view', 
              name: 'Calendar View', 
              icon: Calendar, 
              color: 'from-purple-300 to-pink-300',
              description: 'Calendar-based timesheet visualization',
              businessRules: ['Color-code by status', 'Click to expand details'],
              developerNotes: ['Component: TimesheetCalendarView.tsx'],
            },
          ]
        },
        {
          id: 'approval',
          name: 'Approval Workflow',
          icon: CheckCircle2,
          color: 'from-purple-400 to-pink-400',
          description: 'Multi-stage approval process with delegation',
          businessRules: ['Manager approval required', 'Escalation after 48 hours'],
          apis: ['approveTimesheet', 'rejectTimesheet', 'delegateApproval'],
          developerNotes: ['State machine in ApprovalWorkflow.tsx'],
          children: [
            { 
              id: 'approval-workflow', 
              name: 'Approval Workflow', 
              icon: GitBranch, 
              color: 'from-purple-300 to-pink-300',
              description: 'Visual workflow status and actions',
              businessRules: ['Draft → Submitted → Approved → Exported', 'Reject returns to draft'],
              developerNotes: ['Component: ApprovalWorkflow.tsx'],
            },
            { 
              id: 'approval-delegation', 
              name: 'Delegation', 
              icon: Users, 
              color: 'from-purple-300 to-pink-300',
              description: 'Delegate approval authority during absence',
              businessRules: ['Time-limited delegation', 'Audit trail preserved'],
              developerNotes: ['Component: ApprovalDelegationModal.tsx'],
            },
            { 
              id: 'audit-trail', 
              name: 'Audit Trail', 
              icon: History, 
              color: 'from-purple-300 to-pink-300',
              description: 'Complete history of all timesheet actions',
              businessRules: ['Immutable records', 'Who, what, when captured'],
              developerNotes: ['Component: TimesheetAuditTrail.tsx'],
            },
          ]
        },
        {
          id: 'timesheet-compliance',
          name: 'Compliance & Pay',
          icon: Shield,
          color: 'from-purple-400 to-pink-400',
          description: 'Award compliance validation and pay calculations',
          developerNotes: ['Uses awardInterpreter.ts for calculations'],
          children: [
            { 
              id: 'compliance-panel', 
              name: 'Compliance Panel', 
              icon: Shield, 
              color: 'from-purple-300 to-pink-300',
              description: 'Compliance status and violation details',
              businessRules: ['Block export if non-compliant', 'Override requires justification'],
              developerNotes: ['Component: CompliancePanel.tsx'],
            },
            { 
              id: 'compliance-scorecard', 
              name: 'Compliance Scorecard', 
              icon: Target, 
              color: 'from-purple-300 to-pink-300',
              description: 'Summary compliance metrics and trends',
              businessRules: ['Track by department, manager', 'Flag recurring issues'],
              developerNotes: ['Component: ComplianceScorecard.tsx'],
            },
            { 
              id: 'overtime-breakdown', 
              name: 'Overtime Breakdown', 
              icon: Clock, 
              color: 'from-purple-300 to-pink-300',
              description: 'Detailed overtime calculations and rates',
              businessRules: ['Weekly calculation', 'Show tier breakdowns'],
              developerNotes: ['Component: OvertimeBreakdown.tsx'],
            },
            { 
              id: 'allowances-panel', 
              name: 'Allowances Panel', 
              icon: DollarSign, 
              color: 'from-purple-300 to-pink-300',
              description: 'Applied allowances for the timesheet period',
              businessRules: ['Auto-apply eligible allowances', 'Manual addition option'],
              developerNotes: ['Component: AllowancesPanel.tsx'],
            },
          ]
        },
        {
          id: 'export-analytics',
          name: 'Export & Analytics',
          icon: BarChart3,
          color: 'from-purple-400 to-pink-400',
          description: 'Payroll export and workforce analytics',
          apis: ['exportTimesheets', 'getTimesheetAnalytics'],
          developerNotes: ['Export format configurable for payroll systems'],
          children: [
            { 
              id: 'export-dialog', 
              name: 'Export Dialog', 
              icon: Download, 
              color: 'from-purple-300 to-pink-300',
              description: 'Configure and execute payroll exports',
              businessRules: ['Locks exported timesheets', 'Format: CSV, Excel, API'],
              developerNotes: ['Component: ExportDialog.tsx'],
            },
            { 
              id: 'timesheet-analytics', 
              name: 'Analytics', 
              icon: BarChart3, 
              color: 'from-purple-300 to-pink-300',
              description: 'Hours, costs, and trends analysis',
              businessRules: ['Compare periods', 'Drill-down by department'],
              developerNotes: ['Component: TimesheetAnalytics.tsx'],
            },
            { 
              id: 'notifications', 
              name: 'Notification Center', 
              icon: Bell, 
              color: 'from-purple-300 to-pink-300',
              description: 'Timesheet reminders and alerts',
              businessRules: ['Reminder at day 5', 'Escalate overdue'],
              developerNotes: ['Component: NotificationCenter.tsx'],
            },
          ]
        },
      ]
    },
    {
      id: 'engines',
      name: 'Core Engines',
      icon: Zap,
      color: 'from-red-500 to-rose-500',
      description: 'Background calculation and validation engines',
      developerNotes: ['Pure functions in src/lib/', 'No direct UI - consumed by other modules'],
      children: [
        {
          id: 'calculation-engine',
          name: 'Calculation Engine',
          icon: DollarSign,
          color: 'from-green-400 to-lime-400',
          description: 'Pay calculation based on awards, shifts, and staff rates',
          apis: ['calculateShiftCost', 'calculateWeeklyCost', 'calculateRosterCost'],
          businessRules: ['All currency in cents internally', 'Results cached with hash key'],
          developerNotes: ['Core: awardInterpreter.ts', 'Forecasting: labourForecasting.ts'],
          children: [
            { 
              id: 'award-interpreter', 
              name: 'Award Interpreter', 
              icon: Award, 
              color: 'from-green-300 to-lime-300',
              description: 'Interprets award rules for pay calculations',
              businessRules: ['Handles all award types', 'Compounds applicable rates'],
              developerNotes: ['File: awardInterpreter.ts', 'Main function: calculateShiftCost()'],
            },
            { 
              id: 'labour-forecasting', 
              name: 'Labour Forecasting', 
              icon: BarChart3, 
              color: 'from-green-300 to-lime-300',
              description: 'Projects future labor costs based on roster',
              businessRules: ['Uses current award rates', 'Accounts for scheduled changes'],
              developerNotes: ['File: labourForecasting.ts'],
            },
            { 
              id: 'shift-type-detection', 
              name: 'Shift Type Detection', 
              icon: Target, 
              color: 'from-green-300 to-lime-300',
              description: 'Classifies shifts (standard, on-call, sleepover, etc.)',
              businessRules: ['Determines applicable allowances', 'Affects penalty calculations'],
              developerNotes: ['File: shiftTypeDetection.ts'],
            },
          ]
        },
        {
          id: 'compliance-engine',
          name: 'Compliance Engine',
          icon: Shield,
          color: 'from-red-400 to-rose-400',
          description: 'Validates shifts and timesheets against regulations',
          apis: ['validateShift', 'checkRatioCompliance', 'detectConflicts'],
          businessRules: ['Runs on every change', 'Error/warning/info severity levels'],
          developerNotes: ['Core: complianceEngine.ts', 'Ratios: ratioCompliance.ts'],
          children: [
            { 
              id: 'conflict-detection', 
              name: 'Conflict Detection', 
              icon: AlertTriangle, 
              color: 'from-red-300 to-rose-300',
              description: 'Detects scheduling conflicts and violations',
              businessRules: ['Overlap detection', 'Minimum break requirements'],
              developerNotes: ['File: shiftConflictDetection.ts'],
            },
            { 
              id: 'ratio-compliance', 
              name: 'Ratio Compliance', 
              icon: Target, 
              color: 'from-red-300 to-rose-300',
              description: 'Validates staff-to-child ratios',
              businessRules: ['Industry-specific ratios', 'Qualification requirements'],
              developerNotes: ['File: ratioCompliance.ts'],
            },
            { 
              id: 'validation-schemas', 
              name: 'Validation Schemas', 
              icon: CheckCircle2, 
              color: 'from-red-300 to-rose-300',
              description: 'Form and data validation rules',
              businessRules: ['Zod schemas for all forms', 'Consistent error messages'],
              developerNotes: ['File: validationSchemas.ts', 'Uses zod library'],
            },
          ]
        },
      ]
    },
    {
      id: 'integrations',
      name: 'Integrations & Settings',
      icon: Settings,
      color: 'from-gray-500 to-slate-500',
      description: 'System configuration, data management, and external integrations',
      developerNotes: ['Settings accessible via /settings route'],
      children: [
        {
          id: 'data-management',
          name: 'Data Management',
          icon: Database,
          color: 'from-gray-400 to-slate-400',
          description: 'Import, export, and configuration of system data',
          apis: ['importDemandData', 'exportDemandData'],
          developerNotes: ['Uses ETL pipeline: demandETL.ts'],
          children: [
            { 
              id: 'demand-settings', 
              name: 'Demand Settings', 
              icon: BarChart3, 
              color: 'from-gray-300 to-slate-300',
              description: 'Configure demand forecasting parameters',
              businessRules: ['Historical data weighting', 'Seasonal adjustments'],
              developerNotes: ['Component: DemandMasterSettingsModal.tsx'],
            },
            { 
              id: 'demand-import', 
              name: 'CSV Import/Export', 
              icon: Upload, 
              color: 'from-gray-300 to-slate-300',
              description: 'Bulk import and export of demand data',
              businessRules: ['Validate format on import', 'Backup before overwrite'],
              developerNotes: ['Component: DemandCsvImportExport.tsx'],
            },
            { 
              id: 'industry-config', 
              name: 'Industry Config', 
              icon: Building2, 
              color: 'from-gray-300 to-slate-300',
              description: 'Industry-specific configurations and rules',
              businessRules: ['Childcare, healthcare, etc.', 'Determines default ratios'],
              developerNotes: ['Component: IndustryConfigurationModal.tsx'],
            },
          ]
        },
        {
          id: 'external-integrations',
          name: 'External Integrations',
          icon: Link2,
          color: 'from-gray-400 to-slate-400',
          description: 'Connect with external systems and services',
          developerNotes: ['API credentials stored securely'],
          children: [
            { 
              id: 'integration-manager', 
              name: 'Integration Manager', 
              icon: Settings, 
              color: 'from-gray-300 to-slate-300',
              description: 'Configure external system connections',
              businessRules: ['Test connection before save', 'Retry logic for failures'],
              developerNotes: ['Component: IntegrationManagerModal.tsx'],
            },
            { 
              id: 'on-call-settings', 
              name: 'On-Call Settings', 
              icon: Clock, 
              color: 'from-gray-300 to-slate-300',
              description: 'On-call and sleepover configuration',
              businessRules: ['Activation thresholds', 'Minimum payment rules'],
              developerNotes: ['Component: OnCallSettingsEditor.tsx'],
            },
          ]
        },
      ]
    },
  ]
};

export function ModuleDependencyExplorer() {
  const [selectedModule, setSelectedModule] = useState<ModuleNode | null>(null);
  const [highlightedFlows, setHighlightedFlows] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showAllFlows, setShowAllFlows] = useState(true);
  const [activeView, setActiveView] = useState<'graph' | 'matrix' | 'list' | 'mindmap'>('graph');

  const handleModuleClick = useCallback((module: ModuleNode) => {
    setSelectedModule(module);
    const relatedFlows = DATA_FLOWS.filter(
      f => f.from === module.id || f.to === module.id
    ).map(f => f.id);
    setHighlightedFlows(relatedFlows);
  }, []);

  const handleModuleHover = useCallback((moduleId: string | null) => {
    if (!moduleId) {
      if (!selectedModule) {
        setHighlightedFlows([]);
      }
      return;
    }
    const relatedFlows = DATA_FLOWS.filter(
      f => f.from === moduleId || f.to === moduleId
    ).map(f => f.id);
    setHighlightedFlows(relatedFlows);
  }, [selectedModule]);

  const resetView = useCallback(() => {
    setSelectedModule(null);
    setHighlightedFlows([]);
  }, []);

  const getFlowsForModule = (moduleId: string, direction: 'in' | 'out') => {
    return DATA_FLOWS.filter(f => 
      direction === 'out' ? f.from === moduleId : f.to === moduleId
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Module Dependency Explorer</h2>
          <p className="text-muted-foreground">
            Interactive visualization of system architecture and data flows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllFlows(!showAllFlows)}
          >
            {showAllFlows ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showAllFlows ? 'Hide Flows' : 'Show Flows'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAnimating(!isAnimating)}
          >
            {isAnimating ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isAnimating ? 'Pause' : 'Animate'}
          </Button>
          <Button variant="outline" size="sm" onClick={resetView}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)}>
        <TabsList>
          <TabsTrigger value="graph" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Graph View
          </TabsTrigger>
          <TabsTrigger value="mindmap" className="gap-2">
            <Network className="h-4 w-4" />
            Mind Map
          </TabsTrigger>
          <TabsTrigger value="matrix" className="gap-2">
            <Layers className="h-4 w-4" />
            Matrix View
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <FileText className="h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="graph" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Graph Visualization */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="relative min-h-[500px]">
                    {/* Module Nodes - Arranged in a flow pattern */}
                    <div className="grid grid-cols-3 gap-8">
                      {/* Row 1: Awards */}
                      <div className="col-start-2">
                        <ModuleNodeCard
                          module={MODULES[0]}
                          isSelected={selectedModule?.id === MODULES[0].id}
                          isHighlighted={highlightedFlows.some(
                            fid => DATA_FLOWS.find(f => f.id === fid && (f.from === MODULES[0].id || f.to === MODULES[0].id))
                          )}
                          onClick={() => handleModuleClick(MODULES[0])}
                          onHover={(hovering) => handleModuleHover(hovering ? MODULES[0].id : null)}
                        />
                      </div>

                      {/* Row 2: Staff */}
                      <div className="col-start-1 mt-8">
                        <ModuleNodeCard
                          module={MODULES[1]}
                          isSelected={selectedModule?.id === MODULES[1].id}
                          isHighlighted={highlightedFlows.some(
                            fid => DATA_FLOWS.find(f => f.id === fid && (f.from === MODULES[1].id || f.to === MODULES[1].id))
                          )}
                          onClick={() => handleModuleClick(MODULES[1])}
                          onHover={(hovering) => handleModuleHover(hovering ? MODULES[1].id : null)}
                        />
                      </div>

                      {/* Row 2: Compliance */}
                      <div className="col-start-3 mt-8">
                        <ModuleNodeCard
                          module={MODULES[4]}
                          isSelected={selectedModule?.id === MODULES[4].id}
                          isHighlighted={highlightedFlows.some(
                            fid => DATA_FLOWS.find(f => f.id === fid && (f.from === MODULES[4].id || f.to === MODULES[4].id))
                          )}
                          onClick={() => handleModuleClick(MODULES[4])}
                          onHover={(hovering) => handleModuleHover(hovering ? MODULES[4].id : null)}
                        />
                      </div>

                      {/* Row 3: Roster (center) */}
                      <div className="col-start-2 mt-8">
                        <ModuleNodeCard
                          module={MODULES[2]}
                          isSelected={selectedModule?.id === MODULES[2].id}
                          isHighlighted={highlightedFlows.some(
                            fid => DATA_FLOWS.find(f => f.id === fid && (f.from === MODULES[2].id || f.to === MODULES[2].id))
                          )}
                          onClick={() => handleModuleClick(MODULES[2])}
                          onHover={(hovering) => handleModuleHover(hovering ? MODULES[2].id : null)}
                        />
                      </div>

                      {/* Row 4: Calculation */}
                      <div className="col-start-1 mt-8">
                        <ModuleNodeCard
                          module={MODULES[5]}
                          isSelected={selectedModule?.id === MODULES[5].id}
                          isHighlighted={highlightedFlows.some(
                            fid => DATA_FLOWS.find(f => f.id === fid && (f.from === MODULES[5].id || f.to === MODULES[5].id))
                          )}
                          onClick={() => handleModuleClick(MODULES[5])}
                          onHover={(hovering) => handleModuleHover(hovering ? MODULES[5].id : null)}
                        />
                      </div>

                      {/* Row 4: Timesheet */}
                      <div className="col-start-3 mt-8">
                        <ModuleNodeCard
                          module={MODULES[3]}
                          isSelected={selectedModule?.id === MODULES[3].id}
                          isHighlighted={highlightedFlows.some(
                            fid => DATA_FLOWS.find(f => f.id === fid && (f.from === MODULES[3].id || f.to === MODULES[3].id))
                          )}
                          onClick={() => handleModuleClick(MODULES[3])}
                          onHover={(hovering) => handleModuleHover(hovering ? MODULES[3].id : null)}
                        />
                      </div>
                    </div>

                    {/* Data Flow Lines - Simplified visual indicators */}
                    {showAllFlows && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {DATA_FLOWS.map((flow, idx) => {
                          const isHighlighted = highlightedFlows.includes(flow.id);
                          const opacity = highlightedFlows.length === 0 ? 0.3 : isHighlighted ? 1 : 0.1;
                          
                          return (
                            <div
                              key={flow.id}
                              className={`absolute transition-opacity duration-300 ${
                                isAnimating && isHighlighted ? 'animate-pulse' : ''
                              }`}
                              style={{ opacity }}
                            >
                              {/* Flow indicator dots - positioned based on flow type */}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Details Panel */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {selectedModule ? selectedModule.name : 'Module Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedModule ? (
                    <ModuleDetailsPanel module={selectedModule} />
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Click on a module to view details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mindmap" className="mt-4">
          <ProductMindMap />
        </TabsContent>

        <TabsContent value="matrix" className="mt-4">
          <DependencyMatrix />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <DataFlowList flows={DATA_FLOWS} modules={MODULES} />
        </TabsContent>
      </Tabs>

      {/* Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
              <span>Awards</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
              <span>Staff</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
              <span>Roster</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
              <span>Timesheet</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-rose-500" />
              <span>Compliance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-lime-500" />
              <span>Calculation</span>
            </div>
            <div className="border-l pl-6 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                <span>Real-time</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span>On-demand</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span>Scheduled</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ModuleNodeCardProps {
  module: ModuleNode;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onHover: (hovering: boolean) => void;
}

function ModuleNodeCard({ module, isSelected, isHighlighted, onClick, onHover }: ModuleNodeCardProps) {
  const Icon = module.icon;
  
  return (
    <div
      className={`
        relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
        ${isSelected 
          ? 'border-primary shadow-lg scale-105' 
          : isHighlighted 
            ? 'border-primary/50 shadow-md' 
            : 'border-border hover:border-primary/30'
        }
        bg-card hover:shadow-md
      `}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div className={`
        w-12 h-12 rounded-lg bg-gradient-to-br ${module.color} 
        flex items-center justify-center mb-3
      `}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="font-semibold text-sm">{module.name}</h3>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
        {module.description}
      </p>
      <div className="flex items-center gap-2 mt-3">
        <Badge variant="secondary" className="text-xs">
          {module.components.length} components
        </Badge>
        <Badge variant="outline" className="text-xs">
          {module.apis.length} APIs
        </Badge>
      </div>
      
      {/* Connection indicators */}
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
        {module.dataProvides.length > 0 && (
          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
            <ArrowRight className="h-2.5 w-2.5 text-white" />
          </div>
        )}
      </div>
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
        {module.dataConsumes.length > 0 && (
          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
            <ArrowRight className="h-2.5 w-2.5 text-white rotate-180" />
          </div>
        )}
      </div>
    </div>
  );
}

function ModuleDetailsPanel({ module }: { module: ModuleNode }) {
  const Icon = module.icon;
  const incomingFlows = DATA_FLOWS.filter(f => f.to === module.id);
  const outgoingFlows = DATA_FLOWS.filter(f => f.from === module.id);

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center flex-shrink-0`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{module.name}</h3>
            <p className="text-sm text-muted-foreground">{module.description}</p>
          </div>
        </div>

        {/* Components */}
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Box className="h-4 w-4" />
            Components ({module.components.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {module.components.map(comp => (
              <Badge key={comp} variant="secondary" className="text-xs font-mono">
                {comp}
              </Badge>
            ))}
          </div>
        </div>

        {/* Data Provides */}
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-green-600">
            <ArrowRight className="h-4 w-4" />
            Provides Data ({module.dataProvides.length})
          </h4>
          <div className="space-y-1">
            {module.dataProvides.map(data => (
              <div key={data} className="flex items-center gap-2 text-sm">
                <ChevronRight className="h-3 w-3 text-green-500" />
                {data}
              </div>
            ))}
          </div>
        </div>

        {/* Data Consumes */}
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-blue-600">
            <ArrowRight className="h-4 w-4 rotate-180" />
            Consumes Data ({module.dataConsumes.length})
          </h4>
          <div className="space-y-1">
            {module.dataConsumes.map(data => (
              <div key={data} className="flex items-center gap-2 text-sm">
                <ChevronRight className="h-3 w-3 text-blue-500" />
                {data}
              </div>
            ))}
          </div>
        </div>

        {/* Outgoing Flows */}
        {outgoingFlows.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Outgoing Data Flows
            </h4>
            <div className="space-y-2">
              {outgoingFlows.map(flow => {
                const targetModule = MODULES.find(m => m.id === flow.to);
                return (
                  <div key={flow.id} className="p-2 rounded-lg bg-muted/50 text-sm">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-green-500" />
                      <span className="font-medium">{targetModule?.name}</span>
                      <FrequencyBadge frequency={flow.frequency} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-5">
                      {flow.dataType}: {flow.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Incoming Flows */}
        {incomingFlows.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Link2 className="h-4 w-4 rotate-180" />
              Incoming Data Flows
            </h4>
            <div className="space-y-2">
              {incomingFlows.map(flow => {
                const sourceModule = MODULES.find(m => m.id === flow.from);
                return (
                  <div key={flow.id} className="p-2 rounded-lg bg-muted/50 text-sm">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-blue-500 rotate-180" />
                      <span className="font-medium">{sourceModule?.name}</span>
                      <FrequencyBadge frequency={flow.frequency} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-5">
                      {flow.dataType}: {flow.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Business Rules */}
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-amber-600">
            <Shield className="h-4 w-4" />
            Business Rules ({module.businessRules.length})
          </h4>
          <div className="space-y-1.5">
            {module.businessRules.map((rule, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm p-2 rounded bg-amber-50 dark:bg-amber-950/30">
                <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-amber-900 dark:text-amber-100">{rule}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Developer Notes */}
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-purple-600">
            <FileText className="h-4 w-4" />
            Developer Notes ({module.developerNotes.length})
          </h4>
          <div className="space-y-1.5">
            {module.developerNotes.map((note, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm p-2 rounded bg-purple-50 dark:bg-purple-950/30">
                <ChevronRight className="h-3 w-3 text-purple-500 mt-0.5 flex-shrink-0" />
                <span className="text-purple-900 dark:text-purple-100 font-mono text-xs">{note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* APIs */}
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            API Endpoints ({module.apis.length})
          </h4>
          <div className="space-y-1">
            {module.apis.map(api => (
              <div key={api} className="flex items-center gap-2 text-sm font-mono text-xs p-1.5 rounded bg-muted/50">
                <span className="text-primary">→</span>
                {api}()
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

function FrequencyBadge({ frequency }: { frequency: DataFlow['frequency'] }) {
  const config = {
    realtime: { icon: Zap, color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', label: 'Real-time' },
    'on-demand': { icon: Activity, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', label: 'On-demand' },
    scheduled: { icon: Clock, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300', label: 'Scheduled' },
  };
  
  const { icon: Icon, color, label } = config[frequency];
  
  return (
    <Badge className={`${color} text-xs gap-1`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function DependencyMatrix() {
  const moduleIds = MODULES.map(m => m.id);
  
  const getFlowBetween = (from: string, to: string) => {
    return DATA_FLOWS.filter(f => f.from === from && f.to === to);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Dependency Matrix</CardTitle>
        <p className="text-sm text-muted-foreground">
          Rows represent data sources, columns represent data consumers
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left font-medium border-b">From / To</th>
                {MODULES.map(m => (
                  <th key={m.id} className="p-2 text-center font-medium border-b min-w-[100px]">
                    <div className="flex items-center justify-center gap-1">
                      <m.icon className="h-4 w-4" />
                      <span className="text-xs">{m.name.replace(' Module', '').replace(' Engine', '')}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map(fromModule => (
                <tr key={fromModule.id} className="border-b">
                  <td className="p-2 font-medium">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${fromModule.color}`} />
                      {fromModule.name.replace(' Module', '').replace(' Engine', '')}
                    </div>
                  </td>
                  {MODULES.map(toModule => {
                    const flows = getFlowBetween(fromModule.id, toModule.id);
                    const isSame = fromModule.id === toModule.id;
                    
                    return (
                      <td key={toModule.id} className="p-2 text-center">
                        {isSame ? (
                          <span className="text-muted-foreground">—</span>
                        ) : flows.length > 0 ? (
                          <div className="flex flex-col items-center gap-1">
                            <Badge variant="default" className="text-xs">
                              {flows.length}
                            </Badge>
                            <div className="flex gap-0.5">
                              {flows.map(f => (
                                <FrequencyDot key={f.id} frequency={f.frequency} />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30">·</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function FrequencyDot({ frequency }: { frequency: DataFlow['frequency'] }) {
  const colors = {
    realtime: 'bg-green-500',
    'on-demand': 'bg-blue-500',
    scheduled: 'bg-orange-500',
  };
  
  return <div className={`w-2 h-2 rounded-full ${colors[frequency]}`} />;
}

function DataFlowList({ flows, modules }: { flows: DataFlow[], modules: ModuleNode[] }) {
  const [expandedFlow, setExpandedFlow] = useState<string | null>(null);
  const getModule = (id: string) => modules.find(m => m.id === id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">All Data Flows</CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete list of data dependencies between modules with business rules and technical notes
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {flows.map(flow => {
            const fromModule = getModule(flow.from);
            const toModule = getModule(flow.to);
            const isExpanded = expandedFlow === flow.id;
            
            if (!fromModule || !toModule) return null;
            
            return (
              <div 
                key={flow.id} 
                className={`rounded-lg border bg-card transition-all duration-200 ${isExpanded ? 'ring-2 ring-primary/50' : 'hover:bg-muted/50'}`}
              >
                <div 
                  className="flex items-center gap-4 p-3 cursor-pointer"
                  onClick={() => setExpandedFlow(isExpanded ? null : flow.id)}
                >
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${fromModule.color} flex items-center justify-center`}>
                      <fromModule.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium text-sm">{fromModule.name.replace(' Module', '').replace(' Engine', '')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ArrowRight className="h-4 w-4" />
                    <Badge variant="outline" className="font-mono text-xs">
                      {flow.dataType}
                    </Badge>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${toModule.color} flex items-center justify-center`}>
                      <toModule.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium text-sm">{toModule.name.replace(' Module', '').replace(' Engine', '')}</span>
                  </div>
                  
                  <div className="flex-1 text-sm text-muted-foreground">
                    {flow.description}
                  </div>
                  
                  <FrequencyBadge frequency={flow.frequency} />
                  
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
                
                {isExpanded && (
                  <div className="px-3 pb-3 border-t pt-3 space-y-3">
                    {/* Business Rules */}
                    {flow.businessRules && flow.businessRules.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-xs mb-2 flex items-center gap-1 text-amber-600">
                          <Shield className="h-3 w-3" />
                          Business Rules
                        </h5>
                        <div className="space-y-1">
                          {flow.businessRules.map((rule, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs p-2 rounded bg-amber-50 dark:bg-amber-950/30">
                              <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span className="text-amber-900 dark:text-amber-100">{rule}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Technical Notes */}
                    {flow.technicalNotes && (
                      <div>
                        <h5 className="font-semibold text-xs mb-2 flex items-center gap-1 text-purple-600">
                          <FileText className="h-3 w-3" />
                          Developer Notes
                        </h5>
                        <div className="flex items-start gap-2 text-xs p-2 rounded bg-purple-50 dark:bg-purple-950/30">
                          <ChevronRight className="h-3 w-3 text-purple-500 mt-0.5 flex-shrink-0" />
                          <span className="text-purple-900 dark:text-purple-100 font-mono">{flow.technicalNotes}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Source Module Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-semibold text-xs mb-2 flex items-center gap-1 text-green-600">
                          <ArrowRight className="h-3 w-3" />
                          Source: {fromModule.name}
                        </h5>
                        <div className="text-xs text-muted-foreground">
                          <p className="mb-1">{fromModule.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {fromModule.apis.slice(0, 3).map(api => (
                              <Badge key={api} variant="secondary" className="text-xs font-mono">
                                {api}()
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-semibold text-xs mb-2 flex items-center gap-1 text-blue-600">
                          <ArrowRight className="h-3 w-3 rotate-180" />
                          Target: {toModule.name}
                        </h5>
                        <div className="text-xs text-muted-foreground">
                          <p className="mb-1">{toModule.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {toModule.apis.slice(0, 3).map(api => (
                              <Badge key={api} variant="secondary" className="text-xs font-mono">
                                {api}()
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Mind Map Tree Node Component
interface MindMapTreeNodeProps {
  node: MindMapNode;
  level: number;
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
  selectedNode: string | null;
  onSelect: (id: string) => void;
}

function MindMapTreeNode({ node, level, expandedNodes, onToggle, selectedNode, onSelect }: MindMapTreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedNode === node.id;
  const Icon = node.icon;
  
  const levelStyles = [
    'pl-0',
    'pl-6',
    'pl-12',
    'pl-18',
    'pl-24',
  ];

  return (
    <div className="select-none">
      <div 
        className={`
          flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all duration-200
          ${isSelected ? 'bg-primary/10 ring-2 ring-primary/50' : 'hover:bg-muted/50'}
          ${levelStyles[Math.min(level, 4)]}
        `}
        onClick={() => {
          onSelect(node.id);
          if (hasChildren) onToggle(node.id);
        }}
      >
        {hasChildren && (
          <button 
            className="p-0.5 rounded hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}
        
        <div className={`
          w-8 h-8 rounded-lg bg-gradient-to-br ${node.color} 
          flex items-center justify-center flex-shrink-0
          ${level === 0 ? 'w-10 h-10' : level === 1 ? 'w-9 h-9' : 'w-8 h-8'}
        `}>
          <Icon className={`text-white ${level === 0 ? 'h-5 w-5' : level === 1 ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
        </div>
        
        <span className={`
          font-medium
          ${level === 0 ? 'text-lg' : level === 1 ? 'text-base' : 'text-sm'}
        `}>
          {node.name}
        </span>
        
        {hasChildren && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {node.children!.length}
          </Badge>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div className="relative">
          <div className="absolute left-[1.1rem] top-0 bottom-2 w-px bg-border" style={{ marginLeft: `${level * 24}px` }} />
          {node.children!.map((child) => (
            <MindMapTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              selectedNode={selectedNode}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Product Mind Map Component
function ProductMindMap() {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root', 'roster', 'staff', 'awards', 'timesheet', 'engines', 'integrations']));
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (node: MindMapNode) => {
      allIds.add(node.id);
      node.children?.forEach(collectIds);
    };
    collectIds(PRODUCT_MIND_MAP);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set(['root']));
  };

  const findNode = (id: string, node: MindMapNode = PRODUCT_MIND_MAP): MindMapNode | null => {
    if (node.id === id) return node;
    for (const child of node.children || []) {
      const found = findNode(id, child);
      if (found) return found;
    }
    return null;
  };

  const selectedNodeData = selectedNode ? findNode(selectedNode) : null;

  const countDescendants = (node: MindMapNode): number => {
    if (!node.children) return 0;
    return node.children.reduce((acc, child) => acc + 1 + countDescendants(child), 0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Mind Map Tree */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Product Mind Map
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete hierarchical view of all features and components
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={expandAll}>
                  <Eye className="h-4 w-4 mr-2" />
                  Expand All
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll}>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Collapse
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <MindMapTreeNode
                node={PRODUCT_MIND_MAP}
                level={0}
                expandedNodes={expandedNodes}
                onToggle={toggleNode}
                selectedNode={selectedNode}
                onSelect={setSelectedNode}
              />
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Selected Node Details */}
      <div>
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedNodeData ? selectedNodeData.name : 'Feature Details'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedNodeData ? (
              <div className="space-y-6">
                {/* Icon and Name */}
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${selectedNodeData.color} flex items-center justify-center flex-shrink-0`}>
                    <selectedNodeData.icon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{selectedNodeData.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedNodeData.children ? `${selectedNodeData.children.length} direct children` : 'Leaf node'}
                    </p>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">{selectedNodeData.children?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Direct Children</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">{countDescendants(selectedNodeData)}</div>
                    <div className="text-xs text-muted-foreground">Total Descendants</div>
                  </div>
                </div>

                {/* Children List */}
                {selectedNodeData.children && selectedNodeData.children.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Child Features ({selectedNodeData.children.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedNodeData.children.map(child => {
                        const ChildIcon = child.icon;
                        return (
                          <div 
                            key={child.id}
                            className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => {
                              setSelectedNode(child.id);
                              setExpandedNodes(prev => new Set([...prev, selectedNodeData.id]));
                            }}
                          >
                            <div className={`w-6 h-6 rounded bg-gradient-to-br ${child.color} flex items-center justify-center`}>
                              <ChildIcon className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm font-medium">{child.name}</span>
                            {child.children && (
                              <Badge variant="outline" className="ml-auto text-xs">
                                {child.children.length}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Breadcrumb */}
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    Path
                  </h4>
                  <div className="flex flex-wrap items-center gap-1 text-xs">
                    {(() => {
                      const path: MindMapNode[] = [];
                      const findPath = (node: MindMapNode, target: string, current: MindMapNode[]): boolean => {
                        current.push(node);
                        if (node.id === target) {
                          path.push(...current);
                          return true;
                        }
                        for (const child of node.children || []) {
                          if (findPath(child, target, [...current])) return true;
                        }
                        return false;
                      };
                      findPath(PRODUCT_MIND_MAP, selectedNodeData.id, []);
                      
                      return path.map((p, idx) => (
                        <React.Fragment key={p.id}>
                          <span 
                            className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                              p.id === selectedNodeData.id 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                            onClick={() => setSelectedNode(p.id)}
                          >
                            {p.name}
                          </span>
                          {idx < path.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                        </React.Fragment>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Click on a node to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ModuleDependencyExplorer;
