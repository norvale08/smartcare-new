'use client'; 

import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';

export function GoogleMapComponent() {
  const position = { lat: -1.286389, lng: 36.817223 }; 

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <div style={{ height: '500px', width: '100%' }}>
        <Map
          defaultCenter={position}
          defaultZoom={12}
          gestureHandling="greedy"
        >
          <Marker position={position} />
        </Map>
      </div>
    </APIProvider>
  );
}