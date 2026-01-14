import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Download,
  ExternalLink,
  Bell,
  BellOff,
  FileText,
  TrendingUp,
  Info,
  Search,
  Shield,
  Zap,
  Link2,
  History,
  ArrowRight,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface AwardRateUpdate {
  id: string;
  awardCode: string;
  awardName: string;
  updateType: 'annual_wage_review' | 'variation' | 'correction';
  effectiveDate: string;
  announcedDate: string;
  changePercentage: number;
  status: 'pending' | 'applied' | 'scheduled';
  details: string;
  fwcReference: string;
}

interface FWCNotification {
  id: string;
  type: 'rate_change' | 'variation' | 'decision' | 'reminder';
  title: string;
  message: string;
  date: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  awardCode?: string;
}

// Mock FWC rate updates
const mockRateUpdates: AwardRateUpdate[] = [
  {
    id: 'update-1',
    awardCode: 'MA000120',
    awardName: "Children's Services Award 2020",
    updateType: 'annual_wage_review',
    effectiveDate: '2024-07-01',
    announcedDate: '2024-06-03',
    changePercentage: 3.75,
    status: 'applied',
    details: 'Annual Wage Review 2023-24 decision. Minimum wage increase of 3.75% applied to all classifications.',
    fwcReference: 'PR758496',
  },
  {
    id: 'update-2',
    awardCode: 'MA000018',
    awardName: 'Aged Care Award 2020',
    updateType: 'variation',
    effectiveDate: '2024-12-01',
    announcedDate: '2024-10-15',
    changePercentage: 5.0,
    status: 'pending',
    details: 'Stage 2 of Work Value case increase for direct care workers.',
    fwcReference: 'PR760912',
  },
  {
    id: 'update-3',
    awardCode: 'MA000120',
    awardName: "Children's Services Award 2020",
    updateType: 'annual_wage_review',
    effectiveDate: '2025-07-01',
    announcedDate: '2025-06-02',
    changePercentage: 3.5,
    status: 'scheduled',
    details: 'Annual Wage Review 2024-25 decision. Provisional increase of 3.5%.',
    fwcReference: 'PR770123',
  },
];

// Mock FWC notifications
const mockNotifications: FWCNotification[] = [
  {
    id: 'notif-1',
    type: 'rate_change',
    title: 'Annual Wage Review 2024-25',
    message: "The Fair Work Commission has announced a 3.5% increase to minimum wages effective 1 July 2025. Update your pay rates accordingly.",
    date: '2025-06-02',
    read: false,
    priority: 'high',
    awardCode: 'MA000120',
  },
  {
    id: 'notif-2',
    type: 'variation',
    title: 'Aged Care Work Value Case - Stage 2',
    message: 'Stage 2 wage increases for direct care workers come into effect 1 December 2024.',
    date: '2024-10-15',
    read: true,
    priority: 'high',
    awardCode: 'MA000018',
  },
  {
    id: 'notif-3',
    type: 'reminder',
    title: 'EBA Expiry Reminder',
    message: 'Your ABC Childcare Enterprise Agreement expires in 180 days. Consider beginning renegotiation.',
    date: '2025-01-01',
    read: false,
    priority: 'medium',
  },
  {
    id: 'notif-4',
    type: 'decision',
    title: 'Casual Conversion Changes',
    message: 'Updated casual conversion requirements now in effect across all Modern Awards.',
    date: '2024-08-26',
    read: true,
    priority: 'low',
  },
];

