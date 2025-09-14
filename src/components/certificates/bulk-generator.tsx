// // src/components/certificates/bulk-generator.tsx

// 'use client';

// import React, { useState, useCallback, useRef } from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Textarea } from '@/components/ui/textarea';
// import { Checkbox } from '@/components/ui/checkbox';
// import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { 
//   Upload, 
//   Download, 
//   FileText, 
//   Users, 
//   CheckCircle2, 
//   AlertCircle, 
//   Mail,
//   Settings,
//   Eye,
//   Trash2,
//   Plus
// } from 'lucide-react';
// import { 
//   useCreateBulkCertificates, 
//   useCertificateTemplates, 
//   useCertificateGenerator,
//   useCertificateConverter 
// } from '@/hooks/use-certificates';
// import CertificateTemplateComponent from './certificate-template';
// import { CertificateData, CertificateTemplate } from '@/lib/pdf/certificate-generator';

// interface BulkCertificateData {
//   recipientName: string;
//   recipientId: string;
//   role: 'Faculty' | 'Delegate' | 'Speaker' | 'Chairperson' | 'Moderator';
//   sessionDetails?: string;
//   email?: string;
// }

// interface BulkGeneratorProps {
//   eventId: string;
//   eventName: string;
//   eventDate: string;
//   eventLocation: string;
//   organizationName: string;
//   onComplete?: (certificateCount: number) => void;
// }

// export default function BulkCertificateGenerator({
//   eventId,
//   eventName,
//   eventDate,
//   eventLocation,
//   organizationName,
//   onComplete
// }: BulkGeneratorProps) {
//   // State
//   const [step, setStep] = useState<'upload' | 'configure' | 'preview' | 'generate'>('upload');
//   const [recipients, setRecipients] = useState<BulkCertificateData[]>([]);
//   const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
//   const [sendEmail, setSendEmail] = useState(false);
//   const [errors, setErrors] = useState<string[]>([]);
//   const [previewIndex, setPreviewIndex] = useState(0);
  
//   // Refs
//   const fileInputRef = useRef<HTMLInputElement>(null);
  
//   // Hooks
//   const { data: templates } = useCertificateTemplates();
//   const createBulkMutation = useCreateBulkCertificates();
//   const { generateBulk, isGenerating, progress } = useCertificateGenerator();
//   const { convertToCertificateData } = useCertificateConverter();

//   // File upload handler
//   const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = (e) => {
//       try {
//         const text = e.target?.result as string;
//         const lines = text.split('\n').filter(line => line.trim());
//         const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
//         // Validate required columns
//         const requiredColumns = ['name', 'role'];
//         const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        
//         if (missingColumns.length > 0) {
//           setErrors([`Missing required columns: ${missingColumns.join(', ')}`]);
//           return;
//         }

//         // Parse data
//         const data: BulkCertificateData[] = [];
//         const parseErrors: string[] = [];

//         for (let i = 1; i < lines.length; i++) {
//           const values = lines[i].split(',').map(v => v.trim());
//           const row: any = {};
          
//           headers.forEach((header, index) => {
//             row[header] = values[index] || '';
//           });

//           // Validate and transform data
//           if (!row.name) {
//             parseErrors.push(`Row ${i + 1}: Name is required`);
//             continue;
//           }

//           if (!row.role || !['Faculty', 'Delegate', 'Speaker', 'Chairperson', 'Moderator'].includes(row.role)) {
//             parseErrors.push(`Row ${i + 1}: Invalid role "${row.role}"`);
//             continue;
//           }

//           data.push({
//             recipientName: row.name,
//             recipientId: row.id || `recipient-${Date.now()}-${i}`,
//             role: row.role as any,
//             sessionDetails: row.session || row.sessiondetails || '',
//             email: row.email || ''
//           });
//         }

//         if (parseErrors.length > 0) {
//           setErrors(parseErrors);
//         } else {
//           setErrors([]);
//           setRecipients(data);
//           setStep('configure');
//         }

//       } catch (error) {
//         setErrors(['Error parsing CSV file. Please check the format.']);
//       }
//     };

//     reader.readAsText(file);
//   }, []);

//   // Manual recipient addition
//   const addRecipient = useCallback(() => {
//     setRecipients(prev => [...prev, {
//       recipientName: '',
//       recipientId: `recipient-${Date.now()}`,
//       role: 'Delegate',
//       sessionDetails: '',
//       email: ''
//     }]);
//   }, []);

