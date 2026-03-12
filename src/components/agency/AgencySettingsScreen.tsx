import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/mui/Button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Bell, Shield, Globe, Users, Mail, Clock, FileText, Key,
  Building2, Link2, Palette, ChevronRight, Save, CheckCircle2
} from 'lucide-react';

interface SettingsSection {
  id: string;
  label: string;
  icon: typeof Bell;
}

const SECTIONS: SettingsSection[] = [
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security & Access', icon: Shield },
  { id: 'integrations', label: 'Integrations', icon: Link2 },
  { id: 'billing', label: 'Billing & Payments', icon: FileText },
  { id: 'team', label: 'Team Members', icon: Users },
  { id: 'preferences', label: 'Preferences', icon: Palette },
];

export function AgencySettingsScreen() {
  const [activeSection, setActiveSection] = useState('notifications');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex gap-6 max-w-6xl">
      {/* Settings Sidebar */}
      <div className="w-[220px] shrink-0">
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          {SECTIONS.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-border last:border-b-0',
                activeSection === section.id
                  ? 'bg-primary/5 text-primary'
                  : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
              )}
            >
              <section.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{section.label}</span>
              {activeSection === section.id && <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 space-y-5">
        {/* ─── Notifications ─────────────────────────────────────── */}
        {activeSection === 'notifications' && (
          <>
            <div className="bg-background rounded-xl border border-border p-5">
              <h3 className="text-base font-semibold mb-1">Notification Preferences</h3>
              <p className="text-[13px] text-muted-foreground mb-5">Configure how you receive notifications for shifts, candidates, and invoices.</p>

              <div className="space-y-4">
                {[
                  { label: 'New shift broadcast received', desc: 'Get notified when a centre broadcasts a new shift request', defaultOn: true },
                  { label: 'Shift SLA warning', desc: 'Alert when a shift is approaching its response deadline', defaultOn: true },
                  { label: 'Candidate availability change', desc: 'When a candidate updates their availability', defaultOn: false },
                  { label: 'Timesheet submitted for approval', desc: 'When a candidate submits a timesheet', defaultOn: true },
                  { label: 'Invoice payment received', desc: 'When a client pays an outstanding invoice', defaultOn: true },
                  { label: 'Compliance document expiring', desc: 'Alert when a document is approaching expiry', defaultOn: true },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-[13px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={item.defaultOn} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-background rounded-xl border border-border p-5">
              <h3 className="text-base font-semibold mb-1">Notification Channels</h3>
              <p className="text-[13px] text-muted-foreground mb-5">Choose how you want to receive notifications.</p>
              <div className="space-y-4">
                {[
                  { label: 'Email notifications', icon: Mail, defaultOn: true },
                  { label: 'Push notifications', icon: Bell, defaultOn: true },
                  { label: 'SMS notifications', icon: Globe, defaultOn: false },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <Switch defaultChecked={item.defaultOn} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── Security ──────────────────────────────────────────── */}
        {activeSection === 'security' && (
          <>
            <div className="bg-background rounded-xl border border-border p-5">
              <h3 className="text-base font-semibold mb-1">Security Settings</h3>
              <p className="text-[13px] text-muted-foreground mb-5">Manage password, two-factor authentication, and session settings.</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="text-sm font-medium">Two-Factor Authentication</p>
                    <p className="text-[13px] text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="text-xs bg-status-approved-bg text-status-approved border-0">Enabled</Badge>
                    <Button variant="outlined" size="small">Configure</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="text-sm font-medium">Password</p>
                    <p className="text-[13px] text-muted-foreground">Last changed 30 days ago</p>
                  </div>
                  <Button variant="outlined" size="small">Change Password</Button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="text-sm font-medium">Session Timeout</p>
                    <p className="text-[13px] text-muted-foreground">Automatically log out after inactivity</p>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-[140px] h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">API Keys</p>
                    <p className="text-[13px] text-muted-foreground">Manage API keys for integrations</p>
                  </div>
                  <Button variant="outlined" size="small"><Key className="h-3.5 w-3.5 mr-1.5" />Manage Keys</Button>
                </div>
              </div>
            </div>

            <div className="bg-background rounded-xl border border-border p-5">
              <h3 className="text-base font-semibold mb-1">Active Sessions</h3>
              <p className="text-[13px] text-muted-foreground mb-4">Manage your active login sessions.</p>
              <div className="space-y-2">
                {[
                  { device: 'Chrome on Windows', location: 'Sydney, NSW', lastActive: 'Current session', current: true },
                  { device: 'Safari on iPhone', location: 'Sydney, NSW', lastActive: '2 hours ago', current: false },
                ].map((session, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium">{session.device}</p>
                      <p className="text-[13px] text-muted-foreground">{session.location} · {session.lastActive}</p>
                    </div>
                    {session.current ? (
                      <Badge className="text-xs bg-status-approved-bg text-status-approved border-0">Current</Badge>
                    ) : (
                      <Button variant="ghost" size="small" className="text-destructive">Revoke</Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── Integrations ──────────────────────────────────────── */}
        {activeSection === 'integrations' && (
          <div className="bg-background rounded-xl border border-border p-5">
            <h3 className="text-base font-semibold mb-1">Connected Integrations</h3>
            <p className="text-[13px] text-muted-foreground mb-5">Manage third-party integrations and API connections.</p>

            <div className="space-y-3">
              {[
                { name: 'Xero Accounting', desc: 'Sync invoices and payments', status: 'connected', icon: '💰' },
                { name: 'MYOB', desc: 'Payroll and accounting integration', status: 'disconnected', icon: '📊' },
                { name: 'Employment Hero', desc: 'HR and payroll platform', status: 'connected', icon: '👥' },
                { name: 'Deputy', desc: 'Workforce management', status: 'disconnected', icon: '📅' },
                { name: 'WhatsApp Business', desc: 'Candidate communication', status: 'connected', icon: '💬' },
              ].map((integration, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center text-lg">
                      {integration.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{integration.name}</p>
                      <p className="text-[13px] text-muted-foreground">{integration.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      'text-xs border-0',
                      integration.status === 'connected' ? 'bg-status-approved-bg text-status-approved' : 'bg-muted text-muted-foreground'
                    )}>
                      {integration.status}
                    </Badge>
                    <Button variant="outlined" size="small">
                      {integration.status === 'connected' ? 'Configure' : 'Connect'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Billing ───────────────────────────────────────────── */}
        {activeSection === 'billing' && (
          <>
            <div className="bg-background rounded-xl border border-border p-5">
              <h3 className="text-base font-semibold mb-1">Billing Settings</h3>
              <p className="text-[13px] text-muted-foreground mb-5">Configure invoice defaults and payment terms.</p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-primary mb-1.5 block">Default Payment Terms</Label>
                    <Select defaultValue="14">
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-primary mb-1.5 block">Invoice Numbering</Label>
                    <Input defaultValue="INV-{YYYY}-{SEQ}" className="h-9 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-primary mb-1.5 block">Default Margin %</Label>
                    <Input defaultValue="35" type="number" className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-primary mb-1.5 block">Tax Rate (GST %)</Label>
                    <Input defaultValue="10" type="number" className="h-9 text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-background rounded-xl border border-border p-5">
              <h3 className="text-base font-semibold mb-1">Bank Details</h3>
              <p className="text-[13px] text-muted-foreground mb-5">Payment details for receiving client payments.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-primary mb-1.5 block">BSB</Label>
                  <Input defaultValue="062-000" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-primary mb-1.5 block">Account Number</Label>
                  <Input defaultValue="1234 5678" className="h-9 text-sm" />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-primary mb-1.5 block">Account Name</Label>
                  <Input defaultValue="Pinnacle Staffing Solutions Pty Ltd" className="h-9 text-sm" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ─── Team Members ──────────────────────────────────────── */}
        {activeSection === 'team' && (
          <div className="bg-background rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold">Team Members</h3>
                <p className="text-[13px] text-muted-foreground">Manage your agency team and their access levels.</p>
              </div>
              <Button size="small"><Plus className="h-3.5 w-3.5 mr-1.5" />Invite Member</Button>
            </div>

            <div className="space-y-2">
              {[
                { name: 'Sarah Mitchell', email: 'sarah@pinnaclestaffing.com.au', role: 'Owner', status: 'active' },
                { name: 'James Wilson', email: 'james@pinnaclestaffing.com.au', role: 'Admin', status: 'active' },
                { name: 'Emily Chen', email: 'emily@pinnaclestaffing.com.au', role: 'Coordinator', status: 'active' },
                { name: 'Tom Brown', email: 'tom@pinnaclestaffing.com.au', role: 'Coordinator', status: 'invited' },
              ].map((member, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-[13px] text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      'text-xs border-0',
                      member.status === 'active' ? 'bg-status-approved-bg text-status-approved' : 'bg-status-pending-bg text-status-pending'
                    )}>
                      {member.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{member.role}</Badge>
                    <Button variant="ghost" size="small" className="h-7">Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Preferences ───────────────────────────────────────── */}
        {activeSection === 'preferences' && (
          <div className="bg-background rounded-xl border border-border p-5">
            <h3 className="text-base font-semibold mb-1">General Preferences</h3>
            <p className="text-[13px] text-muted-foreground mb-5">Customize your agency portal experience.</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-primary mb-1.5 block">Timezone</Label>
                  <Select defaultValue="aest">
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aest">AEST (UTC+10)</SelectItem>
                      <SelectItem value="aedt">AEDT (UTC+11)</SelectItem>
                      <SelectItem value="acst">ACST (UTC+9:30)</SelectItem>
                      <SelectItem value="awst">AWST (UTC+8)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-primary mb-1.5 block">Date Format</Label>
                  <Select defaultValue="dmy">
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-primary mb-1.5 block">Currency</Label>
                  <Select defaultValue="aud">
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aud">AUD ($)</SelectItem>
                      <SelectItem value="nzd">NZD ($)</SelectItem>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="gbp">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-primary mb-1.5 block">Week Starts On</Label>
                  <Select defaultValue="monday">
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-t border-border">
                <div>
                  <p className="text-sm font-medium">Dark Mode</p>
                  <p className="text-[13px] text-muted-foreground">Enable dark theme for the agency portal</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between py-3 border-t border-border">
                <div>
                  <p className="text-sm font-medium">Compact View</p>
                  <p className="text-[13px] text-muted-foreground">Show more data in tables with tighter spacing</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-status-approved">
              <CheckCircle2 className="h-4 w-4" /> Settings saved
            </span>
          )}
          <Button size="medium" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1.5" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

// Need to add Plus icon used in team section
function Plus(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  );
}

export default AgencySettingsScreen;
