import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowRight, Check, AlertTriangle, X, Wand2, 
  User, Briefcase, MapPin, Building2, CreditCard, FileText 
} from 'lucide-react';
import { 
  ColumnMappingConfig, 
  STAFF_TARGET_FIELDS, 
  TransformType,
  TargetFieldDefinition 
} from '@/lib/etl/staffETL';
import { cn } from '@/lib/utils';

interface StaffColumnMapperProps {
  sourceColumns: string[];
  mappings: ColumnMappingConfig[];
  onMappingsChange: (mappings: ColumnMappingConfig[]) => void;
  sampleData?: Record<string, any>[];
}

const TRANSFORM_OPTIONS: { value: TransformType; label: string }[] = [
  { value: 'none', label: 'No transform' },
  { value: 'trim', label: 'Trim whitespace' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'date_dmy', label: 'Date (DD/MM/YYYY)' },
  { value: 'date_mdy', label: 'Date (MM/DD/YYYY)' },
  { value: 'date_ymd', label: 'Date (YYYY-MM-DD)' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'phone_au', label: 'AU Phone' },
  { value: 'employment_status', label: 'Employment Status' },
  { value: 'employment_type', label: 'Employment Type' },
  { value: 'gender', label: 'Gender' },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Personal: <User className="h-4 w-4" />,
  Employment: <Briefcase className="h-4 w-4" />,
  Address: <MapPin className="h-4 w-4" />,
  Bank: <CreditCard className="h-4 w-4" />,
  Pay: <Building2 className="h-4 w-4" />,
  Other: <FileText className="h-4 w-4" />,
};

