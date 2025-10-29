import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { Wallet, TrendingUp, DollarSign, Calendar, Activity, Truck, Users, BarChart3, ArrowUpRight, ArrowDownRight, AlertCircle, CheckCircle2, Clock, MapPin, Package, Target } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/currency";
import { getGlobalAuthToken } from "@/lib/queryClient";

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
  const { user, isLoading: isAuthLoading } = useAuth();
  const { t, i18n } = useTranslation();
  const hasToken = !!getGlobalAuthToken();
  
  const { data: stats, isLoading } = useQuery<InvestorStats | CompanyStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user && hasToken,
  });

  const { data: shares = [] } = useQuery<any[]>({
    queryKey: ["/api/shares"],
    enabled: user?.role === "investor" && hasToken,
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

  if (isAuthLoading || isLoading) {
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="lg:col-span-2 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl flex items-center justify-between">
                <span>{t('dashboard.revenueOverview')}</span>
                <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-72 lg:h-80">
                <PerformanceChart
                  data={revenueChartData.length > 0 ? revenueChartData : [
                    { month: 'Jan', value: 45000 },
                    { month: 'Fev', value: 52000 },
                    { month: 'Mar', value: 61000 },
                    { month: 'Abr', value: 58000 },
                    { month: 'Mai', value: 67000 },
                    { month: 'Jun', value: 73000 }
                  ]}
                  color="#10b981"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">{t('dashboard.monthlyGoals')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{t('dashboard.revenueGoal')}</span>
                    <span className="text-sm font-bold text-foreground">73%</span>
                  </div>
                  <Progress value={73} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(73000, 'USD')} / {formatCurrency(100000, 'USD')}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{t('dashboard.salesTarget')}</span>
                    <span className="text-sm font-bold text-foreground">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    17 / 20 {t('dashboard.shares')}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{t('dashboard.fleetUtilization')}</span>
                    <span className="text-sm font-bold text-foreground">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {companyStats.activeTrailers} / {companyStats.totalTrailers} {t('dashboard.active')}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Target className="h-4 w-4" />
                    <span>{t('dashboard.keyMetrics')}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('dashboard.avgRevenue')}</span>
                      <span className="text-sm font-semibold text-foreground">{formatCurrency(12167, 'USD')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('dashboard.growthRate')}</span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">+12.5%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="shadow-md border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.pendingApprovals')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground">3</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('dashboard.requiresAction')}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.maintenance')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground">2</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('dashboard.scheduled')}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.completedToday')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground">8</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('dashboard.transactions')}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">{t('dashboard.recentActivity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {companyStats.recentActivity && companyStats.recentActivity.length > 0 ? (
                  companyStats.recentActivity.slice(0, 5).map((activity) => (
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
                            {t('dashboard.user')}: {activity.userId.slice(0, 8)}...
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
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{t('dashboard.noActivityYet')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">{t('dashboard.quickStats')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('dashboard.activeTrailers')}</p>
                      <p className="text-xl font-bold text-foreground">{companyStats.activeTrailers}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t('dashboard.total')}</p>
                    <p className="text-lg font-semibold text-foreground">{companyStats.totalTrailers}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('dashboard.totalRevenue')}</p>
                      <p className="text-xl font-bold text-foreground">
                        {formatCurrency(companyStats.totalRevenue, i18n.language === 'pt-BR' ? 'BRL' : 'USD')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('dashboard.profitMargin')}</p>
                      <p className="text-xl font-bold text-foreground">
                        {((companyStats.totalMargin / companyStats.totalRevenue) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl flex items-center justify-between">
              <span>{t('dashboard.performanceOverview')}</span>
              <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +8.2%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-72 lg:h-80">
              <PerformanceChart
                data={performanceData.length > 0 ? performanceData : [
                  { month: 'Jan', value: 560 },
                  { month: 'Fev', value: 1120 },
                  { month: 'Mar', value: 1680 },
                  { month: 'Abr', value: 1680 },
                  { month: 'Mai', value: 2240 },
                  { month: 'Jun', value: 2800 }
                ]}
                color="#10b981"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">{t('dashboard.investmentSummary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-accent" />
                  <span className="text-xs font-medium text-muted-foreground">{t('dashboard.totalInvested')}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(investorStats?.totalValue || 28000, i18n.language === 'pt-BR' ? 'BRL' : 'USD')}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('dashboard.monthlyReturn')}</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(investorStats?.monthlyReturn || 560, i18n.language === 'pt-BR' ? 'BRL' : 'USD')}
                    </p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('dashboard.totalReturns')}</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(investorStats?.totalReturns || 2800, i18n.language === 'pt-BR' ? 'BRL' : 'USD')}
                    </p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('dashboard.roi')}</p>
                    <p className="text-lg font-bold text-foreground">10.0%</p>
                  </div>
                  <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                    5 {t('dashboard.months')}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{t('dashboard.nextPayment')}</span>
                  <span className="text-xs font-semibold text-foreground">{format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'dd/MM/yyyy')}</span>
                </div>
                <Progress value={65} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">19 {t('dashboard.daysRemaining')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <Card className="shadow-md border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.activeShares')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">{investorStats?.activeShares || 1}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {t('dashboard.allActive')}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Truck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.totalPayments')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">{investorStats?.recentPayments?.length || 5}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('dashboard.received')}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.avgMonthly')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(560, i18n.language === 'pt-BR' ? 'BRL' : 'USD')}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">2% {t('dashboard.fixed')}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">{t('dashboard.recentPayments')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {investorStats?.recentPayments && investorStats.recentPayments.length > 0 ? (
                investorStats.recentPayments.slice(0, 5).map((payment) => (
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
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{t('dashboard.noPaymentsYet')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">{t('dashboard.myShares')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {shares && shares.length > 0 ? (
                shares.slice(0, 5).map((share: any) => (
                  <div key={share.id} className="p-3 bg-muted/30 dark:bg-muted/10 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-accent" />
                        <p className="text-sm font-semibold text-foreground">
                          {share.trailerModel || 'Trailer'} #{share.trailerId?.slice(0, 8)}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        share.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        share.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
                      }`}>
                        {share.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{t('dashboard.purchased')}: {format(new Date(share.purchaseDate), 'dd/MM/yyyy')}</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(parseFloat(share.purchasePrice), i18n.language === 'pt-BR' ? 'BRL' : 'USD')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{t('dashboard.noSharesYet')}</p>
                  <p className="text-xs mt-1">{t('dashboard.startInvesting')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
