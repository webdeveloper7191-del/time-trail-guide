import { useState, useMemo, useEffect } from 'react';
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
  DemandConfig,
  StaffingConfig,
  INDUSTRY_TEMPLATES,
  getIndustryTemplate,
} from '@/types/industryConfig';
import { useDemand } from '@/contexts/DemandContext';

interface IndustryConfigurationModalProps {
  open: boolean;
  onClose: () => void;
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
}: IndustryConfigurationModalProps) {
  const { 
    config, 
    switchIndustry, 
    updateTerminology, 
    updateStaffingTerminology,
  } = useDemand();
  
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>(config.industryType);
  const [step, setStep] = useState<'select' | 'configure'>('select');
  
  const template = useMemo(() => getIndustryTemplate(selectedIndustry), [selectedIndustry]);
  
  // Local state for editing (synced from context on open)
  const [demandConfig, setDemandConfig] = useState<DemandConfig>(config.terminology);
  const [staffingConfig, setStaffingConfig] = useState<StaffingConfig>(config.staffingTerminology);
  const [newPeakIndicator, setNewPeakIndicator] = useState('');

  // Sync local state when modal opens or industry changes
  useEffect(() => {
    if (open) {
      setSelectedIndustry(config.industryType);
      setDemandConfig(config.terminology);
      setStaffingConfig(config.staffingTerminology);
      setStep('select');
    }
  }, [open, config.industryType, config.terminology, config.staffingTerminology]);

  const handleSelectIndustry = (industry: IndustryType) => {
    setSelectedIndustry(industry);
    const newTemplate = getIndustryTemplate(industry);
    setDemandConfig(newTemplate.demandConfig);
    setStaffingConfig(newTemplate.staffingConfig);
  };

  const handleSave = () => {
    // Update context with new settings
    switchIndustry(selectedIndustry);
    updateTerminology(demandConfig);
    updateStaffingTerminology(staffingConfig);
    
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
          ? 'Choose an industry template to customize demand and staffing terminology'
          : 'Customize the terminology and labels for your organization'
      }
      width="900px"
      open={open}
      onClose={onClose}
      actions={actions}
      showFooter
    >
      {step === 'select' ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 2 }}>
          {INDUSTRY_TEMPLATES.map((industry) => {
            const isSelected = selectedIndustry === industry.id;
            return (
              <Card
                key={industry.id}
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  borderWidth: isSelected ? 2 : 1,
                  bgcolor: isSelected ? 'rgba(3, 169, 244, 0.08)' : 'background.paper',
                  boxShadow: isSelected ? '0 0 0 3px rgba(3, 169, 244, 0.12)' : 'none',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: isSelected ? 'rgba(3, 169, 244, 0.12)' : 'action.hover',
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
                        bgcolor: isSelected ? 'primary.main' : 'action.hover',
                        color: isSelected ? 'white' : 'text.secondary',
                      }}
                    >
                      {industryIcons[industry.id]}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography 
                          variant="subtitle1" 
                          fontWeight={600}
                          color={isSelected ? 'primary.main' : 'text.primary'}
                        >
                          {industry.name}
                        </Typography>
                        {isSelected && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              color: 'white',
                            }}
                          >
                            <Check size={12} />
                          </Box>
                        )}
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        {industry.description}
                      </Typography>
                      <Stack direction="row" spacing={0.5} mt={1.5} flexWrap="wrap" gap={0.5}>
                        <Chip 
                          size="small" 
                          label={industry.demandConfig.demandUnitPlural} 
                          variant={isSelected ? 'filled' : 'outlined'}
                          color={isSelected ? 'primary' : 'default'}
                          sx={isSelected ? { fontWeight: 500 } : {}}
                        />
                        <Chip 
                          size="small" 
                          label={industry.demandConfig.zoneLabelPlural} 
                          variant={isSelected ? 'filled' : 'outlined'}
                          color={isSelected ? 'primary' : 'default'}
                          sx={isSelected ? { fontWeight: 500 } : {}}
                        />
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      ) : (
        <Tabs defaultValue="demand" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="demand">
              <BarChart3 className="h-4 w-4 mr-2" />
              Demand Terminology
            </TabsTrigger>
            <TabsTrigger value="staffing">
              <Users className="h-4 w-4 mr-2" />
              Staffing Terminology
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-320px)] mt-4">
            {/* Demand Configuration */}
            <TabsContent value="demand" className="mt-0">
              <Stack spacing={3}>
                <Alert severity="info">
                  These labels control how demand is displayed throughout the roster. Configure operational settings (hours, patterns, thresholds) in <strong>Demand Settings</strong>.
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
                    Peak Demand Labels
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Common busy period labels for your industry. Configure actual times in <strong>Demand Settings → Patterns</strong>.
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
                      placeholder="Add peak label (e.g., Lunch Rush)"
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
