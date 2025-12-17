import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Calculator, 
  Percent, ArrowRight, RefreshCw, Download, Play, Pause,
  BarChart3, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { australianAwards } from '@/data/australianAwards';

interface SimulationScenario {
  id: string;
  name: string;
  type: 'rate_increase' | 'penalty_change' | 'allowance_change' | 'overtime_change';
  params: {
    percentageChange?: number;
    flatChange?: number;
    targetClassifications?: string[];
  };
}

interface SimulationResult {
  currentCost: number;
  projectedCost: number;
  difference: number;
  percentageChange: number;
  breakdown: {
    category: string;
    current: number;
    projected: number;
    change: number;
  }[];
  affectedStaff: number;
}

// Mock staff data for simulation
const mockStaffData = [
  { id: '1', name: 'Sarah Johnson', classification: 'cs-4-1', hoursPerWeek: 38, employmentType: 'permanent' },
  { id: '2', name: 'Michael Chen', classification: 'cs-3-2', hoursPerWeek: 38, employmentType: 'permanent' },
  { id: '3', name: 'Emily Davis', classification: 'cs-5-2', hoursPerWeek: 30, employmentType: 'permanent' },
  { id: '4', name: 'James Wilson', classification: 'cs-2-1', hoursPerWeek: 20, employmentType: 'casual' },
  { id: '5', name: 'Olivia Brown', classification: 'cs-4-2', hoursPerWeek: 38, employmentType: 'permanent' },
  { id: '6', name: 'William Taylor', classification: 'cs-3-1', hoursPerWeek: 25, employmentType: 'casual' },
  { id: '7', name: 'Sophia Martinez', classification: 'cs-5-1', hoursPerWeek: 38, employmentType: 'permanent' },
  { id: '8', name: 'Benjamin Anderson', classification: 'cs-2-2', hoursPerWeek: 15, employmentType: 'casual' },
];

