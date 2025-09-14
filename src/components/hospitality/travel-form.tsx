// // src/components/hospitality/travel-form.tsx

// 'use client';

// import React, { useState, useCallback } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Textarea } from '@/components/ui/textarea';
// import { Checkbox } from '@/components/ui/checkbox';
// import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Calendar } from '@/components/ui/calendar';
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { 
//   Plane, 
//   Train, 
//   Bus, 
//   Upload, 
//   Download, 
//   Calendar as CalendarIcon,
//   Clock,
//   MapPin,
//   User,
//   CreditCard,
//   FileText,
//   CheckCircle2,
//   AlertTriangle,
//   Plus,
//   Trash2,
//   Edit,
//   Save,
//   X
// } from 'lucide-react';
// import { format } from 'date-fns';

// // Types
// interface TravelDetails {
//   id?: string;
//   userId: string;
//   eventId: string;
//   travelType: 'flight' | 'train' | 'bus' | 'car' | 'other';
//   bookingReference: string;
//   departureCity: string;
//   arrivalCity: string;
//   departureDate: Date;
//   departureTime: string;
//   arrivalDate: Date;
//   arrivalTime: string;
//   carrier: string; // Airline/Railway/Bus company name
//   flightNumber?: string;
//   seatNumber?: string;
//   class: 'economy' | 'business' | 'first' | 'ac1' | 'ac2' | 'sleeper' | 'general';
//   cost: number;
//   currency: string;
//   bookingStatus: 'pending' | 'confirmed' | 'cancelled';
//   reimbursementStatus: 'not_requested' | 'pending' | 'approved' | 'rejected';
//   documents: File[];
//   specialRequests?: string;
//   emergencyContact?: {
//     name: string;
//     phone: string;
//     relation: string;
//   };
// }

// interface TravelFormProps {
//   userId: string;
//   eventId: string;
//   existingTravel?: TravelDetails;
//   onSave: (travelDetails: TravelDetails) => void;
//   onCancel: () => void;
//   isEditing?: boolean;
// }

// const travelTypeOptions = [
//   { value: 'flight', label: 'Flight', icon: Plane, description: 'Air travel' },
//   { value: 'train', label: 'Train', icon: Train, description: 'Railway travel' },
//   { value: 'bus', label: 'Bus', icon: Bus, description: 'Bus travel' },
//   { value: 'car', label: 'Car', icon: User, description: 'Personal vehicle' },
//   { value: 'other', label: 'Other', icon: MapPin, description: 'Other transport' }
// ];

// const classOptions = {
//   flight: [
//     { value: 'economy', label: 'Economy Class' },
//     { value: 'business', label: 'Business Class' },
//     { value: 'first', label: 'First Class' }
//   ],
//   train: [
//     { value: 'ac1', label: 'AC First Class' },
//     { value: 'ac2', label: 'AC Second Class' },
//     { value: 'sleeper', label: 'Sleeper Class' },
//     { value: 'general', label: 'General' }
//   ],
//   bus: [
//     { value: 'ac', label: 'AC Bus' },
//     { value: 'non_ac', label: 'Non-AC Bus' },
//     { value: 'sleeper', label: 'Sleeper Bus' },
//     { value: 'luxury', label: 'Luxury Bus' }
//   ],
//   default: [
//     { value: 'standard', label: 'Standard' },
//     { value: 'premium', label: 'Premium' }
//   ]
// };

// export default function TravelForm({ 
//   userId, 
//   eventId, 
//   existingTravel, 
//   onSave, 
//   onCancel, 
//   isEditing = false 
// }: TravelFormProps) {
//   const [travelDetails, setTravelDetails] = useState<TravelDetails>(
//     existingTravel || {
//       userId,
//       eventId,
//       travelType: 'flight',
//       bookingReference: '',
//       departureCity: '',
//       arrivalCity: '',
//       departureDate: new Date(),
//       departureTime: '',
//       arrivalDate: new Date(),
//       arrivalTime: '',
//       carrier: '',
//       class: 'economy',
//       cost: 0,
//       currency: 'INR',
//       bookingStatus: 'pending',
//       reimbursementStatus: 'not_requested',
//       documents: [],
//       specialRequests: '',
//       emergencyContact: {
//         name: '',
//         phone: '',
//         relation: ''
//       }
//     }
//   );

//   const [activeTab, setActiveTab] = useState('basic');
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [isUploading, setIsUploading] = useState(false);
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [showEmergencyContact, setShowEmergencyContact] = useState(false);

//   // Handle form field changes
//   const handleFieldChange = useCallback((field: keyof TravelDetails, value: any) => {
//     setTravelDetails(prev => ({
//       ...prev,
//       [field]: value
//     }));
    
//     // Clear error when field is updated
//     if (errors[field]) {
//       setErrors(prev => ({ ...prev, [field]: '' }));
//     }
//   }, [errors]);

//   // Handle emergency contact changes
//   const handleEmergencyContactChange = useCallback((field: string, value: string) => {
//     setTravelDetails(prev => ({
//       ...prev,
//       emergencyContact: {
//         ...prev.emergencyContact!,
//         [field]: value
//       }
//     }));
//   }, []);

//   // Handle file upload
//   const handleFileUpload = useCallback(async (files: FileList) => {
//     setIsUploading(true);
//     setUploadProgress(0);

//     try {
//       const uploadedFiles: File[] = [];
      
//       for (let i = 0; i < files.length; i++) {
//         const file = files[i];
        
//         // Validate file type and size
//         if (!validateFile(file)) {
//           continue;
//         }
        
//         uploadedFiles.push(file);
//         setUploadProgress(((i + 1) / files.length) * 100);
        
//         // Simulate upload delay
//         await new Promise(resolve => setTimeout(resolve, 500));
//       }

//       setTravelDetails(prev => ({
//         ...prev,
//         documents: [...prev.documents, ...uploadedFiles]
//       }));

//     } catch (error) {
//       console.error('Error uploading files:', error);
//     } finally {
//       setIsUploading(false);
//       setUploadProgress(0);
//     }
//   }, []);

//   // Validate file
//   const validateFile = (file: File): boolean => {
//     const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
//     const maxSize = 5 * 1024 * 1024; // 5MB

//     if (!allowedTypes.includes(file.type)) {
//       alert('Please upload PDF, JPG, or PNG files only');
//       return false;
//     }

//     if (file.size > maxSize) {
//       alert('File size should be less than 5MB');
//       return false;
//     }

//     return true;
//   };

//   // Remove uploaded file
//   const removeFile = useCallback((index: number) => {
//     setTravelDetails(prev => ({
//       ...prev,
//       documents: prev.documents.filter((_, i) => i !== index)
//     }));
//   }, []);

//   // Validate form
//   const validateForm = (): boolean => {
//     const newErrors: Record<string, string> = {};

//     if (!travelDetails.departureCity.trim()) {
//       newErrors.departureCity = 'Departure city is required';
//     }

//     if (!travelDetails.arrivalCity.trim()) {
//       newErrors.arrivalCity = 'Arrival city is required';
//     }

//     if (!travelDetails.departureTime) {
//       newErrors.departureTime = 'Departure time is required';
//     }

//     if (!travelDetails.arrivalTime) {
//       newErrors.arrivalTime = 'Arrival time is required';
//     }

//     if (!travelDetails.carrier.trim()) {
//       newErrors.carrier = 'Carrier/Operator name is required';
//     }

//     if (travelDetails.cost <= 0) {
//       newErrors.cost = 'Valid cost is required';
//     }

//     if (travelDetails.travelType === 'flight' && !travelDetails.flightNumber?.trim()) {
//       newErrors.flightNumber = 'Flight number is required';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   // Handle form submission
//   const handleSubmit = useCallback(() => {
//     if (!validateForm()) {
//       setActiveTab('basic'); // Switch to basic tab to show errors
//       return;
//     }

//     onSave(travelDetails);
//   }, [travelDetails, onSave]);

//   // Get travel type icon
//   const getTravelIcon = (type: string) => {
//     const option = travelTypeOptions.find(opt => opt.value === type);
//     return option ? option.icon : MapPin;
//   };

//   // Get class options for selected travel type
//   const getClassOptions = () => {
//     return classOptions[travelDetails.travelType as keyof typeof classOptions] || classOptions.default;
//   };

//   return (
//     <div className="max-w-4xl mx-auto p-6 space-y-6">
//       {/* Header */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             {React.createElement(getTravelIcon(travelDetails.travelType), { className: "w-6 h-6" })}
//             {isEditing ? 'Edit Travel Details' : 'Add Travel Details'}
//           </CardTitle>
//           <CardDescription>
//             Manage your travel arrangements for the conference
//           </CardDescription>
//         </CardHeader>
//       </Card>

//       {/* Main Form */}
//       <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
//         <TabsList className="grid w-full grid-cols-4">
//           <TabsTrigger value="basic">Basic Details</TabsTrigger>
//           <TabsTrigger value="schedule">Schedule</TabsTrigger>
//           <TabsTrigger value="documents">Documents</TabsTrigger>
//           <TabsTrigger value="additional">Additional Info</TabsTrigger>
//         </TabsList>

//         {/* Basic Details Tab */}
//         <TabsContent value="basic" className="space-y-6">
//           <Card>
//             <CardHeader>
//               <CardTitle>Travel Information</CardTitle>
//               <CardDescription>Basic travel details and booking information</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               {/* Travel Type Selection */}
//               <div>
//                 <Label>Travel Type</Label>
//                 <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
//                   {travelTypeOptions.map((option) => (
//                     <div
//                       key={option.value}
//                       className={`border rounded-lg p-3 cursor-pointer transition-colors ${
//                         travelDetails.travelType === option.value
//                           ? 'border-blue-500 bg-blue-50'
//                           : 'hover:bg-gray-50'
//                       }`}
//                       onClick={() => handleFieldChange('travelType', option.value)}
//                     >
//                       <div className="flex flex-col items-center gap-2">
//                         <option.icon className="w-6 h-6 text-blue-600" />
//                         <span className="text-sm font-medium">{option.label}</span>
//                         <span className="text-xs text-gray-500">{option.description}</span>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Route Information */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="departureCity">Departure City *</Label>
//                   <Input
//                     id="departureCity"
//                     value={travelDetails.departureCity}
//                     onChange={(e) => handleFieldChange('departureCity', e.target.value)}
//                     placeholder="Enter departure city"
//                     className={errors.departureCity ? 'border-red-500' : ''}
//                   />
//                   {errors.departureCity && (
//                     <p className="text-red-500 text-sm mt-1">{errors.departureCity}</p>
//                   )}
//                 </div>

//                 <div>
//                   <Label htmlFor="arrivalCity">Arrival City *</Label>
//                   <Input
//                     id="arrivalCity"
//                     value={travelDetails.arrivalCity}
//                     onChange={(e) => handleFieldChange('arrivalCity', e.target.value)}
//                     placeholder="Enter arrival city"
//                     className={errors.arrivalCity ? 'border-red-500' : ''}
//                   />
//                   {errors.arrivalCity && (
//                     <p className="text-red-500 text-sm mt-1">{errors.arrivalCity}</p>
//                   )}
//                 </div>
//               </div>

//               {/* Carrier and Reference */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="carrier">
//                     {travelDetails.travelType === 'flight' ? 'Airline' : 
//                      travelDetails.travelType === 'train' ? 'Railway' : 
//                      travelDetails.travelType === 'bus' ? 'Bus Operator' : 'Transport Provider'} *
//                   </Label>
//                   <Input
//                     id="carrier"
//                     value={travelDetails.carrier}
//                     onChange={(e) => handleFieldChange('carrier', e.target.value)}
//                     placeholder={`Enter ${travelDetails.travelType} operator name`}
//                     className={errors.carrier ? 'border-red-500' : ''}
//                   />
//                   {errors.carrier && (
//                     <p className="text-red-500 text-sm mt-1">{errors.carrier}</p>
//                   )}
//                 </div>

//                 <div>
//                   <Label htmlFor="bookingReference">Booking Reference</Label>
//                   <Input
//                     id="bookingReference"
//                     value={travelDetails.bookingReference}
//                     onChange={(e) => handleFieldChange('bookingReference', e.target.value)}
//                     placeholder="Enter booking reference/PNR"
//                   />
//                 </div>
//               </div>

//               {/* Flight/Train Number and Seat */}
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 {(travelDetails.travelType === 'flight' || travelDetails.travelType === 'train') && (
//                   <div>
//                     <Label htmlFor="flightNumber">
//                       {travelDetails.travelType === 'flight' ? 'Flight Number *' : 'Train Number'}
//                     </Label>
//                     <Input
//                       id="flightNumber"
//                       value={travelDetails.flightNumber || ''}
//                       onChange={(e) => handleFieldChange('flightNumber', e.target.value)}
//                       placeholder={travelDetails.travelType === 'flight' ? 'e.g., AI101' : 'e.g., 12345'}
//                       className={errors.flightNumber ? 'border-red-500' : ''}
//                     />
//                     {errors.flightNumber && (
//                       <p className="text-red-500 text-sm mt-1">{errors.flightNumber}</p>
//                     )}
//                   </div>
//                 )}

//                 <div>
//                   <Label htmlFor="class">Class</Label>
//                   <Select
//                     value={travelDetails.class}
//                     onValueChange={(value) => handleFieldChange('class', value)}
//                   >
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {getClassOptions().map((option) => (
//                         <SelectItem key={option.value} value={option.value}>
//                           {option.label}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div>
//                   <Label htmlFor="seatNumber">Seat Number (Optional)</Label>
//                   <Input
//                     id="seatNumber"
//                     value={travelDetails.seatNumber || ''}
//                     onChange={(e) => handleFieldChange('seatNumber', e.target.value)}
//                     placeholder="e.g., 12A"
//                   />
//                 </div>
//               </div>

//               {/* Cost Information */}
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div>
//                   <Label htmlFor="cost">Travel Cost *</Label>
//                   <Input
//                     id="cost"
//                     type="number"
//                     value={travelDetails.cost}
//                     onChange={(e) => handleFieldChange('cost', parseFloat(e.target.value) || 0)}
//                     placeholder="Enter cost"
//                     className={errors.cost ? 'border-red-500' : ''}
//                   />
//                   {errors.cost && (
//                     <p className="text-red-500 text-sm mt-1">{errors.cost}</p>
//                   )}
//                 </div>

//                 <div>
//                   <Label htmlFor="currency">Currency</Label>
//                   <Select
//                     value={travelDetails.currency}
//                     onValueChange={(value) => handleFieldChange('currency', value)}
//                   >
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="INR">INR (₹)</SelectItem>
//                       <SelectItem value="USD">USD ($)</SelectItem>
//                       <SelectItem value="EUR">EUR (€)</SelectItem>
//                       <SelectItem value="GBP">GBP (£)</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div>
//                   <Label htmlFor="bookingStatus">Booking Status</Label>
//                   <Select
//                     value={travelDetails.bookingStatus}
//                     onValueChange={(value) => handleFieldChange('bookingStatus', value)}
//                   >
//                     <SelectTrigger>
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="pending">Pending</SelectItem>
//                       <SelectItem value="confirmed">Confirmed</SelectItem>
//                       <SelectItem value="cancelled">Cancelled</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* Schedule Tab */}
//         <TabsContent value="schedule" className="space-y-6">
//           <Card>
//             <CardHeader>
//               <CardTitle>Travel Schedule</CardTitle>
//               <CardDescription>Set your departure and arrival times</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               {/* Departure Information */}
//               <div>
//                 <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
//                   <MapPin className="w-5 h-5 text-blue-600" />
//                   Departure Details
//                 </h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <Label>Departure Date</Label>
//                     <Popover>
//                       <PopoverTrigger asChild>
//                         <Button variant="outline" className="w-full justify-start text-left font-normal">
//                           <CalendarIcon className="mr-2 h-4 w-4" />
//                           {travelDetails.departureDate ? format(travelDetails.departureDate, "PPP") : "Pick a date"}
//                         </Button>
//                       </PopoverTrigger>
//                       <PopoverContent className="w-auto p-0" align="start">
//                         <Calendar
//                           mode="single"
//                           selected={travelDetails.departureDate}
//                           onSelect={(date) => date && handleFieldChange('departureDate', date)}
//                           initialFocus
//                         />
//                       </PopoverContent>
//                     </Popover>
//                   </div>

//                   <div>
//                     <Label htmlFor="departureTime">Departure Time *</Label>
//                     <Input
//                       id="departureTime"
//                       type="time"
//                       value={travelDetails.departureTime}
//                       onChange={(e) => handleFieldChange('departureTime', e.target.value)}
//                       className={errors.departureTime ? 'border-red-500' : ''}
//                     />
//                     {errors.departureTime && (
//                       <p className="text-red-500 text-sm mt-1">{errors.departureTime}</p>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Arrival Information */}
//               <div>
//                 <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
//                   <MapPin className="w-5 h-5 text-green-600" />
//                   Arrival Details
//                 </h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <Label>Arrival Date</Label>
//                     <Popover>
//                       <PopoverTrigger asChild>
//                         <Button variant="outline" className="w-full justify-start text-left font-normal">
//                           <CalendarIcon className="mr-2 h-4 w-4" />
//                           {travelDetails.arrivalDate ? format(travelDetails.arrivalDate, "PPP") : "Pick a date"}
//                         </Button>
//                       </PopoverTrigger>
//                       <PopoverContent className="w-auto p-0" align="start">
//                         <Calendar
//                           mode="single"
//                           selected={travelDetails.arrivalDate}
//                           onSelect={(date) => date && handleFieldChange('arrivalDate', date)}
//                           initialFocus
//                         />
//                       </PopoverContent>
//                     </Popover>
//                   </div>

//                   <div>
//                     <Label htmlFor="arrivalTime">Arrival Time *</Label>
//                     <Input
//                       id="arrivalTime"
//                       type="time"
//                       value={travelDetails.arrivalTime}
//                       onChange={(e) => handleFieldChange('arrivalTime', e.target.value)}
//                       className={errors.arrivalTime ? 'border-red-500' : ''}
//                     />
//                     {errors.arrivalTime && (
//                       <p className="text-red-500 text-sm mt-1">{errors.arrivalTime}</p>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Travel Duration Display */}
//               <Alert>
//                 <Clock className="h-4 w-4" />
//                 <AlertDescription>
//                   <strong>Estimated Travel Duration:</strong> 
//                   {travelDetails.departureDate && travelDetails.arrivalDate && travelDetails.departureTime && travelDetails.arrivalTime
//                     ? ` ${Math.round((new Date(`${format(travelDetails.arrivalDate, 'yyyy-MM-dd')}T${travelDetails.arrivalTime}`).getTime() - 
//                         new Date(`${format(travelDetails.departureDate, 'yyyy-MM-dd')}T${travelDetails.departureTime}`).getTime()) / (1000 * 60 * 60))} hours`
//                     : ' Please fill in all schedule details'
//                   }
//                 </AlertDescription>
//               </Alert>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* Documents Tab */}
//         <TabsContent value="documents" className="space-y-6">
//           <Card>
//             <CardHeader>
//               <CardTitle>Travel Documents</CardTitle>
//               <CardDescription>Upload tickets, itinerary, and other travel documents</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               {/* File Upload Area */}
//               <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
//                 <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//                 <h4 className="text-lg font-semibold mb-2">Upload Travel Documents</h4>
//                 <p className="text-gray-600 mb-4">
//                   Drag and drop files here or click to browse
//                 </p>
//                 <Input
//                   type="file"
//                   multiple
//                   accept=".pdf,.jpg,.jpeg,.png"
//                   onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
//                   className="hidden"
//                   id="file-upload"
//                 />
//                 <Button asChild variant="outline">
//                   <label htmlFor="file-upload" className="cursor-pointer">
//                     Choose Files
//                   </label>
//                 </Button>
//                 <p className="text-sm text-gray-500 mt-2">
//                   Supported formats: PDF, JPG, PNG (Max 5MB each)
//                 </p>
//               </div>

//               {/* Upload Progress */}
//               {isUploading && (
//                 <div className="space-y-2">
//                   <div className="flex items-center justify-between">
//                     <span className="text-sm font-medium">Uploading files...</span>
//                     <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
//                   </div>
//                   <Progress value={uploadProgress} className="w-full" />
//                 </div>
//               )}

//               {/* Uploaded Files List */}
//               {travelDetails.documents.length > 0 && (
//                 <div>
//                   <h4 className="font-semibold mb-3">Uploaded Documents ({travelDetails.documents.length})</h4>
//                   <div className="space-y-2">
//                     {travelDetails.documents.map((file, index) => (
//                       <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
//                         <div className="flex items-center gap-3">
//                           <FileText className="w-5 h-5 text-blue-600" />
//                           <div>
//                             <p className="font-medium">{file.name}</p>
//                             <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
//                           </div>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <Button variant="outline" size="sm">
//                             <Download className="w-4 h-4 mr-1" />
//                             View
//                           </Button>
//                           <Button variant="outline" size="sm" onClick={() => removeFile(index)}>
//                             <Trash2 className="w-4 h-4" />
//                           </Button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Document Guidelines */}
//               <Alert>
//                 <FileText className="h-4 w-4" />
//                 <AlertDescription>
//                   <strong>Required Documents:</strong>
//                   <ul className="list-disc list-inside mt-2 space-y-1">
//                     <li>Flight/Train/Bus ticket or booking confirmation</li>
//                     <li>Travel itinerary with complete details</li>
//                     <li>ID proof (if required by the organization)</li>
//                     <li>Travel insurance (if applicable)</li>
//                   </ul>
//                 </AlertDescription>
//               </Alert>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* Additional Info Tab */}
//         <TabsContent value="additional" className="space-y-6">
//           <Card>
//             <CardHeader>
//               <CardTitle>Additional Information</CardTitle>
//               <CardDescription>Special requests and emergency contact details</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               {/* Special Requests */}
//               <div>
//                 <Label htmlFor="specialRequests">Special Requests</Label>
//                 <Textarea
//                   id="specialRequests"
//                   value={travelDetails.specialRequests || ''}
//                   onChange={(e) => handleFieldChange('specialRequests', e.target.value)}
//                   placeholder="Any special requirements, dietary restrictions, accessibility needs, etc."
//                   rows={3}
//                 />
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
//                       Add emergency contact details
//                     </Label>
//                   </div>
//                 </div>

//                 {showEmergencyContact && (
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
//                     <div>
//                       <Label htmlFor="emergencyName">Contact Name</Label>
//                       <Input
//                         id="emergencyName"
//                         value={travelDetails.emergencyContact?.name || ''}
//                         onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
//                         placeholder="Full name"
//                       />
//                     </div>
//                     <div>
//                       <Label htmlFor="emergencyPhone">Phone Number</Label>
//                       <Input
//                         id="emergencyPhone"
//                         value={travelDetails.emergencyContact?.phone || ''}
//                         onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
//                         placeholder="+91 98765 43210"
//                       />
//                     </div>
//                     <div>
//                       <Label htmlFor="emergencyRelation">Relationship</Label>
//                       <Input
//                         id="emergencyRelation"
//                         value={travelDetails.emergencyContact?.relation || ''}
//                         onChange={(e) => handleEmergencyContactChange('relation', e.target.value)}
//                         placeholder="e.g., Spouse, Parent, Friend"
//                       />
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Reimbursement Status */}
//               <div>
//                 <Label htmlFor="reimbursementStatus">Reimbursement Status</Label>
//                 <Select
//                   value={travelDetails.reimbursementStatus}
//                   onValueChange={(value) => handleFieldChange('reimbursementStatus', value)}
//                 >
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="not_requested">Not Requested</SelectItem>
//                     <SelectItem value="pending">Pending Approval</SelectItem>
//                     <SelectItem value="approved">Approved</SelectItem>
//                     <SelectItem value="rejected">Rejected</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </CardContent>
//           </Card>
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
//                 {Object.keys(errors).length === 0 ? 'Ready to Save' : `${Object.keys(errors).length} errors`}
//               </Badge>

//               <Button onClick={handleSubmit}>
//                 <Save className="w-4 h-4 mr-2" />
//                 {isEditing ? 'Update Travel Details' : 'Save Travel Details'}
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }