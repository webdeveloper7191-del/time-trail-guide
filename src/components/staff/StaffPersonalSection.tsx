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
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="personal" className="data-[state=active]:bg-background">
            Personal Details
          </TabsTrigger>
          <TabsTrigger value="permissions" className="data-[state=active]:bg-background">
            Permission Levels
          </TabsTrigger>
          <TabsTrigger value="locations" className="data-[state=active]:bg-background">
            Location/Areas
          </TabsTrigger>
          <TabsTrigger value="emergency" className="data-[state=active]:bg-background">
            Emergency Contacts
          </TabsTrigger>
          <TabsTrigger value="tax" className="data-[state=active]:bg-background">
            Tax Declaration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">First Name *</Label>
                  <Input value={staff.firstName} readOnly className="bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Middle Name/s</Label>
                  <Input value={staff.middleName || ''} placeholder="Enter your middle name" readOnly className="bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Last Name *</Label>
                  <Input value={staff.lastName} readOnly className="bg-muted/30" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Preferred Name</Label>
                  <Input value={staff.preferredName || ''} readOnly className="bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={staff.email} readOnly className="bg-muted/30 pl-10" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Mobile Number *</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 border rounded-md bg-muted/30">
                      <span className="text-sm">🇦🇺</span>
                      <span className="text-sm">+61</span>
                    </div>
                    <Input value={staff.mobilePhone.replace('+61 ', '')} readOnly className="bg-muted/30 flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Work Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 border rounded-md bg-muted/30">
                      <span className="text-sm">🇦🇺</span>
                      <span className="text-sm">+61</span>
                    </div>
                    <Input value={staff.workPhone?.replace('+61 ', '') || ''} placeholder="(0X) XXXX XXXX" readOnly className="bg-muted/30 flex-1" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Gender</Label>
                  <Input value={staff.gender ? genderLabels[staff.gender] : ''} readOnly className="bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={staff.dateOfBirth ? format(new Date(staff.dateOfBirth), 'dd/MM/yyyy') : ''} 
                      readOnly 
                      className="bg-muted/30 pl-10" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Employment Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={format(new Date(staff.employmentStartDate), 'dd-MM-yyyy')} 
                      readOnly 
                      className="bg-muted/30 pl-10" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Employment End Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={staff.employmentEndDate ? format(new Date(staff.employmentEndDate), 'dd-MM-yyyy') : ''} 
                      placeholder="Employment end date"
                      readOnly 
                      className="bg-muted/30 pl-10" 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Section */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Search Your Business Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search Address" className="pl-10" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Address Line 1 *</Label>
                  <Input value={staff.address?.line1 || ''} readOnly className="bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Address Line 2</Label>
                  <Input value={staff.address?.line2 || ''} readOnly className="bg-muted/30" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Suburb *</Label>
                  <Input value={staff.address?.suburb || ''} readOnly className="bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">State *</Label>
                  <Input value={staff.address?.state || ''} readOnly className="bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Postcode *</Label>
                  <Input value={staff.address?.postcode || ''} readOnly className="bg-muted/30" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Picture */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Upload Profile Picture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={staff.avatar} />
                  <AvatarFallback className="text-xl">
                    {getInitials(staff.firstName, staff.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>5mb max</span>
                      <span>|</span>
                      <button className="text-primary hover:underline">Re Upload photo</button>
                      <span>|</span>
                      <button className="text-destructive hover:underline">Remove photo</button>
                    </div>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Select File
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Other Details */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Other Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Time Clock Passcode</Label>
                  <Input value={staff.timeClockPasscode || ''} readOnly className="bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Payroll ID</Label>
                  <Input value={staff.payrollId || ''} placeholder="Enter payroll id" readOnly className="bg-muted/30" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline">Back</Button>
            <Button className="bg-primary">Update & Next</Button>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Permission Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Permission configuration coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Location/Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {staff.locations.map((location) => (
                  <Badge key={location} variant="secondary">
                    {location}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              {staff.emergencyContacts.length > 0 ? (
                <div className="space-y-4">
                  {staff.emergencyContacts.map((contact, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                      <p className="text-sm">{contact.phone}</p>
                      {contact.email && <p className="text-sm">{contact.email}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No emergency contacts added</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Declaration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Tax declaration details coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
