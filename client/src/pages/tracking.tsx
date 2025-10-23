import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrackingMap } from "@/components/maps/tracking-map";
import { RefreshCw, Download } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

export default function Tracking() {
  const { t } = useTranslation();
  const { data: trackingData, isLoading } = useQuery({
    queryKey: ["/api/tracking"],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-96" />
      </div>
    );
  }

  const markers = trackingData?.map((track: any) => ({
    id: track.id,
    trailerId: track.trailerId,
    latitude: parseFloat(track.latitude),
    longitude: parseFloat(track.longitude),
    location: track.location,
    status: track.status,
  })) || [];

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('tracking.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('tracking.subtitle')}</p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Button variant="outline" className="border-2 h-11 flex-1 sm:flex-none" data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('tracking.refresh')}</span>
          </Button>
          <Button variant="outline" className="border-2 h-11 flex-1 sm:flex-none" data-testid="button-export-tracking">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('tracking.export')}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="lg:col-span-3">
          <Card className="shadow-md sm:shadow-lg overflow-hidden">
            <CardContent className="p-0 h-[400px] sm:h-[500px]">
              <TrackingMap markers={markers} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="shadow-lg border-l-4 border-l-accent">
            <CardHeader>
              <CardTitle className="text-lg font-bold">{t('tracking.recentActivity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {trackingData?.slice(0, 5).map((track: any) => (
                  <div key={track.id} className="bg-muted/30 p-3 rounded-xl hover:bg-muted/50 transition-colors" data-testid={`tracking-${track.id}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-3 h-3 ${track.status === "moving" ? "bg-green-500 animate-pulse" : "bg-yellow-500"} rounded-full shadow-lg`}></div>
                      <p className="font-bold text-foreground">{track.trailerId}</p>
                    </div>
                    <p className="text-xs text-muted-foreground ml-5">
                      {track.status === "moving" ? t('tracking.moving') : t('tracking.stopped')} • {track.location}
                    </p>
                  </div>
                ))}
                {(!trackingData || trackingData.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                    {t('tracking.noTrackingData')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg font-bold">{t('tracking.locationDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">{t('tracking.tableStatus')}</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">{t('tracking.tableLocation')}</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">{t('tracking.tableUpdate')}</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">{t('tracking.tableSpeed')}</th>
                </tr>
              </thead>
              <tbody>
                {trackingData?.map((track: any) => (
                  <tr key={track.id} className="border-b border-border hover:bg-accent/5 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-primary">{track.trailerId}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="flex items-center gap-2">
                        <div className={`w-3 h-3 ${track.status === "moving" ? "bg-green-500 animate-pulse" : "bg-yellow-500"} rounded-full shadow-lg`}></div>
                        <span className={`font-semibold ${track.status === "moving" ? "text-green-600" : "text-yellow-600"}`}>
                          {track.status === "moving" ? t('tracking.moving') : t('tracking.stopped')}
                        </span>
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium">{track.location}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {parseFloat(track.latitude).toFixed(4)}, {parseFloat(track.longitude).toFixed(4)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground font-mono">
                      {format(new Date(track.timestamp), "HH:mm:ss")}
                    </td>
                    <td className="py-4 px-6 font-bold">
                      {track.speed ? `${parseFloat(track.speed).toFixed(0)} km/h` : "—"}
                    </td>
                  </tr>
                ))}
                {(!trackingData || trackingData.length === 0) && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                      {t('tracking.noTrackingData')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
