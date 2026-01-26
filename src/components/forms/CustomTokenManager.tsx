import { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  IconButton,
  Alert,
  Chip,
} from '@mui/material';
import { Plus, Trash2, Edit2, Check, X, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AutoPopulateToken } from '@/types/forms';

interface CustomTokenManagerProps {
  customTokens: AutoPopulateToken[];
  onTokensChange: (tokens: AutoPopulateToken[]) => void;
}

export function CustomTokenManager({ customTokens, onTokensChange }: CustomTokenManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newToken, setNewToken] = useState({
    label: '',
    description: '',
    example: '',
  });

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
      return;
    }

    onTokensChange([...customTokens, token]);
    setNewToken({ label: '', description: '', example: '' });
    setIsAdding(false);
  };

  const handleUpdateToken = (originalToken: string, updates: Partial<AutoPopulateToken>) => {
    onTokensChange(
      customTokens.map(t => 
        t.token === originalToken 
          ? { ...t, ...updates }
          : t
      )
    );
    setEditingId(null);
  };

  const handleDeleteToken = (token: string) => {
    onTokensChange(customTokens.filter(t => t.token !== token));
  };

  return (
    <Card>
      <CardHeader className="py-3">
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Wand2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Custom Tokens</CardTitle>
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
        <Stack spacing={2}>
          {isAdding && (
            <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'grey.50' }}>
              <Stack spacing={2}>
                <TextField
                  size="small"
                  label="Token Name"
                  placeholder="e.g., Company Name"
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
                  placeholder="e.g., Acme Corp"
                  value={newToken.example}
                  onChange={(e) => setNewToken(prev => ({ ...prev, example: e.target.value }))}
                  fullWidth
                  helperText="This value will be shown in previews"
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
                    <X className="h-4 w-4 mr-1" />
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

          {customTokens.length === 0 && !isAdding ? (
            <Alert severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
              <Typography variant="body2">
                No custom tokens defined. Create tokens for organization-specific data like company name, policies, etc.
              </Typography>
            </Alert>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <Stack spacing={1}>
                {customTokens.map((token) => (
                  <CustomTokenRow
                    key={token.token}
                    token={token}
                    isEditing={editingId === token.token}
                    onEdit={() => setEditingId(token.token)}
                    onUpdate={(updates) => handleUpdateToken(token.token, updates)}
                    onDelete={() => handleDeleteToken(token.token)}
                    onCancelEdit={() => setEditingId(null)}
                  />
                ))}
              </Stack>
            </ScrollArea>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

interface CustomTokenRowProps {
  token: AutoPopulateToken;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (updates: Partial<AutoPopulateToken>) => void;
  onDelete: () => void;
  onCancelEdit: () => void;
}

function CustomTokenRow({ token, isEditing, onEdit, onUpdate, onDelete, onCancelEdit }: CustomTokenRowProps) {
  const [editValues, setEditValues] = useState({
    description: token.description,
    example: token.example,
  });

  if (isEditing) {
    return (
      <Box sx={{ p: 2, border: 1, borderColor: 'primary.main', borderRadius: 1, bgcolor: 'primary.50' }}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip label={token.token} size="small" color="primary" />
            <Typography variant="body2" fontWeight={500}>{token.label}</Typography>
          </Stack>
          <TextField
            size="small"
            label="Description"
            value={editValues.description}
            onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))}
            fullWidth
          />
          <TextField
            size="small"
            label="Example Value"
            value={editValues.example}
            onChange={(e) => setEditValues(prev => ({ ...prev, example: e.target.value }))}
            fullWidth
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="sm" variant="ghost" onClick={onCancelEdit}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => onUpdate(editValues)}
            >
              Save
            </Button>
          </Stack>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 1.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        '&:hover': { bgcolor: 'grey.50' },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" fontWeight={500}>{token.label}</Typography>
            <Chip label={token.token} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
          </Stack>
          <Typography variant="caption" color="text.secondary" noWrap>
            {token.description}
          </Typography>
          <Typography variant="caption" color="primary">
            Example: {token.example}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" onClick={onEdit}>
            <Edit2 className="h-4 w-4" />
          </IconButton>
          <IconButton size="small" onClick={onDelete} color="error">
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}
