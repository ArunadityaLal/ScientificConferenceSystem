// src/lib/database/models/enums.ts

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum RegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum AttendanceMethod {
  MANUAL = 'MANUAL',
  QR_CODE = 'QR_CODE',
  AUTOMATIC = 'AUTOMATIC'
}

export enum NotificationStatus {
  SENT = 'SENT',
  PENDING = 'PENDING',
  FAILED = 'FAILED'
}

export enum SessionType {
  KEYNOTE = 'KEYNOTE',
  PRESENTATION = 'PRESENTATION',
  WORKSHOP = 'WORKSHOP',
  PANEL = 'PANEL',
  BREAK = 'BREAK',
  NETWORKING = 'NETWORKING'
}

export enum DocumentType {
  ABSTRACT = 'ABSTRACT',
  PRESENTATION = 'PRESENTATION',
  CERTIFICATE = 'CERTIFICATE',
  BROCHURE = 'BROCHURE'
}
