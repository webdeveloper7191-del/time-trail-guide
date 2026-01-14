import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Scale,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Download,
  RefreshCw,
  Info,
  Clock,
  Sun,
  Calendar,
  Umbrella,
  Percent,
} from 'lucide-react';

interface BOOTComparisonItem {
  category: string;
  item: string;
  ebaValue: number | string;
  awardValue: number | string;
  difference: number;
  percentDiff: number;
  status: 'better' | 'equal' | 'worse';
  weight: number;
  notes?: string;
}

interface BOOTResult {
  overallScore: number;
  status: 'pass' | 'fail' | 'marginal';
  comparisons: BOOTComparisonItem[];
  summary: {
    betterItems: number;
    equalItems: number;
    worseItems: number;
  };
}

// Mock EBA data
const mockEBAs = [
  { id: 'eba-1', name: 'ABC Childcare Centres Enterprise Agreement 2023', code: 'ABC-EBA-2023' },
  { id: 'eba-2', name: 'XYZ Aged Care Enterprise Agreement 2022', code: 'XYZ-AC-2022' },
];

// Mock underlying awards
const mockAwards = [
  { id: 'children-services-2020', name: "Children's Services Award 2020", code: 'MA000120' },
  { id: 'aged-care-2020', name: "Aged Care Award 2020", code: 'MA000018' },
];

// Simulate BOOT calculation
const calculateBOOT = (ebaId: string, awardId: string, classificationLevel: number): BOOTResult => {
  const comparisons: BOOTComparisonItem[] = [
    // Base Pay Rates
    {
      category: 'Base Pay',
      item: `Level ${classificationLevel} Hourly Rate`,
      ebaValue: 32.50,
      awardValue: 29.85,
      difference: 2.65,
      percentDiff: 8.9,
      status: 'better',
      weight: 30,
      notes: 'Above award minimum',
    },
    {
      category: 'Base Pay',
      item: 'Annual Increase',
      ebaValue: '3.5%',
      awardValue: '3.75%',
      difference: -0.25,
      percentDiff: -0.25,
      status: 'worse',
      weight: 10,
      notes: 'FWC minimum wage increase was 3.75%',
    },
    // Penalty Rates
    {
      category: 'Penalty Rates',
      item: 'Saturday Loading',
      ebaValue: '150%',
      awardValue: '150%',
      difference: 0,
      percentDiff: 0,
      status: 'equal',
      weight: 8,
    },
    {
      category: 'Penalty Rates',
      item: 'Sunday Loading',
      ebaValue: '200%',
      awardValue: '200%',
      difference: 0,
      percentDiff: 0,
      status: 'equal',
      weight: 8,
    },
    {
      category: 'Penalty Rates',
      item: 'Public Holiday Loading',
      ebaValue: '250%',
      awardValue: '250%',
      difference: 0,
      percentDiff: 0,
      status: 'equal',
      weight: 6,
    },
    {
      category: 'Penalty Rates',
      item: 'Evening Shift (6pm-11pm)',
      ebaValue: '115%',
      awardValue: '110%',
      difference: 5,
      percentDiff: 4.5,
      status: 'better',
      weight: 4,
    },
    {
      category: 'Penalty Rates',
      item: 'Night Shift (11pm-7am)',
      ebaValue: '125%',
      awardValue: '115%',
      difference: 10,
      percentDiff: 8.7,
      status: 'better',
      weight: 4,
    },
    // Overtime
    {
      category: 'Overtime',
      item: 'First 2 Hours',
      ebaValue: '150%',
      awardValue: '150%',
      difference: 0,
      percentDiff: 0,
      status: 'equal',
      weight: 5,
    },
    {
      category: 'Overtime',
      item: 'After 2 Hours',
      ebaValue: '200%',
      awardValue: '200%',
      difference: 0,
      percentDiff: 0,
      status: 'equal',
      weight: 5,
    },
    // Leave Entitlements
    {
      category: 'Leave',
      item: 'Annual Leave',
      ebaValue: '20 days',
      awardValue: '20 days',
      difference: 0,
      percentDiff: 0,
      status: 'equal',
      weight: 5,
      notes: 'NES minimum',
    },
    {
      category: 'Leave',
      item: 'Personal/Carers Leave',
      ebaValue: '12 days',
      awardValue: '10 days',
      difference: 2,
      percentDiff: 20,
      status: 'better',
      weight: 5,
      notes: '2 days above NES',
    },
    {
      category: 'Leave',
      item: 'Compassionate Leave',
      ebaValue: '3 days',
      awardValue: '2 days',
      difference: 1,
      percentDiff: 50,
      status: 'better',
      weight: 2,
    },
    // Allowances
    {
      category: 'Allowances',
      item: 'First Aid Allowance',
      ebaValue: '$18.50/wk',
      awardValue: '$16.75/wk',
      difference: 1.75,
      percentDiff: 10.4,
      status: 'better',
      weight: 2,
    },
    {
      category: 'Allowances',
      item: 'Vehicle Allowance',
      ebaValue: '$0.96/km',
      awardValue: '$0.91/km',
      difference: 0.05,
      percentDiff: 5.5,
      status: 'better',
      weight: 2,
    },
    // Superannuation
    {
      category: 'Superannuation',
      item: 'Employer Contribution',
      ebaValue: '11.5%',
      awardValue: '11.5%',
      difference: 0,
      percentDiff: 0,
      status: 'equal',
      weight: 4,
      notes: 'SG minimum',
    },
  ];

  const summary = {
    betterItems: comparisons.filter(c => c.status === 'better').length,
    equalItems: comparisons.filter(c => c.status === 'equal').length,
    worseItems: comparisons.filter(c => c.status === 'worse').length,
  };

  // Calculate weighted score
  const totalWeight = comparisons.reduce((sum, c) => sum + c.weight, 0);
  const weightedScore = comparisons.reduce((sum, c) => {
    if (c.status === 'better') return sum + c.weight;
    if (c.status === 'equal') return sum + c.weight * 0.5;
    return sum; // worse items contribute 0
  }, 0);

  const overallScore = (weightedScore / totalWeight) * 100;

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    status: overallScore >= 60 ? 'pass' : overallScore >= 50 ? 'marginal' : 'fail',
    comparisons,
    summary,
  };
};

