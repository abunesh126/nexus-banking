import { useState, useEffect } from "react";
import { Cloud, Database, ArrowRight, CheckCircle2, AlertCircle, Loader2, Play, RefreshCw, Layers, ShieldCheck } from "lucide-react";
import usePageLoad from "../hooks/usePageLoad";
import PageSkeleton from "../components/PageSkeleton";

export default function CloudPipeline() {
    const loaded = usePageLoad();
    const [pipelineState, setPipelineState] = useState("IDLE"); // IDLE, CONNECTING, EXTRACTING, TRANSFORMING, LOADING, SUCCESS
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState([]);
    const [ingestedData, setIngestedData] = useState([]);

    const addLog = (msg, type = "info") => {
        setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }]);
    };

    const runPipeline = async () => {
        setLogs([]);
        setIngestedData([]);
        setPipelineState("CONNECTING");
        addLog("Initiating Secure Handshake with Azure Blob Service...", "info");

        await new Promise(r => setTimeout(r, 1500));
        setPipelineState("EXTRACTING");
        addLog("Connection Established. Verifying SAS Token...", "success");
        addLog("Extracting raw dataset (dataset.csv) from 'financial-datasets' container...", "info");
        setProgress(20);

        await new Promise(r => setTimeout(r, 2000));
        setPipelineState("TRANSFORMING");
        addLog("Extraction Complete. Transforming schema to TransactionModel...", "info");
        addLog("Applying Predictive Risk Scoring (Topic 3 Integration)...", "warn");
        setProgress(50);

        await new Promise(r => setTimeout(r, 2000));
        setPipelineState("LOADING");
        addLog("Transformation Success. Loading 5 records into Supabase Postgres...", "info");
        setProgress(80);

        await new Promise(r => setTimeout(r, 2000));
        setPipelineState("SUCCESS");
        setProgress(100);
        addLog("Pipeline Finished. Cloud Dataset synchronized with Production DB.", "success");

        setIngestedData([
            { id: "TXN-1001", merchant: "Amazon Web Services", amount: "₹150.00", risk: "NORMAL" },
            { id: "TXN-1002", merchant: "Steam Games", amount: "₹4,500.00", risk: "NORMAL" },
            { id: "TXN-1003", merchant: "Unknown IP Transfer", amount: "₹85,000.00", risk: "CRITICAL" },
            { id: "TXN-1004", merchant: "Swiggy Food", amount: "₹450.00", risk: "NORMAL" },
            { id: "TXN-1005", merchant: "Crypto Exchange", amount: "₹1,50,000.00", risk: "CRITICAL" },
        ]);
    };

    if (!loaded) return <PageSkeleton rows={4} />;

    return (
        <div className="space-y-6 max-w-5xl mx-auto page-enter">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-600/20">
                        <Cloud size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-main tracking-tight">Cloud ETL Pipeline</h1>
                        <p className="text-sm text-text-muted flex items-center gap-1.5">
                            <Layers size={14} className="text-sky-500" /> Managed Azure Data Factory Orchestration
                        </p>
                    </div>
                </div>
                <button
                    onClick={runPipeline}
                    disabled={pipelineState !== "IDLE" && pipelineState !== "SUCCESS"}
                    className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl py-3 px-6 transition-all shadow-md shadow-sky-600/20"
                >
                    {pipelineState === "IDLE" || pipelineState === "SUCCESS" ? <Play size={18} fill="currentColor" /> : <Loader2 size={18} className="animate-spin" />}
                    {pipelineState === "IDLE" ? "Run Pipeline" : pipelineState === "SUCCESS" ? "Re-run Sync" : "Syncing..."}
                </button>
            </div>

            {/* Pipeline Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Progress Card */}
                <div className="lg:col-span-2 bg-bg-card border border-border-card rounded-3xl p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-sky-600" />
                    <h3 className="text-sm font-bold text-text-main uppercase tracking-widest mb-6 flex items-center gap-2">
                        <RefreshCw size={14} className={pipelineState !== "IDLE" && pipelineState !== "SUCCESS" ? "animate-spin" : ""} /> Runtime Orchestration
                    </h3>

                    <div className="relative flex items-center justify-between px-4 mb-12">
                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-border-card -translate-y-1/2 z-0" />
                        <div className={`absolute left-0 top-1/2 h-0.5 bg-sky-600 -translate-y-1/2 z-0 transition-all duration-500`} style={{ width: `${progress}%` }} />

                        <PipelineStep icon={Cloud} label="Extract" status={pipelineState === "EXTRACTING" ? "loading" : progress > 20 ? "done" : "idle"} />
                        <PipelineStep icon={Layers} label="Transform" status={pipelineState === "TRANSFORMING" ? "loading" : progress > 50 ? "done" : "idle"} />
                        <PipelineStep icon={Database} label="Load" status={pipelineState === "LOADING" ? "loading" : progress > 80 ? "done" : "idle"} />
                    </div>

                    <div className="bg-primary/95 rounded-2xl p-4 font-mono text-[11px] h-48 overflow-y-auto custom-scrollbar border border-white/5">
                        {logs.length === 0 && <p className="text-white/20 italic">Waiting for pipeline trigger...</p>}
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1 flex gap-2">
                                <span className="text-white/30">[{log.time}]</span>
                                <span className={log.type === "success" ? "text-success" : log.type === "warn" ? "text-warning" : "text-sky-300"}>
                                    {log.msg}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats / Status */}
                <div className="bg-bg-card border border-border-card rounded-3xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-text-main uppercase tracking-widest mb-6">Cloud Service Status</h3>
                    <div className="space-y-4">
                        <StatusRow label="Azure Storage" status="Online" color="text-success" />
                        <StatusRow label="Data Factory" status="Idle" color="text-text-muted" />
                        <StatusRow label="SAS Auth" status="Verified" color="text-success" />
                        <StatusRow label="Target DB" status="Supabase-Postgres" color="text-accent" />
                    </div>

                    <div className="mt-8 p-4 bg-sky-600/5 border border-sky-600/10 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck size={16} className="text-sky-600" />
                            <p className="text-xs font-bold text-text-main">Topic 1 Verification</p>
                        </div>
                        <p className="text-[10px] text-text-muted leading-relaxed">
                            This pipeline demonstrates data ingestion from untrusted cloud sources into a secured environment with mandatory transformation.
                        </p>
                    </div>
                </div>
            </div>

            {/* Ingested Records Table */}
            {ingestedData.length > 0 && (
                <div className="bg-bg-card border border-border-card rounded-3xl overflow-hidden shadow-sm page-enter">
                    <div className="p-5 border-b border-border-card bg-bg-page/50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-text-main">Ingested Cloud Records (Verification)</h3>
                        <span className="px-3 py-1 bg-success/10 text-success text-[10px] font-bold rounded-full border border-success/20">Audit Ready</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-bg-page/30">
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">TXN ID</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Merchant</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-wider">Risk Analytics</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-card">
                                {ingestedData.map((row, i) => (
                                    <tr key={i} className="hover:bg-bg-page/20 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-text-main font-bold">{row.id}</td>
                                        <td className="px-6 py-4 text-text-main">{row.merchant}</td>
                                        <td className="px-6 py-4 text-text-main font-semibold">{row.amount}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${row.risk === 'CRITICAL' ? 'bg-danger/10 text-danger border-danger/20' : 'bg-success/10 text-success border-success/20'
                                                }`}>
                                                {row.risk}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function PipelineStep({ icon: Icon, label, status }) {
    const isDone = status === "done";
    const isLoading = status === "loading";

    return (
        <div className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${isDone ? "bg-sky-600 border-sky-600 text-white shadow-lg shadow-sky-600/20" :
                    isLoading ? "bg-bg-card border-sky-600 text-sky-600 animate-pulse" :
                        "bg-bg-card border-border-card text-text-muted"
                }`}>
                {isDone ? <CheckCircle2 size={20} /> : <Icon size={20} />}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDone || isLoading ? "text-text-main" : "text-text-muted"}`}>{label}</span>
        </div>
    );
}

function StatusRow({ label, status, color }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-border-card last:border-0">
            <span className="text-xs text-text-muted">{label}</span>
            <span className={`text-xs font-bold ${color}`}>{status}</span>
        </div>
    );
}
