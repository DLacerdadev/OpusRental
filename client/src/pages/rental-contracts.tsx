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
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Edit, XCircle, Eye, DollarSign, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRentalContractSchema, type InsertRentalContract } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function RentalContracts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const { toast } = useToast();

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
        title: "Contract created",
        description: "Rental contract has been successfully created",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating contract",
        description: error.message || "Failed to create rental contract",
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
        title: "Contract updated",
        description: "Rental contract has been successfully updated",
      });
      setDialogOpen(false);
      setEditingContract(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating contract",
        description: error.message || "Failed to update rental contract",
        variant: "destructive",
      });
    },
  });

  const terminateContractMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/rental-contracts/${id}/terminate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-contracts"] });
      toast({
        title: "Contract terminated",
        description: "Rental contract has been terminated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error terminating contract",
        description: error.message || "Failed to terminate contract",
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
    if (confirm("Are you sure you want to terminate this contract? This will change its status to cancelled.")) {
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
    const variants: Record<string, { className: string; label: string }> = {
      active: { className: "bg-green-600 dark:bg-green-400 text-white", label: "Active" },
      expired: { className: "bg-orange-600 dark:bg-orange-400 text-white", label: "Expired" },
      cancelled: { className: "bg-red-600 dark:bg-red-400 text-white", label: "Cancelled" },
    };
    const variant = variants[status] || variants.active;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getClientName = (clientId: string) => {
    const client = clients.find((c: any) => c.id === clientId);
    return client ? client.companyName : "Unknown Client";
  };

  const getTrailerName = (trailerId: string) => {
    const trailer = trailers.find((t: any) => t.id === trailerId);
    return trailer ? `${trailer.trailerId} - ${trailer.model}` : "Unknown Trailer";
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
    total: contracts.length,
    active: contracts.filter((c: any) => c.status === "active").length,
    expired: contracts.filter((c: any) => c.status === "expired").length,
    cancelled: contracts.filter((c: any) => c.status === "cancelled").length,
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8" data-testid="page-rental-contracts">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="heading-rental-contracts">
            Rental Contracts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage trailer rental agreements with clients
          </p>
        </div>
        <Button
          onClick={handleNewContract}
          className="bg-accent hover:bg-accent/90 shadow-lg h-11 w-full sm:w-auto"
          data-testid="button-new-contract"
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">New Contract</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="border-l-4 border-l-accent shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-accent/10 p-3 rounded-2xl">
                <FileText className="h-6 w-6 text-accent" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">TOTAL CONTRACTS</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-total-contracts">
              {stats.total}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-2xl">
                <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">ACTIVE</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-active-contracts">
              {stats.active}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-2xl">
                <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">EXPIRED</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-expired-contracts">
              {stats.expired}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-all">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-50 dark:bg-red-950 p-3 rounded-2xl">
                <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">CANCELLED</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-cancelled-contracts">
              {stats.cancelled}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contracts Table */}
      <Card className="shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg font-bold">Contract List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Contract #
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    Client
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    Trailer
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                    Period
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Monthly Rate
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {contracts && contracts.length > 0 ? (
                  contracts.map((contract: any) => (
                    <tr
                      key={contract.id}
                      className="hover:bg-muted/30 transition-colors"
                      data-testid={`row-contract-${contract.id}`}
                    >
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-accent" />
                          <span className="text-sm font-semibold text-foreground">
                            {contract.contractNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-foreground">
                          {getClientName(contract.clientId)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                        <span className="text-sm text-foreground">
                          {getTrailerName(contract.trailerId)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 hidden xl:table-cell">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {contract.startDate} → {contract.endDate}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-semibold text-foreground">
                            {parseFloat(contract.monthlyRate).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(contract.status)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(contract)}
                            data-testid={`button-view-${contract.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(contract)}
                            data-testid={`button-edit-${contract.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {contract.status === "active" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTerminate(contract.id)}
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-terminate-${contract.id}`}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-center text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No rental contracts registered</p>
                        <p className="text-xs mt-1">Click "New Contract" to create your first contract</p>
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
              {editingContract ? "Edit Contract" : "New Rental Contract"}
            </DialogTitle>
            <DialogDescription>
              {editingContract 
                ? "Update rental contract information" 
                : "Create a new trailer rental agreement"}
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
                      <FormLabel>Contract Number *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="RC001"
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
                      <FormLabel>Duration (months) *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-duration">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="3">3 months</SelectItem>
                          <SelectItem value="6">6 months</SelectItem>
                          <SelectItem value="12">12 months</SelectItem>
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
                      <FormLabel>Client *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-client">
                            <SelectValue placeholder="Select client" />
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
                      <FormLabel>Trailer *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-trailer">
                            <SelectValue placeholder="Select trailer" />
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
                      <FormLabel>Start Date *</FormLabel>
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
                      <FormLabel>End Date *</FormLabel>
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
                      <FormLabel>Monthly Rate ($) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="1500.00"
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
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
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
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional contract notes..."
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
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-accent hover:bg-accent/90"
                  disabled={createContractMutation.isPending || updateContractMutation.isPending}
                  data-testid="button-submit"
                >
                  {editingContract ? "Update Contract" : "Create Contract"}
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
            <DialogTitle>Contract Details</DialogTitle>
            <DialogDescription>
              Complete information about contract {selectedContract?.contractNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedContract && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Contract Number</p>
                  <p className="text-base text-foreground font-semibold">{selectedContract.contractNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Status</p>
                  {getStatusBadge(selectedContract.status)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Client</p>
                  <p className="text-base text-foreground">{getClientName(selectedContract.clientId)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Trailer</p>
                  <p className="text-base text-foreground">{getTrailerName(selectedContract.trailerId)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Start Date</p>
                  <p className="text-base text-foreground">{selectedContract.startDate}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">End Date</p>
                  <p className="text-base text-foreground">{selectedContract.endDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Monthly Rate</p>
                  <p className="text-base text-foreground font-bold">
                    ${parseFloat(selectedContract.monthlyRate).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Duration</p>
                  <p className="text-base text-foreground">{selectedContract.duration} months</p>
                </div>
              </div>

              {selectedContract.notes && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Notes</p>
                  <p className="text-base text-foreground">{selectedContract.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
