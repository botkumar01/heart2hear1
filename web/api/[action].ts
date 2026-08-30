import type { VercelRequest, VercelResponse } from "@vercel/node";
import addAvailabilitySlot from "./_handlers/addAvailabilitySlot.js";
import aiChat from "./_handlers/aiChat.js";
import bookAppointment from "./_handlers/bookAppointment.js";
import browseHelpers from "./_handlers/browseHelpers.js";
import browseProfessionals from "./_handlers/browseProfessionals.js";
import cancelUnpaidAppointment from "./_handlers/cancelUnpaidAppointment.js";
import completeAppointment from "./_handlers/completeAppointment.js";
import completeRegistration from "./_handlers/completeRegistration.js";
import createRazorpayOrder from "./_handlers/createRazorpayOrder.js";
import deleteAiConversation from "./_handlers/deleteAiConversation.js";
import endSession from "./_handlers/endSession.js";
import generateVideoToken from "./_handlers/generateVideoToken.js";
import getProfessionalSlots from "./_handlers/getProfessionalSlots.js";
import getTrainingContent from "./_handlers/getTrainingContent.js";
import linkWallet from "./_handlers/linkWallet.js";
import removeAvailabilitySlot from "./_handlers/removeAvailabilitySlot.js";
import requestHelperSession from "./_handlers/requestHelperSession.js";
import requestWalletNonce from "./_handlers/requestWalletNonce.js";
import respondToSessionRequest from "./_handlers/respondToSessionRequest.js";
import sendLoginNotification from "./_handlers/sendLoginNotification.js";
import sendSessionMessage from "./_handlers/sendSessionMessage.js";
import submitFinalTest from "./_handlers/submitFinalTest.js";
import submitHelperReview from "./_handlers/submitHelperReview.js";
import submitLessonQuiz from "./_handlers/submitLessonQuiz.js";
import submitProfessionalReview from "./_handlers/submitProfessionalReview.js";
import submitProfessionalVerification from "./_handlers/submitProfessionalVerification.js";
import submitReport from "./_handlers/submitReport.js";
import submitStudentVerification from "./_handlers/submitStudentVerification.js";
import submitWellbeingAssessment from "./_handlers/submitWellbeingAssessment.js";
import toggleAvailability from "./_handlers/toggleAvailability.js";
import adminGetPlatformSettings from "./_handlers/admin/getPlatformSettings.js";
import adminListAuditLogs from "./_handlers/admin/listAuditLogs.js";
import adminListReports from "./_handlers/admin/listReports.js";
import adminListSafetyEvents from "./_handlers/admin/listSafetyEvents.js";
import adminListVerificationQueue from "./_handlers/admin/listVerificationQueue.js";
import adminReviewVerification from "./_handlers/admin/reviewVerification.js";
import adminUpdatePlatformSettings from "./_handlers/admin/updatePlatformSettings.js";
import adminUpdateReportStatus from "./_handlers/admin/updateReportStatus.js";
import adminUpdateSafetyEventStatus from "./_handlers/admin/updateSafetyEventStatus.js";

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

/**
 * A single catch-all route for every authenticated endpoint. Vercel's
 * free Hobby plan caps a deployment at 12 Serverless Functions -- this
 * project has 39 logical endpoints, so instead of one file per
 * endpoint (which silently 404s past the limit, exactly what happened
 * here once), every handler lives as a plain function under
 * _handlers/ (never itself routed, same convention as _lib/) and this
 * one dynamic route dispatches by a flat route name.
 *
 * IMPORTANT: this is [action].ts (single bracket), not [...action].ts.
 * Next.js's "[...x]" catch-all spread syntax is NOT honored by plain
 * (non-Next.js) Vercel Node functions -- confirmed the hard way: it
 * silently named the query param literally "...action" (dots and all)
 * instead of spreading path segments into an array. A single [param]
 * only ever matches ONE path segment, so admin endpoints are named as
 * flat single-segment routes ("adminListReports", not "admin/listReports")
 * rather than nested paths -- see web/src/lib/api.ts call sites, which
 * call these flat names directly.
 */
const registry: Record<string, Handler> = {
  "addAvailabilitySlot": addAvailabilitySlot,
  "aiChat": aiChat,
  "bookAppointment": bookAppointment,
  "browseHelpers": browseHelpers,
  "browseProfessionals": browseProfessionals,
  "cancelUnpaidAppointment": cancelUnpaidAppointment,
  "completeAppointment": completeAppointment,
  "completeRegistration": completeRegistration,
  "createRazorpayOrder": createRazorpayOrder,
  "deleteAiConversation": deleteAiConversation,
  "endSession": endSession,
  "generateVideoToken": generateVideoToken,
  "getProfessionalSlots": getProfessionalSlots,
  "getTrainingContent": getTrainingContent,
  "linkWallet": linkWallet,
  "removeAvailabilitySlot": removeAvailabilitySlot,
  "requestHelperSession": requestHelperSession,
  "requestWalletNonce": requestWalletNonce,
  "respondToSessionRequest": respondToSessionRequest,
  "sendLoginNotification": sendLoginNotification,
  "sendSessionMessage": sendSessionMessage,
  "submitFinalTest": submitFinalTest,
  "submitHelperReview": submitHelperReview,
  "submitLessonQuiz": submitLessonQuiz,
  "submitProfessionalReview": submitProfessionalReview,
  "submitProfessionalVerification": submitProfessionalVerification,
  "submitReport": submitReport,
  "submitStudentVerification": submitStudentVerification,
  "submitWellbeingAssessment": submitWellbeingAssessment,
  "toggleAvailability": toggleAvailability,
  "adminGetPlatformSettings": adminGetPlatformSettings,
  "adminListAuditLogs": adminListAuditLogs,
  "adminListReports": adminListReports,
  "adminListSafetyEvents": adminListSafetyEvents,
  "adminListVerificationQueue": adminListVerificationQueue,
  "adminReviewVerification": adminReviewVerification,
  "adminUpdatePlatformSettings": adminUpdatePlatformSettings,
  "adminUpdateReportStatus": adminUpdateReportStatus,
  "adminUpdateSafetyEventStatus": adminUpdateSafetyEventStatus,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const actionParam = req.query.action;
  const actionPath = Array.isArray(actionParam) ? actionParam.join("/") : actionParam;
  const fn = actionPath ? registry[actionPath] : undefined;

  if (!fn) {
    res.status(404).json({ error: "Not found." });
    return;
  }

  await fn(req, res);
}
