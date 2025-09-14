// 'use client';

// import React, { useState, useRef, useEffect } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Badge } from '@/components/ui/badge';
// import { 
//   Camera, 
//   X, 
//   CheckCircle, 
//   AlertCircle, 
//   RotateCcw,
//   FlashlightIcon as Flashlight,
//   SwitchCamera,
//   Scan,
//   UserCheck,
//   Clock,
//   MapPin
// } from 'lucide-react';
// import { QRAttendanceGenerator, QRAttendanceData } from '@/lib/qr/generator';

// interface QRScannerProps {
//   onScanSuccess: (data: QRAttendanceData) => Promise<void>;
//   onScanError?: (error: string) => void;
//   onClose?: () => void;
//   className?: string;
// }

// interface ScanResult {
//   success: boolean;
//   data?: QRAttendanceData;
//   message: string;
//   sessionName?: string;
//   hallName?: string;
// }

// export default function QRScanner({ 
//   onScanSuccess, 
//   onScanError, 
//   onClose, 
//   className = '' 
// }: QRScannerProps) {
//   const [isScanning, setIsScanning] = useState(false);
//   const [hasPermission, setHasPermission] = useState<boolean | null>(null);
//   const [error, setError] = useState<string>('');
//   const [scanResult, setScanResult] = useState<ScanResult | null>(null);
//   const [torchEnabled, setTorchEnabled] = useState(false);
//   const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
//   const [isProcessing, setIsProcessing] = useState(false);

//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

//   // Initialize camera on component mount
//   useEffect(() => {
//     startCamera();
    
//     return () => {
//       stopCamera();
//     };
//   }, [facingMode]);

//   const startCamera = async () => {
//     try {
//       setError('');
      
//       // Stop previous stream
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach(track => track.stop());
//       }

//       // Check if getUserMedia is available
//       if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//         throw new Error('Camera access is not supported in this browser');
//       }

//       // Request camera permission
//       const constraints: MediaStreamConstraints = {
//         video: {
//           facingMode: facingMode,
//           width: { ideal: 1280 },
//           height: { ideal: 720 }
//         },
//         audio: false
//       };

//       const stream = await navigator.mediaDevices.getUserMedia(constraints);
//       streamRef.current = stream;

//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//         await videoRef.current.play();
//       }

//       setHasPermission(true);
//       setIsScanning(true);
      
//       // Start scanning for QR codes
//       startQRScanning();

//     } catch (err) {
//       console.error('Camera access error:', err);
//       setHasPermission(false);
      
//       if (err instanceof Error) {
//         if (err.name === 'NotAllowedError') {
//           setError('Camera permission denied. Please allow camera access and refresh the page.');
//         } else if (err.name === 'NotFoundError') {
//           setError('No camera found on this device.');
//         } else {
//           setError(err.message || 'Failed to access camera');
//         }
//       } else {
//         setError('Failed to access camera');
//       }
      
//       onScanError?.(error);
//     }
//   };

//   const stopCamera = () => {
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach(track => track.stop());
//       streamRef.current = null;
//     }
    
//     if (scanIntervalRef.current) {
//       clearInterval(scanIntervalRef.current);
//       scanIntervalRef.current = null;
//     }
    
//     setIsScanning(false);
//   };

//   const startQRScanning = () => {
//     if (scanIntervalRef.current) {
//       clearInterval(scanIntervalRef.current);
//     }

//     scanIntervalRef.current = setInterval(() => {
//       if (isProcessing) return;
//       scanQRCode();
//     }, 500); // Scan every 500ms
//   };

//   const scanQRCode = async () => {
//     if (!videoRef.current || !canvasRef.current || isProcessing) return;

//     try {
//       setIsProcessing(true);
      
//       const video = videoRef.current;
//       const canvas = canvasRef.current;
//       const ctx = canvas.getContext('2d');
      
//       if (!ctx) return;

//       // Set canvas size to video size
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;

//       // Draw video frame to canvas
//       ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

//       // Get image data
//       const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
//       // Use jsQR library to scan QR code
//       // Note: In a real implementation, you'd need to install and import jsQR
//       // For now, we'll simulate QR scanning with a simple implementation
//       const qrResult = await simulateQRScan(imageData);
      
//       if (qrResult) {
//         await handleQRScanResult(qrResult);
//       }

//     } catch (err) {
//       console.error('QR scanning error:', err);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   // Simulated QR scanning - replace with actual jsQR implementation
//   const simulateQRScan = async (imageData: ImageData): Promise<string | null> => {
//     // This is a placeholder - in real implementation, use jsQR:
//     // const code = jsQR(imageData.data, imageData.width, imageData.height);
//     // return code?.data || null;
    
