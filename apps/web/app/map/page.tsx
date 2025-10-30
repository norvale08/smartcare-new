// apps/web/pages/map.tsx
import { GoogleMapComponent } from "@/app/components/Map";

export default function MapPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Google Maps Integration</h1>
      <GoogleMapComponent />
    </div>
  );
}