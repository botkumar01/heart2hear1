import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, getDoc, type Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Card, CardTitle, CardDescription } from "../components/ui/Card";
import { Spinner, EmptyState } from "../components/ui/States";
import { Badge } from "../components/ui/Badge";

interface Certificate {
  certificateId: string;
  helperUid: string;
  level: number;
  levelName: string;
  issuedAt: Timestamp | null;
}

export function CertificateVerificationPage() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [helperName, setHelperName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!certificateId) return;
    (async () => {
      const certSnap = await getDoc(doc(db, "certificates", certificateId));
      if (certSnap.exists()) {
        const cert = certSnap.data() as Certificate;
        setCertificate(cert);
        // Best-effort — the public certificate is still valid even if this fails
        // (e.g. the helper's own profile isn't publicly readable).
        try {
          const userSnap = await getDoc(doc(db, "users", cert.helperUid));
          setHelperName((userSnap.data()?.displayName as string) ?? null);
        } catch {
          setHelperName(null);
        }
      }
      setLoading(false);
    })();
  }, [certificateId]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-4 block text-center font-display text-lg font-semibold text-ink">
          Heart2Hear
        </Link>

        {loading ? (
          <Spinner />
        ) : !certificate ? (
          <EmptyState title="Certificate not found" description="This certificate ID doesn't exist or was revoked." />
        ) : (
          <Card className="text-center">
            <Badge tone="teal">Verified Certificate</Badge>
            <CardTitle className="mt-3 text-xl">{certificate.levelName}</CardTitle>
            <CardDescription className="mt-2">
              Heart2Hear Volunteer/Helper Achievement Certificate
              {helperName && (
                <>
                  <br />
                  Awarded to <strong>{helperName}</strong>
                </>
              )}
            </CardDescription>
            <p className="mt-4 text-xs text-ink-faint">
              Certificate ID: {certificate.certificateId}
              <br />
              {certificate.issuedAt && `Issued ${new Date(certificate.issuedAt.toMillis()).toLocaleDateString()}`}
            </p>
            <p className="mt-4 text-xs text-ink-faint">
              This certifies platform-based training/session milestones — it is not a government-
              recognized professional qualification.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
