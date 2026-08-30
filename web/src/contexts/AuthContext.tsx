import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../lib/firebase";
import type { Role } from "../lib/roles";

interface AuthState {
  user: User | null;
  role: Role | null;
  /** True until the very first auth-state check resolves. */
  initializing: boolean;
  /** Re-reads the ID token, picking up a role claim set moments ago. */
  refreshRole: () => Promise<Role | null>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [initializing, setInitializing] = useState(true);

  const readRole = useCallback(async (firebaseUser: User, forceRefresh = false) => {
    const tokenResult = await firebaseUser.getIdTokenResult(forceRefresh);
    const claimedRole = tokenResult.claims.role;
    return typeof claimedRole === "string" ? (claimedRole as Role) : null;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setRole(await readRole(firebaseUser));
      } else {
        setRole(null);
      }
      setInitializing(false);
    });
    return unsubscribe;
  }, [readRole]);

  const refreshRole = useCallback(async () => {
    if (!auth.currentUser) return null;
    const next = await readRole(auth.currentUser, true);
    setRole(next);
    return next;
  }, [readRole]);

  const value = useMemo(
    () => ({ user, role, initializing, refreshRole }),
    [user, role, initializing, refreshRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
