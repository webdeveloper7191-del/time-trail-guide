import type { ReactNode, ElementType } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function DashboardSection({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return <section className="min-w-0 space-y-4 border-t border-border pt-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-semibold text-foreground">{title}</h2>{subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}</div>{action}</div>{children}</section>;
}
export function DashboardLink({ to, children }: { to: string; children: ReactNode }) {
  return <Button asChild variant="ghost" size="sm" className="h-8 gap-1 text-xs"><Link to={to}>{children}<ArrowUpRight className="h-3.5 w-3.5 shrink-0" /></Link></Button>;
}
export interface ActionItem { label: string; detail: string; count: number; to: string; icon: ElementType; urgent?: boolean }
export function ActionQueue({ items }: { items: ActionItem[] }) {
  return <div className="divide-y divide-border">{items.map(item => <Link key={item.label} to={item.to} className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/60"><item.icon className={cn('h-4 w-4 shrink-0', item.urgent && item.count > 0 ? 'text-destructive' : 'text-muted-foreground')} /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.detail}</p></div><Badge variant={item.urgent && item.count > 0 ? 'destructive' : 'secondary'}>{item.count}</Badge><ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" /></Link>)}</div>;
}
export function ShortcutGrid({ items }: { items: { label: string; to: string; icon: ElementType }[] }) {
  return <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">{items.map(item => <Button key={item.label} asChild variant="outline" className="h-auto min-h-11 justify-start whitespace-normal px-3 py-2 text-xs"><Link to={item.to}><item.icon className="mr-2 h-4 w-4 shrink-0 text-primary" />{item.label}</Link></Button>)}</div>;
}
export function MetricBar({ label, value, max, caption }: { label: string; value: number; max: number; caption: string }) {
  return <div className="space-y-2"><div className="flex justify-between gap-3 text-xs"><span>{label}</span><span className="text-muted-foreground">{caption}</span></div><Progress className="h-2" value={max ? Math.min(100, value / max * 100) : 0} /></div>;
}
export function EmptyDashboard({ children }: { children: ReactNode }) {
  return <div className="flex min-h-24 items-center justify-center gap-2 rounded-md bg-muted/40 p-4 text-center text-xs text-muted-foreground"><CheckCircle2 className="h-4 w-4 shrink-0" />{children}</div>;
}