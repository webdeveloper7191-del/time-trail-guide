import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  Award,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Eye,
  Copy,
  FileText,
  DollarSign,
  Clock,
  TrendingUp,
  Filter,
  SortAsc,
  SortDesc,
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  MoreHorizontal,
  Settings2,
  Percent,
  Info,
  Star,
  StarOff,
} from 'lucide-react';
import { australianAwards, AustralianAward, AwardClassification, calculateRates } from '@/data/australianAwards';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EnabledAward {
  awardId: string;
  enabledClassifications: string[];
  customRates: Record<string, number>;
  isActive: boolean;
  isFavorite?: boolean;
}

type SortField = 'name' | 'code' | 'industry' | 'baseRate' | 'casualLoading' | 'saturdayPenalty' | 'sundayPenalty' | 'classifications';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  search: string;
  industry: string;
  status: 'all' | 'active' | 'inactive';
  minBaseRate: string;
  maxBaseRate: string;
  hasEveningPenalty: boolean | null;
  hasNightPenalty: boolean | null;
}

export function AwardsMasterTable() {
  const [enabledAwards, setEnabledAwards] = useState<EnabledAward[]>([
    { awardId: 'children-services-2020', enabledClassifications: [], customRates: {}, isActive: true, isFavorite: true },
  ]);
  const [selectedAwardIds, setSelectedAwardIds] = useState<Set<string>>(new Set());
  const [expandedAwardIds, setExpandedAwardIds] = useState<Set<string>>(new Set());
  const [selectedAward, setSelectedAward] = useState<AustralianAward | null>(null);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    industry: 'all',
    status: 'all',
    minBaseRate: '',
    maxBaseRate: '',
    hasEveningPenalty: null,
    hasNightPenalty: null,
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const industries = useMemo(() => [...new Set(australianAwards.map(a => a.industry))], []);

  const isAwardEnabled = (awardId: string) => {
    return enabledAwards.some(e => e.awardId === awardId && e.isActive);
  };

  const isAwardFavorite = (awardId: string) => {
    return enabledAwards.some(e => e.awardId === awardId && e.isFavorite);
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

  const toggleFavorite = (awardId: string) => {
    const existing = enabledAwards.find(e => e.awardId === awardId);
    if (existing) {
      setEnabledAwards(prev => prev.map(e => 
        e.awardId === awardId ? { ...e, isFavorite: !e.isFavorite } : e
      ));
    } else {
      setEnabledAwards(prev => [...prev, { 
        awardId, 
        enabledClassifications: [], 
        customRates: {}, 
        isActive: false,
        isFavorite: true 
      }]);
    }
  };

  const toggleExpanded = (awardId: string) => {
    setExpandedAwardIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(awardId)) {
        newSet.delete(awardId);
      } else {
        newSet.add(awardId);
      }
      return newSet;
    });
  };

  const toggleSelectAward = (awardId: string) => {
    setSelectedAwardIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(awardId)) {
        newSet.delete(awardId);
      } else {
        newSet.add(awardId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedAwardIds.size === filteredAndSortedAwards.length) {
      setSelectedAwardIds(new Set());
    } else {
      setSelectedAwardIds(new Set(filteredAndSortedAwards.map(a => a.id)));
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getMinBaseRate = (award: AustralianAward) => 
    Math.min(...award.classifications.map(c => c.baseHourlyRate));
  
  const getMaxBaseRate = (award: AustralianAward) => 
    Math.max(...award.classifications.map(c => c.baseHourlyRate));

  const filteredAndSortedAwards = useMemo(() => {
    let result = [...australianAwards];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(award => 
        award.name.toLowerCase().includes(searchLower) ||
        award.code.toLowerCase().includes(searchLower) ||
        award.industry.toLowerCase().includes(searchLower) ||
        award.shortName.toLowerCase().includes(searchLower)
      );
    }

    if (filters.industry !== 'all') {
      result = result.filter(award => award.industry === filters.industry);
    }

    if (filters.status !== 'all') {
      result = result.filter(award => {
        const isEnabled = isAwardEnabled(award.id);
        return filters.status === 'active' ? isEnabled : !isEnabled;
      });
    }

    if (filters.minBaseRate) {
      const minRate = parseFloat(filters.minBaseRate);
      result = result.filter(award => getMinBaseRate(award) >= minRate);
    }

    if (filters.maxBaseRate) {
      const maxRate = parseFloat(filters.maxBaseRate);
      result = result.filter(award => getMaxBaseRate(award) <= maxRate);
    }

    if (filters.hasEveningPenalty !== null) {
      result = result.filter(award => 
        filters.hasEveningPenalty ? !!award.eveningPenalty : !award.eveningPenalty
      );
    }

    if (filters.hasNightPenalty !== null) {
      result = result.filter(award => 
        filters.hasNightPenalty ? !!award.nightPenalty : !award.nightPenalty
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'code':
          comparison = a.code.localeCompare(b.code);
          break;
        case 'industry':
          comparison = a.industry.localeCompare(b.industry);
          break;
        case 'baseRate':
          comparison = getMinBaseRate(a) - getMinBaseRate(b);
          break;
        case 'casualLoading':
          comparison = a.casualLoading - b.casualLoading;
          break;
        case 'saturdayPenalty':
          comparison = a.saturdayPenalty - b.saturdayPenalty;
          break;
        case 'sundayPenalty':
          comparison = a.sundayPenalty - b.sundayPenalty;
          break;
        case 'classifications':
          comparison = a.classifications.length - b.classifications.length;
          break;
      }

      // Favorites always on top
      const aFav = isAwardFavorite(a.id) ? 1 : 0;
      const bFav = isAwardFavorite(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [filters, sortField, sortDirection, enabledAwards]);

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const handleBulkAction = (action: 'enable' | 'disable' | 'export') => {
    if (selectedAwardIds.size === 0) {
      toast.error('No awards selected');
      return;
    }

    if (action === 'enable') {
      selectedAwardIds.forEach(id => {
        if (!isAwardEnabled(id)) toggleAward(id);
      });
      toast.success(`${selectedAwardIds.size} awards enabled`);
    } else if (action === 'disable') {
      selectedAwardIds.forEach(id => {
        if (isAwardEnabled(id)) toggleAward(id);
      });
      toast.success(`${selectedAwardIds.size} awards disabled`);
    } else if (action === 'export') {
      toast.success(`Exporting ${selectedAwardIds.size} awards...`);
    }

    setSelectedAwardIds(new Set());
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      industry: 'all',
      status: 'all',
      minBaseRate: '',
      maxBaseRate: '',
      hasEveningPenalty: null,
      hasNightPenalty: null,
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.industry !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.minBaseRate) count++;
    if (filters.maxBaseRate) count++;
    if (filters.hasEveningPenalty !== null) count++;
    if (filters.hasNightPenalty !== null) count++;
    return count;
  }, [filters]);

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="card-material">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <div>
                <p className="text-lg font-bold">{australianAwards.length}</p>
                <p className="text-xs text-muted-foreground">Total Awards</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-material">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-lg font-bold">{enabledAwards.filter(e => e.isActive).length}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-material">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-lg font-bold">{australianAwards.reduce((sum, a) => sum + a.classifications.length, 0)}</p>
                <p className="text-xs text-muted-foreground">Classifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-material">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-lg font-bold">{industries.length}</p>
                <p className="text-xs text-muted-foreground">Industries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-material">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-lg font-bold">{enabledAwards.filter(e => e.isFavorite).length}</p>
                <p className="text-xs text-muted-foreground">Favorites</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card className="card-material">
        <CardContent className="p-4 space-y-4">
          {/* Primary filters row */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or industry..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>

            <Select 
              value={filters.industry} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, industry: value }))}
            >
              <SelectTrigger className="w-48">
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

            <Select 
              value={filters.status} 
              onValueChange={(value: 'all' | 'active' | 'inactive') => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Advanced
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
              {showAdvancedFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>

            {(filters.search || filters.industry !== 'all' || filters.status !== 'all' || activeFilterCount > 0) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            )}
          </div>

          {/* Advanced filters */}
          <Collapsible open={showAdvancedFilters}>
            <CollapsibleContent>
              <div className="pt-3 border-t mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Min Base Rate</label>
                  <Input
                    type="number"
                    placeholder="$0.00"
                    value={filters.minBaseRate}
                    onChange={(e) => setFilters(prev => ({ ...prev, minBaseRate: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Max Base Rate</label>
                  <Input
                    type="number"
                    placeholder="$100.00"
                    value={filters.maxBaseRate}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxBaseRate: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Evening Penalty</label>
                  <Select 
                    value={filters.hasEveningPenalty === null ? 'all' : filters.hasEveningPenalty ? 'yes' : 'no'}
                    onValueChange={(value) => setFilters(prev => ({ 
                      ...prev, 
                      hasEveningPenalty: value === 'all' ? null : value === 'yes'
                    }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="yes">Has Evening</SelectItem>
                      <SelectItem value="no">No Evening</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Night Penalty</label>
                  <Select 
                    value={filters.hasNightPenalty === null ? 'all' : filters.hasNightPenalty ? 'yes' : 'no'}
                    onValueChange={(value) => setFilters(prev => ({ 
                      ...prev, 
                      hasNightPenalty: value === 'all' ? null : value === 'yes'
                    }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="yes">Has Night</SelectItem>
                      <SelectItem value="no">No Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedAwardIds.size > 0 && (
        <Card className="card-material border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{selectedAwardIds.size} award(s) selected</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('enable')}>
                Enable Selected
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('disable')}>
                Disable Selected
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedAwardIds(new Set())}>
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredAndSortedAwards.length} of {australianAwards.length} awards
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Sort by:</span>
          <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="code">Code</SelectItem>
              <SelectItem value="industry">Industry</SelectItem>
              <SelectItem value="baseRate">Base Rate</SelectItem>
              <SelectItem value="casualLoading">Casual Loading</SelectItem>
              <SelectItem value="saturdayPenalty">Saturday Penalty</SelectItem>
              <SelectItem value="sundayPenalty">Sunday Penalty</SelectItem>
              <SelectItem value="classifications">Classifications</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <Card className="card-material-elevated overflow-hidden">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedAwardIds.size === filteredAndSortedAwards.length && filteredAndSortedAwards.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-12">Status</TableHead>
                <SortableHeader field="name">Award Name</SortableHeader>
                <SortableHeader field="code">Code</SortableHeader>
                <SortableHeader field="industry">Industry</SortableHeader>
                <SortableHeader field="baseRate">Base Rate Range</SortableHeader>
                <SortableHeader field="casualLoading">Casual</SortableHeader>
                <SortableHeader field="saturdayPenalty">Sat</SortableHeader>
                <SortableHeader field="sundayPenalty">Sun</SortableHeader>
                <TableHead>P.Hol</TableHead>
                <SortableHeader field="classifications">Levels</SortableHeader>
                <TableHead className="w-12">Allowances</TableHead>
                <TableHead className="w-16 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedAwards.map((award) => {
                const isExpanded = expandedAwardIds.has(award.id);
                const isSelected = selectedAwardIds.has(award.id);
                const isEnabled = isAwardEnabled(award.id);
                const isFavorite = isAwardFavorite(award.id);

                return (
                  <>
                    <TableRow 
                      key={award.id}
                      className={`transition-colors ${isEnabled ? 'bg-green-500/5' : ''} ${isSelected ? 'bg-primary/10' : ''}`}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectAward(award.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleFavorite(award.id)}
                        >
                          {isFavorite ? (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ) : (
                            <StarOff className="h-4 w-4 text-muted-foreground/50" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={isEnabled}
                          onCheckedChange={() => toggleAward(award.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => toggleExpanded(award.id)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          <div>
                            <p className="font-medium text-sm">{award.shortName}</p>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="text-xs text-muted-foreground truncate max-w-48">{award.name}</p>
                                </TooltipTrigger>
                                <TooltipContent>{award.name}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">{award.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{award.industry}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <div className="flex flex-col">
                          <span>{formatCurrency(getMinBaseRate(award))}</span>
                          <span className="text-xs text-muted-foreground">to {formatCurrency(getMaxBaseRate(award))}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
                          {award.casualLoading}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono text-sm">{award.saturdayPenalty}%</TableCell>
                      <TableCell className="text-center font-mono text-sm">{award.sundayPenalty}%</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-amber-500/10 text-amber-700 border-amber-200">
                          {award.publicHolidayPenalty}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">{award.classifications.length}</TableCell>
                      <TableCell className="text-center">{award.allowances.length}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <Dialog>
                              <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSelectedAward(award); }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                              </DialogTrigger>
                            </Dialog>
                            <DropdownMenuItem onClick={() => toast.success('Rates copied to clipboard')}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Rates
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.success('Exporting PDF...')}>
                              <FileText className="h-4 w-4 mr-2" />
                              Export PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleAward(award.id)}>
                              {isEnabled ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Disable Award
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Enable Award
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Classifications */}
                    {isExpanded && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={14} className="p-0">
                          <div className="p-4 space-y-4">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                              <div className="p-2 rounded bg-background border">
                                <p className="text-xs text-muted-foreground">Casual Loading</p>
                                <p className="font-semibold">{award.casualLoading}%</p>
                              </div>
                              <div className="p-2 rounded bg-background border">
                                <p className="text-xs text-muted-foreground">Saturday</p>
                                <p className="font-semibold">{award.saturdayPenalty}%</p>
                              </div>
                              <div className="p-2 rounded bg-background border">
                                <p className="text-xs text-muted-foreground">Sunday</p>
                                <p className="font-semibold">{award.sundayPenalty}%</p>
                              </div>
                              <div className="p-2 rounded bg-background border">
                                <p className="text-xs text-muted-foreground">Public Holiday</p>
                                <p className="font-semibold text-amber-600">{award.publicHolidayPenalty}%</p>
                              </div>
                              {award.eveningPenalty && (
                                <div className="p-2 rounded bg-background border">
                                  <p className="text-xs text-muted-foreground">Evening</p>
                                  <p className="font-semibold">{award.eveningPenalty}%</p>
                                </div>
                              )}
                              {award.nightPenalty && (
                                <div className="p-2 rounded bg-background border">
                                  <p className="text-xs text-muted-foreground">Night</p>
                                  <p className="font-semibold">{award.nightPenalty}%</p>
                                </div>
                              )}
                              <div className="p-2 rounded bg-background border">
                                <p className="text-xs text-muted-foreground">OT (First 2h)</p>
                                <p className="font-semibold">{award.overtimeRates.first2Hours}%</p>
                              </div>
                              <div className="p-2 rounded bg-background border">
                                <p className="text-xs text-muted-foreground">OT (After 2h)</p>
                                <p className="font-semibold">{award.overtimeRates.after2Hours}%</p>
                              </div>
                            </div>

                            {/* Classifications Table */}
                            <div className="border rounded-lg overflow-hidden bg-background">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted/50">
                                    <TableHead>Level</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Base Rate</TableHead>
                                    <TableHead className="text-right">Casual Rate</TableHead>
                                    <TableHead className="text-right">Sat Rate</TableHead>
                                    <TableHead className="text-right">Sun Rate</TableHead>
                                    <TableHead>Qualification</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {award.classifications.map((classification) => {
                                    const rates = calculateRates(award, classification, 'casual');
                                    return (
                                      <TableRow key={classification.id}>
                                        <TableCell className="font-medium">{classification.level}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{classification.description}</TableCell>
                                        <TableCell className="text-right font-mono">{formatCurrency(classification.baseHourlyRate)}</TableCell>
                                        <TableCell className="text-right font-mono text-primary">{formatCurrency(rates.casualLoadedRate || 0)}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{formatCurrency(rates.saturdayRate)}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{formatCurrency(rates.sundayRate)}</TableCell>
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

                            {/* Allowances */}
                            {award.allowances.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  Allowances ({award.allowances.length})
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {award.allowances.map((allowance) => (
                                    <TooltipProvider key={allowance.id}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge variant="secondary" className="cursor-help">
                                            {allowance.name}: {formatCurrency(allowance.amount)}
                                            <span className="text-muted-foreground ml-1">
                                              /{allowance.type.replace('per_', '').replace('_', ' ')}
                                            </span>
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{allowance.description}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>

        {filteredAndSortedAwards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Award className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Awards Found</h3>
            <p className="text-muted-foreground text-sm">Try adjusting your filters or search terms</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </Card>

      {/* Detail Dialog */}
      {selectedAward && (
        <Dialog open={!!selectedAward} onOpenChange={() => setSelectedAward(null)}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                {selectedAward.name}
              </DialogTitle>
              <DialogDescription>
                {selectedAward.code} • {selectedAward.industry} • Effective from {selectedAward.effectiveDate}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {/* Rate Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Casual Loading</p>
                    <p className="text-xl font-bold text-primary">{selectedAward.casualLoading}%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Saturday Penalty</p>
                    <p className="text-xl font-bold">{selectedAward.saturdayPenalty}%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Sunday Penalty</p>
                    <p className="text-xl font-bold">{selectedAward.sundayPenalty}%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Public Holiday</p>
                    <p className="text-xl font-bold text-amber-600">{selectedAward.publicHolidayPenalty}%</p>
                  </div>
                </div>

                {/* Classifications Table */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Pay Classifications ({selectedAward.classifications.length})
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
                        {selectedAward.classifications.map((classification) => {
                          const rates = calculateRates(selectedAward, classification, 'casual');
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
                      <p className="text-2xl font-bold">{selectedAward.overtimeRates.first2Hours}%</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                      <p className="text-sm text-muted-foreground">After 2 Hours</p>
                      <p className="text-2xl font-bold">{selectedAward.overtimeRates.after2Hours}%</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                      <p className="text-sm text-muted-foreground">Sunday Overtime</p>
                      <p className="text-2xl font-bold">{selectedAward.overtimeRates.sundayOvertime}%</p>
                    </div>
                  </div>
                </div>

                {/* Allowances */}
                {selectedAward.allowances.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Allowances ({selectedAward.allowances.length})
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
                          {selectedAward.allowances.map((allowance) => (
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
                {(selectedAward.eveningPenalty || selectedAward.nightPenalty) && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      Additional Penalties
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedAward.eveningPenalty && (
                        <div className="p-4 rounded-lg border bg-card">
                          <p className="text-sm text-muted-foreground">Evening Penalty</p>
                          <p className="text-2xl font-bold">{selectedAward.eveningPenalty}%</p>
                        </div>
                      )}
                      {selectedAward.nightPenalty && (
                        <div className="p-4 rounded-lg border bg-card">
                          <p className="text-sm text-muted-foreground">Night Penalty</p>
                          <p className="text-2xl font-bold">{selectedAward.nightPenalty}%</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="mt-4 border-t pt-4">
              <Button variant="outline" className="gap-2" onClick={() => toast.success('Rates copied to clipboard')}>
                <Copy className="h-4 w-4" />
                Copy Rates
              </Button>
              <Button className="gap-2" onClick={() => toast.success('Exporting PDF...')}>
                <FileText className="h-4 w-4" />
                Export PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
