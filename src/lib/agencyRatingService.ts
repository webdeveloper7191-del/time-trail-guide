// Agency and worker rating service

export interface PlacementRating {
  id: string;
  placementId: string;
  agencyId: string;
  agencyName: string;
  workerId: string;
  workerName: string;
  centreId: string;
  centreName: string;
  shiftDate: string;
  
  // Ratings (1-5)
  agencyRating: number;
  workerRating: number;
  
  // Feedback
  agencyFeedback?: string;
  workerFeedback?: string;
  
  // Categories
  categories: {
    responseTime: number;
    candidateQuality: number;
    communication: number;
    professionalism: number;
    compliance: number;
  };
  
  // Flags
  wouldHireAgain: boolean;
  wouldRequestWorker: boolean;
  hadIssues: boolean;
  issueDescription?: string;
  
  // Metadata
  ratedBy: string;
  ratedAt: string;
}

export interface AgencyPerformanceMetrics {
  agencyId: string;
  agencyName: string;
  
  // Overall metrics
  overallRating: number;
  totalPlacements: number;
  totalShifts: number;
  
  // Category averages
  avgResponseTime: number; // minutes
  avgCandidateQuality: number; // 1-5
  avgCommunication: number; // 1-5
  avgProfessionalism: number; // 1-5
  avgCompliance: number; // 1-5
  
  // Performance KPIs
  fillRate: number; // percentage
  onTimeRate: number; // percentage
  noShowRate: number; // percentage
  repeatHireRate: number; // percentage
  issueRate: number; // percentage
  
  // Trend data (last 6 months)
  trends: {
    month: string;
    rating: number;
    placements: number;
    fillRate: number;
    revenue: number;
  }[];
  
  // Top workers from this agency
  topWorkers: {
    id: string;
    name: string;
    rating: number;
    shiftsCompleted: number;
  }[];
  
  // Recent ratings
  recentRatings: PlacementRating[];
}

// Mock ratings data
const mockRatings: PlacementRating[] = [
  {
    id: 'rating-1',
    placementId: 'placement-1',
    agencyId: 'agency-1',
    agencyName: 'Elite Childcare Staffing',
    workerId: 'worker-1',
    workerName: 'Sarah Mitchell',
    centreId: 'centre-1',
    centreName: 'Sunshine Early Learning',
    shiftDate: '2024-01-10',
    agencyRating: 5,
    workerRating: 5,
    agencyFeedback: 'Fast response and excellent candidate selection',
    workerFeedback: 'Sarah was amazing with the toddlers, very professional',
    categories: {
      responseTime: 5,
      candidateQuality: 5,
      communication: 4,
      professionalism: 5,
      compliance: 5,
    },
    wouldHireAgain: true,
    wouldRequestWorker: true,
    hadIssues: false,
    ratedBy: 'admin@sunshine.edu',
    ratedAt: '2024-01-11T09:00:00Z',
  },
  {
    id: 'rating-2',
    placementId: 'placement-2',
    agencyId: 'agency-1',
    agencyName: 'Elite Childcare Staffing',
    workerId: 'worker-2',
    workerName: 'Michael Brown',
    centreId: 'centre-1',
    centreName: 'Sunshine Early Learning',
    shiftDate: '2024-01-08',
    agencyRating: 4,
    workerRating: 4,
    agencyFeedback: 'Good service overall',
    categories: {
      responseTime: 4,
      candidateQuality: 4,
      communication: 4,
      professionalism: 4,
      compliance: 5,
    },
    wouldHireAgain: true,
    wouldRequestWorker: true,
    hadIssues: false,
    ratedBy: 'admin@sunshine.edu',
    ratedAt: '2024-01-09T10:30:00Z',
  },
  {
    id: 'rating-3',
    placementId: 'placement-3',
    agencyId: 'agency-2',
    agencyName: 'Premier Care Staff',
    workerId: 'worker-3',
    workerName: 'Emily Watson',
    centreId: 'centre-1',
    centreName: 'Sunshine Early Learning',
    shiftDate: '2024-01-05',
    agencyRating: 3,
    workerRating: 2,
    agencyFeedback: 'Slow to respond, candidate arrived late',
    workerFeedback: 'Arrived 30 minutes late, seemed unprepared',
    categories: {
      responseTime: 2,
      candidateQuality: 2,
      communication: 3,
      professionalism: 3,
      compliance: 4,
    },
    wouldHireAgain: false,
    wouldRequestWorker: false,
    hadIssues: true,
    issueDescription: 'Worker was 30 minutes late and did not have proper documentation ready',
    ratedBy: 'manager@sunshine.edu',
    ratedAt: '2024-01-06T08:00:00Z',
  },
  {
    id: 'rating-4',
    placementId: 'placement-4',
    agencyId: 'agency-3',
    agencyName: 'Quality Nursing Services',
    workerId: 'worker-4',
    workerName: 'James Lee',
    centreId: 'centre-2',
    centreName: 'Little Stars Academy',
    shiftDate: '2024-01-12',
    agencyRating: 5,
    workerRating: 5,
    categories: {
      responseTime: 5,
      candidateQuality: 5,
      communication: 5,
      professionalism: 5,
      compliance: 5,
    },
    wouldHireAgain: true,
    wouldRequestWorker: true,
    hadIssues: false,
    ratedBy: 'director@littlestars.edu',
    ratedAt: '2024-01-13T11:00:00Z',
  },
];

