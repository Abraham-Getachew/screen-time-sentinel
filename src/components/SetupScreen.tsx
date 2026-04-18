import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ShieldAlert, Accessibility, Activity, Smartphone, ArrowRight, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { PermissionStatus } from '../hooks/use-dumbphone';

interface SetupScreenProps {
  onComplete: (permissions: PermissionStatus) => void;
}

const STEPS = [
  {
    id: 'usage_stats',
    title: 'Usage Statistics',
    description: 'Tracks your screen time across apps to enforce daily limits.',
    icon: Activity,
    permission: 'PACKAGE_USAGE_STATS'
  },
  {
    id: 'overlay',
    title: 'Screen Overlay',
    description: 'Allows the lockout screen to display over other applications.',
    icon: Layers,
    permission: 'SYSTEM_ALERT_WINDOW'
  },
  {
    id: 'accessibility',
    title: 'Accessibility Service',
    description: 'Required to monitor window states and prevent unauthorized app usage.',
    icon: Accessibility,
    permission: 'BIND_ACCESSIBILITY_SERVICE'
  },
  {
    id: 'device_admin',
    title: 'Device Administrator',
    description: 'Prevents uninstallation during an active lockout period.',
    icon: ShieldAlert,
    permission: 'BIND_DEVICE_ADMIN'
  }
];

export function SetupScreen({ onComplete }: SetupScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [granted, setGranted] = useState<Record<string, boolean>>({});

  const handleGrant = (id: string) => {
    setGranted(prev => ({ ...prev, [id]: true }));
    toast.success(`Permission granted`, {
      description: id.replace('_', ' ').toUpperCase(),
      duration: 1000
    });
    
    if (currentStep < STEPS.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 200);
    }
  };

  const allGranted = STEPS.every(step => granted[step.id]);

  const handleFinish = () => {
    onComplete({
      accessibility: !!granted.accessibility,
      deviceAdmin: !!granted.device_admin,
      usageStats: !!granted.usage_stats,
      overlay: !!granted.overlay
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-2xl bg-slate-900 shadow-xl">
              <Smartphone className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Setup</h1>
          <p className="text-slate-500">Configure core system permissions to enable the Dumbphone Kiosk.</p>
        </div>

        <div className="space-y-4">
          {STEPS.map((step, index) => {
            const isCurrent = index === currentStep;
            const isGranted = granted[step.id];
            const Icon = step.icon;

            return (
              <Card 
                key={step.id} 
                className={`p-4 transition-all duration-300 border-2 ${
                  isCurrent ? 'border-slate-900 ring-4 ring-slate-100' : 'border-transparent opacity-60'
                } ${isGranted ? 'bg-slate-50 border-emerald-200 opacity-100 shadow-sm' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${isGranted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {isGranted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{step.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {step.description}
                    </p>
                    {isCurrent && !isGranted && (
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="mt-3 bg-slate-900 hover:bg-slate-800 h-8 text-[10px] font-bold uppercase tracking-wider"
                        onClick={() => handleGrant(step.id)}
                      >
                        Grant Permission
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <AnimatePresence>
          {allGranted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="pt-4"
            >
              <Button 
                className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 shadow-lg font-bold uppercase tracking-widest"
                onClick={handleFinish}
              >
                Launch Kiosk <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}