import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrackingMap } from "@/components/maps/tracking-map";
import { RefreshCw, Download } from "lucide-react";
import { format } from "date-fns";

export default function Tracking() {
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
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rastreamento GPS</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitore seus ativos em tempo real</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-2" data-testid="button-refresh">
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button variant="outline" className="border-2" data-testid="button-export-tracking">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="shadow-lg overflow-hidden">
            <CardContent className="p-0 h-[500px]">
              <TrackingMap markers={markers} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="shadow-lg border-l-4 border-l-accent">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Atividade Recente</CardTitle>
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
                      {track.status === "moving" ? "Em movimento" : "Parado"} • {track.location}
                    </p>
                  </div>
                ))}
                {(!trackingData || trackingData.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                    Nenhum dado de rastreamento
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg font-bold">Detalhes de Localização</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">STATUS</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">LOCALIZAÇÃO</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">ATUALIZAÇÃO</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">VELOCIDADE</th>
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
                          {track.status === "moving" ? "Em movimento" : "Parado"}
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
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
