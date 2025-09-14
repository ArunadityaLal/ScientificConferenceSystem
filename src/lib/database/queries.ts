// // src/lib/database/queries.ts
// import { prisma } from './connection';
// import { Prisma, EventRole, UserRole } from '@prisma/client';

// // Event-related queries
// export const eventQueries = {
//   // Get events with role-based filtering
//   async getEventsByUser(userId: string, filters: {
//     page?: number;
//     limit?: number;
//     status?: string;
//     search?: string;
//     sortBy?: string;
//     sortOrder?: 'asc' | 'desc';
//   } = {}) {
//     const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
//     const skip = (page - 1) * limit;

//     const where: Prisma.EventWhereInput = {
//       userEvents: {
//         some: {
//           userId,
//           permissions: { has: 'READ' }
//         }
//       }
//     };

//     if (status) {
//       where.status = status as any;
//     }

//     if (search) {
//       where.OR = [
//         { name: { contains: search, mode: 'insensitive' } },
//         { description: { contains: search, mode: 'insensitive' } },
//         { location: { contains: search, mode: 'insensitive' } },
//       ];
//     }

//     const [events, total] = await Promise.all([
//       prisma.event.findMany({
//         where,
//         skip,
//         take: limit,
//         orderBy: { [sortBy]: sortOrder },
//         include: {
//           createdByUser: { select: { id: true, name: true, email: true } },
//           _count: { select: { sessions: true, registrations: true, userEvents: true } }
//         }
//       }),
//       prisma.event.count({ where })
//     ]);

//     return { events, total, pages: Math.ceil(total / limit) };
//   },

//   // Get event with full details
//   async getEventWithDetails(eventId: string, userId?: string) {
//     const include: Prisma.EventInclude = {
//       createdBy: { select: { id: true, name: true, email: true, phone: true } },
//       sessions: {
//         include: {
//           sessionSpeakers: {
//             include: {
//               user: { select: { id: true, name: true, email: true } }
//             }
//           },
//           hall: { select: { id: true, name: true, capacity: true } },
//           presentations: { select: { id: true, title: true, filePath: true, uploadedAt: true } }
//         },
//         orderBy: { startTime: 'asc' }
//       },
//       halls: { select: { id: true, name: true, capacity: true, equipment: true } },
//       _count: { select: { sessions: true, registrations: true, userEvents: true, abstracts: true } }
//     };

//     // Include user-specific data if userId provided
//     if (userId) {
//       include.userEvents = {
//         include: {
//           user: { select: { id: true, name: true, email: true, role: true } }
//         }
//       };
//       include.registrations = {
//         include: {
//           user: { select: { id: true, name: true, email: true, role: true } }
//         },
//         where: { status: 'APPROVED' }
//       };
//     }

//     return await prisma.event.findUnique({
//       where: { id: eventId },
//       include
//     });
//   },

//   // Check user permissions for event
//   async getUserEventPermissions(userId: string, eventId: string) {
//     return await prisma.userEvent.findFirst({
//       where: { userId, eventId },
//       select: { role: true, permissions: true }
//     });
//   },

//   // Get event statistics
//   async getEventStats(eventId: string) {
//     const [
//       totalSessions,
//       totalFaculty,
//       totalRegistrations,
//       approvedRegistrations,
//       pendingApprovals,
//       todaysSessions,
//       upcomingSessions
//     ] = await Promise.all([
//       prisma.session.count({ where: { event: { id: eventId } } }),
//       prisma.userEvent.count({ 
//         where: { 
//           eventId, 
//           role: { in: ['FACULTY', 'SPEAKER', 'MODERATOR', 'CHAIRPERSON'] } 
//         } 
//       }),
//       prisma.registration.count({ where: { eventId } }),
//       prisma.registration.count({ where: { eventId, status: 'APPROVED' } }),
//       prisma.registration.count({ where: { eventId, status: 'PENDING' } }),
//       prisma.session.count({
//         where: {
//           eventId,
//           startTime: {
//             gte: new Date(new Date().setHours(0, 0, 0, 0)),
//             lt: new Date(new Date().setHours(23, 59, 59, 999))
//           }
//         }
//       }),
//       prisma.session.count({
//         where: {
//           eventId,
//           startTime: { gt: new Date() }
//         }
//       })
//     ]);

