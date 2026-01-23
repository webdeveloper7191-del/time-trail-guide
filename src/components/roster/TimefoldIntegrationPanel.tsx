import { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  Switch,
  TextField,
  Divider,
  Paper,
  Alert,
  AlertTitle,
  LinearProgress,
  Collapse,
  FormControlLabel,
  InputAdornment,
} from '@mui/material';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Settings,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  Zap,
  Plus,
  Trash2,
  Edit,
  Play,
  Download,
  Upload,
  Link,
  Link2Off,
  Key,
  Globe,
  Clock,
  RefreshCw,
  Eye,
  EyeOff,
  FileJson,
  ArrowRight,
  Copy,
  Activity,
  Server,
  Database,
  Shield,
  AlertCircle,
  Check,
  X,
  PlugZap,
  Webhook,
  Send,
  History,
  TestTube,
} from 'lucide-react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { toast } from 'sonner';
import { useTimefoldIntegration } from '@/hooks/useTimefoldIntegration';
import {
  ApiConnectionConfig,
  DataMappingProfile,
  FieldMappingConfig,
  ImportedConstraintSet,
  WebhookEndpoint,
  API_ENVIRONMENTS,
  SHIFT_ENTITY_FIELDS,
  STAFF_ENTITY_FIELDS,
  WEBHOOK_EVENTS,
  SAMPLE_INPUT_VALUES,
  EnvironmentType,
  SolverEntityType,
  WebhookEventType,
} from '@/lib/timefold/integrationConfig';

interface TimefoldIntegrationPanelProps {
  open: boolean;
  onClose: () => void;
}

const AUTH_TYPES = [
  { value: 'none', label: 'No Authentication' },
  { value: 'api_key', label: 'API Key' },
  { value: 'bearer_token', label: 'Bearer Token' },
  { value: 'basic_auth', label: 'Basic Auth' },
  { value: 'oauth2', label: 'OAuth 2.0' },
];

const TRANSFORM_OPTIONS = [
  { value: 'none', label: 'No Transform' },
  { value: 'to_string', label: 'To String' },
  { value: 'to_number', label: 'To Number' },
  { value: 'to_boolean', label: 'To Boolean' },
  { value: 'to_date', label: 'To Date (YYYY-MM-DD)' },
  { value: 'to_time', label: 'To Time (HH:mm)' },
  { value: 'to_array', label: 'To Array' },
  { value: 'json_parse', label: 'JSON Parse' },
  { value: 'custom', label: 'Custom Script' },
];

const MERGE_STRATEGIES = [
  { value: 'replace_all', label: 'Replace All', description: 'Replace all existing constraints' },
  { value: 'merge_by_id', label: 'Merge by ID', description: 'Update existing, add new' },
  { value: 'add_new_only', label: 'Add New Only', description: 'Only add constraints with new IDs' },
];

