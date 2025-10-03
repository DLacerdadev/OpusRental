import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, Users, TrendingUp, DollarSign, Shield, Settings, FileDown } from "lucide-react";
import { exportToPDF, exportToCSV, exportToExcel } from "@/lib/exportUtils";
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

  const handleExport = (reportTitle: string, format: "PDF" | "Excel" | "CSV") => {
    const headers = ["Tipo", "Período", "Status", "Detalhes"];
    const data = [
      [reportTitle, "Outubro/2025", "Completo", "Dados atualizados"],
      [reportTitle, "Setembro/2025", "Completo", "Dados históricos"],
      [reportTitle, "Agosto/2025", "Completo", "Dados históricos"],
    ];

    const fileName = reportTitle.toLowerCase().replace(/\s+/g, "-");

    if (format === "PDF") {
      exportToPDF(`${reportTitle} - Opus Rental Capital`, headers, data);
      toast({
        title: "PDF Exportado",
        description: `${reportTitle} exportado em PDF com sucesso`,
      });
    } else if (format === "Excel") {
      exportToExcel(fileName, headers, data);
      toast({
        title: "Excel Exportado",
        description: `${reportTitle} exportado em Excel (.xls) com sucesso`,
      });
    } else if (format === "CSV") {
      exportToCSV(fileName, headers, data);
      toast({
        title: "CSV Exportado",
        description: `${reportTitle} exportado em CSV com sucesso`,
      });
    }
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
              className="shadow-lg hover:shadow-xl transition-all border-l-4 border-l-accent"
              data-testid={`card-${report.testId}`}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4 mb-4">
                  <div className={`${bgColor} p-3 sm:p-4 rounded-2xl flex-shrink-0`}>
                    <Icon className={`${textColor} h-6 w-6 sm:h-7 sm:w-7`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-foreground text-sm sm:text-base break-words">{report.title}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">{report.description}</p>
                  </div>
                </div>
                
                {/* Export Icons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(report.title, "PDF");
                    }}
                    data-testid={`button-export-pdf-${report.testId}`}
                    title="Exportar PDF"
                  >
                    <FileText className="h-4 w-4 text-secondary" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(report.title, "Excel");
                    }}
                    data-testid={`button-export-excel-${report.testId}`}
                    title="Exportar Excel"
                  >
                    <FileDown className="h-4 w-4 text-green-600" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(report.title, "CSV");
                    }}
                    data-testid={`button-export-csv-${report.testId}`}
                    title="Exportar CSV"
                  >
                    <Download className="h-4 w-4 text-accent" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
