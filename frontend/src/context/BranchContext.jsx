import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "./AuthContext";

const BranchContext = createContext(null);

const STORAGE_KEY = "pp_branch";

/**
 * Replaces getActiveBranch() / setActiveBranch() / getActiveBranchAsync()
 * from app.js. Resolution order (same as original):
 *   1. ?branch= query param (also persists it)
 *   2. sessionStorage
 *   3. logged-in student's own branch
 *   4. null -> caller redirects to Home to pick one
 */
export function BranchProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [branch, setBranchState] = useState(() => {
    const fromUrl = searchParams.get("branch");
    if (fromUrl) return fromUrl;
    return sessionStorage.getItem(STORAGE_KEY) || null;
  });

  const setBranch = useCallback(
    (b) => {
      setBranchState(b);
      if (b) {
        sessionStorage.setItem(STORAGE_KEY, b);
        const next = new URLSearchParams(searchParams);
        next.set("branch", b);
        setSearchParams(next, { replace: true });
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    },
    [searchParams, setSearchParams]
  );

  // Sync from URL param changes (e.g. direct link with ?branch=CSE)
  useEffect(() => {
    const fromUrl = searchParams.get("branch");
    if (fromUrl && fromUrl !== branch) {
      setBranchState(fromUrl);
      sessionStorage.setItem(STORAGE_KEY, fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Fall back to the logged-in student's registered branch if nothing else is set.
  useEffect(() => {
    if (!branch && user?.role === "student" && user?.branch) {
      setBranch(user.branch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const value = useMemo(() => ({ branch, setBranch }), [branch, setBranch]);

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within a BranchProvider");
  return ctx;
}
