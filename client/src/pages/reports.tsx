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

  const { data: allShares } = useQuery({
    queryKey: ["/api/shares/all"],
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
      title: "Relatório de Investidores",
      description: "Extrato mensal por investidor",
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
    
    // Função auxiliar para calcular idade em meses
    const calculateAgeMonths = (purchaseDate: string) => {
      const today = new Date();
      const purchase = new Date(purchaseDate);
      return (today.getFullYear() - purchase.getFullYear()) * 12 + 
             (today.getMonth() - purchase.getMonth());
    };
    
    // Função auxiliar para calcular farol (status de idade)
    const calculateHealthFlag = (ageMonths: number) => {
      if (ageMonths < 12) return "Verde";
      if (ageMonths <= 24) return "Amarelo";
      return "Vermelho";
    };
    
    switch (reportTitle) {
      case "Relatório de Investidores":
        headers = [
          "Investidor",
          "Email",
          "Cotas Ativas",
          "Total Investido",
          "Retorno Acumulado",
          "Rentabilidade %",
          "Próx. Pagamento (3m)",
          "Próx. Pagamento (6m)",
          "Próx. Pagamento (12m)",
          "Status Pagamentos"
        ];
        
        if (allShares && Array.isArray(allShares) && allShares.length > 0) {
          // Group shares by investor
          const investorMap = new Map<string, any[]>();
          allShares.forEach((share: any) => {
            if (!investorMap.has(share.userId)) {
              investorMap.set(share.userId, []);
            }
            investorMap.get(share.userId)!.push(share);
          });

          // Create data rows for each investor
          data = Array.from(investorMap.entries()).map(([userId, investorShares]) => {
            const firstShare = investorShares[0];
            const investorName = `${firstShare.userFirstName || ""} ${firstShare.userLastName || ""}`.trim() || "N/A";
            const investorEmail = firstShare.userEmail || "N/A";
            
            // Calculate totals for this investor
            const activeShares = investorShares.filter((s: any) => s.status === "active");
            const totalInvested = investorShares.reduce((sum: number, s: any) => sum + parseFloat(s.purchaseValue || 0), 0);
            
            // Calculate accumulated returns for this investor
            let totalReturns = 0;
            if (Array.isArray(payments)) {
              const shareIds = investorShares.map((s: any) => s.id);
              const investorPayments = payments.filter((p: any) => shareIds.includes(p.shareId));
              totalReturns = investorPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
            }
            
            // Calculate rentability
            const rentabilidade = totalInvested > 0 ? (totalReturns / totalInvested * 100) : 0;
            
            // Calculate projections (2% per month per active share)
            const monthlyReturn = activeShares.length * totalInvested * 0.02 / (investorShares.length || 1);
            const projection3m = monthlyReturn * 3;
            const projection6m = monthlyReturn * 6;
            const projection12m = monthlyReturn * 12;
            
            // Payment status
            const currentMonth = format(new Date(), "yyyy-MM");
            let paymentStatus = "Pendente";
            if (Array.isArray(payments)) {
              const shareIds = investorShares.map((s: any) => s.id);
              const currentMonthPayments = payments.filter((p: any) => 
                shareIds.includes(p.shareId) && p.referenceMonth === currentMonth
              );
              if (currentMonthPayments.length > 0) {
                const allPaid = currentMonthPayments.every((p: any) => p.status === "paid");
                paymentStatus = allPaid ? "Pago" : "Processando";
              }
            }
            
            return [
              investorName,
              investorEmail,
              activeShares.length.toString(),
              formatCurrency(totalInvested),
              formatCurrency(totalReturns),
              `${rentabilidade.toFixed(2)}%`,
              formatCurrency(projection3m),
              formatCurrency(projection6m),
              formatCurrency(projection12m),
              paymentStatus
            ];
          });
        } else {
          data = [["Sem investidores cadastrados", "-", "-", "-", "-", "-", "-", "-", "-", "-"]];
        }
        break;
        
      case "Performance de Ativos":
        headers = [
          "Trailer ID", 
          "Modelo",
          "Status",
          "Farol",
          "Idade (meses)",
          "Valor Compra",
          "Depr. Acumulada",
          "Valor Contábil",
          "Repasses",
          "Yield %",
          "Data Compra",
          "Localização"
        ];
        
        if (trailers && Array.isArray(trailers) && trailers.length > 0) {
          data = trailers.map((trailer: any) => {
            const ageMonths = calculateAgeMonths(trailer.purchaseDate);
            const healthFlag = calculateHealthFlag(ageMonths);
            const purchaseValue = parseFloat(trailer.purchaseValue);
            const depRate = parseFloat(trailer.depreciationRate || 0);
            
            // Calcular depreciação acumulada (mensal)
            const depreciationAccumulated = Math.min(purchaseValue, purchaseValue * depRate * ageMonths);
            const bookValue = purchaseValue - depreciationAccumulated;
            
            // Calcular repasses para este trailer (através das shares)
            let totalPayouts = 0;
            if (Array.isArray(shares) && Array.isArray(payments)) {
              const trailerShares = shares.filter((s: any) => s.trailerId === trailer.id);
              trailerShares.forEach((share: any) => {
                const sharePayments = payments.filter((p: any) => p.shareId === share.id);
                totalPayouts += sharePayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
              });
            }
            
            // Calcular yield% (retorno / valor investido)
            const yieldPercent = purchaseValue > 0 ? (totalPayouts / purchaseValue * 100) : 0;
            
            return [
              trailer.trailerId,
              trailer.model || "N/A",
              trailer.status === "active" ? "Ativo" : trailer.status === "stock" ? "Estoque" : trailer.status === "maintenance" ? "Manutenção" : "Inativo",
              healthFlag,
              ageMonths.toString(),
              formatCurrency(purchaseValue),
              formatCurrency(depreciationAccumulated),
              formatCurrency(bookValue),
              formatCurrency(totalPayouts),
              `${yieldPercent.toFixed(2)}%`,
              format(new Date(trailer.purchaseDate), "dd/MM/yyyy"),
              trailer.location || "Não informado"
            ];
          });
        } else {
          data = [["Sem ativos cadastrados", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"]];
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
        headers = [
          "Documento",
          "Tipo",
          "Cota/Ativo",
          "Data Upload",
          "Compartilhado",
          "Versão",
          "Status"
        ];
        
        if (documents && Array.isArray(documents) && documents.length > 0) {
          data = documents.map((doc: any) => {
            // Identificar a cota/ativo relacionado
            let relatedAsset = "N/A";
            if (doc.shareId && Array.isArray(shares)) {
              const share = shares.find((s: any) => s.id === doc.shareId);
              if (share && Array.isArray(trailers)) {
                const trailer = trailers.find((t: any) => t.id === share.trailerId);
                relatedAsset = trailer ? trailer.trailerId : "N/A";
              }
            }
            
            return [
              doc.fileName,
              doc.documentType || "Geral",
              relatedAsset,
              format(new Date(doc.uploadedAt), "dd/MM/yyyy HH:mm"),
              doc.sharedWithManager ? "Sim" : "Não",
              "1.0", // Versão padrão
              "Válido"
            ];
          });
        } else {
          data = [["Sem documentos cadastrados", "-", "-", "-", "-", "-", "-"]];
        }
        break;
        
      case "Operacional":
        headers = [
          "Trailer ID",
          "Modelo",
          "Status",
          "Farol",
          "Idade (meses)",
          "Localização",
          "Coordenadas GPS",
          "Última Atividade",
          "Taxa Depr. (%)",
          "Disponibilidade"
        ];
        
        if (trailers && Array.isArray(trailers) && trailers.length > 0) {
          data = trailers.map((trailer: any) => {
            const ageMonths = calculateAgeMonths(trailer.purchaseDate);
            const healthFlag = calculateHealthFlag(ageMonths);
            
            // Status operacional detalhado
            let operationalStatus = "Parado";
            if (trailer.status === "active") operationalStatus = "Operacional";
            if (trailer.status === "maintenance") operationalStatus = "Manutenção";
            if (trailer.status === "stock") operationalStatus = "Estoque";
            
            // Disponibilidade (% do tempo ativo vs total)
            const disponibilidade = trailer.status === "active" ? "100%" : 
                                   trailer.status === "maintenance" ? "0%" : "N/A";
            
            return [
              trailer.trailerId,
              trailer.model || "N/A",
              operationalStatus,
              healthFlag,
              ageMonths.toString(),
              trailer.location || "Não informado",
              trailer.latitude && trailer.longitude 
                ? `${parseFloat(trailer.latitude).toFixed(4)}, ${parseFloat(trailer.longitude).toFixed(4)}`
                : "N/A",
              trailer.lastActivity 
                ? format(new Date(trailer.lastActivity), "dd/MM/yyyy")
                : "N/A",
              `${(parseFloat(trailer.depreciationRate || 0) * 100).toFixed(2)}%`,
              disponibilidade
            ];
          });
        } else {
          data = [["Sem dados operacionais", "-", "-", "-", "-", "-", "-", "-", "-", "-"]];
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
