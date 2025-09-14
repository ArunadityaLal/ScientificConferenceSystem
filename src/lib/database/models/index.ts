// src/lib/database/models/index.ts
export * from './User'
export * from './enums'

// TODO: Create and export other model files as needed:
// export * from './Event'
// export * from './Session'
// export * from './Registration'
// export * from './Attendance'
// export * from './Abstract'
// export * from './Document'
// export * from './Notification'

// Re-export commonly used types and enums from other modules
export { UserRole } from '@/lib/auth/config'