import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { Wallet, TrendingUp, DollarSign, Calendar, Activity } from "lucide-react";
import { format } from "date-fns";

interface DashboardStats {
  totalValue: number;
  activeShares: number;
  monthlyReturn: number;
  totalReturns: number;
  nextPayment: number;
  recentPayments: Array<{
    id: string;
    amount: string;
    referenceMonth: string;
    paymentDate: string;
  }>;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: shares = [] } = useQuery<any[]>({
    queryKey: ["/api/shares"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "maintenance":
        return "bg-yellow-500";
      case "expired":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const performanceData = stats?.recentPayments?.slice(0, 6).reverse().map((p: any) => ({
    month: p.referenceMonth,
    value: parseFloat(p.amount),
  })) || [];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral da sua carteira de investimentos</p>
        </div>
        <div className="bg-accent px-4 py-2 rounded-lg">
          <p className="text-xs font-medium text-primary">Último acesso</p>
          <p className="text-sm font-bold text-primary">{format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-t-4 border-t-accent shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-accent/10 p-3 rounded-xl">
                <Wallet className="h-6 w-6 text-accent" />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Carteira Total</p>
            <p className="text-3xl font-bold text-foreground mb-2" data-testid="text-total-value">
              ${stats?.totalValue?.toFixed(2) || "0.00"}
            </p>
            <p className="text-xs text-green-600 font-medium">↑ Valor total investido</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-primary/10 p-3 rounded-xl">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Cotas Ativas</p>
            <p className="text-3xl font-bold text-foreground mb-2" data-testid="text-active-shares">
              {stats?.activeShares || 0}
            </p>
            <p className="text-xs text-muted-foreground">Rendimento: 2% a.m.</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Retorno Mensal</p>
            <p className="text-3xl font-bold text-green-600 mb-2" data-testid="text-monthly-return">
              ${stats?.monthlyReturn?.toFixed(2) || "0.00"}
            </p>
            <p className="text-xs text-green-600 font-medium">↑ 2% sobre carteira</p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-blue-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Próximo Pagamento</p>
            <p className="text-3xl font-bold text-foreground mb-2" data-testid="text-next-payment">
              ${stats?.nextPayment?.toFixed(2) || "0.00"}
            </p>
            <p className="text-xs text-muted-foreground">
              Previsão: {format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5), "dd/MM/yyyy")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance dos Últimos Meses</CardTitle>
          </CardHeader>
          <CardContent>
            {performanceData.length > 0 ? (
              <PerformanceChart data={performanceData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado de performance disponível
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recentPayments?.slice(0, 5).map((payment: any) => (
                <div
                  key={payment.id}
                  className="flex items-center space-x-3 p-3 bg-muted/50 rounded-md"
                  data-testid={`activity-${payment.id}`}
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Pagamento recebido - {payment.referenceMonth}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(payment.paymentDate), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    +${parseFloat(payment.amount).toFixed(2)}
                  </span>
                </div>
              ))}
              {(!stats?.recentPayments || stats.recentPayments.length === 0) && (
                <div className="text-center text-muted-foreground py-8">
                  Nenhuma atividade recente
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos Meus Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shares?.map((share: any) => (
              <div
                key={share.id}
                className="border border-border rounded-lg p-4"
                data-testid={`share-${share.id}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Cota #{share.id.slice(0, 8)}</h4>
                  <span className={`${getStatusColor(share.status)} px-2 py-1 rounded-full text-xs font-medium text-white`}>
                    {share.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-medium">${parseFloat(share.purchaseValue).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Adquirida:</span>
                    <span>{format(new Date(share.purchaseDate), "dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Retorno mensal:</span>
                    <span className="font-medium text-green-600">
                      ${(parseFloat(share.purchaseValue) * parseFloat(share.monthlyReturn) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {(!shares || shares.length === 0) && (
              <div className="col-span-3 text-center text-muted-foreground py-8">
                Você ainda não possui cotas ativas
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
