// 'use client';

// import React, { useState, useEffect } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { 
//   QrCode, 
//   Download, 
//   RefreshCw, 
//   Clock, 
//   Users, 
//   MapPin,
//   Printer,
//   Share2,
//   Eye,
//   EyeOff
// } from 'lucide-react';
// import { QRAttendanceGenerator, QRAttendanceData, QRGenerationOptions } from '@/lib/qr/generator';

// interface Session {
//   id: string;
//   name: string;
//   startTime: string;
//   endTime: string;
//   hallId?: string;
//   hallName?: string;
//   speakerCount?: number;
//   expectedAttendees?: number;
// }

// interface QRDisplayProps {
//   session: Session;
//   eventId: string;
//   onAttendanceUpdate?: (count: number) => void;
//   className?: string;
// }

// export default function QRDisplay({ 
//   session, 
//   eventId, 
//   onAttendanceUpdate, 
//   className = '' 
// }: QRDisplayProps) {
//   const [qrDataURL, setQrDataURL] = useState<string>('');
//   const [qrData, setQrData] = useState<QRAttendanceData | null>(null);
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [expiryStatus, setExpiryStatus] = useState<{
//     isExpired: boolean;
//     expiresIn: number;
//     expiresInMinutes: number;
//   } | null>(null);
//   const [error, setError] = useState<string>('');
//   const [attendanceCount, setAttendanceCount] = useState(0);
//   const [isQRVisible, setIsQRVisible] = useState(true);

//   // Generate initial QR code
//   useEffect(() => {
//     generateQRCode();
//   }, [session.id, eventId]);

//   // Update expiry status every second
//   useEffect(() => {
//     if (!qrData) return;

//     const interval = setInterval(() => {
//       const status = QRAttendanceGenerator.getExpiryStatus(qrData);
//       setExpiryStatus(status);

//       // Auto-refresh if expired
//       if (status.isExpired && !isGenerating) {
//         generateQRCode();
//       }
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [qrData, isGenerating]);

//   const generateQRCode = async () => {
//     setIsGenerating(true);
//     setError('');

//     try {
//       const options: QRGenerationOptions = {
//         sessionId: session.id,
//         eventId,
//         hallId: session.hallId,
//         sessionName: session.name,
//         expiryMinutes: 30, // 30 minutes default
//         size: 300
//       };

//       const dataURL = await QRAttendanceGenerator.generateQRCodeDataURL(options);
//       const data = QRAttendanceGenerator.generateQRData(options);

