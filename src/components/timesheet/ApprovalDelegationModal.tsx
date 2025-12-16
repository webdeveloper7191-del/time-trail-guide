import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  UserCheck,
  Calendar as CalendarIcon,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Shield,
} from 'lucide-react';
import { format, addDays, isBefore, isAfter, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface Delegation {
  id: string;
  delegateFrom: string;
  delegateTo: string;
  delegateToName: string;
  startDate: string;
  endDate: string;
  permissions: ('approve' | 'reject' | 'edit')[];
  reason: string;
  status: 'active' | 'scheduled' | 'expired';
  createdAt: string;
}

interface ApprovalDelegationModalProps {
  open: boolean;
  onClose: () => void;
  currentUser: string;
  delegations: Delegation[];
  onCreateDelegation: (delegation: Omit<Delegation, 'id' | 'createdAt' | 'status'>) => void;
  onRevokeDelegation: (id: string) => void;
}

const mockDelegates = [
  { id: 'u1', name: 'Jane Doe', role: 'Senior Manager', department: 'Operations' },
  { id: 'u2', name: 'Robert Wilson', role: 'HR Manager', department: 'Human Resources' },
  { id: 'u3', name: 'Emily Brown', role: 'Team Lead', department: 'Operations' },
  { id: 'u4', name: 'David Lee', role: 'Supervisor', department: 'Customer Service' },
];

export function ApprovalDelegationModal({
  open,
  onClose,
  currentUser,
  delegations,
  onCreateDelegation,
  onRevokeDelegation,
}: ApprovalDelegationModalProps) {
  const [selectedDelegate, setSelectedDelegate] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(addDays(new Date(), 7));
  const [reason, setReason] = useState('');
  const [permissions, setPermissions] = useState({
    approve: true,
    reject: true,
    edit: false,
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleSubmit = () => {
    if (!selectedDelegate || !startDate || !endDate) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (isBefore(endDate, startDate)) {
      toast({
        title: 'Invalid Date Range',
        description: 'End date must be after start date.',
        variant: 'destructive',
      });
      return;
    }

    const delegate = mockDelegates.find(d => d.id === selectedDelegate);
    
    onCreateDelegation({
      delegateFrom: currentUser,
      delegateTo: selectedDelegate,
      delegateToName: delegate?.name || '',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      permissions: Object.entries(permissions)
        .filter(([_, v]) => v)
        .map(([k]) => k as 'approve' | 'reject' | 'edit'),
      reason,
    });

    toast({
      title: 'Delegation Created',
      description: `Approval authority delegated to ${delegate?.name} until ${format(endDate, 'MMM d, yyyy')}`,
    });

    setShowCreateForm(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedDelegate('');
    setStartDate(new Date());
    setEndDate(addDays(new Date(), 7));
    setReason('');
    setPermissions({ approve: true, reject: true, edit: false });
  };

  const getStatusBadge = (status: Delegation['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-status-approved/10 text-status-approved border-status-approved/20">Active</Badge>;
      case 'scheduled':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Scheduled</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-muted-foreground">Expired</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Approval Delegation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Active Delegations */}
          {delegations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Current Delegations</h4>
              {delegations.map((delegation) => (
                <Card key={delegation.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{delegation.delegateToName}</span>
                            {getStatusBadge(delegation.status)}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                            <CalendarIcon className="h-3 w-3" />
                            {format(parseISO(delegation.startDate), 'MMM d')} 
                            <ArrowRight className="h-3 w-3" /> 
                            {format(parseISO(delegation.endDate), 'MMM d, yyyy')}
                          </div>
                          <div className="flex gap-1">
                            {delegation.permissions.map((perm) => (
                              <Badge key={perm} variant="secondary" className="text-[10px] capitalize">
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      {delegation.status !== 'expired' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onRevokeDelegation(delegation.id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create New Form */}
          {showCreateForm ? (
            <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                New Delegation
              </h4>

              {/* Delegate Selection */}
              <div className="space-y-2">
                <Label>Delegate To *</Label>
                <Select value={selectedDelegate} onValueChange={setSelectedDelegate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a delegate" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockDelegates.map((delegate) => (
                      <SelectItem key={delegate.id} value={delegate.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{delegate.name}</span>
                          <span className="text-xs text-muted-foreground">({delegate.role})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'MMM d, yyyy') : 'Pick date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) => isBefore(date, new Date())}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'MMM d, yyyy') : 'Pick date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => startDate ? isBefore(date, startDate) : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="space-y-2">
                  {[
                    { key: 'approve', label: 'Approve Timesheets', desc: 'Allow delegate to approve' },
                    { key: 'reject', label: 'Reject Timesheets', desc: 'Allow delegate to reject' },
                    { key: 'edit', label: 'Edit Timesheets', desc: 'Allow delegate to modify entries' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <Switch
                        checked={permissions[key as keyof typeof permissions]}
                        onCheckedChange={(checked) =>
                          setPermissions({ ...permissions, [key]: checked })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label>Reason (Optional)</Label>
                <Textarea
                  placeholder="e.g., Out of office, vacation, business travel..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-status-pending/10 border border-status-pending/20">
                <AlertTriangle className="h-4 w-4 text-status-pending shrink-0 mt-0.5" />
                <p className="text-xs text-status-pending">
                  The delegate will have full approval authority during the specified period. 
                  You can revoke this delegation at any time.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreateForm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} className="flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Create Delegation
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowCreateForm(true)}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Create New Delegation
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Mock delegations generator
export function generateMockDelegations(): Delegation[] {
  return [
    {
      id: 'd1',
      delegateFrom: 'current-user',
      delegateTo: 'u1',
      delegateToName: 'Jane Doe',
      startDate: new Date().toISOString(),
      endDate: addDays(new Date(), 5).toISOString(),
      permissions: ['approve', 'reject'],
      reason: 'Business travel',
      status: 'active',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
  ];
}
