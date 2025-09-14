// // src/components/hospitality/transportation-tracker.tsx

// 'use client';

// import React, { useState, useCallback, useMemo } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Textarea } from '@/components/ui/textarea';
// import { Checkbox } from '@/components/ui/checkbox';
// import { Badge } from '@/components/ui/badge';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Calendar } from '@/components/ui/calendar';
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { 
//   Car, 
//   Bus, 
//   Plane, 
//   MapPin,
//   Clock,
//   Calendar as CalendarIcon,
//   User,
//   Users,
//   Phone,
//   Navigation,
//   CreditCard,
//   CheckCircle2,
//   AlertTriangle,
//   Plus,
//   Trash2,
//   Edit,
//   Save,
//   X,
//   Route,
//   Timer,
//   DollarSign,
//   FileText,
//   Star,
//   Map
// } from 'lucide-react';
// import { format, addMinutes, differenceInMinutes } from 'date-fns';

// // Types
// interface TransportationRequest {
//   id?: string;
//   userId: string;
//   eventId: string;
//   type: 'airport_pickup' | 'airport_drop' | 'hotel_venue' | 'venue_hotel' | 'local_transport' | 'sightseeing';
//   status: 'requested' | 'assigned' | 'confirmed' | 'in_transit' | 'completed' | 'cancelled';
//   priority: 'high' | 'medium' | 'low';
  
//   // Basic Details
//   pickupLocation: string;
//   dropoffLocation: string;
//   scheduledDate: Date;
//   scheduledTime: string;
//   estimatedDuration: number; // in minutes
//   numberOfPassengers: number;
//   passengerNames: string[];
  
//   // Transport Details
//   vehicleType: 'sedan' | 'suv' | 'bus' | 'taxi' | 'shuttle' | 'luxury';
//   vehiclePreference?: string;
//   driverName?: string;
//   driverPhone?: string;
//   vehicleNumber?: string;
  
//   // Contact & Instructions
//   contactPerson: string;
//   contactPhone: string;
//   specialInstructions?: string;
//   accessibilityNeeds?: string;
  
//   // Tracking
//   actualPickupTime?: Date;
//   actualDropoffTime?: Date;
//   route?: string;
//   distance?: number; // in km
  
//   // Cost
//   estimatedCost: number;
//   actualCost?: number;
//   currency: string;
//   paymentMethod: 'organization' | 'self' | 'driver';
//   paymentStatus: 'pending' | 'paid' | 'partial';
  
//   // Additional
//   rating?: number;
//   feedback?: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

// interface VehicleOption {
//   type: 'sedan' | 'suv' | 'bus' | 'taxi' | 'shuttle' | 'luxury';
//   name: string;
//   capacity: number;
//   description: string;
//   baseCost: number;
//   perKmCost: number;
//   amenities: string[];
//   icon: React.ComponentType<{ className?: string }>;
// }

// interface TransportationTrackerProps {
//   userId: string;
//   eventId: string;
//   existingRequests?: TransportationRequest[];
//   onSave: (request: TransportationRequest) => void;
//   onUpdate: (request: TransportationRequest) => void;
//   onCancel: (requestId: string) => void;
// }

// // Mock data
// const vehicleOptions: VehicleOption[] = [
//   {
//     type: 'sedan',
//     name: 'Standard Sedan',
//     capacity: 4,
//     description: 'Comfortable car for small groups',
//     baseCost: 500,
//     perKmCost: 12,
//     amenities: ['AC', 'Music System'],
//     icon: Car
//   },
//   {
//     type: 'suv',
//     name: 'SUV/Large Car',
//     capacity: 6,
//     description: 'Spacious vehicle for groups with luggage',
//     baseCost: 800,
//     perKmCost: 15,
//     amenities: ['AC', 'Music System', 'Extra Space'],
//     icon: Car
//   },
//   {
//     type: 'bus',
//     name: 'Mini Bus',
//     capacity: 15,
//     description: 'Group transportation',
//     baseCost: 1500,
//     perKmCost: 25,
//     amenities: ['AC', 'Music System', 'Group Seating'],
//     icon: Bus
//   },
//   {
//     type: 'taxi',
//     name: 'App Taxi',
//     capacity: 4,
//     description: 'On-demand taxi service',
//     baseCost: 300,
//     perKmCost: 10,
//     amenities: ['AC', 'GPS Tracking'],
//     icon: Car
//   },
//   {
//     type: 'shuttle',
//     name: 'Hotel Shuttle',
//     capacity: 8,
//     description: 'Complimentary hotel transportation',
//     baseCost: 0,
//     perKmCost: 0,
//     amenities: ['Free Service', 'AC'],
//     icon: Bus
//   },
//   {
//     type: 'luxury',
//     name: 'Luxury Car',
//     capacity: 4,
//     description: 'Premium transportation experience',
//     baseCost: 1500,
//     perKmCost: 30,
//     amenities: ['Luxury Interior', 'Professional Driver', 'Refreshments'],
//     icon: Car
//   }
// ];

// const predefinedRoutes = [
//   { from: 'Airport', to: 'Hotel District', distance: 25, duration: 45 },
//   { from: 'Hotel District', to: 'Conference Venue', distance: 5, duration: 15 },
//   { from: 'Conference Venue', to: 'Hotel District', distance: 5, duration: 15 },
//   { from: 'Hotel District', to: 'Airport', distance: 25, duration: 45 },
//   { from: 'Airport', to: 'Conference Venue', distance: 30, duration: 50 },
//   { from: 'Conference Venue', to: 'Airport', distance: 30, duration: 50 }
// ];

// export default function TransportationTracker({ 
//   userId, 
//   eventId, 
//   existingRequests = [], 
//   onSave, 
//   onUpdate, 
//   onCancel 
// }: TransportationTrackerProps) {
//   const [activeTab, setActiveTab] = useState('new-request');
//   const [newRequest, setNewRequest] = useState<Partial<TransportationRequest>>({
//     userId,
//     eventId,
//     type: 'airport_pickup',
//     status: 'requested',
//     priority: 'medium',
//     pickupLocation: '',
//     dropoffLocation: '',
//     scheduledDate: new Date(),
//     scheduledTime: '',
//     numberOfPassengers: 1,
//     passengerNames: [''],
//     vehicleType: 'sedan',
//     contactPerson: '',
//     contactPhone: '',
//     estimatedCost: 0,
//     currency: 'INR',
//     paymentMethod: 'organization',
//     paymentStatus: 'pending',
//     createdAt: new Date(),
//     updatedAt: new Date()
//   });
  
//   const [selectedRequest, setSelectedRequest] = useState<TransportationRequest | null>(null);
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [isEditing, setIsEditing] = useState(false);

//   // Calculate estimated cost
//   const estimatedCost = useMemo(() => {
//     const vehicle = vehicleOptions.find(v => v.type === newRequest.vehicleType);
//     if (!vehicle) return 0;

//     // Find predefined route or use default distance
//     const route = predefinedRoutes.find(r => 
//       (r.from.toLowerCase().includes(newRequest.pickupLocation?.toLowerCase() || '') ||
//        newRequest.pickupLocation?.toLowerCase().includes(r.from.toLowerCase() || '')) &&
//       (r.to.toLowerCase().includes(newRequest.dropoffLocation?.toLowerCase() || '') ||
//        newRequest.dropoffLocation?.toLowerCase().includes(r.to.toLowerCase() || ''))
//     );
    
//     const distance = route?.distance || 10; // Default 10km
//     return vehicle.baseCost + (vehicle.perKmCost * distance);
//   }, [newRequest.vehicleType, newRequest.pickupLocation, newRequest.dropoffLocation]);

//   // Handle field changes
//   const handleFieldChange = useCallback((field: keyof TransportationRequest, value: any) => {
//     setNewRequest(prev => ({
//       ...prev,
//       [field]: value
//     }));
    
//     // Clear error when field is updated
//     if (errors[field]) {
//       setErrors(prev => ({ ...prev, [field]: '' }));
//     }
//   }, [errors]);

//   // Handle passenger names
//   const handlePassengerNameChange = useCallback((index: number, name: string) => {
//     setNewRequest(prev => ({
//       ...prev,
//       passengerNames: prev.passengerNames?.map((passengerName, i) => i === index ? name : passengerName) || []
//     }));
//   }, []);

//   const addPassenger = useCallback(() => {
//     if ((newRequest.passengerNames?.length || 0) < 8) {
//       setNewRequest(prev => ({
//         ...prev,
//         numberOfPassengers: (prev.numberOfPassengers || 0) + 1,
//         passengerNames: [...(prev.passengerNames || []), '']
//       }));
//     }
//   }, [newRequest.passengerNames]);

//   const removePassenger = useCallback((index: number) => {
//     if ((newRequest.passengerNames?.length || 0) > 1) {
//       setNewRequest(prev => ({
//         ...prev,
//         numberOfPassengers: (prev.numberOfPassengers || 0) - 1,
//         passengerNames: prev.passengerNames?.filter((_, i) => i !== index) || []
//       }));
//     }
//   }, [newRequest.passengerNames]);

//   // Handle quick route selection
//   const handleQuickRouteSelect = useCallback((route: typeof predefinedRoutes[0]) => {
//     setNewRequest(prev => ({
//       ...prev,
//       pickupLocation: route.from,
//       dropoffLocation: route.to,
//       estimatedDuration: route.duration
//     }));
//   }, []);

//   // Validate form
//   const validateForm = (): boolean => {
//     const newErrors: Record<string, string> = {};

//     if (!newRequest.pickupLocation?.trim()) {
//       newErrors.pickupLocation = 'Pickup location is required';
//     }

//     if (!newRequest.dropoffLocation?.trim()) {
//       newErrors.dropoffLocation = 'Drop-off location is required';
//     }

//     if (!newRequest.scheduledTime) {
//       newErrors.scheduledTime = 'Pickup time is required';
//     }

//     if (!newRequest.contactPerson?.trim()) {
//       newErrors.contactPerson = 'Contact person is required';
//     }

//     if (!newRequest.contactPhone?.trim()) {
//       newErrors.contactPhone = 'Contact phone is required';
//     }

//     if (newRequest.passengerNames?.some(name => !name.trim())) {
//       newErrors.passengerNames = 'All passenger names are required';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // Handle form submission
//   const handleSubmit = useCallback(() => {
//     if (!validateForm()) {
//       return;
//     }

//     const requestToSave: TransportationRequest = {
//       ...newRequest,
//       estimatedCost,
//       estimatedDuration: newRequest.estimatedDuration || 30
//     } as TransportationRequest;

//     if (isEditing && selectedRequest) {
//       onUpdate(requestToSave);
//     } else {
//       onSave(requestToSave);
//     }

//     // Reset form
//     setNewRequest({
//       userId,
//       eventId,
//       type: 'airport_pickup',
//       status: 'requested',
//       priority: 'medium',
//       pickupLocation: '',
//       dropoffLocation: '',
//       scheduledDate: new Date(),
//       scheduledTime: '',
//       numberOfPassengers: 1,
//       passengerNames: [''],
//       vehicleType: 'sedan',
//       contactPerson: '',
//       contactPhone: '',
//       estimatedCost: 0,
//       currency: 'INR',
//       paymentMethod: 'organization',
//       paymentStatus: 'pending',
//       createdAt: new Date(),
//       updatedAt: new Date()
//     });
//     setIsEditing(false);
//     setSelectedRequest(null);
//   }, [newRequest, estimatedCost, isEditing, selectedRequest, onSave, onUpdate, userId, eventId]);

//   // Handle edit request
//   const handleEditRequest = useCallback((request: TransportationRequest) => {
//     setNewRequest(request);
//     setSelectedRequest(request);
//     setIsEditing(true);
//     setActiveTab('new-request');
//   }, []);

//   // Get status color
//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'confirmed': return 'bg-green-100 text-green-800';
//       case 'in_transit': return 'bg-blue-100 text-blue-800';
//       case 'completed': return 'bg-gray-100 text-gray-800';
//       case 'cancelled': return 'bg-red-100 text-red-800';
//       default: return 'bg-yellow-100 text-yellow-800';
//     }
//   };

//   // Get priority color
//   const getPriorityColor = (priority: string) => {
//     switch (priority) {
//       case 'high': return 'bg-red-100 text-red-800';
//       case 'low': return 'bg-gray-100 text-gray-800';
//       default: return 'bg-blue-100 text-blue-800';
//     }
//   };

//   return (
//     <div className="max-w-6xl mx-auto p-6 space-y-6">
//       {/* Header */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Car className="w-6 h-6" />
//             Transportation Management
//           </CardTitle>
//           <CardDescription>
//             Coordinate airport transfers, hotel shuttles, and local transportation
//           </CardDescription>
//         </CardHeader>
//       </Card>

//       {/* Main Interface */}
//       <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
//         <TabsList className="grid w-full grid-cols-3">
//           <TabsTrigger value="new-request">New Request</TabsTrigger>
//           <TabsTrigger value="my-requests">My Requests ({existingRequests.length})</TabsTrigger>
//           <TabsTrigger value="tracking">Live Tracking</TabsTrigger>
//         </TabsList>

//         {/* New Request Tab */}
//         <TabsContent value="new-request" className="space-y-6">
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             {/* Request Form */}
//             <div className="lg:col-span-2 space-y-6">
//               {/* Transport Type & Route */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Transportation Details</CardTitle>
//                   <CardDescription>Specify your transportation requirements</CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-6">
//                   {/* Transport Type */}
//                   <div>
//                     <Label>Transportation Type</Label>
//                     <Select
//                       value={newRequest.type}
//                       onValueChange={(value) => handleFieldChange('type', value)}
//                     >
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="airport_pickup">Airport Pickup</SelectItem>
//                         <SelectItem value="airport_drop">Airport Drop-off</SelectItem>
//                         <SelectItem value="hotel_venue">Hotel to Venue</SelectItem>
//                         <SelectItem value="venue_hotel">Venue to Hotel</SelectItem>
//                         <SelectItem value="local_transport">Local Transportation</SelectItem>
//                         <SelectItem value="sightseeing">Sightseeing</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   {/* Quick Route Selection */}
//                   <div>
//                     <Label className="mb-2 block">Quick Route Selection</Label>
//                     <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
//                       {predefinedRoutes.map((route, index) => (
//                         <Button
//                           key={index}
//                           variant="outline"
//                           size="sm"
//                           onClick={() => handleQuickRouteSelect(route)}
//                           className="text-xs p-2 h-auto"
//                         >
//                           <div className="flex flex-col items-center gap-1">
//                             <Route className="w-4 h-4" />
//                             <span>{route.from}</span>
//                             <span className="text-gray-500">to</span>
//                             <span>{route.to}</span>
//                             <Badge variant="secondary" className="text-xs">
//                               {route.duration}min
//                             </Badge>
//                           </div>
//                         </Button>
//                       ))}
//                     </div>
//                   </div>

//                   {/* Pickup & Drop-off Locations */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <Label htmlFor="pickupLocation">Pickup Location *</Label>
//                       <Input
//                         id="pickupLocation"
//                         value={newRequest.pickupLocation || ''}
//                         onChange={(e) => handleFieldChange('pickupLocation', e.target.value)}
//                         placeholder="Enter pickup address"
//                         className={errors.pickupLocation ? 'border-red-500' : ''}
//                       />
//                       {errors.pickupLocation && (
//                         <p className="text-red-500 text-sm mt-1">{errors.pickupLocation}</p>
//                       )}
//                     </div>

//                     <div>
//                       <Label htmlFor="dropoffLocation">Drop-off Location *</Label>
//                       <Input
//                         id="dropoffLocation"
//                         value={newRequest.dropoffLocation || ''}
//                         onChange={(e) => handleFieldChange('dropoffLocation', e.target.value)}
//                         placeholder="Enter destination address"
//                         className={errors.dropoffLocation ? 'border-red-500' : ''}
//                       />
//                       {errors.dropoffLocation && (
//                         <p className="text-red-500 text-sm mt-1">{errors.dropoffLocation}</p>
//                       )}
//                     </div>
//                   </div>

//                   {/* Date and Time */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <Label>Pickup Date</Label>
//                       <Popover>
//                         <PopoverTrigger asChild>
//                           <Button variant="outline" className="w-full justify-start text-left font-normal">
//                             <CalendarIcon className="mr-2 h-4 w-4" />
//                             {format(newRequest.scheduledDate || new Date(), "PPP")}
//                           </Button>
//                         </PopoverTrigger>
//                         <PopoverContent className="w-auto p-0" align="start">
//                           <Calendar
//                             mode="single"
//                             selected={newRequest.scheduledDate}
//                             onSelect={(date) => date && handleFieldChange('scheduledDate', date)}
//                             initialFocus
//                           />
//                         </PopoverContent>
//                       </Popover>
//                     </div>

//                     <div>
//                       <Label htmlFor="scheduledTime">Pickup Time *</Label>
//                       <Input
//                         id="scheduledTime"
//                         type="time"
//                         value={newRequest.scheduledTime || ''}
//                         onChange={(e) => handleFieldChange('scheduledTime', e.target.value)}
//                         className={errors.scheduledTime ? 'border-red-500' : ''}
//                       />
//                       {errors.scheduledTime && (
//                         <p className="text-red-500 text-sm mt-1">{errors.scheduledTime}</p>
//                       )}
//                     </div>
//                   </div>

//                   {/* Priority */}
//                   <div>
//                     <Label>Priority Level</Label>
//                     <Select
//                       value={newRequest.priority}
//                       onValueChange={(value) => handleFieldChange('priority', value)}
//                     >
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="high">High Priority</SelectItem>
//                         <SelectItem value="medium">Medium Priority</SelectItem>
//                         <SelectItem value="low">Low Priority</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Vehicle Selection */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Vehicle Selection</CardTitle>
//                   <CardDescription>Choose your preferred vehicle type</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {vehicleOptions.map((vehicle) => (
//                       <div
//                         key={vehicle.type}
//                         className={`border rounded-lg p-4 cursor-pointer transition-colors ${
//                           newRequest.vehicleType === vehicle.type
//                             ? 'border-blue-500 bg-blue-50'
//                             : 'hover:bg-gray-50'
//                         }`}
//                         onClick={() => handleFieldChange('vehicleType', vehicle.type)}
//                       >
//                         <div className="flex flex-col items-center gap-3">
//                           <vehicle.icon className="w-8 h-8 text-blue-600" />
//                           <div className="text-center">
//                             <h4 className="font-semibold">{vehicle.name}</h4>
//                             <p className="text-sm text-gray-600">{vehicle.description}</p>
//                             <Badge variant="secondary" className="text-xs mt-1">
//                               Up to {vehicle.capacity} passengers
//                             </Badge>
//                           </div>
//                           <div className="text-center">
//                             <p className="text-lg font-bold text-blue-600">
//                               ₹{vehicle.baseCost}
//                             </p>
//                             <p className="text-xs text-gray-500">
//                               + ₹{vehicle.perKmCost}/km
//                             </p>
//                           </div>
//                           <div className="flex flex-wrap gap-1 justify-center">
//                             {vehicle.amenities.map((amenity) => (
//                               <Badge key={amenity} variant="outline" className="text-xs">
//                                 {amenity}
//                               </Badge>
//                             ))}
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Passenger Information */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Passenger Information</CardTitle>
//                   <CardDescription>Provide details for all passengers</CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-6">
//                   {/* Number of Passengers */}
//                   <div>
//                     <Label htmlFor="numberOfPassengers">Number of Passengers</Label>
//                     <Select
//                       value={newRequest.numberOfPassengers?.toString() || '1'}
//                       onValueChange={(value) => {
//                         const num = parseInt(value);
//                         handleFieldChange('numberOfPassengers', num);
//                         // Adjust passenger names array
//                         const names = [...(newRequest.passengerNames || [])];
//                         while (names.length < num) names.push('');
//                         while (names.length > num) names.pop();
//                         handleFieldChange('passengerNames', names);
//                       }}
//                     >
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
//                           <SelectItem key={num} value={num.toString()}>
//                             {num} Passenger{num > 1 ? 's' : ''}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   {/* Passenger Names */}
//                   <div>
//                     <Label>Passenger Names</Label>
//                     <div className="space-y-3 mt-2">
//                       {(newRequest.passengerNames || []).map((name, index) => (
//                         <div key={index} className="flex items-center gap-3">
//                           <div className="flex-1">
//                             <Input
//                               value={name}
//                               onChange={(e) => handlePassengerNameChange(index, e.target.value)}
//                               placeholder={`Passenger ${index + 1} full name`}
//                               className={errors.passengerNames ? 'border-red-500' : ''}
//                             />
//                           </div>
//                           <Badge variant="secondary">#{index + 1}</Badge>
//                         </div>
//                       ))}
//                     </div>
//                     {errors.passengerNames && (
//                       <p className="text-red-500 text-sm mt-1">{errors.passengerNames}</p>
//                     )}
//                   </div>

//                   {/* Contact Information */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <Label htmlFor="contactPerson">Contact Person *</Label>
//                       <Input
//                         id="contactPerson"
//                         value={newRequest.contactPerson || ''}
//                         onChange={(e) => handleFieldChange('contactPerson', e.target.value)}
//                         placeholder="Primary contact name"
//                         className={errors.contactPerson ? 'border-red-500' : ''}
//                       />
//                       {errors.contactPerson && (
//                         <p className="text-red-500 text-sm mt-1">{errors.contactPerson}</p>
//                       )}
//                     </div>

//                     <div>
//                       <Label htmlFor="contactPhone">Contact Phone *</Label>
//                       <Input
//                         id="contactPhone"
//                         value={newRequest.contactPhone || ''}
//                         onChange={(e) => handleFieldChange('contactPhone', e.target.value)}
//                         placeholder="+91 98765 43210"
//                         className={errors.contactPhone ? 'border-red-500' : ''}
//                       />
//                       {errors.contactPhone && (
//                         <p className="text-red-500 text-sm mt-1">{errors.contactPhone}</p>
//                       )}
//                     </div>
//                   </div>

//                   {/* Special Instructions */}
//                   <div>
//                     <Label htmlFor="specialInstructions">Special Instructions</Label>
//                     <Textarea
//                       id="specialInstructions"
//                       value={newRequest.specialInstructions || ''}
//                       onChange={(e) => handleFieldChange('specialInstructions', e.target.value)}
//                       placeholder="Any special requirements, landmarks, or instructions for the driver"
//                       rows={3}
//                     />
//                   </div>

//                   {/* Accessibility Needs */}
//                   <div>
//                     <Label htmlFor="accessibilityNeeds">Accessibility Requirements</Label>
//                     <Textarea
//                       id="accessibilityNeeds"
//                       value={newRequest.accessibilityNeeds || ''}
//                       onChange={(e) => handleFieldChange('accessibilityNeeds', e.target.value)}
//                       placeholder="Wheelchair accessibility, assistance requirements, etc."
//                       rows={2}
//                     />
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Booking Summary */}
//             <div className="lg:col-span-1">
//               <Card className="sticky top-6">
//                 <CardHeader>
//                   <CardTitle>Booking Summary</CardTitle>
//                   <CardDescription>Review your transportation request</CardDescription>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div className="space-y-3">
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Type:</span>
//                       <span className="font-medium capitalize">{newRequest.type?.replace('_', ' ')}</span>
//                     </div>
                    
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Route:</span>
//                       <div className="text-right">
//                         <p className="font-medium">{newRequest.pickupLocation || 'Not set'}</p>
//                         <p className="text-sm text-gray-500">to</p>
//                         <p className="font-medium">{newRequest.dropoffLocation || 'Not set'}</p>
//                       </div>
//                     </div>
                    
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Date & Time:</span>
//                       <div className="text-right">
//                         <p className="font-medium">
//                           {format(newRequest.scheduledDate || new Date(), "MMM dd, yyyy")}
//                         </p>
//                         <p className="text-sm text-gray-500">{newRequest.scheduledTime || 'Not set'}</p>
//                       </div>
//                     </div>
                    
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Vehicle:</span>
//                       <span className="font-medium capitalize">{newRequest.vehicleType}</span>
//                     </div>
                    
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Passengers:</span>
//                       <span className="font-medium">{newRequest.numberOfPassengers}</span>
//                     </div>
                    
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Priority:</span>
//                       <Badge className={getPriorityColor(newRequest.priority || 'medium')}>
//                         {newRequest.priority}
//                       </Badge>
//                     </div>
                    
