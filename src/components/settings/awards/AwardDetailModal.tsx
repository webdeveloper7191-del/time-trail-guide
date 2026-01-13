import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Award,
  Copy,
  FileText,
  FileSpreadsheet,
  Clock,
  DollarSign,
  TrendingUp,
  Percent,
  Edit2,
  Check,
  X,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { AustralianAward, AwardClassification, calculateRates } from '@/data/australianAwards';
import { exportAwardToPDF, exportAwardToExcel } from '@/lib/awardExport';

interface AwardDetailModalProps {
  award: AustralianAward;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customRates?: Record<string, number>;
  onCustomRatesChange?: (rates: Record<string, number>) => void;
}

export function AwardDetailModal({ 
  award, 
  open, 
  onOpenChange,
  customRates = {},
  onCustomRatesChange 
}: AwardDetailModalProps) {
  const [editingClassificationId, setEditingClassificationId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [localCustomRates, setLocalCustomRates] = useState<Record<string, number>>(customRates);

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const handleStartEdit = (classification: AwardClassification) => {
    setEditingClassificationId(classification.id);
    setEditValue(localCustomRates[classification.id]?.toString() || classification.baseHourlyRate.toString());
  };

  const handleSaveEdit = (classificationId: string) => {
    const numValue = parseFloat(editValue);
    if (!isNaN(numValue) && numValue > 0) {
      const newRates = { ...localCustomRates, [classificationId]: numValue };
      setLocalCustomRates(newRates);
      onCustomRatesChange?.(newRates);
      toast.success('Rate override saved');
    } else {
      toast.error('Please enter a valid rate');
    }
    setEditingClassificationId(null);
  };

  const handleCancelEdit = () => {
    setEditingClassificationId(null);
    setEditValue('');
  };

  const handleRemoveOverride = (classificationId: string) => {
    const newRates = { ...localCustomRates };
    delete newRates[classificationId];
    setLocalCustomRates(newRates);
    onCustomRatesChange?.(newRates);
    toast.success('Rate override removed');
  };

  const handleExportPDF = () => {
    exportAwardToPDF({ award, customRates: localCustomRates });
    toast.success('PDF exported successfully');
  };

  const handleExportExcel = () => {
    exportAwardToExcel({ award, customRates: localCustomRates });
    toast.success('Excel exported successfully');
  };

  const handleCopyRates = () => {
    const ratesText = award.classifications
      .map(c => {
        const override = localCustomRates[c.id];
        return `${c.level}: ${formatCurrency(override || c.baseHourlyRate)}${override ? ' (override)' : ''}`;
      })
      .join('\n');
    navigator.clipboard.writeText(ratesText);
    toast.success('Rates copied to clipboard');
  };

  const overrideCount = Object.keys(localCustomRates).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" style={{ width: '800px', maxWidth: '95vw' }}>
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="truncate">{award.shortName}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 flex-wrap mt-1">
                <Badge variant="outline" className="font-mono text-xs">{award.code}</Badge>
                <Badge variant="secondary" className="text-xs">{award.industry}</Badge>
                <span className="text-xs">Effective: {award.effectiveDate}</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="classifications" className="flex-1 flex flex-col overflow-hidden mt-4">
          <TabsList className="w-full justify-start shrink-0">
            <TabsTrigger value="classifications" className="gap-1.5 text-xs">
              <TrendingUp className="h-3.5 w-3.5" />
              Classifications
              {overrideCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{overrideCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="penalties" className="gap-1.5 text-xs">
              <Percent className="h-3.5 w-3.5" />
              Penalties
            </TabsTrigger>
            <TabsTrigger value="overtime" className="gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5" />
              Overtime
            </TabsTrigger>
            <TabsTrigger value="allowances" className="gap-1.5 text-xs">
              <DollarSign className="h-3.5 w-3.5" />
              Allowances
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4 -mx-6 px-6">
            <TabsContent value="classifications" className="mt-0 mb-4">
              <div className="space-y-4">
                {overrideCount > 0 && (
                  <Card className="bg-amber-500/10 border-amber-500/20">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm text-amber-800 dark:text-amber-200">
                          {overrideCount} custom rate override{overrideCount > 1 ? 's' : ''} applied
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setLocalCustomRates({});
                          onCustomRatesChange?.({});
                          toast.success('All overrides cleared');
                        }}
                        className="text-amber-700 hover:text-amber-800 h-7 text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Clear All
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs">Level</TableHead>
                        <TableHead className="text-xs">Description</TableHead>
                        <TableHead className="text-right text-xs w-24">Base</TableHead>
                        <TableHead className="text-right text-xs w-28">Custom</TableHead>
                        <TableHead className="text-right text-xs w-24">Casual</TableHead>
                        <TableHead className="w-20 text-center text-xs">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {award.classifications.map((classification) => {
                        const baseRate = localCustomRates[classification.id] || classification.baseHourlyRate;
                        const hasOverride = localCustomRates[classification.id] !== undefined;
                        const rates = calculateRates(
                          { ...award },
                          { ...classification, baseHourlyRate: baseRate },
                          'casual'
                        );
                        const isEditing = editingClassificationId === classification.id;

                        return (
                          <TableRow 
                            key={classification.id}
                            className={hasOverride ? 'bg-amber-500/5' : ''}
                          >
                            <TableCell className="font-medium text-sm py-2">
                              <div className="flex items-center gap-1.5">
                                {classification.level}
                                {hasOverride && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-700 border-amber-300">
                                    Override
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs py-2 max-w-[150px] truncate">
                              {classification.description}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm py-2">
                              <span className={hasOverride ? 'line-through text-muted-foreground' : ''}>
                                {formatCurrency(classification.baseHourlyRate)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right py-2">
                              {isEditing ? (
                                <div className="flex items-center gap-1 justify-end">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-20 h-7 text-right font-mono text-sm"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveEdit(classification.id);
                                      if (e.key === 'Escape') handleCancelEdit();
                                    }}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-green-600"
                                    onClick={() => handleSaveEdit(classification.id)}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive"
                                    onClick={handleCancelEdit}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <span className={`font-mono text-sm ${hasOverride ? 'text-amber-600 font-semibold' : 'text-muted-foreground'}`}>
                                  {hasOverride ? formatCurrency(localCustomRates[classification.id]) : '-'}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm text-primary py-2">
                              {formatCurrency(rates.casualLoadedRate || baseRate)}
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="flex items-center justify-center gap-1">
                                {!isEditing && (
                                  <>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => handleStartEdit(classification)}
                                          >
                                            <Edit2 className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Set custom rate</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    {hasOverride && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 text-destructive"
                                              onClick={() => handleRemoveOverride(classification.id)}
                                            >
                                              <RotateCcw className="h-3 w-3" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Reset to original</TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="penalties" className="mt-0 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Casual Loading</p>
                    <p className="text-2xl font-bold text-primary mt-1">{award.casualLoading}%</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Applied to base rate for casual employees</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Saturday Penalty</p>
                    <p className="text-2xl font-bold mt-1">{award.saturdayPenalty}%</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Of base rate for Saturday work</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Sunday Penalty</p>
                    <p className="text-2xl font-bold mt-1">{award.sundayPenalty}%</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Of base rate for Sunday work</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Public Holiday</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{award.publicHolidayPenalty}%</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Of base rate for public holidays</p>
                  </CardContent>
                </Card>
                {award.eveningPenalty && (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Evening Penalty</p>
                      <p className="text-2xl font-bold mt-1">{award.eveningPenalty}%</p>
                      <p className="text-[10px] text-muted-foreground mt-1">For evening shift work</p>
                    </CardContent>
                  </Card>
                )}
                {award.nightPenalty && (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Night Penalty</p>
                      <p className="text-2xl font-bold mt-1">{award.nightPenalty}%</p>
                      <p className="text-[10px] text-muted-foreground mt-1">For night shift work</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="overtime" className="mt-0 mb-4">
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">First 2 Hours</p>
                    <p className="text-3xl font-bold mt-1">{award.overtimeRates.first2Hours}%</p>
                    <p className="text-[10px] text-muted-foreground mt-1">of base rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">After 2 Hours</p>
                    <p className="text-3xl font-bold mt-1">{award.overtimeRates.after2Hours}%</p>
                    <p className="text-[10px] text-muted-foreground mt-1">of base rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-6 w-6 mx-auto text-amber-600 mb-2" />
                    <p className="text-xs text-muted-foreground">Sunday OT</p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">{award.overtimeRates.sundayOvertime}%</p>
                    <p className="text-[10px] text-muted-foreground mt-1">of base rate</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="allowances" className="mt-0 mb-4">
              {award.allowances.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs">Allowance Name</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-right text-xs">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {award.allowances.map((allowance) => (
                        <TableRow key={allowance.id}>
                          <TableCell className="font-medium text-sm py-2">
                            <div>
                              {allowance.name}
                              <p className="text-[10px] text-muted-foreground mt-0.5">{allowance.description}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge variant="secondary" className="capitalize text-xs">
                              {allowance.type.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold py-2">
                            {formatCurrency(allowance.amount)}
                            {allowance.type === 'per_km' && <span className="text-muted-foreground text-xs">/km</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <DollarSign className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="font-medium">No Allowances</p>
                  <p className="text-sm text-muted-foreground">This award has no defined allowances</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <SheetFooter>
          <div className="flex items-center gap-2 mr-auto">
            <Badge variant="outline" className="gap-1 text-xs">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              FWC 2024-25
            </Badge>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopyRates}>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Excel
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleExportPDF}>
            <FileText className="h-3.5 w-3.5" />
            PDF
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
