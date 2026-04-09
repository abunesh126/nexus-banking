import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  getAccount,
  getTransactions,
  getRewards,
  redeemRewards,
  writeAuditLog,
  processTransfer
} from "../lib/database";

const BankContext = createContext(null);

/* ── Spending by category ── */
function computeSpending(transactions) {
  const spending = {};
  transactions
    .filter((t) => t.type === "debit")
    .forEach((t) => {
      const cat = t.category || "Other";
      if (cat !== "UPI") {
        spending[cat] = (spending[cat] || 0) + Number(t.amount);
      }
    });
  return spending;
}

export function BankProvider({ children }) {
  const { user } = useAuth();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [cibilScore, setCibilScore] = useState(762);
  const [spendingByCategory, setSpendingByCategory] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [systemState, setSystemState] = useState({ status: 'SAFE', reason: null });

  /* ── Load data via Proxied Service Layer ── */
  const loadBankData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // All these calls are now proxied via Node.js Security Brain
      const [account, txns, rewards] = await Promise.all([
        getAccount(),
        getTransactions(),
        getRewards()
      ]);

      if (account) setBalance(Number(account.balance));
      
      if (txns) {
        const mapped = txns.map((t) => ({
          id: t.id,
          type: t.type,
          title: t.title,
          merchant: t.merchant || "",
          amount: Number(t.amount),
          date: t.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          category: t.category || "UPI",
          icon: t.icon || "📲",
          risk: t.risk_score || 0,
          note: t.note || "",
        }));
        setTransactions(mapped);
        setSpendingByCategory(computeSpending(mapped));
      }

      if (rewards) setRewardPoints(rewards.points || rewards.total_points || 0);
      
      if (user.cibilScore) setCibilScore(user.cibilScore);

    } catch (err) {
      console.error("Failed to load proxied bank data", err);
      if (err.message === 'SYSTEM_LOCKED') {
        setSystemState({ status: 'LOCKED', reason: 'Forensic Integrity Breach' });
      }
    } finally {
      setIsLoaded(true);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) loadBankData();
    else setIsLoaded(true);
  }, [user?.id, loadBankData]);

  /**
   * sendMoney — Now uses the hardened /transfer proxy
   */
  const sendMoney = useCallback(
    async ({ upiId, amount, note }) => {
      if (!user?.id) throw new Error("Authentication Required");

      try {
        // PROXIED: The backend handles atomic balance shifts, HMAC chaining, 
        // and forensic logging in a single unit of work.
        const result = await processTransfer({
          to_upi: upiId,
          amount: Number(amount),
          note: note || "UPI Transfer"
        });

        // Update local state from response
        setBalance(Number(result.new_balance));
        await loadBankData(); // Refresh history
        
        return result;
      } catch (err) {
        console.error("Transfer failed", err);
        throw err;
      }
    },
    [user?.id, loadBankData]
  );

  /**
   * addMoney — receiving an inbound deposit (Simulated)
   */
  const addMoney = useCallback(
    async (amount) => {
      // In Phase 8, even "Add Money" must be a controlled backend operation
      try {
        const result = await processTransfer({
          to_upi: 'SELF',
          amount: Number(amount),
          type: 'deposit'
        });
        setBalance(Number(result.new_balance));
        await loadBankData();
      } catch (err) {
        throw err;
      }
    },
    [loadBankData]
  );

  /**
   * redeemPoints - convert rewards to balance (Proxied)
   */
  const redeemPoints = useCallback(
    async (pts) => {
      try {
        const result = await redeemRewards(Number(pts));
        setRewardPoints(result.new_points);
        setBalance(Number(result.new_balance));
        await loadBankData();
        return result.cashback;
      } catch (err) {
        throw err;
      }
    },
    [loadBankData]
  );

  if (!isLoaded) return null;

  return (
    <BankContext.Provider
      value={{
        balance,
        transactions,
        cibilScore,
        rewardPoints,
        spendingByCategory,
        systemState,
        sendMoney,
        addMoney,
        redeemPoints,
        refreshData: loadBankData
      }}
    >
      {children}
    </BankContext.Provider>
  );
}

export const useBank = () => useContext(BankContext);
