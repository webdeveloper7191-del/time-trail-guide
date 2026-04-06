import React, { useMemo } from 'react';
import {
  Users, ArrowRight, UserMinus, UserCheck, Shield,
  Star, ChevronRight, AlertTriangle, Check
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ReassignmentPlan, ReassignmentAction, StaffReassignment } from '@/lib/staffReassignment';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';

interface StaffReassignmentPanelProps {
  open: boolean;
  onClose: () => void;
  plan: ReassignmentPlan | null;
  onConfirm?: (plan: ReassignmentPlan) => void;
}

const actionConfig: Record<ReassignmentAction, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  keep: {
    label: 'Keep',
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    icon: <UserCheck className="h-4 w-4" />,
  },
  move: {
    label: 'Move',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    icon: <ArrowRight className="h-4 w-4" />,
  },
  release: {
    label: 'Release',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    icon: <UserMinus className="h-4 w-4" />,
  },
};

const roleLabels: Record<string, string> = {
  lead_educator: 'Lead Educator',
  educator: 'Educator',
  assistant: 'Assistant',
  casual: 'Casual',
  trainee: 'Trainee',
};

export function StaffReassignmentPanel({ open, onClose, plan, onConfirm }: StaffReassignmentPanelProps) {
  const groupedByAction = useMemo(() => {
    if (!plan) return { keep: [], move: [], release: [] };
    const groups: Record<ReassignmentAction, StaffReassignment[]> = { keep: [], move: [], release: [] };
    plan.reassignments.forEach(r => groups[r.action].push(r));
    return groups;
  }, [plan]);

  if (!plan) return null;

  return (
    <PrimaryOffCanvas open={open} onClose={onClose} title="Staff Reassignment Plan" size="lg">
      <div className="space-y-5 p-1">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-2">
          <SummaryCard label="Time Block" value={plan.timeBlockLabel} icon={<Shield className="h-4 w-4 text-muted-foreground" />} />
          <SummaryCard label="Target Room" value={plan.targetRoomName} icon={<Users className="h-4 w-4 text-primary" />} />
          <SummaryCard label="Staff Before → After" value={`${plan.totalStaffBefore} → ${plan.totalStaffAfter}`} icon={<ArrowRight className="h-4 w-4 text-blue-500" />} />
          <SummaryCard
            label="Staff Released"
            value={String(plan.staffReleased)}
            icon={<UserMinus className="h-4 w-4 text-amber-500" />}
            highlight={plan.staffReleased > 0}
          />
        </div>

        {/* Action groups */}
        {(['keep', 'move', 'release'] as ReassignmentAction[]).map(action => {
          const items = groupedByAction[action];
          if (items.length === 0) return null;
          const config = actionConfig[action];

          return (
            <div key={action} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={config.color}>{config.icon}</span>
                <h3 className="text-sm font-semibold text-foreground">
                  {config.label} ({items.length})
                </h3>
              </div>

              <div className="space-y-1.5">
                <AnimatePresence>
                  {items.map((r, idx) => (
                    <motion.div
                      key={r.staffId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn('rounded-lg border p-3', config.bg)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground">{r.staffName}</span>
                            <Badge variant="secondary" className="text-[10px] h-4">
                              {roleLabels[r.staffRole] || r.staffRole}
                            </Badge>
                            {!r.isQualified && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs">
                                    Does not meet minimum qualifications for target room
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                            <span>{r.currentRoomName}</span>
                            {r.action === 'move' && r.targetRoomName && (
                              <>
                                <ArrowRight className="h-3 w-3" />
                                <span className="font-medium text-foreground">{r.targetRoomName}</span>
                              </>
                            )}
                          </div>

                          {/* Qualification chips */}
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {r.qualifications.slice(0, 3).map((q, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] h-4 px-1.5">
                                {q}
                              </Badge>
                            ))}
                            {r.qualifications.length > 3 && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                +{r.qualifications.length - 3}
                              </Badge>
                            )}
                          </div>

                          {/* Reasons */}
                          {r.reasons.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {r.reasons.map((reason, i) => (
                                <span key={i} className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <ChevronRight className="h-2.5 w-2.5" />
                                  {reason}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Score */}
                        <div className="shrink-0 text-center">
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2',
                            r.score >= 70 ? 'border-green-400 text-green-700 dark:text-green-400' :
                            r.score >= 50 ? 'border-blue-400 text-blue-700 dark:text-blue-400' :
                            'border-amber-400 text-amber-700 dark:text-amber-400'
                          )}>
                            {r.score}
                          </div>
                          <span className="text-[9px] text-muted-foreground mt-0.5">Score</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}

        {/* Confirm button */}
        {onConfirm && (
          <Button className="w-full" onClick={() => onConfirm(plan)}>
            <Check className="h-4 w-4 mr-2" />
            Confirm Reassignment Plan
          </Button>
        )}
      </div>
    </PrimaryOffCanvas>
  );
}

function SummaryCard({ label, value, icon, highlight }: { label: string; value: string; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={cn(
      'bg-card border rounded-lg p-2.5 text-center',
      highlight && 'border-amber-300 dark:border-amber-700'
    )}>
      <div className="flex justify-center mb-1">{icon}</div>
      <div className={cn('text-lg font-bold', highlight ? 'text-amber-600 dark:text-amber-400' : 'text-foreground')}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
