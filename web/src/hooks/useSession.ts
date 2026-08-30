import { useEffect, useState } from "react";
import { doc, onSnapshot, collection, query, orderBy, type Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { SupportSession } from "./useMySessions";

export interface SessionMessage {
  id: string;
  senderUid: string;
  senderRole: "client" | "helper";
  text: string;
  blocked?: boolean;
  createdAt: Timestamp | null;
}

export function useSession(sessionId: string | undefined) {
  const [session, setSession] = useState<SupportSession | null>(null);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setMessages([]);
      setLoading(false);
      return;
    }
    const unsubSession = onSnapshot(doc(db, "supportSessions", sessionId), (snap) => {
      setSession(snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<SupportSession, "id">) }) : null);
      setLoading(false);
    });

    const messagesQuery = query(
      collection(db, "supportSessions", sessionId, "messages"),
      orderBy("createdAt", "asc"),
    );
    const unsubMessages = onSnapshot(messagesQuery, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SessionMessage, "id">) })));
    });

    return () => {
      unsubSession();
      unsubMessages();
    };
  }, [sessionId]);

  return { session, messages, loading };
}
