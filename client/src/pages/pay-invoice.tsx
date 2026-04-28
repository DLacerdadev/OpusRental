import { useStripe, Elements, PaymentElement, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, Calendar, FileText, AlertCircle, CheckCircle2, Copy, Building2 } from "lucide-react";
import { useRoute } from "wouter";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface PaymentMethodDetail {
  type: "stripe" | "pix" | "boleto" | "bank_transfer";
  available: boolean;
  configured: boolean;
  publicPaymentUrl?: string;
  pixKey?: string;
  pixKeyType?: string;
  beneficiaryName?: string;
  bankName?: string;
  agency?: string;
  account?: string;
  instructions?: string;
}

interface PublicInvoiceResponse {
  invoice: {
    id: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    status: string;
    referenceMonth: string | null;
    notes: string | null;
  };
  client: { companyName: string; tradeName: string | null; email: string } | null;
  trailer: { fleetNumber: string; chassisNumber: string } | null;
  tenant: { name: string; logoUrl: string | null; primaryColor: string | null } | null;
  paymentMethods: PaymentMethodDetail[];
  stripeEnabled: boolean;
}

const formatBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

function StripePaymentForm({
  amount,
  invoiceNumber,
  onSuccess,
}: {
  amount: number;
  invoiceNumber: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });
    setIsProcessing(false);
    if (error) {
      toast({
        title: "Pagamento não concluído",
        description: error.message ?? "Tente novamente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Pagamento aprovado",
        description: `Fatura ${invoiceNumber} paga com sucesso.`,
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full h-12 text-base"
        data-testid="button-submit-payment"
      >
        {isProcessing ? "Processando..." : `Pagar ${formatBRL(amount)}`}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Pagamento seguro processado pelo Stripe.
      </p>
    </form>
  );
}

function PaymentMethodCard({ method }: { method: PaymentMethodDetail }) {
  const { toast } = useToast();
  const copy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: `${label} copiado`, description: value });
  };

  if (method.type === "pix") {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-2" data-testid="card-method-pix">
        <h4 className="font-semibold flex items-center gap-2">
          <Receipt className="h-4 w-4" /> PIX
        </h4>
        {method.pixKey && (
          <div className="flex items-center justify-between text-sm">
            <span>
              <span className="text-muted-foreground">Chave ({method.pixKeyType ?? "PIX"}):</span>{" "}
              <code className="font-mono">{method.pixKey}</code>
            </span>
            <Button size="sm" variant="ghost" onClick={() => copy(method.pixKey!, "Chave PIX")} data-testid="button-copy-pix">
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        {method.beneficiaryName && (
          <p className="text-sm text-muted-foreground">Beneficiário: {method.beneficiaryName}</p>
        )}
        {method.instructions && <p className="text-xs text-muted-foreground">{method.instructions}</p>}
      </div>
    );
  }

  if (method.type === "bank_transfer") {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-2" data-testid="card-method-bank">
        <h4 className="font-semibold flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Transferência bancária
        </h4>
        {method.bankName && <p className="text-sm">Banco: {method.bankName}</p>}
        {method.agency && <p className="text-sm">Agência: {method.agency}</p>}
        {method.account && <p className="text-sm">Conta: {method.account}</p>}
        {method.beneficiaryName && (
          <p className="text-sm text-muted-foreground">Favorecido: {method.beneficiaryName}</p>
        )}
        {method.instructions && <p className="text-xs text-muted-foreground">{method.instructions}</p>}
      </div>
    );
  }

  return null;
}

