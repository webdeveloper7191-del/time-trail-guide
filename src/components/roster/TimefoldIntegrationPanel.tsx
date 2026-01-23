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
} from 'lucide-react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { toast } from 'sonner';
import { useTimefoldIntegration } from '@/hooks/useTimefoldIntegration';
import {
  ApiConnectionConfig,
  DataMappingProfile,
  FieldMappingConfig,
  ImportedConstraintSet,
  API_ENVIRONMENTS,
  SHIFT_ENTITY_FIELDS,
  STAFF_ENTITY_FIELDS,
  EnvironmentType,
  SolverEntityType,
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

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Timefold Integration Settings"
      description="Configure API connections, data mappings, and external constraints"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Loading bar */}
        {(isLoading || isTesting) && <LinearProgress />}

        <ScrollArea className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full sticky top-0 z-10 bg-background">
              <TabsTrigger value="api" className="flex-1">
                <Server className="h-4 w-4 mr-1" />
                API
              </TabsTrigger>
              <TabsTrigger value="mapping" className="flex-1">
                <Database className="h-4 w-4 mr-1" />
                Mapping
              </TabsTrigger>
              <TabsTrigger value="constraints" className="flex-1">
                <FileJson className="h-4 w-4 mr-1" />
                Constraints
              </TabsTrigger>
            </TabsList>

            <TabsContent value="api">{renderApiConnectionTab()}</TabsContent>
            <TabsContent value="mapping">{renderDataMappingTab()}</TabsContent>
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
