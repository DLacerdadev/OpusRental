import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, User, DollarSign, FileText } from "lucide-react";

export default function Approvals() {
  const pendingApprovals = [
    {
      id: 1,
      type: "investment",
      user: "João Silva",
      amount: "$50,000.00",
      date: "2024-01-15",
      status: "pending",
      description: "Solicitação de investimento em 1 cota",
    },
    {
      id: 2,
      type: "document",
      user: "Maria Santos",
      amount: "-",
      date: "2024-01-14",
      status: "pending",
      description: "Documentos KYC para análise",
    },
    {
      id: 3,
      type: "withdrawal",
      user: "Pedro Costa",
      amount: "$3,000.00",
      date: "2024-01-13",
      status: "pending",
      description: "Solicitação de resgate parcial",
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "investment":
        return <DollarSign className="h-5 w-5" />;
      case "document":
        return <FileText className="h-5 w-5" />;
      case "withdrawal":
        return <DollarSign className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "investment":
        return "text-green-600 bg-green-50";
      case "document":
        return "text-accent bg-accent/10";
      case "withdrawal":
        return "text-secondary bg-secondary/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Aprovações</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie solicitações pendentes</p>
        </div>
        <div className="flex gap-3">
          <Card className="border-2 border-accent/30">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-foreground">{pendingApprovals.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg font-bold">Solicitações Pendentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {pendingApprovals.map((approval) => (
              <div
                key={approval.id}
                className="p-6 hover:bg-accent/5 transition-colors"
                data-testid={`approval-${approval.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-2xl ${getTypeColor(approval.type)}`}>
                      {getTypeIcon(approval.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-foreground">{approval.user}</h3>
                        <Badge variant="secondary" className="rounded-full">
                          {approval.type === "investment" && "Investimento"}
                          {approval.type === "document" && "Documento"}
                          {approval.type === "withdrawal" && "Resgate"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{approval.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Data: {approval.date}</span>
                        {approval.amount !== "-" && <span>Valor: {approval.amount}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      data-testid={`button-approve-${approval.id}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-2 border-secondary text-secondary hover:bg-secondary/10"
                      data-testid={`button-reject-${approval.id}`}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-lg border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-50 p-3 rounded-2xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">APROVADAS (30 DIAS)</p>
            <p className="text-3xl font-bold text-foreground">15</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-secondary">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-secondary/10 p-3 rounded-2xl">
                <XCircle className="h-6 w-6 text-secondary" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">REJEITADAS (30 DIAS)</p>
            <p className="text-3xl font-bold text-foreground">3</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-accent">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-accent/10 p-3 rounded-2xl">
                <Clock className="h-6 w-6 text-accent" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">TEMPO MÉDIO</p>
            <p className="text-3xl font-bold text-foreground">2h</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
