/** Thin, typed wrapper around `chrome.runtime` messaging used by both the UI and the background worker. */

import type { RuntimeMessage } from '@shared/types/index';

/** Sends a message to the background service worker and awaits its response. */
export async function sendToBackground<TPayload = unknown, TResponse = unknown>(
  type: string,
  payload?: TPayload,
): Promise<TResponse> {
  const message: RuntimeMessage<TPayload> = { type, payload };
  return chrome.runtime.sendMessage(message) as Promise<TResponse>;
}

/** Registers a handler for messages sent to the background worker; returns an unsubscribe function. */
export function onBackgroundMessage<TPayload = unknown>(
  type: string,
  handler: (payload: TPayload, sender: chrome.runtime.MessageSender) => unknown | Promise<unknown>,
): () => void {
  const listener = (
    message: RuntimeMessage<TPayload>,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => {
    if (message?.type !== type) return undefined;
    const result = handler(message.payload as TPayload, sender);
    if (result instanceof Promise) {
      result.then(sendResponse).catch((error) => sendResponse({ error: String(error) }));
      return true; // Keep the message channel open for the async response.
    }
    sendResponse(result);
    return undefined;
  };
  chrome.runtime.onMessage.addListener(listener);
  return () => chrome.runtime.onMessage.removeListener(listener);
}

/** Broadcasts a fire-and-forget event to any open extension pages (popup/side panel/options). */
export function broadcast<TPayload = unknown>(type: string, payload?: TPayload): void {
  chrome.runtime.sendMessage({ type, payload }).catch(() => {
    // No listener currently open — this is expected and not an error.
  });
}
