import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { X, Plus, Trash2, Save, Users, Briefcase, GripVertical } from 'lucide-react';
import { AgreementType, agreementTypeLabels, MultiAwardEmployee } from '@/types/enterpriseAgreement';

// Extended type for display
export interface MultiAwardEmployeeDisplay extends MultiAwardEmployee {
  name: string;
  role: string;
  email: string;
  location: string;
}

// Mock available staff for selection
const mockAvailableStaff = [
  { id: 'staff-new-1', name: 'Emma Wilson', role: 'Educator', email: 'emma.wilson@example.com', location: 'Brisbane' },
  { id: 'staff-new-2', name: 'James Chen', role: 'Lead Educator', email: 'james.chen@example.com', location: 'Sydney' },
  { id: 'staff-new-3', name: 'Sophie Brown', role: 'Room Leader', email: 'sophie.brown@example.com', location: 'Melbourne' },
  { id: 'staff-new-4', name: 'Oliver Taylor', role: 'Assistant Educator', email: 'oliver.taylor@example.com', location: 'Perth' },
  { id: 'staff-new-5', name: 'Mia Anderson', role: 'Director', email: 'mia.anderson@example.com', location: 'Adelaide' },
];

// Mock agreements for selection
const mockAgreements = [
  { id: 'eba-1', name: 'ABC Childcare Enterprise Agreement 2024', type: 'enterprise_agreement' as AgreementType },
  { id: 'eba-2', name: 'XYZ Early Learning EBA 2023', type: 'enterprise_agreement' as AgreementType },
  { id: 'award-1', name: "Children's Services Award 2020", type: 'modern_award' as AgreementType },
  { id: 'award-2', name: 'Educational Services Award 2020', type: 'modern_award' as AgreementType },
];

// Mock classifications
const mockClassifications = [
  { id: 'class-1', name: 'Level 3.1 - Certificate III', agreementId: 'eba-1' },
  { id: 'class-2', name: 'Level 4.1 - Diploma Qualified', agreementId: 'eba-1' },
  { id: 'class-3', name: 'Level 5.1 - ECT', agreementId: 'eba-1' },
  { id: 'class-4', name: 'CS Level 3.1', agreementId: 'award-1' },
  { id: 'class-5', name: 'CS Level 4.1', agreementId: 'award-1' },
];

// Mock applicable conditions
const conditionOptions = [
  'Overtime provisions',
  'Penalty rates',
  'Leave entitlements',
  'Allowances',
  'Shift loading',
  'Public holiday rates',
  'Redundancy provisions',
];

interface AddEmployeeDrawerProps {
  open: boolean;
  onClose: () => void;
  onAdd: (employee: MultiAwardEmployeeDisplay) => void;
  existingEmployeeIds: string[];
}

