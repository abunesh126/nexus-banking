import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { BankProvider } from "./context/BankContext";

import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout     from "./components/MainLayout";

import Login     from "./pages/Login";
import Signup    from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Payments  from "./pages/Payments";
import CIBIL     from "./pages/CIBIL";
import Rewards   from "./pages/Rewards";
import Passbook  from "./pages/Passbook";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BankProvider>
          <Routes>
            {/* ── Public ── */}
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* ── Protected: auth guard → MainLayout → page ── */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/payments"  element={<Payments />} />
                <Route path="/cibil"     element={<CIBIL />} />
                <Route path="/rewards"   element={<Rewards />} />
                <Route path="/passbook"  element={<Passbook />} />
              </Route>
            </Route>

            {/* ── Catch-all ── */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BankProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
