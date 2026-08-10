import { useState } from 'react';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ShieldCheck, Grid3X3, Users, BadgeCheck } from 'lucide-react';
import { PermissionMatrixPanel } from '@/components/settings/permissions/PermissionMatrixPanel';
import { RolesPanel } from '@/components/settings/permissions/RolesPanel';
import { UserRoleAssignmentPanel } from '@/components/settings/permissions/UserRoleAssignmentPanel';

export default function UserPermissions() {
  const [tab, setTab] = useState('matrix');
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AdminSidebar />
      <main className="flex-1 p-6 space-y-4 max-w-[1600px]">
        <header className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Users &amp; Permissions</h1>
            <p className="text-sm text-muted-foreground">
              Define what every role can view, create, edit, delete, approve, export, assign and
              configure across each module — then assign people to a role.
            </p>
          </div>
        </header>

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
        </Tabs>
      </main>
    </div>
  );
}
