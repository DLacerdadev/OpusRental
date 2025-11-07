import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Send, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Calendar
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EmailLog, RentalContract } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function InvoiceAutomation() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch email logs
  const { data: emailLogs = [], isLoading: logsLoading } = useQuery<EmailLog[]>({
    queryKey: ["/api/email-logs"],
  });

  // Fetch contracts with auto-generation enabled
  const { data: contracts = [], isLoading: contractsLoading } = useQuery<RentalContract[]>({
    queryKey: ["/api/rental-contracts"],
  });

  const autoContracts = contracts.filter(c => c.autoGenerateInvoices && c.status === "active");

  // Manual invoice generation
  const handleManualGeneration = async () => {
    try {
      setIsGenerating(true);
      await apiRequest("/api/invoices/generate-monthly", "POST");
      
      toast({
        title: "Success",
        description: "Monthly invoices generated successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/email-logs"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate invoices",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Manual overdue check
  const handleOverdueCheck = async () => {
    try {
      setIsGenerating(true);
      await apiRequest("/api/invoices/check-overdue", "POST");
      
      toast({
        title: "Success",
        description: "Overdue check completed",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/email-logs"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check overdue invoices",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getEmailTypeIcon = (type: string) => {
    switch (type) {
      case "invoice":
        return <Mail className="h-4 w-4" />;
      case "payment_reminder":
        return <AlertTriangle className="h-4 w-4" />;
      case "due_reminder":
        return <Clock className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getEmailTypeLabel = (type: string) => {
    switch (type) {
      case "invoice":
        return "Invoice";
      case "payment_reminder":
        return "Payment Reminder";
      case "due_reminder":
        return "Due Reminder";
      default:
        return type;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Invoice Automation</h1>
        <p className="text-muted-foreground">
          Manage automated invoice generation and email notifications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-auto-contracts">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Auto-Generation
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-auto-count">
              {autoContracts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              contracts with auto-invoicing enabled
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-emails-sent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Emails Sent
            </CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-email-count">
              {emailLogs.filter(l => l.status === "sent").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {emailLogs.filter(l => l.status === "failed").length} failed
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-automation-status">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Automation Status
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500" data-testid="text-status">
              Active
            </div>
            <p className="text-xs text-muted-foreground">
              Cron jobs running
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Manual Actions */}
      <Card data-testid="card-manual-actions">
        <CardHeader>
          <CardTitle>Manual Actions</CardTitle>
          <CardDescription>
            Trigger automation tasks manually for testing or immediate processing
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button
            onClick={handleManualGeneration}
            disabled={isGenerating}
            data-testid="button-generate-invoices"
          >
            {isGenerating ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="mr-2 h-4 w-4" />
            )}
            Generate Monthly Invoices
          </Button>
          <Button
            onClick={handleOverdueCheck}
            disabled={isGenerating}
            variant="outline"
            data-testid="button-check-overdue"
          >
            {isGenerating ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="mr-2 h-4 w-4" />
            )}
            Check Overdue Invoices
          </Button>
        </CardContent>
      </Card>

      {/* Automation Schedule */}
      <Card data-testid="card-schedule">
        <CardHeader>
          <CardTitle>Automation Schedule</CardTitle>
          <CardDescription>
            Configured cron jobs for automated invoice processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between border-l-4 border-blue-500 pl-4 py-2">
            <div>
              <p className="font-medium">Monthly Invoice Generation</p>
              <p className="text-sm text-muted-foreground">
                Automatically create invoices for all active contracts
              </p>
            </div>
            <Badge variant="outline">1st at 00:01 UTC</Badge>
          </div>
          <div className="flex items-center justify-between border-l-4 border-yellow-500 pl-4 py-2">
            <div>
              <p className="font-medium">Overdue Invoice Check</p>
              <p className="text-sm text-muted-foreground">
                Send reminders for overdue invoices (every 7 days)
              </p>
            </div>
            <Badge variant="outline">Daily at 09:00 UTC</Badge>
          </div>
          <div className="flex items-center justify-between border-l-4 border-green-500 pl-4 py-2">
            <div>
              <p className="font-medium">Due Date Reminders</p>
              <p className="text-sm text-muted-foreground">
                Send friendly reminders 3 days before due date
              </p>
            </div>
            <Badge variant="outline">Daily at 09:00 UTC</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Email Logs */}
      <Card data-testid="card-email-logs">
        <CardHeader>
          <CardTitle>Email Activity Log</CardTitle>
          <CardDescription>
            Recent automated emails sent to clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading email logs...
            </div>
          ) : emailLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No emails sent yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailLogs.slice(0, 20).map((log) => (
                  <TableRow key={log.id} data-testid={`row-email-${log.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEmailTypeIcon(log.emailType)}
                        <span className="text-sm">
                          {getEmailTypeLabel(log.emailType)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.recipientName || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{log.recipientEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {log.subject}
                    </TableCell>
                    <TableCell>
                      {log.status === "sent" ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Sent
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="mr-1 h-3 w-3" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.sentAt ? formatDistanceToNow(new Date(log.sentAt), { addSuffix: true }) : "Unknown"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
