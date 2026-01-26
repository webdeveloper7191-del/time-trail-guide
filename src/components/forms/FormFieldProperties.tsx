import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Stack,
  Chip,
  Divider,
  FormControlLabel,
  Switch as MuiSwitch,
  Alert,
} from '@mui/material';
import {
  X,
  Plus,
  Trash2,
  Settings,
  Zap,
  FileCheck,
  GripVertical,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Braces,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ConditionalLogicBuilder } from '@/components/forms/ConditionalLogicBuilder';
import { TokenPicker } from '@/components/forms/TokenPicker';
import { FormField, FormTemplate, FieldOption, ConditionalLogic, FIELD_TYPES, AUTO_POPULATE_TOKENS, AutoPopulateToken } from '@/types/forms';
import { containsTokens, getTokenPreview, validateTokens, getAllTokens } from '@/lib/tokenResolver';
import { toast } from 'sonner';

interface FormFieldPropertiesProps {
  template: FormTemplate;
  selectedFieldId: string | null;
  onFieldUpdate: (fieldId: string, updates: Partial<FormField>) => void;
  onClose: () => void;
  customTokens?: AutoPopulateToken[];
}

export function FormFieldProperties({
  template,
  selectedFieldId,
  onFieldUpdate,
  onClose,
  customTokens = [],
}: FormFieldPropertiesProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));

  const field = template.fields.find(f => f.id === selectedFieldId);

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

  if (!field) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          textAlign: 'center',
        }}
      >
        <Settings size={40} className="text-muted-foreground mb-4" />
        <Typography variant="subtitle1" color="text.secondary">
          Select a field to edit its properties
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Click on any field in the canvas to configure it
        </Typography>
      </Box>
    );
  }

  const fieldTypeDef = FIELD_TYPES.find(ft => ft.type === field.type);
  const hasOptions = ['dropdown', 'multi_select', 'radio', 'checkbox'].includes(field.type);

  const addOption = () => {
    const newOption: FieldOption = {
      id: `opt-${Date.now()}`,
      label: `Option ${(field.options?.length || 0) + 1}`,
      value: `option_${(field.options?.length || 0) + 1}`,
    };
    onFieldUpdate(field.id, {
      options: [...(field.options || []), newOption],
    });
  };

  const updateOption = (optionId: string, updates: Partial<FieldOption>) => {
    onFieldUpdate(field.id, {
      options: (field.options || []).map(opt =>
        opt.id === optionId ? { ...opt, ...updates } : opt
      ),
    });
  };

  const deleteOption = (optionId: string) => {
    onFieldUpdate(field.id, {
      options: (field.options || []).filter(opt => opt.id !== optionId),
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Field Properties
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {fieldTypeDef?.label}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </Stack>
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full px-2 pt-2">
          <TabsTrigger value="general" className="flex-1 text-xs">
            General
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex-1 text-xs">
            Validation
          </TabsTrigger>
          <TabsTrigger value="logic" className="flex-1 text-xs">
            Logic
          </TabsTrigger>
          {template.scoring?.enabled && (
            <TabsTrigger value="scoring" className="flex-1 text-xs">
              Scoring
            </TabsTrigger>
          )}
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="general" className="m-0 p-3">
            <Stack spacing={3}>
              {/* Basic settings */}
              <Collapsible open={expandedSections.has('basic')} onOpenChange={() => toggleSection('basic')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-1">
                  <Typography variant="subtitle2" fontWeight={600}>
                    Basic Settings
                  </Typography>
                  {expandedSections.has('basic') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <Box>
                      <Label htmlFor="field-label">Label</Label>
                      <Input
                        id="field-label"
                        value={field.label}
                        onChange={(e) => onFieldUpdate(field.id, { label: e.target.value })}
                        className="mt-1"
                      />
                    </Box>

                    <Box>
                      <Label htmlFor="field-description">Help Text</Label>
                      <Textarea
                        id="field-description"
                        value={field.description || ''}
                        onChange={(e) => onFieldUpdate(field.id, { description: e.target.value })}
                        placeholder="Additional instructions for the user"
                        className="mt-1 min-h-[60px]"
                      />
                    </Box>

                    {!['section_header', 'instructions'].includes(field.type) && (
                      <Box>
                        <Label htmlFor="field-placeholder">Placeholder</Label>
                        <Input
                          id="field-placeholder"
                          value={field.placeholder || ''}
                          onChange={(e) => onFieldUpdate(field.id, { placeholder: e.target.value })}
                          placeholder="Placeholder text"
                          className="mt-1"
                        />
                      </Box>
                    )}

                    <FormControlLabel
                      control={
                        <MuiSwitch
                          checked={field.required}
                          onChange={(e) => onFieldUpdate(field.id, { required: e.target.checked })}
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2">Required field</Typography>
                      }
                    />

                    <Box>
                      <Label htmlFor="field-section">Section</Label>
                      <Select
                        value={field.sectionId || '_none'}
                        onValueChange={(value) => onFieldUpdate(field.id, { 
                          sectionId: value === '_none' ? undefined : value 
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">No section</SelectItem>
                          {template.sections.map(section => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Box>
                  </Stack>
                </CollapsibleContent>
              </Collapsible>

              {/* Default Value / Auto-Populate section */}
              {!['section_header', 'instructions', 'signature', 'photo_upload', 'video_upload', 'file_upload', 'location', 'barcode_scan', 'qr_scan'].includes(field.type) && (
                <>
                  <Divider />
                  <Collapsible open={expandedSections.has('autopopulate')} onOpenChange={() => toggleSection('autopopulate')}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full py-1">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          Default Value / Auto-Populate
                        </Typography>
                        {field.defaultValue && containsTokens(String(field.defaultValue)) && (
                          <Braces size={12} className="text-primary" />
                        )}
                      </Stack>
                      {expandedSections.has('autopopulate') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <Stack spacing={2} sx={{ mt: 2 }}>
                        <Alert severity="info" sx={{ fontSize: '0.75rem' }}>
                          Use tokens like <code>{'{{staff_name}}'}</code> to auto-fill fields when the form is sent to staff
                        </Alert>

                        <Box>
                          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                            <Label htmlFor="field-default">Default Value</Label>
                            <TokenPicker 
                              onInsert={(token) => {
                                const currentValue = String(field.defaultValue || '');
                                onFieldUpdate(field.id, { defaultValue: currentValue + token });
                              }}
                              customTokens={customTokens}
                            />
                          </Stack>
                          
                          {field.type === 'long_text' ? (
                            <Textarea
                              id="field-default"
                              value={String(field.defaultValue || '')}
                              onChange={(e) => onFieldUpdate(field.id, { defaultValue: e.target.value })}
                              placeholder="Enter default value or use tokens..."
                              className="min-h-[80px] font-mono text-sm"
                            />
                          ) : field.type === 'number' ? (
                            <Input
                              id="field-default"
                              type="text"
                              value={String(field.defaultValue || '')}
                              onChange={(e) => {
                                const val = e.target.value;
                                // Allow tokens or numbers
                                if (containsTokens(val) || val === '' || !isNaN(Number(val))) {
                                  onFieldUpdate(field.id, { defaultValue: val });
                                }
                              }}
                              placeholder="Enter number or token..."
                              className="font-mono text-sm"
                            />
                          ) : (
                            <Input
                              id="field-default"
                              value={String(field.defaultValue || '')}
                              onChange={(e) => onFieldUpdate(field.id, { defaultValue: e.target.value })}
                              placeholder="Enter default value or use tokens..."
                              className="font-mono text-sm"
                            />
                          )}
                        </Box>

                        {/* Token preview */}
                        {field.defaultValue && containsTokens(String(field.defaultValue)) && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                              Preview (with example values):
                            </Typography>
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 1.5,
                                bgcolor: 'grey.50',
                                fontStyle: 'italic',
                              }}
                            >
                              <Typography variant="body2">
                                {getTokenPreview(String(field.defaultValue), undefined, customTokens)}
                              </Typography>
                            </Paper>
                          </Box>
                        )}

                        {/* Token validation */}
                        {field.defaultValue && (() => {
                          const validation = validateTokens(String(field.defaultValue), customTokens);
                          if (!validation.valid) {
                            return (
                              <Alert severity="warning" sx={{ fontSize: '0.75rem' }}>
                                Unknown tokens: {validation.invalidTokens.join(', ')}
                              </Alert>
                            );
                          }
                          return null;
                        })()}

                        {/* Common tokens quick insert */}
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Quick Insert:
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                            {AUTO_POPULATE_TOKENS.slice(0, 6).map(token => (
                              <Chip
                                key={token.token}
                                label={token.label}
                                size="small"
                                onClick={() => {
                                  const currentValue = String(field.defaultValue || '');
                                  onFieldUpdate(field.id, { defaultValue: currentValue + token.token });
                                }}
                                sx={{
                                  fontSize: '0.65rem',
                                  height: 22,
                                  cursor: 'pointer',
                                  '&:hover': { bgcolor: 'primary.50' },
                                }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      </Stack>
                    </CollapsibleContent>
                  </Collapsible>
                </>
              )}

              {/* Options (for choice fields) */}
              {hasOptions && (
                <>
                  <Divider />
                  <Collapsible open={expandedSections.has('options')} onOpenChange={() => toggleSection('options')}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full py-1">
                      <Typography variant="subtitle2" fontWeight={600}>
                        Options ({field.options?.length || 0})
                      </Typography>
                      {expandedSections.has('options') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <Stack spacing={1} sx={{ mt: 2 }}>
                        {(field.options || []).map((option, index) => (
                          <Paper key={option.id} sx={{ p: 1.5 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <GripVertical size={12} className="text-muted-foreground cursor-grab" />
                              <Input
                                value={option.label}
                                onChange={(e) => updateOption(option.id, { label: e.target.value })}
                                placeholder="Option label"
                                className="flex-1 h-8 text-sm"
                              />
                              <Input
                                value={option.value}
                                onChange={(e) => updateOption(option.id, { value: e.target.value })}
                                placeholder="Value"
                                className="w-24 h-8 text-sm"
                              />
                              {template.scoring?.enabled && (
                                <Input
                                  type="number"
                                  value={option.score ?? ''}
                                  onChange={(e) => updateOption(option.id, { score: e.target.value ? parseInt(e.target.value) : undefined })}
                                  placeholder="Score"
                                  className="w-16 h-8 text-sm"
                                />
                              )}
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => deleteOption(option.id)}
                              >
                                <Trash2 size={12} />
                              </IconButton>
                            </Stack>
                          </Paper>
                        ))}
                        <Button variant="outline" size="sm" onClick={addOption}>
                          <Plus size={14} className="mr-1" />
                          Add Option
                        </Button>
                      </Stack>
                    </CollapsibleContent>
                  </Collapsible>
                </>
              )}

              {/* Type-specific settings */}
              {['number', 'short_text', 'long_text', 'photo_upload', 'video_upload', 'file_upload'].includes(field.type) && (
                <>
                  <Divider />
                  <Collapsible open={expandedSections.has('settings')} onOpenChange={() => toggleSection('settings')}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full py-1">
                      <Typography variant="subtitle2" fontWeight={600}>
                        Field Settings
                      </Typography>
                      {expandedSections.has('settings') ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <Stack spacing={2} sx={{ mt: 2 }}>
                        {field.type === 'number' && (
                          <>
                            <Stack direction="row" spacing={2}>
                              <Box flex={1}>
                                <Label htmlFor="field-min">Minimum</Label>
                                <Input
                                  id="field-min"
                                  type="number"
                                  value={field.settings?.min ?? ''}
                                  onChange={(e) => onFieldUpdate(field.id, { 
                                    settings: { ...field.settings, min: e.target.value ? parseFloat(e.target.value) : undefined }
                                  })}
                                  className="mt-1"
                                />
                              </Box>
                              <Box flex={1}>
                                <Label htmlFor="field-max">Maximum</Label>
                                <Input
                                  id="field-max"
                                  type="number"
                                  value={field.settings?.max ?? ''}
                                  onChange={(e) => onFieldUpdate(field.id, { 
                                    settings: { ...field.settings, max: e.target.value ? parseFloat(e.target.value) : undefined }
                                  })}
                                  className="mt-1"
                                />
                              </Box>
                            </Stack>
                            <Box>
                              <Label htmlFor="field-step">Step</Label>
                              <Input
                                id="field-step"
                                type="number"
                                value={field.settings?.step ?? ''}
                                onChange={(e) => onFieldUpdate(field.id, { 
                                  settings: { ...field.settings, step: e.target.value ? parseFloat(e.target.value) : undefined }
                                })}
                                className="mt-1"
                              />
                            </Box>
                          </>
                        )}

                        {['short_text', 'long_text'].includes(field.type) && (
                          <Stack direction="row" spacing={2}>
                            <Box flex={1}>
                              <Label htmlFor="field-minlen">Min Length</Label>
                              <Input
                                id="field-minlen"
                                type="number"
                                value={field.settings?.minLength ?? ''}
                                onChange={(e) => onFieldUpdate(field.id, { 
                                  settings: { ...field.settings, minLength: e.target.value ? parseInt(e.target.value) : undefined }
                                })}
                                className="mt-1"
                              />
                            </Box>
                            <Box flex={1}>
                              <Label htmlFor="field-maxlen">Max Length</Label>
                              <Input
                                id="field-maxlen"
                                type="number"
                                value={field.settings?.maxLength ?? ''}
                                onChange={(e) => onFieldUpdate(field.id, { 
                                  settings: { ...field.settings, maxLength: e.target.value ? parseInt(e.target.value) : undefined }
                                })}
                                className="mt-1"
                              />
                            </Box>
                          </Stack>
                        )}

                        {['photo_upload', 'video_upload', 'file_upload'].includes(field.type) && (
                          <>
                            <Box>
                              <Label htmlFor="field-maxfiles">Max Files</Label>
                              <Input
                                id="field-maxfiles"
                                type="number"
                                min={1}
                                max={20}
                                value={field.settings?.maxFiles ?? 1}
                                onChange={(e) => onFieldUpdate(field.id, { 
                                  settings: { ...field.settings, maxFiles: parseInt(e.target.value) || 1 }
                                })}
                                className="mt-1"
                              />
                            </Box>
                            <Box>
                              <Label htmlFor="field-maxsize">Max File Size (MB)</Label>
                              <Input
                                id="field-maxsize"
                                type="number"
                                min={1}
                                max={100}
                                value={field.settings?.maxFileSize ?? 10}
                                onChange={(e) => onFieldUpdate(field.id, { 
                                  settings: { ...field.settings, maxFileSize: parseInt(e.target.value) || 10 }
                                })}
                                className="mt-1"
                              />
                            </Box>
                          </>
                        )}
                      </Stack>
                    </CollapsibleContent>
                  </Collapsible>
                </>
              )}
            </Stack>
          </TabsContent>

          <TabsContent value="validation" className="m-0 p-3">
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Add validation rules to ensure data quality.
              </Typography>
              
              <Paper sx={{ p: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
                <AlertTriangle size={24} className="mx-auto mb-2 text-muted-foreground" />
                <Typography variant="body2" color="text.secondary">
                  Advanced validation rules coming soon
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pattern matching, custom error messages, and more
                </Typography>
              </Paper>
            </Stack>
          </TabsContent>

          <TabsContent value="logic" className="m-0 p-3">
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Show or hide this field based on other field values.
              </Typography>

              <ConditionalLogicBuilder
                field={field}
                allFields={template.fields}
                onUpdate={(logic) => onFieldUpdate(field.id, { conditionalLogic: logic })}
              />
            </Stack>
          </TabsContent>

          {template.scoring?.enabled && (
            <TabsContent value="scoring" className="m-0 p-3">
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <MuiSwitch
                      checked={field.scoring?.enabled || false}
                      onChange={(e) => onFieldUpdate(field.id, { 
                        scoring: { ...field.scoring, enabled: e.target.checked }
                      })}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2">Include in scoring</Typography>
                  }
                />

                {field.scoring?.enabled && (
                  <Stack spacing={2}>
                    <Box>
                      <Label>Weight</Label>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={field.scoring?.weight ?? 1}
                        onChange={(e) => onFieldUpdate(field.id, { 
                          scoring: { ...field.scoring, enabled: true, weight: parseInt(e.target.value) || 1 }
                        })}
                        className="mt-1"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Higher weight = more impact on final score
                      </Typography>
                    </Box>

                    {!hasOptions && (
                      <Stack direction="row" spacing={2}>
                        <Box flex={1}>
                          <Label>Pass Value</Label>
                          <Input
                            value={String(field.scoring?.passValue ?? '')}
                            onChange={(e) => onFieldUpdate(field.id, { 
                              scoring: { ...field.scoring, enabled: true, passValue: e.target.value }
                            })}
                            placeholder="Value that passes"
                            className="mt-1"
                          />
                        </Box>
                        <Box flex={1}>
                          <Label>Fail Value</Label>
                          <Input
                            value={String(field.scoring?.failValue ?? '')}
                            onChange={(e) => onFieldUpdate(field.id, { 
                              scoring: { ...field.scoring, enabled: true, failValue: e.target.value }
                            })}
                            placeholder="Value that fails"
                            className="mt-1"
                          />
                        </Box>
                      </Stack>
                    )}
                  </Stack>
                )}
              </Stack>
            </TabsContent>
          )}
        </ScrollArea>
      </Tabs>
    </Box>
  );
}
