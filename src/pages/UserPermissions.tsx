import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Grid3X3,
  Users,
  BadgeCheck,
  Gem,
  CreditCard,
  Search,
  ChevronRight,
} from 'lucide-react';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { PermissionMatrixPanel } from '@/components/settings/permissions/PermissionMatrixPanel';
import { RolesPanel } from '@/components/settings/permissions/RolesPanel';
import { UserRoleAssignmentPanel } from '@/components/settings/permissions/UserRoleAssignmentPanel';
import { PlansPanel } from '@/components/settings/permissions/PlansPanel';
import { BillingPanel } from '@/components/settings/billing/BillingPanel';
import { UpgradeBanner } from '@/components/settings/permissions/UpgradeBanner';
import { usePlan } from '@/lib/planStore';

export default function UserPermissions() {
  const routeState = useLocation().state as { tab?: string } | null;
  const [tab, setTab] = useState(routeState?.tab ?? 'roles');
  const { plan } = usePlan();

  // Plan comparison + upgrade live with the tenant.
  useEffect(() => {
    const open = () => setTab('plans');
    window.addEventListener('rai:open-plans', open);
    return () => window.removeEventListener('rai:open-plans', open);
  }, []);


  return (
    <div className="min-h-screen flex w-full bg-background">
      <AdminSidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top utility bar */}
        <header className="h-16 shrink-0 flex items-center justify-between gap-4 px-6 bg-card border-b border-border">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 h-10 rounded-lg" placeholder="Search by keywords" />
          </div>
          <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 uppercase tracking-wide text-[11px]">
            <Gem className="h-3.5 w-3.5" /> {plan.label} plan
          </Badge>
        </header>

        <main className="flex-1 overflow-auto px-6 py-5 space-y-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/settings" className="hover:text-foreground transition-colors">
              Settings
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">Manage Permissions</span>
          </nav>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">General Permissions &amp; Roles</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage the roles, permissions and user access for your organisation.
              </p>
            </div>
            <Link
              to="/admin/platform"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
            >
              <Gem className="h-4 w-4" /> Plan catalogue &amp; default roles (system admin)
            </Link>
          </div>

          <UpgradeBanner />

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="roles" className="gap-1.5">
                <BadgeCheck className="h-3.5 w-3.5" /> Roles
              </TabsTrigger>
              <TabsTrigger value="matrix" className="gap-1.5">
                <Grid3X3 className="h-3.5 w-3.5" /> Permission matrix
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-1.5">
                <Users className="h-3.5 w-3.5" /> User assignment
              </TabsTrigger>
              <TabsTrigger value="plans" className="gap-1.5">
                <Gem className="h-3.5 w-3.5" /> Plan &amp; upgrade
              </TabsTrigger>
              <TabsTrigger value="billing" className="gap-1.5">
                <CreditCard className="h-3.5 w-3.5" /> Billing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="roles" className="mt-4">
              <RolesPanel />
            </TabsContent>
            <TabsContent value="matrix" className="mt-4">
              <PermissionMatrixPanel />
            </TabsContent>
            <TabsContent value="users" className="mt-4">
              <UserRoleAssignmentPanel />
            </TabsContent>
            <TabsContent value="plans" className="mt-4">
              <PlansPanel />
            </TabsContent>
            <TabsContent value="billing" className="mt-4">
              <BillingPanel />
            </TabsContent>
          </Tabs>

        </main>
      </div>
    </div>
  );
}
