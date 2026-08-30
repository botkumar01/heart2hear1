import { auth } from "./_lib/firebaseAdmin";
import { withAuth } from "./_lib/http";

// Sending domain is a placeholder until a real domain is verified in Resend
// (see docs/RESEND_SETUP.md).
const FROM_ADDRESS = "Heart2Hear <onboarding@resend.dev>";

/**
 * Client calls this once, right after a successful sign-in (not on every
 * token refresh). Best-effort: a failed send never blocks login, and this
 * always responds 200 so the frontend never has to handle it as an error.
 */
export default withAuth(async (req, res, decoded) => {
  const user = await auth.getUser(decoded.uid);
  if (!user.email || !process.env.RESEND_API_KEY) {
    res.status(200).json({ sent: false });
    return;
  }

  const deviceInfo =
    typeof req.body?.deviceInfo === "string" ? req.body.deviceInfo.slice(0, 200) : "Unknown device";
  const approxTime = new Date().toUTCString();

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
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

    if (!resendRes.ok) {
      console.error("Resend login notification failed", resendRes.status, await resendRes.text());
      res.status(200).json({ sent: false });
      return;
    }

    res.status(200).json({ sent: true });
  } catch (err) {
    console.error("Resend login notification threw", err);
    res.status(200).json({ sent: false });
  }
});