//                     <hr />
                    
//                     <div className="flex justify-between text-lg font-semibold">
//                       <span>Estimated Cost:</span>
//                       <span>₹{estimatedCost.toLocaleString()}</span>
//                     </div>
//                   </div>

//                   {/* Payment Method */}
//                   <div className="pt-4 border-t">
//                     <Label>Payment Method</Label>
//                     <Select
//                       value={newRequest.paymentMethod}
//                       onValueChange={(value) => handleFieldChange('paymentMethod', value)}
//                     >
//                       <SelectTrigger className="mt-2">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="organization">Organization Pays</SelectItem>
//                         <SelectItem value="self">Self Payment</SelectItem>
//                         <SelectItem value="driver">Pay Driver</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   {/* Submit Button */}
//                   <div className="pt-4">
//                     <Button onClick={handleSubmit} className="w-full">
//                       <Save className="w-4 h-4 mr-2" />
//                       {isEditing ? 'Update Request' : 'Submit Request'}
//                     </Button>
//                   </div>

//                   {/* Validation Status */}
//                   <div className="pt-2">
//                     <Badge variant="secondary" className="w-full justify-center">
//                       {Object.keys(errors).length === 0 ? (
//                         <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
//                       ) : (
//                         <AlertTriangle className="w-4 h-4 mr-1 text-red-600" />
//                       )}
//                       {Object.keys(errors).length === 0 ? 'Ready to Submit' : `${Object.keys(errors).length} errors`}
//                     </Badge>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           </div>
//         </TabsContent>

