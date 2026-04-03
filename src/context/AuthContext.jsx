import { createContext, useContext, useState, useEffect } from "react";
import { secureStorage } from "../utils/secureStorage";

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

  const MAX_ATTEMPTS = 3;

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
   */
  const login = async ({ email, password, _rememberMe }) => {
    if (isBlocked) {
      throw new Error("Security Alert: This IP address is blocked due to multiple failed login attempts.");
    }

    // IDS Simulation: If password is empty or "wrong" (simulated), increment failed count
    if (!password || password.length < 4) {
      const newCount = failedAttempts + 1;
      setFailedAttempts(newCount);
      if (newCount >= MAX_ATTEMPTS) {
        setIsBlocked(true);
      }
      throw new Error(`Invalid credentials. ${MAX_ATTEMPTS - newCount} attempts remaining before IP block.`);
    }

    // Reset IDS on success
    setFailedAttempts(0);

    let userData = await secureStorage.getItem(STORAGE_KEY);
    if (!userData || userData.email !== email) {
      userData = {
        name: email.split("@")[0],
        email,
        phone: "",
        avatar: getInitials(email.split("@")[0]),
        joinedAt: new Date().toISOString(),
        role: "user",
      };
    }
    setUser(userData);
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
      role: "user",
    };
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  if (!isLoaded) return null; // Or a splash screen

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isAuthenticated, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
