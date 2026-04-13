import React from "react";
import { Shield, Database, Lock, Users, Server, FileText } from "lucide-react";

const CubeFace = ({ title, items, color, active }) => (
    <div className={`p-4 rounded-2xl border transition-all duration-300 ${active ? `${color} border-current shadow-lg scale-105` : "bg-bg-card border-border-card opacity-60 grayscale"
        }`}>
        <div className="flex items-center gap-2 mb-3">
            <div className={`p-1.5 rounded-lg ${active ? "bg-white/20" : "bg-bg-page"}`}>
                {title === "Security Goals" && <Shield size={16} />}
                {title === "Security States" && <Database size={16} />}
                {title === "Countermeasures" && <Lock size={16} />}
            </div>
            <h4 className="font-bold text-sm tracking-tight">{title}</h4>
        </div>
        <ul className="space-y-2">
            {items.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-[11px] font-medium">
                    <div className={`w-1.5 h-1.5 rounded-full ${active ? "bg-white" : "bg-text-muted"}`} />
                    {item}
                </li>
            ))}
        </ul>
    </div>
);

export default function McCumberCube() {
    const [activeLayer, setActiveLayer] = React.useState(0); // 0: CIA, 1: States, 2: Measures

    const layers = [
        {
            title: "Security Goals (CIA)",
            items: ["Confidentiality (AES-256)", "Integrity (GCM/Audit)", "Availability (HSTS/Cloud)"],
            color: "bg-primary text-white",
            description: "Fundamental properties of information we protect."
        },
        {
            title: "Information States",
            items: ["Storage (localStorage)", "Transmission (HTTPS)", "Processing (Web Crypto)"],
            color: "bg-accent text-white",
            description: "The three states where information exists in NexusBank."
        },
        {
            title: "Countermeasures",
            items: ["Technology (Encryption)", "Policy (RBAC)", "Education (Security Audit)"],
            color: "bg-secondary text-white",
            description: "The methods used to implement security across the cube."
        }
    ];

    return (
        <div className="bg-bg-card border border-border-card rounded-3xl p-6 sm:p-8">
            <div className="max-w-xl mx-auto text-center mb-8">
                <h3 className="text-xl font-bold text-text-main mb-2">NSTISSC Security Model</h3>
                <p className="text-sm text-text-muted">
                    NexusBank implements the <strong>McCumber Cube</strong> framework to ensure 3D security across all data states and countermeasures.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {layers.map((layer, i) => (
                    <div key={i} onClick={() => setActiveLayer(i)} className="cursor-pointer">
                        <CubeFace
                            title={layer.title.split(" (")[0]}
                            items={layer.items}
                            color={layer.color}
                            active={activeLayer === i}
                        />
                    </div>
                ))}
            </div>

            <div className="bg-bg-page border border-border-card rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Shield size={120} />
                </div>
                <div className="relative z-10">
                    <h4 className={`text-sm font-bold mb-2 ${layers[activeLayer].color.split(" ")[1]}`}>
                        {layers[activeLayer].title}
                    </h4>
                    <p className="text-sm text-text-main font-medium mb-4">
                        {layers[activeLayer].description}
                    </p>

                    <div className="space-y-4">
                        {activeLayer === 0 && (
                            <div className="grid grid-cols-1 gap-2">
                                <div className="p-3 bg-white/5 rounded-xl border border-border-card text-xs">
                                    <span className="font-bold text-primary">Confidentiality:</span> Enforced via AES-256-GCM with non-extractable keys and unique IVs.
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-border-card text-xs">
                                    <span className="font-bold text-primary">Integrity:</span> Verified via GCM Authentication Tags and immutable Cloud Audit Logs.
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-border-card text-xs">
                                    <span className="font-bold text-primary">Availability:</span> Guaranteed by Azure Container Apps and HSTS HSTS preload headers.
                                </div>
                            </div>
                        )}
                        {activeLayer === 1 && (
                            <div className="grid grid-cols-1 gap-2">
                                <div className="p-3 bg-white/5 rounded-xl border border-border-card text-xs text-text-muted">
                                    <span className="font-bold text-accent">NexusBank</span> protects data in all 3 states:
                                    <br /><br />
                                    • <strong>Storage:</strong> Multi-layered encryption for browser storage.
                                    <br />• <strong>Transmission:</strong> TLS 1.3 enforced for cloud communication.
                                    <br />• <strong>Processing:</strong> In-memory encryption during Web Crypto operations.
                                </div>
                            </div>
                        )}
                        {activeLayer === 2 && (
                            <div className="grid grid-cols-1 gap-2">
                                <div className="p-3 bg-white/5 rounded-xl border border-border-card text-xs">
                                    <span className="font-bold text-secondary">Technology:</span> Direct implementation of SubtleCrypto and RBAC gates.
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-border-card text-xs">
                                    <span className="font-bold text-secondary">Policy:</span> Hierarchical access controls defined in security policies.
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-border-card text-xs">
                                    <span className="font-bold text-secondary">Human:</span> Institutional Audit visibility and behavioral risk scoring.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
