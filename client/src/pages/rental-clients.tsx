import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle,
  AlertCircle,
  MinusCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRentalClientSchema, type InsertRentalClient, type RentalClient } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function RentalClients() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { toast } = useToast();

  const { data: clients = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/rental-clients"],
  });

  const form = useForm<InsertRentalClient>({
    resolver: zodResolver(insertRentalClientSchema),
    defaultValues: {
      companyName: "",
      tradeName: "",
      taxId: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US",
      status: "active",
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: InsertRentalClient) => {
      return await apiRequest("POST", "/api/rental-clients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-clients"] });
      toast({
        title: t('rentalClients.toastCreateTitle'),
        description: t('rentalClients.toastCreateDescription'),
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t('rentalClients.toastCreateErrorTitle'),
        description: error?.message || t('rentalClients.toastCreateErrorDescription'),
        variant: "destructive",
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertRentalClient> }) => {
      return await apiRequest("PUT", `/api/rental-clients/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-clients"] });
      toast({
        title: t('rentalClients.toastUpdateTitle'),
        description: t('rentalClients.toastUpdateDescription'),
      });
      setDialogOpen(false);
      setEditingClient(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t('rentalClients.toastUpdateErrorTitle'),
        description: error?.message || t('rentalClients.toastUpdateErrorDescription'),
        variant: "destructive",
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/rental-clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-clients"] });
      toast({
        title: t('rentalClients.toastDeleteTitle'),
        description: t('rentalClients.toastDeleteDescription'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('rentalClients.toastDeleteErrorTitle'),
        description: error?.message || t('rentalClients.toastDeleteErrorDescription'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertRentalClient) => {
    if (editingClient) {
      updateClientMutation.mutate({ id: editingClient.id, data });
    } else {
      createClientMutation.mutate(data);
    }
  };

  const handleEdit = (client: any) => {
    setEditingClient(client);
    form.reset({
      companyName: client.companyName,
      tradeName: client.tradeName || "",
      taxId: client.taxId,
      email: client.email,
      phone: client.phone,
      address: client.address || "",
      city: client.city || "",
      state: client.state || "",
      zipCode: client.zipCode || "",
      country: client.country,
      status: client.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('rentalClients.confirmDelete'))) {
      deleteClientMutation.mutate(id);
    }
  };

  const handleNewClient = () => {
    setEditingClient(null);
    form.reset({
      companyName: "",
      tradeName: "",
      taxId: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "US",
      status: "active",
    });
    setDialogOpen(true);
  };

  const handleViewDetails = (client: any) => {
    setSelectedClient(client);
    setDetailsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      active: t('rentalClients.statusActive'),
      inactive: t('rentalClients.statusInactive'),
      suspended: t('rentalClients.statusSuspended'),
    };
    const variants: Record<string, string> = {
      active: "bg-emerald-500 text-white hover:bg-emerald-500/90",
      inactive: "bg-slate-500 text-white hover:bg-slate-500/90",
      suspended: "bg-red-500 text-white hover:bg-red-500/90",
    };
    const label = labels[status] || labels.active;
    const variant = variants[status] || variants.active;
    return (
      <Badge
        className={`${variant} font-medium border-none rounded-sm px-2.5 py-0.5 text-xs uppercase tracking-wide`}
      >
        {label}
      </Badge>
    );
  };

  const ActionMenu = ({ client }: { client: RentalClient }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          data-testid={`button-actions-${client.id}`}
        >
          <span className="sr-only">{t('rentalClients.tableActions')}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('rentalClients.tableActions')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => handleViewDetails(client)}
          data-testid={`button-view-${client.id}`}
        >
          <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{t('rentalClients.buttonView')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => handleEdit(client)}
          data-testid={`button-edit-${client.id}`}
        >
          <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{t('rentalClients.buttonEdit', 'Editar')}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer focus:bg-red-50 dark:focus:bg-red-500/15 focus:text-red-600 dark:focus:text-red-400"
          onClick={() => handleDelete(client.id)}
          data-testid={`button-delete-${client.id}`}
        >
          <Trash2 className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
          <span className="text-red-600 dark:text-red-400">
            {t('rentalClients.buttonDelete', 'Excluir')}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const stats = {
    total: clients?.length || 0,
    active: clients?.filter((c: any) => c.status === "active").length || 0,
    inactive: clients?.filter((c: any) => c.status === "inactive").length || 0,
    suspended: clients?.filter((c: any) => c.status === "suspended").length || 0,
  };

  const filteredClients = (clients || []).filter((client: RentalClient) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      term === "" ||
      client.companyName?.toLowerCase().includes(term) ||
      client.tradeName?.toLowerCase().includes(term) ||
      client.taxId?.toLowerCase().includes(term) ||
      client.email?.toLowerCase().includes(term);
    const matchesStatus =
      statusFilter === "ALL" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div
      className="bg-background p-4 md:p-6 lg:p-8 flex flex-col gap-6"
      data-testid="page-rental-clients"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1
            className="text-2xl font-bold text-foreground tracking-tight"
            data-testid="heading-rental-clients"
          >
            {t('rentalClients.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('rentalClients.subtitle')}
          </p>
        </div>
        <Button
          onClick={handleNewClient}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium w-full sm:w-auto"
          data-testid="button-new-client"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{t('rentalClients.newClient')}</span>
          <span className="sm:hidden">{t('rentalClients.newClientShort')}</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {t('rentalClients.totalClients')}
              </p>
              <h3
                className="text-2xl font-bold text-foreground"
                data-testid="text-total-clients"
              >
                {stats.total}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {t('rentalClients.active')}
              </p>
              <h3
                className="text-2xl font-bold text-emerald-600 dark:text-emerald-400"
                data-testid="text-active-clients"
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
                {t('rentalClients.inactive')}
              </p>
              <h3
                className="text-2xl font-bold text-foreground"
                data-testid="text-inactive-clients"
              >
                {stats.inactive}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <MinusCircle className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {t('rentalClients.suspended')}
              </p>
              <h3
                className="text-2xl font-bold text-red-600 dark:text-red-400"
                data-testid="text-suspended-clients"
              >
                {stats.suspended}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-50 dark:bg-red-500/15 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main List Card */}
      <Card className="bg-card border border-border shadow-sm rounded-xl overflow-hidden flex-1">
        {/* Toolbar */}
        <div className="p-4 md:p-5 border-b border-border flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t(
                'rentalClients.searchPlaceholder',
                'Buscar por empresa, CNPJ ou e-mail...'
              )}
              className="pl-9 bg-muted/40 border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-clients"
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
                    placeholder={t(
                      'rentalClients.allStatuses',
                      'Todos os status'
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    {t('rentalClients.allStatuses', 'Todos os status')}
                  </SelectItem>
                  <SelectItem value="active">
                    {t('rentalClients.statusActive')}
                  </SelectItem>
                  <SelectItem value="inactive">
                    {t('rentalClients.statusInactive')}
                  </SelectItem>
                  <SelectItem value="suspended">
                    {t('rentalClients.statusSuspended')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-4">
                  {t('rentalClients.tableCompany')}
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('rentalClients.tableTaxId')}
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('rentalClients.tableContact')}
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('rentalClients.tableLocation')}
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('rentalClients.tableStatus')}
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                  {t('rentalClients.tableActions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length > 0 ? (
                filteredClients.map((client: RentalClient) => (
                  <TableRow
                    key={client.id}
                    className="border-border hover:bg-muted/30 transition-colors"
                    data-testid={`row-client-${client.id}`}
                  >
                    <TableCell className="py-4">
                      <div>
                        <p
                          className="font-medium text-foreground"
                          data-testid={`text-company-${client.id}`}
                        >
                          {client.companyName}
                        </p>
                        {client.tradeName && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {client.tradeName}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className="font-mono text-sm text-foreground"
                      data-testid={`text-taxid-${client.id}`}
                    >
                      {client.taxId}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span>{client.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{client.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.city || client.state ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {[client.city, client.state]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell data-testid={`status-${client.id}`}>
                      {getStatusBadge(client.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ActionMenu client={client} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2 py-6">
                      <Building2 className="h-10 w-10 opacity-40" />
                      <p className="text-sm">{t('rentalClients.noClients')}</p>
                      <p className="text-xs">
                        {t('rentalClients.noClientsHint')}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden flex flex-col p-4 gap-4 bg-muted/20">
          {filteredClients.length > 0 ? (
            filteredClients.map((client: RentalClient) => (
              <Card
                key={client.id}
                className="bg-card border border-border shadow-sm overflow-hidden"
                data-testid={`card-client-${client.id}`}
              >
                <CardContent className="p-0">
                  <div className="p-4 border-b border-border flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p
                        className="font-medium text-foreground truncate"
                        data-testid={`text-company-${client.id}`}
                      >
                        {client.companyName}
                      </p>
                      {client.tradeName && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {client.tradeName}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">{getStatusBadge(client.status)}</div>
                  </div>

                  <div className="p-4 bg-muted/20 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {t('rentalClients.tableTaxId')}
                      </span>
                      <span className="text-sm font-mono text-foreground">
                        {client.taxId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                    {(client.city || client.state) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span>
                          {[client.city, client.state]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 justify-center"
                      onClick={() => handleViewDetails(client)}
                      data-testid={`button-view-mobile-${client.id}`}
                    >
                      <Eye className="mr-2 h-3.5 w-3.5" />
                      {t('rentalClients.buttonView')}
                    </Button>
                    <ActionMenu client={client} />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground bg-card rounded-lg border border-border">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{t('rentalClients.noClients')}</p>
              <p className="text-xs mt-1">{t('rentalClients.noClientsHint')}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? t('rentalClients.dialogEditTitle') : t('rentalClients.dialogCreateTitle')}
            </DialogTitle>
            <DialogDescription>
              {editingClient 
                ? t('rentalClients.dialogEditDescription')
                : t('rentalClients.dialogCreateDescription')}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rentalClients.formCompanyName')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('rentalClients.placeholderCompanyName')}
                          {...field}
                          data-testid="input-company-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tradeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rentalClients.formTradeName')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('rentalClients.placeholderTradeName')}
                          {...field}
                          data-testid="input-trade-name"
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
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rentalClients.formTaxId')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('rentalClients.placeholderTaxId')}
                          {...field}
                          data-testid="input-tax-id"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rentalClients.formCountry')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-country">
                            <SelectValue placeholder={t('rentalClients.placeholderCountry')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="US">{t('rentalClients.countryUS')}</SelectItem>
                          <SelectItem value="CA">{t('rentalClients.countryCA')}</SelectItem>
                          <SelectItem value="MX">{t('rentalClients.countryMX')}</SelectItem>
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rentalClients.formEmail')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t('rentalClients.placeholderEmail')}
                          {...field}
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rentalClients.formPhone')}</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder={t('rentalClients.placeholderPhone')}
                          {...field}
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('rentalClients.formAddress')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('rentalClients.placeholderAddress')}
                        {...field}
                        data-testid="input-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rentalClients.formCity')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('rentalClients.placeholderCity')}
                          {...field}
                          data-testid="input-city"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rentalClients.formState')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('rentalClients.placeholderState')}
                          {...field}
                          data-testid="input-state"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rentalClients.formZipCode')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('rentalClients.placeholderZipCode')}
                          {...field}
                          data-testid="input-zip-code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('rentalClients.formStatus')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder={t('rentalClients.placeholderStatus')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">{t('rentalClients.statusActive')}</SelectItem>
                        <SelectItem value="inactive">{t('rentalClients.statusInactive')}</SelectItem>
                        <SelectItem value="suspended">{t('rentalClients.statusSuspended')}</SelectItem>
                      </SelectContent>
                    </Select>
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
                    setEditingClient(null);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  {t('rentalClients.buttonCancel')}
                </Button>
                <Button
                  type="submit"
                  className="bg-accent hover:bg-accent/90"
                  disabled={createClientMutation.isPending || updateClientMutation.isPending}
                  data-testid="button-submit"
                >
                  {createClientMutation.isPending || updateClientMutation.isPending
                    ? (editingClient ? t('rentalClients.buttonUpdating') : t('rentalClients.buttonCreating'))
                    : (editingClient ? t('rentalClients.buttonUpdate') : t('rentalClients.buttonCreate'))}
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
            <DialogTitle>{t('rentalClients.dialogDetailsTitle')}</DialogTitle>
            <DialogDescription>
              {t('rentalClients.dialogDetailsDescription', { name: selectedClient?.companyName })}
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">{t('rentalClients.detailCompanyName')}</p>
                  <p className="text-base text-foreground">{selectedClient.companyName}</p>
                </div>
                {selectedClient.tradeName && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">{t('rentalClients.detailTradeName')}</p>
                    <p className="text-base text-foreground">{selectedClient.tradeName}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">{t('rentalClients.detailTaxId')}</p>
                  <p className="text-base text-foreground font-mono">{selectedClient.taxId}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">{t('rentalClients.detailCountry')}</p>
                  <p className="text-base text-foreground">{selectedClient.country}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">{t('rentalClients.detailEmail')}</p>
                  <p className="text-base text-foreground">{selectedClient.email}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">{t('rentalClients.detailPhone')}</p>
                  <p className="text-base text-foreground">{selectedClient.phone}</p>
                </div>
              </div>

              {selectedClient.address && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">{t('rentalClients.detailAddress')}</p>
                  <p className="text-base text-foreground">
                    {selectedClient.address}
                    {selectedClient.city && `, ${selectedClient.city}`}
                    {selectedClient.state && `, ${selectedClient.state}`}
                    {selectedClient.zipCode && ` ${selectedClient.zipCode}`}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">{t('rentalClients.detailStatus')}</p>
                {getStatusBadge(selectedClient.status)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
