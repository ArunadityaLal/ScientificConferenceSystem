// src/components/pdf/EventCard.tsx
import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { pdfStyles, colors } from '@/lib/pdf/styles';
import { formatDate, formatDateTime, formatTime, formatStatus } from '@/lib/utils/export';

interface EventCardProps {
  event: any;
  detailed?: boolean;
  showSessions?: boolean;
  showStats?: boolean;
}

// Additional styles specific to EventCard
const cardStyles = StyleSheet.create({
  eventCard: {
    marginBottom: 15,
    padding: 15,
    border: `1px solid ${colors.gray[200]}`,
    borderRadius: 8,
    backgroundColor: colors.gray[50],
  },
  
  eventCardDetailed: {
    marginBottom: 20,
    padding: 20,
    border: `2px solid ${colors.primary}`,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 8,
  },
  
  eventTitleDetailed: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  
  dateRange: {
    fontSize: 12,
    color: colors.gray[600],
    fontWeight: 'bold',
  },
  
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  
  infoColumn: {
    flex: 1,
    marginRight: 10,
  },
  
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  
  infoLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.gray[600],
    width: 80,
    minWidth: 80,
  },
  
  infoValue: {
    fontSize: 11,
    color: colors.gray[900],
    flex: 1,
    flexWrap: 'wrap',
  },
  
  description: {
    fontSize: 11,
    color: colors.gray[700],
    lineHeight: 1.4,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    borderTopStyle: 'solid',
  },
  
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    borderTopStyle: 'solid',
  },
  
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 2,
  },
  
  statLabel: {
    fontSize: 9,
    color: colors.gray[600],
    textAlign: 'center',
  },
  
  sessionsList: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    borderTopStyle: 'solid',
  },
  
  sessionsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.gray[800],
    marginBottom: 6,
  },
  
  sessionItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingVertical: 2,
  },
  
  sessionTime: {
    fontSize: 9,
    color: colors.gray[600],
    width: 60,
    marginRight: 8,
  },
  
  sessionTitle: {
    fontSize: 9,
    color: colors.gray[800],
    flex: 1,
  },
  
  sessionHall: {
    fontSize: 9,
    color: colors.gray[500],
    width: 60,
    textAlign: 'right',
  },
});

