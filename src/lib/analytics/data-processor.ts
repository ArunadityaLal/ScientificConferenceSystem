// src/lib/analytics/data-processor.ts

import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';

// Types for analytics data processing
export interface RawAttendanceData {
  sessionId: string;
  sessionName: string;
  userId: string;
  userName: string;
  userRole: string;
  checkInTime: Date | null;
  method: 'QR' | 'Manual';
  hall: string;
  capacity: number;
  sessionStartTime: Date;
  sessionEndTime: Date;
}

export interface RawSessionData {
  id: string;
  name: string;
  facultyId: string;
  facultyName: string;
  hall: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  capacity: number;
  attendanceCount: number;
  feedbackCount: number;
  avgRating: number;
  description?: string;
  tags?: string[];
}

export interface RawFeedbackData {
  sessionId: string;
  sessionName: string;
  userId: string;
  userName: string;
  rating: number;
  comment?: string;
  timestamp: Date;
  categories?: string[];
}

export interface ProcessedMetrics {
  attendance: AttendanceMetrics;
  sessions: SessionMetrics;
  faculty: FacultyMetrics;
  engagement: EngagementMetrics;
  trends: TrendMetrics;
}

export interface AttendanceMetrics {
  totalSessions: number;
  totalAttendees: number;
  avgAttendanceRate: number;
  peakAttendanceHour: string;
  checkInMethods: {
    qr: number;
    manual: number;
    percentage: { qr: number; manual: number };
  };
  punctuality: {
    onTime: number;
    late: number;
    percentage: { onTime: number; late: number };
  };
  hallUtilization: Record<string, {
    capacity: number;
    avgAttendance: number;
    utilizationRate: number;
    peakSession: string;
  }>;
  dailyTrends: Array<{
    date: string;
    sessions: number;
    attendance: number;
    rate: number;
  }>;
  hourlyDistribution: Array<{
    hour: string;
    checkIns: number;
    sessions: number;
  }>;
}

export interface SessionMetrics {
  totalSessions: number;
  avgRating: number;
  avgAttendanceRate: number;
  completionRate: number;
  popularSessions: Array<{
    id: string;
    name: string;
    attendanceRate: number;
    rating: number;
    faculty: string;
  }>;
  sessionsByCategory: Record<string, number>;
  durationAnalysis: {
    avgDuration: number;
    optimal: Array<{ duration: number; satisfaction: number }>;
  };
  feedback: {
    totalComments: number;
    sentiment: { positive: number; neutral: number; negative: number };
    commonThemes: Array<{ theme: string; mentions: number }>;
  };
}

export interface FacultyMetrics {
  totalFaculty: number;
  avgRating: number;
  avgSessionsPerFaculty: number;
  topPerformers: Array<{
    id: string;
    name: string;
    avgRating: number;
    totalSessions: number;
    avgAttendance: number;
    engagementScore: number;
  }>;
  performanceDistribution: {
    excellent: number; // 4.5+
    good: number; // 3.5-4.4
    average: number; // 2.5-3.4
    needsImprovement: number; // <2.5
  };
  specializations: Record<string, {
    facultyCount: number;
    avgRating: number;
    avgAttendance: number;
  }>;
}

export interface EngagementMetrics {
  overallScore: number;
  feedbackRate: number;
  interactionLevel: number;
  retentionRate: number;
  satisfactionIndex: number;
  participationTrends: Array<{
    metric: string;
    score: number;
    trend: 'up' | 'down' | 'stable';
  }>;
}

export interface TrendMetrics {
  growthRate: number;
  seasonality: Record<string, number>;
  predictions: Array<{
    metric: string;
    current: number;
    predicted: number;
    confidence: number;
  }>;
  correlations: Array<{
    factor1: string;
    factor2: string;
    correlation: number;
    significance: number;
  }>;
}

export class DataProcessor {
  
