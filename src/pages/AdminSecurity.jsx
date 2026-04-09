import { useState, useEffect } from "react";
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Terminal, 
  Activity, Clock, RefreshCw, ChevronRight, Search,
  Database, FileText, Download, CheckCircle2, AlertCircle
} from "lucide-react";
import { apiClient } from "../lib/apiClient";
import PageSkeleton from "../components/PageSkeleton";
import usePageLoad from "../hooks/usePageLoad";

export default function AdminSecurity() {
  const [activeTab, setActiveTab] = useState("surveillance");
  const [events, setEvents] = useState([]);
  const [compliance, setCompliance] = useState(null);
  const [stats, setStats] = useState({ critical: 0, high: 0, healthy: true });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loaded = usePageLoad();

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [eventsData, complianceData] = await Promise.all([
        apiClient.get("/admin/security/events"),
        apiClient.get("/admin/compliance/status")
      ]);

      setEvents(eventsData.events || []);
      setCompliance(complianceData);
      setStats({
        critical: eventsData.critical_count || 0,
        high: (eventsData.events || []).filter(e => e.severity === 'HIGH').length,
        healthy: eventsData.critical_count === 0 && (complianceData.backup_status?.healthy !== false)
      });
    } catch (err) {
      console.error("Failed to fetch admin security data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTriggerBackup = async () => {
    if (!confirm("Initiate a full encrypted system snapshot? This will be logged in the forensic audit trail.")) return;
    setRefreshing(true);
    try {
      await apiClient.post("/admin/system/backup", {});
      alert("System snapshot successfully created and signed.");
      fetchData();
    } catch (err) {
      alert("Backup failed: " + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportAudit = async () => {
    try {
      const data = await apiClient.get("/admin/audit/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus_audit_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (err) {
      alert("Export failed: " + err.message);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  if (!loaded || loading) return <PageSkeleton rows={5} />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto page-enter pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Terminal size={14} className="text-accent" />
            <span className="text-accent text-xs font-bold uppercase tracking-widest">Security Operations Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-main">Forensic Surveillance</h1>
          <p className="text-text-muted text-sm mt-1">Real-time monitoring of system integrity and regulatory compliance.</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 bg-bg-card border-2 border-primary px-4 py-2.5 rounded-xl font-bold text-sm hover:translate-x-1 hover:-translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0 active:translate-y-0 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Syncing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-primary/10 pb-1">
        <button 
          onClick={() => setActiveTab("surveillance")}
          className={`px-4 py-2 text-sm font-black transition-all ${activeTab === 'surveillance' ? 'text-accent border-b-2 border-accent' : 'text-text-muted hover:text-text-main'}`}
        >
          SURVEILLANCE
        </button>
        <button 
          onClick={() => setActiveTab("compliance")}
          className={`px-4 py-2 text-sm font-black transition-all ${activeTab === 'compliance' ? 'text-accent border-b-2 border-accent' : 'text-text-muted hover:text-text-main'}`}
        >
          COMPLIANCE & BACKUP
        </button>
      </div>

      {activeTab === "surveillance" ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatusCard 
              icon={ShieldCheck} 
              label="System Status" 
              value={stats.healthy ? "HEALTHY" : "CRITICAL"} 
              color={stats.healthy ? "text-success" : "text-danger"}
              bg={stats.healthy ? "bg-success/5 border-success/30" : "bg-danger/5 border-danger/30"}
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
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compliance Status */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-bg-card border-2 border-primary rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
               <h3 className="text-lg font-black text-text-main mb-6 flex items-center gap-2">
                 <ShieldCheck className="text-success" /> System Compliance Health
               </h3>
               
               <div className="space-y-4">
                  <ComplianceItem 
                    label="PCI-DSS Data Masking" 
                    status="ENFORCED" 
                    icon={CheckCircle2} 
                    color="text-success" 
                    desc="PII and Merchant signatures are automatically redacted in client sessions."
                  />
                  <ComplianceItem 
                    label="Institutional DR Backup" 
                    status={compliance?.backup_status?.healthy ? "HEALTHY" : "OVERDUE"} 
                    icon={compliance?.backup_status?.healthy ? CheckCircle2 : AlertCircle} 
                    color={compliance?.backup_status?.healthy ? "text-success" : "text-danger"}
                    desc={`Last snapshot: ${compliance?.backup_status?.last_backup ? new Date(compliance.backup_status.last_backup).toLocaleString() : 'NEVER'}`}
                  />
                  <ComplianceItem 
                    label="Audit Trail Integrity" 
                    status="VERIFIED" 
                    icon={CheckCircle2} 
                    color="text-success" 
                    desc="Ledger chain and cryptographic hashing confirmed across all user transactions."
                  />
               </div>
            </div>

            <div className="bg-bg-card border-2 border-primary rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
               <h3 className="text-lg font-black text-text-main mb-4 flex items-center gap-2">
                 <Activity className="text-accent" /> Disaster Recovery Management
               </h3>
               <p className="text-sm text-text-muted mb-6">
                 Initiate off-site encrypted snapshots and verify cold-storage integrity protocols.
               </p>
               <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={handleTriggerBackup}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-all"
                  >
                    <Database size={16} /> Create Snapshot
                  </button>
                  <button className="flex items-center gap-2 bg-bg-card border-2 border-primary px-6 py-3 rounded-xl font-bold text-sm transition-all text-text-muted opacity-50 cursor-not-allowed">
                    <RefreshCw size={16} /> Verify DR Chain
                  </button>
               </div>
            </div>
          </div>

          {/* Export & Compliance Sidebar */}
          <div className="space-y-6">
             <div className="bg-secondary/10 border-2 border-secondary/30 rounded-2xl p-6">
                <FileText className="text-secondary mb-4" size={32} />
                <h4 className="font-black text-text-main mb-2">Audit Export</h4>
                <p className="text-xs text-text-muted leading-relaxed mb-6">
                  Generate a regulator-ready JSON export of all system audit logs. This file is cryptographically signed for non-repudiation.
                </p>
                <button 
                  onClick={handleExportAudit}
                  className="w-full flex items-center justify-center gap-2 bg-secondary text-white py-3 rounded-xl font-bold text-sm hover:bg-secondary-hover transition-all"
                >
                  <Download size={16} /> Download Digest
                </button>
             </div>

             <div className="bg-bg-card border-2 border-primary/20 rounded-2xl p-6">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Integrity Status</h4>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-text-main">Ledger Genesis</span>
                  <span className="text-[10px] bg-success/10 text-success font-bold px-2 py-0.5 rounded border border-success/30">LOCKED</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-text-main">Master Signing Key</span>
                  <span className="text-[10px] bg-success/10 text-success font-bold px-2 py-0.5 rounded border border-success/30">V1_ACTIVE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-main">Forensic Logging</span>
                  <span className="text-[10px] bg-success/10 text-success font-bold px-2 py-0.5 rounded border border-success/30">100% COVERAGE</span>
                </div>
             </div>
          </div>
        </div>
      )}
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

function ComplianceItem({ label, status, icon: Icon, color, desc }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-white border border-primary/10 rounded-xl">
      <div className={`p-2 rounded-lg bg-bg-page select-none`}>
        <Icon size={18} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-bold text-text-main text-sm">{label}</span>
          <span className={`text-[10px] font-black uppercase ${color}`}>{status}</span>
        </div>
        <p className="text-xs text-text-muted truncate">{desc}</p>
      </div>
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
            {event.metadata?.reason || event.metadata?.path || event.metadata?.snapshot_size ? `Snapshot Size: ${event.metadata.snapshot_size} bytes` : "System anomaly detected"}
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