//     // For demo purposes, we'll return null (no QR found)
//     return null;
//   };

//   const handleQRScanResult = async (qrString: string) => {
//     try {
//       setIsProcessing(true);
      
//       // Validate QR data
//       const validation = QRAttendanceGenerator.validateQRData(qrString);
      
//       if (!validation.isValid || !validation.data) {
//         const result: ScanResult = {
//           success: false,
//           message: validation.error || 'Invalid QR code'
//         };
//         setScanResult(result);
//         onScanError?.(result.message);
//         return;
//       }

//       // Check if QR is expired
//       const expiryStatus = QRAttendanceGenerator.getExpiryStatus(validation.data);
//       if (expiryStatus.isExpired) {
//         const result: ScanResult = {
//           success: false,
//           message: 'QR code has expired. Please get a new one from the coordinator.'
//         };
//         setScanResult(result);
//         onScanError?.(result.message);
//         return;
//       }

//       // Success - stop scanning and call success handler
//       stopCamera();
      
//       const result: ScanResult = {
//         success: true,
//         data: validation.data,
//         message: 'Attendance marked successfully!',
//         sessionName: validation.data.sessionName,
//         hallName: validation.data.hallId
//       };
      
//       setScanResult(result);
//       await onScanSuccess(validation.data);

//     } catch (err) {
//       console.error('QR processing error:', err);
//       const result: ScanResult = {
//         success: false,
//         message: 'Failed to process QR code. Please try again.'
//       };
//       setScanResult(result);
//       onScanError?.(result.message);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const toggleTorch = async () => {
//     if (!streamRef.current) return;

//     try {
//       const track = streamRef.current.getVideoTracks()[0];
//       const capabilities = track.getCapabilities();
      
//       if (capabilities.torch) {
//         await track.applyConstraints({
//           advanced: [{ torch: !torchEnabled } as any]
//         });
//         setTorchEnabled(!torchEnabled);
//       } else {
//         setError('Flashlight not available on this device');
//       }
//     } catch (err) {
//       console.error('Torch error:', err);
//       setError('Failed to toggle flashlight');
//     }
//   };

//   const switchCamera = () => {
//     setFacingMode(facingMode === 'user' ? 'environment' : 'user');
//   };

//   const resetScanner = () => {
//     setScanResult(null);
//     setError('');
//     startCamera();
//   };

//   const formatDateTime = (timestamp: number) => {
//     return new Date(timestamp).toLocaleString('en-IN', {
//       dateStyle: 'medium',
//       timeStyle: 'short'
//     });
//   };

//   // Show permission request
//   if (hasPermission === false) {
//     return (
//       <Card className={`w-full max-w-md mx-auto ${className}`}>
//         <CardHeader className="text-center">
//           <CardTitle className="flex items-center justify-center gap-2">
//             <Camera className="h-5 w-5" />
//             Camera Access Required
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4 text-center">
//           <AlertCircle className="h-16 w-16 mx-auto text-orange-500" />
//           <p className="text-sm text-gray-600">
//             Camera access is required to scan QR codes for attendance marking.
//           </p>
//           {error && (
//             <Alert className="border-red-200 bg-red-50">
//               <AlertDescription className="text-red-700 text-left">
//                 {error}
//               </AlertDescription>
//             </Alert>
//           )}
//           <div className="space-y-2">
//             <Button onClick={startCamera} className="w-full">
//               <Camera className="h-4 w-4 mr-2" />
//               Enable Camera
//             </Button>
//             {onClose && (
//               <Button variant="outline" onClick={onClose} className="w-full">
//                 Cancel
//               </Button>
//             )}
//           </div>
//         </CardContent>
//       </Card>
//     );
//   }

//   // Show scan result
//   if (scanResult) {
//     return (
//       <Card className={`w-full max-w-md mx-auto ${className}`}>
//         <CardHeader className="text-center">
//           <CardTitle className="flex items-center justify-center gap-2">
//             {scanResult.success ? (
//               <CheckCircle className="h-5 w-5 text-green-500" />
//             ) : (
//               <AlertCircle className="h-5 w-5 text-red-500" />
//             )}
//             {scanResult.success ? 'Success!' : 'Scan Failed'}
//           </CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4 text-center">
//           <div className={`h-16 w-16 mx-auto flex items-center justify-center rounded-full ${
//             scanResult.success ? 'bg-green-100' : 'bg-red-100'
//           }`}>
//             {scanResult.success ? (
//               <UserCheck className="h-8 w-8 text-green-600" />
//             ) : (
//               <X className="h-8 w-8 text-red-600" />
//             )}
//           </div>
          
