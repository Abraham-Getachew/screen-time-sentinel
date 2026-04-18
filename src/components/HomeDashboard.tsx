import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Phone, MessageSquare, AlertTriangle, ShieldCheck, Clock, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { INSTALLED_APPS, MonitoredApp } from '../hooks/use-dumbphone';

interface HomeDashboardProps {
  strikeCount: number;
  onViolation: () => void;
  phoneUri: string;
  smsUri: string;
  foregroundAppId: string | null;
  onSetForeground: (id: string | null) => void;
  currentTime: Date;
  onOpenSettings: () => void;
  usageStats: Record<string, number>;
  monitoredApps: MonitoredApp[];
}

export function HomeDashboard({ 
  strikeCount, 
  onViolation, 
  phoneUri,
  smsUri,
  foregroundAppId,
  onSetForeground,
  currentTime,
  onOpenSettings,
  usageStats,
  monitoredApps
}: HomeDashboardProps) {
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleAppLaunch = (appName: string, intent: string) => {
    toast(`Launching ${appName}...`, {
      description: `Targeting: ${intent}`,
      icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />
    });
    window.location.href = intent;
  };

  const handleNonWhitelistedApp = () => {
    toast.error("Blocked Access", {
      description: "This application is not whitelisted. Strike registered.",
    });
    onViolation();
  };

  const startLongPress = () => {
    pressTimer.current = setTimeout(() => {
      onOpenSettings();
      toast.success("Settings Unlocked", {
        description: "Configuration menu is now visible.",
        duration: 1500
      });
    }, 1000);
  };

  const cancelLongPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const formatRemainingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const activeApp = monitoredApps.find(a => a.id === foregroundAppId);
  const activeUsage = foregroundAppId ? usageStats[foregroundAppId] || 0 : 0;
  const activeLimit = activeApp ? activeApp.timeLimit * 60 : 0;
  const activeRemaining = Math.max(0, activeLimit - activeUsage);

  return (
    <div 
      className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-between relative select-none"
      style={{ 
        backgroundImage: 'url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop)',
        backgroundSize: 'cover', backgroundPosition: 'center'
      }}
    >
      {/* Settings Button - Persistent Always-Accessible UI */}
      <div className="absolute top-10 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white/80 hover:text-white transition-all shadow-lg"
        >
          <Settings size={14} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Manage Limits</span>
        </motion.button>
      </div>

      {/* Header Info - with Long Press for Settings */}
      <motion.div 
        className="w-full max-w-sm mt-24 text-center cursor-pointer active:scale-95 transition-transform"
        onPointerDown={startLongPress}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        whileTap={{ scale: 0.98 }}
      >
        <h2 className="text-6xl font-extralight tracking-tighter mb-2">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </h2>
        <p className="text-white/40 text-xs font-bold uppercase tracking-[0.3em]">
          {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
        <p className="mt-4 text-[9px] text-white/20 uppercase tracking-widest animate-pulse">
          Hold time for secret menu
        </p>
      </motion.div>

      {/* Remaining Time Display */}
      {activeApp && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 px-8 py-4 rounded-3xl text-center"
        >
          <div className="flex items-center gap-2 justify-center mb-1 text-white/60">
            <Clock size={12} />
            <span className="text-[10px] uppercase font-bold tracking-widest">Remaining for {activeApp.name}</span>
          </div>
          <div className="text-4xl font-mono font-black tracking-tighter tabular-nums">
            {formatRemainingTime(activeRemaining)}
          </div>
        </motion.div>
      )}

      {/* App Grid */}
      <div className="grid grid-cols-2 gap-8 w-full max-w-xs">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleAppLaunch('Phone', phoneUri)}
          className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10"
        >
          <div className="p-4 rounded-full bg-white/10">
            <Phone className="w-8 h-8" />
          </div>
          <span className="text-sm font-medium tracking-wide">Phone</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleAppLaunch('SMS', smsUri)}
          className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10"
        >
          <div className="p-4 rounded-full bg-white/10">
            <MessageSquare className="w-8 h-8" />
          </div>
          <span className="text-sm font-medium tracking-wide">Messages</span>
        </motion.button>
      </div>

      {/* Active App Indicator */}
      {foregroundAppId && !activeApp && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xs bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-tight">{INSTALLED_APPS.find(a => a.id === foregroundAppId)?.name} Active</span>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 hover:bg-white/5"
            onClick={() => onSetForeground(null)}
          >
            EXIT APP
          </Button>
        </motion.div>
      )}

      {/* Strike Indicator */}
      <div className="w-full max-w-xs space-y-4 mb-12">
        <Card className="bg-white/5 border-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/60 font-medium uppercase tracking-wider">Strike System</span>
            <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-white/80">
              STRIKE {strikeCount}
            </span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div 
                key={i} 
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= strikeCount ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-white/10'
                }`} 
              />
            ))}
          </div>
        </Card>

        <Button 
          variant="destructive" 
          className="w-full h-14 rounded-2xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-500 font-bold"
          onClick={handleNonWhitelistedApp}
        >
          <AlertTriangle className="mr-2 w-5 h-5" /> Block Unauthorized App
        </Button>
      </div>
    </div>
  );
}