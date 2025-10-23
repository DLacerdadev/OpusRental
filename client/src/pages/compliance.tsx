import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, Shield, Clock, History, Upload, Eye, Download } from "lucide-react";
import { format } from "date-fns";

export default function Compliance() {
  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ["/api/documents"],
  });

  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/audit-logs"],
  });

  if (docsLoading || logsLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Compliance</h1>
          <p className="text-sm text-muted-foreground mt-1">Documentação e auditoria completa</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 shadow-lg h-11 w-full sm:w-auto" data-testid="button-upload-document">
          <Upload className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Upload Documento</span>
          <span className="sm:hidden">Upload</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-all active:opacity-90">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-2xl">
                <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">CONTRATOS ATIVOS</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-active-contracts">
              {documents?.filter((d: any) => d.documentType === "contract").length || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent shadow-md hover:shadow-lg transition-all active:opacity-90">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-accent/10 p-3 rounded-2xl">
                <Shield className="h-6 w-6 text-accent" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">VERIFICADOS</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-verified-docs">
              {documents?.filter((d: any) => d.status === "verified").length || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 shadow-md hover:shadow-lg transition-all active:opacity-90">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-2xl">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">PENDÊNCIAS</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-pending-items">
              {documents?.filter((d: any) => d.status === "pending").length || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-all active:opacity-90">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-2xl">
                <History className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">LOGS AUDITORIA</p>
            <p className="text-2xl font-bold text-foreground" data-testid="text-audit-logs">
              {auditLogs?.length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg font-bold">Contratos Digitais</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {documents?.filter((d: any) => d.documentType === "contract").map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border-2 border-border rounded-xl hover:border-accent hover:bg-accent/5 transition-all"
                  data-testid={`document-${doc.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded-xl">
                      <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{doc.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(doc.uploadedAt), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="hover:bg-accent/20 hover:text-accent" data-testid={`button-view-${doc.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:bg-accent/20 hover:text-accent" data-testid={`button-download-${doc.id}`}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!documents || documents.filter((d: any) => d.documentType === "contract").length === 0) && (
                <div className="text-center text-muted-foreground py-12">
                  Nenhum contrato digital disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-purple-500">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-lg font-bold">Trilha de Auditoria</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {auditLogs?.slice(0, 10).map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                  data-testid={`audit-log-${log.id}`}
                >
                  <div className="w-3 h-3 bg-accent rounded-full mt-1 shadow-lg"></div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{log.action}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(log.timestamp), "dd/MM/yyyy • HH:mm")}
                    </p>
                    {log.ipAddress && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono">IP: {log.ipAddress}</p>
                    )}
                  </div>
                </div>
              ))}
              {(!auditLogs || auditLogs.length === 0) && (
                <div className="text-center text-muted-foreground py-12">
                  Nenhum log de auditoria disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
