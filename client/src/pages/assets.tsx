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
import { formatCurrency } from "@/lib/utils";

export default function Assets() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState<any>(null);
  const { toast } = useToast();
  
  const { data: trailers, isLoading } = useQuery({
    queryKey: ["/api/trailers"],
  });

  const form = useForm<InsertTrailer>({
    resolver: zodResolver(insertTrailerSchema),
    defaultValues: {
      trailerId: "",
      model: "",
      purchaseValue: "",
      purchaseDate: new Date().toISOString().split('T')[0],
      currentValue: "",
      status: "stock",
      depreciationRate: "0.05",
      location: "",
      latitude: "",
      longitude: "",
      totalShares: 1,
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
    // Remove latitude/longitude if they're empty strings
    const cleanedData = {
      ...data,
      latitude: data.latitude === "" ? undefined : data.latitude,
      longitude: data.longitude === "" ? undefined : data.longitude,
    };
    createTrailerMutation.mutate(cleanedData as InsertTrailer);
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

  const handleExport = () => {
    if (!trailers || trailers.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há ativos cadastrados no sistema.",
        variant: "destructive",
      });
      return;
    }

    // Traduções de status para português
    const statusTranslations: Record<string, string> = {
      stock: "Estoque",
      active: "Ativo",
      maintenance: "Manutenção",
      expired: "Vencido",
    };

    const headers = [
      "ID do Trailer",
      "Status",
      "Cotas Vendidas",
      "Total de Cotas",
      "Cotas Disponíveis",
      "Valor de Compra (USD)",
      "Valor Atual (USD)",
      "Data de Aquisição",
      "Taxa de Depreciação",
      "Localização",
      "Latitude",
      "Longitude"
    ];

    // Função para formatar valores monetários no padrão brasileiro
    const formatCurrency = (value: string | number) => {
      const num = parseFloat(String(value));
      const formatted = num.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      return `$ ${formatted}`;
    };

    const csvData = trailers.map((trailer: any) => [
      trailer.trailerId,
      statusTranslations[trailer.status] || trailer.status,
      trailer.soldShares || 0,
      trailer.totalShares || 1,
      (trailer.totalShares || 1) - (trailer.soldShares || 0),
      formatCurrency(trailer.purchaseValue),
      formatCurrency(trailer.currentValue),
      format(new Date(trailer.purchaseDate), "dd/MM/yyyy"),
      trailer.depreciationRate || "0",
      trailer.location || "",
      trailer.latitude || "",
      trailer.longitude || "",
    ]);

    const csvRows = [
      headers.join(";"),
      ...csvData.map((row: any[]) => 
        row.map((cell: any) => {
          const cellStr = String(cell);
          if (cellStr.includes(";") || cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(";")
      )
    ];

    const BOM = "\uFEFF";
    const csvContent = BOM + csvRows.join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `ativos_opus_rental_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportado com sucesso!",
      description: "Planilha de ativos baixada com todos os detalhes.",
    });
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
          <Button 
            variant="outline" 
            className="border-2" 
            data-testid="button-export"
            onClick={handleExport}
          >
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
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <FormControl>
                        <Input placeholder="Dry Van 53ft" {...field} data-testid="input-model" />
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
                  name="totalShares"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total de Cotas</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="1" 
                          {...field} 
                          value={field.value || 1}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          data-testid="input-total-shares" 
                        />
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
                      <FormLabel>Latitude (Opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.0000001" 
                          placeholder="29.7604" 
                          {...field} 
                          value={field.value || ""} 
                          data-testid="input-latitude" 
                        />
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
                      <FormLabel>Longitude (Opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.0000001" 
                          placeholder="-95.3698" 
                          {...field} 
                          value={field.value || ""} 
                          data-testid="input-longitude" 
                        />
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

      {/* Modal de Detalhes do Ativo */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">
              Detalhes do Ativo
            </DialogTitle>
            <DialogDescription>
              Informações completas do ativo selecionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedTrailer && (
            <div className="space-y-6 mt-4">
              {/* Informações Básicas */}
              <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-lg mb-3">Informações Básicas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">ID do Trailer</label>
                    <p className="font-bold text-primary text-lg">{selectedTrailer.trailerId}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Modelo</label>
                    <p className="font-semibold">{selectedTrailer.model || "—"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge variant={getStatusBadge(selectedTrailer.status).variant} className="rounded-full">
                        {getStatusBadge(selectedTrailer.status).label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Data de Aquisição</label>
                    <p className="font-semibold">
                      {format(new Date(selectedTrailer.purchaseDate), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações Financeiras */}
              <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-lg mb-3">Informações Financeiras</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Valor de Compra</label>
                    <p className="font-bold text-lg">${parseFloat(selectedTrailer.purchaseValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Valor Atual</label>
                    <p className="font-bold text-lg">${parseFloat(selectedTrailer.currentValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Taxa de Depreciação</label>
                    <p className="font-semibold">{(parseFloat(selectedTrailer.depreciationRate) * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Indicador de Idade</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-5 h-5 ${getTrafficLight(selectedTrailer.purchaseDate)} rounded-full shadow-lg`}></div>
                      <span className="text-sm text-muted-foreground">
                        {getTrafficLight(selectedTrailer.purchaseDate) === "bg-green-500" && "< 1 ano"}
                        {getTrafficLight(selectedTrailer.purchaseDate) === "bg-yellow-500" && "1-2 anos"}
                        {getTrafficLight(selectedTrailer.purchaseDate) === "bg-red-500" && "> 2 anos"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações de Cotas */}
              <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-lg mb-3">Informações de Cotas</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Total de Cotas</label>
                    <p className="font-bold text-lg">{selectedTrailer.totalShares || 1}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Cotas Vendidas</label>
                    <p className="font-bold text-lg">{selectedTrailer.soldShares || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Cotas Disponíveis</label>
                    <p className="font-bold text-lg text-accent">
                      {(selectedTrailer.totalShares || 1) - (selectedTrailer.soldShares || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Localização */}
              <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-lg mb-3">Localização</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Cidade/Estado</label>
                    <p className="font-semibold">{selectedTrailer.location || "—"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Latitude</label>
                    <p className="font-mono text-sm">{selectedTrailer.latitude || "—"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Longitude</label>
                    <p className="font-mono text-sm">{selectedTrailer.longitude || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={() => setDetailsDialogOpen(false)}
                  className="bg-accent hover:bg-accent/90"
                  data-testid="button-close-details"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">MODELO</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">STATUS</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">COTAS</th>
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
                        <span className="text-foreground">{trailer.model || "—"}</span>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={statusInfo.variant} className="rounded-full">
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-foreground" data-testid={`text-shares-${trailer.id}`}>
                          {trailer.soldShares || 0}/{trailer.totalShares || 1}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 ${getTrafficLight(trailer.purchaseDate)} rounded-full shadow-lg`}></div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-foreground">
                          {formatCurrency(parseFloat(trailer.currentValue))}
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
                          onClick={() => {
                            setSelectedTrailer(trailer);
                            setDetailsDialogOpen(true);
                          }}
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
                    <td colSpan={9} className="text-center py-12 text-muted-foreground">
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