//           <p className={`text-sm ${scanResult.success ? 'text-green-700' : 'text-red-700'}`}>
//             {scanResult.message}
//           </p>

//           {scanResult.success && scanResult.data && (
//             <div className="space-y-2 p-3 bg-green-50 rounded-lg text-left">
//               <div className="flex items-center justify-between text-sm">
//                 <span className="font-medium">Session:</span>
//                 <span>{scanResult.sessionName || 'N/A'}</span>
//               </div>
//               {scanResult.hallName && (
//                 <div className="flex items-center justify-between text-sm">
//                   <span className="font-medium">Hall:</span>
//                   <span>{scanResult.hallName}</span>
//                 </div>
//               )}
//               <div className="flex items-center justify-between text-sm">
//                 <span className="font-medium">Time:</span>
//                 <span>{formatDateTime(scanResult.data.timestamp)}</span>
//               </div>
//             </div>
//           )}

//           <div className="space-y-2">
//             <Button onClick={resetScanner} className="w-full">
//               <Scan className="h-4 w-4 mr-2" />
//               Scan Another QR Code
//             </Button>
//             {onClose && (
//               <Button variant="outline" onClick={onClose} className="w-full">
//                 Close Scanner
//               </Button>
//             )}
//           </div>
//         </CardContent>
//       </Card>
//     );
//   }

//   // Show scanner interface
//   return (
//     <Card className={`w-full max-w-md mx-auto ${className}`}>
//       <CardHeader className="text-center pb-2">
//         <CardTitle className="flex items-center justify-center gap-2">
//           <Scan className="h-5 w-5" />
//           Scan QR Code
//         </CardTitle>
//         <p className="text-sm text-gray-600">
//           Point your camera at the QR code to mark attendance
//         </p>
//       </CardHeader>

//       <CardContent className="space-y-4">
//         {error && (
//           <Alert className="border-red-200 bg-red-50">
//             <AlertDescription className="text-red-700">
//               {error}
//             </AlertDescription>
//           </Alert>
//         )}

//         {/* Camera View */}
//         <div className="relative">
//           <video
//             ref={videoRef}
//             className="w-full h-64 bg-black rounded-lg object-cover"
//             playsInline
//             muted
//           />
          
//           {/* Scanning overlay */}
//           <div className="absolute inset-0 flex items-center justify-center">
//             <div className="w-48 h-48 border-2 border-blue-500 rounded-lg relative">
//               <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
//               <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
//               <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
//               <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
              
//               {/* Scanning animation */}
//               <div className="absolute inset-0 border border-blue-300 rounded-lg animate-pulse"></div>
//             </div>
//           </div>

//           {/* Status indicator */}
//           {isScanning && (
//             <div className="absolute top-2 left-2">
//               <Badge className="bg-green-500 text-white">
//                 <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
//                 Scanning...
//               </Badge>
//             </div>
//           )}

//           {isProcessing && (
//             <div className="absolute top-2 right-2">
//               <Badge className="bg-blue-500 text-white">
//                 Processing...
//               </Badge>
//             </div>
//           )}
//         </div>

//         {/* Hidden canvas for QR processing */}
//         <canvas ref={canvasRef} className="hidden" />

//         {/* Control buttons */}
//         <div className="grid grid-cols-3 gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={toggleTorch}
//             className="flex items-center gap-1"
//           >
//             <Flashlight className={`h-4 w-4 ${torchEnabled ? 'text-yellow-500' : ''}`} />
//           </Button>

//           <Button
//             variant="outline"
//             size="sm"
//             onClick={switchCamera}
//             className="flex items-center gap-1"
//           >
//             <SwitchCamera className="h-4 w-4" />
//           </Button>

//           <Button
//             variant="outline"
//             size="sm"
//             onClick={resetScanner}
//             className="flex items-center gap-1"
//           >
//             <RotateCcw className="h-4 w-4" />
//           </Button>
//         </div>

//         {onClose && (
//           <Button variant="outline" onClick={onClose} className="w-full">
//             <X className="h-4 w-4 mr-2" />
//             Close Scanner
//           </Button>
//         )}

//         {/* Instructions */}
//         <div className="text-xs text-gray-500 text-center p-3 bg-gray-50 rounded-lg">
//           <p className="mb-1">📱 Hold your phone steady and ensure good lighting</p>
//           <p>🔍 The QR code should fit within the scanning frame</p>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }