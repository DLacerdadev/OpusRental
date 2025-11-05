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
import { ClipboardCheck, Plus, CheckCircle, XCircle, Eye, Pencil } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

type ChecklistItem = {
  item: string;
  status: "ok" | "issue" | "na";
  notes?: string;
};

type Checklist = {
  id: string;
  trailerId: string;
  type: "pre_rental" | "maintenance" | "arrival";
  items: ChecklistItem[];
  approved: boolean;
  inspector: string;
  photos?: string[];
  notes?: string;
  inspectionDate: string;
  createdAt: string;
};

type Trailer = {
  id: string;
  trailerId: string;
};

const checklistFormSchema = z.object({
  trailerId: z.string().min(1, "Trailer is required"),
  type: z.enum(["pre_rental", "maintenance", "arrival"]),
  inspector: z.string().min(1, "Inspector name is required"),
  notes: z.string().optional(),
});

type ChecklistFormData = z.infer<typeof checklistFormSchema>;

const defaultItems: Record<string, ChecklistItem[]> = {
  pre_rental: [
    { item: "Tires condition", status: "ok", notes: "" },
    { item: "Brakes functionality", status: "ok", notes: "" },
    { item: "Lights and signals", status: "ok", notes: "" },
    { item: "Body and paint", status: "ok", notes: "" },
    { item: "Floor condition", status: "ok", notes: "" },
    { item: "Doors operation", status: "ok", notes: "" },
    { item: "Registration documents", status: "ok", notes: "" },
  ],
  maintenance: [
    { item: "Oil level", status: "ok", notes: "" },
    { item: "Tire pressure", status: "ok", notes: "" },
    { item: "Brake pads", status: "ok", notes: "" },
    { item: "Light bulbs", status: "ok", notes: "" },
    { item: "Suspension", status: "ok", notes: "" },
    { item: "Hydraulic system", status: "ok", notes: "" },
  ],
  arrival: [
    { item: "Trailer condition", status: "ok", notes: "" },
    { item: "Cargo integrity", status: "ok", notes: "" },
    { item: "No damage visible", status: "ok", notes: "" },
    { item: "All items accounted", status: "ok", notes: "" },
  ],
};

