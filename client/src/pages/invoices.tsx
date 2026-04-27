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
import { useForm } from "react-hook-form";
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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const contractLabel = (contract: RentalContract) => {
    const client = rentalClients.find((c) => c.id === contract.clientId);
    const trailer = trailers.find((tr) => tr.id === contract.trailerId);
    const clientName = client?.tradeName || client?.companyName || "—";
    const trailerName = trailer?.trailerId || trailer?.model || "—";
    return `${contract.contractNumber} — ${clientName} — ${trailerName}`;
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
    },
  });

  // Auto-fill amount / referenceMonth / dueDate when the manager picks a contract
  // in the "New invoice" dialog. We always recompute on change so switching
  // contracts produces consistent values; the manager can still override
  // any field manually before submitting.
  const watchedContractId = form.watch("contractId");
  useEffect(() => {
    if (!isCreateOpen || !watchedContractId) return;
    const contract = contracts.find((c) => c.id === watchedContractId);
    if (!contract) return;

    if (contract.monthlyRate) {
      form.setValue("amount", String(contract.monthlyRate), { shouldDirty: true });
    }

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

  const [statusFilter, setStatusFilter] = useState<string>("all");

  const totalInvoices = invoices.length;
  const pendingInvoices = invoices.filter((i: any) => i.status === "pending").length;
  const paidInvoices = invoices.filter((i: any) => i.status === "paid").length;
  const overdueInvoices = invoices.filter((i: any) => i.status === "overdue").length;
  const reissuedInvoices = invoices.filter((i: any) => i.status === "reissued").length;

  const filteredInvoices = statusFilter === "all"
    ? invoices
    : invoices.filter((i: any) => i.status === statusFilter);

  const totalRevenue = invoices
    .filter((i: any) => i.status === "paid")
    .reduce((sum: number, i: any) => sum + parseFloat(i.amount || "0"), 0);

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      pending: t('invoices.statusPending'),
      paid: t('invoices.statusPaid'),
      overdue: t('invoices.statusOverdue'),
      cancelled: t('invoices.statusCancelled'),
      reissued: t('invoices.statusReissued'),
    };
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      pending: { variant: "outline", className: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800" },
      paid: { variant: "default", className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" },
      overdue: { variant: "destructive", className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" },
      cancelled: { variant: "secondary", className: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800" },
      reissued: { variant: "outline", className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800" },
    };
    const label = labels[status] || labels.pending;
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant} className={config.className}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        <p className="text-muted-foreground">{t('invoices.loading')}</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8" data-testid="page-invoices">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="heading-invoices">
            {t('invoices.title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {t('invoices.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
          data-testid="button-new-invoice"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('invoices.newInvoice')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
        <Card className="bg-card dark:bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">{t('invoices.totalInvoices')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground" data-testid="text-total-invoices">
              {totalInvoices}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">{t('invoices.pending')}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground" data-testid="text-pending-invoices">
              {pendingInvoices}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">{t('invoices.paid')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground" data-testid="text-paid-invoices">
              {paidInvoices}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">{t('invoices.overdue')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground" data-testid="text-overdue-invoices">
              {overdueInvoices}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">{t('invoices.statusReissued')}</CardTitle>
            <RotateCcw className="h-4 w-4 text-purple-500 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground" data-testid="text-reissued-invoices">
              {reissuedInvoices}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="bg-card dark:bg-card border-border">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-card-foreground">{t('invoices.allInvoices')}</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-background border-input text-foreground" data-testid="select-status-filter">
              <SelectValue placeholder={t('invoices.filterAll')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('invoices.filterAll')}</SelectItem>
              <SelectItem value="pending">{t('invoices.statusPending')}</SelectItem>
              <SelectItem value="paid">{t('invoices.statusPaid')}</SelectItem>
              <SelectItem value="overdue">{t('invoices.statusOverdue')}</SelectItem>
              <SelectItem value="cancelled">{t('invoices.statusCancelled')}</SelectItem>
              <SelectItem value="reissued">{t('invoices.statusReissued')}</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">{t('invoices.tableInvoice')}</th>
                  <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">{t('invoices.tableClient')}</th>
                  <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">{t('invoices.tableAmount')}</th>
                  <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">{t('invoices.tableDueDate')}</th>
                  <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">{t('invoices.tableStatus')}</th>
                  <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">{t('invoices.tableActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-muted-foreground">
                      {t('invoices.noInvoices')}
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice: any) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-border hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors"
                      data-testid={`row-invoice-${invoice.id}`}
                    >
                      <td className="p-2 sm:p-4 text-xs sm:text-sm text-foreground font-medium">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="p-2 sm:p-4 text-xs sm:text-sm text-foreground">
                        {invoice.clientName || "N/A"}
                      </td>
                      <td className="p-2 sm:p-4 text-xs sm:text-sm text-foreground">
                        ${parseFloat(invoice.amount || "0").toFixed(2)}
                      </td>
                      <td className="p-2 sm:p-4 text-xs sm:text-sm text-foreground">
                        {invoice.dueDate ? format(new Date(invoice.dueDate), "MMM dd, yyyy") : "N/A"}
                      </td>
                      <td className="p-2 sm:p-4">{getStatusBadge(invoice.status)}</td>
                      <td className="p-2 sm:p-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(invoice)}
                            className="h-8 w-8 p-0 hover:bg-muted dark:hover:bg-muted/20"
                            data-testid={`button-view-${invoice.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(invoice.status === "pending" || invoice.status === "overdue") && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPayInvoice(invoice)}
                                className="h-8 w-8 p-0 hover:bg-muted dark:hover:bg-muted/20"
                                data-testid={`button-pay-${invoice.id}`}
                                title={t('invoices.payButtonTitle')}
                              >
                                <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsPaid(invoice)}
                                className="h-8 w-8 p-0 hover:bg-muted dark:hover:bg-muted/20"
                                data-testid={`button-mark-paid-${invoice.id}`}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReissueInvoice(invoice)}
                                className="h-8 w-8 p-0 hover:bg-muted dark:hover:bg-muted/20"
                                data-testid={`button-reissue-${invoice.id}`}
                                title={t('invoices.buttonReissue')}
                              >
                                <RotateCcw className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(invoice.id)}
                            className="h-8 w-8 p-0 hover:bg-muted dark:hover:bg-muted/20"
                            data-testid={`button-delete-${invoice.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

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
