import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Eye, Plus } from "lucide-react";
import { format } from "date-fns";

export default function Assets() {
  const { data: trailers, isLoading } = useQuery({
    queryKey: ["/api/trailers"],
  });

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
          <Button className="bg-accent hover:bg-accent/90 shadow-lg" data-testid="button-new-asset">
            <Plus className="mr-2 h-4 w-4" />
            Novo Ativo
          </Button>
          <Button variant="outline" className="border-2" data-testid="button-export">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

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
