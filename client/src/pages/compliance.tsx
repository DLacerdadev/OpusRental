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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Compliance e Documentação</h3>
        <Button data-testid="button-upload-document">
          <Upload className="mr-2 h-4 w-4" />
          Upload Documento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-full">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contratos Ativos</p>
                <p className="text-xl font-bold" data-testid="text-active-contracts">
                  {documents?.filter((d: any) => d.documentType === "contract").length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Documentos Verificados</p>
                <p className="text-xl font-bold" data-testid="text-verified-docs">
                  {documents?.filter((d: any) => d.status === "verified").length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-100 p-2 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendências</p>
                <p className="text-xl font-bold" data-testid="text-pending-items">
                  {documents?.filter((d: any) => d.status === "pending").length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <History className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Logs de Auditoria</p>
                <p className="text-xl font-bold" data-testid="text-audit-logs">
                  {auditLogs?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contratos Digitais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents?.filter((d: any) => d.documentType === "contract").map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border border-border rounded-md hover:bg-muted/30"
                  data-testid={`document-${doc.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">{doc.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(doc.uploadedAt), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" data-testid={`button-view-${doc.id}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" data-testid={`button-download-${doc.id}`}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!documents || documents.filter((d: any) => d.documentType === "contract").length === 0) && (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum contrato digital disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trilha de Auditoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {auditLogs?.slice(0, 10).map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-3 p-3 bg-muted/30 rounded-md"
                  data-testid={`audit-log-${log.id}`}
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm")}
                    </p>
                    {log.ipAddress && (
                      <p className="text-xs text-muted-foreground">IP: {log.ipAddress}</p>
                    )}
                  </div>
                </div>
              ))}
              {(!auditLogs || auditLogs.length === 0) && (
                <div className="text-center text-muted-foreground py-8">
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
