// // src/components/hospitality/accommodation-form.tsx

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
//   Hotel, 
//   Calendar as CalendarIcon,
//   MapPin,
//   User,
//   Users,
//   Bed,
//   Wifi,
//   Car,
//   Utensils,
//   Dumbbell,
//   Waves,
//   Coffee,
//   CheckCircle2,
//   AlertTriangle,
//   Star,
//   Clock,
//   Phone,
//   Mail,
//   CreditCard,
//   Save,
//   X,
//   Edit,
//   Plus,
//   Trash2
// } from 'lucide-react';
// import { format, differenceInDays } from 'date-fns';

// // Types
// interface AccommodationDetails {
//   id?: string;
//   userId: string;
//   eventId: string;
//   hotelId?: string;
//   hotelName: string;
//   hotelAddress: string;
//   hotelPhone: string;
//   hotelEmail: string;
//   roomType: 'single' | 'double' | 'twin' | 'suite' | 'family' | 'accessible';
//   roomNumber?: string;
//   checkInDate: Date;
//   checkOutDate: Date;
//   earlyCheckIn?: boolean;
//   lateCheckOut?: boolean;
//   numberOfGuests: number;
//   guestNames: string[];
//   roomPreferences: {
//     floor: 'low' | 'middle' | 'high' | 'any';
//     view: 'city' | 'garden' | 'pool' | 'sea' | 'mountain' | 'any';
//     bedType: 'single' | 'double' | 'twin' | 'king' | 'queen' | 'any';
//     smokingRoom: boolean;
//     quietRoom: boolean;
//     balcony: boolean;
//     airConditioning: boolean;
//   };
//   amenities: string[];
//   specialRequests?: string;
//   bookingStatus: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
//   bookingReference?: string;
//   dailyRate: number;
//   totalCost: number;
//   currency: string;
//   paymentMethod: 'organization' | 'self' | 'reimbursement';
//   paymentStatus: 'pending' | 'paid' | 'partial' | 'overdue';
//   emergencyContact?: {
//     name: string;
//     phone: string;
//     relation: string;
//   };
//   dietaryRestrictions?: string;
//   accessibilityNeeds?: string;
// }

// interface HotelOption {
//   id: string;
//   name: string;
//   address: string;
//   phone: string;
//   email: string;
//   starRating: number;
//   dailyRates: Record<string, number>;
//   amenities: string[];
//   description: string;
//   distance: string;
//   images: string[];
// }

// interface AccommodationFormProps {
//   userId: string;
//   eventId: string;
//   existingAccommodation?: AccommodationDetails;
//   availableHotels?: HotelOption[];
//   onSave: (accommodationDetails: AccommodationDetails) => void;
//   onCancel: () => void;
//   isEditing?: boolean;
// }

// // Mock hotel data
// const mockHotels: HotelOption[] = [
//   {
//     id: 'hotel_1',
//     name: 'Grand Conference Hotel',
//     address: '123 Business District, Conference City',
//     phone: '+91 11 2345 6789',
//     email: 'reservations@grandconference.com',
//     starRating: 5,
//     dailyRates: { single: 8000, double: 12000, suite: 18000 },
//     amenities: ['Free WiFi', 'Restaurant', 'Gym', 'Pool', 'Spa', 'Business Center', 'Parking'],
//     description: 'Luxury hotel in the heart of the business district',
//     distance: '0.5 km from venue',
//     images: ['/hotels/grand-1.jpg', '/hotels/grand-2.jpg']
//   },
//   {
//     id: 'hotel_2',
//     name: 'Business Inn & Suites',
//     address: '456 Corporate Avenue, Conference City',
//     phone: '+91 11 3456 7890',
//     email: 'booking@businessinn.com',
//     starRating: 4,
//     dailyRates: { single: 5000, double: 7500, suite: 12000 },
//     amenities: ['Free WiFi', 'Restaurant', 'Gym', 'Business Center', 'Parking'],
//     description: 'Modern business hotel with excellent facilities',
//     distance: '1.2 km from venue',
//     images: ['/hotels/business-1.jpg', '/hotels/business-2.jpg']
//   },
//   {
//     id: 'hotel_3',
//     name: 'Economy Lodge',
//     address: '789 Budget Street, Conference City',
//     phone: '+91 11 4567 8901',
//     email: 'info@economylodge.com',
//     starRating: 3,
//     dailyRates: { single: 3000, double: 4500, suite: 7000 },
//     amenities: ['Free WiFi', 'Restaurant', 'Parking'],
//     description: 'Comfortable and affordable accommodation',
//     distance: '2.5 km from venue',
//     images: ['/hotels/economy-1.jpg']
//   }
// ];

