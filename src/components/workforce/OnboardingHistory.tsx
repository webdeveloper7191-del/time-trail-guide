import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search, MoreHorizontal, Eye, Send, RotateCcw, XCircle, CheckCircle2,
  Clock, AlertCircle, FileText, UserPlus, Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type OnboardingStatus = 'invited' | 'in_progress' | 'completed' | 'expired' | 'cancelled';

interface OnboardingRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  invitedDate: string;
  completedDate?: string;
  expiryDate: string;
  status: OnboardingStatus;
  documentsCompleted: number;
  documentsTotal: number;
  invitedBy: string;
  method: 'paperless' | 'manual' | 'csv';
}

const mockOnboardingHistory: OnboardingRecord[] = [
  {
    id: '1', firstName: 'Sarah', lastName: 'Mitchell', email: 'sarah.m@example.com',
    position: 'Barista', department: 'Front of House', invitedDate: '2026-02-28',
    completedDate: '2026-03-01', expiryDate: '2026-03-14', status: 'completed',
    documentsCompleted: 5, documentsTotal: 5, invitedBy: 'Admin', method: 'paperless',
  },
  {
    id: '2', firstName: 'James', lastName: 'Wu', email: 'james.wu@example.com',
    position: 'Kitchen Hand', department: 'Kitchen', invitedDate: '2026-03-01',
    expiryDate: '2026-03-15', status: 'in_progress',
    documentsCompleted: 3, documentsTotal: 6, invitedBy: 'Admin', method: 'paperless',
  },
  {
    id: '3', firstName: 'Emily', lastName: 'Chen', email: 'emily.c@example.com',
    position: 'Floor Manager', department: 'Management', invitedDate: '2026-02-20',
    expiryDate: '2026-03-06', status: 'expired',
    documentsCompleted: 1, documentsTotal: 5, invitedBy: 'HR Team', method: 'paperless',
  },
  {
    id: '4', firstName: 'Liam', lastName: 'Patel', email: 'liam.p@example.com',
    position: 'Sous Chef', department: 'Kitchen', invitedDate: '2026-03-02',
    expiryDate: '2026-03-16', status: 'invited',
    documentsCompleted: 0, documentsTotal: 7, invitedBy: 'Admin', method: 'paperless',
  },
  {
    id: '5', firstName: 'Olivia', lastName: 'Brown', email: 'olivia.b@example.com',
    position: 'Waitress', department: 'Front of House', invitedDate: '2026-02-15',
    completedDate: '2026-02-18', expiryDate: '2026-03-01', status: 'completed',
    documentsCompleted: 4, documentsTotal: 4, invitedBy: 'HR Team', method: 'manual',
  },
  {
    id: '6', firstName: 'Noah', lastName: 'Garcia', email: 'noah.g@example.com',
    position: 'Bartender', department: 'Front of House', invitedDate: '2026-02-25',
    expiryDate: '2026-03-11', status: 'cancelled',
    documentsCompleted: 0, documentsTotal: 5, invitedBy: 'Admin', method: 'paperless',
  },
  {
    id: '7', firstName: 'Ava', lastName: 'Kim', email: 'ava.kim@example.com',
    position: 'Cashier', department: 'Front of House', invitedDate: '2026-03-03',
    expiryDate: '2026-03-17', status: 'invited',
    documentsCompleted: 0, documentsTotal: 5, invitedBy: 'Admin', method: 'csv',
  },
];

const statusConfig: Record<OnboardingStatus, { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  invited: { label: 'Invited', icon: Mail, variant: 'secondary', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_progress: { label: 'In Progress', icon: Clock, variant: 'secondary', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  completed: { label: 'Completed', icon: CheckCircle2, variant: 'default', className: 'bg-green-100 text-green-700 border-green-200' },
  expired: { label: 'Expired', icon: AlertCircle, variant: 'destructive', className: 'bg-red-100 text-red-700 border-red-200' },
  cancelled: { label: 'Cancelled', icon: XCircle, variant: 'outline', className: 'bg-muted text-muted-foreground' },
};

export default function OnboardingHistory() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OnboardingStatus | 'all'>('all');

  const filtered = useMemo(() => {
    return mockOnboardingHistory.filter(r => {
      const matchesSearch = search === '' ||
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        r.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const stats = useMemo(() => ({
    total: mockOnboardingHistory.length,
    invited: mockOnboardingHistory.filter(r => r.status === 'invited').length,
    inProgress: mockOnboardingHistory.filter(r => r.status === 'in_progress').length,
    completed: mockOnboardingHistory.filter(r => r.status === 'completed').length,
    expired: mockOnboardingHistory.filter(r => r.status === 'expired').length,
  }), []);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Sent', value: stats.total, icon: UserPlus, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Invited', value: stats.invited, icon: Mail, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Expired', value: stats.expired, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-full flex items-center justify-center', s.bg)}>
                <s.icon className={cn('h-5 w-5', s.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[240px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as OnboardingStatus | 'all')}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="invited">Invited</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Onboarding History
            <span className="ml-2 text-sm font-normal text-muted-foreground">({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[250px]">Employee</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Invited</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(record => {
                const sc = statusConfig[record.status];
                const StatusIcon = sc.icon;
                const docPct = record.documentsTotal > 0 ? Math.round((record.documentsCompleted / record.documentsTotal) * 100) : 0;

                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {record.firstName[0]}{record.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm text-foreground">{record.firstName} {record.lastName}</p>
                          <p className="text-xs text-muted-foreground">{record.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{record.position}</p>
                        <p className="text-xs text-muted-foreground">{record.department}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{record.method}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(record.invitedDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</TableCell>
                    <TableCell className="text-sm">{new Date(record.expiryDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${docPct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{record.documentsCompleted}/{record.documentsTotal}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-xs gap-1', sc.className)}>
                        <StatusIcon className="h-3 w-3" />
                        {sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => toast.info('View details')}>
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          {(record.status === 'invited' || record.status === 'expired') && (
                            <DropdownMenuItem onClick={() => toast.success('Invitation resent')}>
                              <RotateCcw className="h-4 w-4 mr-2" /> Resend Invite
                            </DropdownMenuItem>
                          )}
                          {record.status === 'expired' && (
                            <DropdownMenuItem onClick={() => toast.success('Expiry extended')}>
                              <Clock className="h-4 w-4 mr-2" /> Extend Expiry
                            </DropdownMenuItem>
                          )}
                          {(record.status === 'invited' || record.status === 'in_progress') && (
                            <DropdownMenuItem onClick={() => toast.success('Onboarding cancelled')} className="text-destructive">
                              <XCircle className="h-4 w-4 mr-2" /> Cancel
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => toast.info('Downloading documents')}>
                            <FileText className="h-4 w-4 mr-2" /> Download Docs
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No onboarding records found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
