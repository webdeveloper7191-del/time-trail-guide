import React, { useState } from 'react';
import { MapPin, Building2, Layers, Settings, Plus, Search, Filter, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { mockLocations, mockAreas, mockDepartments, getLocationSummaries, getAreaSummaries } from '@/data/mockLocationData';
import { Location, Area, Department, LocationSummary, AreaSummary, LOCATION_STATUS_LABELS, AREA_STATUS_LABELS } from '@/types/location';
import LocationListPanel from '@/components/location/LocationListPanel';
import LocationDetailPanel from '@/components/location/LocationDetailPanel';
import AreaListPanel from '@/components/location/AreaListPanel';
import AreaDetailPanel from '@/components/location/AreaDetailPanel';
import DepartmentListPanel from '@/components/location/DepartmentListPanel';
import DepartmentDetailPanel from '@/components/location/DepartmentDetailPanel';
import ComplianceConfigPanel from '@/components/location/ComplianceConfigPanel';

const LocationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'locations' | 'areas' | 'departments' | 'compliance'>('locations');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection state
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  
  // Panel state
  const [showLocationDetail, setShowLocationDetail] = useState(false);
  const [showAreaDetail, setShowAreaDetail] = useState(false);
  const [showDepartmentDetail, setShowDepartmentDetail] = useState(false);
  const [showComplianceConfig, setShowComplianceConfig] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  const locationSummaries = getLocationSummaries();
  
  const handleSelectLocation = (locationId: string) => {
    setSelectedLocationId(locationId);
    setShowLocationDetail(true);
    setIsCreatingNew(false);
  };
  
  const handleCreateLocation = () => {
    setSelectedLocationId(null);
    setShowLocationDetail(true);
    setIsCreatingNew(true);
  };
  
  const handleSelectArea = (areaId: string) => {
    setSelectedAreaId(areaId);
    setShowAreaDetail(true);
    setIsCreatingNew(false);
  };
  
  const handleCreateArea = () => {
    setSelectedAreaId(null);
    setShowAreaDetail(true);
    setIsCreatingNew(true);
  };
  
  const handleSelectDepartment = (departmentId: string) => {
    setSelectedDepartmentId(departmentId);
    setShowDepartmentDetail(true);
    setIsCreatingNew(false);
  };
  
  const handleCreateDepartment = () => {
    setSelectedDepartmentId(null);
    setShowDepartmentDetail(true);
    setIsCreatingNew(true);
  };
  
  const selectedLocation = selectedLocationId ? mockLocations.find(l => l.id === selectedLocationId) : null;
  const selectedArea = selectedAreaId ? mockAreas.find(a => a.id === selectedAreaId) : null;
  const selectedDepartment = selectedDepartmentId ? mockDepartments.find(d => d.id === selectedDepartmentId) : null;
  
  // Stats
  const stats = {
    totalLocations: mockLocations.length,
    activeLocations: mockLocations.filter(l => l.status === 'active').length,
    totalAreas: mockAreas.length,
    totalDepartments: mockDepartments.length,
    totalCapacity: mockLocations.reduce((sum, l) => sum + l.totalCapacity, 0),
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Location Management</h1>
                <p className="text-sm text-muted-foreground">Manage locations, areas, and compliance settings</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Locations</span>
              </div>
              <p className="text-2xl font-semibold mt-1">{stats.totalLocations}</p>
              <p className="text-xs text-muted-foreground">{stats.activeLocations} active</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Areas</span>
              </div>
              <p className="text-2xl font-semibold mt-1">{stats.totalAreas}</p>
              <p className="text-xs text-muted-foreground">Across all locations</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Departments</span>
              </div>
              <p className="text-2xl font-semibold mt-1">{stats.totalDepartments}</p>
              <p className="text-xs text-muted-foreground">Organizational units</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Total Capacity</span>
              </div>
              <p className="text-2xl font-semibold mt-1">{stats.totalCapacity}</p>
              <p className="text-xs text-muted-foreground">Max occupancy</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Compliance</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="default" className="bg-green-500 text-white">100%</Badge>
                <span className="text-xs text-muted-foreground">All compliant</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="p-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="mb-4">
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="areas" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Areas
            </TabsTrigger>
            <TabsTrigger value="departments" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Departments
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Compliance Config
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="locations" className="mt-0">
            <LocationListPanel
              locations={mockLocations}
              summaries={locationSummaries}
              searchQuery={searchQuery}
              onSelectLocation={handleSelectLocation}
              onCreateLocation={handleCreateLocation}
            />
          </TabsContent>
          
          <TabsContent value="areas" className="mt-0">
            <AreaListPanel
              areas={mockAreas}
              locations={mockLocations}
              searchQuery={searchQuery}
              onSelectArea={handleSelectArea}
              onCreateArea={handleCreateArea}
            />
          </TabsContent>
          
          <TabsContent value="departments" className="mt-0">
            <DepartmentListPanel
              departments={mockDepartments}
              locations={mockLocations}
              searchQuery={searchQuery}
              onSelectDepartment={handleSelectDepartment}
              onCreateDepartment={handleCreateDepartment}
            />
          </TabsContent>
          
          <TabsContent value="compliance" className="mt-0">
            <ComplianceConfigPanel />
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Detail Panels */}
      <LocationDetailPanel
        open={showLocationDetail}
        onClose={() => setShowLocationDetail(false)}
        location={selectedLocation}
        isNew={isCreatingNew}
        areas={selectedLocation ? mockAreas.filter(a => a.locationId === selectedLocation.id) : []}
        departments={selectedLocation ? mockDepartments.filter(d => d.locationId === selectedLocation.id) : []}
      />
      
      <AreaDetailPanel
        open={showAreaDetail}
        onClose={() => setShowAreaDetail(false)}
        area={selectedArea}
        isNew={isCreatingNew}
        location={selectedArea ? mockLocations.find(l => l.id === selectedArea.locationId) : null}
       locations={mockLocations}
      />
      
      <DepartmentDetailPanel
        open={showDepartmentDetail}
        onClose={() => setShowDepartmentDetail(false)}
        department={selectedDepartment}
        isNew={isCreatingNew}
        location={selectedDepartment ? mockLocations.find(l => l.id === selectedDepartment.locationId) : null}
        areas={selectedDepartment ? mockAreas.filter(a => selectedDepartment.areaIds.includes(a.id)) : []}
       locations={mockLocations}
      />
    </div>
  );
};

export default LocationManagement;
