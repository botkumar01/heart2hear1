import { createCipheriv, randomBytes, randomInt } from "node:crypto";

/**
 * ZEGOCLOUD "token004" implementation, ported from ZEGOCLOUD's own
 * reference (github.com/ZEGOCLOUD/zego_server_assistant, token/nodejs).
 * Verified against that source rather than written from memory, since a
 * byte-layout mistake here would silently break every video call.
 *
 * Wire format: "04" + base64( expire(8B BE) + ivLen(2B BE) + iv(16B) +
 * cipherLen(2B BE) + cipher ), where cipher is AES-CBC(JSON({app_id,
 * user_id, nonce, ctime, expire, payload})) keyed by the server secret
 * (its byte length selects AES-128/192/256 — this project's 32-char
 * secret means AES-256-CBC). The IV here uses crypto.randomBytes rather
 * than the reference's Math.random()-based charset IV — same 16-byte
 * length, cryptographically stronger, and Zego's server only needs the
 * IV bytes themselves to decrypt, not how they were generated.
 */
export function generateZegoToken(params: {
  appId: number;
  userId: string;
  serverSecret: string;
  effectiveSeconds: number;
  payload?: string;
}): string {
  const { appId, userId, serverSecret, effectiveSeconds, payload = "" } = params;

  const secretBytes = Buffer.from(serverSecret, "utf8");
  if (![16, 24, 32].includes(secretBytes.length)) {
    throw new Error(`ZEGOCLOUD_SERVER_SECRET must be 16, 24, or 32 bytes; got ${secretBytes.length}.`);
  }
  const algorithm =
    secretBytes.length === 16 ? "aes-128-cbc" : secretBytes.length === 24 ? "aes-192-cbc" : "aes-256-cbc";

  const createTime = Math.floor(Date.now() / 1000);
  const expire = createTime + effectiveSeconds;

  const tokenInfo = {
    app_id: appId,
    user_id: userId,
    nonce: randomInt(-2147483648, 2147483647),
    ctime: createTime,
    expire,
    payload,
  };

  const plainText = Buffer.from(JSON.stringify(tokenInfo), "utf8");

  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, secretBytes, iv);
  const cipherText = Buffer.concat([cipher.update(plainText), cipher.final()]);

  const expireBuf = Buffer.alloc(8);
  expireBuf.writeBigInt64BE(BigInt(expire));

  const ivLenBuf = Buffer.alloc(2);
  ivLenBuf.writeUInt16BE(iv.length);

  const cipherLenBuf = Buffer.alloc(2);
  cipherLenBuf.writeUInt16BE(cipherText.length);

  const packed = Buffer.concat([expireBuf, ivLenBuf, iv, cipherLenBuf, cipherText]);

  return "04" + packed.toString("base64");
}
