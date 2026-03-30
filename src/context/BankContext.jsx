import { createContext, useContext, useState, useCallback } from "react";

const BankContext = createContext(null);

/* ── 10 rich mock transactions ── */
const INITIAL_TRANSACTIONS = [
  { id: 1,  type: "credit", title: "Salary Credit",      merchant: "Infosys Ltd.",  amount: 124500, date: "2026-03-28", category: "Income",        icon: "💼" },
  { id: 2,  type: "debit",  title: "Amazon Shopping",    merchant: "Amazon India",  amount: 3499,   date: "2026-03-27", category: "Shopping",       icon: "🛒" },
  { id: 3,  type: "debit",  title: "Electricity Bill",   merchant: "BESCOM",        amount: 1250,   date: "2026-03-25", category: "Bills",          icon: "⚡" },
  { id: 4,  type: "credit", title: "Freelance Payment",  merchant: "Upwork Inc.",   amount: 18000,  date: "2026-03-22", category: "Income",        icon: "💻" },
  { id: 5,  type: "debit",  title: "Zomato Order",       merchant: "Zomato",        amount: 680,    date: "2026-03-21", category: "Food",           icon: "🍔" },
  { id: 6,  type: "debit",  title: "Netflix Subscription",merchant: "Netflix",      amount: 649,    date: "2026-03-20", category: "Entertainment",  icon: "🎬" },
  { id: 7,  type: "debit",  title: "Uber Ride",          merchant: "Uber India",    amount: 320,    date: "2026-03-19", category: "Travel",         icon: "🚗" },
  { id: 8,  type: "debit",  title: "Swiggy Instamart",   merchant: "Swiggy",        amount: 920,    date: "2026-03-17", category: "Food",           icon: "🛍️" },
  { id: 9,  type: "credit", title: "Cashback Reward",    merchant: "NexusBank",     amount: 450,    date: "2026-03-15", category: "Rewards",        icon: "🎁" },
  { id: 10, type: "debit",  title: "Airtel Recharge",    merchant: "Airtel",        amount: 399,    date: "2026-03-14", category: "Bills",          icon: "📱" },
];

/* ── Spending by category (used by Dashboard chart) ── */
export const spendingByCategory = {
  Food:          1600,
  Shopping:      3499,
  Bills:         1649,
  Travel:         320,
  Entertainment:  649,
};

export function BankProvider({ children }) {
  const [balance,      setBalance]      = useState(124500);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [cibilScore]                    = useState(762);
  const [rewardPoints]                  = useState(4820);

  /** UPI payment: deduct balance, prepend new transaction */
  const sendMoney = useCallback(({ upiId, amount, note }) => {
    const num = Number(amount);
    setBalance((prev) => +(prev - num).toFixed(2));
    setTransactions((prev) => [
      {
        id:       Date.now(),
        type:     "debit",
        title:    note || `UPI → ${upiId}`,
        merchant: upiId,
        amount:   num,
        date:     new Date().toISOString().slice(0, 10),
        category: "UPI",
        icon:     "📲",
      },
      ...prev,
    ]);
  }, []);

  return (
    <BankContext.Provider value={{ balance, transactions, cibilScore, rewardPoints, sendMoney }}>
      {children}
    </BankContext.Provider>
  );
}

export function useBank() {
  return useContext(BankContext);
}