// const roomTypeOptions = [
//   { value: 'single', label: 'Single Room', icon: User, description: '1 guest, 1 bed' },
//   { value: 'double', label: 'Double Room', icon: Users, description: '2 guests, 1 double bed' },
//   { value: 'twin', label: 'Twin Room', icon: Bed, description: '2 guests, 2 single beds' },
//   { value: 'suite', label: 'Suite', icon: Hotel, description: 'Spacious with separate living area' },
//   { value: 'family', label: 'Family Room', icon: Users, description: '3-4 guests, multiple beds' },
//   { value: 'accessible', label: 'Accessible Room', icon: Users, description: 'Wheelchair accessible' }
// ];

// const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
//   'Free WiFi': Wifi,
//   'Restaurant': Utensils,
//   'Gym': Dumbbell,
//   'Pool': Waves,
//   'Business Center': Coffee,
//   'Parking': Car,
//   'Spa': Hotel
// };

// export default function AccommodationForm({ 
//   userId, 
//   eventId, 
//   existingAccommodation, 
//   availableHotels = mockHotels,
//   onSave, 
//   onCancel, 
//   isEditing = false 
// }: AccommodationFormProps) {
//   const [accommodationDetails, setAccommodationDetails] = useState<AccommodationDetails>(
//     existingAccommodation || {
//       userId,
//       eventId,
//       hotelName: '',
//       hotelAddress: '',
//       hotelPhone: '',
//       hotelEmail: '',
//       roomType: 'single',
//       checkInDate: new Date(),
//       checkOutDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
//       numberOfGuests: 1,
//       guestNames: [''],
//       roomPreferences: {
//         floor: 'any',
//         view: 'any',
//         bedType: 'any',
//         smokingRoom: false,
//         quietRoom: true,
//         balcony: false,
//         airConditioning: true
//       },
//       amenities: [],
//       bookingStatus: 'pending',
//       dailyRate: 0,
//       totalCost: 0,
//       currency: 'INR',
//       paymentMethod: 'organization',
//       paymentStatus: 'pending'
//     }
//   );

//   const [activeTab, setActiveTab] = useState('hotel');
//   const [selectedHotel, setSelectedHotel] = useState<HotelOption | null>(
//     availableHotels.find(h => h.id === accommodationDetails.hotelId) || null
//   );
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [showEmergencyContact, setShowEmergencyContact] = useState(false);

//   // Calculate number of nights and total cost
//   const numberOfNights = useMemo(() => {
//     return differenceInDays(accommodationDetails.checkOutDate, accommodationDetails.checkInDate);
//   }, [accommodationDetails.checkInDate, accommodationDetails.checkOutDate]);

//   const calculatedTotalCost = useMemo(() => {
//     if (selectedHotel && accommodationDetails.roomType) {
//       const dailyRate = selectedHotel.dailyRates[accommodationDetails.roomType] || 0;
//       return dailyRate * numberOfNights;
//     }
//     return accommodationDetails.dailyRate * numberOfNights;
//   }, [selectedHotel, accommodationDetails.roomType, accommodationDetails.dailyRate, numberOfNights]);

//   // Handle field changes
//   const handleFieldChange = useCallback((field: keyof AccommodationDetails, value: any) => {
//     setAccommodationDetails(prev => ({
//       ...prev,
//       [field]: value
//     }));
    
//     // Clear error when field is updated
//     if (errors[field]) {
//       setErrors(prev => ({ ...prev, [field]: '' }));
//     }
//   }, [errors]);

//   // Handle room preferences changes
//   const handleRoomPreferenceChange = useCallback((field: string, value: any) => {
//     setAccommodationDetails(prev => ({
//       ...prev,
//       roomPreferences: {
//         ...prev.roomPreferences,
//         [field]: value
//       }
//     }));
//   }, []);

