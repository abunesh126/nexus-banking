import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * usePageLoad — returns false for DELAY_MS, then true.
 * Resets every time the route changes, creating a per-page skeleton.
 */
const DELAY_MS = 0;

export default function usePageLoad() {
  const { pathname } = useLocation();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const t = setTimeout(() => setLoaded(true), DELAY_MS);
    return () => clearTimeout(t);
  }, [pathname]);

  return loaded;
}
