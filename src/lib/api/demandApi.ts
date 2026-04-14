/**
 * Mock Demand API
 * Simulates backend endpoints for demand data, forecasting, and shift generation.
 */

import { DemandAnalyticsData, StaffAbsence } from '@/types/demandAnalytics';
import { DemandShiftGenerationResult, DemandShiftConfig, DEFAULT_DEMAND_SHIFT_CONFIG } from '@/types/demandShiftGeneration';
import { ShiftEnvelope } from '@/types/demandShiftGeneration';
import { Room } from '@/types/roster';
import { mockApiCall, ApiResponse } from './mockApi';
import { generateMockDemandAnalytics, generateMockStaffAbsences } from '@/data/mockDemandAnalytics';
import { generateDemandDrivenShifts, convertEnvelopesToRosterShifts } from '@/lib/demandShiftEngine';
import { parseISO } from 'date-fns';

// ============= TYPES =============

export interface DemandFetchParams {
  centreId: string;
  roomIds?: string[];
  dateRange: { start: string; end: string };
}

export interface DemandForecastParams {
  centreId: string;
  roomIds?: string[];
  targetDates: string[];
  historicalWeeks?: number; // How many weeks of history to use
}

export interface DemandForecastResult {
  forecasts: DemandAnalyticsData[];
  confidence: number; // 0-100
  methodology: string;
  historicalDataPoints: number;
}

export interface DemandShiftGenerationParams {
  centreId: string;
  rooms: Room[];
  dates: string[];
  config?: Partial<DemandShiftConfig>;
  autoAssign?: boolean;
}

export interface DemandShiftGenerationApiResult {
  result: DemandShiftGenerationResult;
  generatedAt: string;
  configUsed: DemandShiftConfig;
}

export interface DemandSummary {
  centreId: string;
  date: string;
  totalBooked: number;
  totalCapacity: number;
  utilisationPercent: number;
  staffRequired: number;
  staffScheduled: number;
  complianceStatus: 'compliant' | 'at-risk' | 'non-compliant';
  roomBreakdown: {
    roomId: string;
    booked: number;
    capacity: number;
    utilisation: number;
    staffRequired: number;
    staffScheduled: number;
  }[];
}

// ============= API ENDPOINTS =============