export function TimefoldIntegrationPanel({ open, onClose }: TimefoldIntegrationPanelProps) {
  const {
    settings,
    isLoading,
    isTesting,
    testResult,
    activeConnection,
    activeMappingProfile,
    addApiConnection,
    updateApiConnection,
    deleteApiConnection,
    setActiveConnection,
    testApiConnection,
    addSampleConnection,
    addMappingProfile,
    updateMappingProfile,
    deleteMappingProfile,
    setActiveMappingProfile,
    addSampleMappingProfile,
    importConstraintsFromJson,
    deleteConstraintSet,
    updateConstraintSet,
    addWebhookEndpoint,
    updateWebhookEndpoint,
    deleteWebhookEndpoint,
    testWebhook,
    clearWebhookLogs,
    previewTransform,
    updateGlobalSettings,
    resetToDefaults,
    exportSettings,
    importSettings,
  } = useTimefoldIntegration();

  const [activeTab, setActiveTab] = useState('api');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['connection-list']));
  const [constraintJsonInput, setConstraintJsonInput] = useState('');
  const [importName, setImportName] = useState('');
  const [transformPreviewInput, setTransformPreviewInput] = useState('');
  const [previewingMappingId, setPreviewingMappingId] = useState<string | null>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsFileInputRef = useRef<HTMLInputElement>(null);

  // New connection form state
  const [newConnection, setNewConnection] = useState<Partial<ApiConnectionConfig>>({
    name: '',
    environment: 'development',
    endpointUrl: '',
    authType: 'api_key',
    timeoutSeconds: 120,
    retryAttempts: 3,
    retryDelayMs: 1000,
    customHeaders: [],
    isActive: true,
  });

  // New mapping form state
  const [newMapping, setNewMapping] = useState<Partial<DataMappingProfile>>({
    name: '',
    sourceSystem: '',
    shiftMappings: [],
    staffMappings: [],
    validationRules: [],
    isActive: true,
  });

  // New webhook form state
  const [newWebhook, setNewWebhook] = useState<Partial<WebhookEndpoint>>({
    name: '',
    url: '',
    events: [],
    isActive: true,
    retryCount: 3,
    timeoutSeconds: 30,
    headers: [],
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const toggleSecret = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddConnection = () => {
    if (!newConnection.name || !newConnection.endpointUrl) {
      toast.error('Please fill in connection name and endpoint URL');
      return;
    }

    addApiConnection(newConnection as Omit<ApiConnectionConfig, 'id' | 'createdAt' | 'updatedAt'>);
    setNewConnection({
      name: '',
      environment: 'development',
      endpointUrl: '',
      authType: 'api_key',
      timeoutSeconds: 120,
      retryAttempts: 3,
      retryDelayMs: 1000,
      customHeaders: [],
      isActive: true,
    });
    setExpandedSections(prev => new Set([...prev, 'connection-list']));
  };

  const handleTestConnection = async (connection: ApiConnectionConfig) => {
    const result = await testApiConnection(connection);
    if (result.success) {
      toast.success(`Connection test passed (${result.responseTimeMs}ms)`);
    } else {
      toast.error(`Connection test failed: ${result.error}`);
    }
  };

  const handleImportConstraints = () => {
    if (!constraintJsonInput.trim()) {
      toast.error('Please paste constraint JSON');
      return;
    }
    if (!importName.trim()) {
      toast.error('Please provide a name for the import');
      return;
    }

    const result = importConstraintsFromJson(constraintJsonInput, importName);
    if (result) {
      setConstraintJsonInput('');
      setImportName('');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setConstraintJsonInput(content);
      setImportName(file.name.replace('.json', ''));
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleSettingsFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      importSettings(content);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleAddFieldMapping = (profileId: string, entityType: SolverEntityType) => {
    const profile = settings.mappingProfiles.find(p => p.id === profileId);
    if (!profile) return;

    const newMapping: FieldMappingConfig = {
      id: `fm-${Date.now()}`,
      sourceField: '',
      targetField: entityType === 'shift' ? 'id' : 'id',
      targetEntity: entityType,
      transform: 'none',
      isRequired: false,
      isActive: true,
    };

    if (entityType === 'shift') {
      updateMappingProfile(profileId, {
        shiftMappings: [...profile.shiftMappings, newMapping],
      });
    } else {
      updateMappingProfile(profileId, {
        staffMappings: [...profile.staffMappings, newMapping],
      });
    }
  };

  const renderApiConnectionTab = () => (
    <Box sx={{ p: 2 }}>
      {/* Security Warning */}
      <Alert severity="warning" sx={{ mb: 3 }}>
        <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Shield className="h-4 w-4" />
          Browser-Only Storage
        </AlertTitle>
        <Typography variant="body2">
          API credentials are stored in your browser's localStorage. For production use, 
          we recommend enabling Lovable Cloud for secure server-side credential storage.
        </Typography>
      </Alert>

      {/* Active Connection Status */}
      {activeConnection && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'success.main', color: 'success.contrastText' }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <PlugZap className="h-5 w-5" />
            <Box flex={1}>
              <Typography variant="subtitle2">Active Connection</Typography>
              <Typography variant="body2">{activeConnection.name} ({activeConnection.environment})</Typography>
            </Box>
            <Chip
              label={activeConnection.lastHealthCheck?.status || 'unknown'}
              size="small"
              color={activeConnection.lastHealthCheck?.status === 'healthy' ? 'success' : 'warning'}
            />
          </Stack>
        </Paper>
      )}

      {/* Existing Connections */}
      <Box sx={{ mb: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          onClick={() => toggleSection('connection-list')}
          sx={{ cursor: 'pointer', py: 1 }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            API Connections ({settings.apiConnections.length})
          </Typography>
          {expandedSections.has('connection-list') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Stack>

        <Collapse in={expandedSections.has('connection-list')}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {settings.apiConnections.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'action.hover' }}>
                <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <Typography variant="body2" color="text.secondary">
                  No API connections configured
                </Typography>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSampleConnection}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Sample Connection
                </Button>
              </Paper>
            ) : (
              settings.apiConnections.map(connection => (
                <Paper key={connection.id} sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: connection.lastHealthCheck?.status === 'healthy' ? 'success.main' : 'warning.main',
                      }}
                    />
                    <Box flex={1}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle2">{connection.name}</Typography>
                        <Chip
                          label={connection.environment}
                          size="small"
                          sx={{
                            bgcolor: API_ENVIRONMENTS.find(e => e.id === connection.environment)?.color,
                            color: 'white',
                            fontSize: '0.65rem',
                            height: 18,
                          }}
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {connection.endpointUrl}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        size="small"
                        onClick={() => handleTestConnection(connection)}
                        disabled={isTesting}
                      >
                        <Activity className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setActiveConnection(connection.id)}
                        color={settings.activeConnectionId === connection.id ? 'primary' : 'default'}
                      >
                        {settings.activeConnectionId === connection.id ? (
                          <Link className="h-4 w-4" />
                        ) : (
                          <Link2Off className="h-4 w-4" />
                        )}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => deleteApiConnection(connection.id)}
                        color="error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </Stack>
                  </Stack>

                  {/* Health check info */}
                  {connection.lastHealthCheck && (
                    <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Last check: {new Date(connection.lastHealthCheck.timestamp).toLocaleString()}
                        </Typography>
                        {connection.lastHealthCheck.responseTimeMs && (
                          <Typography variant="caption" color="text.secondary">
                            Response: {connection.lastHealthCheck.responseTimeMs}ms
                          </Typography>
                        )}
                        {connection.lastHealthCheck.status === 'healthy' ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-amber-600" />
                        )}
                      </Stack>
                    </Box>
                  )}
                </Paper>
              ))
            )}
          </Stack>
        </Collapse>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Add New Connection Form */}
      <Box>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          onClick={() => toggleSection('new-connection')}
          sx={{ cursor: 'pointer', py: 1 }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            <Plus className="h-4 w-4 inline mr-1" />
            Add New Connection
          </Typography>
          {expandedSections.has('new-connection') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Stack>

        <Collapse in={expandedSections.has('new-connection')}>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Box>
              <Label htmlFor="conn-name">Connection Name</Label>
              <Input
                id="conn-name"
                placeholder="e.g., Production Timefold API"
                value={newConnection.name || ''}
                onChange={e => setNewConnection(prev => ({ ...prev, name: e.target.value }))}
              />
            </Box>

            <Box>
              <Label htmlFor="conn-env">Environment</Label>
              <Select
                value={newConnection.environment}
                onValueChange={value => setNewConnection(prev => ({ ...prev, environment: value as EnvironmentType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  {API_ENVIRONMENTS.map(env => (
                    <SelectItem key={env.id} value={env.id}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box className={`w-2 h-2 rounded-full ${env.color}`} />
                        <span>{env.name}</span>
                      </Stack>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Box>

            <Box>
              <Label htmlFor="conn-url">Endpoint URL</Label>
              <Input
                id="conn-url"
                placeholder="https://api.example.com/v1/solver"
                value={newConnection.endpointUrl || ''}
                onChange={e => setNewConnection(prev => ({ ...prev, endpointUrl: e.target.value }))}
              />
            </Box>

            <Box>
              <Label htmlFor="conn-auth">Authentication Type</Label>
              <Select
                value={newConnection.authType}
                onValueChange={value => setNewConnection(prev => ({ ...prev, authType: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select auth type" />
                </SelectTrigger>
                <SelectContent>
                  {AUTH_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Box>

            {newConnection.authType === 'api_key' && (
              <Box>
                <Label htmlFor="conn-apikey">API Key</Label>
                <div className="relative">
                  <Input
                    id="conn-apikey"
                    type={showSecrets['new-apikey'] ? 'text' : 'password'}
                    placeholder="Enter API key"
                    value={newConnection.apiKey || ''}
                    onChange={e => setNewConnection(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => toggleSecret('new-apikey')}
                  >
                    {showSecrets['new-apikey'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Box>
            )}

            {newConnection.authType === 'bearer_token' && (
              <Box>
                <Label htmlFor="conn-token">Bearer Token</Label>
                <div className="relative">
                  <Input
                    id="conn-token"
                    type={showSecrets['new-token'] ? 'text' : 'password'}
                    placeholder="Enter bearer token"
                    value={newConnection.bearerToken || ''}
                    onChange={e => setNewConnection(prev => ({ ...prev, bearerToken: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => toggleSecret('new-token')}
                  >
                    {showSecrets['new-token'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Box>
            )}

            <Stack direction="row" spacing={2}>
              <Box flex={1}>
                <Label htmlFor="conn-timeout">Timeout (seconds)</Label>
                <Input
                  id="conn-timeout"
                  type="number"
                  min={1}
                  max={300}
                  value={newConnection.timeoutSeconds || 120}
                  onChange={e => setNewConnection(prev => ({ ...prev, timeoutSeconds: parseInt(e.target.value) || 120 }))}
                />
              </Box>
              <Box flex={1}>
                <Label htmlFor="conn-retries">Retry Attempts</Label>
                <Input
                  id="conn-retries"
                  type="number"
                  min={0}
                  max={10}
                  value={newConnection.retryAttempts || 3}
                  onChange={e => setNewConnection(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) || 3 }))}
                />
              </Box>
            </Stack>

            <Button onClick={handleAddConnection} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </Stack>
        </Collapse>
      </Box>
    </Box>
  );

  const renderDataMappingTab = () => (
    <Box sx={{ p: 2 }}>
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Data Mapping Configuration</AlertTitle>
        <Typography variant="body2">
          Configure how external system fields map to Timefold solver entities. 
          This enables automatic data transformation from HR, booking, and payroll systems.
        </Typography>
      </Alert>

      {/* Existing Mapping Profiles */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Mapping Profiles ({settings.mappingProfiles.length})
          </Typography>
          <Button variant="outline" size="sm" onClick={addSampleMappingProfile}>
            <Plus className="h-4 w-4 mr-1" />
            Add Sample
          </Button>
        </Stack>

        {settings.mappingProfiles.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'action.hover' }}>
            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <Typography variant="body2" color="text.secondary">
              No mapping profiles configured
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {settings.mappingProfiles.map(profile => (
              <Paper key={profile.id} sx={{ overflow: 'hidden' }}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: settings.activeMappingProfileId === profile.id ? 'primary.main' : 'background.paper',
                    color: settings.activeMappingProfileId === profile.id ? 'primary.contrastText' : 'text.primary',
                    cursor: 'pointer',
                  }}
                  onClick={() => setEditingMappingId(editingMappingId === profile.id ? null : profile.id)}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box flex={1}>
                      <Typography variant="subtitle2">{profile.name}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Source: {profile.sourceSystem} | {profile.shiftMappings.length} shift mappings, {profile.staffMappings.length} staff mappings
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMappingProfile(settings.activeMappingProfileId === profile.id ? undefined : profile.id);
                        }}
                        sx={{ color: 'inherit' }}
                      >
                        {settings.activeMappingProfileId === profile.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Link className="h-4 w-4" />
                        )}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMappingProfile(profile.id);
                        }}
                        sx={{ color: 'inherit' }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Box>

                <Collapse in={editingMappingId === profile.id}>
                  <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                    {/* Shift Mappings */}
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Shift Field Mappings
                    </Typography>
                    <Stack spacing={1} sx={{ mb: 2 }}>
                      {profile.shiftMappings.map((mapping, idx) => (
                        <Paper key={mapping.id} sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Input
                              placeholder="Source field"
                              value={mapping.sourceField}
                              onChange={e => {
                                const updated = [...profile.shiftMappings];
                                updated[idx] = { ...mapping, sourceField: e.target.value };
                                updateMappingProfile(profile.id, { shiftMappings: updated });
                              }}
                              className="flex-1"
                            />
                            <ArrowRight className="h-4 w-4 shrink-0" />
                            <Select
                              value={mapping.targetField}
                              onValueChange={value => {
                                const updated = [...profile.shiftMappings];
                                updated[idx] = { ...mapping, targetField: value };
                                updateMappingProfile(profile.id, { shiftMappings: updated });
                              }}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SHIFT_ENTITY_FIELDS.map(field => (
                                  <SelectItem key={field.field} value={field.field}>
                                    {field.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={mapping.transform || 'none'}
                              onValueChange={value => {
                                const updated = [...profile.shiftMappings];
                                updated[idx] = { ...mapping, transform: value as any };
                                updateMappingProfile(profile.id, { shiftMappings: updated });
                              }}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TRANSFORM_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <IconButton
                              size="small"
                              onClick={() => {
                                const updated = profile.shiftMappings.filter((_, i) => i !== idx);
                                updateMappingProfile(profile.id, { shiftMappings: updated });
                              }}
                            >
                              <X className="h-4 w-4" />
                            </IconButton>
                          </Stack>
                        </Paper>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddFieldMapping(profile.id, 'shift')}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Shift Mapping
                      </Button>
                    </Stack>

                    {/* Staff Mappings */}
                    <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
                      Staff Field Mappings
                    </Typography>
                    <Stack spacing={1}>
                      {profile.staffMappings.map((mapping, idx) => (
                        <Paper key={mapping.id} sx={{ p: 1.5, bgcolor: 'action.hover' }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Input
                              placeholder="Source field"
                              value={mapping.sourceField}
                              onChange={e => {
                                const updated = [...profile.staffMappings];
                                updated[idx] = { ...mapping, sourceField: e.target.value };
                                updateMappingProfile(profile.id, { staffMappings: updated });
                              }}
                              className="flex-1"
                            />
                            <ArrowRight className="h-4 w-4 shrink-0" />
                            <Select
                              value={mapping.targetField}
                              onValueChange={value => {
                                const updated = [...profile.staffMappings];
                                updated[idx] = { ...mapping, targetField: value };
                                updateMappingProfile(profile.id, { staffMappings: updated });
                              }}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STAFF_ENTITY_FIELDS.map(field => (
                                  <SelectItem key={field.field} value={field.field}>
                                    {field.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={mapping.transform || 'none'}
                              onValueChange={value => {
                                const updated = [...profile.staffMappings];
                                updated[idx] = { ...mapping, transform: value as any };
                                updateMappingProfile(profile.id, { staffMappings: updated });
                              }}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TRANSFORM_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <IconButton
                              size="small"
                              onClick={() => {
                                const updated = profile.staffMappings.filter((_, i) => i !== idx);
                                updateMappingProfile(profile.id, { staffMappings: updated });
                              }}
                            >
                              <X className="h-4 w-4" />
                            </IconButton>
                          </Stack>
                        </Paper>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddFieldMapping(profile.id, 'staff')}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Staff Mapping
                      </Button>
                    </Stack>
                  </Box>
                </Collapse>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Transform Preview */}
      <Box sx={{ mb: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          onClick={() => toggleSection('transform-preview')}
          sx={{ cursor: 'pointer', py: 1 }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            <TestTube className="h-4 w-4 inline mr-1" />
            Transform Preview
          </Typography>
          {expandedSections.has('transform-preview') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Stack>

        <Collapse in={expandedSections.has('transform-preview')}>
          <Paper sx={{ p: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Test how transforms will process your source data. Enter a sample input and select a transform to see the result.
            </Typography>
            
            <Stack spacing={2}>
              <Box>
                <Label htmlFor="preview-input">Sample Input</Label>
                <Input
                  id="preview-input"
                  placeholder="Enter sample value to transform..."
                  value={transformPreviewInput}
                  onChange={e => setTransformPreviewInput(e.target.value)}
                />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  {Object.entries(SAMPLE_INPUT_VALUES).map(([key, value]) => (
                    <Chip
                      key={key}
                      label={key}
                      size="small"
                      variant="outlined"
                      onClick={() => setTransformPreviewInput(value)}
                      sx={{ cursor: 'pointer', fontSize: '0.65rem' }}
                    />
                  ))}
                </Box>
              </Box>

              {transformPreviewInput && (
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
                    Transform Results
                  </Typography>
                  <Stack spacing={1}>
                    {TRANSFORM_OPTIONS.filter(opt => opt.value !== 'custom').map(opt => {
                      const result = previewTransform(transformPreviewInput, opt.value as any);
                      return (
                        <Stack key={opt.value} direction="row" spacing={2} alignItems="center">
                          <Typography variant="caption" sx={{ width: 100, fontWeight: 500 }}>
                            {opt.label}:
                          </Typography>
                          {result.success ? (
                            <Paper sx={{ px: 1, py: 0.5, bgcolor: 'success.light', flex: 1 }}>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'success.dark' }}>
                                {result.output.length > 50 ? result.output.substring(0, 50) + '...' : result.output}
                              </Typography>
                            </Paper>
                          ) : (
                            <Paper sx={{ px: 1, py: 0.5, bgcolor: 'error.light', flex: 1 }}>
                              <Typography variant="caption" sx={{ color: 'error.dark' }}>
                                ❌ {result.error}
                              </Typography>
                            </Paper>
                          )}
                        </Stack>
                      );
                    })}
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Paper>
        </Collapse>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Available Fields Reference */}
      <Box>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          onClick={() => toggleSection('field-reference')}
          sx={{ cursor: 'pointer', py: 1 }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            <Info className="h-4 w-4 inline mr-1" />
            Field Reference
          </Typography>
          {expandedSections.has('field-reference') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Stack>

        <Collapse in={expandedSections.has('field-reference')}>
          <Paper sx={{ p: 2, mt: 1 }}>
            <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
              Shift Entity Fields
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              {SHIFT_ENTITY_FIELDS.map(field => (
                <Chip
                  key={field.field}
                  label={`${field.label}${field.required ? '*' : ''}`}
                  size="small"
                  variant={field.required ? 'filled' : 'outlined'}
                  color={field.required ? 'primary' : 'default'}
                />
              ))}
            </Box>

            <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
              Staff Entity Fields
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {STAFF_ENTITY_FIELDS.map(field => (
                <Chip
                  key={field.field}
                  label={`${field.label}${field.required ? '*' : ''}`}
                  size="small"
                  variant={field.required ? 'filled' : 'outlined'}
                  color={field.required ? 'primary' : 'default'}
                />
              ))}
            </Box>
          </Paper>
        </Collapse>
      </Box>
    </Box>
  );

  const renderConstraintImportTab = () => (
    <Box sx={{ p: 2 }}>
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>External Constraint Import</AlertTitle>
        <Typography variant="body2">
          Import custom constraints from external MDM systems or JSON files. 
          Imported constraints can merge with or replace existing solver constraints.
        </Typography>
      </Alert>

      {/* Imported Constraint Sets */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Imported Constraint Sets ({settings.importedConstraintSets.length})
        </Typography>

        {settings.importedConstraintSets.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'action.hover' }}>
            <FileJson className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <Typography variant="body2" color="text.secondary">
              No constraint sets imported
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {settings.importedConstraintSets.map(set => (
              <Paper key={set.id} sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      bgcolor: set.isValid ? 'success.main' : 'error.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    {set.isValid ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  </Box>
                  <Box flex={1}>
                    <Typography variant="subtitle2">{set.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {set.constraints.length} constraints | {set.mergeStrategy.replace('_', ' ')} | 
                      Imported {new Date(set.lastImportedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <Select
                      value={set.mergeStrategy}
                      onValueChange={value => updateConstraintSet(set.id, { mergeStrategy: value as any })}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MERGE_STRATEGIES.map(strategy => (
                          <SelectItem key={strategy.value} value={strategy.value}>
                            {strategy.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <IconButton
                      size="small"
                      onClick={() => deleteConstraintSet(set.id)}
                      color="error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </Stack>
                </Stack>

                {/* Show constraints preview */}
                <Collapse in={true}>
                  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                      Constraints Preview
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {set.constraints.slice(0, 10).map(constraint => (
                        <Chip
                          key={constraint.id}
                          label={constraint.name}
                          size="small"
                          color={constraint.level === 'HARD' ? 'error' : constraint.level === 'MEDIUM' ? 'warning' : 'info'}
                          variant="outlined"
                        />
                      ))}
                      {set.constraints.length > 10 && (
                        <Chip label={`+${set.constraints.length - 10} more`} size="small" variant="outlined" />
                      )}
                    </Box>
                  </Box>
                </Collapse>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Import New Constraints */}
      <Box>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          <Upload className="h-4 w-4 inline mr-1" />
          Import New Constraints
        </Typography>

        <Stack spacing={2}>
          <Box>
            <Label htmlFor="import-name">Import Name</Label>
            <Input
              id="import-name"
              placeholder="e.g., Custom NQF Rules v2"
              value={importName}
              onChange={e => setImportName(e.target.value)}
            />
          </Box>

          <Box>
            <Label>Constraint JSON</Label>
            <Textarea
              placeholder={`Paste JSON array of constraints, e.g:
[
  {
    "id": "custom-ratio-001",
    "name": "Custom Babies Ratio",
    "level": "HARD",
    "weight": 1,
    "enabled": true,
    "category": "ratio",
    "description": "1:3 ratio for under-24-month room"
  }
]`}
              value={constraintJsonInput}
              onChange={e => setConstraintJsonInput(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload JSON File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={handleImportConstraints}
              disabled={!constraintJsonInput.trim() || !importName.trim()}
            >
              <FileJson className="h-4 w-4 mr-2" />
              Import Constraints
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Sample JSON Reference */}
      <Box sx={{ mt: 3 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          onClick={() => toggleSection('json-reference')}
          sx={{ cursor: 'pointer', py: 1 }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            <Info className="h-4 w-4 inline mr-1" />
            JSON Schema Reference
          </Typography>
          {expandedSections.has('json-reference') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Stack>

        <Collapse in={expandedSections.has('json-reference')}>
          <Paper sx={{ p: 2, mt: 1, bgcolor: 'grey.900' }}>
            <pre className="text-xs text-green-400 overflow-auto">
{`{
  "id": "string (required)",
  "name": "string (required)",
  "description": "string",
  "category": "availability | qualification | capacity | fairness | cost | preference | compliance | continuity",
  "level": "HARD | MEDIUM | SOFT (required)",
  "weight": "number (required)",
  "enabled": "boolean (required)",
  "parameters": {
    "paramName": {
      "key": "string",
      "label": "string",
      "type": "number | boolean | string | select",
      "value": "any"
    }
  }
}`}
            </pre>
          </Paper>
        </Collapse>
      </Box>
    </Box>
  );

  const renderWebhooksTab = () => (
    <Box sx={{ p: 2 }}>
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Webhook Callbacks</AlertTitle>
        <Typography variant="body2">
          Configure webhook endpoints to receive real-time notifications when solver events occur.
          External systems can receive data updates and solver results automatically.
        </Typography>
      </Alert>

      {/* Enable Webhooks Toggle */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.enableWebhooks}
              onChange={(e) => updateGlobalSettings({ enableWebhooks: e.target.checked })}
            />
          }
          label={
            <Stack>
              <Typography variant="subtitle2">Enable Webhooks</Typography>
              <Typography variant="caption" color="text.secondary">
                Allow outbound webhook calls when events occur
              </Typography>
            </Stack>
          }
        />
      </Paper>

      {/* Webhook Endpoints */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Webhook Endpoints ({settings.webhookEndpoints.length})
        </Typography>

        {settings.webhookEndpoints.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'action.hover' }}>
            <Webhook className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <Typography variant="body2" color="text.secondary">
              No webhook endpoints configured
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {settings.webhookEndpoints.map(endpoint => (
              <Paper key={endpoint.id} sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: endpoint.isActive 
                        ? (endpoint.lastStatus === 'success' ? 'success.main' : endpoint.lastStatus === 'failed' ? 'error.main' : 'grey.400')
                        : 'grey.400',
                    }}
                  />
                  <Box flex={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle2">{endpoint.name}</Typography>
                      {!endpoint.isActive && (
                        <Chip label="Disabled" size="small" color="default" />
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {endpoint.url}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {endpoint.events.slice(0, 3).map(event => (
                        <Chip key={event} label={event} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
                      ))}
                      {endpoint.events.length > 3 && (
                        <Chip label={`+${endpoint.events.length - 3}`} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
                      )}
                    </Box>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      onClick={async () => {
                        setIsTestingWebhook(endpoint.id);
                        const result = await testWebhook(endpoint);
                        setIsTestingWebhook(null);
                        if (result.success) {
                          toast.success(result.message);
                        } else {
                          toast.error(result.message);
                        }
                      }}
                      disabled={isTestingWebhook === endpoint.id}
                    >
                      <TestTube className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => updateWebhookEndpoint(endpoint.id, { isActive: !endpoint.isActive })}
                      color={endpoint.isActive ? 'primary' : 'default'}
                    >
                      {endpoint.isActive ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => deleteWebhookEndpoint(endpoint.id)}
                      color="error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </Stack>
                </Stack>

                {/* Last trigger info */}
                {endpoint.lastTriggeredAt && (
                  <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        Last triggered: {new Date(endpoint.lastTriggeredAt).toLocaleString()}
                      </Typography>
                      {endpoint.lastStatus === 'success' ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : endpoint.lastStatus === 'failed' ? (
                        <AlertCircle className="h-3 w-3 text-red-600" />
                      ) : null}
                      {endpoint.lastError && (
                        <Typography variant="caption" color="error.main">
                          {endpoint.lastError}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                )}
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Add New Webhook */}
      <Box>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          onClick={() => toggleSection('new-webhook')}
          sx={{ cursor: 'pointer', py: 1 }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            <Plus className="h-4 w-4 inline mr-1" />
            Add New Webhook
          </Typography>
          {expandedSections.has('new-webhook') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Stack>

        <Collapse in={expandedSections.has('new-webhook')}>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Box>
              <Label htmlFor="webhook-name">Webhook Name</Label>
              <Input
                id="webhook-name"
                placeholder="e.g., Slack Notifications"
                value={newWebhook.name || ''}
                onChange={e => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
              />
            </Box>

            <Box>
              <Label htmlFor="webhook-url">Endpoint URL</Label>
              <Input
                id="webhook-url"
                placeholder="https://api.example.com/webhooks/solver"
                value={newWebhook.url || ''}
                onChange={e => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
              />
            </Box>

            <Box>
              <Label>Events to Subscribe</Label>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {WEBHOOK_EVENTS.map(event => (
                  <Chip
                    key={event.type}
                    label={event.label}
                    size="small"
                    variant={newWebhook.events?.includes(event.type) ? 'filled' : 'outlined'}
                    color={newWebhook.events?.includes(event.type) ? 'primary' : 'default'}
                    onClick={() => {
                      const events = newWebhook.events || [];
                      if (events.includes(event.type)) {
                        setNewWebhook(prev => ({ ...prev, events: events.filter(e => e !== event.type) }));
                      } else {
                        setNewWebhook(prev => ({ ...prev, events: [...events, event.type] }));
                      }
                    }}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Label htmlFor="webhook-secret">Secret (optional)</Label>
              <div className="relative">
                <Input
                  id="webhook-secret"
                  type={showSecrets['webhook-secret'] ? 'text' : 'password'}
                  placeholder="Webhook signing secret"
                  value={newWebhook.secret || ''}
                  onChange={e => setNewWebhook(prev => ({ ...prev, secret: e.target.value }))}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => toggleSecret('webhook-secret')}
                >
                  {showSecrets['webhook-secret'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Box>

            <Stack direction="row" spacing={2}>
              <Box flex={1}>
                <Label htmlFor="webhook-timeout">Timeout (seconds)</Label>
                <Input
                  id="webhook-timeout"
                  type="number"
                  min={5}
                  max={120}
                  value={newWebhook.timeoutSeconds || 30}
                  onChange={e => setNewWebhook(prev => ({ ...prev, timeoutSeconds: parseInt(e.target.value) || 30 }))}
                />
              </Box>
              <Box flex={1}>
                <Label htmlFor="webhook-retries">Retry Count</Label>
                <Input
                  id="webhook-retries"
                  type="number"
                  min={0}
                  max={10}
                  value={newWebhook.retryCount || 3}
                  onChange={e => setNewWebhook(prev => ({ ...prev, retryCount: parseInt(e.target.value) || 3 }))}
                />
              </Box>
            </Stack>

            <Button
              onClick={() => {
                if (!newWebhook.name || !newWebhook.url) {
                  toast.error('Please fill in webhook name and URL');
                  return;
                }
                if (!newWebhook.events || newWebhook.events.length === 0) {
                  toast.error('Please select at least one event');
                  return;
                }
                addWebhookEndpoint(newWebhook as Omit<WebhookEndpoint, 'id' | 'createdAt' | 'updatedAt'>);
                setNewWebhook({
                  name: '',
                  url: '',
                  events: [],
                  isActive: true,
                  retryCount: 3,
                  timeoutSeconds: 30,
                  headers: [],
                });
              }}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </Stack>
        </Collapse>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Recent Webhook Logs */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            <History className="h-4 w-4 inline mr-1" />
            Recent Logs ({settings.webhookLogs.length})
          </Typography>
          {settings.webhookLogs.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearWebhookLogs}>
              Clear Logs
            </Button>
          )}
        </Stack>

        {settings.webhookLogs.length === 0 ? (
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary">
              No webhook logs yet
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1}>
            {settings.webhookLogs.slice(0, 10).map(log => (
              <Paper key={log.id} sx={{ p: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: log.status === 'success' ? 'success.main' : log.status === 'failed' ? 'error.main' : 'warning.main',
                    }}
                  />
                  <Chip label={log.eventType} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </Typography>
                  {log.duration && (
                    <Typography variant="caption" color="text.secondary">
                      {log.duration}ms
                    </Typography>
                  )}
                  {log.responseStatus && (
                    <Chip
                      label={log.responseStatus}
                      size="small"
                      color={log.responseStatus < 400 ? 'success' : 'error'}
                      sx={{ fontSize: '0.6rem', height: 16 }}
                    />
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Timefold Integration Settings"
      description="Configure API connections, data mappings, webhooks, and external constraints"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Loading bar */}
        {(isLoading || isTesting) && <LinearProgress />}

        <ScrollArea className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full sticky top-0 z-10 bg-background">
              <TabsTrigger value="api" className="flex-1">
                <Server className="h-3 w-3 mr-1" />
                API
              </TabsTrigger>
              <TabsTrigger value="mapping" className="flex-1">
                <Database className="h-3 w-3 mr-1" />
                Mapping
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="flex-1">
                <Webhook className="h-3 w-3 mr-1" />
                Webhooks
              </TabsTrigger>
              <TabsTrigger value="constraints" className="flex-1">
                <FileJson className="h-3 w-3 mr-1" />
                Constraints
              </TabsTrigger>
            </TabsList>

            <TabsContent value="api">{renderApiConnectionTab()}</TabsContent>
            <TabsContent value="mapping">{renderDataMappingTab()}</TabsContent>
            <TabsContent value="webhooks">{renderWebhooksTab()}</TabsContent>
            <TabsContent value="constraints">{renderConstraintImportTab()}</TabsContent>
          </Tabs>
        </ScrollArea>

        {/* Footer Actions */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Stack direction="row" spacing={1}>
              <Button variant="outline" size="sm" onClick={exportSettings}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => settingsFileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>
              <input
                ref={settingsFileInputRef}
                type="file"
                accept=".json"
                onChange={handleSettingsFileUpload}
                className="hidden"
              />
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button variant="outline" size="sm" onClick={resetToDefaults}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button size="sm" onClick={onClose}>
                <Save className="h-4 w-4 mr-1" />
                Done
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </PrimaryOffCanvas>
  );
}
