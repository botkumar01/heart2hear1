import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "./_lib/firebaseAdmin.js";
import { withAuth } from "./_lib/http.js";
import { invalidArgument } from "./_lib/errors.js";
import { classifySafety } from "./_lib/safety.js";
import { logSafetyEvent } from "./_lib/safetyEvents.js";
import { askGemini } from "./_lib/gemini.js";
import { enforceRateLimit } from "./_lib/rateLimit.js";

const requestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  language: z.enum(["en", "ta", "hi"]).default("en"),
});

const SAFETY_REPLY: Record<string, string> = {
  en: "It sounds like you might be going through something really serious right now. I'm not able to provide emergency support, but you deserve real, immediate help — please see the safety resources on this screen or reach out to a crisis line or emergency services right away.",
  ta: "இப்போது நீங்கள் மிகவும் கடினமான ஒரு தருணத்தை கடந்து செல்கிறீர்கள் போல் தெரிகிறது. எனக்கு அவசர உதவி வழங்க முடியாது — இந்தத் திரையில் உள்ள பாதுகாப்பு வளங்களைப் பார்க்கவும் அல்லது உடனடியாக அவசர சேவைகளைத் தொடர்பு கொள்ளவும்.",
  hi: "ऐसा लग रहा है कि आप अभी किसी बहुत कठिन स्थिति से गुज़र रहे हैं। मैं आपातकालीन सहायता नहीं दे सकता — कृपया इस स्क्रीन पर दिए गए सुरक्षा संसाधन देखें या तुरंत आपातकालीन सेवाओं से संपर्क करें।",
};

/** Bounds how much history/cost a single conversation can accumulate. */
const HISTORY_LIMIT = 10;

export default withAuth(async (req, res, decoded) => {
  // Gemini calls cost money and a runaway client loop shouldn't be able
  // to rack up an unbounded bill.
  await enforceRateLimit({ uid: decoded.uid, action: "aiChat", limit: 20, windowSeconds: 300 });

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((issue) => issue.message).join("; "));
  }
  const { message, language } = parsed.data;

  const messagesRef = db().collection("aiConversations").doc(decoded.uid).collection("messages");

  const inputCheck = classifySafety(message);

  if (inputCheck.severity === "CRISIS") {
    await logSafetyEvent({ uid: decoded.uid, source: "ai_chat", result: inputCheck, excerpt: message });

    const reply = SAFETY_REPLY[language] ?? SAFETY_REPLY.en;
    await messagesRef.add({ role: "user", text: message, createdAt: FieldValue.serverTimestamp() });
    await messagesRef.add({
      role: "assistant",
      text: reply,
      escalated: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    res.status(200).json({ reply, escalate: true });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const historySnap = await messagesRef.orderBy("createdAt", "desc").limit(HISTORY_LIMIT).get();
  const history = historySnap.docs
    .map((d) => d.data() as { role: "user" | "assistant"; text: string })
    .reverse();

  let reply: string;
  try {
    reply = await askGemini({ apiKey, language, history, message });
  } catch (err) {
    console.error("Gemini call failed", err);
    reply =
      language === "hi"
        ? "माफ़ करें, अभी जवाब देने में दिक्कत हो रही है। कृपया थोड़ी देर बाद फिर से कोशिश करें।"
        : language === "ta"
          ? "மன்னிக்கவும், இப்போது பதிலளிக்க முடியவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்."
          : "Sorry, I'm having trouble responding right now. Please try again in a moment.";
  }

  const outputCheck = classifySafety(reply);
  if (outputCheck.severity !== "NONE") {
    // The reply itself tripped a guardrail category (e.g. sounded
    // diagnostic) — don't block it (a broken response is worse than an
    // imperfect one), but flag it so an admin can review the model's
    // behavior.
    await logSafetyEvent({ uid: decoded.uid, source: "ai_chat", result: outputCheck, excerpt: reply });
  }

  await messagesRef.add({ role: "user", text: message, createdAt: FieldValue.serverTimestamp() });
  await messagesRef.add({ role: "assistant", text: reply, createdAt: FieldValue.serverTimestamp() });

  res.status(200).json({ reply, escalate: false });
});
