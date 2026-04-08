import { useState, useEffect } from "react";
import { Star, Gift, Zap, ChevronRight, Clock, CheckCircle2, ArrowDownLeft, ArrowUpRight, ShoppingBag, Plane, Coffee, Film, Smartphone, UtensilsCrossed, X, AlertCircle, Loader2 } from "lucide-react";
import { useBank } from "../context/BankContext";
import PageSkeleton from "../components/PageSkeleton";
import usePageLoad from "../hooks/usePageLoad";

const OFFERS = [
  { id: 1, icon: UtensilsCrossed, iconBg: "bg-orange-500", brand: "Swiggy",      title: "10% cashback on food orders",    description: "Min order ₹299. Max cashback ₹100.", validity: "Valid till 30 Apr 2026", pts: 200, tag: "Food",          tagColor: "bg-orange-100 text-orange-700 border-orange-200" },
  { id: 2, icon: Plane,           iconBg: "bg-sky-600",    brand: "MakeMyTrip",  title: "5× reward points on flights",    description: "Earn 5x points on all flight bookings.", validity: "Valid till 15 Apr 2026", pts: 500, tag: "Travel",        tagColor: "bg-sky-100 text-sky-700 border-sky-200" },
  { id: 3, icon: ShoppingBag,     iconBg: "bg-purple-600", brand: "Amazon",      title: "₹150 off on ₹999+",              description: "Shop electronics & get instant discount.", validity: "Valid till 10 Apr 2026", pts: 0,   tag: "Shopping",      tagColor: "bg-purple-100 text-purple-700 border-purple-200" },
  { id: 4, icon: Coffee,          iconBg: "bg-amber-600",  brand: "Starbucks",   title: "Buy 1 Get 1 on beverages",       description: "Show offer at checkout. Weekends only.", validity: "Valid till 30 Apr 2026", pts: 150, tag: "Dining",        tagColor: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: 5, icon: Film,            iconBg: "bg-pink-600",   brand: "BookMyShow",  title: "₹100 off on movie tickets",      description: "Valid once per week per user.", validity: "Valid till 01 May 2026", pts: 100, tag: "Entertainment", tagColor: "bg-pink-100 text-pink-700 border-pink-200" },
  { id: 6, icon: Smartphone,      iconBg: "bg-success",    brand: "Flipkart",    title: "3× points on mobile purchases",  description: "On purchase above ₹5,000.", validity: "Valid till 20 Apr 2026", pts: 300, tag: "Shopping",      tagColor: "bg-green-100 text-green-700 border-green-200" },
];

const POINTS_HISTORY = [
  { id: 1, type: "earn",   title: "Salary Credit Bonus",    points: 1245, date: "28 Mar 2026" },
  { id: 2, type: "earn",   title: "Online Shopping Bonus",  points: 70,   date: "27 Mar 2026" },
  { id: 3, type: "redeem", title: "Redeemed for Cashback",  points: 500,  date: "22 Mar 2026" },
  { id: 4, type: "earn",   title: "Freelance Payment Bonus",points: 180,  date: "22 Mar 2026" },
  { id: 5, type: "earn",   title: "Cashback Reward",        points: 45,   date: "15 Mar 2026" },
];

function Toast({ type, message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const isSuccess = type === "success";
  return (
    <div className={`fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg border
      ${isSuccess ? "bg-bg-card border-success/30" : "bg-bg-card border-danger/30"}
      animate-[slideUp_.2s_ease]`}>
      {isSuccess ? <CheckCircle2 size={17} className="text-success flex-shrink-0" /> : <AlertCircle size={17} className="text-danger flex-shrink-0" />}
      <p className="text-sm font-medium text-text-main flex-1 whitespace-pre-wrap">{message}</p>
      <button onClick={onClose} className="ml-2 text-text-muted hover:text-text-main min-w-[32px] flex items-center justify-center"><X size={13} /></button>
    </div>
  );
}

function RedeemModal({ pointsOwned, onConfirm, onCancel, loading }) {
  const [pts, setPts] = useState("");
  
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
      <div className="absolute inset-0 bg-primary/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full sm:max-w-sm bg-bg-card border border-border-card
           sm:rounded-2xl rounded-t-2xl p-6 shadow-xl"
        style={{ animation: "slideUp .2s ease" }}>
        <button onClick={onCancel} className="absolute top-4 right-4 text-text-muted hover:text-text-main p-2"><X size={17} /></button>
        <h3 className="text-base font-bold text-text-main mb-2">Redeem Points</h3>
        <p className="text-sm text-text-muted mb-4">You have {pointsOwned} pts. 4 pts = ₹1 cashback.</p>
        <div className="space-y-4 mb-6">
          <div className="relative">
            <input type="number" min="100" max={pointsOwned} value={pts}
              onChange={(e) => setPts(e.target.value)}
              className="w-full bg-bg-page border border-border-card focus:ring-accent/30 rounded-xl px-4 py-3 text-text-main placeholder-text-muted text-sm focus:outline-none focus:ring-2 transition-all min-h-[48px]"
              placeholder="Enter points (min 100)" />
          </div>
          {pts >= 100 && (
             <div className="bg-success/10 border border-success/20 rounded-xl p-3 text-center">
               <p className="text-success text-sm font-semibold">You'll get ₹{Math.floor(pts / 4)} cashback</p>
             </div>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 border border-border-card text-text-muted hover:bg-bg-page rounded-xl py-3 text-sm font-medium transition-all min-h-[48px]">
            Cancel
          </button>
          <button onClick={() => onConfirm(pts)} disabled={loading || pts < 100 || pts > pointsOwned}
            className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white rounded-xl py-3 text-sm font-semibold transition-all min-h-[48px]">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Gift size={15} />}
            Redeem
          </button>
        </div>
      </div>
    </div>
  );
}

function OfferCard({ offer, onClaim }) {
  const [claimed, setClaimed] = useState(false);
  const Icon = offer.icon;
  return (
    <div className="group bg-bg-card border border-border-card hover:border-secondary/40 hover:shadow-md rounded-2xl p-4 sm:p-5 flex flex-col gap-3 transition-all duration-150">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${offer.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-150`}>
            <Icon size={17} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-text-muted font-medium">{offer.brand}</p>
            <p className="text-text-main text-sm font-semibold leading-tight">{offer.title}</p>
          </div>
        </div>
        <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${offer.tagColor} whitespace-nowrap`}>{offer.tag}</span>
      </div>
      <p className="text-text-muted text-xs">{offer.description}</p>
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border-card">
        <span className="flex items-center gap-1 text-xs text-text-muted">
          <Clock size={10} className="flex-shrink-0" />
          <span className="truncate">{offer.validity}</span>
        </span>
        {offer.pts > 0 && <span className="text-xs text-yellow-600 font-semibold flex-shrink-0 ml-2">+{offer.pts} pts</span>}
      </div>
      <button onClick={() => {
        setClaimed(true);
        onClaim(offer);
      }} disabled={claimed}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 min-h-[44px]
          ${claimed ? "bg-success/10 text-success border border-success/30 cursor-default" : "bg-accent hover:bg-accent-hover text-white shadow-sm"}`}>
        {claimed ? <span className="flex items-center justify-center gap-1.5"><CheckCircle2 size={13} /> Claimed</span> : "Claim Offer"}
      </button>
    </div>
  );
}

function HistoryRow({ item }) {
  const isEarn = item.type === "earn";
  return (
    <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl bg-bg-card border border-border-card hover:border-secondary/40 hover:shadow-sm transition-all duration-150 min-h-[60px]">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isEarn ? "bg-yellow-100" : "bg-bg-page border border-border-card"}`}>
          {isEarn ? <ArrowDownLeft size={14} className="text-yellow-600" /> : <ArrowUpRight size={14} className="text-text-muted" />}
        </div>
        <div className="min-w-0">
          <p className="text-text-main text-sm font-medium truncate">{item.title}</p>
          <p className="text-text-muted text-xs">{item.date}</p>
        </div>
      </div>
      <span className={`text-sm font-bold flex-shrink-0 ml-2 ${isEarn ? "text-yellow-600" : "text-text-muted"}`}>
        {isEarn ? "+" : "−"}{item.points} pts
      </span>
    </div>
  );
}

export default function Rewards() {
  const { rewardPoints, redeemPoints } = useBank();
  const loaded = usePageLoad();
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  
  if (!loaded) return <PageSkeleton rows={3} />;

  const rupeeValue = Math.floor(rewardPoints / 4);

  return (
    <>
      {showModal && <RedeemModal pointsOwned={rewardPoints} loading={isRedeeming} onCancel={() => setShowModal(false)} onConfirm={async (pts) => {
          try {
            setIsRedeeming(true);
            const cash = await redeemPoints(pts);
            setToast({ type: "success", message: `Successfully redeemed ${pts} points for ₹${cash} cashback!` });
            setShowModal(false);
          } catch(e) {
             setToast({ type: "error", message: "Redemption failed: " + e.message });
          } finally {
            setIsRedeeming(false);
          }
      }} />}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    <div className="space-y-4 sm:space-y-5 max-w-4xl mx-auto page-enter">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-yellow-100 border border-yellow-200 flex items-center justify-center flex-shrink-0">
          <Star size={17} className="text-yellow-600" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-main">Rewards</h1>
          <p className="text-text-muted text-sm">Earn points, unlock offers, redeem for cashback</p>
        </div>
      </div>

      {/* Points banner */}
      <div className="relative rounded-2xl overflow-hidden p-5 sm:p-6 bg-gradient-to-br from-primary to-accent shadow-sm">
        <div className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star size={14} className="text-yellow-300" />
                <p className="text-white/70 text-sm font-medium">NexusBank Rewards</p>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {rewardPoints.toLocaleString("en-IN")}
                <span className="text-lg sm:text-xl font-semibold text-white/70 ml-2">pts</span>
              </p>
              <p className="text-white/60 text-sm mt-1.5">≈ ₹{rupeeValue.toLocaleString("en-IN")} cashback value</p>
            </div>
            <div className="flex sm:flex-col gap-2 sm:items-end">
              <button 
                onClick={() => {
                   if (rewardPoints < 100) {
                     setToast({ type: "error", message: "Minimum 100 points required to redeem." });
                     return;
                   }
                   setShowModal(true);
                }}
                disabled={rewardPoints < 100}
                className="flex items-center gap-2 bg-white text-primary font-semibold px-4 sm:px-5 py-2.5 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all duration-150 shadow-sm text-sm min-h-[44px]">
                <Gift size={14} /> Redeem Points
              </button>
              <p className="text-white/50 text-xs self-center">4 pts = ₹1</p>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-white/15">
            <div className="flex justify-between text-xs text-white/60 mb-1.5">
              <span>🥈 Silver tier</span>
              <span className="truncate ml-2">{rewardPoints.toLocaleString("en-IN")} / 6,000 pts to 🥇 Gold</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${Math.min((rewardPoints/6000)*100,100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats — 3 equal cols, responsive text */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { icon: Zap,  label: "Earned this month", value: "1,540 pts", color: "text-yellow-600", bg: "bg-yellow-100 border-yellow-200" },
          { icon: Gift, label: "Redeemed",          value: "500 pts",   color: "text-purple-600", bg: "bg-purple-100 border-purple-200" },
          { icon: Star, label: "Expiring soon",     value: "200 pts",   color: "text-danger",     bg: "bg-danger/10 border-danger/20" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl p-3 sm:p-4 text-center border ${bg}`}>
            <Icon size={16} className={`${color} mx-auto mb-1`} />
            <p className={`text-xs sm:text-sm font-bold ${color} leading-tight`}>{value}</p>
            <p className="text-text-muted text-[10px] sm:text-[11px] mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Featured Offers — 1 col on mobile, 2 on sm, 3 on xl */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs sm:text-sm font-semibold text-text-muted uppercase tracking-wide">Featured Offers</h2>
          <button className="flex items-center gap-1 text-accent hover:text-accent-hover text-xs font-medium transition-colors min-h-[44px] px-1">
            See all <ChevronRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {OFFERS.map((o) => <OfferCard key={o.id} offer={o} onClaim={(offer) => {
            setToast({ type: "success", message: `Offer Claimed! Use promo code: NEXUS-${offer.brand.toUpperCase()}-2026\nat checkout on ${offer.brand}.`});
          }} />)}
        </div>
      </div>

      {/* Points history */}
      <div>
        <h2 className="text-xs sm:text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">Points History</h2>
        <div className="space-y-2">
          {POINTS_HISTORY.map((item) => <HistoryRow key={item.id} item={item} />)}
        </div>
      </div>
      </div>
    </>
  );
}