export default function Inspections() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [editingItems, setEditingItems] = useState<ChecklistItem[]>([]);

  const { data: checklists = [], isLoading } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists/type/all"],
    queryFn: async () => {
      const types = ["pre_rental", "maintenance", "arrival"];
      const results = await Promise.all(
        types.map(async (type) => {
          const response = await fetch(`/api/checklists/type/${type}`, { credentials: "include" });
          if (!response.ok) return [];
          return response.json();
        })
      );
      return results.flat();
    },
  });

  const { data: trailers = [] } = useQuery<Trailer[]>({
    queryKey: ["/api/trailers"],
  });

  const createForm = useForm<ChecklistFormData>({
    resolver: zodResolver(checklistFormSchema),
    defaultValues: {
      trailerId: "",
      type: "pre_rental",
      inspector: "",
      notes: "",
    },
  });

  const editForm = useForm<ChecklistFormData>({
    resolver: zodResolver(checklistFormSchema),
    defaultValues: {
      trailerId: "",
      type: "pre_rental",
      inspector: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ChecklistFormData & { items: ChecklistItem[] }) => {
      return await apiRequest("POST", "/api/checklists", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/type/all"] });
      toast({ title: "Checklist created successfully" });
      setIsCreateOpen(false);
      createForm.reset();
      setEditingItems([]);
    },
    onError: () => {
      toast({ title: "Failed to create checklist", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ChecklistFormData> & { items?: ChecklistItem[] } }) => {
      return await apiRequest("PUT", `/api/checklists/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/type/all"] });
      toast({ title: "Checklist updated successfully" });
      setIsEditOpen(false);
      setSelectedChecklist(null);
      setEditingItems([]);
    },
    onError: () => {
      toast({ title: "Failed to update checklist", variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approved, notes }: { id: string; approved: boolean; notes?: string }) => {
      return await apiRequest("POST", `/api/checklists/${id}/complete`, { approved, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/type/all"] });
      toast({ title: "Checklist approval submitted" });
      setIsApprovalOpen(false);
      setSelectedChecklist(null);
    },
    onError: () => {
      toast({ title: "Failed to submit approval", variant: "destructive" });
    },
  });

  const stats = {
    total: checklists.length,
    preRental: checklists.filter((c) => c.type === "pre_rental").length,
    maintenance: checklists.filter((c) => c.type === "maintenance").length,
    arrival: checklists.filter((c) => c.type === "arrival").length,
  };

  const handleCreate = (data: ChecklistFormData) => {
    createMutation.mutate({
      ...data,
      items: editingItems.length > 0 ? editingItems : defaultItems[data.type],
    });
  };

  const handleEdit = (checklist: Checklist) => {
    setSelectedChecklist(checklist);
    setEditingItems(checklist.items);
    editForm.reset({
      trailerId: checklist.trailerId,
      type: checklist.type,
      inspector: checklist.inspector,
      notes: checklist.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = (data: ChecklistFormData) => {
    if (!selectedChecklist) return;
    updateMutation.mutate({
      id: selectedChecklist.id,
      data: { ...data, items: editingItems },
    });
  };

  const handleApproval = (approved: boolean, notes?: string) => {
    if (!selectedChecklist) return;
    approveMutation.mutate({ id: selectedChecklist.id, approved, notes });
  };

  const handleTypeChange = (type: "pre_rental" | "maintenance" | "arrival", form: any) => {
    form.setValue("type", type);
    setEditingItems(defaultItems[type]);
  };

  const updateItemStatus = (index: number, status: "ok" | "issue" | "na") => {
    const updated = [...editingItems];
    updated[index].status = status;
    setEditingItems(updated);
  };

  const updateItemNotes = (index: number, notes: string) => {
    const updated = [...editingItems];
    updated[index].notes = notes;
    setEditingItems(updated);
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      pre_rental: "Pre-Rental",
      maintenance: "Maintenance",
      arrival: "Arrival",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      pre_rental: "default",
      maintenance: "secondary",
      arrival: "outline",
    };
    return <Badge variant={variants[type as keyof typeof variants] as any} data-testid={`badge-type-${type}`}>{getTypeLabel(type)}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ok: "default",
      issue: "destructive",
      na: "secondary",
    };
    const labels = {
      ok: "OK",
      issue: "Issue",
      na: "N/A",
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{labels[status as keyof typeof labels]}</Badge>;
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
            Inspections & Checklists
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage trailer inspection checklists</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-checklist">
              <Plus className="h-4 w-4 mr-2" />
              New Checklist
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Inspection Checklist</DialogTitle>
              <DialogDescription>Fill in the inspection details below</DialogDescription>
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
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inspection Type</FormLabel>
                      <Select onValueChange={(value) => handleTypeChange(value as any, createForm)} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pre_rental">Pre-Rental Inspection</SelectItem>
                          <SelectItem value="maintenance">Maintenance Inspection</SelectItem>
                          <SelectItem value="arrival">Arrival Inspection</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="inspector"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inspector Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Smith" data-testid="input-inspector" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <FormLabel>Checklist Items</FormLabel>
                  <div className="space-y-3 border border-gray-200 dark:border-gray-700 rounded-md p-3">
                    {editingItems.map((item, index) => (
                      <div key={index} className="space-y-2 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{item.item}</span>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant={item.status === "ok" ? "default" : "outline"}
                              onClick={() => updateItemStatus(index, "ok")}
                              data-testid={`button-item-ok-${index}`}
                            >
                              OK
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={item.status === "issue" ? "destructive" : "outline"}
                              onClick={() => updateItemStatus(index, "issue")}
                              data-testid={`button-item-issue-${index}`}
                            >
                              Issue
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={item.status === "na" ? "secondary" : "outline"}
                              onClick={() => updateItemStatus(index, "na")}
                              data-testid={`button-item-na-${index}`}
                            >
                              N/A
                            </Button>
                          </div>
                        </div>
                        <Input
                          placeholder="Additional notes..."
                          value={item.notes || ""}
                          onChange={(e) => updateItemNotes(index, e.target.value)}
                          className="text-sm"
                          data-testid={`input-item-notes-${index}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <FormField
                  control={createForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>General Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Overall inspection notes..." rows={3} data-testid="textarea-notes" />
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
                    {createMutation.isPending ? "Creating..." : "Create Checklist"}
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
            <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Pre-Rental</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-pre-rental">{stats.preRental}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-maintenance">{stats.maintenance}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arrival</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-arrival">{stats.arrival}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Trailer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : checklists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No inspections found
                    </TableCell>
                  </TableRow>
                ) : (
                  checklists.map((checklist) => (
                    <TableRow key={checklist.id} data-testid={`row-checklist-${checklist.id}`}>
                      <TableCell className="font-medium" data-testid={`text-date-${checklist.id}`}>
                        {format(new Date(checklist.inspectionDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell data-testid={`text-trailer-${checklist.id}`}>
                        {trailers.find((t) => t.id === checklist.trailerId)?.trailerId || checklist.trailerId}
                      </TableCell>
                      <TableCell data-testid={`text-type-${checklist.id}`}>{getTypeBadge(checklist.type)}</TableCell>
                      <TableCell data-testid={`text-inspector-${checklist.id}`}>{checklist.inspector}</TableCell>
                      <TableCell data-testid={`text-status-${checklist.id}`}>
                        {checklist.approved ? (
                          <Badge variant="default" className="bg-green-600 dark:bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedChecklist(checklist);
                              setIsDetailsOpen(true);
                            }}
                            data-testid={`button-view-${checklist.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(checklist)}
                            data-testid={`button-edit-${checklist.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {!checklist.approved && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedChecklist(checklist);
                                setIsApprovalOpen(true);
                              }}
                              data-testid={`button-approve-${checklist.id}`}
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
        <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Inspection Checklist</DialogTitle>
            <DialogDescription>Update the inspection details</DialogDescription>
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspection Type</FormLabel>
                    <Select onValueChange={(value) => handleTypeChange(value as any, editForm)} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="edit-select-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pre_rental">Pre-Rental Inspection</SelectItem>
                        <SelectItem value="maintenance">Maintenance Inspection</SelectItem>
                        <SelectItem value="arrival">Arrival Inspection</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="inspector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inspector Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="edit-input-inspector" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>Checklist Items</FormLabel>
                <div className="space-y-3 border border-gray-200 dark:border-gray-700 rounded-md p-3">
                  {editingItems.map((item, index) => (
                    <div key={index} className="space-y-2 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{item.item}</span>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant={item.status === "ok" ? "default" : "outline"}
                            onClick={() => updateItemStatus(index, "ok")}
                            data-testid={`edit-button-item-ok-${index}`}
                          >
                            OK
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={item.status === "issue" ? "destructive" : "outline"}
                            onClick={() => updateItemStatus(index, "issue")}
                            data-testid={`edit-button-item-issue-${index}`}
                          >
                            Issue
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={item.status === "na" ? "secondary" : "outline"}
                            onClick={() => updateItemStatus(index, "na")}
                            data-testid={`edit-button-item-na-${index}`}
                          >
                            N/A
                          </Button>
                        </div>
                      </div>
                      <Input
                        placeholder="Additional notes..."
                        value={item.notes || ""}
                        onChange={(e) => updateItemNotes(index, e.target.value)}
                        className="text-sm"
                        data-testid={`edit-input-item-notes-${index}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>General Notes</FormLabel>
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
                  {updateMutation.isPending ? "Updating..." : "Update Checklist"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inspection Details</DialogTitle>
          </DialogHeader>
          {selectedChecklist && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Trailer</p>
                  <p className="font-medium">
                    {trailers.find((t) => t.id === selectedChecklist.trailerId)?.trailerId || selectedChecklist.trailerId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                  <p className="font-medium">{getTypeLabel(selectedChecklist.type)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Inspector</p>
                  <p className="font-medium">{selectedChecklist.inspector}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                  <p className="font-medium">{format(new Date(selectedChecklist.inspectionDate), "MMM dd, yyyy")}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Checklist Items</p>
                <div className="space-y-2">
                  {selectedChecklist.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <div className="flex-1">
                        <p className="font-medium">{item.item}</p>
                        {item.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.notes}</p>}
                      </div>
                      <div className="ml-4">{getStatusBadge(item.status)}</div>
                    </div>
                  ))}
                </div>
              </div>
              {selectedChecklist.notes && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">General Notes</p>
                  <p className="mt-1">{selectedChecklist.notes}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Approval Status</p>
                <div className="mt-1">
                  {selectedChecklist.approved ? (
                    <Badge variant="default" className="bg-green-600 dark:bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Pending Approval</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isApprovalOpen} onOpenChange={setIsApprovalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Inspection</DialogTitle>
            <DialogDescription>Review and approve or reject this inspection</DialogDescription>
          </DialogHeader>
          {selectedChecklist && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Trailer</p>
                <p className="font-medium">
                  {trailers.find((t) => t.id === selectedChecklist.trailerId)?.trailerId || selectedChecklist.trailerId}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Inspector</p>
                <p className="font-medium">{selectedChecklist.inspector}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">Approval Notes (Optional)</label>
                <Textarea
                  id="approval-notes"
                  placeholder="Add any comments..."
                  rows={3}
                  className="mt-1"
                  data-testid="textarea-approval-notes"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const notes = (document.getElementById("approval-notes") as HTMLTextAreaElement)?.value;
                    handleApproval(false, notes);
                  }}
                  disabled={approveMutation.isPending}
                  data-testid="button-reject"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                  onClick={() => {
                    const notes = (document.getElementById("approval-notes") as HTMLTextAreaElement)?.value;
                    handleApproval(true, notes);
                  }}
                  disabled={approveMutation.isPending}
                  data-testid="button-approve"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
