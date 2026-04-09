import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { maskSensitive } from "../utils/security";

const CATEGORY_COLORS = {
  Income:        "bg-success/10 text-success border-success/20",
  Shopping:      "bg-purple-100  text-purple-700 border-purple-200",
  Bills:         "bg-orange-100  text-orange-700 border-orange-200",
  Food:          "bg-yellow-100  text-yellow-700 border-yellow-200",
  Travel:        "bg-sky-100    text-sky-700    border-sky-200",
  Entertainment: "bg-pink-100   text-pink-700   border-pink-200",
  Rewards:       "bg-teal-100   text-teal-700   border-teal-200",
  UPI:           "bg-accent/10  text-accent     border-accent/20",
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function TransactionCard({ transaction }) {
  const { user } = useAuth();
  const { type, title, merchant, amount, date, category, icon } = transaction;
  const isCredit = type === "credit";
  const catCls   = CATEGORY_COLORS[category] ?? "bg-gray-100 text-text-muted border-border-card";

  // PCI-DSS Masking: Mask merchant identity if user is a customer
  const isUpi = category === "UPI" || (merchant && merchant.includes("@"));
  const displayMerchant = (isUpi && user?.role !== 'admin') 
    ? maskSensitive(merchant, 6) // Mask but keep first 6 (e.g. name***@upi)
    : merchant;


  return (
    <div className="
      group flex items-center justify-between
      px-3 py-3 sm:px-4 sm:py-3.5 rounded-xl
      bg-bg-card border border-border-card
      hover:border-secondary/40 hover:shadow-sm
      transition-all duration-150 cursor-default
      min-h-[60px]
    ">
      {/* Icon + details */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="
          w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-xl
          bg-bg-page border border-border-card
          flex items-center justify-center text-base sm:text-lg select-none
          group-hover:scale-105 transition-transform duration-150
        ">
          {icon ?? (isCredit ? "💰" : "💳")}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-text-main text-sm font-semibold truncate leading-tight">{title}</p>
          <p className="text-text-muted text-xs truncate leading-tight mt-0.5">{displayMerchant} · {formatDate(date)}</p>
        </div>
      </div>

      {/* Category pill (hidden on mobile) + amount */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2 sm:ml-3">
        <span className={`
          hidden sm:inline-flex items-center px-2 py-0.5
          rounded-full text-xs font-medium border ${catCls}
          whitespace-nowrap
        `}>
          {category}
        </span>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <span className={`text-sm font-bold tabular-nums ${isCredit ? "text-success" : "text-danger"}`}>
            {isCredit ? "+" : "−"}₹{amount.toLocaleString("en-IN")}
          </span>
          {isCredit
            ? <ArrowDownLeft size={12} className="text-success flex-shrink-0" />
            : <ArrowUpRight  size={12} className="text-danger  flex-shrink-0" />
          }
        </div>
      </div>
    </div>
  );
}
