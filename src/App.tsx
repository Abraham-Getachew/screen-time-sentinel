import { useEffect, useCallback } from 'react';
import { useDumbphone } from './hooks/use-dumbphone';
import { SetupScreen } from './components/SetupScreen';
import { HomeDashboard } from './components/HomeDashboard';
import { LockoutOverlay } from './components/LockoutOverlay';
import { SettingsPage } from './components/SettingsPage';
import { Toaster } from '@/components/ui/sonner';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const { 
    currentView, 
    strikeCount, 
    lockoutEndTime, 
    phoneUri,
    smsUri,
    monitoredApps,
    usageStats,
    foregroundAppId,
    installedApps,
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
    requestPermission
  } = useDumbphone();

  const handlePopState = useCallback((event: PopStateEvent) => {
    if (currentView === 'LOCKED') {
      window.history.pushState({ view: 'locked' }, '', '');
    } else if (currentView === 'SETTINGS') {
      closeSettings();
      window.history.pushState({ view: 'home' }, '', '');
    } else {
      window.history.pushState({ view: 'home' }, '', '');
    }
  }, [currentView, closeSettings]);

  useEffect(() => {
    window.history.pushState({ view: currentView.toLowerCase() }, '', '');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handlePopState, currentView]);

  useEffect(() => {
    const currentState = window.history.state;
    if (!currentState || currentState.view !== currentView.toLowerCase()) {
      window.history.pushState({ view: currentView.toLowerCase() }, '', '');
    }
  }, [currentView]);

  return (
    <div className="min-h-screen bg-background font-sans antialiased selection:bg-slate-200 selection:text-slate-900 overflow-hidden">
      <AnimatePresence mode="wait">
        {currentView === 'SETUP' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
          >
            <SetupScreen onComplete={completeSetup} />
          </motion.div>
        )}

        {currentView === 'HOME' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <HomeDashboard 
              strikeCount={strikeCount} 
              onViolation={triggerViolation}
              phoneUri={phoneUri}
              smsUri={smsUri}
              foregroundAppId={foregroundAppId}
              onSetForeground={setForegroundAppId}
              currentTime={currentTime}
              onOpenSettings={openSettings}
              usageStats={usageStats}
              monitoredApps={monitoredApps}
            />
          </motion.div>
        )}

        {currentView === 'SETTINGS' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <SettingsPage 
              apps={monitoredApps}
              installedApps={installedApps}
              usageStats={usageStats}
              foregroundAppId={foregroundAppId}
              phoneUri={phoneUri}
              smsUri={smsUri}
              permissions={grantedPermissions}
              onToggleSelection={toggleAppSelection}
              onUpdateLimit={updateAppTimeLimit}
              onUpdateUris={updateAppUris}
              onBack={closeSettings}
              onRequestPermission={requestPermission}
            />
          </motion.div>
        )}

        {currentView === 'LOCKED' && lockoutEndTime && (
          <motion.div
            key="locked"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <LockoutOverlay 
              endTime={lockoutEndTime} 
              strikeCount={strikeCount}
              onClearTimer={clearTimerOnly}
              onResetStrikes={resetStrikes}
              phoneUri={phoneUri}
              smsUri={smsUri}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <Toaster position="top-center" expand={false} richColors />
    </div>
  );
}

export default App;