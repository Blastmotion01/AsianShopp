import "server-only";

/**
 * Notification abstraction (email / SMS / Telegram).
 * The console notifier logs messages instead of sending them — replace with
 * an email (Resend, SES, SMTP) or Telegram implementation for production.
 */
export type Notification =
  | { type: "password_reset"; to: string; url: string }
  | { type: "order_created"; to: string; orderNumber: string; total: string }
  | { type: "order_status"; to: string; orderNumber: string; status: string }
  | { type: "admin_new_order"; orderNumber: string; total: string };

export interface Notifier {
  send(n: Notification): Promise<void>;
}

class ConsoleNotifier implements Notifier {
  async send(n: Notification) {
    console.info(`[notify:${n.type}]`, JSON.stringify(n));
  }
}

let notifier: Notifier = new ConsoleNotifier();

export function getNotifier() {
  return notifier;
}

export function setNotifier(n: Notifier) {
  notifier = n;
}

/** Fire-and-forget: notification failures must never break an order. */
export function notify(n: Notification) {
  getNotifier()
    .send(n)
    .catch((err) => console.error("[notify] failed", err));
}
