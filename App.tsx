import React, { useEffect, useRef, useState } from 'react';
import { GameScene } from './components/GameScene';
import { HandTrackingService } from './services/handTracking';
import { HandData } from './types';
import { Loader } from 'lucide-react';

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handDataRef = useRef<HandData>({ x: 0, y: 0, isPinching: false, isPresent: false });
  
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    let handService: HandTrackingService | null = null;

    const init = async () => {
      if (!videoRef.current) return;

      try {
        handService = new HandTrackingService(videoRef.current, (data) => {
          handDataRef.current = data;
          setLoading(false);
        });
        await handService.start();
      } catch (err) {
        console.error("Camera init failed:", err);
        setPermissionError("Camera access denied or device not found. Please allow camera permissions to play.");
        setLoading(false);
      }
    };

    init();

    return () => {
      if (handService) handService.stop();
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-900 text-white font-sans overflow-hidden select-none">
      
      {/* 3D Game Layer */}
      <GameScene handRef={handDataRef} score={score} setScore={setScore} />

      {/* Hidden Video Input for MediaPipe */}
      <video 
        ref={videoRef} 
        className="fixed top-0 left-0 opacity-0 pointer-events-none w-1 h-1" 
        playsInline 
      />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-6 flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400 drop-shadow-sm">
              Hand-Gesture Clustering
            </h1>
            <p className="text-slate-300 mt-1 max-w-md bg-black/30 p-2 rounded backdrop-blur-sm">
              <span className="font-bold text-yellow-400">Pinch</span> (Index + Thumb) to grab shapes. 
              Drop them in the <span className="font-bold text-red-400">matching color zone</span>.
            </p>
          </div>
          
          <div className="bg-black/50 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl">
            <p className="text-sm text-slate-400 uppercase tracking-wider">Score</p>
            <p className="text-4xl font-mono font-bold text-white">{score}</p>
          </div>
        </div>

        {/* Camera Preview (Optional User Feedback) */}
        <div className="absolute bottom-6 left-6 pointer-events-auto">
          <div className="relative rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl w-48 h-36 bg-black">
             {/* We create a secondary video mirror here just for UI feedback, 
                 while the processing happens on the hidden one */}
             <HandFeedMirror sourceVideo={videoRef} />
             <div className="absolute bottom-0 w-full bg-black/60 text-center text-xs py-1 text-white">
                Input Feed
             </div>
          </div>
        </div>

      </div>

      {/* Loading / Error States */}
      {(loading || permissionError) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="text-center max-w-md p-6">
            {permissionError ? (
              <div className="text-red-400">
                <h2 className="text-2xl font-bold mb-2">Access Required</h2>
                <p>{permissionError}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Loader className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <h2 className="text-2xl font-bold">Initializing Vision...</h2>
                <p className="text-slate-400 mt-2">Please wave your hand in front of the camera</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Small component to mirror the stream to UI without affecting the processing stream
const HandFeedMirror: React.FC<{ sourceVideo: React.RefObject<HTMLVideoElement> }> = ({ sourceVideo }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    let animationFrame: number;
    const render = () => {
      if (sourceVideo.current && canvasRef.current && sourceVideo.current.readyState === 4) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
           // Draw mirrored
           ctx.save();
           ctx.scale(-1, 1);
           ctx.drawImage(sourceVideo.current, -canvasRef.current.width, 0, canvasRef.current.width, canvasRef.current.height);
           ctx.restore();
        }
      }
      animationFrame = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [sourceVideo]);

  return <canvas ref={canvasRef} width={320} height={240} className="w-full h-full object-cover" />;
};

export default App;