//       setQrDataURL(dataURL);
//       setQrData(data);
//       setError('');
//     } catch (err) {
//       setError('Failed to generate QR code. Please try again.');
//       console.error('QR generation error:', err);
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   const downloadQRCode = () => {
//     if (!qrDataURL) return;

//     const link = document.createElement('a');
//     link.download = `qr-${session.name.replace(/\s+/g, '-')}-${Date.now()}.png`;
//     link.href = qrDataURL;
//     link.click();
//   };

//   const printQRCode = () => {
//     if (!qrDataURL) return;

//     const printWindow = window.open('', '_blank');
//     if (!printWindow) return;

//     printWindow.document.write(`
//       <html>
//         <head>
//           <title>QR Code - ${session.name}</title>
//           <style>
//             body { 
//               font-family: Arial, sans-serif; 
//               text-align: center; 
//               margin: 20px;
//             }
//             .qr-container { 
//               border: 2px solid #000; 
//               padding: 20px; 
//               display: inline-block;
//               border-radius: 10px;
//             }
//             img { 
//               max-width: 300px; 
//               height: auto; 
//             }
//             .session-info {
//               margin-bottom: 15px;
//               font-size: 18px;
//               font-weight: bold;
//             }
//             .instructions {
//               margin-top: 15px;
//               font-size: 14px;
//               color: #666;
//             }
//           </style>
//         </head>
//         <body>
//           <div class="qr-container">
//             <div class="session-info">${session.name}</div>
//             <img src="${qrDataURL}" alt="QR Code for ${session.name}" />
//             <div class="instructions">
//               Scan this QR code to mark attendance<br>
//               Valid for 30 minutes
//             </div>
//           </div>
//         </body>
//       </html>
//     `);
//     printWindow.document.close();
//     printWindow.print();
//   };

//   const shareQRCode = async () => {
//     if (!qrDataURL) return;

//     try {
//       // Convert data URL to blob
//       const response = await fetch(qrDataURL);
//       const blob = await response.blob();
      
//       const file = new File([blob], `qr-${session.name}.png`, { type: 'image/png' });

//       if (navigator.share && navigator.canShare({ files: [file] })) {
//         await navigator.share({
//           title: `QR Code - ${session.name}`,
//           text: `Attendance QR code for ${session.name}`,
//           files: [file]
//         });
//       } else {
//         // Fallback: copy to clipboard if Web Share API not available
//         await navigator.clipboard.writeText(window.location.href);
//         alert('QR code link copied to clipboard!');
//       }
//     } catch (err) {
//       console.error('Share failed:', err);
//       alert('Sharing failed. Please try downloading the QR code instead.');
//     }
//   };

//   const formatTime = (dateString: string) => {
//     return new Date(dateString).toLocaleTimeString('en-IN', {
//       hour: '2-digit',
//       minute: '2-digit',
//       hour12: true
//     });
//   };

//   const getExpiryColor = () => {
//     if (!expiryStatus) return 'bg-gray-500';
//     if (expiryStatus.isExpired) return 'bg-red-500';
//     if (expiryStatus.expiresInMinutes <= 5) return 'bg-orange-500';
//     return 'bg-green-500';
//   };

//   return (
//     <Card className={`w-full max-w-md mx-auto ${className}`}>
//       <CardHeader className="text-center pb-4">
//         <CardTitle className="flex items-center justify-center gap-2 text-lg">
//           <QrCode className="h-5 w-5" />
//           Attendance QR Code
//         </CardTitle>
//         <div className="space-y-2">
//           <h3 className="font-semibold text-base">{session.name}</h3>
//           <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-600">
//             <span className="flex items-center gap-1">
//               <Clock className="h-3 w-3" />
//               {formatTime(session.startTime)} - {formatTime(session.endTime)}
//             </span>
//             {session.hallName && (
//               <span className="flex items-center gap-1">
//                 <MapPin className="h-3 w-3" />
//                 {session.hallName}
//               </span>
//             )}
//           </div>
//         </div>
//       </CardHeader>

//       <CardContent className="space-y-4">
//         {error && (
//           <Alert className="border-red-200 bg-red-50">
//             <AlertDescription className="text-red-700">
//               {error}
//             </AlertDescription>
//           </Alert>
//         )}

//         {/* QR Code Display */}
//         <div className="text-center">
//           {isGenerating ? (
//             <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
//               <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
//             </div>
//           ) : qrDataURL ? (
//             <div className="relative">
//               <div className={`transition-all duration-300 ${isQRVisible ? 'opacity-100' : 'opacity-20 blur-sm'}`}>
//                 <img 
//                   src={qrDataURL} 
//                   alt={`QR Code for ${session.name}`}
//                   className="mx-auto border-2 border-gray-200 rounded-lg"
//                   style={{ maxWidth: '280px', height: 'auto' }}
//                 />
//               </div>
              
//               {/* QR Visibility Toggle */}
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={() => setIsQRVisible(!isQRVisible)}
//                 className="absolute top-2 right-2 p-1 h-8 w-8"
//               >
//                 {isQRVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//               </Button>
//             </div>
//           ) : null}
//         </div>

//         {/* Status Information */}
//         {expiryStatus && (
//           <div className="space-y-2">
//             <div className="flex items-center justify-between">
//               <span className="text-sm font-medium">Status:</span>
//               <Badge className={`${getExpiryColor()} text-white`}>
//                 {expiryStatus.isExpired ? 'Expired' : 'Active'}
//               </Badge>
//             </div>
            
//             {!expiryStatus.isExpired && (
//               <div className="flex items-center justify-between text-sm">
//                 <span>Expires in:</span>
//                 <span className="font-mono">
//                   {expiryStatus.expiresInMinutes}m {Math.floor((expiryStatus.expiresIn % 60000) / 1000)}s
//                 </span>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Attendance Counter */}
//         <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
//           <span className="flex items-center gap-2 text-sm font-medium">
//             <Users className="h-4 w-4" />
//             Current Attendance:
//           </span>
//           <span className="text-lg font-bold text-blue-600">{attendanceCount}</span>
//         </div>

//         {/* Action Buttons */}
//         <div className="grid grid-cols-2 gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={generateQRCode}
//             disabled={isGenerating}
//             className="flex items-center gap-1"
//           >
//             <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
//             Refresh
//           </Button>

//           <Button
//             variant="outline"
//             size="sm"
//             onClick={downloadQRCode}
//             disabled={!qrDataURL}
//             className="flex items-center gap-1"
//           >
//             <Download className="h-4 w-4" />
//             Download
//           </Button>

//           <Button
//             variant="outline"
//             size="sm"
//             onClick={printQRCode}
//             disabled={!qrDataURL}
//             className="flex items-center gap-1"
//           >
//             <Printer className="h-4 w-4" />
//             Print
//           </Button>

//           <Button
//             variant="outline"
//             size="sm"
//             onClick={shareQRCode}
//             disabled={!qrDataURL}
//             className="flex items-center gap-1"
//           >
//             <Share2 className="h-4 w-4" />
//             Share
//           </Button>
//         </div>

//         {/* Instructions */}
//         <div className="text-xs text-gray-500 text-center p-3 bg-gray-50 rounded-lg">
//           <p className="mb-1">📱 Attendees can scan this QR code with their phone camera</p>
//           <p>⏰ QR code automatically refreshes every 30 minutes</p>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }