import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { Card, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Alert } from "../../components/ui/Alert";
import { Spinner, EmptyState } from "../../components/ui/States";
import { callApi, ApiRequestError } from "../../lib/api";
import { loadRazorpayScript } from "../../lib/loadRazorpay";
import { useAuth } from "../../contexts/AuthContext";

interface Professional {
  uid: string;
  displayName: string;
  qualification: string | null;
  professionalCategory: string | null;
  yearsOfExperience: number | null;
  specializations: string[];
  consultationLanguages: string[];
  consultationFeeInr: number | null;
  averageRating: number | null;
  ratingCount: number;
}

interface Slot {
  slotId: string;
  startTime: string;
  durationMinutes: number;
}

export function ProfessionalDirectoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUid, setExpandedUid] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null);

  useEffect(() => {
    callApi<{ professionals: Professional[] }>("browseProfessionals")
      .then((data) => setProfessionals(data.professionals))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Couldn't load professionals."))
      .finally(() => setLoading(false));
  }, []);

  async function expand(uid: string) {
    if (expandedUid === uid) {
      setExpandedUid(null);
      return;
    }
    setExpandedUid(uid);
    setSlotsLoading(true);
    try {
      const data = await callApi<{ slots: Slot[] }>("getProfessionalSlots", { professionalUid: uid });
      setSlots(data.slots);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't load availability.");
    } finally {
      setSlotsLoading(false);
    }
  }

  async function book(professionalUid: string, slotId: string, feeInr: number, displayName: string) {
    setBookingSlotId(slotId);
    setError(null);
    try {
      const { appointmentId } = await callApi<{ appointmentId: string }>("bookAppointment", {
        professionalUid,
        slotId,
      });

      if (feeInr === 0) {
        // Free consultation — nothing to pay, appointment is already
        // PENDING_PAYMENT though, so still route it through confirmation.
        navigate("/client/appointments");
        return;
      }

      const order = await callApi<{ orderId: string; amountInr: number; keyId: string }>("createRazorpayOrder", {
        appointmentId,
      });

      await loadRazorpayScript();

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: Math.round(order.amountInr * 100),
        currency: "INR",
        name: "Heart2Hear",
        description: `Consultation with ${displayName}`,
        order_id: order.orderId,
        prefill: { email: user?.email ?? undefined },
        handler: () => {
          navigate("/client/appointments");
        },
        modal: {
          ondismiss: async () => {
            await callApi("cancelUnpaidAppointment", { appointmentId }).catch(() => undefined);
          },
        },
      });
      razorpay.open();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Couldn't start booking. Please try again.");
    } finally {
      setBookingSlotId(null);
    }
  }

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-semibold text-ink">Find a Professional</h1>
      <p className="mt-1 text-ink-muted">Verified psychiatrists and mental-health professionals.</p>

      {error && (
        <div className="mt-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : professionals.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No verified professionals yet" />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {professionals.map((p) => (
            <Card key={p.uid}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>Dr. {p.displayName}</CardTitle>
                    <Badge tone="teal">Verified</Badge>
                  </div>
                  <CardDescription className="mt-1">
                    {p.qualification} · {p.yearsOfExperience} yrs experience
                  </CardDescription>
                  <p className="mt-1 text-xs text-ink-muted">{p.specializations.join(", ")}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-ink">₹{p.consultationFeeInr}</p>
                  {p.averageRating !== null && (
                    <p className="text-xs text-ink-muted">
                      ★ {p.averageRating.toFixed(1)} ({p.ratingCount})
                    </p>
                  )}
                </div>
              </div>

              <Button variant="secondary" size="sm" className="mt-3" onClick={() => expand(p.uid)}>
                {expandedUid === p.uid ? "Hide slots" : "View available slots"}
              </Button>

              {expandedUid === p.uid && (
                <div className="mt-3 space-y-2">
                  {slotsLoading ? (
                    <Spinner />
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-ink-muted">No open slots right now.</p>
                  ) : (
                    slots.map((s) => (
                      <div key={s.slotId} className="flex items-center justify-between rounded-md bg-paper-dim px-3 py-2 text-sm">
                        <span>{new Date(s.startTime).toLocaleString()}</span>
                        <Button
                          size="sm"
                          isLoading={bookingSlotId === s.slotId}
                          onClick={() => book(p.uid, s.slotId, p.consultationFeeInr ?? 0, p.displayName)}
                        >
                          Book · ₹{p.consultationFeeInr}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
