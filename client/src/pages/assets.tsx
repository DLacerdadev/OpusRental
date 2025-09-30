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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gestão de Ativos</h3>
        <div className="flex space-x-2">
          <Button data-testid="button-new-asset">
            <Plus className="mr-2 h-4 w-4" />
            Novo Ativo
          </Button>
          <Button variant="outline" data-testid="button-export">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-4 px-4">ID</th>
                  <th className="text-left py-4 px-4">Status</th>
                  <th className="text-left py-4 px-4">Farol</th>
                  <th className="text-left py-4 px-4">Valor</th>
                  <th className="text-left py-4 px-4">Aquisição</th>
                  <th className="text-left py-4 px-4">Localização</th>
                  <th className="text-left py-4 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {trailers?.map((trailer: any) => {
                  const statusInfo = getStatusBadge(trailer.status);
                  return (
                    <tr
                      key={trailer.id}
                      className="border-b border-border hover:bg-muted/30"
                      data-testid={`trailer-${trailer.id}`}
                    >
                      <td className="py-4 px-4 font-medium">{trailer.trailerId}</td>
                      <td className="py-4 px-4">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className={`w-3 h-3 ${getTrafficLight(trailer.purchaseDate)} rounded-full`}></div>
                      </td>
                      <td className="py-4 px-4 font-medium">
                        ${parseFloat(trailer.currentValue).toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        {format(new Date(trailer.purchaseDate), "dd/MM/yyyy")}
                      </td>
                      <td className="py-4 px-4">{trailer.location || "—"}</td>
                      <td className="py-4 px-4">
                        <Button variant="ghost" size="icon" data-testid={`button-view-${trailer.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {(!trailers || trailers.length === 0) && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
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
