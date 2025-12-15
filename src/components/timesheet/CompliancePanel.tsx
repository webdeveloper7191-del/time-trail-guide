import { ComplianceFlag, ComplianceValidation, FlagSeverity } from '@/types/compliance';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Clock,
  Coffee,
  TrendingUp,
} from 'lucide-react';

interface CompliancePanelProps {
  validation: ComplianceValidation;
  compact?: boolean;
}

const severityConfig: Record<FlagSeverity, { icon: typeof AlertCircle; color: string; bg: string }> = {
  critical: { icon: XCircle, color: 'text-status-rejected', bg: 'bg-status-rejected/10' },
  warning: { icon: AlertTriangle, color: 'text-status-pending', bg: 'bg-status-pending/10' },
  info: { icon: Info, color: 'text-primary', bg: 'bg-primary/10' },
};

const flagTypeIcons: Record<string, typeof AlertCircle> = {
  irregular_punch: AlertCircle,
  pattern_drift: TrendingUp,
  missed_break: Coffee,
  exceeded_break: Coffee,
  overtime_threshold: Clock,
  max_daily_hours: AlertTriangle,
  missing_clock_out: XCircle,
  early_clock_in: Clock,
  late_clock_out: Clock,
};

export function CompliancePanel({ validation, compact = false }: CompliancePanelProps) {
  const criticalCount = validation.flags.filter(f => f.severity === 'critical').length;
  const warningCount = validation.flags.filter(f => f.severity === 'warning').length;
  const infoCount = validation.flags.filter(f => f.severity === 'info').length;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {validation.isCompliant ? (
          <Badge className="bg-status-approved/10 text-status-approved border-status-approved/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Compliant
          </Badge>
        ) : (
          <Badge className="bg-status-rejected/10 text-status-rejected border-status-rejected/20">
            <ShieldAlert className="h-3 w-3 mr-1" />
            Issues Found
          </Badge>
        )}
        {criticalCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            {criticalCount} Critical
          </Badge>
        )}
        {warningCount > 0 && (
          <Badge className="bg-status-pending/10 text-status-pending border-status-pending/20 text-xs">
            {warningCount} Warnings
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className={cn(
        'rounded-lg p-4 flex items-center gap-3',
        validation.isCompliant ? 'bg-status-approved/10 border border-status-approved/20' : 'bg-status-rejected/10 border border-status-rejected/20'
      )}>
        {validation.isCompliant ? (
          <CheckCircle2 className="h-5 w-5 text-status-approved" />
        ) : (
          <ShieldAlert className="h-5 w-5 text-status-rejected" />
        )}
        <div className="flex-1">
          <p className={cn('font-medium', validation.isCompliant ? 'text-status-approved' : 'text-status-rejected')}>
            {validation.isCompliant ? 'Compliance Check Passed' : 'Compliance Issues Detected'}
          </p>
          <p className="text-sm text-muted-foreground">
            {validation.flags.length === 0 
              ? 'No issues found in this timesheet'
              : `${validation.flags.length} issue${validation.flags.length > 1 ? 's' : ''} require attention`}
          </p>
        </div>
        <div className="flex gap-2">
          {criticalCount > 0 && (
            <div className="text-center px-3">
              <p className="text-lg font-bold text-status-rejected">{criticalCount}</p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
          )}
          {warningCount > 0 && (
            <div className="text-center px-3">
              <p className="text-lg font-bold text-status-pending">{warningCount}</p>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </div>
          )}
          {infoCount > 0 && (
            <div className="text-center px-3">
              <p className="text-lg font-bold text-primary">{infoCount}</p>
              <p className="text-xs text-muted-foreground">Info</p>
            </div>
          )}
        </div>
      </div>

      {/* Blocking Issues */}
      {validation.blockingIssues.length > 0 && (
        <div className="rounded-lg border border-status-rejected/30 bg-status-rejected/5 p-4">
          <h4 className="font-medium text-status-rejected flex items-center gap-2 mb-2">
            <XCircle className="h-4 w-4" />
            Blocking Issues
          </h4>
          <ul className="space-y-1 text-sm">
            {validation.blockingIssues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-status-rejected">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Flag Details */}
      {validation.flags.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Detailed Flags</h4>
          <div className="space-y-2">
            {validation.flags.map((flag) => (
              <FlagItem key={flag.id} flag={flag} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FlagItem({ flag }: { flag: ComplianceFlag }) {
  const config = severityConfig[flag.severity];
  const Icon = flagTypeIcons[flag.type] || AlertCircle;

  return (
    <div className={cn('rounded-md p-3 flex items-start gap-3', config.bg)}>
      <Icon className={cn('h-4 w-4 mt-0.5', config.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn('font-medium text-sm', config.color)}>{flag.title}</p>
          {flag.entryDate && (
            <Badge variant="outline" className="text-xs">
              {flag.entryDate}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{flag.description}</p>
      </div>
      {flag.autoResolved && (
        <Badge className="bg-status-approved/10 text-status-approved text-xs">
          Resolved
        </Badge>
      )}
    </div>
  );
}
