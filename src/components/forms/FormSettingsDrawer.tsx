import { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  IconButton,
  Drawer,
  Switch,
  FormControlLabel,
  Divider,
  Button as MuiButton,
  Alert,
  Tabs,
  Tab,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  X,
  Settings,
  Palette,
  Image,
  Building2,
  Upload,
  Link2,
  Info,
  FileSignature,
  Camera,
  Wifi,
  CheckCircle,
  ListTodo,
  AlertTriangle,
} from 'lucide-react';
import { FormTemplate } from '@/types/forms';
import { toast } from 'sonner';

interface FormSettingsDrawerProps {
  open: boolean;
  template: FormTemplate;
  onClose: () => void;
  onSave: (updates: Partial<FormTemplate>) => void;
}

// Mock business settings - in real app would come from a context/API
const MOCK_BUSINESS_SETTINGS = {
  name: 'Acme Healthcare Services',
  logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop&auto=format',
  primaryColor: '#2563eb',
  address: '123 Business Street, Sydney NSW 2000',
};

export function FormSettingsDrawer({
  open,
  template,
  onClose,
  onSave,
}: FormSettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState(0);
  
  // Branding state
  const [headerTitle, setHeaderTitle] = useState('');
  const [headerSubtitle, setHeaderSubtitle] = useState('');
  const [logoSource, setLogoSource] = useState<'business' | 'custom' | 'none'>('none');
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [headerImageUrl, setHeaderImageUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [useBusinessColor, setUseBusinessColor] = useState(false);

  // Settings state
  const [allowDrafts, setAllowDrafts] = useState(true);
  const [requireSignature, setRequireSignature] = useState(false);
  const [requirePhoto, setRequirePhoto] = useState(false);
  const [offlineEnabled, setOfflineEnabled] = useState(true);
  const [reviewRequired, setReviewRequired] = useState(false);
  const [autoCreateTask, setAutoCreateTask] = useState(false);

  useEffect(() => {
    if (template && open) {
      // Load branding
      const branding = template.branding || {};
      setHeaderTitle(template.name || '');
      setHeaderSubtitle(template.description || '');
      setCustomLogoUrl(branding.logo || '');
      setHeaderImageUrl(branding.headerImage || '');
      setPrimaryColor(branding.primaryColor || '#2563eb');
      
      // Detect logo source
      if (branding.logo === MOCK_BUSINESS_SETTINGS.logo) {
        setLogoSource('business');
      } else if (branding.logo) {
        setLogoSource('custom');
      } else {
        setLogoSource('none');
      }

      setUseBusinessColor(branding.primaryColor === MOCK_BUSINESS_SETTINGS.primaryColor);

      // Load settings
      const settings = template.settings || {};
      setAllowDrafts(settings.allowDrafts ?? true);
      setRequireSignature(settings.requireSignature ?? false);
      setRequirePhoto(settings.requirePhoto ?? false);
      setOfflineEnabled(settings.offlineEnabled ?? true);
      setReviewRequired(settings.reviewRequired ?? false);
      setAutoCreateTask(settings.autoCreateTask ?? false);
    }
  }, [template, open]);

  const getLogo = (): string | undefined => {
    switch (logoSource) {
      case 'business':
        return MOCK_BUSINESS_SETTINGS.logo;
      case 'custom':
        return customLogoUrl || undefined;
      default:
        return undefined;
    }
  };

  const getColor = (): string | undefined => {
    if (useBusinessColor) {
      return MOCK_BUSINESS_SETTINGS.primaryColor;
    }
    return primaryColor || undefined;
  };

  const handleSave = () => {
    const updates: Partial<FormTemplate> = {
      branding: {
        logo: getLogo(),
        headerImage: headerImageUrl || undefined,
        primaryColor: getColor(),
      },
      settings: {
        allowDrafts,
        requireSignature,
        requirePhoto,
        offlineEnabled,
        reviewRequired,
        autoCreateTask,
      },
    };

    onSave(updates);
    toast.success('Form settings saved');
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 480 } }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Settings size={18} />
              <Typography variant="h6" fontWeight={600}>
                Form Settings
              </Typography>
            </Stack>
            <IconButton size="small" onClick={onClose}>
              <X size={18} />
            </IconButton>
          </Stack>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab 
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Palette size={14} />
                <span>Branding</span>
              </Stack>
            } 
          />
          <Tab 
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Settings size={14} />
                <span>Behavior</span>
              </Stack>
            } 
          />
        </Tabs>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {/* Branding Tab */}
          {activeTab === 0 && (
            <Box sx={{ p: 3 }}>
              <Stack spacing={3}>
                {/* Header Preview */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                    Form Header Preview
                  </Typography>
                  <Box
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      overflow: 'hidden',
                      bgcolor: 'grey.50',
                    }}
                  >
                    {/* Header Image */}
                    {headerImageUrl && (
                      <Box
                        sx={{
                          height: 100,
                          backgroundImage: `url(${headerImageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                    )}
                    
                    {/* Logo & Title */}
                    <Box sx={{ p: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        {getLogo() && (
                          <Box
                            component="img"
                            src={getLogo()}
                            alt="Logo"
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 1,
                              objectFit: 'cover',
                            }}
                          />
                        )}
                        <Box>
                          <Typography 
                            variant="subtitle1" 
                            fontWeight={600}
                            sx={{ color: getColor() || 'text.primary' }}
                          >
                            {headerTitle || template.name || 'Form Title'}
                          </Typography>
                          {headerSubtitle && (
                            <Typography variant="caption" color="text.secondary">
                              {headerSubtitle}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Box>
                  </Box>
                </Box>

                <Divider />

                {/* Logo Settings */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Image size={14} />
                      <span>Logo</span>
                    </Stack>
                  </Typography>

                  <FormControl fullWidth size="small">
                    <InputLabel>Logo Source</InputLabel>
                    <Select
                      value={logoSource}
                      label="Logo Source"
                      onChange={(e) => setLogoSource(e.target.value as any)}
                    >
                      <MenuItem value="none">No Logo</MenuItem>
                      <MenuItem value="business">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Building2 size={14} />
                          <span>Use Business Logo ({MOCK_BUSINESS_SETTINGS.name})</span>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="custom">Custom Logo URL</MenuItem>
                    </Select>
                  </FormControl>

                  {logoSource === 'custom' && (
                    <TextField
                      fullWidth
                      size="small"
                      label="Custom Logo URL"
                      value={customLogoUrl}
                      onChange={(e) => setCustomLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      sx={{ mt: 2 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Link2 size={14} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}

                  {logoSource === 'business' && (
                    <Alert severity="info" sx={{ mt: 2 }} icon={<Info size={16} />}>
                      Using logo from business settings: {MOCK_BUSINESS_SETTINGS.name}
                    </Alert>
                  )}
                </Box>

                {/* Header Image */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Image size={14} />
                      <span>Header Image</span>
                    </Stack>
                  </Typography>

                  <TextField
                    fullWidth
                    size="small"
                    label="Header Image URL"
                    value={headerImageUrl}
                    onChange={(e) => setHeaderImageUrl(e.target.value)}
                    placeholder="https://example.com/header.jpg"
                    helperText="A banner image displayed at the top of the form"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Link2 size={14} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Colors */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Palette size={14} />
                      <span>Colors</span>
                    </Stack>
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={useBusinessColor}
                        onChange={(e) => setUseBusinessColor(e.target.checked)}
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Building2 size={14} />
                        <span>Use Business Primary Color</span>
                      </Stack>
                    }
                  />

                  {!useBusinessColor && (
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
                      <TextField
                        size="small"
                        label="Primary Color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        placeholder="#2563eb"
                        sx={{ flex: 1 }}
                      />
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          bgcolor: primaryColor || '#2563eb',
                          border: 1,
                          borderColor: 'divider',
                        }}
                      />
                      <input
                        type="color"
                        value={primaryColor || '#2563eb'}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        style={{
                          width: 40,
                          height: 40,
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: 4,
                        }}
                      />
                    </Stack>
                  )}
                </Box>
              </Stack>
            </Box>
          )}

          {/* Behavior Tab */}
          {activeTab === 1 && (
            <Box sx={{ p: 3 }}>
              <Stack spacing={3}>
                {/* Submission Settings */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Submission Settings
                  </Typography>

                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={allowDrafts}
                          onChange={(e) => setAllowDrafts(e.target.checked)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2">Allow Drafts</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Users can save partially completed forms
                          </Typography>
                        </Box>
                      }
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={offlineEnabled}
                          onChange={(e) => setOfflineEnabled(e.target.checked)}
                        />
                      }
                      label={
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Wifi size={14} />
                            <Typography variant="body2">Offline Mode</Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            Enable offline form completion with sync
                          </Typography>
                        </Box>
                      }
                    />
                  </Stack>
                </Box>

                <Divider />

                {/* Required Elements */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Required Elements
                  </Typography>

                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={requireSignature}
                          onChange={(e) => setRequireSignature(e.target.checked)}
                        />
                      }
                      label={
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <FileSignature size={14} />
                            <Typography variant="body2">Require Signature</Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            Form must include a signature to submit
                          </Typography>
                        </Box>
                      }
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={requirePhoto}
                          onChange={(e) => setRequirePhoto(e.target.checked)}
                        />
                      }
                      label={
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Camera size={14} />
                            <Typography variant="body2">Require Photo</Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            At least one photo must be attached
                          </Typography>
                        </Box>
                      }
                    />
                  </Stack>
                </Box>

                <Divider />

                {/* Workflow Settings */}
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    Workflow
                  </Typography>

                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={reviewRequired}
                          onChange={(e) => setReviewRequired(e.target.checked)}
                        />
                      }
                      label={
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <CheckCircle size={14} />
                            <Typography variant="body2">Require Review</Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            Submissions must be approved by a manager
                          </Typography>
                        </Box>
                      }
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoCreateTask}
                          onChange={(e) => setAutoCreateTask(e.target.checked)}
                        />
                      }
                      label={
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <ListTodo size={14} />
                            <Typography variant="body2">Auto-Create Tasks</Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            Automatically create follow-up tasks for failed items
                          </Typography>
                        </Box>
                      }
                    />
                  </Stack>

                  {autoCreateTask && (
                    <Alert severity="info" sx={{ mt: 2 }} icon={<AlertTriangle size={16} />}>
                      Configure task trigger conditions in the form builder by setting pass/fail values on fields.
                    </Alert>
                  )}
                </Box>
              </Stack>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <MuiButton variant="text" onClick={onClose}>
              Cancel
            </MuiButton>
            <MuiButton variant="contained" onClick={handleSave}>
              Save Settings
            </MuiButton>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
