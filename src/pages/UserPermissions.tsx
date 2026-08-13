import { useEffect, useState } from 'react';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Grid3X3, Users, BadgeCheck, Gem, CreditCard } from 'lucide-react';
import { PermissionMatrixPanel } from '@/components/settings/permissions/PermissionMatrixPanel';
import { RolesPanel } from '@/components/settings/permissions/RolesPanel';
import { UserRoleAssignmentPanel } from '@/components/settings/permissions/UserRoleAssignmentPanel';
import { PlansPanel } from '@/components/settings/permissions/PlansPanel';
import { BillingPanel } from '@/components/settings/billing/BillingPanel';
import { CheckoutPanel } from '@/components/settings/billing/CheckoutPanel';
import { UpgradeBanner } from '@/components/settings/permissions/UpgradeBanner';
import { UpgradePanel } from '@/components/settings/permissions/UpgradePanel';
import { usePlan } from '@/lib/planStore';



export default function UserPermissions() {
  const [tab, setTab] = useState('matrix');
  const { plan } = usePlan();

  // The upgrade dialog's "Compare plans" action deep-links to the plans tab.
  useEffect(() => {
    const open = () => setTab('plans');
    window.addEventListener('rai:open-plans', open);
    return () => window.removeEventListener('rai:open-plans', open);
  }, []);
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AdminSidebar />
      <main className="flex-1 p-6 space-y-4 max-w-[1600px]">
        <header className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Users &amp; Permissions</h1>
              <Badge variant="secondary" className="gap-1">
                <Gem className="h-3 w-3" /> {plan.label} plan
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Define what every role can view, create, edit, delete, approve, export, assign and
              configure across each module — then assign people to a role. Access is granted only
              where the role and the subscription plan agree.
            </p>
          </div>
        </header>

        <UpgradeBanner />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="matrix" className="gap-1.5">
              <Grid3X3 className="h-3.5 w-3.5" /> Permission matrix
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-1.5">
              <BadgeCheck className="h-3.5 w-3.5" /> Roles
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="h-3.5 w-3.5" /> User assignment
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-1.5">
              <Gem className="h-3.5 w-3.5" /> Plans &amp; entitlements
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> Billing
            </TabsTrigger>
          </TabsList>
          <TabsContent value="matrix" className="mt-4">
            <PermissionMatrixPanel />
          </TabsContent>
          <TabsContent value="roles" className="mt-4">
            <RolesPanel />
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
      <UpgradePanel />
      <CheckoutPanel />
    </div>
  );
}


