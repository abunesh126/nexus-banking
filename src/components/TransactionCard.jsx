import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

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
  const { type, title, merchant, amount, date, category, icon } = transaction;
  const isCredit = type === "credit";
  const catCls   = CATEGORY_COLORS[category] ?? "bg-gray-100 text-text-muted border-border-card";

  return (
    <div className="
      group flex items-center justify-between
      px-4 py-3.5 rounded-xl
      bg-bg-card border border-border-card
      hover:border-secondary/40 hover:shadow-sm
      transition-all duration-150 cursor-default
    ">
      {/* Icon + details */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="
          w-10 h-10 flex-shrink-0 rounded-xl
          bg-bg-page border border-border-card
          flex items-center justify-center text-lg select-none
          group-hover:scale-105 transition-transform duration-150
        ">
          {icon ?? (isCredit ? "💰" : "💳")}
        </div>
        <div className="min-w-0">
          <p className="text-text-main text-sm font-semibold truncate">{title}</p>
          <p className="text-text-muted text-xs truncate">{merchant} · {formatDate(date)}</p>
        </div>
      </div>

      {/* Category pill + amount */}
      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
        <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${catCls}`}>
          {category}
        </span>
        <div className="flex items-center gap-1">
          <span className={`text-sm font-bold tabular-nums ${isCredit ? "text-success" : "text-danger"}`}>
            {isCredit ? "+" : "−"}₹{amount.toLocaleString("en-IN")}
          </span>
          {isCredit
            ? <ArrowDownLeft size={13} className="text-success flex-shrink-0" />
            : <ArrowUpRight  size={13} className="text-danger  flex-shrink-0" />
          }
        </div>
      </div>
    </div>
  );
}
