import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Stack, IconButton, Chip } from '@mui/material';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ShieldCheck,
  Grid3X3,
  Users,
  BadgeCheck,
  Gem,
  CreditCard,
  ArrowLeft,
} from 'lucide-react';
import { PermissionMatrixPanel } from '@/components/settings/permissions/PermissionMatrixPanel';
import { RolesPanel } from '@/components/settings/permissions/RolesPanel';
import { UserRoleAssignmentPanel } from '@/components/settings/permissions/UserRoleAssignmentPanel';
import { PlansPanel } from '@/components/settings/permissions/PlansPanel';
import { BillingPanel } from '@/components/settings/billing/BillingPanel';
import { UpgradeBanner } from '@/components/settings/permissions/UpgradeBanner';
import { usePlan } from '@/lib/planStore';
import rosteredLogo from '@/assets/rostered-logo.png';

export default function UserPermissions() {
  const [tab, setTab] = useState('matrix');
  const { plan } = usePlan();
  const navigate = useNavigate();

  // The upgrade dialog's "Compare plans" action deep-links to the plans tab.
  useEffect(() => {
    const open = () => setTab('plans');
    window.addEventListener('rai:open-plans', open);
    return () => window.removeEventListener('rai:open-plans', open);
  }, []);

  return (
    <Box
      className="h-screen flex flex-col w-full max-w-full"
      sx={{ bgcolor: 'background.default' }}
    >
      {/* Header - Material style, identical to Roster module */}
      <Box
        component="header"
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
          boxShadow: 1,
        }}
      >
        {/* Top Bar - Navigation & context */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Stack direction="row" spacing={{ xs: 1, lg: 3 }} alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton size="small" onClick={() => navigate('/')} sx={{ mr: 0.5 }}>
                <ArrowLeft className="h-5 w-5" />
              </IconButton>
              <img src={rosteredLogo} alt="Rostered.ai" style={{ height: 28 }} />
            </Stack>

            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-md bg-primary/10 flex-shrink-0">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-base font-semibold tracking-tight truncate">
                Users &amp; Permissions
              </h1>
            </div>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Chip size="small" variant="outlined" color="primary" icon={<Gem size={14} />} label={`${plan.label} plan`} />
          </Stack>
        </Box>

        {/* Secondary Bar - Tabs */}
        <Box sx={{ px: 2, pb: 1, borderTop: 1, borderColor: 'divider', pt: 1 }}>
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
          </Tabs>
        </Box>
      </Box>

      {/* Scrollable content area */}
      <Box className="flex-1 overflow-auto w-full max-w-full">
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground max-w-4xl">
            Define what every role can view, manage, approve, export and configure across each
            module — then assign people to a role. Access is granted only where the role and the
            subscription plan agree.
          </p>

          <UpgradeBanner />

          <Tabs value={tab} onValueChange={setTab}>
            <TabsContent value="matrix" className="mt-0">
              <PermissionMatrixPanel />
            </TabsContent>
            <TabsContent value="roles" className="mt-0">
              <RolesPanel />
            </TabsContent>
            <TabsContent value="users" className="mt-0">
              <UserRoleAssignmentPanel />
            </TabsContent>
            <TabsContent value="plans" className="mt-0">
              <PlansPanel />
            </TabsContent>
            <TabsContent value="billing" className="mt-0">
              <BillingPanel />
            </TabsContent>
          </Tabs>
        </div>
      </Box>
    </Box>
  );
}
