import React from "react";
import { Mail, ShieldCheck, Download, ExternalLink, X, FileText, CheckCircle2 } from "lucide-react";

/**
 * Institutional Digital Receipt with S/MIME Signature simulation.
 */
export default function DigitalReceipt({ transaction, signature, onClose }) {
    if (!transaction) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* S/MIME Signature header */}
                <div className="bg-[#111827] text-white p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                            <ShieldCheck className="text-success" size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-none mb-1">Signed Digital Receipt</p>
                            <div className="flex items-center gap-1.5">
                                <h3 className="text-sm font-bold">Secure S/MIME Verification</h3>
                                <CheckCircle2 size={14} className="text-success" />
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 space-y-8">
                    {/* Transaction Details */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-bg-page border border-border-card flex items-center justify-center text-3xl mb-4">
                            {transaction.icon || "📲"}
                        </div>
                        <h2 className="text-xl font-bold text-text-main">{transaction.title}</h2>
                        <p className="text-sm text-text-muted mb-1">{transaction.merchant}</p>
                        <div className="text-4xl font-black text-text-main mt-4 tabular-nums">
                            ₹{transaction.amount.toLocaleString('en-IN')}
                        </div>
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-page border border-border-card text-[10px] font-bold text-text-muted uppercase">
                            {transaction.type === 'debit' ? 'Sent' : 'Received'} Successfully
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-dashed border-gray-200">
                        <div className="flex justify-between text-xs">
                            <span className="text-text-muted">Transaction ID</span>
                            <span className="font-mono font-bold text-text-main">{signature.certSerial.split(':')[0]}-{transaction.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-text-muted">Payment Method</span>
                            <span className="font-bold text-text-main">{transaction.category}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-text-muted">Settlement Date</span>
                            <span className="font-bold text-text-main">{new Date(transaction.date || transaction.created_at).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Cryptographic Proof Section */}
                    <div className="bg-bg-page border border-border-card rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <FileText size={14} className="text-text-muted" />
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Cryptographic Proof (S/MIME v2)</span>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-[9px] font-bold text-text-muted mb-1">Digital Signature (HMAC-SHA256)</p>
                                <p className="text-[10px] font-mono break-all leading-tight text-primary bg-primary/5 p-2 rounded-lg border border-primary/10">
                                    {signature.signature}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[9px] font-bold text-text-muted mb-0.5">Issuer</p>
                                    <p className="text-[10px] font-bold text-text-main">{signature.issuer}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-text-muted mb-0.5">Certificate Serial</p>
                                    <p className="text-[10px] font-mono text-text-main">{signature.certSerial}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer actions */}
                <div className="p-4 bg-bg-page border-t border-border-card flex gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-text-main text-white py-3 rounded-xl text-xs font-bold hover:opacity-90 transition-all">
                        <Download size={14} /> Download PDF
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 border border-border-card text-text-main py-3 rounded-xl text-xs font-bold hover:bg-white transition-all">
                        <ExternalLink size={14} /> Verify on Chain
                    </button>
                </div>
            </div>
        </div>
    );
}
