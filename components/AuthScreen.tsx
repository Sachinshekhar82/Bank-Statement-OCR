
import React, { useState, useEffect, useRef } from 'react';
import { LockIcon, FaceIdIcon, DeleteIcon } from './icons';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [isFaceScanning, setIsFaceScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleNumClick = (num: number) => {
    if (pin.length < 4 && !isFaceScanning) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    if (!isFaceScanning) {
      setPin(prev => prev.slice(0, -1));
      setError(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsFaceScanning(false);
  };

  const handleFaceAuth = async () => {
    setCameraError(null);
    setIsFaceScanning(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Simulate verification analysis time
      setTimeout(() => {
        stopCamera();
        onAuthenticated();
      }, 2500);
      
    } catch (err) {
      console.error("Camera error:", err);
      setIsFaceScanning(false);
      setCameraError("Camera access required");
      setTimeout(() => setCameraError(null), 3000);
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (pin.length === 4) {
      // Mock validation - accept '1234' for demo
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
      <div className="w-full max-w-sm flex flex-col items-center space-y-8 animate-fade-in">
        
        {/* Auth Visualizer Area */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-32 h-32 rounded-full bg-gray-800 shadow-2xl overflow-hidden flex items-center justify-center border-4 border-gray-700 transition-all duration-300">
             {isFaceScanning ? (
                <div className="relative w-full h-full">
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    muted 
                    className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" 
                  />
                  <div className="absolute inset-0 border-4 border-blue-500/50 rounded-full z-10"></div>
                  {/* Scanning Overlay */}
                  <div className="absolute inset-0 z-20 overflow-hidden rounded-full">
                      <div className="absolute w-full h-1 bg-blue-400/80 shadow-[0_0_20px_rgba(59,130,246,1)] animate-scan"></div>
                  </div>
                </div>
             ) : (
                <LockIcon className={`w-12 h-12 ${error ? 'text-red-500' : 'text-blue-400'} transition-colors duration-300`} />
             )}
          </div>
          
          <div className="text-center h-16">
            <h2 className="text-2xl font-bold text-white transition-all duration-300">
                {isFaceScanning ? 'Verifying Face...' : 'Enter PIN'}
            </h2>
            {cameraError ? (
                <p className="text-red-400 text-sm mt-1 animate-pulse">{cameraError}</p>
            ) : (
                <p className="text-gray-500 text-sm mt-1">
                    {isFaceScanning ? 'Look directly at the camera' : 'Use PIN 1234 for demo'}
                </p>
            )}
          </div>
        </div>

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
              disabled={isFaceScanning}
              className="w-16 h-16 rounded-full bg-gray-800 hover:bg-gray-700 text-white text-2xl font-medium transition-colors duration-200 flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {num}
            </button>
          ))}
          
          <button
            onClick={handleFaceAuth}
            disabled={isFaceScanning}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-lg ${
                isFaceScanning 
                    ? 'bg-blue-600/20 ring-2 ring-blue-500 text-blue-400' 
                    : 'hover:bg-gray-800/50 text-blue-400'
            }`}
            title="Use Face ID"
          >
            <FaceIdIcon className="w-8 h-8" />
          </button>
          
          <button
            onClick={() => handleNumClick(0)}
            disabled={isFaceScanning}
            className="w-16 h-16 rounded-full bg-gray-800 hover:bg-gray-700 text-white text-2xl font-medium transition-colors duration-200 flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            0
          </button>
          
          <button
            onClick={handleDelete}
            disabled={isFaceScanning}
            className="w-16 h-16 rounded-full hover:bg-gray-800/50 text-gray-400 flex items-center justify-center transition-colors duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DeleteIcon className="w-8 h-8" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AuthScreen;