  /**
   * Process raw attendance data into comprehensive metrics
   */
  static processAttendanceData(rawData: RawAttendanceData[]): AttendanceMetrics {
    const totalSessions = new Set(rawData.map(d => d.sessionId)).size;
    const totalAttendees = rawData.filter(d => d.checkInTime).length;
    
    // Calculate attendance rate
    const totalCapacity = rawData.reduce((sum, d) => {
      const sessionCapacities = new Map();
      if (!sessionCapacities.has(d.sessionId)) {
        sessionCapacities.set(d.sessionId, d.capacity);
        return sum + d.capacity;
      }
      return sum;
    }, 0);
    
    const avgAttendanceRate = totalCapacity > 0 ? (totalAttendees / totalCapacity) * 100 : 0;

    // Check-in methods
    const qrCheckins = rawData.filter(d => d.method === 'QR' && d.checkInTime).length;
    const manualCheckins = totalAttendees - qrCheckins;
    
    // Punctuality analysis
    const onTimeAttendees = rawData.filter(d => 
      d.checkInTime && d.checkInTime <= d.sessionStartTime
    ).length;
    const lateAttendees = totalAttendees - onTimeAttendees;

    // Hall utilization
    const hallStats = rawData.reduce((acc, d) => {
      if (!acc[d.hall]) {
        acc[d.hall] = {
          capacity: d.capacity,
          attendances: [],
          sessions: new Set()
        };
      }
      if (d.checkInTime) {
        acc[d.hall].attendances.push(d);
      }
      acc[d.hall].sessions.add(d.sessionId);
      return acc;
    }, {} as Record<string, any>);

    const hallUtilization = Object.entries(hallStats).reduce((acc, [hall, stats]) => {
      const avgAttendance = stats.attendances.length / stats.sessions.size;
      acc[hall] = {
        capacity: stats.capacity,
        avgAttendance,
        utilizationRate: (avgAttendance / stats.capacity) * 100,
        peakSession: this.findPeakSession(rawData.filter(d => d.hall === hall))
      };
      return acc;
    }, {} as Record<string, any>);

    // Daily trends
    const dailyStats = rawData.reduce((acc, d) => {
      if (!d.checkInTime) return acc;
      
      const date = format(d.checkInTime, 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { sessions: new Set(), attendance: 0 };
      }
      acc[date].sessions.add(d.sessionId);
      acc[date].attendance++;
      return acc;
    }, {} as Record<string, any>);

    const dailyTrends = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      sessions: stats.sessions.size,
      attendance: stats.attendance,
      rate: (stats.attendance / stats.sessions.size) * 100
    }));

    // Hourly distribution
    const hourlyStats = rawData.reduce((acc, d) => {
      if (!d.checkInTime) return acc;
      
      const hour = format(d.checkInTime, 'HH:00');
      if (!acc[hour]) {
        acc[hour] = { checkIns: 0, sessions: new Set() };
      }
      acc[hour].checkIns++;
      acc[hour].sessions.add(d.sessionId);
      return acc;
    }, {} as Record<string, any>);

    const hourlyDistribution = Object.entries(hourlyStats).map(([hour, stats]) => ({
      hour,
      checkIns: stats.checkIns,
      sessions: stats.sessions.size
    }));

    // Find peak attendance hour
    const peakAttendanceHour = hourlyDistribution.reduce((peak, current) => 
      current.checkIns > peak.checkIns ? current : peak, 
      { hour: '09:00', checkIns: 0 }
    ).hour;

    return {
      totalSessions,
      totalAttendees,
      avgAttendanceRate: Math.round(avgAttendanceRate * 10) / 10,
      peakAttendanceHour,
      checkInMethods: {
        qr: qrCheckins,
        manual: manualCheckins,
        percentage: {
          qr: totalAttendees > 0 ? (qrCheckins / totalAttendees) * 100 : 0,
          manual: totalAttendees > 0 ? (manualCheckins / totalAttendees) * 100 : 0
        }
      },
      punctuality: {
        onTime: onTimeAttendees,
        late: lateAttendees,
        percentage: {
          onTime: totalAttendees > 0 ? (onTimeAttendees / totalAttendees) * 100 : 0,
          late: totalAttendees > 0 ? (lateAttendees / totalAttendees) * 100 : 0
        }
      },
      hallUtilization,
      dailyTrends,
      hourlyDistribution
    };
  }

  /**
   * Process session data into comprehensive metrics
   */
  static processSessionData(rawData: RawSessionData[], feedbackData: RawFeedbackData[]): SessionMetrics {
    const totalSessions = rawData.length;
    const avgRating = rawData.reduce((sum, s) => sum + (s.avgRating || 0), 0) / totalSessions;
    const avgAttendanceRate = rawData.reduce((sum, s) => 
      sum + (s.capacity > 0 ? (s.attendanceCount / s.capacity) * 100 : 0), 0
    ) / totalSessions;

    // Calculate completion rate (sessions that ended on time)
    const completedSessions = rawData.filter(s => 
      s.endTime && new Date() > s.endTime
    ).length;
    const completionRate = (completedSessions / totalSessions) * 100;

    // Popular sessions
    const popularSessions = rawData
      .sort((a, b) => (b.attendanceCount / b.capacity) - (a.attendanceCount / a.capacity))
      .slice(0, 10)
      .map(s => ({
        id: s.id,
        name: s.name,
        attendanceRate: s.capacity > 0 ? (s.attendanceCount / s.capacity) * 100 : 0,
        rating: s.avgRating || 0,
        faculty: s.facultyName
      }));

    // Sessions by category (based on tags)
    const sessionsByCategory = rawData.reduce((acc, s) => {
      const categories = s.tags || ['General'];
      categories.forEach(category => {
        acc[category] = (acc[category] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Duration analysis
    const durations = rawData
      .filter(s => s.startTime && s.endTime)
      .map(s => ({
        duration: (s.endTime.getTime() - s.startTime.getTime()) / (1000 * 60), // minutes
        satisfaction: s.avgRating || 0
      }));

    const avgDuration = durations.reduce((sum, d) => sum + d.duration, 0) / durations.length;
    const optimalDurations = durations.filter(d => d.satisfaction >= 4.0);

    // Feedback analysis
    const totalComments = feedbackData.length;
    const sentiment = this.analyzeSentiment(feedbackData);
    const commonThemes = this.extractCommonThemes(feedbackData);

    return {
      totalSessions,
      avgRating: Math.round(avgRating * 10) / 10,
      avgAttendanceRate: Math.round(avgAttendanceRate * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      popularSessions,
      sessionsByCategory,
      durationAnalysis: {
        avgDuration: Math.round(avgDuration),
        optimal: optimalDurations
      },
      feedback: {
        totalComments,
        sentiment,
        commonThemes
      }
    };
  }

  /**
   * Process faculty performance data
   */
  static processFacultyData(rawData: RawSessionData[]): FacultyMetrics {
    const facultyStats = rawData.reduce((acc, session) => {
      const facultyId = session.facultyId;
      if (!acc[facultyId]) {
        acc[facultyId] = {
          id: facultyId,
          name: session.facultyName,
          sessions: [],
          totalRating: 0,
          totalSessions: 0,
          totalAttendance: 0,
          totalCapacity: 0
        };
      }
      
      acc[facultyId].sessions.push(session);
      acc[facultyId].totalRating += session.avgRating || 0;
      acc[facultyId].totalSessions++;
      acc[facultyId].totalAttendance += session.attendanceCount;
      acc[facultyId].totalCapacity += session.capacity;
      
      return acc;
    }, {} as Record<string, any>);

    const facultyMetrics = Object.values(facultyStats).map((faculty: any) => {
      const avgRating = faculty.totalSessions > 0 ? faculty.totalRating / faculty.totalSessions : 0;
      const avgAttendance = faculty.totalCapacity > 0 ? (faculty.totalAttendance / faculty.totalCapacity) * 100 : 0;
      const engagementScore = (avgRating / 5) * 50 + (avgAttendance / 100) * 50;

      return {
        id: faculty.id,
        name: faculty.name,
        avgRating: Math.round(avgRating * 10) / 10,
        totalSessions: faculty.totalSessions,
        avgAttendance: Math.round(avgAttendance * 10) / 10,
        engagementScore: Math.round(engagementScore * 10) / 10
      };
    });

    const totalFaculty = facultyMetrics.length;
    const avgRating = facultyMetrics.reduce((sum, f) => sum + f.avgRating, 0) / totalFaculty;
    const avgSessionsPerFaculty = facultyMetrics.reduce((sum, f) => sum + f.totalSessions, 0) / totalFaculty;

    const topPerformers = [...facultyMetrics]
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 10);

    // Performance distribution
    const performanceDistribution = facultyMetrics.reduce((acc, f) => {
      if (f.avgRating >= 4.5) acc.excellent++;
      else if (f.avgRating >= 3.5) acc.good++;
      else if (f.avgRating >= 2.5) acc.average++;
      else acc.needsImprovement++;
      return acc;
    }, { excellent: 0, good: 0, average: 0, needsImprovement: 0 });

    return {
      totalFaculty,
      avgRating: Math.round(avgRating * 10) / 10,
      avgSessionsPerFaculty: Math.round(avgSessionsPerFaculty * 10) / 10,
      topPerformers,
      performanceDistribution,
      specializations: {} // Would be populated based on faculty specialization data
    };
  }

  /**
   * Calculate engagement metrics
   */
  static calculateEngagementMetrics(
    attendanceData: RawAttendanceData[],
    sessionData: RawSessionData[],
    feedbackData: RawFeedbackData[]
  ): EngagementMetrics {
    const totalAttendees = new Set(attendanceData.map(d => d.userId)).size;
    const totalSessions = sessionData.length;
    const totalFeedback = feedbackData.length;
    const totalPossibleAttendance = sessionData.reduce((sum, s) => sum + s.capacity, 0);
    const actualAttendance = attendanceData.filter(d => d.checkInTime).length;

    // Calculate metrics
    const feedbackRate = actualAttendance > 0 ? (totalFeedback / actualAttendance) * 100 : 0;
    const interactionLevel = sessionData.reduce((sum, s) => sum + (s.feedbackCount || 0), 0) / totalSessions;
    const retentionRate = this.calculateRetentionRate(attendanceData);
    const satisfactionIndex = feedbackData.reduce((sum, f) => sum + f.rating, 0) / totalFeedback * 20; // Scale to 100

    const overallScore = (feedbackRate * 0.3 + interactionLevel * 0.2 + retentionRate * 0.3 + satisfactionIndex * 0.2);

    return {
      overallScore: Math.round(overallScore * 10) / 10,
      feedbackRate: Math.round(feedbackRate * 10) / 10,
      interactionLevel: Math.round(interactionLevel * 10) / 10,
      retentionRate: Math.round(retentionRate * 10) / 10,
      satisfactionIndex: Math.round(satisfactionIndex * 10) / 10,
      participationTrends: this.calculateParticipationTrends(attendanceData, feedbackData)
    };
  }

  /**
   * Generate trend analysis and predictions
   */
  static generateTrendMetrics(historicalData: any[]): TrendMetrics {
    // This would implement more sophisticated trend analysis
    // For now, providing a basic structure
    
    const growthRate = this.calculateGrowthRate(historicalData);
    const seasonality = this.analyzeSeasonality(historicalData);
    const predictions = this.generatePredictions(historicalData);
    const correlations = this.findCorrelations(historicalData);

    return {
      growthRate: Math.round(growthRate * 10) / 10,
      seasonality,
      predictions,
      correlations
    };
  }

  /**
   * Export processed data in various formats
   */
  static exportData(data: ProcessedMetrics, format: 'json' | 'csv' | 'excel'): any {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      
      case 'csv':
        return this.convertToCSV(data);
      
      case 'excel':
        return this.convertToExcel(data);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Helper methods
  private static findPeakSession(hallData: RawAttendanceData[]): string {
    const sessionAttendance = hallData.reduce((acc, d) => {
      if (!d.checkInTime) return acc;
      acc[d.sessionName] = (acc[d.sessionName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(sessionAttendance).reduce((peak, [session, count]) => 
      count > peak.count ? { session, count } : peak,
      { session: '', count: 0 }
    ).session;
  }

  private static analyzeSentiment(feedbackData: RawFeedbackData[]): { positive: number; neutral: number; negative: number } {
    // Simple sentiment analysis based on ratings
    return feedbackData.reduce((acc, f) => {
      if (f.rating >= 4) acc.positive++;
      else if (f.rating >= 3) acc.neutral++;
      else acc.negative++;
      return acc;
    }, { positive: 0, neutral: 0, negative: 0 });
  }

  private static extractCommonThemes(feedbackData: RawFeedbackData[]): Array<{ theme: string; mentions: number }> {
    // Basic keyword extraction from comments
    const keywords = feedbackData
      .filter(f => f.comment)
      .flatMap(f => f.comment!.toLowerCase().split(/\s+/))
      .filter(word => word.length > 3); // Filter out short words

    const wordCount = keywords.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([theme, mentions]) => ({ theme, mentions }));
  }

  private static calculateRetentionRate(attendanceData: RawAttendanceData[]): number {
    // Calculate how many attendees stayed for multiple sessions
    const userSessions = attendanceData.reduce((acc, d) => {
      if (!d.checkInTime) return acc;
      if (!acc[d.userId]) {
        acc[d.userId] = new Set<string>();
      }
      acc[d.userId]!.add(d.sessionId);
      return acc;
    }, {} as Record<string, Set<string>>);

    const multiSessionAttendees = Object.values(userSessions).filter(sessions => sessions.size > 1).length;
    const totalAttendees = Object.keys(userSessions).length;

    return totalAttendees > 0 ? (multiSessionAttendees / totalAttendees) * 100 : 0;
  }

  private static calculateParticipationTrends(
    attendanceData: RawAttendanceData[], 
    feedbackData: RawFeedbackData[]
  ): Array<{ metric: string; score: number; trend: 'up' | 'down' | 'stable' }> {
    // This would implement trend calculation logic
    // For now, returning mock data structure
    return [
      { metric: 'Attendance Rate', score: 85, trend: 'up' },
      { metric: 'Feedback Rate', score: 72, trend: 'stable' },
      { metric: 'Session Completion', score: 91, trend: 'up' },
      { metric: 'User Retention', score: 78, trend: 'down' }
    ];
  }

  private static calculateGrowthRate(data: any[]): number {
    // Implement growth rate calculation
    return 15.5; // Mock value
  }

  private static analyzeSeasonality(data: any[]): Record<string, number> {
    // Implement seasonality analysis
    return {
      'Q1': 0.8,
      'Q2': 1.2,
      'Q3': 0.9,
      'Q4': 1.1
    };
  }

  private static generatePredictions(data: any[]): Array<{ metric: string; current: number; predicted: number; confidence: number }> {
    // Implement prediction logic
    return [
      { metric: 'Attendance Rate', current: 85, predicted: 88, confidence: 0.78 },
      { metric: 'Satisfaction Score', current: 4.2, predicted: 4.4, confidence: 0.85 }
    ];
  }

  private static findCorrelations(data: any[]): Array<{ factor1: string; factor2: string; correlation: number; significance: number }> {
    // Implement correlation analysis
    return [
      { factor1: 'Session Duration', factor2: 'Satisfaction', correlation: -0.32, significance: 0.05 },
      { factor1: 'Attendance Rate', factor2: 'Rating', correlation: 0.67, significance: 0.01 }
    ];
  }

  private static convertToCSV(data: ProcessedMetrics): string {
    // Implement CSV conversion
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Sessions', data.sessions.totalSessions.toString()],
      ['Avg Rating', data.sessions.avgRating.toString()],
      ['Avg Attendance Rate', data.attendance.avgAttendanceRate.toString()],
      // Add more rows as needed
    ];

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private static convertToExcel(data: ProcessedMetrics): any {
    // This would integrate with a library like ExcelJS
    // For now, returning a structured object that could be used with Excel libraries
    return {
      worksheets: [
        {
          name: 'Summary',
          data: [
            ['Metric', 'Value'],
            ['Total Sessions', data.sessions.totalSessions],
            ['Avg Rating', data.sessions.avgRating],
            ['Avg Attendance Rate', data.attendance.avgAttendanceRate]
          ]
        },
        {
          name: 'Attendance Details',
          data: data.attendance.dailyTrends
        },
        {
          name: 'Faculty Performance',
          data: data.faculty.topPerformers
        }
      ]
    };
  }
}