import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where, type Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";

export interface Appointment {
  id: string;
  clientUid: string;
  professionalUid: string;
  startTime: Timestamp;
  durationMinutes: number;
  feeInr: number;
  status:
    | "PENDING_PAYMENT"
    | "CONFIRMED"
    | "CANCELLED"
    | "COMPLETED"
    | "NO_SHOW"
    | "REFUND_PENDING"
    | "REFUNDED";
  reviewed?: boolean;
}

export function useMyAppointments(as: "client" | "professional") {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAppointments([]);
      setLoading(false);
      return;
    }
    const field = as === "client" ? "clientUid" : "professionalUid";
    const q = query(collection(db, "appointments"), where(field, "==", user.uid), orderBy("startTime", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setAppointments(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Appointment, "id">) })));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [user, as]);

  return { appointments, loading };
}
