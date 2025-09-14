// // src/app/api/hospitality/route.ts

// import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { prisma } from '@/lib/database/connection';
// import { authConfig } from '@/lib/auth/config';
// import { z } from 'zod';

// // Validation schemas
// const TravelDetailsSchema = z.object({
//   travelType: z.enum(['flight', 'train', 'bus', 'car', 'other']),
//   bookingReference: z.string().optional(),
//   departureCity: z.string().min(1, 'Departure city is required'),
//   arrivalCity: z.string().min(1, 'Arrival city is required'),
//   departureDate: z.string().min(1, 'Departure date is required'),
//   departureTime: z.string().min(1, 'Departure time is required'),
//   arrivalDate: z.string().min(1, 'Arrival date is required'),
//   arrivalTime: z.string().min(1, 'Arrival time is required'),
//   carrier: z.string().min(1, 'Carrier is required'),
//   flightNumber: z.string().optional(),
//   seatNumber: z.string().optional(),
//   class: z.enum(['economy', 'business', 'first', 'ac1', 'ac2', 'sleeper', 'general']),
//   cost: z.number().min(0),
//   currency: z.string().default('INR'),
//   bookingStatus: z.enum(['pending', 'confirmed', 'cancelled']),
//   reimbursementStatus: z.enum(['not_requested', 'pending', 'approved', 'rejected']),
//   specialRequests: z.string().optional(),
//   emergencyContact: z.object({
//     name: z.string(),
//     phone: z.string(),
//     relation: z.string()
//   }).optional()
// });

// const AccommodationDetailsSchema = z.object({
//   hotelId: z.string().optional(),
//   hotelName: z.string().min(1, 'Hotel name is required'),
//   hotelAddress: z.string().min(1, 'Hotel address is required'),
//   hotelPhone: z.string().min(1, 'Hotel phone is required'),
//   hotelEmail: z.string().email('Invalid hotel email'),
//   roomType: z.enum(['single', 'double', 'twin', 'suite', 'family', 'accessible']),
//   roomNumber: z.string().optional(),
//   checkInDate: z.string().min(1, 'Check-in date is required'),
//   checkOutDate: z.string().min(1, 'Check-out date is required'),
//   earlyCheckIn: z.boolean().default(false),
//   lateCheckOut: z.boolean().default(false),
//   numberOfGuests: z.number().min(1).max(8),
//   guestNames: z.array(z.string().min(1)),
//   roomPreferences: z.object({
//     floor: z.enum(['low', 'middle', 'high', 'any']),
//     view: z.enum(['city', 'garden', 'pool', 'sea', 'mountain', 'any']),
//     bedType: z.enum(['single', 'double', 'twin', 'king', 'queen', 'any']),
//     smokingRoom: z.boolean(),
//     quietRoom: z.boolean(),
//     balcony: z.boolean(),
//     airConditioning: z.boolean()
//   }),
//   amenities: z.array(z.string()),
//   specialRequests: z.string().optional(),
//   bookingStatus: z.enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled']),
//   bookingReference: z.string().optional(),
//   dailyRate: z.number().min(0),
//   totalCost: z.number().min(0),
//   currency: z.string().default('INR'),
//   paymentMethod: z.enum(['organization', 'self', 'reimbursement']),
//   paymentStatus: z.enum(['pending', 'paid', 'partial', 'overdue']),
//   emergencyContact: z.object({
//     name: z.string(),
//     phone: z.string(),
//     relation: z.string()
//   }).optional(),
//   dietaryRestrictions: z.string().optional(),
//   accessibilityNeeds: z.string().optional()
// });

// const TransportationRequestSchema = z.object({
//   type: z.enum(['airport_pickup', 'airport_drop', 'hotel_venue', 'venue_hotel', 'local_transport', 'sightseeing']),
//   status: z.enum(['requested', 'assigned', 'confirmed', 'in_transit', 'completed', 'cancelled']).default('requested'),
//   priority: z.enum(['high', 'medium', 'low']).default('medium'),
//   pickupLocation: z.string().min(1, 'Pickup location is required'),
//   dropoffLocation: z.string().min(1, 'Drop-off location is required'),
//   scheduledDate: z.string().min(1, 'Scheduled date is required'),
//   scheduledTime: z.string().min(1, 'Scheduled time is required'),
//   estimatedDuration: z.number().optional(),
//   numberOfPassengers: z.number().min(1).max(8),
//   passengerNames: z.array(z.string().min(1)),
//   vehicleType: z.enum(['sedan', 'suv', 'bus', 'taxi', 'shuttle', 'luxury']),
//   vehiclePreference: z.string().optional(),
//   driverName: z.string().optional(),
//   driverPhone: z.string().optional(),
//   vehicleNumber: z.string().optional(),
//   contactPerson: z.string().min(1, 'Contact person is required'),
//   contactPhone: z.string().min(1, 'Contact phone is required'),
//   specialInstructions: z.string().optional(),
//   accessibilityNeeds: z.string().optional(),
//   actualPickupTime: z.string().optional(),
//   actualDropoffTime: z.string().optional(),
//   route: z.string().optional(),
//   distance: z.number().optional(),
//   estimatedCost: z.number().min(0),
//   actualCost: z.number().optional(),
//   currency: z.string().default('INR'),
//   paymentMethod: z.enum(['organization', 'self', 'driver']),
//   paymentStatus: z.enum(['pending', 'paid', 'partial']),
//   rating: z.number().min(1).max(5).optional(),
//   feedback: z.string().optional()
// });

// const HospitalityQuerySchema = z.object({
//   type: z.enum(['travel', 'accommodation', 'transportation']).optional(),
//   eventId: z.string().optional(),
//   userId: z.string().optional(),
//   status: z.string().optional(),
//   page: z.string().optional(),
//   limit: z.string().optional(),
//   startDate: z.string().optional(),
//   endDate: z.string().optional()
// });

// // GET - Fetch hospitality data
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
//     const validatedQuery = HospitalityQuerySchema.parse(queryData);
    
//     const page = parseInt(validatedQuery.page || '1');
//     const limit = parseInt(validatedQuery.limit || '10');
//     const skip = (page - 1) * limit;

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

//     // Build where clause based on user role
//     const whereClause: any = {};
    
//     if (validatedQuery.eventId) {
//       whereClause.eventId = validatedQuery.eventId;
//     }

//     // Role-based access control
//     if (!['Organizer', 'Event_Manager'].includes(user.role)) {
//       whereClause.userId = user.id; // Users can only see their own data
//     }

//     if (validatedQuery.userId && ['Organizer', 'Event_Manager'].includes(user.role)) {
//       whereClause.userId = validatedQuery.userId;
//     }

//     // Date filters
//     const dateFilters: any = {};
//     if (validatedQuery.startDate) {
//       dateFilters.gte = new Date(validatedQuery.startDate);
//     }
//     if (validatedQuery.endDate) {
//       dateFilters.lte = new Date(validatedQuery.endDate);
//     }

//     let result: any = {};

//     // Fetch data based on type
//     switch (validatedQuery.type) {
//       case 'travel':
//         const [travelData, travelTotal] = await Promise.all([
//           prisma.travelDetails.findMany({
//             where: {
//               ...whereClause,
//               ...(Object.keys(dateFilters).length > 0 ? { departureDate: dateFilters } : {})
//             },
//             include: {
//               user: {
//                 select: { id: true, name: true, email: true }
//               },
//               event: {
//                 select: { id: true, name: true, date: true }
//               }
//             },
//             orderBy: { createdAt: 'desc' },
//             skip,
//             take: limit
//           }),
//           prisma.travelDetails.count({ where: whereClause })
//         ]);

//         result = {
//           travel: travelData,
//           pagination: {
//             total: travelTotal,
//             page,
//             limit,
//             pages: Math.ceil(travelTotal / limit)
//           }
//         };
//         break;

//       case 'accommodation':
//         const [accommodationData, accommodationTotal] = await Promise.all([
//           prisma.accommodationDetails.findMany({
//             where: {
//               ...whereClause,
//               ...(Object.keys(dateFilters).length > 0 ? { checkInDate: dateFilters } : {})
//             },
//             include: {
//               user: {
//                 select: { id: true, name: true, email: true }
//               },
//               event: {
//                 select: { id: true, name: true, date: true }
//               }
//             },
//             orderBy: { createdAt: 'desc' },
//             skip,
//             take: limit
//           }),
//           prisma.accommodationDetails.count({ where: whereClause })
//         ]);

//         result = {
//           accommodation: accommodationData,
//           pagination: {
//             total: accommodationTotal,
//             page,
//             limit,
//             pages: Math.ceil(accommodationTotal / limit)
//           }
//         };
//         break;

//       case 'transportation':
//         const [transportationData, transportationTotal] = await Promise.all([
//           prisma.transportationRequest.findMany({
//             where: {
//               ...whereClause,
//               ...(validatedQuery.status ? { status: validatedQuery.status } : {}),
//               ...(Object.keys(dateFilters).length > 0 ? { scheduledDate: dateFilters } : {})
//             },
//             include: {
//               user: {
//                 select: { id: true, name: true, email: true }
//               },
//               event: {
//                 select: { id: true, name: true, date: true }
//               }
//             },
//             orderBy: { createdAt: 'desc' },
//             skip,
//             take: limit
//           }),
//           prisma.transportationRequest.count({ 
//             where: {
//               ...whereClause,
//               ...(validatedQuery.status ? { status: validatedQuery.status } : {})
//             }
//           })
//         ]);

//         result = {
//           transportation: transportationData,
//           pagination: {
//             total: transportationTotal,
//             page,
//             limit,
//             pages: Math.ceil(transportationTotal / limit)
//           }
//         };
//         break;

//       default:
//         // Fetch all hospitality data
//         const [travel, accommodation, transportation] = await Promise.all([
//           prisma.travelDetails.findMany({
//             where: whereClause,
//             include: {
//               user: { select: { id: true, name: true, email: true } },
//               event: { select: { id: true, name: true, date: true } }
//             },
//             orderBy: { createdAt: 'desc' },
//             take: 5
//           }),
//           prisma.accommodationDetails.findMany({
//             where: whereClause,
//             include: {
//               user: { select: { id: true, name: true, email: true } },
//               event: { select: { id: true, name: true, date: true } }
//             },
//             orderBy: { createdAt: 'desc' },
//             take: 5
//           }),
//           prisma.transportationRequest.findMany({
//             where: whereClause,
//             include: {
//               user: { select: { id: true, name: true, email: true } },
//               event: { select: { id: true, name: true, date: true } }
//             },
//             orderBy: { createdAt: 'desc' },
//             take: 5
//           })
//         ]);

//         // Calculate summary statistics
//         const [travelCount, accommodationCount, transportationCount] = await Promise.all([
//           prisma.travelDetails.count({ where: whereClause }),
//           prisma.accommodationDetails.count({ where: whereClause }),
//           prisma.transportationRequest.count({ where: whereClause })
//         ]);

//         result = {
//           travel,
//           accommodation,
//           transportation,
//           summary: {
//             totalTravel: travelCount,
//             totalAccommodation: accommodationCount,
//             totalTransportation: transportationCount,
//             total: travelCount + accommodationCount + transportationCount
//           }
//         };
//     }

//     return NextResponse.json(result);

//   } catch (error) {
//     console.error('Error fetching hospitality data:', error);
    
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

// // POST - Create hospitality record
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
//     const { type, ...data } = body;

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

//     let result: any;

//     switch (type) {
//       case 'travel':
//         const validatedTravelData = TravelDetailsSchema.parse(data);
        
//         result = await prisma.travelDetails.create({
//           data: {
//             ...validatedTravelData,
//             userId: user.id,
//             eventId: data.eventId,
//             departureDate: new Date(validatedTravelData.departureDate),
//             arrivalDate: new Date(validatedTravelData.arrivalDate),
//             createdAt: new Date(),
//             updatedAt: new Date()
//           },
//           include: {
//             user: { select: { id: true, name: true, email: true } },
//             event: { select: { id: true, name: true, date: true } }
//           }
//         });
//         break;

//       case 'accommodation':
//         const validatedAccommodationData = AccommodationDetailsSchema.parse(data);
        
//         // Validate guest names count matches numberOfGuests
//         if (validatedAccommodationData.guestNames.length !== validatedAccommodationData.numberOfGuests) {
//           return NextResponse.json(
//             { error: 'Number of guest names must match number of guests' },
//             { status: 400 }
//           );
//         }

//         // Validate check-out date is after check-in date
//         const checkIn = new Date(validatedAccommodationData.checkInDate);
//         const checkOut = new Date(validatedAccommodationData.checkOutDate);
//         if (checkOut <= checkIn) {
//           return NextResponse.json(
//             { error: 'Check-out date must be after check-in date' },
//             { status: 400 }
//           );
//         }

//         result = await prisma.accommodationDetails.create({
//           data: {
//             ...validatedAccommodationData,
//             userId: user.id,
//             eventId: data.eventId,
//             checkInDate: checkIn,
//             checkOutDate: checkOut,
//             createdAt: new Date(),
//             updatedAt: new Date()
//           },
//           include: {
//             user: { select: { id: true, name: true, email: true } },
//             event: { select: { id: true, name: true, date: true } }
//           }
//         });
//         break;

//       case 'transportation':
//         const validatedTransportationData = TransportationRequestSchema.parse(data);
        
