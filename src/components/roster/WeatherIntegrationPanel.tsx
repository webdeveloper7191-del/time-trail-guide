import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  CloudRain,
  Sun,
  Cloud,
  CloudSnow,
  CloudLightning,
  Thermometer,
  Wind,
  Droplets,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  MapPin,
  Settings,
  AlertTriangle,
  Plus,
  Info,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import {
  WeatherForecast,
  WeatherCondition,
  WeatherDemandAdjustment,
  ExternalFactor,
  DemandForecast,
  weatherConditionLabels,
} from '@/types/advancedRoster';

// Mock weather data
const mockWeatherForecast: WeatherForecast[] = [
  {
    date: format(new Date(), 'yyyy-MM-dd'),
    location: 'Sydney CBD',
    condition: 'clear',
    temperature: { min: 18, max: 28, unit: 'celsius' },
    precipitation: { probability: 10, amount: 0 },
    wind: { speed: 15, unit: 'kmh' },
    uvIndex: 8,
    humidity: 55,
    alerts: [],
  },
  {
    date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    location: 'Sydney CBD',
    condition: 'cloudy',
    temperature: { min: 16, max: 24, unit: 'celsius' },
    precipitation: { probability: 40, amount: 2 },
    wind: { speed: 20, unit: 'kmh' },
    uvIndex: 5,
    humidity: 65,
    alerts: [],
  },
  {
    date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
    location: 'Sydney CBD',
    condition: 'rain',
    temperature: { min: 14, max: 20, unit: 'celsius' },
    precipitation: { probability: 80, amount: 15 },
    wind: { speed: 25, unit: 'kmh' },
    uvIndex: 2,
    humidity: 85,
    alerts: ['Heavy rain warning'],
  },
  {
    date: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    location: 'Sydney CBD',
    condition: 'heavy_rain',
    temperature: { min: 12, max: 18, unit: 'celsius' },
    precipitation: { probability: 95, amount: 35 },
    wind: { speed: 40, unit: 'kmh' },
    uvIndex: 1,
    humidity: 92,
    alerts: ['Severe weather warning', 'Flood watch'],
  },
  {
    date: format(addDays(new Date(), 4), 'yyyy-MM-dd'),
    location: 'Sydney CBD',
    condition: 'cloudy',
    temperature: { min: 15, max: 22, unit: 'celsius' },
    precipitation: { probability: 30, amount: 3 },
    wind: { speed: 18, unit: 'kmh' },
    uvIndex: 4,
    humidity: 70,
    alerts: [],
  },
  {
    date: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
    location: 'Sydney CBD',
    condition: 'extreme_heat',
    temperature: { min: 26, max: 42, unit: 'celsius' },
    precipitation: { probability: 0, amount: 0 },
    wind: { speed: 35, unit: 'kmh' },
    uvIndex: 11,
    humidity: 25,
    alerts: ['Extreme heat warning', 'Total fire ban'],
  },
  {
    date: format(addDays(new Date(), 6), 'yyyy-MM-dd'),
    location: 'Sydney CBD',
    condition: 'clear',
    temperature: { min: 20, max: 30, unit: 'celsius' },
    precipitation: { probability: 5, amount: 0 },
    wind: { speed: 12, unit: 'kmh' },
    uvIndex: 9,
    humidity: 45,
    alerts: [],
  },
];

// Mock demand adjustments
const mockDemandAdjustments: WeatherDemandAdjustment[] = [
  { condition: 'clear', demandMultiplier: 1.0, applyTo: 'all', notes: 'Normal demand' },
  { condition: 'cloudy', demandMultiplier: 0.95, applyTo: 'outdoor', notes: 'Slight reduction outdoor' },
  { condition: 'rain', demandMultiplier: 0.8, applyTo: 'outdoor', notes: 'Reduced outdoor activities' },
  { condition: 'heavy_rain', demandMultiplier: 0.6, applyTo: 'all', notes: 'Significant drop in attendance' },
  { condition: 'storm', demandMultiplier: 0.4, applyTo: 'all', notes: 'Major disruption expected' },
  { condition: 'extreme_heat', demandMultiplier: 0.7, applyTo: 'outdoor', notes: 'Indoor activities preferred' },
  { condition: 'extreme_cold', demandMultiplier: 0.85, applyTo: 'all', notes: 'Some attendance reduction' },
];

