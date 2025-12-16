import { StaffMember } from '@/types/staff';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Award,
  Edit,
  Plus,
  DollarSign,
  Clock,
  Calendar,
  Info,
  Settings,
} from 'lucide-react';
import { mockAwardRules } from '@/data/mockStaffData';

interface StaffAwardRuleSectionProps {
  staff: StaffMember;
}

export function StaffAwardRuleSection({ staff }: StaffAwardRuleSectionProps) {
  const awardRule = staff.applicableAward || mockAwardRules[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Award Rules & Rates</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure industry award compliance and pay rates
          </p>
        </div>
        <Button size="sm" className="bg-primary">
          <Edit className="h-4 w-4 mr-2" />
          Edit Award Configuration
        </Button>
      </div>

      {/* Current Award */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Current Industry Award
            </CardTitle>
            <Badge variant="secondary">{awardRule.classification} - {awardRule.level}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold text-lg">{awardRule.awardName}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Classification: {awardRule.classification} | Level: {awardRule.level}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pay Rates */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            Pay Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Rate Type</TableHead>
                <TableHead className="text-right">Multiplier</TableHead>
                <TableHead className="text-right">Hourly Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Base Rate</TableCell>
                <TableCell className="text-right">100%</TableCell>
                <TableCell className="text-right font-medium">${awardRule.baseHourlyRate.toFixed(2)}/hr</TableCell>
              </TableRow>
              {awardRule.casualLoading && (
                <TableRow>
                  <TableCell className="font-medium">Casual Loading</TableCell>
                  <TableCell className="text-right">{awardRule.casualLoading}%</TableCell>
                  <TableCell className="text-right font-medium">
                    ${(awardRule.baseHourlyRate * (1 + awardRule.casualLoading / 100)).toFixed(2)}/hr
                  </TableCell>
                </TableRow>
              )}
              {awardRule.saturdayRate && (
                <TableRow>
                  <TableCell className="font-medium">Saturday Rate</TableCell>
                  <TableCell className="text-right">{awardRule.saturdayRate}%</TableCell>
                  <TableCell className="text-right font-medium">
                    ${(awardRule.baseHourlyRate * (awardRule.saturdayRate / 100)).toFixed(2)}/hr
                  </TableCell>
                </TableRow>
              )}
              {awardRule.sundayRate && (
                <TableRow>
                  <TableCell className="font-medium">Sunday Rate</TableCell>
                  <TableCell className="text-right">{awardRule.sundayRate}%</TableCell>
                  <TableCell className="text-right font-medium">
                    ${(awardRule.baseHourlyRate * (awardRule.sundayRate / 100)).toFixed(2)}/hr
                  </TableCell>
                </TableRow>
              )}
              {awardRule.publicHolidayRate && (
                <TableRow>
                  <TableCell className="font-medium">Public Holiday Rate</TableCell>
                  <TableCell className="text-right">{awardRule.publicHolidayRate}%</TableCell>
                  <TableCell className="text-right font-medium">
                    ${(awardRule.baseHourlyRate * (awardRule.publicHolidayRate / 100)).toFixed(2)}/hr
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Overtime Rates */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Overtime Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Overtime Type</TableHead>
                <TableHead className="text-right">Multiplier</TableHead>
                <TableHead className="text-right">Hourly Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">First 2 Hours</TableCell>
                <TableCell className="text-right">{awardRule.overtimeRates.first2Hours}%</TableCell>
                <TableCell className="text-right font-medium">
                  ${(awardRule.baseHourlyRate * (awardRule.overtimeRates.first2Hours / 100)).toFixed(2)}/hr
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">After 2 Hours</TableCell>
                <TableCell className="text-right">{awardRule.overtimeRates.after2Hours}%</TableCell>
                <TableCell className="text-right font-medium">
                  ${(awardRule.baseHourlyRate * (awardRule.overtimeRates.after2Hours / 100)).toFixed(2)}/hr
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Penalty Rates */}
      {awardRule.penaltyRates && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              Penalty Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Penalty Type</TableHead>
                  <TableHead>Time Period</TableHead>
                  <TableHead className="text-right">Multiplier</TableHead>
                  <TableHead className="text-right">Hourly Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {awardRule.penaltyRates.earlyMorning && (
                  <TableRow>
                    <TableCell className="font-medium">Early Morning</TableCell>
                    <TableCell className="text-muted-foreground">Before 7:00 AM</TableCell>
                    <TableCell className="text-right">{awardRule.penaltyRates.earlyMorning}%</TableCell>
                    <TableCell className="text-right font-medium">
                      ${(awardRule.baseHourlyRate * (awardRule.penaltyRates.earlyMorning / 100)).toFixed(2)}/hr
                    </TableCell>
                  </TableRow>
                )}
                {awardRule.penaltyRates.evening && (
                  <TableRow>
                    <TableCell className="font-medium">Evening</TableCell>
                    <TableCell className="text-muted-foreground">6:00 PM - 10:00 PM</TableCell>
                    <TableCell className="text-right">{awardRule.penaltyRates.evening}%</TableCell>
                    <TableCell className="text-right font-medium">
                      ${(awardRule.baseHourlyRate * (awardRule.penaltyRates.evening / 100)).toFixed(2)}/hr
                    </TableCell>
                  </TableRow>
                )}
                {awardRule.penaltyRates.night && (
                  <TableRow>
                    <TableCell className="font-medium">Night Shift</TableCell>
                    <TableCell className="text-muted-foreground">10:00 PM - 7:00 AM</TableCell>
                    <TableCell className="text-right">{awardRule.penaltyRates.night}%</TableCell>
                    <TableCell className="text-right font-medium">
                      ${(awardRule.baseHourlyRate * (awardRule.penaltyRates.night / 100)).toFixed(2)}/hr
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Allowances */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Settings className="h-4 w-4 text-blue-500" />
              Award Allowances
            </CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Allowance
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {awardRule.allowances.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Allowance Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Taxable</TableHead>
                  <TableHead className="text-center">Super Guarantee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {awardRule.allowances.map((allowance) => (
                  <TableRow key={allowance.id}>
                    <TableCell className="font-medium">{allowance.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {allowance.type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">${allowance.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      {allowance.taxable ? (
                        <Badge variant="secondary">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {allowance.superGuarantee ? (
                        <Badge variant="secondary">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No allowances configured for this award</p>
              <Button variant="outline" size="sm" className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Add First Allowance
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Staff Allowances */}
      {staff.customAllowances.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">Custom Staff Allowances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {staff.customAllowances.map((allowance) => (
                <div key={allowance.id} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{allowance.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ${allowance.amount.toFixed(2)} {allowance.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
