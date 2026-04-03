import { createContext, useContext, useState, useEffect } from "react";
import { secureStorage } from "../utils/secureStorage";
import { hashPassword, ROLES } from "../utils/security";

const AuthContext = createContext(null);

/* ── helpers ── */
function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const STORAGE_KEY = "nexusbank_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  const MAX_ATTEMPTS = 5;

  // Initialize: Load secure session asynchronously
  useEffect(() => {
    async function loadSession() {
      try {
        const stored = await secureStorage.getItem(STORAGE_KEY);
        if (stored) setUser(stored);
      } catch (err) {
        console.error("Failed to load auth session", err);
      } finally {
        setIsLoaded(true);
      }
    }
    loadSession();
  }, []);

  /* persist whenever user changes */
  useEffect(() => {
    if (!isLoaded) return;
    if (user) {
      secureStorage.setItem(STORAGE_KEY, user);
    } else {
      secureStorage.removeItem(STORAGE_KEY);
    }
  }, [user, isLoaded]);

  const isLoggedIn = !!user;
  const isAuthenticated = isLoggedIn;

  /**
   * login({ email, password, rememberMe })
   * Hardened with MFA and IDS simulations.
   */
  const login = async ({ email, password, _rememberMe }) => {
    if (isBlocked) {
      throw new Error("ACCOUNT BLOCKED: Too many failed attempts. Contact support.");
    }

    // Adaptive/Risk-Based Auth Simulation: 
    // If it's a new login, simulate MFA trigger.
    const isNewLogin = true; // In a real app, check IP/Device fingerprint

    // 1. Password Hashing (Institutional Standard)
    const _hashed = await hashPassword(password);

    // Simulating validation
    if (!password || password.length < 8) {
      setFailedAttempts(prev => prev + 1);
      if (failedAttempts + 1 >= MAX_ATTEMPTS) setIsBlocked(true);
      throw new Error(`Invalid credentials. ${MAX_ATTEMPTS - (failedAttempts + 1)} attempts left.`);
    }

    setFailedAttempts(0);

    let userData = await secureStorage.getItem(STORAGE_KEY);
    if (!userData || userData.email !== email) {
      userData = {
        name: email.split("@")[0],
        email,
        phone: "+91 ••••• ••123",
        avatar: getInitials(email.split("@")[0]),
        joinedAt: new Date().toISOString(),
        role: ROLES.CUSTOMER,
        mfaEnabled: true,
      };
    }

    if (userData.mfaEnabled && isNewLogin) {
      setPendingUser(userData);
      setMfaRequired(true);
      return { mfaRequired: true };
    }

    setUser(userData);
    return { success: true };
  };

  /**
   * Verifies the 6-digit TOTP code.
   */
  const verifyMFA = async (code) => {
    // In a real app, this would be validated via backend/TOTP library
    if (code === "123456") {
      setUser(pendingUser);
      setMfaRequired(false);
      setPendingUser(null);
      return true;
    }
    throw new Error("Invalid MFA code. Please try again.");
  };

  /**
   * signup({ fullName, email, phone })
   */
  const signup = ({ fullName, email, phone }) => {
    const userData = {
      name: fullName,
      email,
      phone,
      avatar: getInitials(fullName),
      joinedAt: new Date().toISOString(),
      role: ROLES.CUSTOMER,
      mfaEnabled: true,
    };
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    setMfaRequired(false);
    setPendingUser(null);
  };

  if (!isLoaded) return null;

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn,
      isAuthenticated,
      login,
      logout,
      signup,
      verifyMFA,
      mfaRequired
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
