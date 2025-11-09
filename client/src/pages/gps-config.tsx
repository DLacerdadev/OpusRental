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
import { Satellite, Plus, Edit, Trash2, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGpsDeviceSchema, type InsertGpsDevice } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";

export default function GpsConfig() {
  const { t, i18n } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const { toast } = useToast();

  const { data: devices = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/gps/devices"],
  });

  const { data: trailers = [] } = useQuery<any[]>({
    queryKey: ["/api/trailers"],
  });

  const form = useForm<InsertGpsDevice>({
    resolver: zodResolver(insertGpsDeviceSchema),
    defaultValues: {
      trailerId: "",
      provider: "generic",
      deviceId: "",
      status: "active",
    },
  });

  const createDeviceMutation = useMutation({
    mutationFn: async (data: InsertGpsDevice) => {
      return await apiRequest("POST", "/api/gps/devices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gps/devices"] });
      toast({
        title: t('gpsConfig.toastCreateTitle'),
        description: t('gpsConfig.toastCreateDescription'),
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t('gpsConfig.toastCreateErrorTitle'),
        description: error?.message ?? t('gpsConfig.toastCreateErrorDescription'),
        variant: "destructive",
      });
    },
  });

  const updateDeviceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertGpsDevice> }) => {
      return await apiRequest("PUT", `/api/gps/devices/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gps/devices"] });
      toast({
        title: t('gpsConfig.toastUpdateTitle'),
        description: t('gpsConfig.toastUpdateDescription'),
      });
      setDialogOpen(false);
      setEditingDevice(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t('gpsConfig.toastUpdateErrorTitle'),
        description: error?.message ?? t('gpsConfig.toastUpdateErrorDescription'),
        variant: "destructive",
      });
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/gps/devices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gps/devices"] });
      toast({
        title: t('gpsConfig.toastDeleteTitle'),
        description: t('gpsConfig.toastDeleteDescription'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('gpsConfig.toastDeleteErrorTitle'),
        description: error?.message ?? t('gpsConfig.toastDeleteErrorDescription'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertGpsDevice) => {
    if (editingDevice) {
      updateDeviceMutation.mutate({ id: editingDevice.id, data });
    } else {
      createDeviceMutation.mutate(data);
    }
  };

  const handleEdit = (device: any) => {
    setEditingDevice(device);
    form.reset({
      trailerId: device.trailerId,
      provider: device.provider,
      deviceId: device.deviceId,
      status: device.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('gpsConfig.confirmDelete'))) {
      deleteDeviceMutation.mutate(id);
    }
  };

  const handleNewDevice = () => {
    setEditingDevice(null);
    form.reset({
      trailerId: "",
      provider: "generic",
      deviceId: "",
      status: "active",
    });
    setDialogOpen(true);
  };

  const getStatusBadge = (device: any) => {
    const isOnline = device.lastPing && 
      (new Date().getTime() - new Date(device.lastPing).getTime()) < 1800000; // 30 minutes

    if (device.status === "inactive") {
      return <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">{t('gpsConfig.statusInactive')}</Badge>;
    }

    return isOnline ? (
      <Badge variant="default" className="bg-green-600 dark:bg-green-400">{t('gpsConfig.statusOnline')}</Badge>
    ) : (
      <Badge variant="destructive">{t('gpsConfig.statusOffline')}</Badge>
    );
  };

  const getProviderBadge = (provider: string) => {
    const colors: Record<string, string> = {
      generic: "bg-gray-500 dark:bg-gray-400",
      geotab: "bg-blue-600 dark:bg-blue-400",
      samsara: "bg-purple-600 dark:bg-purple-400",
      traccar: "bg-orange-600 dark:bg-orange-400",
    };

    const labels: Record<string, string> = {
      generic: t('gpsConfig.providerGeneric'),
      geotab: t('gpsConfig.providerGeotab'),
      samsara: t('gpsConfig.providerSamsara'),
      traccar: t('gpsConfig.providerTraccar'),
    };

    return (
      <Badge className={`${colors[provider] || colors.generic} text-white`}>
        {labels[provider] || provider}
      </Badge>
    );
  };

  const getLastPingText = (lastPing: string | null) => {
    if (!lastPing) return t('gpsConfig.lastPingNever');
    
    const locale = i18n.language === 'pt-BR' ? ptBR : enUS;
    return formatDistanceToNow(new Date(lastPing), { addSuffix: true, locale });
  };

  const getTrailerName = (trailerId: string) => {
    const trailer = trailers?.find((t: any) => t.id === trailerId);
    return trailer ? trailer.trailerId : trailerId;
  };

  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8" data-testid="page-gps-config">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="heading-gps-config">
            {t('gpsConfig.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('gpsConfig.subtitle')}
          </p>
        </div>
        <Button
          onClick={handleNewDevice}
          className="bg-accent hover:bg-accent/90 shadow-lg h-11 w-full sm:w-auto"
          data-testid="button-new-device"
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('gpsConfig.newDevice')}</span>
          <span className="sm:hidden">{t('gpsConfig.newDeviceShort')}</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-2xl">
                <Satellite className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">{t('gpsConfig.totalDevices')}</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-total-devices">
              {devices?.length || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-2xl">
                <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">{t('gpsConfig.online')}</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-online-devices">
              {devices?.filter((d: any) => {
                const isOnline = d.lastPing && 
                  (new Date().getTime() - new Date(d.lastPing).getTime()) < 1800000;
                return d.status === "active" && isOnline;
              }).length || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-50 dark:bg-red-950 p-3 rounded-2xl">
                <Satellite className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">{t('gpsConfig.offline')}</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-offline-devices">
              {devices?.filter((d: any) => {
                const isOnline = d.lastPing && 
                  (new Date().getTime() - new Date(d.lastPing).getTime()) < 1800000;
                return d.status === "active" && !isOnline;
              }).length || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-500 shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-2xl">
                <Satellite className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">{t('gpsConfig.inactive')}</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-inactive-devices">
              {devices?.filter((d: any) => d.status === "inactive").length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* GPS Devices Table */}
      <Card className="shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg font-bold">{t('gpsConfig.gpsDevices')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('gpsConfig.tableTrailer')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    {t('gpsConfig.tableProvider')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('gpsConfig.tableDeviceId')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    {t('gpsConfig.tableLastPing')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('gpsConfig.tableStatus')}
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('gpsConfig.tableActions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {devices && devices.length > 0 ? (
                  devices.map((device: any) => (
                    <tr
                      key={device.id}
                      className="hover:bg-muted/30 transition-colors"
                      data-testid={`row-device-${device.id}`}
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Satellite className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {getTrailerName(device.trailerId)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        {getProviderBadge(device.provider)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-foreground">{device.deviceId}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {getLastPingText(device.lastPing)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(device)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(device)}
                            data-testid={`button-edit-${device.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(device.id)}
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-delete-${device.id}`}
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
                        <Satellite className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">{t('gpsConfig.noDevices')}</p>
                        <p className="text-xs mt-1">{t('gpsConfig.noDevicesHint')}</p>
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
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDevice ? t('gpsConfig.dialogEditTitle') : t('gpsConfig.dialogNewTitle')}
            </DialogTitle>
            <DialogDescription>
              {editingDevice 
                ? t('gpsConfig.dialogEditDescription')
                : t('gpsConfig.dialogNewDescription')}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="trailerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('gpsConfig.formTrailer')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!!editingDevice}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-trailer">
                          <SelectValue placeholder={t('gpsConfig.placeholderSelectTrailer')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {trailers?.map((trailer: any) => (
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

              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('gpsConfig.formProvider')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-provider">
                          <SelectValue placeholder={t('gpsConfig.placeholderSelectProvider')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="generic">{t('gpsConfig.providerGeneric')}</SelectItem>
                        <SelectItem value="geotab">{t('gpsConfig.providerGeotab')}</SelectItem>
                        <SelectItem value="samsara">{t('gpsConfig.providerSamsara')}</SelectItem>
                        <SelectItem value="traccar">{t('gpsConfig.providerTraccar')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('gpsConfig.formDeviceId')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('gpsConfig.placeholderDeviceId')}
                        {...field}
                        data-testid="input-device-id"
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
                    <FormLabel>{t('gpsConfig.formStatus')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder={t('gpsConfig.placeholderSelectStatus')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">{t('gpsConfig.selectStatusActive')}</SelectItem>
                        <SelectItem value="inactive">{t('gpsConfig.selectStatusInactive')}</SelectItem>
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
                    setEditingDevice(null);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  {t('gpsConfig.buttonCancel')}
                </Button>
                <Button
                  type="submit"
                  className="bg-accent hover:bg-accent/90"
                  disabled={createDeviceMutation.isPending || updateDeviceMutation.isPending}
                  data-testid="button-submit"
                >
                  {editingDevice ? t('gpsConfig.buttonUpdate') : t('gpsConfig.buttonCreate')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
