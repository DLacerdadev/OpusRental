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
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Minha Carteira</h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe seus investimentos e retornos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg font-bold">Histórico de Retornos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-muted-foreground">MÊS/ANO</th>
                      <th className="text-left py-4 px-6 font-semibold text-muted-foreground">VALOR PAGO</th>
                      <th className="text-left py-4 px-6 font-semibold text-muted-foreground">DATA</th>
                      <th className="text-left py-4 px-6 font-semibold text-muted-foreground">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio?.payments?.map((payment: any) => (
                      <tr key={payment.id} className="border-b border-border hover:bg-muted/20 transition-colors" data-testid={`payment-${payment.id}`}>
                        <td className="py-4 px-6 font-medium">{payment.referenceMonth}</td>
                        <td className="py-4 px-6 font-bold text-green-600">
                          ${parseFloat(payment.amount).toFixed(2)}
                        </td>
                        <td className="py-4 px-6">{format(new Date(payment.paymentDate), "dd/MM/yyyy")}</td>
                        <td className="py-4 px-6">
                          <Badge variant={payment.status === "paid" ? "default" : "secondary"} className="rounded-full">
                            {payment.status === "paid" ? "Pago" : "Pendente"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {(!portfolio?.payments || portfolio.payments.length === 0) && (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-muted-foreground">
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
          <Card className="shadow-lg border-l-4 border-l-accent">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Projeção de Ganhos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div className="bg-muted/30 p-4 rounded-xl">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-muted-foreground">Próximos 3 meses</span>
                    <span className="font-bold text-accent">
                      ${calculateProjection(portfolio?.shares || [], 3).toFixed(2)}
                    </span>
                  </div>
                  <Progress value={25} className="h-2 bg-accent/20" />
                </div>
                <div className="bg-muted/30 p-4 rounded-xl">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-muted-foreground">Próximos 6 meses</span>
                    <span className="font-bold text-accent">
                      ${calculateProjection(portfolio?.shares || [], 6).toFixed(2)}
                    </span>
                  </div>
                  <Progress value={50} className="h-2 bg-accent/20" />
                </div>
                <div className="bg-muted/30 p-4 rounded-xl">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-muted-foreground">Próximos 12 meses</span>
                    <span className="font-bold text-accent">
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
