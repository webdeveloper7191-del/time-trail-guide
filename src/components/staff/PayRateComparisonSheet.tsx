import { useState, useMemo } from 'react';
import { StaffMember } from '@/types/staff';
import { australianAwards, getAwardById, calculateRates } from '@/data/australianAwards';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Scale,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Calendar,
  Percent,
  Info,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PayRateComparisonSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember;
}

export function PayRateComparisonSheet({ open, onOpenChange, staff }: PayRateComparisonSheetProps) {
  const [selectedAwardId, setSelectedAwardId] = useState(australianAwards[0].id);
  const [employmentType, setEmploymentType] = useState<'full_time' | 'casual'>('full_time');
  const [activeTab, setActiveTab] = useState('classification');

  const currentRate = staff.currentPayCondition?.hourlyRate || 0;
  const selectedAward = getAwardById(selectedAwardId);

  const comparisonData = useMemo(() => {
    if (!selectedAward) return [];

    return selectedAward.classifications.map((classification) => {
      const rates = calculateRates(selectedAward, classification, employmentType);
      const difference = rates.effectiveRate - currentRate;
      const percentDiff = currentRate > 0 ? (difference / currentRate) * 100 : 0;

      return {
        classification,
        rates,
        difference,
        percentDiff,
      };
    });
  }, [selectedAward, employmentType, currentRate]);

  const getDifferenceIndicator = (diff: number) => {
    if (diff > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (diff < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getDifferenceBadge = (diff: number, percentDiff: number) => {
    const formatted = `${diff >= 0 ? '+' : ''}$${diff.toFixed(2)} (${percentDiff >= 0 ? '+' : ''}${percentDiff.toFixed(1)}%)`;
    
    if (diff > 0) {
      return <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20">{formatted}</Badge>;
    }
    if (diff < 0) {
      return <Badge className="bg-red-500/10 text-red-700 hover:bg-red-500/20">{formatted}</Badge>;
    }
    return <Badge variant="secondary">{formatted}</Badge>;
  };

  // Cross-award comparison
  const crossAwardComparison = useMemo(() => {
    return australianAwards.map((award) => {
      // Get median classification rate
      const sortedRates = award.classifications
        .map((c) => c.baseHourlyRate)
        .sort((a, b) => a - b);
      const medianRate = sortedRates[Math.floor(sortedRates.length / 2)];
      const minRate = sortedRates[0];
      const maxRate = sortedRates[sortedRates.length - 1];
      
      const effectiveMedian = employmentType === 'casual' 
        ? medianRate * (1 + award.casualLoading / 100)
        : medianRate;

      return {
        award,
        minRate,
        maxRate,
        medianRate,
        effectiveMedian,
        difference: effectiveMedian - currentRate,
      };
    });
  }, [employmentType, currentRate]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Pay Rate Comparison
          </SheetTitle>
          <SheetDescription>
            Compare {staff.firstName}'s current rate against award classifications
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Current Rate Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Hourly Rate</p>
                  <p className="text-3xl font-bold">${currentRate.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {staff.currentPayCondition?.industryAward || 'Custom Rate'} • {staff.currentPayCondition?.classification || 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Weekly (38hrs)</p>
                  <p className="text-xl font-semibold">${(currentRate * 38).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground mt-2">Annual</p>
                  <p className="text-xl font-semibold">${(currentRate * 38 * 52).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Compare Against Award</label>
              <Select value={selectedAwardId} onValueChange={setSelectedAwardId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {australianAwards.map((award) => (
                    <SelectItem key={award.id} value={award.id}>
                      {award.shortName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <label className="text-sm font-medium mb-2 block">Employment Type</label>
              <Select value={employmentType} onValueChange={(v) => setEmploymentType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time / Part Time</SelectItem>
                  <SelectItem value="casual">Casual (incl. loading)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="classification" className="flex-1">Classification Comparison</TabsTrigger>
              <TabsTrigger value="cross-award" className="flex-1">Cross-Award Comparison</TabsTrigger>
              <TabsTrigger value="penalty" className="flex-1">Penalty Rates</TabsTrigger>
            </TabsList>

            {/* Classification Comparison */}
            <TabsContent value="classification" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">
                    {selectedAward?.name} Classifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Level</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Base Rate</TableHead>
                        <TableHead className="text-right">Effective Rate</TableHead>
                        <TableHead className="text-right">Difference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparisonData.map(({ classification, rates, difference, percentDiff }) => (
                        <TableRow 
                          key={classification.id}
                          className={cn(
                            Math.abs(difference) < 0.5 && "bg-primary/5"
                          )}
                        >
                          <TableCell className="font-medium">{classification.level}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {classification.description}
                          </TableCell>
                          <TableCell className="text-right">
                            ${classification.baseHourlyRate.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${rates.effectiveRate.toFixed(2)}
                            {employmentType === 'casual' && (
                              <span className="text-xs text-muted-foreground ml-1">
                                (+{selectedAward?.casualLoading}%)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {getDifferenceIndicator(difference)}
                              {getDifferenceBadge(difference, percentDiff)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cross-Award Comparison */}
            <TabsContent value="cross-award" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    All Awards Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {crossAwardComparison.map(({ award, minRate, maxRate, effectiveMedian, difference }) => (
                    <div key={award.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{award.shortName}</h4>
                          <p className="text-xs text-muted-foreground">{award.industry}</p>
                        </div>
                        {getDifferenceBadge(difference, currentRate > 0 ? (difference / currentRate) * 100 : 0)}
                      </div>
                      
                      {/* Rate range visualization */}
                      <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="absolute h-full bg-gradient-to-r from-primary/30 to-primary/60 rounded-full"
                          style={{
                            left: `${(minRate / 60) * 100}%`,
                            right: `${100 - (maxRate / 60) * 100}%`,
                          }}
                        />
                        {/* Current rate marker */}
                        <div 
                          className="absolute top-0 h-full w-0.5 bg-red-500"
                          style={{ left: `${(currentRate / 60) * 100}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>Min: ${minRate.toFixed(2)}</span>
                        <span>Median: ${effectiveMedian.toFixed(2)}</span>
                        <span>Max: ${maxRate.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Penalty Rates */}
            <TabsContent value="penalty" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">
                    Penalty Rates - {selectedAward?.shortName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Condition</TableHead>
                        <TableHead className="text-right">Multiplier</TableHead>
                        <TableHead className="text-right">Your Effective Rate</TableHead>
                        <TableHead className="text-right">Weekly Impact (8hrs)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Saturday Work</TableCell>
                        <TableCell className="text-right">{selectedAward?.saturdayPenalty}%</TableCell>
                        <TableCell className="text-right font-medium">
                          ${(currentRate * (selectedAward?.saturdayPenalty || 100) / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          +${((currentRate * (selectedAward?.saturdayPenalty || 100) / 100 - currentRate) * 8).toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Sunday Work</TableCell>
                        <TableCell className="text-right">{selectedAward?.sundayPenalty}%</TableCell>
                        <TableCell className="text-right font-medium">
                          ${(currentRate * (selectedAward?.sundayPenalty || 100) / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          +${((currentRate * (selectedAward?.sundayPenalty || 100) / 100 - currentRate) * 8).toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Public Holiday</TableCell>
                        <TableCell className="text-right">{selectedAward?.publicHolidayPenalty}%</TableCell>
                        <TableCell className="text-right font-medium">
                          ${(currentRate * (selectedAward?.publicHolidayPenalty || 100) / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          +${((currentRate * (selectedAward?.publicHolidayPenalty || 100) / 100 - currentRate) * 8).toFixed(2)}
                        </TableCell>
                      </TableRow>
                      {selectedAward?.eveningPenalty && (
                        <TableRow>
                          <TableCell>Evening Work</TableCell>
                          <TableCell className="text-right">{selectedAward.eveningPenalty}%</TableCell>
                          <TableCell className="text-right font-medium">
                            ${(currentRate * selectedAward.eveningPenalty / 100).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            +${((currentRate * selectedAward.eveningPenalty / 100 - currentRate) * 8).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow className="border-t-2">
                        <TableCell className="font-medium">Overtime (first 2 hours)</TableCell>
                        <TableCell className="text-right">{selectedAward?.overtimeRates.first2Hours}%</TableCell>
                        <TableCell className="text-right font-medium">
                          ${(currentRate * (selectedAward?.overtimeRates.first2Hours || 100) / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">-</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Overtime (after 2 hours)</TableCell>
                        <TableCell className="text-right">{selectedAward?.overtimeRates.after2Hours}%</TableCell>
                        <TableCell className="text-right font-medium">
                          ${(currentRate * (selectedAward?.overtimeRates.after2Hours || 100) / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">-</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Info Card */}
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">About this comparison</p>
                  <p className="mt-1 text-blue-600">
                    Rates shown are based on Fair Work Commission Modern Awards as of July 2024. 
                    Casual rates include the standard 25% casual loading. Always verify rates against 
                    the official Fair Work website for the most current information.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
