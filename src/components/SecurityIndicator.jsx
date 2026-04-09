import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Wifi, WifiOff } from 'lucide-react';
import { useBank } from '../context/BankContext';

/**
 * SecurityIndicator — Real-time system health visualization.
 * Monitors the 'Security Brain' status via proxy heartbeat.
 */
export default function SecurityIndicator() {
  const { systemState } = useBank();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isLocked = systemState.status === 'LOCKED';

  return (
    <div className={`
      flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300
      ${isLocked 
        ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' 
        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
      }
    `}>
      <div className="relative flex items-center justify-center">
        {isLocked ? (
          <ShieldAlert size={14} className="animate-bounce" />
        ) : (
          <ShieldCheck size={14} />
        )}
        <span className={`
          absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-bg-page
          ${online ? 'bg-emerald-400' : 'bg-red-400'}
        `} />
      </div>
      
      <span className="hidden sm:inline">
        {isLocked ? 'SAFE MODE ACTIVE' : 'SECURE SYSTEM ACTIVE'}
      </span>
      <span className="sm:hidden">
        {isLocked ? 'LOCKED' : 'SECURE'}
      </span>

      <div className="flex items-center gap-1 opacity-60 ml-1 pl-1 border-l border-current/20">
        {online ? <Wifi size={12} /> : <WifiOff size={12} />}
      </div>
    </div>
  );
}
