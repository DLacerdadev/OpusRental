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
    const fileName = reportTitle.toLowerCase().replace(/\s+/g, "-");
    
    // Define dados específicos para cada tipo de relatório
    let headers: string[] = [];
    let data: any[][] = [];
    
    switch (reportTitle) {
      case "Relatório do Investidor":
        headers = ["Mês", "Cotas Ativas", "Valor Investido", "Retorno Mensal", "Status"];
        data = [
          ["Outubro/2025", "3", "R$ 150.000,00", "R$ 3.000,00", "Pago"],
          ["Setembro/2025", "3", "R$ 150.000,00", "R$ 3.000,00", "Pago"],
          ["Agosto/2025", "2", "R$ 100.000,00", "R$ 2.000,00", "Pago"],
        ];
        break;
        
      case "Performance de Ativos":
        headers = ["Trailer ID", "Modelo", "Utilização", "Receita Mensal", "ROI"];
        data = [
          ["TRL-001", "Dry Van 53ft", "95%", "R$ 8.500,00", "12.5%"],
          ["TRL-002", "Refrigerado 48ft", "88%", "R$ 9.200,00", "14.2%"],
          ["TRL-003", "Flatbed 53ft", "92%", "R$ 7.800,00", "11.8%"],
        ];
        break;
        
      case "Relatório Financeiro":
        headers = ["Mês", "Receita Total", "Custos", "Margem", "Pagamentos"];
        data = [
          ["Outubro/2025", "R$ 125.000,00", "R$ 45.000,00", "64%", "R$ 15.000,00"],
          ["Setembro/2025", "R$ 118.000,00", "R$ 42.000,00", "64.4%", "R$ 14.500,00"],
          ["Agosto/2025", "R$ 112.000,00", "R$ 40.000,00", "64.3%", "R$ 13.800,00"],
        ];
        break;
        
      case "Compliance":
        headers = ["Documento", "Tipo", "Data Emissão", "Validade", "Status"];
        data = [
          ["DOT Inspection", "Inspeção", "15/10/2025", "15/10/2026", "Válido"],
          ["Insurance Policy", "Seguro", "01/10/2025", "01/10/2026", "Válido"],
          ["Registration", "Registro", "10/09/2025", "10/09/2026", "Válido"],
        ];
        break;
        
      case "Operacional":
        headers = ["Trailer", "Manutenções", "Km Rodados", "Última Revisão", "Próxima"];
        data = [
          ["TRL-001", "2", "45.000 km", "15/10/2025", "15/01/2026"],
          ["TRL-002", "1", "38.000 km", "20/10/2025", "20/01/2026"],
          ["TRL-003", "3", "52.000 km", "10/10/2025", "10/01/2026"],
        ];
        break;
        
      case "Personalizado":
        headers = ["Campo 1", "Campo 2", "Campo 3", "Campo 4"];
        data = [
          ["Configurar", "campos", "personalizados", "aqui"],
        ];
        break;
        
      default:
        headers = ["Tipo", "Período", "Status", "Detalhes"];
        data = [
          [reportTitle, "Outubro/2025", "Completo", "Dados atualizados"],
        ];
    }

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