//         // Validate passenger names count matches numberOfPassengers
//         if (validatedTransportationData.passengerNames.length !== validatedTransportationData.numberOfPassengers) {
//           return NextResponse.json(
//             { error: 'Number of passenger names must match number of passengers' },
//             { status: 400 }
//           );
//         }

//         result = await prisma.transportationRequest.create({
//           data: {
//             ...validatedTransportationData,
//             userId: user.id,
//             eventId: data.eventId,
//             scheduledDate: new Date(validatedTransportationData.scheduledDate),
//             actualPickupTime: validatedTransportationData.actualPickupTime ? 
//               new Date(validatedTransportationData.actualPickupTime) : null,
//             actualDropoffTime: validatedTransportationData.actualDropoffTime ? 
//               new Date(validatedTransportationData.actualDropoffTime) : null,
//             createdAt: new Date(),
//             updatedAt: new Date()
//           },
//           include: {
//             user: { select: { id: true, name: true, email: true } },
//             event: { select: { id: true, name: true, date: true } }
//           }
//         });
//         break;

//       default:
//         return NextResponse.json(
//           { error: 'Invalid type. Must be travel, accommodation, or transportation' },
//           { status: 400 }
//         );
//     }

//     // Send notification (implement based on your notification system)
//     await sendHospitalityNotification(user, type, result);

//     return NextResponse.json(
//       { 
//         message: `${type} record created successfully`,
//         data: result
//       },
//       { status: 201 }
//     );

//   } catch (error) {
//     console.error('Error creating hospitality record:', error);
    
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

// // PUT - Update hospitality record
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
//     const type = searchParams.get('type');
//     const id = searchParams.get('id');

//     if (!type || !id) {
//       return NextResponse.json(
//         { error: 'Type and ID are required' },
//         { status: 400 }
//       );
//     }

//     const body = await request.json();

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

//     let result: any;

//     switch (type) {
//       case 'travel':
//         // Check if record exists and user has access
//         const existingTravel = await prisma.travelDetails.findUnique({
//           where: { id }
//         });

//         if (!existingTravel) {
//           return NextResponse.json(
//             { error: 'Travel record not found' },
//             { status: 404 }
//           );
//         }

//         if (existingTravel.userId !== user.id && !['Organizer', 'Event_Manager'].includes(user.role)) {
//           return NextResponse.json(
//             { error: 'Access denied' },
//             { status: 403 }
//           );
//         }

//         const validatedTravelUpdate = TravelDetailsSchema.partial().parse(body);
        
//         result = await prisma.travelDetails.update({
//           where: { id },
//           data: {
//             ...validatedTravelUpdate,
//             ...(validatedTravelUpdate.departureDate ? { departureDate: new Date(validatedTravelUpdate.departureDate) } : {}),
//             ...(validatedTravelUpdate.arrivalDate ? { arrivalDate: new Date(validatedTravelUpdate.arrivalDate) } : {}),
//             updatedAt: new Date()
//           },
//           include: {
//             user: { select: { id: true, name: true, email: true } },
//             event: { select: { id: true, name: true, date: true } }
//           }
//         });
//         break;

//       case 'accommodation':
//         // Check if record exists and user has access
//         const existingAccommodation = await prisma.accommodationDetails.findUnique({
//           where: { id }
//         });

//         if (!existingAccommodation) {
//           return NextResponse.json(
//             { error: 'Accommodation record not found' },
//             { status: 404 }
//           );
//         }

//         if (existingAccommodation.userId !== user.id && !['Organizer', 'Event_Manager'].includes(user.role)) {
//           return NextResponse.json(
//             { error: 'Access denied' },
//             { status: 403 }
//           );
//         }

//         const validatedAccommodationUpdate = AccommodationDetailsSchema.partial().parse(body);
        
//         result = await prisma.accommodationDetails.update({
//           where: { id },
//           data: {
//             ...validatedAccommodationUpdate,
//             ...(validatedAccommodationUpdate.checkInDate ? { checkInDate: new Date(validatedAccommodationUpdate.checkInDate) } : {}),
//             ...(validatedAccommodationUpdate.checkOutDate ? { checkOutDate: new Date(validatedAccommodationUpdate.checkOutDate) } : {}),
//             updatedAt: new Date()
//           },
//           include: {
//             user: { select: { id: true, name: true, email: true } },
//             event: { select: { id: true, name: true, date: true } }
//           }
//         });
//         break;

//       case 'transportation':
//         // Check if record exists and user has access
//         const existingTransportation = await prisma.transportationRequest.findUnique({
//           where: { id }
//         });

