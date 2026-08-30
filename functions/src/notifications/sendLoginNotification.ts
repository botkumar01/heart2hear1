import { onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import { auth } from "../lib/firebaseAdmin";

const resendApiKey = defineSecret("RESEND_API_KEY");

// Sending domain is a placeholder until a real domain is verified in Resend
// (see docs/RESEND_SETUP.md, produced when this account is created).
const FROM_ADDRESS = "Heart2Hear <security@heart2hear.app>";

/**
 * Client calls this once, right after a successful sign-in (not on every
 * token refresh). Best-effort: a failed send never blocks login.
 */
export const sendLoginNotification = onCall({ secrets: [resendApiKey] }, async (request) => {
  if (!request.auth) {
    return { sent: false };
  }

  const user = await auth.getUser(request.auth.uid);
  if (!user.email) {
    return { sent: false };
  }

  const deviceInfo =
    typeof request.data?.deviceInfo === "string" ? request.data.deviceInfo.slice(0, 200) : "Unknown device";
  const approxTime = new Date().toUTCString();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey.value()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: user.email,
        subject: "New sign-in to your Heart2Hear account",
        html: `
          <p>Hi${user.displayName ? " " + user.displayName : ""},</p>
          <p>We noticed a new sign-in to your Heart2Hear account.</p>
          <ul>
            <li><strong>Time:</strong> ${approxTime}</li>
            <li><strong>Device:</strong> ${deviceInfo}</li>
          </ul>
          <p>If this was you, no action is needed. If you don't recognize this sign-in,
          reset your password immediately and contact support.</p>
          <p>&mdash; Heart2Hear Security</p>
        `,
      }),
    });

    if (!res.ok) {
      logger.error("Resend login notification failed", { status: res.status, body: await res.text() });
      return { sent: false };
    }

    return { sent: true };
  } catch (err) {
    logger.error("Resend login notification threw", err);
    return { sent: false };
  }
});
