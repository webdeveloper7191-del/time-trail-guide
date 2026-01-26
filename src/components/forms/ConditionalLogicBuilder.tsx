import { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Plus,
  Trash2,
  ChevronDown,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FormField, ConditionalLogic } from '@/types/forms';

interface ConditionalLogicBuilderProps {
  field: FormField;
  allFields: FormField[];
  onUpdate: (logic: ConditionalLogic[]) => void;
}

const operators = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
];

const actions = [
  { value: 'show', label: 'Show this field' },
  { value: 'hide', label: 'Hide this field' },
  { value: 'require', label: 'Make required' },
  { value: 'set_value', label: 'Set value' },
];

export function ConditionalLogicBuilder({
  field,
  allFields,
  onUpdate,
}: ConditionalLogicBuilderProps) {
  const [rules, setRules] = useState<ConditionalLogic[]>(field.conditionalLogic || []);

  // Get fields that can be used as conditions (exclude current field and non-input fields)
  const availableFields = allFields.filter(
    f => f.id !== field.id && !['section_header', 'instructions'].includes(f.type)
  );

  const addRule = () => {
    const newRule: ConditionalLogic = {
      id: `rule-${Date.now()}`,
      action: 'show',
      conditions: [
        {
          fieldId: availableFields[0]?.id || '',
          operator: 'equals',
          value: '',
        },
      ],
      logicOperator: 'and',
    };
    const updated = [...rules, newRule];
    setRules(updated);
    onUpdate(updated);
  };

  const updateRule = (ruleId: string, updates: Partial<ConditionalLogic>) => {
    const updated = rules.map(r =>
      r.id === ruleId ? { ...r, ...updates } : r
    );
    setRules(updated);
    onUpdate(updated);
  };

  const deleteRule = (ruleId: string) => {
    const updated = rules.filter(r => r.id !== ruleId);
    setRules(updated);
    onUpdate(updated);
  };

  const addCondition = (ruleId: string) => {
    const updated = rules.map(r => {
      if (r.id === ruleId) {
        return {
          ...r,
          conditions: [
            ...r.conditions,
            {
              fieldId: availableFields[0]?.id || '',
              operator: 'equals' as const,
              value: '',
            },
          ],
        };
      }
      return r;
    });
    setRules(updated);
    onUpdate(updated);
  };

  const updateCondition = (
    ruleId: string,
    conditionIndex: number,
    updates: Partial<ConditionalLogic['conditions'][0]>
  ) => {
    const updated = rules.map(r => {
      if (r.id === ruleId) {
        return {
          ...r,
          conditions: r.conditions.map((c, i) =>
            i === conditionIndex ? { ...c, ...updates } : c
          ),
        };
      }
      return r;
    });
    setRules(updated);
    onUpdate(updated);
  };

  const deleteCondition = (ruleId: string, conditionIndex: number) => {
    const updated = rules.map(r => {
      if (r.id === ruleId) {
        return {
          ...r,
          conditions: r.conditions.filter((_, i) => i !== conditionIndex),
        };
      }
      return r;
    });
    setRules(updated);
    onUpdate(updated);
  };

  const getFieldLabel = (fieldId: string) => {
    return allFields.find(f => f.id === fieldId)?.label || 'Unknown field';
  };

  if (availableFields.length === 0) {
    return (
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Add more fields to the form to create conditional logic rules
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {rules.length === 0 ? (
        <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center' }}>
          <GitBranch className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No conditional logic rules yet
          </Typography>
          <Button variant="outline" size="sm" onClick={addRule}>
            <Plus className="h-4 w-4 mr-1" />
            Add First Rule
          </Button>
        </Box>
      ) : (
        <>
          {rules.map((rule, ruleIndex) => (
            <Paper key={rule.id} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
              <Stack spacing={2}>
                {/* Rule Header */}
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Badge variant="outline">Rule {ruleIndex + 1}</Badge>
                    <Select
                      value={rule.action}
                      onValueChange={(value) => updateRule(rule.id, { action: value as ConditionalLogic['action'] })}
                    >
                      <SelectTrigger className="w-[160px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {actions.map(a => (
                          <SelectItem key={a.value} value={a.value}>
                            {a.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Stack>
                  <IconButton size="small" onClick={() => deleteRule(rule.id)}>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </Stack>

                {/* Conditions */}
                <Box sx={{ pl: 2, borderLeft: 2, borderColor: 'primary.main' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    When the following conditions are met:
                  </Typography>
                  
                  <Stack spacing={1.5}>
                    {rule.conditions.map((condition, condIndex) => (
                      <Stack key={condIndex} spacing={1}>
                        {/* AND/OR toggle between conditions */}
                        {condIndex > 0 && (
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ my: 0.5 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1,
                                overflow: 'hidden',
                              }}
                            >
                              <Button
                                variant={rule.logicOperator === 'and' ? 'default' : 'ghost'}
                                size="sm"
                                className="h-6 px-2 text-xs rounded-none"
                                onClick={() => updateRule(rule.id, { logicOperator: 'and' })}
                              >
                                AND
                              </Button>
                              <Button
                                variant={rule.logicOperator === 'or' ? 'default' : 'ghost'}
                                size="sm"
                                className="h-6 px-2 text-xs rounded-none"
                                onClick={() => updateRule(rule.id, { logicOperator: 'or' })}
                              >
                                OR
                              </Button>
                            </Box>
                          </Stack>
                        )}
                        
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          {/* Field Selector */}
                          <Select
                            value={condition.fieldId}
                            onValueChange={(value) => updateCondition(rule.id, condIndex, { fieldId: value })}
                          >
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableFields.map(f => (
                                <SelectItem key={f.id} value={f.id}>
                                  {f.label.length > 20 ? `${f.label.slice(0, 20)}...` : f.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* Operator */}
                          <Select
                            value={condition.operator}
                            onValueChange={(value) => updateCondition(rule.id, condIndex, { operator: value as any })}
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {operators.map(o => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* Value (hide for is_empty/is_not_empty) */}
                          {!['is_empty', 'is_not_empty'].includes(condition.operator) && (() => {
                            const selectedField = allFields.find(f => f.id === condition.fieldId);
                            const hasOptions = selectedField?.options && selectedField.options.length > 0;
                            
                            if (hasOptions) {
                              return (
                                <Select
                                  value={String(condition.value)}
                                  onValueChange={(value) => updateCondition(rule.id, condIndex, { value })}
                                >
                                  <SelectTrigger className="w-[120px] h-8 text-xs">
                                    <SelectValue placeholder="Select value" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background z-50">
                                    {selectedField.options?.map(opt => (
                                      <SelectItem key={opt.id} value={opt.value}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              );
                            }
                            
                            return (
                              <Input
                                value={String(condition.value)}
                                onChange={(e) => updateCondition(rule.id, condIndex, { value: e.target.value })}
                                placeholder="Value"
                                className="w-[100px] h-8 text-xs"
                              />
                            );
                          })()}

                          {/* Delete condition */}
                          {rule.conditions.length > 1 && (
                            <IconButton
                              size="small"
                              onClick={() => deleteCondition(rule.id, condIndex)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </IconButton>
                          )}
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>

                  {/* Add condition button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={() => addCondition(rule.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Condition
                  </Button>
                </Box>
              </Stack>
            </Paper>
          ))}

          <Button variant="outline" size="sm" onClick={addRule}>
            <Plus className="h-4 w-4 mr-1" />
            Add Another Rule
          </Button>
        </>
      )}
    </Stack>
  );
}
