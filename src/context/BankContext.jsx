import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { secureStorage } from "../utils/secureStorage";

const BankContext = createContext(null);

const BAL_KEY = "nexusbank_balance";
const TXN_KEY = "nexusbank_transactions";

/* ── 10 rich mock transactions ── */
const INITIAL_TRANSACTIONS = [
  { id: 1, type: "credit", title: "Salary Credit", merchant: "Infosys Ltd.", amount: 124500, date: "2026-03-28", category: "Income", icon: "💼" },
  { id: 2, type: "debit", title: "Amazon Shopping", merchant: "Amazon India", amount: 3499, date: "2026-03-27", category: "Shopping", icon: "🛒" },
  { id: 3, type: "debit", title: "Electricity Bill", merchant: "BESCOM", amount: 1250, date: "2026-03-25", category: "Bills", icon: "⚡" },
  { id: 4, type: "credit", title: "Freelance Payment", merchant: "Upwork Inc.", amount: 18000, date: "2026-03-22", category: "Income", icon: "💻" },
  { id: 5, type: "debit", title: "Zomato Order", merchant: "Zomato", amount: 680, date: "2026-03-21", category: "Food", icon: "🍔" },
  { id: 6, type: "debit", title: "Netflix Subscription", merchant: "Netflix", amount: 649, date: "2026-03-20", category: "Entertainment", icon: "🎬" },
  { id: 7, type: "debit", title: "Uber Ride", merchant: "Uber India", amount: 320, date: "2026-03-19", category: "Travel", icon: "🚗" },
  { id: 8, type: "debit", title: "Swiggy Instamart", merchant: "Swiggy", amount: 920, date: "2026-03-17", category: "Food", icon: "🛍️" },
  { id: 9, type: "credit", title: "Cashback Reward", merchant: "NexusBank", amount: 450, date: "2026-03-15", category: "Rewards", icon: "🎁" },
  { id: 10, type: "debit", title: "Airtel Recharge", merchant: "Airtel", amount: 399, date: "2026-03-14", category: "Bills", icon: "📱" },
];

/* ── Spending by category (used by Dashboard chart) ── */
export const spendingByCategory = {
  Food: 1600,
  Shopping: 3499,
  Bills: 1649,
  Travel: 320,
  Entertainment: 649,
};

export function BankProvider({ children }) {
  const [balance, setBalance] = useState(124500);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [isLoaded, setIsLoaded] = useState(false);

  const [cibilScore] = useState(762);
  const [rewardPoints] = useState(4820);

  // Initialize: Load secure bank data asynchronously
  useEffect(() => {
    async function loadData() {
      const b = await secureStorage.getItem(BAL_KEY);
      const t = await secureStorage.getItem(TXN_KEY);
      if (b !== null) setBalance(b);
      if (t !== null) setTransactions(t);
      setIsLoaded(true);
    }
    loadData();
  }, []);

  // Sync state to secure AES-256-GCM storage
  useEffect(() => {
    if (!isLoaded) return;
    secureStorage.setItem(BAL_KEY, balance);
    secureStorage.setItem(TXN_KEY, transactions);
  }, [balance, transactions, isLoaded]);

  // INNOVATION: AI Risk Scoring (Heuristic)
  const calculateRisk = useCallback((amount, upiId) => {
    let score = 0;
    // Condition 1: High value transfer (> ₹50,000)
    if (amount > 50000) score += 60;
    // Condition 2: Frequent large transfer (mocked heuristic)
    if (transactions.filter(t => t.amount > 10000).length > 5) score += 20;
    // Condition 3: "External" unknown destinations (mocked)
    if (!upiId.endsWith("@okicici") && !upiId.endsWith("@oksbi")) score += 20;
    return score;
  }, [transactions]);

  /** UPI payment: deduct balance, prepend new transaction */
  const sendMoney = useCallback(({ upiId, amount, note }) => {
    const num = Number(amount);

    // INNOVATION: Automated Trigger based on Risk Score
    const risk = calculateRisk(num, upiId);
    if (risk >= 80) {
      throw new Error(`Critical Risk Detected! Score: ${risk}/100. For your protection, this high-risk transaction requires Video Selfie Verification.`);
    }

    setBalance((prev) => +(prev - num).toFixed(2));
    setTransactions((prev) => [
      {
        id: Date.now(),
        type: "debit",
        title: note || `UPI → ${upiId}`,
        merchant: upiId,
        amount: num,
        date: new Date().toISOString().slice(0, 10),
        category: "UPI",
        icon: "📲",
        risk: risk, // Tagged for audit
      },
      ...prev,
    ]);
  }, [calculateRisk]);

  if (!isLoaded) return null;

  return (
    <BankContext.Provider value={{ balance, transactions, cibilScore, rewardPoints, sendMoney }}>
      {children}
    </BankContext.Provider>
  );
}

export function useBank() {
  return useContext(BankContext);
}
