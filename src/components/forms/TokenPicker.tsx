import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  Popover,
  InputAdornment,
  TextField,
} from '@mui/material';
import {
  Users,
  Calendar,
  MapPin,
  Clock,
  FileText,
  Search,
  Copy,
  Check,
  Braces,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AUTO_POPULATE_TOKENS, TOKEN_CATEGORIES, AutoPopulateToken } from '@/types/forms';
import { toast } from 'sonner';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  staff: Users,
  shift: Calendar,
  location: MapPin,
  date: Clock,
  form: FileText,
  custom: Wand2,
};

interface TokenPickerProps {
  onInsert: (token: string) => void;
  buttonVariant?: 'icon' | 'text';
  disabled?: boolean;
  customTokens?: AutoPopulateToken[];
}

export function TokenPicker({ 
  onInsert, 
  buttonVariant = 'icon', 
  disabled = false,
  customTokens = [],
}: TokenPickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const open = Boolean(anchorEl);

  // Combine built-in and custom tokens
  const allTokens = useMemo(() => {
    return [...AUTO_POPULATE_TOKENS, ...customTokens];
  }, [customTokens]);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setSearchQuery('');
    setSelectedCategory(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleInsert = (token: AutoPopulateToken) => {
    onInsert(token.token);
    handleClose();
    toast.success(`Inserted ${token.label}`);
  };

  const handleCopy = (token: AutoPopulateToken, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(token.token);
    setCopiedToken(token.token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success('Token copied to clipboard');
  };

  const filteredTokens = allTokens.filter(token => {
    const matchesSearch = searchQuery === '' || 
      token.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === null || token.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const groupedTokens = filteredTokens.reduce((acc, token) => {
    if (!acc[token.category]) {
      acc[token.category] = [];
    }
    acc[token.category].push(token);
    return acc;
  }, {} as Record<string, AutoPopulateToken[]>);

  return (
    <>
      {buttonVariant === 'icon' ? (
        <IconButton 
          size="small" 
          onClick={handleOpen}
          disabled={disabled}
          sx={{ 
            bgcolor: 'primary.50',
            '&:hover': { bgcolor: 'primary.100' },
          }}
        >
          <Braces size={14} />
        </IconButton>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleOpen}
          disabled={disabled}
        >
          <Braces size={14} className="mr-1" />
          Insert Token
        </Button>
      )}

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 480,
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
            Auto-Populate Tokens
          </Typography>
          
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
            }}
            sx={{ mb: 1.5 }}
          />

          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
            <Chip
              label="All"
              size="small"
              onClick={() => setSelectedCategory(null)}
              color={selectedCategory === null ? 'primary' : 'default'}
              sx={{ fontSize: '0.7rem' }}
            />
            {TOKEN_CATEGORIES.map(cat => {
              const Icon = CATEGORY_ICONS[cat.id];
              return (
                <Chip
                  key={cat.id}
                  icon={<Icon size={12} />}
                  label={cat.label}
                  size="small"
                  onClick={() => setSelectedCategory(cat.id)}
                  color={selectedCategory === cat.id ? 'primary' : 'default'}
                  sx={{ fontSize: '0.7rem' }}
                />
              );
            })}
          </Stack>
        </Box>

        <ScrollArea className="h-[320px]">
          <Box sx={{ p: 1 }}>
            {Object.entries(groupedTokens).map(([category, tokens]) => {
              const categoryDef = TOKEN_CATEGORIES.find(c => c.id === category);
              const Icon = CATEGORY_ICONS[category];
              
              return (
                <Box key={category} sx={{ mb: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1, mb: 1 }}>
                    <Icon size={14} className="text-muted-foreground" />
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      {categoryDef?.label || category}
                    </Typography>
                  </Stack>
                  
                  {tokens.map(token => (
                    <Box
                      key={token.token}
                      onClick={() => handleInsert(token)}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                        <Box flex={1}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2" fontWeight={500}>
                              {token.label}
                            </Typography>
                            <Chip
                              label={token.token}
                              size="small"
                              sx={{
                                fontSize: '0.65rem',
                                height: 20,
                                fontFamily: 'monospace',
                                bgcolor: 'primary.50',
                                color: 'primary.main',
                              }}
                            />
                          </Stack>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {token.description}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              display: 'block', 
                              mt: 0.5, 
                              fontStyle: 'italic',
                              color: 'text.disabled',
                            }}
                          >
                            Example: {token.example}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => handleCopy(token, e)}
                          sx={{ ml: 1 }}
                        >
                          {copiedToken === token.token ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </IconButton>
                      </Stack>
                    </Box>
                  ))}
                </Box>
              );
            })}

            {filteredTokens.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No tokens found
                </Typography>
              </Box>
            )}
          </Box>
        </ScrollArea>

        <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Typography variant="caption" color="text.secondary">
            Tokens are replaced with actual values when the form is sent to staff
          </Typography>
        </Box>
      </Popover>
    </>
  );
}
