import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Globe,
  MapPin,
  Plus,
  Search,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { mockStaff } from '@/data/mockStaffData';
import { employmentTypeLabels } from '@/types/staff';
import {
  permissionsStore,
  usePermissionsStore,
  type RoleAssignment,
} from '@/lib/permissionsStore';

const PAGE_SIZE = 15;
const ALL = '__all__';
const UNASSIGNED = '__unassigned__';

export function UserRoleAssignmentPanel() {
  const { roles, assignments } = usePermissionsStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>(ALL);
  const [locationFilter, setLocationFilter] = useState<string>(ALL);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [editStaffId, setEditStaffId] = useState<string | null>(null);

  const locations = useMemo(
    () => [...new Set(mockStaff.flatMap(s => s.locations ?? []))].sort(),
    [],
  );

  const roleLabel = (id: string) => roles.find(r => r.id === id)?.label ?? id;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mockStaff.filter(s => {
      const list = assignments[s.id] ?? [];
      if (
        q &&
        !`${s.firstName} ${s.lastName}`.toLowerCase().includes(q) &&
        !(s.email ?? '').toLowerCase().includes(q) &&
        !(s.position ?? '').toLowerCase().includes(q)
      )
        return false;
      if (roleFilter === UNASSIGNED && list.length) return false;
      if (roleFilter !== ALL && roleFilter !== UNASSIGNED && !list.some(a => a.roleId === roleFilter))
        return false;
      if (locationFilter !== ALL && !(s.locations ?? []).includes(locationFilter)) return false;
      return true;
    });
  }, [search, assignments, roleFilter, locationFilter]);

  useEffect(() => setPage(0), [search, roleFilter, locationFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const unassignedCount = mockStaff.filter(s => !(assignments[s.id] ?? []).length).length;
  const pageIds = rows.map(r => r.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selected.includes(id));

  const toggleRow = (id: string) =>
    setSelected(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));

  const togglePage = () =>
    setSelected(p =>
      allPageSelected ? p.filter(id => !pageIds.includes(id)) : [...new Set([...p, ...pageIds])],
    );

  const editStaff = mockStaff.find(s => s.id === editStaffId) ?? null;
  const editList = editStaffId ? assignments[editStaffId] ?? [] : [];

  const addAssignment = (staffId: string, roleId: string, locationId: string | null) => {
    const list = assignments[staffId] ?? [];
    if (list.some(a => a.roleId === roleId && a.locationId === locationId)) {
      toast.error('That role is already assigned for this scope');
      return;
    }
    permissionsStore.setStaffAssignments(staffId, [...list, { roleId, locationId }]);
    toast.success('Role added');
  };

  const removeAssignment = (staffId: string, a: RoleAssignment) => {
    permissionsStore.setStaffAssignments(
      staffId,
      (assignments[staffId] ?? []).filter(x => !(x.roleId === a.roleId && x.locationId === a.locationId)),
    );
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle className="text-base">User role assignment</CardTitle>
            <CardDescription>
              People can hold several roles — access is the union of them. Scope a role to a single
              location (e.g. Manager at Site A, Employee at Site B) or leave it global.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search people…"
                className="pl-8 w-[220px]"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[190px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All roles</SelectItem>
                <SelectItem value={UNASSIGNED}>Unassigned ({unassignedCount})</SelectItem>
                {roles.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All locations</SelectItem>
                {locations.map(l => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {unassignedCount > 0 && roleFilter !== UNASSIGNED && (
          <button
            type="button"
            onClick={() => setRoleFilter(UNASSIGNED)}
            className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground hover:bg-muted/40 w-fit"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            {unassignedCount} {unassignedCount === 1 ? 'person has' : 'people have'} no role yet —
            review
          </button>
        )}

        {selected.length > 0 && (
          <BulkBar
            count={selected.length}
            roles={roles.map(r => ({ id: r.id, label: r.label }))}
            locations={locations}
            onApply={(roleId, locationId, mode) => {
              if (mode === 'remove') permissionsStore.bulkUnassign(selected, roleId, locationId);
              else permissionsStore.bulkAssign(selected, roleId, locationId, mode);
              toast.success(
                `${mode === 'remove' ? 'Removed' : mode === 'replace' ? 'Replaced roles for' : 'Assigned to'} ${selected.length} people`,
              );
              setSelected([]);
            }}
            onClear={() => setSelected([])}
          />
        )}
      </CardHeader>

      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-y">
            <tr>
              <th className="px-4 py-2.5 w-[40px]">
                <Checkbox checked={allPageSelected} onCheckedChange={togglePage} aria-label="Select page" />
              </th>
              <th className="text-left font-medium px-4 py-2.5">Name</th>
              <th className="text-left font-medium px-4 py-2.5">Position</th>
              <th className="text-left font-medium px-4 py-2.5">Employment</th>
              <th className="text-left font-medium px-4 py-2.5">Roles &amp; scope</th>
              <th className="px-4 py-2.5 w-[90px]" />
            </tr>
          </thead>
          <tbody>
            {rows.map(s => {
              const list = assignments[s.id] ?? [];
              return (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 align-top">
                  <td className="px-4 py-2.5">
                    <Checkbox
                      checked={selected.includes(s.id)}
                      onCheckedChange={() => toggleRow(s.id)}
                      aria-label={`Select ${s.firstName}`}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium">
                      {s.firstName} {s.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{s.email}</div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{s.position}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className="text-[10px]">
                      {s.currentPayCondition
                        ? employmentTypeLabels[s.currentPayCondition.employmentType]
                        : '—'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    {list.length ? (
                      <div className="flex flex-wrap gap-1">
                        {list.map(a => (
                          <Badge
                            key={`${a.roleId}:${a.locationId ?? 'all'}`}
                            variant="secondary"
                            className="text-[10px] gap-1"
                          >
                            {a.locationId ? (
                              <MapPin className="h-2.5 w-2.5" />
                            ) : (
                              <Globe className="h-2.5 w-2.5" />
                            )}
                            {roleLabel(a.roleId)}
                            {a.locationId ? ` · ${a.locationId}` : ''}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-[10px] gap-1 text-amber-700 border-amber-300">
                        <AlertTriangle className="h-2.5 w-2.5" /> Unassigned
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button variant="outline" size="sm" onClick={() => setEditStaffId(s.id)}>
                      <UserCog className="h-3.5 w-3.5 mr-1.5" /> Manage
                    </Button>
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No people match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-muted-foreground">
          <span>
            {filtered.length ? page * PAGE_SIZE + 1 : 0}–
            {Math.min(filtered.length, (page + 1) * PAGE_SIZE)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>
              Page {page + 1} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pageCount - 1}
              onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      <Sheet open={!!editStaff} onOpenChange={v => !v && setEditStaffId(null)}>
        <SheetContent side="right" className="w-[440px] sm:max-w-[440px]">
          {editStaff && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {editStaff.firstName} {editStaff.lastName}
                </SheetTitle>
                <SheetDescription>
                  Roles apply together — the person gets the union of every grant below.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  {editList.length ? (
                    editList.map(a => (
                      <div
                        key={`${a.roleId}:${a.locationId ?? 'all'}`}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <div>
                          <div className="text-sm font-medium">{roleLabel(a.roleId)}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            {a.locationId ? (
                              <>
                                <MapPin className="h-3 w-3" /> {a.locationId}
                              </>
                            ) : (
                              <>
                                <Globe className="h-3 w-3" /> All locations
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAssignment(editStaff.id, a)}
                          aria-label="Remove role"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No roles yet — this person has no access.
                    </p>
                  )}
                </div>
                <AddAssignmentForm
                  roles={roles.map(r => ({ id: r.id, label: r.label }))}
                  locations={editStaff.locations?.length ? editStaff.locations : locations}
                  onAdd={(roleId, locationId) => addAssignment(editStaff.id, roleId, locationId)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}

function AddAssignmentForm({
  roles,
  locations,
  onAdd,
}: {
  roles: { id: string; label: string }[];
  locations: string[];
  onAdd: (roleId: string, locationId: string | null) => void;
}) {
  const [roleId, setRoleId] = useState(roles[0]?.id ?? '');
  const [locationId, setLocationId] = useState(ALL);
  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Add a role
      </div>
      <Select value={roleId} onValueChange={setRoleId}>
        <SelectTrigger>
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          {roles.map(r => (
            <SelectItem key={r.id} value={r.id}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={locationId} onValueChange={setLocationId}>
        <SelectTrigger>
          <SelectValue placeholder="Scope" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All locations</SelectItem>
          {locations.map(l => (
            <SelectItem key={l} value={l}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        className="w-full"
        size="sm"
        disabled={!roleId}
        onClick={() => onAdd(roleId, locationId === ALL ? null : locationId)}
      >
        <Plus className="h-4 w-4 mr-1.5" /> Add role
      </Button>
    </div>
  );
}

function BulkBar({
  count,
  roles,
  locations,
  onApply,
  onClear,
}: {
  count: number;
  roles: { id: string; label: string }[];
  locations: string[];
  onApply: (roleId: string, locationId: string | null, mode: 'add' | 'replace' | 'remove') => void;
  onClear: () => void;
}) {
  const [roleId, setRoleId] = useState(roles[0]?.id ?? '');
  const [locationId, setLocationId] = useState(ALL);
  const [open, setOpen] = useState(false);
  const scope = locationId === ALL ? null : locationId;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
      <Badge variant="secondary" className="gap-1">
        <Users className="h-3.5 w-3.5" /> {count} selected
      </Badge>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline">
            Bulk assign role
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 bg-popover z-50 space-y-3">
          <Select value={roleId} onValueChange={setRoleId}>
            <SelectTrigger>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger>
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All locations</SelectItem>
              {locations.map(l => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid gap-1.5">
            <Button size="sm" onClick={() => { onApply(roleId, scope, 'add'); setOpen(false); }}>
              Add role
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { onApply(roleId, scope, 'replace'); setOpen(false); }}
            >
              Replace all roles with this
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => { onApply(roleId, scope, 'remove'); setOpen(false); }}
            >
              Remove this role
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <Button size="sm" variant="ghost" onClick={onClear}>
        Clear selection
      </Button>
    </div>
  );
}
