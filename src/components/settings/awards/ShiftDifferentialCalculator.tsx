import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Calculator, Clock, DollarSign, Calendar, Sun, Moon, 
  Sparkles, TrendingUp, ArrowRight, RefreshCw, Copy
} from 'lucide-react';
import { australianAwards, calculateRates } from '@/data/australianAwards';

interface CalculationResult {
  baseRate: number;
  casualLoading: number;
  penaltyRate: number;
  overtimeRate: number;
  totalHourlyRate: number;
  totalPay: number;
  breakdown: {
    label: string;
    hours: number;
    rate: number;
    amount: number;
  }[];
}

const daysOfWeek = [
  { value: 'monday', label: 'Monday', penalty: 'weekday' },
  { value: 'tuesday', label: 'Tuesday', penalty: 'weekday' },
  { value: 'wednesday', label: 'Wednesday', penalty: 'weekday' },
  { value: 'thursday', label: 'Thursday', penalty: 'weekday' },
  { value: 'friday', label: 'Friday', penalty: 'weekday' },
  { value: 'saturday', label: 'Saturday', penalty: 'saturday' },
  { value: 'sunday', label: 'Sunday', penalty: 'sunday' },
];

export function ShiftDifferentialCalculator() {
  const [selectedAward, setSelectedAward] = useState('children-services-2020');
  const [selectedClassification, setSelectedClassification] = useState('');
  const [employmentType, setEmploymentType] = useState<'permanent' | 'casual'>('permanent');
  const [dayOfWeek, setDayOfWeek] = useState('monday');
  const [isPublicHoliday, setIsPublicHoliday] = useState(false);
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('17:00');
  const [breakMinutes, setBreakMinutes] = useState('30');
  const [result, setResult] = useState<CalculationResult | null>(null);

  const award = australianAwards.find(a => a.id === selectedAward);
  const classification = award?.classifications.find(c => c.id === selectedClassification);

  const calculateShiftPay = () => {
    if (!award || !classification) {
      toast.error('Please select an award and classification');
      return;
    }

    const baseRate = classification.baseHourlyRate;
    const casualLoading = employmentType === 'casual' ? (baseRate * award.casualLoading / 100) : 0;
    const loadedBase = baseRate + casualLoading;

    // Calculate shift duration
    const [startHour, startMin] = shiftStart.split(':').map(Number);
    const [endHour, endMin] = shiftEnd.split(':').map(Number);
    let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight shifts
    const breakMins = parseInt(breakMinutes) || 0;
    const workedMinutes = totalMinutes - breakMins;
    const workedHours = workedMinutes / 60;

    // Determine penalty rate
    let penaltyMultiplier = 1;
    let penaltyLabel = 'Standard Rate';
    
    if (isPublicHoliday) {
      penaltyMultiplier = award.publicHolidayPenalty / 100;
      penaltyLabel = `Public Holiday (${award.publicHolidayPenalty}%)`;
    } else {
      const day = daysOfWeek.find(d => d.value === dayOfWeek);
      if (day?.penalty === 'saturday') {
        penaltyMultiplier = award.saturdayPenalty / 100;
        penaltyLabel = `Saturday (${award.saturdayPenalty}%)`;
      } else if (day?.penalty === 'sunday') {
        penaltyMultiplier = award.sundayPenalty / 100;
        penaltyLabel = `Sunday (${award.sundayPenalty}%)`;
      }
    }

    // Check for evening/night penalties
    let timeOfDayPenalty = 1;
    let timeOfDayLabel = '';
    if (startHour >= 18 && startHour < 22 && award.eveningPenalty) {
      timeOfDayPenalty = award.eveningPenalty / 100;
      timeOfDayLabel = `Evening Loading (${award.eveningPenalty}%)`;
    } else if ((startHour >= 22 || startHour < 6) && award.nightPenalty) {
      timeOfDayPenalty = award.nightPenalty / 100;
      timeOfDayLabel = `Night Loading (${award.nightPenalty}%)`;
    }

    // Calculate overtime (hours over 8)
    const regularHours = Math.min(workedHours, 8);
    const overtimeHours = Math.max(workedHours - 8, 0);
    const first2OTHours = Math.min(overtimeHours, 2);
    const beyondOTHours = Math.max(overtimeHours - 2, 0);

    // Build breakdown
    const breakdown: CalculationResult['breakdown'] = [];
    
    // Regular hours
    const regularRate = loadedBase * penaltyMultiplier * timeOfDayPenalty;
    breakdown.push({
      label: `Regular Hours (${penaltyLabel}${timeOfDayLabel ? ' + ' + timeOfDayLabel : ''})`,
      hours: regularHours,
      rate: regularRate,
      amount: regularHours * regularRate,
    });

    // Overtime - first 2 hours
    if (first2OTHours > 0) {
      const otRate = loadedBase * (award.overtimeRates.first2Hours / 100);
      breakdown.push({
        label: `Overtime (First 2 hrs @ ${award.overtimeRates.first2Hours}%)`,
        hours: first2OTHours,
        rate: otRate,
        amount: first2OTHours * otRate,
      });
    }

    // Overtime - beyond 2 hours
    if (beyondOTHours > 0) {
      const otRate = loadedBase * (award.overtimeRates.after2Hours / 100);
      breakdown.push({
        label: `Overtime (After 2 hrs @ ${award.overtimeRates.after2Hours}%)`,
        hours: beyondOTHours,
        rate: otRate,
        amount: beyondOTHours * otRate,
      });
    }

    const totalPay = breakdown.reduce((sum, item) => sum + item.amount, 0);
    const avgHourlyRate = totalPay / workedHours;

    setResult({
      baseRate,
      casualLoading,
      penaltyRate: penaltyMultiplier * 100,
      overtimeRate: overtimeHours > 0 ? award.overtimeRates.first2Hours : 0,
      totalHourlyRate: avgHourlyRate,
      totalPay,
      breakdown,
    });

    toast.success('Shift pay calculated');
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const copyResultToClipboard = () => {
    if (!result) return;
    const text = result.breakdown.map(b => 
      `${b.label}: ${b.hours.toFixed(2)} hrs × ${formatCurrency(b.rate)}/hr = ${formatCurrency(b.amount)}`
    ).join('\n') + `\n\nTotal: ${formatCurrency(result.totalPay)}`;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Shift Differential Calculator</h3>
          <p className="text-sm text-muted-foreground">
            Calculate pay based on time of day, day of week, and applicable penalties
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="card-material-elevated">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              Shift Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Award Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Award</Label>
                <Select value={selectedAward} onValueChange={(v) => {
                  setSelectedAward(v);
                  setSelectedClassification('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select award" />
                  </SelectTrigger>
                  <SelectContent>
                    {australianAwards.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.shortName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Classification</Label>
                <Select value={selectedClassification} onValueChange={setSelectedClassification}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {award?.classifications.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.level} - {formatCurrency(c.baseHourlyRate)}/hr
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Employment Type */}
            <div className="space-y-2">
              <Label>Employment Type</Label>
              <Select value={employmentType} onValueChange={(v) => setEmploymentType(v as 'permanent' | 'casual')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent (Full/Part-time)</SelectItem>
                  <SelectItem value="casual">Casual (+{award?.casualLoading || 25}% loading)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Day & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Public Holiday
                  <Switch checked={isPublicHoliday} onCheckedChange={setIsPublicHoliday} />
                </Label>
                {isPublicHoliday && (
                  <Badge className="bg-red-500/10 text-red-700 border-red-200">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {award?.publicHolidayPenalty}% rate applies
                  </Badge>
                )}
              </div>
            </div>

            {/* Shift Times */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Shift Start</Label>
                <Input type="time" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Shift End</Label>
                <Input type="time" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Break (mins)</Label>
                <Input 
                  type="number" 
                  value={breakMinutes} 
                  onChange={(e) => setBreakMinutes(e.target.value)}
                  min="0"
                  max="120"
                />
              </div>
            </div>

            <Button onClick={calculateShiftPay} className="w-full gap-2">
              <Calculator className="h-4 w-4" />
              Calculate Shift Pay
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className={`card-material-elevated ${result ? 'ring-2 ring-primary/20' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Calculation Result
              </CardTitle>
              {result && (
                <Button variant="ghost" size="sm" onClick={copyResultToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Pay</p>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(result.totalPay)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Hourly Rate</p>
                    <p className="text-3xl font-bold">{formatCurrency(result.totalHourlyRate)}</p>
                  </div>
                </div>

                {/* Rate Info */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-muted-foreground text-xs">Base Rate</p>
                    <p className="font-semibold">{formatCurrency(result.baseRate)}/hr</p>
                  </div>
                  {result.casualLoading > 0 && (
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <p className="text-blue-700 text-xs">Casual Loading</p>
                      <p className="font-semibold text-blue-700">+{formatCurrency(result.casualLoading)}/hr</p>
                    </div>
                  )}
                  {result.penaltyRate > 100 && (
                    <div className="p-3 rounded-lg bg-amber-500/10">
                      <p className="text-amber-700 text-xs">Penalty Rate</p>
                      <p className="font-semibold text-amber-700">{result.penaltyRate}%</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Breakdown */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Pay Breakdown</p>
                  {result.breakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.hours.toFixed(2)} hrs × {formatCurrency(item.rate)}/hr
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(item.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Enter shift details and click calculate</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Reference */}
      {award && (
        <Card className="card-material bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
              {award.name} - Quick Reference
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Casual Loading</p>
                <p className="font-semibold">{award.casualLoading}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Saturday</p>
                <p className="font-semibold">{award.saturdayPenalty}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Sunday</p>
                <p className="font-semibold">{award.sundayPenalty}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Public Holiday</p>
                <p className="font-semibold">{award.publicHolidayPenalty}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">OT First 2hrs</p>
                <p className="font-semibold">{award.overtimeRates.first2Hours}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">OT After 2hrs</p>
                <p className="font-semibold">{award.overtimeRates.after2Hours}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}