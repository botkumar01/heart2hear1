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
import admin_getPlatformSettings from "./_handlers/admin/getPlatformSettings.js";
import admin_listAuditLogs from "./_handlers/admin/listAuditLogs.js";
import admin_listReports from "./_handlers/admin/listReports.js";
import admin_listSafetyEvents from "./_handlers/admin/listSafetyEvents.js";
import admin_listVerificationQueue from "./_handlers/admin/listVerificationQueue.js";
import admin_reviewVerification from "./_handlers/admin/reviewVerification.js";
import admin_updatePlatformSettings from "./_handlers/admin/updatePlatformSettings.js";
import admin_updateReportStatus from "./_handlers/admin/updateReportStatus.js";
import admin_updateSafetyEventStatus from "./_handlers/admin/updateSafetyEventStatus.js";

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

/**
 * A single catch-all route for every authenticated endpoint. Vercel's
 * free Hobby plan caps a deployment at 12 Serverless Functions -- this
 * project has 39 logical endpoints, so instead of one file per
 * endpoint (which silently 404s past the limit, exactly what happened
 * here once), every handler lives as a plain function under
 * _handlers/ (never itself routed, same convention as _lib/) and this
 * one dynamic route ([...action].ts matches any path under /api/)
 * dispatches by the URL path -- so /api/aiChat and
 * /api/admin/listVerificationQueue keep working exactly as before, with
 * zero frontend changes, from ONE actual serverless function.
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
  "admin/getPlatformSettings": admin_getPlatformSettings,
  "admin/listAuditLogs": admin_listAuditLogs,
  "admin/listReports": admin_listReports,
  "admin/listSafetyEvents": admin_listSafetyEvents,
  "admin/listVerificationQueue": admin_listVerificationQueue,
  "admin/reviewVerification": admin_reviewVerification,
  "admin/updatePlatformSettings": admin_updatePlatformSettings,
  "admin/updateReportStatus": admin_updateReportStatus,
  "admin/updateSafetyEventStatus": admin_updateSafetyEventStatus,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const actionParam = req.query.action;
  const actionPath = Array.isArray(actionParam) ? actionParam.join("/") : actionParam;
  const fn = actionPath ? registry[actionPath] : undefined;

  if (!fn) {
    // TEMPORARY diagnostics for the routing bug — remove once fixed.
    res.status(404).json({
      error: "Not found.",
      debug: { url: req.url, query: req.query, actionParam, actionPath },
    });
    return;
  }

  await fn(req, res);
}
