import { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "../lib/apiClient";

const AuthContext = createContext(null);

function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

/**
 * Hardened AuthProvider
 * ZERO-TRUST: Manages identity entirely via proxied Node.js calls.
 * No direct Supabase SDK library usage.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      // 1. Validate Device Binding (Phase 9)
      const currentFingerprint = btoa(navigator.userAgent + screen.width + screen.height);
      const storedFingerprint = localStorage.getItem('nexus_fingerprint');

      const sessionStr = localStorage.getItem('nexus_session');
      
      if (sessionStr) {
        if (storedFingerprint && storedFingerprint !== currentFingerprint) {
          console.warn("SECURITY_ALERT: Device fingerprint mismatch.");
          logout();
          setIsLoaded(true);
          return;
        }

        try {
          const session = JSON.parse(sessionStr);
          if (session?.user) {
            await loadUserProfile();
          }
        } catch (err) {
          localStorage.removeItem('nexus_session');
        }
      } else {
        // First time? Set fingerprint
        localStorage.setItem('nexus_fingerprint', currentFingerprint);
      }
      setIsLoaded(true);
    };

    initialize();
  }, []);

  async function loadUserProfile() {
    try {
      // PROXIED: Inferred from Token in apiClient
      const profile = await apiClient.get('/auth/profile');
      setUser({
        id: profile.id,
        name: profile.full_name || "User",
        email: profile.email,
        phone: profile.phone || "",
        avatar: profile.avatar || getInitials(profile.full_name),
        role: profile.role || "customer",
        mfaEnabled: profile.mfa_enabled ?? true,
        cibilScore: profile.cibil_score ?? 762,
        joinedAt: profile.created_at,
      });
    } catch (err) {
      console.error("Profile load failed via proxy", err);
      setUser(null);
      localStorage.removeItem('nexus_session');
    }
  }

  const login = async ({ email, password }) => {
    try {
      // 1. Authenticate via Node.js Proxy
      const data = await apiClient.post('/auth/login', { email, password });
      
      // 2. Clear manual session storage
      if (data.session) {
        localStorage.setItem('nexus_session', JSON.stringify(data.session));
        await loadUserProfile();
        return { success: true };
      }
      throw new Error("Invalid Session Payload");
    } catch (err) {
      return { error: err.message };
    }
  };

  const signup = async ({ fullName, email, phone, password }) => {
    try {
      await apiClient.post('/auth/register', { fullName, email, phone, password });
      return { success: true, message: "Verification required." };
    } catch (err) {
      return { error: err.message };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('nexus_session');
      setUser(null);
    }
  };

  const resetPassword = async (email) => {
    await apiClient.post('/auth/reset-password', { email });
  };

  const isLoggedIn = !!user;

  if (!isLoaded) return null;

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn,
      isAuthenticated: isLoggedIn,
      login,
      logout,
      signup,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
