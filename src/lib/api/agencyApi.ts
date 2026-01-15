import {
  Agency,
  Candidate,
  ShiftRequest,
  Placement,
  Invoice,
  CandidateFilters,
  ShiftRequestFilters,
  InvoiceFilters,
  AgencyAnalytics,
  CandidateMatch,
} from '@/types/agency';
import {
  mockAgency,
  mockCandidates,
  mockShiftRequests,
  mockPlacements,
  mockInvoices,
  mockAgencyAnalytics,
} from '@/data/mockAgencyData';
import { mockApiCall, ApiResponse, mockPaginatedCall, PaginatedResponse } from './mockApi';

// ============ AGENCY API ============

export const agencyApi = {
  // Agency Profile
  async getAgencyProfile(): Promise<ApiResponse<Agency>> {
    return mockApiCall(mockAgency);
  },

  async updateAgencyProfile(updates: Partial<Agency>): Promise<ApiResponse<Agency>> {
    const updated = { ...mockAgency, ...updates, updatedAt: new Date().toISOString() };
    return mockApiCall(updated, { delay: 500 });
  },

  // ============ CANDIDATES API ============

  async fetchCandidates(filters?: CandidateFilters): Promise<ApiResponse<Candidate[]>> {
    let candidates = [...mockCandidates];

    if (filters?.search) {
      const query = filters.search.toLowerCase();
      candidates = candidates.filter(
        c =>
          c.firstName.toLowerCase().includes(query) ||
          c.lastName.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.primaryRole.toLowerCase().includes(query)
      );
    }

    if (filters?.status) {
      candidates = candidates.filter(c => c.status === filters.status);
    }

    if (filters?.roles && filters.roles.length > 0) {
      candidates = candidates.filter(
        c =>
          filters.roles!.includes(c.primaryRole) ||
          c.secondaryRoles.some(r => filters.roles!.includes(r))
      );
    }

    if (filters?.minRating) {
      candidates = candidates.filter(c => c.averageRating >= filters.minRating!);
    }

    return mockApiCall(candidates);
  },

  async fetchCandidatesPaginated(
    page: number = 1,
    pageSize: number = 10,
    filters?: CandidateFilters
  ): Promise<ApiResponse<PaginatedResponse<Candidate>>> {
    const { data: candidates } = await this.fetchCandidates(filters);
    return mockPaginatedCall(candidates, page, pageSize);
  },

  async getCandidateById(id: string): Promise<ApiResponse<Candidate | null>> {
    const candidate = mockCandidates.find(c => c.id === id);
    return mockApiCall(candidate ?? null);
  },

  async createCandidate(data: Omit<Candidate, 'id' | 'joinedAt' | 'lastActiveAt'>): Promise<ApiResponse<Candidate>> {
    const newCandidate: Candidate = {
      ...data,
      id: `cand-${Date.now()}`,
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };
    return mockApiCall(newCandidate, { delay: 500 });
  },

  async updateCandidate(id: string, updates: Partial<Candidate>): Promise<ApiResponse<Candidate>> {
    const candidate = mockCandidates.find(c => c.id === id);
    if (!candidate) throw new Error('Candidate not found');
    const updated = { ...candidate, ...updates };
    return mockApiCall(updated, { delay: 400 });
  },

  // ============ SHIFT REQUESTS API ============

  async fetchShiftRequests(filters?: ShiftRequestFilters): Promise<ApiResponse<ShiftRequest[]>> {
    let shifts = [...mockShiftRequests];

    if (filters?.search) {
      const query = filters.search.toLowerCase();
      shifts = shifts.filter(
        s =>
          s.clientName.toLowerCase().includes(query) ||
          s.locationName.toLowerCase().includes(query)
      );
    }

    if (filters?.status) {
      shifts = shifts.filter(s => s.status === filters.status);
    }

    if (filters?.urgency) {
      shifts = shifts.filter(s => s.urgency === filters.urgency);
    }

    if (filters?.dateFrom) {
      shifts = shifts.filter(s => s.date >= filters.dateFrom!);
    }

    if (filters?.dateTo) {
      shifts = shifts.filter(s => s.date <= filters.dateTo!);
    }

    return mockApiCall(shifts);
  },

  async getShiftRequestById(id: string): Promise<ApiResponse<ShiftRequest | null>> {
    const shift = mockShiftRequests.find(s => s.id === id);
    return mockApiCall(shift ?? null);
  },

  async matchCandidates(shiftRequestId: string): Promise<ApiResponse<CandidateMatch[]>> {
    const shift = mockShiftRequests.find(s => s.id === shiftRequestId);
    if (!shift) throw new Error('Shift request not found');

    // Simple matching algorithm
    const matches: CandidateMatch[] = mockCandidates
      .filter(c => c.status === 'available')
      .map(candidate => {
        const skillMatch = Math.random() * 40 + 60; // 60-100
        const proximityMatch = Math.random() * 30 + 70; // 70-100
        const availabilityMatch = Math.random() * 20 + 80; // 80-100
        const matchScore = (skillMatch + proximityMatch + availabilityMatch + candidate.reliabilityScore) / 4;

        return {
          candidateId: candidate.id,
          candidate,
          matchScore: Math.round(matchScore),
          skillMatch: Math.round(skillMatch),
          proximityMatch: Math.round(proximityMatch),
          availabilityMatch: Math.round(availabilityMatch),
          reliabilityScore: candidate.reliabilityScore,
          isEligible: candidate.complianceScore >= 90,
          ineligibilityReasons: candidate.complianceScore < 90 ? ['Compliance score below threshold'] : undefined,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    return mockApiCall(matches, { delay: 600 });
  },

  // ============ PLACEMENTS API ============

  async fetchPlacements(shiftRequestId?: string): Promise<ApiResponse<Placement[]>> {
    let placements = [...mockPlacements];

    if (shiftRequestId) {
      placements = placements.filter(p => p.shiftRequestId === shiftRequestId);
    }

    return mockApiCall(placements);
  },

  async createPlacement(data: {
    shiftRequestId: string;
    candidateId: string;
    scheduledStart: string;
    scheduledEnd: string;
    breakMinutes: number;
    isBackup?: boolean;
  }): Promise<ApiResponse<Placement>> {
    const candidate = mockCandidates.find(c => c.id === data.candidateId);
    if (!candidate) throw new Error('Candidate not found');

    const placement: Placement = {
      id: `placement-${Date.now()}`,
      shiftRequestId: data.shiftRequestId,
      candidateId: data.candidateId,
      candidate,
      assignedBy: mockAgency.primaryContactName,
      assignedAt: new Date().toISOString(),
      status: 'pending',
      scheduledStart: data.scheduledStart,
      scheduledEnd: data.scheduledEnd,
      breakMinutes: data.breakMinutes,
      isBackup: data.isBackup ?? false,
    };

    return mockApiCall(placement, { delay: 500 });
  },

  async updatePlacementStatus(
    id: string,
    status: Placement['status']
  ): Promise<ApiResponse<Placement>> {
    const placement = mockPlacements.find(p => p.id === id);
    if (!placement) throw new Error('Placement not found');
    const updated = { ...placement, status };
    return mockApiCall(updated, { delay: 400 });
  },

  // ============ INVOICES API ============

  async fetchInvoices(filters?: InvoiceFilters): Promise<ApiResponse<Invoice[]>> {
    let invoices = [...mockInvoices];

    if (filters?.search) {
      const query = filters.search.toLowerCase();
      invoices = invoices.filter(
        i =>
          i.invoiceNumber.toLowerCase().includes(query) ||
          i.clientName.toLowerCase().includes(query)
      );
    }

    if (filters?.status) {
      invoices = invoices.filter(i => i.status === filters.status);
    }

    if (filters?.clientId) {
      invoices = invoices.filter(i => i.clientId === filters.clientId);
    }

    return mockApiCall(invoices);
  },

  async getInvoiceById(id: string): Promise<ApiResponse<Invoice | null>> {
    const invoice = mockInvoices.find(i => i.id === id);
    return mockApiCall(invoice ?? null);
  },

  async updateInvoiceStatus(
    id: string,
    status: Invoice['status']
  ): Promise<ApiResponse<Invoice>> {
    const invoice = mockInvoices.find(i => i.id === id);
    if (!invoice) throw new Error('Invoice not found');
    const updated = {
      ...invoice,
      status,
      updatedAt: new Date().toISOString(),
      ...(status === 'sent' ? { sentAt: new Date().toISOString() } : {}),
      ...(status === 'paid' ? { paidAt: new Date().toISOString() } : {}),
    };
    return mockApiCall(updated, { delay: 400 });
  },

  // ============ ANALYTICS API ============

  async getAgencyAnalytics(): Promise<ApiResponse<AgencyAnalytics>> {
    return mockApiCall(mockAgencyAnalytics, { delay: 300 });
  },
};
