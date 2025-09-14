// import { NextRequest, NextResponse } from 'next/server';
// import { z } from 'zod';
// import { prisma } from '@/lib/database/connection';
// import { withAuth, withRateLimit, validateBody, ApiError, successResponse } from '@/lib/api/middleware';
// import { emailSender, EmailOptions } from '@/lib/email/sender';
// import { EmailTemplateHelper, EmailTemplateData } from '@/lib/email/templates';
// import { whatsappClient, WhatsAppTemplateMessage, WhatsAppTemplates } from '@/lib/whatsapp/client';

// // Validation schemas
// const sendNotificationSchema = z.object({
//   type: z.enum(['email', 'whatsapp', 'both']),
//   recipients: z.array(z.object({
//     userId: z.string().optional(),
//     email: z.string().email().optional(),
//     phone: z.string().optional(),
//     name: z.string().optional(),
//   })).min(1, 'At least one recipient is required'),
//   template: z.enum([
//     'facultyInvitation',
//     'sessionReminder',
//     'registrationConfirmation',
//     'presentationReminder',
//     'welcomeUser',
//     'certificateReady'
//   ]),
//   data: z.record(z.any()),
//   priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
//   scheduleAt: z.string().datetime().optional(), // ISO datetime string
//   eventId: z.string().optional(),
//   sessionId: z.string().optional(),
// });

// const bulkNotificationSchema = z.object({
//   type: z.enum(['email', 'whatsapp', 'both']),
//   eventId: z.string().min(1, 'Event ID is required'),
//   recipientType: z.enum(['all', 'faculty', 'delegates', 'organizers', 'volunteers']),
//   template: z.enum([
//     'facultyInvitation',
//     'sessionReminder',
//     'registrationConfirmation',
//     'presentationReminder',
//     'welcomeUser',
//     'certificateReady'
//   ]),
//   data: z.record(z.any()),
//   filterCriteria: z.object({
//     sessionIds: z.array(z.string()).optional(),
//     hallIds: z.array(z.string()).optional(),
//     userRoles: z.array(z.string()).optional(),
//   }).optional(),
// });

// const customMessageSchema = z.object({
//   type: z.enum(['email', 'whatsapp', 'both']),
//   recipients: z.array(z.object({
//     email: z.string().email().optional(),
//     phone: z.string().optional(),
//     name: z.string().optional(),
//   })).min(1, 'At least one recipient is required'),
//   subject: z.string().min(1, 'Subject is required'),
//   message: z.string().min(1, 'Message is required'),
//   isHtml: z.boolean().default(false),
//   priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
// });

// // POST /api/notifications - Send notification using templates
// export async function POST(request: NextRequest) {
//   return withRateLimit(
//     withAuth(
//       validateBody(sendNotificationSchema)(async (req, body, { user }) => {
//         try {
//           const {
//             type,
//             recipients,
//             template,
//             data,
//             priority,
//             scheduleAt,
//             eventId,
//             sessionId
//           } = body;

//           // Validate event access if eventId is provided
//           if (eventId) {
//             const event = await prisma.event.findFirst({
//               where: {
//                 id: eventId,
//                 OR: [
//                   { organizerId: user.id },
//                   { eventManagers: { some: { userId: user.id } } }
//                 ]
//               }
//             });

//             if (!event) {
//               throw new ApiError(403, 'Access denied to this event');
//             }
//           }

//           // If scheduled, create scheduled notification
//           if (scheduleAt) {
//             const scheduledNotification = await prisma.scheduledNotification.create({
//               data: {
//                 type,
//                 recipients: JSON.stringify(recipients),
//                 template,
//                 data: JSON.stringify(data),
//                 priority,
//                 scheduledAt: new Date(scheduleAt),
//                 createdBy: user.id,
//                 eventId,
//                 sessionId,
//                 status: 'PENDING'
//               }
//             });

//             return successResponse({
//               scheduled: true,
//               notificationId: scheduledNotification.id,
//               scheduledAt: scheduleAt
//             }, 'Notification scheduled successfully');
//           }

//           // Send immediate notification
//           const result = await sendNotificationImmediately({
//             type,
//             recipients,
//             template,
//             data,
//             priority,
//             createdBy: user.id,
//             eventId,
//             sessionId
//           });

//           return successResponse(result, 'Notification sent successfully');

//         } catch (error) {
//           console.error('Send notification error:', error);
//           if (error instanceof ApiError) throw error;
//           throw new ApiError(500, 'Failed to send notification');
//         }
//       })
//     , { requiredRoles: ['ORGANIZER', 'EVENT_MANAGER'] })
//   )(request);
// }

