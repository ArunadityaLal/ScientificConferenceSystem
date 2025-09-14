// import { NextRequest, NextResponse } from 'next/server';
// import { z } from 'zod';
// import { prisma } from '@/lib/database/connection';
// import { withAuth, withRateLimit, validateBody, ApiError, successResponse, errorResponse } from '@/lib/api/middleware';
// import { QRAttendanceGenerator, QRAttendanceData } from '@/lib/qr/generator';

// // Validation schemas
// const generateQRSchema = z.object({
//   sessionId: z.string().min(1, 'Session ID is required'),
//   eventId: z.string().min(1, 'Event ID is required'),
//   expiryMinutes: z.number().min(1).max(180).optional().default(30),
//   size: z.number().min(100).max(1000).optional().default(300),
// });

// const markAttendanceSchema = z.object({
//   qrData: z.string().min(1, 'QR data is required'),
//   userId: z.string().optional(), // Optional if user is authenticated
//   userEmail: z.string().email().optional(),
//   userName: z.string().optional(),
// });

// const bulkGenerateSchema = z.object({
//   eventId: z.string().min(1, 'Event ID is required'),
//   sessionIds: z.array(z.string()).min(1, 'At least one session ID is required'),
//   expiryMinutes: z.number().min(1).max(180).optional().default(30),
// });

// // GET /api/attendance/qr - Generate QR code for session
// export async function GET(request: NextRequest) {
//   return withRateLimit(
//     withAuth(async (req, { user }) => {
//       try {
//         const { searchParams } = new URL(req.url);
//         const sessionId = searchParams.get('sessionId');
//         const eventId = searchParams.get('eventId');
//         const expiryMinutes = parseInt(searchParams.get('expiryMinutes') || '30');
//         const size = parseInt(searchParams.get('size') || '300');
//         const format = searchParams.get('format') || 'dataurl'; // dataurl, buffer, svg

//         if (!sessionId || !eventId) {
//           throw new ApiError(400, 'Session ID and Event ID are required');
//         }

//         // Validate session exists and user has permission
//         const session = await prisma.session.findFirst({
//           where: {
//             id: sessionId,
//             eventId: eventId,
//             event: {
//               OR: [
//                 { organizerId: user.id },
//                 { eventManagers: { some: { userId: user.id } } },
//                 { hallCoordinators: { some: { userId: user.id, sessionId: sessionId } } }
//               ]
//             }
//           },
//           include: {
//             hall: true,
//             event: true
//           }
//         });

//         if (!session) {
//           throw new ApiError(404, 'Session not found or access denied');
//         }

//         // Check if session is active (started but not ended)
//         const now = new Date();
//         const sessionStart = new Date(session.startTime);
//         const sessionEnd = new Date(session.endTime);

//         if (now < sessionStart || now > sessionEnd) {
//           throw new ApiError(400, 'QR codes can only be generated for active sessions');
//         }

//         // Generate QR code
//         const qrOptions = {
//           sessionId,
//           eventId,
//           hallId: session.hallId || undefined,
//           sessionName: session.title,
//           expiryMinutes,
//           size
//         };

//         let qrResult;
//         switch (format) {
//           case 'buffer':
//             const buffer = await QRAttendanceGenerator.generateQRCodeBuffer(qrOptions);
//             return new NextResponse(buffer, {
//               headers: {
//                 'Content-Type': 'image/png',
//                 'Content-Disposition': `inline; filename="qr-${session.title.replace(/\s+/g, '-')}.png"`
//               }
//             });

//           case 'svg':
//             const svg = await QRAttendanceGenerator.generateQRCodeSVG(qrOptions);
//             return new NextResponse(svg, {
//               headers: {
//                 'Content-Type': 'image/svg+xml'
//               }
//             });

//           default: // dataurl
//             const dataURL = await QRAttendanceGenerator.generateQRCodeDataURL(qrOptions);
//             const qrData = QRAttendanceGenerator.generateQRData(qrOptions);
            
//             qrResult = {
//               qrDataURL: dataURL,
//               qrData,
//               sessionInfo: {
//                 id: session.id,
//                 title: session.title,
//                 startTime: session.startTime,
//                 endTime: session.endTime,
//                 hallName: session.hall?.name,
//                 eventName: session.event.title
//               },
//               expiryInfo: QRAttendanceGenerator.getExpiryStatus(qrData)
//             };
//         }

//         // Log QR generation
//         await prisma.attendanceLog.create({
//           data: {
//             sessionId,
//             eventId,
//             userId: user.id,
//             action: 'QR_GENERATED',
//             metadata: {
//               expiryMinutes,
//               format,
//               generatedAt: new Date().toISOString()
//             }
//           }
//         });

//         return successResponse(qrResult, 'QR code generated successfully');

