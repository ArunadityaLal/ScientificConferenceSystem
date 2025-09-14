// src/components/pdf/EventsPDFTemplate.tsx
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { pdfStyles, colors } from '@/lib/pdf/styles';
import { PDFHeader } from './PDFHeader';
import { EventCard } from './EventCard';
import { formatDate, formatDateTime } from '@/lib/utils/export';

interface EventsPDFTemplateProps {
  data: {
    event?: any;
    sessions?: any[];
    registrations?: any[];
    faculty?: any[];
    halls?: any[];
  };
  title?: string;
  subtitle?: string;
  isMultipleEvents?: boolean;
  events?: any[];
}

// Custom styles for this template
const templateStyles = StyleSheet.create({
  summarySection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: colors.gray[50],
    borderRadius: 6,
  },
  
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  
  summaryLabel: {
    fontSize: 11,
    color: colors.gray[600],
    textAlign: 'center',
  },
  
  sectionDivider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 15,
  },
  
  noDataText: {
    fontSize: 12,
    color: colors.gray[500],
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});

export const EventsPDFTemplate: React.FC<EventsPDFTemplateProps> = ({
  data,
  title = "Conference Management System",
  subtitle = "Event Export Report",
  isMultipleEvents = false,
  events = []
}) => {
  
  // Calculate summary statistics
  const stats = {
    totalEvents: isMultipleEvents ? events.length : (data.event ? 1 : 0),
    totalSessions: data.sessions?.length || 0,
    totalRegistrations: data.registrations?.length || 0,
    totalFaculty: data.faculty?.length || 0,
    totalHalls: data.halls?.length || 0,
  };
  
  // Render summary section
  const renderSummary = () => (
    <View style={templateStyles.summarySection}>
      <Text style={templateStyles.summaryTitle}>Executive Summary</Text>
      <View style={templateStyles.summaryGrid}>
        <View style={templateStyles.summaryItem}>
          <Text style={templateStyles.summaryValue}>{stats.totalEvents}</Text>
          <Text style={templateStyles.summaryLabel}>Event{stats.totalEvents !== 1 ? 's' : ''}</Text>
        </View>
        <View style={templateStyles.summaryItem}>
          <Text style={templateStyles.summaryValue}>{stats.totalSessions}</Text>
          <Text style={templateStyles.summaryLabel}>Session{stats.totalSessions !== 1 ? 's' : ''}</Text>
        </View>
        <View style={templateStyles.summaryItem}>
          <Text style={templateStyles.summaryValue}>{stats.totalRegistrations}</Text>
          <Text style={templateStyles.summaryLabel}>Registration{stats.totalRegistrations !== 1 ? 's' : ''}</Text>
        </View>
        <View style={templateStyles.summaryItem}>
          <Text style={templateStyles.summaryValue}>{stats.totalFaculty}</Text>
          <Text style={templateStyles.summaryLabel}>Faculty</Text>
        </View>
        <View style={templateStyles.summaryItem}>
          <Text style={templateStyles.summaryValue}>{stats.totalHalls}</Text>
          <Text style={templateStyles.summaryLabel}>Hall{stats.totalHalls !== 1 ? 's' : ''}</Text>
        </View>
      </View>
    </View>
  );
  
  // Render sessions table
  const renderSessions = () => {
    if (!data.sessions || data.sessions.length === 0) {
      return <Text style={templateStyles.noDataText}>No sessions available</Text>;
    }
    
    return (
      <View>
        <Text style={pdfStyles.sectionTitle}>Sessions Schedule</Text>
        <View style={pdfStyles.table}>
          {/* Table Header */}
          <View style={pdfStyles.tableRow}>
            <View style={pdfStyles.tableColHeader}>
              <Text style={pdfStyles.tableCellHeader}>Session Title</Text>
            </View>
            <View style={pdfStyles.tableColHeader}>
              <Text style={pdfStyles.tableCellHeader}>Start Time</Text>
            </View>
            <View style={pdfStyles.tableColHeader}>
              <Text style={pdfStyles.tableCellHeader}>End Time</Text>
            </View>
            <View style={pdfStyles.tableColHeader}>
              <Text style={pdfStyles.tableCellHeader}>Hall</Text>
            </View>
          </View>
          
          {/* Table Rows */}
          {data.sessions.map((session, index) => (
            <View style={pdfStyles.tableRow} key={index}>
              <View style={pdfStyles.tableCol}>
                <Text style={pdfStyles.tableCell}>{session.title || 'Untitled Session'}</Text>
              </View>
              <View style={pdfStyles.tableCol}>
                <Text style={pdfStyles.tableCell}>{formatDateTime(session.startTime)}</Text>
              </View>
              <View style={pdfStyles.tableCol}>
                <Text style={pdfStyles.tableCell}>{formatDateTime(session.endTime)}</Text>
              </View>
              <View style={pdfStyles.tableCol}>
                <Text style={pdfStyles.tableCell}>{session.hall?.name || 'TBD'}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  // Render faculty list
  const renderFaculty = () => {
    if (!data.faculty || data.faculty.length === 0) {
      return <Text style={templateStyles.noDataText}>No faculty information available</Text>;
    }
    
    return (
      <View>
        <Text style={pdfStyles.sectionTitle}>Faculty & Speakers</Text>
        {data.faculty.map((faculty, index) => (
          <View key={index} style={pdfStyles.facultyItem}>
            <View style={{ flex: 1 }}>
              <Text style={pdfStyles.facultyName}>{faculty.name || 'Unknown'}</Text>
              <Text style={pdfStyles.facultyRole}>{faculty.institution || 'Institution not specified'}</Text>
            </View>
            <View style={pdfStyles.facultyRole}>
              <Text>{faculty.role || 'Speaker'}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };
  
  // Render registrations summary
  const renderRegistrations = () => {
    if (!data.registrations || data.registrations.length === 0) {
      return <Text style={templateStyles.noDataText}>No registration data available</Text>;
    }
    
    // Group registrations by status
    const groupedRegs = data.registrations.reduce((acc: any, reg: any) => {
      const status = reg.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    return (
      <View>
        <Text style={pdfStyles.sectionTitle}>Registration Summary</Text>
        <View style={pdfStyles.statsContainer}>
          {Object.entries(groupedRegs).map(([status, count]) => (
            <View key={status} style={pdfStyles.statItem}>
              <Text style={pdfStyles.statValue}>{count as number}</Text>
              <Text style={pdfStyles.statLabel}>{status.toUpperCase()}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };
  
  // Render halls information
  const renderHalls = () => {
    if (!data.halls || data.halls.length === 0) {
      return <Text style={templateStyles.noDataText}>No hall information available</Text>;
    }
    
    return (
      <View>
        <Text style={pdfStyles.sectionTitle}>Venue Information</Text>
        {data.halls.map((hall, index) => (
          <View key={index} style={pdfStyles.infoRow}>
            <Text style={pdfStyles.infoLabel}>{hall.name || `Hall ${index + 1}`}:</Text>
            <Text style={pdfStyles.infoValue}>
              Capacity: {hall.capacity || 'Not specified'} | 
              Equipment: {hall.equipment ? Object.keys(hall.equipment).join(', ') : 'Basic setup'}
            </Text>
          </View>
        ))}
      </View>
    );
  };
  
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <PDFHeader 
          title={title}
          subtitle={subtitle}
          date={formatDate(new Date())}
        />
        
        {/* Summary Section */}
        {renderSummary()}
        
        {/* Event Details (Single Event) */}
        {data.event && !isMultipleEvents && (
          <View>
            <EventCard event={data.event} detailed={true} />
            <View style={templateStyles.sectionDivider} />
          </View>
        )}
        
        {/* Multiple Events */}
        {isMultipleEvents && events.length > 0 && (
          <View>
            <Text style={pdfStyles.sectionTitle}>Events Overview</Text>
            {events.map((event, index) => (
              <EventCard key={index} event={event} detailed={false} />
            ))}
            <View style={templateStyles.sectionDivider} />
          </View>
        )}
        
        {/* Sessions Section */}
        {data.sessions && data.sessions.length > 0 && (
          <View>
            {renderSessions()}
            <View style={templateStyles.sectionDivider} />
          </View>
        )}
      </Page>
      
      {/* Second Page for Additional Details */}
      {((data.faculty?.length ?? 0) > 0 || (data.registrations?.length ?? 0) > 0 || (data.halls?.length ?? 0) > 0) && (
        <Page size="A4" style={pdfStyles.page}>
          <PDFHeader 
            title={title}
            subtitle="Additional Details"
            date={formatDate(new Date())}
          />
          
          {/* Faculty Section */}
          {data.faculty && data.faculty.length > 0 && (
            <View style={pdfStyles.mb20}>
              {renderFaculty()}
            </View>
          )}
          
          {/* Registrations Section */}
          {data.registrations && data.registrations.length > 0 && (
            <View style={pdfStyles.mb20}>
              {renderRegistrations()}
            </View>
          )}
          
          {/* Halls Section */}
          {data.halls && data.halls.length > 0 && (
            <View style={pdfStyles.mb20}>
              {renderHalls()}
            </View>
          )}
          
          {/* Footer with Export Info */}
          <View style={pdfStyles.footer}>
            <Text style={pdfStyles.footerText}>
              Generated on {formatDateTime(new Date())} | Conference Management System
            </Text>
            <Text style={pdfStyles.pageNumber}>Page 2</Text>
          </View>
        </Page>
      )}
    </Document>
  );
};