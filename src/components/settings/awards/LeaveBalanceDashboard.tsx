import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Download,
  FileSpreadsheet,
  Search,
  TrendingUp,
  Users,
  Palmtree,
  Heart,
  Award,
  RefreshCw,
  Plus,
  History,
  Settings,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { format, addYears, differenceInDays } from 'date-fns';
import {
  LeaveBalance,
  LeaveAccrualConfig,
  LeaveTransaction,
  LeaveType,
  AustralianState,
  LSL_STATE_RULES,
  NES_ENTITLEMENTS,
  leaveTypeLabels,
  stateLabels,
} from '@/types/leaveAccrual';
import {
  calculateServiceYears,
  formatLeaveBalance,
  getLSLProRataEntitlement,
  initializeLeaveBalances,
} from '@/lib/leaveAccrualEngine';

// Mock staff data for demonstration
const mockStaffWithLeave = [
  {
    id: 'staff-1',
    name: 'Sarah Johnson',
    role: 'Lead Educator',
    state: 'NSW' as AustralianState,
    serviceStartDate: '2018-03-15',
    standardHoursPerWeek: 38,
    hourlyRate: 35.50,
    employmentBasis: 'full_time' as const,
    balances: [
      { leaveType: 'annual_leave' as LeaveType, currentBalanceHours: 112.5, accruedYTD: 76, takenYTD: 38 },
      { leaveType: 'personal_leave' as LeaveType, currentBalanceHours: 45.2, accruedYTD: 38, takenYTD: 15.2 },
      { leaveType: 'long_service_leave' as LeaveType, currentBalanceHours: 165.4, accruedYTD: 25.3, takenYTD: 0 },
    ],
  },
  {
    id: 'staff-2',
    name: 'Michael Chen',
    role: 'Educator',
    state: 'VIC' as AustralianState,
    serviceStartDate: '2020-07-01',
    standardHoursPerWeek: 30,
    hourlyRate: 32.00,
    employmentBasis: 'part_time' as const,
    balances: [
      { leaveType: 'annual_leave' as LeaveType, currentBalanceHours: 65.3, accruedYTD: 60, takenYTD: 24 },
      { leaveType: 'personal_leave' as LeaveType, currentBalanceHours: 28.1, accruedYTD: 30, takenYTD: 7.6 },
      { leaveType: 'long_service_leave' as LeaveType, currentBalanceHours: 52.8, accruedYTD: 19.9, takenYTD: 0 },
    ],
  },
  {
    id: 'staff-3',
    name: 'Emma Williams',
    role: 'Assistant',
    state: 'QLD' as AustralianState,
    serviceStartDate: '2022-01-10',
    standardHoursPerWeek: 38,
    hourlyRate: 28.50,
    employmentBasis: 'full_time' as const,
    balances: [
      { leaveType: 'annual_leave' as LeaveType, currentBalanceHours: 42.8, accruedYTD: 76, takenYTD: 45.6 },
      { leaveType: 'personal_leave' as LeaveType, currentBalanceHours: 52.4, accruedYTD: 38, takenYTD: 0 },
      { leaveType: 'long_service_leave' as LeaveType, currentBalanceHours: 18.2, accruedYTD: 25.3, takenYTD: 0 },
    ],
  },
];

// Mock transactions
const mockTransactions: (LeaveTransaction & { staffName: string })[] = [
  {
    id: 'lt-1',
    staffId: 'staff-1',
    staffName: 'Sarah Johnson',
    leaveType: 'annual_leave',
    transactionType: 'taken',
    hours: 38,
    value: 1349,
    balanceAfter: 112.5,
    startDate: '2024-12-23',
    endDate: '2024-12-27',
    reason: 'Christmas break',
    createdAt: '2024-12-01T10:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'lt-2',
    staffId: 'staff-2',
    staffName: 'Michael Chen',
    leaveType: 'personal_leave',
    transactionType: 'taken',
    hours: 7.6,
    value: 243.20,
    balanceAfter: 28.1,
    startDate: '2024-11-15',
    endDate: '2024-11-15',
    reason: 'Sick day',
    createdAt: '2024-11-15T09:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'lt-3',
    staffId: 'staff-1',
    staffName: 'Sarah Johnson',
    leaveType: 'annual_leave',
    transactionType: 'accrual',
    hours: 5.85,
    value: 207.68,
    balanceAfter: 150.5,
    reason: 'Fortnightly accrual',
    createdAt: '2024-11-30T00:00:00Z',
    createdBy: 'system',
    payPeriodId: 'pp-2024-24',
  },
];

const leaveTypeIcons: Record<LeaveType, typeof Palmtree> = {
  annual_leave: Palmtree,
  personal_leave: Heart,
  long_service_leave: Award,
  compassionate_leave: Heart,
  parental_leave: Users,
  unpaid_leave: Clock,
  public_holiday: Calendar,
  jury_duty: Calendar,
  community_service: Users,
};

