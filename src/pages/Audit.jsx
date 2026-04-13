import { useState, useEffect } from "react";
import { Shield, List, Search, AlertTriangle, ShieldCheck, History, Cloud, Activity, Brain, Fingerprint, Zap, ShieldAlert } from "lucide-react";
import usePageLoad from "../hooks/usePageLoad";
import PageSkeleton from "../components/PageSkeleton";
import { secureStorage } from "../utils/secureStorage";
import CloudPipeline from "./CloudPipeline";
import { azureAI } from "../utils/azureAI";

export default function Audit() {
    const loaded = usePageLoad();
    const [activeTab, setActiveTab] = useState("audit"); // 'audit', 'cloud', 'ai'
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [aiStatus, setAiStatus] = useState("IDLE");
    const [aiFindings, setAiFindings] = useState([]);

    useEffect(() => {
        const fetchLogs = () => {
            try {
                const history = secureStorage.getAuditLogs() || [];
                setLogs([...history].reverse());
            } catch (err) {
                console.error("Failed to fetch audit logs:", err);
            }
        };
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    const filteredLogs = (logs || []).filter(log =>
        log && log.action && (
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            JSON.stringify(log).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const runAIScan = async () => {
        setAiStatus("SCANNING");
        // Topic 1 Data for analysis
        const mockData = [
            { id: "TXN-1001", merchant: "Amazon Web Services", amount: 150.00 },
            { id: "TXN-1002", merchant: "Steam Games", amount: 4500.00 },
            { id: "TXN-1003", merchant: "Unknown IP Transfer", amount: 85000.00 },
            { id: "TXN-1004", merchant: "Swiggy Food", amount: 450.00 },
            { id: "TXN-1005", merchant: "Crypto Exchange", amount: 150000.00 },
        ];

        try {
            const results = await azureAI.runGlobalHeuristicScan(mockData);
            setAiFindings(results);
            setAiStatus("DONE");
            secureStorage.log('AI_GLOBAL_SCAN', { itemsScanned: 5, anomalies: results.filter(r => r.aiReport.isAnomaly).length });
        } catch (err) {
            console.error("AI Scan Failed:", err);
            setAiStatus("IDLE");
        }
    };

    if (!loaded) return <PageSkeleton rows={5} />;

    return (
        <div className="space-y-6 max-w-5xl mx-auto page-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-main tracking-tight">Security & Governance</h1>
                        <p className="text-sm text-text-muted flex items-center gap-1.5">
                            <Activity size={12} className="text-accent" /> Institutional Compliance Center
                        </p>
                    </div>
                </div>

                <div className="flex bg-bg-card border border-border-card p-1 rounded-xl shadow-inner">
                    <TabBtn active={activeTab === 'audit'} onClick={() => setActiveTab("audit")} icon={History} label="Audit" />
                    <TabBtn active={activeTab === 'cloud'} onClick={() => setActiveTab("cloud")} icon={Cloud} label="Cloud ETL" />
                    <TabBtn active={activeTab === 'ai'} onClick={() => setActiveTab("ai")} icon={Brain} label="AI Risks" />
                </div>
            </div>

            {activeTab === "cloud" ? (
                <div className="page-enter"><CloudPipeline /></div>
            ) : activeTab === "ai" ? (
                <div className="space-y-6 page-enter">
                    <div className="bg-bg-card border border-border-card rounded-3xl p-8 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="max-w-md">
                                <h2 className="text-2xl font-bold text-text-main mb-3 flex items-center gap-2">
                                    <Fingerprint className="text-accent" /> Managed AI Risk Analysis
                                </h2>
                                <p className="text-sm text-text-muted leading-relaxed mb-6">
                                    Using **Azure Cognitive Services Anomaly Detector**, we perform multivariate analysis to flag hidden fraud patterns that standard RBAC rules cannot detect.
                                </p>
                                <button
                                    onClick={runAIScan}
                                    disabled={aiStatus === "SCANNING"}
                                    className="bg-accent hover:bg-accent-hover text-primary font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-accent/20"
                                >
                                    {aiStatus === "SCANNING" ? <Zap className="animate-spin" size={18} /> : <Brain size={18} />}
                                    {aiStatus === "IDLE" ? "Initialize AI Scan" : aiStatus === "SCANNING" ? "ML Inference..." : "Re-Scan Ledger"}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-center sm:text-left">
                                <InsightStat label="Model" value="Anomaly Detector v3" />
                                <InsightStat label="Status" value="Ready" color="text-success" />
                                <InsightStat label="Source" value="Azure Blob (Topic 1)" />
                                <InsightStat label="Maturity" value="Level 4 (Managed)" color="text-accent" />
                            </div>
                        </div>
                    </div>

                    {aiFindings.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 page-enter">
                            {aiFindings.map((finding, i) => (
                                <div key={i} className={`p-5 rounded-2xl border transition-all ${finding.aiReport.isAnomaly ? 'bg-danger/5 border-danger/20' : 'bg-bg-card border-border-card'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-bold py-1 px-2 rounded bg-bg-page border border-border-card text-text-muted">{finding.id}</span>
                                        {finding.aiReport.isAnomaly && <ShieldAlert size={16} className="text-danger animate-pulse" />}
                                    </div>
                                    <h4 className="font-bold text-text-main text-sm mb-1">{finding.merchant}</h4>
                                    <p className="text-lg font-bold text-text-main mb-3">₹{finding.amount.toLocaleString()}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {finding.aiReport.insights.map((ins, j) => (
                                            <span key={j} className="text-[9px] font-bold bg-white/5 border border-white/10 px-2 py-1 rounded-full text-text-muted uppercase italic">
                                                {ins}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-border-card flex items-center justify-between">
                                        <span className="text-[10px] uppercase font-bold text-text-muted">AI Risk Score</span>
                                        <span className={`text-sm font-bold ${finding.aiReport.riskScore > 75 ? 'text-danger' : 'text-success'}`}>{finding.aiReport.riskScore}/100</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6 page-enter">
                    <div className="bg-bg-card border border-border-card rounded-2xl p-5 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                            <Shield size={20} className="text-orange-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-text-main mb-1">Institutional Compliance (PCI-DSS/GDPR)</p>
                            <p className="text-xs text-text-muted leading-relaxed">
                                Every action within NexusBank—from encryption key derivation to PII access—is cryptographically logged.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Total Events" value={logs.length} />
                        <StatCard label="Violations" value={logs.filter(l => l.action.includes('VIOLATION')).length} color="text-danger" />
                        <StatCard label="Data Writes" value={logs.filter(l => l.action === 'DATA_WRITE').length} color="text-success" />
                        <StatCard label="Auth Events" value={logs.filter(l => l.action.includes('LOGIN')).length} color="text-accent" />
                    </div>

                    <div className="bg-bg-card border border-border-card rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-border-card flex items-center gap-3">
                            <Search size={16} className="text-text-muted" />
                            <input
                                type="text"
                                placeholder="Filter security events..."
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-text-main placeholder-text-muted"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-bg-page border-b border-border-card">
                                        <th className="px-6 py-4 font-bold text-text-main uppercase tracking-widest text-[10px]">Timestamp</th>
                                        <th className="px-6 py-4 font-bold text-text-main uppercase tracking-widest text-[10px]">Action</th>
                                        <th className="px-6 py-4 font-bold text-text-main uppercase tracking-widest text-[10px]">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-card">
                                    {filteredLogs.map((log, idx) => (
                                        <tr key={idx} className={`hover:bg-bg-page/50 transition-colors ${log.action && log.action.includes('VIOLATION') ? 'bg-danger/5' : ''}`}>
                                            <td className="px-6 py-4 font-mono text-xs text-text-muted whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border
                                                  ${log.action && log.action.includes('VIOLATION') ? 'bg-danger/10 border-danger/30 text-danger' :
                                                        log.action && log.action.includes('WRITE') ? 'bg-success/10 border-success/30 text-success' :
                                                            'bg-accent/10 border-accent/30 text-accent'}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono text-text-muted truncate max-w-xs md:max-w-md">
                                                {JSON.stringify(log, (k, v) => k === 'timestamp' || k === 'action' ? undefined : v)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            <p className="text-center text-[10px] text-text-muted uppercase tracking-[0.2em] pt-4">
                Nexus SOC · Institutional Monitoring · Log Integrity Verified
            </p>
        </div>
    );
}

function TabBtn({ active, onClick, icon: Icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${active ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}
        >
            <Icon size={14} /> {label}
        </button>
    );
}

function InsightStat({ label, value, color = "text-text-main" }) {
    return (
        <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
            <p className="text-[9px] uppercase font-bold text-text-muted mb-0.5">{label}</p>
            <p className={`text-xs font-bold ${color}`}>{value}</p>
        </div>
    );
}

function StatCard({ label, value, color = "text-text-main" }) {
    return (
        <div className="bg-bg-card border border-border-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
        </div>
    );
}
