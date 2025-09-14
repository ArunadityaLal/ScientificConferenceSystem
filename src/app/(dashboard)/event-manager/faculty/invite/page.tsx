// // src/app/(dashboard)/event-manager/faculty/invite/page.tsx
// 'use client';

// import { useState, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import { useForm, useFieldArray } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';

// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; 
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Badge } from '@/components/ui/badge';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { LoadingSpinner } from '@/components/ui/loading';
// import { EventManagerLayout } from '@/components/dashboard/layout';
// //import { Separator } from '@/components/ui/separator';

// import { useSendInvitations } from '@/hooks/use-faculty';
// import { useEvents } from '@/hooks/use-events';
// import { useAuth } from '@/hooks/use-auth';

// import { 
//   ArrowLeft,
//   UserPlus,
//   Mail,
//   Send,
//   Plus,
//   Trash2,
//   Upload,
//   Download,
//   Eye,
//   Users,
//   Calendar,
//   MapPin,
//   Building,
//   Globe,
//   FileText,
//   CheckCircle,
//   AlertCircle,
//   Copy,
//   RefreshCw,
//   Zap,
//   Target,
//   MessageSquare,
//   Settings,
//   Info,
//   Star,
//   Award,
//   Clock
// } from 'lucide-react';
// import { format } from 'date-fns';
// import { Separator } from '@radix-ui/react-select';

// // Validation schema
// const InvitationSchema = z.object({
//   eventId: z.string().min(1, 'Please select an event'),
//   facultyList: z.array(z.object({
//     name: z.string().min(2, 'Name must be at least 2 characters'),
//     email: z.string().email('Please enter a valid email address'),
//     phone: z.string().optional(),
//     designation: z.string().optional(),
//     institution: z.string().optional(),
//     specialization: z.string().optional(),
//     role: z.enum(['SPEAKER', 'MODERATOR', 'CHAIRPERSON']).default('SPEAKER'),
//     sessionId: z.string().optional(),
//   })).min(1, 'Please add at least one faculty member'),
//   invitationMessage: z.string().min(10, 'Invitation message must be at least 10 characters'),
//   invitationSubject: z.string().min(5, 'Subject must be at least 5 characters'),
//   sendReminder: z.boolean().default(true),
//   reminderDays: z.number().min(1).max(30).default(3),
// });

// type InvitationFormData = z.infer<typeof InvitationSchema>;

// export default function FacultyInvitePage() {
//   const router = useRouter();
//   const { user } = useAuth();
  
//   // State management
//   const [step, setStep] = useState<'compose' | 'preview' | 'send'>('compose');
//   const [bulkInput, setBulkInput] = useState('');
//   const [showBulkInput, setShowBulkInput] = useState(false);
//   const [invitationResults, setInvitationResults] = useState<any>(null);

//   // Data fetching
//   const { data: events, isLoading: eventsLoading } = useEvents({ 
//     status: 'PUBLISHED',
//     limit: 50 
//   });

//   // Mutations
//   const sendInvitations = useSendInvitations();

//   // Form setup
//   const {
//     register,
//     control,
//     handleSubmit,
//     watch,
//     setValue,
//     getValues,
//     formState: { errors, isSubmitting }
//   } = useForm<InvitationFormData>({
//     resolver: zodResolver(InvitationSchema),
//     defaultValues: {
//       eventId: '',
//       facultyList: [{  
//         name: '', 
//         email: '', 
//         phone: '', 
//         designation: '', 
//         institution: '', 
//         specialization: '', 
//         role: 'SPEAKER',
//         sessionId: '' 
//       }],
//       invitationMessage: `Dear [Faculty Name],

// We are delighted to invite you to participate as a speaker in our upcoming conference. Your expertise and insights would be invaluable to our academic community.

// Conference Details:
// - Date: [Event Date]
// - Venue: [Event Venue]
// - Theme: [Event Theme]

// We would be honored to have you share your knowledge with our participants. Please confirm your participation by [Date].

// Looking forward to your positive response.

// Best regards,
// [Organizer Name]
// [Contact Information]`,
//       invitationSubject: 'Invitation to Speak at Our Conference',
//       sendReminder: true,
//       reminderDays: 3
//     }
//   });

//   const { fields, append, remove } = useFieldArray({
//     control,
//     name: 'facultyList'
//   });

//   const watchedEventId = watch('eventId');
//   const watchedFacultyList = watch('facultyList');
//   const selectedEvent = events?.data?.events?.find(e => e.id === watchedEventId);

//   // Handle bulk email input
//   const handleBulkEmailParse = useCallback(() => {
//     const lines = bulkInput.split('\n').filter(line => line.trim());
//     const newFaculty: any[] = [];