//   const removeRecipient = useCallback((index: number) => {
//     setRecipients(prev => prev.filter((_, i) => i !== index));
//   }, []);

//   const updateRecipient = useCallback((index: number, data: Partial<BulkCertificateData>) => {
//     setRecipients(prev => prev.map((recipient, i) => 
//       i === index ? { ...recipient, ...data } : recipient
//     ));
//   }, []);

//   // Generate certificates
//   const handleGenerate = useCallback(async () => {
//     if (!selectedTemplate) {
//       setErrors(['Please select a certificate template']);
//       return;
//     }

//     setStep('generate');
    
//     try {
//       // Create certificates in database
//       const certificateData = recipients.map(recipient => ({
//         recipientId: recipient.recipientId,
//         recipientName: recipient.recipientName,
//         role: recipient.role,
//         sessionDetails: recipient.sessionDetails,
//         templateId: selectedTemplate.id
//       }));

//       await createBulkMutation.mutateAsync({
//         eventId,
//         certificates: certificateData,
//         templateId: selectedTemplate.id,
//         sendEmail
//       });

//       // Generate PDFs
//       const certificateDataForPDF: CertificateData[] = recipients.map(recipient => ({
//         recipientName: recipient.recipientName,
//         eventName,
//         eventDate,
//         role: recipient.role,
//         organizationName,
//         eventLocation,
//         certificateId: `CERT-${eventId}-${recipient.recipientId}-${Date.now()}`,
//         issueDate: new Date().toLocaleDateString('en-US', {
//           year: 'numeric',
//           month: 'long',
//           day: 'numeric'
//         }),
//         sessionDetails: recipient.sessionDetails
//       }));

//       const pdfBlobs = await generateBulk(certificateDataForPDF, selectedTemplate);

//       // Download all PDFs
//       pdfBlobs.forEach((blob, index) => {
//         const recipient = recipients[index];
//         const filename = `certificate-${recipient.recipientName.replace(/\s+/g, '-').toLowerCase()}`;
//         const url = URL.createObjectURL(blob);
//         const link = document.createElement('a');
//         link.href = url;
//         link.download = `${filename}.pdf`;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         URL.revokeObjectURL(url);
//       });

//       onComplete?.(recipients.length);
      
//     } catch (error) {
//       console.error('Error generating certificates:', error);
//       setErrors([error instanceof Error ? error.message : 'Failed to generate certificates']);
//     }
//   }, [selectedTemplate, recipients, eventId, eventName, eventDate, eventLocation, organizationName, sendEmail, createBulkMutation, generateBulk, onComplete]);

//   // Get preview data
//   const getPreviewData = useCallback((): CertificateData | null => {
//     if (!recipients[previewIndex] || !selectedTemplate) return null;

//     const recipient = recipients[previewIndex];
//     return {
//       recipientName: recipient.recipientName,
//       eventName,
//       eventDate,
//       role: recipient.role,
//       organizationName,
//       eventLocation,
//       certificateId: `CERT-${eventId}-${recipient.recipientId}-PREVIEW`,
//       issueDate: new Date().toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric'
//       }),
//       sessionDetails: recipient.sessionDetails
//     };
//   }, [recipients, previewIndex, selectedTemplate, eventName, eventDate, organizationName, eventLocation, eventId]);

//   return (
//     <div className="max-w-6xl mx-auto p-6 space-y-6">
//       {/* Header */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Users className="w-6 h-6" />
//             Bulk Certificate Generator
//           </CardTitle>
//           <CardDescription>
//             Generate certificates for multiple recipients at once
//           </CardDescription>
//         </CardHeader>
//       </Card>

