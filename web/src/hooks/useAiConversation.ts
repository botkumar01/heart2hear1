import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, type Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";

export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  escalated?: boolean;
  createdAt: Timestamp | null;
}

export function useAiConversation() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "aiConversations", user.uid, "messages"),
      orderBy("createdAt", "asc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setMessages(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AiMessage, "id">) })),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [user]);

  return { messages, loading };
}