//         {/* My Requests Tab */}
//         <TabsContent value="my-requests" className="space-y-4">
//           <Card>
//             <CardHeader>
//               <CardTitle>My Transportation Requests</CardTitle>
//               <CardDescription>View and manage your transportation bookings</CardDescription>
//             </CardHeader>
//             <CardContent>
//               {existingRequests.length === 0 ? (
//                 <div className="text-center py-8">
//                   <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//                   <p className="text-gray-500">No transportation requests found</p>
//                   <Button onClick={() => setActiveTab('new-request')} className="mt-4">
//                     <Plus className="w-4 h-4 mr-2" />
//                     Create New Request
//                   </Button>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   {existingRequests.map((request) => (
//                     <div key={request.id} className="border rounded-lg p-4">
//                       <div className="flex items-start justify-between">
//                         <div className="flex-1">
//                           <div className="flex items-center gap-3 mb-2">
//                             <h4 className="font-semibold capitalize">
//                               {request.type.replace('_', ' ')}
//                             </h4>
//                             <Badge className={getStatusColor(request.status)}>
//                               {request.status}
//                             </Badge>
//                             <Badge className={getPriorityColor(request.priority)}>
//                               {request.priority}
//                             </Badge>
//                           </div>
                          
//                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
//                             <div className="flex items-center gap-1">
//                               <MapPin className="w-4 h-4" />
//                               {request.pickupLocation} → {request.dropoffLocation}
//                             </div>
//                             <div className="flex items-center gap-1">
//                               <Clock className="w-4 h-4" />
//                               {format(request.scheduledDate, "MMM dd")} at {request.scheduledTime}
//                             </div>
//                             <div className="flex items-center gap-1">
//                               <Users className="w-4 h-4" />
//                               {request.numberOfPassengers} passenger{request.numberOfPassengers > 1 ? 's' : ''}
//                             </div>
//                           </div>

