import { useState, useMemo } from 'react';
import {
  Button,
  TextField,
  Card,
  CardContent,
  Stack,
  Box,
  Typography,
  Chip,
  Divider,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Baby,
  ShoppingCart,
  Heart,
  Utensils,
  Headphones,
  Factory,
  Calendar,
  Settings,
  Check,
  ChevronRight,
  ArrowLeft,
  Plug,
  BarChart3,
  Users,
  Plus,
  Trash2,
} from 'lucide-react';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  IndustryType,
  IndustryTemplate,
  DemandConfig,
  StaffingConfig,
  INDUSTRY_TEMPLATES,
  getIndustryTemplate,
} from '@/types/industryConfig';

interface IndustryConfigurationModalProps {
  open: boolean;
  onClose: () => void;
  currentIndustry: IndustryType;
  onSave: (industry: IndustryType, demandConfig: DemandConfig, staffingConfig: StaffingConfig) => void;
}

const industryIcons: Record<IndustryType, React.ReactNode> = {
  childcare: <Baby size={24} />,
  retail: <ShoppingCart size={24} />,
  healthcare: <Heart size={24} />,
  hospitality: <Utensils size={24} />,
  call_center: <Headphones size={24} />,
  manufacturing: <Factory size={24} />,
  events: <Calendar size={24} />,
  custom: <Settings size={24} />,
};

