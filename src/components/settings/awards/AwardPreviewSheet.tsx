import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Package,
  Zap,
  Shield,
  Building2,
  Users,
  DollarSign,
  BarChart3,
  Info,
  Percent,
  Moon,
  Sun,
  Sunrise,
  Copy,
  Star,
  StarOff,
} from 'lucide-react';
import { AustralianAward, AwardClassification, calculateRates } from '@/data/australianAwards';
import { toast } from 'sonner';

interface AwardPreviewSheetProps {
  award: AustralianAward | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEnabled?: boolean;
  isFavorite?: boolean;
  onToggleEnable?: (awardId: string) => void;
  onToggleFavorite?: (awardId: string) => void;
  onExportPDF?: (award: AustralianAward) => void;
  onExportExcel?: (award: AustralianAward) => void;
}

export function AwardPreviewSheet({
  award,
  open,
  onOpenChange,
  isEnabled = false,
  isFavorite = false,
  onToggleEnable,
  onToggleFavorite,
  onExportPDF,
  onExportExcel,
}: AwardPreviewSheetProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!award) return null;

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const getMinBaseRate = () => Math.min(...award.classifications.map(c => c.baseHourlyRate));
  const getMaxBaseRate = () => Math.max(...award.classifications.map(c => c.baseHourlyRate));
  const getAvgBaseRate = () => {
    const rates = award.classifications.map(c => c.baseHourlyRate);
    return rates.reduce((sum, r) => sum + r, 0) / rates.length;
  };

  const handleCopyRates = () => {
    const ratesText = award.classifications
      .map(c => `${c.level}: ${formatCurrency(c.baseHourlyRate)}`)
      .join('\n');
    navigator.clipboard.writeText(ratesText);
    toast.success('Rates copied to clipboard');
  };

  const handleEnableAward = () => {
    if (onToggleEnable) {
      onToggleEnable(award.id);
      toast.success(isEnabled ? 'Award disabled' : 'Award enabled for your organization');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[900px] max-w-[95vw] p-0 flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${isEnabled ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                <Award className={`h-7 w-7 ${isEnabled ? 'text-green-600' : 'text-primary'}`} />
              </div>
              <div>
                <SheetTitle className="text-xl flex items-center gap-2">
                  {award.shortName}
                  {isFavorite && <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 flex-wrap mt-1.5">
                  <Badge variant="outline" className="font-mono text-xs">{award.code}</Badge>
                  <Badge variant="secondary" className="text-xs">{award.industry}</Badge>
                  {isEnabled ? (
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Enabled
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Not Installed
                    </Badge>
                  )}
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onToggleFavorite && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onToggleFavorite(award.id)}
                  className="h-9 w-9"
                >
                  {isFavorite ? (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
              )}
              {onToggleEnable && (
                <Button
                  onClick={handleEnableAward}
                  variant={isEnabled ? "outline" : "default"}
                  className="gap-2"
                >
                  {isEnabled ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Enable Award
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 mt-4 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{award.classifications.length}</span>
              <span className="text-xs text-muted-foreground">Classifications</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{formatCurrency(getMinBaseRate())} - {formatCurrency(getMaxBaseRate())}</span>
              <span className="text-xs text-muted-foreground">Hourly Range</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{award.allowances.length}</span>
              <span className="text-xs text-muted-foreground">Allowances</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{award.effectiveDate}</span>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4 shrink-0">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview" className="gap-1.5">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="classifications" className="gap-1.5">
                <Users className="h-4 w-4" />
                Classifications
                <Badge variant="secondary" className="ml-1 text-xs">{award.classifications.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="penalties" className="gap-1.5">
                <Percent className="h-4 w-4" />
                Penalty Rates
              </TabsTrigger>
              <TabsTrigger value="allowances" className="gap-1.5">
                <Package className="h-4 w-4" />
                Allowances
                <Badge variant="secondary" className="ml-1 text-xs">{award.allowances.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="overtime" className="gap-1.5">
                <Clock className="h-4 w-4" />
                Overtime
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6 pb-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4 space-y-6">
              {/* Award Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Award Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Full Name</p>
                      <p className="text-sm font-medium mt-1">{award.name}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Award Code</p>
                      <p className="text-sm font-mono font-medium mt-1">{award.code}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Industry</p>
                      <p className="text-sm font-medium mt-1">{award.industry}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Effective Date</p>
                      <p className="text-sm font-medium mt-1">{award.effectiveDate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rate Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Rate Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Minimum Rate</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(getMinBaseRate())}</p>
                      <p className="text-xs text-muted-foreground">/hour</p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Average Rate</p>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(getAvgBaseRate())}</p>
                      <p className="text-xs text-muted-foreground">/hour</p>
                    </div>
                    <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/10 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Maximum Rate</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(getMaxBaseRate())}</p>
                      <p className="text-xs text-muted-foreground">/hour</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Penalties Overview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Key Penalty Rates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                      <p className="text-xs text-muted-foreground">Casual Loading</p>
                      <p className="text-xl font-bold text-blue-600">{award.casualLoading}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Saturday</p>
                      <p className="text-xl font-bold">{award.saturdayPenalty}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Sunday</p>
                      <p className="text-xl font-bold">{award.sundayPenalty}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <p className="text-xs text-muted-foreground">Public Holiday</p>
                      <p className="text-xl font-bold text-amber-600">{award.publicHolidayPenalty}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Classification Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Classification Levels
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('classifications')}>
                      View All
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {award.classifications.slice(0, 5).map((classification) => (
                      <div key={classification.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <span className="text-sm font-medium">{classification.level}</span>
                          <p className="text-xs text-muted-foreground truncate max-w-80">{classification.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">{formatCurrency(classification.baseHourlyRate)}/hr</span>
                          <Badge variant="outline" className="text-xs">
                            {formatCurrency(classification.baseHourlyRate * (1 + award.casualLoading / 100))}/hr casual
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {award.classifications.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        +{award.classifications.length - 5} more classifications
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Classifications Tab */}
            <TabsContent value="classifications" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">All Classifications</CardTitle>
                      <CardDescription>
                        {award.classifications.length} classification levels with hourly and casual rates
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCopyRates} className="gap-1.5">
                      <Copy className="h-3.5 w-3.5" />
                      Copy Rates
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs uppercase tracking-wide">Level</TableHead>
                          <TableHead className="text-xs uppercase tracking-wide">Description</TableHead>
                          <TableHead className="text-right text-xs uppercase tracking-wide">Weekly</TableHead>
                          <TableHead className="text-right text-xs uppercase tracking-wide">Hourly</TableHead>
                          <TableHead className="text-right text-xs uppercase tracking-wide">Casual Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {award.classifications.map((classification) => {
                          const casualRate = classification.baseHourlyRate * (1 + award.casualLoading / 100);
                          const weeklyRate = classification.baseWeeklyRate || classification.baseHourlyRate * 38;
                          return (
                            <TableRow key={classification.id}>
                              <TableCell className="font-medium text-sm">{classification.level}</TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-64 truncate">
                                {classification.description}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatCurrency(weeklyRate)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm font-semibold">
                                {formatCurrency(classification.baseHourlyRate)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge className="bg-blue-500/10 text-blue-700 font-mono text-xs">
                                  {formatCurrency(casualRate)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Penalties Tab */}
            <TabsContent value="penalties" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Penalty Rate Structure</CardTitle>
                  <CardDescription>
                    Multipliers applied to base rates for specific circumstances
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Casual Loading</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-600">{award.casualLoading}%</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Applied to base rate for casual employees
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Saturday Penalty</span>
                      </div>
                      <p className="text-3xl font-bold">{award.saturdayPenalty}%</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Of base rate for Saturday work
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <div className="flex items-center gap-2 mb-2">
                        <Sun className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Sunday Penalty</span>
                      </div>
                      <p className="text-3xl font-bold">{award.sundayPenalty}%</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Of base rate for Sunday work
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium">Public Holiday</span>
                      </div>
                      <p className="text-3xl font-bold text-amber-600">{award.publicHolidayPenalty}%</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Of base rate for public holiday work
                      </p>
                    </div>
                  </div>

                  {/* Shift Penalties */}
                  {(award.eveningPenalty || award.nightPenalty) && (
                    <>
                      <Separator className="my-4" />
                      <p className="text-sm font-medium mb-3">Shift Penalties</p>
                      <div className="grid grid-cols-2 gap-4">
                        {award.eveningPenalty && (
                          <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Sunrise className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-medium">Evening Penalty</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-600">{award.eveningPenalty}%</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              For shifts worked in the evening
                            </p>
                          </div>
                        )}
                        {award.nightPenalty && (
                          <div className="p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Moon className="h-4 w-4 text-indigo-600" />
                              <span className="text-sm font-medium">Night Penalty</span>
                            </div>
                            <p className="text-2xl font-bold text-indigo-600">{award.nightPenalty}%</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              For shifts worked overnight
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Allowances Tab */}
            <TabsContent value="allowances" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Award Allowances</CardTitle>
                  <CardDescription>
                    {award.allowances.length} allowances defined under this award
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {award.allowances.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No allowances defined for this award</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs uppercase tracking-wide">Allowance</TableHead>
                            <TableHead className="text-xs uppercase tracking-wide">Type</TableHead>
                            <TableHead className="text-right text-xs uppercase tracking-wide">Rate</TableHead>
                            <TableHead className="text-xs uppercase tracking-wide">Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {award.allowances.map((allowance, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium text-sm">{allowance.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {allowance.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm font-semibold">
                                {formatCurrency(allowance.amount)}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-48 truncate">
                                {allowance.description || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Overtime Tab */}
            <TabsContent value="overtime" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Overtime Rates</CardTitle>
                  <CardDescription>
                    Overtime multipliers for hours worked beyond standard hours
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium">First 2 Hours</span>
                      </div>
                      <p className="text-3xl font-bold text-orange-600">{award.overtimeRates?.first2Hours || 150}%</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Time and a half rate
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium">After 2 Hours</span>
                      </div>
                      <p className="text-3xl font-bold text-red-600">{award.overtimeRates?.after2Hours || 200}%</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Double time rate
                      </p>
                    </div>
                  </div>

                  <Card className="bg-blue-500/5 border-blue-500/20">
                    <CardContent className="p-4 flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Overtime Calculation</p>
                        <p className="text-xs text-blue-700/80 mt-1">
                          Overtime rates are calculated based on the applicable base rate (including any penalty rates that may apply).
                          The first 2 hours of overtime are typically paid at time and a half, with subsequent hours paid at double time.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer Actions */}
        <div className="p-4 border-t shrink-0 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {onExportPDF && (
                <Button variant="outline" size="sm" onClick={() => onExportPDF(award)} className="gap-1.5">
                  <FileText className="h-4 w-4" />
                  Export PDF
                </Button>
              )}
              {onExportExcel && (
                <Button variant="outline" size="sm" onClick={() => onExportExcel(award)} className="gap-1.5">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export Excel
                </Button>
              )}
            </div>
            {onToggleEnable && (
              <Button onClick={handleEnableAward} variant={isEnabled ? "outline" : "default"} className="gap-2">
                {isEnabled ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Enabled
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Enable Award
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