//       {/* Progress Steps */}
//       <div className="flex items-center justify-between mb-8">
//         {[
//           { key: 'upload', label: 'Upload Recipients', icon: Upload },
//           { key: 'configure', label: 'Configure', icon: Settings },
//           { key: 'preview', label: 'Preview', icon: Eye },
//           { key: 'generate', label: 'Generate', icon: Download }
//         ].map(({ key, label, icon: Icon }, index) => (
//           <div key={key} className="flex items-center">
//             <div className={`
//               flex items-center justify-center w-10 h-10 rounded-full border-2 
//               ${step === key 
//                 ? 'bg-blue-600 border-blue-600 text-white' 
//                 : ['upload', 'configure', 'preview'].indexOf(step) > index
//                   ? 'bg-green-600 border-green-600 text-white'
//                   : 'border-gray-300 text-gray-400'
//               }
//             `}>
//               <Icon className="w-5 h-5" />
//             </div>
//             <span className={`ml-2 text-sm font-medium ${
//               step === key ? 'text-blue-600' : 'text-gray-500'
//             }`}>
//               {label}
//             </span>
//             {index < 3 && (
//               <div className={`w-16 h-0.5 mx-4 ${
//                 ['upload', 'configure', 'preview'].indexOf(step) > index
//                   ? 'bg-green-600'
//                   : 'bg-gray-300'
//               }`} />
//             )}
//           </div>
//         ))}
//       </div>

//       {/* Error Display */}
//       {errors.length > 0 && (
//         <Alert variant="destructive">
//           <AlertCircle className="h-4 w-4" />
//           <AlertDescription>
//             <ul className="list-disc list-inside space-y-1">
//               {errors.map((error, index) => (
//                 <li key={index}>{error}</li>
//               ))}
//             </ul>
//           </AlertDescription>
//         </Alert>
//       )}

//       {/* Step Content */}
//       {step === 'upload' && (
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* CSV Upload */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Upload CSV File</CardTitle>
//               <CardDescription>
//                 Upload a CSV file with recipient information
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
//                 <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//                 <Button onClick={() => fileInputRef.current?.click()}>
//                   Choose CSV File
//                 </Button>
//                 <input
//                   ref={fileInputRef}
//                   type="file"
//                   accept=".csv"
//                   onChange={handleFileUpload}
//                   className="hidden"
//                 />
//                 <p className="text-sm text-gray-500 mt-2">
//                   Required columns: Name, Role
//                   <br />
//                   Optional: ID, Email, Session Details
//                 </p>
//               </div>
              
//               <div className="text-sm text-gray-600">
//                 <p className="font-medium mb-2">CSV Format Example:</p>
//                 <code className="block bg-gray-100 p-2 rounded text-xs">
//                   Name,Role,Email,Session Details<br />
//                   John Doe,Faculty,john@email.com,Keynote Speaker<br />
//                   Jane Smith,Delegate,jane@email.com,Workshop Participant
//                 </code>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Manual Entry */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Manual Entry</CardTitle>
//               <CardDescription>
//                 Add recipients manually one by one
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <Button onClick={addRecipient} className="w-full">
//                 <Plus className="w-4 h-4 mr-2" />
//                 Add Recipient
//               </Button>
              
//               {recipients.length > 0 && (
//                 <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
//                   {recipients.map((recipient, index) => (
//                     <div key={index} className="flex items-center gap-2 p-3 border rounded">
//                       <Input
//                         placeholder="Name"
//                         value={recipient.recipientName}
//                         onChange={(e) => updateRecipient(index, { recipientName: e.target.value })}
//                         className="flex-1"
//                       />
//                       <Select
//                         value={recipient.role}
//                         onValueChange={(value) => updateRecipient(index, { role: value as any })}
//                       >
//                         <SelectTrigger className="w-32">
//                           <SelectValue />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="Faculty">Faculty</SelectItem>
//                           <SelectItem value="Delegate">Delegate</SelectItem>
//                           <SelectItem value="Speaker">Speaker</SelectItem>
//                           <SelectItem value="Chairperson">Chairperson</SelectItem>
//                           <SelectItem value="Moderator">Moderator</SelectItem>
//                         </SelectContent>
//                       </Select>
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => removeRecipient(index)}
//                       >
//                         <Trash2 className="w-4 h-4" />
//                       </Button>
//                     </div>
//                   ))}
//                 </div>
//               )}
              
//               {recipients.length > 0 && (
//                 <Button 
//                   onClick={() => setStep('configure')} 
//                   className="w-full mt-4"
//                 >
//                   Continue with {recipients.length} Recipients
//                 </Button>
//               )}
//             </CardContent>
//           </Card>
//         </div>
//       )}

