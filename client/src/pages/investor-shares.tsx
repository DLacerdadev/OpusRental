import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Truck, Search, TrendingUp, DollarSign } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface ShareWithDetails {
  id: string;
  userId: string;
  trailerId: string;
  status: string;
  purchaseDate: string;
  purchaseValue: string;
  monthlyReturn: string;
  totalReturns: string;
  createdAt: Date;
  updatedAt: Date;
  userFirstName: string | null;
  userLastName: string | null;
  userEmail: string;
  trailerTrailerId: string;
  trailerPurchaseValue: string;
  trailerCurrentValue: string;
  trailerStatus: string;
  trailerLocation: string | null;
}

export default function InvestorShares() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: shares, isLoading } = useQuery<ShareWithDetails[]>({
    queryKey: ["/api/shares/all"],
  });

  const filteredShares = shares?.filter((share) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${share.userFirstName || ""} ${share.userLastName || ""}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      share.userEmail.toLowerCase().includes(searchLower) ||
      share.trailerTrailerId.toLowerCase().includes(searchLower) ||
      share.status.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    totalShares: shares?.length || 0,
    activeShares: shares?.filter((s) => s.status === "active").length || 0,
    totalInvestors: new Set(shares?.map((s) => s.userId)).size || 0,
    totalValue: shares?.reduce((sum, s) => sum + parseFloat(s.purchaseValue), 0) || 0,
  };

  return (
    <div className="space-y-6" data-testid="page-investor-shares">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-investor-shares">Cotas dos Investidores</h1>
        <p className="text-muted-foreground" data-testid="text-description">
          Visualize todas as cotas adquiridas pelos investidores
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-total-shares">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cotas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-shares">{stats.totalShares}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-active-shares">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cotas Ativas</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-shares">{stats.activeShares}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-investors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investidores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-investors">{stats.totalInvestors}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-value">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Investido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-value">
              ${stats.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-testid="input-search"
            placeholder="Buscar por investidor, email, trailer ou status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Shares Table */}
      <Card data-testid="card-shares-table">
        <CardHeader>
          <CardTitle>Lista de Cotas</CardTitle>
          <CardDescription>
            {filteredShares?.length || 0} cotas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" data-testid={`skeleton-share-${i}`} />
              ))}
            </div>
          ) : filteredShares && filteredShares.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Investidor</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Trailer</th>
                    <th className="text-left py-3 px-4 font-medium">Valor da Cota</th>
                    <th className="text-left py-3 px-4 font-medium">Retorno Mensal</th>
                    <th className="text-left py-3 px-4 font-medium">Total Recebido</th>
                    <th className="text-left py-3 px-4 font-medium">Data de Compra</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShares.map((share) => (
                    <tr key={share.id} className="border-b hover:bg-muted/50" data-testid={`row-share-${share.id}`}>
                      <td className="py-3 px-4" data-testid={`text-investor-${share.id}`}>
                        <div className="font-medium">
                          {share.userFirstName || share.userLastName
                            ? `${share.userFirstName || ""} ${share.userLastName || ""}`.trim()
                            : "N/A"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground" data-testid={`text-email-${share.id}`}>
                        {share.userEmail}
                      </td>
                      <td className="py-3 px-4" data-testid={`text-trailer-${share.id}`}>
                        <div className="font-medium">{share.trailerTrailerId}</div>
                        {share.trailerLocation && (
                          <div className="text-xs text-muted-foreground">{share.trailerLocation}</div>
                        )}
                      </td>
                      <td className="py-3 px-4" data-testid={`text-value-${share.id}`}>
                        ${parseFloat(share.purchaseValue).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-green-600" data-testid={`text-return-${share.id}`}>
                        {parseFloat(share.monthlyReturn).toFixed(2)}%
                      </td>
                      <td className="py-3 px-4" data-testid={`text-total-returns-${share.id}`}>
                        ${parseFloat(share.totalReturns).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-sm" data-testid={`text-date-${share.id}`}>
                        {format(new Date(share.purchaseDate), "dd/MM/yyyy")}
                      </td>
                      <td className="py-3 px-4" data-testid={`badge-status-${share.id}`}>
                        <Badge variant={share.status === "active" ? "default" : "secondary"}>
                          {share.status === "active" ? "Ativa" : "Inativa"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12" data-testid="text-no-shares">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhuma cota encontrada com os filtros aplicados" : "Nenhuma cota cadastrada"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
