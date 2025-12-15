import { ApprovalChain, ApprovalStep, ApprovalTier } from '@/types/compliance';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Users,
  ShieldCheck,
  Building2,
  Zap,
  AlertTriangle,
  ArrowRight,
  SkipForward,
} from 'lucide-react';

interface ApprovalWorkflowProps {
  chain: ApprovalChain;
  onApprove?: (stepIndex: number) => void;
  onReject?: (stepIndex: number) => void;
  onEscalate?: (stepIndex: number) => void;
  isAdmin?: boolean;
}

const tierConfig: Record<ApprovalTier, { label: string; icon: typeof User; color: string }> = {
  auto: { label: 'Auto-Approved', icon: Zap, color: 'text-status-approved' },
  manager: { label: 'Manager', icon: User, color: 'text-primary' },
  senior_manager: { label: 'Senior Manager', icon: Users, color: 'text-purple-500' },
  director: { label: 'Director', icon: Building2, color: 'text-orange-500' },
  hr: { label: 'HR', icon: ShieldCheck, color: 'text-pink-500' },
};

export function ApprovalWorkflow({ chain, onApprove, onReject, onEscalate, isAdmin = false }: ApprovalWorkflowProps) {
  if (chain.autoApproved) {
    return (
      <div className="flex items-center gap-3 p-4 bg-status-approved/10 rounded-lg border border-status-approved/20">
        <Zap className="h-5 w-5 text-status-approved" />
        <div className="flex-1">
          <p className="font-medium text-status-approved">Auto-Approved</p>
          <p className="text-sm text-muted-foreground">
            No exceptions detected - timesheet was automatically approved
          </p>
        </div>
        <Badge className="bg-status-approved text-white">Complete</Badge>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between px-2">
        <span className="text-sm text-muted-foreground">
          Step {chain.currentStepIndex + 1} of {chain.steps.length}
        </span>
        {chain.isComplete ? (
          <Badge className="bg-status-approved text-white">Complete</Badge>
        ) : (
          <Badge variant="outline">In Progress</Badge>
        )}
      </div>

      {/* Workflow Steps */}
      <div className="relative">
        {chain.steps.map((step, index) => (
          <div key={index} className="relative">
            {index > 0 && (
              <div className={cn(
                'absolute left-[18px] -top-2 w-0.5 h-4',
                step.status === 'approved' || index < chain.currentStepIndex 
                  ? 'bg-status-approved' 
                  : 'bg-border'
              )} />
            )}
            <ApprovalStepItem 
              step={step} 
              index={index}
              isCurrent={index === chain.currentStepIndex && !chain.isComplete}
              isAdmin={isAdmin}
              onApprove={onApprove ? () => onApprove(index) : undefined}
              onReject={onReject ? () => onReject(index) : undefined}
              onEscalate={onEscalate ? () => onEscalate(index) : undefined}
            />
          </div>
        ))}
      </div>

      {/* SLA Warning */}
      {!chain.isComplete && chain.steps[chain.currentStepIndex]?.slaDeadline && (
        <SLAIndicator deadline={chain.steps[chain.currentStepIndex].slaDeadline!} />
      )}
    </div>
  );
}

interface ApprovalStepItemProps {
  step: ApprovalStep;
  index: number;
  isCurrent: boolean;
  isAdmin: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onEscalate?: () => void;
}

function ApprovalStepItem({ step, index, isCurrent, isAdmin, onApprove, onReject, onEscalate }: ApprovalStepItemProps) {
  const config = tierConfig[step.tier];
  const Icon = config.icon;
  
  const statusIcon = {
    pending: Clock,
    approved: CheckCircle2,
    rejected: XCircle,
    skipped: SkipForward,
  }[step.status];

  const statusColor = {
    pending: 'text-status-pending',
    approved: 'text-status-approved',
    rejected: 'text-status-rejected',
    skipped: 'text-muted-foreground',
  }[step.status];

  const StatusIcon = statusIcon;

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-lg transition-all',
      isCurrent && 'bg-primary/5 border border-primary/20',
      step.status === 'approved' && 'bg-status-approved/5',
      step.status === 'rejected' && 'bg-status-rejected/5',
    )}>
      {/* Step Indicator */}
      <div className={cn(
        'flex items-center justify-center w-9 h-9 rounded-full shrink-0',
        step.status === 'approved' && 'bg-status-approved text-white',
        step.status === 'rejected' && 'bg-status-rejected text-white',
        step.status === 'pending' && isCurrent && 'bg-primary text-primary-foreground',
        step.status === 'pending' && !isCurrent && 'bg-muted text-muted-foreground',
        step.status === 'skipped' && 'bg-muted text-muted-foreground',
      )}>
        {step.status === 'pending' && isCurrent ? (
          <Icon className="h-4 w-4" />
        ) : (
          <StatusIcon className="h-4 w-4" />
        )}
      </div>

      {/* Step Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn('font-medium', config.color)}>{config.label}</p>
          {step.isEscalated && (
            <Badge variant="outline" className="text-xs text-orange-500 border-orange-500/30">
              Escalated
            </Badge>
          )}
        </div>
        
        {step.approverName && (
          <p className="text-sm text-muted-foreground">
            {step.status === 'approved' ? 'Approved' : step.status === 'rejected' ? 'Rejected' : 'Assigned to'} by {step.approverName}
          </p>
        )}
        
        {step.timestamp && (
          <p className="text-xs text-muted-foreground">
            {format(new Date(step.timestamp), 'MMM d, yyyy h:mm a')}
          </p>
        )}

        {step.notes && (
          <p className="text-sm text-muted-foreground mt-1 italic">"{step.notes}"</p>
        )}

        {/* Actions for current step */}
        {isCurrent && isAdmin && step.status === 'pending' && (
          <div className="flex gap-2 mt-3">
            {onApprove && (
              <Button size="sm" onClick={onApprove} className="bg-status-approved hover:bg-status-approved/90">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Approve
              </Button>
            )}
            {onReject && (
              <Button size="sm" variant="destructive" onClick={onReject}>
                <XCircle className="h-3 w-3 mr-1" />
                Reject
              </Button>
            )}
            {onEscalate && (
              <Button size="sm" variant="outline" onClick={onEscalate}>
                <ArrowRight className="h-3 w-3 mr-1" />
                Escalate
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SLAIndicator({ deadline }: { deadline: string }) {
  const deadlineDate = new Date(deadline);
  const isOverdue = isPast(deadlineDate);
  const timeLeft = formatDistanceToNow(deadlineDate, { addSuffix: true });

  return (
    <div className={cn(
      'flex items-center gap-2 p-3 rounded-lg',
      isOverdue ? 'bg-status-rejected/10 border border-status-rejected/20' : 'bg-status-pending/10 border border-status-pending/20'
    )}>
      {isOverdue ? (
        <AlertTriangle className="h-4 w-4 text-status-rejected" />
      ) : (
        <Clock className="h-4 w-4 text-status-pending" />
      )}
      <div className="flex-1">
        <p className={cn('text-sm font-medium', isOverdue ? 'text-status-rejected' : 'text-status-pending')}>
          {isOverdue ? 'SLA Overdue' : 'SLA Deadline'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isOverdue ? `Was due ${timeLeft}` : `Due ${timeLeft}`}
        </p>
      </div>
    </div>
  );
}
