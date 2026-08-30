import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where, type Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";

export interface SupportSession {
  id: string;
  clientUid: string;
  helperUid: string;
  status: "REQUESTED" | "ACTIVE" | "COMPLETED" | "CANCELLED" | "SAFETY_ESCALATED" | "REVIEWED";
  createdAt: Timestamp | null;
  acceptedAt?: Timestamp | null;
  completedAt?: Timestamp | null;
}

/** as: which side of the session the current user is on. */
export function useMySessions(as: "client" | "helper") {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SupportSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }
    const field = as === "client" ? "clientUid" : "helperUid";
    const q = query(collection(db, "supportSessions"), where(field, "==", user.uid), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setSessions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SupportSession, "id">) })));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [user, as]);

  return { sessions, loading };
}
