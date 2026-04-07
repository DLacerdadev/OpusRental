import { db } from "../db";
import { whatsappLogs, payments, users } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export type WhatsAppEvent =
  | "payment_generated"
  | "invoice_issued"
  | "invoice_overdue"
  | "maintenance_due"
  | "geofence_alert";

export type WhatsAppStatus = "sent" | "failed" | "retrying";
export type WhatsAppProvider = "twilio" | "meta" | "mock";

const VALID_EVENTS: readonly WhatsAppEvent[] = [
  "payment_generated",
  "invoice_issued",
  "invoice_overdue",
  "maintenance_due",
  "geofence_alert",
];

export function isWhatsAppEvent(value: string): value is WhatsAppEvent {
  return (VALID_EVENTS as readonly string[]).includes(value);
}

interface SendResult {
  messageId: string | null;
  status: "sent" | "failed";
  retriesUsed: number;
  error?: string;
}

const log = (level: "info" | "error", operation: string, tenantId: string | null, detail: string) => {
  const entry = { level, timestamp: new Date().toISOString(), service: "whatsapp", operation, tenantId, detail };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.info(JSON.stringify(entry));
  }
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface IWhatsAppProvider {
  send(to: string, body: string): Promise<string>;
  readonly providerName: WhatsAppProvider;
}

interface TwilioMessageClient {
  messages: {
    create(opts: { body: string; from: string; to: string }): Promise<{ sid: string }>;
  };
}

class MockAdapter implements IWhatsAppProvider {
  readonly providerName: WhatsAppProvider = "mock";

  async send(to: string, body: string): Promise<string> {
    const fakeId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    log("info", "send", null, `[MOCK] to=${to} messageId=${fakeId} body_length=${body.length}`);
    return fakeId;
  }
}

class TwilioAdapter implements IWhatsAppProvider {
  readonly providerName: WhatsAppProvider = "twilio";
  private readonly client: TwilioMessageClient;
  private readonly from: string;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const twilio = require("twilio") as (sid: string, token: string) => TwilioMessageClient;
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!,
    );
    this.from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
  }

  async send(to: string, body: string): Promise<string> {
    const toFormatted = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
    const message = await this.client.messages.create({
      body,
      from: this.from,
      to: toFormatted,
    });
    return message.sid;
  }
}

interface MetaApiResponse {
  messages?: Array<{ id: string }>;
}

class MetaAdapter implements IWhatsAppProvider {
  readonly providerName: WhatsAppProvider = "meta";
  private readonly token: string;
  private readonly phoneNumberId: string;

  constructor() {
    this.token = process.env.META_WHATSAPP_TOKEN!;
    this.phoneNumberId = process.env.META_PHONE_NUMBER_ID!;
  }

