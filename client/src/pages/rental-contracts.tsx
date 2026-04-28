import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Plus,
  Edit,
  XCircle,
  Eye,
  Calendar,
  Receipt,
  CheckCircle,
  Search,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRentalContractSchema, type InsertRentalContract } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

export default function RentalContracts() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [generateInvoiceContract, setGenerateInvoiceContract] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { toast } = useToast();
  const { user } = useAuth();
  // The "Generate invoice now" button calls a server endpoint guarded by
  // isManager (manager/admin). Mirror that gate on the client so non-manager
  // users (e.g. investors who happen to hit this page) never see the button
  // — relying solely on a backend 403 would expose a control they cannot use.
  const canGenerateInvoice = user?.role === "manager" || user?.role === "admin";

  const { data: contracts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/rental-contracts"],
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/rental-clients"],
  });

  const { data: trailers = [] } = useQuery<any[]>({
    queryKey: ["/api/trailers"],
  });

  const form = useForm<InsertRentalContract>({
    resolver: zodResolver(insertRentalContractSchema),
    defaultValues: {
      contractNumber: "",
      clientId: "",
      trailerId: "",
      startDate: "",
      endDate: "",
      monthlyRate: "",
      duration: 3,
      status: "active",
      notes: "",
    },
  });

  const createContractMutation = useMutation({
    mutationFn: async (data: InsertRentalContract) => {
      return await apiRequest("POST", "/api/rental-contracts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-contracts"] });
      toast({
        title: t('rentalContracts.toastCreateTitle'),
        description: t('rentalContracts.toastCreateDescription'),
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t('rentalContracts.toastCreateErrorTitle'),
        description: error?.message || t('rentalContracts.toastCreateErrorDescription'),
        variant: "destructive",
      });
    },
  });

  const updateContractMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertRentalContract> }) => {
      return await apiRequest("PUT", `/api/rental-contracts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-contracts"] });
      toast({
        title: t('rentalContracts.toastUpdateTitle'),
        description: t('rentalContracts.toastUpdateDescription'),
      });
      setDialogOpen(false);
      setEditingContract(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t('rentalContracts.toastUpdateErrorTitle'),
        description: error?.message || t('rentalContracts.toastUpdateErrorDescription'),
        variant: "destructive",
      });
    },
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/rental-contracts/${id}/generate-invoice`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rental-contracts"] });
      toast({
        title: t('rentalContracts.toastGenerateInvoiceTitle'),
        description: t('rentalContracts.toastGenerateInvoiceDescription'),
      });
      setGenerateInvoiceContract(null);
    },
    onError: (error: any) => {
      // apiRequest in this codebase attaches the HTTP status to the thrown
      // Error as `error.status` (see client/src/lib/queryClient.ts). Use
      // that as the deterministic source of truth — the response body is
      // not preserved beyond `message`, so substring sniffing on the
      // localized server message is unreliable.
      const status: number | undefined = error?.status;
      const message: string = error?.message || "";
      if (status === 409) {
        toast({
          title: t('rentalContracts.toastGenerateInvoiceDuplicateTitle'),
          description: t('rentalContracts.toastGenerateInvoiceDuplicateDescription'),
          variant: "destructive",
        });
      } else if (status === 422) {
        toast({
          title: t('rentalContracts.toastGenerateInvoiceErrorTitle'),
          description: t('rentalContracts.toastGenerateInvoiceMissingRateDescription'),
          variant: "destructive",
        });
      } else {
        toast({
          title: t('rentalContracts.toastGenerateInvoiceErrorTitle'),
          description: message || t('rentalContracts.toastGenerateInvoiceErrorDescription'),
          variant: "destructive",
        });
      }
      setGenerateInvoiceContract(null);
    },
  });

  const terminateContractMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/rental-contracts/${id}/terminate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-contracts"] });
      toast({
        title: t('rentalContracts.toastTerminateTitle'),
        description: t('rentalContracts.toastTerminateDescription'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('rentalContracts.toastTerminateErrorTitle'),
        description: error?.message || t('rentalContracts.toastTerminateErrorDescription'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertRentalContract) => {
    if (editingContract) {
      updateContractMutation.mutate({ id: editingContract.id, data });
    } else {
      createContractMutation.mutate(data);
    }
  };

  const handleEdit = (contract: any) => {
    setEditingContract(contract);
    form.reset({
      contractNumber: contract.contractNumber,
      clientId: contract.clientId,
      trailerId: contract.trailerId,
      startDate: contract.startDate,
      endDate: contract.endDate,
      monthlyRate: contract.monthlyRate,
      duration: contract.duration,
      status: contract.status,
      notes: contract.notes || "",
    });
    setDialogOpen(true);
  };

  const handleTerminate = (id: string) => {
    if (confirm(t('rentalContracts.confirmTerminate'))) {
      terminateContractMutation.mutate(id);
    }
  };

  const handleNewContract = () => {
    setEditingContract(null);
    form.reset({
      contractNumber: "",
      clientId: "",
      trailerId: "",
      startDate: "",
      endDate: "",
      monthlyRate: "1500.00",
      duration: 3,
      status: "active",
      notes: "",
    });
    setDialogOpen(true);
  };

  const handleViewDetails = (contract: any) => {
    setSelectedContract(contract);
    setDetailsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      active: t('rentalContracts.statusActive'),
      expired: t('rentalContracts.statusExpired'),
      cancelled: t('rentalContracts.statusCancelled'),
    };
    const variants: Record<string, string> = {
      active:
        "bg-emerald-500 text-white hover:bg-emerald-500/90 font-medium border-none rounded-sm px-2.5 py-0.5 text-xs uppercase tracking-wide",
      expired:
        "bg-amber-500 text-white hover:bg-amber-500/90 font-medium border-none rounded-sm px-2.5 py-0.5 text-xs uppercase tracking-wide",
      cancelled:
        "bg-slate-500 text-white hover:bg-slate-500/90 font-medium border-none rounded-sm px-2.5 py-0.5 text-xs uppercase tracking-wide",
    };
    const label = labels[status] || labels.active;
    const variant = variants[status] || variants.active;
    return <Badge className={variant}>{label}</Badge>;
  };

  const getClientName = (clientId: string) => {
    const client = clients.find((c: any) => c.id === clientId);
    return client ? client.companyName : t('rentalContracts.unknownClient');
  };

  const getTrailerName = (trailerId: string) => {
    const trailer = trailers.find((t: any) => t.id === trailerId);
    return trailer ? `${trailer.trailerId} - ${trailer.model}` : t('rentalContracts.unknownTrailer');
  };

  const formatMonthlyRate = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (Number.isNaN(num)) return String(value);
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 bg-background">
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const stats = {
    total: contracts.length,
    active: contracts.filter((c: any) => c.status === "active").length,
    expired: contracts.filter((c: any) => c.status === "expired").length,
    cancelled: contracts.filter((c: any) => c.status === "cancelled").length,
  };

  const filteredContracts = contracts.filter((c: any) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      term === "" ||
      (c.contractNumber || "").toLowerCase().includes(term) ||
      getClientName(c.clientId).toLowerCase().includes(term);
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const ActionMenu = ({ contract }: { contract: any }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          data-testid={`button-actions-${contract.id}`}
        >
          <span className="sr-only">{t('rentalContracts.openMenu', 'Abrir menu')}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('rentalContracts.actionsLabel', 'Ações')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleViewDetails(contract)}
          className="cursor-pointer"
          data-testid={`menu-view-${contract.id}`}
        >
          <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{t('rentalContracts.actionViewDetails', 'Ver Detalhes')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleEdit(contract)}
          className="cursor-pointer"
          data-testid={`menu-edit-${contract.id}`}
        >
          <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{t('rentalContracts.actionEdit', 'Editar')}</span>
        </DropdownMenuItem>
        {contract.status === "active" && canGenerateInvoice && (
          <DropdownMenuItem
            onClick={() => setGenerateInvoiceContract(contract)}
            className="cursor-pointer"
            data-testid={`menu-generate-invoice-${contract.id}`}
          >
            <Receipt className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-600 dark:text-blue-400">
              {t('rentalContracts.generateInvoiceNow')}
            </span>
          </DropdownMenuItem>
        )}
        {contract.status === "active" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleTerminate(contract.id)}
              className="cursor-pointer focus:bg-red-50 dark:focus:bg-red-500/10"
              data-testid={`menu-terminate-${contract.id}`}
            >
              <XCircle className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-red-600 dark:text-red-400">
                {t('rentalContracts.actionTerminate', 'Encerrar Contrato')}
              </span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div
      className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 bg-background min-h-screen"
      data-testid="page-rental-contracts"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1
            className="text-2xl font-bold text-foreground tracking-tight"
            data-testid="heading-rental-contracts"
          >
            {t('rentalContracts.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('rentalContracts.subtitle')}
          </p>
        </div>
        <Button
          onClick={handleNewContract}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm font-medium w-full sm:w-auto"
          data-testid="button-new-contract"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{t('rentalContracts.newContract')}</span>
          <span className="sm:hidden">{t('rentalContracts.newContractShort')}</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {t('rentalContracts.totalContracts')}
              </p>
              <h3
                className="text-2xl font-bold text-foreground"
                data-testid="text-total-contracts"
              >
                {stats.total}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {t('rentalContracts.active')}
              </p>
              <h3
                className="text-2xl font-bold text-emerald-600 dark:text-emerald-400"
                data-testid="text-active-contracts"
              >
                {stats.active}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {t('rentalContracts.expired')}
              </p>
              <h3
                className="text-2xl font-bold text-amber-600 dark:text-amber-400"
                data-testid="text-expired-contracts"
              >
                {stats.expired}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {t('rentalContracts.cancelled')}
              </p>
              <h3
                className="text-2xl font-bold text-red-600 dark:text-red-400"
                data-testid="text-cancelled-contracts"
              >
                {stats.cancelled}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-50 dark:bg-red-500/15 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 md:p-5 border-b border-border flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('rentalContracts.searchPlaceholder', 'Buscar por contrato ou cliente...')}
              className="pl-9 bg-muted/40 border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-contracts"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full md:w-56">
              <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="bg-muted/40 border-border"
                  data-testid="select-status-filter"
                >
                  <SelectValue
                    placeholder={t('rentalContracts.filterAllStatus', 'Todos os status')}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    {t('rentalContracts.filterAllStatus', 'Todos os status')}
                  </SelectItem>
                  <SelectItem value="ACTIVE">{t('rentalContracts.statusActive')}</SelectItem>
                  <SelectItem value="EXPIRED">{t('rentalContracts.statusExpired')}</SelectItem>
                  <SelectItem value="CANCELLED">{t('rentalContracts.statusCancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/40">
              <tr className="border-b border-border">
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('rentalContracts.tableContract')}
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('rentalContracts.tableClient')}
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  {t('rentalContracts.tableTrailer')}
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                  {t('rentalContracts.tablePeriod')}
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('rentalContracts.tableMonthlyRate')}
                </th>
                <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('rentalContracts.tableStatus')}
                </th>
                <th className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('rentalContracts.tableActions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts && filteredContracts.length > 0 ? (
                filteredContracts.map((contract: any) => (
                  <tr
                    key={contract.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                    data-testid={`row-contract-${contract.id}`}
                  >
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className="text-sm font-medium text-foreground"
                        data-testid={`text-contract-number-${contract.id}`}
                      >
                        {contract.contractNumber}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span
                        className="text-sm text-foreground"
                        data-testid={`text-client-${contract.id}`}
                      >
                        {getClientName(contract.clientId)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {getTrailerName(contract.trailerId)}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden xl:table-cell">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {contract.startDate} → {contract.endDate}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className="text-sm font-semibold text-emerald-600 dark:text-emerald-400"
                        data-testid={`text-monthly-rate-${contract.id}`}
                      >
                        {formatMonthlyRate(contract.monthlyRate)}
                      </span>
                    </td>
                    <td
                      className="px-4 sm:px-6 py-4 whitespace-nowrap"
                      data-testid={`status-${contract.id}`}
                    >
                      {getStatusBadge(contract.status)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                      <ActionMenu contract={contract} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">{t('rentalContracts.noContracts')}</p>
                      <p className="text-xs mt-1">{t('rentalContracts.noContractsHint')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden flex flex-col p-4 gap-4 bg-muted/20">
          {filteredContracts && filteredContracts.length > 0 ? (
            filteredContracts.map((contract: any) => (
              <Card
                key={contract.id}
                className="bg-card border border-border shadow-sm rounded-xl overflow-hidden"
                data-testid={`card-contract-${contract.id}`}
              >
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="p-4 border-b border-border flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p
                        className="font-medium text-foreground truncate"
                        data-testid={`text-contract-number-${contract.id}`}
                      >
                        {contract.contractNumber}
                      </p>
                    </div>
                    <div data-testid={`status-${contract.id}`}>
                      {getStatusBadge(contract.status)}
                    </div>
                  </div>

                  {/* Middle */}
                  <div className="p-4 grid grid-cols-2 gap-3 bg-muted/20">
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {t('rentalContracts.tableClient')}
                      </p>
                      <p
                        className="text-sm text-foreground font-medium line-clamp-1"
                        data-testid={`text-client-${contract.id}`}
                      >
                        {getClientName(contract.clientId)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {t('rentalContracts.tablePeriod')}
                      </p>
                      <p className="text-sm text-foreground">
                        {contract.startDate} → {contract.endDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {t('rentalContracts.tableMonthlyRate')}
                      </p>
                      <p
                        className="text-sm font-bold text-emerald-600 dark:text-emerald-400"
                        data-testid={`text-monthly-rate-${contract.id}`}
                      >
                        {formatMonthlyRate(contract.monthlyRate)}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(contract)}
                      className="flex-1 justify-center"
                      data-testid={`button-view-${contract.id}`}
                    >
                      <Eye className="mr-2 h-3.5 w-3.5" />
                      {t('rentalContracts.actionView', 'Ver')}
                    </Button>
                    <ActionMenu contract={contract} />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t('rentalContracts.noContracts')}</p>
              <p className="text-xs mt-1">{t('rentalContracts.noContractsHint')}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContract ? t('rentalContracts.dialogEditTitle') : t('rentalContracts.dialogCreateTitle')}
            </DialogTitle>
            <DialogDescription>
              {editingContract 
                ? t('rentalContracts.dialogEditDescription')
                : t('rentalContracts.dialogCreateDescription')}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contractNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rentalContracts.formContractNumber')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('rentalContracts.placeholderContractNumber')}
                          {...field}
                          data-testid="input-contract-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rentalContracts.formDuration')}</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-duration">
                            <SelectValue placeholder={t('rentalContracts.placeholderDuration')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="3">{t('rentalContracts.duration3Months')}</SelectItem>
                          <SelectItem value="6">{t('rentalContracts.duration6Months')}</SelectItem>
                          <SelectItem value="12">{t('rentalContracts.duration12Months')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rentalContracts.formClient')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-client">
                            <SelectValue placeholder={t('rentalContracts.placeholderClient')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client: any) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.companyName}
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
                  name="trailerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rentalContracts.formTrailer')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-trailer">
                            <SelectValue placeholder={t('rentalContracts.placeholderTrailer')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {trailers.map((trailer: any) => (
                            <SelectItem key={trailer.id} value={trailer.id}>
                              {trailer.trailerId} - {trailer.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rentalContracts.formStartDate')}</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-start-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rentalContracts.formEndDate')}</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-end-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="monthlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rentalContracts.formMonthlyRate')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder={t('rentalContracts.placeholderMonthlyRate')}
                          {...field}
                          data-testid="input-monthly-rate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rentalContracts.formStatus')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder={t('rentalContracts.placeholderStatus')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">{t('rentalContracts.statusActive')}</SelectItem>
                          <SelectItem value="expired">{t('rentalContracts.statusExpired')}</SelectItem>
                          <SelectItem value="cancelled">{t('rentalContracts.statusCancelled')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('rentalContracts.formNotes')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('rentalContracts.placeholderNotes')}
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingContract(null);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  {t('rentalContracts.buttonCancel')}
                </Button>
                <Button
                  type="submit"
                  className="bg-accent hover:bg-accent/90"
                  disabled={createContractMutation.isPending || updateContractMutation.isPending}
                  data-testid="button-submit"
                >
                  {createContractMutation.isPending || updateContractMutation.isPending
                    ? (editingContract ? t('rentalContracts.buttonUpdating') : t('rentalContracts.buttonCreating'))
                    : (editingContract ? t('rentalContracts.buttonUpdate') : t('rentalContracts.buttonCreate'))}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('rentalContracts.dialogDetailsTitle')}</DialogTitle>
            <DialogDescription>
              {t('rentalContracts.dialogDetailsDescription', { number: selectedContract?.contractNumber })}
            </DialogDescription>
          </DialogHeader>

          {selectedContract && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">{t('rentalContracts.detailContractNumber')}</p>
                  <p className="text-base text-foreground font-semibold">{selectedContract.contractNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">{t('rentalContracts.detailStatus')}</p>
                  {getStatusBadge(selectedContract.status)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">{t('rentalContracts.detailClient')}</p>
                  <p className="text-base text-foreground">{getClientName(selectedContract.clientId)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">{t('rentalContracts.detailTrailer')}</p>
                  <p className="text-base text-foreground">{getTrailerName(selectedContract.trailerId)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">{t('rentalContracts.detailStartDate')}</p>
                  <p className="text-base text-foreground">{selectedContract.startDate}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">{t('rentalContracts.detailEndDate')}</p>
                  <p className="text-base text-foreground">{selectedContract.endDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">{t('rentalContracts.detailMonthlyRate')}</p>
                  <p className="text-base text-foreground font-bold">
                    ${parseFloat(selectedContract.monthlyRate).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">{t('rentalContracts.detailDuration')}</p>
                  <p className="text-base text-foreground">{selectedContract.duration} {t('rentalContracts.detailDurationMonths')}</p>
                </div>
              </div>

              {selectedContract.notes && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">{t('rentalContracts.detailNotes')}</p>
                  <p className="text-base text-foreground">{selectedContract.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!generateInvoiceContract}
        onOpenChange={(open) => {
          if (!open && !generateInvoiceMutation.isPending) {
            setGenerateInvoiceContract(null);
          }
        }}
      >
        <AlertDialogContent data-testid="dialog-generate-invoice-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('rentalContracts.generateInvoiceConfirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {generateInvoiceContract
                ? t('rentalContracts.generateInvoiceConfirmDescription', {
                    contract: generateInvoiceContract.contractNumber,
                    client: getClientName(generateInvoiceContract.clientId),
                  })
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={generateInvoiceMutation.isPending}
              data-testid="button-cancel-generate-invoice"
            >
              {t('rentalContracts.buttonCancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (generateInvoiceContract) {
                  generateInvoiceMutation.mutate(generateInvoiceContract.id);
                }
              }}
              disabled={generateInvoiceMutation.isPending}
              data-testid="button-confirm-generate-invoice"
            >
              {generateInvoiceMutation.isPending
                ? t('rentalContracts.generateInvoiceGenerating')
                : t('rentalContracts.generateInvoiceConfirmAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