export function AddEmployeeDrawer({ open, onClose, onAdd, existingEmployeeIds }: AddEmployeeDrawerProps) {
  const [selectedStaff, setSelectedStaff] = useState<typeof mockAvailableStaff[0] | null>(null);
  const [primaryAgreementId, setPrimaryAgreementId] = useState('');
  const [primaryAgreementType, setPrimaryAgreementType] = useState<AgreementType>('enterprise_agreement');
  const [primaryClassificationId, setPrimaryClassificationId] = useState('');
  const [additionalAgreements, setAdditionalAgreements] = useState<{
    agreementId: string;
    agreementType: AgreementType;
    applicableConditions: string[];
    priority: number;
  }[]>([]);
  const [notes, setNotes] = useState('');

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setSelectedStaff(null);
      setPrimaryAgreementId('');
      setPrimaryAgreementType('enterprise_agreement');
      setPrimaryClassificationId('');
      setAdditionalAgreements([]);
      setNotes('');
    }
  }, [open]);

  const availableStaff = mockAvailableStaff.filter(s => !existingEmployeeIds.includes(s.id));

  const addAdditionalAgreement = () => {
    setAdditionalAgreements(prev => [
      ...prev,
      {
        agreementId: '',
        agreementType: 'enterprise_agreement',
        applicableConditions: [],
        priority: prev.length + 1,
      },
    ]);
  };

  const updateAdditionalAgreement = (index: number, updates: Partial<typeof additionalAgreements[0]>) => {
    setAdditionalAgreements(prev => 
      prev.map((a, i) => i === index ? { ...a, ...updates } : a)
    );
  };

  const removeAdditionalAgreement = (index: number) => {
    setAdditionalAgreements(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!selectedStaff) {
      toast.error('Please select an employee');
      return;
    }
    if (!primaryAgreementId) {
      toast.error('Please select a primary agreement');
      return;
    }
    if (!primaryClassificationId) {
      toast.error('Please select a classification');
      return;
    }

    const primaryClassification = mockClassifications.find(c => c.id === primaryClassificationId);
    
    const newEmployee: MultiAwardEmployeeDisplay = {
      staffId: selectedStaff.id,
      name: selectedStaff.name,
      role: selectedStaff.role,
      email: selectedStaff.email,
      location: selectedStaff.location,
      primaryAgreementId,
      primaryAgreementType,
      additionalAgreements: additionalAgreements.filter(a => a.agreementId),
      classifications: [
        {
          agreementId: primaryAgreementId,
          classificationId: primaryClassificationId,
          classificationName: primaryClassification?.name || '',
          effectiveFrom: new Date().toISOString(),
        },
      ],
      notes,
      updatedAt: new Date().toISOString(),
      updatedBy: 'current-user',
    };

    onAdd(newEmployee);
    toast.success(`${selectedStaff.name} added to multi-award configuration`);
    onClose();
  };

  const primaryClassifications = mockClassifications.filter(c => 
    c.agreementId === primaryAgreementId || !primaryAgreementId
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Add Multi-Award Employee</SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription>
            Configure an employee covered by multiple awards or agreements
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        <div className="space-y-6">
          {/* Employee Selection */}
          <div className="space-y-2">
            <Label>Select Employee</Label>
            <Select
              value={selectedStaff?.id || ''}
              onValueChange={(value) => {
                const staff = availableStaff.find(s => s.id === value);
                setSelectedStaff(staff || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an employee..." />
              </SelectTrigger>
              <SelectContent>
                {availableStaff.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    No available employees
                  </div>
                ) : (
                  availableStaff.map(staff => (
                    <SelectItem key={staff.id} value={staff.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{staff.name}</span>
                        <span className="text-muted-foreground">- {staff.role}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedStaff && (
              <Card className="mt-2">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedStaff.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedStaff.role} • {selectedStaff.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Primary Agreement */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Primary Agreement</Label>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Agreement Type</Label>
                <Select
                  value={primaryAgreementType}
                  onValueChange={(value) => setPrimaryAgreementType(value as AgreementType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enterprise_agreement">Enterprise Agreement</SelectItem>
                    <SelectItem value="modern_award">Modern Award</SelectItem>
                    <SelectItem value="individual_flexibility">Individual Flexibility</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Agreement</Label>
                <Select
                  value={primaryAgreementId}
                  onValueChange={(value) => {
                    setPrimaryAgreementId(value);
                    setPrimaryClassificationId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agreement..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockAgreements
                      .filter(a => a.type === primaryAgreementType)
                      .map(agreement => (
                        <SelectItem key={agreement.id} value={agreement.id}>
                          {agreement.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Classification</Label>
              <Select
                value={primaryClassificationId}
                onValueChange={setPrimaryClassificationId}
                disabled={!primaryAgreementId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={primaryAgreementId ? "Select classification..." : "Select an agreement first"} />
                </SelectTrigger>
                <SelectContent>
                  {primaryClassifications.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Agreements */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Additional Agreements</Label>
              <Button variant="outline" size="sm" onClick={addAdditionalAgreement}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {additionalAgreements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No additional agreements configured
              </p>
            ) : (
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-3">
                  {additionalAgreements.map((agreement, index) => (
                    <Card key={index}>
                      <CardContent className="p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="outline">Priority {agreement.priority}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAdditionalAgreement(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={agreement.agreementType}
                            onValueChange={(value) => 
                              updateAdditionalAgreement(index, { 
                                agreementType: value as AgreementType,
                                agreementId: '' 
                              })
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="enterprise_agreement">Enterprise Agreement</SelectItem>
                              <SelectItem value="modern_award">Modern Award</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select
                            value={agreement.agreementId}
                            onValueChange={(value) => 
                              updateAdditionalAgreement(index, { agreementId: value })
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {mockAgreements
                                .filter(a => a.type === agreement.agreementType && a.id !== primaryAgreementId)
                                .map(a => (
                                  <SelectItem key={a.id} value={a.id}>
                                    {a.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Applicable Conditions</Label>
                          <div className="flex flex-wrap gap-1">
                            {conditionOptions.map(condition => (
                              <Badge
                                key={condition}
                                variant={agreement.applicableConditions.includes(condition) ? 'default' : 'outline'}
                                className="cursor-pointer text-xs"
                                onClick={() => {
                                  const conditions = agreement.applicableConditions.includes(condition)
                                    ? agreement.applicableConditions.filter(c => c !== condition)
                                    : [...agreement.applicableConditions, condition];
                                  updateAdditionalAgreement(index, { applicableConditions: conditions });
                                }}
                              >
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input
              placeholder="Add any notes about this configuration..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <SheetFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

interface EditEmployeeDrawerProps {
  open: boolean;
  onClose: () => void;
  employee: MultiAwardEmployeeDisplay | null;
  onSave: (employee: MultiAwardEmployeeDisplay) => void;
}

export function EditEmployeeDrawer({ open, onClose, employee, onSave }: EditEmployeeDrawerProps) {
  const [primaryAgreementId, setPrimaryAgreementId] = useState('');
  const [primaryAgreementType, setPrimaryAgreementType] = useState<AgreementType>('enterprise_agreement');
  const [primaryClassificationId, setPrimaryClassificationId] = useState('');
  const [additionalAgreements, setAdditionalAgreements] = useState<{
    agreementId: string;
    agreementType: AgreementType;
    applicableConditions: string[];
    priority: number;
  }[]>([]);
  const [notes, setNotes] = useState('');

  // Load data when employee changes
  useEffect(() => {
    if (employee && open) {
      setPrimaryAgreementId(employee.primaryAgreementId);
      setPrimaryAgreementType(employee.primaryAgreementType);
      setPrimaryClassificationId(employee.classifications[0]?.classificationId || '');
      setAdditionalAgreements(employee.additionalAgreements);
      setNotes(employee.notes || '');
    }
  }, [employee, open]);

  const addAdditionalAgreement = () => {
    setAdditionalAgreements(prev => [
      ...prev,
      {
        agreementId: '',
        agreementType: 'enterprise_agreement',
        applicableConditions: [],
        priority: prev.length + 1,
      },
    ]);
  };

  const updateAdditionalAgreement = (index: number, updates: Partial<typeof additionalAgreements[0]>) => {
    setAdditionalAgreements(prev => 
      prev.map((a, i) => i === index ? { ...a, ...updates } : a)
    );
  };

  const removeAdditionalAgreement = (index: number) => {
    setAdditionalAgreements(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!employee) return;
    if (!primaryAgreementId) {
      toast.error('Please select a primary agreement');
      return;
    }
    if (!primaryClassificationId) {
      toast.error('Please select a classification');
      return;
    }

    const primaryClassification = mockClassifications.find(c => c.id === primaryClassificationId);
    
    const updatedEmployee: MultiAwardEmployeeDisplay = {
      ...employee,
      primaryAgreementId,
      primaryAgreementType,
      additionalAgreements: additionalAgreements.filter(a => a.agreementId),
      classifications: [
        {
          agreementId: primaryAgreementId,
          classificationId: primaryClassificationId,
          classificationName: primaryClassification?.name || employee.classifications[0]?.classificationName || '',
          effectiveFrom: employee.classifications[0]?.effectiveFrom || new Date().toISOString(),
        },
      ],
      notes,
      updatedAt: new Date().toISOString(),
      updatedBy: 'current-user',
    };

    onSave(updatedEmployee);
    toast.success('Employee configuration updated');
    onClose();
  };

  const primaryClassifications = mockClassifications.filter(c => 
    c.agreementId === primaryAgreementId || !primaryAgreementId
  );

  if (!employee) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Edit Configuration</SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription>
            Update award/agreement configuration for {employee.name}
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        {/* Employee Info Card */}
        <Card className="mb-6">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{employee.name}</p>
                <p className="text-sm text-muted-foreground">{employee.role} • {employee.location}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Primary Agreement */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Primary Agreement</Label>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Agreement Type</Label>
                <Select
                  value={primaryAgreementType}
                  onValueChange={(value) => setPrimaryAgreementType(value as AgreementType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enterprise_agreement">Enterprise Agreement</SelectItem>
                    <SelectItem value="modern_award">Modern Award</SelectItem>
                    <SelectItem value="individual_flexibility">Individual Flexibility</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Agreement</Label>
                <Select
                  value={primaryAgreementId}
                  onValueChange={(value) => {
                    setPrimaryAgreementId(value);
                    setPrimaryClassificationId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agreement..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockAgreements
                      .filter(a => a.type === primaryAgreementType)
                      .map(agreement => (
                        <SelectItem key={agreement.id} value={agreement.id}>
                          {agreement.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Classification</Label>
              <Select
                value={primaryClassificationId}
                onValueChange={setPrimaryClassificationId}
                disabled={!primaryAgreementId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={primaryAgreementId ? "Select classification..." : "Select an agreement first"} />
                </SelectTrigger>
                <SelectContent>
                  {primaryClassifications.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Agreements */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Additional Agreements</Label>
              <Button variant="outline" size="sm" onClick={addAdditionalAgreement}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {additionalAgreements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No additional agreements configured
              </p>
            ) : (
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-3">
                  {additionalAgreements.map((agreement, index) => (
                    <Card key={index}>
                      <CardContent className="p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="outline">Priority {agreement.priority}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeAdditionalAgreement(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={agreement.agreementType}
                            onValueChange={(value) => 
                              updateAdditionalAgreement(index, { 
                                agreementType: value as AgreementType,
                                agreementId: '' 
                              })
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="enterprise_agreement">Enterprise Agreement</SelectItem>
                              <SelectItem value="modern_award">Modern Award</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select
                            value={agreement.agreementId}
                            onValueChange={(value) => 
                              updateAdditionalAgreement(index, { agreementId: value })
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {mockAgreements
                                .filter(a => a.type === agreement.agreementType && a.id !== primaryAgreementId)
                                .map(a => (
                                  <SelectItem key={a.id} value={a.id}>
                                    {a.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Applicable Conditions</Label>
                          <div className="flex flex-wrap gap-1">
                            {conditionOptions.map(condition => (
                              <Badge
                                key={condition}
                                variant={agreement.applicableConditions.includes(condition) ? 'default' : 'outline'}
                                className="cursor-pointer text-xs"
                                onClick={() => {
                                  const conditions = agreement.applicableConditions.includes(condition)
                                    ? agreement.applicableConditions.filter(c => c !== condition)
                                    : [...agreement.applicableConditions, condition];
                                  updateAdditionalAgreement(index, { applicableConditions: conditions });
                                }}
                              >
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input
              placeholder="Add any notes about this configuration..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <SheetFooter className="mt-6 gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