  async send(to: string, body: string): Promise<string> {
    const { default: fetch } = await import("node-fetch");
    const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
    const cleanPhone = to.replace(/[^0-9+]/g, "");

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "text",
        text: { body },
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Meta API error ${resp.status}: ${err}`);
    }

    const data = (await resp.json()) as MetaApiResponse;
    return data.messages?.[0]?.id ?? "meta_unknown";
  }
}

function createProvider(): IWhatsAppProvider {
  const provider = (process.env.WHATSAPP_PROVIDER || "mock").toLowerCase();

  if (provider === "twilio") {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      log("error", "init", null, "WHATSAPP_PROVIDER=twilio but TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN missing — falling back to mock");
      return new MockAdapter();
    }
    return new TwilioAdapter();
  }

  if (provider === "meta") {
    if (!process.env.META_WHATSAPP_TOKEN || !process.env.META_PHONE_NUMBER_ID) {
      log("error", "init", null, "WHATSAPP_PROVIDER=meta but META_WHATSAPP_TOKEN/META_PHONE_NUMBER_ID missing — falling back to mock");
      return new MockAdapter();
    }
    return new MetaAdapter();
  }

  return new MockAdapter();
}

const TEMPLATES: Record<WhatsAppEvent, (vars: Record<string, string>) => string> = {
  payment_generated: (v) =>
    `✅ *Opus Capital* — Pagamento processado!\n\nOlá, ${v.name}!\n\nSeu rendimento de *${v.amount}* referente ao mês *${v.month}* foi gerado com sucesso.\n\nAcesse a plataforma para mais detalhes.`,

  invoice_issued: (v) =>
    `📄 *Opus Capital* — Nova fatura emitida!\n\nOlá, ${v.name}!\n\nA fatura *${v.invoiceNumber}* no valor de *${v.amount}* foi emitida e vence em *${v.dueDate}*.\n\nQualquer dúvida, entre em contato.`,

  invoice_overdue: (v) =>
    `⚠️ *Opus Capital* — Fatura em atraso!\n\nOlá, ${v.name}!\n\nA fatura *${v.invoiceNumber}* está *${v.daysOverdue} dia(s) em atraso*. Valor: *${v.amount}*.\n\nRegularize seu pagamento para evitar juros adicionais.`,

  maintenance_due: (v) =>
    `🔧 *Opus Capital* — Manutenção programada!\n\nTrailer *${v.trailerId}* requer manutenção em *${v.daysUntil} dia(s)*.\n\nAgende o serviço o quanto antes para evitar paralisações.`,

  geofence_alert: (v) =>
    `🚨 *Opus Capital* — Alerta de geofencing!\n\nTrailer *${v.trailerId}* se moveu *${v.distance} km* da localização esperada.\n\nLocalização atual: ${v.location || "Desconhecida"}. Verifique imediatamente.`,
};

export class WhatsAppService {
  private static provider: IWhatsAppProvider = createProvider();

  static getProviderName(): WhatsAppProvider {
    return this.provider.providerName;
  }

  private static async persistLog(
    tenantId: string,
    event: WhatsAppEvent,
    recipientPhone: string,
    recipientName: string | null,
    status: WhatsAppStatus,
    retriesUsed: number,
    messageId: string | null,
    error: string | null,
  ): Promise<void> {
    try {
      await db.insert(whatsappLogs).values({
        tenantId,
        event,
        recipientPhone,
        recipientName,
        status,
        provider: this.provider.providerName,
        messageId: messageId ?? undefined,
        retries: retriesUsed,
        error: error ?? undefined,
      });
    } catch (err) {
      log("error", "persist_log", tenantId, err instanceof Error ? err.message : String(err));
    }
  }

  private static async sendWithRetry(
    to: string,
    body: string,
    tenantId: string,
    event: WhatsAppEvent,
    recipientPhone: string,
    recipientName: string | null,
    maxAttempts = 4,
  ): Promise<SendResult> {
    const delays = [1000, 2000, 4000];
    let lastError = "";

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const messageId = await this.provider.send(to, body);
        return { messageId, status: "sent", retriesUsed: attempt };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);

        const delayMs = delays[attempt];
        if (delayMs !== undefined) {
          await this.persistLog(tenantId, event, recipientPhone, recipientName, "retrying", attempt + 1, null, lastError);
          await sleep(delayMs);
        }
      }
    }

    return { messageId: null, status: "failed", retriesUsed: maxAttempts, error: lastError };
  }

  static async sendEvent(
    event: WhatsAppEvent,
    vars: Record<string, string> & { recipientPhone: string; recipientName?: string },
    tenantId: string,
  ): Promise<void> {
    const { recipientPhone, recipientName, ...templateVars } = vars;

    if (!recipientPhone) {
      log("info", event, tenantId, "skipped — no phone number");
      return;
    }

    const body = TEMPLATES[event]({ name: recipientName || "Cliente", ...templateVars });
    const result = await this.sendWithRetry(recipientPhone, body, tenantId, event, recipientPhone, recipientName ?? null);

    await this.persistLog(
      tenantId,
      event,
      recipientPhone,
      recipientName ?? null,
      result.status,
      result.retriesUsed,
      result.messageId,
      result.error ?? null,
    );

    if (result.status === "sent") {
      log("info", event, tenantId, `sent to=${recipientPhone} provider=${this.provider.providerName} messageId=${result.messageId}`);
    } else {
      log("error", event, tenantId, `failed to=${recipientPhone} attempts=${result.retriesUsed} error=${result.error}`);
    }
  }

  static async notifyMonthlyPayments(referenceMonth: string): Promise<void> {
    try {
      const paidPayments = await db.query.payments.findMany({
        where: eq(payments.referenceMonth, referenceMonth),
        columns: { id: true, tenantId: true, userId: true, amount: true },
      });

      const userMap = new Map<string, { phone: string | null; name: string; tenantId: string }>();

      for (const p of paidPayments) {
        if (userMap.has(p.userId)) continue;
        const [user] = await db
          .select({ phone: users.phone, name: users.name, tenantId: users.tenantId })
          .from(users)
          .where(eq(users.id, p.userId))
          .limit(1);
        if (user) userMap.set(p.userId, { phone: user.phone, name: user.name, tenantId: user.tenantId });
      }

      for (const p of paidPayments) {
        const user = userMap.get(p.userId);
        if (!user?.phone) continue;

        await this.sendEvent(
          "payment_generated",
          {
            recipientPhone: user.phone,
            recipientName: user.name,
            name: user.name,
            amount: `$${Number(p.amount).toFixed(2)}`,
            month: referenceMonth,
          },
          p.tenantId,
        );
      }

      log("info", "notifyMonthlyPayments", null, `processed month=${referenceMonth} payments=${paidPayments.length}`);
    } catch (err) {
      log("error", "notifyMonthlyPayments", null, err instanceof Error ? err.message : String(err));
    }
  }

  static async sendTestMessage(phone: string, event: WhatsAppEvent, tenantId: string): Promise<SendResult> {
    const testVars: Record<WhatsAppEvent, Record<string, string>> = {
      payment_generated: { amount: "$1.234,56", month: new Date().toISOString().slice(0, 7) },
      invoice_issued: { invoiceNumber: "INV-TEST-001", amount: "$2.500,00", dueDate: "30/04/2026" },
      invoice_overdue: { invoiceNumber: "INV-TEST-002", amount: "$2.500,00", daysOverdue: "7" },
      maintenance_due: { trailerId: "TRAILER-001", daysUntil: "3" },
      geofence_alert: { trailerId: "TRAILER-001", distance: "15.3", location: "Rua Teste, 123" },
    };

    const body = TEMPLATES[event]({ name: "Teste", ...testVars[event] });
    const result = await this.sendWithRetry(phone, body, tenantId, event, phone, "Teste Manual");

    await this.persistLog(tenantId, event, phone, "Teste Manual", result.status, result.retriesUsed, result.messageId, result.error ?? null);
    return result;
  }

  static async getAllLogs(
    tenantId: string,
    limit = 50,
    offset = 0,
  ): Promise<(typeof whatsappLogs.$inferSelect)[]> {
    return db
      .select()
      .from(whatsappLogs)
      .where(eq(whatsappLogs.tenantId, tenantId))
      .orderBy(desc(whatsappLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  static async getLogStats(tenantId: string): Promise<{ sent: number; failed: number; total: number }> {
    const all = await db
      .select({ status: whatsappLogs.status })
      .from(whatsappLogs)
      .where(eq(whatsappLogs.tenantId, tenantId));

    const sent = all.filter((r) => r.status === "sent").length;
    const failed = all.filter((r) => r.status === "failed").length;
    return { sent, failed, total: all.length };
  }
}
