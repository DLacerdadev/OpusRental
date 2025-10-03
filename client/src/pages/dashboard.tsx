import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { Wallet, TrendingUp, DollarSign, Calendar, Activity, Truck, Users, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

interface InvestorStats {
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

interface CompanyStats {
  totalFleetValue: number;
  totalTrailers: number;
  activeTrailers: number;
  totalSharesSold: number;
  totalRevenue: number;
  totalMargin: number;
  revenueData: Array<{
    month: string;
    revenue: number;
  }>;
  recentActivity: Array<{
    id: string;
    amount: string;
    referenceMonth: string;
    paymentDate: string;
    userId: string;
  }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: stats, isLoading } = useQuery<InvestorStats | CompanyStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: shares = [] } = useQuery<any[]>({
    queryKey: ["/api/shares"],
    enabled: user?.role === "investor",
  });

  const formatMonth = (month: string) => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const [year, monthNum] = month.split('-');
    return `${months[parseInt(monthNum) - 1]}/${year}`;
  };

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

  const isManager = user?.role === "manager" || user?.role === "admin";

  // Manager/Admin Dashboard
  if (isManager && stats && 'totalFleetValue' in stats) {
    const companyStats = stats as CompanyStats;
    
    const revenueChartData = companyStats.revenueData.map(data => ({
      month: formatMonth(data.month),
      value: data.revenue,
    }));

    return (
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('dashboard.companyTitle')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('dashboard.companySubtitle')}</p>
          </div>
          <div className="bg-accent/10 border border-accent/30 px-4 py-2 rounded-xl">
            <p className="text-xs font-semibold text-accent">{t('dashboard.lastAccess')}</p>
            <p className="text-sm font-bold text-foreground">{format(new Date(), "dd/MM/yyyy • HH:mm")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-accent shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-accent/10 p-3 rounded-2xl">
                  <Truck className="h-7 w-7 text-accent" />
                </div>
                <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-1 rounded-full">
                  {companyStats.activeTrailers}/{companyStats.totalTrailers}
                </span>
              </div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">{t('dashboard.totalFleetValue')}</p>
              <p className="text-3xl font-bold text-foreground" data-testid="text-total-fleet-value">
                ${companyStats.totalFleetValue.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-primary/10 p-3 rounded-2xl">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">{t('dashboard.sold')}</span>
              </div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">{t('dashboard.totalSharesSold')}</p>
              <p className="text-3xl font-bold text-foreground" data-testid="text-shares-sold">
                {companyStats.totalSharesSold}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-50 p-3 rounded-2xl">
                  <DollarSign className="h-7 w-7 text-green-600" />
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">6 {t('dashboard.months')}</span>
              </div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">{t('dashboard.companyRevenue')}</p>
              <p className="text-3xl font-bold text-green-600" data-testid="text-total-revenue">
                ${companyStats.totalRevenue.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-50 p-3 rounded-2xl">
                  <BarChart3 className="h-7 w-7 text-purple-600" />
                </div>
                <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">6 {t('dashboard.months')}</span>
              </div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">{t('dashboard.companyMargin')}</p>
              <p className="text-3xl font-bold text-purple-600" data-testid="text-total-margin">
                ${companyStats.totalMargin.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.revenuePerformance')}</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueChartData.length > 0 ? (
                <PerformanceChart data={revenueChartData} />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  {t('dashboard.noRevenueData')}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.recentSystemActivity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {companyStats.recentActivity?.slice(0, 5).map((activity: any) => (
                  <div
                    key={activity.id}
                    className="flex items-center space-x-3 p-3 bg-muted/50 rounded-md"
                    data-testid={`activity-${activity.id}`}
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {t('dashboard.paymentProcessed')} - {formatMonth(activity.referenceMonth)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.paymentDate), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      ${parseFloat(activity.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
                {(!companyStats.recentActivity || companyStats.recentActivity.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                    {t('dashboard.noRecentActivity')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Investor Dashboard
  const investorStats = stats as InvestorStats;
  
  // Agregar pagamentos do mesmo mês e formatar para o gráfico
  const paymentsByMonth = new Map<string, number>();
  investorStats?.recentPayments?.forEach((p: any) => {
    const currentValue = paymentsByMonth.get(p.referenceMonth) || 0;
    paymentsByMonth.set(p.referenceMonth, currentValue + parseFloat(p.amount));
  });

  // Ordenar cronologicamente e formatar
  const performanceData = Array.from(paymentsByMonth.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, value]) => ({
      month: formatMonth(month),
      value: value,
    }));

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="bg-accent/10 border border-accent/30 px-4 py-2 rounded-xl">
          <p className="text-xs font-semibold text-accent">{t('dashboard.lastAccess')}</p>
          <p className="text-sm font-bold text-foreground">{format(new Date(), "dd/MM/yyyy • HH:mm")}</p>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-accent shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-accent/10 p-3 rounded-2xl">
                <Wallet className="h-7 w-7 text-accent" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">+0%</span>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">{t('dashboard.totalValue')}</p>
            <p className="text-3xl font-bold text-foreground" data-testid="text-total-value">
              ${investorStats?.totalValue?.toFixed(2) || "0.00"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <TrendingUp className="h-7 w-7 text-primary" />
              </div>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">{t('dashboard.active')}</span>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">{t('dashboard.activeShares')}</p>
            <p className="text-3xl font-bold text-foreground" data-testid="text-active-shares">
              {investorStats?.activeShares || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-50 p-3 rounded-2xl">
                <DollarSign className="h-7 w-7 text-green-600" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">2% a.m.</span>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">{t('dashboard.monthlyReturn')}</p>
            <p className="text-3xl font-bold text-green-600" data-testid="text-monthly-return">
              ${investorStats?.monthlyReturn?.toFixed(2) || "0.00"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-secondary/10 p-3 rounded-2xl">
                <Calendar className="h-7 w-7 text-secondary" />
              </div>
              <span className="text-xs font-semibold text-secondary bg-secondary/10 px-2 py-1 rounded-full">
                {format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5), "dd/MM")}
              </span>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">{t('dashboard.nextPayment')}</p>
            <p className="text-3xl font-bold text-foreground" data-testid="text-next-payment">
              ${investorStats?.nextPayment?.toFixed(2) || "0.00"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.performanceLastMonths')}</CardTitle>
          </CardHeader>
          <CardContent>
            {performanceData.length > 0 ? (
              <PerformanceChart data={performanceData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t('dashboard.noPerformanceData')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {investorStats?.recentPayments?.slice(0, 5).map((payment: any) => (
                <div
                  key={payment.id}
                  className="flex items-center space-x-3 p-3 bg-muted/50 rounded-md"
                  data-testid={`activity-${payment.id}`}
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {t('dashboard.paymentReceived')} - {formatMonth(payment.referenceMonth)}
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
              {(!investorStats?.recentPayments || investorStats.recentPayments.length === 0) && (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shares?.map((share: any) => (
              <div
                key={share.id}
                className="border border-border rounded-lg p-4"
                data-testid={`share-${share.id}`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h4 className="font-medium truncate" title={`Cota #${share.id}`}>Cota #{share.id.slice(0, 8)}</h4>
                  <span className={`${getStatusColor(share.status)} px-2 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap flex-shrink-0`}>
                    {share.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Valor:</span>
                    <span className="font-medium text-right break-all">${parseFloat(share.purchaseValue).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Adquirida:</span>
                    <span className="text-right whitespace-nowrap">{format(new Date(share.purchaseDate), "dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground flex-shrink-0">Retorno mensal:</span>
                    <span className="font-medium text-green-600 text-right break-all">
                      ${(parseFloat(share.purchaseValue) * parseFloat(share.monthlyReturn) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {(!shares || shares.length === 0) && (
              <div className="col-span-full text-center text-muted-foreground py-8">
                Você ainda não possui cotas ativas
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
