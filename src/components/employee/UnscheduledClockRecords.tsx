import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Clock, ChevronDown, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ScheduleClockRecord } from '@/lib/employeeSchedule';

const timeLabel = (time: string) => format(parseISO(`2000-01-01T${time}`), 'h:mm a');

export function UnscheduledClockRecords({ records }: { records: ScheduleClockRecord[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (records.length === 0) return null;

  return (
    <section aria-label="Unscheduled clock entries" className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-sm font-semibold">Unscheduled clock entries</h3>
        <Badge variant="outline">{records.length}</Badge>
        {records.every(record => record.sample) && <Badge variant="secondary">Sample data</Badge>}
      </div>
      <div className="divide-y divide-border rounded-md border border-status-pending/30">
        {records.map(record => (
          <div key={record.id} className="p-4 space-y-2">
            <div className="flex items-start gap-3 flex-wrap">
              <Clock className="h-4 w-4 text-status-pending mt-1 shrink-0" />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex gap-2 items-center flex-wrap">
                  <span className="text-sm font-medium">{format(parseISO(record.date), 'EEE, d MMM yyyy')}</span>
                  <Badge variant="outline" className="text-status-pending bg-status-pending/10 border-status-pending/30">Unscheduled</Badge>
                  <Badge variant="outline">{record.status === 'approved' ? 'Approved' : record.status === 'rejected' ? 'Rejected' : 'Pending review'}</Badge>
                </div>
                <p className="text-sm">Clock in {timeLabel(record.clockIn)} · {record.clockOut ? `Clock out ${timeLabel(record.clockOut)}` : 'Still clocked in'}</p>
                <p className="text-xs text-muted-foreground flex gap-1 items-center"><MapPin className="h-3 w-3 shrink-0" />{record.location}</p>
                <p className="text-xs text-muted-foreground">No rostered shift found for this clock entry.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{record.clockOut ? `${record.netHours.toFixed(2)}h worked` : 'In progress'}</span>
                <Button variant="ghost" size="sm" aria-expanded={expanded === record.id} onClick={() => setExpanded(expanded === record.id ? null : record.id)}>
                  Details <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
            {expanded === record.id && (
              <div className="pl-7 text-sm space-y-1">
                <p>{record.totalBreakMinutes} minutes of recorded breaks</p>
                {record.breaks.map(item => <p key={item.id} className="text-muted-foreground">{timeLabel(item.startTime)} – {item.endTime ? timeLabel(item.endTime) : 'In progress'}</p>)}
                {record.notes && <p>{record.notes}</p>}
                {record.exception && <p className="text-muted-foreground">Exception: {record.exception.note}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}