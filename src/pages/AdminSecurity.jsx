import { useState, useEffect } from "react";
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Terminal, 
  Activity, Clock, RefreshCw, ChevronRight, Search 
} from "lucide-react";
import { apiClient } from "../lib/apiClient";
import PageSkeleton from "../components/PageSkeleton";
import usePageLoad from "../hooks/usePageLoad";

export default function AdminSecurity() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ critical: 0, high: 0, healthy: true });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loaded = usePageLoad();

  const fetchEvents = async () => {
    setRefreshing(true);
    try {
      const data = await apiClient.get("/admin/security/events");
      setEvents(data.events || []);
      setStats({
        critical: data.critical_count || 0,
        high: (data.events || []).filter(e => e.severity === 'HIGH').length,
        healthy: data.critical_count === 0
      });
    } catch (err) {
      console.error("Failed to fetch security events:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  if (!loaded || loading) return <PageSkeleton rows={5} />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Terminal size={14} className="text-accent" />
            <span className="text-accent text-xs font-bold uppercase tracking-widest">Security Operations Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-main">Forensic Surveillance</h1>
          <p className="text-text-muted text-sm mt-1">Real-time monitoring of system integrity and anomaly alerts.</p>
        </div>
        <button 
          onClick={fetchEvents}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 bg-bg-card border-2 border-primary px-4 py-2.5 rounded-xl font-bold text-sm hover:translate-x-1 hover:-translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0 active:translate-y-0 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Syncing..." : "Refresh Feed"}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatusCard 
          icon={ShieldCheck} 
          label="System Status" 
          value={stats.healthy ? "HEALTHY" : "COMPROMISED"} 
          color={stats.healthy ? "text-success" : "text-danger"}
          bg={stats.healthy ? "bg-success/10 border-success/30" : "bg-danger/10 border-danger/30"}
        />
        <StatusCard 
          icon={ShieldAlert} 
          label="Critical Threats" 
          value={stats.critical} 
          color="text-danger"
          bg="bg-bg-card border-danger/20"
        />
        <StatusCard 
          icon={AlertTriangle} 
          label="Risk Alerts" 
          value={stats.high} 
          color="text-warning"
          bg="bg-bg-card border-warning/20"
        />
      </div>

      {/* Main Content */}
      <div className="bg-bg-card border-2 border-primary rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="border-b-2 border-primary p-4 bg-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-accent" />
            <h2 className="font-black text-text-main text-sm uppercase tracking-wider">Forensic Event Log</h2>
          </div>
          <div className="flex items-center gap-2 bg-bg-page border border-primary px-3 py-1.5 rounded-lg">
            <Search size={14} className="text-text-muted" />
            <input type="text" placeholder="Filter events..." className="bg-transparent border-none text-xs focus:outline-none text-text-main" />
          </div>
        </div>

        <div className="divide-y-2 divide-primary/10 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-bg-page/50 text-[10px] uppercase font-bold text-text-muted">
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Event Type</th>
                <th className="px-6 py-4">Forensic Signature</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {events.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-text-muted text-sm italic">
                    No security events detected in the current lookback window.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className={`p-4 sm:p-6 rounded-2xl border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${bg} transition-all`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-white p-2 rounded-lg border border-primary">
          <Icon size={18} className={color} />
        </div>
        <span className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl sm:text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function EventRow({ event }) {
  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-danger text-white border-danger';
      case 'HIGH': return 'bg-warning text-primary border-warning';
      default: return 'bg-success/20 text-success border-success/30';
    }
  };

  return (
    <tr className="hover:bg-primary/5 transition-colors text-sm">
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded-md text-[9px] font-black border uppercase ${getSeverityColor(event.severity)}`}>
          {event.severity}
        </span>
      </td>
      <td className="px-6 py-4 font-bold text-text-main uppercase tracking-tighter text-xs">
        {event.event_type.replace(/_/g, ' ')}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-text-muted leading-none">ID: {event.id.slice(0, 8)}...</span>
          <span className="text-xs text-text-main truncate max-w-[200px] mt-1">
            {event.metadata?.reason || event.metadata?.path || "System anomaly detected"}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-text-muted">
          <Clock size={12} />
          <span className="text-xs font-medium">{new Date(event.created_at).toLocaleTimeString()}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-primary transition-all">
          <ChevronRight size={16} className="text-text-muted" />
        </button>
      </td>
    </tr>
  );
}
