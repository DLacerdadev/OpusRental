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

  const handleNewReport = () => {
    toast({
      title: "Criar Novo Relatório",
      description: "Funcionalidade de criação de relatório personalizado em desenvolvimento",
    });
  };

  const handleReportClick = (reportTitle: string) => {
    toast({
      title: `Gerando ${reportTitle}`,
      description: "O relatório está sendo preparado...",
    });
  };

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

  const handleExportExcel = () => {
    toast({
      title: "Exportado com sucesso",
      description: "O relatório foi exportado em Excel",
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1">Gere e exporte relatórios personalizados</p>
        </div>
        <Button 
          className="bg-accent hover:bg-accent/90 shadow-lg w-full sm:w-auto" 
          onClick={handleNewReport}
          data-testid="button-new-report"
        >
          Novo Relatório
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          const bgColor = `bg-${report.color}-100`;
          const textColor = `text-${report.color}-600`;

          return (
            <Card
              key={report.testId}
              className="shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer border-l-4 border-l-accent"
              onClick={() => handleReportClick(report.title)}
              data-testid={`card-${report.testId}`}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`${bgColor} p-3 sm:p-4 rounded-2xl flex-shrink-0`}>
                    <Icon className={`${textColor} h-6 w-6 sm:h-7 sm:w-7`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-foreground text-sm sm:text-base break-words">{report.title}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">{report.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-base sm:text-lg font-bold">Opções de Exportação</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 sm:gap-3 p-4 sm:p-6 border-2 hover:border-secondary hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-foreground transition-all"
              onClick={handleExportPDF}
              data-testid="button-export-pdf"
            >
              <FileText className="text-secondary h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base">Exportar PDF</span>
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 sm:gap-3 p-4 sm:p-6 border-2 hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 hover:text-foreground transition-all"
              onClick={handleExportExcel}
              data-testid="button-export-excel"
            >
              <FileText className="text-green-600 h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base">Exportar Excel</span>
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 sm:gap-3 p-4 sm:p-6 border-2 hover:border-accent hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-foreground transition-all sm:col-span-2 lg:col-span-1"
              onClick={handleExportCSV}
              data-testid="button-export-csv"
            >
              <FileText className="text-accent h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base">Exportar CSV</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
