import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Wrench, Plus, CheckCircle, Eye, Pencil, AlertCircle } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

type MaintenanceSchedule = {
  id: string;
  trailerId: string;
  scheduleType: "time_based" | "km_based";
  intervalDays?: number;
  intervalKm?: string;
  lastMaintenanceDate?: string;
  lastMaintenanceKm?: string;
  nextMaintenanceDate?: string;
  nextMaintenanceKm?: string;
  status: "scheduled" | "urgent" | "completed";
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

type Trailer = {
  id: string;
  trailerId: string;
};

type MaintenanceFormData = {
  trailerId: string;
  scheduleType: "time_based" | "km_based";
  intervalDays?: number;
  intervalKm?: string;
  lastMaintenanceDate?: string;
  lastMaintenanceKm?: string;
  notes?: string;
};

const getMaintenanceFormSchema = (t: (key: string) => string) => z.object({
  trailerId: z.string().min(1, t("maintenance.validation.trailerRequired")),
  scheduleType: z.enum(["time_based", "km_based"]),
  intervalDays: z.coerce.number().optional(),
  intervalKm: z.string().optional(),
  lastMaintenanceDate: z.string().optional(),
  lastMaintenanceKm: z.string().optional(),
  notes: z.string().optional(),
});

export default function Maintenance() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const maintenanceFormSchema = getMaintenanceFormSchema(t);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<MaintenanceSchedule | null>(null);
  const [scheduleType, setScheduleType] = useState<"time_based" | "km_based">("time_based");

  const { data: schedules = [], isLoading } = useQuery<MaintenanceSchedule[]>({
    queryKey: ["/api/maintenance"],
  });

  const { data: trailers = [] } = useQuery<Trailer[]>({
    queryKey: ["/api/trailers"],
  });

  const createForm = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      trailerId: "",
      scheduleType: "time_based",
      intervalDays: 90,
      intervalKm: "",
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
      lastMaintenanceKm: "",
      notes: "",
    },
  });

  const editForm = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      trailerId: "",
      scheduleType: "time_based",
      intervalDays: 90,
      intervalKm: "",
      lastMaintenanceDate: "",
      lastMaintenanceKm: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MaintenanceFormData) => {
      return await apiRequest("POST", "/api/maintenance", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      toast({ title: t("maintenance.toastCreateSuccess") });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: t("maintenance.toastCreateError"), 
        description: error?.message || t("maintenance.toastCreateErrorDescription"),
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MaintenanceFormData> }) => {
      return await apiRequest("PUT", `/api/maintenance/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      toast({ title: t("maintenance.toastUpdateSuccess") });
      setIsEditOpen(false);
      setSelectedSchedule(null);
    },
    onError: (error: any) => {
      toast({ 
        title: t("maintenance.toastUpdateError"),
        description: error?.message || t("maintenance.toastUpdateErrorDescription"),
        variant: "destructive" 
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async ({ id, completionDate, cost, notes }: { id: string; completionDate: string; cost?: string; notes?: string }) => {
      return await apiRequest("POST", `/api/maintenance/${id}/complete`, { completionDate, cost, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      toast({ title: t("maintenance.toastCompleteSuccess") });
      setIsCompleteOpen(false);
      setSelectedSchedule(null);
    },
    onError: (error: any) => {
      toast({ 
        title: t("maintenance.toastCompleteError"),
        description: error?.message || t("maintenance.toastCompleteErrorDescription"),
        variant: "destructive" 
      });
    },
  });

  const stats = {
    total: schedules.length,
    scheduled: schedules.filter((s) => s.status === "scheduled").length,
    urgent: schedules.filter((s) => s.status === "urgent").length,
    completed: schedules.filter((s) => s.status === "completed").length,
  };

  const handleCreate = (data: MaintenanceFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (schedule: MaintenanceSchedule) => {
    setSelectedSchedule(schedule);
    editForm.reset({
      trailerId: schedule.trailerId,
      scheduleType: schedule.scheduleType,
      intervalDays: schedule.intervalDays || 90,
      intervalKm: schedule.intervalKm || "",
      lastMaintenanceDate: schedule.lastMaintenanceDate || "",
      lastMaintenanceKm: schedule.lastMaintenanceKm || "",
      notes: schedule.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = (data: MaintenanceFormData) => {
    if (!selectedSchedule) return;
    updateMutation.mutate({
      id: selectedSchedule.id,
      data,
    });
  };

  const handleComplete = () => {
    if (!selectedSchedule) return;
    const completionDate = (document.getElementById("completion-date") as HTMLInputElement)?.value;
    const cost = (document.getElementById("cost") as HTMLInputElement)?.value;
    const notes = (document.getElementById("completion-notes") as HTMLTextAreaElement)?.value;
    
    if (!completionDate) {
      toast({ title: t("maintenance.toastDateRequired"), variant: "destructive" });
      return;
    }
    
    completeMutation.mutate({ 
      id: selectedSchedule.id, 
      completionDate,
      cost: cost || undefined,
      notes: notes || undefined,
    });
  };

  const getStatusBadge = (status: string, scheduleId?: string) => {
    const variants = {
      scheduled: "default",
      urgent: "destructive",
      completed: "secondary",
    };
    const labels = {
      scheduled: t("maintenance.statusScheduled"),
      urgent: t("maintenance.statusUrgent"),
      completed: t("maintenance.statusCompleted"),
    };
    const testId = scheduleId ? `badge-status-${scheduleId}` : `badge-status-${status}`;
    return (
      <Badge variant={variants[status as keyof typeof variants] as any} data-testid={testId}>
        {status === "urgent" && <AlertCircle className="h-3 w-3 mr-1" />}
        {status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      time_based: t("maintenance.typeTimeBased"),
      km_based: t("maintenance.typeKmBased"),
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-page-title">
            {t("maintenance.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("maintenance.subtitle")}</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-schedule">
              <Plus className="h-4 w-4 mr-2" />
              {t("maintenance.newSchedule")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("maintenance.createTitle")}</DialogTitle>
              <DialogDescription>{t("maintenance.createDescription")}</DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="trailerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("maintenance.formTrailer")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-trailer">
                            <SelectValue placeholder={t("maintenance.formTrailerPlaceholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {trailers.map((trailer) => (
                            <SelectItem key={trailer.id} value={trailer.id}>
                              {trailer.trailerId}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="scheduleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("maintenance.formScheduleType")}</FormLabel>
                      <Select onValueChange={(value) => { field.onChange(value); setScheduleType(value as any); }} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-schedule-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="time_based">{t("maintenance.typeTimeBased")}</SelectItem>
                          <SelectItem value="km_based">{t("maintenance.typeKmBased")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t("maintenance.formScheduleTypeDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {scheduleType === "time_based" && (
                  <>
                    <FormField
                      control={createForm.control}
                      name="intervalDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("maintenance.formIntervalDays")}</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} placeholder="90" data-testid="input-interval-days" />
                          </FormControl>
                          <FormDescription>{t("maintenance.formIntervalDaysDescription")}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="lastMaintenanceDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("maintenance.formLastMaintenanceDate")}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-last-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                {scheduleType === "km_based" && (
                  <>
                    <FormField
                      control={createForm.control}
                      name="intervalKm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("maintenance.formIntervalKm")}</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} placeholder="10000" data-testid="input-interval-km" />
                          </FormControl>
                          <FormDescription>{t("maintenance.formIntervalKmDescription")}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="lastMaintenanceKm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("maintenance.formLastMaintenanceKm")}</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} placeholder="50000" data-testid="input-last-km" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                <FormField
                  control={createForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("maintenance.formNotes")}</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder={t("maintenance.formNotesPlaceholder")} rows={3} data-testid="textarea-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} data-testid="button-cancel">
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                    {createMutation.isPending ? t("maintenance.creating") : t("maintenance.createSchedule")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("maintenance.statTotal")}</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-total">{stats.total}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("maintenance.statScheduled")}</CardTitle>
            <Wrench className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-scheduled">{stats.scheduled}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("maintenance.statUrgent")}</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="stat-urgent">{stats.urgent}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("maintenance.statCompleted")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-completed">{stats.completed}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("maintenance.tableTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("maintenance.tableTrailer")}</TableHead>
                  <TableHead>{t("maintenance.tableType")}</TableHead>
                  <TableHead>{t("maintenance.tableLastMaintenance")}</TableHead>
                  <TableHead>{t("maintenance.tableNextMaintenance")}</TableHead>
                  <TableHead>{t("maintenance.tableStatus")}</TableHead>
                  <TableHead className="text-right">{t("maintenance.tableActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground" data-testid="text-empty-state">
                      {t("maintenance.emptyState")}
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((schedule) => (
                    <TableRow key={schedule.id} data-testid={`row-schedule-${schedule.id}`}>
                      <TableCell className="font-medium" data-testid={`text-trailer-${schedule.id}`}>
                        {trailers.find((t) => t.id === schedule.trailerId)?.trailerId || schedule.trailerId}
                      </TableCell>
                      <TableCell data-testid={`text-type-${schedule.id}`}>{getTypeLabel(schedule.scheduleType)}</TableCell>
                      <TableCell data-testid={`text-last-${schedule.id}`}>
                        {schedule.scheduleType === "time_based" && schedule.lastMaintenanceDate
                          ? format(new Date(schedule.lastMaintenanceDate), "MMM dd, yyyy")
                          : schedule.scheduleType === "km_based" && schedule.lastMaintenanceKm
                          ? `${schedule.lastMaintenanceKm} km`
                          : "—"}
                      </TableCell>
                      <TableCell data-testid={`text-next-${schedule.id}`}>
                        {schedule.scheduleType === "time_based" && schedule.nextMaintenanceDate
                          ? format(new Date(schedule.nextMaintenanceDate), "MMM dd, yyyy")
                          : schedule.scheduleType === "km_based" && schedule.nextMaintenanceKm
                          ? `${schedule.nextMaintenanceKm} km`
                          : "—"}
                      </TableCell>
                      <TableCell data-testid={`text-status-${schedule.id}`}>{getStatusBadge(schedule.status, schedule.id)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSchedule(schedule);
                              setIsDetailsOpen(true);
                            }}
                            data-testid={`button-view-${schedule.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(schedule)}
                            data-testid={`button-edit-${schedule.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {schedule.status !== "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSchedule(schedule);
                                setIsCompleteOpen(true);
                              }}
                              data-testid={`button-complete-${schedule.id}`}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("maintenance.editTitle")}</DialogTitle>
            <DialogDescription>{t("maintenance.editDescription")}</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="trailerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("maintenance.formTrailer")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="edit-select-trailer">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {trailers.map((trailer) => (
                          <SelectItem key={trailer.id} value={trailer.id}>
                            {trailer.trailerId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="scheduleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("maintenance.formScheduleType")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="edit-select-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="time_based">{t("maintenance.typeTimeBased")}</SelectItem>
                        <SelectItem value="km_based">{t("maintenance.typeKmBased")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editForm.watch("scheduleType") === "time_based" && (
                <>
                  <FormField
                    control={editForm.control}
                    name="intervalDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("maintenance.formIntervalDays")}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="edit-input-interval-days" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="lastMaintenanceDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("maintenance.formLastMaintenanceDate")}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="edit-input-last-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {editForm.watch("scheduleType") === "km_based" && (
                <>
                  <FormField
                    control={editForm.control}
                    name="intervalKm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("maintenance.formIntervalKm")}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="edit-input-interval-km" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="lastMaintenanceKm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("maintenance.formLastMaintenanceKm")}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="edit-input-last-km" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("maintenance.formNotes")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="edit-textarea-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} data-testid="edit-button-cancel">
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="edit-button-submit">
                  {updateMutation.isPending ? t("maintenance.updating") : t("maintenance.updateSchedule")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("maintenance.detailsTitle")}</DialogTitle>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("maintenance.formTrailer")}</p>
                  <p className="font-medium" data-testid="details-trailer">
                    {trailers.find((t) => t.id === selectedSchedule.trailerId)?.trailerId || selectedSchedule.trailerId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("maintenance.formScheduleType")}</p>
                  <p className="font-medium" data-testid="details-type">{getTypeLabel(selectedSchedule.scheduleType)}</p>
                </div>
                {selectedSchedule.scheduleType === "time_based" && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("maintenance.detailsInterval")}</p>
                      <p className="font-medium" data-testid="details-interval">{selectedSchedule.intervalDays} {t("maintenance.days")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("maintenance.detailsLastMaintenance")}</p>
                      <p className="font-medium" data-testid="details-last-maintenance">
                        {selectedSchedule.lastMaintenanceDate
                          ? format(new Date(selectedSchedule.lastMaintenanceDate), "MMM dd, yyyy")
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("maintenance.detailsNextMaintenance")}</p>
                      <p className="font-medium" data-testid="details-next-maintenance">
                        {selectedSchedule.nextMaintenanceDate
                          ? format(new Date(selectedSchedule.nextMaintenanceDate), "MMM dd, yyyy")
                          : "—"}
                      </p>
                    </div>
                  </>
                )}
                {selectedSchedule.scheduleType === "km_based" && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("maintenance.detailsInterval")}</p>
                      <p className="font-medium" data-testid="details-interval">{selectedSchedule.intervalKm} km</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("maintenance.detailsLastMaintenance")}</p>
                      <p className="font-medium" data-testid="details-last-maintenance">{selectedSchedule.lastMaintenanceKm} km</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("maintenance.detailsNextMaintenance")}</p>
                      <p className="font-medium" data-testid="details-next-maintenance">{selectedSchedule.nextMaintenanceKm} km</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">{t("maintenance.tableStatus")}</p>
                  <div className="mt-1" data-testid="details-status">{getStatusBadge(selectedSchedule.status, selectedSchedule.id)}</div>
                </div>
              </div>
              {selectedSchedule.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">{t("maintenance.formNotes")}</p>
                  <p className="mt-1" data-testid="details-notes">{selectedSchedule.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("maintenance.completeTitle")}</DialogTitle>
            <DialogDescription>{t("maintenance.completeDescription")}</DialogDescription>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("maintenance.formTrailer")}</p>
                <p className="font-medium" data-testid="text-complete-trailer">
                  {trailers.find((t) => t.id === selectedSchedule.trailerId)?.trailerId || selectedSchedule.trailerId}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">{t("maintenance.completionDate")}</label>
                <Input
                  id="completion-date"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                  data-testid="input-completion-date"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("maintenance.cost")}</label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="1500.00"
                  className="mt-1"
                  data-testid="input-cost"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("maintenance.notesOptional")}</label>
                <Textarea
                  id="completion-notes"
                  placeholder={t("maintenance.completionNotesPlaceholder")}
                  rows={3}
                  className="mt-1"
                  data-testid="textarea-completion-notes"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsCompleteOpen(false)}
                  data-testid="button-cancel-complete"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                  onClick={handleComplete}
                  disabled={completeMutation.isPending}
                  data-testid="button-confirm-complete"
                >
                  {completeMutation.isPending ? t("maintenance.completing") : t("maintenance.markAsCompleted")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
