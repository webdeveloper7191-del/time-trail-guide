import React from 'react';
import { MapPin, Plus, ChevronRight, Users, Layers, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Location, LocationSummary, LOCATION_STATUS_LABELS } from '@/types/location';

interface LocationListPanelProps {
  locations: Location[];
  summaries: LocationSummary[];
  searchQuery: string;
  onSelectLocation: (id: string) => void;
  onCreateLocation: () => void;
}

const LocationListPanel: React.FC<LocationListPanelProps> = ({
  locations,
  summaries,
  searchQuery,
  onSelectLocation,
  onCreateLocation,
}) => {
  const filteredLocations = summaries.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: LocationSummary['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      case 'pending_setup':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'temporarily_closed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getComplianceColor = (status: LocationSummary['complianceStatus']) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-500';
      case 'warning':
        return 'bg-amber-500';
      case 'non_compliant':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">All Locations</h2>
          <p className="text-sm text-muted-foreground">{filteredLocations.length} locations</p>
        </div>
        <Button onClick={onCreateLocation} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Location Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLocations.map((location) => {
          const fullLocation = locations.find(l => l.id === location.id);
          
          return (
            <div
              key={location.id}
              onClick={() => onSelectLocation(location.id)}
              className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{location.name}</h3>
                    <p className="text-xs text-muted-foreground">{location.code}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className={cn('text-xs', getStatusColor(location.status))}>
                  {LOCATION_STATUS_LABELS[location.status]}
                </Badge>
                <div className={cn('h-2 w-2 rounded-full', getComplianceColor(location.complianceStatus))} />
              </div>

              {fullLocation && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                  {fullLocation.address.line1}, {fullLocation.address.suburb}
                </p>
              )}

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Layers className="h-3 w-3" />
                    <span className="text-xs">Areas</span>
                  </div>
                  <p className="text-sm font-medium">{location.areaCount}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    <span className="text-xs">Depts</span>
                  </div>
                  <p className="text-sm font-medium">{location.departmentCount}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span className="text-xs">Capacity</span>
                  </div>
                  <p className="text-sm font-medium">{location.totalCapacity}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLocations.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">No locations found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first location'}
          </p>
          <Button onClick={onCreateLocation} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </div>
      )}
    </div>
  );
};

export default LocationListPanel;
