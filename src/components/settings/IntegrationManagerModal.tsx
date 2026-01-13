import { useState, useEffect } from 'react';
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
  LinearProgress,
  InputAdornment,
  FormControlLabel,
  Switch,
  CircularProgress,
} from '@mui/material';
import {
  Plug,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Upload,
  Download,
  Clock,
  Zap,
  Settings2,
  ArrowRight,
} from 'lucide-react';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useDemand } from '@/contexts/DemandContext';
import { IntegrationOption, IntegrationField } from '@/types/industryConfig';
import { demandETL, INTEGRATION_ADAPTERS, TransformationResult } from '@/lib/etl/demandETL';

interface IntegrationManagerModalProps {
  open: boolean;
  onClose: () => void;
}

interface ApiHeader {
  key: string;
  value: string;
}

interface ApiEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'GET';
  headers: ApiHeader[];
  enabled: boolean;
  lastTestResult?: {
    success: boolean;
    statusCode?: number;
    recordCount?: number;
    error?: string;
    timestamp: string;
    previewData?: any[];
  };
}

interface ActiveIntegration extends IntegrationOption {
  enabled: boolean;
  lastSync?: string;
  status: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
  credentials: Record<string, string>;
  autoSync: boolean;
  syncInterval: number; // minutes
  apiEndpoints: ApiEndpoint[]; // Multiple GET API endpoints
}

interface SyncResult {
  integrationId: string;
  success: boolean;
  recordsImported: number;
  errors: number;
  timestamp: string;
}

