import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Truck, Package, Clock, CheckCircle, Plus, MapPin, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type BrokerDispatch = {
  id: string;
  dispatchNumber: string;
  trailerId: string;
  brokerName: string;
  brokerEmail: string;
  brokerPhone: string | null;
  pickupLocation: string;
  pickupDate: string;
  deliveryLocation: string;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  loadType: string;
  specialInstructions: string | null;
  dispatchDocumentUrl: string | null;
  status: "pending" | "dispatched" | "in_transit" | "delivered" | "cancelled";
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type Trailer = {
  id: string;
  trailerId: string;
  model: string;
  status: string;
};

type BrokerDispatchFormData = z.infer<ReturnType<typeof getBrokerDispatchFormSchema>>;

const getBrokerDispatchFormSchema = (t: (key: string) => string) => z.object({
  trailerId: z.string().min(1, t("broker.validation.trailerRequired")),
  brokerName: z.string().min(1, t("broker.validation.brokerNameRequired")),
  brokerEmail: z.string().min(1, t("broker.validation.emailRequired")).email(t("broker.validation.emailInvalid")),
  brokerPhone: z.string().optional(),
  pickupLocation: z.string().min(1, t("broker.validation.pickupLocationRequired")),
  pickupDate: z.string().min(1, t("broker.validation.pickupDateRequired")),
  deliveryLocation: z.string().min(1, t("broker.validation.deliveryLocationRequired")),
  estimatedDeliveryDate: z.string().optional(),
  loadType: z.string().min(1, t("broker.validation.loadTypeRequired")),
  specialInstructions: z.string().optional(),
  notes: z.string().optional(),
});

export default function BrokerPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<BrokerDispatch | null>(null);

  const brokerDispatchFormSchema = getBrokerDispatchFormSchema(t);

  const { data: dispatches, isLoading } = useQuery<BrokerDispatch[]>({
    queryKey: ["/api/broker-dispatches"],
  });

  const { data: trailers } = useQuery<Trailer[]>({
    queryKey: ["/api/trailers"],
  });

  const createForm = useForm<BrokerDispatchFormData>({
    resolver: zodResolver(brokerDispatchFormSchema),
    defaultValues: {
      trailerId: "",
      brokerName: "",
      brokerEmail: "",
      brokerPhone: "",
      pickupLocation: "",
      pickupDate: "",
      deliveryLocation: "",
      estimatedDeliveryDate: "",
      loadType: "",
      specialInstructions: "",
      notes: "",
    },
  });

  const editForm = useForm<BrokerDispatchFormData>({
    resolver: zodResolver(brokerDispatchFormSchema),
    defaultValues: {
      trailerId: "",
      brokerName: "",
      brokerEmail: "",
      brokerPhone: "",
      pickupLocation: "",
      pickupDate: "",
      deliveryLocation: "",
      estimatedDeliveryDate: "",
      loadType: "",
      specialInstructions: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (selectedDispatch) {
      editForm.reset({
        trailerId: selectedDispatch.trailerId,
        brokerName: selectedDispatch.brokerName,
        brokerEmail: selectedDispatch.brokerEmail,
        brokerPhone: selectedDispatch.brokerPhone || "",
        pickupLocation: selectedDispatch.pickupLocation,
        pickupDate: selectedDispatch.pickupDate,
        deliveryLocation: selectedDispatch.deliveryLocation,
        estimatedDeliveryDate: selectedDispatch.estimatedDeliveryDate || "",
        loadType: selectedDispatch.loadType,
        specialInstructions: selectedDispatch.specialInstructions || "",
        notes: selectedDispatch.notes || "",
      });
    }
  }, [selectedDispatch, editForm]);

  const createMutation = useMutation({
    mutationFn: async (data: BrokerDispatchFormData) => {
      return await apiRequest("/api/broker-dispatches", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broker-dispatches"] });
      toast({
        title: t("broker.messages.createSuccess"),
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({
        title: t("broker.messages.createError"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: BrokerDispatchFormData) => {
      return await apiRequest(`/api/broker-dispatches/${selectedDispatch!.id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broker-dispatches"] });
      toast({
        title: t("broker.messages.updateSuccess"),
      });
      setSelectedDispatch(null);
      editForm.reset();
    },
    onError: () => {
      toast({
        title: t("broker.messages.updateError"),
        variant: "destructive",
      });
    },
  });

  const onCreateSubmit = (data: BrokerDispatchFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: BrokerDispatchFormData) => {
    updateMutation.mutate(data);
  };

  const stats = {
    total: dispatches?.length || 0,
    pending: dispatches?.filter((d) => d.status === "pending").length || 0,
    inTransit: dispatches?.filter((d) => d.status === "in_transit").length || 0,
    delivered: dispatches?.filter((d) => d.status === "delivered").length || 0,
  };

  const getStatusBadge = (status: BrokerDispatch["status"]) => {
    const variants: Record<BrokerDispatch["status"], { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "secondary", label: t("broker.status.pending") },
      dispatched: { variant: "default", label: t("broker.status.dispatched") },
      in_transit: { variant: "default", label: t("broker.status.inTransit") },
      delivered: { variant: "outline", label: t("broker.status.delivered") },
      cancelled: { variant: "destructive", label: t("broker.status.cancelled") },
    };
    const config = variants[status];
    return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
              {t("broker.title")}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1" data-testid="text-page-subtitle">
              {t("broker.subtitle")}
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)} 
            className="w-full sm:w-auto"
            data-testid="button-create-dispatch"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("broker.createDispatch")}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card data-testid="card-stat-total">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("broker.stats.totalDispatches")}
              </CardTitle>
              <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-stat-total">
                {stats.total}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("broker.stats.allTime")}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-pending">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("broker.stats.pending")}
              </CardTitle>
              <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400" data-testid="text-stat-pending">
                {stats.pending}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("broker.stats.awaitingDispatch")}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-in-transit">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("broker.stats.inTransit")}
              </CardTitle>
              <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-stat-in-transit">
                {stats.inTransit}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("broker.stats.onTheRoad")}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-delivered">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("broker.stats.delivered")}
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-stat-delivered">
                {stats.delivered}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("broker.stats.completed")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card data-testid="card-dispatches-table">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("broker.table.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400" data-testid="text-loading">
                {t("common.loading")}
              </div>
            ) : dispatches && dispatches.length > 0 ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">{t("broker.table.dispatchNumber")}</TableHead>
                      <TableHead className="min-w-[100px]">{t("broker.table.trailer")}</TableHead>
                      <TableHead className="min-w-[150px]">{t("broker.table.broker")}</TableHead>
                      <TableHead className="min-w-[150px]">{t("broker.table.pickup")}</TableHead>
                      <TableHead className="min-w-[150px]">{t("broker.table.delivery")}</TableHead>
                      <TableHead className="min-w-[120px]">{t("broker.table.loadType")}</TableHead>
                      <TableHead className="min-w-[100px]">{t("broker.table.status")}</TableHead>
                      <TableHead className="min-w-[100px]">{t("broker.table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dispatches.map((dispatch) => (
                      <TableRow key={dispatch.id} data-testid={`row-dispatch-${dispatch.id}`}>
                        <TableCell className="font-medium" data-testid={`text-dispatch-number-${dispatch.id}`}>
                          {dispatch.dispatchNumber}
                        </TableCell>
                        <TableCell data-testid={`text-trailer-${dispatch.id}`}>
                          {dispatch.trailerId}
                        </TableCell>
                        <TableCell data-testid={`text-broker-${dispatch.id}`}>
                          <div>
                            <div className="font-medium">{dispatch.brokerName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {dispatch.brokerEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-pickup-${dispatch.id}`}>
                          <div className="flex items-start gap-1">
                            <MapPin className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" />
                            <div>
                              <div className="text-sm">{dispatch.pickupLocation}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(dispatch.pickupDate), "MMM dd, yyyy")}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-delivery-${dispatch.id}`}>
                          <div className="flex items-start gap-1">
                            <MapPin className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" />
                            <div>
                              <div className="text-sm">{dispatch.deliveryLocation}</div>
                              {dispatch.estimatedDeliveryDate && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(dispatch.estimatedDeliveryDate), "MMM dd, yyyy")}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-load-type-${dispatch.id}`}>
                          <Badge variant="outline">{dispatch.loadType}</Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(dispatch.status)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDispatch(dispatch)}
                            data-testid={`button-edit-${dispatch.id}`}
                          >
                            {t("common.edit")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400" data-testid="text-empty-state">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-1">{t("broker.emptyState.title")}</p>
                <p className="text-sm">{t("broker.emptyState.description")}</p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)} 
                  className="mt-4"
                  data-testid="button-create-first-dispatch"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("broker.createDispatch")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-dispatch">
          <DialogHeader>
            <DialogTitle>{t("broker.createDispatch")}</DialogTitle>
            <DialogDescription>{t("broker.form.title")}</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="trailerId"
                render={({ field }) => (
                  <FormItem data-testid="form-item-trailer">
                    <FormLabel>{t("broker.form.trailer")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-trailer">
                          <SelectValue placeholder={t("broker.form.trailerPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {trailers?.map((trailer) => (
                          <SelectItem 
                            key={trailer.id} 
                            value={trailer.id}
                            data-testid={`select-option-trailer-${trailer.id}`}
                          >
                            {trailer.trailerId} - {trailer.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="brokerName"
                  render={({ field }) => (
                    <FormItem data-testid="form-item-broker-name">
                      <FormLabel>{t("broker.form.brokerName")}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-broker-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="brokerEmail"
                  render={({ field }) => (
                    <FormItem data-testid="form-item-broker-email">
                      <FormLabel>{t("broker.form.brokerEmail")}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-broker-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="brokerPhone"
                render={({ field }) => (
                  <FormItem data-testid="form-item-broker-phone">
                    <FormLabel>{t("broker.form.brokerPhone")}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-broker-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="pickupLocation"
                  render={({ field }) => (
                    <FormItem data-testid="form-item-pickup-location">
                      <FormLabel>{t("broker.form.pickupLocation")}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-pickup-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="pickupDate"
                  render={({ field }) => (
                    <FormItem data-testid="form-item-pickup-date">
                      <FormLabel>{t("broker.form.pickupDate")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-pickup-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="deliveryLocation"
                  render={({ field }) => (
                    <FormItem data-testid="form-item-delivery-location">
                      <FormLabel>{t("broker.form.deliveryLocation")}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-delivery-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="estimatedDeliveryDate"
                  render={({ field }) => (
                    <FormItem data-testid="form-item-estimated-delivery-date">
                      <FormLabel>{t("broker.form.estimatedDeliveryDate")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-estimated-delivery-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createForm.control}
                name="loadType"
                render={({ field }) => (
                  <FormItem data-testid="form-item-load-type">
                    <FormLabel>{t("broker.form.loadType")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-load-type">
                          <SelectValue placeholder={t("broker.form.loadTypePlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full_load" data-testid="select-option-full-load">
                          {t("broker.form.loadTypes.full_load")}
                        </SelectItem>
                        <SelectItem value="partial_load" data-testid="select-option-partial-load">
                          {t("broker.form.loadTypes.partial_load")}
                        </SelectItem>
                        <SelectItem value="empty" data-testid="select-option-empty">
                          {t("broker.form.loadTypes.empty")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="specialInstructions"
                render={({ field }) => (
                  <FormItem data-testid="form-item-special-instructions">
                    <FormLabel>{t("broker.form.specialInstructions")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="textarea-special-instructions" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem data-testid="form-item-notes">
                    <FormLabel>{t("broker.form.notes")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="textarea-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-cancel-create"
                >
                  {t("common.cancel")}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  data-testid="button-submit-create"
                >
                  {createMutation.isPending ? t("broker.form.creating") : t("broker.form.create")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!selectedDispatch} onOpenChange={(open) => !open && setSelectedDispatch(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-dispatch">
          <DialogHeader>
            <DialogTitle>{t("common.edit")} - {selectedDispatch?.dispatchNumber}</DialogTitle>
            <DialogDescription>{t("broker.form.title")}</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="trailerId"
                render={({ field }) => (
                  <FormItem data-testid="form-item-edit-trailer">
                    <FormLabel>{t("broker.form.trailer")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-trailer">
                          <SelectValue placeholder={t("broker.form.trailerPlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {trailers?.map((trailer) => (
                          <SelectItem 
                            key={trailer.id} 
                            value={trailer.id}
                            data-testid={`select-edit-option-trailer-${trailer.id}`}
                          >
                            {trailer.trailerId} - {trailer.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="brokerName"
                  render={({ field }) => (
                    <FormItem data-testid="form-item-edit-broker-name">
                      <FormLabel>{t("broker.form.brokerName")}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-broker-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="brokerEmail"
                  render={({ field }) => (
                    <FormItem data-testid="form-item-edit-broker-email">
                      <FormLabel>{t("broker.form.brokerEmail")}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-edit-broker-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="brokerPhone"
                render={({ field }) => (
                  <FormItem data-testid="form-item-edit-broker-phone">
                    <FormLabel>{t("broker.form.brokerPhone")}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-broker-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="pickupLocation"
                  render={({ field }) => (
                    <FormItem data-testid="form-item-edit-pickup-location">
                      <FormLabel>{t("broker.form.pickupLocation")}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-pickup-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="pickupDate"
                  render={({ field }) => (
                    <FormItem data-testid="form-item-edit-pickup-date">
                      <FormLabel>{t("broker.form.pickupDate")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-edit-pickup-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="deliveryLocation"
                  render={({ field }) => (
                    <FormItem data-testid="form-item-edit-delivery-location">
                      <FormLabel>{t("broker.form.deliveryLocation")}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-delivery-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="estimatedDeliveryDate"
                  render={({ field }) => (
                    <FormItem data-testid="form-item-edit-estimated-delivery-date">
                      <FormLabel>{t("broker.form.estimatedDeliveryDate")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-edit-estimated-delivery-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="loadType"
                render={({ field }) => (
                  <FormItem data-testid="form-item-edit-load-type">
                    <FormLabel>{t("broker.form.loadType")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-load-type">
                          <SelectValue placeholder={t("broker.form.loadTypePlaceholder")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full_load" data-testid="select-edit-option-full-load">
                          {t("broker.form.loadTypes.full_load")}
                        </SelectItem>
                        <SelectItem value="partial_load" data-testid="select-edit-option-partial-load">
                          {t("broker.form.loadTypes.partial_load")}
                        </SelectItem>
                        <SelectItem value="empty" data-testid="select-edit-option-empty">
                          {t("broker.form.loadTypes.empty")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="specialInstructions"
                render={({ field }) => (
                  <FormItem data-testid="form-item-edit-special-instructions">
                    <FormLabel>{t("broker.form.specialInstructions")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="textarea-edit-special-instructions" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem data-testid="form-item-edit-notes">
                    <FormLabel>{t("broker.form.notes")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="textarea-edit-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedDispatch(null)}
                  data-testid="button-cancel-edit"
                >
                  {t("common.cancel")}
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateMutation.isPending ? t("broker.form.updating") : t("broker.form.update")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
