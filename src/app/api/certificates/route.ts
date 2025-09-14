// // src/app/api/certificates/route.ts

// import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();
// import { authConfig } from '@/lib/auth/config';
// import { z } from 'zod';

// // Validation schemas
// const CertificateCreateSchema = z.object({
//   eventId: z.string().min(1, 'Event ID is required'),
//   recipientId: z.string().min(1, 'Recipient ID is required'),
//   recipientName: z.string().min(1, 'Recipient name is required'),
//   role: z.enum(['Faculty', 'Delegate', 'Speaker', 'Chairperson', 'Moderator']),
//   sessionDetails: z.string().optional(),
//   templateId: z.string().optional(),
//   customData: z.record(z.string()).optional()
// });

// const BulkCertificateSchema = z.object({
//   eventId: z.string().min(1, 'Event ID is required'),
//   certificates: z.array(CertificateCreateSchema.omit({ eventId: true })),
//   templateId: z.string().optional(),
//   sendEmail: z.boolean().default(false)
// });

// const CertificateQuerySchema = z.object({
//   eventId: z.string().optional(),
//   recipientId: z.string().optional(),
//   role: z.string().optional(),
//   page: z.string().optional(),
//   limit: z.string().optional()
// });

// // GET - Fetch certificates
// export async function GET(request: NextRequest) {
//   try {
//     const session = await getServerSession(authConfig);
//     if (!session?.user) {
//       return NextResponse.json(
//         { error: 'Unauthorized' },
//         { status: 401 }
//       );
//     }

//     const { searchParams } = new URL(request.url);
//     const queryData = Object.fromEntries(searchParams.entries());
    
//     // Validate query parameters
//     const validatedQuery = CertificateQuerySchema.parse(queryData);
    
//     const page = parseInt(validatedQuery.page || '1');
//     const limit = parseInt(validatedQuery.limit || '10');
//     const skip = (page - 1) * limit;

//     // Build where clause
//     const whereClause: any = {};
    
//     if (validatedQuery.eventId) {
//       whereClause.eventId = validatedQuery.eventId;
//     }
    
//     if (validatedQuery.recipientId) {
//       whereClause.recipientId = validatedQuery.recipientId;
//     }
    
//     if (validatedQuery.role) {
//       whereClause.role = validatedQuery.role;
//     }

//     // Check user permissions
//     const user = await prisma.user.findUnique({
//       where: { id: session.user.id }
//     });

//     if (!user) {
//       return NextResponse.json(
//         { error: 'User not found' },
//         { status: 404 }
//       );
//     }

//     // Role-based filtering
//     if (user.role === 'Faculty' || user.role === 'Delegate') {
//       whereClause.recipientId = user.id;
//     } else if (user.role === 'Hall_Coordinator') {
//       // Hall coordinators can only see certificates for their events
//       const coordinatorEvents = await prisma.event.findMany({
//         where: { coordinatorId: user.id },
//         select: { id: true }
//       });
//       whereClause.eventId = {
//         in: coordinatorEvents.map((e: any) => e.id)
//       };
//     }

//     // Fetch certificates with related data
//     const [certificates, total] = await Promise.all([
//       prisma.certificate.findMany({
//         where: whereClause,
//         include: {
//           event: {
//             select: {
//               id: true,
//               name: true,
//               date: true,
//               location: true,
//               organizationName: true
//             }
//           },
//           recipient: {
//             select: {
//               id: true,
//               name: true,
//               email: true
//             }
//           }
//         },
//         orderBy: { createdAt: 'desc' },
//         skip,
//         take: limit
//       }),
//       prisma.certificate.count({ where: whereClause })
//     ]);

//     return NextResponse.json({
//       certificates,
//       pagination: {
//         total,
//         page,
//         limit,
//         pages: Math.ceil(total / limit)
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching certificates:', error);
    
//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { error: 'Invalid query parameters', details: error.errors },
//         { status: 400 }
//       );
//     }

//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // POST - Create certificate(s)
// export async function POST(request: NextRequest) {
//   try {
//     const session = await getServerSession(authConfig);
//     if (!session?.user) {
//       return NextResponse.json(
//         { error: 'Unauthorized' },
//         { status: 401 }
//       );
//     }

//     const body = await request.json();
//     const isBulk = Array.isArray(body.certificates);

