import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  GitCompare, Award, DollarSign, Percent, Clock, 
  TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle,
  ArrowRight, Download, FileText
} from 'lucide-react';
import { australianAwards, AustralianAward, calculateRates } from '@/data/australianAwards';

export function AwardComparisonPanel() {
  const [selectedAwards, setSelectedAwards] = useState<string[]>(['children-services-2020']);
  const [comparisonType, setComparisonType] = useState<'rates' | 'penalties' | 'allowances' | 'overtime'>('rates');

  const awards = selectedAwards
    .map(id => australianAwards.find(a => a.id === id))
    .filter(Boolean) as AustralianAward[];

  const addAwardToCompare = (awardId: string) => {
    if (!selectedAwards.includes(awardId) && selectedAwards.length < 4) {
      setSelectedAwards([...selectedAwards, awardId]);
    }
  };

  const removeAwardFromCompare = (awardId: string) => {
    setSelectedAwards(selectedAwards.filter(id => id !== awardId));
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatPercent = (value: number) => `${value}%`;

  const getComparisonIndicator = (values: number[], index: number) => {
    if (values.length < 2) return null;
    const currentValue = values[index];
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    
    if (currentValue === maxValue && maxValue !== minValue) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (currentValue === minValue && maxValue !== minValue) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const renderRatesComparison = () => {
    if (awards.length === 0) return null;
    
    const maxClassifications = Math.max(...awards.map(a => a.classifications.length));
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background">Classification</TableHead>
            {awards.map(award => (
              <TableHead key={award.id} className="text-center min-w-32">
                <div className="flex flex-col items-center gap-1">
                  <span className="font-semibold truncate max-w-32" title={award.name}>
                    {award.name.split(' ').slice(0, 2).join(' ')}
                  </span>
                  <Badge variant="outline" className="text-xs">{award.code}</Badge>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: maxClassifications }).map((_, levelIndex) => {
            const rates = awards.map(award => {
              const classification = award.classifications[levelIndex];
              return classification ? classification.baseHourlyRate : null;
            });
            const validRates = rates.filter(r => r !== null) as number[];
            
            return (
              <TableRow key={levelIndex}>
                <TableCell className="sticky left-0 bg-background font-medium">
                  Level {levelIndex + 1}
                </TableCell>
                {awards.map((award, awardIndex) => {
                  const classification = award.classifications[levelIndex];
                  if (!classification) {
                    return <TableCell key={award.id} className="text-center text-muted-foreground">—</TableCell>;
                  }
                  return (
                    <TableCell key={award.id} className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-mono font-semibold">
                          {formatCurrency(classification.baseHourlyRate)}
                        </span>
                        {getComparisonIndicator(validRates, awardIndex)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {classification.description}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  const renderPenaltiesComparison = () => {
    const penaltyTypes = [
      { key: 'casualLoading', label: 'Casual Loading' },
      { key: 'saturdayPenalty', label: 'Saturday' },
      { key: 'sundayPenalty', label: 'Sunday' },
      { key: 'publicHolidayPenalty', label: 'Public Holiday' },
      { key: 'eveningPenalty', label: 'Evening' },
      { key: 'nightPenalty', label: 'Night' },
    ];

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background">Penalty Type</TableHead>
            {awards.map(award => (
              <TableHead key={award.id} className="text-center min-w-32">
                <div className="flex flex-col items-center gap-1">
                  <span className="font-semibold truncate max-w-32" title={award.name}>
                    {award.name.split(' ').slice(0, 2).join(' ')}
                  </span>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {penaltyTypes.map(penalty => {
            const values = awards.map(award => (award as any)[penalty.key] || 0);
            
            return (
              <TableRow key={penalty.key}>
                <TableCell className="sticky left-0 bg-background font-medium">
                  {penalty.label}
                </TableCell>
                {awards.map((award, index) => {
                  const value = (award as any)[penalty.key];
                  return (
                    <TableCell key={award.id} className="text-center">
                      {value ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono font-semibold">{formatPercent(value)}</span>
                          {getComparisonIndicator(values.filter(v => v > 0), index)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  const renderOvertimeComparison = () => {
    const overtimeTypes = [
      { key: 'first2Hours', label: 'First 2 Hours' },
      { key: 'after2Hours', label: 'After 2 Hours' },
      { key: 'sundayOvertime', label: 'Sunday Overtime' },
    ];

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background">Overtime Type</TableHead>
            {awards.map(award => (
              <TableHead key={award.id} className="text-center min-w-32">
                <div className="flex flex-col items-center gap-1">
                  <span className="font-semibold truncate max-w-32" title={award.name}>
                    {award.name.split(' ').slice(0, 2).join(' ')}
                  </span>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {overtimeTypes.map(overtime => {
            const values = awards.map(award => award.overtimeRates[overtime.key as keyof typeof award.overtimeRates] || 0);
            
            return (
              <TableRow key={overtime.key}>
                <TableCell className="sticky left-0 bg-background font-medium">
                  {overtime.label}
                </TableCell>
                {awards.map((award, index) => {
                  const value = award.overtimeRates[overtime.key as keyof typeof award.overtimeRates];
                  return (
                    <TableCell key={award.id} className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-mono font-semibold">{formatPercent(value)}</span>
                        {getComparisonIndicator(values, index)}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  const renderAllowancesComparison = () => {
    const allAllowances = new Set<string>();
    awards.forEach(award => {
      award.allowances.forEach(a => allAllowances.add(a.name));
    });

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background">Allowance</TableHead>
            {awards.map(award => (
              <TableHead key={award.id} className="text-center min-w-32">
                <div className="flex flex-col items-center gap-1">
                  <span className="font-semibold truncate max-w-32" title={award.name}>
                    {award.name.split(' ').slice(0, 2).join(' ')}
                  </span>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from(allAllowances).map(allowanceName => (
            <TableRow key={allowanceName}>
              <TableCell className="sticky left-0 bg-background font-medium">
                {allowanceName}
              </TableCell>
              {awards.map(award => {
                const allowance = award.allowances.find(a => a.name === allowanceName);
                return (
                  <TableCell key={award.id} className="text-center">
                    {allowance ? (
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-semibold">
                          {formatCurrency(allowance.amount)}
                        </span>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {allowance.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Award Comparison Tool</h3>
          <p className="text-sm text-muted-foreground">
            Compare rates, penalties, and allowances across different awards
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Comparison
        </Button>
      </div>

      {/* Award Selection */}
      <Card className="card-material">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            Select Awards to Compare
          </CardTitle>
          <CardDescription>Choose up to 4 awards for side-by-side comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select onValueChange={addAwardToCompare}>
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Add award to comparison..." />
              </SelectTrigger>
              <SelectContent>
                {australianAwards
                  .filter(a => !selectedAwards.includes(a.id))
                  .map(award => (
                    <SelectItem key={award.id} value={award.id}>
                      {award.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            
            <div className="flex flex-wrap gap-2">
              {awards.map(award => (
                <Badge 
                  key={award.id} 
                  variant="secondary" 
                  className="flex items-center gap-2 py-1.5 px-3"
                >
                  <Award className="h-3 w-3" />
                  {award.name.split(' ').slice(0, 2).join(' ')}
                  <button 
                    onClick={() => removeAwardFromCompare(award.id)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Type Tabs */}
      <div className="flex gap-2">
        {[
          { value: 'rates', label: 'Pay Rates', icon: DollarSign },
          { value: 'penalties', label: 'Penalties', icon: Percent },
          { value: 'overtime', label: 'Overtime', icon: Clock },
          { value: 'allowances', label: 'Allowances', icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.value}
              variant={comparisonType === tab.value ? 'default' : 'outline'}
              onClick={() => setComparisonType(tab.value as typeof comparisonType)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Comparison Table */}
      {awards.length > 0 ? (
        <Card className="card-material-elevated">
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <div className="min-w-full p-4">
                {comparisonType === 'rates' && renderRatesComparison()}
                {comparisonType === 'penalties' && renderPenaltiesComparison()}
                {comparisonType === 'overtime' && renderOvertimeComparison()}
                {comparisonType === 'allowances' && renderAllowancesComparison()}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <Card className="card-material">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitCompare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Awards Selected</h3>
            <p className="text-muted-foreground">Select at least one award to view comparison data</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Summary */}
      {awards.length >= 2 && (
        <Card className="card-material bg-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Quick Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Highest Base Rate:</span>
                <p className="font-semibold">
                  {awards.reduce((max, a) => {
                    const highest = Math.max(...a.classifications.map(c => c.baseHourlyRate));
                    return highest > max.rate ? { award: a.name, rate: highest } : max;
                  }, { award: '', rate: 0 }).award}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Best Sunday Rate:</span>
                <p className="font-semibold">
                  {awards.reduce((max, a) => 
                    a.sundayPenalty > max.rate ? { award: a.name, rate: a.sundayPenalty } : max
                  , { award: '', rate: 0 }).award} ({Math.max(...awards.map(a => a.sundayPenalty))}%)
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Most Allowances:</span>
                <p className="font-semibold">
                  {awards.reduce((max, a) => 
                    a.allowances.length > max.count ? { award: a.name, count: a.allowances.length } : max
                  , { award: '', count: 0 }).award} ({Math.max(...awards.map(a => a.allowances.length))} types)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}