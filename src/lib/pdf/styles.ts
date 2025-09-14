// src/lib/pdf/styles.ts
import { StyleSheet } from '@react-pdf/renderer';

export const pdfStyles = StyleSheet.create({
  // Page Styles
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    borderBottomStyle: 'solid',
  },
  
  headerContent: {
    flex: 1,
  },
  
  logo: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 3,
  },
  
  // Event Card Styles
  eventCard: {
    marginBottom: 20,
    padding: 15,
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  
  eventInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  
  eventInfoLeft: {
    flex: 1,
    marginRight: 10,
  },
  
  eventInfoRight: {
    flex: 1,
  },
  
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  
  infoLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
    width: 80,
  },
  
  infoValue: {
    fontSize: 11,
    color: '#111827',
    flex: 1,
  },
  
  // Status Badge Styles
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    alignSelf: 'flex-start',
  },
  
  statusDraft: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  
  statusPublished: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  
  statusActive: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  
  statusCompleted: {
    backgroundColor: '#e5e7eb',
    color: '#374151',
  },
  
  statusCancelled: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  
  // Description Styles
  description: {
    fontSize: 11,
    color: '#4b5563',
    lineHeight: 1.4,
    marginTop: 8,
  },
  
  // Session Styles
  sessionsSection: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
  },
  
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  
  sessionItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingVertical: 4,
  },
  
  sessionTime: {
    fontSize: 10,
    color: '#6b7280',
    width: 80,
  },
  
  sessionTitle: {
    fontSize: 10,
    color: '#111827',
    flex: 1,
  },
  
  sessionHall: {
    fontSize: 10,
    color: '#9ca3af',
    width: 100,
    textAlign: 'right',
  },
  
  // Footer Styles
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
  },
  
  footerText: {
    fontSize: 10,
    color: '#6b7280',
  },
  
  pageNumber: {
    fontSize: 10,
    color: '#6b7280',
  },
  
  // Statistics Styles
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
    paddingVertical: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  
  statItem: {
    alignItems: 'center',
  },
  
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 2,
  },
  
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
  
  // Faculty Styles
  facultySection: {
    marginTop: 10,
  },
  
  facultyItem: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'center',
  },
  
  facultyName: {
    fontSize: 10,
    color: '#111827',
    flex: 1,
  },
  
  facultyRole: {
    fontSize: 9,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  
  // Table Styles
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginVertical: 10,
  },
  
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f9fafb',
    padding: 8,
  },
  
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 8,
  },
  
  tableCellHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
  },
  
  tableCell: {
    fontSize: 10,
    color: '#111827',
  },
  
  // Utility Styles
  flexRow: {
    flexDirection: 'row',
  },
  
  flexColumn: {
    flexDirection: 'column',
  },
  
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  alignCenter: {
    alignItems: 'center',
  },
  
  textCenter: {
    textAlign: 'center',
  },
  
  textRight: {
    textAlign: 'right',
  },
  
  mb10: {
    marginBottom: 10,
  },
  
  mb20: {
    marginBottom: 20,
  },
  
  mt10: {
    marginTop: 10,
  },
  
  mt20: {
    marginTop: 20,
  },
});

// Color Palette
export const colors = {
  primary: '#2563eb',
  primaryLight: '#dbeafe',
  secondary: '#6b7280',
  success: '#059669',
  successLight: '#d1fae5',
  warning: '#d97706',
  warningLight: '#fef3c7',
  error: '#dc2626',
  errorLight: '#fee2e2',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

// Typography
export const typography = {
  h1: { fontSize: 24, fontWeight: 'bold' },
  h2: { fontSize: 20, fontWeight: 'bold' },
  h3: { fontSize: 16, fontWeight: 'bold' },
  h4: { fontSize: 14, fontWeight: 'bold' },
  h5: { fontSize: 12, fontWeight: 'bold' },
  body: { fontSize: 11 },
  small: { fontSize: 10 },
  caption: { fontSize: 9 },
};