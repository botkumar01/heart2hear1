import { setGlobalOptions } from "firebase-functions/v2";

// Keep functions close to users; India-hosted region is not offered, so
// asia-south1 (Mumbai) is the lowest-latency Firebase region for Indian users.
setGlobalOptions({ region: "asia-south1", maxInstances: 10 });

export { completeRegistration } from "./auth/completeRegistration";
export { sendLoginNotification } from "./notifications/sendLoginNotification";