export function IntegrationManagerModal({
  open,
  onClose,
}: IntegrationManagerModalProps) {
  const { config, updateConfig, bulkAddManualEntries, terminology } = useDemand();
  
  const [activeIntegrations, setActiveIntegrations] = useState<ActiveIntegration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<ActiveIntegration | null>(null);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  const [syncHistory, setSyncHistory] = useState<SyncResult[]>([]);
  const [testData, setTestData] = useState<string>('');
  const [testResult, setTestResult] = useState<TransformationResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  
  // Initialize from config
  useEffect(() => {
    if (open && config.integrations) {
      const integrations = config.integrations.map(integration => ({
        ...integration,
        enabled: config.settings.dataSources.integration.enabled,
        status: 'idle' as const,
        credentials: {},
        autoSync: false,
        syncInterval: 30,
        apiEndpoints: [] as ApiEndpoint[],
      }));
      setActiveIntegrations(integrations);
    }
  }, [open, config.integrations, config.settings.dataSources.integration.enabled]);
  
  const handleAddApiEndpoint = (integrationId: string) => {
    setActiveIntegrations(prev => prev.map(int => 
      int.id === integrationId 
        ? { 
            ...int, 
            apiEndpoints: [
              ...int.apiEndpoints, 
              { 
                id: `endpoint-${Date.now()}`, 
                name: `API Endpoint ${int.apiEndpoints.length + 1}`,
                url: '', 
                method: 'GET' as const,
                headers: [],
                enabled: true,
              }
            ] 
          }
        : int
    ));
  };
  
  const handleUpdateApiEndpoint = (integrationId: string, endpointId: string, field: keyof ApiEndpoint, value: any) => {
    setActiveIntegrations(prev => prev.map(int => 
      int.id === integrationId 
        ? { 
            ...int, 
            apiEndpoints: int.apiEndpoints.map(ep => 
              ep.id === endpointId ? { ...ep, [field]: value } : ep
            )
          }
        : int
    ));
  };
  
  const handleAddHeader = (integrationId: string, endpointId: string) => {
    setActiveIntegrations(prev => prev.map(int => 
      int.id === integrationId 
        ? { 
            ...int, 
            apiEndpoints: int.apiEndpoints.map(ep => 
              ep.id === endpointId 
                ? { ...ep, headers: [...ep.headers, { key: '', value: '' }] }
                : ep
            )
          }
        : int
    ));
  };
  
  const handleUpdateHeader = (integrationId: string, endpointId: string, headerIndex: number, field: 'key' | 'value', value: string) => {
    setActiveIntegrations(prev => prev.map(int => 
      int.id === integrationId 
        ? { 
            ...int, 
            apiEndpoints: int.apiEndpoints.map(ep => 
              ep.id === endpointId 
                ? { 
                    ...ep, 
                    headers: ep.headers.map((h, i) => 
                      i === headerIndex ? { ...h, [field]: value } : h
                    )
                  }
                : ep
            )
          }
        : int
    ));
  };
  
  const handleRemoveHeader = (integrationId: string, endpointId: string, headerIndex: number) => {
    setActiveIntegrations(prev => prev.map(int => 
      int.id === integrationId 
        ? { 
            ...int, 
            apiEndpoints: int.apiEndpoints.map(ep => 
              ep.id === endpointId 
                ? { ...ep, headers: ep.headers.filter((_, i) => i !== headerIndex) }
                : ep
            )
          }
        : int
    ));
  };
  
  const handleTestEndpoint = async (integrationId: string, endpoint: ApiEndpoint) => {
    if (!endpoint.url) {
      toast.error('Please enter an API URL');
      return;
    }
    
    // Update endpoint status
    setActiveIntegrations(prev => prev.map(int => 
      int.id === integrationId 
        ? { 
            ...int, 
            apiEndpoints: int.apiEndpoints.map(ep => 
              ep.id === endpoint.id 
                ? { ...ep, lastTestResult: { success: false, timestamp: new Date().toISOString() } }
                : ep
            )
          }
        : int
    ));
    
    // Simulate API call (in real implementation, this would call the actual endpoint)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const success = Math.random() > 0.3;
    const mockRecords = Math.floor(Math.random() * 50) + 5;
    const mockData = Array.from({ length: Math.min(3, mockRecords) }, (_, i) => ({
      id: i + 1,
      date: new Date().toISOString().split('T')[0],
      value: Math.floor(Math.random() * 100),
    }));
    
    setActiveIntegrations(prev => prev.map(int => 
      int.id === integrationId 
        ? { 
            ...int, 
            apiEndpoints: int.apiEndpoints.map(ep => 
              ep.id === endpoint.id 
                ? { 
                    ...ep, 
                    lastTestResult: success 
                      ? { 
                          success: true, 
                          statusCode: 200, 
                          recordCount: mockRecords,
                          previewData: mockData,
                          timestamp: new Date().toISOString(),
                        }
                      : { 
                          success: false, 
                          statusCode: 401, 
                          error: 'Unauthorized - Check API key or credentials',
                          timestamp: new Date().toISOString(),
                        }
                  }
                : ep
            )
          }
        : int
    ));
    
    if (success) {
      toast.success(`Connected to ${endpoint.name} - ${mockRecords} records found`);
    } else {
      toast.error(`Failed to connect to ${endpoint.name}`);
    }
  };
  
  const handleRemoveApiEndpoint = (integrationId: string, endpointId: string) => {
    setActiveIntegrations(prev => prev.map(int => 
      int.id === integrationId 
        ? { 
            ...int, 
            apiEndpoints: int.apiEndpoints.filter(ep => ep.id !== endpointId)
          }
        : int
    ));
  };
  
  const handleToggleIntegration = (integrationId: string) => {
    setActiveIntegrations(prev => prev.map(int => 
      int.id === integrationId 
        ? { ...int, enabled: !int.enabled }
        : int
    ));
  };
  
  const handleUpdateCredentials = (integrationId: string, field: string, value: string) => {
    setActiveIntegrations(prev => prev.map(int => 
      int.id === integrationId 
        ? { ...int, credentials: { ...int.credentials, [field]: value } }
        : int
    ));
  };
  
  const handleToggleAutoSync = (integrationId: string) => {
    setActiveIntegrations(prev => prev.map(int => 
      int.id === integrationId 
        ? { ...int, autoSync: !int.autoSync }
        : int
    ));
  };
  
  const handleTestConnection = async (integration: ActiveIntegration) => {
    setActiveIntegrations(prev => prev.map(int => 
      int.id === integration.id 
        ? { ...int, status: 'syncing' }
        : int
    ));
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const success = Math.random() > 0.3; // 70% success rate for demo
    
    setActiveIntegrations(prev => prev.map(int => 
      int.id === integration.id 
        ? { 
            ...int, 
            status: success ? 'success' : 'error',
            errorMessage: success ? undefined : 'Failed to connect. Please check credentials.',
          }
        : int
    ));
    
    if (success) {
      toast.success(`Connected to ${integration.name}`);
    } else {
      toast.error(`Failed to connect to ${integration.name}`);
    }
    
    // Reset status after delay
    setTimeout(() => {
      setActiveIntegrations(prev => prev.map(int => 
        int.id === integration.id ? { ...int, status: 'idle' } : int
      ));
    }, 3000);
  };
  
  const handleSyncNow = async (integration: ActiveIntegration) => {
    setActiveIntegrations(prev => prev.map(int => 
      int.id === integration.id 
        ? { ...int, status: 'syncing' }
        : int
    ));
    
    try {
      // Get adapter
      const adapter = demandETL.getAdapter(integration.id);
      
      if (!adapter) {
        throw new Error(`No adapter found for ${integration.id}`);
      }
      
      // Simulate fetching data (in real implementation, would call actual API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock data for demo
      const mockData = generateMockIntegrationData(integration.id, 10);
      
      // Run ETL
      const result = await demandETL.runETL(integration.id, {
        webhookData: mockData,
        centreId: 'centre-1',
        defaultZoneId: 'room-1',
      });
      
      if (result.success && result.entries.length > 0) {
        // Add to demand context
        bulkAddManualEntries(result.entries);
        
        // Update sync history
        const syncResult: SyncResult = {
          integrationId: integration.id,
          success: true,
          recordsImported: result.entries.length,
          errors: result.result.errors.length,
          timestamp: new Date().toISOString(),
        };
        setSyncHistory(prev => [syncResult, ...prev.slice(0, 9)]);
        
        setActiveIntegrations(prev => prev.map(int => 
          int.id === integration.id 
            ? { 
                ...int, 
                status: 'success',
                lastSync: new Date().toISOString(),
              }
            : int
        ));
        
        toast.success(`Synced ${result.entries.length} records from ${integration.name}`);
      } else {
        throw new Error(result.result.errors[0]?.message || 'No data to sync');
      }
    } catch (error) {
      setActiveIntegrations(prev => prev.map(int => 
        int.id === integration.id 
          ? { 
              ...int, 
              status: 'error',
              errorMessage: error instanceof Error ? error.message : 'Sync failed',
            }
          : int
      ));
      
      toast.error(`Failed to sync from ${integration.name}`);
    }
    
    // Reset status after delay
    setTimeout(() => {
      setActiveIntegrations(prev => prev.map(int => 
        int.id === integration.id && int.status !== 'error' 
          ? { ...int, status: 'idle' } 
          : int
      ));
    }, 3000);
  };
  
  const handleTestTransform = async () => {
    if (!testData.trim() || !selectedIntegration) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const parsedData = JSON.parse(testData);
      const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];
      
      const result = demandETL.transform(selectedIntegration.id, dataArray, {
        defaultZoneId: 'test-zone',
      });
      
      setTestResult(result);
      
      if (result.success) {
        toast.success(`Transformed ${result.stats.successfulRecords} records successfully`);
      } else {
        toast.warning(`Transformed with ${result.errors.length} errors`);
      }
    } catch (error) {
      toast.error('Invalid JSON data');
    } finally {
      setIsTesting(false);
    }
  };
  
  const handleSave = () => {
    // Update config with active integrations
    const enabledIntegrations = activeIntegrations.filter(i => i.enabled);
    
    updateConfig({
      integrations: activeIntegrations.map(({ enabled, status, credentials, autoSync, syncInterval, lastSync, errorMessage, ...rest }) => rest),
      settings: {
        ...config.settings,
        dataSources: {
          ...config.settings.dataSources,
          integration: {
            ...config.settings.dataSources.integration,
            enabled: enabledIntegrations.length > 0,
          },
        },
      },
    });
    
    toast.success('Integration settings saved');
    onClose();
  };
  
  const actions: OffCanvasAction[] = [
    { label: 'Cancel', onClick: onClose, variant: 'outlined' },
    { label: 'Save Settings', onClick: handleSave, variant: 'primary' },
  ];
  
  const getStatusColor = (status: ActiveIntegration['status']) => {
    switch (status) {
      case 'syncing': return 'info';
      case 'success': return 'success';
      case 'error': return 'error';
      default: return 'default';
    }
  };
  
  const getStatusIcon = (status: ActiveIntegration['status']) => {
    switch (status) {
      case 'syncing': return <CircularProgress size={16} />;
      case 'success': return <Check size={16} />;
      case 'error': return <AlertCircle size={16} />;
      default: return <Plug size={16} />;
    }
  };

  return (
    <PrimaryOffCanvas
      title="Integration Manager"
      description={`Connect external systems to automatically sync ${terminology.demandUnitPlural.toLowerCase()} data`}
      width="1000px"
      open={open}
      onClose={onClose}
      actions={actions}
      showFooter
    >
      <Tabs defaultValue="integrations" className="mt-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="integrations">
            <Plug className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="test">
            <Settings2 className="h-4 w-4 mr-2" />
            Test & Transform
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            Sync History
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[calc(100vh-320px)] mt-4">
          {/* Integrations List */}
          <TabsContent value="integrations" className="mt-0">
            <Stack spacing={2}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Enable integrations to automatically sync demand data from your booking, POS, or forecasting systems.
                Data will be transformed using our ETL pipeline and imported as {terminology.demandUnitPlural.toLowerCase()}.
              </Alert>
              
              {activeIntegrations.length === 0 ? (
                <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                  <Plug className="mx-auto mb-2 opacity-50" size={48} />
                  <Typography color="text.secondary">
                    No integrations available for this industry.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Select the "Custom" industry to use webhook or API integrations.
                  </Typography>
                </Card>
              ) : (
                activeIntegrations.map((integration) => (
                  <Card 
                    key={integration.id} 
                    variant="outlined"
                    sx={{
                      borderColor: integration.enabled ? 'primary.main' : 'divider',
                      bgcolor: integration.enabled ? 'rgba(3, 169, 244, 0.04)' : 'background.paper',
                    }}
                  >
                    <CardContent>
                      <Stack spacing={2}>
                        {/* Header */}
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 1,
                                bgcolor: integration.enabled ? 'primary.main' : 'action.hover',
                                color: integration.enabled ? 'white' : 'text.secondary',
                              }}
                            >
                              {getStatusIcon(integration.status)}
                            </Box>
                            <Box>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {integration.name}
                                </Typography>
                                <Chip 
                                  size="small" 
                                  label={integration.type.toUpperCase()} 
                                  variant="outlined"
                                />
                                {integration.status !== 'idle' && (
                                  <Chip 
                                    size="small" 
                                    label={integration.status}
                                    color={getStatusColor(integration.status)}
                                  />
                                )}
                              </Stack>
                              <Typography variant="body2" color="text.secondary">
                                {integration.description}
                              </Typography>
                            </Box>
                          </Stack>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={integration.enabled}
                                onChange={() => handleToggleIntegration(integration.id)}
                                color="primary"
                              />
                            }
                            label={integration.enabled ? 'Enabled' : 'Disabled'}
                          />
                        </Stack>
                        
                        {integration.enabled && (
                          <>
                            <Divider />
                            
                            {/* Credentials */}
                            <Box>
                              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                                Credentials
                              </Typography>
                              <Stack spacing={1.5}>
                                {integration.fields.map((field) => (
                                  <TextField
                                    key={field.name}
                                    label={field.name}
                                    type={
                                      field.type === 'api_key' && !showCredentials[`${integration.id}-${field.name}`]
                                        ? 'password'
                                        : 'text'
                                    }
                                    value={integration.credentials[field.name] || ''}
                                    onChange={(e) => handleUpdateCredentials(integration.id, field.name, e.target.value)}
                                    size="small"
                                    fullWidth
                                    required={field.required}
                                    InputProps={{
                                      endAdornment: field.type === 'api_key' && (
                                        <InputAdornment position="end">
                                          <IconButton
                                            size="small"
                                            onClick={() => setShowCredentials(prev => ({
                                              ...prev,
                                              [`${integration.id}-${field.name}`]: !prev[`${integration.id}-${field.name}`],
                                            }))}
                                          >
                                            {showCredentials[`${integration.id}-${field.name}`] 
                                              ? <EyeOff size={16} /> 
                                              : <Eye size={16} />
                                            }
                                          </IconButton>
                                        </InputAdornment>
                                      ),
                                    }}
                                  />
                                ))}
                              </Stack>
                            </Box>
                            
                            {/* Sync Settings */}
                            <Box>
                              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                                Sync Settings
                              </Typography>
                              <Stack direction="row" spacing={2} alignItems="center">
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={integration.autoSync}
                                      onChange={() => handleToggleAutoSync(integration.id)}
                                      size="small"
                                    />
                                  }
                                  label="Auto-sync"
                                />
                                {integration.autoSync && (
                                  <TextField
                                    label="Interval (min)"
                                    type="number"
                                    value={integration.syncInterval}
                                    onChange={(e) => setActiveIntegrations(prev => prev.map(int =>
                                      int.id === integration.id
                                        ? { ...int, syncInterval: parseInt(e.target.value) || 30 }
                                        : int
                                    ))}
                                    size="small"
                                    sx={{ width: 120 }}
                                    inputProps={{ min: 5, max: 1440 }}
                                  />
                                )}
                              </Stack>
                              {integration.lastSync && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                  Last synced: {new Date(integration.lastSync).toLocaleString()}
                                </Typography>
                              )}
                            </Box>
                            
                            {/* API Endpoints */}
                            <Box>
                              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                                <Typography variant="subtitle2">
                                  API Endpoints (GET)
                                </Typography>
                                <Button
                                  size="small"
                                  startIcon={<Plus size={14} />}
                                  onClick={() => handleAddApiEndpoint(integration.id)}
                                >
                                  Add Endpoint
                                </Button>
                              </Stack>
                              
                              {integration.apiEndpoints.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                  No API endpoints configured. Add endpoints to fetch data from external APIs.
                                </Typography>
                              ) : (
                                <Stack spacing={1.5}>
                                  {integration.apiEndpoints.map((endpoint, idx) => (
                                    <Card key={endpoint.id} variant="outlined" sx={{ p: 1.5, bgcolor: 'background.default' }}>
                                      <Stack spacing={1.5}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                          <TextField
                                            label="Endpoint Name"
                                            value={endpoint.name}
                                            onChange={(e) => handleUpdateApiEndpoint(integration.id, endpoint.id, 'name', e.target.value)}
                                            size="small"
                                            sx={{ flex: 1 }}
                                          />
                                          <FormControlLabel
                                            control={
                                              <Switch
                                                checked={endpoint.enabled}
                                                onChange={(e) => handleUpdateApiEndpoint(integration.id, endpoint.id, 'enabled', e.target.checked)}
                                                size="small"
                                              />
                                            }
                                            label="Enabled"
                                          />
                                          <IconButton 
                                            size="small" 
                                            color="error"
                                            onClick={() => handleRemoveApiEndpoint(integration.id, endpoint.id)}
                                          >
                                            <Trash2 size={16} />
                                          </IconButton>
                                        </Stack>
                                        <TextField
                                          label="API URL"
                                          value={endpoint.url}
                                          onChange={(e) => handleUpdateApiEndpoint(integration.id, endpoint.id, 'url', e.target.value)}
                                          size="small"
                                          fullWidth
                                          placeholder="https://api.example.com/v1/data"
                                          InputProps={{
                                            startAdornment: (
                                              <InputAdornment position="start">
                                                <Chip label="GET" size="small" color="info" />
                                              </InputAdornment>
                                            ),
                                          }}
                                        />
                                        
                                        {/* Headers Configuration */}
                                        <Box>
                                          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                                            <Typography variant="caption" fontWeight={500}>
                                              Headers
                                            </Typography>
                                            <Button
                                              size="small"
                                              startIcon={<Plus size={12} />}
                                              onClick={() => handleAddHeader(integration.id, endpoint.id)}
                                              sx={{ fontSize: '0.7rem', py: 0.25, minWidth: 0 }}
                                            >
                                              Add Header
                                            </Button>
                                          </Stack>
                                          {endpoint.headers.length === 0 ? (
                                            <Typography variant="caption" color="text.secondary">
                                              No headers configured. Add headers for authentication (e.g., Authorization: Bearer token).
                                            </Typography>
                                          ) : (
                                            <Stack spacing={1}>
                                              {endpoint.headers.map((header, headerIdx) => (
                                                <Stack key={headerIdx} direction="row" spacing={1} alignItems="center">
                                                  <TextField
                                                    placeholder="Header Key"
                                                    value={header.key}
                                                    onChange={(e) => handleUpdateHeader(integration.id, endpoint.id, headerIdx, 'key', e.target.value)}
                                                    size="small"
                                                    sx={{ flex: 1 }}
                                                    inputProps={{ style: { fontSize: '0.75rem' } }}
                                                  />
                                                  <TextField
                                                    placeholder="Header Value"
                                                    value={header.value}
                                                    onChange={(e) => handleUpdateHeader(integration.id, endpoint.id, headerIdx, 'value', e.target.value)}
                                                    size="small"
                                                    sx={{ flex: 2 }}
                                                    type={header.key.toLowerCase().includes('auth') || header.key.toLowerCase().includes('key') ? 'password' : 'text'}
                                                    inputProps={{ style: { fontSize: '0.75rem' } }}
                                                  />
                                                  <IconButton 
                                                    size="small" 
                                                    onClick={() => handleRemoveHeader(integration.id, endpoint.id, headerIdx)}
                                                  >
                                                    <X size={14} />
                                                  </IconButton>
                                                </Stack>
                                              ))}
                                            </Stack>
                                          )}
                                        </Box>
                                        
                                        {/* Fetch Now Button & Test Result */}
                                        <Stack direction="row" spacing={1} alignItems="center">
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={endpoint.lastTestResult && !endpoint.lastTestResult.success && !endpoint.lastTestResult.error ? <CircularProgress size={14} /> : <Download size={14} />}
                                            onClick={() => handleTestEndpoint(integration.id, endpoint)}
                                            disabled={!endpoint.url || (endpoint.lastTestResult && !endpoint.lastTestResult.success && !endpoint.lastTestResult.error)}
                                          >
                                            Fetch Now
                                          </Button>
                                          {endpoint.lastTestResult && (
                                            <Chip 
                                              size="small"
                                              icon={endpoint.lastTestResult.success ? <Check size={14} /> : <AlertCircle size={14} />}
                                              label={endpoint.lastTestResult.success 
                                                ? `${endpoint.lastTestResult.recordCount} records` 
                                                : `Error: ${endpoint.lastTestResult.statusCode || 'Failed'}`
                                              }
                                              color={endpoint.lastTestResult.success ? 'success' : 'error'}
                                              variant="outlined"
                                            />
                                          )}
                                        </Stack>
                                        
                                        {/* Preview Data */}
                                        {endpoint.lastTestResult?.success && endpoint.lastTestResult.previewData && (
                                          <Box sx={{ bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                                            <Typography variant="caption" fontWeight={500} sx={{ mb: 0.5, display: 'block' }}>
                                              Data Preview (first 3 records)
                                            </Typography>
                                            <Box 
                                              component="pre" 
                                              sx={{ 
                                                fontSize: '0.65rem', 
                                                m: 0, 
                                                overflow: 'auto', 
                                                maxHeight: 80,
                                                fontFamily: 'monospace',
                                              }}
                                            >
                                              {JSON.stringify(endpoint.lastTestResult.previewData, null, 2)}
                                            </Box>
                                          </Box>
                                        )}
                                      </Stack>
                                    </Card>
                                  ))}
                                </Stack>
                              )}
                            </Box>
                            
                            {/* Error Message */}
                            {integration.errorMessage && (
                              <Alert severity="error" sx={{ py: 0.5 }}>
                                {integration.errorMessage}
                              </Alert>
                            )}
                            
                            {/* Actions */}
                            <Stack direction="row" spacing={1}>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleTestConnection(integration)}
                                disabled={integration.status === 'syncing'}
                                startIcon={<Zap size={16} />}
                              >
                                Test Connection
                              </Button>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleSyncNow(integration)}
                                disabled={integration.status === 'syncing'}
                                startIcon={integration.status === 'syncing' ? <CircularProgress size={16} /> : <RefreshCw size={16} />}
                              >
                                Sync Now
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setSelectedIntegration(integration)}
                                startIcon={<Settings2 size={16} />}
                              >
                                Test Transform
                              </Button>
                            </Stack>
                          </>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          </TabsContent>
          
          {/* Test & Transform */}
          <TabsContent value="test" className="mt-0">
            <Stack spacing={3}>
              <Alert severity="info">
                Test the ETL transformation by pasting sample JSON data from your integration. 
                This helps verify field mappings before enabling live sync.
              </Alert>
              
              {/* Select Integration */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                  Select Integration to Test
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {activeIntegrations.map((integration) => (
                    <Chip
                      key={integration.id}
                      label={integration.name}
                      variant={selectedIntegration?.id === integration.id ? 'filled' : 'outlined'}
                      color={selectedIntegration?.id === integration.id ? 'primary' : 'default'}
                      onClick={() => setSelectedIntegration(integration)}
                    />
                  ))}
                  {Object.keys(INTEGRATION_ADAPTERS).filter(
                    id => !activeIntegrations.some(i => i.id === id)
                  ).map((adapterId) => (
                    <Chip
                      key={adapterId}
                      label={INTEGRATION_ADAPTERS[adapterId].name}
                      variant={selectedIntegration?.id === adapterId ? 'filled' : 'outlined'}
                      color={selectedIntegration?.id === adapterId ? 'primary' : 'default'}
                      onClick={() => setSelectedIntegration({
                        id: adapterId,
                        name: INTEGRATION_ADAPTERS[adapterId].name,
                        type: INTEGRATION_ADAPTERS[adapterId].sourceType,
                        description: 'Test adapter',
                        fields: [],
                        enabled: false,
                        status: 'idle',
                        credentials: {},
                        autoSync: false,
                        syncInterval: 30,
                        apiEndpoints: [],
                      })}
                    />
                  ))}
                </Stack>
              </Box>
              
              {selectedIntegration && (
                <>
                  {/* Field Mappings */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                      Field Mappings for {selectedIntegration.name}
                    </Typography>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={1}>
                        {demandETL.getAdapter(selectedIntegration.id)?.fieldMappings.map((mapping, idx) => (
                          <Stack 
                            key={idx} 
                            direction="row" 
                            alignItems="center" 
                            spacing={1}
                            sx={{ fontSize: '0.875rem' }}
                          >
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontFamily: 'monospace',
                                bgcolor: 'action.hover',
                                px: 1,
                                py: 0.25,
                                borderRadius: 0.5,
                              }}
                            >
                              {mapping.sourceField}
                            </Typography>
                            <ArrowRight size={16} className="opacity-50" />
                            <Typography 
                              variant="body2"
                              sx={{ 
                                fontFamily: 'monospace',
                                bgcolor: 'primary.main',
                                color: 'white',
                                px: 1,
                                py: 0.25,
                                borderRadius: 0.5,
                              }}
                            >
                              {mapping.targetField}
                            </Typography>
                            {mapping.required && (
                              <Chip label="required" size="small" color="error" variant="outlined" />
                            )}
                          </Stack>
                        ))}
                      </Stack>
                    </Card>
                  </Box>
                  
                  {/* Test Data Input */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                      Sample JSON Data
                    </Typography>
                    <TextField
                      multiline
                      rows={8}
                      fullWidth
                      placeholder={`[
  {
    "${demandETL.getAdapter(selectedIntegration.id)?.fieldMappings[0]?.sourceField || 'date'}": "2024-01-15",
    "${demandETL.getAdapter(selectedIntegration.id)?.fieldMappings[2]?.sourceField || 'zone_id'}": "zone-1",
    ...
  }
]`}
                      value={testData}
                      onChange={(e) => setTestData(e.target.value)}
                      sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                    />
                  </Box>
                  
                  <Button
                    variant="contained"
                    onClick={handleTestTransform}
                    disabled={!testData.trim() || isTesting}
                    startIcon={isTesting ? <CircularProgress size={16} /> : <Zap size={16} />}
                  >
                    Test Transformation
                  </Button>
                  
                  {/* Test Results */}
                  {testResult && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                        Transformation Results
                      </Typography>
                      
                      <Stack spacing={2}>
                        {/* Stats */}
                        <Stack direction="row" spacing={2}>
                          <Chip 
                            label={`${testResult.stats.totalRecords} total`} 
                            variant="outlined"
                          />
                          <Chip 
                            label={`${testResult.stats.successfulRecords} success`} 
                            color="success"
                            variant="outlined"
                          />
                          <Chip 
                            label={`${testResult.stats.failedRecords} failed`} 
                            color={testResult.stats.failedRecords > 0 ? 'error' : 'default'}
                            variant="outlined"
                          />
                        </Stack>
                        
                        {/* Errors */}
                        {testResult.errors.length > 0 && (
                          <Alert severity="error">
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Errors:</Typography>
                            <Box component="ul" sx={{ m: 0, pl: 2 }}>
                              {testResult.errors.slice(0, 5).map((error, idx) => (
                                <li key={idx}>
                                  Row {error.recordIndex + 1}: {error.message} (field: {error.field})
                                </li>
                              ))}
                              {testResult.errors.length > 5 && (
                                <li>...and {testResult.errors.length - 5} more errors</li>
                              )}
                            </Box>
                          </Alert>
                        )}
                        
                        {/* Transformed Data Preview */}
                        {testResult.standardizedData.length > 0 && (
                          <Card variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              Transformed Data Preview:
                            </Typography>
                            <Box 
                              component="pre" 
                              sx={{ 
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                                bgcolor: 'action.hover',
                                p: 1.5,
                                borderRadius: 1,
                                overflow: 'auto',
                                maxHeight: 200,
                              }}
                            >
                              {JSON.stringify(testResult.standardizedData.slice(0, 3), null, 2)}
                            </Box>
                          </Card>
                        )}
                      </Stack>
                    </Box>
                  )}
                </>
              )}
            </Stack>
          </TabsContent>
          
          {/* Sync History */}
          <TabsContent value="history" className="mt-0">
            <Stack spacing={2}>
              {syncHistory.length === 0 ? (
                <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                  <Clock className="mx-auto mb-2 opacity-50" size={48} />
                  <Typography color="text.secondary">
                    No sync history yet.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Enable an integration and sync to see history here.
                  </Typography>
                </Card>
              ) : (
                syncHistory.map((result, idx) => (
                  <Card key={idx} variant="outlined">
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box
                            sx={{
                              p: 0.75,
                              borderRadius: 1,
                              bgcolor: result.success ? 'success.light' : 'error.light',
                              color: result.success ? 'success.dark' : 'error.dark',
                            }}
                          >
                            {result.success ? <Check size={16} /> : <X size={16} />}
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {INTEGRATION_ADAPTERS[result.integrationId]?.name || result.integrationId}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(result.timestamp).toLocaleString()}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={1}>
                          <Chip 
                            size="small" 
                            label={`${result.recordsImported} imported`}
                            color="success"
                            variant="outlined"
                          />
                          {result.errors > 0 && (
                            <Chip 
                              size="small" 
                              label={`${result.errors} errors`}
                              color="error"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </PrimaryOffCanvas>
  );
}

// Helper function to generate mock integration data for demo
function generateMockIntegrationData(integrationId: string, count: number): any[] {
  const today = new Date();
  const data: any[] = [];
  
  const adapterMappings: Record<string, () => any> = {
    xplor: () => ({
      booking_date: today.toISOString().split('T')[0],
      session_time: ['06:30-12:30', '12:30-18:30', '06:30-18:30'][Math.floor(Math.random() * 3)],
      room_id: `room-${Math.floor(Math.random() * 4) + 1}`,
      room_name: ['Babies', 'Toddlers', 'Preschool', 'Kindergarten'][Math.floor(Math.random() * 4)],
      booked_children: Math.floor(Math.random() * 15) + 5,
      status: 'confirmed',
    }),
    xap: () => ({
      date: today.toISOString().split('T')[0],
      session: ['AM', 'PM', 'Full Day'][Math.floor(Math.random() * 3)],
      room_id: `room-${Math.floor(Math.random() * 4) + 1}`,
      room_name: ['Nursery', 'Junior Room', 'Kindy', 'Pre-School'][Math.floor(Math.random() * 4)],
      child_count: Math.floor(Math.random() * 18) + 4,
      status: 'confirmed',
    }),
    owna: () => ({
      booking_date: today.toISOString().split('T')[0],
      time_slot: ['06:00-12:00', '12:00-18:00', '06:00-18:00'][Math.floor(Math.random() * 3)],
      room_id: `room-${Math.floor(Math.random() * 4) + 1}`,
      room_name: ['Infants', 'Crawlers', 'Walkers', 'Explorers'][Math.floor(Math.random() * 4)],
      enrolled_children: Math.floor(Math.random() * 16) + 6,
    }),
    kidsoft: () => ({
      attendance_date: today.toISOString().split('T')[0],
      session_type: ['Morning', 'Afternoon', 'Full'][Math.floor(Math.random() * 3)],
      room_code: `R${Math.floor(Math.random() * 4) + 1}`,
      room_description: ['Butterfly Room', 'Rainbow Room', 'Sunshine Room', 'Discovery Room'][Math.floor(Math.random() * 4)],
      booked_count: Math.floor(Math.random() * 20) + 5,
      booking_status: 'confirmed',
    }),
    qikkids: () => ({
      attendance_date: today.toISOString().split('T')[0],
      time_period: ['AM', 'PM', 'Full Day'][Math.floor(Math.random() * 3)],
      class_id: `class-${Math.floor(Math.random() * 4) + 1}`,
      class_name: ['Room A', 'Room B', 'Room C', 'Room D'][Math.floor(Math.random() * 4)],
      enrolled_count: Math.floor(Math.random() * 20) + 8,
    }),
    shopify: () => ({
      created_at: new Date(today.getTime() - Math.random() * 86400000).toISOString(),
      location_id: `loc-${Math.floor(Math.random() * 3) + 1}`,
      location_name: ['Main Floor', 'Electronics', 'Clothing'][Math.floor(Math.random() * 3)],
      customer_count: 1,
    }),
    opentable: () => ({
      reservation_date: today.toISOString().split('T')[0],
      reservation_time: `${Math.floor(Math.random() * 4) + 17}:${['00', '30'][Math.floor(Math.random() * 2)]}`,
      table_section: ['patio', 'main', 'bar'][Math.floor(Math.random() * 3)],
      section_name: ['Patio', 'Main Dining', 'Bar Area'][Math.floor(Math.random() * 3)],
      party_size: Math.floor(Math.random() * 6) + 2,
    }),
    webhook: () => ({
      date: today.toISOString().split('T')[0],
      time_slot: `${Math.floor(Math.random() * 12) + 6}:00-${Math.floor(Math.random() * 12) + 7}:00`,
      zone_id: `zone-${Math.floor(Math.random() * 5) + 1}`,
      zone_name: `Zone ${Math.floor(Math.random() * 5) + 1}`,
      demand: Math.floor(Math.random() * 50) + 10,
    }),
  };
  
  const generator = adapterMappings[integrationId] || adapterMappings.webhook;
  
  for (let i = 0; i < count; i++) {
    data.push(generator());
  }
  
  return data;
}

export default IntegrationManagerModal;