// In-memory store
let ratings: PlacementRating[] = [...mockRatings];

export function getAllRatings(): PlacementRating[] {
  return [...ratings];
}

export function getRatingsByAgency(agencyId: string): PlacementRating[] {
  return ratings.filter(r => r.agencyId === agencyId);
}

export function getRatingsByCentre(centreId: string): PlacementRating[] {
  return ratings.filter(r => r.centreId === centreId);
}

export function getRatingByPlacement(placementId: string): PlacementRating | null {
  return ratings.find(r => r.placementId === placementId) || null;
}

export function submitRating(rating: Omit<PlacementRating, 'id' | 'ratedAt'>): PlacementRating {
  const newRating: PlacementRating = {
    ...rating,
    id: `rating-${Date.now()}`,
    ratedAt: new Date().toISOString(),
  };
  ratings.push(newRating);
  return newRating;
}

export function getAgencyPerformanceMetrics(agencyId?: string): AgencyPerformanceMetrics[] {
  // Group by agency
  const agencyGroups = new Map<string, PlacementRating[]>();
  
  const relevantRatings = agencyId 
    ? ratings.filter(r => r.agencyId === agencyId)
    : ratings;
  
  relevantRatings.forEach(r => {
    const existing = agencyGroups.get(r.agencyId) || [];
    agencyGroups.set(r.agencyId, [...existing, r]);
  });
  
  const metrics: AgencyPerformanceMetrics[] = [];
  
  agencyGroups.forEach((agencyRatings, id) => {
    const agencyName = agencyRatings[0]?.agencyName || 'Unknown Agency';
    
    // Calculate averages
    const avgRating = agencyRatings.reduce((sum, r) => sum + r.agencyRating, 0) / agencyRatings.length;
    const avgResponseTime = agencyRatings.reduce((sum, r) => sum + r.categories.responseTime, 0) / agencyRatings.length;
    const avgCandidateQuality = agencyRatings.reduce((sum, r) => sum + r.categories.candidateQuality, 0) / agencyRatings.length;
    const avgCommunication = agencyRatings.reduce((sum, r) => sum + r.categories.communication, 0) / agencyRatings.length;
    const avgProfessionalism = agencyRatings.reduce((sum, r) => sum + r.categories.professionalism, 0) / agencyRatings.length;
    const avgCompliance = agencyRatings.reduce((sum, r) => sum + r.categories.compliance, 0) / agencyRatings.length;
    
    // Calculate rates
    const issueCount = agencyRatings.filter(r => r.hadIssues).length;
    const repeatHireCount = agencyRatings.filter(r => r.wouldHireAgain).length;
    
    // Mock trend data
    const trends = [
      { month: 'Aug', rating: 4.2, placements: 12, fillRate: 85, revenue: 8500 },
      { month: 'Sep', rating: 4.3, placements: 15, fillRate: 88, revenue: 10200 },
      { month: 'Oct', rating: 4.5, placements: 18, fillRate: 90, revenue: 12400 },
      { month: 'Nov', rating: 4.4, placements: 14, fillRate: 87, revenue: 9800 },
      { month: 'Dec', rating: 4.6, placements: 20, fillRate: 92, revenue: 14500 },
      { month: 'Jan', rating: avgRating, placements: agencyRatings.length, fillRate: 89, revenue: 11000 },
    ];
    
    // Get top workers
    const workerMap = new Map<string, { name: string; ratings: number[]; shifts: number }>();
    agencyRatings.forEach(r => {
      const existing = workerMap.get(r.workerId);
      if (existing) {
        existing.ratings.push(r.workerRating);
        existing.shifts++;
      } else {
        workerMap.set(r.workerId, { name: r.workerName, ratings: [r.workerRating], shifts: 1 });
      }
    });
    
    const topWorkers = Array.from(workerMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        rating: data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length,
        shiftsCompleted: data.shifts,
      }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
    
    metrics.push({
      agencyId: id,
      agencyName,
      overallRating: avgRating,
      totalPlacements: agencyRatings.length,
      totalShifts: agencyRatings.length * 1.2, // Mock slightly higher
      avgResponseTime: 15 + Math.random() * 30, // Mock 15-45 minutes
      avgCandidateQuality,
      avgCommunication,
      avgProfessionalism,
      avgCompliance,
      fillRate: 85 + Math.random() * 10,
      onTimeRate: 90 + Math.random() * 8,
      noShowRate: Math.random() * 5,
      repeatHireRate: (repeatHireCount / agencyRatings.length) * 100,
      issueRate: (issueCount / agencyRatings.length) * 100,
      trends,
      topWorkers,
      recentRatings: agencyRatings.slice(-5),
    });
  });
  
  // Add mock agencies without ratings
  if (!agencyId) {
    if (!metrics.find(m => m.agencyId === 'agency-4')) {
      metrics.push({
        agencyId: 'agency-4',
        agencyName: 'Rapid Response Staffing',
        overallRating: 3.2,
        totalPlacements: 8,
        totalShifts: 10,
        avgResponseTime: 45,
        avgCandidateQuality: 3.0,
        avgCommunication: 3.5,
        avgProfessionalism: 3.2,
        avgCompliance: 3.8,
        fillRate: 72,
        onTimeRate: 78,
        noShowRate: 8.5,
        repeatHireRate: 45,
        issueRate: 25,
        trends: [
          { month: 'Aug', rating: 3.0, placements: 5, fillRate: 70, revenue: 3200 },
          { month: 'Sep', rating: 3.1, placements: 6, fillRate: 72, revenue: 3800 },
          { month: 'Oct', rating: 3.3, placements: 7, fillRate: 75, revenue: 4200 },
          { month: 'Nov', rating: 3.2, placements: 4, fillRate: 68, revenue: 2800 },
          { month: 'Dec', rating: 3.4, placements: 8, fillRate: 78, revenue: 5000 },
          { month: 'Jan', rating: 3.2, placements: 3, fillRate: 72, revenue: 2100 },
        ],
        topWorkers: [],
        recentRatings: [],
      });
    }
  }
  
  return metrics.sort((a, b) => b.overallRating - a.overallRating);
}

export function getOverallAnalytics() {
  const allMetrics = getAgencyPerformanceMetrics();
  
  const totalPlacements = allMetrics.reduce((sum, m) => sum + m.totalPlacements, 0);
  const avgRating = allMetrics.reduce((sum, m) => sum + m.overallRating, 0) / allMetrics.length;
  const avgFillRate = allMetrics.reduce((sum, m) => sum + m.fillRate, 0) / allMetrics.length;
  const avgResponseTime = allMetrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / allMetrics.length;
  
  return {
    totalAgencies: allMetrics.length,
    totalPlacements,
    avgRating,
    avgFillRate,
    avgResponseTime,
    topPerformers: allMetrics.slice(0, 3),
    needsAttention: allMetrics.filter(m => m.overallRating < 3.5 || m.issueRate > 15),
  };
}
