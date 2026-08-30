import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where, type Timestamp } from "firebase/firestore";
import { AppShell } from "../../components/layout/AppShell";
import { WalletConnectCard } from "../../components/WalletConnectCard";
import { Card, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Spinner, EmptyState } from "../../components/ui/States";
import { db } from "../../lib/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { useUserProfile } from "../../hooks/useUserProfile";

interface LedgerEntry {
  id: string;
  amountTokens: number;
  status: "PENDING" | "DISTRIBUTED" | "FAILED";
  reason: string;
  createdAt: Timestamp | null;
}
interface TxEntry {
  id: string;
  rewardLedgerId: string;
  txHash: string;
  network: string;
  createdAt: Timestamp | null;
}

const STATUS_TONE = { PENDING: "yellow", DISTRIBUTED: "teal", FAILED: "danger" } as const;

export function RewardsPage() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [txs, setTxs] = useState<TxEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubLedger = onSnapshot(
      query(collection(db, "rewardLedger"), where("helperUid", "==", user.uid), orderBy("createdAt", "desc")),
      (snap) => {
        setLedger(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LedgerEntry, "id">) })));
        setLoading(false);
      },
      () => setLoading(false),
    );
    const unsubTx = onSnapshot(
      query(collection(db, "blockchainTransactions"), where("helperUid", "==", user.uid), orderBy("createdAt", "desc")),
      (snap) => setTxs(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TxEntry, "id">) }))),
    );
    return () => {
      unsubLedger();
      unsubTx();
    };
  }, [user]);

  const totalDistributed = ledger
    .filter((l) => l.status === "DISTRIBUTED")
    .reduce((sum, l) => sum + l.amountTokens, 0);

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold text-ink">Rewards</h1>
      <p className="mt-1 text-ink-muted">
        Heart2Hear reward points on the Sepolia testnet — not an investment, no guaranteed monetary
        value.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <WalletConnectCard linkedAddress={(profile?.walletAddress as string | undefined) ?? null} />
        <Card>
          <CardTitle>Balance</CardTitle>
          <CardDescription className="mt-1">{totalDistributed} H2H distributed on-chain</CardDescription>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="font-display text-lg font-semibold text-ink">History</h2>
        {loading ? (
          <Spinner />
        ) : ledger.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="No rewards yet" description="Rewards are evaluated after a client reviews your session." />
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {ledger.map((entry) => {
              const tx = txs.find((t) => t.rewardLedgerId === entry.id);
              return (
                <div key={entry.id} className="flex items-center justify-between rounded-lg bg-paper-dim px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-ink">{entry.amountTokens} H2H</p>
                    <p className="text-xs text-ink-muted">{entry.reason}</p>
                    {tx && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-teal-600 hover:underline"
                      >
                        View on Sepolia Etherscan
                      </a>
                    )}
                  </div>
                  <Badge tone={STATUS_TONE[entry.status]}>{entry.status}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