//   // Handle hotel selection
//   const handleHotelSelection = useCallback((hotel: HotelOption) => {
//     setSelectedHotel(hotel);
//     setAccommodationDetails(prev => ({
//       ...prev,
//       hotelId: hotel.id,
//       hotelName: hotel.name,
//       hotelAddress: hotel.address,
//       hotelPhone: hotel.phone,
//       hotelEmail: hotel.email,
//       amenities: hotel.amenities,
//       dailyRate: hotel.dailyRates[prev.roomType] || 0,
//       totalCost: calculatedTotalCost
//     }));
//   }, [calculatedTotalCost]);

//   // Handle guest names
//   const handleGuestNameChange = useCallback((index: number, name: string) => {
//     setAccommodationDetails(prev => ({
//       ...prev,
//       guestNames: prev.guestNames.map((guestName, i) => i === index ? name : guestName)
//     }));
//   }, []);

//   const addGuest = useCallback(() => {
//     if (accommodationDetails.guestNames.length < 4) {
//       setAccommodationDetails(prev => ({
//         ...prev,
//         numberOfGuests: prev.numberOfGuests + 1,
//         guestNames: [...prev.guestNames, '']
//       }));
//     }
//   }, [accommodationDetails.guestNames.length]);

//   const removeGuest = useCallback((index: number) => {
//     if (accommodationDetails.guestNames.length > 1) {
//       setAccommodationDetails(prev => ({
//         ...prev,
//         numberOfGuests: prev.numberOfGuests - 1,
//         guestNames: prev.guestNames.filter((_, i) => i !== index)
//       }));
//     }
//   }, [accommodationDetails.guestNames.length]);

//   // Handle amenity selection
//   const handleAmenityToggle = useCallback((amenity: string) => {
//     setAccommodationDetails(prev => ({
//       ...prev,
//       amenities: prev.amenities.includes(amenity)
//         ? prev.amenities.filter(a => a !== amenity)
//         : [...prev.amenities, amenity]
//     }));
//   }, []);

//   // Validate form
//   const validateForm = (): boolean => {
//     const newErrors: Record<string, string> = {};

//     if (!accommodationDetails.hotelName.trim()) {
//       newErrors.hotelName = 'Hotel selection is required';
//     }

//     if (accommodationDetails.numberOfGuests < 1) {
//       newErrors.numberOfGuests = 'At least one guest is required';
//     }

//     if (accommodationDetails.guestNames.some(name => !name.trim())) {
//       newErrors.guestNames = 'All guest names are required';
//     }

//     if (numberOfNights < 1) {
//       newErrors.dates = 'Check-out date must be after check-in date';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // Handle form submission
//   const handleSubmit = useCallback(() => {
//     if (!validateForm()) {
//       return;
//     }

//     const finalDetails = {
//       ...accommodationDetails,
//       totalCost: calculatedTotalCost
//     };

//     onSave(finalDetails);
//   }, [accommodationDetails, calculatedTotalCost, onSave]);

//   // Get room type icon
//   const getRoomTypeIcon = (type: string) => {
//     const option = roomTypeOptions.find(opt => opt.value === type);
//     return option ? option.icon : Hotel;
//   };

//   return (
//     <div className="max-w-6xl mx-auto p-6 space-y-6">
//       {/* Header */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Hotel className="w-6 h-6" />
//             {isEditing ? 'Edit Accommodation' : 'Book Accommodation'}
//           </CardTitle>
//           <CardDescription>
//             Manage your hotel booking and room preferences for the conference
//           </CardDescription>
//         </CardHeader>
//       </Card>

//       {/* Main Form */}
//       <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
//         <TabsList className="grid w-full grid-cols-4">
//           <TabsTrigger value="hotel">Hotel Selection</TabsTrigger>
//           <TabsTrigger value="room">Room Details</TabsTrigger>
//           <TabsTrigger value="guests">Guest Information</TabsTrigger>
//           <TabsTrigger value="preferences">Preferences</TabsTrigger>
//         </TabsList>

//         {/* Hotel Selection Tab */}
//         <TabsContent value="hotel" className="space-y-6">
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             {/* Hotel Options */}
//             <div className="lg:col-span-2">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Available Hotels</CardTitle>
//                   <CardDescription>Choose from our partner hotels</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-4">
//                     {availableHotels.map((hotel) => (
//                       <div
//                         key={hotel.id}
//                         className={`border rounded-lg p-4 cursor-pointer transition-colors ${
//                           selectedHotel?.id === hotel.id
//                             ? 'border-blue-500 bg-blue-50'
//                             : 'hover:bg-gray-50'
//                         }`}
//                         onClick={() => handleHotelSelection(hotel)}
//                       >
//                         <div className="flex items-start justify-between">
//                           <div className="flex-1">
//                             <div className="flex items-center gap-2 mb-2">
//                               <h4 className="font-semibold text-lg">{hotel.name}</h4>
//                               <div className="flex">
//                                 {[...Array(hotel.starRating)].map((_, i) => (
//                                   <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
//                                 ))}
//                               </div>
//                             </div>
                            
//                             <p className="text-gray-600 mb-2">{hotel.description}</p>
                            
//                             <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
//                               <span className="flex items-center gap-1">
//                                 <MapPin className="w-4 h-4" />
//                                 {hotel.distance}
//                               </span>
//                               <span className="flex items-center gap-1">
//                                 <Phone className="w-4 h-4" />
//                                 {hotel.phone}
//                               </span>
//                             </div>

//                             <div className="flex flex-wrap gap-2 mb-3">
//                               {hotel.amenities.slice(0, 4).map((amenity) => {
//                                 const Icon = amenityIcons[amenity] || Hotel;
//                                 return (
//                                   <Badge key={amenity} variant="secondary" className="text-xs">
//                                     <Icon className="w-3 h-3 mr-1" />
//                                     {amenity}
//                                   </Badge>
//                                 );
//                               })}
//                               {hotel.amenities.length > 4 && (
//                                 <Badge variant="outline" className="text-xs">
//                                   +{hotel.amenities.length - 4} more
//                                 </Badge>
//                               )}
//                             </div>

//                             <div className="grid grid-cols-3 gap-3 text-sm">
//                               <div>
//                                 <p className="text-gray-500">Single Room</p>
//                                 <p className="font-semibold">₹{hotel.dailyRates.single}/night</p>
//                               </div>
//                               <div>
//                                 <p className="text-gray-500">Double Room</p>
//                                 <p className="font-semibold">₹{hotel.dailyRates.double}/night</p>
//                               </div>
//                               <div>
//                                 <p className="text-gray-500">Suite</p>
//                                 <p className="font-semibold">₹{hotel.dailyRates.suite}/night</p>
//                               </div>
//                             </div>
//                           </div>

//                           {selectedHotel?.id === hotel.id && (
//                             <CheckCircle2 className="w-6 h-6 text-blue-600" />
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Selected Hotel Details */}
//             <div className="lg:col-span-1">
//               {selectedHotel ? (
//                 <Card>
//                   <CardHeader>
//                     <CardTitle>Selected Hotel</CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="space-y-4">
//                       <div>
//                         <h4 className="font-semibold">{selectedHotel.name}</h4>
//                         <p className="text-sm text-gray-600">{selectedHotel.address}</p>
//                       </div>

//                       <div className="space-y-2">
//                         <div className="flex items-center gap-2">
//                           <Phone className="w-4 h-4 text-gray-500" />
//                           <span className="text-sm">{selectedHotel.phone}</span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <Mail className="w-4 h-4 text-gray-500" />
//                           <span className="text-sm">{selectedHotel.email}</span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <MapPin className="w-4 h-4 text-gray-500" />
//                           <span className="text-sm">{selectedHotel.distance}</span>
//                         </div>
//                       </div>

//                       <div>
//                         <Label className="text-sm font-medium">All Amenities</Label>
//                         <div className="flex flex-wrap gap-1 mt-2">
//                           {selectedHotel.amenities.map((amenity) => (
//                             <Badge key={amenity} variant="outline" className="text-xs">
//                               {amenity}
//                             </Badge>
//                           ))}
//                         </div>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               ) : (
//                 <Card>
//                   <CardContent className="p-6 text-center">
//                     <Hotel className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//                     <p className="text-gray-500">Select a hotel to view details</p>
//                   </CardContent>
//                 </Card>
//               )}
//             </div>
//           </div>
//         </TabsContent>