export function FWCIntegrationPanel() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date(2025, 0, 13, 14, 30));
  const [autoSync, setAutoSync] = useState(true);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLastSync(new Date());
    setIsRefreshing(false);
    toast.success('FWC data synchronized', {
      description: 'Latest award rates and decisions fetched successfully',
    });
  };

  const handleApplyUpdate = (updateId: string) => {
    toast.success('Rate update applied', {
      description: 'New rates have been applied to the system',
    });
  };

  const handleMarkAsRead = (notifId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notifId ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const getUpdateStatusBadge = (status: AwardRateUpdate['status']) => {
    switch (status) {
      case 'applied':
        return <Badge className="bg-emerald-500/10 text-emerald-700">Applied</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-700">Pending</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500/10 text-blue-700">Scheduled</Badge>;
    }
  };

  const getNotificationIcon = (type: FWCNotification['type']) => {
    switch (type) {
      case 'rate_change':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'variation':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'decision':
        return <Shield className="h-4 w-4 text-purple-500" />;
      case 'reminder':
        return <Bell className="h-4 w-4 text-amber-500" />;
    }
  };

  const getPriorityBadge = (priority: FWCNotification['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500/10 text-red-700">High</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500/10 text-amber-700">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="card-material-elevated border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Fair Work Commission Integration</CardTitle>
                <CardDescription>
                  Sync live award rate updates and decisions from FWC
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-sm">
                <p className="text-muted-foreground">Last synced</p>
                <p className="font-medium">{format(lastSync, 'dd MMM yyyy, HH:mm')}</p>
              </div>
              <Button onClick={handleRefresh} disabled={isRefreshing}>
                {isRefreshing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium">Auto-Sync</p>
                <p className="text-sm text-muted-foreground">
                  Automatically fetch updates daily from FWC
                </p>
              </div>
            </div>
            <Switch checked={autoSync} onCheckedChange={setAutoSync} />
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Link2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Connection</p>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium text-emerald-600">Connected</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Awards Tracked</p>
                <p className="text-xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Updates</p>
                <p className="text-xl font-bold">{mockRateUpdates.filter(u => u.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unread Alerts</p>
                <p className="text-xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Updates */}
      <Card className="card-material">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Award Rate Updates</CardTitle>
              <CardDescription>
                Recent and upcoming changes to Modern Award pay rates
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 mr-2" />
              View History
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Award</TableHead>
                <TableHead>Update Type</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>FWC Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRateUpdates.map(update => (
                <TableRow key={update.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{update.awardCode}</p>
                      <p className="text-xs text-muted-foreground">{update.awardName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {update.updateType.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium text-emerald-600">+{update.changePercentage}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{format(new Date(update.effectiveDate), 'dd MMM yyyy')}</p>
                      {update.status === 'pending' && (
                        <p className="text-xs text-amber-600">
                          In {differenceInDays(new Date(update.effectiveDate), new Date())} days
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <a 
                      href={`https://www.fwc.gov.au/document/${update.fwcReference}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      {update.fwcReference}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell>
                    {getUpdateStatusBadge(update.status)}
                  </TableCell>
                  <TableCell>
                    {update.status === 'pending' && (
                      <Button size="sm" onClick={() => handleApplyUpdate(update.id)}>
                        Apply Now
                      </Button>
                    )}
                    {update.status === 'scheduled' && (
                      <Button size="sm" variant="outline">
                        Schedule
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="card-material">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                FWC decisions, reminders, and important updates
              </CardDescription>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                Mark All Read
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {notifications.map(notif => (
                <div 
                  key={notif.id}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    notif.read ? 'bg-muted/30' : 'bg-primary/5 border-primary/20'
                  }`}
                  onClick={() => handleMarkAsRead(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notif.title}
                        </p>
                        {getPriorityBadge(notif.priority)}
                        {notif.awardCode && (
                          <Badge variant="outline" className="text-xs">{notif.awardCode}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(notif.date), 'dd MMM yyyy')}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="card-material">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium">About FWC Integration</h4>
              <p className="text-sm text-muted-foreground mt-1">
                This integration connects to the Fair Work Commission's public data sources to fetch 
                the latest Modern Award pay rates, decisions, and variations. Rate changes are typically 
                announced in June each year, with the Annual Wage Review taking effect on 1 July.
              </p>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://www.fwc.gov.au/awards-and-agreements/awards" target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 mr-2" />
                    FWC Website
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://www.fwc.gov.au/document/annual-wage-review" target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-2" />
                    Annual Wage Review
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
