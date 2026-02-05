import React, { useState } from 'react';
import { Building2, Plus, ChevronRight, Users, MapPin, Filter, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Department, Location, DEPARTMENT_TYPE_LABELS } from '@/types/location';

interface DepartmentListPanelProps {
  departments: Department[];
  locations: Location[];
  searchQuery: string;
  onSelectDepartment: (id: string) => void;
  onCreateDepartment: () => void;
}

const DepartmentListPanel: React.FC<DepartmentListPanelProps> = ({
  departments,
  locations,
  searchQuery,
  onSelectDepartment,
  onCreateDepartment,
}) => {
  const [filterLocationId, setFilterLocationId] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = 
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = filterLocationId === 'all' || dept.locationId === filterLocationId;
    const matchesType = filterType === 'all' || dept.type === filterType;
    return matchesSearch && matchesLocation && matchesType;
  });

  const getTypeColor = (type: Department['type']) => {
    switch (type) {
      case 'operational':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'support':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'management':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'administrative':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getLocationName = (locationId: string) => {
    return locations.find(l => l.id === locationId)?.name || 'Unknown';
  };

  const formatBudget = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">All Departments</h2>
          <p className="text-sm text-muted-foreground">{filteredDepartments.length} departments</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterLocationId} onValueChange={setFilterLocationId}>
            <SelectTrigger className="w-40">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="operational">Operational</SelectItem>
              <SelectItem value="support">Support</SelectItem>
              <SelectItem value="management">Management</SelectItem>
              <SelectItem value="administrative">Administrative</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={onCreateDepartment} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        </div>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDepartments.map((dept) => (
          <div
            key={dept.id}
            onClick={() => onSelectDepartment(dept.id)}
            className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{dept.name}</h3>
                  <p className="text-xs text-muted-foreground">{dept.code}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={cn('text-xs', getTypeColor(dept.type))}>
                {DEPARTMENT_TYPE_LABELS[dept.type]}
              </Badge>
              {!dept.isActive && (
                <Badge variant="secondary" className="text-xs">Inactive</Badge>
              )}
            </div>

            {dept.description && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{dept.description}</p>
            )}

            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <MapPin className="h-3 w-3" />
              <span>{getLocationName(dept.locationId)}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Headcount</p>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium">{dept.headcount || 0}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Areas</p>
                <p className="text-sm font-medium">{dept.areaIds.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Budget</p>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium">{formatBudget(dept.budgetAllocation)}</span>
                </div>
              </div>
            </div>

            {dept.managerName && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">Manager</p>
                <p className="text-sm font-medium">{dept.managerName}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredDepartments.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">No departments found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first department'}
          </p>
          <Button onClick={onCreateDepartment} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        </div>
      )}
    </div>
  );
};

export default DepartmentListPanel;