//         {/* Room Details Tab */}
//         <TabsContent value="room" className="space-y-6">
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             {/* Room Type & Dates */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>Room & Dates</CardTitle>
//                 <CardDescription>Choose your room type and stay duration</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 {/* Room Type Selection */}
//                 <div>
//                   <Label>Room Type</Label>
//                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
//                     {roomTypeOptions.map((option) => (
//                       <div
//                         key={option.value}
//                         className={`border rounded-lg p-3 cursor-pointer transition-colors ${
//                           accommodationDetails.roomType === option.value
//                             ? 'border-blue-500 bg-blue-50'
//                             : 'hover:bg-gray-50'
//                         }`}
//                         onClick={() => handleFieldChange('roomType', option.value)}
//                       >
//                         <div className="flex flex-col items-center gap-2">
//                           <option.icon className="w-6 h-6 text-blue-600" />
//                           <span className="text-sm font-medium">{option.label}</span>
//                           <span className="text-xs text-gray-500 text-center">{option.description}</span>
//                           {selectedHotel && (
//                             <Badge variant="secondary" className="text-xs">
//                               ₹{selectedHotel.dailyRates[option.value] || 'N/A'}/night
//                             </Badge>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Check-in/Check-out Dates */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <Label>Check-in Date</Label>
//                     <Popover>
//                       <PopoverTrigger asChild>
//                         <Button variant="outline" className="w-full justify-start text-left font-normal">
//                           <CalendarIcon className="mr-2 h-4 w-4" />
//                           {format(accommodationDetails.checkInDate, "PPP")}
//                         </Button>
//                       </PopoverTrigger>
//                       <PopoverContent className="w-auto p-0" align="start">
//                         <Calendar
//                           mode="single"
//                           selected={accommodationDetails.checkInDate}
//                           onSelect={(date) => date && handleFieldChange('checkInDate', date)}
//                           initialFocus
//                         />
//                       </PopoverContent>
//                     </Popover>
//                   </div>

//                   <div>
//                     <Label>Check-out Date</Label>
//                     <Popover>
//                       <PopoverTrigger asChild>
//                         <Button variant="outline" className="w-full justify-start text-left font-normal">
//                           <CalendarIcon className="mr-2 h-4 w-4" />
//                           {format(accommodationDetails.checkOutDate, "PPP")}
//                         </Button>
//                       </PopoverTrigger>
//                       <PopoverContent className="w-auto p-0" align="start">
//                         <Calendar
//                           mode="single"
//                           selected={accommodationDetails.checkOutDate}
//                           onSelect={(date) => date && handleFieldChange('checkOutDate', date)}
//                           initialFocus
//                         />
//                       </PopoverContent>
//                     </Popover>
//                   </div>
//                 </div>

//                 {/* Early Check-in / Late Check-out */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div className="flex items-center space-x-2">
//                     <Checkbox
//                       id="earlyCheckIn"
//                       checked={accommodationDetails.earlyCheckIn || false}
//                       onCheckedChange={(checked) => handleFieldChange('earlyCheckIn', checked)}
//                     />
//                     <Label htmlFor="earlyCheckIn" className="text-sm">
//                       Early Check-in (before 2 PM)
//                     </Label>
//                   </div>

//                   <div className="flex items-center space-x-2">
//                     <Checkbox
//                       id="lateCheckOut"
//                       checked={accommodationDetails.lateCheckOut || false}
//                       onCheckedChange={(checked) => handleFieldChange('lateCheckOut', checked)}
//                     />
//                     <Label htmlFor="lateCheckOut" className="text-sm">
//                       Late Check-out (after 12 PM)
//                     </Label>
//                   </div>
//                 </div>

//                 {/* Room Number (if editing) */}
//                 {isEditing && (
//                   <div>
//                     <Label htmlFor="roomNumber">Room Number (if assigned)</Label>
//                     <Input
//                       id="roomNumber"
//                       value={accommodationDetails.roomNumber || ''}
//                       onChange={(e) => handleFieldChange('roomNumber', e.target.value)}
//                       placeholder="e.g., 201"
//                     />
//                   </div>
//                 )}
//               </CardContent>
//             </Card>

//             {/* Booking Summary */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>Booking Summary</CardTitle>
//                 <CardDescription>Review your accommodation details</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div className="space-y-3">
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Hotel:</span>
//                     <span className="font-medium">{accommodationDetails.hotelName || 'Not selected'}</span>
//                   </div>
                  
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Room Type:</span>
//                     <span className="font-medium capitalize">{accommodationDetails.roomType}</span>
//                   </div>
                  
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Check-in:</span>
//                     <span className="font-medium">{format(accommodationDetails.checkInDate, "PPP")}</span>
//                   </div>
                  
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Check-out:</span>
//                     <span className="font-medium">{format(accommodationDetails.checkOutDate, "PPP")}</span>
//                   </div>
                  
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Number of Nights:</span>
//                     <span className="font-medium">{numberOfNights}</span>
//                   </div>
                  
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Guests:</span>
//                     <span className="font-medium">{accommodationDetails.numberOfGuests}</span>
//                   </div>
                  
//                   <hr />
                  
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Daily Rate:</span>
//                     <span className="font-medium">₹{accommodationDetails.dailyRate}</span>
//                   </div>
                  
//                   <div className="flex justify-between text-lg font-semibold">
//                     <span>Total Cost:</span>
//                     <span>₹{calculatedTotalCost.toLocaleString()}</span>
//                   </div>
//                 </div>

//                 {/* Payment Information */}
//                 <div className="pt-4 border-t">
//                   <Label>Payment Method</Label>
//                   <Select
//                     value={accommodationDetails.paymentMethod}
//                     onValueChange={(value) => handleFieldChange('paymentMethod', value)}
//                   >
//                     <SelectTrigger className="mt-2">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="organization">Organization Pays</SelectItem>
//                       <SelectItem value="self">Self Payment</SelectItem>
//                       <SelectItem value="reimbursement">Pay & Get Reimbursed</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 {/* Booking Status */}
//                 <div>
//                   <Label>Booking Status</Label>
//                   <Select
//                     value={accommodationDetails.bookingStatus}
//                     onValueChange={(value) => handleFieldChange('bookingStatus', value)}
//                   >
//                     <SelectTrigger className="mt-2">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="pending">Pending Confirmation</SelectItem>
//                       <SelectItem value="confirmed">Confirmed</SelectItem>
//                       <SelectItem value="checked_in">Checked In</SelectItem>
//                       <SelectItem value="checked_out">Checked Out</SelectItem>
//                       <SelectItem value="cancelled">Cancelled</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </TabsContent>

//         {/* Guest Information Tab */}
//         <TabsContent value="guests" className="space-y-6">
//           <Card>
//             <CardHeader>
//               <CardTitle>Guest Information</CardTitle>
//               <CardDescription>Provide details for all guests staying in the room</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               {/* Number of Guests */}
//               <div>
//                 <Label htmlFor="numberOfGuests">Number of Guests</Label>
//                 <Select
//                   value={accommodationDetails.numberOfGuests.toString()}
//                   onValueChange={(value) => {
//                     const num = parseInt(value);
//                     handleFieldChange('numberOfGuests', num);
//                     // Adjust guest names array
//                     const names = [...accommodationDetails.guestNames];
//                     while (names.length < num) names.push('');
//                     while (names.length > num) names.pop();
//                     handleFieldChange('guestNames', names);
//                   }}
//                 >
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {[1, 2, 3, 4].map((num) => (
//                       <SelectItem key={num} value={num.toString()}>
//                         {num} Guest{num > 1 ? 's' : ''}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               {/* Guest Names */}
//               <div>
//                 <Label>Guest Names</Label>
//                 <div className="space-y-3 mt-2">
//                   {accommodationDetails.guestNames.map((name, index) => (
//                     <div key={index} className="flex items-center gap-3">
//                       <div className="flex-1">
//                         <Input
//                           value={name}
//                           onChange={(e) => handleGuestNameChange(index, e.target.value)}
//                           placeholder={`Guest ${index + 1} full name`}
//                           className={errors.guestNames ? 'border-red-500' : ''}
//                         />
//                       </div>
//                       <Badge variant="secondary">Guest {index + 1}</Badge>
//                       {accommodationDetails.guestNames.length > 1 && (
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => removeGuest(index)}
//                         >
//                           <Trash2 className="w-4 h-4" />
//                         </Button>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//                 {errors.guestNames && (
//                   <p className="text-red-500 text-sm mt-1">{errors.guestNames}</p>
//                 )}
//               </div>

//               {/* Additional Guest Information */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <Label htmlFor="dietaryRestrictions">Dietary Restrictions</Label>
//                   <Textarea
//                     id="dietaryRestrictions"
//                     value={accommodationDetails.dietaryRestrictions || ''}
//                     onChange={(e) => handleFieldChange('dietaryRestrictions', e.target.value)}
//                     placeholder="Any dietary restrictions or food allergies"
//                     rows={3}
//                   />
//                 </div>

//                 <div>
//                   <Label htmlFor="accessibilityNeeds">Accessibility Needs</Label>
//                   <Textarea
//                     id="accessibilityNeeds"
//                     value={accommodationDetails.accessibilityNeeds || ''}
//                     onChange={(e) => handleFieldChange('accessibilityNeeds', e.target.value)}
//                     placeholder="Any accessibility requirements"
//                     rows={3}
//                   />
//                 </div>
//               </div>

//               {/* Emergency Contact */}
//               <div>
//                 <div className="flex items-center justify-between mb-4">
//                   <Label>Emergency Contact</Label>
//                   <div className="flex items-center space-x-2">
//                     <Checkbox
//                       id="emergency-contact"
//                       checked={showEmergencyContact}
//                       onCheckedChange={setShowEmergencyContact}
//                     />
//                     <Label htmlFor="emergency-contact" className="text-sm">
//                       Add emergency contact
//                     </Label>
//                   </div>
//                 </div>

//                 {showEmergencyContact && (
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
//                     <div>
//                       <Label>Contact Name</Label>
//                       <Input
//                         value={accommodationDetails.emergencyContact?.name || ''}
//                         onChange={(e) => handleFieldChange('emergencyContact', {
//                           ...accommodationDetails.emergencyContact,
//                           name: e.target.value
//                         })}
//                         placeholder="Full name"
//                       />
//                     </div>
//                     <div>
//                       <Label>Phone Number</Label>
//                       <Input
//                         value={accommodationDetails.emergencyContact?.phone || ''}
//                         onChange={(e) => handleFieldChange('emergencyContact', {
//                           ...accommodationDetails.emergencyContact,
//                           phone: e.target.value
//                         })}
//                         placeholder="+91 98765 43210"
//                       />
//                     </div>
//                     <div>
//                       <Label>Relationship</Label>
//                       <Input
//                         value={accommodationDetails.emergencyContact?.relation || ''}
//                         onChange={(e) => handleFieldChange('emergencyContact', {
//                           ...accommodationDetails.emergencyContact,
//                           relation: e.target.value
//                         })}
//                         placeholder="e.g., Spouse, Parent"
//                       />
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* Preferences Tab */}
//         <TabsContent value="preferences" className="space-y-6">
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             {/* Room Preferences */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>Room Preferences</CardTitle>
//                 <CardDescription>Specify your room preferences</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 {/* Floor Preference */}
//                 <div>
//                   <Label>Floor Preference</Label>
//                   <Select
//                     value={accommodationDetails.roomPreferences.floor}
//                     onValueChange={(value) => handleRoomPreferenceChange('floor', value)}
//                   >
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="any">Any Floor</SelectItem>
//                       <SelectItem value="low">Lower Floors (1-3)</SelectItem>
//                       <SelectItem value="middle">Middle Floors (4-7)</SelectItem>
//                       <SelectItem value="high">Higher Floors (8+)</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 {/* View Preference */}
//                 <div>
//                   <Label>View Preference</Label>
//                   <Select
//                     value={accommodationDetails.roomPreferences.view}
//                     onValueChange={(value) => handleRoomPreferenceChange('view', value)}
//                   >
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="any">Any View</SelectItem>
//                       <SelectItem value="city">City View</SelectItem>
//                       <SelectItem value="garden">Garden View</SelectItem>
//                       <SelectItem value="pool">Pool View</SelectItem>
//                       <SelectItem value="sea">Sea View</SelectItem>
//                       <SelectItem value="mountain">Mountain View</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 {/* Bed Type */}
//                 <div>
//                   <Label>Bed Type Preference</Label>
//                   <Select
//                     value={accommodationDetails.roomPreferences.bedType}
//                     onValueChange={(value) => handleRoomPreferenceChange('bedType', value)}
//                   >
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="any">Any Bed Type</SelectItem>
//                       <SelectItem value="single">Single Bed</SelectItem>
//                       <SelectItem value="double">Double Bed</SelectItem>
//                       <SelectItem value="twin">Twin Beds</SelectItem>
//                       <SelectItem value="queen">Queen Size</SelectItem>
//                       <SelectItem value="king">King Size</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 {/* Room Features */}
//                 <div>
//                   <Label className="mb-3 block">Room Features</Label>
//                   <div className="grid grid-cols-2 gap-3">
//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="smokingRoom"
//                         checked={accommodationDetails.roomPreferences.smokingRoom}
//                         onCheckedChange={(checked) => handleRoomPreferenceChange('smokingRoom', checked)}
//                       />
//                       <Label htmlFor="smokingRoom" className="text-sm">Smoking Room</Label>
//                     </div>

//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="quietRoom"
//                         checked={accommodationDetails.roomPreferences.quietRoom}
//                         onCheckedChange={(checked) => handleRoomPreferenceChange('quietRoom', checked)}
//                       />
//                       <Label htmlFor="quietRoom" className="text-sm">Quiet Room</Label>
//                     </div>

//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="balcony"
//                         checked={accommodationDetails.roomPreferences.balcony}
//                         onCheckedChange={(checked) => handleRoomPreferenceChange('balcony', checked)}
//                       />
//                       <Label htmlFor="balcony" className="text-sm">Balcony</Label>
//                     </div>

//                     <div className="flex items-center space-x-2">
//                       <Checkbox
//                         id="airConditioning"
//                         checked={accommodationDetails.roomPreferences.airConditioning}
//                         onCheckedChange={(checked) => handleRoomPreferenceChange('airConditioning', checked)}
//                       />
//                       <Label htmlFor="airConditioning" className="text-sm">Air Conditioning</Label>
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Special Requests */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>Special Requests</CardTitle>
//                 <CardDescription>Additional requests and booking details</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 {/* Special Requests */}
//                 <div>
//                   <Label htmlFor="specialRequests">Special Requests</Label>
//                   <Textarea
//                     id="specialRequests"
//                     value={accommodationDetails.specialRequests || ''}
//                     onChange={(e) => handleFieldChange('specialRequests', e.target.value)}
//                     placeholder="Any special requests or requirements (extra pillows, late check-in, etc.)"
//                     rows={4}
//                   />
//                 </div>

//                 {/* Booking Reference */}
//                 <div>
//                   <Label htmlFor="bookingReference">Booking Reference (if any)</Label>
//                   <Input
//                     id="bookingReference"
//                     value={accommodationDetails.bookingReference || ''}
//                     onChange={(e) => handleFieldChange('bookingReference', e.target.value)}
//                     placeholder="Hotel booking reference number"
//                   />
//                 </div>

//                 {/* Payment Status */}
//                 <div>
//                   <Label>Payment Status</Label>
//                   <Select
//                     value={accommodationDetails.paymentStatus}
//                     onValueChange={(value) => handleFieldChange('paymentStatus', value)}
//                   >
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="pending">Pending</SelectItem>
//                       <SelectItem value="paid">Paid</SelectItem>
//                       <SelectItem value="partial">Partially Paid</SelectItem>
//                       <SelectItem value="overdue">Overdue</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 {/* Summary Alert */}
//                 <Alert>
//                   <Clock className="h-4 w-4" />
//                   <AlertDescription>
//                     <strong>Booking Summary:</strong>
//                     <br />
//                     {numberOfNights} night{numberOfNights !== 1 ? 's' : ''} at {accommodationDetails.hotelName || 'selected hotel'}
//                     <br />
//                     {accommodationDetails.numberOfGuests} guest{accommodationDetails.numberOfGuests !== 1 ? 's' : ''} in {accommodationDetails.roomType} room
//                     <br />
//                     Total cost: ₹{calculatedTotalCost.toLocaleString()}
//                   </AlertDescription>
//                 </Alert>
//               </CardContent>
//             </Card>
//           </div>
//         </TabsContent>
//       </Tabs>

//       {/* Action Buttons */}
//       <Card>
//         <CardContent className="p-4">
//           <div className="flex items-center justify-between">
//             <Button variant="outline" onClick={onCancel}>
//               <X className="w-4 h-4 mr-2" />
//               Cancel
//             </Button>

//             <div className="flex items-center gap-3">
//               <Badge variant="secondary">
//                 {Object.keys(errors).length === 0 ? (
//                   <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
//                 ) : (
//                   <AlertTriangle className="w-4 h-4 mr-1 text-red-600" />
//                 )}
//                 {Object.keys(errors).length === 0 ? 'Ready to Book' : `${Object.keys(errors).length} errors`}
//               </Badge>

//               <Button onClick={handleSubmit}>
//                 <Save className="w-4 h-4 mr-2" />
//                 {isEditing ? 'Update Booking' : 'Confirm Booking'}
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }