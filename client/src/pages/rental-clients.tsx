import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Edit, Trash2, Mail, Phone, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRentalClientSchema, type InsertRentalClient } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function RentalClients() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
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
      active: "bg-green-600 dark:bg-green-400 text-white",
      inactive: "bg-gray-500 dark:bg-gray-400 text-white",
      suspended: "bg-red-600 dark:bg-red-400 text-white",
    };
    const label = labels[status] || labels.active;
    const variant = variants[status] || variants.active;
    return <Badge className={variant}>{label}</Badge>;
  };

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

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8" data-testid="page-rental-clients">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="heading-rental-clients">
            {t('rentalClients.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('rentalClients.subtitle')}
          </p>
        </div>
        <Button
          onClick={handleNewClient}
          className="bg-accent hover:bg-accent/90 shadow-lg h-11 w-full sm:w-auto"
          data-testid="button-new-client"
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('rentalClients.newClient')}</span>
          <span className="sm:hidden">{t('rentalClients.newClientShort')}</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="border-l-4 border-l-accent shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-accent/10 p-3 rounded-2xl">
                <Building2 className="h-6 w-6 text-accent" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">{t('rentalClients.totalClients')}</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-total-clients">
              {stats.total}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-2xl">
                <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">{t('rentalClients.active')}</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-active-clients">
              {stats.active}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-500 shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-2xl">
                <Building2 className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">{t('rentalClients.inactive')}</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-inactive-clients">
              {stats.inactive}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-50 dark:bg-red-950 p-3 rounded-2xl">
                <Building2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">{t('rentalClients.suspended')}</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-suspended-clients">
              {stats.suspended}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card className="shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg font-bold">{t('rentalClients.clientList')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('rentalClients.tableCompany')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    {t('rentalClients.tableTaxId')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    {t('rentalClients.tableContact')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                    {t('rentalClients.tableLocation')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('rentalClients.tableStatus')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('rentalClients.tableActions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {clients && clients.length > 0 ? (
                  clients.map((client: any) => (
                    <tr
                      key={client.id}
                      className="hover:bg-muted/30 transition-colors"
                      data-testid={`row-client-${client.id}`}
                    >
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-accent/10 p-2 rounded-lg">
                            <Building2 className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {client.companyName}
                            </p>
                            {client.tradeName && (
                              <p className="text-xs text-muted-foreground">
                                {client.tradeName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <span className="text-sm text-foreground font-mono">
                          {client.taxId}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-foreground">{client.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-foreground">{client.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden xl:table-cell">
                        {client.city && client.state ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">
                              {client.city}, {client.state}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(client.status)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(client)}
                            data-testid={`button-view-${client.id}`}
                          >
                            <span className="text-xs">{t('rentalClients.buttonView')}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(client)}
                            data-testid={`button-edit-${client.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(client.id)}
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-delete-${client.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-center text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">{t('rentalClients.noClients')}</p>
                        <p className="text-xs mt-1">{t('rentalClients.noClientsHint')}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
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
