import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Layers,
  MapPin,
  Building2,
  Users,
  Save,
  Trash2,
  Search,
  Wand2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Eye,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { EnterpriseAgreement } from '@/types/enterpriseAgreement';
import { mockStaff, locations as mockLocations, departments as mockDepartments } from '@/data/mockStaffData';

type SourceType = 'location' | 'department' | 'staff';

interface BulkMapping {
  id: string;
  sourceType: SourceType;
  sourceId: string;
  sourceLabel: string;
  classificationId: string;
  classificationName: string;
  updatedAt: string;
}

const storageKey = (ebaId: string) => `eba_bulk_classification_map_${ebaId}`;

const loadMappings = (ebaId: string): BulkMapping[] => {
  try {
    const raw = localStorage.getItem(storageKey(ebaId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveMappings = (ebaId: string, mappings: BulkMapping[]) => {
  localStorage.setItem(storageKey(ebaId), JSON.stringify(mappings));
};

interface Props {
  eba: EnterpriseAgreement;
}

export function BulkClassificationMappingPanel({ eba }: Props) {
  const [mappings, setMappings] = useState<BulkMapping[]>(() => loadMappings(eba.id));
  const [sourceType, setSourceType] = useState<SourceType>('location');
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [targetClassificationId, setTargetClassificationId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const classifications = eba.classifications ?? [];

  const sourceItems = useMemo(() => {
    const q = search.toLowerCase();
    if (sourceType === 'location') {
      return mockLocations.map(l => ({ id: l, label: l })).filter(x => x.label.toLowerCase().includes(q));
    }
    if (sourceType === 'department') {
      return mockDepartments.map(d => ({ id: d, label: d })).filter(x => x.label.toLowerCase().includes(q));
    }
    return mockStaff
      .map(s => ({ id: s.id, label: `${s.firstName} ${s.lastName} — ${s.position}` }))
      .filter(x => x.label.toLowerCase().includes(q));
  }, [sourceType, search]);

  const existingByKey = useMemo(() => {
    const map = new Map<string, BulkMapping>();
    mappings.forEach(m => map.set(`${m.sourceType}:${m.sourceId}`, m));
    return map;
  }, [mappings]);

  const toggleSource = (id: string) => {
    setSelectedSourceIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => setSelectedSourceIds(sourceItems.map(s => s.id));
  const clearSelection = () => setSelectedSourceIds([]);

  const applyMapping = () => {
    if (!targetClassificationId) {
      toast.error('Select a target classification');
      return;
    }
    if (selectedSourceIds.length === 0) {
      toast.error('Select at least one item to map');
      return;
    }
    const cls = classifications.find(c => c.id === targetClassificationId);
    if (!cls) return;

    const next = [...mappings];
    selectedSourceIds.forEach(sid => {
      const item = sourceItems.find(s => s.id === sid);
      if (!item) return;
      const key = `${sourceType}:${sid}`;
      const existingIndex = next.findIndex(m => `${m.sourceType}:${m.sourceId}` === key);
      const mapping: BulkMapping = {
        id: existingIndex >= 0 ? next[existingIndex].id : crypto.randomUUID(),
        sourceType,
        sourceId: sid,
        sourceLabel: item.label,
        classificationId: cls.id,
        classificationName: `${cls.code} — ${cls.name}`,
        updatedAt: new Date().toISOString(),
      };
      if (existingIndex >= 0) next[existingIndex] = mapping;
      else next.push(mapping);
    });
    setMappings(next);
    saveMappings(eba.id, next);
    toast.success(`Mapped ${selectedSourceIds.length} ${sourceType}(s) to ${cls.code}`);
    clearSelection();
  };

  const autoSuggest = () => {
    if (sourceType !== 'staff') {
      toast.info('Auto-suggest works on staff using their current classification');
      return;
    }
    let matched = 0;
    const next = [...mappings];
    mockStaff.forEach(s => {
      const staffClass = s.currentPayCondition?.classification;
      if (!staffClass) return;
      const cls = classifications.find(c =>
        c.name.toLowerCase().includes(staffClass.toLowerCase()) ||
        c.code.toLowerCase() === staffClass.toLowerCase() ||
        staffClass.toLowerCase().includes(c.name.toLowerCase())
      );
      if (!cls) return;
      const key = `staff:${s.id}`;
      const existingIndex = next.findIndex(m => `${m.sourceType}:${m.sourceId}` === key);
      const mapping: BulkMapping = {
        id: existingIndex >= 0 ? next[existingIndex].id : crypto.randomUUID(),
        sourceType: 'staff',
        sourceId: s.id,
        sourceLabel: `${s.firstName} ${s.lastName} — ${s.position}`,
        classificationId: cls.id,
        classificationName: `${cls.code} — ${cls.name}`,
        updatedAt: new Date().toISOString(),
      };
      if (existingIndex >= 0) next[existingIndex] = mapping;
      else next.push(mapping);
      matched++;
    });
    setMappings(next);
    saveMappings(eba.id, next);
    toast.success(`Auto-mapped ${matched} staff by current classification`);
  };

  const removeMapping = (id: string) => {
    const next = mappings.filter(m => m.id !== id);
    setMappings(next);
    saveMappings(eba.id, next);
  };

  const clearAll = () => {
    setMappings([]);
    saveMappings(eba.id, []);
    toast.success('All mappings cleared');
  };

  const unmappedCount = sourceItems.filter(s => !existingByKey.has(`${sourceType}:${s.id}`)).length;

  if (classifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center gap-3 text-muted-foreground">
          <AlertTriangle className="h-5 w-5" />
          Add classifications to this EBA before bulk mapping.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Bulk Classification Mapping
          </CardTitle>
          <CardDescription>
            Map locations, departments, or staff to EBA classifications in one step.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={sourceType} onValueChange={(v) => { setSourceType(v as SourceType); clearSelection(); }}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="location" className="text-xs"><MapPin className="h-3 w-3 mr-1" /> Locations</TabsTrigger>
              <TabsTrigger value="department" className="text-xs"><Building2 className="h-3 w-3 mr-1" /> Departments</TabsTrigger>
              <TabsTrigger value="staff" className="text-xs"><Users className="h-3 w-3 mr-1" /> Staff</TabsTrigger>
            </TabsList>

            <TabsContent value={sourceType} className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search ${sourceType}s...`}
                    className="pl-8"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={selectAll}>Select all</Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>Clear</Button>
                {sourceType === 'staff' && (
                  <Button variant="outline" size="sm" onClick={autoSuggest}>
                    <Wand2 className="h-3 w-3 mr-1" /> Auto-suggest
                  </Button>
                )}
              </div>

              <ScrollArea className="h-64 border rounded-md">
                <div className="p-2 space-y-1">
                  {sourceItems.map(item => {
                    const key = `${sourceType}:${item.id}`;
                    const existing = existingByKey.get(key);
                    const checked = selectedSourceIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleSource(item.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox checked={checked} onCheckedChange={() => toggleSource(item.id)} />
                          <span className="text-sm">{item.label}</span>
                        </div>
                        {existing && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {existing.classificationName}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                  {sourceItems.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No items found</p>
                  )}
                </div>
              </ScrollArea>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{selectedSourceIds.length} selected · {unmappedCount} unmapped</span>
              </div>

              <Separator />

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Target classification</Label>
                  <Select value={targetClassificationId} onValueChange={setTargetClassificationId}>
                    <SelectTrigger><SelectValue placeholder="Select classification..." /></SelectTrigger>
                    <SelectContent>
                      {classifications.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.code} — {c.name} (L{c.level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={applyMapping}>
                  <Save className="h-4 w-4 mr-1" /> Apply mapping
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Current mappings ({mappings.length})</CardTitle>
            <CardDescription>All saved mappings for this agreement</CardDescription>
          </div>
          {mappings.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              <Trash2 className="h-3 w-3 mr-1" /> Clear all
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {mappings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No mappings yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map(m => (
                  <TableRow key={m.id}>
                    <TableCell><Badge variant="outline" className="capitalize text-xs">{m.sourceType}</Badge></TableCell>
                    <TableCell className="text-sm">{m.sourceLabel}</TableCell>
                    <TableCell className="text-sm">{m.classificationName}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removeMapping(m.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
