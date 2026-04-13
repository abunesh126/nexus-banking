import { useState, useMemo } from "react";
import { BookOpen, Search, Filter, ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useBank } from "../context/BankContext";
import TransactionCard from "../components/TransactionCard";
import PageSkeleton from "../components/PageSkeleton";
import usePageLoad from "../hooks/usePageLoad";
import DigitalReceipt from "../components/DigitalReceipt";
import { signEmailMessage } from "../utils/security";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["All", "Income", "Shopping", "Bills", "Food", "Travel", "Entertainment", "UPI", "Rewards"];
const PAGE_SIZE = 6;

export default function Passbook() {
  const { transactions, balance } = useBank();
  const { user, userKeys } = useAuth();
  const loaded = usePageLoad();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [selectedTxn, setSelectedTxn] = useState(null);
  const [txnSignature, setTxnSignature] = useState(null);

  const handleSelectTxn = async (txn) => {
    // Generate an RSA-PSS digital signature for this transaction instance
    const signature = await signEmailMessage(
      `TXN_VERIFY_Institutional_Receipt_${txn.id}_${txn.amount}`,
      user?.id || 'anonymous',
      userKeys?.privateKey // Use the institutional private key if available
    );
    setTxnSignature(signature);
    setSelectedTxn(txn);
  };

  const totalCredit = transactions.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalDebit = transactions.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);

  const filtered = useMemo(() => transactions.filter((t) => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.merchant?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || t.category === category;
    const matchType = typeFilter === "all" || t.type === typeFilter;
    return matchSearch && matchCategory && matchType;
  }), [transactions, search, category, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const goPage = (n) => setPage(Math.min(Math.max(1, n), totalPages));

  if (!loaded) return <PageSkeleton rows={5} />;

  return (
    <div className="space-y-4 sm:space-y-5 max-w-3xl mx-auto page-enter">
      {/* Digital Receipt Modal with S/MIME logic */}
      {selectedTxn && (
        <DigitalReceipt
          transaction={selectedTxn}
          signature={txnSignature}
          onClose={() => setSelectedTxn(null)}
        />
      )}
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center flex-shrink-0">
          <BookOpen size={17} className="text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-main">Passbook</h1>
          <p className="text-text-muted text-sm">Complete transaction history</p>
        </div>
      </div>

      {/* Summary strip — responsive grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-bg-card border border-border-card rounded-2xl p-3 sm:p-4 shadow-sm">
          <p className="text-text-muted text-[10px] sm:text-xs mb-1">Balance</p>
          <p className="text-text-main font-black text-base sm:text-lg leading-tight">
            ₹{balance.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-success/5 border border-success/20 rounded-2xl p-3 sm:p-4">
          <div className="flex items-center gap-1 mb-1">
            <ArrowDownLeft size={11} className="text-success" />
            <p className="text-success text-[10px] sm:text-xs font-medium">Total In</p>
          </div>
          <p className="text-success font-black text-base sm:text-lg leading-tight">
            ₹{totalCredit.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-danger/5 border border-danger/20 rounded-2xl p-3 sm:p-4">
          <div className="flex items-center gap-1 mb-1">
            <ArrowUpRight size={11} className="text-danger" />
            <p className="text-danger text-[10px] sm:text-xs font-medium">Total Out</p>
          </div>
          <p className="text-danger font-black text-base sm:text-lg leading-tight">
            ₹{totalDebit.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-bg-card border border-border-card rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or merchant…"
            className="w-full bg-bg-page border border-border-card rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-main placeholder-text-muted
                       focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all min-h-[44px]" />
        </div>
        {/* Type filter + Category */}
        <div className="flex flex-wrap items-center gap-2">
          {["all", "credit", "debit"].map((t) => (
            <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all duration-150 min-h-[36px]
                ${typeFilter === t ? "bg-accent text-white" : "bg-bg-page border border-border-card text-text-muted hover:text-text-main hover:border-secondary/40"}`}>
              {t === "all" ? "All" : t === "credit" ? "Credits" : "Debits"}
            </button>
          ))}
          <div className="flex items-center gap-1 ml-auto">
            <Filter size={12} className="text-text-muted flex-shrink-0" />
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="bg-bg-page border border-border-card text-text-muted text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent/30 cursor-pointer min-h-[36px]">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <div>
        <p className="text-xs text-text-muted mb-3">{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</p>
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen size={32} className="text-border-card mb-3" />
            <p className="text-text-muted text-sm">No transactions found</p>
            <p className="text-text-muted text-xs mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-2">
            {paginated.map((txn) => (
              <div key={txn.id} onClick={() => handleSelectTxn(txn)} className="cursor-pointer">
                <TransactionCard transaction={txn} />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-5">
            <button onClick={() => goPage(page - 1)} disabled={page === 1}
              className="p-2.5 rounded-xl bg-bg-card border border-border-card text-text-muted hover:text-text-main hover:border-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-w-[44px] min-h-[44px] flex items-center justify-center">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-text-muted">Page <span className="text-text-main font-semibold">{page}</span> of {totalPages}</span>
            <button onClick={() => goPage(page + 1)} disabled={page === totalPages}
              className="p-2.5 rounded-xl bg-bg-card border border-border-card text-text-muted hover:text-text-main hover:border-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-w-[44px] min-h-[44px] flex items-center justify-center">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
