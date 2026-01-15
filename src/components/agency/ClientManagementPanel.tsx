import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/mui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Building2, MapPin, Phone, Mail, User, Plus, Edit2, 
  FileText, DollarSign, Calendar, TrendingUp, Star,
  Clock, CheckCircle2, AlertTriangle, Search
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ClientFacility {
  id: string;
  name: string;
  type: 'hospital' | 'aged_care' | 'hotel' | 'restaurant' | 'childcare' | 'warehouse' | 'other';
  address: {
    street: string;
    suburb: string;
    state: string;
    postcode: string;
  };
  primaryContact: {
    name: string;
    role: string;
    phone: string;
    email: string;
  };
  billingContact?: {
    name: string;
    email: string;
    phone: string;
  };
  status: 'active' | 'inactive' | 'pending';
  contractStartDate: string;
  contractEndDate?: string;
  paymentTerms: number;
  creditLimit: number;
  currentBalance: number;
  rateAgreements: RateAgreement[];
  notes?: string;
  rating?: number;
  totalShifts: number;
  totalRevenue: number;
  avgFillRate: number;
}

interface RateAgreement {
  id: string;
  roleType: string;
  payRate: number;
  chargeRate: number;
  overtimeMultiplier: number;
  weekendMultiplier: number;
  publicHolidayMultiplier: number;
  effectiveFrom: string;
  effectiveTo?: string;
  notes?: string;
}

// Mock client data
const MOCK_CLIENTS: ClientFacility[] = [
  {
    id: 'client-1',
    name: 'Royal North Shore Hospital',
    type: 'hospital',
    address: { street: '1 Reserve Rd', suburb: 'St Leonards', state: 'NSW', postcode: '2065' },
    primaryContact: { name: 'Sarah Mitchell', role: 'Nurse Unit Manager', phone: '02 9463 2000', email: 'sarah.mitchell@rnsh.health.nsw.gov.au' },
    billingContact: { name: 'Accounts Payable', email: 'ap@rnsh.health.nsw.gov.au', phone: '02 9463 2100' },
    status: 'active',
    contractStartDate: '2023-01-01',
    contractEndDate: '2025-12-31',
    paymentTerms: 30,
    creditLimit: 100000,
    currentBalance: 45000,
    rateAgreements: [
      { id: 'ra-1', roleType: 'Registered Nurse', payRate: 45, chargeRate: 65, overtimeMultiplier: 1.5, weekendMultiplier: 1.5, publicHolidayMultiplier: 2.5, effectiveFrom: '2024-01-01' },
      { id: 'ra-2', roleType: 'Enrolled Nurse', payRate: 38, chargeRate: 55, overtimeMultiplier: 1.5, weekendMultiplier: 1.5, publicHolidayMultiplier: 2.5, effectiveFrom: '2024-01-01' },
      { id: 'ra-3', roleType: 'Personal Care Assistant', payRate: 32, chargeRate: 48, overtimeMultiplier: 1.5, weekendMultiplier: 1.25, publicHolidayMultiplier: 2.5, effectiveFrom: '2024-01-01' },
    ],
    rating: 4.5,
    totalShifts: 1250,
    totalRevenue: 425000,
    avgFillRate: 94
  },
  {
    id: 'client-2',
    name: 'The Langham Sydney',
    type: 'hotel',
    address: { street: '89-113 Kent St', suburb: 'Sydney', state: 'NSW', postcode: '2000' },
    primaryContact: { name: 'James Chen', role: 'F&B Director', phone: '02 9256 2222', email: 'james.chen@langhamhotels.com' },
    status: 'active',
    contractStartDate: '2023-06-01',
    paymentTerms: 14,
    creditLimit: 50000,
    currentBalance: 12000,
    rateAgreements: [
      { id: 'ra-4', roleType: 'Chef', payRate: 42, chargeRate: 60, overtimeMultiplier: 1.5, weekendMultiplier: 1.25, publicHolidayMultiplier: 2.5, effectiveFrom: '2024-01-01' },
      { id: 'ra-5', roleType: 'Wait Staff', payRate: 32, chargeRate: 48, overtimeMultiplier: 1.5, weekendMultiplier: 1.25, publicHolidayMultiplier: 2.5, effectiveFrom: '2024-01-01' },
    ],
    rating: 4.8,
    totalShifts: 580,
    totalRevenue: 165000,
    avgFillRate: 98
  },
  {
    id: 'client-3',
    name: 'Little Scholars Early Learning',
    type: 'childcare',
    address: { street: '45 Campbell Parade', suburb: 'Bondi Beach', state: 'NSW', postcode: '2026' },
    primaryContact: { name: 'Emma Wilson', role: 'Centre Director', phone: '02 9130 5555', email: 'emma@littlescholars.com.au' },
    status: 'active',
    contractStartDate: '2023-03-01',
    paymentTerms: 14,
    creditLimit: 25000,
    currentBalance: 8500,
    rateAgreements: [
      { id: 'ra-6', roleType: 'Early Childhood Teacher', payRate: 40, chargeRate: 58, overtimeMultiplier: 1.5, weekendMultiplier: 1.5, publicHolidayMultiplier: 2.5, effectiveFrom: '2024-01-01' },
      { id: 'ra-7', roleType: 'Diploma Educator', payRate: 34, chargeRate: 50, overtimeMultiplier: 1.5, weekendMultiplier: 1.5, publicHolidayMultiplier: 2.5, effectiveFrom: '2024-01-01' },
    ],
    rating: 4.2,
    totalShifts: 320,
    totalRevenue: 95000,
    avgFillRate: 88
  },
  {
    id: 'client-4',
    name: 'Aged Care Plus - Bondi',
    type: 'aged_care',
    address: { street: '120 Curlewis St', suburb: 'Bondi', state: 'NSW', postcode: '2026' },
    primaryContact: { name: 'Margaret Thompson', role: 'Facility Manager', phone: '02 9387 1000', email: 'm.thompson@agedcareplus.com.au' },
    status: 'pending',
    contractStartDate: '2024-02-01',
    paymentTerms: 30,
    creditLimit: 40000,
    currentBalance: 0,
    rateAgreements: [],
    notes: 'New client - awaiting contract finalization',
    totalShifts: 0,
    totalRevenue: 0,
    avgFillRate: 0
  }
];