//     lines.forEach(line => {
//       const parts = line.split(',').map(part => part.trim());
//       if (parts.length >= 2) {
//         const [name, email, designation = '', institution = '', specialization = ''] = parts;
//         if (email.includes('@')) {
//           newFaculty.push({
//             name: name.replace(/"/g, ''),
//             email: email.replace(/"/g, ''),
//             phone: '',
//             designation: designation.replace(/"/g, ''),
//             institution: institution.replace(/"/g, ''),
//             specialization: specialization.replace(/"/g, ''),
//             role: 'SPEAKER',
//             sessionId: ''
//           });
//         }
//       }
//     });

//     if (newFaculty.length > 0) {
//       setValue('facultyList', [...watchedFacultyList, ...newFaculty]);
//       setBulkInput('');
//       setShowBulkInput(false);
//     }
//   }, [bulkInput, watchedFacultyList, setValue]);

//   // Handle form submission
//   const onSubmit = async (data: InvitationFormData) => {
//     if (step === 'compose') {
//       setStep('preview');
//       return;
//     }

//     if (step === 'preview') {
//       try {
//         const result = await sendInvitations.mutateAsync(data);
//         setInvitationResults(result);
//         setStep('send');
//       } catch (error) {
//         console.error('Failed to send invitations:', error);
//       }
//     }
//   };

//   // Generate preview message
//   const generatePreviewMessage = (facultyName: string) => {
//     const message = getValues('invitationMessage');
//     return message
//       .replace('[Faculty Name]', facultyName)
//       .replace('[Event Date]', selectedEvent ? format(new Date(selectedEvent.startDate), 'PPP') : '[Event Date]')
//       .replace('[Event Venue]', selectedEvent?.venue || '[Event Venue]')
//       .replace('[Event Theme]', selectedEvent?.description || '[Event Theme]')
//       .replace('[Organizer Name]', user?.name || '[Organizer Name]')
//       .replace('[Contact Information]', user?.email || '[Contact Information]');
//   };

//   if (eventsLoading) {
//     return (
//       <EventManagerLayout>
//         <div className="flex items-center justify-center min-h-[400px]">
//           <LoadingSpinner size="lg" />
//         </div>
//       </EventManagerLayout>
//     );
//   }

//   return (
//     <EventManagerLayout>
//       <div className="max-w-4xl mx-auto space-y-6">
        
//         {/* Header */}
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-4">
//             <Button variant="outline" onClick={() => router.back()}>
//               <ArrowLeft className="h-4 w-4 mr-2" />
//               Back to Faculty
//             </Button>
//             <div>
//               <h1 className="text-3xl font-bold tracking-tight">Invite Faculty</h1>
//               <p className="text-muted-foreground">
//                 Send professional invitations to faculty members
//               </p>
//             </div>
//           </div>
//           <div className="flex items-center space-x-2">
//             <Badge variant="outline" className="px-3 py-1">
//               Step {step === 'compose' ? '1' : step === 'preview' ? '2' : '3'} of 3
//             </Badge>
//           </div>
//         </div>

//         {/* Progress Steps */}
//         <Card>
//           <CardContent className="pt-6">
//             <div className="flex items-center justify-between">
//               <div className={`flex items-center space-x-2 ${step === 'compose' ? 'text-blue-600' : 'text-gray-500'}`}>
//                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                   step === 'compose' ? 'bg-blue-600 text-white' : 
//                   step === 'preview' || step === 'send' ? 'bg-green-600 text-white' : 'bg-gray-200'
//                 }`}>
//                   {step === 'preview' || step === 'send' ? <CheckCircle className="h-4 w-4" /> : '1'}
//                 </div>
//                 <span className="font-medium">Compose Invitation</span>
//               </div>
              
//               <div className={`w-16 h-0.5 ${step === 'preview' || step === 'send' ? 'bg-green-600' : 'bg-gray-200'}`} />
              
//               <div className={`flex items-center space-x-2 ${step === 'preview' ? 'text-blue-600' : 'text-gray-500'}`}>
//                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                   step === 'preview' ? 'bg-blue-600 text-white' : 
//                   step === 'send' ? 'bg-green-600 text-white' : 'bg-gray-200'
//                 }`}>
//                   {step === 'send' ? <CheckCircle className="h-4 w-4" /> : '2'}
//                 </div>
//                 <span className="font-medium">Preview & Confirm</span>
//               </div>
              
//               <div className={`w-16 h-0.5 ${step === 'send' ? 'bg-green-600' : 'bg-gray-200'}`} />
              
//               <div className={`flex items-center space-x-2 ${step === 'send' ? 'text-blue-600' : 'text-gray-500'}`}>
//                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                   step === 'send' ? 'bg-blue-600 text-white' : 'bg-gray-200'
//                 }`}>
//                   3
//                 </div>
//                 <span className="font-medium">Send Invitations</span>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Main Content */}
//         <form onSubmit={handleSubmit(onSubmit)}>
          
//           {/* Step 1: Compose */}
//           {step === 'compose' && (
//             <div className="space-y-6">
              
