import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { ArrowUp, DollarSign, TrendingUp, PieChart } from "lucide-react";

export default function Financial() {
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
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total Mensal</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-total-revenue">
                  ${current?.totalRevenue?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <ArrowUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Repasses aos Investidores</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="text-investor-payouts">
                  ${current?.investorPayouts?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">2% a.m. por cota</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Margem da Empresa</p>
                <p className="text-2xl font-bold text-primary" data-testid="text-company-margin">
                  ${current?.companyMargin?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="bg-primary/10 p-2 rounded-full">
                <PieChart className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Capital Total Gerido</p>
                <p className="text-2xl font-bold" data-testid="text-total-capital">
                  ${current?.totalCapital?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="bg-gray-100 p-2 rounded-full">
                <TrendingUp className="h-5 w-5 text-gray-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {current?.activeShares || 0} cotas ativas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução da Receita (12 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <RevenueChart data={chartData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado financeiro disponível
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fluxo Financeiro Este Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-md">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Receita dos Trailers</span>
                </div>
                <span className="font-bold text-green-600">
                  +${current?.totalRevenue?.toFixed(2) || "0.00"}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">Repasse Investidores</span>
                </div>
                <span className="font-bold text-blue-600">
                  -${current?.investorPayouts?.toFixed(2) || "0.00"}
                </span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-md">
                  <span className="font-semibold">Lucro Líquido</span>
                  <span className="font-bold text-primary text-lg">
                    ${current?.companyMargin?.toFixed(2) || "0.00"}
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
