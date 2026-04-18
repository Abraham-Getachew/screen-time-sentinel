import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  MessageSquare, 
  Save, 
  ShieldCheck, 
  XCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { MonitoredApp, AppInfo, PermissionStatus } from '../hooks/use-dumbphone';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SettingsPageProps {
  apps: MonitoredApp[];
  installedApps: AppInfo[];
  usageStats: Record<string, number>;
  foregroundAppId: string | null;
  phoneUri: string;
  smsUri: string;
  permissions: PermissionStatus;
  onToggleSelection: (app: AppInfo) => void;
  onUpdateLimit: (id: string, newLimit: number) => void;
  onUpdateUris: (phone: string, sms: string) => void;
  onBack: () => void;
  onRequestPermission?: (id: keyof PermissionStatus) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  apps,
  installedApps,
  usageStats,
  foregroundAppId,
  phoneUri,
  smsUri,
  permissions,
  onToggleSelection,
  onUpdateLimit,
  onUpdateUris,
  onBack,
  onRequestPermission
}) => {
  const [search, setSearch] = React.useState('');
  const [selectedPhoneUri, setSelectedPhoneUri] = React.useState(phoneUri);
  const [selectedSmsUri, setSelectedSmsUri] = React.useState(smsUri);
  const [explainingPermission, setExplainingPermission] = React.useState<keyof PermissionStatus | null>(null);

  const filteredApps = installedApps.filter(app => 
    app.name.toLowerCase().includes(search.toLowerCase())
  );

  const phoneCapableApps = installedApps.filter(app => app.phoneUri);
  const smsCapableApps = installedApps.filter(app => app.smsUri);

  const handleSaveIntents = () => {
    onUpdateUris(selectedPhoneUri, selectedSmsUri);
    toast.success("System Intents Updated", {
      description: "Default destinations saved.",
      duration: 1500
    });
  };

  const formatDisplayTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) {
      return `${h}hr:${m.toString().padStart(2, '0')}min`;
    }
    return `${m}min`;
  };

  const formatUsageTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const activeApp = apps.find(a => a.id === foregroundAppId);
  const activeUsage = foregroundAppId ? usageStats[foregroundAppId] || 0 : 0;
  const activeLimit = activeApp ? activeApp.timeLimit * 60 : 0;
  const activeRemaining = Math.max(0, activeLimit - activeUsage);

  const permissionDescriptions: Record<keyof PermissionStatus, { title: string, desc: string }> = {
    usageStats: {
      title: "Usage Statistics",
      desc: "Allows the app to see which other apps are currently in use. This is mandatory to track your daily time limits and trigger the lockout when the limit is exceeded."
    },
    overlay: {
      title: "Display Over Other Apps",
      desc: "Allows the app to show the lockout screen and time remaining timers over other apps. Without this, we cannot effectively block usage."
    },
    accessibility: {
      title: "Accessibility Service",
      desc: "Used to detect app launches and back button gestures to provide a seamless 'dumbphone' experience and prevent bypassing the lockout."
    },
    deviceAdmin: {
      title: "Device Administrator",
      desc: "Prevents the app from being uninstalled during a lockout period, ensuring you stick to your goals."
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tighter uppercase">Configuration</h1>
          <div className="w-10" />
        </div>

        {activeApp && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-black text-white rounded-2xl flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Live Tracking</p>
                <p className="text-sm font-bold">{activeApp.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Remaining</p>
              <p className="text-xl font-bold tabular-nums">{formatUsageTime(activeRemaining)}</p>
            </div>
          </motion.div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <Input 
            placeholder="Search applications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 bg-slate-50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-black"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-8 pb-20">
          {/* Permissions Section */}
          <section className="bg-slate-50 p-6 rounded-3xl space-y-4">
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Security & System</h2>
              <p className="text-xs text-slate-500">Verify mandatory device permissions.</p>
            </div>
            
            <div className="grid gap-3">
              {[
                { id: 'usageStats' as const, label: 'Usage Statistics' },
                { id: 'overlay' as const, label: 'Screen Overlay' },
                { id: 'accessibility' as const, label: 'Accessibility' },
                { id: 'deviceAdmin' as const, label: 'Device Admin' }
              ].map(perm => (
                <button 
                  key={perm.id} 
                  onClick={() => !permissions[perm.id] && setExplainingPermission(perm.id)}
                  className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-left active:scale-[0.98] transition-transform w-full"
                >
                  <span className="text-xs font-medium">{perm.label}</span>
                  <div className="flex items-center gap-2">
                    {permissions[perm.id] ? (
                      <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-emerald-600">
                        <ShieldCheck size={12} /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-red-500">
                        <AlertCircle size={12} /> Required
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* System Intents Section */}
          <section className="bg-slate-50 p-6 rounded-3xl space-y-6">
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Intent Setup</h2>
              <p className="text-xs text-slate-500">Select default apps for communication.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-2">
                  <Smartphone size={10} /> Default Phone App
                </Label>
                <Select value={selectedPhoneUri} onValueChange={setSelectedPhoneUri}>
                  <SelectTrigger className="bg-white border-slate-200 h-10 rounded-lg text-sm">
                    <SelectValue placeholder="Select phone app" />
                  </SelectTrigger>
                  <SelectContent>
                    {phoneCapableApps.map(app => (
                      <SelectItem key={app.id} value={app.phoneUri!}>
                        {app.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-2">
                  <MessageSquare size={10} /> Default SMS App
                </Label>
                <Select value={selectedSmsUri} onValueChange={setSelectedSmsUri}>
                  <SelectTrigger className="bg-white border-slate-200 h-10 rounded-lg text-sm">
                    <SelectValue placeholder="Select SMS app" />
                  </SelectTrigger>
                  <SelectContent>
                    {smsCapableApps.map(app => (
                      <SelectItem key={app.id} value={app.smsUri!}>
                        {app.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <button 
                onClick={handleSaveIntents}
                className="w-full h-12 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Save size={14} /> Save System Settings
              </button>
            </div>
          </section>

          {/* Apps List */}
          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4 px-1">App Monitoring</h2>
            <div className="space-y-4">
              {filteredApps.filter(app => !app.phoneUri && !app.smsUri).map((app) => {
                const monitored = apps.find(a => a.id === app.id);
                const usage = usageStats[app.id] || 0;
                
                return (
                  <div 
                    key={app.id}
                    className={`group flex flex-col gap-4 p-5 rounded-2xl border transition-all ${
                      monitored ? 'border-black bg-white shadow-md' : 'border-slate-100 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        onClick={() => onToggleSelection(app)}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold cursor-pointer transition-colors ${
                          monitored ? 'bg-black text-white' : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {app.name.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onToggleSelection(app)}>
                        <p className="font-bold truncate text-sm">{app.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{app.packageName}</p>
                      </div>

                      <div 
                        onClick={() => onToggleSelection(app)}
                        className="flex items-center justify-center cursor-pointer"
                      >
                        <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
                          monitored ? 'bg-black border-black scale-110 shadow-sm' : 'bg-white border-slate-200'
                        }`}>
                          {monitored && <CheckCircle2 size={16} className="text-white" />}
                        </div>
                      </div>
                    </div>

                    {monitored && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-2 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] uppercase font-bold text-slate-500">Daily Time Limit</Label>
                          <span className="text-sm font-black tabular-nums">
                            {formatDisplayTime(monitored.timeLimit)}
                          </span>
                        </div>
                        
                        <Slider
                          value={[monitored.timeLimit]}
                          min={1}
                          max={480}
                          step={5}
                          onValueChange={(vals) => onUpdateLimit(app.id, vals[0])}
                          className="py-2"
                        />
                        
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-bold text-slate-400">Usage Today</span>
                            <span className="text-xs font-bold text-black tabular-nums">
                              {Math.floor(usage / 60)}m used
                            </span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[9px] uppercase font-bold text-slate-400">Reset Status</span>
                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">Active</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Explanation Modal */}
      <Dialog 
        open={explainingPermission !== null} 
        onOpenChange={(open) => !open && setExplainingPermission(null)}
      >
        <DialogContent className="rounded-[2rem] max-w-[90vw] sm:max-w-[400px] border-none shadow-2xl">
          <DialogHeader className="space-y-4 pt-4">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldCheck className="text-black" size={24} />
            </div>
            <div className="text-center space-y-2">
              <DialogTitle className="text-xl font-bold uppercase tracking-tighter">
                {explainingPermission && permissionDescriptions[explainingPermission].title}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 leading-relaxed">
                {explainingPermission && permissionDescriptions[explainingPermission].desc}
              </DialogDescription>
            </div>
          </DialogHeader>
          
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3 my-2">
            <AlertCircle size={16} className="text-slate-400 mt-0.5" />
            <p className="text-[11px] text-slate-500 font-medium">
              This will open your Android System Settings. You must manually toggle the switch for this app.
            </p>
          </div>

          <DialogFooter className="flex flex-col gap-2 pt-4">
            <Button 
              className="w-full h-12 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
              onClick={() => {
                if (explainingPermission && onRequestPermission) {
                  onRequestPermission(explainingPermission);
                  setExplainingPermission(null);
                }
              }}
            >
              Grant Permission <ExternalLink size={14} className="ml-2" />
            </Button>
            <Button 
              variant="ghost" 
              className="w-full h-10 text-[10px] uppercase font-bold text-slate-400"
              onClick={() => setExplainingPermission(null)}
            >
              Maybe Later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer info */}
      <div className="p-6 text-center border-t border-slate-50">
        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
          Daily limits reset at midnight
        </p>
      </div>
    </div>
  );
};