//               {/* Event Selection */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center">
//                     <Calendar className="h-5 w-5 mr-2" />
//                     Select Event
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-4">
//                     <div>
//                       <Label htmlFor="eventId">Event *</Label>
//                       <Select onValueChange={(value) => setValue('eventId', value)}>
//                         <SelectTrigger>
//                           <SelectValue placeholder="Choose an event" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           {events?.data?.events?.map((event) => (
//                             <SelectItem key={event.id} value={event.id}>
//                               <div className="flex items-center space-x-2">
//                                 <span>{event.name}</span>
//                                 <Badge variant="outline">
//                                   {format(new Date(event.startDate), 'MMM dd, yyyy')}
//                                 </Badge>
//                               </div>
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                       {errors.eventId && (
//                         <p className="text-sm text-red-600 mt-1">{errors.eventId.message}</p>
//                       )}
//                     </div>

//                     {selectedEvent && (
//                       <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
//                         <div className="flex items-start space-x-4">
//                           <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
//                           <div>
//                             <h4 className="font-medium text-blue-800">{selectedEvent.name}</h4>
//                             <div className="flex items-center space-x-4 text-sm text-blue-600 mt-1">
//                               <span>📅 {format(new Date(selectedEvent.startDate), 'PPP')}</span>
//                               {selectedEvent.venue && <span>📍 {selectedEvent.venue}</span>}
//                             </div>
//                             {selectedEvent.description && (
//                               <p className="text-sm text-blue-600 mt-2">{selectedEvent.description}</p>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Faculty List */}
//               <Card>
//                 <CardHeader>
//                   <div className="flex items-center justify-between">
//                     <CardTitle className="flex items-center">
//                       <Users className="h-5 w-5 mr-2" />
//                       Faculty Members ({fields.length})
//                     </CardTitle>
//                     <div className="flex space-x-2">
//                       <Button
//                         type="button"
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setShowBulkInput(!showBulkInput)}
//                       >
//                         <Upload className="h-3 w-3 mr-1" />
//                         Bulk Add
//                       </Button>
//                       <Button
//                         type="button"
//                         variant="outline"
//                         size="sm"
//                         onClick={() => append({ 
//                           name: '', 
//                           email: '', 
//                           phone: '', 
//                           designation: '', 
//                           institution: '', 
//                           specialization: '', 
//                           role: 'SPEAKER',
//                           sessionId: '' 
//                         })}
//                       >
//                         <Plus className="h-3 w-3 mr-1" />
//                         Add Faculty
//                       </Button>
//                     </div>
//                   </div>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-6">
                    
//                     {/* Bulk Input */}
//                     {showBulkInput && (
//                       <div className="p-4 border border-dashed border-gray-300 rounded-lg">
//                         <Label>Bulk Add Faculty (CSV Format)</Label>
//                         <p className="text-sm text-muted-foreground mb-3">
//                           Format: Name, Email, Designation, Institution, Specialization (one per line)
//                         </p>
//                         <Textarea
//                           placeholder={`Dr. John Smith, john.smith@university.edu, Professor, MIT University, AI Research
// Dr. Jane Doe, jane.doe@college.edu, Associate Professor, Stanford College, Machine Learning`}
//                           value={bulkInput}
//                           onChange={(e) => setBulkInput(e.target.value)}
//                           rows={4}
//                         />
//                         <div className="flex space-x-2 mt-3">
//                           <Button type="button" size="sm" onClick={handleBulkEmailParse}>
//                             <Plus className="h-3 w-3 mr-1" />
//                             Add All
//                           </Button>
//                           <Button type="button" variant="outline" size="sm" onClick={() => setShowBulkInput(false)}>
//                             Cancel
//                           </Button>
//                         </div>
//                       </div>
//                     )}

//                     {/* Individual Faculty Entries */}
//                     <div className="space-y-4">
//                       {fields.map((field, index) => (
//                         <div key={field.id} className="p-4 border rounded-lg space-y-4">
//                           <div className="flex items-center justify-between">
//                             <h4 className="font-medium">Faculty Member {index + 1}</h4>
//                             {fields.length > 1 && (
//                               <Button
//                                 type="button"
//                                 variant="outline"
//                                 size="sm"
//                                 onClick={() => remove(index)}
//                               >
//                                 <Trash2 className="h-3 w-3" />
//                               </Button>
//                             )}
//                           </div>
                          
//                           <div className="grid gap-4 md:grid-cols-2">
//                             <div>
//                               <Label htmlFor={`facultyList.${index}.name`}>Name *</Label>
//                               <Input
//                                 {...register(`facultyList.${index}.name`)}
//                                 placeholder="Dr. John Smith"
//                               />
//                               {errors.facultyList?.[index]?.name && (
//                                 <p className="text-sm text-red-600 mt-1">
//                                   {errors.facultyList[index]?.name?.message}
//                                 </p>
//                               )}
//                             </div>
                            
//                             <div>
//                               <Label htmlFor={`facultyList.${index}.email`}>Email *</Label>
//                               <Input
//                                 {...register(`facultyList.${index}.email`)}
//                                 placeholder="john.smith@university.edu"
//                                 type="email"
//                               />
//                               {errors.facultyList?.[index]?.email && (
//                                 <p className="text-sm text-red-600 mt-1">
//                                   {errors.facultyList[index]?.email?.message}
//                                 </p>
//                               )}
//                             </div>
                            
//                             <div>
//                               <Label htmlFor={`facultyList.${index}.designation`}>Designation</Label>
//                               <Input
//                                 {...register(`facultyList.${index}.designation`)}
//                                 placeholder="Professor"
//                               />
//                             </div>
                            
//                             <div>
//                               <Label htmlFor={`facultyList.${index}.institution`}>Institution</Label>
//                               <Input
//                                 {...register(`facultyList.${index}.institution`)}
//                                 placeholder="University Name"
//                               />
//                             </div>
                            
//                             <div>
//                               <Label htmlFor={`facultyList.${index}.specialization`}>Specialization</Label>
//                               <Input
//                                 {...register(`facultyList.${index}.specialization`)}
//                                 placeholder="AI Research"
//                               />
//                             </div>
                            
//                             <div>
//                               <Label htmlFor={`facultyList.${index}.role`}>Role</Label>
//                               <Select 
//                                 onValueChange={(value) => 
//                                   setValue(`facultyList.${index}.role`, value as 'SPEAKER' | 'MODERATOR' | 'CHAIRPERSON')
//                                 }
//                                 defaultValue="SPEAKER"
//                               >
//                                 <SelectTrigger>
//                                   <SelectValue />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                   <SelectItem value="SPEAKER">Speaker</SelectItem>
//                                   <SelectItem value="MODERATOR">Moderator</SelectItem>
//                                   <SelectItem value="CHAIRPERSON">Chairperson</SelectItem>
//                                 </SelectContent>
//                               </Select>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>

//                     {errors.facultyList && (
//                       <Alert variant="destructive">
//                         <AlertCircle className="h-4 w-4" />
//                         <AlertDescription>
//                           Please add at least one faculty member with valid information.
//                         </AlertDescription>
//                       </Alert>
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Invitation Message */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center">
//                     <MessageSquare className="h-5 w-5 mr-2" />
//                     Invitation Details
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <div>
//                     <Label htmlFor="invitationSubject">Email Subject *</Label>
//                     <Input
//                       {...register('invitationSubject')}
//                       placeholder="Invitation to speak at our conference"
//                     />
//                     {errors.invitationSubject && (
//                       <p className="text-sm text-red-600 mt-1">{errors.invitationSubject.message}</p>
//                     )}
//                   </div>
                  
//                   <div>
//                     <Label htmlFor="invitationMessage">Invitation Message *</Label>
//                     <Textarea
//                       {...register('invitationMessage')}
//                       placeholder="Write your invitation message here..."
//                       rows={12}
//                     />
//                     {errors.invitationMessage && (
//                       <p className="text-sm text-red-600 mt-1">{errors.invitationMessage.message}</p>
//                     )}
//                     <p className="text-sm text-muted-foreground mt-2">
//                       Use placeholders: [Faculty Name], [Event Date], [Event Venue], [Event Theme], [Organizer Name], [Contact Information]
//                     </p>
//                   </div>

//                   <Separator />

//                   <div className="flex items-center space-x-3">
//                     <input
//                       type="checkbox"
//                       {...register('sendReminder')}
//                       className="rounded border-gray-300"
//                     />
//                     <Label htmlFor="sendReminder">Send reminder email if no response</Label>
//                   </div>

//                   {watch('sendReminder') && (
//                     <div className="ml-6">
//                       <Label htmlFor="reminderDays">Send reminder after (days)</Label>
//                       <Input
//                         {...register('reminderDays', { valueAsNumber: true })}
//                         type="number"
//                         min="1"
//                         max="30"
//                         className="w-20"
//                       />
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             </div>
//           )}

//           {/* Step 2: Preview */}
//           {step === 'preview' && (
//             <div className="space-y-6">
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center">
//                     <Eye className="h-5 w-5 mr-2" />
//                     Preview Invitations
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-6">
                    
//                     {/* Summary */}
//                     <div className="grid gap-4 md:grid-cols-3">
//                       <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
//                         <div className="flex items-center">
//                           <Users className="h-5 w-5 text-blue-600 mr-2" />
//                           <div>
//                             <p className="font-medium text-blue-800">{watchedFacultyList.length} Recipients</p>
//                             <p className="text-sm text-blue-600">Faculty members</p>
//                           </div>
//                         </div>
//                       </div>
                      
//                       <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
//                         <div className="flex items-center">
//                           <Calendar className="h-5 w-5 text-green-600 mr-2" />
//                           <div>
//                             <p className="font-medium text-green-800">{selectedEvent?.name}</p>
//                             <p className="text-sm text-green-600">Selected event</p>
//                           </div>
//                         </div>
//                       </div>
                      
//                       <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
//                         <div className="flex items-center">
//                           <Mail className="h-5 w-5 text-purple-600 mr-2" />
//                           <div>
//                             <p className="font-medium text-purple-800">Email Invitation</p>
//                             <p className="text-sm text-purple-600">
//                               {watch('sendReminder') ? `+ ${watch('reminderDays')} day reminder` : 'Single email'}
//                             </p>
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Email Preview */}
//                     <div className="border rounded-lg">
//                       <div className="border-b p-4 bg-gray-50">
//                         <h4 className="font-medium">Email Preview</h4>
//                         <p className="text-sm text-muted-foreground">Sample for: {watchedFacultyList[0]?.name || 'Faculty Member'}</p>
//                       </div>
//                       <div className="p-6 bg-white">
//                         <div className="space-y-4">
//                           <div>
//                             <strong>Subject:</strong> {watch('invitationSubject')}
//                           </div>
//                           <div>
//                             <strong>To:</strong> {watchedFacultyList[0]?.email || 'faculty@example.com'}
//                           </div>
//                           <Separator />
//                           <div className="whitespace-pre-wrap">
//                             {generatePreviewMessage(watchedFacultyList[0]?.name || 'Faculty Member')}
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Faculty List Preview */}
//                     <div>
//                       <h4 className="font-medium mb-3">Recipients Summary</h4>
//                       <div className="space-y-2 max-h-60 overflow-y-auto">
//                         {watchedFacultyList.map((faculty, index) => (
//                           <div key={index} className="flex items-center justify-between p-3 border rounded">
//                             <div>
//                               <p className="font-medium">{faculty.name}</p>
//                               <p className="text-sm text-muted-foreground">{faculty.email}</p>
//                               {faculty.institution && (
//                                 <p className="text-xs text-muted-foreground">{faculty.institution}</p>
//                               )}
//                             </div>
//                             <Badge variant="outline">{faculty.role}</Badge>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           )}