//     return {
//       totalSessions,
//       totalFaculty,
//       totalRegistrations,
//       approvedRegistrations,
//       pendingApprovals,
//       todaysSessions,
//       upcomingSessions,
//       registrationRate: totalRegistrations > 0 ? (approvedRegistrations / totalRegistrations) * 100 : 0
//     };
//   }
// };

// // Faculty-related queries
// export const facultyQueries = {
//   // Get faculty with event associations
//   async getFacultyByEvent(eventId: string, filters: {
//     page?: number;
//     limit?: number;
//     search?: string;
//     role?: string;
//     institution?: string;
//   } = {}) {
//     const { page = 1, limit = 10, search, role, institution } = filters;
//     const skip = (page - 1) * limit;

//     const where: Prisma.UserWhereInput = {
//       userEvents: {
//         some: { eventId }
//       },
//       role: { in: [EventRole.SPEAKER, EventRole.MODERATOR, EventRole.CHAIRPERSON] as unknown as UserRole[] }
//     };

//     if (search) {
//       where.OR = [
//         { name: { contains: search, mode: 'insensitive' } },
//         { email: { contains: search, mode: 'insensitive' } },
//         { institution: { contains: search, mode: 'insensitive' } },
//         { specialization: { contains: search, mode: 'insensitive' } },
//       ];
//     }

//     if (institution) {
//       where.institution = { contains: institution, mode: 'insensitive' };
//     }

//     const [faculty, total] = await Promise.all([
//       prisma.user.findMany({
//         where,
//         skip,
//         take: limit,
//         include: {
//           userEvents: {
//             where: { eventId },
//             include: {
//               event: { select: { id: true, name: true, startDate: true, endDate: true } }
//             }
//           },
//           sessionSpeakers: {
//             include: {
//               session: {
//                 select: { 
//                   id: true, 
//                   title: true, 
//                   startTime: true, 
//                   endTime: true,
//                   hall: { select: { name: true } }
//                 }
//               }
//             }
//           },
//           travelDetails: { where: { eventId } },
//           accommodations: { where: { eventId } },
//           presentations: {
//             where: { session: { eventId } },
//             select: {
//               id: true,
//               title: true,
//               filePath: true,
//               uploadedAt: true,
//               session: { select: { title: true } }
//             }
//           }
//         }
//       }),
//       prisma.user.count({ where })
//     ]);

//     return { faculty, total, pages: Math.ceil(total / limit) };
//   },

//   // Get faculty profile with complete details
//   async getFacultyProfile(userId: string, eventId?: string) {
//     const include: Prisma.UserInclude = {
//       userEvents: {
//         where: eventId ? { eventId } : undefined,
//         include: {
//           event: { select: { id: true, name: true, startDate: true, endDate: true, status: true } }
//         }
//       },
//       sessionSpeakers: {
//         include: {
//           session: {
//             select: { 
//               id: true, 
//               title: true, 
//               startTime: true, 
//               endTime: true,
//               event: { select: { name: true } },
//               hall: { select: { name: true } }
//             }
//           }
//         }
//       },
//       presentations: {
//         select: {
//           id: true,
//           title: true,
//           filePath: true,
//           uploadedAt: true,
//           session: { 
//             select: { 
//               title: true, 
//               event: { select: { name: true } }
//             } 
//           }
//         }
//       },
//       travelDetails: { where: eventId ? { eventId } : undefined },
//       accommodations: { where: eventId ? { eventId } : undefined }
//     };

//     return await prisma.user.findUnique({
//       where: { id: userId },
//       include
//     });
//   },

//   // Get faculty statistics
//   async getFacultyStats(eventId?: string) {
//     const where = eventId ? { userEvents: { some: { eventId } } } : {};

//     const [
//       totalFaculty,
//       activeFaculty,
//       facultyWithCV,
//       facultyWithTravel,
//       facultyWithAccommodation,
//       pendingInvitations
//     ] = await Promise.all([
//       prisma.user.count({
//         where: {
//           ...where,
//           role: { in: ['FACULTY', 'SPEAKER', 'MODERATOR', 'CHAIRPERSON'] }
//         }
//       }),
//       prisma.user.count({
//         where: {
//           ...where,
//           role: { in: ['FACULTY', 'SPEAKER', 'MODERATOR', 'CHAIRPERSON'] },
//           emailVerified: { not: null }
//         }
//       }),
//       prisma.user.count({
//         where: {
//           ...where,
//           role: { in: ['FACULTY', 'SPEAKER', 'MODERATOR', 'CHAIRPERSON'] },
//           cvPath: { not: null }
//         }
//       }),
//       eventId ? prisma.travelDetail.count({ where: { eventId } }) : 0,
//       eventId ? prisma.accommodation.count({ where: { eventId } }) : 0,
//       eventId ? prisma.userEvent.count({
//         where: {
//           eventId,
//           status: 'PENDING',
//           role: { in: ['FACULTY', 'SPEAKER', 'MODERATOR', 'CHAIRPERSON'] }
//         }
//       }) : 0
//     ]);

//     return {
//       totalFaculty,
//       activeFaculty,
//       facultyWithCV,
//       facultyWithTravel,
//       facultyWithAccommodation,
//       pendingInvitations,
//       activationRate: totalFaculty > 0 ? (activeFaculty / totalFaculty) * 100 : 0,
//       cvUploadRate: totalFaculty > 0 ? (facultyWithCV / totalFaculty) * 100 : 0
//     };
//   }
// };

// // Session-related queries
// export const sessionQueries = {
//   // Get sessions with speakers and details
//   async getSessionsByEvent(eventId: string, filters: {
//     date?: string;
//     hallId?: string;
//     sessionType?: string;
//     speakerId?: string;
//   } = {}) {
//     const { date, hallId, sessionType, speakerId } = filters;

//     const where: Prisma.SessionWhereInput = { eventId };

//     if (date) {
//       const startOfDay = new Date(date);
//       startOfDay.setHours(0, 0, 0, 0);
//       const endOfDay = new Date(date);
//       endOfDay.setHours(23, 59, 59, 999);

//       where.startTime = { gte: startOfDay, lte: endOfDay };
//     }

//     if (hallId) {
//       where.hallId = hallId;
//     }

//     if (sessionType) {
//       where.sessionType = sessionType as any;
//     }

//     if (speakerId) {
//       where.speakers = { some: { userId: speakerId } };
//     }

//     return await prisma.session.findMany({
//       where,
//       orderBy: { startTime: 'asc' },
//       include: {
//         hall: { select: { id: true, name: true, capacity: true } },
//         speakers: {
//           include: {
//             user: {
//               select: { 
//                 id: true, 
//                 name: true, 
//                 email: true, 
//                 designation: true, 
//                 institution: true,
//                 profileImage: true 
//               }
//             }
//           }
//         },
//         presentations: {
//           select: { 
//             id: true, 
//             title: true, 
//             filePath: true, 
//             uploadedAt: true,
//             user: { select: { name: true } }
//           }
//         },
//         _count: {
//           select: { speakers: true, presentations: true, attendanceRecords: true }
//         }
//       }
//     });
//   },

//   // Check for schedule conflicts
//   async checkScheduleConflicts(sessionId: string | null, hallId: string, startTime: Date, endTime: Date) {
//     const where: Prisma.SessionWhereInput = {
//       hallId,
//       OR: [
//         {
//           startTime: { lt: endTime, gte: startTime }
//         },
//         {
//           endTime: { gt: startTime, lte: endTime }
//         },
//         {
//           startTime: { lte: startTime },
//           endTime: { gte: endTime }
//         }
//       ]
//     };

//     // Exclude current session if updating
//     if (sessionId) {
//       where.id = { not: sessionId };
//     }

//     return await prisma.session.findMany({
//       where,
//       select: { id: true, title: true, startTime: true, endTime: true }
//     });
//   },

//   // Get session statistics
//   async getSessionStats(eventId: string) {
//     const now = new Date();
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);

//     const [
//       totalSessions,
//       completedSessions,
//       upcomingSessions,
//       todaysSessions,
//       ongoingSessions,
//       sessionsWithPresentations,
//       averageAttendance
//     ] = await Promise.all([
//       prisma.session.count({ where: { eventId } }),
//       prisma.session.count({ 
//         where: { 
//           eventId, 
//           endTime: { lt: now } 
//         } 
//       }),
//       prisma.session.count({ 
//         where: { 
//           eventId, 
//           startTime: { gt: now } 
//         } 
//       }),
//       prisma.session.count({
//         where: {
//           eventId,
//           startTime: { gte: today, lt: tomorrow }
//         }
//       }),
//       prisma.session.count({
//         where: {
//           eventId,
//           startTime: { lte: now },
//           endTime: { gt: now }
//         }
//       }),
//       prisma.session.count({
//         where: {
//           eventId,
//           presentations: { some: {} }
//         }
//       }),
//       prisma.attendanceRecord.groupBy({
//         by: ['sessionId'],
//         where: {
//           session: { eventId }
//         },
//         _count: { userId: true }
//       }).then(results => {
//         const totalAttendance = results.reduce((sum, record) => sum + record._count.userId, 0);
//         return results.length > 0 ? totalAttendance / results.length : 0;
//       })
//     ]);

//     return {
//       totalSessions,
//       completedSessions,
//       upcomingSessions,
//       todaysSessions,
//       ongoingSessions,
//       sessionsWithPresentations,
//       averageAttendance,
//       completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
//       presentationRate: totalSessions > 0 ? (sessionsWithPresentations / totalSessions) * 100 : 0
//     };
//   }
// };

// // Attendance-related queries
// export const attendanceQueries = {
//   // Mark attendance
//   async markAttendance(sessionId: string, userId: string, markedBy: string, method: 'MANUAL' | 'QR' = 'MANUAL') {
//     // Check if already marked
//     const existing = await prisma.attendanceRecord.findFirst({
//       where: { sessionId, userId }
//     });

//     if (existing) {
//       return { success: false, message: 'Attendance already marked' };
//     }

//     const record = await prisma.attendanceRecord.create({
//       data: {
//         sessionId,
//         userId,
//         markedBy,
//         method,
//         timestamp: new Date()
//       },
//       include: {
//         user: { select: { name: true, email: true } },
//         session: { select: { title: true } }
//       }
//     });

//     return { success: true, data: record };
//   },

//   // Get attendance for session
//   async getSessionAttendance(sessionId: string) {
//     return await prisma.attendanceRecord.findMany({
//       where: { sessionId },
//       include: {
//         user: { 
//           select: { 
//             id: true, 
//             name: true, 
//             email: true, 
//             role: true,
//             institution: true 
//           } 
//         },
//         markedByUser: { select: { name: true } }
//       },
//       orderBy: { timestamp: 'asc' }
//     });
//   },

//   // Get user attendance summary
//   async getUserAttendanceSummary(userId: string, eventId?: string) {
//     const where: Prisma.AttendanceRecordWhereInput = { userId };
    
//     if (eventId) {
//       where.session = { eventId };
//     }

//     return await prisma.attendanceRecord.findMany({
//       where,
//       include: {
//         session: {
//           select: {
//             id: true,
//             title: true,
//             startTime: true,
//             endTime: true,
//             event: { select: { name: true } }
//           }
//         }
//       },
//       orderBy: { timestamp: 'desc' }
//     });
//   }
// };

// // Utility functions
// export const utilityQueries = {
//   // Get user dashboard stats
//   async getUserDashboardStats(userId: string, role: string) {
//     const baseStats = {
//       totalEvents: 0,
//       activeSessions: 0,
//       pendingTasks: 0,
//       recentActivity: []
//     };

//     switch (role) {
//       case 'ORGANIZER':
//         const [totalEvents, activeSessions, pendingApprovals] = await Promise.all([
//           prisma.event.count({ where: { createdBy: userId } }),
//           prisma.session.count({
//             where: {
//               event: { createdBy: userId },
//               startTime: { lte: new Date() },
//               endTime: { gt: new Date() }
//             }
//           }),
//           prisma.registration.count({
//             where: {
//               event: { createdBy: userId },
//               status: 'PENDING'
//             }
//           })
//         ]);

//         return {
//           ...baseStats,
//           totalEvents,
//           activeSessions,
//           pendingTasks: pendingApprovals
//         };

//       case 'FACULTY':
//         const [userEvents, userSessions, pendingPresentations] = await Promise.all([
//           prisma.userEvent.count({ where: { userId } }),
//           prisma.sessionSpeaker.count({
//             where: {
//               userId,
//               session: {
//                 startTime: { lte: new Date() },
//                 endTime: { gt: new Date() }
//               }
//             }
//           }),
//           prisma.sessionSpeaker.count({
//             where: {
//               userId,
//               session: {
//                 presentations: { none: { userId } }
//               }
//             }
//           })
//         ]);

//         return {
//           ...baseStats,
//           totalEvents: userEvents,
//           activeSessions: userSessions,
//           pendingTasks: pendingPresentations
//         };

//       default:
//         return baseStats;
//     }
//   }
// };