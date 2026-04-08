import { useState, useMemo } from 'react';
import { Box, Typography, Stack, LinearProgress } from '@mui/material';
import {
  DollarSign, TrendingUp, TrendingDown, Building2, Calendar,
  ArrowUpRight, Merge, Clock, PiggyBank, BarChart3,
} from 'lucide-react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  getAllLocationLinks, getOptimizationForCentre, getThresholdsForCentre,
} from '@/data/locationCentreMapping';

interface CostSavingsDashboardProps {
  open: boolean;
  onClose: () => void;
}

// Generate mock combining event history
function generateMockHistory() {
  const links = getAllLocationLinks();
  const events: Array<{
    locationId: string;
    centreId: string;
    industry: string;
    date: string;
    timeBlock: string;
    roomsCombined: number;
    staffReleased: number;
    savings: number;
  }> = [];

  const timeBlocks = ['Early Morning', 'Late Afternoon', 'Evening'];
  const now = new Date();

  for (let d = 0; d < 30; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];

    for (const link of links) {
      const opt = getOptimizationForCentre(link.centreId);
      const savingsPerEvent = opt?.estimatedSavingsPerCombine ?? 50;
      // Random chance of combining events per day
      const eventCount = Math.random() > 0.4 ? Math.floor(Math.random() * 3) + 1 : 0;
      for (let e = 0; e < eventCount; e++) {
        const staffReleased = Math.floor(Math.random() * 2) + 1;
        events.push({
          locationId: link.locationId,
          centreId: link.centreId,
          industry: link.industryType,
          date: dateStr,
          timeBlock: timeBlocks[Math.floor(Math.random() * timeBlocks.length)],
          roomsCombined: Math.floor(Math.random() * 2) + 2,
          staffReleased,
          savings: savingsPerEvent * staffReleased,
        });
      }
    }
  }

  return events;
}

const INDUSTRY_LABELS: Record<string, string> = {
  childcare: 'Childcare',
  healthcare: 'Healthcare',
  retail: 'Retail',
  hospitality: 'Hospitality',
  custom: 'Custom',
};

const CENTRE_LABELS: Record<string, string> = {
  'centre-1': 'Sunshine Early Learning',
  'centre-2': 'Rainbow Kids Academy',
  'centre-3': 'Prahran Clinic',
};

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

