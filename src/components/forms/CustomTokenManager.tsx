import { useState, useMemo, DragEvent } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  IconButton,
  Alert,
  Chip,
  Collapse,
  Divider,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import { 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Wand2, 
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  Building2,
  User,
  Search,
  MousePointerClick,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AutoPopulateToken, AUTO_POPULATE_TOKENS, TOKEN_CATEGORIES } from '@/types/forms';
import { toast } from 'sonner';

// Extended categories based on screenshot
const TOKEN_GROUPS = [
  { 
    id: 'employment', 
    label: 'Employment', 
    icon: Building2,
    tokens: [
      { token: '{{classification}}', label: 'Classification', description: 'Employment classification', example: 'Full-time' },
      { token: '{{minimum_base_hours}}', label: 'Minimum Base Hours', description: 'Minimum contracted hours', example: '38' },
      { token: '{{previous_hourly_rate}}', label: 'Previous Hourly Rate', description: 'Previous pay rate', example: '$28.50' },
      { token: '{{hourly_rate}}', label: 'Hourly Rate', description: 'Current hourly rate', example: '$32.00' },
      { token: '{{start_date}}', label: 'Start Date', description: 'Employment start date', example: '15/01/2024' },
    ]
  },
  { 
    id: 'general', 
    label: 'General', 
    icon: FileText,
    tokens: [
      { token: '{{date}}', label: 'Date', description: 'Current date', example: '26/01/2025' },
      { token: '{{contract_finish_date}}', label: 'Contract Finish Date', description: 'End date of contract', example: '31/12/2025' },
      { token: '{{contract_start_date}}', label: 'Contract Start Date', description: 'Start date of contract', example: '01/01/2024' },
    ]
  },
  { 
    id: 'organisations', 
    label: 'Organisations', 
    icon: Building2,
    tokens: [
      { token: '{{location_address}}', label: 'Location Address', description: 'Workplace address', example: '123 Main St' },
      { token: '{{location_name}}', label: 'Location Name', description: 'Workplace name', example: 'Head Office' },
      { token: '{{org_abn}}', label: 'Organisation ABN', description: 'Business ABN', example: '12 345 678 901' },
      { token: '{{manager_title}}', label: 'Manager Title', description: 'Manager job title', example: 'Operations Manager' },
      { token: '{{org_name}}', label: 'Organisation Name', description: 'Business name', example: 'Acme Corp' },
      { token: '{{manager_name}}', label: 'Manager Name', description: 'Manager full name', example: 'John Smith' },
    ]
  },
  { 
    id: 'personal', 
    label: 'Personal', 
    icon: User,
    tokens: [
      { token: '{{dob}}', label: 'Date of Birth', description: 'Staff date of birth', example: '15/03/1990' },
      { token: '{{required_quals}}', label: 'Required Qualifications', description: 'Required certifications', example: 'First Aid, RSA' },
      { token: '{{legal_last_name}}', label: 'Legal Last Name', description: 'Legal surname', example: 'Smith' },
      { token: '{{emp_address}}', label: 'Employee Address', description: 'Home address', example: '45 Oak St, Sydney' },
      { token: '{{phone_number}}', label: 'Phone Number', description: 'Contact phone', example: '0400 123 456' },
      { token: '{{email}}', label: 'Email', description: 'Email address', example: 'john@example.com' },
      { token: '{{legal_middle_names}}', label: 'Legal Middle Names', description: 'Middle name(s)', example: 'Robert' },
      { token: '{{legal_first_name}}', label: 'Legal First Name', description: 'Legal first name', example: 'John' },
      { token: '{{probationary_period}}', label: 'Probationary Period', description: 'Probation duration', example: '3 months' },
      { token: '{{name}}', label: 'Name', description: 'Full name', example: 'John Smith' },
    ]
  },
];

interface CustomTokenManagerProps {
  customTokens: AutoPopulateToken[];
  onTokensChange: (tokens: AutoPopulateToken[]) => void;
  onInsertToken?: (token: string) => void;
  mode?: 'copy' | 'insert';
  enableDragDrop?: boolean;
}