//       } catch (error) {
//         console.error('QR generation error:', error);
//         if (error instanceof ApiError) throw error;
//         throw new ApiError(500, 'Failed to generate QR code');
//       }
//     }, { 
//       requiredRoles: ['ORGANIZER', 'EVENT_MANAGER', 'HALL_COORDINATOR'] 
//     })
//   )(request);
// }

// // POST /api/attendance/qr - Mark attendance via QR scan
// export async function POST(request: NextRequest) {
//   return withRateLimit(
//     validateBody(markAttendanceSchema)(async (req, body) => {
//       try {
//         const { qrData, userId, userEmail, userName } = body;

//         // Validate QR data
//         const validation = QRAttendanceGenerator.validateQRData(qrData);
//         if (!validation.isValid || !validation.data) {
//           throw new ApiError(400, validation.error || 'Invalid QR code');
//         }

//         const attendanceData: QRAttendanceData = validation.data;

//         // Check if QR code is expired
//         const expiryStatus = QRAttendanceGenerator.getExpiryStatus(attendanceData);
//         if (expiryStatus.isExpired) {
//           throw new ApiError(400, 'QR code has expired');
//         }

//         // Validate session exists and is active
//         const session = await prisma.session.findFirst({
//           where: {
//             id: attendanceData.sessionId,
//             eventId: attendanceData.eventId
//           },
//           include: {
//             event: true,
//             hall: true
//           }
//         });

//         if (!session) {
//           throw new ApiError(404, 'Session not found');
//         }

//         // Check if session is currently active
//         const now = new Date();
//         const sessionStart = new Date(session.startTime);
//         const sessionEnd = new Date(session.endTime);

//         if (now < sessionStart) {
//           throw new ApiError(400, 'Session has not started yet');
//         }

//         if (now > sessionEnd) {
//           throw new ApiError(400, 'Session has already ended');
//         }

//         // Find or create user for attendance
//         let attendeeUserId = userId;
        
//         if (!attendeeUserId && userEmail) {
//           // Try to find existing user by email
//           let user = await prisma.user.findUnique({
//             where: { email: userEmail }
//           });

//           // If user doesn't exist, create a temporary user
//           if (!user) {
//             user = await prisma.user.create({
//               data: {
//                 email: userEmail,
//                 name: userName || userEmail.split('@')[0],
//                 role: 'DELEGATE',
//                 isVerified: false,
//                 isTemporary: true
//               }
//             });
//           }

//           attendeeUserId = user.id;
//         }

//         if (!attendeeUserId) {
//           throw new ApiError(400, 'User identification required');
//         }

//         // Check if attendance already marked
//         const existingAttendance = await prisma.attendance.findFirst({
//           where: {
//             sessionId: attendanceData.sessionId,
//             userId: attendeeUserId
//           }
//         });

//         if (existingAttendance) {
//           // Update existing attendance with QR scan time
//           await prisma.attendance.update({
//             where: { id: existingAttendance.id },
//             data: {
//               scannedAt: new Date(),
//               method: 'QR_SCAN',
//               metadata: {
//                 ...existingAttendance.metadata as any,
//                 qrScanTime: new Date().toISOString(),
//                 qrToken: attendanceData.token
//               }
//             }
//           });

//           return successResponse({
//             message: 'Attendance updated successfully',
//             sessionInfo: {
//               id: session.id,
//               title: session.title,
//               hallName: session.hall?.name,
//               eventName: session.event.title
//             },
//             attendanceTime: new Date().toISOString(),
//             isUpdate: true
//           }, 'Attendance marked via QR scan');
//         }

//         // Create new attendance record
//         const attendance = await prisma.attendance.create({
//           data: {
//             sessionId: attendanceData.sessionId,
//             userId: attendeeUserId,
//             eventId: attendanceData.eventId,
//             present: true,
//             scannedAt: new Date(),
//             method: 'QR_SCAN',
//             metadata: {
//               qrToken: attendanceData.token,
//               qrScanTime: new Date().toISOString(),
//               hallId: attendanceData.hallId
//             }
//           }
//         });

//         // Log attendance action
//         await prisma.attendanceLog.create({
//           data: {
//             sessionId: attendanceData.sessionId,
//             eventId: attendanceData.eventId,
//             userId: attendeeUserId,
//             action: 'QR_ATTENDANCE_MARKED',
//             metadata: {
//               qrToken: attendanceData.token,
//               attendanceId: attendance.id,
//               scanTime: new Date().toISOString()
//             }
//           }
//         });

//         // Get updated attendance count
//         const attendanceCount = await prisma.attendance.count({
//           where: {
//             sessionId: attendanceData.sessionId,
//             present: true
//           }
//         });

