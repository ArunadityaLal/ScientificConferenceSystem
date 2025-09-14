// src/components/forms/index.ts

// Export all form components for easy importing
export { FacultyForm } from './faculty-form';
export { SessionForm } from './session-form';
export { EventForm } from './event-form';
export { RegistrationForm } from './registration-form';
export { AttendanceForm } from './attendance-form';

// Re-export commonly used forms with aliases
export {
  FacultyForm as FacultyRegistrationForm,
  SessionForm as SessionCreationForm,
  EventForm as EventCreationForm,
  RegistrationForm as DelegateRegistrationForm,
  AttendanceForm as AttendanceManagementForm
} from './';

// Form type exports (if needed)
// export type { FacultyFormProps } from './faculty-form';
// export type { SessionFormProps } from './session-form';
// export type { EventFormProps } from './event-form';
// export type { RegistrationFormProps } from './registration-form';
// export type { AttendanceFormProps } from './attendance-form';