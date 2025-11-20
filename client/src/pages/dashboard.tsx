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
        return "bg-[#2196F3]";
      case "maintenance":
        return "bg-[#0D2847]/60";
      case "expired":
        return "bg-[#0D2847]/30";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-white via-[#2196F3]/5 to-white min-h-screen">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
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
      <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-white via-[#2196F3]/5 to-white min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0D2847]">
              {t('dashboard.welcome')}, {user?.firstName}
            </h1>
            <p className="text-[#0D2847]/60 mt-1 font-medium">
              {t('dashboard.overview')}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Badge className="bg-[#2196F3]/10 text-[#2196F3] border-[#2196F3]/30 px-4 py-2 text-sm font-semibold">
              <Activity className="w-4 h-4 mr-2" />
              Live
            </Badge>
          </div>
        </div>

        {/* Metrics Cards - Estilo Premium Banking */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <Card className="relative overflow-hidden border-2 border-[#2196F3]/10 shadow-xl shadow-[#2196F3]/5 hover:shadow-2xl hover:shadow-[#2196F3]/10 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2196F3] to-[#0D2847]" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2196F3]/20 to-[#2196F3]/10 flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-[#2196F3]" />
                </div>
                <div className="w-2 h-2 rounded-full bg-[#2196F3] animate-pulse" />
              </div>
              <p className="text-sm text-[#0D2847]/60 font-semibold mb-2">{t('dashboard.totalFleetValue')}</p>
              <p className="text-3xl font-bold text-[#0D2847]" data-testid="text-total-fleet-value">
                {formatCurrency(companyStats.totalFleetValue, i18n.language === 'pt-BR' ? 'BRL' : 'USD')}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-[#2196F3]" />
                <span className="text-xs text-[#2196F3] font-semibold">+12.5%</span>
                <span className="text-xs text-[#0D2847]/40">{t('dashboard.thisMonth')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="relative overflow-hidden border-2 border-[#2196F3]/10 shadow-xl shadow-[#2196F3]/5 hover:shadow-2xl hover:shadow-[#2196F3]/10 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0D2847] to-[#2196F3]" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0D2847]/20 to-[#0D2847]/10 flex items-center justify-center">
                  <Truck className="h-7 w-7 text-[#0D2847]" />
                </div>
                <div className="w-2 h-2 rounded-full bg-[#2196F3] animate-pulse" />
              </div>
              <p className="text-sm text-[#0D2847]/60 font-semibold mb-2">{t('dashboard.totalTrailers')}</p>
              <p className="text-3xl font-bold text-[#0D2847]" data-testid="text-total-trailers">
                {companyStats.totalTrailers}
              </p>
              <div className="mt-3">
                <span className="text-sm text-[#2196F3] font-semibold">{companyStats.activeTrailers}</span>
                <span className="text-xs text-[#0D2847]/40 ml-1">{t('dashboard.active')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="relative overflow-hidden border-2 border-[#2196F3]/10 shadow-xl shadow-[#2196F3]/5 hover:shadow-2xl hover:shadow-[#2196F3]/10 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2196F3] to-[#0D2847]" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2196F3]/20 to-[#2196F3]/10 flex items-center justify-center">
                  <Users className="h-7 w-7 text-[#2196F3]" />
                </div>
                <div className="w-2 h-2 rounded-full bg-[#2196F3] animate-pulse" />
              </div>
              <p className="text-sm text-[#0D2847]/60 font-semibold mb-2">{t('dashboard.sharesSold')}</p>
              <p className="text-3xl font-bold text-[#0D2847]" data-testid="text-shares-sold">
                {companyStats.totalSharesSold}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#2196F3]" />
                <span className="text-xs text-[#0D2847]/40">{t('dashboard.investors')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 4 */}
          <Card className="relative overflow-hidden border-2 border-[#2196F3]/10 shadow-xl shadow-[#2196F3]/5 hover:shadow-2xl hover:shadow-[#2196F3]/10 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0D2847] to-[#2196F3]" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0D2847]/20 to-[#0D2847]/10 flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-[#0D2847]" />
                </div>
                <div className="w-2 h-2 rounded-full bg-[#2196F3] animate-pulse" />
              </div>
              <p className="text-sm text-[#0D2847]/60 font-semibold mb-2">{t('dashboard.totalMargin')}</p>
              <p className="text-3xl font-bold text-[#0D2847]" data-testid="text-total-margin">
                {formatCurrency(companyStats.totalMargin, i18n.language === 'pt-BR' ? 'BRL' : 'USD')}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-[#2196F3]" />
                <span className="text-xs text-[#2196F3] font-semibold">+8.2%</span>
                <span className="text-xs text-[#0D2847]/40">{t('dashboard.thisMonth')}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico e Metas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-2 border-[#2196F3]/10 shadow-xl shadow-[#2196F3]/5">
            <CardHeader className="border-b-2 border-[#2196F3]/10 bg-gradient-to-r from-[#2196F3]/5 to-transparent">
              <CardTitle className="text-xl font-bold text-[#0D2847] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2196F3]/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-[#2196F3]" />
                </div>
                {t('dashboard.revenueOverview')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-80">
                {revenueChartData.length > 0 ? (
                  <PerformanceChart
                    data={revenueChartData}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#2196F3]/10 flex items-center justify-center">
                        <TrendingUp className="h-8 w-8 text-[#2196F3]/40" />
                      </div>
                      <p className="text-sm text-[#0D2847]/60 font-medium">{t('dashboard.noDataAvailable')}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#2196F3]/10 shadow-xl shadow-[#2196F3]/5">
            <CardHeader className="border-b-2 border-[#2196F3]/10 bg-gradient-to-br from-[#0D2847]/5 to-transparent">
              <CardTitle className="text-xl font-bold text-[#0D2847]">{t('dashboard.monthlyGoals')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-[#0D2847]">{t('dashboard.fleetUtilization')}</span>
                    <span className="text-lg font-bold text-[#2196F3]">
                      {companyStats.totalTrailers > 0 ? Math.round((companyStats.activeTrailers / companyStats.totalTrailers) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={companyStats.totalTrailers > 0 ? (companyStats.activeTrailers / companyStats.totalTrailers) * 100 : 0} 
                    className="h-3 bg-[#2196F3]/10" 
                  />
                  <p className="text-xs text-[#0D2847]/50 mt-2 font-medium">
                    {companyStats.activeTrailers} / {companyStats.totalTrailers} {t('dashboard.active')}
                  </p>
                </div>

                <div className="pt-4 border-t-2 border-[#2196F3]/10">
                  <div className="flex items-center gap-2 text-sm text-[#0D2847]/60 font-semibold mb-4">
                    <Target className="h-4 w-4 text-[#2196F3]" />
                    <span>{t('dashboard.keyMetrics')}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-[#2196F3]/5 to-transparent">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#0D2847]/60 font-semibold">{t('dashboard.totalRevenue')}</span>
                        <span className="text-sm font-bold text-[#0D2847]">{formatCurrency(companyStats.totalRevenue, i18n.language === 'pt-BR' ? 'BRL' : 'USD')}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-r from-[#0D2847]/5 to-transparent">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#0D2847]/60 font-semibold">{t('dashboard.totalMargin')}</span>
                        <span className="text-sm font-bold text-[#2196F3]">{formatCurrency(companyStats.totalMargin, i18n.language === 'pt-BR' ? 'BRL' : 'USD')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 border-[#2196F3]/10 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#0D2847]/60 font-semibold mb-1">{t('dashboard.pendingApprovals')}</p>
                  <p className="text-4xl font-bold text-[#0D2847]">0</p>
                  <p className="text-xs text-[#0D2847]/40 mt-1 font-medium">{t('dashboard.requiresAction')}</p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2196F3]/20 to-[#2196F3]/10 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-[#2196F3]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#2196F3]/10 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#0D2847]/60 font-semibold mb-1">{t('dashboard.maintenance')}</p>
                  <p className="text-4xl font-bold text-[#0D2847]">0</p>
                  <p className="text-xs text-[#0D2847]/40 mt-1 font-medium">{t('dashboard.scheduled')}</p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0D2847]/20 to-[#0D2847]/10 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-[#0D2847]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#2196F3]/10 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#0D2847]/60 font-semibold mb-1">{t('dashboard.completedToday')}</p>
                  <p className="text-4xl font-bold text-[#0D2847]">0</p>
                  <p className="text-xs text-[#0D2847]/40 mt-1 font-medium">{t('dashboard.transactions')}</p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2196F3]/20 to-[#2196F3]/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-[#2196F3]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Atividade Recente */}
        <Card className="border-2 border-[#2196F3]/10 shadow-xl shadow-[#2196F3]/5">
          <CardHeader className="border-b-2 border-[#2196F3]/10 bg-gradient-to-r from-[#2196F3]/5 to-transparent">
            <CardTitle className="text-xl font-bold text-[#0D2847] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2196F3]/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#2196F3]" />
              </div>
              {t('dashboard.recentActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {companyStats.recentActivity && companyStats.recentActivity.length > 0 ? (
                companyStats.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[#2196F3]/5 to-transparent border-2 border-[#2196F3]/10 hover:border-[#2196F3]/20 transition-all" data-testid={`activity-${activity.id}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#2196F3]/10 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="h-6 w-6 text-[#2196F3]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0D2847]">
                          {t('dashboard.paymentProcessed')}
                        </p>
                        <p className="text-xs text-[#0D2847]/50 mt-0.5 font-medium">
                          {format(new Date(activity.paymentDate), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#2196F3]">
                        {formatCurrency(parseFloat(activity.amount), i18n.language === 'pt-BR' ? 'BRL' : 'USD')}
                      </p>
                      <p className="text-xs text-[#0D2847]/40 font-medium">{formatMonth(activity.referenceMonth)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#2196F3]/10 flex items-center justify-center">
                    <Activity className="h-10 w-10 text-[#2196F3]/40" />
                  </div>
                  <p className="text-sm text-[#0D2847]/60 font-medium">{t('dashboard.noActivity')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Continue com Dashboard de Investidor na próxima parte...
  // Investor Dashboard
  if (!isManager && stats && 'activeShares' in stats) {
    const investorStats = stats as InvestorStats;
    
    return (
      <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-white via-[#2196F3]/5 to-white min-h-screen">
        {/* Header Investor */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0D2847]">
              {t('dashboard.welcome')}, {user?.firstName}
            </h1>
            <p className="text-[#0D2847]/60 mt-1 font-medium">
              {t('dashboard.yourPortfolio')}
            </p>
          </div>
        </div>

        {/* Investor Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-2 border-[#2196F3]/10 shadow-xl shadow-[#2196F3]/5 hover:shadow-2xl hover:shadow-[#2196F3]/10 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2196F3] to-[#0D2847]" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2196F3]/20 to-[#2196F3]/10 flex items-center justify-center">
                  <Wallet className="h-7 w-7 text-[#2196F3]" />
                </div>
              </div>
              <p className="text-sm text-[#0D2847]/60 font-semibold mb-2">{t('dashboard.totalValue')}</p>
              <p className="text-3xl font-bold text-[#0D2847]" data-testid="text-total-value">
                {formatCurrency(investorStats.totalValue, i18n.language === 'pt-BR' ? 'BRL' : 'USD')}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-[#2196F3]" />
                <span className="text-xs text-[#2196F3] font-semibold">+2.0%</span>
                <span className="text-xs text-[#0D2847]/40">{t('dashboard.thisMonth')}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 border-[#2196F3]/10 shadow-xl shadow-[#2196F3]/5 hover:shadow-2xl hover:shadow-[#2196F3]/10 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0D2847] to-[#2196F3]" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0D2847]/20 to-[#0D2847]/10 flex items-center justify-center">
                  <Package className="h-7 w-7 text-[#0D2847]" />
                </div>
              </div>
              <p className="text-sm text-[#0D2847]/60 font-semibold mb-2">{t('dashboard.activeShares')}</p>
              <p className="text-3xl font-bold text-[#0D2847]" data-testid="text-active-shares">
                {investorStats.activeShares}
              </p>
              <p className="text-xs text-[#0D2847]/40 mt-2 font-medium">{t('dashboard.shares')}</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 border-[#2196F3]/10 shadow-xl shadow-[#2196F3]/5 hover:shadow-2xl hover:shadow-[#2196F3]/10 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2196F3] to-[#0D2847]" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2196F3]/20 to-[#2196F3]/10 flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-[#2196F3]" />
                </div>
              </div>
              <p className="text-sm text-[#0D2847]/60 font-semibold mb-2">{t('dashboard.monthlyReturn')}</p>
              <p className="text-3xl font-bold text-[#2196F3]" data-testid="text-monthly-return">
                {formatCurrency(investorStats.monthlyReturn, i18n.language === 'pt-BR' ? 'BRL' : 'USD')}
              </p>
              <p className="text-xs text-[#0D2847]/40 mt-2 font-medium">2.0% {t('dashboard.monthly')}</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-2 border-[#2196F3]/10 shadow-xl shadow-[#2196F3]/5 hover:shadow-2xl hover:shadow-[#2196F3]/10 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0D2847] to-[#2196F3]" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0D2847]/20 to-[#0D2847]/10 flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-[#0D2847]" />
                </div>
              </div>
              <p className="text-sm text-[#0D2847]/60 font-semibold mb-2">{t('dashboard.totalReturns')}</p>
              <p className="text-3xl font-bold text-[#0D2847]" data-testid="text-total-returns">
                {formatCurrency(investorStats.totalReturns, i18n.language === 'pt-BR' ? 'BRL' : 'USD')}
              </p>
              <p className="text-xs text-[#0D2847]/40 mt-2 font-medium">{t('dashboard.allTime')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Payments Section */}
        <Card className="border-2 border-[#2196F3]/10 shadow-xl shadow-[#2196F3]/5">
          <CardHeader className="border-b-2 border-[#2196F3]/10 bg-gradient-to-r from-[#2196F3]/5 to-transparent">
            <CardTitle className="text-xl font-bold text-[#0D2847] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2196F3]/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#2196F3]" />
              </div>
              {t('dashboard.recentPayments')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {investorStats.recentPayments && investorStats.recentPayments.length > 0 ? (
                investorStats.recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[#2196F3]/5 to-transparent border-2 border-[#2196F3]/10 hover:border-[#2196F3]/20 transition-all" data-testid={`payment-${payment.id}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#2196F3]/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-6 w-6 text-[#2196F3]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0D2847]">
                          {t('dashboard.paymentReceived')}
                        </p>
                        <p className="text-xs text-[#0D2847]/50 mt-0.5 font-medium">
                          {format(new Date(payment.paymentDate), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#2196F3]">
                        {formatCurrency(parseFloat(payment.amount), i18n.language === 'pt-BR' ? 'BRL' : 'USD')}
                      </p>
                      <p className="text-xs text-[#0D2847]/40 font-medium">{formatMonth(payment.referenceMonth)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#2196F3]/10 flex items-center justify-center">
                    <Calendar className="h-10 w-10 text-[#2196F3]/40" />
                  </div>
                  <p className="text-sm text-[#0D2847]/60 font-medium">{t('dashboard.noPayments')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