// // PUT /api/notifications - Send bulk notifications
// export async function PUT(request: NextRequest) {
//   return withRateLimit(
//     withAuth(
//       validateBody(bulkNotificationSchema)(async (req, body, { user }) => {
//         try {
//           const {
//             type,
//             eventId,
//             recipientType,
//             template,
//             data,
//             filterCriteria
//           } = body;

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
//             throw new ApiError(403, 'Access denied to this event');
//           }

//           // Build recipient query based on type
//           let whereClause: any = {};

//           switch (recipientType) {
//             case 'faculty':
//               whereClause = {
//                 role: { in: ['FACULTY', 'SPEAKER'] },
//                 sessionSpeakers: { some: { session: { eventId } } }
//               };
//               break;
            
//             case 'delegates':
//               whereClause = {
//                 role: 'DELEGATE',
//                 registrations: { some: { eventId } }
//               };
//               break;
            
//             case 'organizers':
//               whereClause = {
//                 OR: [
//                   { role: 'ORGANIZER', eventsOrganized: { some: { id: eventId } } },
//                   { role: 'EVENT_MANAGER', managedEvents: { some: { eventId } } }
//                 ]
//               };
//               break;
            
//             case 'volunteers':
//               whereClause = {
//                 role: 'VOLUNTEER',
//                 volunteerAssignments: { some: { eventId } }
//               };
//               break;
            
//             default: // 'all'
//               whereClause = {
//                 OR: [
//                   { registrations: { some: { eventId } } },
//                   { sessionSpeakers: { some: { session: { eventId } } } },
//                   { eventsOrganized: { some: { id: eventId } } },
//                   { managedEvents: { some: { eventId } } }
//                 ]
//               };
//           }

//           // Apply additional filters
//           if (filterCriteria) {
//             if (filterCriteria.sessionIds?.length) {
//               whereClause.sessionSpeakers = {
//                 some: { sessionId: { in: filterCriteria.sessionIds } }
//               };
//             }
            
//             if (filterCriteria.userRoles?.length) {
//               whereClause.role = { in: filterCriteria.userRoles };
//             }
//           }

//           // Get recipients
//           const users = await prisma.user.findMany({
//             where: whereClause,
//             select: {
//               id: true,
//               name: true,
//               email: true,
//               phone: true,
//             }
//           });

//           if (users.length === 0) {
//             throw new ApiError(400, 'No recipients found matching the criteria');
//           }

//           // Prepare recipients array
//           const recipients = users.map(user => ({
//             userId: user.id,
//             email: user.email,
//             phone: user.phone || undefined,
//             name: user.name || undefined,
//           }));

//           // Send bulk notification
//           const result = await sendNotificationImmediately({
//             type,
//             recipients,
//             template,
//             data: { ...data, eventName: event.title },
//             priority: 'normal',
//             createdBy: user.id,
//             eventId
//           });

//           // Log bulk notification
//           await prisma.notificationLog.create({
//             data: {
//               type: 'BULK_NOTIFICATION',
//               recipientCount: recipients.length,
//               template,
//               eventId,
//               createdBy: user.id,
//               metadata: {
//                 recipientType,
//                 filterCriteria,
//                 sent: result.sent,
//                 failed: result.failed
//               }
//             }
//           });

//           return successResponse({
//             ...result,
//             recipientCount: recipients.length,
//             recipientType
//           }, `Bulk notification sent to ${result.sent} recipients`);

//         } catch (error) {
//           console.error('Bulk notification error:', error);
//           if (error instanceof ApiError) throw error;
//           throw new ApiError(500, 'Failed to send bulk notification');
//         }
//       })
//     , { requiredRoles: ['ORGANIZER', 'EVENT_MANAGER'] })
//   )(request);
// }

// // PATCH /api/notifications - Send custom message
// export async function PATCH(request: NextRequest) {
//   return withRateLimit(
//     withAuth(
//       validateBody(customMessageSchema)(async (req, body, { user }) => {
//         try {
//           const {
//             type,
//             recipients,
//             subject,
//             message,
//             isHtml,
//             priority
//           } = body;

//           let emailsSent = 0;
//           let whatsappSent = 0;
//           let emailErrors: string[] = [];
//           let whatsappErrors: string[] = [];

