import { useState } from "react";
import { Card, CardTitle, CardDescription } from "./ui/Card";
import { Button } from "./ui/Button";
import { Alert } from "./ui/Alert";
import { callApi, ApiRequestError } from "../lib/api";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

/**
 * Connects MetaMask and proves ownership via a signed nonce (spec §36).
 * Only ever sends the wallet ADDRESS to the backend — the signature
 * proves control of the private key without that key ever leaving the
 * user's wallet, let alone reaching this app.
 */
export function WalletConnectCard({ linkedAddress }: { linkedAddress?: string | null }) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setConnecting(true);
    setError(null);
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask isn't installed. Install it from metamask.io, then try again.");
      }

      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
      const address = accounts[0];
      if (!address) throw new Error("No wallet account was selected.");

      const { nonce } = await callApi<{ nonce: string }>("requestWalletNonce");

      const signature = (await window.ethereum.request({
        method: "personal_sign",
        params: [nonce, address],
      })) as string;

      await callApi("linkWallet", { address, signature });
      window.location.reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : (err as Error).message || "Couldn't connect your wallet.");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <Card>
      <CardTitle>Wallet</CardTitle>
      {linkedAddress ? (
        <CardDescription className="mt-1 break-all">
          Connected: {linkedAddress}
        </CardDescription>
      ) : (
        <>
          <CardDescription className="mt-1">
            Connect a MetaMask wallet to receive Sepolia testnet reward tokens. Never asks for a
            seed phrase — only a signature proving you own the address.
          </CardDescription>
          {error && (
            <div className="mt-3">
              <Alert tone="danger">{error}</Alert>
            </div>
          )}
          <Button className="mt-4" onClick={connect} isLoading={connecting}>
            Connect MetaMask
          </Button>
        </>
      )}
    </Card>
  );
}