export const demandApi = {
  /**
   * Fetch demand analytics data for a centre and date range.
   * In production, this would query a database with booking/attendance records.
   */
  async fetchDemandData(params: DemandFetchParams): Promise<ApiResponse<DemandAnalyticsData[]>> {
    const dates = generateDateRange(params.dateRange.start, params.dateRange.end);
    const allData = generateMockDemandAnalytics(dates);

    let filtered = allData.filter(d => d.centreId === params.centreId);
    if (params.roomIds && params.roomIds.length > 0) {
      filtered = filtered.filter(d => params.roomIds!.includes(d.roomId));
    }

    return mockApiCall(filtered, { delay: 400 });
  },

  /**
   * Fetch a daily demand summary for quick dashboard views.
   */
  async fetchDemandSummary(centreId: string, date: string): Promise<ApiResponse<DemandSummary>> {
    const dates = [parseISO(date)];
    const allData = generateMockDemandAnalytics(dates);
    const centreData = allData.filter(d => d.centreId === centreId && d.date === date);

    // Aggregate by room
    const roomMap = new Map<string, { booked: number; capacity: number; staffReq: number; staffSched: number }>();
    centreData.forEach(d => {
      const existing = roomMap.get(d.roomId) || { booked: 0, capacity: 0, staffReq: 0, staffSched: 0 };
      // Take max per time slot for capacity (it's the same across slots)
      existing.capacity = Math.max(existing.capacity, d.capacity);
      // Take peak across time slots
      existing.booked = Math.max(existing.booked, d.bookedChildren);
      existing.staffReq = Math.max(existing.staffReq, d.requiredStaff);
      existing.staffSched = Math.max(existing.staffSched, d.scheduledStaff);
      roomMap.set(d.roomId, existing);
    });

    const roomBreakdown = Array.from(roomMap.entries()).map(([roomId, data]) => ({
      roomId,
      booked: data.booked,
      capacity: data.capacity,
      utilisation: data.capacity > 0 ? Math.round((data.booked / data.capacity) * 100) : 0,
      staffRequired: data.staffReq,
      staffScheduled: data.staffSched,
    }));

    const totalBooked = roomBreakdown.reduce((s, r) => s + r.booked, 0);
    const totalCapacity = roomBreakdown.reduce((s, r) => s + r.capacity, 0);
    const staffRequired = roomBreakdown.reduce((s, r) => s + r.staffRequired, 0);
    const staffScheduled = roomBreakdown.reduce((s, r) => s + r.staffScheduled, 0);

    const complianceStatus: DemandSummary['complianceStatus'] =
      staffScheduled >= staffRequired ? 'compliant' :
      staffScheduled >= staffRequired - 1 ? 'at-risk' : 'non-compliant';

    const summary: DemandSummary = {
      centreId,
      date,
      totalBooked,
      totalCapacity,
      utilisationPercent: totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0,
      staffRequired,
      staffScheduled,
      complianceStatus,
      roomBreakdown,
    };

    return mockApiCall(summary, { delay: 250 });
  },

  /**
   * Fetch staff absences for a given date range.
   */
  async fetchAbsences(centreId: string, dateRange: { start: string; end: string }): Promise<ApiResponse<StaffAbsence[]>> {
    const absences = generateMockStaffAbsences(parseISO(dateRange.start));
    const filtered = absences.filter(a => a.centreId === centreId);
    return mockApiCall(filtered, { delay: 200 });
  },

  /**
   * Generate demand forecast using historical data patterns.
   * In production, this could use ML models or statistical forecasting.
   */
  async generateForecast(params: DemandForecastParams): Promise<ApiResponse<DemandForecastResult>> {
    const dates = params.targetDates.map(d => parseISO(d));
    const forecasts = generateMockDemandAnalytics(dates);
    const filtered = forecasts.filter(d => d.centreId === params.centreId);

    // Apply slight variance to simulate forecast uncertainty
    const adjustedForecasts = filtered.map(f => ({
      ...f,
      bookedChildren: Math.max(0, f.bookedChildren + Math.round((Math.random() - 0.5) * 2)),
      attendanceRate: Math.min(100, Math.max(70, f.attendanceRate + Math.round((Math.random() - 0.5) * 5))),
    }));

    const result: DemandForecastResult = {
      forecasts: adjustedForecasts,
      confidence: 75 + Math.round(Math.random() * 15),
      methodology: 'rolling-average-4w',
      historicalDataPoints: (params.historicalWeeks || 4) * 7 * 4, // slots per day
    };

    return mockApiCall(result, { delay: 600 });
  },

  /**
   * Generate shift envelopes from demand data.
   * This is the API-backed version of the demand-to-shift engine.
   */
  async generateShiftsFromDemand(params: DemandShiftGenerationParams): Promise<ApiResponse<DemandShiftGenerationApiResult>> {
    const config: DemandShiftConfig = { ...DEFAULT_DEMAND_SHIFT_CONFIG, ...params.config };
    const dates = params.dates.map(d => parseISO(d));
    const demandData = generateMockDemandAnalytics(dates);
    const filtered = demandData.filter(d => d.centreId === params.centreId);

    const result = generateDemandDrivenShifts(filtered, params.rooms, params.dates, config);

    const apiResult: DemandShiftGenerationApiResult = {
      result,
      generatedAt: new Date().toISOString(),
      configUsed: config,
    };

    return mockApiCall(apiResult, { delay: 800 });
  },

  /**
   * Convert shift envelopes into roster-ready shift objects.
   */
  async applyShiftEnvelopes(envelopes: ShiftEnvelope[]): Promise<ApiResponse<Omit<import('@/types/roster').Shift, 'id'>[]>> {
    const rosterShifts = convertEnvelopesToRosterShifts(envelopes);
    return mockApiCall(rosterShifts, { delay: 400 });
  },

  /**
   * Batch update demand data (e.g., manual corrections).
   */
  async updateDemandData(updates: Partial<DemandAnalyticsData>[]): Promise<ApiResponse<{ updated: number }>> {
    return mockApiCall({ updated: updates.length }, { delay: 300 });
  },
};

// ============= HELPERS =============

function generateDateRange(start: string, end: string): Date[] {
  const dates: Date[] = [];
  const current = parseISO(start);
  const endDate = parseISO(end);
  const d = new Date(current);
  while (d <= endDate) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}