export function StaffColumnMapper({ 
  sourceColumns, 
  mappings, 
  onMappingsChange,
  sampleData = []
}: StaffColumnMapperProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Personal');

  // Group target fields by category
  const fieldsByCategory = useMemo(() => {
    const grouped: Record<string, TargetFieldDefinition[]> = {};
    for (const field of STAFF_TARGET_FIELDS) {
      if (!grouped[field.category]) {
        grouped[field.category] = [];
      }
      grouped[field.category].push(field);
    }
    return grouped;
  }, []);

  // Get mapping for a source column
  const getMappingForSource = (sourceColumn: string) => {
    return mappings.find(m => m.sourceColumn === sourceColumn);
  };

  // Get mapping for a target field
  const getMappingForTarget = (targetField: string) => {
    return mappings.find(m => m.targetField === targetField);
  };

  // Check which required fields are mapped
  const mappedRequiredFields = useMemo(() => {
    const required = STAFF_TARGET_FIELDS.filter(f => f.required);
    const mapped = required.filter(f => getMappingForTarget(f.path));
    return { total: required.length, mapped: mapped.length };
  }, [mappings]);

  // Update a mapping
  const updateMapping = (sourceColumn: string, targetField: string, transformType: TransformType = 'none') => {
    const newMappings = mappings.filter(m => m.sourceColumn !== sourceColumn && m.targetField !== targetField);
    if (targetField && targetField !== 'unmapped') {
      newMappings.push({ sourceColumn, targetField, transformType });
    }
    onMappingsChange(newMappings);
  };

  // Update transform for a mapping
  const updateTransform = (sourceColumn: string, transformType: TransformType) => {
    const mapping = getMappingForSource(sourceColumn);
    if (mapping) {
      const newMappings = mappings.map(m => 
        m.sourceColumn === sourceColumn 
          ? { ...m, transformType } 
          : m
      );
      onMappingsChange(newMappings);
    }
  };

  // Get sample value for a column
  const getSampleValue = (column: string): string => {
    if (sampleData.length === 0) return '';
    const value = sampleData[0][column];
    return value !== undefined ? String(value) : '';
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Required Fields Mapped</span>
            <Badge variant={mappedRequiredFields.mapped === mappedRequiredFields.total ? 'default' : 'secondary'}>
              {mappedRequiredFields.mapped} / {mappedRequiredFields.total}
            </Badge>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-300",
                mappedRequiredFields.mapped === mappedRequiredFields.total 
                  ? "bg-green-500" 
                  : "bg-primary"
              )}
              style={{ width: `${(mappedRequiredFields.mapped / mappedRequiredFields.total) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Columns */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Source Columns ({sourceColumns.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-2">
                {sourceColumns.map((column) => {
                  const mapping = getMappingForSource(column);
                  const sampleValue = getSampleValue(column);
                  const targetDef = mapping 
                    ? STAFF_TARGET_FIELDS.find(f => f.path === mapping.targetField)
                    : null;

                  return (
                    <div 
                      key={column}
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        mapping ? "bg-green-500/5 border-green-500/20" : "bg-muted/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {mapping ? (
                              <Check className="h-4 w-4 text-green-500 shrink-0" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <span className="font-medium text-sm truncate">{column}</span>
                          </div>
                          {sampleValue && (
                            <p className="text-xs text-muted-foreground mt-1 ml-6 truncate">
                              Sample: {sampleValue}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Select
                            value={mapping?.targetField || 'unmapped'}
                            onValueChange={(value) => updateMapping(column, value)}
                          >
                            <SelectTrigger className="w-[180px] h-8 text-xs">
                              <SelectValue placeholder="Map to field..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unmapped">
                                <span className="text-muted-foreground">Don't import</span>
                              </SelectItem>
                              {Object.entries(fieldsByCategory).map(([category, fields]) => (
                                <div key={category}>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                                    {category}
                                  </div>
                                  {fields.map((field) => {
                                    const isUsed = getMappingForTarget(field.path) && 
                                                   getMappingForTarget(field.path)?.sourceColumn !== column;
                                    return (
                                      <SelectItem 
                                        key={field.path} 
                                        value={field.path}
                                        disabled={isUsed}
                                      >
                                        <span className="flex items-center gap-2">
                                          {field.label}
                                          {field.required && (
                                            <span className="text-red-500">*</span>
                                          )}
                                          {isUsed && (
                                            <span className="text-xs text-muted-foreground">(used)</span>
                                          )}
                                        </span>
                                      </SelectItem>
                                    );
                                  })}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Transform selector */}
                      {mapping && (
                        <div className="mt-2 ml-6 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Transform:</span>
                          <Select
                            value={mapping.transformType || 'none'}
                            onValueChange={(value) => updateTransform(column, value as TransformType)}
                          >
                            <SelectTrigger className="w-[150px] h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TRANSFORM_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Target Fields by Category */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Database Fields
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-3">
                {Object.entries(fieldsByCategory).map(([category, fields]) => {
                  const mappedCount = fields.filter(f => getMappingForTarget(f.path)).length;
                  const requiredCount = fields.filter(f => f.required).length;
                  const isExpanded = expandedCategory === category;

                  return (
                    <div key={category} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedCategory(isExpanded ? null : category)}
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {CATEGORY_ICONS[category]}
                          <span className="font-medium text-sm">{category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={mappedCount === fields.length ? 'default' : 'outline'} className="text-xs">
                            {mappedCount}/{fields.length}
                          </Badge>
                          {requiredCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {requiredCount} required
                            </Badge>
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t bg-muted/30 p-2 space-y-1">
                          {fields.map((field) => {
                            const mapping = getMappingForTarget(field.path);
                            return (
                              <div 
                                key={field.path}
                                className={cn(
                                  "flex items-center justify-between p-2 rounded text-sm",
                                  mapping ? "bg-green-500/10" : ""
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  {mapping ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : field.required ? (
                                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                                  ) : (
                                    <div className="h-3 w-3" />
                                  )}
                                  <span className={cn(field.required && "font-medium")}>
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                  </span>
                                </div>
                                {mapping && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                    ← {mapping.sourceColumn}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
