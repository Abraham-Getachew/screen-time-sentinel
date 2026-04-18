import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Phone, MessageSquare, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface LockoutOverlayProps {
  endTime: number;
  strikeCount: number;
  onClearTimer: () => void;
  onResetStrikes: () => void;
  phoneUri: string;
  smsUri: string;
}

export function LockoutOverlay({ 
  endTime, 
  strikeCount, 
  onClearTimer, 
  onResetStrikes,
  phoneUri,
  smsUri
}: LockoutOverlayProps) {
  const [timeLeft, setTimeLeft] = useState<number>(endTime - Date.now());
  const [upperTaps, setUpperTaps] = useState<number[]>([]);
  const [lowerTaps, setLowerTaps] = useState<number[]>([]);
  
  const upperTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lowerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const handleUpperTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    setUpperTaps(prev => {
      const lastTap = prev[prev.length - 1];
      if (lastTap && now - lastTap > 800) return [now];
      const newTaps = [...prev, now];
      if (newTaps.length === 10) {
        onClearTimer();
        toast.success("Timer Reset", { description: "The current lockout has been cleared." });
        return [];
      }
      return newTaps;
    });

    if (upperTimeoutRef.current) clearTimeout(upperTimeoutRef.current);
    upperTimeoutRef.current = setTimeout(() => setUpperTaps([]), 1000);
  };

  const handleLowerTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    setLowerTaps(prev => {
      const lastTap = prev[prev.length - 1];
      if (lastTap && now - lastTap > 800) return [now];
      const newTaps = [...prev, now];
      if (newTaps.length === 10) {
        onResetStrikes();
        toast.success("Strikes Reset", { description: "The strike count has been reset to zero." });
        return [];
      }
      return newTaps;
    });

    if (lowerTimeoutRef.current) clearTimeout(lowerTimeoutRef.current);
    lowerTimeoutRef.current = setTimeout(() => setLowerTaps([]), 1000);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return [
      hours > 0 ? hours.toString().padStart(2, '0') : null,
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  const strikeText = strikeCount === 1 ? "First Violation" : `Strike ${strikeCount} Active`;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] bg-black text-white flex flex-col items-center justify-between p-10 overflow-hidden"
    >
      {/* Hidden Tap Zones */}
      <div className="absolute inset-0 z-0 flex flex-col">
        <div 
          className="h-1/2 w-full flex items-center justify-center relative cursor-default"
          onClick={handleUpperTap}
        >
          {upperTaps.length > 0 && (
            <div className="absolute top-4 right-4 flex gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1 h-1 rounded-full ${i < upperTaps.length ? 'bg-white/20' : 'bg-transparent'}`} 
                />
              ))}
            </div>
          )}
        </div>
        <div 
          className="h-1/2 w-full flex items-center justify-center relative cursor-default"
          onClick={handleLowerTap}
        >
          {lowerTaps.length > 0 && (
            <div className="absolute bottom-4 right-4 flex gap-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1 h-1 rounded-full ${i < lowerTaps.length ? 'bg-white/20' : 'bg-transparent'}`} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="absolute inset-0 border-[12px] border-red-950/20 pointer-events-none z-10" />
      
      {/* Header */}
      <div className="w-full text-center space-y-4 relative mt-12 z-20 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, -1, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex justify-center"
        >
          <Lock className="w-16 h-16 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
        </motion.div>
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight uppercase text-red-500">System Lockout</h1>
          <p className="text-white/40 text-sm font-medium tracking-widest uppercase">{strikeText}</p>
        </div>
      </div>

      {/* Main Countdown */}
      <div className="flex flex-col items-center justify-center z-20 pointer-events-none">
        <div className="text-7xl font-mono tracking-tight font-black tabular-nums">
          {formatTime(timeLeft)}
        </div>
        <p className="text-[10px] text-white/10 uppercase tracking-[0.4em] mt-4">
          Time Remaining
        </p>
      </div>

      {/* Safety Whitelist */}
      <div className="w-full max-w-sm space-y-8 mb-12 z-20">
        <div className="grid grid-cols-2 gap-6">
          <Button 
            variant="outline" 
            className="h-20 rounded-3xl border-white/20 bg-white/5 hover:bg-white/10 flex flex-col gap-1 group"
            onClick={() => window.location.href = phoneUri}
          >
            <Phone className="w-6 h-6 group-hover:text-emerald-500 transition-colors" />
            <span className="text-[10px] uppercase font-bold tracking-widest">Phone</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 rounded-3xl border-white/20 bg-white/5 hover:bg-white/10 flex flex-col gap-1 group"
            onClick={() => window.location.href = smsUri}
          >
            <MessageSquare className="w-6 h-6 group-hover:text-blue-500 transition-colors" />
            <span className="text-[10px] uppercase font-bold tracking-widest">SMS</span>
          </Button>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="text-xs text-red-100/60 leading-relaxed">
            <span className="text-red-400 font-bold uppercase block mb-1">Kiosk Mode Active</span>
            Home and Recents buttons are disabled. Custom tap sequences required for manual bypass.
          </div>
        </div>
      </div>
    </motion.div>
  );
}