//       {step === 'configure' && (
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* Configuration */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Certificate Configuration</CardTitle>
//               <CardDescription>
//                 Configure template and options for all certificates
//               </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div>
//                 <Label htmlFor="template">Certificate Template</Label>
//                 <Select
//                   value={selectedTemplate?.id || ''}
//                   onValueChange={(value) => {
//                     const template = templates?.find(t => t.id === value);
//                     setSelectedTemplate(template || null);
//                   }}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select a template" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {templates?.map(template => (
//                       <SelectItem key={template.id} value={template.id}>
//                         {template.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="flex items-center space-x-2">
//                 <Checkbox
//                   id="sendEmail"
//                   checked={sendEmail}
//                   onCheckedChange={setSendEmail}
//                 />
//                 <Label htmlFor="sendEmail" className="flex items-center gap-2">
//                   <Mail className="w-4 h-4" />
//                   Send certificates via email
//                 </Label>
//               </div>

//               <div className="pt-4">
//                 <Badge variant="secondary" className="mb-2">
//                   Recipients: {recipients.length}
//                 </Badge>
//                 <div className="text-sm text-gray-600 space-y-1">
//                   <p>• Faculty: {recipients.filter(r => r.role === 'Faculty').length}</p>
//                   <p>• Delegates: {recipients.filter(r => r.role === 'Delegate').length}</p>
//                   <p>• Speakers: {recipients.filter(r => r.role === 'Speaker').length}</p>
//                   <p>• Others: {recipients.filter(r => !['Faculty', 'Delegate', 'Speaker'].includes(r.role)).length}</p>
//                 </div>
//               </div>

//               <div className="flex gap-2 pt-4">
//                 <Button variant="outline" onClick={() => setStep('upload')}>
//                   Back
//                 </Button>
//                 <Button 
//                   onClick={() => setStep('preview')}
//                   disabled={!selectedTemplate}
//                   className="flex-1"
//                 >
//                   Preview Certificates
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Recipients Summary */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Recipients Summary</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="max-h-80 overflow-y-auto space-y-2">
//                 {recipients.map((recipient, index) => (
//                   <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
//                     <div>
//                       <p className="font-medium">{recipient.recipientName}</p>
//                       <p className="text-gray-500">{recipient.role}</p>
//                     </div>
//                     <Badge variant="outline">{recipient.role}</Badge>
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       )}

//       {step === 'preview' && selectedTemplate && (
//         <div className="space-y-6">
//           {/* Preview Controls */}
//           <Card>
//             <CardContent className="p-4">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-4">
//                   <Label>Preview Certificate:</Label>
//                   <Select
//                     value={previewIndex.toString()}
//                     onValueChange={(value) => setPreviewIndex(parseInt(value))}
//                   >
//                     <SelectTrigger className="w-64">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {recipients.map((recipient, index) => (
//                         <SelectItem key={index} value={index.toString()}>
//                           {recipient.recipientName} ({recipient.role})
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
                
//                 <div className="flex gap-2">
//                   <Button variant="outline" onClick={() => setStep('configure')}>
//                     Back
//                   </Button>
//                   <Button onClick={handleGenerate}>
//                     Generate All Certificates
//                   </Button>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Certificate Preview */}
//           {getPreviewData() && (
//             <CertificateTemplateComponent
//               data={getPreviewData()!}
//               template={selectedTemplate}
//               isPreview={true}
//               showControls={false}
//             />
//           )}
//         </div>
//       )}

//       {step === 'generate' && (
//         <Card>
//           <CardContent className="p-6 text-center">
//             <div className="space-y-4">
//               <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
//                 <Download className="w-8 h-8 text-blue-600" />
//               </div>
              
//               <div>
//                 <h3 className="text-lg font-semibold">Generating Certificates</h3>
//                 <p className="text-gray-500">
//                   Please wait while we generate {recipients.length} certificates...
//                 </p>
//               </div>

//               {isGenerating && (
//                 <div className="space-y-2">
//                   <Progress value={progress} className="w-full max-w-md mx-auto" />
//                   <p className="text-sm text-gray-500">
//                     {Math.round(progress)}% Complete
//                   </p>
//                 </div>
//               )}

//               {!isGenerating && progress === 100 && (
//                 <div className="space-y-4">
//                   <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
//                   <div>
//                     <h3 className="text-lg font-semibold text-green-600">
//                       Certificates Generated Successfully!
//                     </h3>
//                     <p className="text-gray-500">
//                       {recipients.length} certificates have been generated and downloaded.
//                     </p>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }