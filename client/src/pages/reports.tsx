import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, Users, TrendingUp, DollarSign, Shield, Settings, FileDown } from "lucide-react";
import { exportToPDF, exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

export default function Reports() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch real data from APIs
  const { data: shares } = useQuery({
    queryKey: ["/api/shares"],
  });

  const { data: payments } = useQuery({
    queryKey: ["/api/payments"],
  });

  const { data: trailers } = useQuery({
    queryKey: ["/api/trailers"],
  });

  const { data: financialRecords } = useQuery({
    queryKey: ["/api/financial/records"],
  });

  const { data: documents } = useQuery({
    queryKey: ["/api/documents"],
  });

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

  const handleExport = (reportTitle: string, exportFormat: "PDF" | "Excel" | "CSV") => {
    const fileName = reportTitle.toLowerCase().replace(/\s+/g, "-");
    
    let headers: string[] = [];
    let data: any[][] = [];
    
    switch (reportTitle) {
      case "Relatório do Investidor":
        headers = ["Mês", "Cotas Ativas", "Valor Investido", "Retorno Mensal", "Status"];
        
        if (payments && Array.isArray(payments) && payments.length > 0) {
          // Group payments by month
          const paymentsByMonth = new Map<string, any[]>();
          payments.forEach((p: any) => {
            if (!paymentsByMonth.has(p.referenceMonth)) {
              paymentsByMonth.set(p.referenceMonth, []);
            }
            paymentsByMonth.get(p.referenceMonth)!.push(p);
          });

          // Create data rows
          data = Array.from(paymentsByMonth.entries())
            .sort((a, b) => b[0].localeCompare(a[0])) // Sort by month desc
            .slice(0, 12) // Last 12 months
            .map(([month, monthPayments]) => {
              const totalAmount = monthPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
              const activeShares = Array.isArray(shares) ? shares.filter((s: any) => s.status === "active").length : 0;
              const totalInvested = Array.isArray(shares) ? shares.reduce((sum: number, s: any) => sum + parseFloat(s.purchaseValue), 0) : 0;
              
              return [
                format(new Date(month + "-01"), "MMMM/yyyy"),
                activeShares.toString(),
                formatCurrency(totalInvested),
                formatCurrency(totalAmount),
                "Pago"
              ];
            });
        } else {
          data = [["Sem dados disponíveis", "-", "-", "-", "-"]];
        }
        break;
        
      case "Performance de Ativos":
        headers = ["Trailer ID", "Modelo", "Status", "Valor Atual", "Data Compra"];
        
        if (trailers && Array.isArray(trailers) && trailers.length > 0) {
          data = trailers.map((trailer: any) => [
            trailer.trailerId,
            trailer.model || "N/A",
            trailer.status === "active" ? "Ativo" : trailer.status === "stock" ? "Estoque" : "Inativo",
            formatCurrency(parseFloat(trailer.currentValue)),
            format(new Date(trailer.purchaseDate), "dd/MM/yyyy")
          ]);
        } else {
          data = [["Sem ativos cadastrados", "-", "-", "-", "-"]];
        }
        break;
        
      case "Relatório Financeiro":
        headers = ["Mês", "Receita Total", "Repasses", "Margem", "Capital Gerido"];
        
        if (financialRecords && Array.isArray(financialRecords) && financialRecords.length > 0) {
          data = financialRecords
            .slice(0, 12)
            .map((record: any) => [
              format(new Date(record.month + "-01"), "MMMM/yyyy"),
              formatCurrency(parseFloat(record.totalRevenue)),
              formatCurrency(parseFloat(record.investorPayouts)),
              formatCurrency(parseFloat(record.companyMargin)),
              formatCurrency(parseFloat(record.totalCapital))
            ]);
        } else {
          data = [["Sem dados financeiros", "-", "-", "-", "-"]];
        }
        break;
        
      case "Compliance":
        headers = ["Documento", "Tipo", "Data Upload", "Compartilhado", "Status"];
        
        if (documents && Array.isArray(documents) && documents.length > 0) {
          data = documents.map((doc: any) => [
            doc.fileName,
            doc.documentType,
            format(new Date(doc.uploadedAt), "dd/MM/yyyy"),
            doc.sharedWithManager ? "Sim" : "Não",
            "Válido"
          ]);
        } else {
          data = [["Sem documentos cadastrados", "-", "-", "-", "-"]];
        }
        break;
        
      case "Operacional":
        headers = ["Trailer ID", "Modelo", "Localização", "Coordenadas", "Depreciação"];
        
        if (trailers && Array.isArray(trailers) && trailers.length > 0) {
          data = trailers.map((trailer: any) => [
            trailer.trailerId,
            trailer.model || "N/A",
            trailer.location || "Não informado",
            trailer.latitude && trailer.longitude 
              ? `${parseFloat(trailer.latitude).toFixed(4)}, ${parseFloat(trailer.longitude).toFixed(4)}`
              : "N/A",
            `${(parseFloat(trailer.depreciationRate) * 100).toFixed(1)}%`
          ]);
        } else {
          data = [["Sem dados operacionais", "-", "-", "-", "-"]];
        }
        break;
        
      case "Personalizado":
        headers = ["Tipo", "Descrição", "Valor", "Data"];
        data = [
          ["Relatório Personalizado", "Configure os campos desejados", "N/A", format(new Date(), "dd/MM/yyyy")],
        ];
        break;
        
      default:
        headers = ["Tipo", "Período", "Status", "Detalhes"];
        data = [
          [reportTitle, format(new Date(), "MMMM/yyyy"), "Completo", "Dados atualizados"],
        ];
    }

    if (exportFormat === "PDF") {
      exportToPDF(`${reportTitle} - Opus Rental Capital`, headers, data);
      toast({
        title: "PDF Exportado",
        description: `${reportTitle} exportado em PDF com sucesso`,
      });
    } else if (exportFormat === "Excel") {
      exportToExcel(fileName, headers, data);
      toast({
        title: "Excel Exportado",
        description: `${reportTitle} exportado em Excel (.xlsx) com sucesso`,
      });
    } else if (exportFormat === "CSV") {
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
                    <h4 className="font-bold text-foreground text-sm sm:text-base">{report.title}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{report.description}</p>
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