//           // Send emails
//           if (type === 'email' || type === 'both') {
//             for (const recipient of recipients) {
//               if (recipient.email) {
//                 try {
//                   const emailOptions: EmailOptions = {
//                     to: recipient.email,
//                     subject,
//                     [isHtml ? 'html' : 'text']: message,
//                     priority: priority === 'urgent' ? 'high' : 'normal'
//                   };

//                   const result = await emailSender.sendEmail(emailOptions);
                  
//                   if (result.success) {
//                     emailsSent++;
//                   } else {
//                     emailErrors.push(`${recipient.email}: ${result.error}`);
//                   }
//                 } catch (error) {
//                   emailErrors.push(`${recipient.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
//                 }
//               }
//             }
//           }

//           // Send WhatsApp messages
//           if (type === 'whatsapp' || type === 'both') {
//             for (const recipient of recipients) {
//               if (recipient.phone) {
//                 try {
//                   const result = await whatsappClient.sendTextMessage(
//                     recipient.phone,
//                     `*${subject}*\n\n${message}`
//                   );
                  
//                   if (result.success) {
//                     whatsappSent++;
//                   } else {
//                     whatsappErrors.push(`${recipient.phone}: ${result.error}`);
//                   }
//                 } catch (error) {
//                   whatsappErrors.push(`${recipient.phone}: ${error instanceof Error ? error.message : 'Unknown error'}`);
//                 }
//               }
//             }
//           }

//           // Log custom notification
//           await prisma.notificationLog.create({
//             data: {
//               type: 'CUSTOM_MESSAGE',
//               recipientCount: recipients.length,
//               template: 'custom',
//               createdBy: user.id,
//               metadata: {
//                 subject,
//                 messageType: type,
//                 emailsSent,
//                 whatsappSent,
//                 emailErrors: emailErrors.slice(0, 10), // Limit error logs
//                 whatsappErrors: whatsappErrors.slice(0, 10)
//               }
//             }
//           });

//           return successResponse({
//             emailsSent,
//             whatsappSent,
//             totalSent: emailsSent + whatsappSent,
//             errors: {
//               email: emailErrors,
//               whatsapp: whatsappErrors
//             }
//           }, 'Custom message sent successfully');

//         } catch (error) {
//           console.error('Custom message error:', error);
//           if (error instanceof ApiError) throw error;
//           throw new ApiError(500, 'Failed to send custom message');
//         }
//       })
//     , { requiredRoles: ['ORGANIZER', 'EVENT_MANAGER'] })
//   )(request);
// }

// // GET /api/notifications - Get notification history and stats
// export async function GET(request: NextRequest) {
//   return withRateLimit(
//     withAuth(async (req, { user }) => {
//       try {
//         const { searchParams } = new URL(req.url);
//         const eventId = searchParams.get('eventId');
//         const page = parseInt(searchParams.get('page') || '1');
//         const limit = parseInt(searchParams.get('limit') || '20');
//         const skip = (page - 1) * limit;

//         // Build query
//         let whereClause: any = {
//           createdBy: user.id
//         };

//         if (eventId) {
//           whereClause.eventId = eventId;
//         }

//         // Get notification logs
//         const [logs, total] = await Promise.all([
//           prisma.notificationLog.findMany({
//             where: whereClause,
//             orderBy: { createdAt: 'desc' },
//             skip,
//             take: limit,
//             include: {
//               event: {
//                 select: { title: true }
//               },
//               session: {
//                 select: { title: true }
//               }
//             }
//           }),
//           prisma.notificationLog.count({ where: whereClause })
//         ]);

//         // Get statistics
//         const stats = await prisma.notificationLog.aggregate({
//           where: whereClause,
//           _sum: {
//             recipientCount: true
//           },
//           _count: {
//             id: true
//           }
//         });

//         return successResponse({
//           logs,
//           pagination: {
//             page,
//             limit,
//             total,
//             pages: Math.ceil(total / limit)
//           },
//           stats: {
//             totalNotifications: stats._count.id,
//             totalRecipients: stats._sum.recipientCount || 0
//           }
//         }, 'Notification history retrieved successfully');

//       } catch (error) {
//         console.error('Get notifications error:', error);
//         if (error instanceof ApiError) throw error;
//         throw new ApiError(500, 'Failed to retrieve notifications');
//       }
//     }, { requiredRoles: ['ORGANIZER', 'EVENT_MANAGER'] })
//   )(request);
// }

