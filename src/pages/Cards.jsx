import { useState, useEffect } from "react";
import { CreditCard, Plus, Shield, ShieldCheck, Trash2, Zap, Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import usePageLoad from "../hooks/usePageLoad";
import PageSkeleton from "../components/PageSkeleton";
import { maskSensitive, hasPermission, ROLES } from "../utils/security";
import { useAuth } from "../context/AuthContext";
import { getCards, createCard, deleteCard as deleteCardDB } from "../lib/database";

export default function Cards() {
    const loaded = usePageLoad();
    const { user } = useAuth();
    const [revealedIds, setRevealedIds] = useState([]);
    const [cards, setCards] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    // Load cards from Supabase on mount
    useEffect(() => {
        if (!user?.id) return;
        async function loadCards() {
            try {
                const data = await getCards(user.id);
                if (data) {
                    setCards(data.map((c) => ({
                        id: c.id,
                        type: c.card_type,
                        number: c.card_number,
                        expiry: c.expiry,
                        cvv: c.cvv,
                        label: c.label,
                        color: c.color,
                    })));
                }
            } catch (err) {
                console.error("Failed to load cards:", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadCards();
    }, [user?.id]);

    const toggleReveal = (id) => {
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

    const addBurnerCard = async () => {
        if (!user?.id) return;
        setIsGenerating(true);

        const newCardData = {
            type: "BURNER",
            number: `${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
            expiry: "12/26",
            cvv: Math.floor(100 + Math.random() * 899).toString(),
            label: "Single-use Burner",
            color: "bg-accent",
        };

        try {
            const saved = await createCard(user.id, newCardData);
            setCards([{
                id: saved.id,
                ...newCardData,
            }, ...cards]);
        } catch (err) {
            console.error("Failed to create card:", err);
            alert("Failed to generate card. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteCard = async (id) => {
        if (!user?.id) return;
        try {
            await deleteCardDB(id, user.id);
            setCards(cards.filter(c => c.id !== id));
        } catch (err) {
            console.error("Failed to delete card:", err);
        }
    };

    if (!loaded || isLoading) return <PageSkeleton rows={3} />;

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
                    disabled={isGenerating}
                    className="flex items-center justify-center gap-2 bg-success hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 px-4 transition-all shadow-sm text-sm"
                >
                    {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    {isGenerating ? "Generating…" : "Generate Burner Card"}
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
                        Protect your real financial identity. Create a <strong>Single-use Burner Card</strong> for risky online subscriptions.
                        Once the transaction is done, the card "evaporates" or is deleted, preventing future unauthorized charges.
                    </p>
                </div>
            </div>

            {/* Cards Grid */}
            {cards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-bg-card border border-border-card rounded-2xl">
                    <CreditCard size={40} className="text-border-card mb-3" />
                    <p className="text-text-muted text-sm">No cards yet</p>
                    <p className="text-text-muted text-xs mt-1">Generate a burner card to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {cards.map((card) => {
                        const isRevealed = revealedIds.includes(card.id);
                        return (
                            <div key={card.id} className={`relative overflow-hidden rounded-2xl p-6 h-52 text-white shadow-lg transition-transform hover:scale-[1.02] ${card.color}`}>
                                {/* Background design */}
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <LandmarkSVG size={120} />
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
                                            onClick={() => handleDeleteCard(card.id)}
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
            )}

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

function LandmarkSVG({ size }) {
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