export default function PayInvoicePage() {
  const [match, params] = useRoute("/pay/:token");
  const token = match ? params?.token : null;
  const { toast } = useToast();

  const [data, setData] = useState<PublicInvoiceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/public/invoices/${encodeURIComponent(token)}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.message ?? "Falha ao carregar a fatura.");
        }
        return r.json() as Promise<PublicInvoiceResponse>;
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [token]);

  const startStripeCheckout = async () => {
    if (!token || !data) return;
    setLoadingIntent(true);
    try {
      const res = await fetch(`/api/public/invoices/${encodeURIComponent(token)}/payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message ?? "Falha ao iniciar pagamento.");
      setClientSecret(body.clientSecret);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoadingIntent(false);
    }
  };

  const stripeMethod = useMemo(
    () => data?.paymentMethods.find((m) => m.type === "stripe" && m.available),
    [data],
  );

  if (!token || error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Link indisponível</CardTitle>
            </div>
            <CardDescription>{error ?? "Token de pagamento ausente."}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Solicite um novo link de pagamento ao emissor da fatura.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <div
            className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
            aria-label="Carregando"
          />
          <p className="text-sm text-muted-foreground">Carregando fatura...</p>
        </div>
      </div>
    );
  }

  const amountNum = parseFloat(data.invoice.amount);
  const isPaid = paid || data.invoice.status === "paid";

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center gap-3" data-testid="header-tenant">
          {data.tenant?.logoUrl ? (
            <img
              src={data.tenant.logoUrl}
              alt={data.tenant.name}
              className="h-10 w-10 rounded object-contain bg-white"
            />
          ) : (
            <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Pagamento</p>
            <h1 className="text-xl font-semibold" data-testid="text-tenant-name">
              {data.tenant?.name ?? "Pagamento de Fatura"}
            </h1>
          </div>
        </header>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2" data-testid="text-invoice-number">
                  <FileText className="h-5 w-5" />
                  Fatura {data.invoice.invoiceNumber}
                </CardTitle>
                <CardDescription>
                  {data.client?.tradeName || data.client?.companyName || "Cliente"}
                </CardDescription>
              </div>
              {isPaid ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 text-xs font-semibold"
                  data-testid="status-paid"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Paga
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-3 py-1 text-xs font-semibold"
                  data-testid="status-pending"
                >
                  Em aberto
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Valor</p>
                <p className="text-2xl font-bold" data-testid="text-invoice-amount">
                  {formatBRL(amountNum)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Vencimento
                </p>
                <p className="text-base font-medium" data-testid="text-invoice-due">
                  {new Date(data.invoice.dueDate).toLocaleDateString("pt-BR")}
                </p>
              </div>
              {data.invoice.referenceMonth && (
                <div>
                  <p className="text-xs text-muted-foreground">Mês de referência</p>
                  <p className="text-base">{data.invoice.referenceMonth}</p>
                </div>
              )}
              {data.trailer && (
                <div>
                  <p className="text-xs text-muted-foreground">Equipamento</p>
                  <p className="text-base">Frota {data.trailer.fleetNumber}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {!isPaid && (
          <Card>
            <CardHeader>
              <CardTitle>Como pagar</CardTitle>
              <CardDescription>Escolha a forma de pagamento de sua preferência.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stripeMethod && stripePromise && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <h4 className="font-semibold">Cartão de crédito</h4>
                  {!clientSecret ? (
                    <Button
                      onClick={startStripeCheckout}
                      disabled={loadingIntent}
                      className="w-full"
                      data-testid="button-start-card-payment"
                    >
                      {loadingIntent ? "Preparando..." : `Pagar ${formatBRL(amountNum)} com cartão`}
                    </Button>
                  ) : (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <StripePaymentForm
                        amount={amountNum}
                        invoiceNumber={data.invoice.invoiceNumber}
                        onSuccess={() => setPaid(true)}
                      />
                    </Elements>
                  )}
                </div>
              )}

              {data.paymentMethods
                .filter((m) => m.type !== "stripe" && m.available)
                .map((m) => (
                  <PaymentMethodCard key={m.type} method={m} />
                ))}

              {!stripeMethod && data.paymentMethods.filter((m) => m.available).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum método de pagamento configurado. Entre em contato com o emissor.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {isPaid && (
          <Card className="border-green-200 dark:border-green-900">
            <CardContent className="py-6 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400 mx-auto" />
              <p className="font-semibold">Pagamento confirmado</p>
              <p className="text-sm text-muted-foreground">
                Você pode fechar esta página. Em instantes a baixa aparecerá no sistema.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
