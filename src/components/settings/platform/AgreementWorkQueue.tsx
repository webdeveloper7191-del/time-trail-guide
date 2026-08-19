import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlarmClock, BellRing, ChevronDown, ChevronRight, RotateCcw, Send } from 'lucide-react';
import { toast } from 'sonner';
import {
  OWNER_ROLE_LABELS,
  OwnerRole,
  TenantAgreement,
  tenantAgreementStore,
} from '@/lib/tenantAgreementStore';
import {
  REMINDER_REASON_LABEL,
  dueReminders,
  ownerWorkQueue,
  reminderPolicyStore,
  runAutoReminders,
  sendableReminders,
  useReminderPolicy,
} from '@/lib/agreementReminderStore';
import { cn } from '@/lib/utils';

const parseDays = (text: string) =>
  [...new Set(text.split(/[,\s]+/).map(n => parseInt(n, 10)).filter(n => Number.isFinite(n) && n > 0))].sort(
    (a, b) => b - a,
  );

/**
 * Auto-reminder policy plus an owner-based queue so each rep can see what they
 * need to chase today.
 */
export function AgreementWorkQueue({
  agreements,
  ownerRole,
  onSelectOwner,
}: {
  agreements: TenantAgreement[];
  ownerRole: OwnerRole;
  onSelectOwner: (role: OwnerRole, ownerId: string) => void;
}) {
  const policy = useReminderPolicy();
  const [open, setOpen] = useState(true);
  const [role, setRole] = useState<OwnerRole>(ownerRole);

  const reminders = useMemo(() => dueReminders(agreements, policy), [agreements, policy]);
  const sendable = sendableReminders(reminders);
  const queue = useMemo(() => ownerWorkQueue(agreements, role, policy), [agreements, role, policy]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={open ? 'Collapse work queue' : 'Expand work queue'}
              >
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              Work queue &amp; auto-reminders
            </CardTitle>
            <CardDescription>
              Chasers are scheduled from the sign-by date and the term end, then routed to whoever
              owns the account.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={sendable.length ? 'default' : 'secondary'} className="gap-1">
              <BellRing className="h-3.5 w-3.5" /> {sendable.length} due now
            </Badge>
            <Button
              size="sm"
              disabled={!policy.enabled || !sendable.length}
              onClick={() => {
                const sent = runAutoReminders(agreements, policy);
                toast.success(
                  sent
                    ? `${sent} reminder${sent === 1 ? '' : 's'} sent`
                    : 'Nothing to send right now',
                );
              }}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" /> Run reminders
            </Button>
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4">
          {/* Policy */}
          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlarmClock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Auto-reminder schedule</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id="reminders-enabled"
                    checked={policy.enabled}
                    onCheckedChange={v => reminderPolicyStore.update({ enabled: v })}
                  />
                  <Label htmlFor="reminders-enabled" className="text-xs">
                    {policy.enabled ? 'On' : 'Paused'}
                  </Label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    reminderPolicyStore.reset();
                    toast.success('Reminder schedule reset');
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
                </Button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Before sign-by (days)</Label>
                <Input
                  className="h-9"
                  defaultValue={policy.beforeDueDays.join(', ')}
                  onBlur={e =>
                    reminderPolicyStore.update({ beforeDueDays: parseDays(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Overdue cadence (days)</Label>
                <Input
                  className="h-9"
                  type="number"
                  min={1}
                  defaultValue={policy.overdueEveryDays}
                  onBlur={e =>
                    reminderPolicyStore.update({
                      overdueEveryDays: Math.max(1, Number(e.target.value) || 3),
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Renewal touchpoints (days)</Label>
                <Input
                  className="h-9"
                  defaultValue={policy.renewalLeadDays.join(', ')}
                  onBlur={e =>
                    reminderPolicyStore.update({ renewalLeadDays: parseDays(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Max reminders per document</Label>
                <Input
                  className="h-9"
                  type="number"
                  min={1}
                  defaultValue={policy.maxReminders}
                  onBlur={e =>
                    reminderPolicyStore.update({
                      maxReminders: Math.max(1, Number(e.target.value) || 5),
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="business-days"
                checked={policy.businessDaysOnly}
                onCheckedChange={v => reminderPolicyStore.update({ businessDaysOnly: v })}
              />
              <Label htmlFor="business-days" className="text-xs">
                Only send on business days
              </Label>
            </div>
          </div>

          {/* Scheduled sends */}
          <div className="rounded-lg border">
            <div className="px-3 py-2 bg-muted/40 text-xs font-medium text-muted-foreground">
              Scheduled today ({reminders.length})
            </div>
            {reminders.length === 0 ? (
              <p className="px-3 py-6 text-sm text-muted-foreground text-center">
                Nothing is due for a chaser today.
              </p>
            ) : (
              <div className="divide-y max-h-64 overflow-y-auto">
                {reminders.map(r => (
                  <div
                    key={`${r.agreement.id}-${r.reason}`}
                    className="px-3 py-2 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{r.agreement.tenantName}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {r.agreement.title} · {r.detail}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={r.reason === 'overdue' ? 'destructive' : 'secondary'}
                        className="text-[10px]"
                      >
                        {REMINDER_REASON_LABEL[r.reason]}
                      </Badge>
                      {r.blocked ? (
                        <span className="text-[11px] text-muted-foreground">{r.blocked}</span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7"
                          onClick={() => {
                            tenantAgreementStore.resend(r.agreement.id);
                            toast.success(`Reminder sent to ${r.agreement.tenantName}`);
                          }}
                        >
                          Send
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Owner queue */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Queue by owner</span>
              <Select value={role} onValueChange={v => setRole(v as OwnerRole)}>
                <SelectTrigger className="h-8 w-[190px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(OWNER_ROLE_LABELS) as OwnerRole[]).map(r => (
                    <SelectItem key={r} value={r}>
                      {OWNER_ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">{OWNER_ROLE_LABELS[role]}</th>
                    <th className="text-right font-medium px-3 py-2">Awaiting</th>
                    <th className="text-right font-medium px-3 py-2">Overdue</th>
                    <th className="text-right font-medium px-3 py-2">Renewals due</th>
                    <th className="text-right font-medium px-3 py-2">Reminders</th>
                    <th className="text-right font-medium px-3 py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {queue.map(row => (
                    <tr
                      key={row.owner.id}
                      className="hover:bg-muted/40 cursor-pointer"
                      onClick={() => onSelectOwner(role, row.owner.id)}
                    >
                      <td className="px-3 py-2 font-medium">{row.owner.name}</td>
                      <td className="px-3 py-2 text-right">{row.awaitingSignature || '–'}</td>
                      <td
                        className={cn(
                          'px-3 py-2 text-right',
                          row.overdue > 0 && 'text-destructive font-medium',
                        )}
                      >
                        {row.overdue || '–'}
                      </td>
                      <td className="px-3 py-2 text-right">{row.renewalsDue || '–'}</td>
                      <td className="px-3 py-2 text-right">{row.remindersDue || '–'}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Click an owner to filter the agreement list below to their book of work.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
