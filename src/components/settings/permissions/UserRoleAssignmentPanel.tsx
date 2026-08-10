import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { mockStaff } from '@/data/mockStaffData';
import { permissionsStore, usePermissionsStore } from '@/lib/permissionsStore';

export function UserRoleAssignmentPanel() {
  const { roles, assignments } = usePermissionsStore();
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mockStaff.filter(
      s =>
        !q ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        (s.email ?? '').toLowerCase().includes(q) ||
        (s.position ?? '').toLowerCase().includes(q),
    );
  }, [search]);

  const setRole = (staffId: string, roleId: string) => {
    permissionsStore.saveAssignments({ ...assignments, [staffId]: roleId });
    toast.success('Role updated');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-end justify-between space-y-0">
        <div>
          <CardTitle className="text-base">User role assignment</CardTitle>
          <CardDescription>
            Give each person one role. Their access is the role's matrix, scoped to the locations
            they are assigned to.
          </CardDescription>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search people…"
            className="pl-8 w-[240px]"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-y">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Name</th>
              <th className="text-left font-medium px-4 py-2.5">Position</th>
              <th className="text-left font-medium px-4 py-2.5">Employment</th>
              <th className="text-left font-medium px-4 py-2.5 w-[260px]">Access role</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(s => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-4 py-2.5">
                  <div className="font-medium">
                    {s.firstName} {s.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.email}</div>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{s.position}</td>
                <td className="px-4 py-2.5">
                  <Badge variant="outline" className="text-[10px]">
                    {s.employmentType ?? '—'}
                  </Badge>
                </td>
                <td className="px-4 py-2.5">
                  <Select
                    value={assignments[s.id] ?? 'employee'}
                    onValueChange={v => setRole(s.id, v)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
