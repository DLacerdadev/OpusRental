import type { TFunction } from "i18next";

type SupportedLanguage = "en-US" | "pt-BR";

const FALLBACK_LABELS: Record<string, Record<SupportedLanguage, string>> = {
  "dashboard.thisMonth": {
    "en-US": "this month",
    "pt-BR": "este mês",
  },
  "dashboard.investors": {
    "en-US": "investors",
    "pt-BR": "investidores",
  },
  "dashboard.monthly": {
    "en-US": "monthly",
    "pt-BR": "mensal",
  },
  "dashboard.allTime": {
    "en-US": "all time",
    "pt-BR": "desde o início",
  },
  "dashboard.noActivity": {
    "en-US": "No activity yet",
    "pt-BR": "Nenhuma atividade ainda",
  },
  "dashboard.noPayments": {
    "en-US": "No payments yet",
    "pt-BR": "Nenhum pagamento ainda",
  },
  "dashboard.yourPortfolio": {
    "en-US": "Overview of your investment portfolio",
    "pt-BR": "Visão geral do seu portfólio de investimentos",
  },
  "dashboard.activeShares": {
    "en-US": "Active shares",
    "pt-BR": "Cotas ativas",
  },
  "dashboard.shares": {
    "en-US": "shares",
    "pt-BR": "cotas",
  },
  "dashboard.monthlyReturn": {
    "en-US": "Monthly return",
    "pt-BR": "Retorno mensal",
  },
  "dashboard.totalReturns": {
    "en-US": "Total returns",
    "pt-BR": "Retornos totais",
  },
  "dashboard.totalValue": {
    "en-US": "Total portfolio",
    "pt-BR": "Carteira total",
  },
  "dashboard.paymentReceived": {
    "en-US": "Payment received",
    "pt-BR": "Pagamento recebido",
  },
};

function humanize(slug: string): string {
  return slug
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
}

function pickLanguage(language?: string | null): SupportedLanguage {
  return language && language.toLowerCase().startsWith("pt") ? "pt-BR" : "en-US";
}

/**
 * Resolves a dashboard label with safe fallbacks.
 *
 * Order of resolution:
 *   1) i18next translation for the given key
 *   2) Curated fallback mapping (FALLBACK_LABELS) for the active language
 *   3) Humanized version of the key slug (e.g. "thisMonth" -> "This month")
 *
 * This keeps the UI free of raw "dashboard.xxx" slugs even when a
 * translation file is missing an entry.
 */
export function dashboardLabel(
  t: TFunction,
  key: string,
  language?: string | null,
): string {
  const fullKey = key.startsWith("dashboard.") ? key : `dashboard.${key}`;
  const translated = t(fullKey);

  if (typeof translated === "string" && translated !== fullKey) {
    return translated;
  }

  const lang = pickLanguage(language);
  const fallback = FALLBACK_LABELS[fullKey];
  if (fallback) {
    return fallback[lang];
  }

  const slug = fullKey.split(".").pop() ?? fullKey;
  return humanize(slug);
}
