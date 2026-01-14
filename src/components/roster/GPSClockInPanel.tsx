import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  MapPin,
  Navigation,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Smartphone,
  RefreshCw,
  Shield,
  Locate,
  Edit,
  Trash2,
  Map,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  GeofenceZone,
  ClockEvent,
} from '@/types/advancedRoster';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';

// Mock data
const mockGeofences: GeofenceZone[] = [
  {
    id: 'geo-1',
    name: 'Sydney CBD Centre',
    centreId: 'centre-1',
    centreName: 'Sydney CBD Centre',
    latitude: -33.8688,
    longitude: 151.2093,
    radiusMeters: 100,
    isActive: true,
    allowedBuffer: 50,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'geo-2',
    name: 'Melbourne Central',
    centreId: 'centre-2',
    centreName: 'Melbourne Central',
    latitude: -37.8136,
    longitude: 144.9631,
    radiusMeters: 75,
    isActive: true,
    allowedBuffer: 25,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'geo-3',
    name: 'Brisbane North',
    centreId: 'centre-3',
    centreName: 'Brisbane North',
    latitude: -27.4698,
    longitude: 153.0251,
    radiusMeters: 100,
    isActive: false,
    allowedBuffer: 50,
    createdAt: '2025-01-01T00:00:00Z',
  },
];

const mockClockEvents: ClockEvent[] = [
  {
    id: 'clock-1',
    staffId: 'staff-1',
    staffName: 'Sarah Johnson',
    shiftId: 'shift-1',
    eventType: 'clock_in',
    scheduledTime: '2025-01-14T07:00:00Z',
    actualTime: '2025-01-14T06:55:00Z',
    latitude: -33.8690,
    longitude: 151.2095,
    accuracy: 10,
    geofenceId: 'geo-1',
    withinGeofence: true,
    distanceFromCentre: 25,
    validationStatus: 'valid',
    deviceInfo: 'iPhone 14 Pro',
  },
  {
    id: 'clock-2',
    staffId: 'staff-2',
    staffName: 'Michael Chen',
    shiftId: 'shift-2',
    eventType: 'clock_in',
    scheduledTime: '2025-01-14T08:00:00Z',
    actualTime: '2025-01-14T08:12:00Z',
    latitude: -33.8700,
    longitude: 151.2110,
    accuracy: 15,
    geofenceId: 'geo-1',
    withinGeofence: true,
    distanceFromCentre: 85,
    validationStatus: 'warning',
    validationNotes: 'Late clock-in by 12 minutes',
    deviceInfo: 'Samsung Galaxy S23',
  },
  {
    id: 'clock-3',
    staffId: 'staff-3',
    staffName: 'Emma Williams',
    shiftId: 'shift-3',
    eventType: 'clock_in',
    scheduledTime: '2025-01-14T09:00:00Z',
    actualTime: '2025-01-14T08:58:00Z',
    latitude: -33.8750,
    longitude: 151.2200,
    accuracy: 20,
    geofenceId: 'geo-1',
    withinGeofence: false,
    distanceFromCentre: 350,
    validationStatus: 'invalid',
    validationNotes: 'Outside geofence - 350m from centre',
    deviceInfo: 'iPhone 13',
  },
  {
    id: 'clock-4',
    staffId: 'staff-1',
    staffName: 'Sarah Johnson',
    shiftId: 'shift-1',
    eventType: 'clock_out',
    scheduledTime: '2025-01-14T15:00:00Z',
    actualTime: '2025-01-14T15:05:00Z',
    latitude: -33.8688,
    longitude: 151.2093,
    accuracy: 8,
    geofenceId: 'geo-1',
    withinGeofence: true,
    distanceFromCentre: 5,
    validationStatus: 'valid',
    deviceInfo: 'iPhone 14 Pro',
  },
];

