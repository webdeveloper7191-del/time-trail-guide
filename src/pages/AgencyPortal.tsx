import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/mui/Button';
import { 
  Building2, Users, Calendar, FileText, BarChart3, 
  Shield, AlertTriangle, TrendingUp, Clock, CheckCircle2,
  ArrowLeft, Plus, UserPlus, Zap, Receipt, ClipboardCheck, Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockAgency, mockCandidates, mockShiftRequests, mockInvoices, mockAgencyAnalytics } from '@/data/mockAgencyData';
import { format } from 'date-fns';
import AgencyOnboardingWizard from '@/components/agency/AgencyOnboardingWizard';
import ShiftMatchingPanel from '@/components/agency/ShiftMatchingPanel';
import CandidateOnboardingForm from '@/components/agency/CandidateOnboardingForm';
import InvoiceGenerator from '@/components/agency/InvoiceGenerator';
import CandidateAvailabilityCalendar from '@/components/agency/CandidateAvailabilityCalendar';
import TimesheetApprovalWorkflow from '@/components/agency/TimesheetApprovalWorkflow';
import ClientManagementPanel from '@/components/agency/ClientManagementPanel';

const AgencyPortal = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);
  const [selectedShiftForMatching, setSelectedShiftForMatching] = useState<string | null>(null);
  const [showAvailabilityCalendar, setShowAvailabilityCalendar] = useState(false);
  const [selectedCandidateForAvailability, setSelectedCandidateForAvailability] = useState<{ id: string; name: string } | null>(null);

  const openShifts = mockShiftRequests.filter(s => s.status === 'open' || s.status === 'partially_filled');
  const urgentShifts = mockShiftRequests.filter(s => s.urgency === 'critical' || s.urgency === 'urgent');
  const overdueInvoices = mockInvoices.filter(i => i.status === 'overdue');

  const selectedShift = selectedShiftForMatching 
    ? mockShiftRequests.find(s => s.id === selectedShiftForMatching) 
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="small" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold">{mockAgency.tradingName || mockAgency.name}</h1>
                <p className="text-sm text-muted-foreground">Agency Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outlined" size="small" onClick={() => setShowOnboardingWizard(true)}>
                <Building2 className="h-4 w-4 mr-2" />
                Agency Setup
              </Button>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
              <Badge variant="secondary">
                <Shield className="h-3 w-3 mr-1" />
                {mockAgency.complianceScore}% Compliant
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="candidates" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Candidates</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Clients</span>
            </TabsTrigger>
            <TabsTrigger value="shifts" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Shifts</span>
            </TabsTrigger>
            <TabsTrigger value="timesheets" className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Timesheets</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Invoices</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Fill Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockAgencyAnalytics.fillRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {mockAgencyAnalytics.totalShiftsFilled} of {mockAgencyAnalytics.totalShiftsRequested} shifts
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Avg Time to Fill</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockAgencyAnalytics.avgTimeToFillMinutes} min</div>
                  <p className="text-xs text-muted-foreground">Response time</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Gross Margin</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${mockAgencyAnalytics.grossProfit.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{mockAgencyAnalytics.marginPercentage}% margin</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Candidates</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockAgencyAnalytics.totalActiveCandidates}</div>
                  <p className="text-xs text-muted-foreground">{mockAgencyAnalytics.avgWorkerUtilization}% utilization</p>
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            {(urgentShifts.length > 0 || overdueInvoices.length > 0) && (
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <AlertTriangle className="h-4 w-4" />
                    Attention Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {urgentShifts.length > 0 && (
                    <p className="text-sm">{urgentShifts.length} urgent shift(s) need immediate attention</p>
                  )}
                  {overdueInvoices.length > 0 && (
                    <p className="text-sm">{overdueInvoices.length} invoice(s) are overdue</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Open Shifts</CardTitle>
                  <CardDescription>{openShifts.length} shifts need candidates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {openShifts.slice(0, 3).map(shift => (
                    <div key={shift.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{shift.clientName}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(shift.date), 'MMM d')} • {shift.startTime}</p>
                      </div>
                      <Badge variant={shift.urgency === 'critical' ? 'destructive' : shift.urgency === 'urgent' ? 'default' : 'secondary'}>
                        {shift.filledPositions}/{shift.totalPositions}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Performers</CardTitle>
                  <CardDescription>This month's best workers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {mockAgencyAnalytics.topPerformers.map((performer, idx) => (
                    <div key={performer.candidateId} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-muted-foreground">#{idx + 1}</span>
                        <p className="text-sm font-medium">{performer.name}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">{performer.shiftsCompleted} shifts</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Candidates Tab */}
          <TabsContent value="candidates">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Candidate Pool</CardTitle>
                  <CardDescription>{mockCandidates.length} registered candidates</CardDescription>
                </div>
                <Button onClick={() => setShowCandidateForm(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Candidate
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockCandidates.map(candidate => (
                    <div key={candidate.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">{candidate.firstName[0]}{candidate.lastName[0]}</span>
                        </div>
                        <div>
                          <p className="font-medium">{candidate.firstName} {candidate.lastName}</p>
                          <p className="text-sm text-muted-foreground">{candidate.primaryRole}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={candidate.status === 'available' ? 'default' : 'secondary'}>
                          {candidate.status}
                        </Badge>
                        <span className="text-sm">⭐ {candidate.averageRating}</span>
                        <Button 
                          variant="ghost" 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCandidateForAvailability({ id: candidate.id, name: `${candidate.firstName} ${candidate.lastName}` });
                            setShowAvailabilityCalendar(true);
                          }}
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients">
            <ClientManagementPanel />
          </TabsContent>

          {/* Shifts Tab */}
          <TabsContent value="shifts" className="space-y-6">
            {selectedShift ? (
              <div className="space-y-4">
                <Button variant="ghost" onClick={() => setSelectedShiftForMatching(null)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Shifts
                </Button>
                <ShiftMatchingPanel 
                  shiftRequest={selectedShift} 
                  onAssign={(placements) => {
                    console.log('Assigned placements:', placements);
                    setSelectedShiftForMatching(null);
                  }}
                  onClose={() => setSelectedShiftForMatching(null)} 
                />
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Shift Requests</CardTitle>
                  <CardDescription>{mockShiftRequests.length} total requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockShiftRequests.map(shift => (
                      <div key={shift.id} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{shift.clientName}</p>
                            <p className="text-sm text-muted-foreground">{shift.locationName}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={shift.urgency === 'critical' ? 'destructive' : shift.urgency === 'urgent' ? 'default' : 'outline'}>
                              {shift.urgency}
                            </Badge>
                            <Badge variant="secondary">{shift.status.replace('_', ' ')}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{format(new Date(shift.date), 'MMM d, yyyy')}</span>
                            <span>{shift.startTime} - {shift.endTime}</span>
                            <span>{shift.filledPositions}/{shift.totalPositions} filled</span>
                            <span className="text-green-600">${shift.chargeRate}/hr</span>
                          </div>
                          {(shift.status === 'open' || shift.status === 'partially_filled') && (
                            <Button size="small" onClick={() => setSelectedShiftForMatching(shift.id)}>
                              <Zap className="h-4 w-4 mr-1" />
                              Match Candidates
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Timesheets Tab */}
          <TabsContent value="timesheets">
            <TimesheetApprovalWorkflow />
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>{mockInvoices.length} invoices</CardDescription>
                </div>
                <Button onClick={() => setShowInvoiceGenerator(true)}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Generate Invoice
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockInvoices.map(invoice => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">{invoice.clientName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${invoice.total.toLocaleString()}</p>
                        <Badge variant={
                          invoice.status === 'paid' ? 'default' : 
                          invoice.status === 'overdue' ? 'destructive' : 
                          'secondary'
                        }>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Agency Profile</CardTitle>
                  <CardDescription>Your agency details and compliance</CardDescription>
                </div>
                <Button variant="outlined" onClick={() => setShowOnboardingWizard(true)}>
                  Edit Profile
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Legal Name</p>
                    <p className="font-medium">{mockAgency.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ABN</p>
                    <p className="font-medium">{mockAgency.abn}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Primary Contact</p>
                    <p className="font-medium">{mockAgency.primaryContactName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{mockAgency.primaryContactEmail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals and Dialogs */}
      <AgencyOnboardingWizard 
        open={showOnboardingWizard} 
        onClose={() => setShowOnboardingWizard(false)}
        onComplete={(data) => {
          console.log('Agency onboarding completed:', data);
          setShowOnboardingWizard(false);
        }}
      />
      
      <CandidateOnboardingForm 
        open={showCandidateForm} 
        onClose={() => setShowCandidateForm(false)}
        onComplete={(candidate) => {
          console.log('Candidate onboarding completed:', candidate);
          setShowCandidateForm(false);
        }}
      />
      
      <InvoiceGenerator 
        open={showInvoiceGenerator} 
        onClose={() => setShowInvoiceGenerator(false)}
        onSave={(invoice) => {
          console.log('Invoice saved:', invoice);
          setShowInvoiceGenerator(false);
        }}
      />
      
      {selectedCandidateForAvailability && (
        <CandidateAvailabilityCalendar
          open={showAvailabilityCalendar}
          onClose={() => {
            setShowAvailabilityCalendar(false);
            setSelectedCandidateForAvailability(null);
          }}
          candidateId={selectedCandidateForAvailability.id}
          candidateName={selectedCandidateForAvailability.name}
          onSave={(data) => {
            console.log('Availability saved:', data);
            setShowAvailabilityCalendar(false);
            setSelectedCandidateForAvailability(null);
          }}
        />
      )}
    </div>
  );
};

export default AgencyPortal;
