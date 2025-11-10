import { useState } from "react";
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
import { insertInvoiceSchema, type Invoice, type RentalContract } from "@shared/schema";
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
} from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

export default function Invoices() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: contracts = [] } = useQuery<RentalContract[]>({
    queryKey: ["/api/rental-contracts"],
  });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: "",
      contractId: "",
      amount: "",
      dueDate: "",
      status: "pending",
      referenceMonth: "",
      notes: "",
    },
  });

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

  const totalInvoices = invoices.length;
  const pendingInvoices = invoices.filter((i: any) => i.status === "pending").length;
  const paidInvoices = invoices.filter((i: any) => i.status === "paid").length;
  const overdueInvoices = invoices.filter((i: any) => i.status === "overdue").length;

  const totalRevenue = invoices
    .filter((i: any) => i.status === "paid")
    .reduce((sum: number, i: any) => sum + parseFloat(i.amount || "0"), 0);

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      pending: t('invoices.statusPending'),
      paid: t('invoices.statusPaid'),
      overdue: t('invoices.statusOverdue'),
      cancelled: t('invoices.statusCancelled'),
    };
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      pending: { variant: "outline", className: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800" },
      paid: { variant: "default", className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" },
      overdue: { variant: "destructive", className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" },
      cancelled: { variant: "secondary", className: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800" },
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
      </div>

      {/* Invoices Table */}
      <Card className="bg-card dark:bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">{t('invoices.allInvoices')}</CardTitle>
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
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-muted-foreground">
                      {t('invoices.noInvoices')}
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice: any) => (
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
                                onClick={() => {
                                  setLocation(`/checkout/invoice?invoiceId=${invoice.id}&dueDate=${invoice.dueDate}&referenceMonth=${invoice.referenceMonth}`);
                                }}
                                className="h-8 w-8 p-0 hover:bg-muted dark:hover:bg-muted/20"
                                data-testid={`button-pay-${invoice.id}`}
                                title="Pay Online with Stripe"
                              >
                                <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                        placeholder="INV-001"
                        {...field}
                        className="bg-background dark:bg-background text-foreground border-input"
                        data-testid="input-invoice-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contractId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Contract</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background dark:bg-background text-foreground border-input" data-testid="select-contract">
                          <SelectValue placeholder="Select contract" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover dark:bg-popover border-border">
                        {contracts.map((contract) => (
                          <SelectItem key={contract.id} value={contract.id}>
                            {contract.contractNumber} - {contract.contractNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <FormLabel className="text-foreground">Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes..."
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

      {/* View Invoice Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-xl sm:max-w-2xl bg-background dark:bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('invoices.dialogDetailsTitle')}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('invoices.detailInvoiceNumber')}</p>
                  <p className="font-medium text-foreground">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('invoices.detailStatus')}</p>
                  {getStatusBadge(selectedInvoice.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('invoices.detailAmount')}</p>
                  <p className="font-medium text-foreground">
                    ${parseFloat(selectedInvoice.amount || "0").toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('invoices.detailDueDate')}</p>
                  <p className="font-medium text-foreground">
                    {selectedInvoice.dueDate ? format(new Date(selectedInvoice.dueDate), "MMM dd, yyyy") : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('invoices.detailReferenceMonth')}</p>
                  <p className="font-medium text-foreground">{selectedInvoice.referenceMonth}</p>
                </div>
                {selectedInvoice.paidDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('invoices.detailPaidDate')}</p>
                    <p className="font-medium text-foreground">
                      {format(new Date(selectedInvoice.paidDate), "MMM dd, yyyy")}
                    </p>
                  </div>
                )}
              </div>
              {selectedInvoice.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('invoices.detailNotes')}</p>
                  <p className="font-medium text-foreground">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
