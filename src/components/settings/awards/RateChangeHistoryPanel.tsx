import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Download, Filter, ArrowUpRight, ArrowDownRight, Minus, History, Calendar } from 'lucide-react';
import { australianAwards } from '@/data/australianAwards';

interface RateChangeRecord {
  id: string;
  awardId: string;
  classificationId: string;
  changeType: 'fwc_annual' | 'override_added' | 'override_removed' | 'override_modified' | 'penalty_change';
  previousValue: number;
  newValue: number;
  effectiveDate: string;
  changedBy: string;
  changeSource: string;
  notes?: string;
}

const mockHistory: RateChangeRecord[] = [
  {
    id: '1',
    awardId: 'children-services-2020',
    classificationId: 'cs-4-1',
    changeType: 'fwc_annual',
    previousValue: 29.50,
    newValue: 30.28,
    effectiveDate: '2024-07-01',
    changedBy: 'System',
    changeSource: 'FWC Annual Wage Review 2024-25',
    notes: '2.64% increase applied',
  },
  {
    id: '2',
    awardId: 'children-services-2020',
    classificationId: 'cs-4-1',
    changeType: 'override_added',
    previousValue: 30.28,
    newValue: 32.50,
    effectiveDate: '2024-01-01',
    changedBy: 'HR Manager',
    changeSource: 'Manual Override',
    notes: 'Above award rate for experienced staff retention',
  },
  {
    id: '3',
    awardId: 'children-services-2020',
    classificationId: 'cs-5-1',
    changeType: 'override_added',
    previousValue: 34.60,
    newValue: 36.00,
    effectiveDate: '2024-03-01',
    changedBy: 'CEO',
    changeSource: 'Manual Override',
    notes: 'Market adjustment for ECT qualification',
  },
  {
    id: '4',
    awardId: 'children-services-2020',
    classificationId: 'cs-3-1',
    changeType: 'fwc_annual',
    previousValue: 26.28,
    newValue: 26.98,
    effectiveDate: '2024-07-01',
    changedBy: 'System',
    changeSource: 'FWC Annual Wage Review 2024-25',
    notes: '2.66% increase applied',
  },
  {
    id: '5',
    awardId: 'educational-services-2020',
    classificationId: 'et-4',
    changeType: 'fwc_annual',
    previousValue: 47.05,
    newValue: 48.30,
    effectiveDate: '2024-07-01',
    changedBy: 'System',
    changeSource: 'FWC Annual Wage Review 2024-25',
    notes: '2.66% increase applied',
  },
  {
    id: '6',
    awardId: 'hospitality-2020',
    classificationId: 'hosp-3',
    changeType: 'penalty_change',
    previousValue: 150,
    newValue: 125,
    effectiveDate: '2023-07-01',
    changedBy: 'System',
    changeSource: 'FWC Penalty Rate Decision',
    notes: 'Sunday penalty rate adjustment for hospitality',
  },
];

export function RateChangeHistoryPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAward, setSelectedAward] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [history] = useState<RateChangeRecord[]>(mockHistory);

  const getAwardName = (awardId: string) => {
    return australianAwards.find(a => a.id === awardId)?.shortName || awardId;
  };

  const getClassificationName = (awardId: string, classId: string) => {
    const award = australianAwards.find(a => a.id === awardId);
    return award?.classifications.find(c => c.id === classId)?.level || classId;
  };

  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case 'fwc_annual': return 'FWC Annual';
      case 'override_added': return 'Override Added';
      case 'override_removed': return 'Override Removed';
      case 'override_modified': return 'Override Modified';
      case 'penalty_change': return 'Penalty Change';
      default: return type;
    }
  };

  const getChangeTypeBadge = (type: string) => {
    switch (type) {
      case 'fwc_annual':
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">FWC Annual</Badge>;
      case 'override_added':
        return <Badge className="bg-green-500/10 text-green-700 border-green-200">Override Added</Badge>;
      case 'override_removed':
        return <Badge className="bg-red-500/10 text-red-700 border-red-200">Override Removed</Badge>;
      case 'override_modified':
        return <Badge className="bg-amber-500/10 text-amber-700 border-amber-200">Modified</Badge>;
      case 'penalty_change':
        return <Badge className="bg-purple-500/10 text-purple-700 border-purple-200">Penalty</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const filteredHistory = history.filter(record => {
    const matchesSearch = searchQuery === '' || 
      getAwardName(record.awardId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getClassificationName(record.awardId, record.classificationId).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAward = selectedAward === 'all' || record.awardId === selectedAward;
    const matchesType = selectedType === 'all' || record.changeType === selectedType;
    return matchesSearch && matchesAward && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Rate Change History</h3>
          <p className="text-sm text-muted-foreground">
            Complete audit trail of all rate modifications
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export History
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{history.length}</p>
                <p className="text-sm text-muted-foreground">Total Changes</p>
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
                <p className="text-2xl font-bold">{history.filter(h => h.changeType === 'fwc_annual').length}</p>
                <p className="text-sm text-muted-foreground">FWC Updates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{history.filter(h => h.changeType.includes('override')).length}</p>
                <p className="text-sm text-muted-foreground">Manual Overrides</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Filter className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{history.filter(h => h.changeType === 'penalty_change').length}</p>
                <p className="text-sm text-muted-foreground">Penalty Changes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-material">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedAward} onValueChange={setSelectedAward}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Awards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Awards</SelectItem>
                {australianAwards.map(award => (
                  <SelectItem key={award.id} value={award.id}>{award.shortName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="fwc_annual">FWC Annual</SelectItem>
                <SelectItem value="override_added">Override Added</SelectItem>
                <SelectItem value="override_removed">Override Removed</SelectItem>
                <SelectItem value="penalty_change">Penalty Change</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="card-material-elevated">
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Award / Classification</TableHead>
                  <TableHead>Change Type</TableHead>
                  <TableHead className="text-right">Previous</TableHead>
                  <TableHead className="text-right">New</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((record) => {
                  const diff = record.newValue - record.previousValue;
                  const isPenalty = record.changeType === 'penalty_change';
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.effectiveDate}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{getAwardName(record.awardId)}</p>
                          <p className="text-sm text-muted-foreground">
                            {getClassificationName(record.awardId, record.classificationId)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getChangeTypeBadge(record.changeType)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {isPenalty ? `${record.previousValue}%` : `$${record.previousValue.toFixed(2)}`}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {isPenalty ? `${record.newValue}%` : `$${record.newValue.toFixed(2)}`}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {diff > 0 ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                          ) : diff < 0 ? (
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                          ) : (
                            <Minus className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : ''}>
                            {diff > 0 ? '+' : ''}{isPenalty ? `${diff}%` : `$${diff.toFixed(2)}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{record.changedBy}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {record.changeSource}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
