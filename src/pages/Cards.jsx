import React, { useState } from "react";
import { CreditCard, Plus, Shield, ShieldCheck, Trash2, Zap, Info, Eye, EyeOff, Lock } from "lucide-react";
import usePageLoad from "../hooks/usePageLoad";
import PageSkeleton from "../components/PageSkeleton";
import { maskSensitive, hasPermission, ROLES } from "../utils/security";
import { useAuth } from "../context/AuthContext";

export default function Cards() {
    const loaded = usePageLoad();
    const { user } = useAuth();
    const [revealedIds, setRevealedIds] = useState([]);

    const [cards, setCards] = useState([
        { id: 1, type: "MAIN", number: "4292 1234 5678 9012", expiry: "09/28", cvv: "123", label: "Primary Debit", color: "bg-primary" },
    ]);

    const toggleReveal = (id) => {
        // RBAC Enforcement: Only 'manager' or 'admin' could reveal other users' cards, 
        // but here we check if the user has at least 'customer' level to see their own.
        // In a real banking app, this would trigger a re-auth or MFA challenge.
        if (!hasPermission(user, ROLES.CUSTOMER)) {
            alert("Unauthorized: High-security clearance required to reveal raw PII.");
            return;
        }

        if (revealedIds.includes(id)) {
            setRevealedIds(revealedIds.filter(rid => rid !== id));
        } else {
            setRevealedIds([...revealedIds, id]);
        }
    };

    const addBurnerCard = () => {
        const newCard = {
            id: Date.now(),
            type: "BURNER",
            number: `${Math.floor(1000 + Math.random() * 9000).toString().padStart(4, "0")} ${Math.floor(1000 + Math.random() * 9000).toString().padStart(4, "0")} ${Math.floor(1000 + Math.random() * 9000).toString().padStart(4, "0")} ${Math.floor(1000 + Math.random() * 9000).toString().padStart(4, "0")}`,
            expiry: "12/26",
            cvv: Math.floor(100 + Math.random() * 899).toString(),
            label: "Single-use Burner",
            color: "bg-accent",
        };
        setCards([newCard, ...cards]);
    };

    const deleteCard = (id) => {
        setCards(cards.filter(c => c.id !== id));
    };

    if (!loaded) return <PageSkeleton rows={3} />;

    return (
        <div className="space-y-6 max-w-4xl mx-auto page-enter">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-text-main flex items-center gap-2">
                        <CreditCard className="text-accent" /> Virtual Cards
                    </h1>
                    <p className="text-text-muted text-sm">Disposability is the ultimate security.</p>
                </div>
                <button
                    onClick={addBurnerCard}
                    className="flex items-center justify-center gap-2 bg-success hover:bg-green-700 text-white font-semibold rounded-xl py-2.5 px-4 transition-all shadow-sm text-sm"
                >
                    <Plus size={16} /> Generate Burner Card
                </button>
            </div>

            {/* Innovation Banner */}
            <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Zap size={18} className="text-white" />
                </div>
                <div>
                    <p className="text-text-main font-bold text-sm mb-1">Innovation: Disposable Privacy</p>
                    <p className="text-text-muted text-xs leading-relaxed">
                        Protect your real financial identity. Create a **Single-use Burner Card** for risky online subscriptions.
                        Once the transaction is done, the card "evaporates" or is deleted, preventing future unauthorized charges.
                    </p>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cards.map((card) => {
                    const isRevealed = revealedIds.includes(card.id);
                    return (
                        <div key={card.id} className={`relative overflow-hidden rounded-2xl p-6 h-52 text-white shadow-lg transition-transform hover:scale-[1.02] ${card.color}`}>
                            {/* Background design */}
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Landmark size={120} />
                            </div>

                            <div className="relative z-10 flex flex-col justify-between h-full">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest opacity-70 mb-0.5">{card.label}</p>
                                        <p className="text-lg font-bold">NexusBank</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleReveal(card.id)}
                                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                            title={isRevealed ? "Hide Details" : "Reveal Details"}
                                        >
                                            {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                        {card.type === "BURNER" ? <Zap size={20} className="text-yellow-400 fill-yellow-400" /> : <ShieldCheck size={20} />}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xl font-mono tracking-[0.2em] mb-4">
                                        {isRevealed ? card.number : maskSensitive(card.number, 4)}
                                    </p>
                                    <div className="flex gap-8">
                                        <div>
                                            <p className="text-[8px] uppercase opacity-60">Expiry</p>
                                            <p className="text-sm font-semibold">{card.expiry}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] uppercase opacity-60">CVV</p>
                                            <p className="text-sm font-semibold">{isRevealed ? card.cvv : "***"}</p>
                                        </div>
                                    </div>
                                </div>

                                {card.type === "BURNER" && (
                                    <button
                                        onClick={() => deleteCard(card.id)}
                                        className="absolute bottom-6 right-6 p-2 rounded-lg bg-white/10 hover:bg-danger transition-colors"
                                        title="Burn Card"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Security Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-bg-card border border-border-card rounded-2xl p-4 flex gap-3">
                    <Shield className="text-success flex-shrink-0" size={18} />
                    <div>
                        <p className="text-text-main font-semibold text-sm">Institutional Encryption</p>
                        <p className="text-text-muted text-xs">AES-256-GCM protects your virtual card metadata.</p>
                    </div>
                </div>
                <div className="bg-bg-card border border-border-card rounded-2xl p-4 flex gap-3">
                    <Lock className="text-accent flex-shrink-0" size={18} />
                    <div>
                        <p className="text-text-main font-semibold text-sm">PCI-DSS Compliant</p>
                        <p className="text-text-muted text-xs">Aggressive masking is applied by default.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Landmark({ size }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="21" x2="21" y2="21"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
            <polyline points="3 10 12 3 21 10"></polyline>
            <line x1="9" y1="21" x2="9" y2="10"></line>
            <line x1="15" y1="21" x2="15" y2="10"></line>
        </svg>
    );
}