export function GPSClockInPanel() {
  const [geofences, setGeofences] = useState(mockGeofences);
  const [clockEvents] = useState(mockClockEvents);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [selectedGeofence, setSelectedGeofence] = useState<GeofenceZone | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form state
  const [newGeofence, setNewGeofence] = useState<Partial<GeofenceZone>>({
    name: '',
    latitude: 0,
    longitude: 0,
    radiusMeters: 100,
    allowedBuffer: 50,
    isActive: true,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    toast.success('Clock events refreshed');
  };

  const handleToggleGeofence = (geofenceId: string) => {
    setGeofences(prev =>
      prev.map(g => (g.id === geofenceId ? { ...g, isActive: !g.isActive } : g))
    );
    toast.success('Geofence status updated');
  };

  const handleCreateGeofence = () => {
    const geofence: GeofenceZone = {
      id: `geo-${Date.now()}`,
      name: newGeofence.name || 'New Geofence',
      centreId: `centre-${Date.now()}`,
      centreName: newGeofence.name || 'New Centre',
      latitude: newGeofence.latitude || 0,
      longitude: newGeofence.longitude || 0,
      radiusMeters: newGeofence.radiusMeters || 100,
      isActive: true,
      allowedBuffer: newGeofence.allowedBuffer || 50,
      createdAt: new Date().toISOString(),
    };

    setGeofences(prev => [...prev, geofence]);
    setShowCreatePanel(false);
    setNewGeofence({
      name: '',
      latitude: 0,
      longitude: 0,
      radiusMeters: 100,
      allowedBuffer: 50,
      isActive: true,
    });
    toast.success('Geofence created successfully');
  };

  const handleOverride = (eventId: string) => {
    toast.success('Clock event overridden', {
      description: 'Manual override applied',
    });
  };

  const getStatusIcon = (status: ClockEvent['validationStatus']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'invalid':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'manual_override':
        return <Shield className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: ClockEvent['validationStatus']) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-emerald-500/10 text-emerald-700">Valid</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500/10 text-amber-700">Warning</Badge>;
      case 'invalid':
        return <Badge className="bg-red-500/10 text-red-700">Invalid</Badge>;
      case 'manual_override':
        return <Badge className="bg-blue-500/10 text-blue-700">Override</Badge>;
    }
  };

  const validCount = clockEvents.filter(e => e.validationStatus === 'valid').length;
  const warningCount = clockEvents.filter(e => e.validationStatus === 'warning').length;
  const invalidCount = clockEvents.filter(e => e.validationStatus === 'invalid').length;

  const createGeofenceActions: OffCanvasAction[] = [
    { label: 'Cancel', onClick: () => setShowCreatePanel(false), variant: 'outlined' },
    { label: 'Create Geofence', onClick: handleCreateGeofence, variant: 'primary' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="card-material-elevated border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">GPS Clock-in/Clock-out</CardTitle>
                <CardDescription>
                  Geofenced attendance validation for accurate timekeeping
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                {isRefreshing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button onClick={() => setShowCreatePanel(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Geofence
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{validCount}</p>
                <p className="text-sm text-muted-foreground">Valid Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{warningCount}</p>
                <p className="text-sm text-muted-foreground">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{invalidCount}</p>
                <p className="text-sm text-muted-foreground">Invalid</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Map className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{geofences.filter(g => g.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Active Zones</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geofence Zones */}
      <Card className="card-material">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Locate className="h-5 w-5" />
            Geofence Zones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Centre Name</TableHead>
                <TableHead>Coordinates</TableHead>
                <TableHead>Radius</TableHead>
                <TableHead>Buffer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {geofences.map(geofence => (
                <TableRow key={geofence.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">{geofence.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {geofence.latitude.toFixed(4)}, {geofence.longitude.toFixed(4)}
                  </TableCell>
                  <TableCell>{geofence.radiusMeters}m</TableCell>
                  <TableCell>+{geofence.allowedBuffer}m</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={geofence.isActive}
                        onCheckedChange={() => handleToggleGeofence(geofence.id)}
                      />
                      <span className={geofence.isActive ? 'text-emerald-600' : 'text-muted-foreground'}>
                        {geofence.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedGeofence(geofence)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Clock Events */}
      <Card className="card-material">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Clock Events
          </CardTitle>
          <CardDescription>Today's clock-in and clock-out events with GPS validation</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Device</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clockEvents.map(event => (
                <TableRow key={event.id}>
                  <TableCell>
                    <p className="font-medium">{event.staffName}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {event.eventType.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(event.scheduledTime), 'HH:mm')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(event.actualTime), 'HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Navigation className="h-3 w-3 text-muted-foreground" />
                      <span className={event.withinGeofence ? 'text-emerald-600' : 'text-red-600'}>
                        {event.distanceFromCentre}m
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(event.validationStatus)}
                      {getStatusBadge(event.validationStatus)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Smartphone className="h-3 w-3" />
                      {event.deviceInfo}
                    </div>
                  </TableCell>
                  <TableCell>
                    {event.validationStatus !== 'valid' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOverride(event.id)}
                      >
                        Override
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Geofence OffCanvas */}
      <PrimaryOffCanvas
        open={showCreatePanel}
        onClose={() => setShowCreatePanel(false)}
        title="Add Geofence Zone"
        description="Define a GPS boundary for clock-in validation"
        icon={MapPin}
        size="md"
        actions={createGeofenceActions}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Centre Name *</Label>
            <Input
              placeholder="e.g., Sydney CBD Centre"
              value={newGeofence.name}
              onChange={e => setNewGeofence(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Latitude *</Label>
              <Input
                type="number"
                step="0.0001"
                placeholder="-33.8688"
                value={newGeofence.latitude}
                onChange={e =>
                  setNewGeofence(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Longitude *</Label>
              <Input
                type="number"
                step="0.0001"
                placeholder="151.2093"
                value={newGeofence.longitude}
                onChange={e =>
                  setNewGeofence(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))
                }
              />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground mb-2">
              Tip: You can get coordinates from Google Maps by right-clicking on a location
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Radius (meters) *</Label>
              <Input
                type="number"
                value={newGeofence.radiusMeters}
                onChange={e =>
                  setNewGeofence(prev => ({ ...prev, radiusMeters: parseInt(e.target.value) }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Staff must be within this distance
              </p>
            </div>
            <div className="space-y-2">
              <Label>Buffer (meters)</Label>
              <Input
                type="number"
                value={newGeofence.allowedBuffer}
                onChange={e =>
                  setNewGeofence(prev => ({ ...prev, allowedBuffer: parseInt(e.target.value) }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Extra allowance for GPS accuracy
              </p>
            </div>
          </div>
        </div>
      </PrimaryOffCanvas>
    </div>
  );
}