export function CustomTokenManager({ 
  customTokens, 
  onTokensChange, 
  onInsertToken,
  mode = 'copy',
  enableDragDrop = true,
}: CustomTokenManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(TOKEN_GROUPS.map(g => g.id))
  );
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggingToken, setDraggingToken] = useState<string | null>(null);
  const [newToken, setNewToken] = useState({
    label: '',
    description: '',
    example: '',
  });

  // Handle drag start
  const handleDragStart = (e: DragEvent<HTMLDivElement>, token: string) => {
    e.dataTransfer.setData('text/plain', token);
    e.dataTransfer.setData('application/x-token', token);
    e.dataTransfer.effectAllowed = 'copy';
    setDraggingToken(token);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggingToken(null);
  };

  // Filter tokens based on search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return TOKEN_GROUPS;
    
    const query = searchQuery.toLowerCase();
    return TOKEN_GROUPS.map(group => ({
      ...group,
      tokens: group.tokens.filter(
        token =>
          token.token.toLowerCase().includes(query) ||
          token.label.toLowerCase().includes(query) ||
          token.description.toLowerCase().includes(query)
      ),
    })).filter(group => group.tokens.length > 0);
  }, [searchQuery]);

  const filteredCustomTokens = useMemo(() => {
    if (!searchQuery.trim()) return customTokens;
    
    const query = searchQuery.toLowerCase();
    return customTokens.filter(
      token =>
        token.token.toLowerCase().includes(query) ||
        token.label.toLowerCase().includes(query) ||
        token.description.toLowerCase().includes(query)
    );
  }, [customTokens, searchQuery]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleTokenAction = (token: string) => {
    if (mode === 'insert' && onInsertToken) {
      onInsertToken(token);
      toast.success('Token inserted');
    } else {
      navigator.clipboard.writeText(token);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
      toast.success('Token copied to clipboard');
    }
  };

  const generateTokenKey = (label: string): string => {
    return `{{custom_${label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}}}`;
  };

  const handleAddToken = () => {
    if (!newToken.label.trim()) return;

    const token: AutoPopulateToken = {
      token: generateTokenKey(newToken.label),
      label: newToken.label,
      description: newToken.description || `Custom token: ${newToken.label}`,
      category: 'custom',
      example: newToken.example || newToken.label,
    };

    // Check for duplicates
    const exists = customTokens.some(t => t.token === token.token);
    if (exists) {
      toast.error('A token with this name already exists');
      return;
    }

    onTokensChange([...customTokens, token]);
    setNewToken({ label: '', description: '', example: '' });
    setIsAdding(false);
    toast.success('Custom token added');
  };

  const handleDeleteToken = (token: string) => {
    onTokensChange(customTokens.filter(t => t.token !== token));
    toast.success('Token deleted');
  };

  return (
    <ScrollArea className="h-full">
      <Stack spacing={2}>
        {/* Search Input */}
        <TextField
          size="small"
          fullWidth
          placeholder="Search tokens..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <X size={14} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Mode Indicator */}
        {enableDragDrop && (
          <Alert severity="info" icon={<GripVertical size={16} />} sx={{ py: 0.5 }}>
            <Typography variant="caption">
              Drag tokens to form fields, click to {mode === 'insert' ? 'insert' : 'copy'}
            </Typography>
          </Alert>
        )}
        {!enableDragDrop && mode === 'insert' && (
          <Alert severity="info" icon={<MousePointerClick size={16} />} sx={{ py: 0.5 }}>
            <Typography variant="caption">
              Click a token to insert it directly into the selected field
            </Typography>
          </Alert>
        )}

        {/* System Token Groups */}
        {filteredGroups.map((group) => {
          const Icon = group.icon;
          const isExpanded = expandedGroups.has(group.id);
          
          return (
            <Box key={group.id}>
              {/* Group Header */}
              <Box
                onClick={() => toggleGroup(group.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'grey.200' },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {group.label}
                  </Typography>
                  <Chip 
                    label={group.tokens.length} 
                    size="small" 
                    sx={{ height: 20, fontSize: '0.7rem' }} 
                  />
                </Stack>
                <IconButton size="small" sx={{ bgcolor: 'grey.800', color: 'white', width: 24, height: 24 }}>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </IconButton>
              </Box>

              {/* Group Content */}
              <Collapse in={isExpanded}>
                <Box sx={{ p: 2, border: 1, borderTop: 0, borderColor: 'divider', borderRadius: '0 0 8px 8px' }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {group.tokens.map((token) => (
                      <Tooltip key={token.token} title={`${token.description} • Drag to insert`} arrow>
                        <Box
                          draggable={enableDragDrop}
                          onDragStart={(e) => handleDragStart(e, token.token)}
                          onDragEnd={handleDragEnd}
                          sx={{ 
                            cursor: enableDragDrop ? 'grab' : 'pointer',
                            '&:active': { cursor: enableDragDrop ? 'grabbing' : 'pointer' },
                            opacity: draggingToken === token.token ? 0.5 : 1,
                          }}
                        >
                          <Chip
                            label={
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                {enableDragDrop && <GripVertical size={12} className="text-muted-foreground" />}
                                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                  {token.token}
                                </span>
                                {copiedToken === token.token ? (
                                  <Check size={12} className="text-green-500" />
                                ) : mode === 'insert' ? (
                                  <MousePointerClick size={12} />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </Stack>
                            }
                            onClick={() => handleTokenAction(token.token)}
                            sx={{
                              height: 32,
                              bgcolor: draggingToken === token.token ? 'primary.100' : 'white',
                              border: 1,
                              borderColor: 'primary.main',
                              color: 'primary.main',
                              fontFamily: 'monospace',
                              cursor: 'inherit',
                              '&:hover': {
                                bgcolor: 'primary.50',
                              },
                              '& .MuiChip-label': {
                                px: 1,
                              },
                            }}
                          />
                        </Box>
                      </Tooltip>
                    ))}
                  </Box>
                </Box>
              </Collapse>
            </Box>
          );
        })}

        {/* No Results Message */}
        {filteredGroups.length === 0 && searchQuery && (
          <Alert severity="info">
            <Typography variant="body2">
              No system tokens match "{searchQuery}"
            </Typography>
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Custom Fields Section */}
        <Card>
          <CardHeader className="py-3">
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Wand2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Custom Fields</CardTitle>
                <Badge variant="secondary">{customTokens.length}</Badge>
              </Stack>
              {!isAdding && (
                <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Token
                </Button>
              )}
            </Stack>
          </CardHeader>
          <CardContent className="pt-0">
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              You can add custom fields to your template.
            </Typography>

            {isAdding && (
              <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'grey.50', mb: 2 }}>
                <Stack spacing={2}>
                  <TextField
                    size="small"
                    label="Token Name"
                    placeholder="e.g., Company Policy"
                    value={newToken.label}
                    onChange={(e) => setNewToken(prev => ({ ...prev, label: e.target.value }))}
                    fullWidth
                    helperText={newToken.label ? `Token: ${generateTokenKey(newToken.label)}` : 'Enter a name for your custom token'}
                  />
                  <TextField
                    size="small"
                    label="Description"
                    placeholder="What does this token represent?"
                    value={newToken.description}
                    onChange={(e) => setNewToken(prev => ({ ...prev, description: e.target.value }))}
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label="Example Value"
                    placeholder="e.g., Annual Leave Policy"
                    value={newToken.example}
                    onChange={(e) => setNewToken(prev => ({ ...prev, example: e.target.value }))}
                    fullWidth
                  />
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsAdding(false);
                        setNewToken({ label: '', description: '', example: '' });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddToken}
                      disabled={!newToken.label.trim()}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Add Token
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            )}

            {filteredCustomTokens.length === 0 && !isAdding ? (
              <Alert severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                <Typography variant="body2">
                  {searchQuery ? 'No custom tokens match your search.' : 'No custom tokens defined. Create tokens for organization-specific data like company name, policies, etc.'}
                </Typography>
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {filteredCustomTokens.map((token) => (
                  <Tooltip key={token.token} title={`${token.description} • Drag to insert`} arrow>
                    <Box
                      draggable={enableDragDrop}
                      onDragStart={(e) => handleDragStart(e, token.token)}
                      onDragEnd={handleDragEnd}
                      sx={{ 
                        cursor: enableDragDrop ? 'grab' : 'pointer',
                        '&:active': { cursor: enableDragDrop ? 'grabbing' : 'pointer' },
                        opacity: draggingToken === token.token ? 0.5 : 1,
                      }}
                    >
                      <Chip
                        label={
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            {enableDragDrop && <GripVertical size={12} className="text-muted-foreground" />}
                            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {token.token}
                            </span>
                            {copiedToken === token.token ? (
                              <Check size={12} className="text-green-500" />
                            ) : mode === 'insert' ? (
                              <MousePointerClick size={12} />
                            ) : (
                              <Copy size={12} />
                            )}
                          </Stack>
                        }
                        onClick={() => handleTokenAction(token.token)}
                        onDelete={() => handleDeleteToken(token.token)}
                        sx={{
                          height: 32,
                          bgcolor: draggingToken === token.token ? 'secondary.100' : 'white',
                          border: 1,
                          borderColor: 'secondary.main',
                          color: 'secondary.main',
                          fontFamily: 'monospace',
                          cursor: 'inherit',
                          '&:hover': {
                            bgcolor: 'secondary.50',
                          },
                        }}
                      />
                    </Box>
                  </Tooltip>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Stack>
    </ScrollArea>
  );
}
