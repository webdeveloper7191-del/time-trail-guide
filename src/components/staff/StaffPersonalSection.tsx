import { StaffMember, genderLabels } from '@/types/staff';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Upload, Trash2, Mail, Phone, MapPin, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface StaffPersonalSectionProps {
  staff: StaffMember;
}

export function StaffPersonalSection({ staff }: StaffPersonalSectionProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="bg-muted/30 p-1 h-auto rounded-lg border border-border/50">
          <TabsTrigger value="personal" className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium">
            Personal Details
          </TabsTrigger>
          <TabsTrigger value="permissions" className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium">
            Permission Levels
          </TabsTrigger>
          <TabsTrigger value="locations" className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium">
            Location/Areas
          </TabsTrigger>
          <TabsTrigger value="emergency" className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium">
            Emergency Contacts
          </TabsTrigger>
          <TabsTrigger value="tax" className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm font-medium">
            Tax Declaration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6 space-y-5">
          <div className="card-material-elevated p-6">
            <h3 className="section-header mb-5">Personal Details</h3>
            <div className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">First Name *</Label>
                  <Input value={staff.firstName} readOnly className="bg-muted/20 border-border/50 h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Middle Name/s</Label>
                  <Input value={staff.middleName || ''} placeholder="Enter your middle name" readOnly className="bg-muted/20 border-border/50 h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Name *</Label>
                  <Input value={staff.lastName} readOnly className="bg-muted/20 border-border/50 h-10" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preferred Name</Label>
                  <Input value={staff.preferredName || ''} readOnly className="bg-muted/20 border-border/50 h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={staff.email} readOnly className="bg-muted/20 border-border/50 pl-10 h-10" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mobile Number *</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 border border-border/50 rounded-md bg-muted/20 h-10">
                      <span className="text-sm">🇦🇺</span>
                      <span className="text-sm font-medium">+61</span>
                    </div>
                    <Input value={staff.mobilePhone.replace('+61 ', '')} readOnly className="bg-muted/20 border-border/50 flex-1 h-10" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Work Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 border border-border/50 rounded-md bg-muted/20 h-10">
                      <span className="text-sm">🇦🇺</span>
                      <span className="text-sm font-medium">+61</span>
                    </div>
                    <Input value={staff.workPhone?.replace('+61 ', '') || ''} placeholder="(0X) XXXX XXXX" readOnly className="bg-muted/20 border-border/50 flex-1 h-10" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gender</Label>
                  <Input value={staff.gender ? genderLabels[staff.gender] : ''} readOnly className="bg-muted/20 border-border/50 h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={staff.dateOfBirth ? format(new Date(staff.dateOfBirth), 'dd/MM/yyyy') : ''} 
                      readOnly 
                      className="bg-muted/20 border-border/50 pl-10 h-10" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Employment Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={format(new Date(staff.employmentStartDate), 'dd-MM-yyyy')} 
                      readOnly 
                      className="bg-muted/20 border-border/50 pl-10 h-10" 
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Employment End Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={staff.employmentEndDate ? format(new Date(staff.employmentEndDate), 'dd-MM-yyyy') : ''} 
                      placeholder="Employment end date"
                      readOnly 
                      className="bg-muted/20 border-border/50 pl-10 h-10" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="card-material-elevated p-6">
            <h3 className="section-header mb-5">Address</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Search Your Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search Address" className="pl-10 h-10 border-border/50" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Address Line 1 *</Label>
                  <Input value={staff.address?.line1 || ''} readOnly className="bg-muted/20 border-border/50 h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Address Line 2</Label>
                  <Input value={staff.address?.line2 || ''} readOnly className="bg-muted/20 border-border/50 h-10" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Suburb *</Label>
                  <Input value={staff.address?.suburb || ''} readOnly className="bg-muted/20 border-border/50 h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">State *</Label>
                  <Input value={staff.address?.state || ''} readOnly className="bg-muted/20 border-border/50 h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Postcode *</Label>
                  <Input value={staff.address?.postcode || ''} readOnly className="bg-muted/20 border-border/50 h-10" />
                </div>
              </div>
            </div>
          </div>

          {/* Profile Picture */}
          <div className="card-material-elevated p-6">
            <h3 className="section-header mb-5">Upload Profile Picture</h3>
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 ring-4 ring-muted/50">
                <AvatarImage src={staff.avatar} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold">
                  {getInitials(staff.firstName, staff.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 border-2 border-dashed border-border rounded-lg p-6 bg-muted/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>5mb max</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                    <button className="text-primary hover:underline font-medium">Re Upload photo</button>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                    <button className="text-destructive hover:underline font-medium">Remove photo</button>
                  </div>
                  <Button variant="outline" size="sm" className="shadow-sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Select File
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Other Details */}
          <div className="card-material-elevated p-6">
            <h3 className="section-header mb-5">Other Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Time Clock Passcode</Label>
                <Input value={staff.timeClockPasscode || ''} readOnly className="bg-muted/20 border-border/50 h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payroll ID</Label>
                <Input value={staff.payrollId || ''} placeholder="Enter payroll id" readOnly className="bg-muted/20 border-border/50 h-10" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" className="shadow-sm">Back</Button>
            <Button className="shadow-md">Update & Next</Button>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <div className="card-material-elevated p-6">
            <h3 className="section-header mb-4">Permission Levels</h3>
            <p className="text-muted-foreground">Permission configuration coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="locations" className="mt-6">
          <div className="card-material-elevated p-6">
            <h3 className="section-header mb-4">Location/Areas</h3>
            <div className="flex flex-wrap gap-2">
              {staff.locations.map((location) => (
                <Badge key={location} variant="secondary" className="px-3 py-1.5 font-medium">
                  {location}
                </Badge>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="emergency" className="mt-6">
          <div className="card-material-elevated p-6">
            <h3 className="section-header mb-4">Emergency Contacts</h3>
            {staff.emergencyContacts.length > 0 ? (
              <div className="space-y-3">
                {staff.emergencyContacts.map((contact, index) => (
                  <div key={index} className="p-4 rounded-lg bg-muted/20 border border-border/50">
                    <p className="font-semibold">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                    <p className="text-sm mt-1">{contact.phone}</p>
                    {contact.email && <p className="text-sm text-muted-foreground">{contact.email}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No emergency contacts added</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tax" className="mt-6">
          <div className="card-material-elevated p-6">
            <h3 className="section-header mb-4">Tax Declaration</h3>
            <p className="text-muted-foreground">Tax declaration details coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