//     // Check user permissions
//     const user = await prisma.user.findUnique({
//       where: { id: session.user.id }
//     });

//     if (!user || !['Organizer', 'Event_Manager'].includes(user.role)) {
//       return NextResponse.json(
//         { error: 'Insufficient permissions' },
//         { status: 403 }
//       );
//     }

//     if (isBulk) {
//       // Handle bulk certificate creation
//       const validatedData = BulkCertificateSchema.parse(body);
      
//       // Verify event exists and user has access
//       const event = await prisma.event.findFirst({
//         where: {
//           id: validatedData.eventId,
//           OR: [
//             { organizerId: user.id },
//             { managerId: user.id }
//           ]
//         }
//       });

//       if (!event) {
//         return NextResponse.json(
//           { error: 'Event not found or access denied' },
//           { status: 404 }
//         );
//       }

//       // Create certificates
//       const certificatePromises = validatedData.certificates.map(async (certData) => {
//         // Generate unique certificate ID
//         const certificateId = `CERT-${event.id}-${certData.recipientId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
        
//         return prisma.certificate.create({
//           data: {
//             id: certificateId,
//             eventId: validatedData.eventId,
//             recipientId: certData.recipientId,
//             recipientName: certData.recipientName,
//             role: certData.role,
//             sessionDetails: certData.sessionDetails,
//             templateId: validatedData.templateId || 'modern',
//             customData: certData.customData || {},
//             issuedBy: user.id,
//             status: 'Generated'
//           },
//           include: {
//             event: true,
//             recipient: true
//           }
//         });
//       });

//       const certificates = await Promise.all(certificatePromises);

//       // Send email notifications if requested
//       if (validatedData.sendEmail) {
//         // Queue email notifications (implement based on your email system)
//         await queueCertificateEmails(certificates);
//       }

//       return NextResponse.json(
//         { 
//           message: `${certificates.length} certificates created successfully`,
//           certificates: certificates.map(cert => ({
//             id: cert.id,
//             recipientName: cert.recipientName,
//             role: cert.role
//           }))
//         },
//         { status: 201 }
//       );

//     } else {
//       // Handle single certificate creation
//       const validatedData = CertificateCreateSchema.parse(body);
      
//       // Verify event exists and user has access
//       const event = await prisma.event.findFirst({
//         where: {
//           id: validatedData.eventId,
//           OR: [
//             { organizerId: user.id },
//             { managerId: user.id }
//           ]
//         }
//       });

//       if (!event) {
//         return NextResponse.json(
//           { error: 'Event not found or access denied' },
//           { status: 404 }
//         );
//       }

//       // Check if certificate already exists
//       const existingCertificate = await prisma.certificate.findFirst({
//         where: {
//           eventId: validatedData.eventId,
//           recipientId: validatedData.recipientId,
//           role: validatedData.role
//         }
//       });

//       if (existingCertificate) {
//         return NextResponse.json(
//           { error: 'Certificate already exists for this recipient' },
//           { status: 409 }
//         );
//       }

//       // Generate unique certificate ID
//       const certificateId = `CERT-${event.id}-${validatedData.recipientId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
      
//       const certificate = await prisma.certificate.create({
//         data: {
//           id: certificateId,
//           eventId: validatedData.eventId,
//           recipientId: validatedData.recipientId,
//           recipientName: validatedData.recipientName,
//           role: validatedData.role,
//           sessionDetails: validatedData.sessionDetails,
//           templateId: validatedData.templateId || 'modern',
//           customData: validatedData.customData || {},
//           issuedBy: user.id,
//           status: 'Generated'
//         },
//         include: {
//           event: true,
//           recipient: true
//         }
//       });

//       return NextResponse.json(
//         { 
//           message: 'Certificate created successfully',
//           certificate: {
//             id: certificate.id,
//             recipientName: certificate.recipientName,
//             role: certificate.role,
//             eventName: certificate.event.name
//           }
//         },
//         { status: 201 }
//       );
//     }

//   } catch (error) {
//     console.error('Error creating certificate:', error);
    
//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { error: 'Invalid request data', details: error.errors },
//         { status: 400 }
//       );
//     }

//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // PUT - Update certificate
// export async function PUT(request: NextRequest) {
//   try {
//     const session = await getServerSession(authConfig);
//     if (!session?.user) {
//       return NextResponse.json(
//         { error: 'Unauthorized' },
//         { status: 401 }
//       );
//     }

