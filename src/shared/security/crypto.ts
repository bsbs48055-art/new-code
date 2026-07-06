/**
 * Local encryption-at-rest for OAuth tokens using the Web Crypto API
 * (AES-GCM 256). The symmetric key is generated once per install and kept in
 * `chrome.storage.local`, which is sandboxed to this extension and never
 * synced or exposed to web pages. This is a best-effort defense against
 * casual inspection of extension storage (e.g. via a shared machine or a
 * backup file) — it is not a substitute for OS-level secret storage, and it
 * cannot protect against another extension or process with equivalent
 * privileges. No plaintext passwords are ever requested or stored.
 */

const KEY_STORAGE_KEY = 'sms_pro_crypto_key';

async function getOrCreateKey(): Promise<CryptoKey> {
  const stored = await chrome.storage.local.get(KEY_STORAGE_KEY);
  const existingJwk = stored[KEY_STORAGE_KEY] as JsonWebKey | undefined;

  if (existingJwk) {
    return crypto.subtle.importKey('jwk', existingJwk, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
  }

  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const jwk = await crypto.subtle.exportKey('jwk', key);
  await chrome.storage.local.set({ [KEY_STORAGE_KEY]: jwk });
  return key;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Encrypts a plaintext string, returning a single base64 payload (IV + ciphertext). */
export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);
  return toBase64(combined);
}

/** Decrypts a payload produced by {@link encryptSecret}. Returns null if decryption fails. */
export async function decryptSecret(payload: string): Promise<string | null> {
  try {
    const key = await getOrCreateKey();
    const combined = fromBase64(payload);
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(plainBuffer);
  } catch {
    return null;
  }
}
