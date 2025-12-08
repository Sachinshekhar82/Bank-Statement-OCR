
import React, { useState, useEffect, useRef } from 'react';
import { LockIcon, FaceIdIcon, DeleteIcon, CheckIcon, UploadIcon } from './icons';
import { verifyUserIdentity } from '../services/geminiService';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  
  // Face ID States
  const [hasFaceReference, setHasFaceReference] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showSetup, setShowSetup] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if user has already registered a face
    const storedFace = localStorage.getItem('faceAuthReference');
    if (storedFace) {
      setHasFaceReference(true);
    } else {
      // If no face registered, default to setup mode visually
      setShowSetup(true);
    }
  }, []);

  const handleNumClick = (num: number) => {
    if (pin.length < 4 && !isCameraActive) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    if (!isCameraActive) {
      setPin(prev => prev.slice(0, -1));
      setError(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setIsCameraActive(false);
      setCameraError("Camera access denied");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setStatusMessage('');
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0);
    // Get base64 without prefix
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  };

  const handleRegisterFace = async () => {
    setStatusMessage("Capturing...");
    const frame = captureFrame();
    if (frame) {
        localStorage.setItem('faceAuthReference', frame);
        setHasFaceReference(true);
        setShowSetup(false);
        stopCamera();
        setCameraError(null); 
    } else {
        setCameraError("Failed to capture image");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip prefix to get just base64 data
        const base64Data = result.split(',')[1];
        localStorage.setItem('faceAuthReference', base64Data);
        setHasFaceReference(true);
        setShowSetup(false);
        setCameraError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerifyFace = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setStatusMessage("Analyzing...");
    
    // Allow camera to settle for a moment if it just started
    setTimeout(async () => {
        const currentFrame = captureFrame();
        const referenceFrame = localStorage.getItem('faceAuthReference');

        if (currentFrame && referenceFrame) {
            try {
                const isMatch = await verifyUserIdentity(referenceFrame, currentFrame);
                if (isMatch) {
                    setStatusMessage("Verified!");
                    setTimeout(() => {
                        stopCamera();
                        onAuthenticated();
                    }, 500);
                } else {
                    setStatusMessage("Face not recognized");
                    setTimeout(() => {
                        setIsProcessing(false);
                        setStatusMessage(""); // Clear to allow retry
                    }, 2000);
                }
            } catch (e) {
                setStatusMessage("Error connecting to AI");
                setIsProcessing(false);
            }
        } else {
            setStatusMessage("Camera error");
            setIsProcessing(false);
        }
    }, 1000);
  };

  const handleFaceIdClick = () => {
    if (!hasFaceReference) {
        setShowSetup(true);
        startCamera();
    } else {
        startCamera();
        // Auto-verify after camera starts
        setTimeout(() => handleVerifyFace(), 1500);
    }
  };

  const resetFaceData = () => {
    localStorage.removeItem('faceAuthReference');
    setHasFaceReference(false);
    setShowSetup(true);
    if (!isCameraActive) startCamera();
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // PIN Logic
  useEffect(() => {
    if (pin.length === 4) {
      if (pin === '1234') {
        setTimeout(() => onAuthenticated(), 300);
      } else {
        setError(true);
        setTimeout(() => setPin(''), 500);
      }
    }
  }, [pin, onAuthenticated]);

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center space-y-8 animate-fade-in relative">
        
        {/* Reset Button (Hidden-ish) */}
        {hasFaceReference && !isCameraActive && (
             <button 
                onClick={resetFaceData}
                className="absolute top-0 right-0 text-xs text-gray-600 hover:text-red-400 transition-colors"
             >
                Reset Face ID
             </button>
        )}

        {/* Visualizer Area */}
        <div className="flex flex-col items-center space-y-4">
          <div className={`relative w-40 h-40 rounded-full bg-gray-800 shadow-2xl overflow-hidden flex items-center justify-center border-4 transition-all duration-300 ${isCameraActive ? 'border-blue-500 w-48 h-48' : 'border-gray-700'}`}>
             {isCameraActive ? (
                <div className="relative w-full h-full">
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted 
                    className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" 
                  />
                  {/* Overlays */}
                  {!showSetup && isProcessing && (
                      <div className="absolute inset-0 z-20 bg-blue-500/10">
                        <div className="absolute w-full h-1 bg-blue-400/80 shadow-[0_0_20px_rgba(59,130,246,1)] animate-scan"></div>
                      </div>
                  )}
                  {showSetup && (
                      <div className="absolute inset-0 border-dashed border-2 border-white/30 rounded-full z-10 pointer-events-none"></div>
                  )}
                </div>
             ) : (
                <LockIcon className={`w-12 h-12 ${error ? 'text-red-500' : 'text-blue-400'} transition-colors duration-300`} />
             )}
          </div>
          
          <div className="text-center h-16">
            <h2 className="text-2xl font-bold text-white transition-all duration-300">
                {isCameraActive 
                    ? (statusMessage || (showSetup ? 'Position Face' : 'Scanning...')) 
                    : (showSetup ? 'Setup Face Security' : 'Enter PIN')}
            </h2>
            <p className={`text-sm mt-1 transition-colors ${cameraError ? 'text-red-400 animate-pulse' : 'text-gray-500'}`}>
                {cameraError || (isCameraActive 
                    ? (showSetup ? 'Ensure good lighting' : 'Look at the camera') 
                    : (showSetup ? 'Register your face to login securely' : 'Use PIN 1234 or Face ID'))}
            </p>
          </div>
        </div>

        {/* CONTROLS */}
        
        {/* Setup Mode Controls (Camera Active) */}
        {showSetup && isCameraActive && (
            <div className="flex flex-col space-y-3 w-full max-w-[200px]">
                <button
                    onClick={handleRegisterFace}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg transition-all active:scale-95"
                >
                    Capture & Save
                </button>
                <button
                    onClick={() => {
                        stopCamera();
                        if (hasFaceReference) setShowSetup(false);
                    }}
                    className="text-gray-400 text-sm hover:text-white"
                >
                    Cancel
                </button>
            </div>
        )}

        {/* Login Mode Controls */}
        {!showSetup && !isCameraActive && (
            <>
                {/* PIN Indicators */}
                <div className="flex space-x-4 my-2">
                {[0, 1, 2, 3].map((i) => (
                    <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                        pin.length > i
                        ? error ? 'bg-red-500 border-red-500 scale-110' : 'bg-blue-500 border-blue-500 scale-110'
                        : 'border-gray-600 bg-transparent'
                    }`}
                    />
                ))}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                    key={num}
                    onClick={() => handleNumClick(num)}
                    className="w-16 h-16 rounded-full bg-gray-800 hover:bg-gray-700 text-white text-2xl font-medium transition-colors duration-200 flex items-center justify-center shadow-lg active:scale-95"
                    >
                    {num}
                    </button>
                ))}
                
                <button
                    onClick={handleFaceIdClick}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg bg-gray-800 text-blue-400 ring-1 ring-blue-500/50 hover:bg-gray-700`}
                    title="Login with Face ID"
                >
                    <FaceIdIcon className="w-8 h-8" />
                </button>
                
                <button
                    onClick={() => handleNumClick(0)}
                    className="w-16 h-16 rounded-full bg-gray-800 hover:bg-gray-700 text-white text-2xl font-medium transition-colors duration-200 flex items-center justify-center shadow-lg active:scale-95"
                >
                    0
                </button>
                
                <button
                    onClick={handleDelete}
                    className="w-16 h-16 rounded-full hover:bg-gray-800/50 text-gray-400 flex items-center justify-center transition-colors duration-200 active:scale-95"
                >
                    <DeleteIcon className="w-8 h-8" />
                </button>
                </div>
            </>
        )}
        
        {/* Verification Active Controls */}
        {!showSetup && isCameraActive && (
             <button
                onClick={stopCamera}
                className="mt-4 text-gray-400 hover:text-white underline"
             >
                Cancel / Use PIN
             </button>
        )}

        {/* Initial Setup Trigger (if no face data but not in camera mode yet) */}
        {showSetup && !isCameraActive && (
             <div className="flex flex-col space-y-4 w-full max-w-[240px]">
                 <button
                    onClick={startCamera}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95"
                >
                    <FaceIdIcon className="w-5 h-5" />
                    <span>Scan Face (Camera)</span>
                </button>
                
                <div className="relative w-full">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95 border border-gray-600"
                    >
                        <UploadIcon className="w-5 h-5" />
                        <span>Upload Photo</span>
                    </button>
                </div>

                <div className="flex justify-center pt-2">
                    <button 
                        onClick={() => setShowSetup(false)} 
                        className="text-sm text-gray-500 hover:text-white"
                    >
                        Skip for now
                    </button>
                </div>
             </div>
        )}

      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AuthScreen;
