import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Truck,
  TrendingUp,
  Receipt,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Mail,
  Shield,
  MessageSquare,
  CreditCard,
  Database,
  Calendar,
  PlayCircle,
  AlertTriangle,
  Send,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SystemStatus {
  timestamp: string;
  currentMonth: string;
  assets: {
    activeTrailers: number;
    activeShares: number;
    totalInvestors: number;
  };
  financial: {
    openInvoices: number;
    paidThisMonth: number;
    currentMonth: string;
  };
  scheduler: {
    isRunning: boolean;
    lastPaymentRun: string | null;
    lastOverdueCheck: string | null;
    lastMaintenanceCheck: string | null;
    lastGeofenceCheck: string | null;
  };
  integrations: {
    stripe: boolean;
    smtp: boolean;
    whatsapp: boolean;
    sessionStore: string;
  };
}

interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  emailType: string;
  status: string;
  sentAt: string | null;
  errorMessage: string | null;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  timestamp: string;
  details: any;
}

interface WhatsappLog {
  id: string;
  event: string;
  recipientPhone: string;
  recipientName: string | null;
  status: string;
  provider: string;
  messageId: string | null;
  retries: number;
  error: string | null;
  createdAt: string;
}

function IntegrationBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm font-medium">{label}</span>
      {active ? (
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Configured
        </Badge>
      ) : (
        <Badge variant="outline" className="text-amber-600 border-amber-300">
          <XCircle className="h-3 w-3 mr-1" />
          Not configured
        </Badge>
      )}
    </div>
  );
}

function LastRunText({ ts }: { ts: string | null }) {
  if (!ts) return <span className="text-xs text-muted-foreground">Never ran this session</span>;
  return (
    <span className="text-xs text-muted-foreground">
      {formatDistanceToNow(new Date(ts), { addSuffix: true })}
    </span>
  );
}

export default function AdminDebug() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testEvent, setTestEvent] = useState("invoice_overdue");
  const [isSendingTest, setIsSendingTest] = useState(false);

  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery<SystemStatus>({
    queryKey: ["/api/system/status"],
    refetchInterval: 30000,
  });

  const { data: emailLogs = [], isLoading: emailLoading } = useQuery<EmailLog[]>({
    queryKey: ["/api/email-logs"],
  });

  const { data: auditLogs = [], isLoading: auditLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const { data: whatsappLogs = [], isLoading: whatsappLoading, refetch: refetchWhatsapp } = useQuery<WhatsappLog[]>({
    queryKey: ["/api/whatsapp/logs"],
  });

  const handleSendWhatsappTest = async () => {
    if (!testPhone) {
      toast({ title: "Erro", description: "Informe um número de telefone", variant: "destructive" });
      return;
    }
    try {
      setIsSendingTest(true);
      const result = await apiRequest("POST", "/api/whatsapp/test", { phone: testPhone, event: testEvent });
      const data = await result.json();
      if (data.status === "sent") {
        toast({ title: "Mensagem enviada", description: `Provider: ${data.provider} | ID: ${data.messageId}` });
      } else {
        toast({ title: "Falha no envio", description: data.error || "Erro desconhecido", variant: "destructive" });
      }
      refetchWhatsapp();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Falha ao enviar teste", variant: "destructive" });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleGeneratePayments = async () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    try {
      setIsGenerating(true);
      await apiRequest("POST", `/api/financial/generate/${currentMonth}`);
      toast({
        title: "Pagamentos gerados",
        description: `Pagamentos de ${currentMonth} processados com sucesso.`,
      });
      refetchStatus();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao gerar pagamentos",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const StatusCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
    testId,
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle?: string;
    testId: string;
  }) => (
    <Card className={`border-l-4 ${color} shadow-md`} data-testid={`card-${testId}`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-muted p-2.5 rounded-xl">
            <Icon className="h-5 w-5 text-foreground" />
          </div>
        </div>
        <p className="text-sm font-semibold text-muted-foreground mb-1">{title}</p>
        {statusLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-2xl font-bold text-foreground" data-testid={`value-${testId}`}>
            {value}
          </p>
        )}
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel de Debug</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Status operacional em tempo real de todos os módulos do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchStatus()}
            data-testid="button-refresh-status"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            size="sm"
            onClick={handleGeneratePayments}
            disabled={isGenerating}
            data-testid="button-generate-payments"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4 mr-2" />
            )}
            Gerar Pagamentos
          </Button>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatusCard
          title="Trailers Ativos"
          value={status?.assets.activeTrailers ?? "—"}
          icon={Truck}
          color="border-l-blue-500"
          subtitle="status: active"
          testId="active-trailers"
        />
        <StatusCard
          title="Cotas Ativas"
          value={status?.assets.activeShares ?? "—"}
          icon={TrendingUp}
          color="border-l-green-500"
          subtitle="investidores"
          testId="active-shares"
        />
        <StatusCard
          title="Investidores"
          value={status?.assets.totalInvestors ?? "—"}
          icon={Users}
          color="border-l-purple-500"
          subtitle="usuários role=investor"
          testId="total-investors"
        />
        <StatusCard
          title="Invoices Abertas"
          value={status?.financial.openInvoices ?? "—"}
          icon={Receipt}
          color="border-l-amber-500"
          subtitle="pending + overdue"
          testId="open-invoices"
        />
        <StatusCard
          title="Pago no Mês"
          value={
            status
              ? `$${status.financial.paidThisMonth.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : "—"
          }
          icon={DollarSign}
          color="border-l-emerald-500"
          subtitle={status?.currentMonth}
          testId="paid-this-month"
        />
      </div>

      {/* Scheduler + Integrations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scheduler State */}
        <Card className="shadow-md" data-testid="card-scheduler">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scheduler
            </CardTitle>
            <CardDescription>Estado dos cron jobs em execução</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status geral</span>
              {statusLoading ? (
                <Skeleton className="h-5 w-20" />
              ) : status?.scheduler.isRunning ? (
                <Badge className="bg-green-500 text-white" data-testid="badge-scheduler-status">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ativo
                </Badge>
              ) : (
                <Badge variant="destructive" data-testid="badge-scheduler-status">
                  <XCircle className="h-3 w-3 mr-1" />
                  Inativo
                </Badge>
              )}
            </div>
            <div className="space-y-2 text-sm border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Último pagamento</span>
                <LastRunText ts={status?.scheduler.lastPaymentRun ?? null} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Último overdue check</span>
                <LastRunText ts={status?.scheduler.lastOverdueCheck ?? null} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Última manutenção</span>
                <LastRunText ts={status?.scheduler.lastMaintenanceCheck ?? null} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Último geofencing</span>
                <LastRunText ts={status?.scheduler.lastGeofenceCheck ?? null} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card className="shadow-md" data-testid="card-integrations">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Integrações
            </CardTitle>
            <CardDescription>Estado das integrações externas e serviços</CardDescription>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                <IntegrationBadge active={status?.integrations.stripe ?? false} label="Stripe (pagamentos online)" />
                <IntegrationBadge active={status?.integrations.smtp ?? false} label="SMTP (envio de emails)" />
                <IntegrationBadge active={status?.integrations.whatsapp ?? false} label="WhatsApp (notificações)" />
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">Session Store</span>
                  <Badge className="bg-blue-500 text-white">
                    <Database className="h-3 w-3 mr-1" />
                    {status?.integrations.sessionStore ?? "postgresql"}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manual Actions */}
      <Card className="shadow-md" data-testid="card-manual-actions">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            Ações Manuais
          </CardTitle>
          <CardDescription>Disparar operações do sistema manualmente para testes ou reprocessamento</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            onClick={handleGeneratePayments}
            disabled={isGenerating}
            data-testid="button-generate-payments-2"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <DollarSign className="h-4 w-4 mr-2" />
            )}
            Gerar Pagamentos do Mês
          </Button>
        </CardContent>
      </Card>

      {/* Email Logs */}
      <Card className="shadow-md" data-testid="card-email-logs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Log de Emails
            <Badge variant="outline" className="ml-auto">
              {emailLogs.length} registros
            </Badge>
          </CardTitle>
          <CardDescription>Últimas notificações por email enviadas pelo sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {emailLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : emailLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum email registrado ainda
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enviado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailLogs.slice(0, 15).map((log) => (
                    <TableRow key={log.id} data-testid={`row-email-${log.id}`}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.emailType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          <p className="font-medium">{log.recipientName || "—"}</p>
                          <p className="text-xs text-muted-foreground">{log.recipientEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">{log.subject}</TableCell>
                      <TableCell>
                        {log.status === "sent" ? (
                          <Badge className="bg-green-500 text-white text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Enviado
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            <XCircle className="h-3 w-3 mr-1" />
                            Falhou
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.sentAt
                          ? formatDistanceToNow(new Date(log.sentAt), { addSuffix: true })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* WhatsApp Logs */}
      <Card className="shadow-md" data-testid="card-whatsapp-logs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-green-600" />
            WhatsApp
            <Badge variant="outline" className="ml-auto">
              {whatsappLogs.length} registros
            </Badge>
          </CardTitle>
          <CardDescription>Notificações WhatsApp enviadas pelo sistema (Twilio / Meta / Mock)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Form */}
          <div className="flex flex-wrap gap-2 items-end border rounded-lg p-3 bg-muted/30">
            <div className="flex-1 min-w-[160px]">
              <label className="text-xs text-muted-foreground mb-1 block">Telefone (+55...)</label>
              <Input
                placeholder="+5511999999999"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                data-testid="input-whatsapp-phone"
              />
            </div>
            <div className="min-w-[180px]">
              <label className="text-xs text-muted-foreground mb-1 block">Evento</label>
              <Select value={testEvent} onValueChange={setTestEvent}>
                <SelectTrigger data-testid="select-whatsapp-event">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment_generated">Pagamento gerado</SelectItem>
                  <SelectItem value="invoice_issued">Invoice emitida</SelectItem>
                  <SelectItem value="invoice_overdue">Invoice vencida</SelectItem>
                  <SelectItem value="maintenance_due">Manutenção devida</SelectItem>
                  <SelectItem value="geofence_alert">Alerta geofencing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              onClick={handleSendWhatsappTest}
              disabled={isSendingTest}
              data-testid="button-whatsapp-test"
            >
              {isSendingTest ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar Teste
            </Button>
          </div>

          {/* Log Table */}
          {whatsappLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : whatsappLogs.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Nenhuma mensagem WhatsApp registrada ainda
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quando</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {whatsappLogs.slice(0, 15).map((log) => (
                    <TableRow key={log.id} data-testid={`row-whatsapp-${log.id}`}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.event}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          <p className="font-medium">{log.recipientName || "—"}</p>
                          <p className="text-xs text-muted-foreground font-mono">{log.recipientPhone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {log.provider}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.status === "sent" ? (
                          <Badge className="bg-green-500 text-white text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Enviado
                          </Badge>
                        ) : log.status === "retrying" ? (
                          <Badge className="bg-yellow-500 text-white text-xs">
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Repetindo
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            <XCircle className="h-3 w-3 mr-1" />
                            Falhou
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.createdAt
                          ? formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card className="shadow-md" data-testid="card-audit-logs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Log de Auditoria
            <Badge variant="outline" className="ml-auto">
              {auditLogs.length} registros
            </Badge>
          </CardTitle>
          <CardDescription>Ações recentes de usuários e eventos do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {auditLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum log de auditoria
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Quando</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.slice(0, 15).map((log) => (
                    <TableRow key={log.id} data-testid={`row-audit-${log.id}`}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.entityType || "—"}
                        {log.entityId ? ` / ${log.entityId.substring(0, 8)}…` : ""}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {log.ipAddress || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.timestamp
                          ? format(new Date(log.timestamp), "dd/MM • HH:mm")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