//         if (!existingTransportation) {
//           return NextResponse.json(
//             { error: 'Transportation record not found' },
//             { status: 404 }
//           );
//         }

//         if (existingTransportation.userId !== user.id && !['Organizer', 'Event_Manager'].includes(user.role)) {
//           return NextResponse.json(
//             { error: 'Access denied' },
//             { status: 403 }
//           );
//         }

//         const validatedTransportationUpdate = TransportationRequestSchema.partial().parse(body);
        
//         result = await prisma.transportationRequest.update({
//           where: { id },
//           data: {
//             ...validatedTransportationUpdate,
//             ...(validatedTransportationUpdate.scheduledDate ? { scheduledDate: new Date(validatedTransportationUpdate.scheduledDate) } : {}),
//             ...(validatedTransportationUpdate.actualPickupTime ? { actualPickupTime: new Date(validatedTransportationUpdate.actualPickupTime) } : {}),
//             ...(validatedTransportationUpdate.actualDropoffTime ? { actualDropoffTime: new Date(validatedTransportationUpdate.actualDropoffTime) } : {}),
//             updatedAt: new Date()
//           },
//           include: {
//             user: { select: { id: true, name: true, email: true } },
//             event: { select: { id: true, name: true, date: true } }
//           }
//         });
//         break;

//       default:
//         return NextResponse.json(
//           { error: 'Invalid type. Must be travel, accommodation, or transportation' },
//           { status: 400 }
//         );
//     }

//     return NextResponse.json({
//       message: `${type} record updated successfully`,
//       data: result
//     });

//   } catch (error) {
//     console.error('Error updating hospitality record:', error);
    
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

// // DELETE - Delete hospitality record
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
//     const type = searchParams.get('type');
//     const id = searchParams.get('id');

//     if (!type || !id) {
//       return NextResponse.json(
//         { error: 'Type and ID are required' },
//         { status: 400 }
//       );
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

//     switch (type) {
//       case 'travel':
//         const existingTravel = await prisma.travelDetails.findUnique({
//           where: { id }
//         });

//         if (!existingTravel) {
//           return NextResponse.json(
//             { error: 'Travel record not found' },
//             { status: 404 }
//           );
//         }

//         if (existingTravel.userId !== user.id && !['Organizer', 'Event_Manager'].includes(user.role)) {
//           return NextResponse.json(
//             { error: 'Access denied' },
//             { status: 403 }
//           );
//         }

//         await prisma.travelDetails.delete({
//           where: { id }
//         });
//         break;

//       case 'accommodation':
//         const existingAccommodation = await prisma.accommodationDetails.findUnique({
//           where: { id }
//         });

//         if (!existingAccommodation) {
//           return NextResponse.json(
//             { error: 'Accommodation record not found' },
//             { status: 404 }
//           );
//         }

//         if (existingAccommodation.userId !== user.id && !['Organizer', 'Event_Manager'].includes(user.role)) {
//           return NextResponse.json(
//             { error: 'Access denied' },
//             { status: 403 }
//           );
//         }

//         await prisma.accommodationDetails.delete({
//           where: { id }
//         });
//         break;

//       case 'transportation':
//         const existingTransportation = await prisma.transportationRequest.findUnique({
//           where: { id }
//         });

//         if (!existingTransportation) {
//           return NextResponse.json(
//             { error: 'Transportation record not found' },
//             { status: 404 }
//           );
//         }

//         if (existingTransportation.userId !== user.id && !['Organizer', 'Event_Manager'].includes(user.role)) {
//           return NextResponse.json(
//             { error: 'Access denied' },
//             { status: 403 }
//           );
//         }

//         await prisma.transportationRequest.delete({
//           where: { id }
//         });
//         break;

//       default:
//         return NextResponse.json(
//           { error: 'Invalid type. Must be travel, accommodation, or transportation' },
//           { status: 400 }
//         );
//     }

//     return NextResponse.json({
//       message: `${type} record deleted successfully`
//     });

//   } catch (error) {
//     console.error('Error deleting hospitality record:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

// // Helper function to send notifications
// async function sendHospitalityNotification(user: any, type: string, data: any) {
//   // This would integrate with your notification system
//   console.log(`Sending ${type} notification to ${user.email}:`, {
//     userId: user.id,
//     type,
//     recordId: data.id
//   });
  
//   // Example implementation:
//   // await notificationService.send({
//   //   to: user.email,
//   //   subject: `${type} booking confirmation`,
//   //   template: `${type}_confirmation`,
//   //   data: data
//   // });
// }