const FACILITY_TYPES = [
  { value: 'hospital', label: 'Hospital' },
  { value: 'aged_care', label: 'Aged Care' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'childcare', label: 'Childcare' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'other', label: 'Other' },
];

const ClientManagementPanel = () => {
  const [clients, setClients] = useState<ClientFacility[]>(MOCK_CLIENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<ClientFacility | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // New client form state
  const [newClient, setNewClient] = useState<Partial<ClientFacility>>({
    name: '',
    type: 'other',
    address: { street: '', suburb: '', state: 'NSW', postcode: '' },
    primaryContact: { name: '', role: '', phone: '', email: '' },
    status: 'pending',
    paymentTerms: 30,
    creditLimit: 10000,
    currentBalance: 0,
    rateAgreements: [],
    totalShifts: 0,
    totalRevenue: 0,
    avgFillRate: 0
  });

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.address.suburb.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    const matchesType = filterType === 'all' || client.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: ClientFacility['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-orange-500 text-orange-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getTypeLabel = (type: ClientFacility['type']) => {
    return FACILITY_TYPES.find(t => t.value === type)?.label || type;
  };

  const handleAddClient = () => {
    const client: ClientFacility = {
      id: `client-${Date.now()}`,
      ...newClient as ClientFacility,
      contractStartDate: format(new Date(), 'yyyy-MM-dd')
    };
    setClients([...clients, client]);
    setShowAddClient(false);
    setNewClient({
      name: '',
      type: 'other',
      address: { street: '', suburb: '', state: 'NSW', postcode: '' },
      primaryContact: { name: '', role: '', phone: '', email: '' },
      status: 'pending',
      paymentTerms: 30,
      creditLimit: 10000,
      currentBalance: 0,
      rateAgreements: [],
      totalShifts: 0,
      totalRevenue: 0,
      avgFillRate: 0
    });
    toast.success('Client added successfully');
  };

  const addRateAgreement = (clientId: string) => {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c;
      return {
        ...c,
        rateAgreements: [
          ...c.rateAgreements,
          {
            id: `ra-${Date.now()}`,
            roleType: '',
            payRate: 0,
            chargeRate: 0,
            overtimeMultiplier: 1.5,
            weekendMultiplier: 1.25,
            publicHolidayMultiplier: 2.5,
            effectiveFrom: format(new Date(), 'yyyy-MM-dd')
          }
        ]
      };
    }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Client Management</h2>
          <p className="text-sm text-muted-foreground">{clients.length} clients • ${clients.reduce((sum, c) => sum + c.totalRevenue, 0).toLocaleString()} total revenue</p>
        </div>
        <Button onClick={() => setShowAddClient(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search clients..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {FACILITY_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Client List */}
      <div className="grid gap-4">
        {filteredClients.map(client => (
          <Card 
            key={client.id} 
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => { setSelectedClient(client); setShowClientModal(true); }}
          >
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{client.name}</h3>
                      {getStatusBadge(client.status)}
                      <Badge variant="outline">{getTypeLabel(client.type)}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {client.address.suburb}, {client.address.state}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {client.primaryContact.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {client.primaryContact.phone}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="font-medium">${client.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Shifts</p>
                      <p className="font-medium">{client.totalShifts}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fill Rate</p>
                      <p className="font-medium">{client.avgFillRate}%</p>
                    </div>
                    {client.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{client.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredClients.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No clients found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Client Detail Modal */}
      <Dialog open={showClientModal} onOpenChange={setShowClientModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedClient?.name}
              {selectedClient && getStatusBadge(selectedClient.status)}
            </DialogTitle>
          </DialogHeader>

          {selectedClient && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
                <TabsTrigger value="rates">Rate Agreements</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                <TabsContent value="details" className="space-y-4 p-1">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Facility Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <span className="ml-2 font-medium">{getTypeLabel(selectedClient.type)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Address:</span>
                          <p className="font-medium">{selectedClient.address.street}</p>
                          <p className="font-medium">{selectedClient.address.suburb}, {selectedClient.address.state} {selectedClient.address.postcode}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Contract Period:</span>
                          <p className="font-medium">
                            {format(new Date(selectedClient.contractStartDate), 'MMM d, yyyy')}
                            {selectedClient.contractEndDate && ` - ${format(new Date(selectedClient.contractEndDate), 'MMM d, yyyy')}`}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Performance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Shifts:</span>
                          <span className="font-medium">{selectedClient.totalShifts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Revenue:</span>
                          <span className="font-medium">${selectedClient.totalRevenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Fill Rate:</span>
                          <span className="font-medium">{selectedClient.avgFillRate}%</span>
                        </div>
                        {selectedClient.rating && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Rating:</span>
                            <span className="font-medium flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              {selectedClient.rating}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  {selectedClient.notes && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{selectedClient.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="contacts" className="space-y-4 p-1">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Primary Contact</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{selectedClient.primaryContact.name}</span>
                        <Badge variant="outline">{selectedClient.primaryContact.role}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedClient.primaryContact.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedClient.primaryContact.email}</span>
                      </div>
                    </CardContent>
                  </Card>
                  {selectedClient.billingContact && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Billing Contact</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{selectedClient.billingContact.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedClient.billingContact.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedClient.billingContact.email}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="rates" className="space-y-4 p-1">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">{selectedClient.rateAgreements.length} rate agreements</p>
                    <Button size="small" onClick={() => addRateAgreement(selectedClient.id)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Rate
                    </Button>
                  </div>
                  
                  {selectedClient.rateAgreements.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right">Pay Rate</TableHead>
                          <TableHead className="text-right">Charge Rate</TableHead>
                          <TableHead className="text-right">Margin</TableHead>
                          <TableHead className="text-right">OT</TableHead>
                          <TableHead className="text-right">Weekend</TableHead>
                          <TableHead className="text-right">PH</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedClient.rateAgreements.map(rate => (
                          <TableRow key={rate.id}>
                            <TableCell className="font-medium">{rate.roleType}</TableCell>
                            <TableCell className="text-right">${rate.payRate}/hr</TableCell>
                            <TableCell className="text-right">${rate.chargeRate}/hr</TableCell>
                            <TableCell className="text-right text-green-600">
                              ${(rate.chargeRate - rate.payRate).toFixed(2)} ({((rate.chargeRate - rate.payRate) / rate.chargeRate * 100).toFixed(0)}%)
                            </TableCell>
                            <TableCell className="text-right">{rate.overtimeMultiplier}x</TableCell>
                            <TableCell className="text-right">{rate.weekendMultiplier}x</TableCell>
                            <TableCell className="text-right">{rate.publicHolidayMultiplier}x</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No rate agreements defined</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="billing" className="space-y-4 p-1">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Payment Terms</p>
                        <p className="text-2xl font-bold">{selectedClient.paymentTerms} days</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Credit Limit</p>
                        <p className="text-2xl font-bold">${selectedClient.creditLimit.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Current Balance</p>
                        <p className={cn(
                          "text-2xl font-bold",
                          selectedClient.currentBalance > selectedClient.creditLimit * 0.8 && "text-orange-600",
                          selectedClient.currentBalance > selectedClient.creditLimit && "text-destructive"
                        )}>
                          ${selectedClient.currentBalance.toLocaleString()}
                        </p>
                        {selectedClient.currentBalance > selectedClient.creditLimit * 0.8 && (
                          <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3" />
                            Approaching credit limit
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Client Modal */}
      <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Facility Name *</Label>
              <Input 
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                placeholder="Enter facility name"
              />
            </div>

            <div className="space-y-2">
              <Label>Facility Type *</Label>
              <Select 
                value={newClient.type}
                onValueChange={(value) => setNewClient({ ...newClient, type: value as ClientFacility['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FACILITY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Street Address *</Label>
                <Input 
                  value={newClient.address?.street}
                  onChange={(e) => setNewClient({ ...newClient, address: { ...newClient.address!, street: e.target.value } })}
                  placeholder="Street address"
                />
              </div>
              <div className="space-y-2">
                <Label>Suburb *</Label>
                <Input 
                  value={newClient.address?.suburb}
                  onChange={(e) => setNewClient({ ...newClient, address: { ...newClient.address!, suburb: e.target.value } })}
                  placeholder="Suburb"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>State</Label>
                <Select 
                  value={newClient.address?.state}
                  onValueChange={(value) => setNewClient({ ...newClient, address: { ...newClient.address!, state: value } })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NSW">NSW</SelectItem>
                    <SelectItem value="VIC">VIC</SelectItem>
                    <SelectItem value="QLD">QLD</SelectItem>
                    <SelectItem value="WA">WA</SelectItem>
                    <SelectItem value="SA">SA</SelectItem>
                    <SelectItem value="TAS">TAS</SelectItem>
                    <SelectItem value="ACT">ACT</SelectItem>
                    <SelectItem value="NT">NT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Postcode *</Label>
                <Input 
                  value={newClient.address?.postcode}
                  onChange={(e) => setNewClient({ ...newClient, address: { ...newClient.address!, postcode: e.target.value } })}
                  placeholder="Postcode"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Primary Contact</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input 
                    value={newClient.primaryContact?.name}
                    onChange={(e) => setNewClient({ ...newClient, primaryContact: { ...newClient.primaryContact!, name: e.target.value } })}
                    placeholder="Contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input 
                    value={newClient.primaryContact?.role}
                    onChange={(e) => setNewClient({ ...newClient, primaryContact: { ...newClient.primaryContact!, role: e.target.value } })}
                    placeholder="Job title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input 
                    value={newClient.primaryContact?.phone}
                    onChange={(e) => setNewClient({ ...newClient, primaryContact: { ...newClient.primaryContact!, phone: e.target.value } })}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input 
                    type="email"
                    value={newClient.primaryContact?.email}
                    onChange={(e) => setNewClient({ ...newClient, primaryContact: { ...newClient.primaryContact!, email: e.target.value } })}
                    placeholder="Email address"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outlined" onClick={() => setShowAddClient(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddClient}
                disabled={!newClient.name || !newClient.primaryContact?.name || !newClient.primaryContact?.email}
              >
                Add Client
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientManagementPanel;
