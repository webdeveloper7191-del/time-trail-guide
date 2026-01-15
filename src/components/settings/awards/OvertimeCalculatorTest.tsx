/**
 * Overtime Calculator Test Panel
 * Tests the unified overtime calculator with sample shifts
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calculator, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  RotateCcw,
  Calendar,
  Sun,
  Moon
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  calculateDailyOvertime, 
  calculateWeeklyOvertime,
  OvertimeBreakdown,
  WeeklyOvertimeBreakdown 
} from '@/lib/unifiedOvertimeCalculator';
import { 
  australianJurisdiction, 
  getJurisdictionByAward, 
  AwardType,
  penaltyRatesByAward 
} from '@/lib/australianJurisdiction';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  hoursWorked: number;
  baseHourlyRate: number;
  isCasual: boolean;
  awardType: AwardType;
  dayType: 'weekday' | 'saturday' | 'sunday' | 'public_holiday';
  isEveningShift: boolean;
  isNightShift: boolean;
  expectedResults?: {
    ordinaryHours?: number;
    overtimeHours?: number;
    hasOvertime?: boolean;
  };
}

const defaultScenarios: TestScenario[] = [
  {
    id: 'standard-weekday',
    name: 'Standard Weekday (8h)',
    description: 'Regular 8-hour weekday shift - no overtime expected',
    hoursWorked: 8,
    baseHourlyRate: 32.50,
    isCasual: false,
    awardType: 'children_services',
    dayType: 'weekday',
    isEveningShift: false,
    isNightShift: false,
    expectedResults: { ordinaryHours: 8, overtimeHours: 0, hasOvertime: false },
  },
  {
    id: 'overtime-weekday',
    name: 'Overtime Weekday (10h)',
    description: '10-hour weekday shift - 2h overtime at 1.5x',
    hoursWorked: 10,
    baseHourlyRate: 32.50,
    isCasual: false,
    awardType: 'children_services',
    dayType: 'weekday',
    isEveningShift: false,
    isNightShift: false,
    expectedResults: { ordinaryHours: 8, overtimeHours: 2, hasOvertime: true },
  },
  {
    id: 'extended-overtime',
    name: 'Extended Overtime (12h)',
    description: '12-hour shift - 2h at 1.5x, 2h at 2x',
    hoursWorked: 12,
    baseHourlyRate: 32.50,
    isCasual: false,
    awardType: 'children_services',
    dayType: 'weekday',
    isEveningShift: false,
    isNightShift: false,
    expectedResults: { ordinaryHours: 8, overtimeHours: 4, hasOvertime: true },
  },
  {
    id: 'saturday-shift',
    name: 'Saturday Shift (8h)',
    description: 'Saturday shift with 150% penalty rate',
    hoursWorked: 8,
    baseHourlyRate: 32.50,
    isCasual: false,
    awardType: 'children_services',
    dayType: 'saturday',
    isEveningShift: false,
    isNightShift: false,
    expectedResults: { ordinaryHours: 8, overtimeHours: 0, hasOvertime: false },
  },
  {
    id: 'sunday-shift',
    name: 'Sunday Shift (8h)',
    description: 'Sunday shift with 200% penalty rate',
    hoursWorked: 8,
    baseHourlyRate: 32.50,
    isCasual: false,
    awardType: 'children_services',
    dayType: 'sunday',
    isEveningShift: false,
    isNightShift: false,
    expectedResults: { ordinaryHours: 8, overtimeHours: 0, hasOvertime: false },
  },
  {
    id: 'public-holiday',
    name: 'Public Holiday (8h)',
    description: 'Public holiday shift with 250% penalty rate',
    hoursWorked: 8,
    baseHourlyRate: 32.50,
    isCasual: false,
    awardType: 'children_services',
    dayType: 'public_holiday',
    isEveningShift: false,
    isNightShift: false,
    expectedResults: { ordinaryHours: 8, overtimeHours: 0, hasOvertime: false },
  },
  {
    id: 'casual-weekday',
    name: 'Casual Weekday (8h)',
    description: 'Casual employee with 25% loading',
    hoursWorked: 8,
    baseHourlyRate: 32.50,
    isCasual: true,
    awardType: 'children_services',
    dayType: 'weekday',
    isEveningShift: false,
    isNightShift: false,
    expectedResults: { ordinaryHours: 8, overtimeHours: 0, hasOvertime: false },
  },
  {
    id: 'casual-overtime',
    name: 'Casual Overtime (10h)',
    description: 'Casual with 25% loading + overtime',
    hoursWorked: 10,
    baseHourlyRate: 32.50,
    isCasual: true,
    awardType: 'children_services',
    dayType: 'weekday',
    isEveningShift: false,
    isNightShift: false,
    expectedResults: { ordinaryHours: 8, overtimeHours: 2, hasOvertime: true },
  },
  {
    id: 'evening-shift',
    name: 'Evening Shift (6h)',
    description: 'Evening shift with 10% loading (6pm-10pm)',
    hoursWorked: 6,
    baseHourlyRate: 32.50,
    isCasual: false,
    awardType: 'children_services',
    dayType: 'weekday',
    isEveningShift: true,
    isNightShift: false,
    expectedResults: { ordinaryHours: 6, overtimeHours: 0, hasOvertime: false },
  },
  {
    id: 'night-shift',
    name: 'Night Shift (8h)',
    description: 'Night shift with 15% loading (10pm-6am)',
    hoursWorked: 8,
    baseHourlyRate: 32.50,
    isCasual: false,
    awardType: 'children_services',
    dayType: 'weekday',
    isEveningShift: false,
    isNightShift: true,
    expectedResults: { ordinaryHours: 8, overtimeHours: 0, hasOvertime: false },
  },
];

export function OvertimeCalculatorTest() {
  const [scenarios, setScenarios] = useState<TestScenario[]>(defaultScenarios);
  const [results, setResults] = useState<Map<string, OvertimeBreakdown>>(new Map());
  const [isRunning, setIsRunning] = useState(false);
  const [selectedAward, setSelectedAward] = useState<AwardType>('children_services');
  
  // Custom test inputs
  const [customHours, setCustomHours] = useState('8');
  const [customRate, setCustomRate] = useState('32.50');
  const [customIsCasual, setCustomIsCasual] = useState(false);
  const [customDayType, setCustomDayType] = useState<'weekday' | 'saturday' | 'sunday' | 'public_holiday'>('weekday');
  const [customResult, setCustomResult] = useState<OvertimeBreakdown | null>(null);
  
  // Run all test scenarios
  const runAllTests = () => {
    setIsRunning(true);
    const newResults = new Map<string, OvertimeBreakdown>();
    
    scenarios.forEach(scenario => {
      const jurisdiction = getJurisdictionByAward(scenario.awardType);
      const result = calculateDailyOvertime({
        hoursWorked: scenario.hoursWorked,
        baseHourlyRate: scenario.baseHourlyRate,
        isCasual: scenario.isCasual,
        awardType: scenario.awardType,
        dayType: scenario.dayType,
        isEveningShift: scenario.isEveningShift,
        isNightShift: scenario.isNightShift,
      }, jurisdiction);
      
      newResults.set(scenario.id, result);
    });
    
    setResults(newResults);
    setIsRunning(false);
    toast.success('All tests completed', {
      description: `${scenarios.length} scenarios tested`,
    });
  };
  
  // Run custom test
  const runCustomTest = () => {
    const jurisdiction = getJurisdictionByAward(selectedAward);
    const result = calculateDailyOvertime({
      hoursWorked: parseFloat(customHours) || 0,
      baseHourlyRate: parseFloat(customRate) || 0,
      isCasual: customIsCasual,
      awardType: selectedAward,
      dayType: customDayType,
      isEveningShift: false,
      isNightShift: false,
    }, jurisdiction);
    
    setCustomResult(result);
    toast.success('Custom calculation complete');
  };
  
  // Validate result against expected
  const validateResult = (scenario: TestScenario, result: OvertimeBreakdown): 'pass' | 'fail' | 'no-expected' => {
    if (!scenario.expectedResults) return 'no-expected';
    
    const { ordinaryHours, overtimeHours, hasOvertime } = scenario.expectedResults;
    
    if (ordinaryHours !== undefined && Math.abs(result.ordinaryHours - ordinaryHours) > 0.01) return 'fail';
    if (overtimeHours !== undefined && Math.abs(result.totalOvertimeHours - overtimeHours) > 0.01) return 'fail';
    if (hasOvertime !== undefined && result.hasOvertime !== hasOvertime) return 'fail';
    
    return 'pass';
  };
  
  const passCount = Array.from(results.entries()).filter(([id, result]) => {
    const scenario = scenarios.find(s => s.id === id);
    return scenario && validateResult(scenario, result) === 'pass';
  }).length;
  
  const failCount = Array.from(results.entries()).filter(([id, result]) => {
    const scenario = scenarios.find(s => s.id === id);
    return scenario && validateResult(scenario, result) === 'fail';
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="card-material-elevated border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Calculator className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Unified Overtime Calculator Test</CardTitle>
              <CardDescription>
                Verify Australian award calculations across different shift types
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={runAllTests} disabled={isRunning} className="gap-2">
              <Play className="h-4 w-4" />
              Run All Tests
            </Button>
            <Button variant="outline" onClick={() => setResults(new Map())} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            {results.size > 0 && (
              <div className="flex items-center gap-4 ml-4">
                <Badge className="bg-green-500/10 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {passCount} Passed
                </Badge>
                {failCount > 0 && (
                  <Badge className="bg-red-500/10 text-red-700 border-red-200">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {failCount} Failed
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Calculator */}
      <Card className="card-material">
        <CardHeader>
          <CardTitle className="text-base">Custom Calculation</CardTitle>
          <CardDescription>Test with custom parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Hours Worked</Label>
              <Input
                type="number"
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
                placeholder="8"
              />
            </div>
            <div className="space-y-2">
              <Label>Hourly Rate ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                placeholder="32.50"
              />
            </div>
            <div className="space-y-2">
              <Label>Award Type</Label>
              <Select value={selectedAward} onValueChange={(v) => setSelectedAward(v as AwardType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="children_services">Children's Services</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="hospitality">Hospitality</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Day Type</Label>
              <Select value={customDayType} onValueChange={(v) => setCustomDayType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekday">Weekday</SelectItem>
                  <SelectItem value="saturday">Saturday</SelectItem>
                  <SelectItem value="sunday">Sunday</SelectItem>
                  <SelectItem value="public_holiday">Public Holiday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Casual Employee</Label>
              <div className="flex items-center gap-2 h-10">
                <Switch checked={customIsCasual} onCheckedChange={setCustomIsCasual} />
                <span className="text-sm text-muted-foreground">
                  {customIsCasual ? '+25% loading' : 'Permanent'}
                </span>
              </div>
            </div>
          </div>
          
          <Button onClick={runCustomTest} className="gap-2">
            <Calculator className="h-4 w-4" />
            Calculate
          </Button>
          
          {customResult && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Ordinary Hours</p>
                  <p className="text-lg font-bold">{customResult.ordinaryHours.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Overtime Hours</p>
                  <p className="text-lg font-bold text-amber-600">{customResult.totalOvertimeHours.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Gross Pay</p>
                  <p className="text-lg font-bold text-emerald-600">${customResult.grossPay.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Effective Rate</p>
                  <p className="text-lg font-bold">${customResult.effectiveHourlyRate.toFixed(2)}/hr</p>
                </div>
              </div>
              {customResult.overtimeReason.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {customResult.overtimeReason.map((reason, i) => (
                    <Badge key={i} variant="outline">{reason}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results Table */}
      <Card className="card-material">
        <CardHeader>
          <CardTitle className="text-base">Test Scenarios</CardTitle>
          <CardDescription>Pre-configured scenarios covering common shift types</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scenario</TableHead>
                  <TableHead>Input</TableHead>
                  <TableHead className="text-right">Ordinary</TableHead>
                  <TableHead className="text-right">OT Hours</TableHead>
                  <TableHead className="text-right">Gross Pay</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarios.map(scenario => {
                  const result = results.get(scenario.id);
                  const status = result ? validateResult(scenario, result) : 'pending';
                  
                  return (
                    <TableRow key={scenario.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{scenario.name}</p>
                          <p className="text-xs text-muted-foreground">{scenario.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs">
                            {scenario.hoursWorked}h
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            ${scenario.baseHourlyRate}
                          </Badge>
                          {scenario.isCasual && (
                            <Badge variant="secondary" className="text-xs">Casual</Badge>
                          )}
                          <Badge variant="outline" className="text-xs capitalize">
                            {scenario.dayType.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {result ? `${result.ordinaryHours.toFixed(1)}h` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {result ? (
                          <span className={result.hasOvertime ? 'text-amber-600' : ''}>
                            {result.totalOvertimeHours.toFixed(1)}h
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {result ? (
                          <span className="text-emerald-600">${result.grossPay.toFixed(2)}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {status === 'pass' && (
                          <Badge className="bg-green-500/10 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3" />
                          </Badge>
                        )}
                        {status === 'fail' && (
                          <Badge className="bg-red-500/10 text-red-700 border-red-200">
                            <AlertTriangle className="h-3 w-3" />
                          </Badge>
                        )}
                        {status === 'pending' && (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3" />
                          </Badge>
                        )}
                        {status === 'no-expected' && result && (
                          <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">
                            Run
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Award Configuration Summary */}
      <Card className="card-material">
        <CardHeader>
          <CardTitle className="text-base">Award Penalty Rates Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Award</TableHead>
                <TableHead className="text-right">Saturday</TableHead>
                <TableHead className="text-right">Sunday</TableHead>
                <TableHead className="text-right">Public Holiday</TableHead>
                <TableHead className="text-right">Evening</TableHead>
                <TableHead className="text-right">Night</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Object.entries(penaltyRatesByAward) as [AwardType, any][]).map(([award, rates]) => (
                <TableRow key={award}>
                  <TableCell className="font-medium capitalize">{award.replace('_', ' ')}</TableCell>
                  <TableCell className="text-right">{(rates.saturday * 100).toFixed(0)}%</TableCell>
                  <TableCell className="text-right">{(rates.sunday * 100).toFixed(0)}%</TableCell>
                  <TableCell className="text-right">{(rates.publicHoliday * 100).toFixed(0)}%</TableCell>
                  <TableCell className="text-right">+{rates.evening}%</TableCell>
                  <TableCell className="text-right">+{rates.night}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
