import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  FileSpreadsheet,
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
  Edit2,
  Check,
  X,
  RotateCcw,
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
import { AwardDetailModal } from './AwardDetailModal';
import { AwardPreviewSheet } from './AwardPreviewSheet';
import { exportAwardToPDF, exportAwardToExcel, exportMultipleAwardsToPDF, exportMultipleAwardsToExcel } from '@/lib/awardExport';

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
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);
  const [customRates, setCustomRates] = useState<Record<string, Record<string, number>>>({});
  
  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ awardId: string; classificationId: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  
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

  const handleBulkAction = (action: 'enable' | 'disable' | 'exportPdf' | 'exportExcel') => {
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
    } else if (action === 'exportPdf') {
      const selectedAwardsData = australianAwards.filter(a => selectedAwardIds.has(a.id));
      exportMultipleAwardsToPDF({ awards: selectedAwardsData, customRates });
      toast.success(`Exporting ${selectedAwardIds.size} awards to PDF...`);
    } else if (action === 'exportExcel') {
      const selectedAwardsData = australianAwards.filter(a => selectedAwardIds.has(a.id));
      exportMultipleAwardsToExcel({ awards: selectedAwardsData, customRates });
      toast.success(`Exporting ${selectedAwardIds.size} awards to Excel...`);
    }

    setSelectedAwardIds(new Set());
  };

  const handleViewDetails = (award: AustralianAward) => {
    setSelectedAward(award);
    // Open preview sheet for uninstalled awards, detail modal for installed ones
    const isEnabled = isAwardEnabled(award.id);
    if (isEnabled) {
      setDetailModalOpen(true);
    } else {
      setPreviewSheetOpen(true);
    }
  };

  const handleOpenPreview = (award: AustralianAward) => {
    setSelectedAward(award);
    setPreviewSheetOpen(true);
  };

  const handleExportSinglePdf = (award: AustralianAward) => {
    exportAwardToPDF({ award, customRates: customRates[award.id] || {} });
    toast.success('PDF exported successfully');
  };

  const handleExportSingleExcel = (award: AustralianAward) => {
    exportAwardToExcel({ award, customRates: customRates[award.id] || {} });
    toast.success('Excel exported successfully');
  };

  const handleCopyRates = (award: AustralianAward) => {
    const ratesText = award.classifications
      .map(c => {
        const override = customRates[award.id]?.[c.id];
        return `${c.level}: ${formatCurrency(override || c.baseHourlyRate)}${override ? ' (override)' : ''}`;
      })
      .join('\n');
    navigator.clipboard.writeText(ratesText);
    toast.success('Rates copied to clipboard');
  };

  const handleStartInlineEdit = (awardId: string, classificationId: string, currentRate: number) => {
    setEditingCell({ awardId, classificationId });
    setEditValue(currentRate.toString());
  };

  const handleSaveInlineEdit = () => {
    if (!editingCell) return;
    
    const numValue = parseFloat(editValue);
    if (!isNaN(numValue) && numValue > 0) {
      setCustomRates(prev => ({
        ...prev,
        [editingCell.awardId]: {
          ...prev[editingCell.awardId],
          [editingCell.classificationId]: numValue,
        }
      }));
      toast.success('Rate override saved');
    } else {
      toast.error('Please enter a valid rate');
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleCancelInlineEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleRemoveOverride = (awardId: string, classificationId: string) => {
    setCustomRates(prev => {
      const awardRates = { ...prev[awardId] };
      delete awardRates[classificationId];
      return { ...prev, [awardId]: awardRates };
    });
    toast.success('Override removed');
  };

  const getOverrideCount = (awardId: string) => Object.keys(customRates[awardId] || {}).length;

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-4 w-4" />
                    Export
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkAction('exportPdf')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export to PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('exportExcel')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export to Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                            <DropdownMenuItem onClick={() => handleViewDetails(award)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyRates(award)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Rates
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleExportSinglePdf(award)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Export PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportSingleExcel(award)}>
                              <FileSpreadsheet className="h-4 w-4 mr-2" />
                              Export Excel
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
                                    <TableHead className="text-right">Custom Rate</TableHead>
                                    <TableHead className="text-right">Casual Rate</TableHead>
                                    <TableHead className="text-right">Sat Rate</TableHead>
                                    <TableHead className="text-right">Sun Rate</TableHead>
                                    <TableHead className="w-24">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {award.classifications.map((classification) => {
                                    const hasOverride = customRates[award.id]?.[classification.id] !== undefined;
                                    const effectiveRate = customRates[award.id]?.[classification.id] || classification.baseHourlyRate;
                                    const rates = calculateRates({ ...award }, { ...classification, baseHourlyRate: effectiveRate }, 'casual');
                                    const isEditing = editingCell?.awardId === award.id && editingCell?.classificationId === classification.id;

                                    return (
                                      <TableRow key={classification.id} className={hasOverride ? 'bg-amber-500/5' : ''}>
                                        <TableCell className="font-medium">{classification.level}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{classification.description}</TableCell>
                                        <TableCell className="text-right font-mono">
                                          <span className={hasOverride ? 'line-through text-muted-foreground' : ''}>
                                            {formatCurrency(classification.baseHourlyRate)}
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-right">
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
                                                  if (e.key === 'Enter') handleSaveInlineEdit();
                                                  if (e.key === 'Escape') handleCancelInlineEdit();
                                                }}
                                              />
                                              <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600" onClick={handleSaveInlineEdit}>
                                                <Check className="h-3 w-3" />
                                              </Button>
                                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={handleCancelInlineEdit}>
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <span className={`font-mono ${hasOverride ? 'text-amber-600 font-semibold' : 'text-muted-foreground'}`}>
                                              {hasOverride ? formatCurrency(customRates[award.id][classification.id]) : '-'}
                                            </span>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-primary">{formatCurrency(rates.casualLoadedRate || 0)}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{formatCurrency(rates.saturdayRate)}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{formatCurrency(rates.sundayRate)}</TableCell>
                                        <TableCell>
                                          {!isEditing && (
                                            <div className="flex items-center gap-1">
                                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStartInlineEdit(award.id, classification.id, classification.baseHourlyRate)}>
                                                <Edit2 className="h-3 w-3" />
                                              </Button>
                                              {hasOverride && (
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveOverride(award.id, classification.id)}>
                                                  <RotateCcw className="h-3 w-3" />
                                                </Button>
                                              )}
                                            </div>
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

      {/* Detail Modal */}
      {selectedAward && (
        <AwardDetailModal
          award={selectedAward}
          open={detailModalOpen}
          onOpenChange={(open) => {
            setDetailModalOpen(open);
            if (!open) setSelectedAward(null);
          }}
          customRates={customRates[selectedAward.id] || {}}
          onCustomRatesChange={(rates) => {
            setCustomRates(prev => ({
              ...prev,
              [selectedAward.id]: rates,
            }));
          }}
          // Multi-award navigation support
          installedAwards={enabledAwards.filter(e => e.isActive).map(e => 
            australianAwards.find(a => a.id === e.awardId)!
          ).filter(Boolean)}
          allCustomRates={customRates}
          onAwardChange={(award) => {
            setSelectedAward(award);
          }}
        />
      )}

      {/* Award Preview Sheet for viewing uninstalled awards */}
      {selectedAward && (
        <AwardPreviewSheet
          award={selectedAward}
          open={previewSheetOpen}
          onOpenChange={setPreviewSheetOpen}
          isEnabled={isAwardEnabled(selectedAward.id)}
          isFavorite={isAwardFavorite(selectedAward.id)}
          onToggleEnable={toggleAward}
          onToggleFavorite={toggleFavorite}
          onExportPDF={handleExportSinglePdf}
          onExportExcel={handleExportSingleExcel}
        />
      )}
    </div>
  );
}
