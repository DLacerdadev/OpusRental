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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Monitoramento GPS em Tempo Real</h3>
        <div className="flex space-x-2">
          <Button variant="outline" data-testid="button-refresh">
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button variant="outline" data-testid="button-export-tracking">
            <Download className="mr-2 h-4 w-4" />
            Exportar Dados
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0 h-96">
              <TrackingMap markers={markers} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {trackingData?.slice(0, 5).map((track: any) => (
                  <div key={track.id} className="flex items-center space-x-2" data-testid={`tracking-${track.id}`}>
                    <div className={`w-2 h-2 ${track.status === "moving" ? "bg-green-500 animate-pulse" : "bg-yellow-500"} rounded-full`}></div>
                    <div>
                      <p className="font-medium">{track.trailerId}</p>
                      <p className="text-muted-foreground text-xs">
                        {track.status === "moving" ? "Em movimento" : "Parado"} - {track.location}
                      </p>
                    </div>
                  </div>
                ))}
                {(!trackingData || trackingData.length === 0) && (
                  <div className="text-center text-muted-foreground py-4">
                    Nenhum dado de rastreamento
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes de Localização</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4">ID</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Localização Atual</th>
                  <th className="text-left py-3 px-4">Última Atualização</th>
                  <th className="text-left py-3 px-4">Velocidade</th>
                </tr>
              </thead>
              <tbody>
                {trackingData?.map((track: any) => (
                  <tr key={track.id} className="border-b border-border hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium">{track.trailerId}</td>
                    <td className="py-3 px-4">
                      <span className="flex items-center space-x-1">
                        <div className={`w-2 h-2 ${track.status === "moving" ? "bg-green-500 animate-pulse" : "bg-yellow-500"} rounded-full`}></div>
                        <span className={track.status === "moving" ? "text-green-600" : "text-yellow-600"}>
                          {track.status === "moving" ? "Em movimento" : "Parado"}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {track.location}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {parseFloat(track.latitude).toFixed(4)}, {parseFloat(track.longitude).toFixed(4)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {format(new Date(track.timestamp), "HH:mm:ss")}
                    </td>
                    <td className="py-3 px-4">
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
