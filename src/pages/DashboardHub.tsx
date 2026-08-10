import { useState } from 'react';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, UserCircle } from 'lucide-react';
import { TenantAdminDashboard } from '@/components/dashboard/TenantAdminDashboard';
import { LocationAdminDashboard } from '@/components/dashboard/LocationAdminDashboard';
import { StaffDashboard } from '@/components/dashboard/StaffDashboard';

type Persona = 'tenant-admin' | 'location-admin' | 'staff';

const personas: { id: Persona; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'tenant-admin', label: 'Tenant Admin', icon: Building2, description: 'Organisation-wide performance, cost, compliance and governance' },
  { id: 'location-admin', label: 'Location Admin', icon: MapPin, description: 'Day-to-day coverage, approvals and cost for a single location' },
  { id: 'staff', label: 'Staff', icon: UserCircle, description: 'Your shifts, hours, leave balances and self-service actions' },
];

export default function DashboardHub() {
  const [persona, setPersona] = useState<Persona>('tenant-admin');
  const active = personas.find((p) => p.id === persona)!;

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{active.label} Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">{active.description}</p>
            </div>
            <Badge variant="outline" className="text-[10px] mt-1">Viewing as {active.label}</Badge>
          </div>

          <Tabs value={persona} onValueChange={(v) => setPersona(v as Persona)}>
            <TabsList className="h-9">
              {personas.map((p) => (
                <TabsTrigger key={p.id} value={p.id} className="text-xs px-3">
                  <p.icon className="h-3.5 w-3.5 mr-1.5" />
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {persona === 'tenant-admin' && <TenantAdminDashboard />}
          {persona === 'location-admin' && <LocationAdminDashboard />}
          {persona === 'staff' && <StaffDashboard />}
        </div>
      </main>
    </div>
  );
}