//                           <div className="flex items-center gap-4 text-sm">
//                             <span>Vehicle: <strong className="capitalize">{request.vehicleType}</strong></span>
//                             <span>Cost: <strong>₹{request.estimatedCost.toLocaleString()}</strong></span>
//                             {request.driverName && (
//                               <span>Driver: <strong>{request.driverName}</strong></span>
//                             )}
//                           </div>

//                           {request.specialInstructions && (
//                             <p className="text-sm text-gray-600 mt-2 italic">
//                               "{request.specialInstructions}"
//                             </p>
//                           )}
//                         </div>

//                         <div className="flex flex-col gap-2">
//                           <Button variant="outline" size="sm" onClick={() => handleEditRequest(request)}>
//                             <Edit className="w-4 h-4 mr-1" />
//                             Edit
//                           </Button>
//                           {request.status === 'requested' && (
//                             <Button variant="outline" size="sm" onClick={() => onCancel(request.id!)}>
//                               <X className="w-4 h-4 mr-1" />
//                               Cancel
//                             </Button>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* Live Tracking Tab */}
//         <TabsContent value="tracking" className="space-y-4">
//           <Card>
//             <CardHeader>
//               <CardTitle>Live Transportation Tracking</CardTitle>
//               <CardDescription>Track your active transportation requests in real-time</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="text-center py-8">
//                 <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//                 <p className="text-gray-500 mb-4">Real-time tracking will be available once your transportation is assigned</p>
//                 <Alert>
//                   <Timer className="h-4 w-4" />
//                   <AlertDescription>
//                     <strong>Coming Soon:</strong> GPS tracking, driver contact, estimated arrival times, and live route updates.
//                   </AlertDescription>
//                 </Alert>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }