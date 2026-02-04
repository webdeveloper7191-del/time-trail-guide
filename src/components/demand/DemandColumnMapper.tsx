import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowRight, ArrowLeft, Check, AlertTriangle, X, 
  Calendar, MapPin, Users, Clock, FileText 
} from 'lucide-react';
import { 
  ColumnMappingConfig, 
  DemandImportType,
  DEMAND_TARGET_FIELDS,
  TransformType,
  TargetFieldDefinition,
  demandCSVImport,
  TRANSFORM_OPTIONS,
} from '@/lib/etl/demandCSVImport';
import { cn } from '@/lib/utils';

interface DemandColumnMapperProps {
  importType: DemandImportType;
  sourceColumns: string[];
  mappings: ColumnMappingConfig[];
  onMappingsChange: (mappings: ColumnMappingConfig[]) => void;
  sampleData?: Record<string, any>[];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Identification: <FileText className="h-4 w-4" />,
  Configuration: <Clock className="h-4 w-4" />,
  Location: <MapPin className="h-4 w-4" />,
  Booking: <Calendar className="h-4 w-4" />,
  Child: <Users className="h-4 w-4" />,
  Summary: <Calendar className="h-4 w-4" />,
  Counts: <Users className="h-4 w-4" />,
  Record: <FileText className="h-4 w-4" />,
  Attendance: <Users className="h-4 w-4" />,
  Metadata: <FileText className="h-4 w-4" />,
  Event: <Clock className="h-4 w-4" />,
  Other: <FileText className="h-4 w-4" />,
};

export function DemandColumnMapper({ 
  importType,
  sourceColumns, 
  mappings, 
  onMappingsChange,
  sampleData = []
}: DemandColumnMapperProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const targetFields = DEMAND_TARGET_FIELDS[importType];

  // Get suggested mappings with confidence scores
  const suggestedMappings = useMemo(() => {
    demandCSVImport.setImportType(importType);
    return demandCSVImport.getSuggestedMappings(sourceColumns);
  }, [sourceColumns, importType]);

  // Get confidence for a mapping
  const getConfidence = (sourceColumn: string, targetField: string): number | null => {
    const columnSuggestions = suggestedMappings.find(s => s.sourceColumn === sourceColumn);
    if (!columnSuggestions) return null;
    const suggestion = columnSuggestions.suggestions.find(s => s.targetField === targetField);
    return suggestion?.confidence || null;
  };

  // Group target fields by category
  const fieldsByCategory = useMemo(() => {
    const grouped: Record<string, TargetFieldDefinition[]> = {};
    for (const field of targetFields) {
      if (!grouped[field.category]) {
        grouped[field.category] = [];
      }
      grouped[field.category].push(field);
    }
    return grouped;
  }, [targetFields]);

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
    const required = targetFields.filter(f => f.required);
    const mapped = required.filter(f => getMappingForTarget(f.path));
    return { total: required.length, mapped: mapped.length };
  }, [mappings, targetFields]);

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

  // Auto-expand first category with unmapped required fields
  useMemo(() => {
    if (expandedCategory === null) {
      for (const [category, fields] of Object.entries(fieldsByCategory)) {
        const hasUnmappedRequired = fields.some(f => f.required && !getMappingForTarget(f.path));
        if (hasUnmappedRequired) {
          setExpandedCategory(category);
          break;
        }
      }
    }
  }, [fieldsByCategory, expandedCategory]);

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
                    ? targetFields.find(f => f.path === mapping.targetField)
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
                            {/* Confidence badge */}
                            {mapping && (() => {
                              const confidence = getConfidence(column, mapping.targetField);
                              if (confidence && confidence >= 70) {
                                return (
                                  <Badge 
                                    variant="secondary" 
                                    className={cn(
                                      "text-[10px] px-1.5 py-0",
                                      confidence >= 90 ? "bg-green-100 text-green-700" :
                                      confidence >= 80 ? "bg-blue-100 text-blue-700" :
                                      "bg-amber-100 text-amber-700"
                                    )}
                                  >
                                    {confidence}% match
                                  </Badge>
                                );
                              }
                              return null;
                            })()}
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
              <Calendar className="h-4 w-4" />
              Target Fields
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
                          {CATEGORY_ICONS[category] || <FileText className="h-4 w-4" />}
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
                                  "flex items-center justify-between p-2 rounded text-sm gap-2",
                                  mapping ? "bg-green-500/10" : ""
                                )}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                                  {mapping ? (
                                    <Check className="h-3 w-3 text-green-500 shrink-0" />
                                  ) : field.required ? (
                                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                  ) : (
                                    <div className="h-3 w-3 shrink-0" />
                                  )}
                                  <span className={cn("truncate", field.required && "font-medium")}>
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                  </span>
                                </div>
                                
                                {/* Mapping dropdown for database field */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <ArrowLeft className="h-3 w-3 text-muted-foreground" />
                                  <Select
                                    value={mapping?.sourceColumn || 'unmapped'}
                                    onValueChange={(value) => {
                                      if (value === 'unmapped') {
                                        onMappingsChange(mappings.filter(m => m.targetField !== field.path));
                                      } else {
                                        updateMapping(value, field.path);
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="w-[140px] h-7 text-xs">
                                      <SelectValue placeholder="Select source..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="unmapped">
                                        <span className="text-muted-foreground">Not mapped</span>
                                      </SelectItem>
                                      {sourceColumns.map((col) => {
                                        const isUsed = getMappingForSource(col) && 
                                                       getMappingForSource(col)?.targetField !== field.path;
                                        return (
                                          <SelectItem 
                                            key={col} 
                                            value={col}
                                            disabled={isUsed}
                                          >
                                            <span className={cn(isUsed && "text-muted-foreground")}>
                                              {col}
                                              {isUsed && " (used)"}
                                            </span>
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                </div>
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
