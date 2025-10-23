import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ShoppingCart, Truck, MapPin, DollarSign } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertShareSchema, type Trailer } from "@shared/schema";
import { formatCurrency } from "@/lib/currency";
import { useAuth } from "@/hooks/useAuth";

export default function Portfolio() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ["/api/portfolio"],
  });

  const { data: availableTrailers, isLoading: loadingTrailers, refetch: refetchAvailableTrailers } = useQuery<Trailer[]>({
    queryKey: ["/api/trailers/available"],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (trailerId: string) => {
      const trailer = availableTrailers?.find((t) => t.id === trailerId);
      if (!trailer) throw new Error("Trailer not found");

      const shareData = {
        trailerId: trailer.id,
        purchaseValue: trailer.purchaseValue,
        purchaseDate: new Date().toISOString().split("T")[0],
        status: "active" as const,
        monthlyReturn: "2.00",
        totalReturns: "0.00",
      };

      return await apiRequest("POST", "/api/shares", shareData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trailers/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shares"] });
      setIsDialogOpen(false);
      toast({
        title: "Cota adquirida com sucesso!",
        description: "Sua nova cota foi registrada e já está gerando retornos.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao comprar cota",
        description: error.message || "Não foi possível processar sua compra. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-96" />
      </div>
    );
  }

  const calculateProjection = (shares: any[], months: number) => {
    return shares.reduce((sum, share) => {
      const monthlyReturn = parseFloat(share.purchaseValue) * parseFloat(share.monthlyReturn) / 100;
      return sum + (monthlyReturn * months);
    }, 0);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8" data-testid="page-portfolio">
      <div className="flex justify-end items-center">
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (open) {
            refetchAvailableTrailers();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 h-11 px-4" data-testid="button-buy-share">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Comprar Nova Cota</span>
              <span className="sm:hidden">Comprar</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto" data-testid="dialog-buy-share">
            <DialogHeader>
              <DialogTitle>Trailers Disponíveis</DialogTitle>
              <DialogDescription>
                Selecione um trailer para adquirir sua cota. Cada cota representa a propriedade de um trailer completo.
              </DialogDescription>
            </DialogHeader>

            {loadingTrailers ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : availableTrailers && availableTrailers.length > 0 ? (
              <div className="grid gap-4">
                {availableTrailers.map((trailer) => (
                  <Card key={trailer.id} className="overflow-hidden" data-testid={`card-trailer-${trailer.id}`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="bg-primary/10 p-2 rounded-lg">
                              <Truck className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-lg" data-testid={`text-trailer-id-${trailer.id}`}>
                                {trailer.trailerId}
                              </h3>
                              <div className="flex gap-2 items-center mt-1 flex-wrap">
                                <Badge variant="secondary">Disponível</Badge>
                                {trailer.availableShares !== undefined && (
                                  <Badge variant={trailer.availableShares > 0 ? "default" : "destructive"} className="text-xs">
                                    {trailer.availableShares} {trailer.availableShares === 1 ? "cota disponível" : "cotas disponíveis"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground">Valor da Cota</p>
                                <p className="font-bold" data-testid={`text-value-${trailer.id}`}>
                                  ${parseFloat(trailer.purchaseValue).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            </div>
                            
                            {trailer.location && (
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-muted-foreground">Localização</p>
                                  <p className="font-medium">{trailer.location}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-sm text-green-800 dark:text-green-300">
                              <span className="font-semibold">Retorno mensal: </span>
                              ${(parseFloat(trailer.purchaseValue) * 0.02).toLocaleString("en-US", { minimumFractionDigits: 2 })} (2%)
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={() => purchaseMutation.mutate(trailer.id)}
                          disabled={purchaseMutation.isPending}
                          className="ml-4"
                          data-testid={`button-purchase-${trailer.id}`}
                        >
                          {purchaseMutation.isPending ? "Processando..." : "Comprar"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12" data-testid="text-no-trailers">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum trailer disponível no momento</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card className="shadow-lg">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg font-bold">Histórico de Retornos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-4 px-4 sm:px-6 font-semibold text-muted-foreground whitespace-nowrap">MÊS/ANO</th>
                      <th className="text-left py-4 px-4 sm:px-6 font-semibold text-muted-foreground whitespace-nowrap">VALOR PAGO</th>
                      <th className="text-left py-4 px-4 sm:px-6 font-semibold text-muted-foreground whitespace-nowrap">DATA</th>
                      <th className="text-left py-4 px-4 sm:px-6 font-semibold text-muted-foreground whitespace-nowrap">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio?.payments?.map((payment: any) => (
                      <tr key={payment.id} className="border-b border-border hover:bg-muted/20 transition-colors" data-testid={`payment-${payment.id}`}>
                        <td className="py-4 px-4 sm:px-6 font-medium whitespace-nowrap">{payment.referenceMonth}</td>
                        <td className="py-4 px-4 sm:px-6 font-bold text-green-600 whitespace-nowrap">
                          {formatCurrency(parseFloat(payment.amount), user?.country)}
                        </td>
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap">{format(new Date(payment.paymentDate), "dd/MM/yyyy")}</td>
                        <td className="py-4 px-4 sm:px-6">
                          <Badge variant={payment.status === "paid" ? "default" : "secondary"} className="rounded-full whitespace-nowrap">
                            {payment.status === "paid" ? "Pago" : "Pendente"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {(!portfolio?.payments || portfolio.payments.length === 0) && (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-muted-foreground">
                          Nenhum pagamento registrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-lg border-l-4 border-l-accent">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Projeção de Ganhos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div className="bg-muted/30 p-4 rounded-xl">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-muted-foreground">Próximos 3 meses</span>
                    <span className="font-bold text-accent">
                      {formatCurrency(calculateProjection(portfolio?.shares || [], 3), user?.country)}
                    </span>
                  </div>
                  <Progress value={25} className="h-2 bg-accent/20" />
                </div>
                <div className="bg-muted/30 p-4 rounded-xl">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-muted-foreground">Próximos 6 meses</span>
                    <span className="font-bold text-accent">
                      {formatCurrency(calculateProjection(portfolio?.shares || [], 6), user?.country)}
                    </span>
                  </div>
                  <Progress value={50} className="h-2 bg-accent/20" />
                </div>
                <div className="bg-muted/30 p-4 rounded-xl">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-muted-foreground">Próximos 12 meses</span>
                    <span className="font-bold text-accent">
                      {formatCurrency(calculateProjection(portfolio?.shares || [], 12), user?.country)}
                    </span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Minhas Cotas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {portfolio?.shares?.map((share: any) => (
                  <div key={share.id} className="p-3 bg-muted/50 rounded-md" data-testid={`share-card-${share.id}`}>
                    <div className="flex justify-between items-center gap-2 mb-2">
                      <span className="font-medium truncate" title={`Cota #${share.id}`}>Cota #{share.id.slice(0, 8)}</span>
                      <Badge variant={share.status === "active" ? "default" : "secondary"} className="flex-shrink-0">
                        {share.status === "active" ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="break-all">Valor: {formatCurrency(parseFloat(share.purchaseValue), user?.country)}</p>
                      <p>Adquirida: {format(new Date(share.purchaseDate), "dd/MM/yyyy")}</p>
                      <p className="text-green-600 font-medium break-all">
                        Retorno mensal: {formatCurrency(parseFloat(share.purchaseValue) * parseFloat(share.monthlyReturn) / 100, user?.country)}
                      </p>
                    </div>
                  </div>
                ))}
                {(!portfolio?.shares || portfolio.shares.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                    Nenhuma cota ativa
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
