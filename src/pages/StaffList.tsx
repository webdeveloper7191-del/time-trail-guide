import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Mail,
  Phone,
  MapPin,
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Download,
  Upload,
  Trash2,
  UserMinus,
  Send,
} from 'lucide-react';
import { mockStaff, departments, locations } from '@/data/mockStaffData';
import { StaffMember, employmentStatusLabels, employmentTypeLabels, EmploymentStatus, EmploymentType } from '@/types/staff';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { StaffImportModal } from '@/components/workforce/StaffImportModal';
import { StaffImportResult } from '@/lib/etl/staffETL';

export default function StaffList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmploymentStatus | 'all'>('all');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<EmploymentType | 'all'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [showImportModal, setShowImportModal] = useState(false);

  const handleImportComplete = (result: StaffImportResult) => {
    console.log('Import completed:', result);
    // In a real app, this would refresh the staff list
    toast.success(`Imported ${result.success} staff records`);
  };

  const toggleStaffSelection = (staffId: string) => {
    const newSelection = new Set(selectedStaff);
    if (newSelection.has(staffId)) {
      newSelection.delete(staffId);
    } else {
      newSelection.add(staffId);
    }
    setSelectedStaff(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedStaff.size === filteredStaff.length) {
      setSelectedStaff(new Set());
    } else {
      setSelectedStaff(new Set(filteredStaff.map(s => s.id)));
    }
  };

  const handleBulkAction = (action: string) => {
    const count = selectedStaff.size;
    switch (action) {
      case 'email':
        toast.success(`Sending email to ${count} staff members`);
        break;
      case 'deactivate':
        toast.success(`Deactivating ${count} staff members`);
        break;
      case 'export':
        toast.success(`Exporting ${count} staff records`);
        break;
      case 'delete':
        toast.error(`Deleting ${count} staff members`);
        break;
    }
    setSelectedStaff(new Set());
  };

  const filteredStaff = useMemo(() => {
    return mockStaff.filter((staff) => {
      const matchesSearch =
        searchQuery === '' ||
        `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.employeeId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || staff.status === statusFilter;
      const matchesEmploymentType =
        employmentTypeFilter === 'all' ||
        staff.currentPayCondition?.employmentType === employmentTypeFilter;
      const matchesLocation =
        locationFilter === 'all' || staff.locations.includes(locationFilter);
      const matchesDepartment =
        departmentFilter === 'all' || staff.department === departmentFilter;

      return matchesSearch && matchesStatus && matchesEmploymentType && matchesLocation && matchesDepartment;
    });
  }, [searchQuery, statusFilter, employmentTypeFilter, locationFilter, departmentFilter]);

  const stats = useMemo(() => {
    return {
      total: mockStaff.length,
      active: mockStaff.filter((s) => s.status === 'active').length,
      onboarding: mockStaff.filter((s) => s.status === 'onboarding').length,
      inactive: mockStaff.filter((s) => s.status === 'inactive' || s.status === 'terminated').length,
    };
  }, []);

  const getStatusBadgeVariant = (status: EmploymentStatus) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'onboarding':
        return 'secondary';
      case 'inactive':
        return 'outline';
      case 'terminated':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Staff Management</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your workforce, pay conditions, and award configurations
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button size="sm" className="bg-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Staff</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Onboarding</p>
                    <p className="text-2xl font-bold text-foreground">{stats.onboarding}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Inactive/Terminated</p>
                    <p className="text-2xl font-bold text-foreground">{stats.inactive}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <UserX className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[280px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or employee ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EmploymentStatus | 'all')}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={employmentTypeFilter} onValueChange={(v) => setEmploymentTypeFilter(v as EmploymentType | 'all')}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Employment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions Bar */}
          {selectedStaff.size > 0 && (
            <Card className="border-primary bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="default" className="px-3 py-1">
                      {selectedStaff.size} selected
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Select action to apply to selected staff
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleBulkAction('email')}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleBulkAction('deactivate')}>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Deactivate
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedStaff(new Set())}>
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staff Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Staff Directory
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({filteredStaff.length} of {mockStaff.length})
                  </span>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedStaff.size === filteredStaff.length && filteredStaff.length > 0}
                        onCheckedChange={toggleAllSelection}
                      />
                    </TableHead>
                    <TableHead className="w-[280px]">Employee</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Employment Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Pay Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((staff) => (
                    <TableRow
                      key={staff.id}
                      className={cn(
                        "cursor-pointer hover:bg-muted/30",
                        selectedStaff.has(staff.id) && "bg-primary/5"
                      )}
                      onClick={() => navigate(`/workforce/${staff.id}`)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedStaff.has(staff.id)}
                          onCheckedChange={() => toggleStaffSelection(staff.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={staff.avatar} alt={`${staff.firstName} ${staff.lastName}`} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(staff.firstName, staff.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {staff.firstName} {staff.lastName}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>{staff.email}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{staff.position}</p>
                          <p className="text-xs text-muted-foreground">{staff.department}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {staff.currentPayCondition
                            ? employmentTypeLabels[staff.currentPayCondition.employmentType]
                            : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{staff.locations[0]}</span>
                          {staff.locations.length > 1 && (
                            <span className="text-muted-foreground">+{staff.locations.length - 1}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {staff.currentPayCondition ? (
                          <div>
                            <p className="text-sm font-medium">
                              ${staff.currentPayCondition.hourlyRate.toFixed(2)}/hr
                            </p>
                            {staff.currentPayCondition.industryAward && (
                              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {staff.currentPayCondition.classification}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(staff.status)}>
                          {employmentStatusLabels[staff.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/workforce/${staff.id}`);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/workforce/${staff.id}?edit=true`);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                              <Phone className="h-4 w-4 mr-2" />
                              Call
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredStaff.length === 0 && (
                <div className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No staff members found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Import Modal */}
      <StaffImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
