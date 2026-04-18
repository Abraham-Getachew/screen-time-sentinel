import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';

export type DumbphoneState = 'SETUP' | 'HOME' | 'LOCKED' | 'SETTINGS';

export interface MonitoredApp {
  id: string;
  name: string;
  packageName: string;
  isMonitored: boolean;
  timeLimit: number; // in minutes
}

export interface AppInfo {
  id: string;
  name: string;
  packageName: string;
  phoneUri?: string;
  smsUri?: string;
}

export interface PermissionStatus {
  accessibility: boolean;
  usageStats: boolean;
  overlay: boolean;
  deviceAdmin: boolean;
}

// Mocked list of "installed" apps on the device
export const INSTALLED_APPS: AppInfo[] = [
  { id: 'app-1', name: 'TikTok', packageName: 'com.zhiliaoapp.musically' },
  { id: 'app-2', name: 'Instagram', packageName: 'com.instagram.android' },
  { id: 'app-3', name: 'YouTube', packageName: 'com.google.android.youtube' },
  { id: 'app-4', name: 'X (Twitter)', packageName: 'com.twitter.android' },
  { id: 'app-5', name: 'Facebook', packageName: 'com.facebook.katana' },
  { id: 'app-6', name: 'Reddit', packageName: 'com.reddit.frontpage' },
  { id: 'app-7', name: 'Snapchat', packageName: 'com.snapchat.android' },
  { id: 'app-8', name: 'WhatsApp', packageName: 'com.whatsapp', phoneUri: 'whatsapp://call', smsUri: 'whatsapp://send' },
  { id: 'app-9', name: 'Netflix', packageName: 'com.netflix.mediaclient' },
  { id: 'app-10', name: 'LinkedIn', packageName: 'com.linkedin.android' },
  { id: 'app-11', name: 'Spotify', packageName: 'com.spotify.music' },
  { id: 'app-12', name: 'Slack', packageName: 'com.Slack' },
  { id: 'app-system-phone', name: 'Phone (System)', packageName: 'com.android.server.telecom', phoneUri: 'tel:' },
  { id: 'app-system-sms', name: 'Messages (System)', packageName: 'com.android.messaging', smsUri: 'sms:' },
  { id: 'app-viber', name: 'Viber', packageName: 'com.viber.voip', phoneUri: 'viber://calls', smsUri: 'viber://chat' },
];

