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

const maintenanceFormSchema = z.object({
  trailerId: z.string().min(1, "Trailer is required"),
  scheduleType: z.enum(["time_based", "km_based"]),
  intervalDays: z.coerce.number().optional(),
  intervalKm: z.string().optional(),
  lastMaintenanceDate: z.string().optional(),
  lastMaintenanceKm: z.string().optional(),
  notes: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceFormSchema>;

export default function Maintenance() {
  const { toast } = useToast();
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
      toast({ title: "Maintenance schedule created successfully" });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create maintenance schedule", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MaintenanceFormData> }) => {
      return await apiRequest("PUT", `/api/maintenance/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      toast({ title: "Maintenance schedule updated successfully" });
      setIsEditOpen(false);
      setSelectedSchedule(null);
    },
    onError: () => {
      toast({ title: "Failed to update maintenance schedule", variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async ({ id, completionDate, cost, notes }: { id: string; completionDate: string; cost?: string; notes?: string }) => {
      return await apiRequest("POST", `/api/maintenance/${id}/complete`, { completionDate, cost, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance"] });
      toast({ title: "Maintenance marked as completed" });
      setIsCompleteOpen(false);
      setSelectedSchedule(null);
    },
    onError: () => {
      toast({ title: "Failed to complete maintenance", variant: "destructive" });
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
      toast({ title: "Completion date is required", variant: "destructive" });
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
      scheduled: "Scheduled",
      urgent: "Urgent",
      completed: "Completed",
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
      time_based: "Time-Based",
      km_based: "KM-Based",
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
            Maintenance Schedules
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage trailer maintenance schedules</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-schedule">
              <Plus className="h-4 w-4 mr-2" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Maintenance Schedule</DialogTitle>
              <DialogDescription>Set up automatic maintenance scheduling</DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="trailerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trailer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-trailer">
                            <SelectValue placeholder="Select trailer" />
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
                      <FormLabel>Schedule Type</FormLabel>
                      <Select onValueChange={(value) => { field.onChange(value); setScheduleType(value as any); }} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-schedule-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="time_based">Time-Based (Days)</SelectItem>
                          <SelectItem value="km_based">KM-Based</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Time-based: Maintenance every X days. KM-based: Maintenance every X kilometers
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
                          <FormLabel>Interval (Days)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} placeholder="90" data-testid="input-interval-days" />
                          </FormControl>
                          <FormDescription>How often should maintenance be performed (in days)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="lastMaintenanceDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Maintenance Date</FormLabel>
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
                          <FormLabel>Interval (KM)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} placeholder="10000" data-testid="input-interval-km" />
                          </FormControl>
                          <FormDescription>How often should maintenance be performed (in kilometers)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="lastMaintenanceKm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Maintenance KM</FormLabel>
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
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Maintenance notes..." rows={3} data-testid="textarea-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                    {createMutation.isPending ? "Creating..." : "Create Schedule"}
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
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
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
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
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
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
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
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
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
          <CardTitle>All Maintenance Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trailer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Last Maintenance</TableHead>
                  <TableHead>Next Maintenance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400" data-testid="text-empty-state">
                      No maintenance schedules found
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
            <DialogTitle>Edit Maintenance Schedule</DialogTitle>
            <DialogDescription>Update the maintenance schedule details</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="trailerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trailer</FormLabel>
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
                    <FormLabel>Schedule Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="edit-select-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="time_based">Time-Based (Days)</SelectItem>
                        <SelectItem value="km_based">KM-Based</SelectItem>
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
                        <FormLabel>Interval (Days)</FormLabel>
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
                        <FormLabel>Last Maintenance Date</FormLabel>
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
                        <FormLabel>Interval (KM)</FormLabel>
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
                        <FormLabel>Last Maintenance KM</FormLabel>
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
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="edit-textarea-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} data-testid="edit-button-cancel">
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="edit-button-submit">
                  {updateMutation.isPending ? "Updating..." : "Update Schedule"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Maintenance Schedule Details</DialogTitle>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Trailer</p>
                  <p className="font-medium" data-testid="details-trailer">
                    {trailers.find((t) => t.id === selectedSchedule.trailerId)?.trailerId || selectedSchedule.trailerId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                  <p className="font-medium" data-testid="details-type">{getTypeLabel(selectedSchedule.scheduleType)}</p>
                </div>
                {selectedSchedule.scheduleType === "time_based" && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Interval</p>
                      <p className="font-medium" data-testid="details-interval">{selectedSchedule.intervalDays} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Last Maintenance</p>
                      <p className="font-medium" data-testid="details-last-maintenance">
                        {selectedSchedule.lastMaintenanceDate
                          ? format(new Date(selectedSchedule.lastMaintenanceDate), "MMM dd, yyyy")
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Next Maintenance</p>
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">Interval</p>
                      <p className="font-medium" data-testid="details-interval">{selectedSchedule.intervalKm} km</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Last Maintenance</p>
                      <p className="font-medium" data-testid="details-last-maintenance">{selectedSchedule.lastMaintenanceKm} km</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Next Maintenance</p>
                      <p className="font-medium" data-testid="details-next-maintenance">{selectedSchedule.nextMaintenanceKm} km</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <div className="mt-1" data-testid="details-status">{getStatusBadge(selectedSchedule.status, selectedSchedule.id)}</div>
                </div>
              </div>
              {selectedSchedule.notes && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
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
            <DialogTitle>Complete Maintenance</DialogTitle>
            <DialogDescription>Mark this maintenance as completed</DialogDescription>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Trailer</p>
                <p className="font-medium" data-testid="text-complete-trailer">
                  {trailers.find((t) => t.id === selectedSchedule.trailerId)?.trailerId || selectedSchedule.trailerId}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Completion Date *</label>
                <Input
                  id="completion-date"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                  data-testid="input-completion-date"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Cost (Optional)</label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="1500.00"
                  className="mt-1"
                  data-testid="input-cost"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Textarea
                  id="completion-notes"
                  placeholder="Maintenance details..."
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
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                  onClick={handleComplete}
                  disabled={completeMutation.isPending}
                  data-testid="button-confirm-complete"
                >
                  {completeMutation.isPending ? "Completing..." : "Mark as Completed"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
