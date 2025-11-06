import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Truck, Package, Clock, CheckCircle, Plus, MapPin, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

type BrokerDispatch = {
  id: string;
  dispatchNumber: string;
  trailerId: string;
  brokerName: string;
  brokerContact: string;
  pickupLocation: string;
  pickupDate: string;
  deliveryLocation: string;
  deliveryDate: string;
  loadType: string;
  weight: string;
  status: "pending" | "dispatched" | "in_transit" | "delivered" | "cancelled";
  documentUrl: string | null;
  notes: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function BrokerPage() {
  const { t } = useTranslation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<BrokerDispatch | null>(null);

  const { data: dispatches, isLoading } = useQuery<BrokerDispatch[]>({
    queryKey: ["/api/broker-dispatches"],
  });

  const stats = {
    total: dispatches?.length || 0,
    pending: dispatches?.filter((d) => d.status === "pending").length || 0,
    inTransit: dispatches?.filter((d) => d.status === "in_transit").length || 0,
    delivered: dispatches?.filter((d) => d.status === "delivered").length || 0,
  };

  const getStatusBadge = (status: BrokerDispatch["status"]) => {
    const variants: Record<BrokerDispatch["status"], { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "secondary", label: t("broker.status.pending") },
      dispatched: { variant: "default", label: t("broker.status.dispatched") },
      in_transit: { variant: "default", label: t("broker.status.inTransit") },
      delivered: { variant: "outline", label: t("broker.status.delivered") },
      cancelled: { variant: "destructive", label: t("broker.status.cancelled") },
    };
    const config = variants[status];
    return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
              {t("broker.title")}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1" data-testid="text-page-subtitle">
              {t("broker.subtitle")}
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)} 
            className="w-full sm:w-auto"
            data-testid="button-create-dispatch"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("broker.createDispatch")}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card data-testid="card-stat-total">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("broker.stats.totalDispatches")}
              </CardTitle>
              <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-stat-total">
                {stats.total}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("broker.stats.allTime")}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-pending">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("broker.stats.pending")}
              </CardTitle>
              <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400" data-testid="text-stat-pending">
                {stats.pending}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("broker.stats.awaitingDispatch")}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-in-transit">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("broker.stats.inTransit")}
              </CardTitle>
              <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-stat-in-transit">
                {stats.inTransit}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("broker.stats.onTheRoad")}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-delivered">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t("broker.stats.delivered")}
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-stat-delivered">
                {stats.delivered}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("broker.stats.completed")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card data-testid="card-dispatches-table">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("broker.table.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400" data-testid="text-loading">
                {t("common.loading")}
              </div>
            ) : dispatches && dispatches.length > 0 ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">{t("broker.table.dispatchNumber")}</TableHead>
                      <TableHead className="min-w-[100px]">{t("broker.table.trailer")}</TableHead>
                      <TableHead className="min-w-[150px]">{t("broker.table.broker")}</TableHead>
                      <TableHead className="min-w-[150px]">{t("broker.table.pickup")}</TableHead>
                      <TableHead className="min-w-[150px]">{t("broker.table.delivery")}</TableHead>
                      <TableHead className="min-w-[120px]">{t("broker.table.loadType")}</TableHead>
                      <TableHead className="min-w-[100px]">{t("broker.table.status")}</TableHead>
                      <TableHead className="min-w-[100px]">{t("broker.table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dispatches.map((dispatch) => (
                      <TableRow key={dispatch.id} data-testid={`row-dispatch-${dispatch.id}`}>
                        <TableCell className="font-medium" data-testid={`text-dispatch-number-${dispatch.id}`}>
                          {dispatch.dispatchNumber}
                        </TableCell>
                        <TableCell data-testid={`text-trailer-${dispatch.id}`}>
                          {dispatch.trailerId}
                        </TableCell>
                        <TableCell data-testid={`text-broker-${dispatch.id}`}>
                          <div>
                            <div className="font-medium">{dispatch.brokerName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {dispatch.brokerContact}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-pickup-${dispatch.id}`}>
                          <div className="flex items-start gap-1">
                            <MapPin className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" />
                            <div>
                              <div className="text-sm">{dispatch.pickupLocation}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(dispatch.pickupDate), "MMM dd, yyyy")}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-delivery-${dispatch.id}`}>
                          <div className="flex items-start gap-1">
                            <MapPin className="w-3 h-3 mt-0.5 text-gray-400 flex-shrink-0" />
                            <div>
                              <div className="text-sm">{dispatch.deliveryLocation}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(dispatch.deliveryDate), "MMM dd, yyyy")}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-load-type-${dispatch.id}`}>
                          <Badge variant="outline">{dispatch.loadType}</Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(dispatch.status)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDispatch(dispatch)}
                            data-testid={`button-edit-${dispatch.id}`}
                          >
                            {t("common.edit")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400" data-testid="text-empty-state">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-1">{t("broker.emptyState.title")}</p>
                <p className="text-sm">{t("broker.emptyState.description")}</p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)} 
                  className="mt-4"
                  data-testid="button-create-first-dispatch"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("broker.createDispatch")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
