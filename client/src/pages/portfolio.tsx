import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Portfolio() {
  const { data: portfolio, isLoading } = useQuery({
    queryKey: ["/api/portfolio"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-96" />
      </div>
    );
  }

  const calculateProjection = (shares: any[], months: number) => {
    return shares.reduce((sum, share) => {
      const monthlyReturn = parseFloat(share.purchaseValue) * parseFloat(share.monthlyReturn) / 100;
      return sum + (monthlyReturn * months);
    }, 0);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Retornos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3">Mês/Ano</th>
                      <th className="text-left py-3">Valor Pago</th>
                      <th className="text-left py-3">Data Pagamento</th>
                      <th className="text-left py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio?.payments?.map((payment: any) => (
                      <tr key={payment.id} className="border-b border-border" data-testid={`payment-${payment.id}`}>
                        <td className="py-3">{payment.referenceMonth}</td>
                        <td className="py-3 font-medium text-green-600">
                          ${parseFloat(payment.amount).toFixed(2)}
                        </td>
                        <td className="py-3">{format(new Date(payment.paymentDate), "dd/MM/yyyy")}</td>
                        <td className="py-3">
                          <Badge variant={payment.status === "paid" ? "default" : "secondary"}>
                            {payment.status === "paid" ? "Pago" : "Pendente"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {(!portfolio?.payments || portfolio.payments.length === 0) && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-muted-foreground">
                          Nenhum pagamento registrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Projeção de Ganhos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Próximos 3 meses</span>
                    <span className="font-medium">
                      ${calculateProjection(portfolio?.shares || [], 3).toFixed(2)}
                    </span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Próximos 6 meses</span>
                    <span className="font-medium">
                      ${calculateProjection(portfolio?.shares || [], 6).toFixed(2)}
                    </span>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Próximos 12 meses</span>
                    <span className="font-medium">
                      ${calculateProjection(portfolio?.shares || [], 12).toFixed(2)}
                    </span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Minhas Cotas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {portfolio?.shares?.map((share: any) => (
                  <div key={share.id} className="p-3 bg-muted/50 rounded-md" data-testid={`share-card-${share.id}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Cota #{share.id.slice(0, 8)}</span>
                      <Badge variant={share.status === "active" ? "default" : "secondary"}>
                        {share.status === "active" ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Valor: ${parseFloat(share.purchaseValue).toFixed(2)}</p>
                      <p>Adquirida: {format(new Date(share.purchaseDate), "dd/MM/yyyy")}</p>
                      <p className="text-green-600 font-medium">
                        Retorno mensal: ${(parseFloat(share.purchaseValue) * parseFloat(share.monthlyReturn) / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                {(!portfolio?.shares || portfolio.shares.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                    Nenhuma cota ativa
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