export function BOOTCalculatorPanel() {
  const [selectedEBA, setSelectedEBA] = useState<string>('');
  const [selectedAward, setSelectedAward] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('3');
  const [result, setResult] = useState<BOOTResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    if (!selectedEBA || !selectedAward) {
      toast.error('Please select both an EBA and underlying Award');
      return;
    }

    setIsCalculating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const bootResult = calculateBOOT(selectedEBA, selectedAward, parseInt(selectedLevel));
    setResult(bootResult);
    setIsCalculating(false);

    if (bootResult.status === 'pass') {
      toast.success('BOOT Test Passed', {
        description: `Score: ${bootResult.overallScore}% - Agreement meets BOOT requirements`,
      });
    } else if (bootResult.status === 'marginal') {
      toast.warning('BOOT Test Marginal', {
        description: `Score: ${bootResult.overallScore}% - Review recommended`,
      });
    } else {
      toast.error('BOOT Test Failed', {
        description: `Score: ${bootResult.overallScore}% - Agreement may not meet BOOT requirements`,
      });
    }
  };

  const handleExportReport = () => {
    toast.success('BOOT Report exported', {
      description: 'PDF report has been generated',
    });
  };

  const getStatusIcon = (status: 'better' | 'equal' | 'worse') => {
    switch (status) {
      case 'better':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'equal':
        return <Minus className="h-4 w-4 text-blue-500" />;
      case 'worse':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: 'better' | 'equal' | 'worse') => {
    switch (status) {
      case 'better':
        return <Badge className="bg-emerald-500/10 text-emerald-700">Above Award</Badge>;
      case 'equal':
        return <Badge className="bg-blue-500/10 text-blue-700">Meets Award</Badge>;
      case 'worse':
        return <Badge className="bg-red-500/10 text-red-700">Below Award</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Base Pay':
        return <DollarSign className="h-4 w-4" />;
      case 'Penalty Rates':
        return <Sun className="h-4 w-4" />;
      case 'Overtime':
        return <Clock className="h-4 w-4" />;
      case 'Leave':
        return <Umbrella className="h-4 w-4" />;
      case 'Allowances':
        return <Calculator className="h-4 w-4" />;
      case 'Superannuation':
        return <Percent className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="card-material-elevated border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Scale className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Better Off Overall Test (BOOT) Calculator</CardTitle>
              <CardDescription>
                Compare Enterprise Agreement terms against the underlying Modern Award to ensure compliance
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">About the BOOT Test</p>
                <p className="text-sm text-blue-700 mt-1">
                  The Better Off Overall Test is a requirement under the Fair Work Act 2009. 
                  An enterprise agreement must leave employees better off overall compared to the relevant modern award. 
                  The FWC assesses this before approving any agreement.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Controls */}
      <Card className="card-material">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Select Agreements to Compare</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Enterprise Agreement</label>
              <Select value={selectedEBA} onValueChange={setSelectedEBA}>
                <SelectTrigger>
                  <SelectValue placeholder="Select EBA" />
                </SelectTrigger>
                <SelectContent>
                  {mockEBAs.map(eba => (
                    <SelectItem key={eba.id} value={eba.id}>
                      {eba.code} - {eba.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Underlying Modern Award</label>
              <Select value={selectedAward} onValueChange={setSelectedAward}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Award" />
                </SelectTrigger>
                <SelectContent>
                  {mockAwards.map(award => (
                    <SelectItem key={award.id} value={award.id}>
                      {award.code} - {award.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Classification Level</label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1</SelectItem>
                  <SelectItem value="2">Level 2</SelectItem>
                  <SelectItem value="3">Level 3</SelectItem>
                  <SelectItem value="4">Level 4</SelectItem>
                  <SelectItem value="5">Level 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleCalculate} disabled={isCalculating}>
              {isCalculating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Run BOOT Analysis
                </>
              )}
            </Button>
            {result && (
              <Button variant="outline" onClick={handleExportReport}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Overall Score */}
          <Card className={`card-material-elevated border-l-4 ${
            result.status === 'pass' ? 'border-l-emerald-500' : 
            result.status === 'marginal' ? 'border-l-amber-500' : 'border-l-red-500'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${
                    result.status === 'pass' ? 'bg-emerald-500/10' : 
                    result.status === 'marginal' ? 'bg-amber-500/10' : 'bg-red-500/10'
                  }`}>
                    {result.status === 'pass' ? (
                      <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    ) : result.status === 'marginal' ? (
                      <AlertTriangle className="h-8 w-8 text-amber-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">
                      BOOT Test: {result.status === 'pass' ? 'PASSED' : result.status === 'marginal' ? 'MARGINAL' : 'FAILED'}
                    </h3>
                    <p className="text-muted-foreground">
                      {result.status === 'pass' 
                        ? 'Employees are better off overall under this agreement'
                        : result.status === 'marginal'
                        ? 'Some areas may require review before FWC approval'
                        : 'Agreement may not meet BOOT requirements'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-primary">{result.overallScore}%</p>
                  <p className="text-sm text-muted-foreground">Overall Score</p>
                </div>
              </div>

              <div className="mt-6">
                <Progress 
                  value={result.overallScore} 
                  className="h-3"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>0%</span>
                  <span className="text-amber-600">50% (Marginal)</span>
                  <span className="text-emerald-600">60% (Pass)</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="p-4 rounded-lg bg-emerald-500/10 text-center">
                  <p className="text-3xl font-bold text-emerald-600">{result.summary.betterItems}</p>
                  <p className="text-sm text-muted-foreground">Above Award</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 text-center">
                  <p className="text-3xl font-bold text-blue-600">{result.summary.equalItems}</p>
                  <p className="text-sm text-muted-foreground">Meets Award</p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 text-center">
                  <p className="text-3xl font-bold text-red-600">{result.summary.worseItems}</p>
                  <p className="text-sm text-muted-foreground">Below Award</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Comparison */}
          <Card className="card-material">
            <CardHeader>
              <CardTitle className="text-base">Detailed Comparison</CardTitle>
              <CardDescription>
                Line-by-line comparison of EBA terms against the Modern Award
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Category</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">EBA Value</TableHead>
                      <TableHead className="text-right">Award Value</TableHead>
                      <TableHead className="text-right">Difference</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.comparisons.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(item.category)}
                            <span className="font-medium">{item.category}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{item.item}</p>
                            {item.notes && (
                              <p className="text-xs text-muted-foreground">{item.notes}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.ebaValue}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {item.awardValue}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {getStatusIcon(item.status)}
                            <span className={
                              item.status === 'better' ? 'text-emerald-600' :
                              item.status === 'worse' ? 'text-red-600' : 'text-muted-foreground'
                            }>
                              {item.percentDiff > 0 ? '+' : ''}{item.percentDiff}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(item.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