export const EventCard: React.FC<EventCardProps> = ({
  event,
  detailed = false,
  showSessions = false,
  showStats = false
}) => {
  
  // Get status-specific styling
  const getStatusStyle = (status: string) => {
    const baseStyle = { ...cardStyles.statusBadge };
    const textStyle = { ...cardStyles.statusText };
    
    switch (status?.toLowerCase()) {
      case 'draft':
        return {
          badge: { ...baseStyle, backgroundColor: colors.gray[200] },
          text: { ...textStyle, color: colors.gray[700] }
        };
      case 'published':
        return {
          badge: { ...baseStyle, backgroundColor: '#dcfce7' },
          text: { ...textStyle, color: '#166534' }
        };
      case 'active':
        return {
          badge: { ...baseStyle, backgroundColor: '#dbeafe' },
          text: { ...textStyle, color: '#1e40af' }
        };
      case 'completed':
        return {
          badge: { ...baseStyle, backgroundColor: '#f3f4f6' },
          text: { ...textStyle, color: '#374151' }
        };
      case 'cancelled':
        return {
          badge: { ...baseStyle, backgroundColor: '#fee2e2' },
          text: { ...textStyle, color: '#991b1b' }
        };
      default:
        return {
          badge: { ...baseStyle, backgroundColor: colors.gray[200] },
          text: { ...textStyle, color: colors.gray[700] }
        };
    }
  };
  
  const statusStyles = getStatusStyle(event.status);
  
  // Calculate date range
  const getDateRange = () => {
    const startDate = formatDate(event.startDate);
    const endDate = formatDate(event.endDate);
    
    if (startDate === endDate || startDate === 'Not specified' || endDate === 'Not specified') {
      return startDate;
    }
    
    return `${startDate} - ${endDate}`;
  };
  
  // Render basic info rows
  const renderInfoRow = (label: string, value: any, isDetailed = false) => {
    const displayValue = value || 'Not specified';
    
    return (
      <View style={cardStyles.infoRow}>
        <Text style={cardStyles.infoLabel}>{label}:</Text>
        <Text style={cardStyles.infoValue}>{displayValue}</Text>
      </View>
    );
  };
  
  // Render sessions if available
  const renderSessions = () => {
    if (!showSessions || !event.sessions || event.sessions.length === 0) {
      return null;
    }
    
    return (
      <View style={cardStyles.sessionsList}>
        <Text style={cardStyles.sessionsTitle}>
          Sessions ({event.sessions.length})
        </Text>
        {event.sessions.slice(0, 5).map((session: any, index: number) => (
          <View key={index} style={cardStyles.sessionItem}>
            <Text style={cardStyles.sessionTime}>
              {formatTime(session.startTime)}
            </Text>
            <Text style={cardStyles.sessionTitle}>
              {session.title || 'Untitled Session'}
            </Text>
            <Text style={cardStyles.sessionHall}>
              {session.hall?.name || 'TBD'}
            </Text>
          </View>
        ))}
        {event.sessions.length > 5 && (
          <Text style={cardStyles.sessionTitle}>
            ... and {event.sessions.length - 5} more sessions
          </Text>
        )}
      </View>
    );
  };
  
  // Render statistics
  const renderStats = () => {
    if (!showStats) return null;
    
    const stats = {
      sessions: event.sessions?.length || 0,
      registrations: event.registrations?.length || 0,
      faculty: event.faculty?.length || 0,
      halls: event.halls?.length || 0,
    };
    
    return (
      <View style={cardStyles.statsContainer}>
        <View style={cardStyles.statItem}>
          <Text style={cardStyles.statValue}>{stats.sessions}</Text>
          <Text style={cardStyles.statLabel}>Sessions</Text>
        </View>
        <View style={cardStyles.statItem}>
          <Text style={cardStyles.statValue}>{stats.registrations}</Text>
          <Text style={cardStyles.statLabel}>Registrations</Text>
        </View>
        <View style={cardStyles.statItem}>
          <Text style={cardStyles.statValue}>{stats.faculty}</Text>
          <Text style={cardStyles.statLabel}>Faculty</Text>
        </View>
        <View style={cardStyles.statItem}>
          <Text style={cardStyles.statValue}>{stats.halls}</Text>
          <Text style={cardStyles.statLabel}>Halls</Text>
        </View>
      </View>
    );
  };
  
  return (
    <View style={detailed ? cardStyles.eventCardDetailed : cardStyles.eventCard}>
      {/* Header with title and status */}
      <View style={cardStyles.statusContainer}>
        <Text style={detailed ? cardStyles.eventTitleDetailed : cardStyles.eventTitle}>
          {event.name || 'Untitled Event'}
        </Text>
        <View style={statusStyles.badge}>
          <Text style={statusStyles.text}>
            {formatStatus(event.status || 'draft')}
          </Text>
        </View>
      </View>
      
      {/* Date Range */}
      <Text style={cardStyles.dateRange}>
        {getDateRange()}
      </Text>
      
      {/* Event Information Grid */}
      <View style={cardStyles.infoGrid}>
        <View style={cardStyles.infoColumn}>
          {renderInfoRow('Location', event.location)}
          {renderInfoRow('Start Time', formatTime(event.startDate))}
          {detailed && renderInfoRow('Created', formatDate(event.createdAt))}
        </View>
        <View style={cardStyles.infoColumn}>
          {renderInfoRow('Max Participants', event.maxParticipants)}
          {renderInfoRow('End Time', formatTime(event.endDate))}
          {detailed && renderInfoRow('Updated', formatDate(event.updatedAt))}
        </View>
      </View>
      
      {/* Description (for detailed view) */}
      {detailed && event.description && (
        <Text style={cardStyles.description}>
          {event.description}
        </Text>
      )}
      
      {/* Sessions List */}
      {renderSessions()}
      
      {/* Statistics */}
      {renderStats()}
    </View>
  );
};