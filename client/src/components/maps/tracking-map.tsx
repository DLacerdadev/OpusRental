import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface TrackingMapProps {
  markers: Array<{
    id: string;
    trailerId: string;
    latitude: number;
    longitude: number;
    location?: string;
    status?: string;
  }>;
}

function MapUpdater({ markers }: { markers: any[] }) {
  const map = useMap();
  
  useEffect(() => {
    // Fix for Leaflet size calculation
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(
        markers.map(m => [parseFloat(m.latitude as any), parseFloat(m.longitude as any)])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, map]);
  
  return null;
}

export function TrackingMap({ markers }: TrackingMapProps) {
  const defaultCenter: [number, number] = [-23.5505, -46.6333]; // São Paulo

  return (
    <MapContainer
      center={defaultCenter}
      zoom={5}
      style={{ height: "100%", width: "100%", minHeight: "400px" }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater markers={markers} />
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[parseFloat(marker.latitude as any), parseFloat(marker.longitude as any)]}
        >
          <Popup>
            <div>
              <strong>{marker.trailerId}</strong>
              <br />
              {marker.location}
              <br />
              Status: {marker.status}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