//     const { searchParams } = new URL(request.url);
//     const certificateId = searchParams.get('id');

//     if (!certificateId) {
//       return NextResponse.json(
//         { error: 'Certificate ID is required' },
//         { status: 400 }
//       );
//     }

//     const body = await request.json();
    
//     // Validate update data
//     const updateSchema = z.object({
//       status: z.enum(['Generated', 'Sent', 'Downloaded']).optional(),
//       templateId: z.string().optional(),
//       sessionDetails: z.string().optional(),
//       customData: z.record(z.string()).optional()
//     });

//     const validatedData = updateSchema.parse(body);

//     // Check user permissions
//     const user = await prisma.user.findUnique({
//       where: { id: session.user.id }
//     });

//     if (!user) {
//       return NextResponse.json(
//         { error: 'User not found' },
//         { status: 404 }
//       );
//     }

//     // Find certificate and verify access
//     const certificate = await prisma.certificate.findUnique({
//       where: { id: certificateId },
//       include: { event: true }
//     });

//     if (!certificate) {
//       return NextResponse.json(
//         { error: 'Certificate not found' },
//         { status: 404 }
//       );
//     }

//     // Check permissions
//     const hasAccess = 
//       user.role === 'Organizer' ||
//       user.role === 'Event_Manager' ||
//       certificate.event.organizerId === user.id ||
//       certificate.event.managerId === user.id ||
//       certificate.recipientId === user.id;

//     if (!hasAccess) {
//       return NextResponse.json(
//         { error: 'Access denied' },
//         { status: 403 }
//       );
//     }

//     // Update certificate
//     const updatedCertificate = await prisma.certificate.update({
//       where: { id: certificateId },
//       data: {
//         ...validatedData,
//         updatedAt: new Date()
//       },
//       include: {
//         event: true,
//         recipient: true
//       }
//     });

//     return NextResponse.json({
//       message: 'Certificate updated successfully',
//       certificate: updatedCertificate
//     });

//   } catch (error) {
//     console.error('Error updating certificate:', error);
    
//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { error: 'Invalid update data', details: error.errors },
//         { status: 400 }
//       );
//     }

//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // DELETE - Delete certificate
// export async function DELETE(request: NextRequest) {
//   try {
//     const session = await getServerSession(authConfig);
//     if (!session?.user) {
//       return NextResponse.json(
//         { error: 'Unauthorized' },
//         { status: 401 }
//       );
//     }

//     const { searchParams } = new URL(request.url);
//     const certificateId = searchParams.get('id');

//     if (!certificateId) {
//       return NextResponse.json(
//         { error: 'Certificate ID is required' },
//         { status: 400 }
//       );
//     }

//     // Check user permissions
//     const user = await prisma.user.findUnique({
//       where: { id: session.user.id }
//     });

//     if (!user || !['Organizer', 'Event_Manager'].includes(user.role)) {
//       return NextResponse.json(
//         { error: 'Insufficient permissions' },
//         { status: 403 }
//       );
//     }

//     // Find certificate and verify access
//     const certificate = await prisma.certificate.findUnique({
//       where: { id: certificateId },
//       include: { event: true }
//     });

//     if (!certificate) {
//       return NextResponse.json(
//         { error: 'Certificate not found' },
//         { status: 404 }
//       );
//     }

//     // Verify user has access to this event
//     const hasAccess = 
//       certificate.event.organizerId === user.id ||
//       certificate.event.managerId === user.id;

//     if (!hasAccess) {
//       return NextResponse.json(
//         { error: 'Access denied' },
//         { status: 403 }
//       );
//     }

//     // Delete certificate
//     await prisma.certificate.delete({
//       where: { id: certificateId }
//     });

//     return NextResponse.json({
//       message: 'Certificate deleted successfully'
//     });

//   } catch (error) {
//     console.error('Error deleting certificate:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // Helper function to queue certificate emails
// async function queueCertificateEmails(certificates: any[]) {
//   // This would integrate with your email system
//   // For now, we'll just log the action
//   console.log(`Queuing email notifications for ${certificates.length} certificates`);
  
//   // Example implementation:
//   // await emailService.sendBulkCertificates(certificates);
// }