export function IndustryConfigurationModal({
  open,
  onClose,
  currentIndustry,
  onSave,
}: IndustryConfigurationModalProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>(currentIndustry);
  const [step, setStep] = useState<'select' | 'configure'>('select');
  
  const template = useMemo(() => getIndustryTemplate(selectedIndustry), [selectedIndustry]);
  
  const [demandConfig, setDemandConfig] = useState<DemandConfig>(template.demandConfig);
  const [staffingConfig, setStaffingConfig] = useState<StaffingConfig>(template.staffingConfig);
  const [newPeakIndicator, setNewPeakIndicator] = useState('');

  const handleSelectIndustry = (industry: IndustryType) => {
    setSelectedIndustry(industry);
    const newTemplate = getIndustryTemplate(industry);
    setDemandConfig(newTemplate.demandConfig);
    setStaffingConfig(newTemplate.staffingConfig);
  };

  const handleSave = () => {
    onSave(selectedIndustry, demandConfig, staffingConfig);
    toast.success(`Industry settings saved for ${template.name}`);
    onClose();
  };

  const handleAddPeakIndicator = () => {
    if (newPeakIndicator.trim()) {
      setDemandConfig({
        ...demandConfig,
        peakIndicators: [...demandConfig.peakIndicators, newPeakIndicator.trim()],
      });
      setNewPeakIndicator('');
    }
  };

  const handleRemovePeakIndicator = (index: number) => {
    setDemandConfig({
      ...demandConfig,
      peakIndicators: demandConfig.peakIndicators.filter((_, i) => i !== index),
    });
  };

  const actions: OffCanvasAction[] = step === 'select'
    ? [
        { label: 'Cancel', onClick: onClose, variant: 'outlined' },
        { label: 'Configure', onClick: () => setStep('configure'), variant: 'primary' },
      ]
    : [
        { label: 'Back', onClick: () => setStep('select'), variant: 'outlined' },
        { label: 'Save Configuration', onClick: handleSave, variant: 'primary' },
      ];

  return (
    <PrimaryOffCanvas
      title={step === 'select' ? 'Select Industry' : `Configure ${template.name}`}
      description={
        step === 'select'
          ? 'Choose an industry template to customize demand and staffing settings'
          : 'Customize the terminology and settings for your organization'
      }
      width="900px"
      open={open}
      onClose={onClose}
      actions={actions}
      showFooter
    >
      {step === 'select' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 2 }}>
          {INDUSTRY_TEMPLATES.map((industry) => (
            <Card
              key={industry.id}
              variant="outlined"
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderColor: selectedIndustry === industry.id ? 'primary.main' : 'divider',
                borderWidth: selectedIndustry === industry.id ? 2 : 1,
                bgcolor: selectedIndustry === industry.id ? 'primary.light' : 'background.paper',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => handleSelectIndustry(industry.id)}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: selectedIndustry === industry.id ? 'primary.main' : 'action.hover',
                      color: selectedIndustry === industry.id ? 'white' : 'text.secondary',
                    }}
                  >
                    {industryIcons[industry.id]}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {industry.name}
                      </Typography>
                      {selectedIndustry === industry.id && (
                        <Check size={16} className="text-primary" />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {industry.description}
                    </Typography>
                    <Stack direction="row" spacing={0.5} mt={1} flexWrap="wrap" gap={0.5}>
                      <Chip size="small" label={industry.demandConfig.demandUnitPlural} variant="outlined" />
                      <Chip size="small" label={industry.demandConfig.zoneLabelPlural} variant="outlined" />
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Tabs defaultValue="demand" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="demand">
              <BarChart3 className="h-4 w-4 mr-2" />
              Demand
            </TabsTrigger>
            <TabsTrigger value="staffing">
              <Users className="h-4 w-4 mr-2" />
              Staffing
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <Plug className="h-4 w-4 mr-2" />
              Integrations
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-320px)] mt-4">
            {/* Demand Configuration */}
            <TabsContent value="demand" className="mt-0">
              <Stack spacing={3}>
                <Alert severity="info">
                  These settings control how demand is displayed and calculated in your roster.
                </Alert>

                {/* Demand Unit */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    What are you tracking demand for?
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <TextField
                      label="Singular (e.g., Child, Customer)"
                      value={demandConfig.demandUnit}
                      onChange={(e) => setDemandConfig({ ...demandConfig, demandUnit: e.target.value })}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="Plural (e.g., Children, Customers)"
                      value={demandConfig.demandUnitPlural}
                      onChange={(e) => setDemandConfig({ ...demandConfig, demandUnitPlural: e.target.value })}
                      size="small"
                      fullWidth
                    />
                  </Box>
                </Box>

                <Divider />

                {/* Metrics */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Demand Metrics
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <TextField
                      label="Primary Metric (e.g., Bookings, Traffic)"
                      value={demandConfig.primaryMetric}
                      onChange={(e) => setDemandConfig({ ...demandConfig, primaryMetric: e.target.value })}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="Secondary Metric (e.g., Attendance, Sales)"
                      value={demandConfig.secondaryMetric || ''}
                      onChange={(e) => setDemandConfig({ ...demandConfig, secondaryMetric: e.target.value })}
                      size="small"
                      fullWidth
                    />
                  </Box>
                </Box>

                <Divider />

                {/* Zone/Area Labels */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Zone/Area Terminology
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <TextField
                      label="Singular (e.g., Room, Department)"
                      value={demandConfig.zoneLabel}
                      onChange={(e) => setDemandConfig({ ...demandConfig, zoneLabel: e.target.value })}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="Plural (e.g., Rooms, Departments)"
                      value={demandConfig.zoneLabelPlural}
                      onChange={(e) => setDemandConfig({ ...demandConfig, zoneLabelPlural: e.target.value })}
                      size="small"
                      fullWidth
                    />
                  </Box>
                </Box>

                <Divider />

                {/* Ratio & Capacity */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Ratio & Capacity Labels
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <TextField
                      label="Ratio Label (e.g., Staff:Child Ratio)"
                      value={demandConfig.ratioLabel}
                      onChange={(e) => setDemandConfig({ ...demandConfig, ratioLabel: e.target.value })}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="Capacity Label (e.g., Room Capacity)"
                      value={demandConfig.capacityLabel}
                      onChange={(e) => setDemandConfig({ ...demandConfig, capacityLabel: e.target.value })}
                      size="small"
                      fullWidth
                    />
                  </Box>
                </Box>

                <Divider />

                {/* Peak Indicators */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Peak Demand Indicators
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Common busy periods to highlight in the roster
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} mb={2}>
                    {demandConfig.peakIndicators.map((indicator, index) => (
                      <Chip
                        key={index}
                        label={indicator}
                        onDelete={() => handleRemovePeakIndicator(index)}
                        size="small"
                      />
                    ))}
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      placeholder="Add peak indicator (e.g., Lunch 12-2pm)"
                      value={newPeakIndicator}
                      onChange={(e) => setNewPeakIndicator(e.target.value)}
                      size="small"
                      fullWidth
                      onKeyPress={(e) => e.key === 'Enter' && handleAddPeakIndicator()}
                    />
                    <Button variant="outlined" onClick={handleAddPeakIndicator}>
                      <Plus size={16} />
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </TabsContent>

            {/* Staffing Configuration */}
            <TabsContent value="staffing" className="mt-0">
              <Stack spacing={3}>
                <Alert severity="info">
                  Configure how staff roles and compliance are labeled in your roster.
                </Alert>

                {/* Role Labels */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Staff Role Terminology
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <TextField
                      label="Singular (e.g., Educator, Nurse)"
                      value={staffingConfig.roleLabel}
                      onChange={(e) => setStaffingConfig({ ...staffingConfig, roleLabel: e.target.value })}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="Plural (e.g., Educators, Nurses)"
                      value={staffingConfig.roleLabelPlural}
                      onChange={(e) => setStaffingConfig({ ...staffingConfig, roleLabelPlural: e.target.value })}
                      size="small"
                      fullWidth
                    />
                  </Box>
                </Box>

                <Divider />

                {/* Compliance Label */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Compliance & Target Labels
                  </Typography>
                  <TextField
                    label="Compliance Label (e.g., Ratio Compliance, Service Level)"
                    value={staffingConfig.complianceLabel}
                    onChange={(e) => setStaffingConfig({ ...staffingConfig, complianceLabel: e.target.value })}
                    size="small"
                    fullWidth
                  />
                </Box>

                <Divider />

                {/* Qualifications */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Required Qualifications
                  </Typography>
                  <Stack spacing={1}>
                    {staffingConfig.qualificationTypes.map((qual, index) => (
                      <Card key={qual.id} variant="outlined" sx={{ p: 1.5 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {qual.name}
                            </Typography>
                            <Stack direction="row" spacing={1} mt={0.5}>
                              {qual.required && <Badge variant="secondary">Required</Badge>}
                              {qual.expiryTracked && <Badge variant="outline">Expiry Tracked</Badge>}
                            </Stack>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setStaffingConfig({
                                ...staffingConfig,
                                qualificationTypes: staffingConfig.qualificationTypes.filter((_, i) => i !== index),
                              });
                            }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Stack>
                      </Card>
                    ))}
                    {staffingConfig.qualificationTypes.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No qualifications configured. Add qualifications based on your industry requirements.
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </TabsContent>

            {/* Integrations */}
            <TabsContent value="integrations" className="mt-0">
              <Stack spacing={3}>
                <Alert severity="info">
                  Connect external systems to automatically sync demand data into your roster.
                </Alert>

                <Typography variant="subtitle2">
                  Available Integrations for {template.name}
                </Typography>

                <Stack spacing={2}>
                  {template.integrations.map((integration) => (
                    <Card key={integration.id} variant="outlined">
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="subtitle2">{integration.name}</Typography>
                              <Chip size="small" label={integration.type} variant="outlined" />
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              {integration.description}
                            </Typography>
                          </Box>
                          <Button variant="outlined" size="small" endIcon={<ChevronRight size={16} />}>
                            Connect
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Data Sources
                  </Typography>
                  <Stack spacing={1}>
                    <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Check className="text-green-600" size={20} />
                          <Box>
                            <Typography variant="body2" fontWeight={500}>Historical Patterns</Typography>
                            <Typography variant="caption" color="text.secondary">
                              AI learns from past data to predict future demand
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                    <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Check className="text-green-600" size={20} />
                          <Box>
                            <Typography variant="body2" fontWeight={500}>External Integration</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Pull demand data from connected systems
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                </Box>
              </Stack>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      )}
    </PrimaryOffCanvas>
  );
}

export default IndustryConfigurationModal;
