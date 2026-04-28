import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Calendar, Clock, ClipboardCheck, Sparkles,
  Target, TrendingUp, MessageSquare, Users, GraduationCap,
  ChevronDown, ChevronRight, LogOut, UserCircle,
} from 'lucide-react';

export type NavGroup = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { id: string; label: string; icon?: React.ComponentType<{ className?: string }> }[];
};

interface EmployeePortalSidebarProps {
  activeTab: string;
  onChange: (tab: string) => void;
  showOnboarding?: boolean;
  employeeName: string;
  employeePosition: string;
}

export function EmployeePortalSidebar({
  activeTab,
  onChange,
  showOnboarding,
  employeeName,
  employeePosition,
}: EmployeePortalSidebarProps) {
  const groups: NavGroup[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(showOnboarding
      ? [{ id: 'onboarding', label: 'Onboarding', icon: ClipboardCheck } as NavGroup]
      : []),
    {
      id: 'time',
      label: 'Time & Attendance',
      icon: Clock,
      children: [
        { id: 'schedule', label: 'My Schedule', icon: Calendar },
        { id: 'current', label: 'My Timesheets', icon: Clock },
      ],
    },
    {
      id: 'growth',
      label: 'Growth & Performance',
      icon: TrendingUp,
      children: [
        { id: 'performance', label: 'Performance', icon: Target },
        { id: 'okrs', label: 'My OKRs', icon: Target },
        { id: 'career', label: 'Career Path', icon: TrendingUp },
        { id: 'learning', label: 'Learning', icon: GraduationCap },
      ],
    },
    {
      id: 'engagement',
      label: 'Engagement',
      icon: Sparkles,
      children: [
        { id: 'recognition', label: 'Recognition', icon: Sparkles },
        { id: 'surveys', label: 'Surveys', icon: MessageSquare },
        { id: '360', label: '360° Feedback', icon: Users },
      ],
    },
  ];

  // Auto-expand the group that contains the active tab
  const initiallyOpen = new Set<string>(
    groups
      .filter((g) => g.children?.some((c) => c.id === activeTab))
      .map((g) => g.id)
  );
  const [openGroups, setOpenGroups] = useState<Set<string>>(initiallyOpen);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const initials = employeeName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <aside className="h-screen sticky top-0 w-64 shrink-0 bg-card border-r border-border flex flex-col">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Clock className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">Rostered</p>
            <p className="text-[10px] text-muted-foreground -mt-0.5">Employee Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="space-y-0.5">
          {groups.map((g) => {
            const hasChildren = !!g.children?.length;
            const isOpen = openGroups.has(g.id);
            const isActiveLeaf = !hasChildren && activeTab === g.id;
            const containsActive = hasChildren && g.children!.some((c) => c.id === activeTab);

            return (
              <li key={g.id}>
                <button
                  onClick={() =>
                    hasChildren ? toggleGroup(g.id) : onChange(g.id)
                  }
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                    'text-foreground/75 hover:bg-accent hover:text-foreground',
                    (isActiveLeaf || containsActive) &&
                      'bg-primary/10 text-primary font-medium'
                  )}
                >
                  <g.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{g.label}</span>
                  {hasChildren &&
                    (isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                    ))}
                </button>

                {hasChildren && isOpen && (
                  <ul className="mt-0.5 ml-3 pl-3 border-l border-border/60 space-y-0.5">
                    {g.children!.map((c) => {
                      const Icon = c.icon;
                      const active = activeTab === c.id;
                      return (
                        <li key={c.id}>
                          <button
                            onClick={() => onChange(c.id)}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] transition-colors',
                              active
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                            )}
                          >
                            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                            <span>{c.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer profile */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-xs font-semibold">
            {initials}
          </div>
          <div className="flex-1 min-w-0 leading-tight">
            <p className="text-sm font-medium truncate">{employeeName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{employeePosition}</p>
          </div>
          <UserCircle className="h-4 w-4 text-muted-foreground" />
        </div>
        <button
          onClick={() => (window.location.href = '/timesheet-admin')}
          className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Back to Admin</span>
        </button>
      </div>
    </aside>
  );
}
