import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

/* ── helpers ── */
function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const STORAGE_KEY = "nexusbank_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const isLoggedIn = !!user;
  // keep legacy `isAuthenticated` alias so Sidebar/Navbar still work
  const isAuthenticated = isLoggedIn;

  /* persist whenever user changes */
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  /**
   * login({ email, password, rememberMe })
   * In a real app this would hit an API; here we accept any credentials.
   */
  const login = ({ email, rememberMe }) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let userData = stored ? JSON.parse(stored) : null;

    // If no existing user found for this email, create a minimal one
    if (!userData || userData.email !== email) {
      userData = {
        name: email.split("@")[0],
        email,
        phone: "",
        avatar: getInitials(email.split("@")[0]),
        joinedAt: new Date().toISOString(),
      };
    }

    if (!rememberMe) {
      // session-only: don't persist across hard refreshes
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    }

    setUser(userData);
  };

  /**
   * signup({ fullName, email, phone, password })
   */
  const signup = ({ fullName, email, phone }) => {
    const userData = {
      name: fullName,
      email,
      phone,
      avatar: getInitials(fullName),
      joinedAt: new Date().toISOString(),
    };
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isAuthenticated, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
