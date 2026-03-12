import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/mui/Button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { mockCandidates } from '@/data/mockAgencyData';
import { Candidate } from '@/types/agency';
import {
  Search, Filter, ChevronDown, CalendarDays, Users, CheckCircle2, Clock, AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_MAP = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun mapped to dayOfWeek

interface AgencyAvailabilityScreenProps {
  onViewCandidate?: (candidate: Candidate) => void;
}

export function AgencyAvailabilityScreen({ onViewCandidate }: AgencyAvailabilityScreenProps) {
  const [search, setSearch] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [filterRole, setFilterRole] = useState('all');

  const currentWeekStart = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset);

  const filteredCandidates = useMemo(() => {
    return mockCandidates.filter(c => {
      const matchesSearch = !search ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        c.primaryRole.toLowerCase().includes(search.toLowerCase());
      const matchesRole = filterRole === 'all' || c.primaryRole === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [search, filterRole]);

  const totalAvailable = mockCandidates.filter(c => c.status === 'available').length;
  const totalOnShift = mockCandidates.filter(c => c.status === 'on_shift').length;
  const totalUnavailable = mockCandidates.filter(c => c.status === 'unavailable').length;
  const roles = Array.from(new Set(mockCandidates.map(c => c.primaryRole)));

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { title: 'Total Candidates', value: mockCandidates.length, icon: Users, color: 'bg-primary/10 text-primary' },
          { title: 'Available', value: totalAvailable, icon: CheckCircle2, color: 'bg-status-approved-bg text-status-approved' },
          { title: 'On Shift', value: totalOnShift, icon: Clock, color: 'bg-status-pending-bg text-status-pending' },
          { title: 'Unavailable', value: totalUnavailable, icon: AlertTriangle, color: 'bg-status-rejected-bg text-status-rejected' },
        ].map(kpi => (
          <div key={kpi.title} className="bg-background border border-border rounded-xl p-4 flex items-start justify-between">
            <div>
              <p className="text-[13px] text-muted-foreground font-medium">{kpi.title}</p>
              <p className="text-xl font-bold tracking-tight mt-1">{kpi.value}</p>
            </div>
            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', kpi.color.split(' ').slice(0, 1).join(' '))}>
              <kpi.icon className={cn('h-4 w-4', kpi.color.split(' ').slice(1).join(' '))} />
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter + Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative max-w-[280px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name or role"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outlined" size="small" className="h-9">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                {filterRole === 'all' ? 'All Roles' : filterRole}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterRole('all')}>All Roles</DropdownMenuItem>
              {roles.map(role => (
                <DropdownMenuItem key={role} onClick={() => setFilterRole(role)}>{role}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outlined" size="small" className="h-9 px-2" onClick={() => setWeekOffset(prev => prev - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[180px] text-center">
            {format(currentWeekStart, 'MMM d')} – {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
          </span>
          <Button variant="outlined" size="small" className="h-9 px-2" onClick={() => setWeekOffset(prev => prev + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Availability Grid Table */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-xs font-semibold w-[200px]">Candidate</TableHead>
              <TableHead className="text-xs font-semibold">Role</TableHead>
              {DAYS.map((day, idx) => (
                <TableHead key={day} className="text-xs font-semibold text-center">
                  <div>{day}</div>
                  <div className="text-[11px] font-normal text-muted-foreground">
                    {format(addDays(currentWeekStart, idx), 'd MMM')}
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-xs font-semibold text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCandidates.map(candidate => (
              <TableRow
                key={candidate.id}
                className="hover:bg-muted/20 cursor-pointer"
                onClick={() => onViewCandidate?.(candidate)}
              >
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-semibold text-primary">
                        {candidate.firstName[0]}{candidate.lastName[0]}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{candidate.firstName} {candidate.lastName}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{candidate.primaryRole}</TableCell>
                {DAY_MAP.map((dayOfWeek, idx) => {
                  const avail = candidate.availability.find(a => a.dayOfWeek === dayOfWeek);
                  return (
                    <TableCell key={idx} className="text-center p-1">
                      {avail?.isAvailable ? (
                        <div className="bg-status-approved-bg text-status-approved rounded px-1 py-1 text-[11px] font-medium">
                          {avail.startTime}–{avail.endTime}
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-[11px]">—</div>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="text-center">
                  <Badge className={cn(
                    'text-xs border-0',
                    candidate.status === 'available' ? 'bg-status-approved-bg text-status-approved' :
                    candidate.status === 'on_shift' ? 'bg-primary/10 text-primary' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {candidate.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {filteredCandidates.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10 text-sm text-muted-foreground">
                  No candidates match your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default AgencyAvailabilityScreen;