//           {/* Step 3: Results */}
//           {step === 'send' && invitationResults && (
//             <div className="space-y-6">
//               <Card>
//                 <CardHeader>
//                   <CardTitle className="flex items-center">
//                     <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
//                     Invitations Sent Successfully
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-6">
                    
//                     {/* Results Summary */}
//                     <div className="grid gap-4 md:grid-cols-3">
//                       <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
//                         <div className="flex items-center">
//                           <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
//                           <div>
//                             <p className="font-medium text-green-800">{invitationResults.data.summary.successful}</p>
//                             <p className="text-sm text-green-600">Sent successfully</p>
//                           </div>
//                         </div>
//                       </div>
                      
//                       {invitationResults.data.summary.failed > 0 && (
//                         <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
//                           <div className="flex items-center">
//                             <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
//                             <div>
//                               <p className="font-medium text-red-800">{invitationResults.data.summary.failed}</p>
//                               <p className="text-sm text-red-600">Failed to send</p>
//                             </div>
//                           </div>
//                         </div>
//                       )}
                      
//                       <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
//                         <div className="flex items-center">
//                           <Mail className="h-5 w-5 text-blue-600 mr-2" />
//                           <div>
//                             <p className="font-medium text-blue-800">{invitationResults.data.summary.total}</p>
//                             <p className="text-sm text-blue-600">Total invitations</p>
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Successful Invitations */}
//                     {invitationResults.data.invited.length > 0 && (
//                       <div>
//                         <h4 className="font-medium mb-3 text-green-800">Successfully Sent</h4>
//                         <div className="space-y-2">
//                           {invitationResults.data.invited.map((invitation: any, index: number) => (
//                             <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
//                               <div>
//                                 <p className="font-medium">{invitation.name}</p>
//                                 <p className="text-sm text-muted-foreground">{invitation.email}</p>
//                               </div>
//                               <Badge variant="outline" className="text-green-600">
//                                 Sent
//                               </Badge>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     {/* Failed Invitations */}
//                     {invitationResults.data.errors.length > 0 && (
//                       <div>
//                         <h4 className="font-medium mb-3 text-red-800">Failed to Send</h4>
//                         <div className="space-y-2">
//                           {invitationResults.data.errors.map((error: any, index: number) => (
//                             <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
//                               <div>
//                                 <p className="font-medium">{error.email}</p>
//                                 <p className="text-sm text-red-600">{error.error}</p>
//                               </div>
//                               <Badge variant="outline" className="text-red-600">
//                                 Failed
//                               </Badge>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           )}

//           {/* Action Buttons */}
//           <div className="flex items-center justify-between">
//             <div>
//               {step === 'preview' && (
//                 <Button type="button" variant="outline" onClick={() => setStep('compose')}>
//                   <ArrowLeft className="h-4 w-4 mr-2" />
//                   Back to Edit
//                 </Button>
//               )}
//             </div>
            
//             <div className="flex space-x-2">
//               {step === 'compose' && (
//                 <Button type="submit" disabled={!watchedEventId || watchedFacultyList.length === 0}>
//                   <Eye className="h-4 w-4 mr-2" />
//                   Preview Invitations
//                 </Button>
//               )}
              
//               {step === 'preview' && (
//                 <Button type="submit" disabled={isSubmitting}>
//                   {isSubmitting ? (
//                     <LoadingSpinner size="sm" />
//                   ) : (
//                     <>
//                       <Send className="h-4 w-4 mr-2" />
//                       Send Invitations
//                     </>
//                   )}
//                 </Button>
//               )}
              
//               {step === 'send' && (
//                 <div className="flex space-x-2">
//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={() => router.push('/event-manager/faculty')}
//                   >
//                     <Users className="h-4 w-4 mr-2" />
//                     View Faculty
//                   </Button>
//                   <Button
//                     type="button"
//                     onClick={() => {
//                       setStep('compose');
//                       setInvitationResults(null);
//                     }}
//                   >
//                     <Plus className="h-4 w-4 mr-2" />
//                     Send More Invitations
//                   </Button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </form>
//       </div>
//     </EventManagerLayout>
//   );
// }

"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EventManagerLayout } from "@/components/dashboard/layout";
import {
  Upload,
  Download,
  Mail, 
  Users,
  CheckCircle,
  X,
  AlertCircle,
  FileText, 
  Send,
  RefreshCw,
  Search,
  Trash2,
  Calendar,
  MapPin,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";

interface FacultyInvitation {
  id: string;
  name: string;
  email: string;
  department?: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  invitedAt: string;
  respondedAt?: string;
  eventId: string;
  eventTitle: string;
  notes?: string;
}

interface EventData {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  venue: string;
}

export default function FacultyInvitationsPage() {
  const [invitations, setInvitations] = useState<FacultyInvitation[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<
    "ALL" | "PENDING" | "ACCEPTED" | "DECLINED"
  >("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Event Details for Invitation
  const [eventData, setEventData] = useState<EventData>({
    id: `event-${Date.now()}`,
    title: "Academic Excellence Conference 2025",
    description:
      "Join us for a comprehensive conference featuring the latest research and innovations in your field.",
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
    location: "University Campus",
    venue: "Main Auditorium",
  });

  const [emailTemplate, setEmailTemplate] = useState({
    subject: "Invitation to Academic Excellence Conference 2025",
    message: `Dear {{facultyName}},

We are delighted to invite you to participate in the Academic Excellence Conference 2025, a premier academic gathering that brings together distinguished faculty members and researchers.

**Conference Details:**
📅 Dates: {{eventDates}}
📍 Location: {{eventLocation}}
🏢 Venue: {{eventVenue}}

**About the Conference:**
{{eventDescription}}

Your expertise and insights would be invaluable to our academic community. We would be honored to have you join us for this prestigious event.

**What's Included:**
• Keynote sessions and panel discussions
• Networking opportunities with peers
• Certificate of participation
• Conference materials and resources

Please confirm your participation by clicking the link below to access your personalized faculty portal.

Best regards,
Conference Organizing Committee`,
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedInvitations = localStorage.getItem("facultyInvitations");
    if (savedInvitations) {
      try {
        setInvitations(JSON.parse(savedInvitations));
      } catch (error) {
        console.error("Error loading saved invitations:", error);
        localStorage.removeItem("facultyInvitations");
      }
    }
  }, []);

  // Save data to localStorage whenever invitations change
  useEffect(() => {
    localStorage.setItem("facultyInvitations", JSON.stringify(invitations));
  }, [invitations]);

  // Handle Excel file upload and extraction
  const handleFileUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("Excel file has no worksheets");
        }

        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
          throw new Error("No worksheet found in the workbook");
        }

        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
          throw new Error(`Worksheet "${firstSheetName}" not found`);
        }

        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          throw new Error("Excel file is empty or contains no data");
        }

        console.log("📊 Excel data extracted:", jsonData);

        // Extract faculty emails with smart detection
        const newInvitations: FacultyInvitation[] = jsonData.map(
          (row: any, index: number) => {
            let email: string | undefined =
              row.Email ||
              row.email ||
              row.EMAIL ||
              row["Email Address"] ||
              row["email address"] ||
              row["E-mail"] ||
              row["e-mail"];

            if (!email) {
              const foundEmail = Object.values(row).find(
                (value) =>
                  value && typeof value === "string" && value.includes("@")
              );
              email = foundEmail ? String(foundEmail) : undefined;
            }

            const name =
              row.Name ||
              row.name ||
              row.NAME ||
              row["Full Name"] ||
              row["full name"] ||
              row["Faculty Name"] ||
              row["faculty name"] ||
              `Faculty ${index + 1}`;

            const department =
              row.Department ||
              row.department ||
              row.DEPARTMENT ||
              row.Dept ||
              row.dept ||
              row.DEPT ||
              row.Division ||
              row.division ||
              "";

            if (!email || !email.includes("@")) {
              throw new Error(
                `Invalid email at row ${index + 1}: ${email || "not found"}`
              );
            }

            return {
              id: `faculty-${Date.now()}-${index}`,
              name: name ? String(name).trim() : `Faculty ${index + 1}`,
              email: email.trim().toLowerCase(),
              department: department ? String(department).trim() : "",
              status: "PENDING" as const,
              invitedAt: new Date().toISOString(),
              eventId: eventData.id,
              eventTitle: eventData.title,
            };
          }
        );

        // Remove duplicates based on email
        const uniqueInvitations = newInvitations.filter(
          (newInv, index, self) =>
            index === self.findIndex((inv) => inv.email === newInv.email) &&
            !invitations.some(
              (existingInv) => existingInv.email === newInv.email
            )
        );

        setInvitations((prev) => [...prev, ...uniqueInvitations]);
        setSelectedFile(null);

        alert(`✅ Successfully extracted ${
          uniqueInvitations.length
        } unique email addresses!
      ${
        newInvitations.length - uniqueInvitations.length
      } duplicates were skipped.`);
      } catch (error) {
        console.error("❌ Error uploading file:", error);
        alert(
          `❌ Failed to process Excel file: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        setUploading(false);
      }
    },
    [invitations, eventData]
  );

  // Send personalized invitations with unique login links
  const handleSendInvitations = useCallback(async () => {
    setSending(true);
    try {
      const pendingInvitations = invitations.filter(
        (inv) => inv.status === "PENDING"
      );

      if (pendingInvitations.length === 0) {
        alert("❌ No pending invitations to send.");
        setSending(false);
        return;
      }

      // Prepare invitation data
      const invitationData = {
        event: eventData,
        template: emailTemplate,
        invitations: pendingInvitations,
      };

      // Call API to send emails
      const response = await fetch("/api/faculty/send-event-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invitationData),
      });

      if (!response.ok) {
        throw new Error("Failed to send invitations");
      }

      const result = await response.json();

      alert(`✅ Successfully sent ${result.data.sentCount} personalized invitations!
      📧 Each faculty member will receive a unique login link.
      🔗 They can access their invitation through the faculty portal.`);

      console.log("📧 Invitation Summary:", {
        eventTitle: eventData.title,
        totalSent: result.data.sentCount,
        sentTo: result.data.sentInvitations.map((s: any) => s.email),
        failedCount: result.data.failedCount,
      });
    } catch (error) {
      console.error("❌ Error sending invitations:", error);
      alert("❌ Failed to send invitations. Please try again.");
    } finally {
      setSending(false);
    }
  }, [invitations, emailTemplate, eventData]);

  // Export accepted faculty list
  const handleExportAccepted = useCallback(() => {
    try {
      const acceptedFaculty = invitations.filter(
        (inv) => inv.status === "ACCEPTED"
      );

      if (acceptedFaculty.length === 0) {
        alert("❌ No accepted invitations to export.");
        return;
      }

      const excelData = acceptedFaculty.map((faculty, index) => ({
        "S.No": index + 1,
        Name: faculty.name,
        Email: faculty.email,
        Department: faculty.department || "",
        Event: faculty.eventTitle,
        Status: faculty.status,
        "Invited Date": format(new Date(faculty.invitedAt), "dd/MM/yyyy"),
        "Response Date": faculty.respondedAt
          ? format(new Date(faculty.respondedAt), "dd/MM/yyyy")
          : "",
        Notes: faculty.notes || "",
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      const colWidths = [
        { wch: 5 },
        { wch: 25 },
        { wch: 30 },
        { wch: 20 },
        { wch: 30 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 30 },
      ];
      worksheet["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Accepted Faculty");
      XLSX.writeFile(
        workbook,
        `accepted-faculty-${eventData.title.replace(/\s+/g, "-")}-${format(
          new Date(),
          "yyyy-MM-dd"
        )}.xlsx`
      );

      alert(
        `✅ Exported ${acceptedFaculty.length} accepted faculty to Excel file!`
      );
    } catch (error) {
      console.error("❌ Error exporting data:", error);
      alert("❌ Failed to export data. Please try again.");
    }
  }, [invitations, eventData]);

  // Refresh responses from faculty
  const refreshResponses = useCallback(async () => {
    try {
      // Update from localStorage in case faculty responded
      const savedInvitations = localStorage.getItem("facultyInvitations");
      if (savedInvitations) {
        const updatedInvitations = JSON.parse(savedInvitations);
        setInvitations(updatedInvitations);
      }
    } catch (error) {
      console.error("Error refreshing responses:", error);
    }
  }, []);

  // Auto-refresh every 10 seconds to catch faculty responses
  useEffect(() => {
    const interval = setInterval(refreshResponses, 10000);
    return () => clearInterval(interval);
  }, [refreshResponses]);

  // Clear all data
  const handleClearAll = useCallback(() => {
    if (confirm("Are you sure you want to clear all invitation data?")) {
      setInvitations([]);
      localStorage.removeItem("facultyInvitations");
      alert("✅ All data cleared!");
    }
  }, []);

  // Filter invitations
  const filteredInvitations = invitations.filter((inv) => {
    const matchesFilter = filter === "ALL" || inv.status === filter;
    const matchesSearch =
      inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.department &&
        inv.department.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: invitations.length,
    pending: invitations.filter((inv) => inv.status === "PENDING").length,
    accepted: invitations.filter((inv) => inv.status === "ACCEPTED").length,
    declined: invitations.filter((inv) => inv.status === "DECLINED").length,
  };

  return (
    <EventManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Faculty Event Invitations
            </h1>
            <p className="text-muted-foreground">
              Upload Excel file, send personalized invitations, and track
              faculty responses
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button onClick={refreshResponses} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleExportAccepted}
              variant="outline"
              disabled={stats.accepted === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Accepted ({stats.accepted})
            </Button>
            <Button
              onClick={handleSendInvitations}
              disabled={stats.pending === 0 || sending}
            >
              {sending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Invitations ({stats.pending})
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Faculty
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.accepted}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Declined</CardTitle>
              <X className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.declined}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Event Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  value={eventData.title}
                  onChange={(e) =>
                    setEventData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={eventData.location}
                  onChange={(e) =>
                    setEventData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Venue</label>
                <input
                  type="text"
                  value={eventData.venue}
                  onChange={(e) =>
                    setEventData((prev) => ({ ...prev, venue: e.target.value }))
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={eventData.startDate.split("T")[0]}
                    onChange={(e) =>
                      setEventData((prev) => ({
                        ...prev,
                        startDate: new Date(e.target.value).toISOString(),
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={eventData.endDate.split("T")[0]}
                    onChange={(e) =>
                      setEventData((prev) => ({
                        ...prev,
                        endDate: new Date(e.target.value).toISOString(),
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={eventData.description}
                  onChange={(e) =>
                    setEventData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </CardContent>
          </Card>

          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Faculty List
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  Upload Excel file with faculty emails
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                    }
                  }}
                  className="hidden"
                  id="excel-upload"
                />
                <label
                  htmlFor="excel-upload"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                >
                  Choose Excel File
                </label>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {selectedFile.name}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleFileUpload(selectedFile)}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      "Process"
                    )}
                  </Button>
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Excel should have columns: Name, Email, Department (optional).
                  Supports various column name formats.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Email Template */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailTemplate.subject}
                  onChange={(e) =>
                    setEmailTemplate((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Message
                </label>
                <textarea
                  value={emailTemplate.message}
                  onChange={(e) =>
                    setEmailTemplate((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  rows={12}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Available placeholders:{" "}
                  {`{{facultyName}}, {{eventDates}}, {{eventLocation}}, {{eventVenue}}, {{eventDescription}}`}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Faculty List */}
        {invitations.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Faculty Invitations ({invitations.length})
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search faculty..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                  <select
                    value={filter}
                    onChange={(e) =>
                      setFilter(
                        e.target.value as
                          | "ALL"
                          | "PENDING"
                          | "ACCEPTED"
                          | "DECLINED"
                      )
                    }
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="DECLINED">Declined</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium">Department</th>
                      <th className="text-left p-3 font-medium">Event</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Invited At</th>
                      <th className="text-left p-3 font-medium">
                        Response Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredInvitations.map((invitation) => (
                      <tr key={invitation.id} className="hover:bg-gray-50">
                        <td className="p-3 font-medium">{invitation.name}</td>
                        <td className="p-3 text-gray-600">
                          {invitation.email}
                        </td>
                        <td className="p-3 text-gray-600">
                          {invitation.department || "-"}
                        </td>
                        <td className="p-3 text-gray-600 text-xs">
                          {invitation.eventTitle}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              invitation.status === "ACCEPTED"
                                ? "default"
                                : invitation.status === "PENDING"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {invitation.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-gray-600">
                          {format(
                            new Date(invitation.invitedAt),
                            "MMM dd, yyyy"
                          )}
                        </td>
                        <td className="p-3 text-gray-600">
                          {invitation.respondedAt
                            ? format(
                                new Date(invitation.respondedAt),
                                "MMM dd, yyyy"
                              )
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                Showing {filteredInvitations.length} of {invitations.length}{" "}
                invitations
              </div>
            </CardContent>
          </Card>
        )}

        {invitations.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Faculty Invitations
              </h3>
              <p className="text-gray-500 mb-4">
                Upload an Excel file to get started with faculty invitations.
              </p>
              <div className="text-sm text-gray-400 space-y-1">
                <p>📋 Step 1: Configure your event details</p>
                <p>📁 Step 2: Upload Excel file with faculty emails</p>
                <p>✉️ Step 3: Send personalized invitations</p>
                <p>📊 Step 4: Track responses on your dashboard</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </EventManagerLayout>
  );
}
