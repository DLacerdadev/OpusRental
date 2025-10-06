import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { ArrowUp, DollarSign, TrendingUp, PieChart } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";

export default function Financial() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: current, isLoading } = useQuery({
    queryKey: ["/api/financial/current"],
  });

  const { data: records } = useQuery({
    queryKey: ["/api/financial/records"],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-96" />
      </div>
    );
  }

  const chartData = records?.slice(0, 12).reverse().map((record: any) => ({
    month: record.month,
    revenue: parseFloat(record.totalRevenue),
    payouts: parseFloat(record.investorPayouts),
    margin: parseFloat(record.companyMargin),
  })) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('financial.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('financial.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-50 p-3 rounded-2xl">
                <ArrowUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">{t('financial.monthlyRevenue')}</p>
            <p className="text-2xl font-bold text-green-600 break-words" data-testid="text-total-revenue">
              {formatCurrency(current?.totalRevenue || 0, user?.country)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-accent/10 p-3 rounded-2xl">
                <DollarSign className="h-6 w-6 text-accent" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">{t('financial.payouts')}</p>
            <p className="text-2xl font-bold text-accent break-words" data-testid="text-investor-payouts">
              {formatCurrency(current?.investorPayouts || 0, user?.country)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{t('financial.monthlyRate')}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <PieChart className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">{t('financial.companyMargin')}</p>
            <p className="text-2xl font-bold text-primary break-words" data-testid="text-company-margin">
              {formatCurrency(current?.companyMargin || 0, user?.country)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-secondary/10 p-3 rounded-2xl">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">{t('financial.managedCapital')}</p>
            <p className="text-2xl font-bold text-foreground break-words" data-testid="text-total-capital">
              {formatCurrency(current?.totalCapital || 0, user?.country)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {current?.activeShares || 0} {t('financial.activeShares')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg font-bold">{t('financial.revenueEvolution')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {chartData.length > 0 ? (
              <RevenueChart data={chartData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {t('financial.noFinancialData')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-accent">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg font-bold">{t('financial.cashFlowThisMonth')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg"></div>
                  <span className="font-semibold text-green-900">{t('financial.trailerRevenue')}</span>
                </div>
                <span className="font-bold text-green-600 text-lg break-words">
                  +{formatCurrency(current?.totalRevenue || 0, user?.country)}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-accent/10 rounded-xl border border-accent/30">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-accent rounded-full shadow-lg"></div>
                  <span className="font-semibold text-accent">{t('financial.investorPayouts')}</span>
                </div>
                <span className="font-bold text-accent text-lg break-words">
                  -{formatCurrency(current?.investorPayouts || 0, user?.country)}
                </span>
              </div>

              <div className="border-t-2 pt-4">
                <div className="flex justify-between items-center p-4 bg-primary/10 rounded-xl border-2 border-primary/30">
                  <span className="font-bold text-primary">{t('financial.netProfit')}</span>
                  <span className="font-bold text-primary text-2xl break-words">
                    {formatCurrency(current?.companyMargin || 0, user?.country)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
