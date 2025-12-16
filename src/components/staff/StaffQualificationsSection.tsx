import { useState } from 'react';
import { StaffMember } from '@/types/staff';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Award,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Calendar,
  Upload,
  Edit,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { format, differenceInDays, isBefore, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { AddQualificationSheet } from './AddQualificationSheet';

export interface Qualification {
  id: string;
  name: string;
  type: 'certification' | 'license' | 'training' | 'degree' | 'other';
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  documentUrl?: string;
  status: 'active' | 'expired' | 'expiring_soon' | 'pending_verification';
  isRequired: boolean;
  notes?: string;
}

// Mock qualifications data
const mockQualifications: Qualification[] = [
  {
    id: 'qual-1',
    name: 'Working with Children Check',
    type: 'license',
    issuer: 'Victorian Government',
    issueDate: '2023-06-15',
    expiryDate: '2028-06-15',
    status: 'active',
    isRequired: true,
  },
  {
    id: 'qual-2',
    name: 'First Aid Certificate',
    type: 'certification',
    issuer: 'St John Ambulance',
    issueDate: '2024-01-20',
    expiryDate: '2025-01-20',
    status: 'expiring_soon',
    isRequired: true,
  },
  {
    id: 'qual-3',
    name: 'Certificate III in Early Childhood Education',
    type: 'certification',
    issuer: 'TAFE Victoria',
    issueDate: '2022-11-01',
    status: 'active',
    isRequired: true,
  },
  {
    id: 'qual-4',
    name: 'Food Safety Certificate',
    type: 'certification',
    issuer: 'Australian Institute of Food Safety',
    issueDate: '2023-03-10',
    expiryDate: '2024-03-10',
    status: 'expired',
    isRequired: false,
  },
  {
    id: 'qual-5',
    name: 'Anaphylaxis Management Training',
    type: 'training',
    issuer: 'ASCIA',
    issueDate: '2024-02-15',
    expiryDate: '2025-02-15',
    status: 'active',
    isRequired: true,
  },
];

interface StaffQualificationsSectionProps {
  staff: StaffMember;
}

export function StaffQualificationsSection({ staff }: StaffQualificationsSectionProps) {
  const [qualifications, setQualifications] = useState<Qualification[]>(mockQualifications);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editingQualification, setEditingQualification] = useState<Qualification | null>(null);

  const getStatusBadge = (qual: Qualification) => {
    const now = new Date();
    if (qual.expiryDate) {
      const expiry = new Date(qual.expiryDate);
      const daysUntilExpiry = differenceInDays(expiry, now);
      
      if (isBefore(expiry, now)) {
        return <Badge variant="destructive">Expired</Badge>;
      }
      if (daysUntilExpiry <= 30) {
        return <Badge className="bg-amber-500 hover:bg-amber-600">Expiring Soon</Badge>;
      }
    }
    
    if (qual.status === 'pending_verification') {
      return <Badge variant="secondary">Pending Verification</Badge>;
    }
    
    return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
  };

  const getTypeIcon = (type: Qualification['type']) => {
    switch (type) {
      case 'certification': return <Award className="h-4 w-4" />;
      case 'license': return <FileText className="h-4 w-4" />;
      case 'training': return <CheckCircle2 className="h-4 w-4" />;
      case 'degree': return <Award className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getExpiryProgress = (qual: Qualification) => {
    if (!qual.expiryDate) return null;
    
    const now = new Date();
    const issue = new Date(qual.issueDate);
    const expiry = new Date(qual.expiryDate);
    
    const totalDays = differenceInDays(expiry, issue);
    const daysRemaining = differenceInDays(expiry, now);
    const percentRemaining = Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100));
    
    return {
      daysRemaining,
      percentRemaining,
      isExpired: daysRemaining < 0,
      isExpiringSoon: daysRemaining <= 30 && daysRemaining > 0,
    };
  };

  // Calculate compliance stats
  const activeCount = qualifications.filter(q => q.status === 'active').length;
  const expiringSoonCount = qualifications.filter(q => {
    if (!q.expiryDate) return false;
    const days = differenceInDays(new Date(q.expiryDate), new Date());
    return days > 0 && days <= 30;
  }).length;
  const expiredCount = qualifications.filter(q => {
    if (!q.expiryDate) return false;
    return isBefore(new Date(q.expiryDate), new Date());
  }).length;
  const requiredMissing = qualifications.filter(q => q.isRequired && (q.status === 'expired' || q.status === 'pending_verification')).length;

  const complianceScore = qualifications.length > 0 
    ? Math.round(((activeCount + expiringSoonCount) / qualifications.length) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Qualifications & Certifications</h2>
        <Button onClick={() => setAddSheetOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Qualification
        </Button>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                complianceScore >= 80 ? "bg-green-100 text-green-700" : 
                complianceScore >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
              )}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Compliance Score</p>
                <p className="text-2xl font-bold">{complianceScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-700">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold">{expiringSoonCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 text-red-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold">{expiredCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for missing required qualifications */}
      {requiredMissing > 0 && (
        <Card className="border-red-500/50 bg-red-500/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-700">
                  {requiredMissing} Required Qualification{requiredMissing > 1 ? 's' : ''} Need Attention
                </p>
                <p className="text-sm text-red-600">
                  Please renew or verify expired/pending qualifications to maintain compliance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Qualifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">All Qualifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {qualifications.map((qual) => {
            const expiryInfo = getExpiryProgress(qual);
            
            return (
              <div
                key={qual.id}
                className={cn(
                  "p-4 rounded-lg border transition-colors",
                  expiryInfo?.isExpired && "border-red-300 bg-red-50/50",
                  expiryInfo?.isExpiringSoon && "border-amber-300 bg-amber-50/50",
                  !expiryInfo?.isExpired && !expiryInfo?.isExpiringSoon && "bg-muted/30"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      expiryInfo?.isExpired ? "bg-red-100 text-red-700" :
                      expiryInfo?.isExpiringSoon ? "bg-amber-100 text-amber-700" :
                      "bg-primary/10 text-primary"
                    )}>
                      {getTypeIcon(qual.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{qual.name}</h4>
                        {qual.isRequired && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{qual.issuer}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Issued: {format(new Date(qual.issueDate), 'dd MMM yyyy')}
                        </span>
                        {qual.expiryDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires: {format(new Date(qual.expiryDate), 'dd MMM yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(qual)}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {expiryInfo && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
                        {expiryInfo.isExpired 
                          ? `Expired ${Math.abs(expiryInfo.daysRemaining)} days ago`
                          : `${expiryInfo.daysRemaining} days remaining`
                        }
                      </span>
                      <span className="text-muted-foreground">
                        {Math.round(expiryInfo.percentRemaining)}%
                      </span>
                    </div>
                    <Progress 
                      value={expiryInfo.percentRemaining} 
                      className={cn(
                        "h-1.5",
                        expiryInfo.isExpired && "[&>div]:bg-red-500",
                        expiryInfo.isExpiringSoon && "[&>div]:bg-amber-500"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Add Qualification Sheet */}
      <AddQualificationSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        onAdd={(qual) => {
          setQualifications([...qualifications, qual]);
          setAddSheetOpen(false);
        }}
      />
    </div>
  );
}
