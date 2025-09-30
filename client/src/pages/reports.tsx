import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, Users, TrendingUp, DollarSign, Shield, Settings } from "lucide-react";
import { exportToPDF, exportToCSV } from "@/lib/exportUtils";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { toast } = useToast();

  const reportTypes = [
    {
      icon: Users,
      title: "Relatório do Investidor",
      description: "Extrato mensal completo",
      color: "blue",
      testId: "investor-report",
    },
    {
      icon: TrendingUp,
      title: "Performance de Ativos",
      description: "Análise detalhada da frota",
      color: "green",
      testId: "performance-report",
    },
    {
      icon: DollarSign,
      title: "Relatório Financeiro",
      description: "Consolidado de receitas e pagamentos",
      color: "yellow",
      testId: "financial-report",
    },
    {
      icon: Shield,
      title: "Compliance",
      description: "Documentação e auditoria",
      color: "purple",
      testId: "compliance-report",
    },
    {
      icon: Settings,
      title: "Operacional",
      description: "Utilização e manutenção",
      color: "red",
      testId: "operational-report",
    },
    {
      icon: FileText,
      title: "Personalizado",
      description: "Configure seus próprios relatórios",
      color: "gray",
      testId: "custom-report",
    },
  ];

  const handleExportPDF = () => {
    const headers = ["Tipo", "Período", "Status"];
    const data = [
      ["Relatório do Investidor", "Janeiro/2024", "Completo"],
      ["Relatório Financeiro", "Dezembro/2023", "Completo"],
    ];
    exportToPDF("Relatórios Opus Rental Capital", headers, data);
    toast({
      title: "Exportado com sucesso",
      description: "O relatório foi exportado em PDF",
    });
  };

  const handleExportCSV = () => {
    const headers = ["Tipo", "Período", "Status"];
    const data = [
      ["Relatório do Investidor", "Janeiro/2024", "Completo"],
      ["Relatório Financeiro", "Dezembro/2023", "Completo"],
    ];
    exportToCSV("relatorios-opus", headers, data);
    toast({
      title: "Exportado com sucesso",
      description: "O relatório foi exportado em CSV",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Relatórios e Dashboards</h3>
        <Button data-testid="button-new-report">Novo Relatório</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          const bgColor = `bg-${report.color}-100`;
          const textColor = `text-${report.color}-600`;

          return (
            <Card
              key={report.testId}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              data-testid={`card-${report.testId}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`${bgColor} p-3 rounded-full`}>
                    <Icon className={`${textColor} text-xl h-6 w-6`} />
                  </div>
                  <div>
                    <h4 className="font-semibold">{report.title}</h4>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Opções de Exportação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="flex items-center justify-center space-x-2 p-4"
              onClick={handleExportPDF}
              data-testid="button-export-pdf"
            >
              <FileText className="text-red-600" />
              <span>Exportar PDF</span>
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center space-x-2 p-4"
              data-testid="button-export-excel"
            >
              <FileText className="text-green-600" />
              <span>Exportar Excel</span>
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center space-x-2 p-4"
              onClick={handleExportCSV}
              data-testid="button-export-csv"
            >
              <FileText className="text-blue-600" />
              <span>Exportar CSV</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