export function CostSavingsDashboard({ open, onClose }: CostSavingsDashboardProps) {
  const [period, setPeriod] = useState<'7d' | '30d'>('30d');
  const [filterLocation, setFilterLocation] = useState<string>('all');

  const allEvents = useMemo(() => generateMockHistory(), []);
  const links = useMemo(() => getAllLocationLinks(), []);

  const filteredEvents = useMemo(() => {
    const days = period === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    return allEvents.filter(e => {
      if (e.date < cutoffStr) return false;
      if (filterLocation !== 'all' && e.centreId !== filterLocation) return false;
      return true;
    });
  }, [allEvents, period, filterLocation]);

  // KPIs
  const totalSavings = filteredEvents.reduce((s, e) => s + e.savings, 0);
  const totalEvents = filteredEvents.length;
  const totalStaffReleased = filteredEvents.reduce((s, e) => s + e.staffReleased, 0);
  const avgSavingsPerDay = totalSavings / (period === '7d' ? 7 : 30);

  // Savings by location
  const savingsByLocation = useMemo(() => {
    const map: Record<string, number> = {};
    filteredEvents.forEach(e => {
      const label = CENTRE_LABELS[e.centreId] || e.centreId;
      map[label] = (map[label] || 0) + e.savings;
    });
    return Object.entries(map).map(([name, savings]) => ({ name, savings }))
      .sort((a, b) => b.savings - a.savings);
  }, [filteredEvents]);

  // Savings by time block
  const savingsByTimeBlock = useMemo(() => {
    const map: Record<string, { count: number; savings: number }> = {};
    filteredEvents.forEach(e => {
      if (!map[e.timeBlock]) map[e.timeBlock] = { count: 0, savings: 0 };
      map[e.timeBlock].count++;
      map[e.timeBlock].savings += e.savings;
    });
    return Object.entries(map).map(([name, d]) => ({ name, ...d }));
  }, [filteredEvents]);

  // Daily trend
  const dailyTrend = useMemo(() => {
    const map: Record<string, number> = {};
    filteredEvents.forEach(e => {
      map[e.date] = (map[e.date] || 0) + e.savings;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, savings]) => ({
        date: new Date(date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }),
        savings,
      }));
  }, [filteredEvents]);

  // Industry breakdown for pie
  const industryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredEvents.forEach(e => {
      const label = INDUSTRY_LABELS[e.industry] || e.industry;
      map[label] = (map[label] || 0) + e.savings;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredEvents]);

  // Projected monthly/annual
  const projectedMonthly = Math.round(avgSavingsPerDay * 30);
  const projectedAnnual = Math.round(avgSavingsPerDay * 365);

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Cost Savings Dashboard"
      subtitle="Estimated savings from area combining optimizations"
      width="55rem"
    >
      <div className="space-y-4 p-1">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {links.map(l => (
                <SelectItem key={l.centreId} value={l.centreId}>
                  {CENTRE_LABELS[l.centreId] || l.centreId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Savings</p>
                  <p className="text-2xl font-bold text-foreground">${totalSavings.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">
                      ${avgSavingsPerDay.toFixed(0)}/day avg
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-green-50 p-2.5">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Combining Events</p>
                  <p className="text-2xl font-bold text-foreground">{totalEvents}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(totalEvents / (period === '7d' ? 7 : 30)).toFixed(1)}/day
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-2.5">
                  <Merge className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Staff Released</p>
                  <p className="text-2xl font-bold text-foreground">{totalStaffReleased}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hours redirected
                  </p>
                </div>
                <div className="rounded-lg bg-purple-50 p-2.5">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Projected Annual</p>
                  <p className="text-2xl font-bold text-foreground">${projectedAnnual.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ~${projectedMonthly.toLocaleString()}/month
                  </p>
                </div>
                <div className="rounded-lg bg-amber-50 p-2.5">
                  <PiggyBank className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Daily Trend */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Daily Savings Trend</CardTitle>
              <CardDescription className="text-xs">Estimated cost savings over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(v: number) => [`$${v}`, 'Savings']} />
                  <Line
                    type="monotone"
                    dataKey="savings"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Industry Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">By Industry</CardTitle>
              <CardDescription className="text-xs">Savings breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={industryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {industryBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`$${v}`, 'Savings']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {industryBreakdown.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium text-foreground">${item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* By Location */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Savings by Location</CardTitle>
              <CardDescription className="text-xs">Total estimated savings per site</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={savingsByLocation} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
                  <Tooltip formatter={(v: number) => [`$${v}`, 'Savings']} />
                  <Bar dataKey="savings" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* By Time Block */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Savings by Time Block</CardTitle>
              <CardDescription className="text-xs">When combining happens most</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savingsByTimeBlock.map((block) => {
                  const maxSavings = Math.max(...savingsByTimeBlock.map(b => b.savings));
                  const pct = maxSavings > 0 ? (block.savings / maxSavings) * 100 : 0;
                  return (
                    <div key={block.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-foreground">{block.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {block.count} events
                          </Badge>
                          <span className="text-xs font-semibold text-foreground">
                            ${block.savings.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Config summary */}
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-2">
                  Configured Rates
                </p>
                {links.map(l => {
                  const opt = getOptimizationForCentre(l.centreId);
                  return (
                    <div key={l.centreId} className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-muted-foreground">{CENTRE_LABELS[l.centreId]}</span>
                      <span className="font-medium text-foreground">
                        ${opt?.estimatedSavingsPerCombine ?? 50}/event
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PrimaryOffCanvas>
  );
}
