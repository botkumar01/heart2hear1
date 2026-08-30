import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { useAuth } from "../../contexts/AuthContext";
import { callApi, ApiRequestError } from "../../lib/api";
import { Alert } from "../../components/ui/Alert";
import { Spinner } from "../../components/ui/States";
import { Button } from "../../components/ui/Button";

export function VideoCallPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { role, user } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const homePath = role === "professional" ? "/professional/appointments" : "/client/appointments";

  useEffect(() => {
    if (!appointmentId || !containerRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const data = await callApi<{ token: string; appId: number; roomId: string; userId: string }>(
          "generateVideoToken",
          { appointmentId },
        );
        if (cancelled || !containerRef.current) return;

        // Token is minted server-side (generateVideoToken.ts) using the
        // ZEGOCLOUD server secret — never exposed to the client.
        const zp = ZegoUIKitPrebuilt.create(data.token);
        zp.joinRoom({
          container: containerRef.current,
          scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
          showScreenSharingButton: true,
          showPreJoinView: true,
          onLeaveRoom: () => navigate(homePath),
        });
        setLoading(false);
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "Couldn't start the video call.");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, user?.uid]);

  return (
    <div className="flex min-h-dvh flex-col bg-ink">
      {error && (
        <div className="p-4">
          <Alert tone="danger">
            {error}
            <div className="mt-2">
              <Button size="sm" variant="secondary" onClick={() => navigate(homePath)}>
                Back
              </Button>
            </div>
          </Alert>
        </div>
      )}
      {loading && !error && <Spinner label="Connecting…" />}
      <div ref={containerRef} className="min-h-dvh w-full" />
    </div>
  );
}
