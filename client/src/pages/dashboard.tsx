import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { Wallet, TrendingUp, DollarSign, Calendar, Activity, Truck, Users, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/currency";

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
  const { t, i18n } = useTranslation();
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
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card className="border-l-4 border-l-accent shadow-md hover:shadow-lg transition-all active:opacity-90">
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-accent/10 p-2 sm:p-2.5 lg:p-3 rounded-xl lg:rounded-2xl">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-accent" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('dashboard.totalFleetValue')}</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground" data-testid="text-total-fleet-value">
                {formatCurrency(companyStats.totalFleetValue, i18n.language === 'pt-BR' ? 'BRL' : 'USD')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-all active:opacity-90">
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-green-500/10 p-2 sm:p-2.5 lg:p-3 rounded-xl lg:rounded-2xl">
                  <Truck className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('dashboard.totalTrailers')}</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground" data-testid="text-total-trailers">
                {companyStats.totalTrailers}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {companyStats.activeTrailers} {t('dashboard.active')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-all active:opacity-90">
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-blue-500/10 p-2 sm:p-2.5 lg:p-3 rounded-xl lg:rounded-2xl">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('dashboard.sharesSold')}</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground" data-testid="text-shares-sold">
                {companyStats.totalSharesSold}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-all active:opacity-90">
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-purple-500/10 p-2 sm:p-2.5 lg:p-3 rounded-xl lg:rounded-2xl">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('dashboard.totalMargin')}</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground" data-testid="text-total-margin">
                {formatCurrency(companyStats.totalMargin, i18n.language === 'pt-BR' ? 'BRL' : 'USD')}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">{t('dashboard.revenueOverview')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-72 lg:h-80">
              <PerformanceChart
                data={revenueChartData}
                color="#10b981"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">{t('dashboard.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {companyStats.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted/30 dark:bg-muted/10 rounded-lg gap-2" data-testid={`activity-${activity.id}`}>
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <div className="bg-accent/10 p-2 rounded-lg flex-shrink-0">
                      <Activity className="h-4 w-4 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {t('dashboard.paymentProcessed')}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t('dashboard.user')}: {activity.userId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 flex-shrink-0">
                    <span className="text-sm sm:text-base font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(parseFloat(activity.amount), i18n.language === 'pt-BR' ? 'BRL' : 'USD')}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(activity.paymentDate), 'dd/MM/yyyy')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Investor Dashboard
  const investorStats = stats as InvestorStats;
  
  const paymentsByMonth = new Map();
  investorStats?.recentPayments?.forEach((p: any) => {
    const currentValue = paymentsByMonth.get(p.referenceMonth) || 0;
    paymentsByMonth.set(p.referenceMonth, currentValue + parseFloat(p.amount));
  });

  const performanceData = Array.from(paymentsByMonth.entries())
    .map(([month, value]) => ({
      month: formatMonth(month),
      value: value as number,
    }))
    .slice(-6);

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="border-l-4 border-l-accent shadow-md hover:shadow-lg transition-all active:opacity-90">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-accent/10 p-2 sm:p-2.5 lg:p-3 rounded-xl lg:rounded-2xl">
                <Wallet className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-accent" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('dashboard.totalInvested')}</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground" data-testid="text-total-value">
              {formatCurrency(investorStats?.totalValue || 0, i18n.language === 'pt-BR' ? 'BRL' : 'USD')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-all active:opacity-90">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-500/10 p-2 sm:p-2.5 lg:p-3 rounded-xl lg:rounded-2xl">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('dashboard.monthlyReturn')}</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground" data-testid="text-monthly-return">
              {formatCurrency(investorStats?.monthlyReturn || 0, i18n.language === 'pt-BR' ? 'BRL' : 'USD')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-all active:opacity-90">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-500/10 p-2 sm:p-2.5 lg:p-3 rounded-xl lg:rounded-2xl">
                <Truck className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('dashboard.activeShares')}</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground" data-testid="text-active-shares">
              {investorStats?.activeShares || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-all active:opacity-90">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-purple-500/10 p-2 sm:p-2.5 lg:p-3 rounded-xl lg:rounded-2xl">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">{t('dashboard.totalReturns')}</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground" data-testid="text-total-returns">
              {formatCurrency(investorStats?.totalReturns || 0, i18n.language === 'pt-BR' ? 'BRL' : 'USD')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">{t('dashboard.performanceOverview')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-72 lg:h-80">
            <PerformanceChart
              data={performanceData}
              color="#10b981"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">{t('dashboard.recentPayments')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {investorStats?.recentPayments?.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted/30 dark:bg-muted/10 rounded-lg gap-2" data-testid={`payment-${payment.id}`}>
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="bg-green-500/10 p-2 rounded-lg flex-shrink-0">
                    <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {t('dashboard.payment')} - {formatMonth(payment.referenceMonth)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(payment.paymentDate), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                <span className="text-sm sm:text-base font-bold text-green-600 dark:text-green-400 flex-shrink-0">
                  {formatCurrency(parseFloat(payment.amount), i18n.language === 'pt-BR' ? 'BRL' : 'USD')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
