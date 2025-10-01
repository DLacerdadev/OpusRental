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
import { Download, Eye, Plus } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTrailerSchema, type InsertTrailer } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Assets() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: trailers, isLoading } = useQuery({
    queryKey: ["/api/trailers"],
  });

  const form = useForm<InsertTrailer>({
    resolver: zodResolver(insertTrailerSchema),
    defaultValues: {
      trailerId: "",
      purchaseValue: "",
      purchaseDate: new Date().toISOString().split('T')[0],
      currentValue: "",
      status: "stock",
      depreciationRate: "0.05",
      location: "",
      latitude: "",
      longitude: "",
    },
  });

  const createTrailerMutation = useMutation({
    mutationFn: async (data: InsertTrailer) => {
      return await apiRequest("POST", "/api/trailers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trailers"] });
      toast({
        title: "Sucesso!",
        description: "Ativo criado com sucesso.",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar ativo.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertTrailer) => {
    createTrailerMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      active: { variant: "default", label: "Ativo" },
      stock: { variant: "secondary", label: "Estoque" },
      maintenance: { variant: "outline", label: "Manutenção" },
      expired: { variant: "destructive", label: "Vencido" },
    };
    return variants[status] || variants.stock;
  };

  const getTrafficLight = (purchaseDate: string) => {
    const purchase = new Date(purchaseDate);
    const now = new Date();
    const monthsDiff = (now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    if (monthsDiff < 12) return "bg-green-500";
    if (monthsDiff < 24) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Ativos</h1>
          <p className="text-sm text-muted-foreground mt-1">Controle e monitore seus trailers</p>
        </div>
        <div className="flex gap-3">
          <Button 
            className="bg-accent hover:bg-accent/90 shadow-lg" 
            data-testid="button-new-asset"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Ativo
          </Button>
          <Button variant="outline" className="border-2" data-testid="button-export">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Ativo</DialogTitle>
            <DialogDescription>
              Adicione um novo trailer ao sistema
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="trailerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID do Trailer</FormLabel>
                      <FormControl>
                        <Input placeholder="TR001" {...field} data-testid="input-trailer-id" />
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
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="stock">Estoque</SelectItem>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="maintenance">Manutenção</SelectItem>
                          <SelectItem value="expired">Vencido</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchaseValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor de Compra (USD)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="50000.00" {...field} data-testid="input-purchase-value" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Atual (USD)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="50000.00" {...field} data-testid="input-current-value" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Aquisição</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-purchase-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="depreciationRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa de Depreciação</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.05" {...field} data-testid="input-depreciation-rate" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Localização</FormLabel>
                      <FormControl>
                        <Input placeholder="Houston, TX" {...field} value={field.value || ""} data-testid="input-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.0000001" placeholder="29.7604" {...field} value={field.value || ""} data-testid="input-latitude" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.0000001" placeholder="-95.3698" {...field} value={field.value || ""} data-testid="input-longitude" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-accent hover:bg-accent/90"
                  disabled={createTrailerMutation.isPending}
                  data-testid="button-submit-asset"
                >
                  {createTrailerMutation.isPending ? "Criando..." : "Criar Ativo"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">STATUS</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">FAROL</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">VALOR</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">AQUISIÇÃO</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">LOCALIZAÇÃO</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {trailers?.map((trailer: any) => {
                  const statusInfo = getStatusBadge(trailer.status);
                  return (
                    <tr
                      key={trailer.id}
                      className="border-b border-border hover:bg-accent/5 transition-colors"
                      data-testid={`trailer-${trailer.id}`}
                    >
                      <td className="py-4 px-6">
                        <span className="font-bold text-primary">{trailer.trailerId}</span>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={statusInfo.variant} className="rounded-full">
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 ${getTrafficLight(trailer.purchaseDate)} rounded-full shadow-lg`}></div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-foreground">
                          ${parseFloat(trailer.currentValue).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        {format(new Date(trailer.purchaseDate), "dd/MM/yyyy")}
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">{trailer.location || "—"}</td>
                      <td className="py-4 px-6">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="hover:bg-accent/20 hover:text-accent" 
                          data-testid={`button-view-${trailer.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {(!trailers || trailers.length === 0) && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      Nenhum ativo cadastrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
