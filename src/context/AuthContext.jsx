import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getProfile, writeAuditLog } from "../lib/database";
import { generateUserKeyPair } from "../utils/security";
import { secureStorage } from "../utils/secureStorage";

const AuthContext = createContext(null);

/* ── helpers ── */
function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);          // Our app-level user object
  const [session, setSession] = useState(null);     // Supabase session
  const [userKeys, setUserKeys] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  const MAX_ATTEMPTS = 5;

  /* ── Brute Force State Recovery ── */
  useEffect(() => {
    const recovery = async () => {
      const attempts = await secureStorage.getItem("_nexus_auth_attempts") || 0;
      const blocked = await secureStorage.getItem("_nexus_auth_blocked") || false;
      setFailedAttempts(attempts);
      setIsBlocked(blocked);
    };
    recovery();
  }, []);

  /**
   * Institutional RSA Implementation: Ensures every user has a persistent 
   * cryptographic identity for signing operations.
   */
  async function initializeUserKeys(userId) {
    if (!userId) return;
    try {
      const storedKeys = secureStorage.getItem(`_nexus_keys_${userId}`);
      if (storedKeys) {
        setUserKeys(storedKeys);
      } else {
        const newKeys = await generateUserKeyPair();
        secureStorage.setItem(`_nexus_keys_${userId}`, newKeys);
        setUserKeys(newKeys);
        writeAuditLog(userId, "CRYPTO_KEYPAIR_GENERATED", { alg: "RSA-PSS", bits: 4096 });
      }
    } catch (err) {
      console.error("Crypto Key Init Failed:", err);
    }
  }

  /* ── Initialize: Listen for Supabase auth changes ── */
  useEffect(() => {
    // 1. Get the current session with a timeout fallback
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        console.warn("Auth initialization timed out. Proceeding...");
        setIsLoaded(true);
      }
    }, 5000);

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        await loadUserProfile(currentSession.user.id, currentSession.user.email);
      }
      clearTimeout(timeout);
      setIsLoaded(true);
    }).catch(err => {
      console.error("Auth initialization error:", err);
      clearTimeout(timeout);
      setIsLoaded(true);
    });

    // 2. Listen for future auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        if (event === "SIGNED_IN" && newSession?.user) {
          await loadUserProfile(newSession.user.id, newSession.user.email);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Load the user's profile from the Supabase `profiles` table.
   */
  async function loadUserProfile(userId, fallbackEmail) {
    if (!userId) return;
    try {
      const profile = await getProfile(userId).catch(() => null);
      setUser({
        id: userId,
        name: profile?.full_name || fallbackEmail?.split("@")[0] || "Guest User",
        email: profile?.email || fallbackEmail || "guest@nexusbank.io",
        phone: profile?.phone || "+91 98765 43210",
        avatar: profile?.avatar || getInitials(profile?.full_name || "GU"),
        role: profile?.role || "customer",
        mfaEnabled: profile?.mfa_enabled ?? true,
        cibilScore: profile?.cibil_score ?? 762,
        joinedAt: profile?.created_at || new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Using offline user profile.");
      setUser({
        id: userId,
        name: fallbackEmail?.split("@")[0] || "Nexus User",
        email: fallbackEmail || "",
        phone: "+91 00000 00000",
        avatar: "👤",
        role: "customer",
        mfaEnabled: true,
        cibilScore: 762,
      });
    }
  }

  const isLoggedIn = !!user;
  const isAuthenticated = !!user && !!session;

  /**
   * login({ email, password })
   * Uses Supabase Auth — hardened with IPS brute-force protection and MFA simulation.
   */
  const login = async ({ email, password }) => {
    if (isBlocked) {
      throw new Error("ACCOUNT BLOCKED: Too many failed attempts. Contact support.");
    }

    // 1. Attempt Supabase Auth sign-in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      await secureStorage.setItem("_nexus_auth_attempts", newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        setIsBlocked(true);
        await secureStorage.setItem("_nexus_auth_blocked", true);
        writeAuditLog(null, "BRUTE_FORCE_LOCKOUT", { email, attempts: newAttempts });
        throw new Error("ACCOUNT BLOCKED: Too many failed attempts. Contact support.");
      }
      throw new Error(`Invalid credentials. ${MAX_ATTEMPTS - newAttempts} attempts left.`);
    }

    setFailedAttempts(0);
    await secureStorage.setItem("_nexus_auth_attempts", 0);
    await secureStorage.setItem("_nexus_auth_blocked", false);

    // 2. Load the user's profile
    const authUser = data.user;
    let profile;
    try {
      profile = await getProfile(authUser.id);
    } catch {
      profile = null;
    }

    const userData = {
      id: authUser.id,
      name: profile?.full_name || email.split("@")[0],
      email: authUser.email,
      phone: profile?.phone || "",
      avatar: profile?.avatar || getInitials(email.split("@")[0]),
      role: profile?.role || "customer",
      mfaEnabled: profile?.mfa_enabled ?? true,
      cibilScore: profile?.cibil_score ?? 762,
      joinedAt: profile?.created_at,
    };

    setUser(userData);
    await initializeUserKeys(authUser.id);

    // Audit log
    writeAuditLog(authUser.id, "USER_LOGIN", { email, method: "password" });

    return { success: true };
  };

  /**
   * signup({ fullName, email, phone, password })
   * Creates a new user in Supabase Auth.
   * The database trigger automatically creates profile, account, rewards, card, and transactions.
   */
  const signup = async ({ fullName, email, phone, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    // If email confirmation is disabled in Supabase, the user is immediately signed in.
    // The trigger will auto-create all records.
    const authUser = data.user;

    if (authUser) {
      // Small delay to let the trigger complete
      await new Promise((r) => setTimeout(r, 1000));

      const userData = {
        id: authUser.id,
        name: fullName,
        email,
        phone,
        avatar: getInitials(fullName),
        role: "customer",
        mfaEnabled: true,
        cibilScore: 762,
        joinedAt: new Date().toISOString(),
      };

      setUser(userData);
      await initializeUserKeys(authUser.id);

      // Audit log
      writeAuditLog(authUser.id, "USER_SIGNUP", { email, method: "supabase_auth" });
    }

    return data;
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/login',
    });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    try {
      if (user?.id) {
        writeAuditLog(user.id, "USER_LOGOUT", {});
      }
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase signOut error:", err);
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  // Don't render a blank screen while initializing
  if (!isLoaded) return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-accent border-t-transparent animate-spin rounded-full"></div>
    </div>
  );

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userKeys,
      isLoggedIn,
      isAuthenticated,
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
