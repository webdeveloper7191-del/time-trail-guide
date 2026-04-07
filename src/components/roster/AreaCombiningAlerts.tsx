import React, { useState, useMemo } from 'react';
import { 
  Combine, AlertTriangle, ChevronDown, ChevronUp, Check, X, 
  Users, Clock, TrendingDown, ArrowRight, Sparkles, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CombineAlert, CombineAlertSeverity, CombineAlertStatus } from '@/lib/areaCombiningEngine';
import { motion, AnimatePresence } from 'framer-motion';

interface AreaCombiningAlertsProps {
  alerts: CombineAlert[];
  onAccept: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
  onViewTimeline: () => void;
  onOpenPlanner?: () => void;
  className?: string;
}

const severityConfig: Record<CombineAlertSeverity, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  critical: {
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    icon: <AlertTriangle className="h-4 w-4" />,
    label: 'Critical',
  },
  recommended: {
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    icon: <Combine className="h-4 w-4" />,
    label: 'Recommended',
  },
  suggestion: {
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: <Sparkles className="h-4 w-4" />,
    label: 'Suggestion',
  },
};

const ageGroupLabels: Record<string, string> = {
  nursery: 'Nursery',
  toddler: 'Toddler',
  preschool: 'Pre-School',
  kindy: 'Kindy',
};

export function AreaCombiningAlerts({
  alerts,
  onAccept,
  onDismiss,
  onViewTimeline,
  onOpenPlanner,
  className,
}: AreaCombiningAlertsProps) {
  const [expanded, setExpanded] = useState(true);
  const [showDismissed, setShowDismissed] = useState(false);

  const pendingAlerts = useMemo(() => 
    alerts.filter(a => a.status === 'pending'), [alerts]);
  
  const dismissedAlerts = useMemo(() => 
    alerts.filter(a => a.status === 'dismissed'), [alerts]);

  const totalStaffSavings = useMemo(() => 
    pendingAlerts.reduce((s, a) => s + a.staffSaved, 0), [pendingAlerts]);

  if (alerts.length === 0) return null;

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {/* Header banner */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-2.5',
          'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40',
          'border-b border-amber-200 dark:border-amber-800',
          'hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-950/60 dark:hover:to-orange-950/60',
          'transition-colors'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50">
            <Combine className="h-4 w-4 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">
                Area Combining Alerts
              </span>
              <Badge variant="secondary" className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                {pendingAlerts.length} pending
              </Badge>
              {totalStaffSavings > 0 && (
                <Badge variant="outline" className="text-xs text-green-700 dark:text-green-400 border-green-300 dark:border-green-700">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Save {totalStaffSavings} staff
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Low attendance detected — combine rooms to optimize staffing
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onOpenPlanner && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => { e.stopPropagation(); onOpenPlanner(); }}
            >
              <Combine className="h-3 w-3 mr-1" />
              Planner
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={(e) => { e.stopPropagation(); onViewTimeline(); }}
          >
            <Clock className="h-3 w-3 mr-1" />
            Timeline View
          </Button>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Alert cards */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2 bg-card max-h-[300px] overflow-y-auto">
              {pendingAlerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAccept={() => onAccept(alert.id)}
                  onDismiss={() => onDismiss(alert.id)}
                />
              ))}

              {pendingAlerts.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  <Check className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  All combining suggestions have been addressed
                </div>
              )}

              {dismissedAlerts.length > 0 && (
                <button
                  onClick={() => setShowDismissed(!showDismissed)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
                >
                  {showDismissed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showDismissed ? 'Hide' : 'Show'} {dismissedAlerts.length} dismissed
                </button>
              )}

              {showDismissed && dismissedAlerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAccept={() => onAccept(alert.id)}
                  onDismiss={() => onDismiss(alert.id)}
                  isDismissed
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AlertCard({ 
  alert, 
  onAccept, 
  onDismiss, 
  isDismissed = false 
}: { 
  alert: CombineAlert; 
  onAccept: () => void; 
  onDismiss: () => void; 
  isDismissed?: boolean;
}) {
  const config = severityConfig[alert.severity];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: isDismissed ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn(
        'rounded-lg border p-3',
        config.bg,
        config.border,
        isDismissed && 'opacity-50'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className={config.color}>{config.icon}</span>
            <Badge variant="outline" className={cn('text-[10px] h-5', config.color, config.border)}>
              {config.label}
            </Badge>
            <Badge variant="secondary" className="text-[10px] h-5">
              <Clock className="h-2.5 w-2.5 mr-0.5" />
              {alert.timeBlock.label}
            </Badge>
          </div>

          {/* Room details */}
          <div className="flex items-center gap-1 flex-wrap mb-2">
            {alert.sourceRooms.map((room, idx) => (
              <React.Fragment key={room.roomId}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-background border text-xs font-medium">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {room.roomName}
                        <span className="text-muted-foreground">
                          ({room.currentAttendance}/{room.capacity})
                        </span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      <div>{ageGroupLabels[room.ageGroup] || room.ageGroup}</div>
                      <div>Utilisation: {room.utilisationPercent}%</div>
                      <div>Staff needed: {room.currentStaffNeeded}</div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {idx < alert.sourceRooms.length - 1 && (
                  <span className="text-muted-foreground text-xs">+</span>
                )}
              </React.Fragment>
            ))}
            {alert.targetRoom && (
              <>
                <ArrowRight className="h-3 w-3 text-muted-foreground mx-1" />
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                  {alert.targetRoom.roomName}
                </span>
              </>
            )}
          </div>

          {/* Message */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {alert.message}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-muted-foreground">
              Staff: {alert.staffBefore} → {alert.staffAfter}
            </span>
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              Save {alert.staffSaved} staff
            </span>
          </div>
        </div>

        {/* Actions */}
        {!isDismissed && (
          <div className="flex flex-col gap-1 shrink-0">
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={onAccept}
            >
              <Check className="h-3 w-3 mr-1" />
              Combine
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={onDismiss}
            >
              <X className="h-3 w-3 mr-1" />
              Dismiss
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