//         return successResponse({
//           message: 'Attendance marked successfully',
//           attendanceId: attendance.id,
//           sessionInfo: {
//             id: session.id,
//             title: session.title,
//             hallName: session.hall?.name,
//             eventName: session.event.title
//           },
//           attendanceTime: attendance.scannedAt,
//           totalAttendance: attendanceCount,
//           isUpdate: false
//         }, 'Attendance marked via QR scan');

//       } catch (error) {
//         console.error('QR attendance error:', error);
//         if (error instanceof ApiError) throw error;
//         throw new ApiError(500, 'Failed to mark attendance');
//       }
//     })
//   )(request);
// }

// // PUT /api/attendance/qr - Bulk generate QR codes for multiple sessions
// export async function PUT(request: NextRequest) {
//   return withRateLimit(
//     withAuth(
//       validateBody(bulkGenerateSchema)(async (req, body, { user }) => {
//         try {
//           const { eventId, sessionIds, expiryMinutes } = body;

//           // Validate event access
//           const event = await prisma.event.findFirst({
//             where: {
//               id: eventId,
//               OR: [
//                 { organizerId: user.id },
//                 { eventManagers: { some: { userId: user.id } } }
//               ]
//             }
//           });

//           if (!event) {
//             throw new ApiError(404, 'Event not found or access denied');
//           }

//           // Get sessions
//           const sessions = await prisma.session.findMany({
//             where: {
//               id: { in: sessionIds },
//               eventId: eventId
//             },
//             include: {
//               hall: true
//             }
//           });

//           if (sessions.length !== sessionIds.length) {
//             throw new ApiError(400, 'Some sessions not found');
//           }

//           // Generate QR codes for all sessions
//           const qrResults = await QRAttendanceGenerator.generateBulkQRCodes(
//             sessions.map(session => ({
//               sessionId: session.id,
//               eventId: eventId,
//               hallId: session.hallId || undefined,
//               sessionName: session.title
//             })),
//             { expiryMinutes }
//           );

//           // Log bulk generation
//           await prisma.attendanceLog.createMany({
//             data: sessionIds.map(sessionId => ({
//               sessionId,
//               eventId,
//               userId: user.id,
//               action: 'BULK_QR_GENERATED',
//               metadata: {
//                 expiryMinutes,
//                 generatedAt: new Date().toISOString()
//               }
//             }))
//           });

//           return successResponse({
//             qrCodes: qrResults.map((result, index) => ({
//               ...result,
//               sessionInfo: {
//                 id: sessions[index].id,
//                 title: sessions[index].title,
//                 startTime: sessions[index].startTime,
//                 endTime: sessions[index].endTime,
//                 hallName: sessions[index].hall?.name
//               }
//             }))
//           }, `Generated QR codes for ${qrResults.length} sessions`);

//         } catch (error) {
//           console.error('Bulk QR generation error:', error);
//           if (error instanceof ApiError) throw error;
//           throw new ApiError(500, 'Failed to generate bulk QR codes');
//         }
//       })
//     , { requiredRoles: ['ORGANIZER', 'EVENT_MANAGER'] })
//   )(request);
// }

// // DELETE /api/attendance/qr - Invalidate QR codes (emergency stop)
// export async function DELETE(request: NextRequest) {
//   return withRateLimit(
//     withAuth(async (req, { user }) => {
//       try {
//         const { searchParams } = new URL(req.url);
//         const sessionId = searchParams.get('sessionId');
//         const eventId = searchParams.get('eventId');

//         if (!sessionId || !eventId) {
//           throw new ApiError(400, 'Session ID and Event ID are required');
//         }

//         // Validate permission
//         const session = await prisma.session.findFirst({
//           where: {
//             id: sessionId,
//             eventId: eventId,
//             event: {
//               OR: [
//                 { organizerId: user.id },
//                 { eventManagers: { some: { userId: user.id } } }
//               ]
//             }
//           }
//         });

//         if (!session) {
//           throw new ApiError(404, 'Session not found or access denied');
//         }

//         // Log QR invalidation
//         await prisma.attendanceLog.create({
//           data: {
//             sessionId,
//             eventId,
//             userId: user.id,
//             action: 'QR_INVALIDATED',
//             metadata: {
//               invalidatedAt: new Date().toISOString(),
//               reason: 'Manual invalidation'
//             }
//           }
//         });

//         return successResponse(
//           { message: 'QR codes invalidated successfully' },
//           'QR codes have been invalidated for security'
//         );

//       } catch (error) {
//         console.error('QR invalidation error:', error);
//         if (error instanceof ApiError) throw error;
//         throw new ApiError(500, 'Failed to invalidate QR codes');
//       }
//     }, { requiredRoles: ['ORGANIZER', 'EVENT_MANAGER'] })
//   )(request);
// }