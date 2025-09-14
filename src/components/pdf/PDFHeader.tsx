// src/components/pdf/PDFHeader.tsx
import React from 'react';
import { Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { pdfStyles, colors } from '@/lib/pdf/styles';

interface PDFHeaderProps {
  title: string;
  subtitle?: string;
  date?: string;
  logo?: string;
  organizationName?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  showDivider?: boolean;
}

// Header-specific styles
const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 25,
    paddingBottom: 20,
    alignItems: 'flex-start',
  },
  
  containerWithDivider: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    borderBottomStyle: 'solid',
  },
  
  logoSection: {
    width: 80,
    marginRight: 20,
    alignItems: 'center',
  },
  
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  
  logoImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  
  contentSection: {
    flex: 1,
  },
  
  titleSection: {
    marginBottom: 8,
  },
  
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    lineHeight: 1.2,
    marginBottom: 4,
  },
  
  subtitle: {
    fontSize: 16,
    color: colors.gray[600],
    marginBottom: 2,
  },
  
  organizationName: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  
  metaSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  
  dateSection: {
    alignItems: 'flex-start',
  },
  
  dateLabel: {
    fontSize: 10,
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  
  dateValue: {
    fontSize: 12,
    color: colors.gray[700],
    fontWeight: 'bold',
  },
  
  contactSection: {
    alignItems: 'flex-end',
  },
  
  contactInfo: {
    fontSize: 10,
    color: colors.gray[600],
    marginBottom: 2,
    textAlign: 'right',
  },
  
  contactLabel: {
    fontSize: 9,
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'right',
  },
  
  // Minimal header styles
  minimalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300],
    borderBottomStyle: 'solid',
  },
  
  minimalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  
  minimalDate: {
    fontSize: 11,
    color: colors.gray[600],
  },
  
  // Compact header styles
  compactContainer: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    borderBottomStyle: 'solid',
  },
  
  compactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  
  compactSubtitle: {
    fontSize: 12,
    color: colors.gray[600],
    textAlign: 'center',
  },
});

export const PDFHeader: React.FC<PDFHeaderProps> = ({
  title,
  subtitle,
  date,
  logo,
  organizationName = "Conference Management System",
  contactInfo,
  showDivider = true
}) => {
  
  // Render logo section
  const renderLogo = () => {
    if (logo) {
      return (
        <View style={headerStyles.logoSection}>
          <Image src={logo} style={headerStyles.logoImage} />
        </View>
      );
    }
    
    // Default logo with initials
    const initials = organizationName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
    
    return (
      <View style={headerStyles.logoSection}>
        <View style={headerStyles.logo}>
          <Text style={headerStyles.logoText}>{initials}</Text>
        </View>
      </View>
    );
  };
  
  // Render contact information
  const renderContactInfo = () => {
    if (!contactInfo) return null;
    
    return (
      <View style={headerStyles.contactSection}>
        <Text style={headerStyles.contactLabel}>Contact</Text>
        {contactInfo.email && (
          <Text style={headerStyles.contactInfo}>
            📧 {contactInfo.email}
          </Text>
        )}
        {contactInfo.phone && (
          <Text style={headerStyles.contactInfo}>
            📞 {contactInfo.phone}
          </Text>
        )}
        {contactInfo.website && (
          <Text style={headerStyles.contactInfo}>
            🌐 {contactInfo.website}
          </Text>
        )}
      </View>
    );
  };
  
  // Main header layout
  const renderMainHeader = () => (
    <View style={[
      headerStyles.container,
      ...(showDivider ? [headerStyles.containerWithDivider] : [])
    ]}>
      {/* Logo Section */}
      {renderLogo()}
      
      {/* Content Section */}
      <View style={headerStyles.contentSection}>
        {/* Organization Name */}
        <Text style={headerStyles.organizationName}>
          {organizationName}
        </Text>
        
        {/* Title & Subtitle */}
        <View style={headerStyles.titleSection}>
          <Text style={headerStyles.title}>{title}</Text>
          {subtitle && (
            <Text style={headerStyles.subtitle}>{subtitle}</Text>
          )}
        </View>
        
        {/* Meta Information */}
        <View style={headerStyles.metaSection}>
          {/* Date Section */}
          {date && (
            <View style={headerStyles.dateSection}>
              <Text style={headerStyles.dateLabel}>Generated On</Text>
              <Text style={headerStyles.dateValue}>{date}</Text>
            </View>
          )}
          
          {/* Contact Information */}
          {renderContactInfo()}
        </View>
      </View>
    </View>
  );
  
  // Minimal header for continuation pages
  const renderMinimalHeader = () => (
    <View style={headerStyles.minimalContainer}>
      <Text style={headerStyles.minimalTitle}>{title}</Text>
      {date && (
        <Text style={headerStyles.minimalDate}>{date}</Text>
      )}
    </View>
  );
  
  // Compact header for multi-page documents
  const renderCompactHeader = () => (
    <View style={headerStyles.compactContainer}>
      <Text style={headerStyles.compactTitle}>{title}</Text>
      {subtitle && (
        <Text style={headerStyles.compactSubtitle}>{subtitle}</Text>
      )}
    </View>
  );
  
  // Default to main header
  return renderMainHeader();
};

// Header variants for different use cases
export const MinimalPDFHeader: React.FC<Pick<PDFHeaderProps, 'title' | 'date'>> = ({
  title,
  date
}) => (
  <View style={headerStyles.minimalContainer}>
    <Text style={headerStyles.minimalTitle}>{title}</Text>
    {date && (
      <Text style={headerStyles.minimalDate}>{date}</Text>
    )}
  </View>
);

export const CompactPDFHeader: React.FC<Pick<PDFHeaderProps, 'title' | 'subtitle'>> = ({
  title,
  subtitle
}) => (
  <View style={headerStyles.compactContainer}>
    <Text style={headerStyles.compactTitle}>{title}</Text>
    {subtitle && (
      <Text style={headerStyles.compactSubtitle}>{subtitle}</Text>
    )}
  </View>
);

// Footer component (bonus)
export const PDFFooter: React.FC<{
  text?: string;
  pageNumber?: number;
  totalPages?: number;
  showTimestamp?: boolean;
}> = ({
  text = "Conference Management System",
  pageNumber,
  totalPages,
  showTimestamp = true
}) => {
  const footerStyles = StyleSheet.create({
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
      borderTopColor: colors.gray[300],
      borderTopStyle: 'solid',
    },
    
    footerText: {
      fontSize: 10,
      color: colors.gray[600],
    },
    
    pageInfo: {
      fontSize: 10,
      color: colors.gray[600],
    }
  });
  
  const timestampText = showTimestamp 
    ? ` | Generated: ${new Date().toLocaleString()}`
    : '';
  
  const pageText = pageNumber && totalPages 
    ? `Page ${pageNumber} of ${totalPages}`
    : pageNumber 
    ? `Page ${pageNumber}`
    : '';
  
  return (
    <View style={footerStyles.footer}>
      <Text style={footerStyles.footerText}>
        {text}{timestampText}
      </Text>
      {pageText && (
        <Text style={footerStyles.pageInfo}>{pageText}</Text>
      )}
    </View>
  );
};