// // Helper function to send notification immediately
// async function sendNotificationImmediately({
//   type,
//   recipients,
//   template,
//   data,
//   priority,
//   createdBy,
//   eventId,
//   sessionId
// }: {
//   type: 'email' | 'whatsapp' | 'both';
//   recipients: Array<{
//     userId?: string;
//     email?: string;
//     phone?: string;
//     name?: string;
//   }>;
//   template: string;
//   data: Record<string, any>;
//   priority: string;
//   createdBy: string;
//   eventId?: string;
//   sessionId?: string;
// }): Promise<{
//   sent: number;
//   failed: number;
//   emailResults?: any;
//   whatsappResults?: any;
// }> {
//   let emailResults = null;
//   let whatsappResults = null;

//   // Send emails
//   if (type === 'email' || type === 'both') {
//     const emailRecipients = recipients
//       .filter(r => r.email)
//       .map(r => ({
//         email: r.email!,
//         name: r.name || '',
//         variables: { recipientName: r.name || '', ...data }
//       }));

//     if (emailRecipients.length > 0) {
//       try {
//         const emailTemplate = EmailTemplateHelper.renderTemplate(
//           template as any,
//           data as EmailTemplateData
//         );

//         emailResults = await emailSender.sendBulkEmails({
//           recipients: emailRecipients,
//           template: emailTemplate,
//           batchSize: 10,
//           delayBetweenBatches: 1000
//         });
//       } catch (error) {
//         console.error('Email sending error:', error);
//         emailResults = { sent: 0, failed: emailRecipients.length, errors: [] };
//       }
//     }
//   }

//   // Send WhatsApp messages
//   if (type === 'whatsapp' || type === 'both') {
//     const whatsappRecipients = recipients
//       .filter(r => r.phone)
//       .map(r => ({
//         phone: r.phone!,
//         name: r.name || '',
//         customParameters: { recipientName: r.name || '', ...data }
//       }));

//     if (whatsappRecipients.length > 0) {
//       try {
//         // Use appropriate WhatsApp template
//         const whatsappTemplate = WhatsAppTemplates[template as keyof typeof WhatsAppTemplates];
        
//         if (whatsappTemplate) {
//           whatsappResults = await whatsappClient.sendBulkMessages({
//             recipients: whatsappRecipients,
//             template: whatsappTemplate,
//             batchSize: 5,
//             delayBetweenBatches: 2000
//           });
//         } else {
//           // Fallback to text message
//           const promises = whatsappRecipients.map(async (recipient) => {
//             return whatsappClient.sendTextMessage(
//               recipient.phone,
//               `${data.subject || 'Notification'}\n\n${data.message || JSON.stringify(data)}`
//             );
//           });

//           const results = await Promise.all(promises);
//           const sent = results.filter(r => r.success).length;
//           const failed = results.filter(r => !r.success).length;

//           whatsappResults = { sent, failed, errors: [] };
//         }
//       } catch (error) {
//         console.error('WhatsApp sending error:', error);
//         whatsappResults = { sent: 0, failed: whatsappRecipients.length, errors: [] };
//       }
//     }
//   }

//   const totalSent = (emailResults?.sent || 0) + (whatsappResults?.sent || 0);
//   const totalFailed = (emailResults?.failed || 0) + (whatsappResults?.failed || 0);

//   return {
//     sent: totalSent,
//     failed: totalFailed,
//     emailResults,
//     whatsappResults
//   };
// }

// // DELETE /api/notifications - Cancel scheduled notification
// export async function DELETE(request: NextRequest) {
//   return withRateLimit(
//     withAuth(async (req, { user }) => {
//       try {
//         const { searchParams } = new URL(req.url);
//         const notificationId = searchParams.get('notificationId');

//         if (!notificationId) {
//           throw new ApiError(400, 'Notification ID is required');
//         }

//         // Find and validate notification
//         const notification = await prisma.scheduledNotification.findFirst({
//           where: {
//             id: notificationId,
//             createdBy: user.id,
//             status: 'PENDING'
//           }
//         });

//         if (!notification) {
//           throw new ApiError(404, 'Scheduled notification not found or already processed');
//         }

//         // Cancel notification
//         await prisma.scheduledNotification.update({
//           where: { id: notificationId },
//           data: {
//             status: 'CANCELLED',
//             cancelledAt: new Date()
//           }
//         });

//         return successResponse(
//           { notificationId, status: 'CANCELLED' },
//           'Scheduled notification cancelled successfully'
//         );

//       } catch (error) {
//         console.error('Cancel notification error:', error);
//         if (error instanceof ApiError) throw error;
//         throw new ApiError(500, 'Failed to cancel notification');
//       }
//     }, { requiredRoles: ['ORGANIZER', 'EVENT_MANAGER'] })
//   )(request);
// }