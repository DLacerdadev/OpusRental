import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInvoiceSchema, type Invoice, type RentalContract, type RentalClient, type Trailer } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  Edit,
  Trash2,
  CreditCard,
  RotateCcw,
  Copy,
  Wallet,
  Banknote,
  MoreHorizontal,
  Search,
  Filter,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

const invoiceFormSchema = insertInvoiceSchema.omit({ tenantId: true });
type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface InvoiceItemRow {
  id: string;
  invoiceId: string;
  description: string;
  rate: string;
  quantity: string;
  amount: string;
  sortOrder: number;
}

/**
 * Live Subtotal / Sales Tax / Total preview shown inside the invoice form.
 * Reads `amount` (subtotal entered by the manager) and `salesTaxRate` from
 * the form state via `useWatch` so the breakdown updates as the user types,
 * matching exactly what the backend will store and what the customer will
 * see on the PDF, the e-mail, and the public payment page.
 *
 * The formatting matches the rest of the customer-facing flow: en-US locale,
 * USD currency, two-decimal precision.
 */
function InvoiceTotalsSummary({
  form,
}: {
  form: ReturnType<typeof useForm<InvoiceFormData>>;
}) {
  const amountStr = useWatch({ control: form.control, name: "amount" }) ?? "";
  const rateStr = useWatch({ control: form.control, name: "salesTaxRate" }) ?? "";

  const subtotalNum = parseFloat(amountStr as string);
  const rateNum = parseFloat(rateStr as string);
  const safeSubtotal = Number.isFinite(subtotalNum) ? subtotalNum : 0;
  const safeRate = Number.isFinite(rateNum) ? rateNum : 0;
  const taxAmount = Math.round(safeSubtotal * safeRate) / 100;
  const total = Math.round((safeSubtotal + taxAmount) * 100) / 100;

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div
      className="rounded-md border border-border bg-muted/40 p-3 text-sm"
      data-testid="invoice-totals-summary"
    >
      <div className="flex items-center justify-between py-0.5">
        <span className="text-muted-foreground">Subtotal</span>
        <span className="text-foreground" data-testid="text-totals-subtotal">
          {fmt(safeSubtotal)}
        </span>
      </div>
      <div className="flex items-center justify-between py-0.5">
        <span className="text-muted-foreground">
          Sales Tax ({safeRate.toLocaleString("en-US", { maximumFractionDigits: 3 })}%)
        </span>
        <span className="text-foreground" data-testid="text-totals-tax">
          {fmt(taxAmount)}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between border-t border-border pt-1.5">
        <span className="font-semibold text-foreground">Total</span>
        <span className="font-semibold text-foreground" data-testid="text-totals-total">
          {fmt(total)}
        </span>
      </div>
    </div>
  );
}

/**
 * Editor for an invoice's per-row line items. When rows exist here, the
 * backend renders them as the invoice's items (multi-trailer / add-ons);
 * when empty, the backend falls back to the legacy single-row synthesis,
 * so existing single-trailer invoices remain regression-safe.
 */
