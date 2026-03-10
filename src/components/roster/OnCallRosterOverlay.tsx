import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Phone,
  PhoneCall,
  Calendar,
  Clock,
  Shield,
  AlertTriangle,
  ChevronRight,
  ArrowUpDown,
  History,
  Star,
  Plus,
  ArrowRightLeft,
} from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

import { statusColors, callbackTypeColors } from './on-call/types';
import type { OnCallAssignment } from './on-call/types';
import type { AvailableStaff } from './on-call/types';
import { generateWeekAssignments, mockEscalation, mockCallbackHistory } from './on-call/mockData';
import { AssignStaffDialog } from './on-call/AssignStaffDialog';
import { SwapStaffDialog } from './on-call/SwapStaffDialog';
import { EscalationSimulation } from './on-call/EscalationSimulation';

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

export function OnCallRosterOverlay() {
  const [assignments, setAssignments] = useState<OnCallAssignment[]>(generateWeekAssignments());
  const [activeTab, setActiveTab] = useState('roster');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignDialogDate, setAssignDialogDate] = useState('');
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [swapAssignment, setSwapAssignment] = useState<OnCallAssignment | null>(null);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const today = format(new Date(), 'yyyy-MM-dd');

  const byDate: Record<string, OnCallAssignment[]> = {};
  assignments.forEach(a => {
    if (!byDate[a.date]) byDate[a.date] = [];
    byDate[a.date].push(a);
  });

  const handleAssign = useCallback((assignment: Omit<OnCallAssignment, 'id'>) => {
    const newAssignment: OnCallAssignment = {
      ...assignment,
      id: `oc-custom-${Date.now()}`,
    };
    setAssignments(prev => [...prev, newAssignment]);
  }, []);

  const handleSwap = useCallback((assignmentId: string, newStaff: AvailableStaff, startTime: string, endTime: string) => {
    setAssignments(prev => prev.map(a =>
      a.id === assignmentId
        ? { ...a, staffId: newStaff.id, staffName: newStaff.name, staffRole: newStaff.role, staffPhone: newStaff.phone, startTime, endTime }
        : a
    ));
  }, []);

  const handleRemove = useCallback((assignmentId: string) => {
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
  }, []);

  const openAssignDialog = (date: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAssignDialogDate(date);
    setAssignDialogOpen(true);
  };

  const openSwapDialog = (assignment: OnCallAssignment, e: React.MouseEvent) => {
    e.stopPropagation();
    setSwapAssignment(assignment);
    setSwapDialogOpen(true);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="roster" className="gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Weekly Roster
            </TabsTrigger>
            <TabsTrigger value="escalation" className="gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5" />
              Escalation Chain
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="h-3.5 w-3.5" />
              Callback History
            </TabsTrigger>
          </TabsList>

          {/* Weekly Roster Tab */}
          <TabsContent value="roster" className="mt-4 space-y-4">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }, (_, i) => {
                const date = format(addDays(weekStart, i), 'yyyy-MM-dd');
                const dateDisplay = format(addDays(weekStart, i), 'MMM d');
                const dayAssignments = byDate[date] || [];
                const isToday = date === today;
                const primary = dayAssignments.find(a => a.isPrimary);
                const secondary = dayAssignments.find(a => !a.isPrimary);
                const canAssign = !primary || !secondary;

                return (
                  <Card
                    key={date}
                    className={`card-material cursor-pointer transition-all hover:shadow-md ${
                      isToday ? 'ring-2 ring-primary border-primary' : ''
                    } ${selectedDate === date ? 'ring-2 ring-amber-500' : ''}`}
                    onClick={() => setSelectedDate(selectedDate === date ? null : date)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                          {dayNames[i]}
                        </span>
                        <span className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                          {dateDisplay}
                        </span>
                      </div>

                      {primary && (
                        <div className="mb-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Star className="h-3 w-3 text-amber-500" />
                            <span className="text-[10px] font-medium text-amber-600 uppercase">Primary</span>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="flex items-center gap-2 w-full text-left rounded-md p-1 -m-1 hover:bg-accent/50 transition-colors group"
                                onClick={(e) => openSwapDialog(primary, e)}
                              >
                                <Avatar className="h-7 w-7 ring-2 ring-transparent group-hover:ring-primary/40 transition-all">
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                    {getInitials(primary.staffName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium truncate">{primary.staffName.split(' ')[0]}</p>
                                  <p className="text-[10px] text-muted-foreground">{primary.startTime}–{primary.endTime}</p>
                                </div>
                                <ArrowRightLeft className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              Click to swap or reassign
                            </TooltipContent>
                          </Tooltip>
                          <div className="mt-1 flex items-center gap-1">
                            <Badge className={`text-[9px] px-1 py-0 ${statusColors[primary.status]}`}>
                              {primary.status}
                            </Badge>
                            {primary.callbackCount > 0 && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 gap-0.5">
                                <PhoneCall className="h-2.5 w-2.5" />
                                {primary.callbackCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {secondary && (
                        <div className="pt-1.5 border-t">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Shield className="h-3 w-3 text-blue-500" />
                            <span className="text-[10px] font-medium text-blue-600 uppercase">Backup</span>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="flex items-center gap-2 w-full text-left rounded-md p-1 -m-1 hover:bg-accent/50 transition-colors group"
                                onClick={(e) => openSwapDialog(secondary, e)}
                              >
                                <Avatar className="h-6 w-6 ring-2 ring-transparent group-hover:ring-blue-400/40 transition-all">
                                  <AvatarFallback className="text-[9px] bg-blue-500/10 text-blue-700">
                                    {getInitials(secondary.staffName)}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="text-[10px] text-muted-foreground truncate flex-1">{secondary.staffName.split(' ')[0]}</p>
                                <ArrowRightLeft className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              Click to swap or reassign
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}

                      {/* Assign button */}
                      {canAssign && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2 h-7 text-[10px] gap-1 text-primary hover:text-primary hover:bg-primary/5 border border-dashed border-primary/30"
                          onClick={(e) => openAssignDialog(date, e)}
                        >
                          <Plus className="h-3 w-3" />
                          Assign Staff
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Selected date detail */}
            {selectedDate && byDate[selectedDate] && (
              <Card className="card-material-elevated">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={(e) => openAssignDialog(selectedDate, e)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Assign
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {byDate[selectedDate]
                      .sort((a, b) => a.escalationOrder - b.escalationOrder)
                      .map(assignment => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-accent/30 cursor-pointer transition-colors group"
                          onClick={(e) => openSwapDialog(assignment, e)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-primary/40 transition-all">
                              <AvatarFallback className={assignment.isPrimary ? 'bg-amber-500/10 text-amber-700' : 'bg-blue-500/10 text-blue-700'}>
                                {getInitials(assignment.staffName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{assignment.staffName}</span>
                                <Badge className={assignment.isPrimary ? 'bg-amber-500/10 text-amber-700' : 'bg-blue-500/10 text-blue-700'}>
                                  {assignment.isPrimary ? 'Primary' : 'Backup'}
                                </Badge>
                                <Badge className={statusColors[assignment.status]}>
                                  {assignment.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{assignment.staffRole}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right text-sm">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Phone className="h-3.5 w-3.5" />
                                {assignment.staffPhone}
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                                <Clock className="h-3.5 w-3.5" />
                                {assignment.startTime} – {assignment.endTime}
                              </div>
                            </div>
                            <ArrowRightLeft className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Active on-call indicator */}
            {assignments.some(a => a.status === 'active') && (
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">On-Call Active Now</p>
                      <p className="text-xs text-green-700">
                        {assignments.find(a => a.status === 'active' && a.isPrimary)?.staffName} is the primary on-call contact
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Escalation Chain Tab */}
          <TabsContent value="escalation" className="mt-4 space-y-4">
            <EscalationSimulation />

            <Card className="card-material">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Current Escalation Chain
                </CardTitle>
                <CardDescription>
                  If the primary contact doesn't respond within the wait time, the next person in the chain is contacted.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {mockEscalation.map((contact, idx) => (
                    <div key={contact.staffId}>
                      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            contact.order === 1 ? 'bg-amber-500/10 text-amber-700' :
                            contact.order === 2 ? 'bg-blue-500/10 text-blue-700' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            #{contact.order}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{contact.staffName}</span>
                              {contact.isAvailable ? (
                                <Badge className="bg-green-500/10 text-green-700 text-[10px]">Available</Badge>
                              ) : (
                                <Badge className="bg-red-500/10 text-red-700 text-[10px]">Unavailable</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{contact.staffRole}</p>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {contact.phone}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Wait: {contact.responseTimeMinutes} min before escalating
                          </p>
                        </div>
                      </div>
                      {idx < mockEscalation.length - 1 && (
                        <div className="flex justify-center py-1">
                          <div className="flex flex-col items-center text-muted-foreground">
                            <div className="w-px h-3 bg-border" />
                            <ChevronRight className="h-4 w-4 rotate-90" />
                            <span className="text-[10px]">No response after {contact.responseTimeMinutes}min</span>
                            <div className="w-px h-3 bg-border" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Escalation Policy</p>
                    <p className="text-xs mt-1">
                      If no contact in the chain responds, the system will notify the Centre Manager and Area Manager via SMS and email.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Callback History Tab */}
          <TabsContent value="history" className="mt-4 space-y-4">
            <Card className="card-material">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Recent Callback History
                </CardTitle>
                <CardDescription>
                  Record of all callbacks triggered during on-call periods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockCallbackHistory.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${callbackTypeColors[item.type]}`}>
                          <PhoneCall className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{item.staffName}</span>
                            <Badge className={`text-[10px] ${callbackTypeColors[item.type]}`}>
                              {item.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.date), 'MMM d, yyyy')} • {item.duration} • {item.outcome}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-sm">${item.paidAmount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total callback pay (last 30 days)</span>
                  <span className="font-bold text-lg">
                    ${mockCallbackHistory.reduce((s, i) => s + i.paidAmount, 0).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Assign Staff Dialog */}
        <AssignStaffDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          date={assignDialogDate}
          existingAssignments={assignments}
          onAssign={handleAssign}
        />

        {/* Swap Staff Dialog */}
        <SwapStaffDialog
          open={swapDialogOpen}
          onOpenChange={setSwapDialogOpen}
          assignment={swapAssignment}
          existingAssignments={assignments}
          onSwap={handleSwap}
          onRemove={handleRemove}
        />
      </div>
    </TooltipProvider>
  );
}
