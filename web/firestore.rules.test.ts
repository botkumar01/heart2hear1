import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { setDoc, doc, getDoc, deleteDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "heart2hear-rules-test",
    firestore: {
      rules: readFileSync("../firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe("users/{uid}", () => {
  it("lets a user read their own profile", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/alice"), { displayName: "Alice", role: "client" });
    });
    const alice = testEnv.authenticatedContext("alice", { role: "client" });
    await assertSucceeds(getDoc(doc(alice.firestore(), "users/alice")));
  });

  it("blocks a user from reading someone else's profile", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/bob"), { displayName: "Bob", role: "client" });
    });
    const alice = testEnv.authenticatedContext("alice", { role: "client" });
    await assertFails(getDoc(doc(alice.firestore(), "users/bob")));
  });

  it("lets an admin read any profile", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/bob"), { displayName: "Bob", role: "client" });
    });
    const admin = testEnv.authenticatedContext("root", { role: "admin" });
    await assertSucceeds(getDoc(doc(admin.firestore(), "users/bob")));
  });

  it("blocks an unauthenticated read", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/bob"), { displayName: "Bob", role: "client" });
    });
    const anon = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(anon.firestore(), "users/bob")));
  });

  it("blocks a client from creating their own profile doc directly (backend-only)", async () => {
    const alice = testEnv.authenticatedContext("alice", { role: "client" });
    await assertFails(setDoc(doc(alice.firestore(), "users/alice"), { displayName: "Alice", role: "client" }));
  });

  it("blocks a client from deleting their own profile", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/alice"), { displayName: "Alice", role: "client" });
    });
    const alice = testEnv.authenticatedContext("alice", { role: "client" });
    await assertFails(deleteDoc(doc(alice.firestore(), "users/alice")));
  });

  it("blocks a client from writing a role field onto their own profile (privilege escalation)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/alice"), { displayName: "Alice", role: "client" });
    });
    const alice = testEnv.authenticatedContext("alice", { role: "client" });
    await assertFails(setDoc(doc(alice.firestore(), "users/alice"), { role: "admin" }, { merge: true }));
  });
});

describe("safetyEvents/{id}", () => {
  it("is unreadable by an ordinary signed-in user, even the one it's about", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "safetyEvents/e1"), { uid: "alice", severity: "CRISIS" });
    });
    const alice = testEnv.authenticatedContext("alice", { role: "client" });
    await assertFails(getDoc(doc(alice.firestore(), "safetyEvents/e1")));
  });

  it("is readable by an admin", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "safetyEvents/e1"), { uid: "alice", severity: "CRISIS" });
    });
    const admin = testEnv.authenticatedContext("root", { role: "admin" });
    await assertSucceeds(getDoc(doc(admin.firestore(), "safetyEvents/e1")));
  });
});

describe("certificates/{id}", () => {
  it("is publicly readable, even unauthenticated", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "certificates/c1"), { helperUid: "alice", levelName: "Training Completed" });
    });
    const anon = testEnv.unauthenticatedContext();
    await assertSucceeds(getDoc(doc(anon.firestore(), "certificates/c1")));
  });

  it("is never client-writable", async () => {
    const alice = testEnv.authenticatedContext("alice", { role: "helper" });
    await assertFails(setDoc(doc(alice.firestore(), "certificates/fake"), { helperUid: "alice", level: 99 }));
  });
});

describe("supportSessions/{id}", () => {
  it("is readable by its client participant", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "supportSessions/s1"), { clientUid: "alice", helperUid: "helper1", status: "ACTIVE" });
    });
    const alice = testEnv.authenticatedContext("alice", { role: "client" });
    await assertSucceeds(getDoc(doc(alice.firestore(), "supportSessions/s1")));
  });

  it("is not readable by a third party", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "supportSessions/s1"), { clientUid: "alice", helperUid: "helper1", status: "ACTIVE" });
    });
    const mallory = testEnv.authenticatedContext("mallory", { role: "client" });
    await assertFails(getDoc(doc(mallory.firestore(), "supportSessions/s1")));
  });
});