export function useDumbphone() {
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(() => {
    return localStorage.getItem('dumbphone_setup_complete') === 'true';
  });

  const [grantedPermissions, setGrantedPermissions] = useState<PermissionStatus>(() => {
    const stored = localStorage.getItem('dumbphone_permissions');
    return stored ? JSON.parse(stored) : {
      accessibility: false,
      usageStats: false,
      overlay: false,
      deviceAdmin: false
    };
  });

  const [strikeCount, setStrikeCount] = useState<number>(() => {
    return parseInt(localStorage.getItem('dumbphone_strike_count') || '0');
  });

  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(() => {
    const stored = localStorage.getItem('dumbphone_lockout_end_time');
    return stored ? parseInt(stored) : null;
  });

  const [isTestMode, setIsTestMode] = useState<boolean>(false);

  const [phoneUri, setPhoneUri] = useState<string>(() => {
    return localStorage.getItem('dumbphone_phone_uri') || 'tel:';
  });

  const [smsUri, setSmsUri] = useState<string>(() => {
    return localStorage.getItem('dumbphone_sms_uri') || 'sms:';
  });

  const [monitoredApps, setMonitoredApps] = useState<MonitoredApp[]>(() => {
    const stored = localStorage.getItem('dumbphone_monitored_apps');
    return stored ? JSON.parse(stored) : [];
  });

  // Tracking usage in seconds
  const [usageStats, setUsageStats] = useState<Record<string, number>>(() => {
    const stored = localStorage.getItem('dumbphone_usage_stats');
    return stored ? JSON.parse(stored) : {};
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [foregroundAppId, setForegroundAppId] = useState<string | null>(null);
  
  const [alertedApps, setAlertedApps] = useState<Record<string, boolean>>(() => {
    const stored = localStorage.getItem('dumbphone_alerted_apps');
    return stored ? JSON.parse(stored) : {};
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- BRAIN: NATIVE PERMISSION LOGIC ---
  
  const checkPermissions = useCallback(async () => {
    // In a production app, we would use a Capacitor plugin to check these.
    // For this implementation, we simulate the check but tie it to the App's lifecycle.
    const info = await Device.getInfo();
    const isAndroid = info.platform === 'android';
    
    if (isAndroid) {
      // Simulate checking actual system status
      // In reality: const { status } = await PermissionsPlugin.checkUsageStats();
      console.log('Checking native permissions for Android...');
    }

    // We still persist the state, but we provide a way to 'refresh' it
    const stored = localStorage.getItem('dumbphone_permissions');
    if (stored) {
      setGrantedPermissions(JSON.parse(stored));
    }
  }, []);

  const requestPermission = useCallback(async (id: keyof PermissionStatus) => {
    const info = await Device.getInfo();
    const isAndroid = info.platform === 'android';

    if (isAndroid) {
      // Logic for triggering the specific Android Intent
      let intentUri = '';
      switch (id) {
        case 'usageStats':
          intentUri = 'package:com.android.settings.action.USAGE_ACCESS_SETTINGS';
          break;
        case 'overlay':
          intentUri = 'package:com.android.settings.action.MANAGE_OVERLAY_PERMISSION';
          break;
        case 'accessibility':
          intentUri = 'package:com.android.settings.action.ACCESSIBILITY_SETTINGS';
          break;
        case 'deviceAdmin':
          intentUri = 'package:com.android.settings.action.DEVICE_ADMIN_SETTINGS';
          break;
      }

      if (intentUri) {
        // This is where we'd call a custom plugin or App.openUrl
        // For Android, standard approach is an intent.
        toast.info(`Opening ${id} settings...`);
        
        // Simulation of the user granting permission after returning
        // In a real app, checkPermissions() would be called on foreground return.
        setTimeout(() => {
          setGrantedPermissions(prev => {
            const updated = { ...prev, [id]: true };
            localStorage.setItem('dumbphone_permissions', JSON.stringify(updated));
            return updated;
          });
        }, 3000); 
      }
    } else {
      // Web/Other: Just toggle for demo
      setGrantedPermissions(prev => {
        const updated = { ...prev, [id]: !prev[id] };
        localStorage.setItem('dumbphone_permissions', JSON.stringify(updated));
        return updated;
      });
      toast.success(`${id} permission updated.`);
    }
  }, []);

  // Listen for App State changes (Foreground/Background)
  useEffect(() => {
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        console.log('App returned to foreground, checking permissions...');
        checkPermissions();
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [checkPermissions]);

  // Initial check
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const currentView = useMemo<DumbphoneState>(() => {
    if (!isSetupComplete) return 'SETUP';
    if (lockoutEndTime && lockoutEndTime > Date.now()) return 'LOCKED';
    if (isSettingsOpen) return 'SETTINGS';
    return 'HOME';
  }, [isSetupComplete, lockoutEndTime, isSettingsOpen]);

  // Update Clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const completeSetup = useCallback((permissions: PermissionStatus) => {
    setIsSetupComplete(true);
    setGrantedPermissions(permissions);
    localStorage.setItem('dumbphone_setup_complete', 'true');
    localStorage.setItem('dumbphone_permissions', JSON.stringify(permissions));
  }, []);

  const triggerViolation = useCallback(() => {
    const minutes = 3 * Math.pow(2, strikeCount);
    const duration = minutes * 60 * 1000;
    
    const nextStrike = strikeCount + 1;
    setStrikeCount(nextStrike);
    localStorage.setItem('dumbphone_strike_count', nextStrike.toString());
    
    const endTime = Date.now() + duration;
    setLockoutEndTime(endTime);
    localStorage.setItem('dumbphone_lockout_end_time', endTime.toString());
    
    setForegroundAppId(null);
  }, [strikeCount]);

  const clearTimerOnly = useCallback(() => {
    setLockoutEndTime(null);
    localStorage.removeItem('dumbphone_lockout_end_time');
  }, []);

  const resetStrikes = useCallback(() => {
    setStrikeCount(0);
    localStorage.setItem('dumbphone_strike_count', '0');
  }, []);

  const updateAppUris = useCallback((phone: string, sms: string) => {
    setPhoneUri(phone);
    setSmsUri(sms);
    localStorage.setItem('dumbphone_phone_uri', phone);
    localStorage.setItem('dumbphone_sms_uri', sms);
  }, []);

  const toggleAppSelection = useCallback((app: AppInfo) => {
    setMonitoredApps(prev => {
      const isAlreadyMonitored = prev.find(a => a.id === app.id);
      let newApps;
      if (isAlreadyMonitored) {
        newApps = prev.filter(a => a.id !== app.id);
      } else {
        newApps = [...prev, { 
          id: app.id, 
          name: app.name, 
          packageName: app.packageName, 
          isMonitored: true, 
          timeLimit: 5 
        }];
      }
      localStorage.setItem('dumbphone_monitored_apps', JSON.stringify(newApps));
      return newApps;
    });
  }, []);

  const updateAppTimeLimit = useCallback((id: string, newLimit: number) => {
    setMonitoredApps(prev => {
      const newApps = prev.map(app => app.id === id ? { ...app, timeLimit: Math.max(1, newLimit) } : app);
      localStorage.setItem('dumbphone_monitored_apps', JSON.stringify(newApps));
      return newApps;
    });
  }, []);

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  const alertedAppsRef = useRef(alertedApps);
  useEffect(() => {
    alertedAppsRef.current = alertedApps;
  }, [alertedApps]);

  useEffect(() => {
    if (currentView === 'LOCKED') return;

    const interval = setInterval(() => {
      if (foregroundAppId) {
        const monitoredApp = monitoredApps.find(a => a.id === foregroundAppId && a.isMonitored);
        
        if (monitoredApp) {
          setUsageStats(prev => {
            const currentUsage = (prev[foregroundAppId] || 0) + 1;
            const newStats = { ...prev, [foregroundAppId]: currentUsage };
            localStorage.setItem('dumbphone_usage_stats', JSON.stringify(newStats));
            
            const limitInSeconds = monitoredApp.timeLimit * 60;
            const remaining = limitInSeconds - currentUsage;

            if (remaining === 120 && !alertedAppsRef.current[foregroundAppId]) {
              toast.warning(`2 Minutes Remaining`, {
                description: `You have 2 minutes left for ${monitoredApp.name} today.`,
                duration: 2000,
              });
              setAlertedApps(a => {
                const updated = { ...a, [foregroundAppId]: true };
                localStorage.setItem('dumbphone_alerted_apps', JSON.stringify(updated));
                return updated;
              });
            }

            if (remaining <= 0) {
              triggerViolation();
              toast.error(`Time Limit Reached`, {
                description: `${monitoredApp.name} daily limit exceeded. Lockout engaged.`,
              });
            }

            return newStats;
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [foregroundAppId, monitoredApps, triggerViolation, currentView]);

  useEffect(() => {
    if (!lockoutEndTime) return;
    const interval = setInterval(() => {
      if (Date.now() >= lockoutEndTime) {
        setLockoutEndTime(null);
        localStorage.removeItem('dumbphone_lockout_end_time');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutEndTime]);

  return {
    currentView,
    strikeCount,
    lockoutEndTime,
    isTestMode,
    isSetupComplete,
    phoneUri,
    smsUri,
    monitoredApps,
    usageStats,
    foregroundAppId,
    isSettingsOpen,
    currentTime,
    grantedPermissions,
    completeSetup,
    triggerViolation,
    clearTimerOnly,
    resetStrikes,
    updateAppUris,
    toggleAppSelection,
    updateAppTimeLimit,
    openSettings,
    closeSettings,
    setForegroundAppId,
    requestPermission,
    refreshPermissions: checkPermissions,
    installedApps: INSTALLED_APPS
  };
}