import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  Download,
  RefreshCw,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Calendar,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Shield,
  ArrowUpRight,
  ArrowRight,
  FileText,
  Bell,
  History,
  Package,
  Zap,
  Eye,
} from 'lucide-react';
import { format, parseISO, isFuture, isPast } from 'date-fns';
import { 
  AwardUpdate, 
  TenantAwardVersion, 
  MOCK_AVAILABLE_UPDATES, 
  MOCK_TENANT_VERSIONS 
} from '@/types/awardUpdates';
import { AwardUpdateDetailSheet } from './AwardUpdateDetailSheet';

export function AwardUpdatesPanel() {
  const [isChecking, setIsChecking] = useState(false);
  const [isInstalling, setIsInstalling] = useState<string | null>(null);
  const [availableUpdates, setAvailableUpdates] = useState<AwardUpdate[]>(MOCK_AVAILABLE_UPDATES);
  const [tenantVersions, setTenantVersions] = useState<TenantAwardVersion[]>(MOCK_TENANT_VERSIONS);
  const [selectedUpdate, setSelectedUpdate] = useState<AwardUpdate | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date(2025, 0, 10));
  const [expandedUpdates, setExpandedUpdates] = useState<Set<string>>(new Set());

  const handleCheckForUpdates = async () => {
    setIsChecking(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLastChecked(new Date());
    setIsChecking(false);
    
    const pendingCount = availableUpdates.filter(u => u.status === 'available').length;
    if (pendingCount > 0) {
      toast.info(`${pendingCount} update${pendingCount > 1 ? 's' : ''} available`, {
        description: 'Review and install updates to stay compliant',
      });
    } else {
      toast.success('All awards are up to date');
    }
  };

  const handleInstallUpdate = async (update: AwardUpdate) => {
    setIsInstalling(update.id);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Update the status
    setAvailableUpdates(prev => prev.map(u => 
      u.id === update.id ? { ...u, status: 'installed', installedAt: new Date().toISOString() } : u
    ));
    
    // Update tenant versions
    setTenantVersions(prev => {
      const existing = prev.find(v => v.awardId === update.awardId);
      if (existing) {
        return prev.map(v => v.awardId === update.awardId 
          ? { ...v, currentVersion: update.version, installedAt: new Date().toISOString() } 
          : v
        );
      }
      return [...prev, {
        awardId: update.awardId,
        currentVersion: update.version,
        installedAt: new Date().toISOString(),
        autoUpdate: false,
      }];
    });
    
    setIsInstalling(null);
    setShowInstallDialog(false);
    setSelectedUpdate(null);
    
    toast.success('Award rates updated successfully', {
      description: `${update.awardName} updated to ${update.version}`,
    });
  };

  const handleScheduleUpdate = (update: AwardUpdate, date: string) => {
    setAvailableUpdates(prev => prev.map(u => 
      u.id === update.id ? { ...u, status: 'scheduled', scheduledFor: date } : u
    ));
    toast.success('Update scheduled', {
      description: `Will be installed on ${format(parseISO(date), 'PPP')}`,
    });
  };

  const handleSkipUpdate = (update: AwardUpdate) => {
    setAvailableUpdates(prev => prev.map(u => 
      u.id === update.id ? { ...u, status: 'skipped' } : u
    ));
    toast.info('Update skipped', {
      description: 'You can install this update later from the history',
    });
  };

  const toggleExpanded = (updateId: string) => {
    setExpandedUpdates(prev => {
      const next = new Set(prev);
      if (next.has(updateId)) {
        next.delete(updateId);
      } else {
        next.add(updateId);
      }
      return next;
    });
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

  const pendingUpdates = availableUpdates.filter(u => u.status === 'available');
  const scheduledUpdates = availableUpdates.filter(u => u.status === 'scheduled');
  const installedUpdates = availableUpdates.filter(u => u.status === 'installed');

  const UpdateCard = ({ update }: { update: AwardUpdate }) => {
    const isExpanded = expandedUpdates.has(update.id);
    const effectiveDate = parseISO(update.effectiveDate);
    const isEffective = isPast(effectiveDate);
    const isFutureEffective = isFuture(effectiveDate);

    return (
      <Card className={`card-material-elevated transition-all ${
        update.status === 'available' ? 'border-l-4 border-l-amber-500' :
        update.status === 'scheduled' ? 'border-l-4 border-l-blue-500' :
        update.status === 'installed' ? 'border-l-4 border-l-green-500' :
        'border-l-4 border-l-muted'
      }`}>
        <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(update.id)}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  update.status === 'available' ? 'bg-amber-500/10' :
                  update.status === 'scheduled' ? 'bg-blue-500/10' :
                  update.status === 'installed' ? 'bg-green-500/10' :
                  'bg-muted'
                }`}>
                  {update.status === 'available' && <Sparkles className="h-6 w-6 text-amber-600" />}
                  {update.status === 'scheduled' && <Clock className="h-6 w-6 text-blue-600" />}
                  {update.status === 'installed' && <CheckCircle2 className="h-6 w-6 text-green-600" />}
                  {update.status === 'skipped' && <AlertCircle className="h-6 w-6 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-lg">{update.awardName}</CardTitle>
                    <Badge variant="outline" className="font-mono text-xs">{update.awardCode}</Badge>
                    {update.status === 'available' && (
                      <Badge className="bg-amber-500/10 text-amber-700 border-amber-200">
                        Update Available
                      </Badge>
                    )}
                    {update.status === 'scheduled' && (
                      <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">
                        Scheduled
                      </Badge>
                    )}
                    {update.status === 'installed' && (
                      <Badge className="bg-green-500/10 text-green-700 border-green-200">
                        Installed
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1">
                    <span className="font-medium">{update.previousVersion}</span>
                    <ArrowRight className="inline h-3 w-3 mx-2" />
                    <span className="font-medium text-primary">{update.version}</span>
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedUpdate(update);
                    setShowDetailSheet(true);
                  }}
                  size="sm"
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
                {update.status === 'available' && (
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUpdate(update);
                      setShowInstallDialog(true);
                    }}
                    className="gap-2"
                    size="sm"
                  >
                    <Download className="h-4 w-4" />
                    Install Now
                  </Button>
                )}
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Rate Increase:</span>
                <span className="font-semibold text-green-600">{formatPercent(update.rateIncreasePercent)}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Changes:</span>
                <span className="font-semibold">{update.totalChanges}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Effective:</span>
                <span className={`font-semibold ${isEffective ? 'text-green-600' : 'text-amber-600'}`}>
                  {format(effectiveDate, 'PP')}
                </span>
                {isFutureEffective && (
                  <Badge variant="outline" className="text-xs">Upcoming</Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0">
              <Separator className="my-4" />
              
              {/* Summary Notes */}
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <p className="text-sm">{update.summaryNotes}</p>
                {update.sourceUrl && (
                  <a 
                    href={update.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                  >
                    View source document <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Detailed Changes */}
              <Tabs defaultValue="rates" className="w-full">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="rates" className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Rate Changes ({update.rateChanges.length})
                  </TabsTrigger>
                  <TabsTrigger value="allowances" className="gap-2">
                    <Package className="h-4 w-4" />
                    Allowances ({update.allowanceChanges.length})
                  </TabsTrigger>
                  {update.penaltyRateChanges.length > 0 && (
                    <TabsTrigger value="penalties" className="gap-2">
                      <Zap className="h-4 w-4" />
                      Penalties ({update.penaltyRateChanges.length})
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="rates" className="mt-4">
                  <ScrollArea className="h-64">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Classification</TableHead>
                          <TableHead className="text-right">Previous Rate</TableHead>
                          <TableHead className="text-right">New Rate</TableHead>
                          <TableHead className="text-right">Change</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {update.rateChanges.map(change => (
                          <TableRow key={change.classificationId}>
                            <TableCell className="font-medium">{change.classificationName}</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatCurrency(change.previousRate)}/hr
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(change.newRate)}/hr
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className={
                                change.changeType === 'increase' 
                                  ? 'bg-green-500/10 text-green-700' 
                                  : change.changeType === 'decrease'
                                  ? 'bg-red-500/10 text-red-700'
                                  : 'bg-muted text-muted-foreground'
                              }>
                                {change.changeType === 'increase' && <ArrowUpRight className="h-3 w-3 mr-1" />}
                                {formatPercent(change.changePercent)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="allowances" className="mt-4">
                  <ScrollArea className="h-64">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Allowance</TableHead>
                          <TableHead className="text-right">Previous Rate</TableHead>
                          <TableHead className="text-right">New Rate</TableHead>
                          <TableHead className="text-right">Change</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {update.allowanceChanges.map(change => (
                          <TableRow key={change.allowanceId}>
                            <TableCell className="font-medium">{change.allowanceName}</TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatCurrency(change.previousRate)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(change.newRate)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className="bg-green-500/10 text-green-700">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                {formatPercent(change.changePercent)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>

                {update.penaltyRateChanges.length > 0 && (
                  <TabsContent value="penalties" className="mt-4">
                    <ScrollArea className="h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Penalty Type</TableHead>
                            <TableHead className="text-right">Previous Multiplier</TableHead>
                            <TableHead className="text-right">New Multiplier</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {update.penaltyRateChanges.map((change, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{change.penaltyType}</TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {change.previousMultiplier}x
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {change.newMultiplier}x
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </TabsContent>
                )}
              </Tabs>

              {/* Actions for available updates */}
              {update.status === 'available' && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Switch id={`auto-${update.id}`} />
                    <label htmlFor={`auto-${update.id}`} className="text-sm text-muted-foreground">
                      Auto-install future updates for this award
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSkipUpdate(update)}
                    >
                      Skip this update
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleScheduleUpdate(update, update.effectiveDate)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule for {format(parseISO(update.effectiveDate), 'PP')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="card-material-elevated border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Award Rate Updates</CardTitle>
                <CardDescription>
                  Fair Work Commission updates award rates annually on July 1st
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleCheckForUpdates}
                disabled={isChecking}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
                Check for Updates
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last checked:</span>
              <span className="font-medium">{format(lastChecked, 'PPp')}</span>
            </div>
            {pendingUpdates.length > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-600">
                  {pendingUpdates.length} update{pendingUpdates.length > 1 ? 's' : ''} available
                </span>
              </div>
            )}
            <a 
              href="https://www.fwc.gov.au/awards-and-agreements/awards/modern-awards" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline ml-auto"
            >
              Fair Work Commission <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Download className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingUpdates.length}</p>
                <p className="text-sm text-muted-foreground">Available Updates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduledUpdates.length}</p>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{installedUpdates.length}</p>
                <p className="text-sm text-muted-foreground">Installed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tenantVersions.length}</p>
                <p className="text-sm text-muted-foreground">Active Awards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Updates Lists */}
      <Tabs defaultValue="available" className="w-full">
        <TabsList>
          <TabsTrigger value="available" className="gap-2">
            <Download className="h-4 w-4" />
            Available ({pendingUpdates.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2">
            <Clock className="h-4 w-4" />
            Scheduled ({scheduledUpdates.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History ({installedUpdates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-4 space-y-4">
          {pendingUpdates.length === 0 ? (
            <Card className="card-material">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-lg font-medium">All awards are up to date</p>
                <p className="text-muted-foreground">Check back after July 1st for the next annual wage review</p>
              </CardContent>
            </Card>
          ) : (
            pendingUpdates.map(update => (
              <UpdateCard key={update.id} update={update} />
            ))
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="mt-4 space-y-4">
          {scheduledUpdates.length === 0 ? (
            <Card className="card-material">
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No scheduled updates</p>
                <p className="text-muted-foreground">Schedule updates to install automatically on their effective date</p>
              </CardContent>
            </Card>
          ) : (
            scheduledUpdates.map(update => (
              <UpdateCard key={update.id} update={update} />
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          {installedUpdates.length === 0 ? (
            <Card className="card-material">
              <CardContent className="py-12 text-center">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No update history</p>
                <p className="text-muted-foreground">Installed updates will appear here</p>
              </CardContent>
            </Card>
          ) : (
            installedUpdates.map(update => (
              <UpdateCard key={update.id} update={update} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Install Confirmation Dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Install Award Update
            </DialogTitle>
            <DialogDescription>
              This will update all rates for {selectedUpdate?.awardName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUpdate && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Version:</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedUpdate.previousVersion}</Badge>
                    <ArrowRight className="h-3 w-3" />
                    <Badge>{selectedUpdate.version}</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Rate Increase:</span>
                  <span className="font-semibold text-green-600">{formatPercent(selectedUpdate.rateIncreasePercent)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Changes:</span>
                  <span className="font-semibold">{selectedUpdate.totalChanges} items</span>
                </div>
              </div>
              
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Important</p>
                  <p className="text-amber-700">
                    This will immediately update all pay rates. Any shifts calculated after this point will use the new rates.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInstallDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedUpdate && handleInstallUpdate(selectedUpdate)}
              disabled={isInstalling === selectedUpdate?.id}
              className="gap-2"
            >
              {isInstalling === selectedUpdate?.id ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Install Update
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Award Update Detail Sheet */}
      <AwardUpdateDetailSheet
        update={selectedUpdate}
        open={showDetailSheet}
        onOpenChange={setShowDetailSheet}
        onInstall={(update) => {
          setShowDetailSheet(false);
          handleInstallUpdate(update);
        }}
        onSchedule={(update, date) => {
          setShowDetailSheet(false);
          handleScheduleUpdate(update, date);
        }}
        onSkip={(update) => {
          setShowDetailSheet(false);
          handleSkipUpdate(update);
        }}
        isInstalling={isInstalling === selectedUpdate?.id}
      />
    </div>
  );
}
