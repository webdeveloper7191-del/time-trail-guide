import React, { useState } from 'react';
import { Layers, Plus, ChevronRight, Users, MapPin, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Area, Location, AREA_STATUS_LABELS } from '@/types/location';

interface AreaListPanelProps {
  areas: Area[];
  locations: Location[];
  searchQuery: string;
  onSelectArea: (id: string) => void;
  onCreateArea: () => void;
}

const AreaListPanel: React.FC<AreaListPanelProps> = ({
  areas,
  locations,
  searchQuery,
  onSelectArea,
  onCreateArea,
}) => {
  const [filterLocationId, setFilterLocationId] = useState<string>('all');

  const filteredAreas = areas.filter(area => {
    const matchesSearch = 
      area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = filterLocationId === 'all' || area.locationId === filterLocationId;
    return matchesSearch && matchesLocation;
  });

  const getStatusColor = (status: Area['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      case 'maintenance':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getLocationName = (locationId: string) => {
    return locations.find(l => l.id === locationId)?.name || 'Unknown';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">All Areas</h2>
          <p className="text-sm text-muted-foreground">{filteredAreas.length} areas</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterLocationId} onValueChange={setFilterLocationId}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={onCreateArea} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Area
          </Button>
        </div>
      </div>

      {/* Area Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAreas.map((area) => (
          <div
            key={area.id}
            onClick={() => onSelectArea(area.id)}
            className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="flex items-center justify-center h-10 w-10 rounded-lg"
                  style={{ backgroundColor: area.color ? `${area.color}20` : 'hsl(var(--primary) / 0.1)' }}
                >
                  <Layers 
                    className="h-5 w-5"
                    style={{ color: area.color || 'hsl(var(--primary))' }}
                  />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{area.name}</h3>
                  <p className="text-xs text-muted-foreground">{area.code}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={cn('text-xs', getStatusColor(area.status))}>
                {AREA_STATUS_LABELS[area.status]}
              </Badge>
              {area.serviceCategory && (
                <Badge variant="secondary" className="text-xs">
                  {area.serviceCategory}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <MapPin className="h-3 w-3" />
              <span>{getLocationName(area.locationId)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Capacity</p>
                <p className="text-sm font-medium">{area.capacity}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ratio</p>
                <p className="text-sm font-medium">
                  {area.staffingRatios[0] 
                    ? `${area.staffingRatios[0].minAttendance}-${area.staffingRatios[0].maxAttendance} → ${area.staffingRatios[0].staffRequired}`
                    : 'N/A'
                  }
                </p>
              </div>
            </div>

            {area.qualificationRequirements.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Requirements</p>
                <div className="flex flex-wrap gap-1">
                  {area.qualificationRequirements.slice(0, 2).map(req => (
                    <Badge key={req.id} variant="outline" className="text-xs">
                      {req.qualificationShortName}
                    </Badge>
                  ))}
                  {area.qualificationRequirements.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{area.qualificationRequirements.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAreas.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">No areas found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first area'}
          </p>
          <Button onClick={onCreateArea} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Area
          </Button>
        </div>
      )}
    </div>
  );
};

export default AreaListPanel;