const leaveTypeColors: Record<LeaveType, string> = {
  annual_leave: 'text-emerald-600 bg-emerald-500/10',
  personal_leave: 'text-rose-600 bg-rose-500/10',
  long_service_leave: 'text-purple-600 bg-purple-500/10',
  compassionate_leave: 'text-amber-600 bg-amber-500/10',
  parental_leave: 'text-blue-600 bg-blue-500/10',
  unpaid_leave: 'text-gray-600 bg-gray-500/10',
  public_holiday: 'text-cyan-600 bg-cyan-500/10',
  jury_duty: 'text-indigo-600 bg-indigo-500/10',
  community_service: 'text-teal-600 bg-teal-500/10',
};

export function LeaveBalanceDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<typeof mockStaffWithLeave[0] | null>(null);
  const [showLSLCalculator, setShowLSLCalculator] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const filteredStaff = useMemo(() => {
    return mockStaffWithLeave.filter(staff => {
      const matchesSearch = staff.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesState = selectedState === 'all' || staff.state === selectedState;
      return matchesSearch && matchesState;
    });
  }, [searchQuery, selectedState]);

  // Summary statistics
  const totalStats = useMemo(() => {
    const totals = {
      annualLeave: 0,
      personalLeave: 0,
      lsl: 0,
      totalValue: 0,
    };

    mockStaffWithLeave.forEach(staff => {
      staff.balances.forEach(bal => {
        const value = bal.currentBalanceHours * staff.hourlyRate;
        if (bal.leaveType === 'annual_leave') {
          totals.annualLeave += bal.currentBalanceHours;
        } else if (bal.leaveType === 'personal_leave') {
          totals.personalLeave += bal.currentBalanceHours;
        } else if (bal.leaveType === 'long_service_leave') {
          totals.lsl += bal.currentBalanceHours;
        }
        totals.totalValue += value;
      });
    });

    return totals;
  }, []);

  const handleExportToXero = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsExporting(false);
    toast.success('Leave balances exported', {
      description: 'Data formatted for Xero import. Download will start shortly.',
    });
  };

  const getServiceInfo = (staff: typeof mockStaffWithLeave[0]) => {
    const years = calculateServiceYears(staff.serviceStartDate);
    const rules = LSL_STATE_RULES[staff.state];
    const daysToEntitlement = differenceInDays(
      addYears(new Date(staff.serviceStartDate), rules.entitlementYears),
      new Date()
    );
    const isEligible = years >= rules.entitlementYears;

    return { years, daysToEntitlement, isEligible, rules };
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Palmtree className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatLeaveBalance(totalStats.annualLeave)}</p>
                <p className="text-sm text-muted-foreground">Total Annual Leave</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatLeaveBalance(totalStats.personalLeave)}</p>
                <p className="text-sm text-muted-foreground">Total Personal Leave</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatLeaveBalance(totalStats.lsl)}</p>
                <p className="text-sm text-muted-foreground">Total LSL Accrued</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalStats.totalValue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Leave Liability</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card className="card-material">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {Object.entries(stateLabels).map(([code, name]) => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowLSLCalculator(true)}>
                <Award className="h-4 w-4 mr-2" />
                LSL Calculator
              </Button>
              <Button onClick={handleExportToXero} disabled={isExporting}>
                {isExporting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                Export to Xero
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="balances" className="space-y-4">
        <TabsList>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="lsl-rules">LSL State Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="balances" className="space-y-4">
          <Card className="card-material">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Employee Leave Balances</CardTitle>
              <CardDescription>
                Current leave balances and accrual status for all employees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead className="text-right">Annual Leave</TableHead>
                      <TableHead className="text-right">Personal Leave</TableHead>
                      <TableHead className="text-right">LSL</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map(staff => {
                      const serviceInfo = getServiceInfo(staff);
                      const annualLeave = staff.balances.find(b => b.leaveType === 'annual_leave');
                      const personalLeave = staff.balances.find(b => b.leaveType === 'personal_leave');
                      const lsl = staff.balances.find(b => b.leaveType === 'long_service_leave');
                      const totalValue = staff.balances.reduce(
                        (sum, bal) => sum + (bal.currentBalanceHours * staff.hourlyRate), 0
                      );

                      return (
                        <TableRow key={staff.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedStaff(staff)}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{staff.name}</p>
                              <p className="text-xs text-muted-foreground">{staff.role}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{staff.state}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{serviceInfo.years} years</span>
                              {serviceInfo.isEligible ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Info className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              <p className="font-medium">{annualLeave?.currentBalanceHours.toFixed(1)}h</p>
                              <p className="text-xs text-muted-foreground">
                                {(annualLeave?.currentBalanceHours || 0) / 7.6} days
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              <p className="font-medium">{personalLeave?.currentBalanceHours.toFixed(1)}h</p>
                              <p className="text-xs text-muted-foreground">
                                {((personalLeave?.currentBalanceHours || 0) / 7.6).toFixed(1)} days
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              <p className="font-medium">{lsl?.currentBalanceHours.toFixed(1)}h</p>
                              {!serviceInfo.isEligible && (
                                <p className="text-xs text-muted-foreground">
                                  {Math.ceil(serviceInfo.daysToEntitlement / 365)}y to access
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${totalValue.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="card-material">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recent Leave Transactions</CardTitle>
              <CardDescription>
                Accruals, leave taken, and adjustments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {mockTransactions.map(tx => {
                    const Icon = leaveTypeIcons[tx.leaveType];
                    const colorClass = leaveTypeColors[tx.leaveType];

                    return (
                      <div key={tx.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{tx.staffName}</p>
                            <Badge variant={tx.transactionType === 'accrual' ? 'secondary' : 'outline'} className="text-xs">
                              {tx.transactionType}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {leaveTypeLabels[tx.leaveType]} • {tx.reason}
                          </p>
                          {tx.startDate && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(tx.startDate), 'dd MMM yyyy')}
                              {tx.endDate && tx.endDate !== tx.startDate && ` - ${format(new Date(tx.endDate), 'dd MMM yyyy')}`}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${tx.transactionType === 'accrual' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {tx.transactionType === 'accrual' ? '+' : '-'}{tx.hours.toFixed(1)}h
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${tx.value.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lsl-rules" className="space-y-4">
          <Card className="card-material">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Long Service Leave by State</CardTitle>
              <CardDescription>
                State-specific LSL entitlements and pro-rata rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>State</TableHead>
                      <TableHead>Entitlement</TableHead>
                      <TableHead>Pro-rata Access</TableHead>
                      <TableHead>Resignation</TableHead>
                      <TableHead>Termination</TableHead>
                      <TableHead>Additional Years</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.values(LSL_STATE_RULES).map(rules => (
                      <TableRow key={rules.state}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{rules.state}</p>
                            <p className="text-xs text-muted-foreground">{rules.stateName}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{rules.entitlementWeeks} weeks</p>
                            <p className="text-xs text-muted-foreground">after {rules.entitlementYears} years</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {rules.proRataYears ? (
                            <Badge variant="secondary">{rules.proRataYears} years</Badge>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {rules.proRataOnResignation ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          {rules.proRataOnTermination ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">+{rules.additionalWeeksPerYear}</span>
                          <span className="text-muted-foreground"> weeks/year</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Staff Detail Dialog */}
      <Dialog open={!!selectedStaff} onOpenChange={() => setSelectedStaff(null)}>
        <DialogContent className="max-w-2xl">
          {selectedStaff && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedStaff.name}</DialogTitle>
                <DialogDescription>
                  {selectedStaff.role} • {stateLabels[selectedStaff.state]} • Since {format(new Date(selectedStaff.serviceStartDate), 'MMMM yyyy')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedStaff.balances.map(bal => {
                  const Icon = leaveTypeIcons[bal.leaveType];
                  const colorClass = leaveTypeColors[bal.leaveType];
                  const maxHours = bal.leaveType === 'annual_leave' ? 152 : bal.leaveType === 'personal_leave' ? 76 : 330;
                  const progress = Math.min(100, (bal.currentBalanceHours / maxHours) * 100);

                  return (
                    <Card key={bal.leaveType} className="card-material">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{leaveTypeLabels[bal.leaveType]}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatLeaveBalance(bal.currentBalanceHours)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              ${(bal.currentBalanceHours * selectedStaff.hourlyRate).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">liability</p>
                          </div>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                          <span>Accrued YTD: +{bal.accruedYTD.toFixed(1)}h</span>
                          <span>Taken YTD: -{bal.takenYTD.toFixed(1)}h</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedStaff(null)}>
                  Close
                </Button>
                <Button>
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* LSL Calculator Dialog */}
      <Dialog open={showLSLCalculator} onOpenChange={setShowLSLCalculator}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>LSL Pro-Rata Calculator</DialogTitle>
            <DialogDescription>
              Calculate Long Service Leave entitlements based on state and service
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">State</label>
                <Select defaultValue="NSW">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(stateLabels).map(([code, name]) => (
                      <SelectItem key={code} value={code}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Years of Service</label>
                <Input type="number" defaultValue="7" min="0" max="50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Hourly Rate ($)</label>
                <Input type="number" defaultValue="35.00" step="0.01" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hours/Week</label>
                <Input type="number" defaultValue="38" />
              </div>
            </div>
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Estimated Entitlement</p>
                  <p className="text-3xl font-bold text-primary">6.07 weeks</p>
                  <p className="text-lg font-medium">230.66 hours</p>
                  <p className="text-muted-foreground">$8,073.10 at current rate</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLSLCalculator(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
