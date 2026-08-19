import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Gem, Grid3X3, Search, ChevronRight, ShieldCheck, BadgeCheck, Building2, FileSignature } from 'lucide-react';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { PlansPanel } from '@/components/settings/permissions/PlansPanel';
import { PlanEntitlementMatrixPanel } from '@/components/settings/permissions/PlanEntitlementMatrixPanel';
import { RolesPanel } from '@/components/settings/permissions/RolesPanel';
import { TenantListPanel } from '@/components/settings/platform/TenantListPanel';
import { TenantAgreementsPanel } from '@/components/settings/platform/TenantAgreementsPanel';
import { PlanContractDefaultsPanel } from '@/components/settings/platform/PlanContractDefaultsPanel';

/**
 * System-admin (platform) view: what the product owner configures — the plan
 * catalogue and what each subscription tier is allowed to sell.
 * Tenant-facing role administration lives at /settings/permissions.
 */
export default function PlatformAdmin() {
  const [tab, setTab] = useState('tenants');

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AdminSidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 shrink-0 flex items-center justify-between gap-4 px-6 bg-card border-b border-border">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 h-10 rounded-lg" placeholder="Search by keywords" />
          </div>
          <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 uppercase tracking-wide text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5" /> System admin
          </Badge>
        </header>

        <main className="flex-1 overflow-auto px-6 py-5 space-y-4">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/settings" className="hover:text-foreground transition-colors">
              Settings
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">Platform Administration</span>
          </nav>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Manage Organisation</h1>
              <p className="text-sm text-muted-foreground mt-1">
                System administration — manage tenant organisations and their pricing, define subscription tiers, what each tier unlocks, and the default roles tenants start with. Tenant subscriptions and upgrades are managed in Users &amp; Permissions.
              </p>
            </div>
            <Link
              to="/settings/permissions"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
            >
              <ShieldCheck className="h-4 w-4" /> Go to Users &amp; Permissions
            </Link>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="tenants" className="gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Tenants
              </TabsTrigger>
              <TabsTrigger value="agreements" className="gap-1.5">
                <FileSignature className="h-3.5 w-3.5" /> Agreements
              </TabsTrigger>
              <TabsTrigger value="plans" className="gap-1.5">
                <Gem className="h-3.5 w-3.5" /> Plans
              </TabsTrigger>
              <TabsTrigger value="entitlements" className="gap-1.5">
                <Grid3X3 className="h-3.5 w-3.5" /> Entitlements
              </TabsTrigger>
              <TabsTrigger value="roles" className="gap-1.5">
                <BadgeCheck className="h-3.5 w-3.5" /> Roles
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tenants" className="mt-4">
              <TenantListPanel />
            </TabsContent>
            <TabsContent value="agreements" className="mt-4">
              <TenantAgreementsPanel />
            </TabsContent>
            <TabsContent value="plans" className="mt-4 space-y-4">
              <PlansPanel mode="admin" />
              <PlanContractDefaultsPanel />
            </TabsContent>
            <TabsContent value="entitlements" className="mt-4">
              <PlanEntitlementMatrixPanel />
            </TabsContent>
            <TabsContent value="roles" className="mt-4">
              <RolesPanel scope="system" />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