function LineItemsManager({ invoiceId }: { invoiceId: string }) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery<InvoiceItemRow[]>({
    queryKey: ["/api/invoices", invoiceId, "items"],
    enabled: !!invoiceId,
  });

  // Local draft state for the "add new row" form. Amount is computed.
  const [draft, setDraft] = useState({ description: "", rate: "", quantity: "1" });

  // Per-row edit drafts keyed by item id; seeded from the server data.
  const [drafts, setDrafts] = useState<Record<string, { description: string; rate: string; quantity: string }>>({});

  useEffect(() => {
    setDrafts((prev) => {
      const next: Record<string, { description: string; rate: string; quantity: string }> = {};
      for (const row of items) {
        // Preserve in-flight edits if the user is mid-typing on a row.
        next[row.id] = prev[row.id] ?? {
          description: row.description,
          rate: row.rate,
          quantity: row.quantity,
        };
      }
      return next;
    });
  }, [items]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/invoices", invoiceId, "items"] });
    queryClient.invalidateQueries({ queryKey: ["/api/invoices", invoiceId, "data"] });
    queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
  };

  const computeAmount = (rate: string, quantity: string): string => {
    const r = parseFloat(rate);
    const q = parseFloat(quantity);
    if (Number.isFinite(r) && Number.isFinite(q)) {
      return (r * q).toFixed(2);
    }
    return "0.00";
  };

  const createMutation = useMutation({
    mutationFn: async (payload: { description: string; rate: string; quantity: string }) => {
      const amount = computeAmount(payload.rate, payload.quantity);
      const sortOrder = items.length;
      const res = await apiRequest("POST", `/api/invoices/${invoiceId}/items`, {
        description: payload.description,
        rate: payload.rate,
        quantity: payload.quantity,
        amount,
        sortOrder,
      });
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      setDraft({ description: "", rate: "", quantity: "1" });
      toast({
        title: t('invoices.itemsToastAddTitle'),
        description: t('invoices.itemsToastAddDescription'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('invoices.itemsToastErrorTitle'),
        description: error?.message || t('invoices.itemsToastErrorDescription'),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { description: string; rate: string; quantity: string } }) => {
      const amount = computeAmount(payload.rate, payload.quantity);
      const res = await apiRequest("PUT", `/api/invoices/${invoiceId}/items/${id}`, {
        description: payload.description,
        rate: payload.rate,
        quantity: payload.quantity,
        amount,
      });
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      toast({
        title: t('invoices.itemsToastSaveTitle'),
        description: t('invoices.itemsToastSaveDescription'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('invoices.itemsToastErrorTitle'),
        description: error?.message || t('invoices.itemsToastErrorDescription'),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/invoices/${invoiceId}/items/${id}`);
    },
    onSuccess: (_data, id) => {
      invalidateAll();
      // Drop the local edit-draft so a new row with the same id (unlikely but
      // safe) won't inherit the stale values.
      setDrafts((prev) => {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      });
      toast({
        title: t('invoices.itemsToastDeleteTitle'),
        description: t('invoices.itemsToastDeleteDescription'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('invoices.itemsToastErrorTitle'),
        description: error?.message || t('invoices.itemsToastErrorDescription'),
        variant: "destructive",
      });
    },
  });

  const handleAdd = () => {
    if (!draft.description.trim() || !draft.rate.trim() || !draft.quantity.trim()) {
      toast({
        title: t('invoices.itemsToastValidationTitle'),
        description: t('invoices.itemsToastValidationDescription'),
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(draft);
  };

  return (
    <Card className="bg-muted/30 dark:bg-muted/10 border-border" data-testid="card-line-items-manager">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm uppercase text-muted-foreground">
          {t('invoices.itemsManageTitle')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t('invoices.itemsManageDescription')}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <p className="text-xs text-muted-foreground" data-testid="text-items-loading">
            {t('invoices.itemsLoading')}
          </p>
        )}

        {!isLoading && items.length === 0 && (
          <p className="text-xs text-muted-foreground" data-testid="text-items-empty">
            {t('invoices.itemsEmpty')}
          </p>
        )}

        {items.map((row) => {
          const d = drafts[row.id] ?? { description: row.description, rate: row.rate, quantity: row.quantity };
          const computedAmount = computeAmount(d.rate, d.quantity);
          return (
            <div
              key={row.id}
              className="grid grid-cols-12 gap-2 items-end pb-2 border-b border-border last:border-b-0"
              data-testid={`row-line-item-${row.id}`}
            >
              <div className="col-span-12 sm:col-span-5 space-y-1">
                <label className="text-xs text-muted-foreground">{t('invoices.previewItemDescription')}</label>
                <Input
                  value={d.description}
                  onChange={(e) => setDrafts((p) => ({ ...p, [row.id]: { ...d, description: e.target.value } }))}
                  data-testid={`input-item-description-${row.id}`}
                />
              </div>
              <div className="col-span-4 sm:col-span-2 space-y-1">
                <label className="text-xs text-muted-foreground">{t('invoices.previewItemRate')}</label>
                <Input
                  type="number"
                  step="0.01"
                  value={d.rate}
                  onChange={(e) => setDrafts((p) => ({ ...p, [row.id]: { ...d, rate: e.target.value } }))}
                  data-testid={`input-item-rate-${row.id}`}
                />
              </div>
              <div className="col-span-4 sm:col-span-1 space-y-1">
                <label className="text-xs text-muted-foreground">{t('invoices.previewItemQty')}</label>
                <Input
                  type="number"
                  step="0.01"
                  value={d.quantity}
                  onChange={(e) => setDrafts((p) => ({ ...p, [row.id]: { ...d, quantity: e.target.value } }))}
                  data-testid={`input-item-qty-${row.id}`}
                />
              </div>
              <div className="col-span-4 sm:col-span-2 space-y-1">
                <label className="text-xs text-muted-foreground">{t('invoices.previewItemAmount')}</label>
                <p
                  className="h-9 px-3 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md"
                  data-testid={`text-item-amount-${row.id}`}
                >
                  ${computedAmount}
                </p>
              </div>
              <div className="col-span-12 sm:col-span-2 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={updateMutation.isPending}
                  onClick={() => updateMutation.mutate({ id: row.id, payload: d })}
                  data-testid={`button-item-save-${row.id}`}
                >
                  {updateMutation.isPending ? t('invoices.itemsSaving') : t('invoices.itemsSave')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(row.id)}
                  data-testid={`button-item-delete-${row.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}

        {/* Add new row */}
        <div
          className="grid grid-cols-12 gap-2 items-end pt-2 border-t border-border"
          data-testid="row-line-item-new"
        >
          <div className="col-span-12 sm:col-span-5 space-y-1">
            <label className="text-xs text-muted-foreground">{t('invoices.previewItemDescription')}</label>
            <Input
              value={draft.description}
              placeholder={t('invoices.itemsAddPlaceholder')}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              data-testid="input-item-description-new"
            />
          </div>
          <div className="col-span-4 sm:col-span-2 space-y-1">
            <label className="text-xs text-muted-foreground">{t('invoices.previewItemRate')}</label>
            <Input
              type="number"
              step="0.01"
              value={draft.rate}
              onChange={(e) => setDraft((p) => ({ ...p, rate: e.target.value }))}
              data-testid="input-item-rate-new"
            />
          </div>
          <div className="col-span-4 sm:col-span-1 space-y-1">
            <label className="text-xs text-muted-foreground">{t('invoices.previewItemQty')}</label>
            <Input
              type="number"
              step="0.01"
              value={draft.quantity}
              onChange={(e) => setDraft((p) => ({ ...p, quantity: e.target.value }))}
              data-testid="input-item-qty-new"
            />
          </div>
          <div className="col-span-4 sm:col-span-2 space-y-1">
            <label className="text-xs text-muted-foreground">{t('invoices.previewItemAmount')}</label>
            <p
              className="h-9 px-3 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md"
              data-testid="text-item-amount-new"
            >
              ${computeAmount(draft.rate, draft.quantity)}
            </p>
          </div>
          <div className="col-span-12 sm:col-span-2">
            <Button
              type="button"
              size="sm"
              className="w-full"
              disabled={createMutation.isPending}
              onClick={handleAdd}
              data-testid="button-item-add"
            >
              <Plus className="h-4 w-4 mr-1" />
              {createMutation.isPending ? t('invoices.itemsAdding') : t('invoices.itemsAdd')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Invoices() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [reissueInvoice, setReissueInvoice] = useState<any | null>(null);
  const [payInvoice, setPayInvoice] = useState<any | null>(null);

  const { data: previewData, isLoading: isPreviewLoading } = useQuery<any>({
    queryKey: ["/api/invoices", selectedInvoice?.id, "data"],
    enabled: isViewOpen && !!selectedInvoice?.id,
  });

  const { data: payMethodsData, isLoading: isPayMethodsLoading } = useQuery<{ methods: any[] }>({
    queryKey: ["/api/invoices", payInvoice?.id, "payment-methods"],
    enabled: !!payInvoice?.id,
  });

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({
        title: t('invoices.payCopiedTitle'),
        description: t('invoices.payCopiedDescription', { field: label }),
      });
    } catch {
      toast({
        title: t('invoices.payCopyErrorTitle'),
        description: t('invoices.payCopyErrorDescription'),
        variant: "destructive",
      });
    }
  };

  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: contracts = [] } = useQuery<RentalContract[]>({
    queryKey: ["/api/rental-contracts"],
  });

  const { data: rentalClients = [] } = useQuery<RentalClient[]>({
    queryKey: ["/api/rental-clients"],
  });

  const { data: trailers = [] } = useQuery<Trailer[]>({
    queryKey: ["/api/trailers"],
  });

  // Tenant billing config — used to prefill the per-invoice "Sales Tax Rate"
  // field with the tenant's default rate when the manager opens the
  // "New invoice" dialog. The rate stays editable so the manager can override
  // it for individual invoices (e.g. exempt customers).
  const { data: tenantBilling } = useQuery<{ salesTaxRate: string | null }>({
    queryKey: ["/api/tenant/billing"],
  });
  const defaultSalesTaxRate = tenantBilling?.salesTaxRate ?? "0";

  const trailerDisplay = (trailer?: Trailer) => {
    if (!trailer) return "—";
    const parts = [
      trailer.trailerId,
      [trailer.make, trailer.model, trailer.year]
        .filter((v) => v != null && v !== "")
        .join(" "),
    ].filter((v) => v && v.length > 0);
    return parts.length > 1 ? parts.join(" — ") : parts[0] || "—";
  };

  const contractLabel = (contract: RentalContract) => {
    const client = rentalClients.find((c) => c.id === contract.clientId);
    const trailer = trailers.find((tr) => tr.id === contract.trailerId);
    const clientName = client?.tradeName || client?.companyName || "—";
    return `${contract.contractNumber} — ${clientName} — ${trailerDisplay(trailer)}`;
  };

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: "",
      contractId: "",
      amount: "",
      dueDate: "",
      paidDate: "",
      status: "pending",
      referenceMonth: "",
      notes: "",
      salesTaxRate: defaultSalesTaxRate,
    },
  });

  // When the dialog opens (or when the tenant default rate finishes loading),
  // refresh the salesTaxRate field with the tenant default unless the user
  // already typed a custom value. This keeps create/edit pre-filled without
  // overwriting the manager's manual override.
  useEffect(() => {
    if (!isCreateOpen) return;
    const current = form.getValues("salesTaxRate");
    if (current == null || current === "") {
      form.setValue("salesTaxRate", defaultSalesTaxRate, { shouldDirty: false });
    }
  }, [isCreateOpen, defaultSalesTaxRate, form]);

  // Auto-fill amount / referenceMonth / dueDate when the manager picks a contract
  // in the "New invoice" dialog. We always recompute on change so switching
  // contracts produces consistent values; the manager can still override
  // any field manually before submitting.
  const watchedContractId = form.watch("contractId");
  useEffect(() => {
    if (!isCreateOpen || !watchedContractId) return;
    const contract = contracts.find((c) => c.id === watchedContractId);
    if (!contract) return;

    // Always overwrite amount on contract switch — including clearing it
    // when the new contract has no monthlyRate — so a stale value from a
    // previously selected contract never silently persists. Use a nullish
    // check so a (theoretical) zero rate is preserved instead of cleared.
    form.setValue(
      "amount",
      contract.monthlyRate != null ? String(contract.monthlyRate) : "",
      { shouldDirty: true },
    );

    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    form.setValue("referenceMonth", `${yyyy}-${mm}`, { shouldDirty: true });

    const dueDays = contract.paymentDueDays ?? 15;
    const due = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + dueDays));
    const dyyyy = due.getUTCFullYear();
    const dmm = String(due.getUTCMonth() + 1).padStart(2, "0");
    const ddd = String(due.getUTCDate()).padStart(2, "0");
    form.setValue("dueDate", `${dyyyy}-${dmm}-${ddd}`, { shouldDirty: true });
  }, [watchedContractId, isCreateOpen, contracts, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const payload = {
        ...data,
        amount: data.amount,
      };
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error();
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: t('invoices.toastCreateTitle'),
        description: t('invoices.toastCreateDescription'),
      });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t('invoices.toastCreateErrorTitle'),
        description: error?.message || t('invoices.toastCreateErrorDescription'),
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, paidDate }: { id: string; status: string; paidDate?: string }) => {
      const response = await fetch(`/api/invoices/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, paidDate }),
      });
      if (!response.ok) throw new Error();
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: t('invoices.toastUpdateTitle'),
        description: t('invoices.toastUpdateDescription'),
      });
      setIsEditOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: t('invoices.toastUpdateErrorTitle'),
        description: error?.message || t('invoices.toastUpdateErrorDescription'),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: t('invoices.toastDeleteTitle'),
        description: t('invoices.toastDeleteDescription'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('invoices.toastDeleteErrorTitle'),
        description: error?.message || t('invoices.toastDeleteErrorDescription'),
        variant: "destructive",
      });
    },
  });

  const reissueMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/invoices/${id}/reissue`);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to reissue invoice");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setReissueInvoice(null);
      toast({
        title: t('invoices.toastReissueTitle'),
        description: t('invoices.toastReissueDescription'),
      });
    },
    onError: (error: any) => {
      setReissueInvoice(null);
      toast({
        title: t('invoices.toastReissueErrorTitle'),
        description: error?.message || t('invoices.toastReissueErrorDescription'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvoiceFormData) => {
    createMutation.mutate(data);
  };

  const handleMarkAsPaid = (invoice: any) => {
    updateStatusMutation.mutate({
      id: invoice.id,
      status: "paid",
      paidDate: new Date().toISOString().split("T")[0],
    });
  };

  const handleDelete = (id: string) => {
    if (confirm(t('invoices.confirmDelete'))) {
      deleteMutation.mutate(id);
    }
  };

  const handleView = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsViewOpen(true);
  };

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const totalInvoices = invoices.length;
  const pendingInvoices = invoices.filter((i: any) => i.status === "pending").length;
  const paidInvoices = invoices.filter((i: any) => i.status === "paid").length;
  const overdueInvoices = invoices.filter((i: any) => i.status === "overdue").length;
  const reissuedInvoices = invoices.filter((i: any) => i.status === "reissued").length;

  const filteredInvoices = invoices.filter((inv: Invoice & { clientName?: string }) => {
    const matchesStatus =
      statusFilter === "ALL" || inv.status === statusFilter.toLowerCase();
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      term === "" ||
      (inv.invoiceNumber || "").toLowerCase().includes(term) ||
      (inv.clientName || "").toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  const totalRevenue = invoices
    .filter((i: any) => i.status === "paid")
    .reduce((sum: number, i: any) => sum + parseFloat(i.amount || "0"), 0);

  const formatUSD = (value: number | string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(typeof value === "string" ? parseFloat(value || "0") : value);

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      pending: t('invoices.statusPending'),
      paid: t('invoices.statusPaid'),
      overdue: t('invoices.statusOverdue'),
      cancelled: t('invoices.statusCancelled'),
      reissued: t('invoices.statusReissued'),
    };
    const classes: Record<string, string> = {
      pending: "bg-amber-500 text-white hover:bg-amber-500/90",
      paid: "bg-emerald-500 text-white hover:bg-emerald-500/90",
      overdue: "bg-red-500 text-white hover:bg-red-500/90",
      reissued: "bg-violet-500 text-white hover:bg-violet-500/90",
      cancelled: "bg-slate-500 text-white hover:bg-slate-500/90",
    };
    const label = labels[status] || labels.pending;
    const cls = classes[status] || classes.pending;
    return (
      <Badge
        className={`${cls} font-medium border-none rounded-sm px-2.5 py-0.5 text-xs uppercase tracking-wide`}
        data-testid={`badge-status-${status}`}
      >
        {label}
      </Badge>
    );
  };

  const ActionMenu = ({ invoice }: { invoice: Invoice }) => {
    const isPayable = invoice.status === "pending" || invoice.status === "overdue";
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            data-testid={`button-actions-${invoice.id}`}
          >
            <span className="sr-only">{t('invoices.tableActions')}</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('invoices.tableActions')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleView(invoice)}
            className="cursor-pointer"
            data-testid={`button-view-${invoice.id}`}
          >
            <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{t('invoices.menuViewDetails', 'Ver Detalhes')}</span>
          </DropdownMenuItem>
          {isPayable && (
            <>
              <DropdownMenuItem
                onClick={() => setPayInvoice(invoice)}
                className="cursor-pointer"
                data-testid={`button-pay-${invoice.id}`}
              >
                <Wallet className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>{t('invoices.menuPayInvoice', 'Pagar Fatura')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleMarkAsPaid(invoice)}
                className="cursor-pointer"
                data-testid={`button-mark-paid-${invoice.id}`}
              >
                <CheckCircle className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t('invoices.menuMarkAsPaid', 'Marcar como Pago')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setReissueInvoice(invoice)}
                className="cursor-pointer"
                data-testid={`button-reissue-${invoice.id}`}
              >
                <RotateCcw className="mr-2 h-4 w-4 text-violet-600 dark:text-violet-400" />
                <span>{t('invoices.buttonReissue')}</span>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleDelete(invoice.id)}
            className="cursor-pointer focus:bg-red-50 dark:focus:bg-red-500/10"
            data-testid={`button-delete-${invoice.id}`}
          >
            <Trash2 className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-red-600 dark:text-red-400">
              {t('invoices.menuDeleteInvoice', 'Excluir Fatura')}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        <p className="text-muted-foreground">{t('invoices.loading')}</p>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-full p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8" data-testid="page-invoices">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight" data-testid="heading-invoices">
            {t('invoices.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('invoices.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto shadow-sm"
          data-testid="button-new-invoice"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('invoices.newInvoice')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="bg-card border border-border shadow-sm rounded-xl col-span-2 md:col-span-1">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {t('invoices.totalInvoices')}
              </p>
              <h3 className="text-2xl font-bold text-foreground" data-testid="text-total-invoices">
                {totalInvoices}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {t('invoices.pending')}
              </p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400" data-testid="text-pending-invoices">
                {pendingInvoices}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {t('invoices.paid')}
              </p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-paid-invoices">
                {paidInvoices}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {t('invoices.overdue')}
              </p>
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-overdue-invoices">
                {overdueInvoices}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-50 dark:bg-red-500/15 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {t('invoices.statusReissued')}
              </p>
              <h3 className="text-2xl font-bold text-violet-600 dark:text-violet-400" data-testid="text-reissued-invoices">
                {reissuedInvoices}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-violet-50 dark:bg-violet-500/15 flex items-center justify-center">
              <RotateCcw className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List Card */}
      <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 md:p-5 border-b border-border flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('invoices.searchPlaceholder', 'Buscar por cliente ou fatura...')}
              className="pl-9 bg-muted/40 border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-invoices"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="w-full md:w-48 bg-muted/40 border-border text-foreground"
                data-testid="select-status-filter"
              >
                <SelectValue placeholder={t('invoices.filterAll')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('invoices.filterAll')}</SelectItem>
                <SelectItem value="PENDING">{t('invoices.statusPending')}</SelectItem>
                <SelectItem value="PAID">{t('invoices.statusPaid')}</SelectItem>
                <SelectItem value="OVERDUE">{t('invoices.statusOverdue')}</SelectItem>
                <SelectItem value="CANCELLED">{t('invoices.statusCancelled')}</SelectItem>
                <SelectItem value="REISSUED">{t('invoices.statusReissued')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Desktop / Tablet Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-muted/40">
              <tr className="border-b border-border">
                <th className="text-left px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('invoices.tableInvoice')}
                </th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('invoices.tableClient')}
                </th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('invoices.tableAmount')}
                </th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('invoices.tableDueDate')}
                </th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('invoices.tableStatus')}
                </th>
                <th className="text-right px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('invoices.tableActions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground"
                    data-testid="text-no-invoices"
                  >
                    {t('invoices.noInvoices')}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice: Invoice & { clientName?: string }) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                    data-testid={`row-invoice-${invoice.id}`}
                  >
                    <td
                      className="px-4 py-3 text-sm font-medium text-foreground"
                      data-testid={`text-invoice-number-${invoice.id}`}
                    >
                      {invoice.invoiceNumber}
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-foreground"
                      data-testid={`text-invoice-client-${invoice.id}`}
                    >
                      {invoice.clientName || "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-sm font-medium text-foreground"
                      data-testid={`text-invoice-amount-${invoice.id}`}
                    >
                      {formatUSD(invoice.amount || "0")}
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-muted-foreground"
                      data-testid={`text-invoice-duedate-${invoice.id}`}
                    >
                      {invoice.dueDate
                        ? format(new Date(invoice.dueDate), "dd/MM/yyyy")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(invoice.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <ActionMenu invoice={invoice} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden flex flex-col p-4 gap-4 bg-muted/20">
          {filteredInvoices.length === 0 ? (
            <div
              className="py-12 text-center text-muted-foreground bg-card rounded-lg border border-border"
              data-testid="text-no-invoices-mobile"
            >
              {t('invoices.noInvoices')}
            </div>
          ) : (
            filteredInvoices.map((invoice: Invoice & { clientName?: string }) => {
              const isPayable =
                invoice.status === "pending" || invoice.status === "overdue";
              return (
                <Card
                  key={invoice.id}
                  className="bg-card border border-border shadow-sm rounded-xl overflow-hidden"
                  data-testid={`card-invoice-${invoice.id}`}
                >
                  <CardContent className="p-0">
                    <div className="p-4 border-b border-border flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p
                          className="font-medium text-foreground truncate"
                          data-testid={`text-invoice-number-mobile-${invoice.id}`}
                        >
                          {invoice.invoiceNumber}
                        </p>
                        <p
                          className="text-sm text-muted-foreground line-clamp-1 mt-0.5"
                          data-testid={`text-invoice-client-mobile-${invoice.id}`}
                        >
                          {invoice.clientName || "—"}
                        </p>
                      </div>
                      <div>{getStatusBadge(invoice.status)}</div>
                    </div>
                    <div className="p-4 bg-muted/20 flex justify-between items-center gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">
                          {t('invoices.tableDueDate')}
                        </p>
                        <p
                          className="text-sm font-medium text-foreground"
                          data-testid={`text-invoice-duedate-mobile-${invoice.id}`}
                        >
                          {invoice.dueDate
                            ? format(new Date(invoice.dueDate), "dd/MM/yyyy")
                            : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-0.5">
                          {t('invoices.tableAmount')}
                        </p>
                        <p
                          className="text-sm font-bold text-foreground"
                          data-testid={`text-invoice-amount-mobile-${invoice.id}`}
                        >
                          {formatUSD(invoice.amount || "0")}
                        </p>
                      </div>
                    </div>
                    <div className="px-4 py-3 border-t border-border flex justify-end gap-2 bg-card">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(invoice)}
                        className="flex-1 justify-center"
                        data-testid={`button-view-mobile-${invoice.id}`}
                      >
                        <Eye className="mr-2 h-3.5 w-3.5" />
                        {t('invoices.menuView', 'Ver')}
                      </Button>
                      {isPayable && (
                        <Button
                          size="sm"
                          onClick={() => setPayInvoice(invoice)}
                          className="flex-1 justify-center bg-primary hover:bg-primary/90 text-primary-foreground"
                          data-testid={`button-pay-mobile-${invoice.id}`}
                        >
                          <Wallet className="mr-2 h-3.5 w-3.5" />
                          {t('invoices.menuPay', 'Pagar')}
                        </Button>
                      )}
                      <ActionMenu invoice={invoice} />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-background dark:bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('invoices.dialogCreateTitle')}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('invoices.dialogCreateDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">{t('invoices.formInvoiceNumber')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('invoices.formInvoiceNumberPlaceholder')}
                        {...field}
                        value={field.value || ""}
                        className="bg-background dark:bg-background text-foreground border-input"
                        data-testid="input-invoice-number"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground" data-testid="text-invoice-number-hint">
                      {t('invoices.formInvoiceNumberHint')}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contractId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">{t('invoices.formContract')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background dark:bg-background text-foreground border-input" data-testid="select-contract">
                          <SelectValue placeholder={t('invoices.formContractPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover dark:bg-popover border-border">
                        {contracts.map((contract) => (
                          <SelectItem
                            key={contract.id}
                            value={contract.id}
                            data-testid={`select-contract-option-${contract.id}`}
                          >
                            {contractLabel(contract)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground" data-testid="text-contract-autofill-hint">
                      {t('invoices.formContractAutoFillHint')}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">{t('invoices.formAmount')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1500.00"
                        {...field}
                        className="bg-background dark:bg-background text-foreground border-input"
                        data-testid="input-amount"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {t('invoices.formAmountHelp')}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salesTaxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">{t('invoices.formSalesTaxRate')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0.00"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        className="bg-background dark:bg-background text-foreground border-input"
                        data-testid="input-sales-tax-rate"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {t('invoices.formSalesTaxRateHelp')}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <InvoiceTotalsSummary form={form} />


              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">{t('invoices.formDueDate')}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        className="bg-background dark:bg-background text-foreground border-input"
                        data-testid="input-due-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referenceMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">{t('invoices.formReferenceMonth')}</FormLabel>
                    <FormControl>
                      <Input
                        type="month"
                        {...field}
                        className="bg-background dark:bg-background text-foreground border-input"
                        data-testid="input-reference-month"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">{t('invoices.formNotes')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('invoices.formNotesPlaceholder')}
                        {...field}
                        value={field.value || ""}
                        className="bg-background dark:bg-background text-foreground border-input resize-none"
                        rows={3}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="border-input text-foreground hover:bg-muted dark:hover:bg-muted/20"
                  data-testid="button-cancel"
                >
                  {t('invoices.buttonCancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  data-testid="button-submit"
                >
                  {createMutation.isPending ? t('invoices.buttonCreating') : t('invoices.buttonCreate')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Reissue Invoice Confirmation Dialog */}
      <AlertDialog open={!!reissueInvoice} onOpenChange={(open) => { if (!open) setReissueInvoice(null); }}>
        <AlertDialogContent className="bg-background dark:bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">{t('invoices.reissueConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {reissueInvoice && t('invoices.reissueConfirmDescription', { invoiceNumber: reissueInvoice.invoiceNumber })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-input text-foreground"
              data-testid="button-reissue-cancel"
            >
              {t('invoices.buttonCancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reissueInvoice && reissueMutation.mutate(reissueInvoice.id)}
              disabled={reissueMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              data-testid="button-reissue-confirm"
            >
              {reissueMutation.isPending ? t('invoices.buttonReissuing') : t('invoices.buttonReissue')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Invoice Dialog (structured data from /api/invoices/:id/data) */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-xl sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-background dark:bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('invoices.previewTitle')}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('invoices.previewDescription')}
            </DialogDescription>
          </DialogHeader>
          {isPreviewLoading && (
            <p className="text-muted-foreground" data-testid="text-preview-loading">
              {t('invoices.previewLoading')}
            </p>
          )}
          {!isPreviewLoading && previewData && (
            <div className="space-y-6" data-testid="container-invoice-preview">
              {/* Header with number, dates, status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-border pb-4">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{t('invoices.previewInvoiceNumber')}</p>
                  <p className="font-semibold text-foreground" data-testid="text-preview-invoice-number">
                    {previewData.invoiceNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{t('invoices.previewIssueDate')}</p>
                  <p className="font-medium text-foreground" data-testid="text-preview-issue-date">
                    {previewData.issueDate ? format(new Date(previewData.issueDate), "MMM dd, yyyy") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{t('invoices.previewDueDate')}</p>
                  <p className="font-medium text-foreground" data-testid="text-preview-due-date">
                    {previewData.dueDate ? format(new Date(previewData.dueDate), "MMM dd, yyyy") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{t('invoices.previewReferenceMonth')}</p>
                  <p className="font-medium text-foreground">{previewData.referenceMonth}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{t('invoices.previewStatus')}</p>
                  <div>{getStatusBadge(previewData.status)}</div>
                </div>
                {previewData.paidDate && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">{t('invoices.detailPaidDate')}</p>
                    <p className="font-medium text-foreground">
                      {format(new Date(previewData.paidDate), "MMM dd, yyyy")}
                    </p>
                  </div>
                )}
              </div>

              {/* Bill To */}
              <Card className="bg-muted/30 dark:bg-muted/10 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm uppercase text-muted-foreground">
                    {t('invoices.previewBillTo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-foreground" data-testid="container-preview-bill-to">
                  <p className="font-semibold">{previewData.billTo?.companyName}</p>
                  {previewData.billTo?.tradeName && (
                    <p className="text-muted-foreground">{previewData.billTo.tradeName}</p>
                  )}
                  {previewData.billTo?.taxId && (
                    <p>
                      <span className="text-muted-foreground">{t('invoices.previewTaxId')}: </span>
                      {previewData.billTo.taxId}
                    </p>
                  )}
                  <p>{previewData.billTo?.email}</p>
                  <p>{previewData.billTo?.phone}</p>
                  {previewData.billTo?.address && <p>{previewData.billTo.address}</p>}
                </CardContent>
              </Card>

              {/* Trailer being billed — shows the physical reboque the
                  invoice covers, including VIN. Helps managers reconcile
                  the invoice against the asset register without leaving
                  the dialog. */}
              {previewData.trailer && (
                <Card className="bg-muted/30 dark:bg-muted/10 border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm uppercase text-muted-foreground">
                      {t('invoices.previewTrailer', 'Reboque')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-foreground" data-testid="container-preview-trailer">
                    <p className="font-semibold" data-testid="text-preview-trailer-id">
                      {previewData.trailer.trailerId}
                      {(previewData.trailer.make || previewData.trailer.model || previewData.trailer.year) && (
                        <span className="text-muted-foreground font-normal">
                          {" — "}
                          {[previewData.trailer.make, previewData.trailer.model, previewData.trailer.year]
                            .filter(Boolean)
                            .join(" ")}
                        </span>
                      )}
                    </p>
                    {previewData.trailer.vin && (
                      <p data-testid="text-preview-trailer-vin">
                        <span className="text-muted-foreground">VIN: </span>
                        <span className="font-mono">{previewData.trailer.vin}</span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Items table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-preview-items">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 font-medium text-muted-foreground">
                        {t('invoices.previewItemDescription')}
                      </th>
                      <th className="text-right p-2 font-medium text-muted-foreground">
                        {t('invoices.previewItemRate')}
                      </th>
                      <th className="text-right p-2 font-medium text-muted-foreground">
                        {t('invoices.previewItemQty')}
                      </th>
                      <th className="text-right p-2 font-medium text-muted-foreground">
                        {t('invoices.previewItemAmount')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(previewData.items || []).map((item: any, index: number) => (
                      <tr key={index} className="border-b border-border" data-testid={`row-preview-item-${index}`}>
                        <td className="p-2 text-foreground">{item.description}</td>
                        <td className="p-2 text-right text-foreground">${Number(item.rate).toFixed(2)}</td>
                        <td className="p-2 text-right text-foreground">{item.qty}</td>
                        <td className="p-2 text-right text-foreground font-medium">
                          ${Number(item.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Manage line items (multi-trailer / add-ons). Editing here
                  drives the items table above and the totals below. */}
              {selectedInvoice?.id && <LineItemsManager invoiceId={selectedInvoice.id} />}

              {/* Totals */}
              <div className="flex justify-end" data-testid="container-preview-totals">
                <div className="w-full sm:w-72 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('invoices.previewSubtotal')}</span>
                    <span className="text-foreground">
                      ${Number(previewData.totals?.subtotal || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('invoices.previewTax')}</span>
                    <span className="text-foreground">
                      ${Number(previewData.totals?.tax || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1 font-semibold text-base">
                    <span className="text-foreground">{t('invoices.previewTotal')}</span>
                    <span className="text-foreground" data-testid="text-preview-total">
                      ${Number(previewData.totals?.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment instructions */}
              <Card className="bg-muted/30 dark:bg-muted/10 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm uppercase text-muted-foreground">
                    {t('invoices.previewPaymentInstructions')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-foreground" data-testid="container-preview-payment-instructions">
                  {(previewData.paymentInstructions || []).map((line: string, index: number) => (
                    <p key={index}>{line}</p>
                  ))}
                </CardContent>
              </Card>

              {previewData.notes && (
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{t('invoices.detailNotes')}</p>
                  <p className="text-sm text-foreground">{previewData.notes}</p>
                </div>
              )}
            </div>
          )}
          {!isPreviewLoading && !previewData && selectedInvoice && (
            <p className="text-muted-foreground">{t('invoices.previewError')}</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Pay Invoice Dialog — tabs per available payment method (Template 3) */}
      <Dialog open={!!payInvoice} onOpenChange={(open) => { if (!open) setPayInvoice(null); }}>
        <DialogContent className="max-w-xl bg-background dark:bg-background border-border" data-testid="dialog-pay-invoice">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {t('invoices.payDialogTitle', { invoiceNumber: payInvoice?.invoiceNumber || '' })}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('invoices.payDialogDescription')}
            </DialogDescription>
          </DialogHeader>

          {isPayMethodsLoading && (
            <p className="text-muted-foreground" data-testid="text-pay-loading">
              {t('invoices.payLoading')}
            </p>
          )}

          {!isPayMethodsLoading && payMethodsData && (() => {
            const methods = payMethodsData.methods || [];
            if (methods.length === 0) {
              return (
                <p className="text-muted-foreground" data-testid="text-pay-no-methods">
                  {t('invoices.payNoMethods')}
                </p>
              );
            }
            const defaultTab = methods[0].type;
            return (
              <Tabs defaultValue={defaultTab} className="w-full" data-testid="tabs-pay-methods">
                <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${methods.length}, minmax(0, 1fr))` }}>
                  {methods.map((m: any) => (
                    <TabsTrigger
                      key={m.type}
                      value={m.type}
                      data-testid={`tab-pay-${m.type}`}
                    >
                      {m.type === 'pix' && t('invoices.payTabPix')}
                      {m.type === 'bank_transfer' && t('invoices.payTabBank')}
                      {m.type === 'stripe' && t('invoices.payTabCard')}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {methods.map((m: any) => (
                  <TabsContent key={m.type} value={m.type} className="mt-4">
                    {m.type === 'pix' && (
                      <PayMethodPanel
                        icon={<Wallet className="h-5 w-5 text-emerald-600" />}
                        title={t('invoices.payTabPix')}
                        rows={[
                          { label: t('invoices.payPixKey'), value: m.pixKey, copy: true },
                          ...(m.beneficiary ? [{ label: t('invoices.payPixBeneficiary'), value: m.beneficiary, copy: true }] : []),
                          { label: t('invoices.payAmount'), value: `$${Number(m.amount).toFixed(2)}`, copy: true },
                          { label: t('invoices.payReference'), value: m.reference, copy: true },
                        ]}
                        onCopy={copyToClipboard}
                        testIdPrefix="pix"
                      />
                    )}
                    {m.type === 'bank_transfer' && (
                      <PayMethodPanel
                        icon={<Banknote className="h-5 w-5 text-blue-600" />}
                        title={t('invoices.payTabBank')}
                        rows={[
                          { label: t('invoices.payBankName'), value: m.bankName, copy: true },
                          ...(m.agency ? [{ label: t('invoices.payBankAgency'), value: m.agency, copy: true }] : []),
                          { label: t('invoices.payBankAccount'), value: m.account, copy: true },
                          ...(m.accountHolder ? [{ label: t('invoices.payBankHolder'), value: m.accountHolder, copy: true }] : []),
                          ...(m.accountType ? [{ label: t('invoices.payBankType'), value: t(`settings.billingBankType${m.accountType.charAt(0).toUpperCase()}${m.accountType.slice(1)}`), copy: false }] : []),
                          { label: t('invoices.payAmount'), value: `$${Number(m.amount).toFixed(2)}`, copy: true },
                          { label: t('invoices.payReference'), value: m.reference, copy: true },
                        ]}
                        onCopy={copyToClipboard}
                        testIdPrefix="bank"
                      />
                    )}
                    {m.type === 'stripe' && (
                      <div className="space-y-4" data-testid="panel-pay-stripe">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-50 dark:bg-purple-950 p-2 rounded-lg">
                            <CreditCard className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{t('invoices.payTabCard')}</h3>
                            <p className="text-xs text-muted-foreground">{t('invoices.payStripeDescription')}</p>
                          </div>
                        </div>
                        <div className="p-3 bg-muted/30 rounded-lg space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('invoices.payAmount')}</span>
                            <span className="font-semibold text-foreground" data-testid="text-pay-stripe-amount">
                              ${Number(m.amount).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('invoices.payReference')}</span>
                            <span className="font-mono text-foreground" data-testid="text-pay-stripe-reference">
                              {m.reference}
                            </span>
                          </div>
                        </div>
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => {
                            setPayInvoice(null);
                            setLocation(
                              `/checkout/invoice?invoiceId=${payInvoice.id}&dueDate=${payInvoice.dueDate}&referenceMonth=${payInvoice.referenceMonth}`
                            );
                          }}
                          data-testid="button-pay-stripe-checkout"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          {t('invoices.payStripeCheckout')}
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            );
          })()}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayInvoice(null)}
              className="border-input text-foreground"
              data-testid="button-pay-close"
            >
              {t('invoices.buttonCancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type PayMethodRow = {
  label: string;
  value: string;
  copy: boolean;
};

function PayMethodPanel({
  icon,
  title,
  rows,
  onCopy,
  testIdPrefix,
}: {
  icon: React.ReactNode;
  title: string;
  rows: PayMethodRow[];
  onCopy: (value: string, label: string) => void;
  testIdPrefix: string;
}) {
  return (
    <div className="space-y-4" data-testid={`panel-pay-${testIdPrefix}`}>
      <div className="flex items-center gap-3">
        <div className="bg-muted/50 dark:bg-muted/20 p-2 rounded-lg">{icon}</div>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div
            key={`${row.label}-${index}`}
            className="flex items-center justify-between gap-2 p-2 bg-muted/30 rounded-md"
            data-testid={`row-pay-${testIdPrefix}-${index}`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p className="text-sm font-mono text-foreground break-all" data-testid={`text-pay-${testIdPrefix}-${index}`}>
                {row.value}
              </p>
            </div>
            {row.copy && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onCopy(row.value, row.label)}
                data-testid={`button-pay-copy-${testIdPrefix}-${index}`}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