export function RateSimulationPanel() {
  const [selectedAward, setSelectedAward] = useState('children-services-2020');
  const [simulationType, setSimulationType] = useState<'rate_increase' | 'penalty_change' | 'classification_upgrade'>('rate_increase');
  const [percentageChange, setPercentageChange] = useState(3);
  const [applyToAll, setApplyToAll] = useState(true);
  const [selectedClassifications, setSelectedClassifications] = useState<string[]>([]);
  const [weeksToProject, setWeeksToProject] = useState(52);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const award = australianAwards.find(a => a.id === selectedAward);

  const runSimulation = async () => {
    if (!award) {
      toast.error('Please select an award');
      return;
    }

    setIsSimulating(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Calculate current costs
    let currentWeeklyCost = 0;
    let projectedWeeklyCost = 0;
    const breakdown: SimulationResult['breakdown'] = [];

    // Group by classification
    const classificationCosts: Record<string, { current: number; projected: number; staff: number }> = {};

    mockStaffData.forEach(staff => {
      const classification = award.classifications.find(c => c.id === staff.classification);
      if (!classification) return;

      let baseRate = classification.baseHourlyRate;
      if (staff.employmentType === 'casual') {
        baseRate *= (1 + award.casualLoading / 100);
      }

      const weeklyPay = baseRate * staff.hoursPerWeek;
      currentWeeklyCost += weeklyPay;

      // Calculate projected rate
      let projectedRate = baseRate;
      const shouldApply = applyToAll || selectedClassifications.includes(staff.classification);
      
      if (shouldApply) {
        if (simulationType === 'rate_increase') {
          projectedRate = baseRate * (1 + percentageChange / 100);
        }
      }

      const projectedWeeklyPay = projectedRate * staff.hoursPerWeek;
      projectedWeeklyCost += projectedWeeklyPay;

      // Track by classification
      const classKey = classification.level;
      if (!classificationCosts[classKey]) {
        classificationCosts[classKey] = { current: 0, projected: 0, staff: 0 };
      }
      classificationCosts[classKey].current += weeklyPay;
      classificationCosts[classKey].projected += projectedWeeklyPay;
      classificationCosts[classKey].staff += 1;
    });

    // Build breakdown
    Object.entries(classificationCosts).forEach(([level, costs]) => {
      breakdown.push({
        category: level,
        current: costs.current * weeksToProject,
        projected: costs.projected * weeksToProject,
        change: (costs.projected - costs.current) * weeksToProject,
      });
    });

    const currentTotal = currentWeeklyCost * weeksToProject;
    const projectedTotal = projectedWeeklyCost * weeksToProject;
    const difference = projectedTotal - currentTotal;

    setResult({
      currentCost: currentTotal,
      projectedCost: projectedTotal,
      difference,
      percentageChange: (difference / currentTotal) * 100,
      breakdown,
      affectedStaff: applyToAll ? mockStaffData.length : mockStaffData.filter(s => selectedClassifications.includes(s.classification)).length,
    });

    setIsSimulating(false);
    toast.success('Simulation complete');
  };

  const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const exportSimulation = () => {
    if (!result) return;
    const data = {
      scenario: {
        type: simulationType,
        percentageChange,
        weeksProjected: weeksToProject,
        applyToAll,
      },
      results: result,
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rate-simulation-${Date.now()}.json`;
    a.click();
    toast.success('Simulation exported');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Rate Simulation Tool</h3>
          <p className="text-sm text-muted-foreground">
            Preview how rate changes would affect payroll costs before applying them
          </p>
        </div>
        {result && (
          <Button variant="outline" onClick={exportSimulation} className="gap-2">
            <Download className="h-4 w-4" />
            Export Results
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockStaffData.length}</p>
                <p className="text-sm text-muted-foreground">Staff Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{award?.classifications.length || 0}</p>
                <p className="text-sm text-muted-foreground">Classifications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weeksToProject}</p>
                <p className="text-sm text-muted-foreground">Weeks Projected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                result && result.difference > 0 ? 'bg-red-500/10' : 'bg-green-500/10'
              }`}>
                {result && result.difference > 0 ? (
                  <TrendingUp className="h-5 w-5 text-red-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {result ? `${result.percentageChange > 0 ? '+' : ''}${result.percentageChange.toFixed(1)}%` : '—'}
                </p>
                <p className="text-sm text-muted-foreground">Cost Change</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <Card className="card-material-elevated">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              Simulation Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Award</Label>
              <Select value={selectedAward} onValueChange={setSelectedAward}>
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
              <Label>Simulation Type</Label>
              <Select value={simulationType} onValueChange={(v) => setSimulationType(v as typeof simulationType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rate_increase">Base Rate Increase</SelectItem>
                  <SelectItem value="penalty_change">Penalty Rate Change</SelectItem>
                  <SelectItem value="classification_upgrade">Classification Upgrade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Rate Change: {percentageChange > 0 ? '+' : ''}{percentageChange}%</Label>
              <Slider
                value={[percentageChange]}
                onValueChange={([v]) => setPercentageChange(v)}
                min={-10}
                max={20}
                step={0.5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>-10%</span>
                <span>0%</span>
                <span>+20%</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Projection Period: {weeksToProject} weeks</Label>
              <Slider
                value={[weeksToProject]}
                onValueChange={([v]) => setWeeksToProject(v)}
                min={1}
                max={104}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 week</span>
                <span>1 year</span>
                <span>2 years</span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label>Apply to All Classifications</Label>
              <Switch checked={applyToAll} onCheckedChange={setApplyToAll} />
            </div>

            {!applyToAll && (
              <div className="space-y-2">
                <Label className="text-xs">Select Classifications</Label>
                <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                  {award?.classifications.map(c => (
                    <label key={c.id} className="flex items-center gap-2 text-xs p-1 hover:bg-muted/50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedClassifications.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClassifications([...selectedClassifications, c.id]);
                          } else {
                            setSelectedClassifications(selectedClassifications.filter(id => id !== c.id));
                          }
                        }}
                        className="rounded"
                      />
                      {c.level}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={runSimulation} disabled={isSimulating} className="w-full gap-2">
              {isSimulating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Simulation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className={`card-material-elevated lg:col-span-2 ${result ? 'ring-2 ring-primary/20' : ''}`}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Simulation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Cost</p>
                    <p className="text-2xl font-bold">{formatCurrency(result.currentCost)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Projected Cost</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(result.projectedCost)}</p>
                  </div>
                  <div className={`p-4 rounded-lg ${result.difference > 0 ? 'bg-red-500/10 border border-red-200' : 'bg-green-500/10 border border-green-200'}`}>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Difference</p>
                    <p className={`text-2xl font-bold ${result.difference > 0 ? 'text-red-700' : 'text-green-700'}`}>
                      {result.difference > 0 ? '+' : ''}{formatCurrency(result.difference)}
                    </p>
                  </div>
                </div>

                {/* Impact Summary */}
                <div className={`p-4 rounded-lg flex items-center gap-4 ${
                  result.percentageChange > 5 ? 'bg-amber-500/10 border border-amber-200' : 'bg-green-500/10 border border-green-200'
                }`}>
                  {result.percentageChange > 5 ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  <div>
                    <p className="font-medium">
                      {result.percentageChange > 5 
                        ? 'Significant cost impact detected' 
                        : 'Moderate cost impact'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {result.affectedStaff} staff members affected • {result.percentageChange.toFixed(1)}% change over {weeksToProject} weeks
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Breakdown Table */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Cost Breakdown by Classification</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Classification</TableHead>
                        <TableHead className="text-right">Current</TableHead>
                        <TableHead className="text-right">Projected</TableHead>
                        <TableHead className="text-right">Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.breakdown.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.category}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(item.current)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(item.projected)}</TableCell>
                          <TableCell className={`text-right font-mono ${item.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {item.change > 0 ? '+' : ''}{formatCurrency(item.change)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold border-t-2">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(result.currentCost)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(result.projectedCost)}</TableCell>
                        <TableCell className={`text-right font-mono ${result.difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {result.difference > 0 ? '+' : ''}{formatCurrency(result.difference)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Simulation Run</h3>
                <p className="text-muted-foreground">Configure parameters and run a simulation to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}