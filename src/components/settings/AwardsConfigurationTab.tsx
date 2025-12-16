import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Award,
  Search,
  Download,
  RefreshCw,
  CheckCircle2,
  Clock,
  DollarSign,
  Building2,
  FileText,
  ChevronRight,
  ExternalLink,
  Plus,
  Settings2,
  Calendar,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Shield,
  Info,
  Copy,
  Eye,
} from 'lucide-react';
import { australianAwards, AustralianAward, AwardClassification, calculateRates } from '@/data/australianAwards';

interface EnabledAward {
  awardId: string;
  enabledClassifications: string[];
  customRates: Record<string, number>;
  isActive: boolean;
}

export function AwardsConfigurationTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [enabledAwards, setEnabledAwards] = useState<EnabledAward[]>([
    { awardId: 'children-services-2020', enabledClassifications: [], customRates: {}, isActive: true },
  ]);
  const [selectedAward, setSelectedAward] = useState<AustralianAward | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateCheck, setLastUpdateCheck] = useState<Date>(new Date(2024, 6, 1));

  const industries = [...new Set(australianAwards.map(a => a.industry))];
  
  const filteredAwards = australianAwards.filter(award => {
    const matchesSearch = award.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      award.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      award.industry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = selectedIndustry === 'all' || award.industry === selectedIndustry;
    return matchesSearch && matchesIndustry;
  });

  const isAwardEnabled = (awardId: string) => {
    return enabledAwards.some(e => e.awardId === awardId && e.isActive);
  };

  const toggleAward = (awardId: string) => {
    const existing = enabledAwards.find(e => e.awardId === awardId);
    if (existing) {
      setEnabledAwards(prev => prev.map(e => 
        e.awardId === awardId ? { ...e, isActive: !e.isActive } : e
      ));
    } else {
      setEnabledAwards(prev => [...prev, { 
        awardId, 
        enabledClassifications: [], 
        customRates: {}, 
        isActive: true 
      }]);
    }
    toast.success(isAwardEnabled(awardId) ? 'Award disabled' : 'Award enabled');
  };

  const handleCheckUpdates = async () => {
    setIsUpdating(true);
    // Simulate update check
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLastUpdateCheck(new Date());
    setIsUpdating(false);
    toast.success('All awards are up to date', {
      description: 'Rates current as of July 2024',
    });
  };

  const handleInstallUpdate = async () => {
    setIsUpdating(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsUpdating(false);
    toast.success('Award rates updated successfully', {
      description: 'New rates have been applied to all enabled awards',
    });
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value}%`;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{australianAwards.length}</p>
                <p className="text-sm text-muted-foreground">Available Awards</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enabledAwards.filter(e => e.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Enabled Awards</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">Jul 2024</p>
                <p className="text-sm text-muted-foreground">Rate Version</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{lastUpdateCheck.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</p>
                <p className="text-sm text-muted-foreground">Last Checked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Updates Section */}
      <Card className="card-material-elevated border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Award Rate Updates</CardTitle>
                <CardDescription>
                  Fair Work Commission updates award rates annually on July 1st
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleCheckUpdates}
                disabled={isUpdating}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
                Check for Updates
              </Button>
              <Button 
                onClick={handleInstallUpdate}
                disabled={isUpdating}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Install Latest Rates
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Current Version:</span>
              <Badge variant="secondary">FWC 2024-25</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-muted-foreground">Compliance Status:</span>
              <Badge className="bg-green-500/10 text-green-700 border-green-200">Compliant</Badge>
            </div>
            <a 
              href="https://www.fwc.gov.au/awards-and-agreements/awards/modern-awards" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline ml-auto"
            >
              Fair Work Commission <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="card-material">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search awards by name, code or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger className="w-full sm:w-48">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map(industry => (
                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Awards List */}
      <div className="space-y-4">
        {filteredAwards.map(award => (
          <Card 
            key={award.id} 
            className={`card-material-elevated transition-all ${
              isAwardEnabled(award.id) ? 'ring-2 ring-primary/20 border-primary/30' : ''
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                    isAwardEnabled(award.id) ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{award.name}</CardTitle>
                      {isAwardEnabled(award.id) && (
                        <Badge className="bg-green-500/10 text-green-700 border-green-200">Active</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="outline" className="font-mono text-xs">{award.code}</Badge>
                      <span className="text-sm text-muted-foreground">{award.industry}</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">Effective: {award.effectiveDate}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch 
                    checked={isAwardEnabled(award.id)}
                    onCheckedChange={() => toggleAward(award.id)}
                  />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => setSelectedAward(award)}>
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-primary" />
                          {award.name}
                        </DialogTitle>
                        <DialogDescription>
                          {award.code} • {award.industry} • Effective from {award.effectiveDate}
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-6">
                          {/* Rate Summary */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Casual Loading</p>
                              <p className="text-xl font-bold text-primary">{award.casualLoading}%</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Saturday Penalty</p>
                              <p className="text-xl font-bold">{award.saturdayPenalty}%</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Sunday Penalty</p>
                              <p className="text-xl font-bold">{award.sundayPenalty}%</p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Public Holiday</p>
                              <p className="text-xl font-bold text-amber-600">{award.publicHolidayPenalty}%</p>
                            </div>
                          </div>

                          {/* Classifications Table */}
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Pay Classifications ({award.classifications.length})
                            </h4>
                            <div className="border rounded-lg overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted/50">
                                    <TableHead>Level</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Base Rate</TableHead>
                                    <TableHead className="text-right">Casual Rate</TableHead>
                                    <TableHead>Qualification</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {award.classifications.map((classification) => {
                                    const rates = calculateRates(award, classification, 'casual');
                                    return (
                                      <TableRow key={classification.id}>
                                        <TableCell className="font-medium">{classification.level}</TableCell>
                                        <TableCell className="text-muted-foreground">{classification.description}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(classification.baseHourlyRate)}</TableCell>
                                        <TableCell className="text-right font-mono text-primary">{formatCurrency(rates.casualLoadedRate || 0)}</TableCell>
                                        <TableCell>
                                          {classification.qualificationRequired ? (
                                            <Badge variant="outline" className="text-xs">{classification.qualificationRequired}</Badge>
                                          ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </div>

                          {/* Overtime Rates */}
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Overtime Rates
                            </h4>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="p-4 rounded-lg border bg-card">
                                <p className="text-sm text-muted-foreground">First 2 Hours</p>
                                <p className="text-2xl font-bold">{award.overtimeRates.first2Hours}%</p>
                              </div>
                              <div className="p-4 rounded-lg border bg-card">
                                <p className="text-sm text-muted-foreground">After 2 Hours</p>
                                <p className="text-2xl font-bold">{award.overtimeRates.after2Hours}%</p>
                              </div>
                              <div className="p-4 rounded-lg border bg-card">
                                <p className="text-sm text-muted-foreground">Sunday Overtime</p>
                                <p className="text-2xl font-bold">{award.overtimeRates.sundayOvertime}%</p>
                              </div>
                            </div>
                          </div>

                          {/* Allowances */}
                          {award.allowances.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Allowances ({award.allowances.length})
                              </h4>
                              <div className="border rounded-lg overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-muted/50">
                                      <TableHead>Allowance</TableHead>
                                      <TableHead>Type</TableHead>
                                      <TableHead className="text-right">Amount</TableHead>
                                      <TableHead>Description</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {award.allowances.map((allowance) => (
                                      <TableRow key={allowance.id}>
                                        <TableCell className="font-medium">{allowance.name}</TableCell>
                                        <TableCell>
                                          <Badge variant="secondary" className="capitalize">
                                            {allowance.type.replace('_', ' ')}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                          {formatCurrency(allowance.amount)}
                                          {allowance.type === 'per_km' && '/km'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{allowance.description}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )}

                          {/* Additional Penalties */}
                          {(award.eveningPenalty || award.nightPenalty) && (
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Settings2 className="h-4 w-4" />
                                Additional Penalties
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                {award.eveningPenalty && (
                                  <div className="p-4 rounded-lg border bg-card">
                                    <p className="text-sm text-muted-foreground">Evening Penalty</p>
                                    <p className="text-2xl font-bold">{award.eveningPenalty}%</p>
                                  </div>
                                )}
                                {award.nightPenalty && (
                                  <div className="p-4 rounded-lg border bg-card">
                                    <p className="text-sm text-muted-foreground">Night Penalty</p>
                                    <p className="text-2xl font-bold">{award.nightPenalty}%</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                      <DialogFooter className="mt-4 border-t pt-4">
                        <Button variant="outline" className="gap-2">
                          <Copy className="h-4 w-4" />
                          Copy Rates
                        </Button>
                        <Button className="gap-2">
                          <FileText className="h-4 w-4" />
                          Export PDF
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Classifications</p>
                  <p className="font-semibold">{award.classifications.length} levels</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Base Rate Range</p>
                  <p className="font-semibold font-mono">
                    {formatCurrency(Math.min(...award.classifications.map(c => c.baseHourlyRate)))} - {formatCurrency(Math.max(...award.classifications.map(c => c.baseHourlyRate)))}
                  </p>
                </div>
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
                  <p className="text-muted-foreground">Allowances</p>
                  <p className="font-semibold">{award.allowances.length} types</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAwards.length === 0 && (
        <Card className="card-material">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Awards Found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card className="card-material bg-blue-500/5 border-blue-500/20">
        <CardContent className="flex items-start gap-4 p-4">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100">About Modern Awards</p>
            <p className="text-sm text-blue-700/80 dark:text-blue-200/80 mt-1">
              Modern Awards are legal documents that set out the minimum terms and conditions of employment for employees in specific industries or occupations. 
              The Fair Work Commission reviews and updates award rates annually. Ensure your organization is always using the latest rates to maintain compliance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