// Mock external factors
const mockExternalFactors: ExternalFactor[] = [
  {
    id: 'factor-1',
    type: 'public_holiday',
    name: 'Australia Day',
    startDate: '2025-01-27',
    endDate: '2025-01-27',
    demandMultiplier: 0.3,
    affectedCentres: 'all',
    notes: 'Most centres closed',
    source: 'automatic',
  },
  {
    id: 'factor-2',
    type: 'school_holidays',
    name: 'Summer School Holidays',
    startDate: '2024-12-20',
    endDate: '2025-01-28',
    demandMultiplier: 1.4,
    affectedCentres: 'all',
    notes: 'Higher vacation care demand',
    source: 'automatic',
  },
  {
    id: 'factor-3',
    type: 'event',
    name: 'Local Community Fair',
    startDate: '2025-01-18',
    endDate: '2025-01-18',
    demandMultiplier: 0.8,
    affectedCentres: ['centre-1'],
    notes: 'Some families attending fair',
    source: 'manual',
  },
];

export function WeatherIntegrationPanel() {
  const [forecast] = useState(mockWeatherForecast);
  const [adjustments, setAdjustments] = useState(mockDemandAdjustments);
  const [externalFactors, setExternalFactors] = useState(mockExternalFactors);
  const [autoAdjust, setAutoAdjust] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('sydney');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    toast.success('Weather data refreshed');
  };

  const handleUpdateMultiplier = (condition: WeatherCondition, multiplier: number) => {
    setAdjustments(prev =>
      prev.map(a => (a.condition === condition ? { ...a, demandMultiplier: multiplier } : a))
    );
    toast.success(`Updated ${weatherConditionLabels[condition]} multiplier`);
  };

  const getWeatherIcon = (condition: WeatherCondition) => {
    switch (condition) {
      case 'clear':
        return <Sun className="h-6 w-6 text-amber-500" />;
      case 'cloudy':
        return <Cloud className="h-6 w-6 text-gray-500" />;
      case 'rain':
        return <CloudRain className="h-6 w-6 text-blue-500" />;
      case 'heavy_rain':
        return <CloudRain className="h-6 w-6 text-blue-700" />;
      case 'storm':
        return <CloudLightning className="h-6 w-6 text-purple-500" />;
      case 'snow':
        return <CloudSnow className="h-6 w-6 text-cyan-500" />;
      case 'extreme_heat':
        return <Thermometer className="h-6 w-6 text-red-500" />;
      case 'extreme_cold':
        return <Thermometer className="h-6 w-6 text-cyan-700" />;
    }
  };

  const getDemandMultiplier = (condition: WeatherCondition) => {
    return adjustments.find(a => a.condition === condition)?.demandMultiplier || 1.0;
  };

  const getMultiplierBadge = (multiplier: number) => {
    if (multiplier >= 1.2) {
      return <Badge className="bg-emerald-500/10 text-emerald-700">+{((multiplier - 1) * 100).toFixed(0)}%</Badge>;
    } else if (multiplier <= 0.8) {
      return <Badge className="bg-red-500/10 text-red-700">{((multiplier - 1) * 100).toFixed(0)}%</Badge>;
    } else if (multiplier < 1) {
      return <Badge className="bg-amber-500/10 text-amber-700">{((multiplier - 1) * 100).toFixed(0)}%</Badge>;
    }
    return <Badge variant="secondary">Normal</Badge>;
  };

  const getFactorTypeBadge = (type: ExternalFactor['type']) => {
    switch (type) {
      case 'public_holiday':
        return <Badge className="bg-red-500/10 text-red-700">Public Holiday</Badge>;
      case 'school_holidays':
        return <Badge className="bg-blue-500/10 text-blue-700">School Holidays</Badge>;
      case 'event':
        return <Badge className="bg-purple-500/10 text-purple-700">Event</Badge>;
      case 'weather':
        return <Badge className="bg-cyan-500/10 text-cyan-700">Weather</Badge>;
      case 'custom':
        return <Badge variant="secondary">Custom</Badge>;
    }
  };

  const alertCount = forecast.filter(f => f.alerts.length > 0).length;

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <Card className="card-material-elevated border-l-4 border-l-cyan-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <CloudRain className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Weather & External Factors</CardTitle>
                <CardDescription>
                  Adjust staffing demand based on weather and external events
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-40">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sydney">Sydney</SelectItem>
                  <SelectItem value="melbourne">Melbourne</SelectItem>
                  <SelectItem value="brisbane">Brisbane</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                {isRefreshing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Auto-Adjust Staffing</p>
                <p className="text-sm text-muted-foreground">
                  Automatically modify demand forecasts based on weather
                </p>
              </div>
            </div>
            <Switch checked={autoAdjust} onCheckedChange={setAutoAdjust} />
          </div>
        </CardContent>
      </Card>

      {/* Weather Alerts */}
      {alertCount > 0 && (
        <Card className="card-material border-l-4 border-l-amber-500 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Weather Alerts Active</p>
                <p className="text-sm text-amber-700">
                  {alertCount} days with weather warnings in the forecast
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7-Day Forecast */}
      <Card className="card-material">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            7-Day Weather Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {forecast.map((day, idx) => {
              const multiplier = getDemandMultiplier(day.condition);
              const isToday = idx === 0;

              return (
                <Card
                  key={day.date}
                  className={`text-center ${isToday ? 'ring-2 ring-primary' : ''} ${
                    day.alerts.length > 0 ? 'bg-amber-50' : ''
                  }`}
                >
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">
                      {isToday ? 'Today' : format(new Date(day.date), 'EEE')}
                    </p>
                    <p className="text-sm font-medium">{format(new Date(day.date), 'd MMM')}</p>
                    <div className="my-2 flex justify-center">{getWeatherIcon(day.condition)}</div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {weatherConditionLabels[day.condition]}
                    </p>
                    <p className="text-sm font-medium mt-1">
                      {day.temperature.max}° / {day.temperature.min}°
                    </p>
                    <div className="mt-2">{getMultiplierBadge(multiplier)}</div>
                    {day.alerts.length > 0 && (
                      <AlertTriangle className="h-4 w-4 text-amber-500 mx-auto mt-2" />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Demand Adjustment Rules */}
      <Card className="card-material">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weather-Based Demand Adjustments
          </CardTitle>
          <CardDescription>
            Configure how weather conditions affect staffing demand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {adjustments.map(adjustment => (
              <div key={adjustment.condition} className="flex items-center gap-4">
                <div className="w-40 flex items-center gap-2">
                  {getWeatherIcon(adjustment.condition)}
                  <span className="font-medium capitalize">
                    {weatherConditionLabels[adjustment.condition]}
                  </span>
                </div>
                <div className="flex-1">
                  <Slider
                    value={[adjustment.demandMultiplier * 100]}
                    min={20}
                    max={150}
                    step={5}
                    onValueChange={([value]) =>
                      handleUpdateMultiplier(adjustment.condition, value / 100)
                    }
                  />
                </div>
                <div className="w-20 text-right">
                  <span
                    className={`font-medium ${
                      adjustment.demandMultiplier < 1
                        ? 'text-red-600'
                        : adjustment.demandMultiplier > 1
                        ? 'text-emerald-600'
                        : ''
                    }`}
                  >
                    {(adjustment.demandMultiplier * 100).toFixed(0)}%
                  </span>
                </div>
                <Badge variant="secondary" className="w-20 justify-center">
                  {adjustment.applyTo}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* External Factors */}
      <Card className="card-material">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">External Factors</CardTitle>
              <CardDescription>
                Public holidays, school holidays, and events affecting demand
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Factor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Demand Impact</TableHead>
                <TableHead>Centres</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {externalFactors.map(factor => (
                <TableRow key={factor.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{factor.name}</p>
                      {factor.notes && (
                        <p className="text-xs text-muted-foreground">{factor.notes}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getFactorTypeBadge(factor.type)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(factor.startDate), 'dd MMM')}
                      {factor.startDate !== factor.endDate && (
                        <> - {format(new Date(factor.endDate), 'dd MMM')}</>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getMultiplierBadge(factor.demandMultiplier)}</TableCell>
                  <TableCell>
                    {factor.affectedCentres === 'all' ? (
                      <Badge variant="secondary">All Centres</Badge>
                    ) : (
                      <span className="text-sm">
                        {(factor.affectedCentres as string[]).length} centres
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {factor.source}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="card-material">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium">How Weather Adjustments Work</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Weather data is fetched daily and used to adjust demand forecasts. A multiplier of 
                0.8 means 20% less demand is expected, while 1.2 means 20% more. These adjustments 
                are applied automatically to staffing recommendations when auto-adjust is enabled.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
